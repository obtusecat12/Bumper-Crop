"""Real production meshes/shaders via software GLES. Not a browser/FPS test."""
import sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/almond-v46')
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text()
exec(src[src.index('Use=gl'):src.index('opaque=target();')])
exec(src[src.index('def bindtex'):src.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);",''))
UM3=gl('glUniformMatrix3fv',None,[I,I,U,ptr]);U4f=gl('glUniform4f',None,[I,F,F,F,F]);DrawElements=gl('glDrawElements',None,[U,I,U,ptr]);Mip=gl('glGenerateMipmap',None,[U]);DepthMask=gl('glDepthMask',None,[U]);
fixture=json.load(open(P/'fixture.json'));shaders=json.load(open(P/'shaders.json'));programs={k:program(s['vertex'],s['fragment']) for k,s in shaders.items()}
textures=[]
for t in fixture['textures']:
 if t.get('cube'):
  ident=U();Gen(1,C.byref(ident));ident=ident.value;Bind(0x8513,ident)
  for i,f in enumerate(t['faces']):
   a=np.fromfile(P/f['file'],np.uint8);Tex(0x8515+i,0,0x8058,f['width'],f['height'],0,0x1908,0x1401,a.ctypes.data)
  Mip(0x8513);Param(0x8513,0x2801,0x2703);Param(0x8513,0x2800,0x2601)
  for axis in [0x2802,0x2803,0x8072]:Param(0x8513,axis,0x812F)
  textures.append((ident,0x8513));continue
 a=np.fromfile(P/t['file'],np.uint8).reshape(t['height'],t['width'],4);a=np.ascontiguousarray(a[::-1] if t['flipY'] else a);ident=tex(a);Bind(0x0DE1,ident)
 if t['srgb']:Tex(0x0DE1,0,0x8C43,t['width'],t['height'],0,0x1908,0x1401,a.ctypes.data)
 if t['mip']:Mip(0x0DE1);Param(0x0DE1,0x2801,0x2703)
 textures.append((ident,0x0DE1))
def hdr():
 t=target();Bind(0x0DE1,t[1]);Tex(0x0DE1,0,0x881A,W,H,0,0x1908,0x140B,None);return t
a,b=hdr(),hdr()
quadVS='#version 300 es\nprecision highp float;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}'
background=program(quadVS,'''#version 300 es
precision highp float;in vec2 uv;out vec4 c;
void main(){float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);vec3 sky=mix(vec3(.29,.32,.34),vec3(.43,.46,.46),uv.y);vec3 ground=vec3(.21,.16,.078)*(.82+grain*.25);vec3 col=mix(ground,sky,smoothstep(.38,.40,uv.y));float post=step(.91,fract(uv.x*7.+.04))*(1.-smoothstep(.39,.58,uv.y))*smoothstep(.25,.29,uv.y);col=mix(col,vec3(.071,.08,.055),post*.7);c=vec4(col,1.);}''')
present=program(quadVS,'''#version 300 es
precision highp float;uniform sampler2D picture;in vec2 uv;out vec4 c;
vec3 encode(vec3 x){return mix(x*12.92,1.055*pow(max(x,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),x));}
vec3 aces(vec3 x){mat3 a=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777)),b=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));x=a*(x*1.23/.6);x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.4329510)+.238081);return clamp(b*x,0.,1.);}
void main(){c=vec4(encode(aces(texture(picture,uv).rgb)),1.);}''')
def uniform(p,k,v):
 if isinstance(v,bool):U1i(Loc(p,k.encode()),int(v))
 elif isinstance(v,(float,int)):scalar(p,k,v)
 elif isinstance(v,list):
  if len(v)==4:U4f(Loc(p,k.encode()),*v)
  elif len(v) in [2,3]:vec(p,k,v)
  elif len(v)==9:
   a=np.ascontiguousarray(v,np.float32);UM3(Loc(p,k.encode()),1,0,a.ctypes.data)
def bindmesh(p,m):
 for at in activeAttributes:DisableAttrib(at)
 activeAttributes.clear()
 for k,a in m['attributes'].items():
  loc=Attrib(p,k.encode())
  if loc<0:continue
  data=np.fromfile(P/a['file'],np.float32);v=buffer(data);BindBuffer(0x8892,v);EnableAttrib(loc);AP(loc,a['size'],0x1406,0,0,None);activeAttributes.append(loc)
 if m['index']:
  ix=buffer(np.fromfile(P/m['index'],np.uint32));BindBuffer(0x8893,ix);DrawElements(4,m['count'],0x1405,None)
 else:Draw(4,0,m['count'])
# Optional actual V45 scene capture behind the production asset; diagnostic
# compositing only, not claimed to be a browser screenshot.
sceneBG=None
if '--scene' in sys.argv:
 im=Image.open(ROOT/'docs/rural-power-v45/pole-close.webp').convert('RGBA').resize((W,H));pixels=np.array(im)[::-1];sceneBG=tex(pixels)
 background=program(quadVS,'''#version 300 es
precision highp float;uniform sampler2D sceneBG;in vec2 uv;out vec4 c;
void main(){vec3 a=texture(sceneBG,uv).rgb;c=vec4(pow(a,vec3(2.2))*.65,1.);}''')
panels=[]
for case in fixture['cases']:
 BindFBO(0x8D40,a[0]);Viewport(0,0,W,H);ClearColor(.3,.3,.3,1);Clear(0x4100);Disable(0x0B71);Use(background);
 if sceneBG:bindtex(background,'sceneBG',sceneBG,0)
 attrs(background,quad,[('position',3,0)],12);Draw(4,0,3)
 for m in case['meshes']:
  if m['key']=='glass':
   BindFBO(0x8CA8,a[0]);BindFBO(0x8CA9,b[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,b[0])
  Enable(0x0B71);DepthFunc(0x0203);Enable(0x0B44);Disable(0x0BE2);p=programs[m['key']];s=shaders[m['key']];Use(p)
  model=np.array(m['model'],np.float32).reshape(4,4).T;view=np.array(case['view'],np.float32).reshape(4,4).T;mv=view@model;normal=np.ascontiguousarray(np.linalg.inv(mv[:3,:3]).T.T.flatten(),np.float32)
  matrix(p,'modelMatrix',m['model']);matrix(p,'modelViewMatrix',mv.T.flatten());matrix(p,'projectionMatrix',case['projection']);matrix(p,'viewMatrix',case['view']);UM3(Loc(p,b'normalMatrix'),1,0,normal.ctypes.data)
  for k,v in s['uniforms'].items():uniform(p,k,v)
  for k,v in {'diffuse':[1,1,1],'emissive':[0,0,0],'ambientLightColor':[0,0,0],'cameraPosition':case['eye'],'hemisphereLights[0].direction':[0,1,0],'hemisphereLights[0].skyColor':[1.006,1.122,1.134],'hemisphereLights[0].groundColor':[.294,.204,.085],'directionalLights[0].direction':[-.452,.64,.678],'directionalLights[0].color':[1.20,1.24,1.13],'directionalLights[1].direction':[.93,.117,-.348],'directionalLights[1].color':[.126,.155,.174]}.items():vec(p,k,v)
  U1i(Loc(p,b'isOrthographic'),0)
  for unit,(name,t) in enumerate(s['textures'].items()):
   ident,targetType=textures[t];Active(0x84C0+unit);Bind(targetType,ident);U1i(Loc(p,name.encode()),unit)
  if m['key']=='glass':
   bindtex(p,'sceneColor',a[1],12);vec(p,'resolution',[W,H]);vec(p,'projectionScale',[case['projection'][0]*.5,case['projection'][5]*.5])
   for k,v in case['glass'].items():uniform(p,k,v)
  bindmesh(p,m)
 outRT=b if case['glass'] else a
 BindFBO(0x8D40,0);Disable(0x0B71);Disable(0x0B44);Use(present);bindtex(present,'picture',outRT[1],0);attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
 pixels=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,pixels.ctypes.data);assert GetError()==0
 im=Image.fromarray(pixels[::-1,:,:3]);im.save(P/(case['label']+'.png'));panel=im.resize((480,360));d=ImageDraw.Draw(panel);d.rectangle((0,0,480,22),fill=(19,23,22));d.text((10,5),case['label']+' / production asset, software GLES',fill='white');panels.append(panel);print('Rendered',case['label'],flush=True)
contact=Image.new('RGB',(480*4,360*2),(23,26,24))
for i,im in enumerate(panels):contact.paste(im,(i%4*480,i//4*360))
contact.save(P/('scene-contact.png' if sceneBG else 'contact.png'));print('GL errors = 0')
