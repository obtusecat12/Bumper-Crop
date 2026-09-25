import assert from 'node:assert/strict';
import fs from 'node:fs';
import {field,stringSeed,surfaceHeight,height} from '../../dist/world.js?v=32';
import {pondMetrics,pondContours,pondTerrainHeight,copyLakeAtlas,acceptLakeAtlas,lakeAtlasKeys,lakeCacheStats} from '../../dist/lake-shape.js?v=32';
import {terrainGeometry} from '../../dist/ground.js?v=32';
import {waterGeometry} from '../../dist/lake.js?v=32';
import {findNearestLandmark,findSafeLanding} from '../../dist/developer-tools.js?v=32';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),f=field(-2n,0n,seed,false),results={};
let contourError=0,seamError=0,waterTriangles=0;
for(const loop of pondContours(f)){
 assert(Math.hypot(loop[0].x-loop.at(-1).x,loop[0].z-loop.at(-1).z)<1e-5,'closed contour');
 for(const p of loop)contourError=Math.max(contourError,Math.abs(pondTerrainHeight(p.x,p.z,f,0)-f.lakeY));
}
assert(contourError<1e-7,'final-height contours meet water level');
for(let z=-2;z<=2;z++)for(let x=-4;x<=0;x++){
 const a=field(BigInt(x),BigInt(z),seed,false),b=field(BigInt(x+1),BigInt(z),seed,false),c=field(BigInt(x),BigInt(z+1),seed,false);
 for(let t=0;t<=64;t+=.5){seamError=Math.max(seamError,Math.abs(surfaceHeight(64,t,a)-surfaceHeight(0,t,b)),Math.abs(surfaceHeight(t,64,a)-surfaceHeight(t,0,c)));}
 if(a.type!=='pond')continue;
 const ground=terrainGeometry(a,1),g=waterGeometry(a,a.lakeY,1);assert.equal(terrainGeometry(a,1),ground,'water uses same ground geometry');
 for(const [name,attr]of Object.entries(g.attributes))for(const value of attr.array)assert(Number.isFinite(value),name+' finite');
 for(let i=1;i<g.attributes.position.array.length;i+=3)assert(Math.abs(g.attributes.position.array[i]-a.lakeY)<1e-6,'water level');
 waterTriangles+=g.index.count/3;g.dispose();ground.dispose();
}
assert(seamError<1e-6,'height continuity across lake and ordinary tiles');
// Regression: a flat rock summit must not switch back to farmland at h/slope>28.
const rock={...f,cx:0,cz:0,rx:66,rz:49,angle:-.14,lakeSeed:4,lakeY:-.75},rm=pondMetrics(-58,-21,rock);
assert(rm.rawMetres<4&&rm.metres<7);assert(surfaceHeight(-58,-21,rock)>height(-58,-21,rock.x,rock.z)+.8,'bedrock summit retained');
// Transfer exactly the precomputed worker field; original arrays stay attached.
const before=pondMetrics(12.3,40.7,f),copy=copyLakeAtlas(f,[]),bytes=copy.h.byteLength;
const moved=structuredClone(copy,{transfer:['d','h','rock','width','sed','gx','gz'].map(k=>copy[k].buffer)});
assert.equal(copy.h.byteLength,0);assert.deepEqual(pondMetrics(12.3,40.7,f),before);acceptLakeAtlas(moved);
assert.equal(copyLakeAtlas(f,lakeAtlasKeys()),null);assert.deepEqual(pondMetrics(12.3,40.7,f),before);
for(let n=0;n<8;n++)pondMetrics(1,1,{...f,lakeSeed:700+n});
assert.deepEqual(pondMetrics(12.3,40.7,f),before,'eviction/rebuild deterministic');assert(lakeCacheStats().lakes<=6);
const it=findNearestLandmark({cx:0n,cz:0n,x:.6,z:52},seed,'pond');let next;do{next=it.next()}while(!next.done);assert(next.value,'lake target');
const landing=findSafeLanding(next.value,[]);assert(landing,'dry walkable bank found');assert(landing.y-1.77>next.value.field.lakeY+.035);
Object.assign(results,{pass:true,contourError,seamError,waterTriangles,rockSummit:true,workerAtlasTransferBytes:bytes*7,cache:lakeCacheStats(),safeLakeLanding:{cx:String(landing.cx),cz:String(landing.cz),x:landing.x,z:landing.z}});
fs.writeFileSync(new URL('../../docs/shore-v32/checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
