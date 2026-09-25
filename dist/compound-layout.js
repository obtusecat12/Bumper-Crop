// Shared pure visual grammar. Coordinates are metres in plan-local space;
// +Z faces the approach road. No terrain, renderer, or topology dependency.
export function compoundComponents(plan = {}) {
  const handed = plan.handed < 0 ? -1 : 1;
  const parts = [];
  const building = (id, kind, x, z, width, depth, height, angle, variant) =>
    parts.push({id,kind,x,z,width,depth,height,angle,variant,roofOverhang:.75,
      hx:width/2+.75,hz:depth/2+.75,ground:true});
  const circle = (id,kind,x,z,r,height) => parts.push({id,kind,x,z,r,height,angle:0,ground:true});
  const fence = (id,x,z,width,angle=0) => parts.push({id,kind:'fence',x,z,width,depth:.16,height:1.15,angle,hx:width/2,hz:.18});
  if (plan.kind === 'hamlet') {
    building('barn-left','barn',-20,-7,15,25,5.4,Math.PI/2,2);
    building('barn-right','barn',20,-7,15,25,5.4,-Math.PI/2,3);
    building('shed-rear','shed',0,-26,22,7,3.45,0,5);
    building('shed-left','shed',-22,17,15,7,3.3,Math.PI,5);
    building('shed-right','shed',22,17,15,7,3.3,Math.PI,5);
    circle('silo','silo',-25,3.15,2.85,11.8);
    circle('windmill','windmill',0,11,2.15,10.8);
    building('trough','trough',4.8,10,3.7,1.35,.72,0,0);
    fence('fence-rear',0,-34,68);
    fence('fence-left',-34,-28,12,Math.PI/2);
    fence('fence-right',34,-28,12,Math.PI/2);
    for(let i=0;i<7;i++)parts.push({id:`tree-${i}`,kind:'tree',x:-27+i*9,z:-40+(i%2)*.9,
      r:3,height:9+(i%3)*.8,crownWidth:6,variant:i%3,angle:i*2.399});
  } else {
    building('barn','barn',0,0,15,25,5.4,0,plan.barnVariant??2);
    circle('silo','silo',-10.15,-6,2.85,11.8);
    building('shed-side','shed',17,4,17,7,3.45,-Math.PI/2,5);
    building('shed-rear','shed',8,-22,25,7,3.4,0,5);
    building('outhouse','outhouse',-20,-19,2.8,3.2,2.7,0,1);
    if(plan.uShape)building('shed-left','shed',-20,4,15,6,3.35,Math.PI/2,5);
    fence('fence-rear',0,-32,52);
    fence('fence-left',-26,-25,14,Math.PI/2);
    fence('fence-right',26,-25,14,Math.PI/2);
    for(let i=0;i<7;i++)parts.push({id:`tree-${i}`,kind:'tree',x:-24+i*8,z:-39+(i%2)*.8,
      r:3,height:8.4+(i%3)*.8,crownWidth:6,variant:i%3,angle:i*2.399});
  }
  return parts.map(p=>({...p,x:p.x*handed,angle:p.angle*handed,seed:hash(`${plan.seed||0}:${p.id}`)}));
}
export function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;}
export function componentDistance(x,z,p){
  const dx=x-p.x,dz=z-p.z;
  if(p.r!==undefined)return Math.hypot(dx,dz)-p.r;
  const c=Math.cos(p.angle||0),s=Math.sin(p.angle||0),a=Math.abs(c*dx-s*dz)-(p.hx??p.width/2),b=Math.abs(s*dx+c*dz)-(p.hz??p.depth/2);
  return Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0);
}
export function componentBounds(p,pad=0){
  const c=Math.abs(Math.cos(p.angle||0)),s=Math.abs(Math.sin(p.angle||0));
  const hx=p.r??(c*p.hx+s*p.hz),hz=p.r??(s*p.hx+c*p.hz);
  return [p.x-hx-pad,p.x+hx+pad,p.z-hz-pad,p.z+hz+pad];
}
