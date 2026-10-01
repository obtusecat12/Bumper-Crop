"""Numerical texture packaging: generated albedo + inferred PBR detail maps.

No artwork generation or albedo retouching. Only resize/format conversion of
image_gen originals; scalar maps are estimates derived from their luminance.
Normals use the OpenGL tangent-space convention expected by Three.js.
"""
from pathlib import Path
import json
import hashlib
from io import BytesIO
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'runtime'
OUT.mkdir(exist_ok=True)
ASSETS = {
    'ivory-square-tiles': {'size': 512, 'normal_slope': .48, 'roughness': .30},
    'limestone': {'size': 1024, 'normal_slope': 1.05, 'roughness': .88},
    'golden-sun-art': {'size': 512, 'normal_slope': .78, 'roughness': .57},
    'white-terrycloth': {'size': 512, 'normal_slope': .43, 'roughness': .96},
    'ivory-lounger-vinyl': {'size': 512, 'normal_slope': .17, 'roughness': .57},
    'rubber-mat': {'size': 512, 'normal_slope': .72, 'roughness': .86},
    'monstera-leaf': {'size': 512, 'normal_slope': .15, 'roughness': .44},
    'glass-block': {'size': 512, 'normal_slope': .48, 'roughness': .18},
}

def robust(a, lo=2, hi=98):
    a0, a1 = np.percentile(a, (lo, hi))
    return np.clip((a-a0)/max(float(a1-a0), 1e-5), 0, 1)

def blur(a, sigma, mode='wrap'):
    return gaussian_filter(a, sigma, mode=mode)

def save_webp(im, path, **options):
    buffer = BytesIO()
    im.save(buffer, format='WEBP', method=6, **options)
    encoded = buffer.getvalue()
    if not encoded:
        raise RuntimeError('Empty WebP encoder output: '+str(path))
    Image.open(BytesIO(encoded)).load()
    temp = path.with_suffix('.tmp.webp')
    temp.write_bytes(encoded)
    temp.replace(path)

def save_scalar(data, path):
    save_webp(Image.fromarray(np.round(np.clip(data, 0, 1)*255).astype('uint8'), 'L'), path, lossless=True)

