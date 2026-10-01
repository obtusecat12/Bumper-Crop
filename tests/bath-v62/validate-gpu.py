"""Read-only source extraction is done by extract.mjs; actual GLSL executes in GLES.
This is a software-GPU correctness fixture, not browser or device performance proof.
"""
import pathlib,sys,json,time,hashlib
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[1]
sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
sys.dont_write_bytecode=True
from gl_native import *
fixture=json.loads((HERE/'fixture.json').read_text())
Use=gl('glUseProgram',None,[U]);Loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);Attrib=gl('glGetAttribLocation',I,[U,C.c_char_p]);U1f=gl('glUniform1f',None,[I,F]);U1i=gl('glUniform1i',None,[I,I]);U4f=gl('glUniform4f',None,[I,F,F,F,F]);
GenTextures=gl('glGenTextures',None,[I,C.POINTER(U)]);BindTexture=gl('glBindTexture',None,[U,U]);ActiveTexture=gl('glActiveTexture',None,[U]);TexParameteri=gl('glTexParameteri',None,[U,U,I]);TexImage2D=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);
Viewport=gl('glViewport',None,[I,I,I,I]);GenBuffers=gl('glGenBuffers',None,[I,C.POINTER(U)]);BindBuffer=gl('glBindBuffer',None,[U,U]);BufferData=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);EnableAttrib=gl('glEnableVertexAttribArray',None,[U]);AttribPointer=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);Draw=gl('glDrawArrays',None,[U,I,I]);Read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);Finish=gl('glFinish',None,[]);GetError=gl('glGetError',U,[])
GenFramebuffers=gl('glGenFramebuffers',None,[I,C.POINTER(U)]);BindFramebuffer=gl('glBindFramebuffer',None,[U,U]);FramebufferTexture=gl('glFramebufferTexture2D',None,[U,U,U,U,I]);DrawBuffers=gl('glDrawBuffers',None,[I,C.POINTER(U)]);CheckFramebuffer=gl('glCheckFramebufferStatus',U,[U]);ReadBuffer=gl('glReadBuffer',None,[U]);Disable=gl('glDisable',None,[U]);Validate=gl('glValidateProgram',None,[U]);
def check_gl(stage):
 e=GetError()
 assert e==0,f'{stage}: GL error {hex(e)}'
def texture(data,internal=0x8814):
 data=np.ascontiguousarray(data,dtype=np.float32)
 t=U();GenTextures(1,C.byref(t));BindTexture(0x0DE1,t)
 for param,value in [(0x2801,0x2600),(0x2800,0x2600),(0x2802,0x812F),(0x2803,0x812F)]:TexParameteri(0x0DE1,param,value)
 TexImage2D(0x0DE1,0,internal,data.shape[1],data.shape[0],0,0x1908,0x1406,data.ctypes.data)
 check_gl('texture allocation');return t
def target():
 textures=[texture(np.zeros((128,128,4),np.float32)) for _ in range(2)]
 fbo=U();GenFramebuffers(1,C.byref(fbo));BindFramebuffer(0x8D40,fbo)
 for i,t in enumerate(textures):FramebufferTexture(0x8D40,0x8CE0+i,0x0DE1,t,0)
 DrawBuffers(2,(U*2)(0x8CE0,0x8CE1))
 assert CheckFramebuffer(0x8D40)==0x8CD5,'MRT framebuffer incomplete'
 return fbo,textures
programs={name:program(src['vertex'],src['fragment']) for name,src in fixture['programs'].items()}
check_gl('compile/link all three actual shader pairs')
emit=np.zeros((2,256,4),np.float32)
for i,n in enumerate(fixture['nozzles']):emit[0,i]=[*n['position'],1];emit[1,i]=[*n['direction'],1]
assert len(fixture['nozzles'])==220
emitterTexture=texture(emit,0x8814)
targets=[target(),target()]
compute=programs['compute'];Use(compute)
verts=np.array([-1,-1,0,3,-1,0,-1,3,0],np.float32)
buffer=U();GenBuffers(1,C.byref(buffer));BindBuffer(0x8892,buffer);BufferData(0x8892,verts.nbytes,verts.ctypes.data,0x88E4)
position=Attrib(compute,b'position');EnableAttrib(position);AttribPointer(position,3,0x1406,0,0,None)
for name,unit in [('oldPosition',0),('oldVelocity',1),('emitters',2)]:U1i(Loc(compute,name.encode()),unit)
Disable(0x0B71);Disable(0x0BE2);Disable(0x0BD0);Viewport(0,0,128,128)
swap=0;draws=0
def step(t,init=False,valves=(1,1,1,1),dt=1/60):
 global swap,draws
 Use(compute);src=targets[swap];dst=targets[1-swap]
 for unit,tid in enumerate([*src[1],emitterTexture]):ActiveTexture(0x84C0+unit);BindTexture(0x0DE1,tid)
 BindFramebuffer(0x8D40,dst[0]);DrawBuffers(2,(U*2)(0x8CE0,0x8CE1))
 U1i(Loc(compute,b'initialize'),int(init));U1f(Loc(compute,b'delta'),dt);U1f(Loc(compute,b'time'),t);U4f(Loc(compute,b'valves'),*valves)
 Validate(compute);ok=I();GetProgramiv(compute,0x8B83,C.byref(ok));assert ok.value,'Compute program invalid with bound samplers'
 Draw(4,0,3);Finish();check_gl('MRT compute draw');swap=1-swap;draws+=1
 return read_state()
