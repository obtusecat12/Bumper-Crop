import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js'),W=await import('../../dist/world.js?v=40'),L=await import('../../dist/cereal-layout.js?v=40'),D=await import('../../dist/dense-wheat.js?v=40');
const R=await import('../../dist/road-surface.js?v=40'),P=await import('../../dist/plant-texture.js?v=40');
const seed=W.stringSeed('CHLORINE / ABUNDANCE / 10'),wind={time:{value:0},strength:{value:.32}},layer=D.createWheatDetailLayer(wind,{workerFactory:()=>null});
await D.initializeCerealTextures(async()=>new Uint8Array(1024*1024*4).fill(255));
assert.equal(D.crossedCerealGeometry().index.count,12);
for(let z=0;z<=2;z++)for(let x=-2;x<=2;x++)layer.accept(L.generateCerealCell(BigInt(x),BigInt(z),seed));
const digest=m=>createHash('sha256').update(new Uint8Array(m.instanceMatrix.array.buffer)).update(new Uint8Array(m.instanceColor.array.buffer)).digest('hex');
const initial=new Map([...layer.cells.values()].map(m=>[m,{hash:digest(m),matrix:m.instanceMatrix.version,color:m.instanceColor.version,textures:m.material.staticTextures.map(t=>t.version)}]));
for(const m of layer.cells.values()){m.setMatrixAt=()=>{throw Error('Runtime matrix write');};m.setColorAt=()=>{throw Error('Runtime colour write');};}
let maxRadius=0,maxTriangles=0;
const cases=[['0,0',.6,52],['0,0',39.99,52],['0,0',40.01,52],['0,0',-.01,52],['0,0',63.9,52],['1,0',-.1,52],['0,1',.6,-.1],['0,0',.6,63.9]];
for(const [origin,x,z]of cases){
 const camera=new T.Vector3(x,1.77,z);layer.update(new Map(),camera,'balanced',origin);let count=0;
 for(const m of layer.cells.values())if(m.visible){
  const [roots,ids]=m.material.staticTextures.map(t=>t.image.data),start=m.material.staticUniforms.uStaticStart.value;
  for(let i=0;i<m.count;i++){
   const r=ids[start+i]*20,rx=roots[r+12]+m.position.x,rz=roots[r+14]+m.position.z,dist=Math.hypot(rx-x,rz-z);
   // Padding covers all card corners, random tilt and bounded GPU wind.
   maxRadius=Math.max(maxRadius,dist+1.05);assert(dist+1.05<=35.001);
  }count+=m.count;
 }
 assert(count<=25000);assert.equal(count,layer.object.count);maxTriangles=Math.max(maxTriangles,count*4);
}
for(const [m,a]of initial){assert.equal(digest(m),a.hash);assert.equal(m.instanceMatrix.version,a.matrix);assert.equal(m.instanceColor.version,a.color);assert.deepEqual(m.material.staticTextures.map(t=>t.version),a.textures);}
// The same absolute location is identical across 64 m world-origin rebasing.
function positions(origin,x,z){layer.update(new Map(),new T.Vector3(x,1.77,z),'balanced',origin);const [ox,oz]=origin.split(',').map(Number),list=[];for(const m of layer.cells.values())if(m.visible){const [r,ids]=m.material.staticTextures.map(t=>t.image.data),start=m.material.staticUniforms.uStaticStart.value;for(let i=0;i<m.count;i++){const j=ids[start+i]*20;list.push([r[j+12]+m.position.x+ox*64,r[j+14]+m.position.z+oz*64].join(','));}}return list.sort();}
assert.deepEqual(positions('0,0',63.9,52),positions('1,0',-.1,52));
// Requested rut micro-relief changes terrain height, while static poses stay immutable.
for(let t=0;t<64;t++){
 const wheel=R.wheelProfile(.9,t),middle=R.wheelProfile(0,t),berm=R.wheelProfile(1.115,t);
 assert(wheel.rut===1&&wheel.cut>=.08&&wheel.cut<=.12);assert(middle.rut===0);
 assert(berm.relief>=.03&&berm.relief<=.05);
 assert.deepEqual(R.wheelProfile(-.9,t),wheel);
}
// Transparent texels must keep plant RGB through every alpha-weighted mip.
const pixels=new Uint8Array(8*8*4);for(let i=0;i<64;i++)pixels.set([255,255,255,0],i*4);
pixels.set([121,83,34,255],(3*8+3)*4);const texture=P.plantTexture(pixels,8,8);
assert.equal(texture.image.data[3],0);assert.deepEqual(Array.from(texture.image.data.slice(0,3)),[121,83,34]);
for(const m of texture.mipmaps)for(let i=0;i<m.data.length;i+=4)if(m.data[i+3])assert.deepEqual(Array.from(m.data.slice(i,i+3)),[121,83,34]);
texture.dispose();
assert(!readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8').includes('cardOrder.update'));
console.log(JSON.stringify({poses:cases.length,maxGeometryRadius:maxRadius,maxCerealTriangles:maxTriangles,matricesUnchanged:true,coloursUnchanged:true,texturesUnchanged:true,rebasingInvariant:true,rutProfileMatched:true,alphaWeightedMips:true},null,2));layer.dispose();
