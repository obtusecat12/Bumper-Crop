#!/usr/bin/env python3
"""Deterministic linear optical textures. Requires numpy, scipy, Pillow.
Normal convention: OpenGL tangent normal (+Y in the second UV axis).
No authored patterns, directional sinusoid overlays, or baked colors.
"""
from pathlib import Path
import json, math, argparse
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
TAU = 2*np.pi
SOURCE = 'https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics'

def frequencies(n):
    ky,kx=np.meshgrid(np.fft.fftfreq(n)*n,np.fft.fftfreq(n)*n,indexing='ij')
    return kx,ky,np.hypot(kx,ky)

def spectrum(n,seed,low,high,exponent):
    rng=np.random.default_rng(seed)
    white=np.fft.fft2(rng.standard_normal((n,n)))
    kx,ky,k=frequencies(n)
    # Radial Butterworth-like roll-on + Gaussian high-frequency taper.
    radial=(k*k+low*low)**(-exponent/2) * (1-np.exp(-(k/low)**4)) * np.exp(-(k/high)**4)
    radial[0,0]=0
    return white*radial

def normalmap(seed,low,high,rms,name):
    n=256
    s=spectrum(n,seed,low,high,2.1)
    kx,ky,k=frequencies(n)
    dx=np.fft.ifft2(s*(1j*TAU*kx)).real
    dy=np.fft.ifft2(s*(1j*TAU*ky)).real
    factor=rms/np.sqrt(np.mean(dx*dx+dy*dy))
    dx*=factor;dy*=factor
    # PNG rows point down; tangent +V points up with WebGL flipY=true.
    norm=np.stack((-dx,dy,np.ones_like(dx)),axis=-1)
    norm/=np.linalg.norm(norm,axis=-1,keepdims=True)
    rgb=np.round((norm*.5+.5)*255).astype(np.uint8)
    Image.fromarray(rgb).save(OUT/name)
    edge=np.concatenate((np.abs(rgb[0].astype(float)-rgb[-1]),np.abs(rgb[:,0].astype(float)-rgb[:,-1])))
    stats={'seed':seed,'size':[n,n],'low_frequency_cycles_per_tile':low,'high_frequency_taper_cycles_per_tile':high,'slope_rms':rms,'mean_encoded_rgb':rgb.mean(axis=(0,1)).tolist(),'unit_length_error_after_8bit_decode_max':float(np.max(np.abs(np.linalg.norm(rgb/255*2-1,axis=-1)-1))),'edge_delta_mean':float(edge.mean())}
    return rgb,stats

class CausticSurface:
    def __init__(self,n=384):
        self.n=n
        self.kx,self.ky,self.k=frequencies(n)
        # Two independent static isotropic fields, transformed by closed
        # circular translation paths. Entire geometry returns at t=1.
        self.s0=spectrum(n,28103,3.0,11.0,2.6)
        self.s1=spectrum(n,28107,4.0,15.0,2.6)
        # Fixed normalization preserves optical exposure/scale over time.
        gx,gy=self.gradient(0,scale=False)
        self.scale=.30/np.sqrt(np.mean(gx*gx+gy*gy))
    def spec(self,t):
        a=TAU*t
        # Circular paths are cyclic but do not impose a directional wave band.
        u0=.022*np.cos(a);v0=.022*np.sin(a)
        u1=.018*np.cos(a+1.4);v1=-.018*np.sin(a+1.4)
        phase0=np.exp(1j*TAU*(self.kx*u0+self.ky*v0))
        phase1=np.exp(1j*TAU*(self.kx*u1+self.ky*v1))
        return self.s0*phase0+.58*self.s1*phase1
    def gradient(self,t,scale=True):
        s=self.spec(t)
        factor=self.scale if scale else 1
        return (np.fft.ifft2(s*(1j*TAU*self.kx)).real*factor,
                np.fft.ifft2(s*(1j*TAU*self.ky)).real*factor)
    def height(self,t):
        return np.fft.ifft2(self.spec(t)).real*self.scale

