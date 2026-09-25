import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'water-v28/native'))
from gl_native import *
s=json.load(open('/tmp/shore-full-chain.json'))['pond'];p=program(s['vertex'],s['fragment'])
n=I();GetProgramiv(p,0x8B86,C.byref(n));getu=gl('glGetActiveUniform',None,[U,U,I,ptr,C.POINTER(I),C.POINTER(U),ptr]);total=0
for i in range(n.value):
 name=C.create_string_buffer(512);size=I();kind=U();getu(p,i,512,None,C.byref(size),C.byref(kind),name)
 if kind.value in [0x8B5E,0x8B5F,0x8B60,0x8DC1]:total+=size.value;print(name.value.decode(),size.value,hex(kind.value))
print('ACTIVE FRAGMENT SAMPLERS:',total)
gl('glGetIntegerv',None,[U,C.POINTER(I)])(0x8872,C.byref(n));print('HOST LIMIT:',n.value)

assert total<=16, "Runtime ground exceeds WebGL2 fragment sampler baseline"
