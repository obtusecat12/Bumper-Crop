import {copyLakeAtlas} from './lake-shape.js?v=35';
import {initializeWeatherTextures} from './weather-textures.js?v=35';
import {initializeLandmarkTextures} from './landmark-textures.js?v=35';
import {buildRayGeometry} from './ray-geometry.js?v=35';
// The render thread never constructs field geometry. Procedural templates remain
// in this worker; unique geometry and instance arrays transfer without copies.
import * as T from './vendor/three.module.min.js';
import {field} from './world.js?v=35';
import {createPacker} from './scene-packets.js?v=35';
import {initializeRuralTextures} from './rural-textures.js?v=35';
if(typeof OffscreenCanvas==='undefined')throw Error('OffscreenCanvas is unavailable');
globalThis.document={createElement(tag){if(tag==='canvas')return new OffscreenCanvas(1,1);throw Error('Unsupported worker element '+tag)}};
const models=await import('./models.js?v=35');
const wheat=await import('./dense-wheat.js?v=35');
await Promise.all([initializeRuralTextures(),initializeLandmarkTextures(),initializeWeatherTextures()]);
const packer=createPacker({T,isSharedResource:models.isSharedModelResource,wind:models.wind});
self.onmessage=event=>{
 const {id,cx,cz,seed,level,quality,collected,knownLakes}=event.data;let chunk;
 try{
  const begin=performance.now(),f=field(cx,cz,seed);
  chunk=models.makeChunk(f,level,quality,new Set(collected));
  if(level===0)chunk.detailPatches=wheat.prepareWheatDetail(f,quality);
  chunk.group.traverse(o=>{o.updateMatrix();if(o!==chunk.group)o.matrixAutoUpdate=false});
  if(level<=1)chunk.rayGeometry=buildRayGeometry(chunk.group,f);
  const generated=performance.now(),result=packer.packChunk(chunk);
  const lakeAtlases=[],seen=new Set(knownLakes||[]);for(const lake of f.roadLakes||[f]){const a=copyLakeAtlas(lake,[...seen]);if(!a)continue;seen.add(a.key);lakeAtlases.push(a);for(const k of ['d','h','rock','width','sed','gx','gz'])result.transfer.push(a[k].buffer);}
  self.postMessage({id,packet:result.packet,lakeAtlases,timing:{generate:generated-begin,pack:performance.now()-generated}},result.transfer);
 }catch(error){self.postMessage({id,error:String(error?.stack||error)})}
 finally{if(chunk)models.disposeChunk(chunk)}
};
self.postMessage({ready:true});
