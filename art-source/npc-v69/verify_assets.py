"""Independent GLB-byte parser; checks exported TRS/morph animation, not authoring caches."""
from pathlib import Path
import json,struct,sys,io,math
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent

def qmat(q):
 x,y,z,w=q
 return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def check(path):
 raw=path.read_bytes();jl=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+jl]);bl=struct.unpack_from('<I',raw,20+jl)[0];data=raw[28+jl:28+jl+bl]
 def acc(idx):
  a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];dims={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
  return np.frombuffer(data,dtype=dt,count=a['count']*dims,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],dims)
 nodes=g['nodes'];parents={c:i for i,n in enumerate(nodes) for c in n.get('children',[])};anim=g['animations'][0];clips={}
 for ch in anim['channels']:
  sp=anim['samplers'][ch['sampler']];assert sp['interpolation']=='STEP';times=acc(sp['input']).ravel();assert len(times)==241 and np.max(abs(np.diff(times)-.05))<1e-6
  vals=acc(sp['output']);clips[ch['target']['node'],ch['target']['path']]=vals.reshape(241,-1)
 inv=acc(g['skins'][0]['inverseBindMatrices']).reshape(20,4,4).transpose(0,2,1)
 allpos=[];part_series=[]
 for frame in range(241):
  worlds=[]
  for i,n in enumerate(nodes):
   tr=clips.get((i,'translation'),np.tile(n.get('translation',[0,0,0]),(241,1)))[frame];rot=clips.get((i,'rotation'),np.tile(n.get('rotation',[0,0,0,1]),(241,1)))[frame];sc=clips.get((i,'scale'),np.tile(n.get('scale',[1,1,1]),(241,1)))[frame]
   local=np.eye(4);local[:3,:3]=qmat(rot)@np.diag(sc);local[:3,3]=tr;worlds.append((worlds[parents[i]] if i in parents else np.eye(4))@local)
  sk=np.array(worlds[:20])@inv;weights=clips[(20,'weights')][frame];parts=[]
  for prim in g['meshes'][0]['primitives']:
   aa=prim['attributes'];p=acc(aa['POSITION']).astype(float).copy();j=acc(aa['JOINTS_0']);w=acc(aa['WEIGHTS_0']);assert np.max(abs(w.sum(1)-1))<1e-6
   for k,t in enumerate(prim['targets']):p+=acc(t['POSITION'])*weights[k]
   posed=(np.einsum('njab,njb->nja',sk[j,:3,:3],np.tile(p[:,None,:],(1,4,1)))+sk[j,:3,3])*w[:,:,None]
   parts.append(posed.sum(1))
  part_series.append(parts)
 parts=[np.array([row[k] for row in part_series]) for k in range(3)];prim=g['meshes'][0]['primitives'][0];j=acc(prim['attributes']['JOINTS_0']);w=acc(prim['attributes']['WEIGHTS_0']);p0=acc(prim['attributes']['POSITION'])
 displacement=np.linalg.norm(parts[0]-parts[0][0],axis=2)
 sole=((j[:,0]==16)|(j[:,0]==19))&(w[:,0]>.999)&(p0[:,1]<.0001)
 key='a' if '-a.glb' in path.name else 'b';contactmask=(j[:,0]==9)&(w[:,0]>.999)
 # Distal curled finger vertices excluded from rigid support patch measurement.
 for target in prim['targets']:contactmask &= np.linalg.norm(acc(target['POSITION']),axis=1)<1e-10
 blink_targets=[acc(pr['targets'][0]['POSITION']) for pr in g['meshes'][0]['primitives']];bw=clips[(20,'weights')][:,0]
 nonzero_blink=int(sum(np.count_nonzero(np.linalg.norm(d,axis=1)>0) for d in blink_targets))
 r={'file':path.name,'joints':len(g['skins'][0]['joints']),'skinnedMeshNodes':sum('skin' in n and 'mesh' in n for n in nodes),'materials':len(g['materials']),'triangles':sum(len(acc(pr['attributes']['POSITION']))//3 for pr in g['meshes'][0]['primitives']),'samples':len(times),'seconds':float(times[-1]),'allInterpolation':'STEP','boneTracks':len(clips)-1,'blinkMovingVertices':nonzero_blink,'blinkFullClosedSamples':int((bw>.999).sum()),'bodyVertexMaxTravelMeters':float(displacement.max()),'soleMaxTravelMeters':float(displacement[:,sole].max()),'leftPalmRigidPatchMaxTravelMeters':float(displacement[:,contactmask].max()),'fingerTargetMovingVertices':[int(np.count_nonzero(np.linalg.norm(acc(prim['targets'][k]['POSITION']),axis=1)>0)) for k in[1,2]],'textures':[]}
 for im in g['images']:
  v=g['bufferViews'][im['bufferView']];im=Image.open(io.BytesIO(data[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]));r['textures'].append(list(im.size));assert im.size==(256,256)
 assert r['joints']==20 and r['skinnedMeshNodes']==1 and r['materials']==3
 assert all('KHR_materials_unlit' in m['extensions'] for m in g['materials'])
 assert all(s['magFilter']==9728 and s['minFilter']==9728 for s in g['samplers'])
 assert r['soleMaxTravelMeters']<2e-7
 assert (r['blinkMovingVertices']==0 and r['blinkFullClosedSamples']==0) if key=='a' else (r['blinkMovingVertices']>0 and r['blinkFullClosedSamples']>=12)
 if key=='b':assert r['leftPalmRigidPatchMaxTravelMeters']<2e-7
 assert r['bodyVertexMaxTravelMeters']>.003
 assert all(x>0 for x in r['fingerTargetMovingVertices'])
 return r
if __name__=='__main__':
 reports=[check(P/'final'/f'spa-man-{key}.glb') for key in['a','b']]
 (P/'final'/'exported-animation-validation.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
