import * as T from './vendor/three.module.min.js';
import {prepareSky133,keySky133,weld133} from './venue133-bake.js';
import {cyclesMaterial} from './level0-cycles-material.js';
export function bakeAtrium149(root){
 if(new URLSearchParams(location.search).get('atriumBake')==='0'||new URLSearchParams(location.search).get('bake')==='0')return {ready:Promise.resolve()};
 const prep=prepareSky133([[root,1.6]],{gain:0,keep:1,floor:0});globalThis.__bcAtrium149=prep;
 prep.ready=(async()=>{try{
  const [manifest,response]=await Promise.all([fetch('./assets/level0-atrium-cycles/manifest.json').then(r=>{if(!r.ok)throw Error('Atrium manifest');return r.json();}),fetch('./assets/level0-atrium-cycles/irradiance.bin.gz')]);if(!response.ok)throw Error('Atrium bake');
  const data=new Uint8Array(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());await keySky133(prep);
  const records=new Map(manifest.meshes.map(m=>[m.key,m])),materials=new Map();
  for(const {mesh,key}of prep.list){const rec=records.get(key),{remap,count}=weld133(mesh.geometry);if(!rec||rec.count!==count||rec.offset+count*3>data.length){prep.miss++;continue;}
   const values=new Uint8Array(remap.length*3);for(let i=0;i<remap.length;i++){const j=rec.offset+remap[i]*3;values.set(data.subarray(j,j+3),i*3);}mesh.geometry.setAttribute('cyclesBake',new T.BufferAttribute(values,3,true));
   let m=materials.get(mesh.material);if(!m){m=cyclesMaterial(mesh.material,{id:'atrium',vertex:true,sample:'vec4(vCyclesBake*vCyclesBake*4.*exp(-max(0.,-cyclesWorld.y-3.)*.075),1.)'});materials.set(mesh.material,m);}mesh.material=m;prep.hit++;
  }prep.filled=true;
 }catch(e){prep.error=String(e);console.warn('Atrium bake unavailable; preserving original lighting',e);}return prep;})();return prep;
}
