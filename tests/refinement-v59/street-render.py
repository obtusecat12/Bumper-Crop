import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1])
fixture=json.load(open(P/'fullscene.json'));captureW=1000;captureH=round(captureW/fixture['cameras'][0].get('aspect',1000/681))
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
  elif len(v)==9:a=np.ascontiguousarray(v,np.float32);UM3(Loc(pr,k.encode()),1,0,a.ctypes.data)
# Native diagnostic shadow pass uses the authored light direction and actual geometry.
Storage=gl('glRenderbufferStorage',None,[U,U,I,I]);shadowSize=3072
shadowTexture=tex(w=shadowSize,h=shadowSize);Bind(0x0DE1,shadowTexture);Tex(0x0DE1,0,0x8814,shadowSize,shadowSize,0,0x1908,0x1406,None)
Param(0x0DE1,0x2801,0x2600);Param(0x0DE1,0x2800,0x2600)
shadowFBO=U();GenFBO(1,C.byref(shadowFBO));BindFBO(0x8D40,shadowFBO);FBOTexture(0x8D40,0x8CE0,0x0DE1,shadowTexture,0)
rb=U();GenRB(1,C.byref(rb));BindRB(0x8D41,rb);Storage(0x8D41,0x81A6,shadowSize,shadowSize);AttachRB(0x8D40,0x8D00,0x8D41,rb);assert CheckFBO(0x8D40)==0x8CD5
shadowProgram=program("""#version 300 es
precision highp float;in vec3 position;in vec2 uv;uniform mat4 modelMatrix,nativeShadowMatrix;out vec2 vUv;void main(){vUv=uv;gl_Position=nativeShadowMatrix*modelMatrix*vec4(position,1.);}""","""#version 300 es
precision highp float;uniform sampler2D alphaMap;uniform bool hasAlpha;uniform float alphaTest;in vec2 vUv;out vec4 c;void main(){if(hasAlpha&&texture(alphaMap,vUv).a<alphaTest)discard;c=vec4(gl_FragCoord.z);}""")
Viewport(0,0,shadowSize,shadowSize);ClearColor(1,1,1,1);Clear(0x4100);Enable(0x0B71);DepthMask(1);Disable(0x0B44);Disable(0x0BE2);Use(shadowProgram);matrix(shadowProgram,'nativeShadowMatrix',fixture['lighting']['shadow'])
for f,ab,ib in meshes:
 if not f.get('castShadow'):continue
 sh=data[f['shaderKey']];matrix(shadowProgram,'modelMatrix',f['model']);test=sh['uniforms'].get('alphaTest',0);U1i(Loc(shadowProgram,b'hasAlpha'),int(test>0));scalar(shadowProgram,'alphaTest',test)
 if test>0 and 'map' in sh['textures']:bindtex(shadowProgram,'alphaMap',textures[sh['textures']['map']],0)
 clearattrs()
 for k,(buf,size,divisor) in ab.items():
  loc=Attrib(shadowProgram,k.encode())
  if loc>=0:BindBuffer(0x8892,buf);EnableAttrib(loc);AP(loc,size,0x1406,0,0,None);activeAttributes.append(loc)
 if ib:BindBuffer(0x8893,ib);DrawElements(4,f['count'],0x1405,None)
 else:Draw(4,0,f['count'])
