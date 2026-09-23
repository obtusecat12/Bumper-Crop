from gl_native import *
from PIL import Image,ImageDraw
import pathlib
ROOT=pathlib.Path(__file__).resolve().parents[3];P=pathlib.Path(os.environ.get('V28_FIXTURE_DIR','/tmp/level10-v28'));data=json.load(open(P/'shaders.json'));fixture=json.load(open(P/'lake-fixture.json'))
Use=gl('glUseProgram',None,[U]);Loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);Attrib=gl('glGetAttribLocation',I,[U,C.c_char_p]);U1f=gl('glUniform1f',None,[I,F]);U1i=gl('glUniform1i',None,[I,I]);U2f=gl('glUniform2f',None,[I,F,F]);U3f=gl('glUniform3f',None,[I,F,F,F]);UM4=gl('glUniformMatrix4fv',None,[I,I,U,ptr]);Gen=gl('glGenTextures',None,[I,C.POINTER(U)]);Bind=gl('glBindTexture',None,[U,U]);Active=gl('glActiveTexture',None,[U]);Param=gl('glTexParameteri',None,[U,U,I]);Tex=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);Viewport=gl('glViewport',None,[I,I,I,I]);Buffer=gl('glGenBuffers',None,[I,C.POINTER(U)]);BindBuffer=gl('glBindBuffer',None,[U,U]);BufferData=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);EnableAttrib=gl('glEnableVertexAttribArray',None,[U]);DisableAttrib=gl('glDisableVertexAttribArray',None,[U]);AP=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);Draw=gl('glDrawArrays',None,[U,I,I]);Read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);Clear=gl('glClear',None,[U]);ClearColor=gl('glClearColor',None,[F,F,F,F]);Enable=gl('glEnable',None,[U]);Disable=gl('glDisable',None,[U]);DepthFunc=gl('glDepthFunc',None,[U]);GenFBO=gl('glGenFramebuffers',None,[I,C.POINTER(U)]);BindFBO=gl('glBindFramebuffer',None,[U,U]);FBOTexture=gl('glFramebufferTexture2D',None,[U,U,U,U,I]);CheckFBO=gl('glCheckFramebufferStatus',U,[U]);Blit=gl('glBlitFramebuffer',None,[I,I,I,I,I,I,I,I,U,U]);GetError=gl('glGetError',U,[])
W,H=960,720

def tex(data=None,w=W,h=H,depth=False,repeat=False):
 tid=U();Gen(1,C.byref(tid));Bind(0x0DE1,tid);Param(0x0DE1,0x2801,0x2600 if depth else 0x2601);Param(0x0DE1,0x2800,0x2600 if depth else 0x2601);Param(0x0DE1,0x2802,0x2901 if repeat else 0x812F);Param(0x0DE1,0x2803,0x2901 if repeat else 0x812F)
 if data is not None:data=np.ascontiguousarray(data,dtype=np.uint8);h,w=data.shape[:2]
 Tex(0x0DE1,0,0x81A6 if depth else 0x8058,w,h,0,0x1902 if depth else 0x1908,0x1405 if depth else 0x1401,None if data is None else data.ctypes.data);return tid.value

def target():
 color=tex();depth=tex(depth=True);fb=U();GenFBO(1,C.byref(fb));BindFBO(0x8D40,fb);FBOTexture(0x8D40,0x8CE0,0x0DE1,color,0);FBOTexture(0x8D40,0x8D00,0x0DE1,depth,0);assert CheckFBO(0x8D40)==0x8CD5;return fb.value,color,depth
opaque=target();waterRT=target();
def image_tex(name,flip=True):
 a=np.array(Image.open(ROOT/'dist/textures/v28'/name).convert('RGBA'));return tex(a[::-1] if flip else a,repeat=True)
normalA=image_tex('water-normal-a.png');normalB=image_tex('water-normal-b.png');atlas=image_tex('water-caustics-atlas.png',False)

def bindtex(p,name,t,unit):Active(0x84C0+unit);Bind(0x0DE1,t);U1i(Loc(p,name.encode()),unit)
def scalar(p,n,v):U1f(Loc(p,n.encode()),v)
def vec(p,n,v):
 loc=Loc(p,n.encode());(U2f if len(v)==2 else U3f)(loc,*v)
def matrix(p,n,v):
 a=np.ascontiguousarray(v,dtype=np.float32);UM4(Loc(p,n.encode()),1,0,a.ctypes.data)
def buffer(a):
 b=U();Buffer(1,C.byref(b));BindBuffer(0x8892,b);BufferData(0x8892,a.nbytes,a.ctypes.data,0x88E4);return b.value
G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);quad=buffer(np.array([-1,-1,0,3,-1,0,-1,3,0],np.float32))
activeAttributes=[]
def attrs(p,b,spec,stride):
 for a in activeAttributes:DisableAttrib(a)
 activeAttributes.clear();BindBuffer(0x8892,b)
 for name,n,offset in spec:
  a=Attrib(p,name.encode())
  if a>=0:EnableAttrib(a);AP(a,n,0x1406,0,stride,C.c_void_p(offset));activeAttributes.append(a)
