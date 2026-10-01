import sys,pathlib,json,tempfile
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).resolve().parents[3]
D=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path(tempfile.gettempdir())/'level10-lens-v63'
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
fixture=json.load(open(D/'fixture.json'))
Use=gl('glUseProgram',None,[U]);Loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);Attrib=gl('glGetAttribLocation',I,[U,C.c_char_p]);U1f=gl('glUniform1f',None,[I,F]);U1i=gl('glUniform1i',None,[I,I]);U2f=gl('glUniform2f',None,[I,F,F]);U3f=gl('glUniform3f',None,[I,F,F,F]);UM4=gl('glUniformMatrix4fv',None,[I,I,U,ptr]);Gen=gl('glGenTextures',None,[I,C.POINTER(U)]);Bind=gl('glBindTexture',None,[U,U]);Active=gl('glActiveTexture',None,[U]);Param=gl('glTexParameteri',None,[U,U,I]);Tex=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);Viewport=gl('glViewport',None,[I,I,I,I]);Buffer=gl('glGenBuffers',None,[I,C.POINTER(U)]);BindBuffer=gl('glBindBuffer',None,[U,U]);BufferData=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);Enable=gl('glEnableVertexAttribArray',None,[U]);AP=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);Draw=gl('glDrawArrays',None,[U,I,I]);Read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);Finish=gl('glFinish',None,[]);GetError=gl('glGetError',U,[])
GenFBO=gl('glGenFramebuffers',None,[I,C.POINTER(U)]);BindFBO=gl('glBindFramebuffer',None,[U,U]);Attach=gl('glFramebufferTexture2D',None,[U,U,U,U,I]);CheckFBO=gl('glCheckFramebufferStatus',U,[U])
def texture(data):
 data=np.ascontiguousarray(data,np.float32);tid=U();Gen(1,C.byref(tid));Bind(0x0DE1,tid)
 for param,value in [(0x2801,0x2601),(0x2800,0x2601),(0x2802,0x812F),(0x2803,0x812F)]:Param(0x0DE1,param,value)
 Tex(0x0DE1,0,0x8814,data.shape[1],data.shape[0],0,0x1908,0x1406,data.ctypes.data);return tid

def target(w,h):
 tid=texture(np.zeros((h,w,4),np.float32));fbo=U();GenFBO(1,C.byref(fbo));BindFBO(0x8D40,fbo);Attach(0x8D40,0x8CE0,0x0DE1,tid,0);assert CheckFBO(0x8D40)==0x8CD5;return fbo,tid

def bindtex(p,name,tid,unit):Active(0x84C0+unit);Bind(0x0DE1,tid);U1i(Loc(p,name.encode()),unit)
def val(p,n,*v):
 loc=Loc(p,n.encode());{1:U1f,2:U2f,3:U3f}[len(v)](loc,*v)
def matrix(p,n,m):m=np.ascontiguousarray(m.T,np.float32);UM4(Loc(p,n.encode()),1,0,m.ctypes.data)
verts=np.array([-1,-1,0,3,-1,0,-1,3,0],np.float32);vbuf=U();Buffer(1,C.byref(vbuf));BindBuffer(0x8892,vbuf);BufferData(0x8892,verts.nbytes,verts.ctypes.data,0x88E4)
def draw(p,t,w,h):
 Use(p);a=Attrib(p,b'position');Enable(a);AP(a,3,0x1406,0,0,None);BindFBO(0x8D40,t[0]);Viewport(0,0,w,h);Draw(4,0,3);Finish();assert GetError()==0

