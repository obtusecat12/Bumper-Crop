import * as T from './vendor/three.module.min.js';
import {bevelBox,worldUV} from './bath-v61-materials.js';
// All small objects are baked into material batches. UVs retain the authored
// label/face layout; architectural pieces alone use metre-scaled projection.
export const ATLAS=[[0,.5,.5,.5],[.5,.5,.5,.5],[0,0,.5,.5],[.5,0,.5,.5]];
export function uvRect(g,r=[0,0,1,1],inset=.007){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,r[0]+(inset+uv.getX(i)*(1-2*inset))*r[2],r[1]+(inset+uv.getY(i)*(1-2*inset))*r[3]);return g;}
export function lathe(k,key,x,y,z,profile,{segments=24,yaw=0,scale=1,uv=null}={}){const g=new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r*scale,h*scale)),segments);if(uv)uvRect(g,uv);return k.add(g,key,x,y,z,[0,yaw,0]);}
export function torus(k,key,x,y,z,r,t=.006,rotation=[Math.PI/2,0,0],segments=24){return k.add(new T.TorusGeometry(r,t,5,segments),key,x,y,z,rotation);}
export function photoBox(k,key,x,y,z,w,h,d,uv=[0,0,1,1],yaw=0){const g=uvRect(bevelBox(w,h,d,Math.min(.018,w*.06,h*.06,d*.15)),uv);return k.add(g,key,x,y,z,[0,yaw,0]);}
export function gridSurface(point,nu=32,nv=24){const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...point(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;ix.push(a,b,c,b,d,c);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
export function card(k,key,x,y,z,w,h,yaw=0,uv=[0,0,1,1],bend=.08){const g=gridSurface((u,v)=>[(u-.5)*w,(v-.5)*h,bend*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)],4,5);uvRect(g,uv,0);k.add(g,key,x,y,z,[0,yaw,0]);}
export function crossPlant(k,key,x,y,z,w,h,yaw=0){card(k,key,x,y+h*.5,z,w,h,yaw);card(k,key,x,y+h*.5,z,w,h,yaw+Math.PI*.5);}
export function roughBox(k,key,x,y,z,w,h,d,seed=1,amount=.02){const g=new T.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),n=Math.sin(a*33+b*18+c*23+seed)*Math.sin(b*47-a*11+c*19)*amount;p.setXYZ(i,a+n*.6,b+n*.45,c+n);}g.computeVertexNormals();worldUV(g,.72);k.add(g,key,x,y,z);}
export function sphereUV(k,key,x,y,z,rx,ry,rz,{uv=null,yaw=0,segments=16,rings=10,deform=null}={}){const g=new T.SphereGeometry(1,segments,rings);if(deform){const p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=deform(a,b,c);p.setXYZ(i,a*f,b,c*f);}g.computeVertexNormals();}if(uv)uvRect(g,uv);k.add(g,key,x,y,z,[0,yaw,0],[rx,ry,rz]);}
export function applyBatchLayers(object){object.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.userData.optical){o.layers.set(3);o.castShadow=false;o.renderOrder=m.userData.order||1;}else if(m.alphaTest>.01){o.castShadow=false;o.receiveShadow=true;}o.matrixAutoUpdate=false;o.updateMatrix();});}