def photon_frame(surface,t,photon_n=1536,output_n=512,depth=.30):
    # Stratified deterministic rays have exactly constant incident flux.
    ax=(np.arange(photon_n,dtype=np.float32)+.5)/photon_n
    y,x=np.meshgrid(ax,ax,indexing='ij')
    coords=np.stack((y*surface.n,x*surface.n))
    gx,gy=surface.gradient(t)
    gx=map_coordinates(gx,coords,order=3,mode='grid-wrap',prefilter=True).astype(np.float32)
    gy=map_coordinates(gy,coords,order=3,mode='grid-wrap',prefilter=True).astype(np.float32)
    h=map_coordinates(surface.height(t),coords,order=3,mode='grid-wrap',prefilter=True).astype(np.float32)
    inv=1/np.sqrt(1+gx*gx+gy*gy)
    nx=-gx*inv;ny=-gy*inv;nz=inv
    # Snell vector: T=eta I +(eta cos(theta)-sqrt(1-eta²(1-cos²(theta)))) N.
    eta=1/1.333
    c=eta*nz-np.sqrt(1-eta*eta*(1-nz*nz))
    tx=c*nx;ty=c*ny;tz=-eta+c*nz
    distance=(depth+h)/(-tz)
    px=np.mod(x+distance*tx,1)*output_n-.5
    py=np.mod(y+distance*ty,1)*output_n-.5
    ix=np.floor(px).astype(np.int32);iy=np.floor(py).astype(np.int32)
    fx=px-ix;fy=py-iy
    irradiance=np.zeros(output_n*output_n,dtype=np.float64)
    for ox,oy,w in ((0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)):
        index=((iy+oy)%output_n)*output_n+(ix+ox)%output_n
        irradiance+=np.bincount(index.ravel(),weights=w.ravel(),minlength=output_n*output_n)
    irradiance=irradiance.reshape(output_n,output_n)/(photon_n/output_n)**2
    # Pixel reconstruction footprint; periodic at the boundary.
    irradiance=gaussian_filter(irradiance,sigma=.60,mode='wrap')
    return irradiance

def encode_caustic(energy,exposure):
    # Remove broad un-focused illumination. Retain concentrated photon flux.
    # Same exposure for all frames, avoiding intensity pumping.
    focused=np.maximum(energy-.85,0)
    intensity=1-np.exp(-focused/exposure)
    intensity=np.clip(intensity,0,1)
    # Supersampled reconstruction produces continuous subpixel filaments.
    # Periodic padding prevents the resampling filter from introducing seams.
    tiled=np.tile(intensity.astype(np.float32),(3,3))
    im=Image.fromarray(tiled).resize((768,768),Image.Resampling.LANCZOS)
    filtered=np.asarray(im)[256:512,256:512]
    return np.round(np.clip(filtered,0,1)*255).astype(np.uint8)

