// V135-capital ③-2 SoHo street fair on the closed road x = -224, z 0..224 (notes/plan-v135-capital.md §1).
// Built by exit-scene buildBlock for the two west-face SoHo blocks (-2,0) and (-2,1), in their block frame (road centre = local
// x 0, block runs z 0..112), so it streams and unloads with them. Per block: police sawhorse lines just inside both crosswalks
// (traffic132-core closes the segment, urban-streets drops its kerb parking) and 8 stalls in the two parking lanes, sitting in
// the gaps between the street trees and facing the walking strip in the middle. Every stall has its own generated sign
// (art-v135stall -> bc/tools/stall135_assets.py -> assets/l11-v135s/stalls.webp, 4x4 atlas); three builds: wooden food
// booth, pop-up tent, tent with a tall banner on poles (the reference's Crêpes stand). Goods/grills/coolers are real boxes.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {fair141On,canvas141,goods141,table141,isFood141} from './fair141.js?v=141i';   // V141 F5a modelled food goods + draped tables
import {goodsMerch141,isMerch141,sandbags141,lights141,plank141} from './merch141.js?v=141j';   // V141 F5b merch goods, sandbags, bulb strings, planks
const A=new URL('./assets/l11-v135s/',import.meta.url).href;
// sign aspect (h/w of the cropped sign) printed by stall135_assets.py, atlas order
const ASP=[0.2035,0.4936,0.2009,0.2071,0.2649,0.1944,0.1734,0.1984,0.2051,0.1795,0.2095,0.1701,0.2127,0.4773,0.2045,0.1816];
// per sign: build, width, canvas colour (0 white 1 blue 2 yellow 3 red 4 green 5 orange 6 purple), goods kind (m = V141 F5b goods
// matched to the sign: kettle corn, sunglasses, tube socks, hats/scarves, henna; g stays for ?fair141=0)
const STALL=[
 {k:'booth',w:5.2,c:0,g:'grill',peak:1},{k:'banner',w:3.4,c:2,g:'crepe'},{k:'tent',w:3.0,c:1,g:'drinks'},{k:'tent',w:3.0,c:5,g:'grill'},
 {k:'booth',w:4.6,c:1,g:'grill'},{k:'tent',w:3.0,c:0,g:'fry'},{k:'tent',w:3.0,c:3,g:'bags',m:'kettle'},{k:'booth',w:4.4,c:3,g:'steam'},
 {k:'tent',w:3.0,c:4,g:'fry'},{k:'tent',w:3.0,c:4,g:'grill'},{k:'tent',w:3.0,c:6,g:'drinks'},{k:'booth',w:4.2,c:5,g:'fruit',peak:1},
 {k:'tent',w:3.0,c:0,g:'racks',m:'shades'},{k:'banner',w:3.2,c:0,g:'piles',m:'socks'},{k:'tent',w:3.0,c:4,g:'racks',m:'scarves'},{k:'tent',w:3.0,c:0,g:'chairs',m:'henna'}];
// stall centres along the block (local z), in the gaps between the street trees of each kerb (urban-streets frontage stations)
const EAST=[32,50,68,86],WEST=[26,44,62,80],LANE=5.45,DEPTH=2.9,BAR=[19.5,92.5];
function tex(name){const t=new T.TextureLoader().load(A+name+'.webp?v=135t');t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
const CANVAS=[0xe8e6df,0x2a58a8,0xf2cf2a,0xc23a2e,0x2f7f45,0xe0782c,0x7b5aa8];
const GOODS=[0xc8402e,0x2f6fb8,0xe8c23a,0x3d8a4a,0xe2e0d8,0x2a2a2c,0xd77a2a,0x9a5bb0];
export function addFairMaterials(m){
 if(m.fairSign)return m;
 m.fairSign=new T.MeshStandardMaterial({map:tex('stalls'),roughness:.9,vertexColors:true});
 m.fairBarrier=new T.MeshStandardMaterial({map:tex('barrier'),roughness:.8,vertexColors:true});
 m.fairBlue=new T.MeshStandardMaterial({color:0x1f3f8c,roughness:.75,vertexColors:true});
 const cv=fair141On()?canvas141():{};CANVAS.forEach((c,i)=>{m['fairCv'+i]=new T.MeshStandardMaterial({color:c,roughness:.93,vertexColors:true,side:T.DoubleSide,...cv});if(cv.map)URBAN_TILE_SIZE['fairCv'+i]=1.1;});
 GOODS.forEach((c,i)=>m['fairGd'+i]=new T.MeshStandardMaterial({color:c,roughness:.8,vertexColors:true}));
 m.fairWood=new T.MeshStandardMaterial({color:0xe9e3d3,roughness:.88,vertexColors:true,...(fair141On()?plank141():{})});if(fair141On())URBAN_TILE_SIZE.fairWood=1.2;
 m.fairSteel=new T.MeshStandardMaterial({color:0x9a9ea2,roughness:.45,metalness:.55,vertexColors:true});
 m.fairDark=new T.MeshStandardMaterial({color:0x2a2b2d,roughness:.7,vertexColors:true});
 return m;
}
const UNIT=new T.BoxGeometry(1,1,1);
const H=(a,b=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return(h>>>0)/4294967296;};
function quad(b,key,p,uv,n,tone=1){const g=new T.BufferGeometry(),[u0,v0,u1,v1]=uv,ix=[0,1,2,0,2,3],U=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],pos=[],tx=[],nr=[];
 for(const i of ix){pos.push(...p[i]);tx.push(...U[i]);nr.push(...n);}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(tx,2));g.setAttribute('normal',new T.Float32BufferAttribute(nr,3));b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
