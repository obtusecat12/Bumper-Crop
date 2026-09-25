// Proposal only: call ONCE per canonical lake owner with roads in the same frame.
// A caller must not independently attach this lake from every streaming tile.
// This emits only surface descriptors. Never use them to lower/flatten lake terrain.
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fallbackHash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function cubic(a,b,c,d,t){const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,z:u*u*u*a.z+3*u*u*t*b.z+3*u*t*t*c.z+t*t*t*d.z};}
function normal(p,lake,shoreDistance){const e=.75,gx=shoreDistance(p.x+e,p.z,lake)-shoreDistance(p.x-e,p.z,lake),gz=shoreDistance(p.x,p.z+e,lake)-shoreDistance(p.x,p.z-e,lake),len=Math.hypot(gx,gz);return len>1e-7?{x:gx/len,z:gz/len}:null;}
function sampleCurve(a,b,c,d,step=1.5){const n=Math.max(8,Math.ceil((dist(a,b)+dist(b,c)+dist(c,d))/step)),p=[];for(let i=0;i<=n;i++)p.push(cubic(a,b,c,d,i/n));return p;}
function compile(points,{id,width,kind,endFade=0,attachRoadId=null,attachAlong=0}){
 let totalLength=0;for(let i=1;i<points.length;i++)totalLength+=dist(points[i-1],points[i]);
 let along=0;const segments=[];
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<1e-7)continue;segments.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,dx,dz,length,inv:1/(length*length),along,totalLength,id,width,kind,endFade,fade:endFade,fadeStart:Math.max(0,totalLength-endFade),noRelief:true,attachRoadId,attachAlong});along+=length;}
 return segments;
}
function closest(p,s){const dx=s.x2-s.x1,dz=s.z2-s.z1,ll=dx*dx+dz*dz;if(ll<1e-8)return null;const t=clamp(((p.x-s.x1)*dx+(p.z-s.z1)*dz)/ll,0,1),point={x:s.x1+t*dx,z:s.z1+t*dz};return{point,distance:dist(p,point),along:(s.along||0)+Math.sqrt(ll)*t,tx:dx/Math.sqrt(ll),tz:dz/Math.sqrt(ll),road:s};}

