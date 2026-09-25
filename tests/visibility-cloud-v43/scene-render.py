# Reuse the existing actual-geometry harness, adding the production sky and
# postprocess chain before presentation. No changes to the scene fixture.
import pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[2];SKY=pathlib.Path(sys.argv[2])
s=(ROOT/'tests/vegetation-v41/native-render.py').read_text()
setup='''
skyShaders=json.load(open(SKY/'shaders.json'))
skyVS="""#version 300 es
precision highp float;in vec3 position;out vec3 vCloudDirection;uniform mat4 inverseProjection,cameraWorld;
void main(){vec4 p=inverseProjection*vec4(position.xy,1.,1.);vCloudDirection=mat3(cameraWorld)*p.xyz;gl_Position=vec4(position.xy,.999999,1.);}"""
skyProgram=program(skyVS,skyShaders['sky']['fragment']);skyNoise=U();Gen(1,C.byref(skyNoise));Bind(0x806F,skyNoise)
a=np.fromfile(SKY/'noise.bin',np.uint8);Tex3D(0x806F,0,0x8058,64,64,64,0,0x1908,0x1401,a.ctypes.data)
for axis in [0x2802,0x2803,0x8072]:Param(0x806F,axis,0x2901)
Mip(0x806F);Param(0x806F,0x2801,0x2703);Param(0x806F,0x2800,0x2601)
blank=tex(np.zeros((2,2,4),np.uint8));post={k:program(v['vertex'],v['fragment']) for k,v in skyShaders.items() if k!='sky'}
def halfTarget():
 rt=target();Bind(0x0DE1,rt[1]);Tex(0x0DE1,0,0x881A,W//2,H//2,0,0x1908,0x140B,None);Bind(0x0DE1,rt[2]);Tex(0x0DE1,0,0x81A6,W//2,H//2,0,0x1902,0x1405,None);return rt
cocA=halfTarget();cocB=halfTarget();fused=halfTarget()
def drawpost(p,rt,half=True):
 BindFBO(0x8D40,rt[0] if rt else 0);Viewport(0,0,W//2 if half else W,H//2 if half else H);Use(p);Disable(0x0B71);clearattrs();attrs(p,quad,[('position',3,0)],12);Draw(4,0,3)
def renderSky(cam):
 Use(skyProgram);Disable(0x809E);Disable(0x0BE2);DepthMask(0);Active(0x84C0);Bind(0x806F,skyNoise);U1i(Loc(skyProgram,b'uCloudNoise'),0);bindtex(skyProgram,'uFogVolume',blank,1);bindtex(skyProgram,'uSkyWallpaper',blank,2);bindtex(skyProgram,'uCloudScreen',blank,3);U1i(Loc(skyProgram,b'uCloudCached'),0)
 matrix(skyProgram,'inverseProjection',np.linalg.inv(np.array(cam['projection']).reshape(4,4).T).T.flatten());matrix(skyProgram,'cameraWorld',np.linalg.inv(np.array(cam['view']).reshape(4,4).T).T.flatten());vec(skyProgram,'uCloudCamera',cam['eye']);vec(skyProgram,'uCloudOrigin',(0,0));vec(skyProgram,'uSkyOrigin',(0,0));vec(skyProgram,'uCloudFogColor',(.411,.467,.44));vec(skyProgram,'uStageEvent',(0,0,0));U4f(Loc(skyProgram,b'uSkyEvent'),0,0,0,0)
 for k,v in [('uCloudTime',0),('uCloudRain',0),('uCloudMist',0),('uFogVolumeAmount',0)]:scalar(skyProgram,k,v)
 U1i(Loc(skyProgram,b'uCloudSteps'),8);clearattrs();attrs(skyProgram,quad,[('position',3,0)],12);Draw(4,0,3);DepthMask(1)
def renderPost(cam):
 for name in ['coc','fused','resolve']:
  p=post[name];Use(p)
  for k,v in [('focalMM',2.4775),('fNumber',2.8),('sensorHeight',3.6),('focusDist',2.58),('nearPlane',.08),('farPlane',228),('dofEnabled',1)]:scalar(p,k,v)
  vec(p,'resolution',(W,H));bindtex(p,'depth',opaque[2],0)
 p=post['coc'];drawpost(p,cocA)
 p=post['dilate'];Use(p);bindtex(p,'coc',cocA[1],0);vec(p,'direction',(1,0));vec(p,'resolution',(W,H));drawpost(p,cocB);Use(p);bindtex(p,'coc',cocB[1],0);vec(p,'direction',(0,1));drawpost(p,cocA)
 p=post['fused'];Use(p)
 for unit,(n,t) in enumerate([('depth',opaque[2]),('picture',opaque[1]),('cocField',cocA[1]),('wetHeight',blank),('bubbleField',blank),('washNoise',blank),('bottomSoil',blank)]):bindtex(p,n,t,unit)
 for n in ['wet','bubbleWeight','waterActive','washWeight','exitFlash','flareStrength']:scalar(p,n,0)
 matrix(p,'cameraWorld',identity);matrix(p,'inverseProjection',identity);drawpost(p,fused)
 p=post['resolve'];Use(p)
 for unit,(n,t) in enumerate([('depth',opaque[2]),('sharp',opaque[1]),('fused',fused[1]),('uiPicture',blank),('cocField',cocA[1])]):bindtex(p,n,t,unit)
 scalar(p,'exposure',1.23);U1i(Loc(p,b'hasUI'),0);U1i(Loc(p,b'uiOnly'),0);U1i(Loc(p,b'displayMode'),0);drawpost(p,None,False)
fixture['cameras']=fixture['cameras'][:1]
'''
pos=s.index('for cam in fixture');s=s[:pos]+setup+s[pos:]
s=s.replace('  DepthMask(1);Disable(0x0BE2);Disable(0x809E);BindFBO','  renderSky(cam)\n  DepthMask(1);Disable(0x0BE2);Disable(0x809E);BindFBO')
a=s.index('BindFBO(0x8D40,0);Disable(0x0B71);Use(present);bindtex(present,\'picture\'',s.index('renderSky(cam)\n'));b=s.index('\n  out=np.empty',a);s=s[:a]+'renderPost(cam)'+s[b:]
s=s.replace('V41 / SOFTWARE GLES','V43 / SOFTWARE GLES').replace('actual terrain, cereals, yard props / diagnostic lighting','actual scene + production sky/optics / diagnostic ground lighting').replace('P/f"inspection-', 'SKY/f"scene-')
exec(compile(s,str(ROOT/'tests/vegetation-v41/native-render.py'),'exec'))
