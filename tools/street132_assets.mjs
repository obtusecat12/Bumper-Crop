// V132-street: Poly Haven CC0 props -> merged, simplified (meshoptimizer), quantised geometry module for UrbanBatch.
import fs from 'fs';import {MeshoptSimplifier as S} from 'meshoptimizer';
await S.ready;
const SPEC={
 hydrant:{src:'fire_hydrant',nodes:[0,1,2,3,4],off:[.3,0,0],tris:520,parts:{0:'body'}},
 trashcan:{src:'metal_trash_can',nodes:[0,2,3],off:[-.5,0,0],tris:420,parts:{0:'body'}},
 lamp:{src:'street_lamp_01',nodes:[0],off:[0,0,0],tris:760,parts:{0:'body',1:'glass',2:'glass'}},
 ubox1:{src:'utility_box_01',nodes:[0],off:[0,0,0],tris:500,parts:{0:'body'}},
 ubox2:{src:'utility_box_02',nodes:[0],off:[0,0,0],tris:700,parts:{0:'body'}},
};
const qrot=(q,v)=>{const[x,y,z,w]=q,[vx,vy,vz]=v;const ix=w*vx+y*vz-z*vy,iy=w*vy+z*vx-x*vz,iz=w*vz+x*vy-y*vx,iw=-x*vx-y*vy-z*vz;return[ix*w+iw*-x+iy*-z-iz*-y,iy*w+iw*-y+iz*-x-ix*-z,iz*w+iw*-z+ix*-y-iy*-x];};
const out={};
for(const [name,sp] of Object.entries(SPEC)){
 const dir='ph/'+sp.src+'/';const g=JSON.parse(fs.readFileSync(dir+sp.src+'_1k.gltf'));const bin=fs.readFileSync(dir+g.buffers[0].uri);
 const acc=i=>{const a=g.accessors[i],bv=g.bufferViews[a.bufferView];const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];const off=(bv.byteOffset||0)+(a.byteOffset||0);
  if(a.componentType===5126)return new Float32Array(bin.buffer.slice(bin.byteOffset+off,bin.byteOffset+off+a.count*n*4));
  if(a.componentType===5125)return new Uint32Array(bin.buffer.slice(bin.byteOffset+off,bin.byteOffset+off+a.count*4));
  if(a.componentType===5123)return Uint32Array.from(new Uint16Array(bin.buffer.slice(bin.byteOffset+off,bin.byteOffset+off+a.count*2)));throw a.componentType;};
 const groups={};
 for(const ni of sp.nodes){const nd=g.nodes[ni];const t=nd.translation||[0,0,0],r=nd.rotation||[0,0,0,1],s=nd.scale||[1,1,1];
  for(const p of g.meshes[nd.mesh].primitives){const part=sp.parts[p.material]||'body';const G=groups[part]||(groups[part]={v:[],i:[]});
   const P=acc(p.attributes.POSITION),N=acc(p.attributes.NORMAL),U=acc(p.attributes.TEXCOORD_0),I=acc(p.indices);const base=G.v.length/8;
   for(let k=0;k<P.length/3;k++){const pp=qrot(r,[P[k*3]*s[0],P[k*3+1]*s[1],P[k*3+2]*s[2]]),nn=qrot(r,[N[k*3],N[k*3+1],N[k*3+2]]);
    G.v.push(pp[0]+t[0]+sp.off[0],pp[1]+t[1]+sp.off[1],pp[2]+t[2]+sp.off[2],nn[0],nn[1],nn[2],U[k*2],U[k*2+1]);}
   for(const x of I)G.i.push(x+base);}}
 const tot=Object.values(groups).reduce((a,G)=>a+G.i.length/3,0);out[name]={};
 for(const [part,G] of Object.entries(groups)){
  const v=new Float32Array(G.v),idx=new Uint32Array(G.i);const target=Math.max(36,Math.round(sp.tris*(G.i.length/3)/tot))*3;
  let res=idx;if(idx.length>target){
   // weld by position only for simplification topology, keep attributes via simplifyWithAttributes
   const pos=new Float32Array(v.length/8*3);for(let k=0;k<v.length/8;k++){pos[k*3]=v[k*8];pos[k*3+1]=v[k*8+1];pos[k*3+2]=v[k*8+2];}
   const attr=new Float32Array(v.length/8*2);for(let k=0;k<v.length/8;k++){attr[k*2]=v[k*8+6];attr[k*2+1]=v[k*8+7];}
   [res]=S.simplifyWithAttributes(idx,pos,3,attr,2,[.5,.5],null,target,0.05,['LockBorder']);
   if(res.length>target*1.3){[res]=S.simplify(idx,pos,3,target,0.2,[]);}
   if(res.length>target*1.3){res=S.simplifySloppy(idx,pos,3,null,target,0.05)[0];}
  }
  // compact
  const map=new Map(),nv=[],ni=[];for(const x of res){if(!map.has(x)){map.set(x,nv.length/8);for(let q=0;q<8;q++)nv.push(v[x*8+q]);}ni.push(map.get(x));}
  out[name][part]={v:Buffer.from(new Float32Array(nv).buffer).toString('base64'),i:Buffer.from(new Uint16Array(ni).buffer).toString('base64'),tris:ni.length/3};
  let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let k=0;k<nv.length;k+=8)for(let q=0;q<3;q++){mn[q]=Math.min(mn[q],nv[k+q]);mx[q]=Math.max(mx[q],nv[k+q]);}
  console.log(name,part,'src',G.i.length/3,'->',ni.length/3,'bbox',mn.map(x=>x.toFixed(2)),mx.map(x=>x.toFixed(2)));
 }
}
fs.writeFileSync('geo.json',JSON.stringify(out));
