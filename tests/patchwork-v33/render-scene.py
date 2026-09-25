# Actual game terrain + actual material/water GLSL. Controlled diagnostic lighting.
# Not a browser gameplay screenshot; vegetation/UI are deliberately absent.
import sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
P=pathlib.Path('/tmp/patchwork-v33');OUT=ROOT/'docs/patchwork-v33';data=json.load(open(P/'shaders.json'));fixture=json.load(open(P/'scene.json'))
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text();exec(src[src.index('Use=gl'):src.index('opaque=target();')]);exec(src[src.index('def bindtex'):src.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);","V=np.fromfile(P/'water.bin',np.float32);wb=buffer(V);"))
Mip=gl('glGenerateMipmap',None,[U]);UM3=gl('glUniformMatrix3fv',None,[I,I,U,ptr]);DrawElements=gl('glDrawElements',None,[U,I,U,ptr]);
def texture(path,srgb=True):
 a=np.ascontiguousarray(np.array(Image.open(ROOT/path).convert('RGBA'))[::-1]);t=tex(a);Bind(0x0DE1,t)
 if srgb:Tex(0x0DE1,0,0x8C43,a.shape[1],a.shape[0],0,0x1908,0x1401,a.ctypes.data)
 for axis in [0x2802,0x2803]:Param(0x0DE1,axis,0x8370)
 Mip(0x0DE1);Param(0x0DE1,0x2801,0x2703);return t
maps={n:texture('dist/textures/'+f+'.webp') for n,f in [('uRuralSoil','soil-loamy-earth-v9'),('uRuralPath','path-compacted-fine-gravel-v9'),('uRuralTurf','turf-short-patchy-meadow-v9'),('uShoreRock','shore-bedrock-v32'),('uShoreSilt','shore-silt-gravel-v32')]}
normalA=texture('dist/textures/v28/water-normal-a.png',False);normalB=texture('dist/textures/v28/water-normal-b.png',False);blank=tex(np.tile([128,128,0,0],(2,2,1)).astype(np.uint8),2,2)
cube=U();Gen(1,C.byref(cube));Bind(0x8513,cube)
for face in range(6):
 a=np.ones((16,16,4),np.uint8)*255;a[:,:,:3]=[123,138,141] if face!=3 else [78,87,78];Tex(0x8515+face,0,0x8058,16,16,0,0x1908,0x1401,a.ctypes.data)
for axis in [0x2802,0x2803,0x8072]:Param(0x8513,axis,0x812F)
Mip(0x8513);Param(0x8513,0x2801,0x2703);Param(0x8513,0x2800,0x2601)
programs={k:program(v['vertex'],v['fragment']) for k,v in data.items()};meshes=[]
for f in fixture['meshes']:
 attrsB={k:(buffer(np.fromfile(P/a['file'],np.float32)),a['size']) for k,a in f['attrs'].items()};ib=buffer(np.fromfile(P/f['index'],np.uint32));f['parcelTexture']=tex(np.fromfile(P/f['parcel'],np.uint8).reshape(256,256,4));meshes.append((f,attrsB,ib))
opaque=target();waterRT=target();identity=np.eye(4,dtype=np.float32).flatten();images=[]
present=program('''#version 300 es
precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}''','''#version 300 es
precision highp float;uniform sampler2D picture;in vec2 vUv;out vec4 c;void main(){vec3 rgb=texture(picture,vUv).rgb*1.10;rgb=rgb/(1.+rgb*.35);c=vec4(pow(rgb,vec3(1./2.2)),1.);}''')
for cam in fixture['cameras']:
 BindFBO(0x8D40,opaque[0]);Viewport(0,0,W,H);ClearColor(.31,.36,.38,1);Clear(0x4100);Enable(0x0B71);DepthFunc(0x0203);Disable(0x0B44)
 view=np.array(cam['view'],np.float32).reshape(4,4).T;light=view[:3,:3]@np.array([-.4,.8,-.3]);light=light/np.linalg.norm(light)
 for f,ab,ib in meshes:
  pr=programs[f['shaderKey']];Use(pr);model=np.eye(4,dtype=np.float32);model[0,3]=f['x']*64;model[2,3]=f['z']*64;mv=view@model;normal=np.ascontiguousarray(np.linalg.inv(mv[:3,:3]).T.T.flatten(),np.float32)
  matrix(pr,'modelMatrix',model.T.flatten());matrix(pr,'modelViewMatrix',mv.T.flatten());matrix(pr,'viewMatrix',cam['view']);matrix(pr,'projectionMatrix',cam['projection']);UM3(Loc(pr,b'normalMatrix'),1,0,normal.ctypes.data)
  for k,v in f['uniforms'].items():
   if isinstance(v,(float,int)):scalar(pr,k,float(v))
   elif isinstance(v,list) and v and isinstance(v[0],list):
    for i,vv in enumerate(v):
     if len(vv)==4:gl('glUniform4f',None,[I,F,F,F,F])(Loc(pr,f'{k}[{i}]'.encode()),*vv)
     else:vec(pr,f'{k}[{i}]',vv)
   elif isinstance(v,list) and len(v)==4:gl('glUniform4f',None,[I,F,F,F,F])(Loc(pr,k.encode()),*v)
   elif isinstance(v,list) and len(v) in [2,3]:vec(pr,k,v)
  for k,v in [('diffuse',(1,1,1)),('emissive',(0,0,0)),('ambientLightColor',(.66,.71,.70)),('directionalLights[0].direction',light),('directionalLights[0].color',(1.8,1.78,1.68)),('cameraPosition',cam['eye'])]:vec(pr,k,v)
  scalar(pr,'roughness',1);scalar(pr,'metalness',0);scalar(pr,'opacity',1);U1i(Loc(pr,b'isOrthographic'),0)
  for unit,(n,t) in enumerate(maps.items()):bindtex(pr,n,t,unit)
  bindtex(pr,'uPatchwork',f['parcelTexture'],5)
  for old in activeAttributes:DisableAttrib(old)
  activeAttributes.clear()
  for k,(b,size) in ab.items():
   loc=Attrib(pr,k.encode())
   if loc>=0:BindBuffer(0x8892,b);EnableAttrib(loc);AP(loc,size,0x1406,0,0,None);activeAttributes.append(loc)
  BindBuffer(0x8893,ib);DrawElements(4,f['count'],0x1405,None)
 BindFBO(0x8CA8,opaque[0]);BindFBO(0x8CA9,waterRT[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,waterRT[0]);pr=programs['surface'];Use(pr);Enable(0x8037);gl('glPolygonOffset',None,[F,F])(-1.,-1.)
 for n,v in [('modelMatrix',identity),('viewMatrix',cam['view']),('projectionMatrix',cam['projection'])]:matrix(pr,n,v)
 for n,v in [('size',(W,H)),('eye',cam['eye']),('sun',(-.45,.84,-.30)),('skyColor',(.4,.47,.49)),('uImpactOrigin',(0,0))]:vec(pr,n,v)
 for n,v in [('nearPlane',.01),('farPlane',480),('time',1.25),('fadeDistance',.65),('uImpactActive',0),('mist',0)]:scalar(pr,n,v)
 for n,t,u in [('normalA',normalA,0),('normalB',normalB,1),('sceneColor',opaque[1],2),('sceneDepth',opaque[2],3),('uImpactNormals',blank,4),('bottomSoil',maps['uRuralSoil'],6)]:bindtex(pr,n,t,u)
 Active(0x84C5);Bind(0x8513,cube);U1i(Loc(pr,b'environment'),5);attrs(pr,wb,[('position',3,0),('lakeCoord',2,12),('facetTone',1,20)],24);Draw(4,0,len(V)//6)
 Disable(0x8037);BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,'picture',waterRT[1],0);attrs(present,quad,[('position',3,0)],12);Draw(4,0,3);out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);assert GetError()==0
 im=Image.fromarray(out[::-1,:,:3]);ImageDraw.Draw(im).text((18,16),'V33 / '+cam['label']+' / actual terrain + material shaders / diagnostic lighting',fill='white');im.save(OUT/(cam['label']+'.png'));images.append(im)
print('Rendered actual ground material + water, three poses; GL errors = 0')
