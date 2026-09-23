import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[2]/'water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
import time, pathlib
D=pathlib.Path(__file__).resolve().parents[3];OUT=D/'docs/water-v29';OUT.mkdir(exist_ok=True)
shaders=json.load(open(pathlib.Path(os.environ.get('V28_FIXTURE_DIR','/tmp/level10-v29'))/'shaders.json'))
Use=gl('glUseProgram',None,[U]);Loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);Attrib=gl('glGetAttribLocation',I,[U,C.c_char_p]);U1f=gl('glUniform1f',None,[I,F]);U1i=gl('glUniform1i',None,[I,I]);U2f=gl('glUniform2f',None,[I,F,F]);U3f=gl('glUniform3f',None,[I,F,F,F]);UM4=gl('glUniformMatrix4fv',None,[I,I,U,ptr]);Gen=gl('glGenTextures',None,[I,C.POINTER(U)]);Bind=gl('glBindTexture',None,[U,U]);Active=gl('glActiveTexture',None,[U]);Param=gl('glTexParameteri',None,[U,U,I]);Tex=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);Viewport=gl('glViewport',None,[I,I,I,I]);Buffer=gl('glGenBuffers',None,[I,C.POINTER(U)]);BindBuffer=gl('glBindBuffer',None,[U,U]);BufferData=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);Enable=gl('glEnableVertexAttribArray',None,[U]);AP=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);Draw=gl('glDrawArrays',None,[U,I,I]);Read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);Finish=gl('glFinish',None,[]);Clear=gl('glClear',None,[U]);ClearColor=gl('glClearColor',None,[F,F,F,F]);GetError=gl('glGetError',U,[])
W,H=480,360;p=program(**{'v':shaders['fused-absorb-lens-dof']['vertex'],'f':shaders['fused-absorb-lens-dof']['fragment']});Use(p)
v=np.array([-1,-1,0,3,-1,0,-1,3,0],dtype=np.float32);b=U();Buffer(1,C.byref(b));BindBuffer(0x8892,b);BufferData(0x8892,v.nbytes,v.ctypes.data,0x88E4);a=Attrib(p,b'position');Enable(a);AP(a,3,0x1406,0,0,None)
texids={}
def tex(name,data,unit,repeat=False):
 data=np.ascontiguousarray(data,dtype=np.float32);tid=U();Gen(1,C.byref(tid));Active(0x84C0+unit);Bind(0x0DE1,tid);Param(0x0DE1,0x2801,0x2601);Param(0x0DE1,0x2800,0x2601);Param(0x0DE1,0x2802,0x2901 if repeat else 0x812F);Param(0x0DE1,0x2803,0x2901 if repeat else 0x812F);Tex(0x0DE1,0,0x8814,data.shape[1],data.shape[0],0,0x1908,0x1406,data.ctypes.data);U1i(Loc(p,name.encode()),unit);texids[name]=(tid,unit,data)
def update_tex(name,data):
 tid,unit,old=texids[name];data=np.ascontiguousarray(data,dtype=np.float32);Active(0x84C0+unit);Bind(0x0DE1,tid);Tex(0x0DE1,0,0x8814,data.shape[1],data.shape[0],0,0x1908,0x1406,data.ctypes.data)
def val(name,*v):
 loc=Loc(p,name.encode())
 if len(v)==1:U1f(loc,v[0])
 elif len(v)==2:U2f(loc,*v)
 else:U3f(loc,*v)
def matrix(name,data):
 data=np.ascontiguousarray(data.T,dtype=np.float32);UM4(Loc(p,name.encode()),1,0,data.ctypes.data)
