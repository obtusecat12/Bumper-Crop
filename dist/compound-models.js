import {mergeArchitectureParts,isSharedArchitectureResource} from './architecture-batch.js?v=44';
import {makeTroughWater,isSharedTroughWaterResource} from './trough-water.js?v=44';
import * as T from './vendor/three.module.min.js';
import {height,random,roadDistance} from './world.js?v=44';
import {makeRuralBuilding,isSharedBuildingResource} from './buildings.js?v=44';
import {makeYardProps,isSharedYardPropResource} from './yard-props.js?v=44';
import {ruralTextures} from './rural-textures.js?v=44';

// Plans use tile-local component centres. The owner tile renders a component;
// every intersecting tile retains its complete collision and rain metadata.
// No remote asset loads or animation callbacks are introduced by this module.
const UP=new T.Vector3(0,1,0),tmp=new T.Object3D(),matrix=new T.Matrix4();
const shared=new Set(),metaCache=new Map();
const box=new T.BoxGeometry(1,1,1).toNonIndexed();box.deleteAttribute('uv');shared.add(box);
function material(name,color,map=null,metalness=0){
 const m=new T.MeshStandardMaterial({name,color,map,roughness:.91,metalness,vertexColors:true,side:T.DoubleSide});shared.add(m);return m;
}
const M={
 wood:material('Compound / sun-bleached rough timber','#938b7c'),
 dark:material('Compound / old framing','#494b40'),
 red:material('Compound / faded red boards','#c4bbb1',ruralTextures.barnRed||null),
 trim:material('Compound / chalked trim','#bfbaa5'),
 metal:material('Compound / galvanized corrugated metal','#c6c5b9',ruralTextures.siloMetal||null,.16),
 roof:material('Compound / aged metal cap','#969e94',ruralTextures.siloMetal||null,.12),
 rust:material('Compound / iron and oxide','#795e45',ruralTextures.siloMetal||null,.12),
 stone:material('Compound / worn concrete','#868579'),
 black:material('Compound / deep recess','#262d28')
};
export function isSharedCompoundResource(resource){return isSharedArchitectureResource(resource)||shared.has(resource)||isSharedBuildingResource(resource)||isSharedYardPropResource(resource)||isSharedTroughWaterResource(resource);}
// Optional injection for applications that maintain another shared texture pool.
// Existing geometries keep the same material and texture object references.
export function setCompoundTextureMaps({red,metal}={}){
 if(red){M.red.map=red;M.red.needsUpdate=true;}
 if(metal)for(const name of ['metal','roof','rust']){M[name].map=metal;M[name].needsUpdate=true;}
}

class Batch{
 constructor(level){this.parts=new Map();this.level=level;}
 matrix(geometry,mat,transform,tone=1){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(transform);
  const p=g.attributes.position,n=g.attributes.normal,count=p.count;
  if(!g.attributes.uv){const a=new Float32Array(count*2),scale=mat===M.red?.6:.35;for(let i=0;i<count;i++){
   const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
   a[i*2]=(ay>ax&&ay>az?p.getX(i):ax>az?p.getZ(i):p.getX(i))*scale;
   a[i*2+1]=(ay>ax&&ay>az?p.getZ(i):p.getY(i))*scale;
  }g.setAttribute('uv',new T.BufferAttribute(a,2));}
  if(!g.attributes.color){const a=new Float32Array(count*3);a.fill(tone);g.setAttribute('color',new T.BufferAttribute(a,3));}
  else if(tone!==1){const a=g.attributes.color;for(let i=0;i<a.array.length;i++)a.array[i]*=tone;}
  if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(g);
 }
 add(geometry,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,tone=1){
  tmp.position.set(x,y,z);tmp.rotation.set(rx,ry,rz);tmp.scale.set(sx,sy,sz);tmp.updateMatrix();this.matrix(geometry,mat,tmp.matrix,tone);
 }
 box(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,tone=1){if(w>.0001&&h>.0001&&d>.0001)this.add(box,mat,x,y,z,w,h,d,rx,ry,rz,tone);}
 beam(mat,a,b,w=.10,d=w,tone=1){
  const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);
  tmp.position.copy(aa).add(bb).multiplyScalar(.5);tmp.quaternion.setFromUnitVectors(UP,delta.clone().normalize());tmp.scale.set(w,delta.length(),d);tmp.updateMatrix();this.matrix(box,mat,tmp.matrix,tone);
 }
 poly(mat,points,tone=1){
  const out=[];for(let i=1;i<points.length-1;i++)out.push(...points[0],...points[i],...points[i+1]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));g.computeVertexNormals();this.matrix(g,mat,new T.Matrix4(),tone);g.dispose();
 }
 absorb(group,parentMatrix=new T.Matrix4()){
  group.updateMatrixWorld(true);group.traverse(o=>{if(o.isMesh){matrix.multiplyMatrices(parentMatrix,o.matrixWorld);this.matrix(o.geometry,o.material,matrix);}});
 }
 finish(group){const stats=mergeArchitectureParts(this.parts,group,this.level);this.parts.clear();return stats;}

}