def read_state():
 out=[];BindFramebuffer(0x8D40,targets[swap][0])
 for attachment in range(2):
  ReadBuffer(0x8CE0+attachment);data=np.empty((128,128,4),np.float32);Read(0,0,128,128,0x1908,0x1406,data.ctypes.data);check_gl('RGBA float readback');out.append(data.reshape(-1,4))
 return out
initialP,initialV=step(0,True)
assert np.isfinite(initialP).all() and np.isfinite(initialV).all()
assert (initialP[:,3]>=0).all() and (initialP[:,3]<=.57).all()
assert (initialV[:,1]<0).all()
survivors=initialP[:,3]<.03
previousP=initialP.copy();previousV=initialV.copy();respawnCount=0;maxVelocityStepError=0.;maxPositionStepError=0.;minSurvivorGravityFraction=1.
t0=time.perf_counter()
for frame in range(1,31):
 p,v=step(frame/60)
 assert np.isfinite(p).all() and np.isfinite(v).all(),f'Nonfinite state frame {frame}'
 respawn=(previousP[:,1]<.018)|(previousP[:,3]>.85)|(previousP[:,3]<0)
 respawnCount+=int(respawn.sum());survivors &= ~respawn
 active=~respawn
 expectedV=np.array([0,-54.5,0])+(previousV[:,:3]-np.array([0,-54.5,0]))*np.exp(-.18/60)
 expectedP=previousP[:,:3]+np.array([0,-54.5,0])/60+(previousV[:,:3]-np.array([0,-54.5,0]))*(1-np.exp(-.18/60))/.18
 maxVelocityStepError=max(maxVelocityStepError,float(np.abs(v[active,:3]-expectedV[active]).max()))
 maxPositionStepError=max(maxPositionStepError,float(np.abs(p[active,:3]-expectedP[active]).max()))
 assert (v[active,1]<previousV[active,1]).all(),'Gravity did not increase downward speed'
 assert (p[active,3]>previousP[active,3]).all(),'Age failed to increase'
 previousP=p.copy();previousV=v.copy()
elapsed=time.perf_counter()-t0
assert survivors.sum()>100
assert maxVelocityStepError<.008 and maxPositionStepError<.008
survivorDisplacement=p[survivors,1]-initialP[survivors,1]
assert (survivorDisplacement<-.8).all()
assert respawnCount>0
allOnFinalP=p.copy();allOnFinalV=v.copy()
pOff,vOff=step(31/60,valves=(1,1,0,1))
off=slice(8192,12288)
assert np.array_equal(pOff[off],np.tile([0,-50,0,-1],(4096,1)))
assert np.array_equal(vOff[off],np.zeros((4096,4)))
assert np.isfinite(pOff).all() and np.isfinite(vOff).all()
pReenabled,vReenabled=step(32/60,valves=(1,1,1,1))
assert (pReenabled[off,3]>=0).all() and (pReenabled[off,1]>-1).all()
assert (vReenabled[off,1]<0).all()
# Shader pairs linked unchanged apart from the version directive; bind every active
# sampler to an allocated 2D texture and validate actual particle/jet programs.
samplerBindings={}
for name in ['particles','jets']:
 pr=programs[name];Use(pr);samplerBindings[name]={}
 for unit,sampler in enumerate(['positions','velocities','emitters','sceneColor','sceneDepth']):
  loc=Loc(pr,sampler.encode())
  if loc<0:continue
  U1i(loc,unit);ActiveTexture(0x84C0+unit);BindTexture(0x0DE1,emitterTexture if sampler=='emitters' else targets[swap][1][unit%2]);samplerBindings[name][sampler]=unit
 Validate(pr);ok=I();GetProgramiv(pr,0x8B83,C.byref(ok));assert ok.value,f'{name} validation failed'
check_gl('final program sampler validation')
np.savez_compressed(HERE/'state-readback.npz',initialPosition=initialP,initialVelocity=initialV,finalPosition=allOnFinalP,finalVelocity=allOnFinalV,stallOffPosition=pOff,stallOffVelocity=vOff,reenabledPosition=pReenabled,reenabledVelocity=vReenabled)
report={'passed':True,'source_sha256':fixture['sha256'],'gles':GetString(0x1F02).decode(),'renderer':GetString(0x1F01).decode(),'actual_shader_pairs_linked':list(programs),'sampler_bindings':samplerBindings,'nozzles':220,'simulation':{'state_size':[128,128],'particle_count':16384,'format':'RGBA32F','attachments_per_target':2,'ping_pong_targets':2,'integration_frames':30,'delta':1/60,'total_compute_draws':draws,'finite_all_frames':True,'initial_age_range':[float(initialP[:,3].min()),float(initialP[:,3].max())],'young_particles_surviving_30_steps':int(survivors.sum()),'survivor_y_displacement_range':[float(survivorDisplacement.min()),float(survivorDisplacement.max())],'max_float32_velocity_step_error':maxVelocityStepError,'max_float32_position_step_error':maxPositionStepError,'respawn_events':respawnCount,'stall_2_off_exact_4096_particles':True,'stall_2_reenabled':True,'final_position_xyz_min':allOnFinalP[:,:3].min(0).tolist(),'final_position_xyz_max':allOnFinalP[:,:3].max(0).tolist()},'validation_wall_seconds':elapsed,'limitations':['Mesa software GLES, not hardware/device FPS','Actual shaders compile/link and compute runs; full Three.js frame and browser integration are not rendered by this harness','No screenshot or full scene visual correctness claim']}
(HERE/'results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
