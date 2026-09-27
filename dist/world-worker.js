import {initializeExitTextures} from './exit-textures.js?v=56';
import {initializeVergeTextures} from './verge-cards.js?v=56';
import {readChunkCache,writeChunkCache} from './chunk-cache.js?v=56';
import {snapshotGround,restoreGround} from './ground.js?v=56';
import {copyLakeAtlas} from './lake-shape.js?v=56';
import {initializeWeatherTextures} from './weather-textures.js?v=56';
import {initializeLandmarkTextures} from './landmark-textures.js?v=56';
import {buildRayGeometry} from './ray-geometry.js?v=56';
// The render thread never constructs field geometry. Procedural templates remain
// in this worker; unique geometry and instance arrays transfer without copies.
import * as T from './vendor/three.module.min.js';
import {field} from './world.js?v=56';
import {createPacker} from './scene-packets.js?v=56';
import {initializeRuralTextures} from './rural-textures.js?v=56';
if(typeof OffscreenCanvas==='undefined')throw Error('OffscreenCanvas is unavailable');
globalThis.document={createElement(tag){if(tag==='canvas')return new OffscreenCanvas(1,1);throw Error('Unsupported worker element '+tag)}};
const models=await import('./models.js?v=56');
await Promise.all([initializeRuralTextures(),initializeExitTextures(),initializeLandmarkTextures(),initializeWeatherTextures(),initializeVergeTextures()]);
const packer=createPacker({T,isSharedResource:models.isSharedModelResource,wind:models.wind});
self.onmessage=async event=>{
 const {id,cx,cz,seed,level,quality,collected,knownLakes}=event.data;let chunk;
 try{
  const begin=performance.now(),cacheKey=`${seed}:${cx},${cz}:${level}:${quality}`,cached=await readChunkCache(cacheKey),f=cached?.field||field(cx,cz,seed);
  if(cached?.ground)restoreGround(f,cached.ground);
  chunk=models.makeChunk(f,level,quality,new Set(collected));
  // Commit CPU arrays before the packet transfers their backing buffers.
  if(!cached)await writeChunkCache({key:cacheKey,field:f,ground:snapshotGround(f,level)});
  chunk.group.traverse(o=>{o.updateMatrix();if(o!==chunk.group)o.matrixAutoUpdate=false});
  if(level<=1)chunk.rayGeometry=buildRayGeometry(chunk.group,f);
  const generated=performance.now(),result=packer.packChunk(chunk);
  const lakeAtlases=[],seen=new Set(knownLakes||[]);for(const lake of f.roadLakes||[f]){const a=copyLakeAtlas(lake,[...seen]);if(!a)continue;seen.add(a.key);lakeAtlases.push(a);for(const k of ['d','h','rock','width','sed','gx','gz'])result.transfer.push(a[k].buffer);}
  self.postMessage({id,packet:result.packet,lakeAtlases,timing:{cacheHit:!!cached,generate:generated-begin,pack:performance.now()-generated}},result.transfer);
 }catch(error){self.postMessage({id,error:String(error?.stack||error)})}
 finally{if(chunk)models.disposeChunk(chunk)}
};
self.postMessage({ready:true});