const signUV=i=>{const c=i%4,r=i>>2,e=.5/1024;return[c/4+e,1-(r+1)/4+.5/512,(c+1)/4-e,1-r/4-.5/512];};
// sign i, width w, bottom edge y0, at local z, facing +z; plain canvas back
function sign(b,i,w,y0,z,back){const h=w*ASP[i],x=w/2;quad(b,'fairSign',[[-x,y0,z],[x,y0,z],[x,y0+h,z],[-x,y0+h,z]],signUV(i),[0,0,1]);
 quad(b,back,[[x,y0,z-.01],[-x,y0,z-.01],[-x,y0+h,z-.01],[x,y0+h,z-.01]],[0,0,1,1],[0,0,-1],.8);return h;}
function goods(b,kind,w,z,seed,top=.78){if(fair141On()&&isFood141(kind))return goods141(b,kind,w,z,seed,top);if(fair141On()&&isMerch141(kind))return goodsMerch141(b,kind,w,z,seed,top);const r=n=>H(seed,n);
 if(kind==='grill'){b.box('fairDark',-w*.18,top+.12,z-.05,w*.42,.24,.6);for(let i=0;i<7;i++)b.box('fairGd'+(i%2?6:0),-w*.36+i*w*.06,top+.255,z-.05+(r(i)-.5)*.3,.05,.04,.42,0,.9);
  b.cylinder('fairSteel',w*.2,top+.14,z,.16,.16,.28,10);b.cylinder('fairSteel',w*.32,top+.11,z+.05,.13,.13,.22,10);b.cylinder('fairGd3',-w*.4,.42,z-1.3,.18,.18,.84,10);}
 else if(kind==='steam'){for(let i=0;i<3;i++)for(let j=0;j<1+(i!==1);j++)b.cylinder('fairGd6',-w*.3+i*.55,top+.08+j*.16,z,.24,.24,.15,12,0,0,.8+j*.1);b.box('fairSteel',w*.2,top+.2,z,.9,.4,.5);}
 else if(kind==='drinks'){for(let i=0;i<9;i++)b.cylinder('fairGd'+[2,4,7][i%3],-w*.38+i*w*.07,top+.09,z+(i%2)*.15,.045,.045,.18,8);b.cylinder('fairSteel',w*.3,top+.25,z-.1,.22,.22,.5,12);b.box('fairGd1',-w*.3,.25,z-1.2,.7,.5,.45);}
 else if(kind==='fry'){b.box('fairSteel',-w*.15,top+.18,z-.05,w*.45,.36,.55);b.box('fairDark',-w*.15,top+.37,z-.05,w*.4,.02,.45);for(let i=0;i<5;i++)b.box('fairGd4',w*.15+i*.14,top+.03,z+.1,.11,.06,.11);b.box('fairGd0',w*.3,.3,z-1.1,.5,.6,.5);}
 else if(kind==='crepe'){for(const s of[-1,1])b.cylinder('fairDark',s*w*.2,top+.05,z-.05,.2,.2,.08,16);for(let i=0;i<4;i++)b.box('fairGd'+[1,2,0,7][i],w*.32+(i%2)*.18,top+.1,z+(i>>1)*.18-.1,.14,.2,.14);b.cylinder('fairSteel',-w*.42,top+.2,z,.1,.1,.4,8);}
 else if(kind==='fruit'){for(let i=0;i<6;i++){b.box('fairGd'+[2,6,3,2,6,3][i],-w*.36+i*w*.13,top+.06,z,w*.11,.12,.4,0,.85);for(let j=0;j<4;j++)b.cylinder('fairGd'+[2,6,3,2,6,3][i],-w*.36+i*w*.13+(j-1.5)*.08,top+.16,z+(j%2-.5)*.15,.04,.04,.07,6);}}
 else if(kind==='bags'){for(let i=0;i<10;i++)b.box('fairGd'+(i%3?4:0),-w*.4+i*w*.085,top+.15,z+(i%2)*.12,.16,.3,.1,(r(i)-.5)*.3);b.cylinder('fairDark',w*.3,.6,z-1.0,.45,.45,1.2,14);}
 else if(kind==='racks'){for(let i=0;i<14;i++)b.box('fairGd'+((seed+i)%8),-w*.42+i*w*.062,top+.03+(i%3)*.012,z+(i%2)*.18,.15,.04,.1,(r(i)-.5)*.5);
  for(const s of[-1,1])b.box('fairSteel',s*(w/2-.15),1.0,z-.9,.04,2.0,.04);b.box('fairSteel',0,1.95,z-.9,w-.3,.04,.04);for(let i=0;i<9;i++)b.box('fairGd'+((seed+i*3)%8),-w*.4+i*w*.1,1.55,z-.9,.06,.75,.32,0,.95);}
 else if(kind==='piles'){for(let i=0;i<6;i++)for(let j=0;j<2+(i%3);j++)b.box('fairGd'+((i*3+j)%8),-w*.38+i*w*.15,top+.03+j*.05,z+(r(i*5+j)-.5)*.2,w*.13,.045,.3,(r(i+j)-.5)*.2);}
 else if(kind==='chairs'){for(const s of[-1,1]){b.box('fairDark',s*.6,.45,z-1.0,.42,.05,.42);b.box('fairDark',s*.6,.7,z-1.2,.42,.5,.04);for(const q of[[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])b.box('fairSteel',s*.6+q[0],.22,z-1.0+q[1],.03,.44,.03);}
  for(let i=0;i<5;i++)b.cylinder('fairGd'+[6,0,3,2,1][i],-w*.3+i*.14,top+.06,z+.1,.035,.035,.12,6);}
}
function table(b,w,z,cv,seed=0){if(fair141On())return table141(b,w,z,seed,[cv,'fairGing141','fairGingB141'][seed%3]);b.box(cv,0,.39,z,w-.35,.78,.72,0,.95);b.box('fairWood',0,.79,z,w-.3,.03,.78,0,.9);}
// pop-up tent: four legs, pyramid roof, valance, sign hanging under the front valance
function tent(b,s,i,seed){const w=s.w,d=DEPTH,cv='fairCv'+s.c,hl=2.35;
 for(const[x,z]of[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]])b.box('fairSteel',x,hl/2,z,.05,hl,.05);
 const roof=new T.ConeGeometry(Math.SQRT1_2,1,4,1,true);roof.rotateY(Math.PI/4);if(fair141On())roof.deleteAttribute('uv');b.add(roof,cv,0,hl+.32,0,w*1.02,.64,d*1.02);roof.dispose();
 for(const[x,z,ww,dd]of[[0,d/2,w,.02],[0,-d/2,w,.02],[w/2,0,.02,d],[-w/2,0,.02,d]])b.box(cv,x,hl-.1,z,ww+.02,.22,dd+.02,0,.9);
 if(seed%3)b.box(cv,0,hl/2+.1,-d/2+.02,w,hl-.2,.02,0,.8);   // back wall on two of three
 const sw=w-.1,sh=sw*ASP[i];sign(b,i,sw,hl-.2-sh,d/2+.03,cv);table(b,w,d/2-.55,'fairCv'+((s.c+3)%7),seed);goods(b,fair141On()&&s.m||s.g,w,d/2-.55,seed);dress(b,w,d,hl,seed);b.solid(0,0,w,d);}
