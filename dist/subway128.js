// V128 L11 subway + underground canal (EN wiki Level 11: subways follow the roads above and intertwine at junctions; canals
// "go underground for several periods of time, connecting to subways, sewers and maintenance passageways in fashions
// non-standard to Earth architecture"). Built per city block next to the streets (exit-scene buildBlock):
// - tunnels under every road line (block owns its west + south line and the south-west junction chamber), double track,
//   walkway ledge, ceiling lamps every 10 m (city-aligned so segments of neighbouring blocks line up);
// - stations (hashed) with tiled walls, side platforms, pillars, name boards, and a stair from the sidewalk above;
// - buried canal blocks: a brick culvert (water, grated catwalk, sewer side passages);
// - where a tunnel line crosses a buried canal: the culvert pours down one tunnel wall as a sheet, crosses under the rails in a
//   trench (or under grated platform bridges in a station) and climbs back UP the opposite wall into the next culvert;
// - where a tunnel line passes under an open canal: a glass ceiling with the canal water above.
// Underground surfaces are unlit by the sky: MeshBasic + a shader light term from the lamp rhythm (cheap, no real lights).
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {UrbanBatch} from './urban-batch.js?v=69';
import {CITY_ORIGIN,CITY_ANGLE} from './urban-layout.js?v=60';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
import {SUB,subwayBlock,subwayStairs} from './subway128-layout.js?v=128';
import {CANAL} from './canal128-layout.js?v=128';
import {stationSpec,station129,addSubway129Materials,entrance129,stepKey,shaftKey,signKey,cellUV} from './subway129-styles.js?v=129';
const A=new URL('./assets/l11-v128/',import.meta.url).href,B=112,S=SUB;
function tex(name,srgb=true){const t=new T.TextureLoader().load(A+name+'.webp?v=128');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const clock={value:0},ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
const LIGHT=`{vec2 d0=vSP.xz-vec2(${CITY_ORIGIN.x.toFixed(4)},(${CITY_ORIGIN.z.toFixed(4)}));vec2 c=vec2((${ca.toFixed(6)})*d0.x-(${sa.toFixed(6)})*d0.y,(${sa.toFixed(6)})*d0.x+(${ca.toFixed(6)})*d0.y);
 float lx=mod(c.x,112.),lz=mod(c.y,112.),dX=min(lx,112.-lx),dZ=min(lz,112.-lz);float al=dX<dZ?c.y:c.x;if(lz>36.&&lz<74.&&dX>6.)al=c.x;
 float d=abs(mod(al,10.)-5.);float hy=clamp((vSP.y-(${(Y+S.bed).toFixed(3)}))/6.,0.,1.);
 float L=.07+1.05*exp(-d*d/5.)*(.5+.5*hy)+.22*exp(-d*d/30.);diffuseColor.rgb*=L;}`;
function ul(m,key,opts={}){const mat=new T.MeshBasicMaterial({vertexColors:true,...opts});mat.name='V128 underground '+key;
 mat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSP;').replace('#include <project_vertex>','#include <project_vertex>\nvSP=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSP;').replace('#include <color_fragment>','#include <color_fragment>\n'+LIGHT);};
 mat.customProgramCacheKey=()=>'v128ul'+(opts.map?'m':'');m[key]=mat;return mat;}
function flowMat(m,key,{dir=1,color=0xc8d6d4,opacity=.78,deep=false}={}){const mat=new T.MeshBasicMaterial({color,transparent:true,opacity,side:T.DoubleSide,depthWrite:false,vertexColors:true});mat.name='V128 flow '+key;
 mat.onBeforeCompile=s=>{s.uniforms.uT=clock;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vFU;varying vec3 vSP;').replace('#include <project_vertex>','#include <project_vertex>\nvFU=uv;vSP=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vFU;varying vec3 vSP;uniform float uT;float hh(float n){return fract(sin(n*91.7)*43758.5);}').replace('#include <color_fragment>',`#include <color_fragment>
 ${deep?`{float r=sin(vSP.x*1.3+uT*1.7)*sin(vSP.z*1.1-uT*1.3)+.5*sin((vSP.x+vSP.z)*2.7+uT*2.3);diffuseColor.rgb*=.75+.25*r;}`:
 `{float x=vFU.x*260.;float c0=floor(x),f=fract(x);float a0=hh(c0),a1=hh(c0+1.);float sp=.7+.5*mix(a0,a1,f);float s=fract(vFU.y*2.2${dir>0?'+':'-'}uT*sp*.55+mix(a0,a1,smoothstep(0.,1.,f))*3.);float st=smoothstep(.0,.35,s)*smoothstep(1.,.45,s);float lip=smoothstep(.86,1.,vFU.y)+smoothstep(.1,0.,vFU.y);diffuseColor.rgb*=.62+.5*st+.35*lip;diffuseColor.a=min(1.,diffuseColor.a*(.7+.3*st)+.25*lip);}`}`);};
 mat.onBeforeRender=()=>{clock.value=performance.now()*.001;};mat.customProgramCacheKey=()=>'v128flow'+dir+(deep?'d':'');m[key]=mat;return mat;}
let signTex=null;
const NAMES=['运河町 · CANAL-MACHI','第十一街 · 11TH ST','希望街 · HOPE ST','回廊 · ARCADE','闸口 · LOCK GATE','无尽 · ENDLESS','中央 · CENTRAL','北水门 · NORTH SLUICE','玻璃塔 · GLASS TOWER','旧仓库 · DEPOT','第二桥 · 2ND BRIDGE','下水道 · CULVERT','市场 · MARKET','白塔 · WHITE TOWER','雾港 · FOG HARBOUR','终点 · TERMINUS'];
function signTexture(){if(signTex)return signTex;const c=document.createElement('canvas');c.width=512;c.height=1024;const g=c.getContext('2d');
 for(let i=0;i<16;i++){const y=i*64;g.fillStyle='#e9e6d8';g.fillRect(0,y,512,64);g.fillStyle='#1f6b4f';g.fillRect(0,y,512,9);g.fillRect(0,y+55,512,9);g.fillStyle='#1d2124';g.font='bold 26px "Noto Sans CJK SC","Microsoft YaHei",sans-serif';g.textBaseline='middle';const[a,b2]=NAMES[i].split(' · ');g.fillText(a,18,y+25);g.font='bold 15px Arial,sans-serif';g.fillText(b2,20,y+45);g.fillStyle='#1f6b4f';g.beginPath();g.arc(470,y+32,18,0,7);g.fill();g.fillStyle='#fff';g.font='bold 20px Arial';g.fillText('M',461,y+33);}
 // low-fi: tiny canvas upscaled by the GPU
 const s=document.createElement('canvas');s.width=128;s.height=256;s.getContext('2d').drawImage(c,0,0,128,256);signTex=new T.CanvasTexture(s);signTex.colorSpace=T.SRGBColorSpace;signTex.magFilter=T.NearestFilter;return signTex;}
export function addSubway128Materials(m){
 if(m.s128Tunnel)return m;
 for(const[key,file,tile]of[['s128Tunnel','tunnel',4],['s128Ballast','ballast',3],['s128Plat','platform',3],['s128Tile','subtile',3.2],['s128Sewer','sewer',3],['s128Grate','grate',1.6],['s128Steps','steps',1.2]]){ul(m,key,{map:tex(file)});URBAN_TILE_SIZE[key]=tile;}
 ul(m,'s128Girder',{map:tex('bridge')});URBAN_TILE_SIZE.s128Girder=2.9;
 ul(m,'s128Rail',{color:0x6d6a66});ul(m,'s128Dark',{color:0x16191a});ul(m,'s128Edge',{color:0xd8b73a});ul(m,'s128Pillar',{color:0xcfcbbd});
 m.s128Lamp=new T.MeshBasicMaterial({color:0xfff3d6,vertexColors:true});m.s128Black=new T.MeshBasicMaterial({color:0x020303});
 flowMat(m,'s128FallDown',{dir:1,color:0x9db3b6,opacity:.8});flowMat(m,'s128Foam',{deep:true,color:0xb9c7c4,opacity:.8});flowMat(m,'s128FallUp',{dir:-1,color:0x9db3b6,opacity:.8});flowMat(m,'s128WaterU',{deep:true,color:0x1d3a40,opacity:.95});flowMat(m,'s128Glass',{deep:true,color:0x2e6f86,opacity:.9});
 {const mat=new T.MeshBasicMaterial({map:null,vertexColors:true});mat.name='V128 station boards';m.s128Sign=mat;try{mat.map=signTexture();}catch(e){mat.color.set(0xe9e6d8);}}
 addSubway129Materials(m,LIGHT);
 return m;
}
const quad=(b,key,pts,uv=[[0,0],[1,0],[1,1],[0,1]])=>{const g=new T.BufferGeometry(),p=[],u=[];for(const i of[0,1,2,0,2,3]){p.push(...pts[i]);u.push(...uv[i]);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();};
// --------------------------------------------------------------------------------------------- a line segment (frame: u along +z, v across x)
function* segment(b,s,{u0,u1,station,canal,glass,name,stairV,lod,ox,oz,alongSign,spec=null}){
 const h=station?S.stHalf:S.half,bed=S.bed,ceil=S.ceil,cx0=CANAL.z0,cx1=CANAL.z1,X0=canal?cx0-2:1e9,X1=canal?cx1+8:-1e9;
 const pieces=(a,c,skip0,skip1)=>skip1<=a||skip0>=c?[[a,c]]:[[a,Math.max(a,skip0)],[Math.min(c,skip1),c]].filter(q=>q[1]-q[0]>.01);
 const st0=station?S.st0:1e9,st1=station?S.st1:-1e9;
 // --- floors / trackbed
 for(const[a,c]of pieces(u0,u1,canal?cx0:1e9,canal?cx1:-1e9)){b.box('s128Ballast',0,bed-.15,(a+c)/2,10,.3,c-a);b.walk(0,(a+c)/2,10,c-a,bed);
  for(const[e,f]of[[a,Math.min(c,st0)],[Math.max(a,st1),c]])if(f-e>.01){for(const sv of[-1,1]){b.box('s128Tunnel',sv*4.55,bed+.4,(e+f)/2,.9,.8,f-e);b.walk(sv*4.55,(e+f)/2,.9,f-e,bed+.8);}}
  const p0=Math.max(a,st0),p1=Math.min(c,st1);if(p1-p0>.01&&!spec)for(const sv of[-1,1]){b.box('s128Plat',sv*7.75,(bed+S.plat)/2-.1,(p0+p1)/2,5.5,S.plat-bed+.2,p1-p0,0,1.5);b.box('s128Edge',sv*5.2,S.plat+.005,(p0+p1)/2,.4,.012,p1-p0,0,1.5);b.walk(sv*7.75,(p0+p1)/2,5.5,p1-p0,S.plat);}
  yield 0;}
 // rails (continuous; over the canal trench they ride a girder viaduct)
 for(const[ra,rc]of(spec&&spec.island?[[u0,st0],[st1,u1]]:[[u0,u1]]))for(const tv of[-2.2,2.2])for(const rv of[-.72,.72])b.box('s128Rail',tv+rv,bed+.08,(ra+rc)/2,.08,.16,rc-ra);
 // --- walls (with the canal openings, station widening)
 const wall=(sv,a,c,hw,key,tone=1)=>{if(c-a<.01)return;b.box(key,sv*(hw+.3),(bed+ceil)/2,(a+c)/2,.6,ceil-bed+.6,c-a,0,tone);b.solid(sv*(hw+.3),(a+c)/2,.6,c-a);};
 for(const sv of[-1,1]){
  const cuts=[];if(canal)cuts.push([cx0,cx1]);if(station&&stairV&&Math.sign(stairV)===sv){}
  const segs=[];let a=u0;for(const[e,f]of[[st0,st1]]){if(e<u1&&f>u0){segs.push([a,Math.max(a,e),S.half,'s128Tunnel']);segs.push([Math.max(a,e),Math.min(u1,f),S.stHalf,'s128Tile']);a=Math.min(u1,f);}}segs.push([a,u1,S.half,'s128Tunnel']);
  for(const[e,f,hw,key]of segs){if(spec&&key==='s128Tile')continue;for(const[p,q]of pieces(e,f,canal?cx0:1e9,canal?cx1:-1e9))wall(sv,p,q,hw,key,key==='s128Tile'?1.45:1);}
  // station end walls (between the 5 m tunnel and the 11 m hall)
  if(station&&!spec)for(const u of[st0,st1])if(u>u0&&u<u1){b.box('s128Tile',sv*8.3,(bed+ceil)/2,u,5.4,ceil-bed+.6,.6,0,1.3);b.solid(sv*8.3,u,5.4,.6);}
 }
 // --- ceiling (holes: stair shaft, canal glass / tall crossing chamber)
 const H=station?S.stHalf:S.half;
 const ceilPieces=[];for(const[a,c]of pieces(u0,u1,canal?(glass?cx0:X0):1e9,canal?(glass?cx1:X1):-1e9))ceilPieces.push([a,c]);
 for(const[a,c]of ceilPieces){
  // station ceiling spans the hall; tunnel ceiling 5 m
  for(const[e,f,hw]of[[a,Math.min(c,st0),S.half],[Math.max(a,st0),Math.min(c,st1),S.stHalf],[Math.max(a,st1),c,S.half]]){if(f-e<.01)continue;if(spec&&hw===S.stHalf)continue;
   if(stairV&&hw===S.stHalf){const sz0=S.stair0,sz1=S.stair0+S.stairLen,v0=Math.min(stairV*S.stairX0,stairV*S.stairX1),v1=Math.max(stairV*S.stairX0,stairV*S.stairX1);
    b.box('s128Tunnel',(-hw-.6+v0)/2,ceil+.2,(e+f)/2,v0+hw+.6,.4,f-e,0,1.2);b.box('s128Tunnel',(v1+hw+.6)/2,ceil+.2,(e+f)/2,hw+.6-v1,.4,f-e,0,1.2);
    for(const[g0,g1]of pieces(e,f,sz0,sz1))b.box('s128Tunnel',(v0+v1)/2,ceil+.2,(g0+g1)/2,v1-v0,.4,g1-g0,0,1.2);}
   else b.box('s128Tunnel',0,ceil+.2,(e+f)/2,2*hw+1.2,.4,f-e,0,hw===S.stHalf?1.2:1);}}
 // --- lamps every 10 m, aligned to the city (u coordinate maps to city along = alongSign*u + ox)
 if(!lod){const first=((5-(ox%10))%10+10)%10;for(let k=first;k<u1;k+=10){if(k<u0)continue;const u=alongSign>0?k:k;for(const sv of[-1,1]){const hw=(u>=st0&&u<=st1)?S.stHalf:S.half;if(canal&&u>cx0-1&&u<cx1+1)continue;if(spec&&u>=st0&&u<=st1)continue;b.box('s128Lamp',sv*(hw-.2),ceil-.12,u,.18,.08,1.2);}}}
 // --- station dressing: pillars, boards, benches
 if(spec)yield* station129(b,spec,{st0,st1,wallSkip:canal?[cx0,cx1]:null,ceilSkip:canal?(glass?[cx0,cx1]:[X0,X1]):null,stairV,lod});
 if(station&&!spec){for(let u=st0+6;u<st1-3;u+=8){if(canal&&u>cx0-1&&u<cx1+1)continue;for(const sv of[-1,1]){b.box('s128Pillar',sv*7.2,(S.plat+ceil)/2,u,.6,ceil-S.plat,.6,0,1.3);b.solid(sv*7.2,u,.6,.6);}}
  const v=((name%16)/16),uvR=[[0,1-v-1/16],[1,1-v-1/16],[1,1-v],[0,1-v]];
  for(let u=st0+10;u<st1-5;u+=20){if(canal&&u>cx0-6&&u<cx1+6)continue;for(const sv of[-1,1]){const x=sv*(S.stHalf-.02),y0=S.plat+2.1,y1=y0+.75;quad(b,'s128Sign',sv>0?[[x,y0,u+2.4],[x,y0,u-2.4],[x,y1,u-2.4],[x,y1,u+2.4]]:[[x,y0,u-2.4],[x,y0,u+2.4],[x,y1,u+2.4],[x,y1,u-2.4]],uvR);
    if(!lod){b.box('s128Rail',sv*9.6,S.plat+.45,u+5,.5,.06,2.2);b.box('s128Rail',sv*9.6,S.plat+.22,u+4.1,.06,.44,.06);b.box('s128Rail',sv*9.6,S.plat+.22,u+5.9,.06,.44,.06);}}}}
 // --- canal crossings
 if(canal&&glass){ // tunnel passes UNDER an open canal: glass ceiling, canal water above, mullions
  const g=new T.PlaneGeometry(2*H,cx1-cx0);g.rotateX(Math.PI/2);b.add(g,'s128Glass',0,ceil+.02,(cx0+cx1)/2);g.dispose();
  for(let u=cx0;u<=cx1+.01;u+=3)b.box('s128Rail',0,ceil+.05,u,2*H+1.2,.16,.12);for(const sv of[-1,1]){b.box('s128Tunnel',sv*(H+.3),(bed+ceil)/2,(cx0+cx1)/2,.6,ceil-bed+.6,cx1-cx0);b.solid(sv*(H+.3),(cx0+cx1)/2,.6,cx1-cx0);}
  b.box('s128Ballast',0,bed-.15,(cx0+cx1)/2,10,.3,cx1-cx0);b.walk(0,(cx0+cx1)/2,10,cx1-cx0,bed);
  if(station)for(const sv of[-1,1]){b.box('s128Plat',sv*7.75,(bed+S.plat)/2-.1,(cx0+cx1)/2,5.5,S.plat-bed+.2,cx1-cx0,0,1.5);b.walk(sv*7.75,(cx0+cx1)/2,5.5,cx1-cx0,S.plat);}
  else for(const sv of[-1,1]){b.box('s128Tunnel',sv*4.55,bed+.4,(cx0+cx1)/2,.9,.8,cx1-cx0);b.walk(sv*4.55,(cx0+cx1)/2,.9,cx1-cx0,bed+.8);}
 }else if(canal){ // tunnel crosses a BURIED canal: the culvert pours down the west wall, runs under the rails, climbs the east wall
  const cw=S.culWater,ch=S.chan,zc=(cx0+cx1)/2,L=cx1-cx0;
  b.box('s128Sewer',0,ch-.6,zc,2*H+1.2,.4,L);{const g=new T.PlaneGeometry(2*H,L);g.rotateX(-Math.PI/2);b.add(g,'s128WaterU',0,ch,zc);g.dispose();}
  for(const sv of[-1,1]){const x=sv*H;quad(b,sv<0?'s128FallDown':'s128FallUp',[[x,ch,cx1],[x,ch,cx0],[x,cw,cx0],[x,cw,cx1]],[[0,0],[1,0],[1,1],[0,1]]);
   b.box('s128Black',sv*(H+.9),(ch+cw)/2,zc,.4,cw-ch,L);b.solid(sv*(H+.3),zc,.6,L);
   b.box('s128Sewer',sv*(H+.3),ch-.2,zc,.6,.8,L);}
  for(const sv of[-1,1]){const g=new T.PlaneGeometry(3,L);g.rotateX(-Math.PI/2);b.add(g,'s128Foam',sv*(H-1.5),ch+.03,zc);g.dispose();}
  // tall chamber ceiling (culvert height) over the crossing, back to the tunnel ceiling with a header wall
  b.box('s128Sewer',0,S.culCeil+.2,(X0+X1)/2,2*H+1.2,.4,X1-X0,0,1.1);for(const u of[X0,X1])b.box('s128Sewer',0,(ceil+S.culCeil)/2,u,2*H+1.2,S.culCeil-ceil,.4);
  for(const[a,c]of[[X0,cx0],[cx1,X1]])for(const sv of[-1,1]){const hw=(a>=S.st0&&c<=S.st1&&station)?S.stHalf:S.half;b.box('s128Sewer',sv*(hw+.3),(ceil+S.culCeil)/2,(a+c)/2,.6,S.culCeil-ceil,c-a);if(hw!==H)b.box('s128Sewer',sv*((hw+H)/2+.3),(ceil+S.culCeil)/2,a<zc?a:c,H-hw+.6,S.culCeil-ceil,.4);}
  // rails on a green girder viaduct over the trench + grated walkway
  for(const tv of[-2.2,2.2]){b.box('s128Girder',tv,bed-.45,zc,1.9,.7,L+.4,0,.55);}
  for(let u=cx0;u<cx1;u+=1.2)b.box('s128Rail',0,bed-.06,u+.6,8.2,.1,.24);
  b.box('s128Grate',3.8,bed-.05,zc,1.4,.1,L);b.walk(3.8,zc,1.4,L,bed);b.walk(-2.2,zc,2.6,L,bed);b.walk(2.2,zc,2.6,L,bed);
  b.solid(3.05,zc,.1,L);
  if(station)for(const sv of[-1,1]){b.box('s128Grate',sv*7.75,S.plat-.05,zc,5.5,.1,L,0,1.4);b.walk(sv*7.75,zc,5.5,L,S.plat);for(const vv of[5.4,10.2])b.box('s128Rail',sv*vv,S.plat+.55,zc,.05,1.1,L);
   for(let u=cx0;u<=cx1;u+=3)b.box('s128Girder',sv*7.75,S.plat-.5,u,5.5,.8,.3,0,.55);}
  // grated catwalk across the chamber at culvert level + stair down to the tunnel walkway (maintenance passage)
  b.box('s128Grate',0,S.walk-.05,cx1-1.75,2*H,.1,3.5);b.walk(0,cx1-1.75,2*H,3.5,S.walk);b.box('s128Rail',0,S.walk+1.05,cx1-3.5,2*H,.05,.05);b.solid(0,cx1-3.5,2*H,.12);
  const n=Math.ceil((S.walk-S.plat-.0)/.3);const top=S.walk,bot=station?S.plat:S.bed;const steps=Math.ceil((top-bot)/.3),run=.3*steps;
  for(let k=0;k<steps;k++){const y=top-.3*(k+1);b.box('s128Grate',3.8,y,cx1+.15+.3*k,1.4,.06,.3);}
  b.walk(3.8,cx1+run/2,1.4,run,(top+bot)/2,0,-(top-bot)/run);b.box('s128Rail',3.05,(top+bot)/2+.9,cx1+run/2,.05,.05,run+.4);
 }
}
// --------------------------------------------------------------------------------------------- culvert (buried canal, along x)
function culvert(b,s,{x0,x1,lod,endW,endE,seed,water0,water1}){
 const z0=CANAL.z0,z1=CANAL.z1,zc=(z0+z1)/2,L=x1-x0,xc=(x0+x1)/2,cw=S.culWater,cb=S.culBed,cc=S.culCeil,wk=S.walk,zk=z1-3.5;
 b.box('s128Sewer',xc,cb-.2,zc,L,.4,z1-z0);{const w0=water0??x0,w1=water1??x1,g=new T.PlaneGeometry(w1-w0,zk-z0);g.rotateX(-Math.PI/2);b.add(g,'s128WaterU',(w0+w1)/2,cw,(z0+zk)/2);g.dispose();}
 b.box('s128Sewer',xc,(cb+cc)/2,z0-.3,L,cc-cb+.4,.6);b.solid(xc,z0-.3,L,.6);
 const side=s.sewer,px=x0+18+side*24;   // a maintenance passage branches off north
 for(const[a,c]of(px+2<x1?[[x0,px-1.2],[px+1.2,x1]]:[[x0,x1]])){b.box('s128Sewer',(a+c)/2,(cb+cc)/2,z1+.3,c-a,cc-cb+.4,.6);b.solid((a+c)/2,z1+.3,c-a,.6);}
 b.box('s128Sewer',xc,cc+.2,zc,L,.4,z1-z0+1.2,0,.95);
 b.box('s128Grate',xc,wk-.05,(zk+z1)/2,L,.1,z1-zk);b.box('s128Sewer',xc,(cb+wk)/2-.05,(zk+z1)/2+.4,L,wk-cb-.1,z1-zk-.8);b.walk(xc,(zk+z1)/2,L,z1-zk,wk);
 b.box('s128Rail',xc,wk+1.05,zk+.05,L,.05,.05);if(!lod)for(let x=x0+1;x<x1;x+=2)b.box('s128Rail',x,wk+.52,zk+.05,.05,1.05,.05);b.solid(xc,zk-.05,L,.12);
 if(!lod){const first=x0+(((5-((b._ox+x0)%10))%10)+10)%10;for(let x=first;x<x1;x+=10)b.box('s128Lamp',x,cc-.15,z1-.25,1.0,.1,.18);}
 for(const[on,x]of[[endW,x0],[endE,x1]])if(on){b.box('s128Sewer',x,(cb+cc)/2,zc,.6,cc-cb,z1-z0);b.solid(x,zc,.6,z1-z0);}
 if(px+2<x1){b.box('s128Grate',px,wk-.05,z1+9,2.4,.1,18);b.walk(px,z1+9,2.4,18,wk);for(const sv of[-1,1]){b.box('s128Sewer',px+sv*1.5,wk+1.2,z1+9,.6,2.6,18);b.solid(px+sv*1.5,z1+9,.6,18);}
  b.box('s128Sewer',px,wk+2.6,z1+9,3.6,.4,18);b.box('s128Black',px,wk+1.2,z1+18.1,2.4,2.5,.2);b.solid(px,z1+18,2.4,.4);b.box('s128Rail',px,wk+1.1,z1+17.6,1.6,2.0,.08);
  if(!lod)b.box('s128Lamp',px,wk+2.35,z1+6,.18,.08,.8);}
}
function junction(b,s,{ix,iz,lod}){
 const bed=S.bed,ceil=S.ceil,h=S.half;b.box('s128Ballast',0,bed-.15,0,10,.3,10);b.walk(0,0,10,10,bed);b.box('s128Tunnel',0,ceil+.2,0,11.2,.4,11.2);
 for(const[x,z]of[[-1,-1],[1,-1],[1,1],[-1,1]]){b.box('s128Tunnel',x*(h+.3),(bed+ceil)/2,z*(h+.3),.6,ceil-bed+.6,.6);b.solid(x*(h+.3),z*(h+.3),.6,.6);}
 for(const tv of[-2.2,2.2])for(const rv of[-.72,.72]){b.box('s128Rail',tv+rv,bed+.08,0,.08,.16,10);b.box('s128Rail',0,bed+.081,tv+rv,10,.16,.08);}
 // dead ends where a neighbour has no line (authored blocks / the canal photo reach)
 const n=subwayBlock(ix,iz-1),w=subwayBlock(ix-1,iz);
 for(const[on,x,z,rx]of[[!s.west,0,h,0],[!(n&&n.west),0,-h,0],[!s.south,h,0,1],[!(w&&w.south),-h,0,1]])if(on){b.box('s128Tunnel',x+(rx?.3*Math.sign(x):0),(bed+ceil)/2,z+(rx?0:.3*Math.sign(z)),rx?.6:10,ceil-bed,rx?10:.6);b.solid(x,z,rx?.6:10,rx?10:.6);}
 if(!lod)b.box('s128Lamp',0,ceil-.12,0,1.2,.08,1.2);
}
// --------------------------------------------------------------------------------------------- per block (separate batch)
export function* subwayBlockTask(mats,plan,lod){
 const s=subwayBlock(plan.ix,plan.iz);if(!s)return null;addSubway128Materials(mats);
 const b=new UrbanBatch(mats);try{b.push(CITY_ORIGIN.x,0,CITY_ORIGIN.z,CITY_ANGLE);b.push(plan.x,Y,plan.z);b._ox=plan.x;
 const glassW=s.canalOpenHere||s.canalOpenW;
 junction(b,s,{ix:plan.ix,iz:plan.iz,lod});yield;
 const specW=s.stW?stationSpec(plan.ix,plan.iz,0):null,specS=s.stS?stationSpec(plan.ix,plan.iz,1):null;if(specW&&s.canalW)specW.island=false;
 if(s.west){yield* segment(b,s,{u0:5,u1:107,station:s.stW,canal:s.canalW,glass:glassW,name:s.name,stairV:s.stW?1:0,lod,ox:plan.z,oz:plan.x,alongSign:1,spec:specW});}
 if(s.south){b.push(0,0,0,Math.PI/2);yield* segment(b,s,{u0:5,u1:107,station:s.stS,canal:false,glass:false,name:(s.name+5)%16,stairV:s.stS?-1:0,lod,ox:plan.x,oz:plan.z,alongSign:1,spec:specS});b.pop();}
 if(s.buried){const e=subwayBlock(plan.ix+1,plan.iz);const eOpen=!!(e&&e.canalOpenW);   // east neighbour open -> portal at x 112
  const endE=!e||(!eOpen&&!e.west);const hw=s.west?(s.stW?S.stHalf+.6:S.half):0,he=e&&e.west?(e.stW?S.stHalf+.6:S.half):0;culvert(b,s,{x0:hw,x1:B-he,lod,endW:!s.canalOpenW&&!s.west,endE,seed:s.sewer,water0:s.canalOpenW?0:hw,water1:eOpen?B:B-he});}
 yield;
 const object=yield* b.finishTask('Level 11 subway '+plan.ix+','+plan.iz);object.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 return{object,colliders:b.colliders,walks:b.walks,stairs:[]};}finally{b.discard();}
}
// --------------------------------------------------------------------------------------------- street-level entrance (in the street batch)
export function subwayEntrances(b,plan,lod){
 const list=subwayStairs(plan.ix,plan.iz);if(!list.length)return;addSubway128Materials(b.mats);
 for(const st of list){const frameZ=st.axis==='z';b.push(0,0,0,frameZ?0:Math.PI/2);const spec=stationSpec(plan.ix,plan.iz,frameZ?0:1),stepK=stepKey(spec)||'s128Steps',shK=shaftKey(spec);
  // in frame: stair across v (local x for west / -z for south), descending along +u
  const sv=frameZ?1:-1,v0=sv>0?S.stairX0:-S.stairX1,v1=sv>0?S.stairX1:-S.stairX0,vc=(v0+v1)/2,u0=frameZ?st.z0:st.x0,u1=u0+S.stairLen,n=Math.round(S.stairLen/S.run),top=.15;
  for(let k=0;k<n;k++){const y=top-S.rise*(k+1),u=u0+S.run*k;b.box(stepK,vc,(y+S.plat-.2)/2,u+S.run/2,v1-v0,y-S.plat+.2,S.run,0,1.25);}
  b.walk(vc,u0+S.stairLen/2,v1-v0,S.stairLen,(top+S.plat)/2,0,-(top-S.plat)/S.stairLen);(b.stairWalks||(b.stairWalks=[])).push(b.walks.at(-1));
  // shaft walls: outer full height, inner above the station ceiling; landing apron
  const vo=sv>0?v1:v0,vi=sv>0?v0:v1;b.box(shK,vo+sv*.3,(S.plat+top)/2,(u0+u1)/2,.6,top-S.plat,S.stairLen,0,1.3);
  b.box(shK,vi-sv*.3,(S.ceil+top)/2,(u0+u1)/2,.6,top-S.ceil,S.stairLen,0,1.3);
  b.box(shK,vc,(S.ceil+top)/2-.0,u1+.3,v1-v0+1.2,top-S.ceil,.6,0,1.3);
  // street railings (three sides, open at the top step) + entrance frame with the station board
  for(const v of[v0,v1]){b.box('metal',v,top+1.0,(u0+u1)/2,.06,.06,S.stairLen);if(!lod)for(let u=u0;u<=u1+.01;u+=1.5)b.box('metal',v,top+.5,u,.05,1.0,.05);b.solid(v,(u0+u1)/2,.15,S.stairLen);(b.stairSolids||(b.stairSolids=[])).push(b.colliders.at(-1));}
  b.box('metal',vc,top+1.0,u1,v1-v0,.06,.06);b.solid(vc,u1,v1-v0,.15);b.stairSolids.push(b.colliders.at(-1));
  for(const v of[v0,v1])b.box('s128Rail',v,top+1.3,u0+.1,.12,2.6,.12);b.box('s128Rail',vc,top+2.6,u0+.1,v1-v0+.12,.14,.14);
  {const[q0,q1,q2,q3]=cellUV(spec.name);quad(b,signKey(b.mats,spec.sign,spec.lang),[[v1,top+2.0,u0-.02],[v0,top+2.0,u0-.02],[v0,top+2.6,u0-.02],[v1,top+2.6,u0-.02]],[[q0,q1],[q2,q1],[q2,q3],[q0,q3]]);}
  entrance129(b,spec,{v0,v1,u0,u1,top,lod,sv,ix:plan.ix,iz:plan.iz});
  b.pop();}
}
// --------------------------------------------------------------------------------------------- floor / collisions while underground
export const subwayState={under:false,last:0};
function walkY(q,x,z){const c=Math.cos(q.ry),s=Math.sin(q.ry),dx=x-q.x,dz=z-q.z,v=s*dx+c*dz,u=c*dx-s*dz-v*(q.skewX||0);if(Math.abs(u)<=q.w/2&&Math.abs(v)<=q.d/2)return q.y+u*q.slopeX+v*q.slopeZ;return null;}
// stairs: walks of the street batch below street level; tunnels: walks of the subway batch
export function subwayFloor(wx,wz,blocks,streetY){
 const st=subwayState;let best=null,stair=null;
 for(const v of blocks){if(v.stairWalks)for(const q of v.stairWalks){const y=walkY(q,wx,wz);if(y!==null&&(stair===null||y>stair))stair=y;}}
 if(!st.under){if(stair!==null&&stair<streetY-.05&&stair>st.last-.6){st.under=stair<streetY-.7;st.last=stair;return stair;}st.last=streetY;return null;}
 const lim=st.last+1.05;
 for(const v of blocks){const list=v.sub?.walks;if(!list)continue;for(const q of list){const y=walkY(q,wx,wz);if(y!==null&&y<=lim&&(best===null||y>best))best=y;}}
 if(stair!==null&&stair<=lim&&(best===null||stair>best))best=stair;
 if(best===null)best=st.last;
 if(stair!==null&&best>=streetY-.7&&stair===best){st.under=false;}
 st.last=best;return best;
}