def preview(normals,frames):
    W,H=1160,1170
    im=Image.new('RGB',(W,H),(17,25,34));d=ImageDraw.Draw(im)
    d.text((24,18),'V28 — NUMERICAL WATER TEXTURES',fill=(229,240,243))
    d.text((24,43),'Two independent periodic normal fields / refracted-photon caustics / linear data',fill=(141,168,181))
    for i,a in enumerate(normals):
        tile=Image.fromarray(a).resize((256,256),Image.Resampling.NEAREST)
        im.paste(tile,(24+i*282,90));d.text((24+i*282,69),f'Normal {i+1} · 256 × 256',fill=(213,228,235))
    big=np.tile(frames[0],(2,2))
    im.paste(Image.fromarray(big).convert('RGB'),(620,78))
    d.text((620,597),'Frame 00, 2 × 2 spatial tiling (seam inspection)',fill=(184,207,217))
    d.text((24,379),'2 × 2 normal tiling',fill=(184,207,217))
    small=np.tile(normals[0],(2,2,1))
    im.paste(Image.fromarray(small).resize((360,360),Image.Resampling.LANCZOS),(24,402))
    for f,a in enumerate(frames):
        x=400+(f%4)*180;y=650+(f//4)*126
        im.paste(Image.fromarray(a).convert('RGB').resize((112,112),Image.Resampling.LANCZOS),(x,y))
        d.text((x+120,y+8),f'{f:02d}',fill=(153,184,198))
    d.text((24,806),'Caustic frames',fill=(220,231,237))
    d.text((24,828),'16 frames · 4 × 4 atlas',fill=(158,182,194))
    d.text((24,851),'Frame 15 → 00 interpolates cyclically',fill=(158,182,194))
    d.text((24,894),'No Voronoi outlines / no directional bands',fill=(158,182,194))
    d.text((24,918),'Exact Snell refraction + periodic photon splats',fill=(158,182,194))
    im.save(OUT/'water-data-contactsheet.png')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--quick',action='store_true');args=ap.parse_args()
    a,sa=normalmap(28101,3.0,39,.255,'water-normal-a.png')
    b,sb=normalmap(28102,4.4,48,.215,'water-normal-b.png')
    surf=CausticSurface()
    energies=[]
    count=1 if args.quick else 16
    for i in range(count):
        print(f'Photon frame {i:02d}/{count}',flush=True)
        energies.append(photon_frame(surf,i/16,photon_n=1024 if args.quick else 1536))
    exposure=2.5
    frames=[encode_caustic(e,exposure) for e in energies]
    if args.quick:
        Image.fromarray(frames[0]).save(OUT/'caustic-quick.png')
        return
    atlas=np.zeros((1024,1024),dtype=np.uint8)
    frames_dir=OUT/'caustic-frames';frames_dir.mkdir(exist_ok=True)
    for i,a0 in enumerate(frames):
        Image.fromarray(a0).save(frames_dir/f'caustic-{i:02d}.png')
        y=(i//4)*256;x=(i%4)*256
        atlas[y:y+256,x:x+256]=a0
    # RGB identical channels eases compatibility with WebGL texture loaders.
    Image.fromarray(np.repeat(atlas[...,None],3,axis=2)).save(OUT/'water-caustics-atlas.png')
    preview([a,b],frames)
    Image.fromarray(frames[0]).save(OUT/'water-caustics-loop.webp',save_all=True,append_images=[Image.fromarray(x) for x in frames[1:]],duration=125,loop=0,lossless=True)
    # Tangent verification includes normal unit lengths and wrapped-edge deltas.
    pairs=[]
    for i in range(16):
        pairs.append(float(np.mean(np.abs(frames[(i+1)%16].astype(float)-frames[i].astype(float))))/255)
    gx0,gy0=surf.gradient(0);gx1,gy1=surf.gradient(1)
    md={
      'normal_a':sa,'normal_b':sb,
      'normal_cross_correlation':float(np.corrcoef((a[...,:2].astype(float)-128).ravel(),(b[...,:2].astype(float)-128).ravel())[0,1]),
      'caustics':{'atlas_size':[1024,1024],'grid':[4,4],'frame_size':[256,256],'frames':16,'order':'row-major from top-left in PNG; frame index f has col=f%4,row=f//4','loop_period_suggested_seconds':2.0,'photon_grid_per_frame':[1536,1536],'photon_count_per_frame':1536**2,'internal_raster':[512,512],'surface_slope_rms_at_t0':.30,'depth_tile_units':.30,'water_ior':1.333,'exposure_constant':exposure,'irradiance_baseline_subtraction':.85,'linear_channel_range':[0,1],'frame_mean': [float(f.mean()/255) for f in frames],'consecutive_frame_mae_including_wrap':pairs,'wrap_mae':pairs[-1],'surface_loop_gradient_max_error':float(max(np.max(np.abs(gx1-gx0)),np.max(np.abs(gy1-gy0))))},
      'texture_color_space':'NoColorSpace/linear; disable sRGB decoding for all textures',
      'normal_sampling':'RepeatWrapping both axes; mipmaps permitted; encode RGB=0.5*(normalized(-dh/dpixelX,+dh/dpixelY,1)+1), because PNG rows point down. OpenGL positive tangent Y with flipY=true. If using flipY=false, invert green. No PNG ICC/sRGB/gAMA tags.',
      'caustic_sampling':'Do not use global atlas repeat for in-frame boundaries. Manually fract tile UV and wrap bilinear samples inside the chosen 256px tile; interpolate adjacent frames including 15->0; disable mipmaps on atlas to avoid frame bleeding. Standard texel-center inset sampling is a simpler near-seam approximation.',
      'primary_reference':SOURCE,
      'algorithm':'Periodic radially weighted Gaussian Fourier height fields; exact vector Snell refraction of 1536² vertical photons per frame; floor intersection; periodic bilinear energy accumulation; global contrast mapping. No Voronoi or line drawing.',
    }
    (OUT/'water-data-metadata.json').write_text(json.dumps(md,indent=2)+'\n')
    print(json.dumps(md,indent=2))

if __name__=='__main__':main()
