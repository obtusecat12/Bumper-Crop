import * as T from './vendor/three.module.min.js';

// Small, shared, metre-scale meshes. No textures, material, placement or wind
// shader is owned here. Reuse one returned asset collection across all tiles.
// Use white MeshStandardMaterial({ vertexColors:true, side:T.DoubleSide }).
// Colors are linear RGB (T.Color converts the authored sRGB palette).
const TAU = Math.PI * 2;
const LODS = ['near', 'mid', 'far'];
const V = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
function rng(seed) {
  let a=seed>>>0;
  return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}
const palette = {
  turf:['#687f45','#71834c','#7b8b52','#5e794b'],
  tall:['#72865c','#788956','#688166','#819064'],
  dry:['#a8996a','#9b895f','#ad9e77'],
  fern:['#6e8650','#789459','#658047','#71884e'],
  stem:'#81794d', seed:'#c0b18d', white:'#e8e6d8', disk:'#c49b3e', green:'#687e47'
};
const color = hex => new T.Color(hex);
const tint = (c,f) => c.clone().multiplyScalar(f);
const mix = (a,b,t) => a.clone().lerp(b,t);
// All attachment positions follow the same piecewise centreline as their stem
// mesh. This avoids submillimetre floating leaves on a simplified curved tube.
function connectedPath(curve,segments,knots=null){
  const pts=Array.from({length:segments+1},(_,i)=>curve(knots?knots[i]:i/segments));
  return t=>{const s=clamp(t)*segments,i=Math.min(segments-1,Math.floor(s));return pts[i].clone().lerp(pts[i+1],s-i);};
}

class Builder {
  constructor(){this.p=[];this.c=[];this.uv=[];this.flex=[];this.index=[];}
  vertex(p,c,u=0,v=0,flex=0){
    const i=this.p.length/3;
    this.p.push(p.x,Math.max(0,p.y),p.z);
    this.c.push(c.r,c.g,c.b);this.uv.push(u,v);this.flex.push(clamp(flex));
    return i;
  }
  tri(a,b,c){this.index.push(a,b,c);}
  face(a,b,c,tone,flex=0){
    this.tri(this.vertex(a,tone,0,0,flex),this.vertex(b,tone,1,0,flex),this.vertex(c,tone,.5,1,flex));
  }
  finish(name,info){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
    g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));
    g.setAttribute('meadowFlex',new T.Float32BufferAttribute(this.flex,1));
    g.setIndex(this.index);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
    g.name=name;g.userData={...info,triangles:this.index.length/3,units:'metres',doubleSide:true};
    return g;
  }
}

// Each blade has a bent centreline, tapered width, changing roll, and (near)
// a shallow V-fold. Indexed rows give a continuous surface and a true point tip.
function blade(b,{base,angle,height,reach,width,curl=1.55,twist=.3,sway=0,tone,dry=false},segments,folded){
  const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx;
  const rows=[],tipColor=dry?tint(tone,1.12):mix(tone,color('#aaa06d'),.18);
  for(let j=0;j<segments;j++){
    const t=j/segments,tt=t*t;
    const center=base.clone().add(V(dx*reach*tt+sx*sway*tt*t,height*Math.sin(t*curl),dz*reach*tt+sz*sway*tt*t));
    const roll=angle+twist*t,side=V(-Math.sin(roll),0,Math.cos(roll));
    const w=width*.5*(.83+.28*Math.sin(t*Math.PI))*Math.pow(1-t,.65);
    const col=mix(tint(tone,.72),tipColor,Math.pow(t,.6));
    const l=b.vertex(center.clone().addScaledVector(side,-w),tint(col,.94),0,t,t*t);
    const r=b.vertex(center.clone().addScaledVector(side,w),col,1,t,t*t);
    if(folded){
      const ridge=center.clone().add(V(dx*w*.33,Math.sin(Math.PI*t)*w*.14,dz*w*.33));
      rows.push([l,b.vertex(ridge,tint(col,1.05),.5,t,t*t),r]);
    }else rows.push([l,r]);
  }
  const tip=base.clone().add(V(dx*reach+sx*sway,height*Math.sin(curl),dz*reach+sz*sway));
  const tipIndex=b.vertex(tip,tipColor,.5,1,1);
  for(let j=0;j<rows.length-1;j++){
    const a=rows[j],c=rows[j+1];
    for(let k=0;k<a.length-1;k++){b.tri(a[k],a[k+1],c[k+1]);b.tri(a[k],c[k+1],c[k]);}
  }
  const last=rows[rows.length-1];
  for(let k=0;k<last.length-1;k++)b.tri(last[k],last[k+1],tipIndex);
}

