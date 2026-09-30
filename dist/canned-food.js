import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {random} from './world.js?v=60';

export const CAN_TEXTURES={soup:[384,128],peas:[384,128],tuna:[384,128],peaches:[384,128],lid:[128,128]};
const shared=new Set();
export const canTextures=Object.fromEntries(Object.entries(CAN_TEXTURES).map(([key])=>{
 const t=new T.DataTexture(new Uint8Array([165,160,141,255]),1,1);
 Object.assign(t,{name:'Generated PS1 pantry / '+key,colorSpace:T.SRGBColorSpace,flipY:true,magFilter:T.NearestFilter,minFilter:T.NearestMipmapLinearFilter,generateMipmaps:true,anisotropy:2});t.needsUpdate=true;shared.add(t);return[key,t];
}));
let pending;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Can texture '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(ctx.getImageData(0,0,w,h).data),width:w,height:h};}
export function initializeCanTextures(load=decode){return pending||(pending=Promise.all(Object.entries(CAN_TEXTURES).map(async([key,[w,h]])=>{canTextures[key].image=await load(new URL('./textures/pantry-v58/'+key+'.webp',import.meta.url),w,h);canTextures[key].needsUpdate=true;})).catch(e=>{pending=null;throw e;}));}
const materials=Object.fromEntries(Object.entries(canTextures).map(([k,map])=>{const m=new T.MeshStandardMaterial({name:'PS1 tin / '+k,map,color:0xffffff,roughness:k==='lid'?.57:.9,metalness:k==='lid'?.32:0});shared.add(m);return[k,m];}));
const shell=new T.CylinderGeometry(1,1,1,12,1,true),disc=new T.CircleGeometry(1,12),rim=new T.TorusGeometry(1,.045,3,12);
disc.rotateX(-Math.PI/2);rim.rotateX(-Math.PI/2);for(const g of[shell,disc,rim])shared.add(g);
export const isSharedCanResource=r=>shared.has(r);

// Independent seed: adding provisions never changes doors, barrels or water.
export function planFloorCans(f,w,d,collides=()=>false){
 if(f.variant===1)return[];const r=random((f.seed||1)^0x58ca7e12),items=[];
 const anchors=[[w*.22,d*.18],[-w*.21,-d*.09],[w*.24,-d*.24]];
 const count=2+Math.floor(r()*4),keys=['soup','peas','tuna','peaches'];
 for(let i=0;i<count;i++){
  const kind=keys[Math.floor(r()*4)],radius=kind==='tuna'?.054:.047,height=kind==='tuna'?.044:kind==='peaches'?.145:.113;
  let accepted=null;for(let j=0;j<9;j++){
   const a=anchors[Math.floor(j/3)],x=a[0]+(r()-.5)*.74,z=a[1]+(r()-.5)*.54,extent=.19;
   if(Math.abs(x)>w/2-.35||Math.abs(z)>d/2-.35||collides(x,z,extent)||items.some(q=>Math.hypot(q.x-x,q.z-z)<.23))continue;
   accepted={kind,x,z,radius,height,side:i===1||r()<.27,yaw:r()*Math.PI*2};break;
  }
  if(accepted)items.push(accepted);
 }
 return items;
}
export function makeFloorCans(items,level=0){
 const group=new T.Group();group.name='Seeded PS1 floor provisions';group.userData.floorCans=items;
 if(level===2||!items.length)return group;
 const parts=new Map(),pose=new T.Object3D(),local=new T.Object3D();
 function add(g,key,y,rad,hh=rad,rx=0){
  local.position.set(0,y,0);local.rotation.set(rx,0,0);local.scale.set(rad,hh,rad);local.updateMatrix();
  const out=g.index?g.toNonIndexed():g.clone();out.applyMatrix4(local.matrix).applyMatrix4(pose.matrix);
  if(!parts.has(key))parts.set(key,[]);parts.get(key).push(out);
 }
 for(const q of items){
  pose.position.set(q.x,.002+(q.side?q.radius*1.046:q.height/2+q.radius*.045),q.z);pose.rotation.set(q.side?Math.PI/2:0,q.yaw,0,'YXZ');pose.updateMatrix();
  add(shell,q.kind,0,q.radius,q.height);
  for(const sign of[-1,1]){add(disc,'lid',sign*q.height/2,q.radius,q.radius,sign<0?Math.PI:0);add(rim,'lid',sign*q.height/2,q.radius,q.radius);}
 }
 for(const[key,list]of parts){const g=mergeGeometries(list);list.forEach(g=>g.dispose());g.computeBoundingBox();g.computeBoundingSphere();const m=new T.Mesh(g,materials[key]);m.name='PS1 floor cans / '+key;m.castShadow=m.receiveShadow=true;group.add(m);}
 return group;
}
