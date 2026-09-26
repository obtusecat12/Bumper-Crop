import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from '../../dist/vendor/three.module.min.js';
import {field,stringSeed,roadDistance,pondShoreDistance} from '../../dist/world.js?v=45';
import {planRuralPower,cablePoint,makeCable} from '../../dist/rural-power-layout.js?v=45';
import {bakePowerPole,powerSpanCables} from '../../dist/rural-power-parts.js?v=45';
import {createRuralPowerNetwork} from '../../dist/rural-power-render.js?v=45';
import {createAdvancingFog} from '../../dist/advancing-fog.js?v=45';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),wind={time:{value:0},strength:{value:.3}},network=createRuralPowerNetwork(wind),nodes=new Map(),joins=[],roadErrors=[],wetErrors=[],kinds=new Set(),start=performance.now();
for(let z=-2;z<=2;z++)for(let x=-2;x<=3;x++){const f=field(BigInt(x),BigInt(z),seed,false),plan=planRuralPower(f),packet={poles:[],cables:[]};
 for(const p of plan.poles){kinds.add(p.kind);const wx=x*64+p.x,wz=z*64+p.z,old=nodes.get(p.id);if(old&&(Math.hypot(old.x-wx,old.z-wz,old.y-p.y,old.h-p.h)>.03||old.kind!==p.kind||Math.abs(old.lean-p.lean)>.001))joins.push([p.id,old,{x:wx,y:p.y,z:wz}]);else nodes.set(p.id,{...p,x:wx,z:wz});
  if(p.x>=0&&p.x<64&&p.z>=0&&p.z<64){if(roadDistance(p.x,p.z,f)<2.25)roadErrors.push([p.id,wx,wz]);if(f.type==='pond'&&pondShoreDistance(p.x,p.z,f)<1)wetErrors.push(p.id);}
  const baked=bakePowerPole(p);for(const a of baked.groups)assert(a.every(Number.isFinite),'finite static matrices');packet.poles.push({id:p.id,transformer:p.transformer,groups:baked.groups});packet.cables.push(...baked.cables);
 }for(const s of plan.spans)packet.cables.push(...powerSpanCables(s));network.register({field:f,powerPacket:packet});
}
network.update(0n,0n);const first={...network.stats},versions=network.object.children.filter(m=>m.isInstancedMesh).map(m=>m.instanceMatrix.version),tick=performance.now();for(let i=0;i<10000;i++)network.update(0n,0n);const idleMs=(performance.now()-tick)/10000;network.update(1n,-1n);assert.equal(network.stats.matrixWrites,first.matrixWrites);assert.deepEqual(network.object.children.filter(m=>m.isInstancedMesh).map(m=>m.instanceMatrix.version),versions);assert.equal(network.stats.draws,4);
for(const kind of ['tangent','double','vertical','alley','service'])assert(kinds.has(kind),kind+' present');
for(const length of [5,40,55,65])for(const dy of [-5,0,4])for(const sag of [.35,.65,1.3,2]){const c=makeCable('test',{x:2,y:12,z:3},{x:2+length,y:12+dy,z:3},sag);assert.deepEqual(cablePoint(c,0,8),c.a);assert.deepEqual(cablePoint(c,1,8),c.b);assert(Math.abs(cablePoint(c,.5).y-(12+dy/2-sag))<1e-9);}
const camera=new T.PerspectiveCamera(),fog=createAdvancingFog({},null);camera.position.set(16,1.77,68);fog.update({camera,event:{kind:'fog',serial:1,fogProgress:0},mist:1});const amounts=[];
for(const [x,z]of [[16,68],[2000,2000],[-2000,-2000],[1e6,-1e6]]){camera.position.set(x,1.77,z);fog.update({camera,event:{kind:'fog',serial:1,fogProgress:1},mist:1});amounts.push(fog.localAmount(camera));assert.equal(amounts.at(-1),1,'mature fog has no fixed boundary');}
const far=10n**30n,fa=field(far,far,seed,false),fb=field(far+1n,far,seed,false),pa=planRuralPower(fa),pb=planRuralPower(fb);for(const a of pa.poles){const b=pb.poles.find(p=>p.id===a.id);if(b)assert(Math.hypot(a.x-b.x-64,a.y-b.y,a.z-b.z)<.03,'BigInt rebase continuity');}
fs.mkdirSync('docs/rural-power-v45',{recursive:true});const report={kinds:[...kinds],joins,roadErrors,wetErrors,network:first,idleMs,fogAmounts:amounts,elapsedMs:performance.now()-start,poles:[...nodes.values()]};fs.writeFileSync('docs/rural-power-v45/check.json',JSON.stringify(report,null,2));console.log({...report,poles:report.poles.length});for(const a of nodes.values())for(const b of nodes.values())if(a.id<b.id&&a.kind!=='service'&&b.kind!=='service')assert(Math.hypot(a.x-b.x,a.z-b.z)>3,'duplicate close station '+a.id+' / '+b.id);assert.equal(joins.length,0,'tile joins');assert.equal(roadErrors.length,0,'road clearances');assert.equal(wetErrors.length,0,'lake clearance');console.log('PASS frozen GPU batches, all archetypes, road/lake exclusion, curve endpoints/sag, mature fog world coverage');
