"""Compile actual GLSL and exercise exact two-attachment RGBA32F ping-pong state.
This software-GLES fixture does not claim browser visual or hardware performance proof.
"""
import pathlib,sys,json,subprocess,argparse
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'water-v28/native'))
sys.dont_write_bytecode=True
from gl_native import *
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=pathlib.Path,help='Optional JSON report destination; no files are written by default.')
args=parser.parse_args()
fixture=json.loads(subprocess.check_output(['node',str(HERE/'cascade-gpu-extract.mjs'),'--json'],text=True))
Use=gl('glUseProgram',None,[U]);Loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);Attrib=gl('glGetAttribLocation',I,[U,C.c_char_p]);U1f=gl('glUniform1f',None,[I,F]);U1i=gl('glUniform1i',None,[I,I]);U3f=gl('glUniform3f',None,[I,F,F,F])
GenTextures=gl('glGenTextures',None,[I,C.POINTER(U)]);BindTexture=gl('glBindTexture',None,[U,U]);ActiveTexture=gl('glActiveTexture',None,[U]);TexParameteri=gl('glTexParameteri',None,[U,U,I]);TexImage2D=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr])
Viewport=gl('glViewport',None,[I,I,I,I]);GenBuffers=gl('glGenBuffers',None,[I,C.POINTER(U)]);BindBuffer=gl('glBindBuffer',None,[U,U]);BufferData=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);EnableAttrib=gl('glEnableVertexAttribArray',None,[U]);AttribPointer=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);Draw=gl('glDrawArrays',None,[U,I,I]);Read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);Finish=gl('glFinish',None,[]);GetError=gl('glGetError',U,[])
GenFramebuffers=gl('glGenFramebuffers',None,[I,C.POINTER(U)]);BindFramebuffer=gl('glBindFramebuffer',None,[U,U]);FramebufferTexture=gl('glFramebufferTexture2D',None,[U,U,U,U,I]);DrawBuffers=gl('glDrawBuffers',None,[I,C.POINTER(U)]);CheckFramebuffer=gl('glCheckFramebufferStatus',U,[U]);ReadBuffer=gl('glReadBuffer',None,[U]);Disable=gl('glDisable',None,[U]);Validate=gl('glValidateProgram',None,[U])
def check(stage):
 e=GetError();assert e==0,f'{stage}: {hex(e)}'
def tex():
 data=np.zeros((64,64,4),np.float32);t=U();GenTextures(1,C.byref(t));BindTexture(0x0DE1,t)
 for param,value in [(0x2801,0x2600),(0x2800,0x2600),(0x2802,0x812F),(0x2803,0x812F)]:TexParameteri(0x0DE1,param,value)
 TexImage2D(0x0DE1,0,0x8814,64,64,0,0x1908,0x1406,data.ctypes.data);return t
def target():
 ts=[tex(),tex()];f=U();GenFramebuffers(1,C.byref(f));BindFramebuffer(0x8D40,f)
 for i,t in enumerate(ts):FramebufferTexture(0x8D40,0x8CE0+i,0x0DE1,t,0)
 DrawBuffers(2,(U*2)(0x8CE0,0x8CE1));assert CheckFramebuffer(0x8D40)==0x8CD5;return f,ts
programs={k:program(v['vertex'],v['fragment']) for k,v in fixture['programs'].items()};check('compile and link')
print('Linked shader pairs:',','.join(programs))
targets=[target(),target()];pr=programs['compute'];Use(pr)
verts=np.array([-1,-1,0,3,-1,0,-1,3,0],np.float32);buffer=U();GenBuffers(1,C.byref(buffer));BindBuffer(0x8892,buffer);BufferData(0x8892,verts.nbytes,verts.ctypes.data,0x88E4)
loc=Attrib(pr,b'position');EnableAttrib(loc);AttribPointer(loc,3,0x1406,0,0,None)
for name,unit in [('oldPosition',0),('oldVelocity',1)]:U1i(Loc(pr,name.encode()),unit)
for i,p in enumerate(fixture['impacts']):U3f(Loc(pr,f'impacts[{i}]'.encode()),*p)
U1f(Loc(pr,b'waterY'),0)
Disable(0x0B71);Disable(0x0BE2);Disable(0x0BD0);Viewport(0,0,64,64);swap=0

def step(time,init=False):
 global swap
 src,dst=targets[swap],targets[1-swap]
 for unit,t in enumerate(src[1]):ActiveTexture(0x84C0+unit);BindTexture(0x0DE1,t)
 BindFramebuffer(0x8D40,dst[0]);DrawBuffers(2,(U*2)(0x8CE0,0x8CE1));U1i(Loc(pr,b'initialize'),int(init));U1f(Loc(pr,b'delta'),1/60);U1f(Loc(pr,b'time'),time)
 Draw(4,0,3);Finish();check('MRT draw');swap=1-swap;out=[]
 for attach in range(2):
  ReadBuffer(0x8CE0+attach);data=np.empty((64,64,4),np.float32);Read(0,0,64,64,0x1908,0x1406,data.ctypes.data);check('float readback');out.append(data.reshape(-1,4))
 return out
p,v=step(0,True);assert np.isfinite(p).all() and np.isfinite(v).all();assert (p[:,1]>=0).all();assert np.max(p[:,1])<.23
previousP=p.copy();previousV=v.copy();maxP=0.;maxV=0.;respawns=0;minY=0.;maxY=0.;maxRadius=0.
origins=np.array([fixture['impacts'][i%2] for i in range(4096)])
for frame in range(1,91):
 p,v=step(frame/60);assert np.isfinite(p).all() and np.isfinite(v).all()
 respawn=(previousP[:,3]>=previousV[:,3])|(previousP[:,1]<0);active=~respawn;respawns+=int(respawn.sum())
 expectedP=previousP[:,:3]+previousV[:,:3]/60+np.array([0,-4.905/3600,0]);expectedV=previousV[:,:3]+np.array([0,-9.81/60,0])
 maxP=max(maxP,float(np.abs(p[active,:3]-expectedP[active]).max()));maxV=max(maxV,float(np.abs(v[active,:3]-expectedV[active]).max()))
 assert (v[active,1]<previousV[active,1]).all();assert (p[active,3]>previousP[active,3]).all()
 minY=min(minY,float(p[:,1].min()));maxY=max(maxY,float(p[:,1].max()))
 radius=np.linalg.norm(p[:,[0,2]]-origins[:,[0,2]],axis=1);maxRadius=max(maxRadius,float(radius.max()))
 previousP=p.copy();previousV=v.copy()
assert maxP<.00001 and maxV<.00001;assert respawns>10000;assert minY>-.05 and maxY<.23 and maxRadius<.39
report={'passed':True,'source':fixture['source'],'source_sha256':fixture['sha256'],'renderer':GetString(0x1F01).decode(),'actual_shader_pairs_linked':list(programs),'geometry':fixture['geometry'],'simulation':{'particles':4096,'sources':2,'format':'RGBA32F','attachments':2,'ping_pong_targets':2,'frames':90,'gravity':9.81,'finite_every_frame':True,'respawns':respawns,'max_position_step_error':maxP,'max_velocity_step_error':maxV,'min_y':minY,'max_y':maxY,'max_horizontal_radius':maxRadius},'limitations':['Software GLES shader and computation correctness','Visual integration is the caller responsibility']}
if args.output:args.output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
