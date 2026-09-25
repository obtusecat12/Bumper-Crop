import {compoundComponents,compoundYard,compoundEntrance,componentDistance,componentBounds,hash} from './compound-layout.js?v=42';

const SIZE=400,CHUNK=64,MIN_SEPARATION=120,STATION=176;
const floor=(v,n)=>v>=0n?v/n:(v-n+1n)/n;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const unit=key=>hash(key)/4294967296;
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const earlier=(a,b)=>a.rank<b.rank||(a.rank===b.rank&&a.id<b.id);
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
function remember(cache,key,value,limit){cache.set(key,value);if(cache.size>limit)cache.delete(cache.keys().next().value);return value;}
function pointSegment(x,z,s){const dx=s.x2-s.x1,dz=s.z2-s.z1,t=clamp(((x-s.x1)*dx+(z-s.z1)*dz)/(dx*dx+dz*dz||1),0,1);return {d:Math.hypot(x-s.x1-t*dx,z-s.z1-t*dz),t,x:s.x1+t*dx,z:s.z1+t*dz};}
function roadDistanceToPart(s,p){
  if(p.r!==undefined)return pointSegment(p.x,p.z,s).d-p.r;
  const c=Math.cos(p.angle),sn=Math.sin(p.angle),convert=(x,z)=>({x:c*(x-p.x)-sn*(z-p.z),z:sn*(x-p.x)+c*(z-p.z)});
  const a=convert(s.x1,s.z1),b=convert(s.x2,s.z2),local={x1:a.x,z1:a.z,x2:b.x,z2:b.z};
  let lo=0,hi=1;
  for(const [v,d,h] of [[a.x,b.x-a.x,p.hx],[a.z,b.z-a.z,p.hz]]){
    if(Math.abs(d)<1e-10){if(Math.abs(v)>h){lo=2;break;}}
    else{const t1=(-h-v)/d,t2=(h-v)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
  }
  if(lo<=hi)return 0;
  let result=Math.min(Math.hypot(Math.max(Math.abs(a.x)-p.hx,0),Math.max(Math.abs(a.z)-p.hz,0)),Math.hypot(Math.max(Math.abs(b.x)-p.hx,0),Math.max(Math.abs(b.z)-p.hz,0)));
  for(const x of [-p.hx,p.hx])for(const z of [-p.hz,p.hz])result=Math.min(result,pointSegment(x,z,local).d);
  return result;
}
function partsOverlap(a,b,padding=3){
  if(!overlaps(componentBounds(a,padding),componentBounds(b,padding)))return false;
  if(a.r!==undefined)return componentDistance(a.x,a.z,b)<a.r+padding;
  if(b.r!==undefined)return componentDistance(b.x,b.z,a)<b.r+padding;
  const ac=Math.cos(a.angle),as=Math.sin(a.angle),bc=Math.cos(b.angle),bs=Math.sin(b.angle),dx=b.x-a.x,dz=b.z-a.z;
  for(const [nx,nz] of [[ac,-as],[as,ac],[bc,-bs],[bs,bc]]){
    const ar=Math.abs(nx*ac-nz*as)*a.hx+Math.abs(nx*as+nz*ac)*a.hz;
    const br=Math.abs(nx*bc-nz*bs)*b.hx+Math.abs(nx*bs+nz*bc)*b.hz;
    if(Math.abs(dx*nx+dz*nz)>ar+br+padding)return false;
  }
  return true;
}
function transformPart(p,plan){const c=Math.cos(plan.rot),s=Math.sin(plan.rot);return {...p,x:plan.x+c*p.x+s*p.z,z:plan.z-s*p.x+c*p.z,angle:plan.rot+p.angle};}
// Local working surfaces follow doors and worn tracks. Never clear a group AABB.
function prepareYard(yard){return {patches:(yard.patches||[]).map(p=>({...p,angle:p.angle||0,cos:Math.cos(p.angle||0),sin:Math.sin(p.angle||0)})),lanes:yard.lanes||[]};}
function yardBounds(plan){const bounds=[];for(const p of plan.yard.patches)bounds.push(componentBounds(transformPart({...p,hx:p.rx,hz:p.rz},plan),3));for(const lane of plan.yard.lanes){const a=transformPart({x:lane.x1,z:lane.z1,angle:0},plan),b=transformPart({x:lane.x2,z:lane.z2,angle:0},plan),r=lane.width*.5+3;bounds.push([Math.min(a.x,b.x)-r,Math.max(a.x,b.x)+r,Math.min(a.z,b.z)-r,Math.max(a.z,b.z)+r]);}return bounds;}
function yardSample(x,z,yard,seed){
 let value=0;const phase=(seed%997)*.017;
 for(const p of yard.patches){const dx=x-p.x,dz=z-p.z,extent=Math.max(p.rx,p.rz)+2;if(Math.abs(dx)>extent||Math.abs(dz)>extent)continue;
  const c=p.cos??Math.cos(p.angle||0),s=p.sin??Math.sin(p.angle||0),u=c*dx-s*dz,v=s*dx+c*dz;
  let d=(Math.hypot(u/p.rx,v/p.rz)-1)*Math.min(p.rx,p.rz);d+=.19*Math.sin(x*1.07+phase)+.13*Math.sin(z*.83+x*.39-phase);
  value=Math.max(value,(p.intensity??1)*(1-smooth(-.35,1.2,d)));
 }
 for(const lane of yard.lanes){const d=pointSegment(x,z,lane).d-lane.width*.5;value=Math.max(value,(lane.intensity??.68)*(1-smooth(-.2,.8,d)));}
 return value;
}
function drivewayCurve(anchor,end,normal,tangent,handed){
  const distance=Math.hypot(end.x-anchor.x,end.z-anchor.z),a={x:anchor.x+normal.x*distance*.34,z:anchor.z+normal.z*distance*.34},b={x:end.x-normal.x*distance*.32+tangent.x*handed*3,z:end.z-normal.z*distance*.32+tangent.z*handed*3};
  const points=[],segments=[];let along=0;const count=Math.max(4,Math.ceil(distance/2.5));
  for(let i=0;i<=count;i++){const t=i/count,v=1-t;points.push({x:v*v*v*anchor.x+3*v*v*t*a.x+3*v*t*t*b.x+t*t*t*end.x,z:v*v*v*anchor.z+3*v*v*t*a.z+3*v*t*t*b.z+t*t*t*end.z});}
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(a.x-b.x,a.z-b.z);segments.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,length,along});along+=length;}
  return {x1:anchor.x,z1:anchor.z,x2:end.x,z2:end.z,width:3.8,points,segments,length:along,entryAngleDegrees:90};
}
function atAlong(segments,along){
  let s=segments.find(s=>along>=s.along-1e-7&&along<=s.along+s.length+1e-7);
  if(!s)s=along<segments[0].along?segments[0]:segments.at(-1);
  const t=clamp((along-s.along)/s.length,0,1),dx=s.x2-s.x1,dz=s.z2-s.z1;
  return {x:s.x1+t*dx,z:s.z1+t*dz,tx:dx/s.length,tz:dz/s.length};
}
function defaultProtected(x,z,ox,oz){
  if(ox < -800n||ox>800n||oz < -800n||oz>800n)return 1e5;
  return Math.hypot(Number(ox)+x-.6,Number(oz)+z-52)-20;
}

