// V131m L11 street entrances of the subway, rebuilt (user 2026-10-17 20:48: untextured brown balustrade triangles, a white
// untextured shaft, floating globe lamps, clutter poking through the shaft walls, an air wall at the bottom of the stair).
// Everything a player sees from the street is now lit + textured (CC0 ambientCG materials, low-fi: tools/subway131_assets.py
// -> assets/l11-v131m), every lamp stands on a post, pedestal or balustrade, and the opening is only as long as a real one:
// the first OPEN metres of the stair are open to the sky behind parapets / railings, the rest runs on under a sidewalk slab
// (headwall + soffit), so the escalator barrel and the torcheres stay inside the shaft. Styles:
//  ny   green cast-iron railings with pickets on a granite plinth, green globes on the entrance posts, cream subway tile;
//  mos  red granite parapets with grey coping, white ball lamps on granite pedestals, white marble shaft, granite steps;
//  tube / cut  black iron railings on a plinth, white tile, roundel post.
// Colliders: above ground only the parapets / railings around the open part; underground (stairSolids) the two shaft walls
// and the escalator's centre balustrade. Nothing sits across the bottom of the stair any more.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {SUB as S} from './subway128-layout.js?v=128';
const A=new URL('./assets/l11-v131m/',import.meta.url).href,loader=new T.TextureLoader();
export const ENTRANCE_OPEN=6.3;   // open length of the stair (depth there 3.6 m, 3.3 m headroom under the slab edge)
function tex(name,srgb=true){const t=loader.load(A+name+'.webp?v=131');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;return t;}
const MATS=[['e131TileNy','ny_tile',1.2,.55],['e131TileLon','lon_tile',1.2,.5],['e131Marble','mos_marble',1.6,.35],['e131GraniteRed','granite_red',1.0,.75],
 ['e131GraniteGrey','granite_grey',1.0,.8],['e131Step','step_conc',1.2,.9],['e131IronGreen','iron_green',.8,.55],['e131IronBlack','iron_black',.8,.5],['e131Bronze','bronze',.8,.45]];
export function addEntrance131Materials(m){
 if(m.e131Step)return m;
 for(const[key,file,tile,rough]of MATS){const mat=new T.MeshStandardMaterial({map:tex(file),normalMap:tex(file+'-n',false),normalScale:new T.Vector2(.8,.8),roughness:rough,metalness:key.startsWith('e131Iron')||key==='e131Bronze'?.35:0,vertexColors:true,side:T.DoubleSide});mat.name='V131 entrance '+key;m[key]=mat;URBAN_TILE_SIZE[key]=tile;}
 m.e131Nose=new T.MeshStandardMaterial({map:tex('nosing'),roughness:.6,metalness:.4,vertexColors:true});m.e131Nose.name='V131 entrance nosing';
 m.e131Glow=new T.MeshBasicMaterial({color:0xfff4dc,vertexColors:true});m.e131Glow.name='V131 globe (lit)';
 m.e131GreenGlow=new T.MeshBasicMaterial({color:0x8ff5a8,vertexColors:true});m.e131GreenGlow.name='V131 green globe (lit)';
 if(m.s129Esc){const e=m.s129Esc;m.e131Esc=new T.MeshStandardMaterial({map:e.map,roughness:.5,metalness:.4,vertexColors:true});m.e131Esc.name='V131 escalator treads (lit)';}
 return m;
}
const STYLE={
 ny:{wall:'e131TileNy',step:'e131Step',iron:'e131IronGreen',plinth:'e131GraniteGrey',globe:'e131GreenGlow',parapet:false,bal:'e131IronGreen'},
 mos:{wall:'e131Marble',step:'e131GraniteGrey',iron:'e131Bronze',plinth:'e131GraniteRed',globe:'e131Glow',parapet:true,bal:'e131Bronze'},
 tube:{wall:'e131TileLon',step:'e131Step',iron:'e131IronBlack',plinth:'e131GraniteGrey',globe:'e131Glow',parapet:false,bal:'e131IronBlack'},
 cut:{wall:'e131TileLon',step:'e131Step',iron:'e131IronBlack',plinth:'e131GraniteGrey',globe:'e131Glow',parapet:false,bal:'e131IronBlack'}};