export function createLakeAccess(lake,segments,{shoreDistance,bankPoint,metrics,hash=fallbackHash}={}){
 if(!shoreDistance||!bankPoint||!metrics)throw Error('Lake access needs shoreDistance, bankPoint, and metrics callbacks');
 const lakeKey=String(lake.lakeId??lake.lakeSeed??lake.seed),id='lake-access:'+lakeKey;
 const unit=s=>(hash(s)>>>0)/4294967296,empty={segments:[],turnarounds:[],selected:false,reason:'chance'};
 // Independent lake-owned stream: adding/removing nearby roads never changes chance.
 if(unit(id+':chance')>=.15)return empty;
 const radius=6+2*unit(id+':radius'),minorRadius=radius*.76,width=2.7,candidates=[];
 const get=(p)=>metrics(p.x,p.z,lake,{});
 const dry=(p,extra=0)=>{const m=get(p);return m.metres>=m.width+1.5+extra;};
 const phase=unit(id+':angle')*TAU;
 for(let i=0;i<40;i++){
   const a=phase+i/40*TAU,shore=bankPoint(lake,a,0),sm=get(shore);
   if(sm.rock>.52||sm.slope>.18)continue;
   const n=normal(shore,lake,shoreDistance);if(!n)continue;
   // Whole turnaround, not just its centre, remains outside the original mudflat.
   let centre=bankPoint(lake,a,sm.width+radius+4);
   for(let q=0;q<7;q++){
     const cm=get(centre),need=cm.width+radius+4-cm.metres;if(need<=.2)break;
     const cn=normal(centre,lake,shoreDistance);if(!cn)break;
     centre={x:centre.x+cn.x*Math.min(need,8),z:centre.z+cn.z*Math.min(need,8)};
   }
   const cn=normal(centre,lake,shoreDistance);if(!cn)continue;
   const cm=get(centre);if(cm.slope>.16||!dry(centre,radius+1))continue;
   let ovalSafe=true;
   for(let j=0;j<24;j++){
     const u=Math.cos(j/24*TAU)*radius,v=Math.sin(j/24*TAU)*minorRadius,
       p={x:centre.x+cn.x*u-cn.z*v,z:centre.z+cn.z*u+cn.x*v};
     if(!dry(p,.35)){ovalSafe=false;break;}
   }
   if(!ovalSafe)continue;
   let attached=null;
   for(const s of segments){if(s.kind==='water-access'||s.kind==='wet-cutoff')continue;const p=closest(centre,s);if(!p||p.distance<radius+3||p.distance>60)continue;if(!attached||p.distance<attached.distance-1e-7||Math.abs(p.distance-attached.distance)<1e-7&&String(s.id)<String(attached.road.id))attached=p;}
   if(!attached)continue;
   // Attachment is an exact point on a real segment, never an approximate
   // coordinate from an unrouted lane or an independent guessed direction.
   const start=attached.point,vx=centre.x-start.x,vz=centre.z-start.z,len=attached.distance;
   const forward=Math.sign(vx*attached.tx+vz*attached.tz)||1;
   const tx=vx/len+attached.tx*forward*.55,tz=vz/len+attached.tz*forward*.55,tl=Math.hypot(tx,tz);
   const h=Math.min(14,len*.32),c1={x:start.x+tx/tl*h,z:start.z+tz/tl*h};
   // Approach roughly shoreward. If the main road lies side-on, use a gentler
   // mixed tangent rather than forcing a hook around the oval.
   const ex=vx/len-cn.x*.65,ez=vz/len-cn.z*.65,el=Math.hypot(ex,ez)||1;
   const c2={x:centre.x-ex/el*h,z:centre.z-ez/el*h},points=sampleCurve(start,c1,c2,centre);
   if(points.some(p=>!dry(p,width*.5)))continue;
   const score=len+sm.slope*110+sm.rock*14+unit(id+':candidate:'+i)*4;
   candidates.push({score,centre,n:cn,shoreMetrics:sm,points,attached,index:i});
 }
 if(!candidates.length)return{...empty,selected:true,reason:'no-connected-dry-bank'};
 candidates.sort((a,b)=>a.score-b.score||a.index-b.index);const best=candidates[0];
 const result={selected:true,reason:'connected',segments:compile(best.points,{id,width,kind:'water-access',attachRoadId:best.attached.road.id,attachAlong:best.attached.along}),turnarounds:[{id:id+':turnaround',lakeId:lakeKey,x:best.centre.x,z:best.centre.z,radius,minorRadius,angle:Math.atan2(best.n.z,best.n.x),nx:best.n.x,nz:best.n.z,kind:'muddy-turnaround',noRelief:true,edgeFade:1.3,attachRoadId:id}]};
 // Optional narrow trace stops landward of the pre-existing mudflat. Its
 // surface weight fades to zero before that cutoff; terrain remains untouched.
 if(unit(id+':wet-cutoff')<.30){
   const p=best.centre,m=get(p),travel=Math.max(0,Math.min(14,m.metres-m.width-3.2));
   const end={x:p.x-best.n.x*travel,z:p.z-best.n.z*travel};
   const points=[];for(let j=0,n=Math.max(2,Math.ceil(travel/1.3));j<=n;j++)points.push({x:p.x+(end.x-p.x)*j/n,z:p.z+(end.z-p.z)*j/n});
   if(travel>5&&points.every(q=>dry(q,.7)))result.segments.push(...compile(points,{id:id+':wet-cutoff',width:1.25,kind:'wet-cutoff',endFade:Math.min(8,travel*.8),attachRoadId:id,attachAlong:result.segments.at(-1)?.totalLength||0}));
 }
 return result;
}
