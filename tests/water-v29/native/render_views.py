"""Native GLES diagnostic: actual lake, cloud/water/optics/splash shaders.
Terrain lighting is a small diagnostic fixture, not the full game renderer.
"""
import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[2]/'water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[3];P=pathlib.Path('/tmp/level10-v29');OUT=ROOT/'docs/water-v29';OUT.mkdir(exist_ok=True)
data=json.load(open(P/'shaders.json'));fixture=json.load(open(P/'lake-fixture.json'))
# Shared, audited GLES bindings/texture/buffer helpers from the previous fixture.
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text();exec(src[src.index('Use=gl'):src.index('opaque=target();')])
exec(src[src.index('def bindtex'):src.index('ground=program')])
U4f=gl('glUniform4f',None,[I,F,F,F,F]);U2fv=gl('glUniform2fv',None,[I,I,ptr]);Tex3D=gl('glTexImage3D',None,[U,I,I,I,I,I,I,U,U,ptr]);Mip=gl('glGenerateMipmap',None,[U]);DepthMask=gl('glDepthMask',None,[U]);Divisor=gl('glVertexAttribDivisor',None,[U,U]);DrawInstanced=gl('glDrawElementsInstanced',None,[U,I,U,ptr,I]);DrawArraysInstanced=gl('glDrawArraysInstanced',None,[U,I,I,I])
opaque=target();waterRT=target();half=target();identity=np.eye(4,dtype=np.float32).flatten()
blank=tex(np.tile(np.array([128,128,0,0],np.uint8),(2,2,1)),2,2)
def image_tex(path,flip=True):
 a=np.array(Image.open(ROOT/path).convert('RGBA'));t=tex(a[::-1] if flip else a,repeat=True);Bind(0x0DE1,t);Mip(0x0DE1);Param(0x0DE1,0x2801,0x2703);return t
normalA=image_tex('dist/textures/v28/water-normal-a.png');normalB=image_tex('dist/textures/v28/water-normal-b.png');atlas=image_tex('dist/textures/v28/water-caustics-atlas.png',False);soil=image_tex('dist/textures/soil-loamy-earth-v9.webp')
noise=U();Gen(1,C.byref(noise));Bind(0x806F,noise);n=np.fromfile(P/'cloud-noise.bin',np.uint8);Tex3D(0x806F,0,0x8058,64,64,64,0,0x1908,0x1401,n.ctypes.data)
for axis in [0x2802,0x2803,0x8072]:Param(0x806F,axis,0x2901)
Param(0x806F,0x2800,0x2601);Param(0x806F,0x2801,0x2703);Mip(0x806F)
sky=program(data['sky']['vertex'],data['sky']['fragment'])
def sky_draw(cam,w,h):
 Use(sky);Viewport(0,0,w,h);Disable(0x0B71);DepthMask(0);matrix(sky,'inverseProjection',cam['inverseProjection']);matrix(sky,'cameraWorld',cam['world']);
 Active(0x84C0);Bind(0x806F,noise);U1i(Loc(sky,b'uCloudNoise'),0);bindtex(sky,'uSkyWallpaper',blank,1);bindtex(sky,'uFogVolume',blank,2)
 for name,value in [('uCloudFogColor',(.40,.47,.49)),('uCloudCamera',(-103,0,32)),('uCloudOrigin',(0,0)),('uStageEvent',(0,0,0)),('uFogViewport',(w,h)),('uFogTileSize',(1,1))]:vec(sky,name,value)
 for name,value in [('uCloudTime',1.25),('uCloudMist',0),('uCloudRain',0),('uFogVolumeAmount',0)]:scalar(sky,name,value)
 U4f(Loc(sky,b'uSkyEvent'),0,0,0,0);U1i(Loc(sky,b'uCloudSteps'),32);march=np.array(fixture['cloudMarch'],np.float32);U2fv(Loc(sky,b'uCloudMarch[0]'),48,march.ctypes.data)
 attrs(sky,quad,[('position',3,0)],12);Draw(4,0,3);DepthMask(1)
