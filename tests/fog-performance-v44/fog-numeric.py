import sys,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1]);sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
s=(ROOT/'tests/visibility-cloud-v43/render.py').read_text();exec(s[:s.index('for label,t,pitch,steps,rain')])
post=programs;skyNoise=noise
halfTarget=lambda:make_target(W//2,H//2)
def drawpost(p,rt,half=True):draw(p,rt,W//2 if half else W,H//2 if half else H)
exec((ROOT/'tests/fog-performance-v44/fog-setup.py').read_text())
fov=72*np.pi/180;proj=np.zeros((4,4));proj[0,0]=1/np.tan(fov/2)/(W/H);proj[1,1]=1/np.tan(fov/2);proj[2,2]=-(480+.08)/(480-.08);proj[2,3]=-2*480*.08/(480-.08);proj[3,2]=-1
world=np.eye(4);world[:3,3]=(16,1.77,68);cam={'projection':proj.T.flatten().tolist(),'view':np.linalg.inv(world).T.flatten().tolist()}
p=post['fogIntegrate'];read=np.empty((fogHeight,fogWidth,4),np.float32)
def sample(distance,age=90,eyeHeight=1.77):
 world[1,3]=eyeHeight;cam['view']=np.linalg.inv(world).T.flatten().tolist();raw=(480-.08*480/distance)/(480-.08)
 data=np.full((H,W,4),raw,np.float32);dt=tex();Bind(0x0DE1,dt);Tex(0x0DE1,0,0x8814,W,H,0,0x1908,0x1406,data.ctypes.data)
 fogUniforms(p,cam,age,dt);drawFog(p,fogHalf);Read(0,0,fogWidth,fogHeight,0x1908,0x1406,read.ctypes.data)
 tau=float(read[fogHeight//2,fogWidth//2,0])*12;return float(np.exp(-tau))
report={}
for d in [2,5,12,15,18,25]:report[str(d)]=sample(d)
assert .025<report['15']<.1,report
assert report['2']>.50 and report['25']<.02
assert sample(15,0)==1
high=sample(15,90,10);assert high>report['15']*5
# Temporal progression at a static distant point is monotonic in front coverage
# (time freezes so advected strands cannot confound the front-only test).
print('transmission at eye height',report,'at 10m height',high,flush=True)
json.dump({'eye_height_m':1.77,'transmission':report,'at_10m_height':high,'threshold':'5% remaining contrast','hardware_fps_test':False},open(P/'fog-numeric.json','w'),indent=2)
