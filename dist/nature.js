import * as T from './vendor/three.module.min.js';
import {attachRuralDetail} from './rural-textures.js?v=29';
import {JoinedWood} from './joined-wood.js?v=29';
import {height} from './world.js?v=29';

// Open-grown eastern/central US farm trees. The crown follows the woody branch
// hierarchy; every foliage instance is a little open spray of individual leaves.
// width on a shrub is its approximate full spread in metres, before scale.
const TAU=Math.PI*2, UP=new T.Vector3(0,1,0), V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const shared=new Set(), leafGeometries=new Map(), windMaterials=new WeakMap();
const depthMaterials=new WeakMap();
const fallbackWind={time:{value:0},strength:{value:.5}};
const woodMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1});
attachRuralDetail(woodMaterial,'bark');
woodMaterial.name='Nature / bark and branches';shared.add(woodMaterial);
const bark=['#746f60','#797267','#6d6759','#7c7d71','#cbc8af','#785c49'].map(c=>new T.Color(c));
const greens=['#687546','#7b8956','#637849','#687f4b','#809064','#566e54','#78825a'].map(c=>new T.Color(c));
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function seedFor(item,f,index,salt){return (item.seed??((f.seed||1)^Math.imul(index+1,2654435761)^salt))>>>0}
function leafMaterial(wind,species){
 const key=wind&&typeof wind==='object'?wind:fallbackWind;
 const kind=species===5||species===6?'fineleaf':'broadleaf';
 if(!windMaterials.has(key))windMaterials.set(key,new Map());
 const variants=windMaterials.get(key);if(variants.has(kind))return variants.get(kind);
 const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1,side:T.DoubleSide});
 m.name='Nature / softly lit moving leaves';
 // The material stays white. The only green tint is instanceColor; there is no
 // second dark material multiplier or shadow baked into the spray geometry.
 m.onBeforeCompile=s=>{s.uniforms.uNatureTime=key.time||fallbackWind.time;s.uniforms.uNatureWind=key.strength||fallbackWind.strength;
  s.vertexShader='uniform float uNatureTime;uniform float uNatureWind;attribute float natureFlex;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
    float nphase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.29;
    float nflex=natureFlex;
    transformed.x+=sin(uNatureTime*1.42+nphase+position.y*2.1)*.046*uNatureWind*nflex;
    transformed.z+=cos(uNatureTime*1.13+nphase*1.4)*.027*uNatureWind*nflex;
   #endif`);
 };m.customProgramCacheKey=()=> 'nature-leaves-v5-attached';
 const depth=new T.MeshDepthMaterial({side:T.DoubleSide,depthPacking:T.RGBADepthPacking});
 depth.onBeforeCompile=m.onBeforeCompile;depth.customProgramCacheKey=()=> 'nature-moving-depth-v15';
 depthMaterials.set(m,depth);shared.add(depth);
 attachRuralDetail(m,kind);variants.set(kind,m);shared.add(m);return m;
}