// A genuinely connected, bent stem. Near stems have a triangular cross-section;
// slender distant stems use a continuous narrow ribbon, never a foliage card.
function stem(b,at,radius,tone,segments=3,tubular=true,maxHeight=1){
  const rows=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=at(t),tangent=at(Math.min(1,t+.001)).sub(at(Math.max(0,t-.001))).normalize();
    const ref=Math.abs(tangent.y)<.85?V(0,1,0):V(1,0,0);
    const u=new T.Vector3().crossVectors(tangent,ref).normalize();
    const v=new T.Vector3().crossVectors(tangent,u).normalize();
    const rad=radius*(1-t*.66),row=[],sides=tubular?3:2;
    for(let k=0;k<sides;k++){
      const a=tubular?k*TAU/3:(k?0:Math.PI);
      const point=p.clone().addScaledVector(u,Math.cos(a)*rad).addScaledVector(v,Math.sin(a)*rad);
      row.push(b.vertex(point,tint(tone,.82+.18*t),k/(sides-1),t,clamp(p.y/maxHeight)**2));
    }
    rows.push(row);
  }
  for(let i=0;i<segments;i++)for(let k=0;k<(tubular?3:1);k++){
    const n=(k+1)%rows[i].length,a=rows[i][k],c=rows[i][n],d=rows[i+1][n],e=rows[i+1][k];
    b.tri(a,c,d);b.tri(a,d,e);
  }
}

// Slim leaf/seed ribbon with a pointed end; width is its full width in metres.
function lance(b,a,z,width,tone,fold=false,flex=.7){
  const axis=z.clone().sub(a),ref=Math.abs(axis.y)>axis.length()*.9?V(1,0,0):V(0,1,0);
  const side=new T.Vector3().crossVectors(axis,ref).normalize().multiplyScalar(width*.5);
  const mid=a.clone().lerp(z,.47),rise=new T.Vector3().crossVectors(side,axis).normalize().multiplyScalar(width*.11);
  const av=b.vertex(a,tint(tone,.85),.5,0,flex),lv=b.vertex(mid.clone().sub(side),tone,0,.47,flex);
  const zv=b.vertex(z,tint(tone,1.05),.5,1,flex),rv=b.vertex(mid.clone().add(side),tone,1,.47,flex);
  if(fold){
    const mv=b.vertex(mid.clone().add(rise),tint(tone,1.08),.5,.47,flex);
    b.tri(av,lv,mv);b.tri(lv,zv,mv);b.tri(av,mv,rv);b.tri(mv,zv,rv);
  }else{b.tri(av,lv,zv);b.tri(av,zv,rv);}
}

function bladeParams(seed,kind){
  const r=rng(seed),isShort=kind==='shortgrass',isSeed=kind==='seedgrass';
  const count=isShort?14:isSeed?4:14,spread=isShort?.08:.062;
  const gesture=r()*TAU,centers=Array.from({length:3},()=>V((r()-.5)*spread,0,(r()-.5)*spread));
  return Array.from({length:count},(_,i)=>{
    const angle=r()*TAU,base=centers[i%centers.length].clone().add(V((r()-.5)*spread*.3,0,(r()-.5)*spread*.3));
    const dry=r()<(isSeed?.42:.14),colors=dry?palette.dry:isShort?palette.turf:palette.tall;
    const h=isShort?.11+r()*.18:isSeed?.29+r()*.22:.34+r()*.49;
    return {base,angle:angle+Math.sin(gesture-angle)*.38,height:h,
      reach:h*(isShort?.25+r()*.56:.24+r()*.46),width:isShort?.0038+r()*.0026:.0065+r()*.005,
      curl:1.25+r()*.80,twist:(r()-.5)*1.2,sway:(r()-.5)*h*.20,
      tone:color(colors[Math.floor(r()*colors.length)]),dry};
  });
}

