// Deterministic road stationing. All topology and attachment work is worker-only.
import {macroPlan,parcelHash} from './patchwork.js?v=51';
import {height,random,stringSeed,pondShoreDistance,compoundPlanner} from './world.js?v=51';
import {farmMask,FARM} from './farm-layout.js?v=51';
import {KEPHART_ACCESS_SEGMENTS} from './farm-access.js?v=51';
import {REFERENCE_BARN} from './reference-barn-layout.js?v=51';
import {ARRIVAL_COMPONENTS} from './arrival-compound.js?v=51';
const cache=new Map(),TAU=Math.PI*2;
const floor=(x,n)=>x>=0n?x/n:(x-n+1n)/n,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const unit=id=>parcelHash(id)/4294967296;
function project(p,s){const dx=s.x2-s.x1,dz=s.z2-s.z1,l2=dx*dx+dz*dz,t=clamp(((p.x-s.x1)*dx+(p.z-s.z1)*dz)/(l2||1),0,1);return {x:s.x1+dx*t,z:s.z1+dz*t,t,d:Math.hypot(p.x-s.x1-dx*t,p.z-s.z1-dz*t)};}
function at(road,t){const s=road.segments.find(s=>t<=s.along+s.length+.0001)||road.segments.at(-1),u=clamp((t-s.along)/s.length,0,1);return {x:s.x1+(s.x2-s.x1)*u,z:s.z1+(s.z2-s.z1)*u,tx:(s.x2-s.x1)/s.length,tz:(s.z2-s.z1)/s.length,width:s.width};}
function arrivalWeight(x,z,ox,oz){if(ox< -800n||ox>800n||oz< -800n||oz>800n)return 0;const d=Math.max(-40-Number(ox)-x,Number(ox)+x-128,-144-Number(oz)-z,Number(oz)+z-128),u=clamp(d/72,0,1);return 1-u*u*(3-2*u);}
function collect(ix,iz,seed){const ox=ix*400n,oz=iz*400n,roads=new Map(),lakes=[];
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const m=macroPlan(ix+BigInt(i),iz+BigInt(j),seed),dx=i*400,dz=j*400;
  for(const s of m.segments){if(!['main','lane'].includes(s.kind))continue;let r=roads.get(s.id);if(!r){r={id:s.id,kind:s.kind,segments:[],legacy:false};roads.set(s.id,r);}r.segments.push({...s,x1:s.x1+dx,x2:s.x2+dx,z1:s.z1+dz,z2:s.z2+dz});}
  for(const l of m.lakes)lakes.push({...l,cx:l.cx+dx,cz:l.cz+dz});
 }
 if(ox>=-800n&&ox<=800n&&oz>=-800n&&oz<=800n){
  for(const axis of ['x','z'])for(let n=-2;n<=3;n++){
   const index=BigInt(n),line=random(stringSeed(`${seed}:lane:${axis}:${index}`));if(n!==0&&line()>=(axis==='x'?.76:.41))continue;
   const id=`${seed}:arrival:${axis}:${n}`,segments=[];let along=0;
   for(let cell=-4;cell<=3;cell++){const r=random(stringSeed(`${seed}:curve:${axis}:${index}:${cell}`)),amplitude=(r()-.5)*1.1,harmonic=(r()-.5)*.32;
    const p=t=>{const offset=amplitude*Math.sin(Math.PI*t/64)+harmonic*Math.sin(Math.PI*t/32);return axis==='x'?{x:n*64+offset-Number(ox),z:cell*64+t-Number(oz)}:{x:cell*64+t-Number(ox),z:n*64+offset-Number(oz)};};
    for(let k=0;k<16;k++){const a=p(k*4),b=p((k+1)*4),length=Math.hypot(a.x-b.x,a.z-b.z);segments.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,length,along,width:3.5});along+=length;}
   }roads.set(id,{id,kind:'lane',segments,legacy:true});
  }
  const id='kephart-access';roads.set(id,{id,kind:'lane',special:true,segments:KEPHART_ACCESS_SEGMENTS.map(s=>({x1:s.a[0]-Number(ox),z1:s.a[1]-Number(oz),x2:s.b[0]-Number(ox),z2:s.b[1]-Number(oz),length:s.len,along:s.along,width:3.5}))});
 }
 for(const r of roads.values()){r.segments.sort((a,b)=>a.along-b.along);r.length=Math.max(...r.segments.map(s=>s.along+s.length));r.cuts=[0,r.length];}
 return {ox,oz,roads:[...roads.values()].sort((a,b)=>a.id.localeCompare(b.id)),lakes};
}
function planMacro(ix,iz,seed){const key=`${seed}:${ix}:${iz}`;if(cache.has(key))return cache.get(key);
 const {ox,oz,roads,lakes}=collect(ix,iz,seed),poles=new Map(),spans=new Map();
 const ground=(x,z)=>height(x+Number(ox-floor(ox,64n)*64n),z+Number(oz-floor(oz,64n)*64n),floor(ox,64n),floor(oz,64n));
 const dry=(x,z,pad=6)=>lakes.every(l=>{const b=l.bounds||[-l.rx*1.7,l.rx*1.7,-l.rz*1.7,l.rz*1.7];if(x<l.cx+b[0]-pad||x>l.cx+b[1]+pad||z<l.cz+b[2]-pad||z>l.cz+b[3]+pad)return true;return pondShoreDistance(x,z,l)>pad;});
 const visible=(r,x,z)=>r.special||((r.legacy?arrivalWeight(x,z,ox,oz)>.48:arrivalWeight(x,z,ox,oz)<.52)&&(!(ox>=-800n&&ox<=800n&&oz>=-800n&&oz<=800n)||farmMask(Number(ox)+x-FARM.x,Number(oz)+z-FARM.z)<.5));
 const clearance=(x,z)=>{let d=1e4;for(const r of roads)for(const s of r.segments){if(x<Math.min(s.x1,s.x2)-14||x>Math.max(s.x1,s.x2)+14||z<Math.min(s.z1,s.z2)-14||z>Math.max(s.z1,s.z2)+14)continue;const p=project({x,z},s);if(r.special||(r.legacy?arrivalWeight(p.x,p.z,ox,oz)>.02:arrivalWeight(p.x,p.z,ox,oz)<.98))d=Math.min(d,p.d-s.width/2);}return d;};
 // Endpoint/segment T joins plus proper interior crossings of the arrival roads.
 const junctions=[];
 for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){
  const a=roads[i],b=roads[j];for(const [r,o]of [[a,b],[b,a]])for(const t of [0,r.length]){const p=at(r,t);if(p.x< -95||p.x>495||p.z< -95||p.z>495||!visible(r,p.x,p.z))continue;let best=null,segment=null;for(const s of o.segments){const q=project(p,s);if(!best||q.d<best.d){best=q;segment=s;}}if(best?.d<2.3&&visible(o,best.x,best.z)){const u=segment.along+best.t*segment.length;r.cuts.push(t);o.cuts.push(u);junctions.push({x:best.x,z:best.z});}}
  if(a.legacy&&b.legacy&&a.id.split(':').at(-2)!==b.id.split(':').at(-2)){const sa=a.segments[Math.floor(a.segments.length/2)],sb=b.segments[Math.floor(b.segments.length/2)],p={x:a.id.includes(':x:')?sa.x1:sb.x1,z:a.id.includes(':z:')?sa.z1:sb.z1};for(const r of [a,b]){let q=null,seg;for(const s of r.segments){const v=project(p,s);if(!q||v.d<q.d){q=v;seg=s;}}if(q&&visible(r,q.x,q.z))r.cuts.push(seg.along+q.t*seg.length);}junctions.push(p);}
 }
 const makePole=(r,t,index)=>{const q=at(r,t);if(q.x< -85||q.x>485||q.z< -85||q.z>485||!visible(r,q.x,q.z))return null;
  const rr=random(parcelHash(r.id+':'+t.toFixed(2))),side=unit(r.id+':side')<.5?-1:1,setback=q.width/2+2.5+rr(),angle=Math.atan2(q.tx,q.tz),joint=junctions.find(j=>Math.hypot(j.x-q.x,j.z-q.z)<3);
  let x=q.x+q.tz*setback*side,z=q.z-q.tx*setback*side;
  if(joint){let best=null;for(let k=0;k<32;k++){const a=k*TAU/32,px=joint.x+Math.cos(a)*7.4,pz=joint.z+Math.sin(a)*7.4,clear=clearance(px,pz);if(clear<2.45||!dry(px,pz))continue;const score=Math.hypot(px-x,pz-z);if(!best||score<best.score)best={x:px,z:pz,score};}if(best){x=best.x;z=best.z;}else return null;}
  if(!dry(x,z)||clearance(x,z)<2.35)return null;
  const id=joint?`junction:${ox*10n+BigInt(Math.round(joint.x*10))}:${oz*10n+BigInt(Math.round(joint.z*10))}`:`pole:${r.id}:${t.toFixed(2)}`;
  if(poles.has(id))return poles.get(id);
  const era=rr(),year=era<.43?1964+Math.floor(rr()*16):1980+Math.floor(rr()*24),terminal=t<.01||t>r.length-.01,kind=joint||terminal?'double':era>.62&&r.kind==='lane'?'vertical':rr()<.24?'alley':'tangent';
  const p={id,x,y:ground(x,z),z,angle,side,kind,year,h:9+rr()*3,seed:parcelHash(id),transformer:index%4===parcelHash(r.id)%4,insulator:year<1980?(rr()<.55?'glass':'porcelain'):'polymer',lean:0,leanAngle:angle,guys:[],degree:0};poles.set(id,p);return p;
 };
 const connect=(a,b,kind='primary')=>{if(!a||!b||a===b)return;const id=[a.id,b.id].sort().join('|')+':'+kind;if(!spans.has(id))spans.set(id,{id,a,b,kind});};
 for(const r of roads){const cuts=[...new Set(r.cuts.map(t=>Math.round(t*100)/100))].sort((a,b)=>a-b).filter((t,i,a)=>i===0||t-a[i-1]>4),n=Math.max(1,Math.round(r.length/55)),stations=[...cuts];for(let j=1;j<n;j++){const t=r.length*j/n;if(cuts.every(c=>Math.abs(c-t)>24))stations.push(t);}stations.sort((a,b)=>a-b);let prev=null;for(let i=0;i<stations.length;i++){const p=makePole(r,stations[i],i);if(prev&&p)connect(prev,p);prev=p;}}
 // Real buildings request a short service branch; no random isolated service stubs.
 const targets=[];for(const farm of compoundPlanner.plansForMacro(ix,iz,seed)){const b=farm.components.find(p=>p.main&&p.width);if(b)targets.push({id:farm.id||farm.key,x:b.x,z:b.z,angle:b.angle||0,width:b.width,depth:b.depth,h:b.height||4.8});}
 if(ox===0n&&oz===0n){targets.push({id:'kephart',x:160,z:96,angle:0,width:12,depth:20,h:5.3},{id:'arrival-old-barn',x:32,z:27,angle:-Math.PI*.45,width:12,depth:17,h:4.7});for(const b of ARRIVAL_COMPONENTS)if(b.main)targets.push({...b,id:'arrival-extension',h:b.height});}
 if(ox===0n&&oz===-400n)targets.push({id:'reference-barn',x:84,z:320,angle:0,width:24,depth:11.6,h:3.3});
 for(const b of targets){let parent=null,dist=90;for(const p of poles.values()){if(p.kind==='service')continue;const d=Math.hypot(p.x-b.x,p.z-b.z);if(d<dist){dist=d;parent=p;}}if(!parent)continue;
  const co=Math.cos(b.angle),si=Math.sin(b.angle),localX=(parent.x-b.x)*co-(parent.z-b.z)*si,sg=Math.sign(localX)||1,eave={x:b.x+co*sg*(b.width/2+.18),z:b.z-si*sg*(b.width/2+.18),y:ground(b.x,b.z)+b.h+.12};
  const vx=parent.x-eave.x,vz=parent.z-eave.z,len=Math.hypot(vx,vz)||1,x=eave.x+vx/len*Math.min(8,len*.45),z=eave.z+vz/len*Math.min(8,len*.45);
  if(!dry(x,z)||clearance(x,z)<2.4||Math.hypot(parent.x-x,parent.z-z)<2)continue;
  parent.transformer=true;const id='service:'+b.id,p={id,x,y:ground(x,z),z,h:7.4,angle:Math.atan2(vx,vz),side:1,kind:'service',year:parent.year,seed:parcelHash(id),insulator:parent.insulator,transformer:false,lean:0,leanAngle:0,guys:[],eave,degree:0};poles.set(id,p);connect(parent,p,'service');
 }
 // Lean follows the cable resultant; guy anchors oppose it and stay out of traffic.
 for(const p of poles.values()){let fx=0,fz=0;for(const s of spans.values()){const other=s.a===p?s.b:s.b===p?s.a:null;if(!other)continue;p.degree++;const d=Math.hypot(other.x-p.x,other.z-p.z)||1;fx+=(other.x-p.x)/d;fz+=(other.z-p.z)/d;}
  const stress=Math.hypot(fx,fz),rr=random(p.seed^731);if(p.kind!=='service'&&(p.degree===1||p.degree>2||stress>.27)){p.kind='double';p.lean=(2+rr()*4)*Math.PI/180;p.leanAngle=Math.atan2(fx,fz);const a=Math.atan2(fz,fx)+Math.PI;
   for(const spread of p.degree>2?[-.28,.28]:[0])for(const turn of [0,.13,-.13,.26,-.26]){const dir=a+spread+turn,x=p.x+Math.cos(dir)*(p.h-1.8),z=p.z+Math.sin(dir)*(p.h-1.8);let safe=dry(x,z)&&clearance(x,z)>1.1;for(let k=0;safe&&k<=8;k++)safe=clearance(p.x+(x-p.x)*k/8,p.z+(z-p.z)*k/8)>.5;if(safe){p.guys.push({x,y:ground(x,z),z});break;}}
  }
 }
 const result={ox,oz,poles:[...poles.values()],spans:[...spans.values()]};cache.set(key,result);if(cache.size>48)cache.delete(cache.keys().next().value);return result;
}
export function polePoint(p,x,y,z){const k=Math.tan(p.lean||0),co=Math.cos(p.angle),si=Math.sin(p.angle);return{x:p.x+co*x+si*z+Math.sin(p.leanAngle)*k*y,y:p.y+y,z:p.z-si*x+co*z+Math.cos(p.leanAngle)*k*y};}
export function phasePoint(p,i,toward){let z=0;if(p.kind==='double')z=toward?((toward.x-p.x)*Math.sin(p.angle)+(toward.z-p.z)*Math.cos(p.angle)>=0?.22:-.22):.22;return p.kind==='vertical'?polePoint(p,(i%2?-.42:.42),p.h-.4-i*.52,0):polePoint(p,(i-1)*1.08+(p.kind==='alley'?p.side*.92:0),p.h-.18,z);}
export const secondaryPoint=p=>polePoint(p,.25,p.kind==='service'?p.h-.2:p.h-1.75,0);
export const telcoPoint=p=>polePoint(p,-.23,p.h-3.25,0);
export function makeCable(id,a,b,sag,kind=0,helix=0,phase=unit(id)*TAU){return{id,a,b,sag,kind,helix,phase};}
export function cablePoint(c,t,time=0,wind=1){const dx=c.b.x-c.a.x,dz=c.b.z-c.a.z,len=Math.hypot(dx,dz)||1,envelope=4*t*(1-t),sway=Math.sin(time*.48+c.phase)*.045*wind*envelope,twist=t*len*TAU/1.2+c.phase;return{x:c.a.x+dx*t-dz/len*(sway+Math.cos(twist)*c.helix*envelope),y:c.a.y+(c.b.y-c.a.y)*t-c.sag*envelope+Math.sin(twist)*c.helix*envelope,z:c.a.z+dz*t+dx/len*(sway+Math.cos(twist)*c.helix*envelope)};}
export function planRuralPower(f){const wx=f.x*64n,wz=f.z*64n,mx=floor(wx+32n,400n),mz=floor(wz+32n,400n),nodes=new Map(),links=new Map();
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const ix=mx+BigInt(i),iz=mz+BigInt(j),dx=Number(ix*400n-wx),dz=Number(iz*400n-wz);if(dx>150||dx+400< -85||dz>150||dz+400< -85)continue;const m=planMacro(ix,iz,f.worldSeed);
  const local=p=>({...p,x:p.x+dx,z:p.z+dz,guys:p.guys.map(g=>({...g,x:g.x+dx,z:g.z+dz})),eave:p.eave?{...p.eave,x:p.eave.x+dx,z:p.eave.z+dz}:null});
  for(const p of m.poles)if(p.x+dx>=0&&p.x+dx<64&&p.z+dz>=0&&p.z+dz<64)nodes.set(p.id,local(p));
  for(const s of m.spans){const a=local(s.a),b=local(s.b);if(Math.min(a.x,b.x)>64||Math.max(a.x,b.x)<0||Math.min(a.z,b.z)>64||Math.max(a.z,b.z)<0)continue;if(!links.has(s.id))links.set(s.id,{...s,a,b});for(const p of [a,b])if(!nodes.has(p.id)||p.transformer)nodes.set(p.id,p);}
 }
 // Every shared endpoint gets hardware and lean from its spatial owner. A
 // neighbor's truncated planning halo must not turn it into a false dead-end.
 for(const [id,p]of nodes){const ix=floor(wx+BigInt(Math.floor(p.x)),400n),iz=floor(wz+BigInt(Math.floor(p.z)),400n),m=planMacro(ix,iz,f.worldSeed),a=m.poles.find(n=>n.id===id);if(!a)continue;const dx=Number(m.ox-wx),dz=Number(m.oz-wz);nodes.set(id,{...a,transformer:a.transformer||p.transformer,x:a.x+dx,z:a.z+dz,guys:a.guys.map(g=>({...g,x:g.x+dx,z:g.z+dz})),eave:a.eave?{...a.eave,x:a.eave.x+dx,z:a.eave.z+dz}:null});}
 for(const s of links.values()){s.a=nodes.get(s.a.id);s.b=nodes.get(s.b.id);}
 return {poles:[...nodes.values()],spans:[...links.values()]};
}
export function clearPowerLayoutCache(){cache.clear();}
