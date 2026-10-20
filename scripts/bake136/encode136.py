# bake134.py output (targets in in.json order) -> assets/atm136/bake136.bin: u8 RGBM per vertex for EVERY part in
# atm136-geo.js order (non-baked parts zero), B = (rgb*a)^2*16 radiance per unit albedo (decoded in atm136-lobby.js)
import json,sys,struct,array,math
IN,BIN,OUT=sys.argv[1:4];R=16.0;GAIN=float(sys.argv[4]) if len(sys.argv)>4 else 1.0
d=json.load(open(IN));f=open(BIN,'rb');got={}
for m in d['meshes']:
    n=struct.unpack('<I',f.read(4))[0];a=array.array('f');a.frombytes(f.read(n*16));assert n==m['count'];got[m['key']]=a
out=bytearray();mx=0
for k in d['order']:
    n=d['counts'][k]
    if k not in got:out+=bytes(n*4);continue
    a=got[k]
    for i in range(n):
        c=[math.sqrt(max(0.0,min(R,a[i*4+j]*GAIN))/R) for j in range(3)];M=max(c+[1e-6]);A=min(255,max(1,math.ceil(M*255)));s=A/255
        out+=bytes([min(255,round(c[0]/s*255)),min(255,round(c[1]/s*255)),min(255,round(c[2]/s*255)),A]);mx=max(mx,max(a[i*4:i*4+3]))
open(OUT,'wb').write(out);print('bytes',len(out),'max',mx)