function geo(b,key,p,uv,tone=1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// sloped prism along u (balustrade): cross-section half-width hw, bottom/top heights follow the stair line
function prism(b,key,v,hw,ua,ub,ya,yb,h,t=.5){const L=ub-ua,P=[],U=[];const q=(a,c,d,e,uv)=>{P.push(...a,...c,...d,...a,...d,...e);U.push(uv[0],uv[1],uv[2],uv[1],uv[2],uv[3],uv[0],uv[1],uv[2],uv[3],uv[0],uv[3]);};
 for(const s of[-1,1]){const x=v+s*hw;q([x,ya,ua],[x,yb,ub],[x,yb+h,ub],[x,ya+h,ua],[0,0,L*t,h*t]);}
 q([v-hw,ya+h,ua],[v-hw,yb+h,ub],[v+hw,yb+h,ub],[v+hw,ya+h,ua],[0,0,L*t,2*hw*t]);
 for(const[u,y]of[[ua,ya],[ub,yb]])q([v-hw,y,u],[v+hw,y,u],[v+hw,y+h,u],[v-hw,y+h,u],[0,0,2*hw*t,h*t]);geo(b,key,P,U);}
// vertical wall facing along v (cladding) whose bottom follows the stair: quad strip u ua..ub, from yBot(u) to yTop
function clad(b,key,v,ua,ub,yBot,yTop,tile,n=6){const P=[],U=[];for(let i=0;i<n;i++){const a=ua+(ub-ua)*i/n,c=ua+(ub-ua)*(i+1)/n,ya=yBot(a),yc=yBot(c);
 P.push(v,ya,a,v,yc,c,v,yTop,c,v,ya,a,v,yTop,c,v,yTop,a);U.push(a/tile,ya/tile,c/tile,yc/tile,c/tile,yTop/tile,a/tile,ya/tile,c/tile,yTop/tile,a/tile,yTop/tile);}geo(b,key,P,U);}
function lampPost(b,st,v,u,base,height){const k=st.iron;b.box(k,v,base+.12,u,.26,.24,.26);b.cylinder(k,v,base+height/2+.12,u,.05,.07,height-.1,8);b.cylinder(k,v,base+height+.1,u,.12,.08,.1,8);b.sphere(st.globe,v,base+height+.36,u,.21,.23,.21);b.cylinder(k,v,base+height+.6,u,.05,.1,.06,8);}
// railing between two points along u at fixed v (plinth + rails + pickets); returns nothing, colliders added by the caller
function railing(b,st,v,ua,ub,top,lod,alongV=false){const k=st.iron,L=Math.abs(ub-ua),m=(ua+ub)/2;
 const box=(key,a,y,c,w,h,d)=>alongV?b.box(key,c,y,a,d,h,w):b.box(key,a,y,c,w,h,d);
 // in the along-u case 'a' is v and 'c' is u; alongV swaps (rail running across the stair at fixed u=v param)
 box(st.plinth,v,top+.12,m,.3,.24,L+.3);box(k,v,top+1.05,m,.07,.06,L+.1);box(k,v,top+.36,m,.05,.04,L);
 const posts=Math.max(1,Math.round(L/1.6));for(let i=0;i<=posts;i++){const u=Math.min(ua,ub)+L*i/posts;box(k,v,top+.6,u,.08,.96,.08);}
 if(!lod)for(let u=Math.min(ua,ub)+.14;u<Math.max(ua,ub)-.07;u+=.14)box(k,v,top+.7,u,.022,.66,.022);}
function parapet(b,st,v,ua,ub,top,alongV=false){const L=Math.abs(ub-ua),m=(ua+ub)/2;const box=(key,a,y,c,w,h,d)=>alongV?b.box(key,c,y,a,d,h,w):b.box(key,a,y,c,w,h,d);
 box(st.plinth,v,top+.5,m,.32,1.0,L);box('e131GraniteGrey',v,top+1.04,m,.42,.08,L+.1);box('e131GraniteGrey',v,top+.04,m,.38,.08,L+.06);}
function ballLamp(b,st,v,u,base){b.box('e131GraniteGrey',v,base+.25,u,.36,.5,.36);b.box('e131GraniteGrey',v,base+.53,u,.42,.06,.42);b.cylinder('e131Bronze',v,base+.8,u,.04,.06,.5,8);b.cylinder('e131Bronze',v,base+1.06,u,.1,.05,.06,8);b.sphere('e131Glow',v,base+1.3,u,.22,.24,.22);}
export function entrance131(b,sp,{v0,v1,u0,u1,top,lod,sv,stairSolids,underKey,underStep,signQuad}){
 addEntrance131Materials(b.mats);
 const st=STYLE[sp.style]||STYLE.ny,esc=sp.entrance==='escalator',L=u1-u0,drop=top-S.plat,vc=(v0+v1)/2,W=v1-v0,uo=u0+ENTRANCE_OPEN;
 const yAt=u=>top-(u-u0)/L*drop,n=Math.round(L/S.run);
 // ---- steps: open part lit (with anti-slip nosings), covered part keeps the underground material
 for(let k=0;k<n;k++){const y=top-S.rise*(k+1),u=u0+S.run*k;
  if(u<uo+.6){b.box(esc?(b.mats.e131Esc?'e131Esc':underStep):st.step,vc,y-.2,u+S.run/2,W,.4,S.run,0,1);if(!esc)b.box('e131Nose',vc,y+.005,u+S.run-.045,W-.06,.012,.09);
   b.box(underStep,vc,(y-.4+S.plat-.2)/2,u+S.run/2,W,Math.max(.01,y-.4-S.plat+.2),S.run,0,1.25);}
  else b.box(underStep,vc,(y+S.plat-.2)/2,u+S.run/2,W,y-S.plat+.2,S.run,0,1.25);}
 // ---- shaft cladding (lit) over the open part, both sides, + headwall fascia and the slab soffit
 for(const v of[v0+.006,v1-.006])clad(b,st.wall,v,u0,uo+.02,u=>yAt(u)-.3,top-.002,URBAN_TILE_SIZE[st.wall]);
 // sidewalk slab over the covered part (walkable above ground), fascia + soffit in the shaft finish
 const cu0=uo,cu1=u1+.6,cl=cu1-cu0;b.box('sidewalk',vc,top-.225,(cu0+cu1)/2,W,.45,cl);b.walk(vc,(cu0+cu1)/2,W,cl,top);
 {const t=URBAN_TILE_SIZE[st.wall];geo(b,st.wall,[v0,top-.55,cu0-.01,v1,top-.55,cu0-.01,v1,top-.002,cu0-.01,v0,top-.55,cu0-.01,v1,top-.002,cu0-.01,v0,top-.002,cu0-.01],[v0/t,0,v1/t,0,v1/t,.55/t,v0/t,0,v1/t,.55/t,v0/t,.55/t]);
  geo(b,underKey,[v0,top-.452,cu0,v1,top-.452,cu0,v1,top-.452,cu1,v0,top-.452,cu0,v1,top-.452,cu1,v0,top-.452,cu1],[0,0,W/3,0,W/3,cl/3,0,0,W/3,cl/3,0,cl/3]);
  b.box(st.wall,vc,top-.5,cu0+.06,W,.1,.12);}
 // ---- street enclosure around the open part: parapets (mos) or railings on a plinth; colliders above ground only
 const sides=[v0-.16,v1+.16];
 if(st.parapet){for(const v of sides)parapet(b,st,v,u0,uo+.32,top);parapet(b,st,uo+.16,v0-.32,v1+.32,top,true);}
 else{for(const v of sides)railing(b,st,v,u0,uo+.3,top,lod);railing(b,st,uo+.15,v0-.16,v1+.16,top,lod,true);}
 for(const v of sides)b.solid(v,(u0+uo+.3)/2,.34,ENTRANCE_OPEN+.3);b.solid(vc,uo+.16,W+.64,.34);
 // ---- entrance posts + name board (lit iron, grounded), lamps on posts / pedestals
 for(const v of sides){b.box(st.iron,v,top+1.5,u0-.12,.14,3.0,.14);b.box(st.iron,v,top+.08,u0-.12,.3,.16,.3);}
 b.box(st.iron,vc,top+2.33,u0-.12,W+.46,.08,.12);b.box(st.iron,vc,top+2.97,u0-.12,W+.46,.08,.12);signQuad(top+2.37,top+2.93,u0-.2);
 if(sp.style==='ny')for(const v of sides){b.cylinder(st.iron,v,top+3.08,u0-.12,.1,.08,.1,8);b.sphere(st.globe,v,top+3.36,u0-.12,.21,.23,.21);b.cylinder(st.iron,v,top+3.6,u0-.12,.05,.1,.06,8);}
 if(st.parapet&&!lod){for(const v of sides){ballLamp(b,st,v,uo+.16,top+1.08);}}
 // style marker post on the pavement beside the opening (M / roundel), 0.6 m outside the parapet line
 if(sp.style!=='ny'){const vo=sv>0?v1:v0,v=vo+sv*.75;b.box(st.iron,v,top+.08,u0+.4,.3,.16,.3);b.cylinder(st.iron,v,top+1.6,u0+.4,.05,.06,3.0,8);b.solid(v,u0+.4,.3,.3);}
 // ---- escalator: balustrade prisms with textured skirt + handrail, torcheres on the centre deck under the slab only
 if(esc){const yb=u=>yAt(u)+.02;
  for(const[v,hw]of[[v0+.1,.1],[vc,.17],[v1-.1,.1]]){const kOpen=st.bal;prism(b,kOpen,v,hw,u0,Math.min(uo+.6,u1),yb(u0),yb(Math.min(uo+.6,u1)),.95);if(uo+.6<u1)prism(b,underKey,v,hw,uo+.6,u1,yb(uo+.6),yb(u1),.95);
   b.rod('e131IronBlack',[v,yb(u0)+1.0,u0],[v,yb(u1)+1.0,u1],.045);}
  // centre balustrade blocks the walk: two lanes
  b.solid(vc,(u0+u1)/2,.34,L);stairSolids.push(b.colliders.pop());b.solid(vc,(u0+uo)/2,.34,ENTRANCE_OPEN);
  if(sp.style==='mos'&&!lod)for(let u=uo+1.6;u<u1-1;u+=2.6){const y=yb(u)+.97;b.cylinder('e131Bronze',vc,y+.04,u,.12,.15,.08,8);b.cylinder('e131Bronze',vc,y+.6,u,.035,.05,1.1,6);b.sphere('e131Glow',vc,y+1.3,u,.15,.2,.15);}
  // ribbed barrel only under the slab and above the station ceiling, radius = half the shaft (sits on the walls)
  const r=W/2-.02,key=sp.style==='mos'?'s129Vault':sp.style==='tube'?'s129LonTile':'s129Brick';
  if(b.mats[key])for(let ua=uo+.8;ua<u1;ua+=L*.04){const ub=Math.min(u1,ua+L*.04),ya=yAt(ua)+2.3,yb2=yAt(ub)+2.3;if(ya+r>top-.47||yAt(ub)<S.ceil-.2)continue;
   const p=[],uv=[];for(let i=0;i<8;i++){const t0=Math.PI*i/8,t1=Math.PI*(i+1)/8,Pa=[vc+r*Math.cos(t0),r*Math.sin(t0)],Pc=[vc+r*Math.cos(t1),r*Math.sin(t1)];
    p.push(Pa[0],ya+Pa[1],ua,Pc[0],ya+Pc[1],ua,Pc[0],yb2+Pc[1],ub,Pa[0],ya+Pa[1],ua,Pc[0],yb2+Pc[1],ub,Pa[0],yb2+Pa[1],ub);uv.push(i/4,ua/2,(i+1)/4,ua/2,(i+1)/4,ub/2,i/4,ua/2,(i+1)/4,ub/2,i/4,ub/2);}
   geo(b,key,p,uv);}
 }
}
