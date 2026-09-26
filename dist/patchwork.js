import {createLakeAccess} from './lake-access.js?v=52';
import {pondShoreDistance,pondBankPoint,pondMetrics} from './lake-shape.js?v=52';
// Hierarchical agricultural ownership, independent of the 64m streaming cells.
import {parcelSample as legacyParcel,patchworkContext as legacyContext} from './patchwork-legacy.js?v=52';
const legacyFields=new WeakMap();
function oldParcelField(f){let v=legacyFields.get(f);if(!v){v={x:f.x,z:f.z,worldSeed:f.worldSeed,patch:legacyContext(f.x,f.z,f.worldSeed)};legacyFields.set(f,v);}return v;}
const SIZE=400,macros=new Map(),contexts=new Map();let sources=()=>({lakes:[],buildings:[]}),route=null;
export const PARCEL_SIZE=SIZE;
export function configurePatchwork(provider,router){sources=provider;route=router;macros.clear();contexts.clear();}
const floor=(x,n)=>x>=0n?x/n:(x-n+1n)/n;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function parcelHash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;}
const unit=s=>parcelHash(s)/4294967296;
function edge(i,axis,seed){return (unit(`${seed}:macro-${axis}:${i}`)-.5)*90;}
function box(poly){return [Math.min(...poly.map(p=>p.x)),Math.max(...poly.map(p=>p.x)),Math.min(...poly.map(p=>p.z)),Math.max(...poly.map(p=>p.z))];}
function center(poly){return {x:poly.reduce((a,p)=>a+p.x,0)/poly.length,z:poly.reduce((a,p)=>a+p.z,0)/poly.length};}
function clip(poly,nx,nz,c,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],d=(a.x*nx+a.z*nz-c)*sign,e=(b.x*nx+b.z*nz-c)*sign;if(d<=1e-8)out.push(a);if((d<0)!==(e<0)){const t=d/(d-e);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
function cut(poly,nx,nz,c){const hit=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],d=a.x*nx+a.z*nz-c,e=b.x*nx+b.z*nz-c;if((d<0)!==(e<0)){const t=d/(d-e);hit.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return hit;}
function inside(x,z,p){let sign=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],v=(b.x-a.x)*(z-a.z)-(b.z-a.z)*(x-a.x);if(Math.abs(v)<1e-7)continue;const s=Math.sign(v);if(sign&&s!==sign)return false;sign=s;}return true;}
function roadSegments(road,lakes){
 if(route){const result=route(road.points,lakes,{id:road.id,width:road.width,kind:road.kind});if(result?.segments)return result.segments.map(s=>({...s,dx:s.x2-s.x1,dz:s.z2-s.z1,inv:1/Math.max(1e-10,(s.x2-s.x1)**2+(s.z2-s.z1)**2),fade:road.fade||0,totalLength:result.segments.reduce((a,s)=>Math.max(a,s.along+s.length),0)}));}
 let along=0;return road.points.slice(1).map((p,i)=>{const a=road.points[i],dx=p.x-a.x,dz=p.z-a.z,length=Math.hypot(dx,dz),s={x1:a.x,z1:a.z,x2:p.x,z2:p.z,dx,dz,length,inv:1/(length*length),along,width:road.width,id:road.id,kind:road.kind,fade:road.fade||0};along+=length;return s;});
}
function interest(p,features,junctions){let value=0;for(const b of features.buildings){const d=Math.hypot(p.x-b.x,p.z-b.z);value=Math.max(value,Math.exp(-(d*d)/(2*80*80)));}for(const l of features.lakes){const d=Math.max(0,Math.hypot(p.x-l.cx,p.z-l.cz)-Math.max(l.rx,l.rz)*.9);value=Math.max(value,.94*Math.exp(-(d*d)/(2*90*90)));}for(const j of junctions){const d=Math.hypot(p.x-j.x,p.z-j.z);value=Math.max(value,.66*Math.exp(-(d*d)/(2*50*50)));}return value;}
function dryNode(p,lakes){
 const original={...p};for(let pass=0;pass<2;pass++)for(const lake of lakes){if(pondShoreDistance(p.x,p.z,lake)>=31)continue;let best=null,dist=Infinity;
  for(let j=0;j<96;j++){let q=pondBankPoint(lake,j/96*Math.PI*2,35);
   for(let k=0;k<8;k++){const d=pondShoreDistance(q.x,q.z,lake);if(d>=33)break;const gx=pondShoreDistance(q.x+.8,q.z,lake)-pondShoreDistance(q.x-.8,q.z,lake),gz=pondShoreDistance(q.x,q.z+.8,lake)-pondShoreDistance(q.x,q.z-.8,lake),len=Math.hypot(gx,gz)||1;q={x:q.x+gx/len*Math.min(8,35-d),z:q.z+gz/len*Math.min(8,35-d)};}
   const d=Math.hypot(q.x-original.x,q.z-original.z);if(d<dist&&lakes.every(l=>pondShoreDistance(q.x,q.z,l)>=31)){dist=d;best=q;}
  }if(best)p=best;
 }return p;
}
export function macroPlan(ix,iz,seed){
 const key=`${seed}:${ix}:${iz}`;if(macros.has(key))return macros.get(key);
 const ox=ix*400n,oz=iz*400n,x0=edge(ix,'x',seed),x1=400+edge(ix+1n,'x',seed),z0=edge(iz,'z',seed),z1=400+edge(iz+1n,'z',seed);
 const features=sources(ox,oz,seed),leaves=[],roads=[],junctions=[],splits=[];
 const add=(points,id,kind='lane',width=3.7,fade=0)=>roads.push({points,id:key+':'+id,kind,width,fade});
 // Long straight primary lanes; sparse cross-connectors share canonical edges.
 const n00=dryNode({x:x0,z:z0},features.lakes),n10=dryNode({x:x1,z:z0},features.lakes),n01=dryNode({x:x0,z:z1},features.lakes);
 add([n00,n10],'south','main',4.2);
 const west=unit(`${seed}:connector:${ix}`)<.58,east=unit(`${seed}:connector:${ix+1n}`)<.58;
 if(west){const delta=10+unit(key+':crossing')*10;add([n00,Math.hypot(n01.x-x0,n01.z-z1)<.01?{x:x0+delta,z:z1}:n01],'west','main',4.0);}
 if(west)junctions.push({x:x0,z:z0});if(east)junctions.push({x:x1,z:z0});
 function split(poly,depth,path,parentAxis=-1,half=false){
  const bounds=box(poly),w=bounds[1]-bounds[0],h=bounds[3]-bounds[2],p=center(poly),inf=interest(p,features,junctions),r=unit(key+':split:'+path);
  const short=Math.min(w,h),long=Math.max(w,h),area=w*h;
  const target=inf>.7?4000:inf>.4?7200:inf>.18?21000:72000;
  if(depth>=4||short<44||area<target||(depth>0&&inf<.18&&long<440&&short>145)){
   const hash=parcelHash(key+':leaf:'+path);leaves.push({key:key+':'+path,hash,poly,bounds,x:p.x,z:p.z,depth,influence:inf,crop:hash%10<6?0:hash%10<8?1:2,angleIndex:(hash>>>5)%3,tone:.92+((hash>>>20)&255)/255*.13});return;
  }
  const axis=w>h*1.22?0:h>w*1.22?1:parentAxis<0?(r<.5?0:1):1-parentAxis;
  let ratio=.39+unit(key+':ratio:'+path)*.22;
  // Related subfields form offset T attachments, 10–20m apart on a parent lane.
  if(depth===1){const offset=10+unit(key+':offset')*10;ratio=.5+(path.endsWith('0')?-1:1)*offset/(2*(axis===0?w:h));}
  const skew=(unit(key+':angle:'+path)-.5)*(depth>1?.22:.07),nx=axis===0?1:skew,nz=axis===0?skew:1;
  const c=axis===0?bounds[0]+w*ratio+skew*p.z:bounds[2]+h*ratio+skew*p.x;
  const a=clip(poly,nx,nz,c,1),b=clip(poly,nx,nz,c,-1),line=cut(poly,nx,nz,c);
  if(a.length<3||b.length<3||line.length!==2)throw Error('Invalid agricultural subdivision');
  const childTooSmall=[a,b].some(poly=>{const b=box(poly),w=b[1]-b[0],h=b[3]-b[2];return Math.min(w,h)<40||Math.max(w,h)<60;});
  if(childTooSmall){const hash=parcelHash(key+':leaf:'+path);leaves.push({key:key+':'+path,hash,poly,bounds,x:p.x,z:p.z,depth,influence:inf,crop:hash%10<6?0:hash%10<8?1:2,angleIndex:(hash>>>5)%3,tone:.92+((hash>>>20)&255)/255*.13});return;}
  splits.push({depth,path,a:line[0],b:line[1],axis});
  // Crop boundaries and headlands often have no vehicle road.
  if(depth===0||depth===1&&inf>.28||depth===2&&inf>.72&&r<.30){add(line,'split:'+path,'lane',3.3+r*.5);junctions.push(...line);}
  const extra=depth>=2&&inf>.45&&!half;split(a,extra?depth:depth+1,path+'0',axis,extra);split(b,extra?depth:depth+1,path+'1',axis,extra);
 }
 split([{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}],0,'r');
 // Occasional oblique field-access Y, ending inside a field with fading ruts.
 if(unit(key+':spur')<.38){const x=x0+(x1-x0)*(.2+unit(key+':spur-x')*.6),sg=unit(key+':spur-side')<.5?-1:1,len=38+unit(key+':spur-len')*53;add([{x,z:z0},{x:x+sg*18,z:z0+12},{x:x+sg*(35+len*.35),z:z0+len}],'field-access','dead-end',3.2,14);junctions.push({x,z:z0,kind:'Y'});}
 // Extend split endpoints onto the actual connector geometry. Shifted T
 // junctions must join the centerline, not their former field-boundary location.
 const localDelta=10+unit(key+':crossing')*10,eastDelta=10+unit(`${seed}:${ix+1n}:${iz}:crossing`)*10;
 for(const r of roads)if(r.kind==='lane')for(const p of r.points){
  if(west&&Math.abs(p.x-x0)<.1)p.x=x0+localDelta*(p.z-z0)/(z1-z0);
  if(east&&Math.abs(p.x-x1)<.1)p.x=x1+eastDelta*(p.z-z0)/(z1-z0);
 }
 const nearest=(p,prior)=>{let hit=null,best=Infinity;for(const r of prior)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz),0,1),q={x:a.x+t*dx,z:a.z+t*dz},d=Math.hypot(q.x-p.x,q.z-p.z);if(d<best){best=d;hit=q;}}return{hit,d:best};};
 for(let i=0;i<roads.length;i++){const r=roads[i];if(r.kind!=='lane')continue;const prior=roads.slice(0,i),hits=r.points.map(p=>nearest(p,prior));
  for(let j=0;j<r.points.length;j++)if(hits[j].d<26)r.points[j]=hits[j].hit;
  // The first horizontal field division needs a real connection to the trunk.
  if(i<3&&hits.every(h=>h.d>26)){const j=hits[0].d<hits[1].d?0:1;add([hits[j].hit,r.points[j]],'headland-link','lane',3.6);}
 }
 const segments=[];
 for(let i=0;i<roads.length;i++){const r=roads[i];
  if(r.kind!=='main'&&segments.length)for(let j=0;j<r.points.length;j+=Math.max(1,r.points.length-1)){
   const p=r.points[j],old=nearest(p,roads.slice(0,i));if(old.d>28)continue;let best=null,distance=Infinity;
   for(const s of segments){const dx=s.x2-s.x1,dz=s.z2-s.z1,t=clamp(((p.x-s.x1)*dx+(p.z-s.z1)*dz)/(dx*dx+dz*dz),0,1),q={x:s.x1+t*dx,z:s.z1+t*dz},d=Math.hypot(p.x-q.x,p.z-q.z);if(d<distance){distance=d;best=q;}}
   if(best&&distance<160)r.points[j]=best;
  }
  segments.push(...roadSegments(r,features.lakes));
 }
 const turnarounds=[];
 for(const lake of features.lakes){if(lake.cx<x0||lake.cx>=x1||lake.cz<z0||lake.cz>=z1)continue;
  const access=createLakeAccess(lake,segments,{shoreDistance:pondShoreDistance,bankPoint:pondBankPoint,metrics:pondMetrics,hash:parcelHash});segments.push(...access.segments);turnarounds.push(...access.turnarounds);
 }
 // Keep corridor identity distinct from ownership for collinear continuations.
 for(const s of segments)s.corridor=s.id.endsWith(':south')?`${seed}:main-row:${iz}`:s.id;
 const result={key,ox,oz,turnarounds,bounds:[x0,x1,z0,z1],leaves,roads,segments,splits,junctions,lakes:features.lakes};macros.set(key,result);if(macros.size>96)macros.delete(macros.keys().next().value);return result;
}
export function patchworkContext(cx,cz,seed){
 const key=`${seed}:${cx}:${cz}`;if(contexts.has(key))return contexts.get(key);
 const wx=cx*64n,wz=cz*64n,ix=floor(wx+32n,400n),iz=floor(wz+32n,400n),leaves=[],segments=[],turnarounds=[],ids=new Set();
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const mx=ix+BigInt(i),mz=iz+BigInt(j),dx=Number(mx*400n-wx),dz=Number(mz*400n-wz);
  if(dx>254||dx+400< -190||dz>254||dz+400< -190)continue;
  const m=macroPlan(mx,mz,seed);
  for(const t of m.turnarounds){if(t.x+dx+t.radius>=0&&t.x+dx-t.radius<=64&&t.z+dz+t.radius>=0&&t.z+dz-t.radius<=64)turnarounds.push({...t,x:t.x+dx,z:t.z+dz});}
  for(const l of m.leaves){const b=l.bounds;if(b[0]+dx>65||b[1]+dx< -1||b[2]+dz>65||b[3]+dz< -1)continue;leaves.push({...l,x:l.x+dx,z:l.z+dz,poly:l.poly.map(p=>({x:p.x+dx,z:p.z+dz})),bounds:[b[0]+dx,b[1]+dx,b[2]+dz,b[3]+dz]});}
  for(const s of m.segments){if(Math.min(s.x1,s.x2)+dx>82||Math.max(s.x1,s.x2)+dx< -18||Math.min(s.z1,s.z2)+dz>82||Math.max(s.z1,s.z2)+dz< -18)continue;const id=s.id+':'+s.along;if(ids.has(id))continue;ids.add(id);segments.push({...s,x1:s.x1+dx,x2:s.x2+dx,z1:s.z1+dz,z2:s.z2+dz});}
 }
 const bins=Array.from({length:64},()=>[]);
 for(let n=0;n<segments.length;n++){const s=segments[n],pad=17;for(let z=clamp(Math.floor((Math.min(s.z1,s.z2)-pad)/8),0,7);z<=clamp(Math.floor((Math.max(s.z1,s.z2)+pad)/8),0,7);z++)for(let x=clamp(Math.floor((Math.min(s.x1,s.x2)-pad)/8),0,7);x<=clamp(Math.floor((Math.max(s.x1,s.x2)+pad)/8),0,7);x++)bins[z*8+x].push(n);}
 const c={leaves,segments,turnarounds,bins,seed};contexts.set(key,c);if(contexts.size>192)contexts.delete(contexts.keys().next().value);return c;
}
export function parcelSample(x,z,f,out={}){
 const c=f.patch||patchworkContext(f.x,f.z,f.worldSeed);let a;
 for(const l of c.leaves){const b=l.bounds;if(x>=b[0]-1e-7&&x<=b[1]+1e-7&&z>=b[2]-1e-7&&z<=b[3]+1e-7&&inside(x,z,l.poly)){a=l;break;}}
 if(!a)a=c.leaves.reduce((best,l)=>!best||(x-l.x)**2+(z-l.z)**2<(x-best.x)**2+(z-best.z)**2?l:best,null);
 if(!a)throw Error('Missing hierarchical agricultural parcel');
 const arrival=f.x>=-3n&&f.x<=3n&&f.z>=-4n&&f.z<=3n,wx=arrival?Number(f.x)*64+x:1e6,wz=arrival?Number(f.z)*64+z:1e6;
 if(arrival&&wx>=-40&&wx<=128&&wz>=-144&&wz<=128)legacyParcel(x,z,oldParcelField(f),out);
 else{out.centerX=a.x;out.centerZ=a.z;out.id=a.key;out.crop=a.crop;out.angleIndex=a.angleIndex;out.angle=a.angleIndex*Math.PI/4;out.tone=a.tone;const co=Math.cos(out.angle),si=Math.sin(out.angle);out.row=(x-a.x)*co+(z-a.z)*si;out.along=-(x-a.x)*si+(z-a.z)*co;}
 let d=1e4,d2=1e4,first=null,second=null,t=0,t2=0;
 const list=c.bins[clamp(Math.floor(z/8),0,7)*8+clamp(Math.floor(x/8),0,7)];
 for(let pass=0;pass<2;pass++)for(const n of list){const s=c.segments[n];if(pass&&s.corridor===first?.corridor)continue;const u=clamp(((x-s.x1)*s.dx+(z-s.z1)*s.dz)*s.inv,0,1),v=Math.hypot(x-s.x1-u*s.dx,z-s.z1-u*s.dz);
  if(!pass&&v<d){d=v;first=s;t=s.along+u*s.length;}else if(pass&&v<d2){d2=v;second=s;t2=s.along+u*s.length;}}
 out.distance=d;out.second=d2;out.width=first?.width||4;out.width2=second?.width||4;out.roadAlong=t;out.roadAlong2=t2;out.nx=first?-first.dz/first.length:1;out.nz=first?first.dx/first.length:0;out.nx2=second?-second.dz/second.length:0;out.nz2=second?second.dx/second.length:1;out.roadKind=first?.kind||'none';out.endWeight=first?.fade?clamp((first.totalLength-t)/first.fade,0,1):1;out.endWeight2=second?.fade?clamp((second.totalLength-t2)/second.fade,0,1):1;out.noRelief=!!first?.noRelief;out.noRelief2=!!second?.noRelief;out.turnaround=0;
 for(const pad of c.turnarounds){const dx=x-pad.x,dz=z-pad.z,co=Math.cos(pad.angle),si=Math.sin(pad.angle),radius=Math.hypot((co*dx+si*dz)/pad.radius,(-si*dx+co*dz)/pad.minorRadius);out.turnaround=Math.max(out.turnaround,clamp((1.10-radius)*pad.minorRadius/1.3,0,1));}
 out.depth=a.depth;out.influence=a.influence;return out;
}
