// Proposal only. Coordinates and supplied lakes must share one canonical local frame.
// Example: const {routeRoadPolyline} = createLakeRoadRouter({
//   shoreDistance: pondShoreDistance, bankPoint: pondBankPoint
// });
// Descriptors returned below contain only structured-clone-safe data.
// This router protects NORMAL roads. Add intentionally wet access spurs after
// routing and label them separately for world.js surface/clearing logic.
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const hypot = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const mixPoint = (a, b, t) => ({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});

function append(out, p) {
  if (!out.length || hypot(out[out.length-1], p) > 1e-6) out.push({x:p.x,z:p.z});
}
function sampled(points, step=2) {
  const out=[]; if (!points.length) return out;
  append(out,points[0]);
  for(let i=1;i<points.length;i++) {
    const n=Math.max(1,Math.ceil(hypot(points[i-1],points[i])/step));
    for(let j=1;j<=n;j++) append(out,mixPoint(points[i-1],points[i],j/n));
  }
  return out;
}
function simplify(points, tolerance=.035) {
  if(points.length<3) return points.slice();
  const out=[points[0]];
  for(let i=1;i<points.length-1;i++) {
    const a=out[out.length-1],p=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
    const cross=l ? Math.abs((p.x-a.x)*dz-(p.z-a.z)*dx)/l : 0;
    const forward=(p.x-a.x)*(b.x-p.x)+(p.z-a.z)*(b.z-p.z);
    if(cross>tolerance || forward<0) out.push(p);
  }
  out.push(points[points.length-1]); return out;
}
function cubic(a,b,c,d,t) {
  const q=1-t;
  return {x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,
    z:q*q*q*a.z+3*q*q*t*b.z+3*q*t*t*c.z+t*t*t*d.z};
}
function convexHull(points) {
  const p=points.slice().sort((a,b)=>a.x-b.x||a.z-b.z),lower=[],upper=[];
  const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
  for(const v of p){while(lower.length>1&&cross(lower[lower.length-2],lower[lower.length-1],v)<=0)lower.pop();lower.push(v);}
  for(let i=p.length-1;i>=0;i--){const v=p[i];while(upper.length>1&&cross(upper[upper.length-2],upper[upper.length-1],v)<=0)upper.pop();upper.push(v);}
  lower.pop();upper.pop();return lower.concat(upper);
}
function rounded(points, step, radius) {
  const p=simplify(points),out=[];if(p.length<3)return sampled(p,step);
  append(out,p[0]);
  for(let i=1;i<p.length-1;i++) {
    const a=p[i-1],v=p[i],b=p[i+1],la=hypot(a,v),lb=hypot(v,b);
    if(la<1e-5||lb<1e-5)continue;
    const trim=Math.min(radius,la*.34,lb*.34),u={x:(v.x-a.x)/la,z:(v.z-a.z)/la},w={x:(b.x-v.x)/lb,z:(b.z-v.z)/lb};
    const start={x:v.x-u.x*trim,z:v.z-u.z*trim},end={x:v.x+w.x*trim,z:v.z+w.z*trim};
    // Cubic handles follow the two straight tangents. At 90 degrees this is
    // the standard quarter-circle cubic; shallow bends remain restrained.
    const handle=trim*.5522847498307936;
    const c1={x:start.x+u.x*handle,z:start.z+u.z*handle},c2={x:end.x-w.x*handle,z:end.z-w.z*handle};
    for(const q of sampled([out[out.length-1],start],step).slice(1))append(out,q);
    const n=Math.max(3,Math.ceil(trim*2/step));
    for(let j=1;j<=n;j++)append(out,cubic(start,c1,c2,end,j/n));
  }
  for(const q of sampled([out[out.length-1],p[p.length-1]],step).slice(1))append(out,q);
  return out;
}