cube=U();Gen(1,C.byref(cube));Bind(0x8513,cube)
for f in range(6):Tex(0x8515+f,0,0x881A,64,64,0,0x1908,0x1406,None)
for axis in [0x2802,0x2803,0x8072]:Param(0x8513,axis,0x812F)
Param(0x8513,0x2801,0x2703);Param(0x8513,0x2800,0x2601)
cubeFBO=U();GenFBO(1,C.byref(cubeFBO));BindFBO(0x8D40,cubeFBO)
for f,c in enumerate(fixture['cube']):FBOTexture(0x8D40,0x8CE0,0x8515+f,cube,0);sky_draw(c,64,64)
Bind(0x8513,cube);Mip(0x8513)
ground=program('''#version 300 es
precision highp float;in vec3 position;uniform mat4 projection,view;out vec3 worldP;void main(){worldP=position;gl_Position=projection*view*vec4(position,1.);}''','''#version 300 es
precision highp float;uniform float level,time;uniform sampler2D atlas,soil;in vec3 worldP;out vec4 c;
vec2 causticUV(vec2 p,float frame){vec2 tile=vec2(mod(frame,4.),floor(frame/4.));return (tile+(fract(p)*255.+.5)/256.)/4.;}
void main(){vec3 n=normalize(cross(dFdx(worldP),dFdy(worldP)));if(n.y<0.)n=-n;float d=max(0.,level-worldP.y);vec3 color=pow(texture(soil,worldP.xz*.25).rgb,vec3(2.2));
float frame=mod(time*8.,16.);vec2 p=(worldP.xz-vec2(-103,32))*.27;float ca=mix(texture(atlas,causticUV(p,floor(frame))).r,texture(atlas,causticUV(p,mod(floor(frame)+1.,16.))).r,fract(frame));color*=1.+ca*.72*exp(-d*.19)*smoothstep(0.,.18,d);color*=.65+.35*max(0.,dot(n,normalize(vec3(-.4,.8,-.3))));c=vec4(color,1.);}''')
surface=program(data['two-sided-surface']['vertex'],data['two-sided-surface']['fragment']);fused=program(data['fused-absorb-lens-dof']['vertex'],data['fused-absorb-lens-dof']['fragment']);present=program(data['tone-resolve']['vertex'],data['tone-resolve']['fragment'])
splashes=[]
for f in fixture['splashes']:
 p=program(data[f['name']]['vertex'],data[f['name']]['fragment']);ab={}
 for name,a in f['attrs'].items():ab[name]=(buffer(np.fromfile(P/a['file'],np.float32)),a)
 ib=buffer(np.fromfile(P/f['index'],np.uint32)) if f['index'] else None;splashes.append((p,ab,ib,f))
def splash_draw(cam,age):
 for p,ab,ib,f in splashes:
  Use(p)
  for name,v in [('modelMatrix',identity),('modelViewMatrix',cam['view']),('viewMatrix',cam['view']),('projectionMatrix',cam['projection'])]:matrix(p,name,v)
  for name,v in [('cameraPosition',cam['eye']),('uLightDirection',(-.4,.8,.4)),('uLightColor',(1,1,1))]:vec(p,name,v)
  for name,v in [('uTime',age),('uRoughness',.22),('uLightIntensity',1),('uAmbientIntensity',1)]:scalar(p,name,v)
  for a in activeAttributes:DisableAttrib(a);Divisor(a,0)
  activeAttributes.clear()
  for name,(b,a) in ab.items():
   loc=Attrib(p,name.encode())
   if loc>=0:BindBuffer(0x8892,b);EnableAttrib(loc);AP(loc,a['size'],0x1406,0,0,None);Divisor(loc,int(a['instanced']));activeAttributes.append(loc)
  if ib:BindBuffer(0x8893,ib);DrawInstanced(4,f['count'],0x1405,None,f['instances'])
  else:DrawArraysInstanced(4,0,f['count'],f['instances'])
  for a in activeAttributes:Divisor(a,0)
