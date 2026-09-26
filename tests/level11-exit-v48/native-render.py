import sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1])
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
from gl_native import *
from PIL import Image,ImageDraw
src=(ROOT/'tests/water-v28/native/render_lake.py').read_text();exec(src[src.index('Use=gl'):src.index('opaque=target();')]);exec(src[src.index('def bindtex'):src.index('ground=program')].replace("G=np.fromfile(P/'ground.bin',np.float32);V=np.fromfile(P/'water.bin',np.float32);gb=buffer(G);wb=buffer(V);",''))
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
present=program('''#version 300 es
precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}''','''#version 300 es
precision highp float;uniform sampler2D picture;in vec2 vUv;out vec4 c;void main(){vec3 rgb=texture(picture,vUv).rgb*1.10;rgb=rgb/(1.+rgb*.35);c=vec4(pow(rgb,vec3(1./2.2)),1.);}''')
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
for cam in fixture['cameras']:
 for mode in ['compound']:
  BindFBO(0x8D40,msaa);Viewport(0,0,W,H);ClearColor(.31,.36,.38,1);Clear(0x4100);Enable(0x0B71);DepthFunc(0x0203);Disable(0x0B44)
  view=np.array(cam['view'],np.float32).reshape(4,4).T;light=view[:3,:3]@np.array([-.4,.8,-.3]);light=light/np.linalg.norm(light)
  for f,ab,ib in meshes:
   if mode=='terrain' and f['name']!='sculpted-ground-and-wheel-ruts':continue
   pr=programs[f['shaderKey']];s=data[f['shaderKey']];Use(pr);model=np.array(f['model'],np.float32).reshape(4,4).T;mv=view@model;normal=np.ascontiguousarray(np.linalg.inv(mv[:3,:3]).T.T.flatten(),np.float32)
   matrix(pr,'modelMatrix',f['model']);matrix(pr,'modelViewMatrix',mv.T.flatten());matrix(pr,'viewMatrix',cam['view']);matrix(pr,'projectionMatrix',cam['projection']);UM3(Loc(pr,b'normalMatrix'),1,0,normal.ctypes.data)
   for k,v in s['uniforms'].items():uniform(pr,k,v)
   if 'uWheatView' in s['uniforms']:vec(pr,'uWheatView',cam['eye'])
   DepthMask(int(f.get('depthWrite',True)))
   (Enable if f.get('alphaToCoverage') else Disable)(0x809E)
   if f.get('transparent'):Enable(0x0BE2);BlendFunc(0x0302,0x0303)
   else:Disable(0x0BE2)
   for k,v in [('diffuse',s['uniforms'].get('diffuse',(1,1,1))),('emissive',(0,0,0)),('ambientLightColor',(.66,.71,.70)),('directionalLights[0].direction',light),('directionalLights[0].color',(1.8,1.78,1.68)),('cameraPosition',cam['eye'])]:vec(pr,k,v)
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
  DepthMask(1);Disable(0x0BE2);Disable(0x809E);BindFBO(0x8CA8,msaa);BindFBO(0x8CA9,opaque[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600);BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,'picture',opaque[1],0);clearattrs();attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
  out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);err=GetError();assert err==0,hex(err)
  im=Image.fromarray(out[::-1,:,:3]);d=ImageDraw.Draw(im);d.rectangle((0,0,W,28),fill=(20,23,21));d.text((12,9),f"V48 / SOFTWARE GLES / {cam['label']} / actual exit geometry / diagnostic lighting",fill='white');im.save(P/f"inspection-{cam['label']}-{mode}.png");print('rendered',cam['label'],mode,flush=True)
print('GL errors=0')