def save_normal(h, slope, path, alpha=None, mode='wrap'):
    h = blur(h, .55, mode)
    dx = (np.roll(h, -1, axis=1)-np.roll(h, 1, axis=1))*.5
    dy = (np.roll(h, -1, axis=0)-np.roll(h, 1, axis=0))*.5
    valid = alpha > .98 if alpha is not None else np.ones(h.shape, dtype=bool)
    mag = np.sqrt(dx*dx+dy*dy)
    scale = slope / max(float(np.percentile(mag[valid], 95)), 1e-4)
    # Positive image-y slope maps to positive tangent-y (OpenGL).
    n = np.stack((-dx*scale, dy*scale, np.ones_like(h)), axis=-1)
    if alpha is not None:
        n[alpha < .98] = (0, 0, 1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    pixels = np.round((n*.5+.5)*255).astype('uint8')
    save_webp(Image.fromarray(pixels, 'RGB'), path, lossless=True)
    return float(np.percentile(np.linalg.norm(n[:,:,:2], axis=-1)[valid],95))

records = []
for name, cfg in ASSETS.items():
    src = ROOT / (name+'.png')
    original = Image.open(src)
    im = original.resize((cfg['size'], cfg['size']), Image.Resampling.LANCZOS)
    alpha = np.asarray(im.getchannel('A'), dtype=np.float32)/255 if im.mode=='RGBA' else None
    save_webp(im,OUT/(name+'.webp'), lossless=alpha is not None, quality=90)
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32)/255
    lum = rgb[:,:,0]*.2126+rgb[:,:,1]*.7152+rgb[:,:,2]*.0722
    mode = 'nearest' if name in ('monstera-leaf','golden-sun-art','glass-block') else 'wrap'
    broad = blur(lum, 5, mode)
    detail = robust(lum-broad, 3, 97)
    base = robust(lum)
    grout = None
    if name == 'ivory-square-tiles':
        # Low local value identifies the photographed recessed grey grout.
        g = np.clip((.77-lum)/.23, 0, 1)
        gx = np.zeros(cfg['size'],dtype=np.float32)
        gy = np.zeros(cfg['size'],dtype=np.float32)
        for profile, out in ((lum.mean(axis=0), gx), (lum.mean(axis=1), gy)):
            for i in range(11):
                center = int(round(i*(cfg['size']-1)/10))
                ix = np.arange(max(0,center-4), min(cfg['size'],center+5))
                if len(ix):
                    center = int(ix[np.argmin(profile[ix])])
                    distance = np.minimum(abs(np.arange(cfg['size'])-center), cfg['size']-abs(np.arange(cfg['size'])-center))
                    out[:] = np.maximum(out, np.exp(-(distance/1.2)**2))
        grout = np.maximum(g, np.maximum(gx[None,:], gy[:,None]))
        h = .77 - grout*.61 + (detail-.5)*.035
        rough = .25 + grout*.53 + (1-detail)*.055
    elif name == 'limestone':
        h = .56*robust(blur(lum, 2.1))+.28*base+.16*detail
        rough = .76+(1-base)*.20
    elif name == 'golden-sun-art':
        h = .55*robust(blur(lum,2.4,mode))+.30*base+.15*detail
        rough = .44+(1-base)*.25
    elif name == 'white-terrycloth':
        h = .25*base+.75*detail
        rough = .91+(1-detail)*.08
    elif name == 'ivory-lounger-vinyl':
        h = .18*base+.82*detail
        rough = .50+(1-detail)*.12
    elif name == 'rubber-mat':
        h = .72*base+.28*detail
        rough = .77+(1-base)*.17
    elif name == 'monstera-leaf':
        # Suppress silhouette and very broad illumination; retain modest veins.
        h = blur(lum, .8, mode)-blur(lum, 6, mode)
        h = .5 + h*.8
        h[alpha < .99] = .5
        rough = .38+(1-base)*.18
    elif name == 'glass-block':
        # Broad filtered features carry pressed waviness and perimeter bevels.
        h = .78*robust(blur(lum, 3, mode))+.22*robust(blur(lum, 8, mode))
        rough = .13+(1-base)*.11
    local_basin = np.clip(blur(h, 3, mode)-h, 0, 1)
    basin = local_basin/max(float(np.percentile(local_basin,99)), .01)
    ao_strength = {'limestone':.30,'rubber-mat':.25,'golden-sun-art':.22,'white-terrycloth':.13,'ivory-square-tiles':.17,'ivory-lounger-vinyl':.06,'monstera-leaf':.05,'glass-block':.05}[name]
    ao = 1-np.clip(basin,0,1)*ao_strength
    if grout is not None:
        ao = np.minimum(ao,1-grout*.16)
    if alpha is not None:
        ao[alpha < .98] = 1
        rough[alpha < .98] = 1
    normal_pct = save_normal(h,cfg['normal_slope'],OUT/(name+'-normal.webp'),alpha,mode)
    save_scalar(rough,OUT/(name+'-roughness.webp'))
    save_scalar(ao,OUT/(name+'-ao.webp'))
    entry = {'name': name, 'original':str(src), 'original_size':list(original.size), 'runtime_size':[cfg['size']]*2, 'albedo':str(OUT/(name+'.webp')), 'normal':str(OUT/(name+'-normal.webp')), 'roughness':str(OUT/(name+'-roughness.webp')), 'ao':str(OUT/(name+'-ao.webp')), 'normal_convention':'OpenGL tangent space', 'albedo_color_space':'sRGB', 'data_map_color_space':'linear / NoColorSpace', 'normal_xy_p95':round(normal_pct,4), 'roughness_range':[round(float(rough.min()),3),round(float(rough.max()),3)], 'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest()}
    if alpha is not None:
        entry['alpha_range'] = [int(alpha.min()*255),int(alpha.max()*255)]
        entry['transparent_pixel_fraction'] = round(float((alpha==0).mean()),4)
        entry['albedo_encoding']='lossless RGBA WebP'
    else:
        entry['albedo_encoding']='RGB WebP quality 90'
    records.append(entry)

manifest = {'source':'Eight built-in image_gen calls; prompts and source paths in generation-provenance.json', 'processing':'Albedo originals only resized and encoded. PBR scalar fields inferred numerically from original luminance; these are approximate material cues, not measured scans. Normal, roughness and AO WebP encoded losslessly.', 'asset_count':len(records), 'runtime_file_count':len(list(OUT.glob('*.webp'))), 'assets':records}
(ROOT/'runtime-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'runtime':str(OUT),'files':manifest['runtime_file_count'],'total_bytes':sum(p.stat().st_size for p in OUT.glob('*.webp')),'leaf_alpha':next(r for r in records if r['name']=='monstera-leaf')['alpha_range']},indent=2))
