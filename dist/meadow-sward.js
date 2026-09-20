import * as T from './vendor/three.module.min.js';
import {ruralTextures} from './rural-textures.js?v=24';
import {prepareCardDrawOrder,CARD_ORDER_KEY} from './instance-order.js?v=24';

const shared=new Set(),layouts=new WeakMap();let templates,mat;
// Bent, intersecting strips show many fine leaves with a small geometry budget.
// Only alpha-tested pixels write depth; there is no transparent-object sorting.
function cardGeometry(level){
 const p=[],uv=[],normal=[],idx=[],planes=level===0?3:2,rows=level===0?3:2;
 for(let c=0;c<planes;c++){
  const a=c*Math.PI/planes,dx=Math.cos(a),dz=Math.sin(a),base=p.length/3;
  for(let row=0;row<=rows;row++)for(let side=0;side<2;side++){
   const t=row/rows,across=(side-.5)*(1-.08*t),lean=t*t*.095;
   p.push(dx*across-dz*lean,t,dz*across+dx*lean);uv.push(side,t);
   // Tilt normals upward for canopy lighting, rather than bright/dark planes.
   normal.push(-dz*.18,.984,dx*.18);
  }
  for(let j=0;j<rows;j++){const a=base+j*2;idx.push(a,a+1,a+3,a,a+3,a+2)}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function initialize(wind){
 if(mat)return;
 templates=[cardGeometry(0),cardGeometry(1)];
 mat=new T.MeshLambertMaterial({map:ruralTextures.meadow,side:T.DoubleSide,alphaTest:.32,depthWrite:true,color:0xffffff});
 shared.add(mat);
 mat.onBeforeCompile=s=>{
  s.uniforms.uTime=wind.time;s.uniforms.uWind=wind.strength;
  s.vertexShader='attribute vec2 swardData; varying vec3 vSward; uniform float uTime; uniform float uWind;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   float variant=swardData.x;
   float base=variant<2.?.942:.902;
   vMapUv=(vec2(mod(variant,2.),floor(variant/2.))+vec2(.02+uv.x*.96,base-uv.y*(base-.03)))*.5;
   vSward=vec3(uv.y,swardData.y,0.);`);
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 root=instanceMatrix[3].xyz;
   float flex=position.y*position.y;
   float wave=sin(uTime*1.18+root.x*.48+root.z*.33)+.34*sin(uTime*1.89+root.z*.91);
   transformed.x+=wave*uWind*.09*flex;
   transformed.z+=sin(uTime*.83+root.x*.39)*uWind*.045*flex;`);
  s.fragmentShader='varying vec3 vSward;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
   #ifdef DOUBLE_SIDED
    normal *= faceDirection;
   #endif`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.rgb*=vSward.y*mix(.74,1.08,smoothstep(0.,.65,vSward.x));`);
 };
 mat.customProgramCacheKey=()=> 'continuous-sward-lit-v15';
}
export function makeSward(f,points,level,wind){
 initialize(wind);const group=new T.Group();group.name='continuous-meadow-sward';
 let layout=layouts.get(points);
 if(!layout){layout={buckets:Array.from({length:16},()=>[]),orders:[]};for(const p of points)layout.buckets[Math.min(3,p.z>>4)*4+Math.min(3,p.x>>4)].push(p);layouts.set(points,layout)}
 const buckets=layout.buckets;
 for(let i=0;i<16;i++){
  const list=buckets[i];if(!list.length)continue;
  const g=templates[level===0?0:1].clone(),data=new Float32Array(list.length*2);
  g.setAttribute('swardData',new T.InstancedBufferAttribute(data,2));
  const mesh=new T.InstancedMesh(g,mat,list.length);mesh.name='sward-patch-'+i;
  const matrices=mesh.instanceMatrix.array,bounds=new T.Box3(),point=new T.Vector3();
  list.forEach((p,j)=>{
   const c=Math.cos(p.angle)*p.width,s=Math.sin(p.angle)*p.width,o=j*16;
   matrices[o]=c;matrices[o+2]=-s;matrices[o+5]=p.height;matrices[o+8]=s;matrices[o+10]=c;matrices[o+12]=p.x;matrices[o+13]=p.y-.025;matrices[o+14]=p.z;matrices[o+15]=1;
   data[j*2]=p.variant;data[j*2+1]=p.tint;
   const extent=p.width*.73+.15;
   bounds.expandByPoint(point.set(p.x-extent,p.y-.04,p.z-extent));bounds.expandByPoint(point.set(p.x+extent,p.y+p.height+.04,p.z+extent));
  });
  mesh.instanceMatrix.needsUpdate=true;mesh.boundingBox=bounds;mesh.boundingSphere=bounds.getBoundingSphere(new T.Sphere());mesh.receiveShadow=true;
  if(!layout.orders[i])layout.orders[i]=prepareCardDrawOrder(mesh);
  // Transfer only copies: cached permutations must survive worker packets.
  mesh.userData[CARD_ORDER_KEY]={...layout.orders[i],orders:layout.orders[i].orders.map(a=>a.slice())};group.add(mesh);
 }
 group.userData.swardCount=points.length;return group;
}
export const isSharedSwardResource=r=>shared.has(r);
