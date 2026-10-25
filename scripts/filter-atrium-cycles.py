"""Spatially filter coplanar colour-attribute samples, never opposite slab skins."""
import pathlib,numpy as np,gzip,json
from scipy.spatial import cKDTree
R=pathlib.Path(__file__).resolve().parents[1];S=R/'art-source/level0-atrium-cycles';O=R/'dist/assets/level0-atrium-cycles'
d=np.load(S/'irradiance-source.npz');p=d['positions'];n=d['normals'];rgb=d['rgb'];rgb=np.nan_to_num(rgb,nan=0,posinf=4,neginf=0)
keys=np.concatenate([np.round(p/.12).astype(np.int32),np.round(n*8).astype(np.int32)],axis=1)
_,inv=np.unique(keys,axis=0,return_inverse=True); count=np.bincount(inv); num=len(count)
P=np.zeros((num,3));N=np.zeros((num,3));C=np.zeros((num,3))
np.add.at(P,inv,p);np.add.at(N,inv,n);np.add.at(C,inv,rgb)
P/=count[:,None];N/=count[:,None];N/=np.maximum(1e-6,np.linalg.norm(N,axis=1))[:,None];C/=count[:,None]
tree=cKDTree(P); result=np.empty_like(rgb)
for start in range(0,len(p),20000):
 q=p[start:start+20000];nn=n[start:start+20000];dist,ix=tree.query(q,k=min(32,num),workers=4)
 delta=P[ix]-q[:,None,:];mask=(dist<2.1)&(np.einsum('nki,ni->nk',N[ix],nn)>.96)&(np.abs(np.einsum('nki,ni->nk',delta,nn))<.045)
 weight=np.exp(-(dist/.9)**2)*mask;den=weight.sum(axis=1);smooth=(C[ix]*weight[:,:,None]).sum(axis=1)/np.maximum(den,1e-6)[:,None]
 raw=rgb[start:start+len(q)];result[start:start+len(q)]=np.where((den>0)[:,None],smooth*.94+raw*.06,raw)
encoded=np.rint(np.sqrt(np.clip(result/4,0,1))*255).astype(np.uint8).tobytes()
(O/'irradiance.bin.gz').write_bytes(gzip.compress(encoded,compresslevel=9,mtime=0))
print(json.dumps({'vertices':len(p),'compressedBytes':(O/'irradiance.bin.gz').stat().st_size,'max':float(rgb.max())}))