function grassGeometry(kind,lod,variant,seed){
  const b=new Builder(),detail=LODS.indexOf(lod),r=rng(seed^0x94ae8f);
  const params=bladeParams(seed,kind).sort((a,z)=>z.height-a.height),count=kind==='shortgrass'?[10,9,6][detail]:[14,9,6][detail];
  for(let i=0;i<count;i++)blade(b,params[i],kind==='shortgrass'?[3,3,2][detail]:[4,3,2][detail],detail===0);
  if(kind==='tallgrass'){
    // Sparse bare culms and attached high leaves break the basal fountain.
    const culms=detail===0?2:1;
    for(let i=0;i<culms;i++){
      const a=r()*TAU,h=(i===0?.89:.71)+r()*.08,lean=.035+r()*.075,root=V((r()-.5)*.055,0,(r()-.5)*.055);
      const at=connectedPath(t=>root.clone().add(V(Math.cos(a)*lean*t*t,h*t,Math.sin(a)*lean*t*t)),2);
      stem(b,at,.00125,color(palette.stem),detail===0?2:2,detail===0,h);
      if(detail===0)blade(b,{base:at(.43),angle:a+1.4,height:.18,reach:.16,width:.007,curl:2.0,twist:.5,tone:color(palette.tall[i])},3,false);
    }
  }
  return b.finish(`meadow-${kind}-${lod}-${variant}`,{kind,lod,variant});
}

function seedGrassGeometry(lod,variant,seed){
  const b=new Builder(),d=LODS.indexOf(lod),r=rng(seed^0x97a2),leaves=bladeParams(seed,'seedgrass');
  for(let i=0;i<[4,3,2][d];i++)blade(b,leaves[i],[4,3,2][d],d===0);
  const culmCount=[3,2,1][d],branchIndices=[[0,1,2,3,4],[0,2,3,4],[0,3,4]][d];
  const airy=variant%3===1; // Switchgrass-like open panicle; other variants compact broomsedge sprays.
  for(let n=0;n<culmCount;n++){
    // Separate RNG per culm preserves the same stems when changing LOD.
    const q=rng(seed^Math.imul(n+1,0x517cc1b7)),angle=q()*TAU,h=(n===0?.99:.76)+q()*(n===0?.07:.20),lean=.065+q()*.10;
    const root=V((q()-.5)*.06,0,(q()-.5)*.06),dx=Math.cos(angle),dz=Math.sin(angle);
    const at=connectedPath(t=>root.clone().add(V(dx*lean*t*t,h*t,dz*lean*t*t)),d===0?3:2);
    const stemTone=color(n===1?palette.dry[1]:palette.stem);
    stem(b,at,.0013,stemTone,[3,2,2][d],d===0,h);
    for(const j of branchIndices){
      const s=rng(seed^Math.imul(n+1,0x641cab)^Math.imul(j+1,0x19831));
      const t=.62+(j+.4)/5*.30,a=at(t),phi=j*2.39996+angle;
      const reach=(airy?.10:.050)*(1-(t-.62)*1.4)*( .82+s()*.35 );
      const tip=a.clone().add(V(Math.cos(phi)*reach,.055+s()*.075,Math.sin(phi)*reach));
      const branchAt=u=>a.clone().lerp(tip,u);
      // One fine connected branch and two narrow spikelets; all surfaces are
      // millimetres wide. Tawny shoulders and pale awns provide fluffy texture.
      stem(b,branchAt,.00065,stemTone,1,false,h);
      const tip2=branchAt(1),seedEnd=tip2.clone().add(V(dx*.006,.016+s()*.010,dz*.006));
      lance(b,tip2,seedEnd,airy?.0025:.0040,color(palette.seed),false,.95);
      if(d===0){
        const a2=branchAt(.54),end2=a2.clone().add(V(Math.cos(phi+.9)*reach*.43,.031,Math.sin(phi+.9)*reach*.43));
        stem(b,u=>a2.clone().lerp(end2,u),.0004,stemTone,1,false,h);
        lance(b,end2,end2.clone().add(V(dx*.003,.014,dz*.003)),.003,color('#b7a885'),false,.94);
      }
      if(d<2){
        const hair=seedEnd.clone().add(V(Math.cos(phi+.6)*.012,.019,Math.sin(phi+.6)*.012));
        const side=V(-Math.sin(phi)*.0007,0,Math.cos(phi)*.0007);
        b.face(seedEnd.clone().sub(side),seedEnd.clone().add(side),hair,color('#d4c9ae'),.98);
      }
    }
  }
  return b.finish(`meadow-seedgrass-${lod}-${variant}`,{kind:'seedgrass',lod,variant,habit:airy?'open-panicle':'broomsedge-spray'});
}