function foliageGeometry(species,level,attached=false){
 const key=species+':'+level+(attached?':attached':'');if(leafGeometries.has(key))return leafGeometries.get(key);
 const p=[],r=rng(3001+species*727);
 function tri(a,b,c){for(const v of[a,b,c])p.push(v.x,v.y,v.z)}
 // Small green shoots are part of the same instanced mesh as their leaves.
 // Crossed stem ribbons join every tier; petioles share the leaf-base vertex. Their
 // shared vertices receive exactly the same wind, with the woody base pinned.
 function shoot(){
  const nodes=level===2?[0,.12,.825]:level===1?[0,.12,.59,.825]:[0,.12,.355,.59,.825];
  for(let j=1;j<nodes.length;j++)for(let plane=0;plane<2;plane++){
   const a=plane*Math.PI*.5,side=V(Math.cos(a),0,Math.sin(a)),lo=V(0,nodes[j-1],0),hi=V(0,nodes[j],0),rw=.009*(1-nodes[j-1]*.55),tw=.009*(1-nodes[j]*.55);
   const al=lo.clone().addScaledVector(side,-rw),ar=lo.clone().addScaledVector(side,rw),bl=hi.clone().addScaledVector(side,-tw),br=hi.clone().addScaledVector(side,tw);
   tri(al,ar,bl);tri(ar,br,bl);
  }
 }
 if(attached)shoot();
 function leaf(center,axis,side,len,w,shape){
  const tip=center.clone().addScaledVector(axis,len*.62),base=center.clone().addScaledVector(axis,-len*.38);
  const l=center.clone().addScaledVector(side,w),rr=center.clone().addScaledVector(side,-w);
  // Fold along the midrib so different little leaves catch the overcast light.
  l.z+=w*.20;rr.z+=w*.16;
  if(shape===0||shape===3){
   const lt=center.clone().addScaledVector(axis,len*.34).addScaledVector(side,w*.70),rt=center.clone().addScaledVector(axis,len*.34).addScaledVector(side,-w*.70);
   lt.z+=w*.12;rt.z+=w*.15;tri(base,l,tip);tri(l,lt,tip);tri(base,tip,rr);tri(rr,tip,rt);
  }else{tri(base,l,tip);tri(base,tip,rr)}
 }
 if(species===5){
  // Three interleaved flat cedar fans; each needle-scale is a tapered blade.
  const tiers=level===0?7:level===1?5:4;
  for(let plane=0;plane<3;plane++)for(let j=0;j<tiers;j++)for(const sign of[-1,1]){
   const a=plane*Math.PI/3,side=V(Math.cos(a)*sign,.22,Math.sin(a)*sign),y=.04+j/tiers*1.16;
   const spread=(1-y*.63)*(.37+r()*.12),c=V(0,y,0),e=c.clone().addScaledVector(side,spread);e.y+=.27;
   tri(c,e,c.clone().add(V(Math.cos(a)*sign*.085,.28,Math.sin(a)*sign*.085)));
  }
 }else{
  // Attached LODs retain a subset of the same four tiers, using the same RNG
  // samples and endpoints. Never enlarge or move leaves to disguise a gap.
  const tiers=attached?4:level===0?4:level===1?3:2,planes=species===6?2:3;
  for(let plane=0;plane<planes;plane++)for(let j=0;j<tiers;j++)for(const sign of[-1,1]){
   const a=plane*Math.PI*2/planes+.37*(r()-.5),rad=(species===6?.16:.22)+.09*j,side=V(Math.cos(a)*sign,0,Math.sin(a)*sign);
   const y=.12+j/tiers*.94+r()*.075,c=V(side.x*rad,y,side.z*rad),axis=side.clone().multiplyScalar(.84).add(V(0,.45+(r()-.5)*.45,0)).normalize();
   const across=V(-Math.sin(a),.18*(r()-.5),Math.cos(a)).normalize(),enlarge=attached||level===0?1:level===1?1.14:1.43;
   const len=(species===4?.27:species===6?.34:.40)*enlarge*(.87+r()*.27),w=len*(species===1?.53:species===2?.36:species===4?.42:.48);
   if(attached){
    if(level===1&&j===1||level===2&&(j===1||j===2))continue;
    const node=V(0,.12+j*.235,0),base=c.clone().addScaledVector(axis,-len*.38),petioleSide=V(-Math.sin(a),0,Math.cos(a)).multiplyScalar(.006);
    tri(node.clone().sub(petioleSide),node.clone().add(petioleSide),base);
   }
   leaf(c,axis,across,len,w,species);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('natureFlex',new T.Float32BufferAttribute(p.filter((_,i)=>i%3===1).map(y=>Math.max(0,Math.min(1.4,y+(attached?0:.14)))),1));g.computeVertexNormals();g.computeBoundingSphere();g.name='Individual leaf spray '+key;leafGeometries.set(key,g);shared.add(g);return g;
}

class NatureBatch{
 constructor(level,wind){this.level=Math.max(0,Math.min(2,level|0));this.wind=wind;this.positions=[];this.colors=[];this.sprays=new Map();this.woodTriangles=0;this.tempColor=new T.Color();}
 triangle(a,b,c,color){for(const v of[a,b,c]){this.positions.push(v.x,v.y,v.z);this.colors.push(color.r,color.g,color.b)}this.woodTriangles++;}
 beginWood(){this.wood=new JoinedWood((a,b,c,tint)=>this.triangle(a,b,c,tint));}
 finishWood(){this.wood.finish();this.wood=null;}
 beam(a,b,ra,rb,tint,depth=0,phase=0,keepAtDistance=false){this.path([a,b],[ra,rb],tint,depth,phase,keepAtDistance);}
 path(points,radii,tint,depth=0,phase=0,keepAtDistance=false){
  if(!keepAtDistance&&((this.level===2&&depth>2)||(this.level===1&&depth>3)))return;
  const sides=depth<1?7:depth<3?5:3,colors=[];
  for(let i=0;i<sides;i++)colors.push(tint.clone().multiplyScalar(.90+.12*(.5+.5*Math.sin(i*2.1+phase))));
  this.wood.add(points,radii,sides,points.slice(1).map(()=>colors),.08,phase);
 }
 spray(species,point,direction,size,shade,roll=0,attached=false){
  const q=new T.Quaternion().setFromUnitVectors(UP,direction.clone().normalize());q.multiply(new T.Quaternion().setFromAxisAngle(UP,roll));
  const mat=new T.Matrix4().compose(point,q,V(size.x,size.y,size.z));
  const key=attached?species+':attached':species;
  if(!this.sprays.has(key))this.sprays.set(key,[]);
  this.sprays.get(key).push({mat,color:greens[species].clone().multiplyScalar(shade)});
 }
 finish(){
  const group=new T.Group();group.name='Rural trees and wild hedgerow';let triangles=this.woodTriangles,drawCalls=0,leafSprays=0;
  if(this.positions.length){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.computeVertexNormals();g.computeBoundingSphere();
   const m=new T.Mesh(g,woodMaterial);m.name='Merged trunks, limbs and shrub stems';m.castShadow=true;m.receiveShadow=true;group.add(m);drawCalls++;
  }
  for(const [key,items]of this.sprays){
   const attached=typeof key==='string',species=attached?Number(key.split(':')[0]):key;
   const g=foliageGeometry(species,this.level,attached),m=new T.InstancedMesh(g,leafMaterial(this.wind,species),items.length);m.customDepthMaterial=depthMaterials.get(m.material);m.name='Open foliage sprays / '+['oak','cottonwood','elm','maple','birch','conifer','compound'][species]+(attached?' / attached shrub shoots':'');
   items.forEach((a,i)=>{m.setMatrixAt(i,a.mat);m.setColorAt(i,a.color)});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=true;m.receiveShadow=true;group.add(m);
   triangles+=g.attributes.position.count/3*items.length;drawCalls++;leafSprays+=items.length;
  }
  group.userData.natureStats={triangles,drawCalls,leafSprays,level:this.level};return group;
 }
}

function plantContext(batch,f,item,index,isShrub=false){
 const scale=Number.isFinite(item.scale)?Math.max(.1,item.scale):1,rot=item.rotation||0,c=Math.cos(rot),s=Math.sin(rot),base=height(item.x,item.z,f.x,f.z),r=rng(seedFor(item,f,index,isShrub?0x6d9221:0x6a8b21));
 const species=isShrub?Math.abs(item.variant|0)%4:Math.abs(item.variant|0)%6;
 const point=p=>V(item.x+(p.x*c+p.z*s)*scale,base+p.y*scale,item.z+(p.z*c-p.x*s)*scale);
 const dir=p=>V(p.x*c+p.z*s,p.y,p.z*c-p.x*s);
 const context={r,scale,species,point,dir,path(points,radii,depth=1,col=bark[species]){batch.path(points.map(point),radii.map(x=>x*scale),col,depth,index*.81,isShrub&&depth<=3)},beam(a,b,ra,rb,depth=1,col=bark[species]){batch.beam(point(a),point(b),ra*scale,rb*scale,col,depth,index*.81,isShrub&&depth<=3)},spray(p,d,size=1,leafSpecies=species,wide=1){const variation=.92+r()*.18;batch.spray(leafSpecies,point(p),dir(d),V(size*scale*wide,size*scale,size*scale),variation,r()*TAU,isShrub)}};
 context.limb=(a,b,ra,rb,depth=1,col=bark[species],bend=.12)=>{
  const delta=b.clone().sub(a),len=delta.length(),side=V(-delta.z,0,delta.x).normalize(),sway=(r()-.5)*bend*len;
  const m1=a.clone().lerp(b,.31).addScaledVector(side,sway).add(V(0,len*bend*(.10+r()*.20),0));
  const m2=a.clone().lerp(b,.68).addScaledVector(side,sway*.65).add(V(0,len*bend*(.18+r()*.28),0));
  context.path([a,m1,m2,b],[ra,ra+(rb-ra)*.31,ra+(rb-ra)*.68,rb],depth,col);
 };
 context.twig=(a,b,size=1,leafSpecies=species,wide=1)=>{context.limb(a,b,.022,.005,3,species===4?bark[2]:bark[species],.18);const d=b.clone().sub(a).normalize(),lift=d.clone().add(V((r()-.5)*.22,.20,(r()-.5)*.22)).normalize();context.spray(a.clone().lerp(b,.27),lift,size,leafSpecies,wide);context.spray(b.clone().addScaledVector(d,-.19),d,size*.92,leafSpecies,wide)};
 return context;
}
function forkTwig(c,start,end,spread,size=1,leafSpecies=c.species,wide=1){
 const {r}=c,d=end.clone().sub(start),angle=Math.atan2(d.z,d.x);
 c.limb(start,end,.047,.014,2,c.species===4?bark[2]:bark[c.species],.18);
 for(let k=0;k<3;k++){
  const a=angle+(k-1)*.82+(r()-.5)*.24,len=spread*(.83+r()*.28),tip=end.clone().add(V(Math.cos(a)*len,.24+r()*.52,Math.sin(a)*len));
  c.twig(end.clone().lerp(start,.15+r()*.22),tip,size,leafSpecies,wide);
 }
}
function trunkSpine(c,points,radii){
 c.path(points,radii,0);
 return y=>{for(let i=0;i<points.length-1;i++)if(y<=points[i+1].y)return points[i].clone().lerp(points[i+1],Math.max(0,(y-points[i].y)/(points[i+1].y-points[i].y)));return points[points.length-1].clone()};
}
function tree(batch,f,t,i,colliders){
 const c=plantContext(batch,f,t,i),{r,species:v}=c,h=[7.5,11.7,9.4,8.4,9.5,8.7][v]*(.90+r()*.18),tr=[.31,.30,.28,.235,.115,.20][v];
 const circle=(p,rad)=>{const q=c.point(p);colliders.push({kind:'circle',x:q.x,z:q.z,r:rad*c.scale})};
 if(v!==4)circle(V(),tr*1.04);
 if(v===0){
  const trunk=V(.24,h*.70,.11),at=trunkSpine(c,[V(),V(.12,h*.24,.04),V(.34,h*.45,-.15),trunk],[tr*1.10,tr*.82,tr*.47,.022]);
  // Rugged, low-forking oak scaffolds: broad horizontal elbows, then lifting twigs.
  for(let j=0;j<6;j++){
   const u=j/6,a=j*2.399+r()*.45,start=at(h*(.20+u*.36+r()*.045)),reach=(3.38-u*.68)*(.84+r()*.22);
   const shoulder=start.clone().add(V(Math.cos(a-.16)*reach*.36,.60+u*.55,Math.sin(a-.16)*reach*.36));
   const elbow=V(Math.cos(a)*reach,h*(.49+u*.20+r()*.07),Math.sin(a)*reach),end=V(Math.cos(a+.17)*reach*1.22,h*(.68+u*.17+r()*.09),Math.sin(a+.17)*reach*1.22);
   c.limb(start,shoulder,.154*(1-u*.25),.119*(1-u*.25),1,bark[0],.23);c.limb(shoulder,elbow,.119*(1-u*.25),.058,1,bark[0],.18);
   forkTwig(c,elbow,end,.80+r()*.40,1.01,0,1.10);
   c.spray(elbow.clone().lerp(end,.40),V(Math.cos(a)*.3,1,Math.sin(a)*.3),1.2,0,1.25);
   const inner=shoulder.clone().lerp(elbow,.54),innerTip=V(Math.cos(a-.33)*reach*.62,h*(.72+u*.14+r()*.10),Math.sin(a-.33)*reach*.62);
   forkTwig(c,inner,innerTip,.60,1.08,0,1.15);
  }
  forkTwig(c,at(h*.52),V(-.40,h*.88,.15),.72,1.02,0,1.12);
 }else if(v===1){
  const lean=V(.27,h*.94,-.13),at=trunkSpine(c,[V(),V(.08,h*.31,-.10),V(.33,h*.65,.03),lean],[tr*1.12,tr*.74,tr*.35,.025]);
  // Cottonwood: substantial upright leader and separated, ascending crown lobes.
  for(let j=0;j<9;j++){
   const u=j/9,a=j*2.399+r()*.37,start=at(h*(.35+u*.48+r()*.025)),reach=(3.25-u*1.8)*(.86+r()*.20);
   const middle=start.clone().add(V(Math.cos(a)*reach*.65,1.35,Math.sin(a)*reach*.65)),end=start.clone().add(V(Math.cos(a)*reach,2.25-u*.65,Math.sin(a)*reach));
   c.limb(start,middle,.105*(1-u*.5),.057,1,bark[1],.20);forkTwig(c,middle,end,.61,1.10,1,1.10);
   for(let shoot=0;shoot<3;shoot++){
    const inner=start.clone().lerp(middle,.25+shoot*.27),aa=a-.65+shoot*.48,tip=inner.clone().add(V(Math.cos(aa)*(.54+shoot*.10),1.10+r()*.50,Math.sin(aa)*(.54+shoot*.10)));
    c.twig(inner,tip,1.05,1,1.14);
   }
  }
  c.spray(lean,V(.05,1,0),1.08,1);
 }else if(v===2){
  const split=V(.23,h*.63,.08),at=trunkSpine(c,[V(),V(-.08,h*.23,.06),V(.12,h*.44,-.08),split],[tr*1.10,tr*.79,tr*.45,.030]);
  // Elm's vase opens above clear lower limbs, then bends outward and down.
  for(let j=0;j<6;j++){
   const u=j/6,a=j*2.399+r()*.32,start=at(h*(.24+u*.30+r()*.025)),reach=4.15-u*.55+r()*.30;
   const shoulder=start.clone().add(V(Math.cos(a-.19)*reach*.23,h*(.22-u*.06),Math.sin(a-.19)*reach*.23)),elbow=V(Math.cos(a-.10)*reach*.61,h*(.71+u*.10),Math.sin(a-.10)*reach*.61),arch=V(Math.cos(a)*reach,h*(.87+r()*.06),Math.sin(a)*reach);
   c.limb(start,shoulder,.145*(1-u*.3),.102*(1-u*.3),1,bark[2],.18);c.limb(shoulder,elbow,.102*(1-u*.3),.056,1,bark[2],.17);c.limb(elbow,arch,.056,.027,2,bark[2],.12);
   const innerTip=V(Math.cos(a-.21)*reach*.66,h*(.86+r()*.06),Math.sin(a-.21)*reach*.66);
   forkTwig(c,elbow,innerTip,.67,1.05,2,1.22);
   for(let k=0;k<3;k++){
    const aa=a+(k-1)*.29,tip=V(Math.cos(aa)*(reach+1.10),h*(.75+r()*.10),Math.sin(aa)*(reach+1.10));
    c.twig(arch,tip,1.03,2,1.25);c.spray(arch.clone().lerp(tip,.25),V(Math.cos(aa)*.55,.8,Math.sin(aa)*.55),1.04,2,1.2);
   }
  }
  forkTwig(c,at(h*.49),V(-.45,h*.92,-.1),.85,1.05,2,1.15);
 }else if(v===3){
  const leader=V(.16,h*.90,-.10),at=trunkSpine(c,[V(),V(-.06,h*.34,.04),V(.21,h*.62,.03),leader],[tr*1.08,tr*.73,tr*.34,.022]);
  // Opposite maple branch pairs, rounder and more compact than the oak/elm.
  for(let j=0;j<8;j++){
   const u=j/8,a=j*Math.PI+(Math.floor(j/2)*1.47)+r()*.35,start=at(h*(.34+u*.46+r()*.028)),reach=(2.2+Math.sin(u*Math.PI)*.67-u*.90)*(.90+r()*.16),end=start.clone().add(V(Math.cos(a)*reach,1.05+r()*.46,Math.sin(a)*reach));
   forkTwig(c,start,end,.69,1.09,3,1.18);
   for(let shoot=0;shoot<2;shoot++){
    const inner=start.clone().lerp(end,.24+shoot*.30),aa=a+.45-shoot*.77,tip=inner.clone().add(V(Math.cos(aa)*.55,1.12+r()*.22,Math.sin(aa)*.55));c.twig(inner,tip,1.10,3,1.20);
   }
  }
  c.spray(leader,V(.08,1,.10),1.04,3,1.1);
 }else if(v===4){
  const stems=2+(r()>.68?1:0);
  for(let stem=0;stem<stems;stem++){
   const a=stem/stems*TAU+.2,base=V(Math.cos(a)*.20,0,Math.sin(a)*.20),hh=h*(.83+r()*.17),top=base.clone().add(V(Math.cos(a)*.86,hh,Math.sin(a)*.86));circle(base,tr*.95);
   const middle=base.clone().lerp(top,.47);c.beam(base,middle,tr,.077,0,bark[4]);c.beam(middle,top,.077,.011,0,bark[4]);
   // Small horizontal lenticels on the pale trunk are geometry, not an image map.
   for(let band=0;band<9;band++){
    const y=.35+band*.40+r()*.12,at=base.clone().lerp(top,y/hh),rot=r()*TAU,around=V(Math.cos(rot),0,Math.sin(rot)),side=V(-Math.sin(rot),0,Math.cos(rot)),radius=tr*(1-y/hh*.86)+.003;
    const mid=at.addScaledVector(around,radius),w=.03+r()*.038,dy=.011+r()*.009,aa=c.point(mid.clone().addScaledVector(side,-w)),bb=c.point(mid.clone().addScaledVector(side,w)),cc=c.point(mid.clone().addScaledVector(side,w).add(V(0,dy,0))),dd=c.point(mid.clone().addScaledVector(side,-w).add(V(0,dy,0)));
    if(batch.level<2){batch.triangle(aa,bb,cc,bark[2]);batch.triangle(aa,cc,dd,bark[2]);}
   }
   for(let j=0;j<7;j++){
    const u=j/7,aa=a+j*2.39,start=base.clone().lerp(top,.43+u*.43),reach=(1.55-u*.82),end=start.clone().add(V(Math.cos(aa)*reach,.73,Math.sin(aa)*reach));
    c.limb(start,end,.033,.012,2,bark[2],.16);c.twig(end,end.clone().add(V(Math.cos(aa)*.63,-.21,Math.sin(aa)*.63)),.98,4,.95);c.spray(end,V(.18,1,-.1),.98,4,.94);c.spray(start.clone().lerp(end,.49),V(Math.cos(aa)*.16,1,Math.sin(aa)*.16),.87,4,.90);
   }
   c.spray(top.clone().add(V(0,-.35,0)),V(.04,1,0),.87,4,.75);
  }
 }else{
  const pine=r()<.22,top=V(.10,h,0);c.beam(V(),top.clone().multiplyScalar(.56),tr*1.1,tr*.55,0,bark[5]);c.beam(top.clone().multiplyScalar(.56),top,tr*.55,.015,0,bark[5]);
  // An occasional open pine-like silhouette among denser redcedar-shaped trees.
  const tiers=pine?8:10;
  for(let j=0;j<tiers;j++){
   const u=j/tiers,y=h*(.17+u*.76),reach=(pine?2.45:2.55)*(1-u*.85)*(.91+r()*.18),branches=j%2?5:6;
   for(let k=0;k<branches;k++){
    const a=k/branches*TAU+j*1.23+r()*.36,start=V(.1*y/h,y+(r()-.5)*h*.025,0),end=start.clone().add(V(Math.cos(a)*reach,(pine?.22:.09)+u*.28,Math.sin(a)*reach));c.limb(start,end,.049*(1-u*.6),.006,2,bark[5],.11);
    const size=(pine?1.04:1.20)*(1-u*.43);
    for(let tip=0;tip<3;tip++){
     const aa=a+(tip-1)*.31,d=V(Math.cos(aa)*(pine?.70:.44),pine?.62:.92,Math.sin(aa)*(pine?.70:.44)),p=start.clone().lerp(end,.23+tip*.32);c.spray(p,d,size*(tip===1?1:.92),5,pine?1.23:1.35);
    }
   }
  }
  c.spray(top.clone().add(V(0,-.55,0)),UP,.80,5,.68);
 }
}

function shrub(batch,f,s,i,colliders,softVolumes){
 const c=plantContext(batch,f,s,i,true),{r,species:v}=c,width=Math.max(.6,Number.isFinite(s.width)?s.width:2.6),rad=width*.5,h=[1.45,.80,1.48,1.75][v]*(.9+r()*.2),brown=bark[v===1?5:2];
 const leafType=v===2?6:v===3?0:2,stems=v===1?6:v===3?6:5;
 if(v===1||v===2)softVolumes.push({kind:'circle',x:s.x,z:s.z,r:rad*c.scale*(v===1?.91:.80),drag:v===1?.28:.18});
 for(let j=0;j<stems;j++){
  const a=j/stems*TAU+r()*.46,base=V(Math.cos(a)*rad*.10,0,Math.sin(a)*rad*.10),reach=rad*(.66+r()*.18);
  if(v===0||v===3){const q=c.point(base);colliders.push({kind:'circle',x:q.x,z:q.z,r:(v===0?.060:.045)*c.scale})}
  if(v===1){
   // Low bramble canes arch back to the ground, with sparse leaves at the nodes.
   const p1=V(Math.cos(a)*reach*.33,h*.91,Math.sin(a)*reach*.33),p2=V(Math.cos(a)*reach*.80,h,Math.sin(a)*reach*.80),end=V(Math.cos(a)*reach*1.15,.20,Math.sin(a)*reach*1.15);
   c.beam(base,p1,.018,.015,2,brown);c.beam(p1,p2,.015,.010,3,brown);c.beam(p2,end,.010,.004,3,brown);
   for(let k=0;k<3;k++){const q=p1.clone().lerp(k<2?p2:end,(k+1)/3);c.spray(q,V(Math.cos(a)*.4,.5,Math.sin(a)*.4),.40,6,1.05);if(batch.level===0)c.beam(q,q.clone().add(V(Math.sin(a)*.065,.075,-Math.cos(a)*.065)),.009,0,4,brown)}
  }else{
   const mid=V(Math.cos(a)*reach*.34,h*.61,Math.sin(a)*reach*.34),end=V(Math.cos(a)*reach,h*(.78+r()*.15),Math.sin(a)*reach);
   c.beam(base,mid,v===0?.055:v===3?.037:.023,.023,1,brown);c.beam(mid,end,.023,.008,2,brown);
   for(let k=0;k<(v===2?2:3);k++){
    const aa=a+(k-1)*.54,tip=end.clone().add(V(Math.cos(aa)*rad*.24,.09+r()*.18,Math.sin(aa)*rad*.24));c.beam(mid.clone().lerp(end,.45),tip,.013,.004,3,brown);
    c.spray(tip,V(Math.cos(aa)*.27,1,Math.sin(aa)*.27),v===3?.51:v===2?.43:.46,leafType,v===2?1.15:1.03);
   }
   if(v===0){
    c.spray(mid.clone().lerp(end,.35),V(.1,1,.1),.49,2,1.10);
    c.spray(base.clone().lerp(mid,.54),V(Math.cos(a)*.45,1,Math.sin(a)*.45),.63,2,1.02);
    if(batch.level===0){const thorn=mid.clone().lerp(end,.6);c.beam(thorn,thorn.clone().add(V(Math.sin(a)*.11,.05,-Math.cos(a)*.11)),.013,0,4,brown)}
   }
   if(v===3)c.spray(mid.clone().lerp(end,.55),V(Math.cos(a)*.12,1,Math.sin(a)*.12),.50,0,1.13);
  }
 }
}

export function makeNature(f,level=0,wind=fallbackWind){
 const batch=new NatureBatch(level,wind),colliders=[],softVolumes=[];
 (f.trees||[]).forEach((t,i)=>{batch.beginWood();tree(batch,f,t,i,colliders);batch.finishWood()});
 (f.shrubs||[]).forEach((s,i)=>{batch.beginWood();shrub(batch,f,s,i,colliders,softVolumes);batch.finishWood()});
 const group=batch.finish();group.userData.natureStats.trees=(f.trees||[]).length;group.userData.natureStats.shrubs=(f.shrubs||[]).length;
 return {group,colliders,softVolumes};
}
export function isSharedNatureResource(resource){return shared.has(resource)}
