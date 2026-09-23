import os,ctypes as C,json,sys,numpy as np
os.environ['EGL_PLATFORM']='surfaceless'
E=C.CDLL('libEGL.so.1')
def ef(name,rest,args):
 f=getattr(E,name);f.restype=rest;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
get=ef('eglGetProcAddress',ptr,[C.c_char_p])
def gl(name,rest,args):return C.CFUNCTYPE(rest,*args)(get(name.encode()))
dpy=ef('eglGetDisplay',ptr,[ptr])(None);major=I();minor=I();assert ef('eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)])(dpy,C.byref(major),C.byref(minor))
assert ef('eglBindAPI',U,[U])(0x30A0)
attrs=(I*15)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3025,24,0x3038,0x3038,0x3038)
config=ptr();n=I();assert ef('eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)])(dpy,attrs,C.byref(config),1,C.byref(n)) and n.value
ctx=ef('eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)])(dpy,config,None,(I*3)(0x3098,3,0x3038));assert ctx
surf=ef('eglCreatePbufferSurface',ptr,[ptr,ptr,C.POINTER(I)])(dpy,config,(I*5)(0x3057,960,0x3056,720,0x3038));assert surf
assert ef('eglMakeCurrent',U,[ptr,ptr,ptr,ptr])(dpy,surf,surf,ctx)
GetString=gl('glGetString',C.c_char_p,[U]);print(GetString(0x1F02).decode(),GetString(0x1F01).decode())
CreateShader=gl('glCreateShader',U,[U]);ShaderSource=gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),ptr]);CompileShader=gl('glCompileShader',None,[U]);GetShaderiv=gl('glGetShaderiv',None,[U,U,C.POINTER(I)]);GetShaderInfoLog=gl('glGetShaderInfoLog',None,[U,I,ptr,ptr]);CreateProgram=gl('glCreateProgram',U,[]);AttachShader=gl('glAttachShader',None,[U,U]);LinkProgram=gl('glLinkProgram',None,[U]);GetProgramiv=gl('glGetProgramiv',None,[U,U,C.POINTER(I)]);GetProgramInfoLog=gl('glGetProgramInfoLog',None,[U,I,ptr,ptr]);
def shader(src,kind):
 s=CreateShader(kind);data=C.c_char_p(src.encode());ShaderSource(s,1,C.byref(data),None);CompileShader(s);ok=I();GetShaderiv(s,0x8B81,C.byref(ok))
 if not ok.value:
  buf=C.create_string_buffer(65536);GetShaderInfoLog(s,65536,None,buf);raise Exception(buf.value.decode())
 return s

def program(v,f):
 p=CreateProgram();AttachShader(p,shader(v,0x8B31));AttachShader(p,shader(f,0x8B30));LinkProgram(p);ok=I();GetProgramiv(p,0x8B82,C.byref(ok))
 if not ok.value:
  buf=C.create_string_buffer(65536);GetProgramInfoLog(p,65536,None,buf);raise Exception(buf.value.decode())
 return p
if __name__=='__main__':
 data=json.load(open(sys.argv[1]));count=0
 for name,s in data.items():
  try:program(s['vertex'],s['fragment']);print('PASS',name);count+=1
  except Exception as e:print('FAIL',name,str(e));sys.exit(1)
 print('Linked',count,'programs')