// tent with a tall banner on two poles above the front (the Crêpes / Smoothies stand)
function banner(b,s,i,seed){const w=s.w,d=DEPTH,cv='fairCv'+s.c,hl=2.35;
 for(const[x,z]of[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]])b.box('fairSteel',x,hl/2,z,.05,hl,.05);
 const roof=new T.ConeGeometry(Math.SQRT1_2,1,4,1,true);roof.rotateY(Math.PI/4);if(fair141On())roof.deleteAttribute('uv');b.add(roof,cv,0,hl+.3,0,w*1.02,.6,d*1.02);roof.dispose();
 for(const[x,z,ww,dd]of[[0,d/2,w,.02],[0,-d/2,w,.02],[w/2,0,.02,d],[-w/2,0,.02,d]])b.box(cv,x,hl-.1,z,ww+.02,.22,dd+.02,0,.9);
 const bw=w*.95,bh=bw*ASP[i],y0=hl+.75;for(const x of[-bw/2-.03,bw/2+.03])b.box('fairSteel',x,(y0+bh+.1)/2,d/2+.08,.05,y0+bh+.1,.05);
 sign(b,i,bw,y0,d/2+.08,cv);table(b,w,d/2-.55,'fairCv'+((s.c+4)%7),seed);goods(b,fair141On()&&s.m||s.g,w,d/2-.55,seed);dress(b,w,d,hl,seed);b.solid(0,0,w,d);}
