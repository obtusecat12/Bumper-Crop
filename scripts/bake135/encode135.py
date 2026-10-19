# encode bake135_city.py output into the venue133 sky format (u8 rgba per weld133 vertex: rgb=sqrt(B/2), a=AO)
# usage: python3 encode135.py cut.json out.bin data.json   (merges into data.json: {key: base64})
import sys,json,struct,base64,os
G=float(os.environ.get('VIS_GAMMA','1'))  # a = vis**G (G<1 lifts deep street canyons)
import numpy as np
SRC,BIN,DB=sys.argv[1:4];d=json.load(open(SRC));f=open(BIN,'rb');db=json.load(open(DB)) if os.path.exists(DB) else {};sb=sa=k=0
for m in d['meshes']:
  n=struct.unpack('<I',f.read(4))[0];a=np.frombuffer(f.read(n*16),np.float32).reshape(n,4);assert n==m['count'],(n,m['count'])
  rgb=np.sqrt(np.clip(a[:,:3],0,2)/2);ao=np.clip(a[:,3],0,1)**G
  u=np.concatenate([np.round(rgb*255),np.round(ao[:,None]*255)],1).astype(np.uint8)
  db[m['key']]=base64.b64encode(u.tobytes()).decode();sb+=a[:,:3].mean()*n;sa+=ao.sum();k+=n
json.dump(db,open(DB,'w'));print('verts',k,'mean bounce',round(sb/k/3*3,3),'mean AO',round(sa/k,3),'keys',len(db))