// A small cut pinna: a central taper plus attached lateral lobes. The spaces
// between the pinnae remain empty geometry, rather than a whole-frond plane.
function pinna(b,a,tip,side,width,tone,detail,flex){
  const delta=tip.clone().sub(a),middle=a.clone().lerp(tip,.38),rootW=side.clone().multiplyScalar(width*.13);
  if(detail===2){const s=side.clone().multiplyScalar(width*.30);b.face(a.clone().sub(s),a.clone().add(s),tip,tone,flex);return;}
  if(detail===1){
    const s=side.clone().multiplyScalar(width*.48),m=a.clone().lerp(tip,.38);
    b.face(a,m.clone().sub(s),tip,tone,flex);b.face(a,tip,m.clone().add(s),tint(tone,1.05),flex);return;
  }
  const waist=side.clone().multiplyScalar(width*.50);
  b.face(a.clone().sub(rootW),a.clone().add(rootW),tip,tone,flex);
  for(let sign of [-1,1]){
    const start=a.clone().addScaledVector(delta,.10),end=a.clone().addScaledVector(delta,.86);
    const tooth=middle.clone().addScaledVector(waist,sign).addScaledVector(delta,.04*sign);
    b.face(start,tooth,end,tint(tone,sign===1?1.05:.94),flex);
  }
}

function fernGeometry(lod,variant,seed){
  const b=new Builder(),d=LODS.indexOf(lod),frondCount=[3,3,2][d],pairCount=[9,6,4][d];
  for(let n=0;n<frondCount;n++){
    const r=rng(seed^Math.imul(n+1,0x692b1)),a=n*2.39996+(r()-.5)*.65,dx=Math.cos(a),dz=Math.sin(a);
    const reach=.23+r()*.16,rise=(n===0?.43:.29)+r()*(n===0?.05:.13),root=V((r()-.5)*.08,0,(r()-.5)*.08),side=V(-dz,0,dx);
    const at=connectedPath(t=>root.clone().add(V(dx*reach*t*t,rise*Math.sin(t*1.85),dz*reach*t*t)),d===0?3:2,d===0?[0,.35,.80,1]:[0,.80,1]);
    stem(b,at,.00145,color('#80774b'),d===0?3:2,d===0,rise);
    for(let j=0;j<pairCount;j++){
      // Bare lower quarter is the stipe; widest pinnae are low on the frond.
      const t=.26+j*(.65/pairCount),width=(.065+r()*.014)*Math.pow(1-(t-.22)/.8,.78);
      for(const sign of [-1,1]){
        const base=at(t+(sign===1?.009:0)),advance=.026*(1-t),tip=base.clone().addScaledVector(side,sign*width).add(V(dx*advance,-.011+width*.2,dz*advance));
        const tone=color(palette.fern[(n+j+(sign===1?1:0))%palette.fern.length]);
        // Pinnae have their own upward cant and varying pinnae spacing.
        const pinnaSide=at(Math.min(1,t+.01)).sub(at(Math.max(0,t-.01))).normalize();
        pinna(b,base,tip,pinnaSide,(.016+r()*.005)*(1-t*.45),tone,d,clamp(base.y/rise)**2);
      }
    }
    const end=at(1),base=at(.89),s=side.clone().multiplyScalar(.0035);
    b.face(base.clone().sub(s),base.clone().add(s),end,color(palette.fern[n]),1);
  }
  return b.finish(`meadow-fern-${lod}-${variant}`,{kind:'fern',lod,variant,habit:'hay-scented-fern-inspired'});
}

function flowerHead(b,center,radius,rays,d,toneTilt=0){
  const up=V(Math.sin(toneTilt)*.20,1,Math.cos(toneTilt)*.15).normalize();
  const u=new T.Vector3().crossVectors(up,V(0,0,1)).normalize(),v=new T.Vector3().crossVectors(up,u).normalize();
  const pt=(a,r,h=0)=>center.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r).addScaledVector(up,h);
  const white=color(palette.white),yellow=color(palette.disk),core=radius*.26;
  for(let i=0;i<rays;i++){
    const a=i*TAU/rays,reach=radius*(.91+.09*Math.sin(i*8.13)),w=d===2?.17:.11;
    const root=pt(a,core*.88),tip=pt(a,reach,-radius*.11),left=pt(a-w,radius*.65,radius*.025),right=pt(a+w,radius*.65,radius*.025);
    if(d===0){b.face(root,left,tip,tint(white,.94),1);b.face(root,tip,right,white,1);}
    else b.face(pt(a-w*2,core*.88),tip,pt(a+w*2,core*.88),white,1);
  }
  const diskSegments=[8,6,4][d],centerTop=center.clone().addScaledVector(up,radius*.13);
  for(let i=0;i<diskSegments;i++){
    const a=i*TAU/diskSegments,z=(i+1)*TAU/diskSegments;
    b.face(centerTop,pt(a,core),pt(z,core),tint(yellow,.9+.10*(i%2)),1);
    if(d===0)b.face(center.clone().addScaledVector(up,-radius*.10),pt(z,core),pt(a,core),color('#758047'),1);
  }
}