def pixels(t,w,h):BindFBO(0x8D40,t[0]);out=np.empty((h,w,4),np.float32);Read(0,0,w,h,0x1908,0x1406,out.ctypes.data);assert GetError()==0;return out[::-1]
W,H=1440,720;y,x=np.mgrid[0:H,0:W];rgb=np.ones((H,W,4),np.float32);grid=((x//70+y//70)%2).astype(float);rgb[:,:,:3]=np.stack([.13+.2*grid,.17+.20*grid,.16+.20*grid],-1);rgb[(x%70<3)|(y%70<3),:3]=[.06,.11,.14]
near,far=.1,100;depth=np.ones((H,W,4),np.float32)*(far-near*far/5)/(far-near);dep=texture(depth);pic=texture(rgb);empty=texture(np.zeros((1,1,4)));norm=texture(np.full((1,1,4),.5,np.float32));
imgs=[];reports=[]
for i,c in enumerate(fixture['cases']):
 name=c['name'];sh=fixture['old' if i==0 else 'next'];fp=program(sh['vertex'],sh['fused']);rp=program(sh['vertex'],sh['resolve']);wet=texture(np.fromfile(D/(name+'.bin'),np.uint8).reshape(c['height'],c['width'],4)/255)
 Use(fp)
 for unit,(n,t) in enumerate([('picture',pic),('depth',dep),('cocField',empty),('wetHeight',wet),('bubbleField',empty),('washNoise',norm),('bottomSoil',pic)]):bindtex(fp,n,t,unit)
 for n,v in [('resolution',(W,H)),('fieldSize',(c['width'],c['height'])),('nearPlane',(near,)),('farPlane',(far,)),('focusDist',(5,)),('focalMM',(2.47,)),('fNumber',(2.8,)),('sensorHeight',(3.6,)),('dofEnabled',(0,)),('wet',(1,)),('waterActive',(0,)),('washWeight',(0,)),('washAge',(3,)),('exiting',(1,)),('time',(3,)),('level',(-10,)),('exitFlash',(0,)),('eye',(0,1.7,0)),('screenLight',(-.42,.67,.83)),('flareStrength',(0,)),('bathSteam',(0,))]:val(fp,n,*v)
 matrix(fp,'inverseProjection',np.eye(4));matrix(fp,'cameraWorld',np.eye(4));fw,fh=(W//2,H//2) if i==0 else (W,H);fbo=target(fw,fh);draw(fp,fbo,fw,fh)
 Use(rp)
 for unit,(n,t) in enumerate([('fused',fbo[1]),('sharp',pic),('depth',dep),('cocField',empty),('uiPicture',empty)]):bindtex(rp,n,t,unit)
 for n,v in [('resolution',(W,H)),('fusedSize',(fw,fh)),('nearPlane',(near,)),('farPlane',(far,)),('exposure',(1.23,))]:val(rp,n,*v)
 for n,v in [('hasUI',0),('uiOnly',0),('displayMode',0)]:U1i(Loc(rp,n.encode()),v)
 final=target(W,H);draw(rp,final,W,H);a=pixels(final,W,H);assert np.isfinite(a).all();im=Image.fromarray(np.uint8(np.clip(a[:,:,:3],0,1)*255));crop=im.crop((W*.33,H*.24,W*.52,H*.59)).resize((548,504),Image.Resampling.NEAREST if i==0 else Image.Resampling.BILINEAR);imgs.append(crop);reports.append({'case':name,'native_gles_actual_shaders':True,'optical_field':[c['width'],c['height']],'fused_pass':[fw,fh],'finitePixels':True})
montage=Image.new('RGB',(1096,538));drawtxt=ImageDraw.Draw(montage)
for i,(im,label) in enumerate(zip(imgs,['BEFORE: 256 field / quantized gradient / half pass','AFTER: 1024 field / float gradient / full wet pass'])):montage.paste(im,(i*548,34));drawtxt.text((10+i*548,10),label,fill=(255,255,255))
montage.save(D/'lens-before-after-native-gles.png');json.dump({'checks':reports,'physicsIdentical480Frames':fixture['physicsIdentical480Frames'],'baselineCommit':fixture['baselineCommit'],'renderer':GetString(0x1F01).decode(),'limitations':'Native Mesa GLES diagnostic using synthetic geometry test pattern; not a browser screenshot or gameplay FPS measurement.'},open(D/'results.json','w'),indent=2);print(json.dumps(reports))
