import * as T from './vendor/three.module.min.js';

const UP=new T.Vector3(0,1,0), X=new T.Vector3(1,0,0), TAU=Math.PI*2, EPS=1e-8;
const key=p=>[p.x,p.y,p.z].map(x=>Math.round(x*1e7)).join(',');

/** Build-time, per-plant wood only. All output goes into the caller's one
 * material batch. Original nodes/chords are retained; there is no RNG here.
 * Each continuation has one shared ring at every bend, transported without
 * axis-threshold flips. Fork roots are closed and embedded in their parent.
 */
export class JoinedWood {
 constructor(triangle){this.triangle=triangle;this.paths=[];}
 add(points,radii,sides,tints,rough=0,phase=0){
  if(points.length<2||points[0].distanceToSquared(points.at(-1))<EPS*EPS||radii[0]<.0005)return;
  this.paths.push({points:points.map(p=>p.clone()),radii:[...radii],sides,tints,rough,phase});
 }
 finish(audit){
  const paths=this.paths,ends=new Map(),next=new Map(),previous=new Map();
  // Prefer the largest compatible continuation at a shared endpoint. Side
  // branches remain separate closed tubes overlapping the parent interior.
  paths.forEach((p,i)=>{const k=key(p.points.at(-1));if(!ends.has(k))ends.set(k,[]);ends.get(k).push(i)});
  const candidates=[];
  paths.forEach((p,j)=>{for(const i of ends.get(key(p.points[0]))||[]){
   if(i>=j)continue;const parent=paths[i],ratio=p.radii[0]/parent.radii.at(-1);
   if(ratio<.55||ratio>1.85)continue;
   const incoming=parent.points.at(-1).clone().sub(parent.points.at(-2)).normalize(),outgoing=p.points[1].clone().sub(p.points[0]).normalize();
   // Reversing/drooping shoots form an overlapping fork, never a folded tube.
   if(incoming.dot(outgoing)<-.50)continue;
   candidates.push({i,j,score:Math.abs(Math.log(ratio))+(1-incoming.dot(outgoing))*.1});
  }});
  candidates.sort((a,b)=>a.score-b.score||a.j-b.j);
  for(const {i,j}of candidates)if(!next.has(i)&&!previous.has(j)){next.set(i,j);previous.set(j,i);}
  const point=new T.Vector3(),delta=new T.Vector3();
  function closest(p,path){
   let best=null;
   for(let k=0;k<path.points.length-1;k++){
    const a=path.points[k],b=path.points[k+1];delta.subVectors(b,a);const len=delta.lengthSq();if(len<EPS*EPS)continue;
    const t=T.MathUtils.clamp(point.subVectors(p,a).dot(delta)/len,0,1),q=a.clone().addScaledVector(delta,t),distance=q.distanceTo(p),radius=T.MathUtils.lerp(path.radii[k],path.radii[k+1],t);
    if(!best||distance<best.distance)best={q,distance,radius};
   }return best;
  }
  let tubes=0,joins=0,attachments=0,bridges=0;
  paths.forEach((source,start)=>{
   if(previous.has(start))return;
   const points=source.points.map(p=>p.clone()),radii=[...source.radii],segments=source.tints.map(t=>({t,sides:source.sides}));
   let sides=source.sides,last=start;
   while(next.has(last)){
    last=next.get(last);const p=paths[last];radii[radii.length-1]=Math.max(radii.at(-1),p.radii[0]);
    points.push(...p.points.slice(1).map(p=>p.clone()));radii.push(...p.radii.slice(1));segments.push(...p.tints.map(t=>({t,sides:p.sides})));sides=Math.max(sides,p.sides);joins++;
   }
   // Parent anchors were authored on the original straight limb chords. The
   // visible limb bends away from that chord, so bridge to its actual wood
   // rather than moving the anchor (which also owns the foliage transform).
   let parent=null,parentScore=Infinity;
   for(let i=0;i<start;i++){
    const p=paths[i],a=p.points[0],b=p.points.at(-1);delta.subVectors(b,a);const length=delta.lengthSq();if(length<EPS*EPS)continue;
    const t=T.MathUtils.clamp(point.subVectors(points[0],a).dot(delta)/length,0,1),chordPoint=a.clone().addScaledVector(delta,t),chordDistance=chordPoint.distanceTo(points[0]);
    const hit=closest(points[0],p);if(!hit)continue;
    const exact=chordDistance<1e-6||hit.distance<1e-6;
    // Off-axis roots on conifer leaders are only millimetres away. Do not
    // connect separate ground shoots or unrelated neighbouring branches.
    if(!exact&&(points[0].y<=.025||hit.distance>hit.radius*.95))continue;
    if(hit.radius<radii[0]*.28)continue;
    const score=chordDistance+hit.distance*.08;
    if(score<parentScore){parent={...hit,path:i};parentScore=score;}
   }
   if(parent){
    attachments++;
    // Roots already inside the parent's inscribed cross-section need no
    // extra geometry. Avoid tiny reversed connector segments inside a trunk.
    if(parent.distance>parent.radius*.65){
     const direction=points[1].clone().sub(points[0]),length=direction.length();direction.divideScalar(length);
     const tip=points[0].clone().addScaledVector(direction,Math.min(length*.22,radii[0]*1.5)),radius=Math.min(radii[0]*.75,parent.radius*.6);
     // The short collar is a separate closed tube embedded in both solids.
     // A parent may be above a shoot's chord anchor: appending that connector
     // to the shoot polyline would create a reversing, self-folded elbow.
     this.emit([parent.q,tip],[radius,radius],Math.min(sides,5),[segments[0]],source.rough,source.phase,audit);bridges++;tubes++;
    }
   }
   this.emit(points,radii,sides,segments,source.rough,source.phase,audit);tubes++;
  });
  const stats={paths:paths.length,tubes,joins,attachments,bridges};if(audit)audit.stats=stats;this.paths=[];return stats;
 }
 emit(points,radii,sides,segments,rough,phase,audit){
  const tangents=points.map((p,i)=>{
   if(!i)return points[1].clone().sub(p).normalize();
   if(i===points.length-1)return p.clone().sub(points[i-1]).normalize();
   const a=p.clone().sub(points[i-1]).normalize(),b=points[i+1].clone().sub(p).normalize(),sum=a.add(b);
   return sum.lengthSq()>EPS?sum.normalize():b;
  });
  const rings=[],q=new T.Quaternion();let side=new T.Vector3().crossVectors(tangents[0],Math.abs(tangents[0].y)>.9?X:UP).normalize();
  for(let j=0;j<points.length;j++){
   const tangent=tangents[j];if(j){q.setFromUnitVectors(tangents[j-1],tangent);side.applyQuaternion(q);side.addScaledVector(tangent,-side.dot(tangent)).normalize();}
   const front=new T.Vector3().crossVectors(tangent,side).normalize(),ring=[];
   for(let i=0;i<sides;i++){
    const angle=i/sides*TAU,variation=1+Math.sin(i*7.2+phase)*rough;
    ring.push(points[j].clone().addScaledVector(side,Math.cos(angle)*radii[j]*variation).addScaledVector(front,Math.sin(angle)*radii[j]*variation));
   }rings.push(ring);
  }
  const tri=this.triangle;
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){
   const k=(i+1)%sides,a=rings[j][i],b=rings[j][k],c=rings[j+1][i],d=rings[j+1][k],segment=segments[j],tint=segment.t[Math.min(segment.sides-1,Math.floor(i/sides*segment.sides))];
   if(radii[j]>EPS)tri(a,b,c,tint);if(radii[j+1]>EPS)tri(b,d,c,tint);
  }
  for(let i=0;i<sides;i++){
   const k=(i+1)%sides;
   if(radii[0]>EPS)tri(points[0],rings[0][k],rings[0][i],segments[0].t[0]);
   if(radii.at(-1)>EPS)tri(points.at(-1),rings.at(-1)[i],rings.at(-1)[k],segments.at(-1).t[0]);
  }
  if(audit)(audit.tubes??=[]).push({points:points.map(p=>p.toArray()),radii:[...radii],sides,rings:rings.map(r=>r.map(p=>p.toArray()))});
 }
}
