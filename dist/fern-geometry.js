import * as T from './vendor/three.module.min.js';

// Eastern-US fern morphology, in metres. Reuse geometry with instancing.
// 0/1: individual rhizomatous hay-scented fronds; 2: evergreen woodfern crown.
// NC State Extension: Dennstaedtia punctilobula / Dryopteris intermedia.
// This module owns no material, placement policy, texture, or per-frame work.
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x));
const tau=Math.PI*2;
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const rgb=s=>new T.Color(s);
const shade=(c,t)=>c.clone().multiplyScalar(t);

class MeshBuilder{
  constructor(){this.p=[];this.c=[];this.uv=[];this.flex=[];this.ix=[];this.attachments=[];}
  vertex(p,c,flex,u=0,v=0){const i=this.p.length/3;this.p.push(p.x,p.y,p.z);this.c.push(c.r,c.g,c.b);this.uv.push(u,v);this.flex.push(clamp(Math.max(0,p.y)/.75)**2);return i;}
  triangle(a,b,c){this.ix.push(a,b,c);}
  face(a,b,c,tone,flex){this.triangle(this.vertex(a,tone,flex),this.vertex(b,tone,flex),this.vertex(c,tone,flex));}
  finish(lod,variant,habit){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setAttribute('meadowFlex',new T.Float32BufferAttribute(this.flex,1));g.setIndex(this.ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.name=`meadow-fern-${lod}-${variant}`;g.userData={kind:'fern',lod,variant,habit,units:'metres',doubleSide:true,triangles:this.ix.length/3,attachmentCount:this.attachments.length,version:13};return g;}
}

// Each frond is one curved rachis. All leaf bases are evaluated on this exact
// piecewise line, including LODs: no independent branch/stem approximations.
function centerline(p,d){
  const knots=d===0?[0,.10,.24,.36,.48,.60,.72,.84,.94,1]:d===1?[0,.24,.48,.72,.94,1]:[0,.24,.60,.84,1];
  const pts=knots.map(t=>p.root.clone().addScaledVector(p.forward,p.reach*t*t).addScaledVector(p.side,p.sway*t*t*t).add(V(0,p.height*Math.sin(t*p.curl),0)));
  const at=t=>{t=clamp(t);let i=0;while(i<knots.length-2&&t>knots[i+1])i++;return pts[i].clone().lerp(pts[i+1],(t-knots[i])/(knots[i+1]-knots[i]));};
  return {knots,at,tangent:t=>at(Math.min(1,t+.001)).sub(at(Math.max(0,t-.001))).normalize()};
}

function rachis(b,path,p,d){
  const samples=path.knots;
  const rows=[],sides=d===0?3:2,stem=rgb(p.wood?'#625840':'#7c6042');
  for(const t of samples){const c=path.at(t),tangent=path.tangent(t),side=p.side.clone().addScaledVector(tangent,-p.side.dot(tangent)).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize(),radius=.0018*(1-t*.85),row=[];
    for(let j=0;j<sides;j++){const a=sides===2?j*Math.PI:j*tau/3;const point=c.clone().addScaledVector(side,Math.cos(a)*radius).addScaledVector(up,Math.sin(a)*radius);if(t===0)point.y=0;row.push(b.vertex(point,shade(stem,.78+t*.35),t*t,j/(sides-1),t));}rows.push(row);}
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<(d===0?3:1);j++){const k=(j+1)%sides;b.triangle(rows[i][j],rows[i][k],rows[i+1][k]);b.triangle(rows[i][j],rows[i+1][k],rows[i+1][j]);}
}

// A pinna's costa is a narrow continuous diamond. Every pinnule starts exactly
// on that costa. A slight fold makes each tiny leaf light differently while
// retaining negative space between the divided leaves.
function pinna(b,base,end,cross,width,tone,pinnaFlex,d,secondary){
  const axis=end.clone().sub(base),normal=new T.Vector3().crossVectors(axis,cross).normalize();
  const costaSide=cross.clone().multiplyScalar(.00058),mid=base.clone().lerp(end,.51);
  b.face(base,mid.clone().sub(costaSide),end,shade(tone,.65),pinnaFlex);
  b.face(base,end,mid.clone().add(costaSide),shade(tone,.82),pinnaFlex);
  for(let j=0;j<secondary;j++){
    const t=.095+j*(.77/secondary),at=base.clone().addScaledVector(axis,t),envelope=Math.pow(1-t,.74)*(.88+.12*Math.sin(t*Math.PI));
    for(const sign of [-1,1]){
      const a=at.clone().addScaledVector(axis,sign===1?.012:0),tip=a.clone().addScaledVector(cross,sign*width*envelope).addScaledVector(axis,.16*(1-t)).addScaledVector(normal,width*.10*Math.sin(j*1.7));
      const leafAxis=tip.clone().sub(a),edge=axis.clone().normalize().multiplyScalar(width*.34*(1-t*.6)),m=a.clone().lerp(tip,.49).addScaledVector(normal,width*.045),c=shade(tone,sign===1?1.03:.94);
      b.face(a,m.clone().sub(edge),tip,c,pinnaFlex);
      if(d===0)b.face(a,tip,m.clone().add(edge),shade(c,1.065),pinnaFlex);
      b.attachments.push([a.x,a.y,a.z]);
    }
  }
  const terminal=base.clone().lerp(end,.82),tipWidth=cross.clone().multiplyScalar(width*.17);
  b.face(terminal,end,terminal.clone().add(tipWidth),tone,pinnaFlex);
  b.face(terminal,terminal.clone().sub(tipWidth),end,shade(tone,.95),pinnaFlex);
}