// V141 F5b: ring sandbags on the four leg feet; bulb string along the front eave on 2 of 3 stalls
function dress(b,w,d,hl,seed){if(!fair141On())return;sandbags141(b,w,d,seed);if(seed%3!==1)lights141(b,-w/2,w/2,hl+.0,d/2+.045,seed,3,.12);}
// wooden food booth: counter, back/side walls, front posts, roof (flat or gabled), sign band above the opening
function booth(b,s,i,seed){const w=s.w,d=DEPTH-.3,cv='fairCv'+s.c,hc=1.05,hw=2.3;
 b.box('fairWood',0,hc/2,d/2-.25,w,hc,.5);b.box(cv,0,hc+.02,d/2-.2,w+.1,.04,.66,0,.9);
 b.box('fairWood',0,hw/2,-d/2+.04,w,hw,.08,0,.92);for(const x of[-w/2+.04,w/2-.04])b.box('fairWood',x,hw/2,0,.08,hw,d,0,.88);
 for(const x of[-w/2+.06,w/2-.06])b.box('fairWood',x,hw/2,d/2-.04,.1,hw,.1);b.box('fairWood',0,hw+.04,0,w+.1,.08,d+.1,0,.9);
 const sh=w*ASP[i];sign(b,i,w,hw+.08,d/2+.06,'fairWood');
 if(s.peak){const run=(d+.5)/2;for(const sz of[-1,1])b.add(UNIT,cv,0,hw+.08+sh+.22,sz*run/2,w+.4,.06,run*1.08,0,sz*.42,0);
  b.box('fairWood',0,hw+.08+sh/2,-d/2+.04,w,sh,.06,0,.85);}
 else b.box(cv,0,hw+.1+sh+.04,0,w+.3,.08,d+.4,0,.95);
 b.box('fairGd5',0,hw+.08+sh+.02,d/2+.06,w,.04,.04);
 goods(b,fair141On()&&s.m||s.g,w,d/2-.4,seed,hc+.04);b.box('fairDark',0,.9,d/2-.9,w-.3,.06,.5,0,.8);b.box('fairGd4',w*.3,.25,-d/2+.5,.6,.5,.4,0,.9);if(fair141On()&&seed%3!==1)lights141(b,-w/2+.06,w/2-.06,hw-.03,d/2+.03,seed,3,.16);b.solid(0,0,w,d);}
// NYPD-style blue sawhorse: textured rail board on two A-frame legs
function sawhorse(b,x,z,ry){b.push(x,0,z,ry);const L=2.4,y0=.82,h=.28,t=.05;
 quad(b,'fairBarrier',[[-L/2,y0,t/2],[L/2,y0,t/2],[L/2,y0+h,t/2],[-L/2,y0+h,t/2]],[0,0,1,1],[0,0,1]);
 quad(b,'fairBarrier',[[L/2,y0,-t/2],[-L/2,y0,-t/2],[-L/2,y0+h,-t/2],[L/2,y0+h,-t/2]],[0,0,1,1],[0,0,-1]);
 b.box('fairBlue',0,y0+h+.01,0,L,.02,t);b.box('fairBlue',0,y0-.01,0,L,.02,t);
 for(const sx of[-1,1])for(const sz of[-1,1])b.add(UNIT,'fairBlue',sx*(L/2-.25),.48,sz*.22,.07,1.0,.06,0,-sz*.45,0);
 b.pop();}
export function* soho135FairTask(b,plan,lod){
 addFairMaterials(b.mats);const base=plan.iz===0?0:8,seed=(plan.seed>>>0)||1;
 for(const z of BAR){for(const[k,x]of[-6.1,-3.4,0,3.4,6.1].entries()){sawhorse(b,x,z,(H(seed,k+z)-.5)*.12);}
  for(const x of[-4.75,4.75])b.solid(x,z,5.2,.6);b.solid(0,z,1.4,.6);}
 yield;
 // east lane (block side, x > 0) faces west; west lane faces east
 const slots=[...EAST.map(z=>[LANE,z,-Math.PI/2]),...WEST.map(z=>[-LANE,z,Math.PI/2])];
 for(let n=0;n<slots.length;n++){const i=base+n,s=STALL[i],[x,z,ry]=slots[n];b.push(x,0,z+(H(seed,n)-.5)*2,ry);
  if(lod){const cv='fairCv'+s.c;b.box(cv,0,1.4,0,s.w,2.8,DEPTH*.9,0,.9);sign(b,i,s.w,2.35-s.w*ASP[i],DEPTH/2+.03,cv);b.solid(0,0,s.w,DEPTH);}
  else(s.k==='booth'?booth:s.k==='banner'?banner:tent)(b,s,i,seed+n*97);
  b.pop();yield;}
}