export function createLakeRoadRouter({shoreDistance,bankPoint}) {
  if(typeof shoreDistance!=='function'||typeof bankPoint!=='function')throw Error('Lake router needs shoreDistance and bankPoint callbacks');
  // Relative rings can be reused when the same lake occurs in another local frame.
  const rings=new Map();
  const validPoint=(p,lake,limit)=>shoreDistance(p.x,p.z,lake)>=limit;
  function validEdge(a,b,lake,limit,step=2) {
    const n=Math.max(1,Math.ceil(hypot(a,b)/step));
    for(let i=0;i<=n;i++)if(!validPoint(mixPoint(a,b,i/n),lake,limit))return false;
    return true;
  }
  function ringFor(lake,target,limit) {
    const key=`${lake.lakeId??lake.lakeSeed??lake.seed}:${lake.rx}:${lake.rz}:${lake.angle}:${target}:${limit}`;
    let saved=rings.get(key);
    if(!saved) {
      const n=96,points=[];
      for(let i=0;i<n;i++) {
        let p=bankPoint(lake,i/n*TAU,target);
        // pondBankPoint makes one normal offset, not an exact distance contour.
        // Correct its distance, especially around concave bays, without touching terrain.
        for(let q=0;q<7;q++) {
          const d=shoreDistance(p.x,p.z,lake),error=target-d;
          if(Math.abs(error)<.4&&d>=limit+1)break;
          const gx=shoreDistance(p.x+.8,p.z,lake)-shoreDistance(p.x-.8,p.z,lake),
            gz=shoreDistance(p.x,p.z+.8,lake)-shoreDistance(p.x,p.z-.8,lake),len=Math.hypot(gx,gz);
          if(len<1e-7)break;
          const travel=clamp(error,-6,8);p={x:p.x+gx/len*travel,z:p.z+gz/len*travel};
        }
        points.push({x:p.x-lake.cx,z:p.z-lake.cz});
      }
      let absolute=points.map(p=>({x:p.x+lake.cx,z:p.z+lake.cz}));
      let edges=absolute.map((p,i)=>validEdge(p,absolute[(i+1)%absolute.length],lake,limit));
      if(edges.some(v=>!v)) {
        // Concave bays can fold a normal-offset loop. Its outer envelope avoids
        // impossible hairpins and crossings, like a field access route rounding
        // the outside of a wetland instead of tracing every inlet.
        const shore=[];for(let i=0;i<n;i++)shore.push(bankPoint(lake,i/n*TAU,0));
        const hull=convexHull(shore);
        for(let attempt=0;attempt<5;attempt++) {
          const cloud=[],radius=target+attempt*6;
          for(const p of hull)for(let j=0;j<24;j++)cloud.push({x:p.x+Math.cos(j/24*TAU)*radius,z:p.z+Math.sin(j/24*TAU)*radius});
          absolute=convexHull(cloud);
          edges=absolute.map((p,i)=>validEdge(p,absolute[(i+1)%absolute.length],lake,limit));
          if(edges.every(Boolean))break;
        }
      }
      saved={points:absolute.map(p=>({x:p.x-lake.cx,z:p.z-lake.cz})),edges};rings.set(key,saved);
      if(rings.size>64)rings.delete(rings.keys().next().value);
    }
    return {points:saved.points.map(p=>({x:p.x+lake.cx,z:p.z+lake.cz})),edges:saved.edges};
  }
  function detour(a,b,lake,target,limit) {
    const ring=ringFor(lake,target,limit),p=ring.points,n=p.length;
    // Visibility-graph connectors plus adjacent shoreline-offset nodes. Only
    // the winning partial arc is emitted; the ring is an internal search aid.
    const da=new Float64Array(n),prev=new Int16Array(n),done=new Uint8Array(n),endOK=new Uint8Array(n);
    da.fill(Infinity);prev.fill(-1);
    const starts=p.map((v,i)=>({i,d:hypot(a,v)})).sort((u,v)=>u.d-v.d);
    const ends=p.map((v,i)=>({i,d:hypot(b,v)})).sort((u,v)=>u.d-v.d);
    let found=0;
    for(const {i,d} of starts)if(validEdge(a,p[i],lake,limit)){da[i]=d;if(++found===8)break;}
    found=0;
    for(const {i} of ends)if(validEdge(p[i],b,lake,limit)){endOK[i]=1;if(++found===8)break;}
    let winner=-1,best=Infinity;
    for(let loop=0;loop<n;loop++) {
      let u=-1,nearest=Infinity;
      for(let i=0;i<n;i++)if(!done[i]&&da[i]<nearest){nearest=da[i];u=i;}
      if(u<0||nearest>=best)break;done[u]=1;
      if(endOK[u]&&nearest+hypot(p[u],b)<best){winner=u;best=nearest+hypot(p[u],b);}
      for(const v of [(u+n-1)%n,(u+1)%n]) {
        const edge=v===(u+1)%n?u:v;
        if(!ring.edges[edge]||done[v])continue;
        const cost=nearest+hypot(p[u],p[v]);
        if(cost<da[v]){da[v]=cost;prev[v]=u;}
      }
    }
    if(winner<0)return null;
    const path=[];for(let v=winner;v>=0;v=prev[v])path.push(p[v]);path.reverse();
    return [a,...path,b];
  }
  function bypass(points,lake,target,limit) {
    const p=sampled(points,3),bad=p.map(v=>!validPoint(v,lake,limit+2));
    if(!bad.some(Boolean))return {points,changed:false};
    const intervals=[];
    for(let i=0;i<p.length;i++) {
      if(!bad[i])continue;
      let end=i;while(end+1<p.length&&bad[end+1])end++;
      let ai=Math.max(0,i-7),bi=Math.min(p.length-1,end+7);
      while(ai>0&&!validPoint(p[ai],lake,limit))ai--;
      while(bi<p.length-1&&!validPoint(p[bi],lake,limit))bi++;
      const previous=intervals[intervals.length-1];
      if(previous&&ai<=previous.bi)previous.bi=Math.max(previous.bi,bi);else intervals.push({ai,bi});
      i=end;
    }
    const out=[],parts=[];let changed=false,blocked=false,cursor=0;
    for(const {ai,bi} of intervals) {
      // Look back/ahead ~18 m to leave room for a tangential cubic transition.
      for(;cursor<=ai;cursor++)if(validPoint(p[cursor],lake,limit))append(out,p[cursor]);
      const route=validPoint(p[ai],lake,limit)&&validPoint(p[bi],lake,limit)
        ?detour(p[ai],p[bi],lake,target,limit):null;
      if(route){for(const q of route)append(out,q);changed=true;}
      else {
        // An endpoint inside water or an impossible corridor is a real break.
        // Never connect across it, shift the lake, or create an unsafe chord.
        if(out.length>1)parts.push(out.splice(0));else out.length=0;
        if(validPoint(p[bi],lake,limit))append(out,p[bi]);blocked=true;
      }
      cursor=bi+1;
    }
    for(;cursor<p.length;cursor++)append(out,p[cursor]);
    if(out.length>1)parts.push(out);
    return {points:parts.length===1?parts[0]:null,parts,changed,blocked};
  }
  function routeRoadPolyline(points,lakes=[],options={}) {
    const {id='road',width=4,kind='field',step=2,turnRadius=12,setback=22}=options;
    // 1.5 m validation cushion is added outside the physical road half-width.
    const limit=setback+width*.5+1.5,target=Math.max(limit+3,30+width*.5);
    let paths=[points.map(p=>({x:p.x,z:p.z}))],detours=0,blocked=0;
    const ordered=[...lakes].sort((a,b)=>String(a.lakeId??a.lakeSeed).localeCompare(String(b.lakeId??b.lakeSeed)));
    // A later lake can push a route toward an earlier one. Bounded passes avoid
    // recursion; a final safety split handles the rare unsatisfied cluster.
    for(let pass=0;pass<2;pass++)for(const lake of ordered) {
      const next=[];
      for(const path of paths) {
        const result=bypass(path,lake,target,limit);
        if(result.changed)detours++;if(result.blocked)blocked++;
        if(result.points)next.push(result.points);else next.push(...(result.parts||[]));
      }
      paths=next;
    }
    const safePaths=[];
    for(const path of paths) {
      const candidate=rounded(path,step,turnRadius);
      // Use smooth output only if its swept road corridor remains clear.
      const safe=candidate.every((p,i)=>ordered.every(l=>validPoint(p,l,limit)
        &&(!i||validEdge(candidate[i-1],p,l,limit,1))));
      const chosen=safe?candidate:sampled(path,step);let run=[];
      for(let i=0;i<chosen.length;i++) {
        const p=chosen[i],ok=ordered.every(l=>validPoint(p,l,limit)
          &&(!run.length||validEdge(run[run.length-1],p,l,limit,1)));
        if(ok)append(run,p);else{if(run.length>1)safePaths.push(run);run=[];blocked++;}
      }
      if(run.length>1)safePaths.push(run);
    }
    const segments=[],polylines=[];let along=0;
    for(let part=0;part<safePaths.length;part++) {
      const p=safePaths[part],road={id,part,width,kind,points:p};polylines.push(road);
      for(let i=1;i<p.length;i++) {
        const a=p[i-1],b=p[i],length=hypot(a,b);if(length<1e-6)continue;
        segments.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,length,along,id,part,width,kind});along+=length;
      }
    }
    return {polylines,segments,detours,blocked};
  }
  return {routeRoadPolyline,clearCache:()=>rings.clear()};
}