for cam in fixture['cameras']:
 for mode in ['compound']:
  BindFBO(0x8D40,msaa);Viewport(0,0,W,H);ClearColor(*fixture['lighting']['sky'],1);Clear(0x4100);Enable(0x0B71);DepthFunc(0x0203);Disable(0x0B44)
  view=np.array(cam['view'],np.float32).reshape(4,4).T;light=view[:3,:3]@np.array(fixture['lighting']['sun']);light=light/np.linalg.norm(light)
  for f,ab,ib in meshes:
   if mode=='terrain' and f['name']!='sculpted-ground-and-wheel-ruts':continue
   pr=programs[f['shaderKey']];s=data[f['shaderKey']];Use(pr);model=np.array(f['model'],np.float32).reshape(4,4).T;mv=view@model;normal=np.ascontiguousarray(np.linalg.inv(mv[:3,:3]).T.T.flatten(),np.float32)
   matrix(pr,'modelMatrix',f['model']);matrix(pr,'modelViewMatrix',mv.T.flatten());matrix(pr,'viewMatrix',cam['view']);matrix(pr,'projectionMatrix',cam['projection']);UM3(Loc(pr,b'normalMatrix'),1,0,normal.ctypes.data)
   for k,v in s['uniforms'].items():uniform(pr,k,v)
   matrix(pr,'nativeShadowMatrix',fixture['lighting']['shadow']);bindtex(pr,'nativeShadow',shadowTexture,15)
   if 'uWheatView' in s['uniforms']:vec(pr,'uWheatView',cam['eye'])
   DepthMask(int(f.get('depthWrite',True)))
   (Enable if f.get('alphaToCoverage') else Disable)(0x809E)
   if f.get('transparent'):Enable(0x0BE2);BlendFunc(0x0302,0x0303)
   else:Disable(0x0BE2)
   for k,v in [('diffuse',s['uniforms'].get('diffuse',(1,1,1))),('emissive',s['uniforms'].get('emissive',(0,0,0))),('ambientLightColor',(0,0,0)),('hemisphereLights[0].direction',view[:3,:3]@np.array([0,1,0])),('hemisphereLights[0].skyColor',fixture['lighting']['fill']),('hemisphereLights[0].groundColor',fixture['lighting']['ground']),('directionalLights[0].direction',light),('directionalLights[0].color',fixture['lighting']['color']),('cameraPosition',cam['eye'])]:vec(pr,k,v)
   scalar(pr,'metalness',s['uniforms'].get('metalness',0));scalar(pr,'opacity',s['uniforms'].get('opacity',1));U1i(Loc(pr,b'isOrthographic'),0)
   Active(0x84C0);Bind(0x8C1A,groundLayers);U1i(Loc(pr,b'uGroundAlbedo'),0)
   for unit,(n,t) in enumerate(s['textures'].items(),1):
    Active(0x84C0+unit);Bind(textureTargets[t],textures[t]);U1i(Loc(pr,n.encode()),unit)
   clearattrs()
   for k,(b,size,divisor) in ab.items():
    loc=Attrib(pr,k.encode())
    if loc<0:continue
    BindBuffer(0x8892,b)
    if size==16:
     for j in range(4):EnableAttrib(loc+j);AP(loc+j,4,0x1406,0,64,C.c_void_p(j*16));Divisor(loc+j,1);activeAttributes.append(loc+j)
    else:EnableAttrib(loc);AP(loc,size,0x1406,0,0,None);Divisor(loc,divisor);activeAttributes.append(loc)
   if ib:
    BindBuffer(0x8893,ib)
    if f['instances']:DrawElementsInstanced(4,f['count'],0x1405,None,f['instances'])
    else:DrawElements(4,f['count'],0x1405,None)
   elif f['instances']:DrawArraysInstanced(4,0,f['count'],f['instances'])
   else:Draw(4,0,f['count'])
  DepthMask(1);Disable(0x0BE2);Disable(0x809E);BindFBO(0x8CA8,msaa);BindFBO(0x8CA9,opaque[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,'picture',opaque[1],0);bindtex(present,'depthPicture',opaque[2],1);scalar(present,'exposure',fixture['lighting']['exposure']);vec(present,'sky',fixture['lighting']['sky']);scalar(present,'clinic',fixture['lighting']['clinic']);vec(present,'eye',cam['eye']);matrix(present,'inverseViewProjection',cam['inverseViewProjection']);clearattrs();attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
  out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);err=GetError();assert err==0,hex(err)
  im=Image.fromarray(out[::-1,:,:3]);d=ImageDraw.Draw(im);d.rectangle((0,0,W,28),fill=(20,23,21));d.text((12,9),f"V59 / SOFTWARE GLES / {cam['label']} / urban fabric / diagnostic lighting",fill='white');im.save(P/f"inspection-{cam['label']}-{mode}.png");print('rendered',cam['label'],mode,flush=True)
print('GL errors=0')
