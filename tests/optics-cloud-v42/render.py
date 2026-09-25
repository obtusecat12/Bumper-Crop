import sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1]);sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text();exec(src[src.index('Use=gl'):src.index('opaque=target();')]);exec(src[src.index('def bindtex'):src.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);",''))
Tex3D=gl('glTexImage3D',None,[U,I,I,I,I,I,I,U,U,ptr]);Mip=gl('glGenerateMipmap',None,[U]);U4f=gl('glUniform4f',None,[I,F,F,F,F]);Finish=gl('glFinish',None,[])
sh=json.load(open(P/'shaders.json'));programs={k:program(s['vertex'],s['fragment']) for k,s in sh.items()}
noise=U();Gen(1,C.byref(noise));Bind(0x806F,noise);a=np.fromfile(P/'noise.bin',np.uint8);Tex3D(0x806F,0,0x8058,64,64,64,0,0x1908,0x1401,a.ctypes.data)
for axis in [0x2802,0x2803,0x8072]:Param(0x806F,axis,0x2901)
Mip(0x806F);Param(0x806F,0x2801,0x2703);Param(0x806F,0x2800,0x2601)
blank=tex(np.zeros((2,2,4),np.uint8));identity=np.eye(4,dtype=np.float32).flatten()
def make_target(w,h):
 rt=target();Bind(0x0DE1,rt[1]);Tex(0x0DE1,0,0x881A,w,h,0,0x1908,0x140B,None);Bind(0x0DE1,rt[2]);Tex(0x0DE1,0,0x81A6,w,h,0,0x1902,0x1405,None);BindFBO(0x8D40,rt[0]);assert CheckFBO(0x8D40)==0x8CD5;return rt
skyRT=make_target(W,H);hdr=make_target(W,H);cocA=make_target(W//2,H//2);cocB=make_target(W//2,H//2);fused=make_target(W//2,H//2)
def draw(p,rt,w=W,h=H):
 BindFBO(0x8D40,rt[0] if rt else 0);Viewport(0,0,w,h);Use(p);Disable(0x0B71);attrs(p,quad,[('position',3,0)],12);Draw(4,0,3)
def save(label):
 out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);err=GetError();assert err==0,hex(err);Image.fromarray(out[::-1,:,:3]).save(P/(label+'.png'));print('Rendered',label,flush=True);return out
# Render the production fragment, with per-pixel world direction for these sky-only
# views (the game uses exactly this interpolant on a camera-centred sphere).
vs='''#version 300 es
precision highp float;in vec3 position;out vec3 vCloudDirection;uniform float pitch,aspect;
void main(){vec3 v=vec3(position.x*aspect*.72654,position.y*.72654,-1.);
 vCloudDirection=vec3(v.x,v.y*cos(pitch)-v.z*sin(pitch),v.y*sin(pitch)+v.z*cos(pitch));gl_Position=vec4(position,1.);}'''
sky=program(vs,sh['sky']['fragment']);present=program(sh['resolve']['vertex'],sh['resolve']['fragment'])
def sky_draw(t,pitch=.44,origin=(0,0),eye=(.6,1.77,52),steps=8,rain=0):
 Use(sky);Active(0x84C0);Bind(0x806F,noise);U1i(Loc(sky,b'uCloudNoise'),0);bindtex(sky,'uFogVolume',blank,1);bindtex(sky,'uSkyWallpaper',blank,2)
 for n,v in [('uCloudTime',t),('uCloudMist',0),('uCloudRain',rain),('uFogVolumeAmount',0),('pitch',pitch),('aspect',4/3)]:scalar(sky,n,v)
 U1i(Loc(sky,b'uCloudSteps'),steps);U4f(Loc(sky,b'uSkyEvent'),0,0,0,0);vec(sky,'uStageEvent',(0,0,0));vec(sky,'uCloudCamera',eye);vec(sky,'uCloudOrigin',origin);vec(sky,'uCloudFogColor',(.411,.467,.44));draw(sky,skyRT)
 Use(present);bindtex(present,'sharp',skyRT[1],0);bindtex(present,'fused',blank,1);bindtex(present,'uiPicture',blank,2);bindtex(present,'depth',skyRT[2],3);bindtex(present,'cocField',blank,4);scalar(present,'nearPlane',.08);scalar(present,'farPlane',480);vec(present,'resolution',(W,H));scalar(present,'exposure',1.23);U1i(Loc(present,b'hasUI'),0);U1i(Loc(present,b'uiOnly'),0);U1i(Loc(present,b'displayMode'),0);draw(present,None)
for label,t,pitch,steps,rain in [('sky-horizon',0,.27,8,0),('sky-overhead',0,1.2,8,0),('sky-drift-60s',60,.27,8,0),('sky-rain',90,.27,8,.8),('sky-low-quality',0,.27,6,0)]:sky_draw(t,pitch,steps=steps,rain=rain);save(label)
# Periodic origin rebase preserves all three cloud layers.
sky_draw(0,.44,origin=(65536-64,0),eye=(64.6,1.77,52));a=save('sky-rebase-before');sky_draw(0,.44,origin=(0,0));b=save('sky-rebase-after');assert np.abs(a.astype(float)-b).max()<=2 and np.abs(a.astype(float)-b).mean()<.01
# HDR colour/depth test chart: foreground sliver, focused midground, tiny bright
# background drops, with production CoC and separated half-resolution gathers.
y,x=np.mgrid[0:H,0:W];colour=np.ones((H,W,4),np.float32);depth=np.full((H,W),14.,np.float32)
colour[:,:,:3]=np.where(((x//8+y//8)%2)[:,:,None],np.array([.13,.20,.11]),np.array([.36,.31,.16]))
front=(x>W*.27)&(x<W*.32);depth[front]=.45;colour[front,:3]=(.11,.12,.05)
sharp=(x>W*.49)&(x<W*.55);depth[sharp]=4.;colour[sharp,:3]=(.30,.23,.10)
for xx,yy in [(150,510),(590,530),(720,460),(760,590),(855,490)]:colour[(x-xx)**2+(y-yy)**2<2.8**2,:3]=(5.,4.5,3.)
def floattex(a):
 t=tex();Bind(0x0DE1,t);a=np.ascontiguousarray(a,np.float32);Tex(0x0DE1,0,0x8814,a.shape[1],a.shape[0],0,0x1908,0x1406,a.ctypes.data);return t
picture=floattex(colour);d=np.ones_like(colour);d[:,:,:3]=((480-.08*480/depth)/(480-.08))[:,:,None];depthtex=floattex(d)
# Nearest-depth matches the real opaque target.
Bind(0x0DE1,depthtex);Param(0x0DE1,0x2800,0x2600);Param(0x0DE1,0x2801,0x2600)
def optics(f,s,enabled=1):
 for name in ['coc','fused','resolve']:
  p=programs[name];Use(p)
  for k,v in [('focalMM',f),('fNumber',2.8),('sensorHeight',3.6),('focusDist',s),('nearPlane',.08),('farPlane',480),('dofEnabled',enabled)]:scalar(p,k,v)
  vec(p,'resolution',(W,H));bindtex(p,'depth',depthtex,0)
 p=programs['coc'];draw(p,cocA,W//2,H//2)
 p=programs['dilate'];Use(p);bindtex(p,'coc',cocA[1],0);vec(p,'direction',(1,0));vec(p,'resolution',(W,H));draw(p,cocB,W//2,H//2)
 Use(p);bindtex(p,'coc',cocB[1],0);vec(p,'direction',(0,1));draw(p,cocA,W//2,H//2)
 p=programs['fused'];Use(p)
 for unit,(n,t) in enumerate([('depth',depthtex),('picture',picture),('cocField',cocA[1]),('wetHeight',blank),('bubbleField',blank),('washNoise',blank),('bottomSoil',blank)]):bindtex(p,n,t,unit)
 for n in ['wet','bubbleWeight','waterActive','washWeight','exitFlash','flareStrength']:scalar(p,n,0)
 matrix(p,'cameraWorld',identity);matrix(p,'inverseProjection',identity);draw(p,fused,W//2,H//2)
 p=programs['resolve'];Use(p)
 for unit,(n,t) in enumerate([('depth',depthtex),('sharp',picture),('fused',fused[1]),('uiPicture',blank),('cocField',cocA[1])]):bindtex(p,n,t,unit)
 scalar(p,'exposure',1.23);U1i(Loc(p,b'hasUI'),0);U1i(Loc(p,b'uiOnly'),0);U1i(Loc(p,b'displayMode'),0);draw(p,None)
optics(2.478,2.58,0);base=save('optics-pinhole');optics(2.478,2.58);wide=save('optics-wide');optics(11.15,1.2);tele=save('optics-tele');optics(2.478,.45);save('optics-macro')
# Far 14 m chart is exactly retained in wide-angle; test outside foreground support.
assert np.max(abs(base[:,600:,:3].astype(float)-wide[:,600:,:3]))==0
assert np.mean(abs(tele[:,600:,:3].astype(float)-wide[:,600:,:3]))>1
json.dump({'gl_errors':0,'wide_far_identity':True,'tele_changes':True,'rebase_identity':True,'renderer':GetString(0x1F01).decode(),'hardware_fps_test':False},open(P/'render-checks.json','w'),indent=2)
print('GL errors=0; wide sharp identity, tele blur and sky rebasing passed')