function componentTransform(c,y){return new T.Matrix4().compose(new T.Vector3(c.x,y,c.z),new T.Quaternion().setFromAxisAngle(UP,c.angle||0),new T.Vector3(1,1,1));}
function point(c,x,z){const a=c.angle||0,cc=Math.cos(a),ss=Math.sin(a);return {x:c.x+cc*x+ss*z,z:c.z-ss*x+cc*z};}
function transformCollider(c,solid){const p=point(c,solid.x,solid.z);return {...solid,x:p.x,z:p.z,...(solid.kind==='obb'?{angle:(solid.angle||0)+(c.angle||0)}:{})};}
function disposeGeometry(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
const BUILDING_KINDS=new Set(['barn','shed','stable','cabin','outhouse','building']);
function componentFinish(plan,c){return c.finish??(c.main?plan.finish:undefined);}
function buildingField(f,plan,c){
 return {...f,cx:0,cz:0,buildingY:0,buildingAngle:0,buildingScale:1,
  buildingDimensions:[c.width,c.depth,c.height],buildingWidth:c.width,buildingDepth:c.depth,buildingHeight:c.height,
  buildingFinish:componentFinish(plan,c),buildingRoofFinish:c.roofFinish,compoundLod:true,variant:c.variant??(c.kind==='outhouse'?1:c.kind==='shed'?5:c.kind==='stable'?6:c.kind==='cabin'?0:2),
  seed:c.seed??plan.seed,key:(plan.key||plan.id||'compound')+':'+c.id};
}
function localBuilding(f,plan,c,needGeometry,level=0){
 const bf=buildingField(f,plan,c),key=[bf.seed,bf.variant,c.width,c.depth,c.height,bf.buildingFinish,bf.buildingRoofFinish].join(':');
 let metadata=metaCache.get(key),source=null;
 if(needGeometry||!metadata){
  source=makeRuralBuilding(bf,needGeometry?level:2);
  if(!metadata){
   metadata={colliders:source.colliders,roofs:source.group.userData.rainRoofs||[],pickups:source.pickups};metaCache.set(key,metadata);if(metaCache.size>512)metaCache.delete(metaCache.keys().next().value);
  }
 }
 if(!needGeometry&&source){disposeGeometry(source.group);source=null;}
 return {metadata,source};
}

function yardField(f,plan,c,groundY){
 const exclusions=[],main=c.main??(c===plan.components.find(p=>BUILDING_KINDS.has(p.kind)));
 for(const p of f.compounds||[])for(const q of p.components||[]){
  if(q===c)continue;
  const hx=q.kind==='tree'?.48:q.r??q.hx??(q.width||4)/2+.15,hz=q.kind==='tree'?.48:q.r??q.hz??(q.depth||4)/2+.15;
  exclusions.push({x:q.x,z:q.z,hx,hz,a:q.angle||0});
 }
 if(f.type==='building'){
  const [w,d]=f.buildingDimensions||[[7,9],[2.8,3.2],[12,17],[13,19],[11,15],[13,9],[13,18],[8,11]][f.variant%8],s=f.buildingScale||1;
  exclusions.push({x:f.cx,z:f.cz,hx:w*s/2+.6,hz:d*s/2+2,a:f.buildingAngle||0});
 }
 for(const tree of f.trees||[])exclusions.push({x:tree.x,z:tree.z,hx:.46,hz:.46,a:0});
 return {...buildingField(f,plan,c),type:'building',cx:c.x,cz:c.z,buildingY:groundY,buildingAngle:c.angle||0,
  yardTerrainField:f,yardExclusions:exclusions,yardMain:main,
  yardDensity:c.yardDensity??(c.kind==='outhouse'?.28:main?.85:.46),yardProps:c.yardProps};
}

// All eight legacy silhouettes use the same generator at every distance.
// Coarse plank panels and omitted subpixel repairs are handled in buildings.js.

function cylinderGeometry(radius,height,segments=32){const g=new T.CylinderGeometry(radius,radius,height,segments,1,false).toNonIndexed(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.PI*2*radius*.35,uv.getY(i)*height*.35);return g;}
function ring(batch,r,y,thickness,segments,mat=M.metal,tone=1){
 // A shallow folded strip, with a radial highlight and real silhouette.
 for(let i=0;i<segments;i++){
  const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
  const p=(t,rr,yy)=>[Math.cos(t)*rr,yy,Math.sin(t)*rr];
  batch.poly(mat,[p(a,r,y-thickness),p(b,r,y-thickness),p(b,r+.035,y),p(a,r+.035,y)],tone);
  batch.poly(mat,[p(a,r+.035,y),p(b,r+.035,y),p(b,r,y+thickness),p(a,r,y+thickness)],tone*.95);
 }
}
function silo(batch,c,level){
 const r=c.r||2.85,h=c.height||11.8,n=level===2?16:level===1?24:40;
 const shell=cylinderGeometry(r,h,n);batch.add(shell,M.metal,0,h/2,0);shell.dispose();
 const foot=cylinderGeometry(r+.14,.28,n);batch.add(foot,M.stone,0,.05,0);foot.dispose();
 // Corrugation is both a generated shared metal map and stable horizontal ribs.
 const spacing=level===2?1.75:level===1?.85:.48;
 for(let y=.34;y<h-.1;y+=spacing)ring(batch,r+.008,y,level===2?.028:.018,n,M.metal,.91+.07*Math.sin(y*1.7)**2);
 const rise=1.75;
 for(let j=0;j<n;j++){
  const a=j/n*Math.PI*2,b=(j+1)/n*Math.PI*2;
  batch.poly(M.roof,[[Math.cos(a)*(r+.18),h,Math.sin(a)*(r+.18)],[0,h+rise,0],[Math.cos(b)*(r+.18),h,Math.sin(b)*(r+.18)]],j%3===0?.90:1);
  if(level<2)batch.beam(M.metal,[Math.cos(a)*(r+.18),h+.03,Math.sin(a)*(r+.18)],[0,h+rise+.025,0],.026,.036,.90);
 }
 ring(batch,r+.20,h,.055,n,M.roof,.94);
 const vent=cylinderGeometry(.21,.28,8);batch.add(vent,M.dark,0,h+rise+.13,0);vent.dispose();
 const cap=cylinderGeometry(.34,.06,8);batch.add(cap,M.roof,0,h+rise+.30,0);cap.dispose();
 // Sheet seams, access hatch and an attached ladder are supported by the shell.
 const angle=.24,x=Math.sin(angle)*r,z=Math.cos(angle)*r;
 batch.box(M.dark,x,.83,z+.025,.82,1.40,.045,0,angle);
 batch.box(M.metal,x,.84,z+.075,.74,1.30,.045,0,angle,0,.79);
 if(level<2){
  const zz=r+.20;for(const side of[-1,1])batch.box(M.rust,side*.27,h/2,zz,.043,h,.055);
  for(let y=.32;y<h;y+=.32)batch.box(M.rust,0,y,zz+.015,.57,.039,.049);
  if(level===0)for(let i=0;i<n;i+=5){const a=i/n*Math.PI*2;for(let y=.65;y<h-.3;y+=1.35)batch.box(M.dark,Math.cos(a)*(r+.03),y,Math.sin(a)*(r+.03),.035,.045,.035);}
 }
}

function windmill(batch,c,level){
 const h=c.height||10.8,half=1.85,top=.39;
 const corner=(sideX,sideZ,y)=>[sideX*(half+(top-half)*y/h),y,sideZ*(half+(top-half)*y/h)];
 for(const x of[-1,1])for(const z of[-1,1]){
  batch.beam(M.rust,corner(x,z,0),corner(x,z,h),.105,.095);
  batch.box(M.stone,x*half,.08,z*half,.46,.30,.46);
 }
 for(let y=2.4;y<h;y+=2.4){
  for(const side of[-1,1]){
   batch.beam(M.rust,corner(-1,side,y),corner(1,side,y),.065);
   batch.beam(M.rust,corner(side,-1,y),corner(side,1,y),.065);
  }
 }
 for(let y=0;y<h-1;y+=2.4)for(const side of[-1,1]){
  const hi=Math.min(h,y+2.4);
  batch.beam(M.rust,corner(-1,side,y),corner(1,side,hi),level===2?.052:.044);
  batch.beam(M.rust,corner(side,-1,y),corner(side,1,hi),level===2?.052:.044);
  if(level<2){batch.beam(M.rust,corner(1,side,y),corner(-1,side,hi),.038);batch.beam(M.rust,corner(side,1,y),corner(side,-1,hi),.038);}
 }
 batch.box(M.dark,0,h+.08,0,1.18,.13,1.05);batch.box(M.rust,0,h+.45,0,.16,.80,.16);
 const axleY=h+.85,front=-.67,rotorRadius=2.30;
 batch.box(M.rust,0,axleY,-.20,.40,.37,.93);
 // Curved quadrilateral vanes occupy an outer annulus, leaving visible air.
 const blades=level===2?12:18;
 for(let i=0;i<blades;i++){
  const a=i/blades*Math.PI*2,b=a+Math.PI*2/blades*.64,inner=1.03;
  const p=(t,r,d)=>[Math.cos(t)*r,axleY+Math.sin(t)*r,front+d];
  batch.poly(i%5===0?M.rust:M.metal,[p(a,inner,-.02),p(b,inner,.035),p(b+.045,rotorRadius,.10),p(a+.015,rotorRadius,-.055)],.86+.12*(i%3)/2);
  batch.beam(M.rust,[0,axleY,front+.06],p(a+.09,rotorRadius*.91,.06),level===2?.038:.027);
 }
 for(const r of[1.03,rotorRadius*.93])for(let i=0;i<(level===2?24:36);i++){
  const a=i/(level===2?24:36)*Math.PI*2,b=(i+1)/(level===2?24:36)*Math.PI*2;
  batch.beam(M.rust,[Math.cos(a)*r,axleY+Math.sin(a)*r,front+.055],[Math.cos(b)*r,axleY+Math.sin(b)*r,front+.055],.033);
 }
 const hub=new T.CylinderGeometry(.18,.24,.25,10).toNonIndexed();batch.add(hub,M.rust,0,axleY,front-.04,1,1,1,Math.PI/2);hub.dispose();
 // Tail vane and braced arm identify a farm windpump, with pump rod to grade.
 batch.beam(M.rust,[0,axleY,0],[0,axleY+.12,3.65],.08);
 batch.beam(M.rust,[0,axleY-.27,.20],[0,axleY+.06,2.9],.06);
 batch.poly(M.rust,[[0,axleY-.54,2.65],[0,axleY+.70,2.65],[0,axleY+.83,4.18],[0,axleY-.63,4.18]],.95);
 batch.box(M.rust,0,h/2,0,.045,h,.045);batch.box(M.rust,0,.30,0,.26,.60,.26);
 if(level===0){for(const side of[-1,1])batch.beam(M.rust,[.65+side*.20,0,-1.47],[.18+side*.20,h-.22,-.40],.032);for(let y=.25;y<h-.5;y+=.34)batch.box(M.rust,.65-.47*y/h,y,-1.47+1.07*y/h,.44,.029,.040);}
}

function trough(batch,c,level){
 const w=c.width||3.7,d=c.depth||1.35,h=c.height||.72,t=.095;
 batch.box(M.dark,0,.14,0,w-.12,.12,d-.12);
 for(const side of[-1,1]){batch.box(M.metal,side*(w/2-t/2),h/2,0,t,h,d);batch.box(M.metal,0,h/2,side*(d/2-t/2),w,h,t);}
 for(const side of[-1,1]){batch.box(M.rust,side*(w/2+.018),h+.025,0,.075,.065,d+.08);batch.box(M.rust,0,h+.025,side*(d/2+.018),w+.09,.065,.075);}
 const water=makeTroughWater(w-.202,d-.202,c.seed??1,{waterDepth:h-.325,level});water.position.y=h-.12;batch.absorb(water);disposeGeometry(water);
 for(const x of[-w*.32,w*.32])batch.box(M.stone,x,.055,0,.29,.13,d+.18);
 if(level===0){batch.box(M.rust,-w/2+.23,h+.19,0,.045,.43,.045);batch.box(M.rust,-w/2+.35,h+.38,0,.27,.045,.045);}
}

function damagedFence(batch,c,level,colliders,field){
 const length=c.width||12,n=Math.max(1,Math.ceil(length/3.3)),step=length/n,r=random((c.seed||1)^0x319ffa);
 // A gate is an actual gap in both the rails and their collision. Sample the
 // complete span, not just its midpoint: a diagonal road can clip one end.
 const clear=(a,b=a)=>{const count=Math.max(1,Math.ceil(Math.abs(b-a)/.25));for(let i=0;i<=count;i++){const p=point(c,a+(b-a)*i/count,0);if(roadDistance(p.x,p.z,field)<2.85)return false;}return true;};
 const posts=[];
 for(let i=0;i<=n;i++){
  const x=-length/2+i*step,lean=(r()-.5)*.13,broken=i>0&&i<n&&r()<.16,top=broken?.55:1.18+r()*.09;
  const tone=.81+r()*.14,allowed=clear(x-.2,x+.2);posts.push({x,top,lean,allowed});
  if(allowed){batch.beam(M.wood,[x,-.15,0],[x+lean,top,.025],.14,.13,tone);colliders.push({kind:'circle',x,z:0,r:.15});}
 }
 for(let i=1;i<posts.length;i++){
  const a=posts[i-1],b=posts[i],missing=r()<.24,broken=r()<.18,allowed=a.allowed&&b.allowed&&clear(a.x-.15,b.x+.15);
  for(const y of[.46,.93]){
   if(missing&&(y>.6||r()<.5))continue;
   if(!allowed)continue;
   if(broken){
    const end=a.x+step*.64;batch.beam(M.wood,[a.x,y,.04],[end,y-.35,.06],.115,.066,.79);
    colliders.push({kind:'obb',x:(a.x+end)/2,z:.04,hx:(end-a.x)/2,hz:.08,angle:0});
   }else{batch.beam(M.wood,[a.x,y,.025],[b.x,y+(b.top<.8?-.29:0),.025],.12,.065,.92);colliders.push({kind:'obb',x:(a.x+b.x)/2,z:.025,hx:step/2,hz:.085,angle:0});}
  }
  if(allowed&&level===0&&!missing&&i%4===1)batch.beam(M.dark,[a.x+.15,.2,.075],[b.x-.15,.95,.075],.075,.043,.85);
 }
}

function prop(c,level,field){
 const batch=new Batch(level),group=new T.Group(),colliders=[],roofs=[];
 if(c.kind==='silo'){
  silo(batch,c,level);colliders.push({kind:'circle',x:0,z:0,r:(c.r||2.85)+.04});
  // Door and ladder protrusions are part of the same bounded access face.
  colliders.push({kind:'obb',x:0,z:(c.r||2.85)+.12,hx:.38,hz:.16,angle:0});
  roofs.push({kind:'cone',r:(c.r||2.85)+.20,height:c.height||11.8,rise:1.75});
 }else if(c.kind==='windmill'){
  windmill(batch,c,level);
  // The cross-braced lower tower is solid to a standing player. This conservative
  // footprint also covers the diagonals that pass between the four concrete feet.
  colliders.push({kind:'obb',x:0,z:0,hx:2.10,hz:2.10,angle:0});
 }else if(c.kind==='trough'){
  trough(batch,c,level);colliders.push({kind:'obb',x:0,z:0,hx:(c.width||3.7)/2+.05,hz:(c.depth||1.35)/2+.05,angle:0});
 }else if(c.kind==='fence')damagedFence(batch,c,level,colliders,field);
 const stats=batch.finish(group);return {group,colliders,roofs,stats};
}

export function makeCompoundChunk(f,level=0,wind=null){
 level=Math.max(0,Math.min(2,level|0));const group=new T.Group(),batch=new Batch(level),colliders=[],pickups=[],rainRoofs=[];
 group.name='Rural farm compounds';let buildings=0,props=0;const yards=[];
 for(const plan of f.compounds||[])for(const c of plan.components||[]){
  if(c.kind==='tree')continue; // Incorporated into the existing nature batch.
  const belongs=c.belongs??(c.x>=0&&c.x<64&&c.z>=0&&c.z<64),groundY=c.groundY??plan.groundY??height(c.x,c.z,f.x,f.z);
  const transform=componentTransform(c,groundY);
  if(BUILDING_KINDS.has(c.kind)){
   const {metadata,source}=localBuilding(f,plan,c,belongs,level);
   colliders.push(...metadata.colliders.map(s=>transformCollider(c,s)));
   rainRoofs.push({x:c.x,z:c.z,angle:c.angle||0,y:groundY+.035,roofs:metadata.roofs});
   if(belongs){
    buildings++;
    for(const p of metadata.pickups){const q=point(c,p.x,p.z);pickups.push({...p,id:(plan.key||plan.id||'compound')+':'+c.id+':barn',x:q.x,z:q.z,y:groundY+p.y});}
    batch.absorb(source.group,transform);disposeGeometry(source.group);
    // Yard generation samples the ORIGINAL tile terrain. Its group already
    // contains component translation/yaw and absolute ground height, so it is
    // absorbed directly once, never transformed a second time with the barn.
    const yard=makeYardProps(yardField(f,plan,c,groundY),level);
    batch.absorb(yard.group);colliders.push(...yard.colliders);disposeGeometry(yard.group);
    yards.push({component:c.id,variant:c.variant,objects:yard.stats.objectCount||0,triangles:yard.stats.triangles||0,compositionHash:yard.stats.compositionHash});
   }
  }else{
   // Fence damage uses its own stable seed; far and near collisions coincide.
   const result=prop(c,belongs?level:2,f);
   colliders.push(...result.colliders.map(s=>transformCollider(c,s)));
   if(result.roofs.length)rainRoofs.push({x:c.x,z:c.z,angle:c.angle||0,y:groundY,roofs:result.roofs});
   if(belongs){batch.absorb(result.group,transform);props++;}
   disposeGeometry(result.group);
  }
 }
 const stats=batch.finish(group);group.userData.compoundStats={...stats,buildings,props,level,yards,yardObjects:yards.reduce((n,y)=>n+y.objects,0)};
 group.userData.compoundRainRoofs=rainRoofs;
 return {group,colliders,pickups,softVolumes:[],rainRoofs};
}

// Records are in the queried tile's local frame, including neighbouring owners.
// Call after the ordinary building roof test; maximum wins at joined surfaces.
export function compoundRainRoof(x,z,records,pad=0){
 let best=-1000;
 for(const set of records||[]){
  const c=Math.cos(set.angle||0),s=Math.sin(set.angle||0),dx=x-set.x,dz=z-set.z,lx=c*dx-s*dz,lz=s*dx+c*dz;
  for(const r of set.roofs){
   if(r.kind==='cone'){
    const d=Math.max(0,Math.hypot(lx,lz)-pad);if(d<=r.r)best=Math.max(best,set.y+r.height+r.rise*(1-d/r.r));
   }else if(lx>=r.minX-pad&&lx<=r.maxX+pad&&lz>=r.minZ-pad&&lz<=r.maxZ+pad){
    const rx=Math.max(r.minX,Math.min(r.maxX,lx+Math.sign(r.yx)*pad)),rz=Math.max(r.minZ,Math.min(r.maxZ,lz+Math.sign(r.yz)*pad));
    best=Math.max(best,set.y+r.y0+r.yx*rx+r.yz*rz);
   }
  }
 }
 return best;
}
