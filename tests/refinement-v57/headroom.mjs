import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const{createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');const L=await import('../../dist/level27-layout.js?v=57');const M=await import('../../dist/level27-materials.js?v=57');await M.initializeSpringTextures(async(url,w,h)=>{const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return {width:w,height:h,data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data)};});
const cave=(await import('../../dist/level27-scene.js?v=57')).createLevel27();cave.scene.updateMatrixWorld(true);const rocks=cave.scene.children[0].children.filter(o=>o.material===cave.materials.rock),ray=new T.Raycaster();let min=100,bad=[];
for(let z=-7.5;z<1.30;z+=.073){const f=L.springFloor(1.23,z);ray.set(new T.Vector3(1.23,f+.03,z),new T.Vector3(0,1,0));const h=ray.intersectObjects(rocks)[0];const room=h?h.distance+.03:100;min=Math.min(min,room);if(room<1.86)bad.push([+z.toFixed(3),+room.toFixed(3)]);}
console.log({minimumHeadroom:min,bad});assert(bad.length===0,'rock clips staircase headroom');
