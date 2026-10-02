// Offline implicit-surface mesher. The playable boundary stays in level27-layout.
// Unioning the cave and stream tunnel removes all open arch seams/overlap walls.
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.min.js';
import {mergeVertices} from '../dist/vendor/BufferGeometryUtils.js';
import * as L from '../dist/level27-layout.js?v=67';
import {wallPoint,roofPoint,roofHeight,ANNEX} from '../dist/level27-layout.js?v=67';
import {createCreekAuthority} from '../dist/level27-creek.js?v=65';
const creek=createCreekAuthority(T,L);
const lo=[-2.9,-1.12,-10.65],hi=[6.65,4.9,3.1],h=.115;
const nx=Math.ceil((hi[0]-lo[0])/h)+1,ny=Math.ceil((hi[1]-lo[1])/h)+1,nz=Math.ceil((hi[2]-lo[2])/h)+1;
const values=new Float32Array(nx*ny*nz),at=(i,j,k)=>(k*ny+j)*nx+i;
const smax=(a,b,k)=>{const t=Math.max(0,Math.min(1,.5+.5*(a-b)/k));return b*(1-t)+a*t+k*t*(1-t);};
const port=wallPoint(3.57,2.10),length=Math.hypot(port[0],port[2]),out=[port[0]/length,port[2]/length];
// Cache geology evaluations by x/z/y slices, then contour the air/stone interface.
for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
 const x=lo[0]+i*h,z=lo[2]+k*h,r=Math.hypot(x,z),a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),edge=wallPoint(a,roofHeight(a)),ro=roofPoint(a,Math.min(1,r/Math.hypot(edge[0],edge[2])))[1];
 const cs=creek.section(x,z);
 const tunnelCenter=2.98+.06*Math.sin(z*1.3),half=1.93+.07*Math.sin(z*2.8),tx=(x-tunnelCenter)/half,arch=3.12+1.22*Math.sqrt(Math.max(0,1-tx*tx))+.055*Math.sin(z*2.2)+.02*Math.sin(z*13),ax=(x-port[0])*out[0]+(z-port[2])*out[1],tangent=(x-port[0])*out[1]-(z-port[2])*out[0];
 for(let j=0;j<ny;j++){
  const y=lo[1]+j*h,p=wallPoint(a,y),room=Math.min(Math.hypot(p[0],p[2])-r,ro-y,y+1.045);
  const tunnel=Math.min(half-Math.abs(x-tunnelCenter)+.023*Math.sin(y*17+z*3),arch-y,y-(creek.tunnelFloor(x,z,cs)??1.88),-1.00-z,z+10.52);
  const ar=Math.hypot((x-ANNEX.x)/ANNEX.rx,(z-ANNEX.z)/ANNEX.rz),annex=Math.min((1-ar)*2.25+(y>.5?.045*Math.sin(y*9+z*3)*Math.sin(x*5-y):0),3.62+.30*Math.sin(x*1.1+z*.7)-y,y-.15);
  let d=smax(smax(room,annex,.24),tunnel,.20);
  // Carve the landing/stair descent and creek bend into the same rock boundary.
  // The entrance used to excavate to y=-.12 half a metre BEFORE the first
  // tread. Keep the arrival landing solid and carve a supported stair bed.
  const along=Math.max(0,z-L.STAIRS.start),settle=T.MathUtils.smoothstep(along,0,.18);
  const stairBed=z<L.STAIRS.start?L.TUNNEL_Y:Math.max(.19,L.TUNNEL_Y-along/L.STAIRS.tread*L.STAIRS.rise-.010-.10*settle);
  const access=Math.min(.91-Math.abs(x-(3.4+.17*Math.sin(z))),3.96-y,y-stairBed,-.03-z,z+3.6);
  const bankDoor=Math.min(.86-Math.abs(z),3.15-y,y+1.02,x-1.62,3.35-x);
  d=smax(smax(d,access,.035),bankDoor,.18);
  d=smax(d,creek.air(cs,y),.055);
  d=Math.min(d,creek.support(cs,x,y,z));
  const bore=Math.min(.165-Math.hypot(tangent*.71,(y-2.12)*1.3),ax+.22,.39-ax);
  const drainCenter=-.85-.48*Math.max(0,Math.min(1,(z-1.45)/1.1));
  const drain=Math.min(.135-Math.abs(x-drainCenter),.075-y,y+.20,z-1.52,2.68-z);
  d=smax(smax(d,bore,.022),drain,.022);values[at(i,j,k)]=d;
 }
}
const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],positions=[];
const emit=(a,b,c)=>positions.push(...a,...b,...c);
for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
 const vv=corners.map(c=>values[at(i+c[0],j+c[1],k+c[2])]);if(vv.every(v=>v>=0)||vv.every(v=>v<0))continue;
 const pp=corners.map(c=>[lo[0]+(i+c[0])*h,lo[1]+(j+c[1])*h,lo[2]+(k+c[2])*h]);
 const cross=(a,b)=>{const t=vv[a]/(vv[a]-vv[b]);return pp[a].map((v,q)=>v+(pp[b][q]-v)*t);};
 for(const tet of tetra){const pos=tet.filter(c=>vv[c]>=0),neg=tet.filter(c=>vv[c]<0);if(!pos.length||!neg.length)continue;
  if(pos.length===1||neg.length===1){const flip=pos.length===1,one=(flip?pos:neg)[0],many=flip?neg:pos;const tri=many.map(c=>cross(one,c));if(flip)emit(tri[0],tri[1],tri[2]);else emit(tri[0],tri[2],tri[1]);}
  else{const[a,b]=pos,[c,d]=neg,p=cross(a,c),q=cross(a,d),r=cross(b,c),s=cross(b,d);emit(p,q,r);emit(q,s,r);}
 }
}
// Tetrahedron winding depends on permutation; orient each triangle toward air.
for(let n=0;n<positions.length;n+=9){const a=new T.Vector3(...positions.slice(n,n+3)),b=new T.Vector3(...positions.slice(n+3,n+6)),c=new T.Vector3(...positions.slice(n+6,n+9)),normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),mid=a.clone().add(b).add(c).multiplyScalar(1/3);
 const sample=p=>{const i=Math.max(1,Math.min(nx-2,Math.round((p.x-lo[0])/h))),j=Math.max(1,Math.min(ny-2,Math.round((p.y-lo[1])/h))),k=Math.max(1,Math.min(nz-2,Math.round((p.z-lo[2])/h)));return new T.Vector3(values[at(i+1,j,k)]-values[at(i-1,j,k)],values[at(i,j+1,k)]-values[at(i,j-1,k)],values[at(i,j,k+1)]-values[at(i,j,k-1)]);};
 if(normal.dot(sample(mid))<0)for(let v=0;v<3;v++){const t=positions[n+3+v];positions[n+3+v]=positions[n+6+v];positions[n+6+v]=t;}
}
let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g=mergeVertices(g,.000001);
// Smooth unions can leave enclosed solid islands at intersecting ceilings.
// They are disconnected rock chips, not part of the geological shell. Remove
// whole components offline without punching holes or adding patch planes.
const parent=Int32Array.from({length:g.attributes.position.count},(_,i)=>i);
const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
for(let i=0;i<g.index.count;i+=3){const a=root(g.index.array[i]);for(let k=1;k<3;k++)parent[root(g.index.array[i+k])]=a;}
const sizes=new Map();for(let i=0;i<parent.length;i++){const r=root(i);sizes.set(r,(sizes.get(r)||0)+1);}
const main=[...sizes].sort((a,b)=>b[1]-a[1])[0][0],remap=new Int32Array(parent.length).fill(-1),kept=[],keptIndices=[];
for(let i=0;i<parent.length;i++)if(root(i)===main){remap[i]=kept.length/3;kept.push(g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i));}
for(let i=0;i<g.index.count;i+=3)if(remap[g.index.array[i]]>=0)keptIndices.push(...Array.from(g.index.array.slice(i,i+3),v=>remap[v]));
const removedComponents=sizes.size-1,removedVertices=parent.length-kept.length/3;
g.dispose();g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(kept,3));g.setIndex(keptIndices);
// Keep isosurface topology intact. Coarser sampling bounds triangle cost;
// vertex clustering is deliberately avoided because it can puncture thin folds.
const p=g.attributes.position.array,quant=new Int16Array(p.length);for(let i=0;i<p.length;i++)quant[i]=Math.round(p[i]*3000);const clean=[],unique=new Set();for(let i=0;i<g.index.count;i+=3){const[a,b,c]=g.index.array.slice(i,i+3);if(a===b||a===c||b===c)continue;const key=[a,b,c].sort((a,b)=>a-b).join(',');if(unique.has(key))continue;unique.add(key);clean.push(a,b,c);}const ix=new Uint32Array(clean);
// Interpolated signed-field gradients avoid cancellation on fine tetrahedral edges.
const sample=(x,y,z)=>{const fi=Math.max(0,Math.min(nx-1.001,(x-lo[0])/h)),fj=Math.max(0,Math.min(ny-1.001,(y-lo[1])/h)),fk=Math.max(0,Math.min(nz-1.001,(z-lo[2])/h)),i=Math.floor(fi),j=Math.floor(fj),k=Math.floor(fk),u=fi-i,v=fj-j,w=fk-k;let q=0;for(let c=0;c<8;c++){const[x,y,z]=corners[c];q+=values[at(i+x,j+y,k+z)]*(x?u:1-u)*(y?v:1-v)*(z?w:1-w);}return q;};
const normals=new Int16Array(p.length),e=.030;
for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1],z=p[i+2],n=[sample(x+e,y,z)-sample(x-e,y,z),sample(x,y+e,z)-sample(x,y-e,z),sample(x,y,z+e)-sample(x,y,z-e)],length=Math.hypot(...n)||1;for(let k=0;k<3;k++)normals[i+k]=Math.round(n[k]/length*16000);}
// Use the same smooth gradient for winding as for shading. Coarse cell gradients
// can otherwise flip tiny grazing triangles in a DoubleSide cave material.
for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,ab=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],ac=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],cr=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],dot=cr.reduce((n,v,k)=>n+v*(normals[a+k]+normals[b+k]+normals[c+k]),0);if(dot<0){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}}
const encode=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
fs.writeFileSync('dist/level27-shell-data.js',`// Generated by scripts/build-spring-shell-v57.mjs; geometry only, no baked picture.\nexport const SPRING_SHELL={scale:3000,vertices:'${encode(quant)}',indices:'${encode(ix)}',normals:'${encode(normals)}'};\n`);
console.log({grid:[nx,ny,nz],vertices:p.length/3,triangles:ix.length/3,removedComponents,removedVertices,bytes:quant.byteLength+ix.byteLength});
