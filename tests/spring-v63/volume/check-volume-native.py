"""Render actual exported V63 GPU passes in native GLES, without a browser."""
import pathlib,sys,json
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[2]
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image
source=(ROOT/'tests/water-v28/native/render_lake.py').read_text()
exec(source[source.index('Use=gl'):source.index('opaque=target();')].replace('W,H=960,720','W,H=400,300'))
exec(source[source.index('def bindtex'):source.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);",''))
Tex3D=gl('glTexImage3D',None,[U,I,I,I,I,I,I,U,U,ptr]);U4f=gl('glUniform4f',None,[I,F,F,F,F]);Finish=gl('glFinish',None,[])
programs={k:program(v['vertex'],v['fragment']) for k,v in json.load(open(P/'volume-shaders.json')).items()};fixture=json.load(open(P/'volume-fixture.json'))
def float_tex(data=None,w=W,h=H):
 t=tex(None,w,h);Bind(0x0DE1,t)
 if data is not None:data=np.ascontiguousarray(data,np.float32);h,w=data.shape[:2]
 Tex(0x0DE1,0,0x8814,w,h,0,0x1908,0x1406,None if data is None else data.ctypes.data);return t
def rt(w,h):
 t=float_tex(None,w,h);f=U();GenFBO(1,C.byref(f));BindFBO(0x8D40,f);FBOTexture(0x8D40,0x8CE0,0x0DE1,t,0);assert CheckFBO(0x8D40)==0x8CD5;return f.value,t,w,h
def draw(pr,target):
 BindFBO(0x8D40,target[0]);Viewport(0,0,target[2],target[3]);attrs(pr,quad,[('position',3,0)],12);Draw(4,0,3)
def read(target):
 BindFBO(0x8D40,target[0]);pixels=np.empty((target[3],target[2],4),np.float32);Read(0,0,target[2],target[3],0x1908,0x1406,pixels.ctypes.data);return pixels
noise=np.fromfile(P/'volume-noise.bin',np.uint8);tid=U();Gen(1,C.byref(tid));Bind(0x806F,tid);Tex3D(0x806F,0,0x822B,64,64,64,0,0x8227,0x1401,noise.ctypes.data)
for a in[0x2802,0x2803,0x8072]:Param(0x806F,a,0x2901)
for a in[0x2800,0x2801]:Param(0x806F,a,0x2601)
mask=np.fromfile(P/'volume-mask.bin',np.uint8).reshape(128,128);mask=tex(np.repeat(mask[:,:,None],4,axis=2))
def common(pr,t):
 Use(pr);scalar(pr,'time',t);scalar(pr,'waterY',0);vec(pr,'boundsMin',fixture['boundsMin']);vec(pr,'boundsMax',fixture['boundsMax']);bindtex(pr,'poolMask',mask,1);Active(0x84C0+2);Bind(0x806F,tid);U1i(Loc(pr,b'noiseVolume'),2)
A=rt(256,128);B=rt(256,128);lightRT=rt(256,128);half=rt(W//2,H//2);final=rt(W,H)
Disable(0x0B71);Disable(0x0BE2);Disable(0x0B44)
for frame in range(121):
 pr=programs['advection'];common(pr,frame/60);bindtex(pr,'densityField',A[1],0);scalar(pr,'initialize',int(frame==0));scalar(pr,'dt',1/60);draw(pr,B);A,B=B,A
 if frame==0:first=read(A).copy()
last=read(A);assert np.isfinite(last).all();movement=float(np.abs(first[:,:,:2]-last[:,:,:2]).mean());assert movement>.003,movement
pr=programs['lightCache'];common(pr,2);bindtex(pr,'densityField',A[1],0);scalar(pr,'extinction',2.55);scalar(pr,'densityGain',1);U1i(Loc(pr,b'lampCount'),2)
for i in range(4):U4f(Loc(pr,f'lampPositionPower[{i}]'.encode()),*fixture['lights'][i])
draw(pr,lightRT)
camera=fixture['camera'];ip=np.array(camera['inverseProjection']).reshape(4,4).T;world=np.array(camera['world']).reshape(4,4).T;projection=np.array(camera['projection']).reshape(4,4).T;eye=np.array(camera['eye'])
y,x=np.mgrid[0:H,0:W];uv=np.stack([(x+.5)/W,(y+.5)/H],axis=-1);ndc=np.concatenate([uv*2-1,np.ones((H,W,2))],axis=-1);v=ndc@ip.T;rays=(v[:,:,:3]/v[:,:,3:4])@world[:3,:3].T;rays/=np.linalg.norm(rays,axis=-1)[:,:,None]
distance=np.where(rays[:,:,1]<-.001,-eye[1]/rays[:,:,1],30.);distance=np.minimum(distance,30);p=eye+rays*distance[:,:,None]
source=np.ones((H,W,4),np.float32);source[:,:,:3]=[.027,.15,.103];ripple=(np.sin(p[:,:,0]*7+p[:,:,2]*6)+np.sin(p[:,:,0]*-11+p[:,:,2]*9))*.014;source[:,:,:3]+=ripple[:,:,None];source[distance>=29.9,:3]=[.08,.07,.05]
foreground=(uv[:,:,0]>.07)&(uv[:,:,0]<.25)&(uv[:,:,1]<.80);distance[foreground]=1.1;source[foreground,:3]=[.06,.07,.06]
viewp=(eye+rays*distance[:,:,None]-eye)@world[:3,:3];depth=(viewp[:,:,2]*projection[2,2]+projection[2,3])/(-viewp[:,:,2])*.5+.5;depth=np.repeat(depth[:,:,None],4,axis=2);depthT=float_tex(depth);sourceT=float_tex(source)
pr=programs['raymarch'];common(pr,2);bindtex(pr,'densityField',A[1],0);bindtex(pr,'sceneDepth',depthT,3);bindtex(pr,'lightField',lightRT[1],4);matrix(pr,'inverseProjection',camera['inverseProjection']);matrix(pr,'cameraWorld',camera['world']);vec(pr,'eye',camera['eye']);vec(pr,'halfSize',[W//2,H//2]);scalar(pr,'extinction',2.55);scalar(pr,'densityGain',1);U1i(Loc(pr,b'lampCount'),2)
for i in range(4):U4f(Loc(pr,f'lampPositionPower[{i}]'.encode()),*fixture['lights'][i]);U4f(Loc(pr,f'lampColorRange[{i}]'.encode()),*fixture['colors'][i])
draw(pr,half);volume=read(half);assert np.isfinite(volume).all();assert volume[:,:,3].min()<.8,float(volume[:,:,3].min())
pr=programs['composite'];Use(pr);bindtex(pr,'sourceColor',sourceT,0);bindtex(pr,'sceneDepth',depthT,1);bindtex(pr,'volumeColor',half[1],2);vec(pr,'halfSize',[W//2,H//2]);vec(pr,'nearFar',[camera['near'],camera['far']]);draw(pr,final);result=read(final)
interior=foreground&(uv[:,:,0]>.09)&(uv[:,:,0]<.23);occlusionError=float(np.max(np.abs(result[interior]-source[interior])));assert occlusionError<.001,occlusionError
assert GetError()==0
panels=[]
for a in[source,result]:
 a=np.clip(a[:,:,:3],0,1);a=np.where(a<=.0031308,a*12.92,1.055*a**(1/2.4)-.055);panels.append(Image.fromarray(np.uint8(a[::-1]*255)))
image=Image.new('RGB',(W*2,H));image.paste(panels[0],(0,0));image.paste(panels[1],(W,0));image.save(P/'volume-native-check.png')
report={'shaderPrograms':4,'simulationFrames':121,'meanAdvectedStateChange':movement,'minTransmittance':float(volume[:,:,3].min()),'meanTransmittance':float(volume[:,:,3].mean()),'foregroundOcclusionMaxError':occlusionError,'glErrors':0,'renderer':GetString(0x1F01).decode()}
json.dump(report,open(P/'volume-native-check.json','w'),indent=2);print(json.dumps(report))
