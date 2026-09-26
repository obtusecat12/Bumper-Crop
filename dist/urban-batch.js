import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=51';
const up=new T.Vector3(0,1,0),pose=new T.Object3D(),unitBox=new T.BoxGeometry(1,1,1),unitPlane=new T.PlaneGeometry(1,1),unitSphere=new T.IcosahedronGeometry(1,1);
export const urbanRandom=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
export const urbanHash=(x,z,salt=0)=>{let h=Math.imul(x|0,73856093)^Math.imul(z|0,19349663)^salt;h=Math.imul(h^h>>>13,1274126177);return(h^h>>>16)>>>0;};
export class UrbanBatch{
 constructor(mats){this.mats=mats;this.parts=new Map();this.colliders=[];this.walks=[];this.stack=[{x:0,y:0,z:0,ry:0}];this.triangles=0;this.instances=0;}
 get frame(){return this.stack.at(-1);}
 point(x,y,z){const f=this.frame,c=Math.cos(f.ry),s=Math.sin(f.ry);return{x:f.x+c*x+s*z,y:f.y+y,z:f.z-s*x+c*z};}
 push(x=0,y=0,z=0,ry=0){this.stack.push({...this.point(x,y,z),ry:this.frame.ry+ry});}
 pop(){if(this.stack.length>1)this.stack.pop();}
 add(source,key,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0,tone=1){
  if(!this.mats[key])throw Error('Unknown city material '+key);
  let g=source.index?source.toNonIndexed():source.clone();const projected=!g.attributes.uv;if(projected)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.scale.set(sx,sy,sz);pose.updateMatrix();g.applyMatrix4(pose.matrix);
  if(projected&&URBAN_TILE_SIZE[key]){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,t=URBAN_TILE_SIZE[key];for(let i=0;i<p.count;i++){const ny=Math.abs(n.getY(i)),nx=Math.abs(n.getX(i)),nz=Math.abs(n.getZ(i));u.setXY(i,(ny>nx&&ny>nz?p.getX(i):nx>nz?p.getZ(i):p.getX(i))/t,(ny>nx&&ny>nz?p.getZ(i):p.getY(i))/t);}}
  const f=this.frame;pose.position.set(f.x,f.y,f.z);pose.rotation.set(0,f.ry,0);pose.scale.set(1,1,1);pose.updateMatrix();g.applyMatrix4(pose.matrix);
  const n=g.attributes.position.count,c=new Float32Array(n*3),norm=g.attributes.normal;
  for(let i=0;i<n;i++){const light=.90+.10*Math.max(0,norm?.getY(i)||0);c[i*3]=c[i*3+1]=c[i*3+2]=tone*light;}
  g.setAttribute('color',new T.BufferAttribute(c,3));if(!this.parts.has(key))this.parts.set(key,[]);this.parts.get(key).push(g);this.triangles+=n/3;this.instances++;
 }
 box(key,x,y,z,w,h,d,ry=0,tone=1){
  if(w<=0||h<=0||d<=0)return;const g=unitBox.clone(),uv=g.attributes.uv,tile=URBAN_TILE_SIZE[key];
  if(tile)for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(face<2?d:w)/tile,uv.getY(i)*(face===2||face===3?d:h)/tile);}
  this.add(g,key,x,y,z,w,h,d,ry,0,0,tone);g.dispose();
 }
 plane(key,x,y,z,w,h,ry=0,rx=0,tone=1){const g=unitPlane.clone(),uv=g.attributes.uv,tile=URBAN_TILE_SIZE[key];if(tile)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/tile,uv.getY(i)*h/tile);this.add(g,key,x,y,z,w,h,1,ry,rx,0,tone);g.dispose();}
 rod(key,a,b,r=.04){const va=new T.Vector3(...(Array.isArray(a)?a:a.toArray())),vb=new T.Vector3(...(Array.isArray(b)?b:b.toArray())),v=vb.clone().sub(va),mid=va.clone().add(vb).multiplyScalar(.5);if(v.length()<.0001)return;const g=new T.CylinderGeometry(r,r,v.length(),6,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.normalize()));this.add(g,key,mid.x,mid.y,mid.z);g.dispose();}
 cylinder(key,x,y,z,rt,rb,h,segments=10,rx=0,rz=0,tone=1){const g=new T.CylinderGeometry(rt,rb,h,segments,1);this.add(g,key,x,y,z,1,1,1,0,rx,rz,tone);g.dispose();}
 sphere(key,x,y,z,rx,ry,rz,tone=1){this.add(unitSphere,key,x,y,z,rx,ry,rz,0,0,0,tone);}
 sign(id,x,y,z,w,h,ry=0){this.box('metal',x,y,z,w+.055,h+.055,.11,ry,.89);const dz=.063;this.plane('sign:'+id,x+Math.sin(ry)*dz,y,z+Math.cos(ry)*dz,w,h,ry);}
 solid(x,z,w,d,ry=0){const p=this.point(x,0,z);this.colliders.push({kind:'obb',x:p.x,z:p.z,w,d,ry:ry+this.frame.ry});}
 circle(x,z,r){const p=this.point(x,0,z);this.colliders.push({kind:'circle',x:p.x,z:p.z,r});}
 walk(x,z,w,d,topY,slopeX=0,slopeZ=0){const p=this.point(x,topY,z);this.walks.push({...p,w,d,ry:this.frame.ry,slopeX,slopeZ});}
 finish(name){const root=new T.Group();root.name=name;for(const[key,parts]of this.parts){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();g.computeBoundingBox();const m=new T.Mesh(g,this.mats[key]);m.name=name+' / '+key;m.receiveShadow=true;m.castShadow=!['asphalt','sidewalk','glass','glassLight','photoAsphalt','photoCobble','photoGlass','photoGlassBlue'].includes(key)&&!key.startsWith('sign:');m.userData.exitStatic=true;m.matrixAutoUpdate=false;m.updateMatrix();root.add(m);}this.parts.clear();root.userData.cityStats={triangles:this.triangles,draws:root.children.length,parts:this.instances};return root;}
}
export function resolveUrban(position,solids,radius=.27){
 for(const q of solids){if(q.kind==='circle'){let dx=position.x-q.x,dz=position.z-q.z,d=Math.hypot(dx,dz),min=q.r+radius;if(d<min){if(d<1e-8){dx=1;dz=0;d=1;}position.x=q.x+dx/d*min;position.z=q.z+dz/d*min;}continue;}
  const c=Math.cos(q.ry),s=Math.sin(q.ry),dx=position.x-q.x,dz=position.z-q.z;let x=c*dx-s*dz,z=s*dx+c*dz;const w=q.w/2+radius,d=q.d/2+radius;if(Math.abs(x)>=w||Math.abs(z)>=d)continue;
  if(w-Math.abs(x)<d-Math.abs(z))x=(x<0?-1:1)*w;else z=(z<0?-1:1)*d;position.x=q.x+c*x+s*z;position.z=q.z-s*x+c*z;
 }return position;
}
export function urbanWalkHeight(x,z,walks,base){let y=base;for(const q of walks){const c=Math.cos(q.ry),s=Math.sin(q.ry),dx=x-q.x,dz=z-q.z,u=c*dx-s*dz,v=s*dx+c*dz;if(Math.abs(u)<=q.w/2&&Math.abs(v)<=q.d/2)y=Math.max(y,q.y+u*q.slopeX+v*q.slopeZ);}return y;}
