import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1])
fixture=json.load(open(P/'fullscene.json'));captureW=960;captureH=round(captureW/fixture['cameras'][0].get('aspect',1000/681))
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
exec((ROOT/'tests/water-v28/native/gl_native.py').read_text().split("if __name__==")[0].replace('960',str(captureW)).replace('720',str(captureH)))
from PIL import Image,ImageDraw
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text();exec(src[src.index('Use=gl'):src.index('opaque=target();')].replace('W,H=960,720',f'W,H={captureW},{captureH}'));exec(src[src.index('def bindtex'):src.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);",''))
BlendFunc=gl('glBlendFunc',None,[U,U]);DepthMask=gl('glDepthMask',None,[U]);
GenRB=gl('glGenRenderbuffers',None,[I,C.POINTER(U)]);BindRB=gl('glBindRenderbuffer',None,[U,U]);StorageMS=gl('glRenderbufferStorageMultisample',None,[U,I,U,I,I]);AttachRB=gl('glFramebufferRenderbuffer',None,[U,U,U,U]);
Mip=gl('glGenerateMipmap',None,[U]);UM3=gl('glUniformMatrix3fv',None,[I,I,U,ptr]);U4f=gl('glUniform4f',None,[I,F,F,F,F]);DrawElements=gl('glDrawElements',None,[U,I,U,ptr]);DrawElementsInstanced=gl('glDrawElementsInstanced',None,[U,I,U,ptr,I]);DrawArraysInstanced=gl('glDrawArraysInstanced',None,[U,I,I,I]);Divisor=gl('glVertexAttribDivisor',None,[U,U]);Tex3D=gl('glTexImage3D',None,[U,I,I,I,I,I,I,U,U,ptr]);
fixture=json.load(open(P/'fullscene.json'));data=json.load(open(P/'fullscene-shaders.json'))
textures=[]
textureTargets=[]
for t in fixture['textures']:
 if t.get('depth'):
  a=np.fromfile(P/t['file'],np.uint8);ident=U();Gen(1,C.byref(ident));ident=ident.value;targetType=0x8C1A;Bind(targetType,ident);Tex3D(targetType,0,0x8C43 if t['srgb'] else 0x8058,t['width'],t['height'],t['depth'],0,0x1908,0x1401,a.ctypes.data)
 else:
  a=np.fromfile(P/t['file'],np.float32 if t.get('type')==1015 else np.uint8);a=np.repeat(a.reshape(-1,1),4,axis=1) if t.get('format')==1028 else a;a=a.reshape(t['height'],t['width'],4);a=np.ascontiguousarray(a[::-1] if t['flipY'] else a);ident=tex(a);targetType=0x0DE1;Bind(targetType,ident)
  if t.get('type')==1015:Tex(targetType,0,0x8814,a.shape[1],a.shape[0],0,0x1908,0x1406,a.ctypes.data)
  if t['srgb']:Tex(targetType,0,0x8C43,a.shape[1],a.shape[0],0,0x1908,0x1401,a.ctypes.data)
 for axis,key in [(0x2802,'wrapS'),(0x2803,'wrapT')]:Param(targetType,axis,{1000:0x2901,1001:0x812F,1002:0x8370}[t.get(key,1001)])
 Param(targetType,0x2800,0x2600 if t.get("magFilter")==1003 else 0x2601);Param(targetType,0x2801,0x2600 if t.get("minFilter")==1003 else 0x2601)
 if t.get('mipmaps'):
  for level,m in enumerate(t['mipmaps']):
   a=np.fromfile(P/m['file'],np.uint8)
   if m.get('depth'):Tex3D(targetType,level,0x8C43 if t['srgb'] else 0x8058,m['width'],m['height'],m['depth'],0,0x1908,0x1401,a.ctypes.data)
   else:
    a=a.reshape(m['height'],m['width'],4);a=np.ascontiguousarray(a[::-1] if t['flipY'] else a);Tex(targetType,level,0x8C43 if t['srgb'] else 0x8058,m['width'],m['height'],0,0x1908,0x1401,a.ctypes.data)
  Param(targetType,0x2801,0x2703)
 elif t['mip']:Mip(targetType);Param(targetType,0x2801,0x2703)
 if b'GL_EXT_texture_filter_anisotropic' in GetString(0x1F03) and (t['mip'] or t.get('mipmaps')):Param(targetType,0x84FE,4)
 textures.append(ident);textureTargets.append(targetType)

groundLayers=U();Gen(1,C.byref(groundLayers));Bind(0x8C1A,groundLayers)
layerNames=['soil-loamy-earth-v9','path-compacted-fine-gravel-v9','turf-short-patchy-meadow-v9','shore-bedrock-v32','shore-silt-gravel-v32']
layerPixels=np.ascontiguousarray(np.stack([np.array(Image.open(ROOT/('dist/textures/'+f+'.webp')).convert('RGBA').resize((512,512))) for f in layerNames]))
Tex3D(0x8C1A,0,0x8C43,512,512,5,0,0x1908,0x1401,layerPixels.ctypes.data)
for axis in [0x2802,0x2803]:Param(0x8C1A,axis,0x8370)
Mip(0x8C1A);Param(0x8C1A,0x2801,0x2703);Param(0x8C1A,0x2800,0x2601)
programs={k:program(v['vertex'],v['fragment']) for k,v in data.items()};print('linked',len(programs),flush=True)
meshes=[]
for f in fixture['meshes']:
 ab={k:(buffer(np.fromfile(P/a['file'],np.float32)),a['size'],a.get('divisor',0)) for k,a in f['attrs'].items()};ib=buffer(np.fromfile(P/f['index'],np.uint32)) if f['index'] else None;meshes.append((f,ab,ib))
opaque=target();identity=np.eye(4,dtype=np.float32).flatten()
# Match the game's HDR opaque target and verify colour + depth MSAA resolve.
Bind(0x0DE1,opaque[1]);Tex(0x0DE1,0,0x881A,W,H,0,0x1908,0x140B,None)
msaa=U();GenFBO(1,C.byref(msaa));BindFBO(0x8D40,msaa)
for attachment,format in [(0x8CE0,0x881A),(0x8D00,0x81A6)]:
 rb=U();GenRB(1,C.byref(rb));BindRB(0x8D41,rb);StorageMS(0x8D41,4,format,W,H);AttachRB(0x8D40,attachment,0x8D41,rb)
assert CheckFBO(0x8D40)==0x8CD5
present=program("""#version 300 es
precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}""","""#version 300 es
precision highp float;uniform highp sampler2D picture,depthPicture;uniform float exposure,clinic;uniform vec3 sky,eye;uniform mat4 inverseViewProjection;in vec2 vUv;out vec4 c;
vec3 aces(vec3 v){mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777);mat3 b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);v=a*(v*exposure/.6);v=(v*(v+.0245786)-.000090537)/(v*(.983729*v+.4329510)+.238081);return clamp(b*v,0.,1.);}
void main(){vec4 p=inverseViewProjection*vec4(vUv*2.-1.,1.,1.);vec3 rd=normalize(p.xyz/p.w-eye);float e=smoothstep(0.,.85,max(rd.y,0.));vec3 refClear=mix(sky*1.65+vec3(.035,.023,.012),sky*.76,e);vec3 skyColor=mix(sky*mix(1.055,.965,e),refClear,clinic);vec3 rgb=texture(depthPicture,vUv).r>.99999?skyColor:aces(texture(picture,vUv).rgb);rgb=mix(rgb*12.92,1.055*pow(rgb,vec3(1./2.4))-.055,step(vec3(.0031308),rgb));c=vec4(rgb,1.);}""")

def clearattrs():
 for old in activeAttributes:DisableAttrib(old);Divisor(old,0)
 activeAttributes.clear()
def uniform(pr,k,v):
 if k=='uStaticStart':U1i(Loc(pr,k.encode()),int(v))
 elif isinstance(v,bool):U1i(Loc(pr,k.encode()),int(v))
 elif isinstance(v,(float,int)):scalar(pr,k,float(v))
 elif isinstance(v,list) and v and isinstance(v[0],list):
  for i,vv in enumerate(v):uniform(pr,f'{k}[{i}]',vv)
 elif isinstance(v,list):
  if len(v)==4:U4f(Loc(pr,k.encode()),*v)
  elif len(v) in [2,3]:vec(pr,k,v)
  elif len(v)==16:matrix(pr,k,v)
  elif len(v)==9:a=np.ascontiguousarray(v,np.float32);UM3(Loc(pr,k.encode()),1,0,a.ctypes.data)

Storage=gl('glRenderbufferStorage',None,[U,U,I,I]);shadowSize=512
shadowFBO=U();GenFBO(1,C.byref(shadowFBO));BindFBO(0x8D40,shadowFBO)
rb=U();GenRB(1,C.byref(rb));BindRB(0x8D41,rb);Storage(0x8D41,0x81A6,shadowSize,shadowSize);AttachRB(0x8D40,0x8D00,0x8D41,rb)
shadowProgram=program("""#version 300 es
precision highp float;in vec3 position;uniform mat4 modelMatrix,lightMatrix;out vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=lightMatrix*p;}""","""#version 300 es
precision highp float;in vec3 world;uniform vec3 lamp;uniform float farZ;out vec4 c;void main(){c=vec4(length(world-lamp)/farZ);}""")
def geometry(pr,f,ab,ib):
 clearattrs()
 for k,(b,size,divisor) in ab.items():
  loc=Attrib(pr,k.encode())
  if loc<0:continue
  BindBuffer(0x8892,b);EnableAttrib(loc);AP(loc,size,0x1406,0,0,None);Divisor(loc,divisor);activeAttributes.append(loc)
 if ib:
  BindBuffer(0x8893,ib)
  if f.get('instances',0):DrawElementsInstanced(4,f['count'],0x1405,None,f['instances'])
  else:DrawElements(4,f['count'],0x1405,None)
 else:Draw(4,0,f['count'])
cubes=[]
for j,lamp in enumerate(fixture['pointLights']):
 ident=U();Gen(1,C.byref(ident));Bind(0x8513,ident)
 for face in range(6):Tex(0x8515+face,0,0x8814,shadowSize,shadowSize,0,0x1908,0x1406,None)
 for axis in [0x2802,0x2803,0x8072]:Param(0x8513,axis,0x812F)
 Param(0x8513,0x2801,0x2601);Param(0x8513,0x2800,0x2601);cubes.append(ident.value)
 for face in range(6):
  BindFBO(0x8D40,shadowFBO);FBOTexture(0x8D40,0x8CE0,0x8515+face,ident,0);assert CheckFBO(0x8D40)==0x8CD5
  Viewport(0,0,shadowSize,shadowSize);ClearColor(1,1,1,1);Clear(0x4100);Enable(0x0B71);DepthMask(1);Disable(0x0B44);Disable(0x0BE2);Use(shadowProgram)
  matrix(shadowProgram,'lightMatrix',lamp['views'][face]);vec(shadowProgram,'lamp',lamp['p']);scalar(shadowProgram,'farZ',lamp['range'])
  for f,ab,ib in meshes:
   if not f.get('castShadow'):continue
   matrix(shadowProgram,'modelMatrix',f['model']);geometry(shadowProgram,f,ab,ib)
print('four real geometry point-light shadow cubemaps',flush=True)
mirrorTarget=target();finalTarget=target()
for rt in [mirrorTarget,finalTarget]:Bind(0x0DE1,rt[1]);Tex(0x0DE1,0,0x881A,W,H,0,0x1908,0x140B,None)

def drawscene(cam,fbo,water=False,reflect=False):
 BindFBO(0x8D40,fbo);Viewport(0,0,W,H);ClearColor(*fixture['lighting']['sky'],1);Clear(0x4100);Enable(0x0B71);DepthMask(1);DepthFunc(0x0203);Disable(0x0B44)
 view=np.array(cam['view'],np.float32).reshape(4,4).T
 for f,ab,ib in meshes:
  if not water and 'sceneColor' in data[f['shaderKey']]['textures']:continue
  if not water and ('Clear warm spring' in f['name'] or f['material'] in ['Refractive irregular water film','Clear narrow gravity rivulets','Local impact foam and concentric waves','4096 refractive impact beads','Clear flowing creek / tangent flowmap and pebble foam']):continue
  if reflect and 'Integrated wet ground' in f['material']:continue
  pr=programs[f['shaderKey']];sh=data[f['shaderKey']];Use(pr);model=np.array(f['model'],np.float32).reshape(4,4).T;mv=view@model;normal=np.ascontiguousarray(np.linalg.inv(mv[:3,:3]).T.T.flatten(),np.float32)
  matrix(pr,'modelMatrix',f['model']);matrix(pr,'modelViewMatrix',mv.T.flatten());matrix(pr,'viewMatrix',cam['view']);matrix(pr,'projectionMatrix',cam['projection']);UM3(Loc(pr,b'normalMatrix'),1,0,normal.ctypes.data)
  for k,v in sh['uniforms'].items():uniform(pr,k,v)
  uniform(pr,'clipPlaneNative',[0,1,0,.018] if reflect else [0,0,0,1]);vec(pr,'cameraPosition',cam['eye']);vec(pr,'eye',cam['eye']);vec(pr,'resolution',[W,H]);vec(pr,'nearFar',[.08,40]);vec(pr,'ambientLightColor',fixture['lighting']['ambient']);U1i(Loc(pr,b'isOrthographic'),0)
  for i,light in enumerate(fixture['pointLights']):
   vec(pr,f'pointLights[{i}].position',(view@np.array(light['p']+[1]))[:3]);vec(pr,f'pointLights[{i}].color',light['c']);scalar(pr,f'pointLights[{i}].distance',light['range']);scalar(pr,f'pointLights[{i}].decay',2)
   vec(pr,f'shadowLightPos[{i}]',light['p']);scalar(pr,f'shadowLightFar[{i}]',light['range']);Active(0x84C0+10+i);Bind(0x8513,cubes[i]);U1i(Loc(pr,f'shadowCube{i}'.encode()),10+i)
  for unit,(name,t) in enumerate(sh['textures'].items(),1):
   if isinstance(t,dict):
    ident={'reflection':mirrorTarget[1],'refraction':opaque[1],'sceneDepth':opaque[2]}[t['target']];targetType=0x0DE1
   else:ident=textures[t];targetType=textureTargets[t]
   Active(0x84C0+unit);Bind(targetType,ident);U1i(Loc(pr,name.encode()),unit)
  DepthMask(int(f.get('depthWrite',True)))
  if f.get('transparent'):Enable(0x0BE2);BlendFunc(0x0302,0x0303)
  else:Disable(0x0BE2)
  geometry(pr,f,ab,ib)
 DepthMask(1);Disable(0x0BE2)
cam=fixture['cameras'][0]
drawscene(cam,opaque[0]);drawscene(fixture['mirror'],mirrorTarget[0],reflect=True);drawscene(cam,msaa,water=True)
BindFBO(0x8CA8,msaa);BindFBO(0x8CA9,finalTarget[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,'picture',finalTarget[1],0);bindtex(present,'depthPicture',finalTarget[2],1);scalar(present,'exposure',fixture['lighting']['exposure']);vec(present,'sky',fixture['lighting']['sky']);scalar(present,'clinic',0);vec(present,'eye',cam['eye']);matrix(present,'inverseViewProjection',cam['inverseViewProjection']);clearattrs();attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)

# Reuse the actual game's fused screen-space optics on the rendered bath frame.
if cam['label']=='bath-water':
 O=P.parent/'optics';opt=json.load(open(O/'optics.json'));fx=program(opt['vertex'],opt['fragment']);fusedTarget=target();resolvedTarget=target()
 field=np.fromfile(O/'lens.bin',np.uint8).reshape(opt['height'],opt['width'],4);fieldTex=tex(field)
 blankTex=tex(np.tile(np.array([128,128,0,0],np.uint8),(2,2,1)));zeroTex=tex(np.zeros((2,2,4),np.uint8))
 BindFBO(0x8D40,fusedTarget[0]);Viewport(0,0,W,H);Disable(0x0B71);Use(fx)
 for unit,(name,tid) in enumerate([('picture',finalTarget[1]),('depth',finalTarget[2]),('cocField',zeroTex),('wetHeight',fieldTex),('bubbleField',blankTex),('washNoise',blankTex),('bottomSoil',blankTex)]):bindtex(fx,name,tid,unit)
 invP=np.linalg.inv(np.array(cam['projection'],np.float32).reshape(4,4).T).T.flatten();world=np.linalg.inv(np.array(cam['view'],np.float32).reshape(4,4).T).T.flatten()
 matrix(fx,'inverseProjection',invP);matrix(fx,'cameraWorld',world);vec(fx,'resolution',(W,H));vec(fx,'fieldSize',(opt['width'],opt['height']));vec(fx,'eye',cam['eye']);vec(fx,'screenLight',(-.42,.67,.83));vec(fx,'flareSun',(0,0))
 for name,value in [('wet',1),('bubbleWeight',0),('waterActive',0),('washWeight',0),('washAge',9),('exiting',1),('time',2.5),('level',-10),('exitFlash',0),('flareStrength',0),('flareAspect',1.5),('bathSteam',1),('nearPlane',.08),('farPlane',40),('focusDist',2.58),('focalMM',2.478),('fNumber',2.8),('sensorHeight',3.6),('dofEnabled',0)]:scalar(fx,name,value)
 clearattrs();attrs(fx,quad,[('position',3,0)],12);Draw(4,0,3)
 comp=program(opt['vertex'],"#version 300 es\nprecision highp float;uniform sampler2D sharp,fused;in vec2 uv;out vec4 c;void main(){vec4 f=texture(fused,uv);c=vec4(mix(texture(sharp,uv).rgb,f.rgb,f.a),1.);}")
 BindFBO(0x8D40,resolvedTarget[0]);Use(comp);bindtex(comp,'sharp',finalTarget[1],0);bindtex(comp,'fused',fusedTarget[1],1);clearattrs();attrs(comp,quad,[('position',3,0)],12);Draw(4,0,3)
 BindFBO(0x8D40,0);Use(present);bindtex(present,'picture',resolvedTarget[1],0);bindtex(present,'depthPicture',finalTarget[2],1);scalar(present,'exposure',fixture['lighting']['exposure']);vec(present,'sky',fixture['lighting']['sky']);scalar(present,'clinic',0);vec(present,'eye',cam['eye']);matrix(present,'inverseViewProjection',cam['inverseViewProjection']);clearattrs();attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)

out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);err=GetError();assert err==0,hex(err)
im=Image.fromarray(out[::-1,:,:3]);d=ImageDraw.Draw(im);d.rectangle((0,0,W,27),fill=(12,16,14));d.text((12,8),f"{__import__('os').environ.get('QA_VERSION','V63')} / SOFTWARE GLES / {cam['label']} / actual geometry, light shadows and water shader",fill='white');im.save(P/f"inspection-{cam['label']}.png");print('rendered',cam['label'],'GL errors=0',flush=True)