// Standalone alternative when a factory is inconvenient. Prefer a retained
// factory for macro generation so the internal relative-lake contour cache helps.
export function routeRoadPolyline(points,lakes,options) {
  return createLakeRoadRouter(options).routeRoadPolyline(points,lakes,options);
}

// Expand only by the maximum distance consumers need. Outside that radius the
// road sample is deliberately saturated, as the current ground texture already is.
export function buildRoadBuckets(segments,{cellSize=16,padding=20}={}) {
  const buckets={};
  for(let i=0;i<segments.length;i++) {
    const s=segments[i],x1=Math.floor((Math.min(s.x1,s.x2)-padding)/cellSize),x2=Math.floor((Math.max(s.x1,s.x2)+padding)/cellSize),
      z1=Math.floor((Math.min(s.z1,s.z2)-padding)/cellSize),z2=Math.floor((Math.max(s.z1,s.z2)+padding)/cellSize);
    for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)(buckets[`${x},${z}`]??=[]).push(i);
  }
  return {segments,buckets,cellSize,padding};
}

export function sampleRoadBuckets(x,z,context,out={}) {
  out.distance=out.second=1e4;out.width=out.width2=4;out.roadAlong=out.roadAlong2=0;
  out.nx=1;out.nz=0;out.nx2=0;out.nz2=1;out.roadId=out.roadId2=null;
  out.kind=out.kind2=null;
  const indices=context.buckets[`${Math.floor(x/context.cellSize)},${Math.floor(z/context.cellSize)}`]||[];
  // Two passes keep the second result on a genuinely different road. Adjacent
  // tessellation pieces of one curve must never manufacture a junction mask.
  for(let pass=0;pass<2;pass++)for(const i of indices) {
    const s=context.segments[i];if(pass&&s.id===out.roadId)continue;
    const dx=s.x2-s.x1,dz=s.z2-s.z1,t=clamp(((x-s.x1)*dx+(z-s.z1)*dz)/(s.length*s.length),0,1),
      d=Math.hypot(x-s.x1-t*dx,z-s.z1-t*dz),suffix=pass?'2':'';
    const key=pass?'second':'distance';if(d>=out[key])continue;
    out[key]=d;out['width'+suffix]=s.width;out['roadAlong'+suffix]=s.along+t*s.length;
    out['nx'+suffix]=-dz/s.length;out['nz'+suffix]=dx/s.length;out['roadId'+suffix]=s.id;
    out['kind'+suffix]=s.kind;
  }
  return out;
}