images=[];raws={}
for cam in fixture['cameras']:
 ages=[.16,.40,.85] if cam['label']=='splash-above' else [.40]
 for age in ages:
  BindFBO(0x8D40,opaque[0]);Viewport(0,0,W,H);ClearColor(.4,.47,.49,1);Clear(0x4100);Disable(0x0B44);sky_draw(cam,W,H);Enable(0x0B71);DepthFunc(0x0203)
  Use(ground);matrix(ground,'projection',cam['projection']);matrix(ground,'view',cam['view']);scalar(ground,'level',fixture['level']);scalar(ground,'time',1.25);bindtex(ground,'atlas',atlas,0);bindtex(ground,'soil',soil,1);attrs(ground,gb,[('position',3,0)],12);Draw(4,0,len(G)//3)
  if cam['label'].startswith('splash'):splash_draw(cam,age)
  BindFBO(0x8CA8,opaque[0]);BindFBO(0x8CA9,waterRT[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,waterRT[0]);Use(surface)
  for n,v in [('modelMatrix',identity),('viewMatrix',cam['view']),('projectionMatrix',cam['projection']),('inverseProjection',cam['inverseProjection']),('cameraWorld',cam['world'])]:matrix(surface,n,v)
  for n,v in [('size',(W,H)),('eye',cam['eye']),('sun',(-.45,.84,-.30)),('skyColor',(.40,.47,.49)),('uImpactOrigin',(0,0))]:vec(surface,n,v)
  for n,v in [('nearPlane',.01),('farPlane',480),('time',1.25),('fadeDistance',.65),('uImpactActive',0),('mist',0),('environmentReady',1)]:scalar(surface,n,v)
  for n,t,unit in [('normalA',normalA,0),('normalB',normalB,1),('sceneColor',opaque[1],2),('sceneDepth',opaque[2],3),('uImpactNormals',blank,4)]:bindtex(surface,n,t,unit)
  Active(0x84C5);Bind(0x8513,cube);U1i(Loc(surface,b'environment'),5);attrs(surface,wb,[('position',3,0),('lakeCoord',2,12),('facetTone',1,20)],24);Draw(4,0,len(V)//6)
  BindFBO(0x8D40,half[0]);Viewport(0,0,W//2,H//2);Disable(0x0B71);Use(fused)
  for n,t,u in [('picture',waterRT[1],0),('depth',waterRT[2],1),('wetHeight',blank,2),('washNoise',normalA,3)]:bindtex(fused,n,t,u)
  for n,v in [('inverseProjection',cam['inverseProjection']),('cameraWorld',cam['world'])]:matrix(fused,n,v)
  for n,v in [('resolution',(W,H)),('fieldSize',(256,192)),('eye',cam['eye']),('screenLight',(-.42,.67,.83))]:vec(fused,n,v)
  for n,v in [('nearPlane',.01),('farPlane',480),('time',1.25),('level',fixture['level']),('waterActive',1),('wet',0),('washWeight',0),('exitFlash',0),('exiting',0),('aperture',0),('focusDist',15),('flareStrength',0)]:scalar(fused,n,v)
  attrs(fused,quad,[('position',3,0)],12);Draw(4,0,3)
  # Read the true half-resolution region; upload it into a matching 480x360 texture.
  hdata=np.empty((H//2,W//2,4),np.uint8);Read(0,0,W//2,H//2,0x1908,0x1401,hdata.ctypes.data);halfColor=tex(hdata,w=W//2,h=H//2)
  BindFBO(0x8D40,0);Viewport(0,0,W,H);Use(present);bindtex(present,'fused',halfColor,0);bindtex(present,'sharp',waterRT[1],1);bindtex(present,'uiPicture',blank,2);scalar(present,'exposure',1.23);U1i(Loc(present,b'displayMode'),0);U1i(Loc(present,b'hasUI'),0);U1i(Loc(present,b'uiOnly'),0);attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
  out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);assert GetError()==0
  label=cam['label']+('-'+str(age) if cam['label'].startswith('splash') else '');raws[label]=out[::-1,:,:3].copy()
  im=Image.fromarray(raws[label]);im.save(OUT/(label+'.png'));im=im.resize((480,360));d=ImageDraw.Draw(im);d.rectangle((0,0,480,24),fill=(12,16,18));d.text((8,6),label+' / native shader diagnostic',fill=(230,230,215));images.append(im)
contact=Image.new('RGB',(480*3,360*((len(images)+2)//3)))
for i,im in enumerate(images):contact.paste(im,((i%3)*480,(i//3)*360))
contact.save(OUT/'water-contactsheet.png');print('Rendered',len(images),'native geometry/optical/splash views; GL errors=0')
