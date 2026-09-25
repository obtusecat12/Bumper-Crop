import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../../dist/vendor/three.module.min.js';
import {field,stringSeed,cropSample,roadProfile,lakeRoadClearance,surfaceHeight} from '../../dist/world.js?v=33';
import {parcelSample} from '../../dist/patchwork.js?v=33';
import {terrainGeometry,makeGround} from '../../dist/ground.js?v=33';
import {prepareWheatDetail} from '../../dist/dense-wheat.js?v=33';
import {createPacker,createUnpacker} from '../../dist/scene-packets.js?v=33';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),results={};let seam=0,points=0,lakePoints=0;
for(const base of [0n,-865n,865n,12345678901234567890123n])for(let z=-2;z<3;z++)for(let x=-2;x<3;x++){
 const a=field(base+BigInt(x),BigInt(z),seed,false),b=field(a.x+1n,a.z,seed,false),c=field(a.x,a.z+1n,seed,false);
 for(let t=0;t<=64;t+=2)for(const [f,xx,zz,other,ox,oz] of [[a,64,t,b,0,t],[a,t,64,c,t,0]]){
  const p=cropSample(xx,zz,f,{}),q=cropSample(ox,oz,other,{});assert.equal(p.id,q.id);assert.equal(p.crop,q.crop);assert.equal(p.angle,q.angle);
  for(const key of ['row','along','distance','second','roadAlong','width'])assert(Math.abs(p[key]-q[key])<1e-7,key+' seam');
  seam=Math.max(seam,Math.abs(surfaceHeight(xx,zz,f)-surfaceHeight(ox,oz,other)));points++;
 }
}
assert(seam<1e-6,'terrain continuity');
for(let z=-3;z<4;z++)for(let x=-5;x<2;x++){const f=field(BigInt(x),BigInt(z),seed,false);for(let j=0;j<64;j+=2)for(let i=0;i<64;i+=2)if(lakeRoadClearance(i,j,f)<30){const r=roadProfile(i,j,f,{});assert.equal(r.rut,0);assert.equal(r.relief,0);assert(r.distance>=2.1);lakePoints++;}}
// Both independently built meshes must have exactly the same shared edge vertices.
let meshEdgeError=0,normalError=0;
for(const [x,z,sd]of [[-5n,2n,12345],[0n,0n,seed],[-2n,0n,seed]]){
 const a=terrainGeometry(field(x,z,sd,false),1),b=terrainGeometry(field(x+1n,z,sd,false),1),edge=(g,xx)=>{const out=new Map(),p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++)if(p.getX(i)===xx)out.set(p.getZ(i),[p.getY(i),n.getX(i),n.getY(i),n.getZ(i)]);return out},aa=edge(a,64),bb=edge(b,0);assert.equal(aa.size,257);assert.deepEqual([...aa.keys()].sort((a,b)=>a-b),[...bb.keys()].sort((a,b)=>a-b));for(const [t,va]of aa){const vb=bb.get(t);meshEdgeError=Math.max(meshEdgeError,Math.abs(va[0]-vb[0]));for(let i=1;i<4;i++)normalError=Math.max(normalError,Math.abs(va[i]-vb[i]));}
}
assert(meshEdgeError<1e-6);assert(normalError<1e-5,'terrain normal continuity');
// A crop parcel stays one crop over chunk ownership and reference sightlines.
const cropIds=new Map(),angles=new Set(),widths=[];for(let z=-800;z<=800;z+=21)for(let x=-800;x<=800;x+=21){const cx=BigInt(Math.floor(x/64)),cz=BigInt(Math.floor(z/64)),f=field(cx,cz,seed,false),p=cropSample(x-Number(cx)*64,z-Number(cz)*64,f,{});if(cropIds.has(p.id))assert.equal(p.crop,cropIds.get(p.id));else cropIds.set(p.id,p.crop);angles.add(p.angleIndex);widths.push(p.width)}assert.equal(angles.size,3);assert.equal(new Set(cropIds.values()).size,3);assert(Math.min(...widths)>=3.5&&Math.max(...widths)<=4.5);
const examples=[];for(let z=8;z<20&&examples.filter(Boolean).length<3;z++)for(let x=8;x<20;x++){const f=field(BigInt(x),BigInt(z),seed,false),p=cropSample(32,32,f,{});if(f.type==='wheat'&&p.distance>48&&!f.meadow&&!examples[p.crop])examples[p.crop]=f;}
const detail=[];for(let kind=0;kind<3;kind++){assert(examples[kind]);const d=prepareWheatDetail(examples[kind],'low');assert(d.count>0);for(const p of d.patches){assert(Math.floor(p.variant/3)===kind);assert.equal(p.count*16,p.matrices.length);for(const n of p.matrices)assert(Number.isFinite(n));}detail.push({kind,count:d.count,variants:[...new Set(d.patches.map(p=>p.variant))]});}
// Real packet transfer must preserve per-chunk atlas bytes and ownership.
const f=field(2n,2n,seed,false),mesh=makeGround(f,1),group=new T.Group();group.add(mesh);const original=mesh.material.userData.ownedParcelTexture.image.data.slice(),p=createPacker({T}).packChunk({group,field:f,pickups:[]});assert.equal(p.packet.owned.textures.filter(t=>t.name==='parcel road/crop atlas'||t.props.name==='parcel road/crop atlas').length,1);
const packet=structuredClone(p.packet,{transfer:p.transfer}),unpacker=createUnpacker({T}),chunk=unpacker.unpackChunk(packet),decoded=chunk.group.children[0].material.userData.ownedParcelTexture;assert.deepEqual(decoded.image.data,original);let disposed=0;decoded.addEventListener('dispose',()=>disposed++);unpacker.disposeChunk(chunk);assert.equal(disposed,1);
Object.assign(results,{pass:true,edgeSamples:points,seamError:seam,meshEdgeError,normalError,lakeExcludedSamples:lakePoints,parcels:cropIds.size,crops:[...new Set(cropIds.values())],angles:[...angles],roadWidth:[Math.min(...widths),Math.max(...widths)],detail,ownedAtlasBytes:original.byteLength});fs.writeFileSync(new URL('../../docs/patchwork-v33/checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