/** Pure downstream planner. macroPlan must depend only on frozen V35 topology
 * interests/lakes, never field(), this planner, or visible new compounds.
 * Callbacks operate in the supplied BigInt metre origin plus bounded Numbers.
 */
export function createCompoundPlanner({macroPlan,shoreDistance,componentsFor=compoundComponents,
  protectedDistance=()=>1e5,getObstacles=()=>[],roadVisible=()=>true,heightAt=null,
  settings={}}){
  if(typeof macroPlan!=='function'||typeof shoreDistance!=='function')throw Error('Road compounds require macroPlan and shoreDistance');
  const cfg={stationMetres:STATION,minSeparationMetres:MIN_SEPARATION,minSetback:25,maxSetback:40,
    walkSpeed:3,lookaheadSecondsMin:20,lookaheadSecondsMax:35,lakeClearance:6,roadClearance:2.5,
    hamletChance:.035,singleShare:.75,pairShare:.15,occupancyMin:.32,occupancyRange:.26,infill:false,...settings};
  const networkCache=new Map(),rawCache=new Map(),primaryCache=new Map(),eligibleCache=new Map(),planCache=new Map(),contextCache=new Map();
  const keyOf=(ix,iz,seed)=>`${seed}:${ix}:${iz}`;
  function network(ix,iz,seed){
    const key=keyOf(ix,iz,seed);if(networkCache.has(key))return networkCache.get(key);
    const ox=ix*400n,oz=iz*400n,segments=[],lakes=[],lakeIds=new Set(),roads=new Set();
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const m=macroPlan(ix+BigInt(i),iz+BigInt(j),seed),dx=i*400,dz=j*400;
      for(const s of m.segments){const id=`${s.id}:${s.part||0}:${s.along}`;if(roads.has(id))continue;roads.add(id);segments.push({...s,x1:s.x1+dx,x2:s.x2+dx,z1:s.z1+dz,z2:s.z2+dz});}
      for(const l of m.lakes||[]){const id=l.lakeId??`${l.lakeSeed}:${l.cx+dx}:${l.cz+dz}`;if(lakeIds.has(id))continue;lakeIds.add(id);lakes.push({...l,cx:l.cx+dx,cz:l.cz+dz});}
    }
    for(const s of segments)s.bounds=[Math.min(s.x1,s.x2)-8,Math.max(s.x1,s.x2)+8,Math.min(s.z1,s.z2)-8,Math.max(s.z1,s.z2)+8];
    return remember(networkCache,key,{ox,oz,segments,lakes,obstacles:getObstacles(ox,oz,seed)},128);
  }
  function valid(plan,n,seed){
    // Owning the anchor's canonical 400m cell bounds all exclusion queries to
    // adjacent cells; no source road may smuggle candidates across distant cells.
    if(plan.x<0||plan.z<0||plan.x>=SIZE||plan.z>=SIZE)return false;
    if(!roadVisible(plan.access.x,plan.access.z,n.ox,n.oz,seed))return false;
    const relevantLakes=n.lakes.filter(l=>{const b=l.bounds||[-l.rx*1.8,l.rx*1.8,-l.rz*1.8,l.rz*1.8];return overlaps(plan.bounds,[l.cx+b[0]-10,l.cx+b[1]+10,l.cz+b[2]-10,l.cz+b[3]+10]);});
    for(const lake of relevantLakes)if(shoreDistance(plan.x,plan.z,lake)<40)return false;
    for(const p of plan.components){
      const bounds=componentBounds(p);
      for(const s of n.segments){if(!overlaps(bounds,s.bounds))continue;if(roadDistanceToPart(s,p)<s.width*.5+cfg.roadClearance)return false;}
      for(const obstacle of n.obstacles)if(partsOverlap(p,obstacle,3))return false;
      // 3m interior sampling plus a half-diagonal safety margin covers narrow
      // concave lake intrusions; this is stronger than center/corners alone.
      const hx=p.r??p.hx,hz=p.r??p.hz,nx=Math.max(1,Math.ceil(hx*2/3)),nz=Math.max(1,Math.ceil(hz*2/3)),c=Math.cos(p.angle),s=Math.sin(p.angle);
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const lx=-hx+2*hx*i/nx,lz=-hz+2*hz*j/nz;if(p.r!==undefined&&lx*lx+lz*lz>(p.r+1.5)**2)continue;
        const x=p.x+c*lx+s*lz,z=p.z-s*lx+c*lz;
        if(defaultProtected(x,z,n.ox,n.oz)<2.2||protectedDistance(x,z,n.ox,n.oz,seed)<2.2)return false;
        for(const lake of relevantLakes)if(shoreDistance(x,z,lake)<cfg.lakeClearance+2.2)return false;
      }
    }
    // A clear approach into the yard is part of the compound, too.
    for(const {x,z} of plan.driveway.points){
      if(defaultProtected(x,z,n.ox,n.oz)<4||protectedDistance(x,z,n.ox,n.oz,seed)<4)return false;
      for(const lake of relevantLakes)if(shoreDistance(x,z,lake)<cfg.lakeClearance+2)return false;
    }
    // Every visible working patch must stay outside the unchanged wet shore.
    for(const patch of plan.yard.patches){const part=transformPart({...patch,hx:patch.rx+2,hz:patch.rz+2},plan),bounds=componentBounds(part);
      for(let z=bounds[2];z<=bounds[3]+1;z+=3)for(let x=bounds[0];x<=bounds[1]+1;x+=3){
        if(componentDistance(x,z,part)>1.5)continue;
        if(defaultProtected(x,z,n.ox,n.oz)<2.2)return false;
        for(const lake of relevantLakes)if(shoreDistance(x,z,lake)<8.2)return false;
      }
    }
    for(const lane of plan.yard.lanes){const a=transformPart({x:lane.x1,z:lane.z1,angle:0},plan),b=transformPart({x:lane.x2,z:lane.z2,angle:0},plan),length=Math.hypot(b.x-a.x,b.z-a.z),count=Math.max(1,Math.ceil(length/3)),pad=lane.width*.5+2.3;
      for(let i=0;i<=count;i++){const x=a.x+(b.x-a.x)*i/count,z=a.z+(b.z-a.z)*i/count;if(defaultProtected(x,z,n.ox,n.oz)<pad)return false;for(const lake of relevantLakes)if(shoreDistance(x,z,lake)<6+pad)return false;}
    }
    // A source-road approach may not cut through another member of its group.
    for(const ds of plan.driveway.segments)for(const part of plan.components){if(part.kind==='tree'||part.kind==='fence')continue;const keepOut=part.main&&part.width?{...part,hx:part.width*.5,hz:part.depth*.5}:part;if(roadDistanceToPart(ds,keepOut)<plan.driveway.width*.5+.25)return false;}
    return true;
  }
  function raw(ix,iz,seed){
    const key=keyOf(ix,iz,seed);if(rawCache.has(key))return rawCache.get(key);
    const own=macroPlan(ix,iz,seed),n=network(ix,iz,seed),groups=new Map(),candidates=[];
    for(const s of own.segments){if(s.noRelief||String(s.kind).includes('access'))continue;
      const id=`${s.id}:${s.part||0}`;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(s);}
    for(const [roadKey,segments] of groups){
      segments.sort((a,b)=>a.along-b.along);const lo=segments[0].along,hi=Math.max(...segments.map(s=>s.along+s.length));
      if(hi-lo<40)continue;
      const phase=unit(`v37:phase:${roadKey}`)*cfg.stationMetres;
      for(let slot=Math.floor((lo-phase)/cfg.stationMetres)-1;slot<=Math.ceil((hi-phase)/cfg.stationMetres)+1;slot++)for(let tier=0;tier<2;tier++){
        if(tier&&!cfg.infill)continue;
        const id=`v37:${roadKey}:${slot}:${tier}`,along=phase+slot*cfg.stationMetres+tier*cfg.stationMetres/2+(unit(id+':jitter')-.5)*48;
        if(along<lo+8||along>hi-8)continue;
        const occupancy=cfg.occupancyMin+cfg.occupancyRange*unit(`v37:inhabited-run:${roadKey}:${Math.floor(slot/4)}`);
        if(unit(id+':occupied')>occupancy)continue;
        const anchor=atAlong(segments,along),ahead=atAlong(segments,along+5),behind=atAlong(segments,along-5),length=distance(ahead,behind)||1,tx=(ahead.x-behind.x)/length,tz=(ahead.z-behind.z)/length;
        const junction=n.segments.some(s=>s.id!==segments[0].id&&s.corridor!==segments[0].corridor&&Math.abs(tx*(s.z2-s.z1)-tz*(s.x2-s.x1))/(s.length||1)>.35&&pointSegment(anchor.x,anchor.z,s).d<24);
        const use=unit(id+':use'),kind=segments[0].kind==='dead-end'?'single':junction&&unit(id+':hamlet')<cfg.hamletChance?'hamlet':use<cfg.singleShare?'single':use<cfg.singleShare+cfg.pairShare?'pair':'farm';
        for(const side of [unit(id+':side')<.5?-1:1,unit(id+':side')<.5?1:-1]){
          const setbacks=kind==='single'?[16,40]:kind==='pair'?[22,44]:kind==='hamlet'?[38,52]:[30,50],setback=setbacks[0]+unit(id+':setback')*(setbacks[1]-setbacks[0]),nx=-tz*side,nz=tx*side;
          const plan={id,key:id,sourceKey:key,seed:hash(id),rank:hash(id+':rank'),kind,tier,x:anchor.x+nx*setback,z:anchor.z+nz*setback,
            rot:Math.atan2(-nx,-nz),handed:unit(id+':handed')<.5?-1:1,
            setback,access:{x:anchor.x,z:anchor.z,roadId:segments[0].id,along},roadTangent:{x:tx,z:tz},junction,
            lookaheadMetres:cfg.walkSpeed*(cfg.lookaheadSecondsMin+unit(id+':lookahead')*(cfg.lookaheadSecondsMax-cfg.lookaheadSecondsMin))};
          const localParts=componentsFor(plan);plan.components=localParts.map(p=>transformPart(p,plan));
          plan.yard=prepareYard(compoundYard(plan,localParts));
          const entry=transformPart({...compoundEntrance(plan,localParts),angle:0},plan);
          plan.driveway=drivewayCurve(anchor,entry,{x:nx,z:nz},{x:tx,z:tz},plan.handed);
          plan.driveway.width=kind==='single'?(localParts.find(p=>p.main)?.variant===1?1.25:2.65):3.3;
          plan.sightApproaches=[-1,1].map(sign=>{const station=clamp(along+sign*plan.lookaheadMetres,lo,hi),metres=Math.abs(station-along);return {...atAlong(segments,station),metres,seconds:metres/cfg.walkSpeed,targetSeconds:plan.lookaheadMetres/cfg.walkSpeed,clippedByRoadEnd:metres+1e-5<plan.lookaheadMetres};});
          const bounds=[...plan.components.map(p=>componentBounds(p,4)),...yardBounds(plan)];
          for(const point of plan.driveway.points)bounds.push([point.x-5,point.x+5,point.z-5,point.z+5]);
          plan.bounds=[Math.min(...bounds.map(b=>b[0])),Math.max(...bounds.map(b=>b[1])),Math.min(...bounds.map(b=>b[2])),Math.max(...bounds.map(b=>b[3]))];
          if(!valid(plan,n,seed))continue;
          candidates.push(plan);break;
        }
      }
    }
    return remember(rawCache,key,candidates,192);
  }
  function neighbors(ix,iz,seed,fetch){const list=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const p of fetch(ix+BigInt(i),iz+BigInt(j),seed))list.push({p,dx:i*400,dz:j*400});return list;}
  function close(p,q,dx=0,dz=0){return Math.hypot(p.x-q.x-dx,p.z-q.z-dz)<cfg.minSeparationMetres;}
  function primary(ix,iz,seed){
    const key=keyOf(ix,iz,seed);if(primaryCache.has(key))return primaryCache.get(key);
    const adjacent=neighbors(ix,iz,seed,raw).filter(q=>q.p.tier===0),accepted=raw(ix,iz,seed).filter(p=>p.tier===0&&!adjacent.some(q=>q.p.id!==p.id&&earlier(q.p,p)&&close(p,q.p,q.dx,q.dz)));
    return remember(primaryCache,key,accepted,192);
  }
  function eligible(ix,iz,seed){
    const key=keyOf(ix,iz,seed);if(eligibleCache.has(key))return eligibleCache.get(key);
    const established=neighbors(ix,iz,seed,primary),accepted=raw(ix,iz,seed).filter(p=>p.tier===1&&!established.some(q=>close(p,q.p,q.dx,q.dz)));
    return remember(eligibleCache,key,accepted,192);
  }
  function plansForMacro(ix,iz,seed){
    const key=keyOf(ix,iz,seed);if(planCache.has(key))return planCache.get(key);
    const adjacent=cfg.infill?neighbors(ix,iz,seed,eligible):[],infill=cfg.infill?eligible(ix,iz,seed).filter(p=>!adjacent.some(q=>q.p.id!==p.id&&earlier(q.p,p)&&close(p,q.p,q.dx,q.dz))):[];
    return remember(planCache,key,[...primary(ix,iz,seed),...infill].map(p=>({...p,originX:ix*400n,originZ:iz*400n})),128);
  }
  function context(cx,cz,seed){
    const key=keyOf(cx,cz,seed);if(contextCache.has(key))return contextCache.get(key);
    const wx=cx*64n,wz=cz*64n,ix=floor(wx+32n,400n),iz=floor(wz+32n,400n),plans=[];
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const mx=ix+BigInt(i),mz=iz+BigInt(j),dx=Number(mx*400n-wx),dz=Number(mz*400n-wz);
      if(dx>128||dx+400< -64||dz>128||dz+400< -64)continue;
      for(const p of plansForMacro(mx,mz,seed)){
        const bounds=[p.bounds[0]+dx,p.bounds[1]+dx,p.bounds[2]+dz,p.bounds[3]+dz];if(!overlaps(bounds,[-5,69,-5,69]))continue;
        const components=p.components.map(v=>{const x=v.x+dx,z=v.z+dz,ownerX=cx+BigInt(Math.floor(x/64)),ownerZ=cz+BigInt(Math.floor(z/64));
          return {...v,x,z,ownerX,ownerZ,belongs:ownerX===cx&&ownerZ===cz,groundY:heightAt?heightAt(x,z,cx,cz)+.04:undefined};});
        plans.push({...p,x:p.x+dx,z:p.z+dz,bounds,components,access:{...p.access,x:p.access.x+dx,z:p.access.z+dz},
          sightApproaches:p.sightApproaches.map(s=>({...s,x:s.x+dx,z:s.z+dz})),
          driveway:{...p.driveway,x1:p.driveway.x1+dx,x2:p.driveway.x2+dx,z1:p.driveway.z1+dz,z2:p.driveway.z2+dz,
            points:p.driveway.points.map(s=>({x:s.x+dx,z:s.z+dz})),segments:p.driveway.segments.map(s=>({...s,x1:s.x1+dx,x2:s.x2+dx,z1:s.z1+dz,z2:s.z2+dz}))}});
      }
    }
    return remember(contextCache,key,{plans,compounds:plans,x:cx,z:cz,seed},256);
  }
  function coverage(ix,iz,seed,step=20){
    const roads=macroPlan(ix,iz,seed).segments,near=neighbors(ix,iz,seed,plansForMacro),samples=[];
    for(const s of roads){if(s.kind==='dead-end'||s.noRelief||s.length<.001)continue;for(let d=0;d<s.length;d+=step){const t=d/s.length,x=s.x1+(s.x2-s.x1)*t,z=s.z1+(s.z2-s.z1)*t;
      if(!roadVisible(x,z,ix*400n,iz*400n,seed))continue;let nearest=Infinity,id=null;for(const q of near){const r=Math.hypot(x-q.p.x-q.dx,z-q.p.z-q.dz);if(r<nearest){nearest=r;id=q.p.id;}}
      samples.push({x,z,nearest,id,roadId:s.id,along:s.along+d});}}
    const distances=samples.map(s=>s.nearest).sort((a,b)=>a-b);return {samples,count:samples.length,max:distances.at(-1)||0,p95:distances[Math.floor(distances.length*.95)]||0,over150:samples.filter(s=>s.nearest>150).length,over250:samples.filter(s=>s.nearest>250).length};
  }
  return {context,plansForMacro,coverage,sample:compoundSample,settings:Object.freeze(cfg),
    clearCaches(){for(const c of [networkCache,rawCache,primaryCache,eligibleCache,planCache,contextCache])c.clear();},
    cacheSizes:()=>({network:networkCache.size,raw:rawCache.size,primary:primaryCache.size,eligible:eligibleCache.size,plans:planCache.size,contexts:contextCache.size})};
}

