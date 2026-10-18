// V132-L27-redo: rock stair cut into a curved cliff (stairRock/shelf), grotto under the arc, flowstone grown
// from the wall (flowMain/flowAnnex), no masonry bed. Based on V131-L27-cliff: v57 mesher + layered/overhanging strata, fissures, niches, enlarged platform,
// masonry stair bed against the left cliff, and baked spot light (SDF shadows) per vertex.
// Offline implicit-surface mesher. The playable boundary stays in level27-layout.
// Unioning the cave and stream tunnel removes all open arch seams/overlap walls.
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.min.js';
import {mergeVertices} from '../dist/vendor/BufferGeometryUtils.js';
import * as L from '../dist/level27-layout.js?v=132r';
import {bakeAt,FLOWSTONES,flowMain,flowAnnex} from '../dist/level27-light131.js';
import {wallPoint,roofPoint,roofHeight,ANNEX} from '../dist/level27-layout.js?v=132r';
import {createCreekAuthority} from '../dist/level27-creek.js?v=65';
const creek=createCreekAuthority(T,L);
const lo=[-2.9,-1.12,-10.65],hi=[7.55,4.9,3.65],h=.10;
const nx=Math.ceil((hi[0]-lo[0])/h)+1,ny=Math.ceil((hi[1]-lo[1])/h)+1,nz=Math.ceil((hi[2]-lo[2])/h)+1;
const values=new Float32Array(nx*ny*nz),at=(i,j,k)=>(k*ny+j)*nx+i;
const smax=(a,b,k)=>{const t=Math.max(0,Math.min(1,.5+.5*(a-b)/k));return b*(1-t)+a*t+k*t*(1-t);};
const gauss=(v,c,w)=>Math.exp(-Math.pow((v-c)/w,2)),sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);},fract=v=>v-Math.floor(v);
const adist=(a,b)=>{let d=Math.abs(a-b)%(Math.PI*2);return d>Math.PI?Math.PI*2-d:d;};
// Air added to a wall (>=0 only: walls recede, never grow into the walk/collision envelope).
function relief(x,y,z,a,r){
 const low=sst(.30,.66,y),keep=(1-gauss(adist(a,3.57),0,.36))*(1-gauss(adist(a,5.12),0,.32)*gauss(y,1.55,.75));
 let veil=0;for(const f of FLOWSTONES)if(f.a!==undefined)veil=Math.max(veil,gauss(adist(a,f.a),0,f.half*1.15)*sst(f.y0-.35,f.y0+.1,y)*(1-sst(f.y1,f.y1+.3,y)));
 const keep2=keep*(1-veil);
 if(low*keep2<=.002)return 0;
 const pale=gauss(adist(a,4.39),0,.45);
 const ph=(y+.17*Math.sin(.9*x+.4*z)+.08*Math.sin(2.3*x-1.7*z+1.1))/.50,s=fract(ph),k=Math.floor(ph);
 const band=Math.max(0,.10+.055*Math.sin(1.7*x+2.9*z+k*1.3)+.035*Math.sin(5.1*x-3.3*z+k*.7));
 let st=band*Math.pow(s,1.5)*(1-sst(.86,1,s))*(1+.9*sst(1.7,2.8,y))*(1-.65*pale);
 let crack=0;for(const [ai,w,y0] of [[.55,.035,.6],[1.28,.03,.9],[2.18,.04,.5],[2.78,.03,.8],[4.02,.03,1.0],[4.93,.035,.5],[5.62,.04,.7],[6.05,.03,.9]]){const aa=ai+.045*Math.sin(y*3.1+ai*5);crack+=.19*gauss(adist(a,aa)*r,0,w*2.4)*sst(y0,y0+.4,y);}
 return low*keep2*(st+crack);
}
const NICHES=[[-1.85,1.75,1.55,.30],[-.55,1.45,2.55,.26],[1.65,2.05,-2.05,.24],[-2.25,2.35,.25,.30],[4.80,2.62,-1.91,.30],[6.9,2.2,1.0,.28],[2.15,2.55,2.25,.26]];
const port=wallPoint(3.57,2.10),length=Math.hypot(port[0],port[2]),out=[port[0]/length,port[2]/length];
// Cache geology evaluations by x/z/y slices, then contour the air/stone interface.
for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
 const x=lo[0]+i*h,z=lo[2]+k*h,r=Math.hypot(x,z),a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),edge=wallPoint(a,roofHeight(a)),ro=roofPoint(a,Math.min(1,r/Math.hypot(edge[0],edge[2])))[1];
 const cs=creek.section(x,z),S=L.STAIRS,sp=L.stairPolar(x,z),rock2=L.stairRock(x,z),grot=L.grottoAir(x,z);
 const tunnelCenter=2.98+.06*Math.sin(z*1.3),half=1.93+.07*Math.sin(z*2.8),tx=(x-tunnelCenter)/half,arch=3.12+1.22*Math.sqrt(Math.max(0,1-tx*tx))+.055*Math.sin(z*2.2)+.02*Math.sin(z*13),ax=(x-port[0])*out[0]+(z-port[2])*out[1],tangent=(x-port[0])*out[1]-(z-port[2])*out[0];
 for(let j=0;j<ny;j++){
  const y=lo[1]+j*h,p=wallPoint(a,y),wr=Math.hypot(p[0],p[2]),room=Math.min(wr-r+(r>wr-.6?relief(x,y,z,a,wr)-flowMain(a,y):0),ro-y,y+1.045);
  const tunnel=Math.min(half-Math.abs(x-tunnelCenter)+.023*Math.sin(y*17+z*3),arch-y,y-(creek.tunnelFloor(x,z,cs)??1.88),-1.00-z,z+10.52);
  const ar=Math.hypot((x-ANNEX.x)/ANNEX.rx,(z-ANNEX.z)/ANNEX.rz),annexE=Math.atan2((z-ANNEX.z)/ANNEX.rz,(x-ANNEX.x)/ANNEX.rx),annexVeil=gauss(adist(annexE,FLOWSTONES[4].e),0,FLOWSTONES[4].half*1.2)*sst(.3,.7,y),annexRel=y>.5?relief(x,y,z,0,2.5)*(1-annexVeil):0,stairRow=z<L.CLIFF_Z+.2?sst(.9,1.6,y-(L.TUNNEL_Y-Math.max(0,z-L.STAIRS.start)/L.STAIRS.tread*L.STAIRS.rise)):1;
  const fA=flowAnnex(annexE,y);
  const annex=Math.min((1-ar)*2.4+annexRel-fA+(y>.5?.03*Math.sin(y*9+z*3)*Math.sin(x*5-y):0),3.66+.30*Math.sin(x*1.1+z*.7)-y,y-.15);
  let d=smax(smax(room,annex,.24),tunnel,.20);
  // Carve the landing/stair descent and creek bend into the same rock boundary.
  // The entrance used to excavate to y=-.12 half a metre BEFORE the first
  // tread. Keep the arrival landing solid and carve a supported stair bed.
  const bankDoor=Math.min(.86-Math.abs(z),3.15-y,y+1.02,x-1.62,3.35-x);
  d=smax(d,bankDoor,.18);
  // grotto under the stair arc + stair-foot floor: air down to the walking floor, clear of the creek bank
  if(grot>-.4){const gf=L.poolFloor(x||1e-6,z||1e-6)-.005,ga=Math.min(grot,cs.distance-(cs.width*.5+cs.bankMargin+.30),y-gf,4.3-y);d=smax(d,ga,.07);}
  d=smax(d,creek.air(cs,y),.055);
  // solids: the rock mass the stair is cut into (its curved face gets the same strata relief), and the
  // corbelled shelf under the treads (undercut toward the floor = cantilevered rock ledge)
  {let rk=rock2;if(rk>-.5){const relA=5.5+.5*Math.max(0,Math.min(1,sp.t/S.sweep));rk-=relief(x,y,z,relA,2.8)*.9;d=-smax(-d,rk,.07);}}
  if(sp.t>-.14&&sp.t<S.sweep+.06&&sp.r>S.R-S.width/2-.2&&sp.r<L.stairWallR(sp.t)+.25&&z>S.cz-.4){const ytop=L.TUNNEL_Y-Math.max(0,Math.min(1,sp.t/S.sweep))*S.count*S.rise-.13,dep=ytop-y,rin=S.R-S.width/2+.07+.40*sst(0,1.3,dep)+.035*Math.sin(y*7.3+sp.t*9.1)+.02*Math.sin(y*17+sp.t*23),sh=Math.min(sp.r-rin,dep,(sp.t+.12)*S.R,(S.sweep+.04-sp.t)*S.R);d=-smax(-d,sh,.05);}
  d=Math.min(d,creek.support(cs,x,y,z));
  const bore=Math.min(.165-Math.hypot(tangent*.71,(y-2.12)*1.3),ax+.22,.39-ax);
  const drainCenter=-.85-.48*Math.max(0,Math.min(1,(z-1.45)/1.1));
  const drain=Math.min(.135-Math.abs(x-drainCenter),.075-y,y+.20,z-1.52,2.68-z);
  d=smax(smax(d,bore,.022),drain,.022);
  for(const [nx_,ny_,nz_,nr] of NICHES)d=smax(d,nr-Math.hypot(x-nx_,(y-ny_)*1.25,z-nz_),.06);
  values[at(i,j,k)]=d;
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
const bake=new Uint8Array(p.length),nv=p.length/3;
const shadow=(spot,q)=>{const lx=spot.p[0]-q[0],ly=spot.p[1]-q[1],lz=spot.p[2]-q[2],D=Math.hypot(lx,ly,lz);let res=1;for(let t=.10;t<D-.08;t+=.07){const v=sample(q[0]+lx/D*t,q[1]+ly/D*t,q[2]+lz/D*t);res=Math.min(res,Math.max(0,8*v/t+.15));if(res<=0)return 0;}return Math.min(1,res);};
for(let i=0;i<p.length;i+=3){const n=[normals[i]/16000,normals[i+1]/16000,normals[i+2]/16000],q=[p[i]+n[0]*.02,p[i+1]+n[1]*.02,p[i+2]+n[2]*.02];
 const open=(sample(q[0]+n[0]*.22,q[1]+n[1]*.22,q[2]+n[2]*.22)+sample(q[0]+n[0]*.45,q[1]+n[1]*.45,q[2]+n[2]*.45)*.5)/.55,cav=Math.max(0,Math.min(1,1-open/.42))*(q[1]>.05?1:.3);
 const c=bakeAt(q,n,cav,shadow);for(let k=0;k<3;k++)bake[i+k]=Math.max(0,Math.min(255,Math.round(c[k]/2*255)));}
const encode=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
fs.writeFileSync('dist/level27-shell-data.js',`// Generated by scripts/build-spring-shell-v132.mjs; geometry + baked spot light per vertex (bake: u8 RGB, value/127.5).\nexport const SPRING_SHELL={scale:3000,vertices:'${encode(quant)}',indices:'${encode(ix)}',normals:'${encode(normals)}',bake:'${encode(bake)}'};\n`);
console.log({grid:[nx,ny,nz],vertices:p.length/3,triangles:ix.length/3,removedComponents,removedVertices,bytes:quant.byteLength+ix.byteLength});
