import pathlib,sys,json,ctypes as C
root=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests/water-v28/native'))
from gl_native import *
active=gl('glGetActiveUniform',None,[U,U,I,C.POINTER(I),C.POINTER(I),C.POINTER(U),ptr])
maximum=0;count=0
for name,s in json.load(open(sys.argv[1])).items():
 p=program(s['vertex'],s['fragment']);n=I();GetProgramiv(p,0x8B86,C.byref(n));samplers=0
 for i in range(n.value):
  length=I();size=I();kind=U();buf=C.create_string_buffer(256);active(p,i,256,C.byref(length),C.byref(size),C.byref(kind),buf)
  if kind.value in [0x8B5E,0x8B5F,0x8B60,0x8DC1,0x8DC4,0x8DCA,0x8DD2,0x8DC5]:samplers+=size.value
 assert samplers<=16,(name,samplers)
 maximum=max(maximum,samplers);count+=1
print(json.dumps({'linkedPrograms':count,'maxActiveSamplers':maximum,'WebGL2MinimumFragmentLimit':16}))
