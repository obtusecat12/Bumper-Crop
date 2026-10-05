/** Offline compound-body packing. Nothing in this file runs in the gameplay RAF. */
import * as C from '../dist/vendor/cannon-es.min.js';
import fs from 'node:fs/promises';
const box=(x,y,z,w,h,d)=>({at:[x,y,z],size:[w,h,d]});
const legs=(w,d,h)=>[-1,1].flatMap(x=>[-1,1].map(z=>box(x*(w/2-.055),h/2,z*(d/2-.055),.043,h,.043)));
const chair=[box(0,.443,0,.47,.10,.46),box(0,.74,-.224,.47,.53,.06),...legs(.45,.46,.425)];
const sofa=w=>[box(0,.268,0,w,.26,.84),box(0,.66,-.33,w,.66,.22),box(0,.478,.09,w-.36,.18,.66),...[-1,1].map(s=>box(s*(w/2-.105),.54,.025,.28,.47,.92)),...legs(w-.12,.74,.18)];
const casework=(w,h,d,shelves)=>[box(0,h/2,-d/2+.011,w,.95*h,.022),...[-1,1].map(s=>box(s*(w/2-.017),h/2,0,.034,h,d)),...shelves.map(y=>box(0,y,0,w,.045,d))];
export const profiles={
 f94LadderChair:{mass:6,shapes:chair},f94SpindleChair:{mass:5.5,shapes:chair},f94EbonyChair:{mass:6,shapes:chair},
 f94LinenArmchair:{mass:23,shapes:sofa(.94)},f94VelvetSofa:{mass:39,shapes:sofa(1.92)},f94LinenSofa:{mass:37,shapes:sofa(1.92)},
 f94OpenBookcase:{mass:18,shapes:casework(.86,1.85,.34,[.045,.481,.944,1.406,1.817])},f94Wardrobe:{mass:35,shapes:casework(1.06,1.96,.58,[.045,1.927])},
 f94MapleChest:{mass:33,shapes:[box(0,.46,0,1.29,.80,.56),...legs(1.2,.49,.14)]},
 f94Panel:{mass:11,shapes:[box(0,.9,.013,.88,1.8,.080)]},
 f94Footstool:{mass:5,shapes:[box(0,.332,0,.58,.14,.46),...legs(.52,.4,.32)]},
 kCRT:{mass:12,shapes:[box(0,.27,0,.64,.54,.56)]},
};
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function solvePile(seed,mode='mixed',hero=false){
 const rnd=random(seed),world=new C.World({gravity:new C.Vec3(0,-9.81,0),allowSleep:true});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=24;world.solver.tolerance=1e-6;
 world.defaultContactMaterial.friction=.62;world.defaultContactMaterial.restitution=.015;world.defaultContactMaterial.contactEquationStiffness=2e7;world.defaultContactMaterial.contactEquationRelaxation=4;
 const ground=new C.Body({mass:0,shape:new C.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(ground);
 const back=new C.Body({mass:0,shape:new C.Box(new C.Vec3(5,1.36,.10)),position:new C.Vec3(0,1.36,-1.45)});world.addBody(back);
 const bodies=[],types=mode==='chairs'?['f94LadderChair','f94SpindleChair','f94EbonyChair']:['f94LadderChair','f94SpindleChair','f94EbonyChair','f94LadderChair','f94SpindleChair','f94Panel','f94MapleChest','f94OpenBookcase','f94Footstool','kCRT'];
 const authored=hero?[
 ['f94Wardrobe',-1.65,-.64,0,Math.PI+.17,0],['f94OpenBookcase',1.69,-.61,0,-.11,0],
 ['f94VelvetSofa',-.18,-.34,0,Math.PI,Math.PI/2],['f94LinenArmchair',-.43,1.48,0,-.18,Math.PI],
 ['f94MapleChest',1.04,.05,.05,-.51,.61],['f94LadderChair',-1.27,.49,-.60,.41,1.05],
 ['f94Panel',-.36,-.64,.17,-.41,-.26],['kCRT',.40,-.25,.09,.27,.25]
 ]:[];
 const maxBodies=hero?34:mode==='chairs'?28:21;
 for(let i=0;i<maxBodies+12&&bodies.length<maxBodies;i++){
  const a=authored[i],kind=a?a[0]:types[Math.floor(rnd()*types.length)],p=profiles[kind],b=new C.Body({mass:p.mass,linearDamping:.27,angularDamping:.36,sleepSpeedLimit:.085,sleepTimeLimit:.6});
  let total=0;const com=new C.Vec3();for(const shape of p.shapes){const volume=shape.size.reduce((a,b)=>a*b,1);total+=volume;com.x+=shape.at[0]*volume;com.y+=shape.at[1]*volume;com.z+=shape.at[2]*volume;}com.scale(1/total,com);b.renderOrigin=com;
  for(const shape of p.shapes)b.addShape(new C.Box(new C.Vec3(...shape.size.map(x=>x/2))),new C.Vec3(...shape.at).vsub(com));
  b.quaternion.setFromEuler(a?a[3]:(rnd()-.5)*2.8,a?a[4]:rnd()*Math.PI*2,a?a[5]:(rnd()-.5)*2.8,'YXZ');
  b.position.set(a?a[1]:(rnd()-.5)*(hero?3.9:3.2),0,a?a[2]:-.05+(rnd()-.5)*1.65);b.updateAABB();
  // Bodies start outside all existing shapes; settle against actual legs/backs/shelves.
  const min=b.aabb.lowerBound.y;let support=0;
  for(const q of bodies){q.updateAABB();if(q.aabb.upperBound.x>b.aabb.lowerBound.x&&q.aabb.lowerBound.x<b.aabb.upperBound.x&&q.aabb.upperBound.z>b.aabb.lowerBound.z&&q.aabb.lowerBound.z<b.aabb.upperBound.z)support=Math.max(support,q.aabb.upperBound.y);}
  b.position.y=support-min+.10;b.kind=kind;world.addBody(b);bodies.push(b);
  for(let step=0;step<300;step++)world.step(1/120);
  b.updateAABB();if(b.aabb.upperBound.y>2.63||b.aabb.lowerBound.z< -1.37||Math.abs(b.position.x)>3.6){world.removeBody(b);bodies.pop();}
 }
 for(let step=0;step<840;step++)world.step(1/120);
 const round=v=>Math.round(v*100000)/100000;
 return bodies.map(b=>{b.updateAABB();return{kind:b.kind,position:b.position.vsub(b.quaternion.vmult(b.renderOrigin)).toArray().map(round),quaternion:b.quaternion.toArray().map(round),bounds:[...b.aabb.lowerBound.toArray(),...b.aabb.upperBound.toArray()].map(round)};});
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const data={hero:solvePile(9417,'mixed',true),mixed:[],chairs:[]};console.log('hero',data.hero.length);
 for(let i=0;i<10;i++){data.mixed.push(solvePile(9513+i*173));data.chairs.push(solvePile(9593+i*191,'chairs'));console.log('templates',i+1);}
 await fs.writeFile(new URL('../dist/level0-stack-data94.js',import.meta.url),'// Deterministic 120 Hz Cannon-es compound rigid-body solutions. Regenerate with scripts/level0-stack-physics94.mjs.\nexport const STACK94='+JSON.stringify(data)+';\n');
}