function simplePinna(b,base,end,cross,width,tone,flex,d){
  // Mid woodfern and far silhouettes preserve the same spread and live fronds.
  // They never become crossed full-frond billboards.
  const m=base.clone().lerp(end,.38),w=cross.clone().multiplyScalar(width*.67);
  if(d===2){b.face(base.clone().sub(w.clone().multiplyScalar(.08)),m.clone().add(w),end,tone,flex);return;}
  b.face(base,m.clone().sub(w),end,shade(tone,.96),flex);
  b.face(base,end,m.clone().add(w),tone,flex);
}

/** Shared indexed geometry. near <=1800, mid <=400, far <=100 triangles.
 * meadowFlex pins the root and keeps leaf/costa attachment motion identical.
 * For species placement prefer variants 0/1 in clonal sweeps at meadow edges,
 * and variant 2 in moist shaded pockets. Instantiate, do not rebuild per tile.
 */
export function createFernGeometry(lod='near',variant=0,seed=0x13fe4a){
  const d=['near','mid','far'].indexOf(lod);if(d<0)throw new Error(`Unknown fern LOD: ${lod}`);
  const b=new MeshBuilder(),wood=variant%3===2,fronds=wood?4:1;
  for(let n=0;n<fronds;n++){
    const r=random(seed^Math.imul(n+1,0x692b1)),angle=(wood?n*2.399963:variant*.7)+(r()-.5)*.38,scale=wood?(n===0?1:.82+r()*.15):1;
    const p={wood,root:wood?V(Math.cos(angle)*.015,0,Math.sin(angle)*.015):V(),forward:V(Math.cos(angle),0,Math.sin(angle)),side:V(-Math.sin(angle),0,Math.cos(angle)),height:(wood?.66:.58+r()*.11)*scale,reach:(wood?.38:.21+r()*.10)*scale,curl:wood?1.94+r()*.22:1.58+r()*.18,sway:(r()-.5)*.065};
    const path=centerline(p,d);rachis(b,path,p,d);
    const pairs=wood?[12,9,5][d]:[20,15,19][d],range=.74,start=.195;
    for(let j=0;j<pairs;j++){
      const t=start+range*(j+.1)/pairs,leafFraction=(t-start)/(1-start),profile=Math.pow(1-leafFraction,.87),halfWidth=(wood?.142:.14)*(1+r()*.11)*profile*scale;
      for(const sign of [-1,1]){
        const u=t+(sign===1?.006:0),base=path.at(u),tangent=path.tangent(u),side=p.side.clone().addScaledVector(tangent,-p.side.dot(tangent)).normalize();
        const end=base.clone().addScaledVector(side,sign*halfWidth).addScaledVector(tangent,halfWidth*(.18+leafFraction*.3)).add(V(0,-halfWidth*.075,0));
        const q=r();const tone=rgb(wood?(q>.5?'#517b35':'#5c8740'):(q>.5?'#73994c':'#6a9040'));
        const flex=u*u,width=(wood?.034:.023)*(1-leafFraction*.54)*scale;
        if(d===0||(!wood&&d===1))pinna(b,base,end,tangent,width,tone,flex,d,wood?3:d===0?7:3);
        else simplePinna(b,base,end,tangent,width*(d===2?1.10:1),tone,flex,d);
        b.attachments.push([base.x,base.y,base.z]);
      }
    }
    const base=path.at(.925),tip=path.at(1),w=p.side.clone().multiplyScalar(.003*scale);
    b.face(base.clone().sub(w),base.clone().add(w),tip,rgb(wood?'#6a9141':'#7c9e50'),.96);
  }
  return b.finish(lod,variant,wood?'evergreen-woodfern-crown':'hay-scented-single-frond');
}