ground=program('''#version 300 es
precision highp float;in vec3 position;uniform mat4 projection,view;out vec3 worldP;void main(){worldP=position;gl_Position=projection*view*vec4(position,1.);}''','''#version 300 es
precision highp float;uniform float level,time;uniform sampler2D atlas;in vec3 worldP;out vec4 c;
vec2 causticUV(vec2 p,float frame){vec2 tile=vec2(mod(frame,4.),floor(frame/4.));return (tile+(fract(p)*255.+.5)/256.)/4.;}
void main(){vec3 n=normalize(cross(dFdx(worldP),dFdy(worldP)));if(n.y<0.)n=-n;float d=max(0.,level-worldP.y);float grain=fract(sin(dot(worldP.xz,vec2(127.1,311.7)))*43758.5453);
vec3 color=mix(vec3(.33,.27,.14),vec3(.18,.24,.15),smoothstep(0.,2.,d));color*=.78+.22*grain;float frame=mod(time*8.,16.);vec2 p=(worldP.xz-vec2(-103,32))*.27;float ca=mix(texture(atlas,causticUV(p,floor(frame))).r,texture(atlas,causticUV(p,mod(floor(frame)+1.,16.))).r,fract(frame));color*=1.+ca*.72*exp(-d*.19)*smoothstep(0.,.18,d);color*=.55+.45*max(0.,dot(n,normalize(vec3(-.4,.8,-.3))));c=vec4(color,1.);}''')
surface=program(data['two-sided-surface']['vertex'],data['two-sided-surface']['fragment'])
# Final image diagnostics: view raw physical water color (no NTSC or fabricated reflections).
present=program(data['tone-resolve']['vertex'],data['tone-resolve']['fragment']);blank=tex(np.zeros((2,2,4),np.uint8),2,2)
identity=np.eye(4,dtype=np.float32).T.flatten();panels=[]
for cam in fixture['cameras']:
 BindFBO(0x8D40,opaque[0]);Viewport(0,0,W,H);ClearColor(.40,.47,.49,1);Clear(0x4100);Enable(0x0B71);DepthFunc(0x0203);Disable(0x0B44)
 Use(ground);matrix(ground,'projection',cam['projection']);matrix(ground,'view',cam['view']);scalar(ground,'level',fixture['level']);scalar(ground,'time',1.25);bindtex(ground,'atlas',atlas,0);attrs(ground,gb,[('position',3,0)],12);Draw(4,0,len(G)//3)
 # Immutable opaque snapshot, then only water. Legal depth source/target separation.
 BindFBO(0x8CA8,opaque[0]);BindFBO(0x8CA9,waterRT[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,waterRT[0]);Use(surface)
 for n,v in [('modelMatrix',identity),('viewMatrix',cam['view']),('projectionMatrix',cam['projection'])]:matrix(surface,n,v)
 for n,v in [('size',(W,H)),('eye',cam['eye']),('sun',(-.45,.84,-.30)),('skyColor',(.40,.47,.49)),('uImpactOrigin',(0,0))]:vec(surface,n,v)
 for n,v in [('nearPlane',.075),('farPlane',480),('time',1.25),('fadeDistance',.65),('uImpactActive',0),('mist',0)]:scalar(surface,n,v)
 for n,t,unit in [('normalA',normalA,0),('normalB',normalB,1),('sceneColor',opaque[1],2),('sceneDepth',opaque[2],3),('uImpactNormals',blank,4)]:bindtex(surface,n,t,unit)
 attrs(surface,wb,[('position',3,0),('lakeCoord',2,12),('facetTone',1,20)],24);Draw(4,0,len(V)//6)
 BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,'fused',waterRT[1],0);bindtex(present,'sharp',waterRT[1],1);bindtex(present,'uiPicture',blank,2);scalar(present,'exposure',1.23);U1i(Loc(present,b'displayMode'),0);U1i(Loc(present,b'hasUI'),0);U1i(Loc(present,b'uiOnly'),0);attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
 out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);assert GetError()==0
 im=Image.fromarray(out[::-1,:,:3]).resize((640,480));draw=ImageDraw.Draw(im);draw.rectangle((0,0,640,25),fill=(15,20,23));draw.text((10,7),cam['label']+' / actual lake geometry and water shader; diagnostic ground shading',fill=(230,230,215));panels.append(im)
 im.save(ROOT/'docs/water-v28'/('lake-'+cam['label']+'.png'))
contact=Image.new('RGB',(640*3,480));
for i,im in enumerate(panels):contact.paste(im,(i*640,0))
contact.save(ROOT/'docs/water-v28/lake-contactsheet.png');print('Rendered 3 real-geometry water views; GL errors=0')