near,far=.01,480;f=1/np.tan(np.deg2rad(72)/2);proj=np.array([[f/(4/3),0,0,0],[0,f,0,0],[0,0,(far+near)/(near-far),2*far*near/(near-far)],[0,0,-1,0]],np.float32)
matrix('inverseProjection',np.linalg.inv(proj));matrix('cameraWorld',np.eye(4));
for n,v in [('resolution',(960,720)),('fieldSize',(256,192)),('nearPlane',(near,)),('farPlane',(far,)),('focusDist',(5,)),('aperture',(0,)),('wet',(0,)),('waterActive',(0,)),('washWeight',(0,)),('washAge',(0,)),('exiting',(0,)),('time',(1,)),('level',(0,)),('exitFlash',(0,)),('eye',(0,-2,0)),('screenLight',(-.42,.67,.83)),('flareStrength',(0,)),('flareAspect',(4/3,)),('flareSun',(.6,.8))]:val(n,*v)
rgba=np.ones((720,960,4),np.float32);depth=np.ones_like(rgba);depth[:,:,:3]=(far-near*far/5)/(far-near)
wet=np.zeros((192,256,4),np.float32);wet[:,:,:2]=128/255
normal=np.array(Image.open(D/'dist/textures/v28/water-normal-a.png').convert('RGBA'),dtype=np.float32)/255
tex('picture',rgba,0);tex('depth',depth,1);tex('wetHeight',wet,2);tex('washNoise',normal,3,True)
def render():
 Viewport(0,0,W,H);Draw(4,0,3);out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);assert GetError()==0;return out[::-1].copy()
a=render();assert np.min(a[:,:,:3])==255,'dry identity'
val('waterActive',1);a=render();trans=np.exp(-np.array([.4,.15,.05])*5);expected=(trans+np.array([.024,.061,.054])*(1-trans))*255;actual=a[H//2,W//2,:3];assert np.max(abs(actual-expected))<2,(actual,expected)
# Linear photographic-depth test fixture (diagnostic, not an in-game screenshot).
y,x=np.mgrid[0:720,0:960];grid=((x//50+y//50)%2).astype(float);rgba[:,:,0]=.11+grid*.40;rgba[:,:,1]=.20+grid*.33;rgba[:,:,2]=.25+grid*.35
rgba[:350,:,0]=.24+grid[:350]*.18;rgba[:350,:,1]=.36+grid[:350]*.18;rgba[:350,:,2]=.43+grid[:350]*.18
# RGB strips reveal refractive/axial dispersion rather than an opaque overlay.
rgba[400:440,100:860,:3]=(.65,.07,.03);rgba[500:515,60:900,:3]=(.05,.52,.03)
update_tex('picture',rgba);val('waterActive',0);val('aperture',.13);val('focusDist',18)
imgs=[]
def panel(label):
 out=render();# linear result displayed with simple gamma for diagnostic sheets
 im=Image.fromarray(np.uint8(np.clip((out[:,:,:3]/255)**(1/2.2)*255,0,255)));c=ImageDraw.Draw(im);c.rectangle((0,0,W,24),fill=(13,16,19));c.text((9,6),label,fill=(230,230,215));imgs.append(im);return out
panel('DRY / 10-tap half-resolution DOF')
# Render actual finite-volume droplet fields and real stick-slip evolution.
frames=json.load(open('/tmp/level10-v29/lens-fixture.json'));differences=[];baseline=render()
for f in frames:
 wet=np.fromfile('/tmp/level10-v29/'+f['file'],np.uint8).reshape(f['height'],f['width'],4).astype(np.float32)/255
 update_tex('wetHeight',wet);val('waterActive',0);val('wet',f['wet']);val('washWeight',f['washWeight']);val('washAge',f['washAge']);val('exiting',1);val('time',f['time']);val('exitFlash',0)
 out=panel('ACTUAL lens field / '+str(f['time'])+' seconds');differences.append(float(np.mean(np.abs(out[:,:,:3].astype(float)-baseline[:,:,:3]))))
assert differences[0]>1 and differences[2]>1,(differences,'wet field must bend the background')
assert differences[-1]==0,(differences,'dry output must be byte-identical by 3.1 seconds')
assert not np.allclose(differences[1:-1],differences[1]),'not a stationary scratch overlay'
contact=Image.new('RGB',(W*4,H*2))
for i,im in enumerate(imgs):contact.paste(im,((i%4)*W,(i//4)*H))
contact.save(OUT/'lens-contactsheet.png')
report={'gles':GetString(0x1F02).decode(),'renderer':GetString(0x1F01).decode(),'half_resolution':[W,H],'dry_identity':True,'absorption_expected_8bit':expected.tolist(),'absorption_actual_8bit':actual.tolist(),'time_seconds':[f['time'] for f in frames],'mean_refractive_pixel_difference':differences,'final_dry_byte_identical':True,'not_device_fps':True}
json.dump(report,open(OUT/'native-optics-checks.json','w'),indent=2);print(json.dumps(report,indent=2))