// Shared CPU mask. Accepts context, f.compounds array, or array of plans.
// Reuse out for wheat/ground loops; precomputed bounds reject distant groups.
export function compoundSample(x,z,context,out={}){
  out.yard=0;out.footprint=1e5;out.footprintDistance=1e5;out.driveway=1e5;out.drivewayDistance=1e5;out.drivewayAlong=0;out.drivewayWidth=3.8;out.clearing=false;out.groundY=undefined;out.plan=null;out.component=null;
  for(const p of Array.isArray(context)?context:context?.plans||context?.compounds||[]){
    const b=p.bounds;if(b&&(x<b[0]-4||x>b[1]+4||z<b[2]-4||z>b[3]+4))continue;
    const dx=x-p.x,dz=z-p.z,c=Math.cos(p.rot),s=Math.sin(p.rot),lx=c*dx-s*dz,lz=s*dx+c*dz;
    let yard=0;
    if(p.yard){yard=yardSample(lx,lz,p.yard,p.seed);}else if(p.yardHalfX!==undefined){
      const d=Math.max(Math.abs(lx)-p.yardHalfX,Math.abs(lz-(p.yardZ||0))-p.yardHalfZ);yard=1-smooth(-2.5,3.5,d);
    }
    out.yard=Math.max(out.yard,yard);if(yard>.12)out.clearing=true;
    for(const ds of p.driveway.segments||[p.driveway]){
      const drive=pointSegment(x,z,ds),along=(ds.along||0)+drive.t*(ds.length||Math.hypot(ds.x2-ds.x1,ds.z2-ds.z1)),width=p.driveway.width+2*(1-smooth(0,6,along)),driveD=drive.d-width*.5;
      if(driveD<out.driveway){out.driveway=out.drivewayDistance=driveD;out.drivewayAlong=along;out.drivewayWidth=width;}if(driveD<2)out.clearing=true;
    }
    for(const v of p.components){if(v.kind==='tree'||v.kind==='fence')continue;const d=componentDistance(x,z,v);
      if(d<out.footprint){out.footprint=out.footprintDistance=d;out.groundY=v.groundY;out.plan=p;out.component=v;}if(d<(p.kind==='extension'?2.7:1.45))out.clearing=true;}
  }
  return out;
}
