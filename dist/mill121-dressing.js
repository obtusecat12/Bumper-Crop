import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {M121_PROPS as P,M121_DECALS as D} from './mill121-atlas.js';
// V121-L11: street-side dressing of the flour-mill passage mouth (image-46 view).
// Local return frame: wall faces at z=0 looking to -z (the street), x>0 = green corrugated
// wall, x<0 = brick block. Every box-like prop is a six-face unwrap from the props atlas;
// weeds are crossed cards; decals are offset planes. Centre approach |x|<2.4 stays clear.
const PI=Math.PI;let tex=null;
function textures(){if(tex)return tex;const L=new T.TextureLoader(),ld=(n,srgb=true)=>{const t=L.load(new URL('./assets/l11-v121/'+n,import.meta.url).href);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;};
 tex={props:ld('props.webp'),decals:ld('decals.webp'),cinder:ld('cinder.webp'),cinderN:ld('cinder-n.webp',false)};for(const t of[tex.cinder,tex.cinderN])t.wrapS=t.wrapT=T.RepeatWrapping;return tex;}
export function mill121Materials(){const t=textures(),S=o=>new T.MeshStandardMaterial(o),off=f=>({polygonOffset:true,polygonOffsetFactor:f,polygonOffsetUnits:f});
 return{m121p:S({name:'Mill121 / unwrapped props',map:t.props,roughness:.86}),m121m:S({name:'Mill121 / painted steel props',map:t.props,roughness:.52,metalness:.32}),
  m121d:S({name:'Mill121 / wall decals',map:t.decals,alphaTest:.42,side:T.DoubleSide,roughness:.9,...off(-2)}),
  m121s:S({name:'Mill121 / soft stains',map:t.decals,transparent:true,depthWrite:false,roughness:.95,...off(-3)}),
  m121w:S({name:'Mill121 / puddles',map:t.decals,transparent:true,depthWrite:false,roughness:.07,metalness:.1,color:0x8c9194,opacity:.88,...off(-4)}),
  m121g:S({name:'Mill121 / weed cards',map:t.decals,alphaTest:.5,side:T.DoubleSide,roughness:.97,color:0xd8d2bc}),
  m121b:S({name:'Mill121 / bin bags',map:t.props,roughness:.38,color:0x303030}),m121k:S({name:'Mill121 / pallet timber',map:t.props,roughness:.92,color:0x9a9284}),
  m121r:S({name:'Mill121 / rain streaks',map:t.decals,transparent:true,depthWrite:false,roughness:.95,color:0x5c564e,opacity:.42,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
  m121c:S({name:'Mill121 / cinder block',map:t.cinder,normalMap:t.cinderN,normalScale:new T.Vector2(.9,.9),roughness:.95,color:0xc2beb2})};}
// deterministic jitter so no two instances show the same crop of a face
let seed=121;const rnd=()=>((seed=Math.imul(seed^seed>>>15,2246822519)+0x9e3779b9|0)>>>0)/4294967296;
const sub=(r,j=.14)=>{const s=1-j*rnd();return[r[0]+r[2]*(1-s)*rnd(),r[1]+r[3]*(1-s)*rnd(),r[2]*s,r[3]*s];};
function remap(g,start,count,f){const r=f.r||f,uv=g.attributes.uv,idx=g.index,done=new Set();for(let i=start;i<start+count;i++){const v=idx?idx.getX(i):i;if(done.has(v))continue;done.add(v);let u=uv.getX(v),w=uv.getY(v);if(f.rot)[u,w]=[w,1-u];if(f.flip)u=1-u;uv.setXY(v,r[0]+u*r[2],r[1]+w*r[3]);}}
// faces order of BoxGeometry: +x,-x,+y,-y,+z,-z ; front = -z (towards the street)
function ubox(w,h,d,f){const g=new T.BoxGeometry(w,h,d);g.groups.forEach((gr,i)=>remap(g,gr.start,gr.count,f[i]));return g;}
function card(w,h,r){const g=new T.PlaneGeometry(w,h);remap(g,0,g.index.count,r);return g;}
export function createMillDressing(base,{sacks,pallet,ground:G=0}={}){
 const m=Object.assign(mill121Materials(),base),k=new TikiKit(m),colliders=[];seed=121;
 const at=(g,key,x,y,z,r=[0,0,0])=>k.add(g,key,x,G+y,z,r);
 const crate=(x,z,w,h,d,ry=0,y=0)=>{at(ubox(w,h,d,[sub(P.crate_side),{r:sub(P.crate_side2),flip:1},sub(P.crate_top),sub(P.crate_back,.3),sub(P.crate_back),sub(P.crate_front)]),'m121p',x,y+h/2,z,[0,ry,0]);if(!y)colliders.push({kind:'obb',x,z,w:w+.04,d:d+.04,ry});};
 const carton=(x,y,z,w,h,d,ry,face)=>{at(ubox(w,h,d,[sub(P.carton_side,.25),{r:sub(P.carton_side2,.25),flip:1},{r:sub(P.carton_top,.2),rot:rnd()<.5},sub(P.carton_top,.5),sub(P.carton_side2,.3),sub(P[face],.1)]),'m121p',x,y+h/2,z,[0,ry,0]);};
 const drum=(x,z,side,lid,ry=0,{r=.29,h=.88,tilt=0,y=0}={})=>{const g=new T.CylinderGeometry(r,r,h,18,1);const s=sub(P[side],.2);remap(g,g.groups[0].start,g.groups[0].count,s);remap(g,g.groups[1].start,g.groups[1].count,sub(P[lid],.04));remap(g,g.groups[2].start,g.groups[2].count,sub(P[lid],.3));
  const e=new T.Euler(tilt,ry,0,'YXZ');at(g,'m121m',x,y+(tilt?r:h/2),z,[e.x,e.y,e.z]);if(!tilt)for(const yy of[.03,h-.03]){const ring=new T.TorusGeometry(r+.004,.014,5,18);ring.rotateX(PI/2);k.add(ring,'metal',x,G+y+yy,z);}colliders.push({kind:'circle',x,z,r:r+.03});};
 const paper=(x,y,z,w,h)=>at(card(w,h,sub(P.notice,.04)),'m121p',x,y,z,[0,PI,0]);
 const decal=(key,x,y,z,w,h,ry=PI,mat='m121d')=>at(card(w,h,sub(D[key],.02)),mat,x,y,z,[0,ry,0]);
 const ground=(key,x,z,w,d,rz=0,mat='m121s')=>at(card(w,d,D[key]),mat,x,.004+rnd()*.004,z,[-PI/2,0,rz]);
 const weeds=(key,x,z,s=1,a=rnd()*PI)=>{const r=sub(D[key],.04);s*=1.45;for(const q of[0,PI/2])at(card(.62*s,.36*s,r),'m121g',x,.17*s,z,[0,a+q,0]);};
 const board=(x,y,z,w,h,d,rx,ry,rz)=>at(ubox(w,h,d,[sub(P.pallet,.9),sub(P.pallet,.9),sub(P.pallet,.75),sub(P.pallet,.75),sub(P.pallet,.6),sub(P.pallet,.6)]),'m121k',x,y,z,[rx,ry,rz]);
 // pallet standing on edge, its top resting on the wall (z=0), built board by board
 const leanPallet=(x,lean)=>{const c=Math.cos(lean),sn=Math.sin(lean),z0=-(1.2*sn+.11*c)-.01,pos=(t,o)=>[x,t*c-o*sn,z0+t*sn+o*c];
  for(let i=0;i<7;i++){const [px,py,pz]=pos(.07+i*.176,0);board(px,py,pz,1.18,.14,.022,lean,0,0);}
  for(const xx of[-.52,0,.52]){const [px,py,pz]=pos(.6,.06);board(px+xx,py,pz,.09,1.18,.09,lean,0,0);}return z0;};
 const hyd=(g,key,x,y,z,r=[0,0,0])=>{const uv=g.attributes.uv,q=sub(P.hydrant,.3);for(let i=0;i<uv.count;i++)uv.setXY(i,q[0]+uv.getX(i)*q[2],q[1]+uv.getY(i)*q[3]);at(g,'m121m',x,y,z,r);};
 const bag=(x,z,sc,ry)=>{const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),n=1+.13*Math.sin(a*7+c*5+sc*9)+.08*Math.sin(b*11+a*3);p.setXYZ(i,a*.33*n,(b>0?b*.40:b*.22)*n,c*.30*n);}g.computeVertexNormals();
  const uv=g.attributes.uv,r=sub(P.trashbag,.2),fr=v=>v-Math.floor(v);for(let i=0;i<uv.count;i++)uv.setXY(i,r[0]+fr(p.getX(i)*1.3+p.getZ(i)*.9+.5)*r[2],r[1]+fr(p.getY(i)*1.2+.5)*r[3]);at(g,'m121b',x,.2*sc,z,[0,ry,0]);k.add(new T.CylinderGeometry(.035,.06,.14,6),'m121b',x,G+.62*sc,z);};
 const cinder=(x,y,z,ry)=>{const g=new T.BoxGeometry(.40,.20,.20),uv=g.attributes.uv,o=[rnd(),rnd()];for(let i=0;i<uv.count;i++)uv.setXY(i,o[0]+uv.getX(i)*.5,o[1]+uv.getY(i)*.25);at(g,'m121c',x,y+.10,z,[0,ry,0]);};

 // ---------- LEFT (+x, green corrugated wall) ----------
 // L1 by the mouth: two pallets leaning on the wall, used-oil drum and a plastic drum, weeds at the wall foot.
 leanPallet(3.15,.12);leanPallet(4.42,.19);colliders.push({kind:'obb',x:3.8,z:-.22,w:2.5,d:.42,ry:0});
 drum(2.92,-.86,'drum_red','drum_lid',.4);drum(5.45,-.48,'drum_blue','drum_blue_lid',1.9,{r:.28,h:.92});
 ground('oilstain',3.05,-1.38,.95,.55,.4);weeds('weeds_a',2.55,-.12,.9);weeds('weeds_b',5.05,-.10,.8);
 // flour sacks heaped on a pallet, one sack slumped torn on the ground with its spill
 if(pallet&&sacks){pallet(k,6.55,-.78,PI/2+.05,G);for(let row=0;row<3;row++)for(let i=0;i<3-row;i++)sacks(k,6.55+(i-(2-row)/2)*.47,G+.39+row*.29,-.78+(row%2)*.05,{paper:(i+row)%2===0,lean:PI/2,angle:(i-1)*.09+row*.05,scale:.86});
  sacks(k,7.25,G+.22,-1.42,{angle:.6,lean:-.5,torn:true,scale:.9});colliders.push({kind:'obb',x:6.55,z:-.78,w:1.1,d:1.0,ry:0});k.plane('flour',7.45,G+.006,-1.65,1.5,.95,[-PI/2,0,.5]);}
 // L2 utility run: electricity meter cabinet, conduits up the wall, gas meter + riser, notice, streaks
 at(ubox(.62,.84,.26,[P.meter_side,{r:P.meter_side,flip:1},P.meter_top,sub(P.meter_top,.4),P.meter_side,P.meter_front]),'m121m',8.25,1.42,-.14);
 k.beam('metal',[8.25,G+1.84,-.12],[8.25,G+6.45,-.12],.032,8);k.beam('metal',[8.43,G+1.84,-.10],[8.43,G+5.2,-.10],.022,8);k.beam('metal',[8.43,G+5.2,-.10],[12.6,G+5.2,-.10],.022,8);for(const y of[2.6,3.7,4.8,5.9])k.box('metal',8.25,G+y,-.10,.11,.05,.06,.01);for(const x of[9.6,11,12.4])k.box('metal',x,G+5.2,-.08,.05,.07,.05,.01);
 k.beam('metal',[8.06,G+1.0,-.12],[8.06,G+.02,-.12],.026,8);
 at(ubox(.30,.30,.17,[P.meter_side,P.meter_side,P.meter_top,P.meter_top,P.meter_side,P.gasmeter]),'m121m',9.55,.82,-.13);k.beam('metal',[9.48,G+.66,-.14],[9.48,G+.02,-.14],.024,8);k.beam('metal',[9.62,G+.97,-.14],[9.62,G+1.3,-.14],.02,8);k.beam('metal',[9.62,G+1.3,-.14],[10.3,G+1.3,-.06],.02,8);k.box('yellow',9.48,G+.36,-.14,.07,.05,.07,.01);
 paper(7.15,1.62,-.022,.52,.70);decal('streak',8.25,4.6,-.02,.6,2.2,PI,'m121r');decal('streak',14.4,4.9,-.02,.9,3.0,PI,'m121r');decal('streak',4.05,5.2,-.02,.7,2.4,PI,'m121r');
 weeds('weeds_b',9.05,-.09,.75);ground('puddle',10.6,-1.55,2.0,1.1,.15,'m121w');
 // L3 graffiti and a dumped shipment: crate, cartons, cinder blocks, a city barrier
 decal('graffiti_a',11.7,1.75,-.025,3.3,1.65);decal('flyer',13.35,1.45,-.022,.30,.52);
 crate(12.85,-.52,1.05,.82,.86,.06);carton(12.78,.82,-.55,.56,.36,.46,-.12,'carton_a');carton(13.95,0,-.42,.62,.40,.50,.18,'carton_b');carton(13.9,.40,-.45,.58,.38,.48,.05,'carton_a');carton(14.55,0,-1.05,.48,.30,.40,.9,'carton_b');colliders.push({kind:'obb',x:14.1,z:-.65,w:1.2,d:1.1,ry:0});
 weeds('weeds_a',12.1,-.1,1.05);weeds('weeds_b',15.1,-.1,.95);
 for(const [x,y,z,ry]of[[15.9,0,-.32,.05],[16.32,0,-.30,-.04],[16.1,.2,-.31,.1],[16.75,0,-.55,.7]])cinder(x,y,z,ry);colliders.push({kind:'obb',x:16.3,z:-.38,w:1.2,d:.5,ry:0});
 { const x=17.25,z=-1.25,ry=.35;at(ubox(1.25,.22,.035,[P.barrier,P.barrier,sub(P.barrier,.8),sub(P.barrier,.8),{r:sub(P.barrier,.1),flip:1},P.barrier]),'m121p',x,.92,z,[0,ry,0]);for(const s of[-1,1])for(const f of[-1,1]){const dx=Math.cos(ry)*.5*s,dz=-Math.sin(ry)*.5*s;k.beam('metal',[x+dx+Math.sin(ry)*.2*f,G,z+dz+Math.cos(ry)*.2*f],[x+dx,G+1.0,z+dz],.022,6);}colliders.push({kind:'obb',x,z,w:1.3,d:.5,ry}); }
 weeds('weeds_a',18.1,-.12,.8);ground('oilstain',15.4,-1.9,1.2,.7,2.1);
 // ---------- RIGHT (-x, brick block) ----------
 // R1: gas riser on the corner pier, bagged trash spilling from the dumpster, hydrant by the kerb line
 at(ubox(.30,.30,.17,[P.meter_side,P.meter_side,P.meter_top,P.meter_top,P.meter_side,P.gasmeter]),'m121m',-2.95,1.05,-.13);k.beam('metal',[-2.88,G+.9,-.14],[-2.88,G+.02,-.14],.026,8);k.beam('metal',[-3.02,G+1.2,-.14],[-3.02,G+2.4,-.14],.022,8);k.box('yellow',-2.88,G+.45,-.15,.08,.05,.08,.01);
 bag(-4.82,-.62,1,0);bag(-5.15,-1.15,.85,1.2);bag(-4.68,-1.72,.7,2.3);bag(-5.55,-.48,.92,.6);colliders.push({kind:'obb',x:-5.05,z:-1.0,w:1.0,d:1.4,ry:0});
 at(ubox(.04,.9,1.15,[sub(P.carton_side,.3),sub(P.carton_side2,.3),P.carton_top,P.carton_top,sub(P.carton_side,.3),sub(P.carton_b,.05)]),'m121p',-6.22,.44,-.36,[0,PI/2,-.2]);
 { const x=-6.85,z=-1.95;hyd(new T.CylinderGeometry(.13,.15,.64,12),'h',x,.32,z);hyd(new T.SphereGeometry(.14,12,6,0,PI*2,0,PI/2),'h',x,.64,z,[0,0,0]);hyd(new T.CylinderGeometry(.2,.21,.08,12),'h',x,.04,z);for(const a of[0,PI/2,PI])hyd(new T.CylinderGeometry(.055,.055,.12,8).rotateZ(PI/2).rotateY(a),'h',x+Math.cos(a)*.15,.42,z-Math.sin(a)*.15);hyd(new T.CylinderGeometry(.03,.05,.08,6),'h',x,.78,z);colliders.push({kind:'circle',x,z,r:.22}); }
 weeds('weeds_a',-6.0,-.1,.8);weeds('weeds_b',-2.5,-.08,.7);ground('oilstain',-6.0,-2.1,1.0,.55,.9);
 // R2: posters and a tag on the brick, a rainwater downspout with its own splash puddle, a broken crate corner
 decal('graffiti_b',-8.1,1.55,-.025,2.2,1.1);paper(-7.0,1.7,-.022,.48,.64);decal('flyer',-6.62,1.52,-.022,.26,.46);decal('flyer',-7.42,1.33,-.024,.25,.44);
 decal('streak',-9.7,9.6,-.02,.8,3.2,PI,'m121r');decal('streak',-5.0,6.0,-.02,.7,2.6,PI,'m121r');
 k.beam('metal',[-9.7,G+13.6,-.11],[-9.7,G+.55,-.11],.055,10);k.tube('metal',[[-9.7,G+.58,-.11],[-9.7,G+.28,-.16],[-9.7,G+.16,-.42]],.055,8);for(const y of[2,4.6,7.2,9.8,12.4])k.box('metal',-9.7,G+y,-.08,.14,.05,.1,.01);ground('puddle',-9.55,-.95,1.6,.95,1.4,'m121w');
 crate(-8.75,-.55,.95,.76,.80,-.08);carton(-8.62,.76,-.58,.52,.34,.44,.22,'carton_b');crate(-10.05,-.62,.82,.62,.74,.5);
 drum(-7.75,-.5,'drum_red','drum_lid',2.7,{r:.29,h:.88});drum(-10.25,-1.65,'drum_blue','drum_blue_lid',.8,{tilt:PI/2,r:.28,h:.92});
 cinder(-7.2,0,-.95,.3);cinder(-7.3,.2,-.95,.4);weeds('weeds_b',-9.2,-.1,.9);weeds('weeds_a',-10.55,-.12,1.1);
 const object=k.finish('Mill mouth V121 dressing');return{object,colliders,materials:m};
}
