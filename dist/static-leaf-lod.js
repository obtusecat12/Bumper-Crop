import {bindStaticSelection} from './static-selection.js?v=60';
// Group tiny distant sprays in 3D cells. All three representations are baked
// once; branch locations, species and colours are retained. Near sprays are exact.
export function bakeStaticLeafLOD(mesh){
 const a=mesh.instanceMatrix.array,c=mesh.instanceColor?.array,species=mesh.geometry.attributes.natureSpecies?.array,n=mesh.count,records=[];
 for(let i=0;i<n;i++)records.push([...a.subarray(i*16,i*16+16),...(c?c.subarray(i*3,i*3+3):[1,1,1]),species?.[i]||0]);
 const all=records.flat(),ranges=[{start:0,count:n}];
 for(const cell of [1.1,2.1]){
  const buckets=new Map();for(const r of records){const key=`${Math.floor(r[12]/cell)},${Math.floor(r[13]/cell)},${Math.floor(r[14]/cell)},${r[19]}`;let b=buckets.get(key);if(!b)buckets.set(key,b=[]);b.push(r);}
  const start=all.length/20;
  for(const bucket of buckets.values()){
   const r=bucket[0].slice(),center=[0,0,0],color=[0,0,0],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(const v of bucket)for(let j=0;j<3;j++){center[j]+=v[12+j];color[j]+=v[16+j];min[j]=Math.min(min[j],v[12+j]);max[j]=Math.max(max[j],v[12+j]);}
   const extent=Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])*.42,base=Math.max(.4,Math.hypot(r[0],r[1],r[2]));
   const grow=Math.min(2.15,1+extent/base);
   for(let j=0;j<3;j++){r[12+j]=center[j]/bucket.length;r[16+j]=color[j]/bucket.length;for(let k=0;k<3;k++)r[k*4+j]*=grow;}
   all.push(...r);
  }ranges.push({start,count:all.length/20-start});
 }
 const ids=new Float32Array(all.length/20);for(let i=0;i<ids.length;i++)ids[i]=i;
 bindStaticSelection(mesh,{roots:new Float32Array(all),ids,metadata:null},{shadows:true,extraAttribute:!!species});
 delete mesh.userData.staticSelection;mesh.userData.leafLOD={ranges,level:0};mesh.count=n;
 // Index ranges address alternative roots; CPU/GPU instance buffers never move.
 mesh.boundingSphere.radius+=2.5;
}
function use(mesh,level){const range=mesh.userData.leafLOD.ranges[level];mesh.count=range.count;mesh.material.staticUniforms.uStaticStart.value=range.start;if(mesh.customDepthMaterial)mesh.customDepthMaterial.staticUniforms.uStaticStart.value=range.start;}
export function setLeafLOD(mesh,level){mesh.userData.leafLOD.level=level;use(mesh,level);}
export function selectLeafLOD(mesh,distance){setLeafLOD(mesh,distance<24?0:distance<70?1:2);}
export function bindLeafShadowLOD(mesh){
 mesh.onBeforeShadow=()=>use(mesh,Math.max(1,mesh.userData.leafLOD.level));
 mesh.onAfterShadow=()=>use(mesh,mesh.userData.leafLOD.level);
}
