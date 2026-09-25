# Software GLES timing only; workload comparison is not a device FPS claim.
import sys,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1]);sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
s=(ROOT/'tests/visibility-cloud-v43/render.py').read_text();exec(s[:s.index('for label,t,pitch,steps,rain')])
post=programs;skyNoise=noise;halfTarget=lambda:make_target(W//2,H//2)
def drawpost(p,rt,half=True):draw(p,rt,W//2 if half else W,H//2 if half else H)
exec((ROOT/'tests/fog-performance-v44/fog-setup.py').read_text())
proj=np.zeros((4,4));proj[0,0]=1/np.tan(72*np.pi/360)/(W/H);proj[1,1]=1/np.tan(72*np.pi/360);proj[2,2]=-(480+.08)/(480-.08);proj[2,3]=-2*480*.08/(480-.08);proj[3,2]=-1
world=np.eye(4);world[:3,3]=(16,1.77,68);cam={'projection':proj.T.flatten().tolist(),'view':np.linalg.inv(world).T.flatten().tolist()};depth=np.ones((H,W,4),np.float32)
y,x=np.mgrid[0:H,0:W];d=np.where(y>H*.6,480.,2.+(y/H)**2*40.)
d=np.where((x%31<3)&(y<H*.6),2.,d);depth[:,:,:3]=((480-.08*480/d)/(480-.08))[:,:,None]
dt=tex();Bind(0x0DE1,dt);Tex(0x0DE1,0,0x8814,W,H,0,0x1908,0x1406,depth.ctypes.data);Param(0x0DE1,0x2800,0x2600)
opaque=(None,blank,dt)
old=programs['fogBefore'];oldRT=make_target(768,288)
def before():
 Use(old);Active(0x84C0);Bind(0x806F,noise);U1i(Loc(old,b'uNoise'),0);matrix(old,'uInvProjection',np.linalg.inv(proj).T.flatten());matrix(old,'uViewWorld',world.T.flatten());vec(old,'uOrigin',(0,0));vec(old,'uFogColor',(.411,.467,.44));scalar(old,'uTime',90);scalar(old,'uFogVolumeAmount',1);draw(old,oldRT,768,288)

baseUniforms=fogUniforms
results=[];reference=None
for divisor in [2,3,4]:
 fw,fh=W//divisor,H//divisor;fogWidth,fogHeight=fw,fh;fogHalf=make_target(fw,fh);Bind(0x0DE1,fogHalf[1]);Param(0x0DE1,0x2800,0x2600);Param(0x0DE1,0x2801,0x2600)
 def drawpost(p,rt,half=True):draw(p,rt,fw if half else W,fh if half else H)
 def fogUniforms(p,cam,age,dt):baseUniforms(p,cam,age,dt);vec(p,'fogSize',(fw,fh))
 renderFog(cam,90);Finish();a=np.empty((H,W,4),np.float32);Read(0,0,W,H,0x1908,0x1406,a.ctypes.data)
 if reference is None:reference=a
 times=[[],[]]
 for i in range(6):
  for j,f in [(0,before),(1,lambda:renderFog(cam,90))] if i%2==0 else [(1,lambda:renderFog(cam,90)),(0,before)]:
   Finish();start=time.perf_counter();f();Finish();times[j].append((time.perf_counter()-start)*1000)
 result={'divisor':divisor,'old_ms':float(np.median(times[0])),'new_ms':float(np.median(times[1])),'mean_linear_error_to_half':float(abs(reference-a).mean()),'max_linear_error_to_half':float(abs(reference-a).max())};results.append(result);print(result,flush=True)
json.dump({'renderer':GetString(0x1F01).decode(),'hardware_fps_test':False,'fixture':'depth discontinuities, near silhouettes and distant sky','resolutions':results},open(P/'fog-budget.json','w'),indent=2)
