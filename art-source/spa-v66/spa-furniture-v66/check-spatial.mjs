import * as T from '/workspace/scratch/85111d38430a/level10/dist/vendor/three.module.min.js';
import {createSpaFurniture} from './spa-furniture.mjs';
const mats=Object.fromEntries(['vinyl','chrome','towel','leaf','ceramic','soil','rubber','brass'].map(k=>[k,new T.MeshStandardMaterial({name:k})]));
const g=createSpaFurniture(T,mats);g.updateMatrixWorld(true);
for(const n of ['monstera-east','monstera-northwest']){
const o=g.getObjectByName(n);let radius=0;const p=new T.Vector3();o.traverse(m=>{if(m.isMesh){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);radius=Math.max(radius,Math.hypot(p.x-o.position.x,p.z-o.position.z));}}});
const canopy=o.getObjectByName('rooted-monstera-canopy');const b=new T.Box3().setFromObject(canopy);console.log(JSON.stringify({name:n,maxRadius:radius,canopyMinX:b.min.x}));
}