function daisyGeometry(lod,variant,seed){
  const b=new Builder(),d=LODS.indexOf(lod),r=rng(seed),h=.33+r()*.16,a=r()*TAU,dx=Math.cos(a),dz=Math.sin(a);
  const at=connectedPath(t=>V(dx*.040*t*t,h*t,dz*.040*t*t),d===0?3:2),green=color(palette.green);
  stem(b,at,.0014,green,[3,2,2][d],d<2,h);
  const heads=[{tip:at(1),radius:.016+r()*.003}];
  for(let i=0;i<[2,1,0][d];i++){
    const start=at(.68-i*.16),phi=a+1.3+i*2.9,tip=start.clone().add(V(Math.cos(phi)*(.075+i*.015),h*(.24+i*.07),Math.sin(phi)*(.075+i*.015)));
    stem(b,u=>start.clone().lerp(tip,u),.0008,green,d===0?2:1,d===0,h);
    heads.push({tip,radius:.012+r()*.003});
  }
  for(let i=0;i<[4,3,3][d];i++){
    const t=.13+i*.135,base=at(t),phi=a+i*2.4;
    if(d===2){
      const tip=base.clone().add(V(Math.cos(phi)*.047,.018,Math.sin(phi)*.047)),s=V(-Math.sin(phi)*.006,0,Math.cos(phi)*.006);
      b.face(base.clone().sub(s),base.clone().add(s),tip,green,t*t);
    }else blade(b,{base,angle:phi,height:.035,reach:.066,width:.012,curl:1.8,twist:.2,tone:green},d===0?3:2,false);
  }
  for(let i=0;i<heads.length;i++)flowerHead(b,heads[i].tip,heads[i].radius,[20,12,8][d],d,a+i*1.2);
  return b.finish(`meadow-daisy-${lod}-${variant}`,{kind:'daisy',lod,variant,habit:'native-fleabane-inspired'});
}

/**
 * Build once, then instance assets[kind][lod][variant].
 * @param {{variants?:number,seed?:number}} [options]
 * @returns {object} shortgrass, tallgrass, seedgrass, fern, daisy; each owns
 *   near/mid/far geometry arrays. .geometries lists every unique shared mesh;
 *   .dispose() releases all geometry buffers when the scene itself is destroyed.
 *
 * meadowFlex is 0 at roots and approximately 1 at tips. A shader can use it for
 * bending, or simply use position.y. uv is local botanical longitudinal UV,
 * not an atlas. Do not dispose a geometry when unloading an instanced tile.
 */
export function createMeadowPlantAssets(options={}) {
  const variantCount=clamp(Math.floor(options.variants??3),1,8),seed=(options.seed??0x12bead)>>>0;
  const assets={geometries:[],metadata:{units:'metres',variantCount,vertexColors:'linear',lods:LODS.slice(),version:12}};
  const kinds=['shortgrass','tallgrass','seedgrass','fern','daisy'];
  for(let k=0;k<kinds.length;k++){
    const kind=kinds[k];assets[kind]={near:[],mid:[],far:[]};
    for(const lod of LODS)for(let variant=0;variant<variantCount;variant++){
      const s=(seed^Math.imul(k+1,0x4c521d5)^Math.imul(variant+1,0x6a72109))>>>0;
      const g=kind==='seedgrass'?seedGrassGeometry(lod,variant,s):kind==='fern'?fernGeometry(lod,variant,s):kind==='daisy'?daisyGeometry(lod,variant,s):grassGeometry(kind,lod,variant,s);
      assets[kind][lod].push(g);assets.geometries.push(g);
    }
  }
  assets.dispose=()=>{for(const geometry of assets.geometries)geometry.dispose();};
  return assets;
}
