import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');
const C=await import('../../dist/canned-food.js?v=58'),B=await import('../../dist/buildings.js?v=58'),I=await import('../../dist/cereal-interaction.js?v=58'),D=await import('../../dist/dense-wheat.js?v=58'),L=await import('../../dist/cereal-layout.js?v=58'),W=await import('../../dist/world.js?v=58'),P=await import('../../dist/scene-packets.js?v=58');
await C.initializeCanTextures(async(url,w,h)=>{const im=await loadImage(url.pathname);assert.equal(im.width,w);assert.equal(im.height,h);const cn=createCanvas(w,h);cn.getContext('2d').drawImage(im,0,0);return{data:new Uint8Array(cn.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};});
const report={buildings:0,cans:0,sideways:0,kinds:new Set(),floorError:0};
for(let variant=0;variant<8;variant++)for(let k=0;k<4;k++){
 const f={variant,seed:58657+k*9721,cx:12.4,cz:22.5,buildingY:.35,buildingAngle:k*.61,buildingScale:.87+k*.07,x:0n,z:0n,key:'test:'+variant+':'+k};
 const building=B.makeRuralBuilding(f),items=building.group.userData.floorCans;report.buildings++;
 assert.deepEqual(items,B.makeRuralBuilding(f,2).group.userData.floorCans,'stable across LOD');
 if(variant===1)assert.equal(items.length,0);else assert(items.length>=2);
 const [w,d]=B.unscaledBuildingDimensions(f),s=f.buildingScale,c=Math.cos(f.buildingAngle),sn=Math.sin(f.buildingAngle);
 for(const item of items){
  assert(Math.abs(item.x)<w/2-.3&&Math.abs(item.z)<d/2-.3);
  const x=f.cx+s*(c*item.x+sn*item.z),z=f.cz+s*(-sn*item.x+c*item.z);
  for(const q of building.colliders){const cc=Math.cos(q.angle),ss=Math.sin(q.angle),dx=x-q.x,dz=z-q.z;assert(Math.abs(cc*dx-ss*dz)>=q.hx+.15*s||Math.abs(ss*dx+cc*dz)>=q.hz+.15*s,'cans outside furniture collision');}
  const one=C.makeFloorCans([item]);one.updateMatrixWorld(true);const box=new T.Box3().setFromObject(one);
  const error=Math.abs(box.min.y-.002);report.floorError=Math.max(report.floorError,error);assert(error<.003,'can rests on the floor');
  report.cans++;report.sideways+=Number(item.side);report.kinds.add(item.kind);
 }
 // Use the actual worker codec: texture pixels, filtering and cap/label UVs survive.
 if(variant===0&&k===0){const codec=P.createPacker({T,isSharedResource:B.isSharedBuildingResource}),packet=codec.packChunk({group:building.group,pickups:[]});const unpacker=P.createUnpacker({T});const round=unpacker.unpackChunk(structuredClone(packet.packet,{transfer:packet.transfer}));let labels=0;round.group.traverse(m=>{if(m.material?.map?.name.startsWith('Generated PS1 pantry')){assert.equal(m.material.map.magFilter,T.NearestFilter);assert(m.geometry.attributes.uv);assert(m.material.map.image.data.length>100);labels++;}});assert(labels>=2);report.packetLabels=labels;}
}
report.kinds=[...report.kinds];assert.equal(report.kinds.length,4);assert(report.sideways>10);

// Real shared uniforms, independently moving render cells, and 10^80 BigInt origin.
const wind={time:{value:2},player:{value:new T.Vector3(63.8,1.77,42)},strength:{value:.4}};
const wake=I.createCerealInteraction(wind);wake.update('0,0');wind.time.value+=.2;wind.player.value.set(.16,1.77,42);wake.update('1,0');
assert(Math.abs(wake.trail[0].x+.2)<1e-9);assert(Math.abs(wake.trail[1].x-.16)<1e-9);
const huge=10n**80n;wind.player.value.set(20,1.77,20);wake.update(`${huge},${-huge}`);assert.equal(wake.trail.filter(t=>t.w).length,1,'teleport clears old wake');
wind.player.value.set(10000,0,10000);const frozen=wake.trail.map(t=>t.toArray());wind.time.value+=10;wake.update(`${huge},${-huge}`);assert.deepEqual(wake.trail.map(t=>t.toArray()),frozen,'paused observer creates no trail');
await D.initializeCerealTextures(async()=>new Uint8Array(1024*1024*4).fill(255));
const layer=D.createWheatDetailLayer(wind,{workerFactory:()=>null}),seed=W.stringSeed('CHLORINE / ABUNDANCE / 10');
layer.accept(L.generateCerealCell(0n,1n,seed));const mesh=[...layer.cells.values()][0],initial=Buffer.from(mesh.instanceMatrix.array.buffer).toString('base64');
wind.player.value.set(13,1.77,43);layer.update(new Map(),wind.player.value,'balanced','0,0');
const shader={...T.ShaderLib.standard,uniforms:T.UniformsUtils.clone(T.ShaderLib.standard.uniforms)};mesh.material.onBeforeCompile(shader,{});
assert.equal(shader.uniforms.uCerealPlayer,wind.player);assert.equal(shader.uniforms.uCerealWake,layer.interaction.uniforms.uCerealWake);
for(let i=0;i<90;i++){wind.time.value+=1/60;wind.player.value.x+=.01;layer.update(new Map(),wind.player.value,'balanced','0,0');}
assert.equal(Buffer.from(mesh.instanceMatrix.array.buffer).toString('base64'),initial,'contact does not rewrite instance roots');
assert.equal(shader.uniforms.uCerealPlayer.value.x,wind.player.value.x);assert(layer.interaction.trail.filter(p=>p.w).length>2);
report.wheat={binding:'live shared player + trail',rebase:'64m and huge BigInt verified',immutableMatrices:true,wakeSamples:I.WHEAT_WAKE_COUNT};
fs.writeFileSync(new URL('./results/gameplay.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);layer.dispose();
