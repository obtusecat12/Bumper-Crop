// V128 L11 canal (ref files/l11-canal-ref.png = EN wiki 11canal.png, "A wide canal with multiple crossing bridges").
// Built per city block from addBlockStreetsTask (urban-streets.js) for blocks where canalBlock() is open: sunk channel with
// concrete embankment walls and dark railings, paved promenades with trees and lamps, bridge decks with green plate girders
// under every crossing road, tunnel portals where the canal dives under a buried block. Blocks (1,5)+(2,5) are the
// authored photo reach (glass towers left, white banded tower + blue atrium + stepped plaza right, footbridge camera).
// Textures: art-l11v128/k128_* (each generated large on its own) -> tools/canal128_assets.py -> assets/l11-v128.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import * as P from './urban-props.js?v=60';
import {CITY_ORIGIN,CITY_ANGLE} from './urban-layout.js?v=60';
import {CANAL,CANAL_HERO} from './canal128-layout.js?v=128';
const A=new URL('./assets/l11-v128/',import.meta.url).href,B=112,C=CANAL,WY=C.water;
function tex(name,{srgb=true}={}){const t=new T.TextureLoader().load(A+name+'.webp?v=128');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
// facade tiles in metres [file, tile width, tile height] (floor/bay periods from reps.json)
export const K128_FACADES={k128GlassA:['glassA',35.5,20],k128GlassB:['glassB',40,11.2],k128Green:['greenglass',31.5,15.2],k128Gray:['grayslab',30.2,18],k128White:['white',40.2,22.4],k128White2:['white2',18.6,9.3],k128Atrium:['atrium',14.5,20.4]};
const SURF={k128Wall:['wall',3.15,1.9],k128Pave:['pave',4,2.4],k128Steps:['steps',1.2,1.6],k128Portal:['portal',4,2.6],k128Bridge:['bridge',2.9,1.6],k128Tunnel:['tunnel',4,2.2]};
export const water128={time:{value:0},sky:{value:new T.Color('#8fb3dc')},hor:{value:new T.Color('#aebfcd')},deep:{value:new T.Color('#0d1419')}};
export function addCanal128Materials(m){
 if(m.k128Water)return m;
 for(const[key,[file,tw,th]]of Object.entries(K128_FACADES)){m[key]=new T.MeshStandardMaterial({map:tex(file),normalMap:tex(file+'-n',{srgb:false}),normalScale:new T.Vector2(.6,.6),roughness:key==='k128GlassA'||key==='k128GlassB'||key==='k128Atrium'?.38:.82,metalness:key==='k128GlassB'?.25:0,vertexColors:true});m[key].userData.tile=[tw,th];}
 for(const[key,[file,tile,ns]]of Object.entries(SURF)){m[key]=new T.MeshStandardMaterial({map:tex(file),normalMap:tex(file+'-n',{srgb:false}),normalScale:new T.Vector2(ns/2,ns/2),roughness:.9,vertexColors:true});URBAN_TILE_SIZE[key]=tile;}
 m.k128Rail=new T.MeshStandardMaterial({color:0x2b2a28,roughness:.55,metalness:.4,vertexColors:true});
 m.k128Conc=new T.MeshStandardMaterial({color:0xb4b0a6,roughness:.9,vertexColors:true});
 m.k128Dark=new T.MeshBasicMaterial({color:0x07090a,vertexColors:true});
 m.k128Foam=new T.MeshBasicMaterial({color:0xc9d0cf,vertexColors:true,transparent:true,opacity:.82});
 m.k128Hedge=new T.MeshStandardMaterial({color:0x3f5d33,roughness:.95,vertexColors:true});
 m.k128Skyline=new T.MeshStandardMaterial({color:0xc9ced3,roughness:.8,vertexColors:true});
 m.k128Water=waterMaterial(m.k128GlassA.map,m.k128White.map);
 return m;
}
// Dark still water. Reflection is analytic: the reflected view ray is traced against the two embankment walls and the two
// building lines of the canal (a straight channel), sampling the facade textures there, otherwise the sky gradient.
function waterMaterial(facL,facR){
 const mat=new T.MeshBasicMaterial({color:0xffffff,vertexColors:false});mat.name='V128 canal water';
 const ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
 mat.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{uT:water128.time,uSky:water128.sky,uHor:water128.hor,uDeep:water128.deep,uFacL:{value:facL},uFacR:{value:facR},uO:{value:new T.Vector2(CITY_ORIGIN.x,CITY_ORIGIN.z)},uR:{value:new T.Vector2(ca,sa)}});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vP;varying vec3 vCam;').replace('#include <project_vertex>','#include <project_vertex>\nvP=position;vCam=cameraPosition-modelMatrix[3].xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vP;varying vec3 vCam;uniform float uT;uniform vec3 uSky,uHor,uDeep;uniform sampler2D uFacL,uFacR;uniform vec2 uO,uR;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
vec2 ripple(vec2 p,float t){vec2 g=vec2(0.);
 g+=vec2(.31,.11)*cos(dot(p,vec2(.31,.11))*1.9+t*.9);g+=vec2(-.13,.43)*cos(dot(p,vec2(-.13,.43))*2.3+t*1.1);
 g+=vec2(.57,-.21)*cos(dot(p,vec2(.57,-.21))*3.1+t*1.4)*.6;g+=vec2(.12,.83)*cos(dot(p,vec2(.12,.83))*4.7+t*1.7)*.35;
 g+=vec2(1.1,.37)*cos(dot(p,vec2(1.1,.37))*6.3+t*2.)*.18;return g;}`).replace('#include <color_fragment>',`#include <color_fragment>
{vec2 d0=vP.xz-uO;float ax=uR.x*d0.x-uR.y*d0.y,cz=uR.y*d0.x+uR.x*d0.y;float c=mod(cz,112.)-${C.mid.toFixed(1)},a=ax;
 vec3 v=normalize(vP-vCam);vec3 dv=vec3(uR.x*v.x-uR.y*v.z,v.y,uR.y*v.x+uR.x*v.z);
 float dist=length(vP-vCam);vec2 g=(ripple(vec2(a,c)*.55,uT)+.6*ripple(vec2(c,-a)*1.7+3.1,uT*1.3))*(.011/(1.+dist*.035));
 vec3 n=normalize(vec3(g.x,1.,g.y));vec3 r=reflect(dv,n);r.y=max(r.y,.004);
 float side=r.z>=0.?1.:-1.;vec3 refl;float tw=(side*${((C.z1-C.z0)/2).toFixed(1)}-c)/(abs(r.z)<1e-4?1e-4*side:r.z);float yw=tw*r.y;
 float fa=abs(side*${(B/2-C.p0+(C.mid-B/2)).toFixed(1)});
 if(tw>0.&&yw<${(C.top-WY).toFixed(2)}){refl=vec3(.13,.13,.12)*(.75+.25*h1(floor((a+tw*r.x)*.5)));}
 else{float tf=(side*${(C.p1-C.mid+4).toFixed(1)}-c)/(abs(r.z)<1e-4?1e-4*side:r.z);float yf=tf*r.y,af=a+tf*r.x;float seg=floor(af/31.);
  float hb=26.+52.*h1(seg+side*17.);vec3 sky=mix(uHor,uSky,clamp(r.y*2.2,0.,1.))*.52;
  if(tf>0.&&yf<hb){vec3 f=side>0.?texture2D(uFacR,vec2(af/40.,yf/22.4),3.).rgb:texture2D(uFacL,vec2(af/35.5,yf/20.),3.).rgb;f=pow(f,vec3(2.2));refl=mix(f*.28,sky,.3);}
  else refl=sky;}
 float fr=.04+.96*pow(1.-clamp(-dv.y*n.y-dv.x*n.x-dv.z*n.z,0.,1.),5.);fr=clamp(fr*.8+.05,0.,.72);
 diffuseColor.rgb=mix(uDeep,refl,fr);}`);
 };
 mat.onBeforeRender=()=>{water128.time.value=performance.now()*.001;};
 return mat;
}
// box with world-anchored facade UVs (u along the face, v up from y0); local block coords
function fbox(b,key,x0,x1,y0,y1,z0,z1,ox,oz,{tw,th}={}){
 const m=b.mats[key],[TW,TH]=tw?[tw,th]:(m.userData.tile||[4,4]),g=new T.BufferGeometry(),p=[],n=[],uv=[];
 const quad=(a,bq,cq,d,nn,u0,u1,v0,v1)=>{for(const[v,uu,vv]of[[a,u0,v0],[bq,u1,v0],[cq,u1,v1],[a,u0,v0],[cq,u1,v1],[d,u0,v1]]){p.push(...v);n.push(...nn);uv.push(uu,vv);}};
 const V0=(y0)/TH,V1=(y1)/TH;
 quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],(ox+x0)/TW,(ox+x1)/TW,V0,V1);      // +z
 quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],-(ox+x1)/TW,-(ox+x0)/TW,V0,V1);   // -z
 quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],-(oz+z1)/TW,-(oz+z0)/TW,V0,V1);    // +x
 quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],(oz+z0)/TW,(oz+z1)/TW,V0,V1);     // -x
 quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],0,.02,0,.02);                      // roof (flat colour of the tile corner)
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 b.add(g,key,0,0,0);g.dispose();
}
function quadGeo(b,key,pts,uvs,nn){const g=new T.BufferGeometry(),p=[],n=[],uv=[];for(const i of[0,1,2,0,2,3]){p.push(...pts[i]);n.push(...nn);uv.push(...uvs[i]);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));b.add(g,key,0,0,0);g.dispose();}
function railing(b,x0,x1,z,y,lod,face=1){
 const L=x1-x0;if(L<=.2)return;b.box('k128Rail',(x0+x1)/2,y+1.08,z,L,.06,.07);if(!lod){b.box('k128Rail',(x0+x1)/2,y+.55,z,L,.035,.035);for(let x=x0;x<=x1+.01;x+=2)b.box('k128Rail',x,y+.55,z,.06,1.1,.06);
  for(let x=x0+1;x<x1;x+=2)for(let k=1;k<6;k++)b.box('k128Rail',x-1+k*.333,y+.55,z,.018,1.0,.018);}
 b.solid((x0+x1)/2,z+face*.05,L,.3);
}
function railingZ(b,x,z0,z1,y,lod){const L=z1-z0;if(L<=.2)return;b.box('k128Rail',x,y+1.08,(z0+z1)/2,.07,.06,L);if(!lod){b.box('k128Rail',x,y+.55,(z0+z1)/2,.035,.035,L);for(let z=z0;z<=z1+.01;z+=2)b.box('k128Rail',x,y+.55,z,.06,1.1,.06);}b.solid(x,(z0+z1)/2,.3,L);}
const place=(b,x,y,z,ry,fn,args)=>{b.push(x,y,z,ry);fn(b,args||{});b.pop();};
function hedge(b,x0,x1,z,y,d=1.1,h=.75){b.box('k128Conc',(x0+x1)/2,y+.2,z,x1-x0,.4,d+.2);b.box('k128Hedge',(x0+x1)/2,y+.4+h*.4,z,x1-x0-.2,h*.8,d*.85);for(let x=x0+.5,i=0;x<x1-.3;x+=.9,i++)b.sphere('k128Hedge',x,y+.4+h*.78,z+((i*7)%3-1)*.12,.55,.22+.06*(i%3),d*.42);}
// ---------------------------------------------------------------- per block
export function* canalBlockTask(b,plan,lod){
 addCanal128Materials(b.mats);const cn=plan.canal,ex=plan.canalExtra;
 if(ex)yield* heroFar(b,plan);
 if(!cn)return;
 const xa=cn.noRoadW?0:0,xb=B,top=C.top,wh=C.top-WY;
 // channel: walls (inner faces toward the water), coping, water plane. Before a tunnel portal the canal drops over a weir
 // with a lock gate (wiki: canals "start or have stations at factories or locks") so the tunnel mouth has headroom.
 const WL=-4.4,lw=cn.portalW?30:0,le=cn.portalE?B-30:B,segs=[[lw,le,WY]];if(cn.portalW)segs.push([0,lw,WL]);if(cn.portalE)segs.push([le,B,WL]);
 for(const[x0,x1,wy]of segs){const h=top-wy;for(const[z,s]of[[C.z0,-1],[C.z1,1]]){b.box('k128Wall',(x0+x1)/2,wy-.6+(h+.6)/2,z+s*.35,x1-x0,h+.6,.7);b.box('k128Conc',(x0+x1)/2,top-.06,z+s*.2,x1-x0,.14,.62);}
  const g=new T.PlaneGeometry(x1-x0,C.z1-C.z0);g.rotateX(-Math.PI/2);b.add(g,'k128Water',(x0+x1)/2,wy,(C.z0+C.z1)/2);g.dispose();yield;}
 for(const[on,xw,d]of[[cn.portalW,lw,-1],[cn.portalE,le,1]]){if(!on)continue;const zc=(C.z0+C.z1)/2,zw=C.z1-C.z0;
  b.box('k128Conc',xw+d*.6,(WL+WY)/2-.1,zc,1.2,WY-WL+.2,zw);                                  // weir sill
  {const g=new T.PlaneGeometry(zw,Math.hypot(2.2,WY-WL));g.rotateX(-Math.PI/2+d*Math.atan2(WY-WL,2.2));g.rotateY(Math.PI/2);b.add(g,'k128Foam',xw+d*2.3,(WY+WL)/2-.02,zc);g.dispose();}
  for(const z of[C.z0+.6,C.z1-.6])b.box('k128Conc',xw-d*1.2,(WY+top)/2,z,1.6,top-WY,1.2);  // lock gate piers
  b.box('k128Bridge',xw-d*1.2,top+.25,zc,1.4,.5,zw+1);b.box('k128Bridge',xw-d*1.2,(WY+WL)/2+.3,zc,.35,WY-WL+.6,zw-1.2);   // gate walkway + closed gate leaf
  railingZ(b,xw-d*1.75,C.z0,C.z1,top+.5,lod);yield;}
 // promenades (street level), railing at the water edge, trees + lamps
 const px0=cn.noRoadW?0:12,px1=cn.noRoadE?B:100;
 for(const[za,zb,edge,s]of[[C.p0,C.z0,C.z0,-1],[C.z1,C.p1,C.z1,1]]){
  b.box('k128Pave',(px0+px1)/2,top/2,(za+zb)/2,px1-px0,top,zb-za);b.walk((px0+px1)/2,(za+zb)/2,px1-px0,zb-za,top);
  railing(b,px0,px1,edge+s*.12,top,lod,s);yield;
  if(!cn.hero){for(let x=px0+6,i=0;x<px1-4;x+=11,i++){const z=edge+s*(zb-za-1.4);if(i%2===0)place(b,x,top,z,0,P.addStreetTree,{seed:plan.seed+i*31+(s>0?7:0),scale:.8});else if(!lod)place(b,x,top,edge+s*.7,s>0?0:Math.PI,P.addStreetLight,{height:5.2,arm:.6});}yield;}
 }
 // crossing roads = bridges: deck soffit + green plate girder facing the canal, girder parapet; portal headwalls
 for(const[side,on]of[['w',!cn.noRoadW],['e',!cn.noRoadE]]){if(!on)continue;const xr=side==='w'?0:B,xf=side==='w'?12:B-12,d=side==='w'?1:-1;
  b.box('k128Conc',(xr+xf)/2,-.4,(C.z0+C.z1)/2,12,.7,C.z1-C.z0+1.4);
  // pony plate girder: green steel side wall from below the deck to a parapet 1.3 m above the walkway, rail on top
  b.box('k128Bridge',xf-d*.15,-.05,(C.z0+C.z1)/2,.3,2.1,C.p1-C.p0);b.box('k128Bridge',xf-d*.15,1.04,(C.z0+C.z1)/2,.42,.08,C.p1-C.p0);b.solid(xf-d*.15,(C.p0+C.p1)/2,.4,C.p1-C.p0);
  if(!lod)for(let z=C.p0+1;z<C.p1;z+=4.4)b.box('k128Bridge',xf-d*.05,-.05,z,.22,2.1,.12);
  if(side==='w'?cn.portalW:cn.portalE){
   // tunnel portal at the block edge: headwall with a dark mouth, the channel continues underground
   const xw=xr,WL=-4.4,hh=-WL;b.box('k128Portal',xw+d*.4,WL+hh/2-.25,C.z0+4.5,.8,hh+.5,9);b.box('k128Portal',xw+d*.4,WL+hh/2-.25,C.z1-4.5,.8,hh+.5,9);b.box('k128Portal',xw+d*.4,-.55,(C.z0+C.z1)/2,.8,1.2,C.z1-C.z0);
   b.box('k128Dark',xw-d*14,(WL-1.15)/2,(C.z0+C.z1)/2,27,-1.15-WL,C.z1-C.z0-18.2);   // tunnel throat (black)
  }
  yield;}
 // merged hero edge: sidewalk continues straight across the removed road
 for(const[on,x0,x1]of[[cn.noRoadE,100,B],[cn.noRoadW,0,12]]){if(!on)continue;for(const[za,zb]of[[7.5,12],[100,104.5]]){b.box('sidewalk',(x0+x1)/2,top/2,(za+zb)/2,x1-x0,top,zb-za);b.walk((x0+x1)/2,(za+zb)/2,x1-x0,zb-za,top);}
  for(const[za,zb]of[[12,C.p0],[C.p1,100]]){b.box('k128Pave',(x0+x1)/2,top/2,(za+zb)/2,x1-x0,top,zb-za);b.walk((x0+x1)/2,(za+zb)/2,x1-x0,zb-za,top);}yield;}
 if(cn.hero)yield* hero(b,plan,lod);
}
// ---------------------------------------------------------------- photo reach (city x = hero coords; z block-local)
// camera: footbridge in block (1,5) at city x 149, z 58.3, deck +1.65, eye 1.7 -> looks east (+x) down the canal, fov 34.3
export const CANAL_CAM={x:149,z:CANAL_HERO.row*B+59.5,deck:2.15};
const HERO=[ // [key, x0, x1, z0, z1, height]
 ['k128Gray',124,150,12,32,30],
 ['k128GlassA',150,258,12,34,72],
 ['k128Gray',258,285,14,34,27],
 ['k128Green',285,322,16,34,27],
 // V129: north tower = two white banded wings with the blue glass atrium RECESSED in a deep notch between them (photo:
 // far wing face ends at u 810 -> x 251, near wing corner at u 965 -> x 216; notch >= 13 m deep), bridged by the top floors
 ['k128White',150,214,84,100,54],
 ['k128Atrium',214,216,84,99,54],
 ['k128Atrium',216,251,97,100,52],
 ['k128Atrium',251,253.5,84,97,47],
 ['k128White',253.5,320,84,100,47],
 ['k128White',124,150,80,100,26],
];
function* hero(b,plan,lod){
 const ox=plan.x,oz=plan.z,bx0=ox,bx1=ox+B,top=C.top;
 for(const[key,x0,x1,z0,z1,h]of HERO){const a=Math.max(x0,bx0),c=Math.min(x1,bx1);if(c-a<.05)continue;
  const podium=key==='k128GlassA'?9:key==='k128White'||key==='k128Atrium'?6:0;
  fbox(b,key,a-ox,c-ox,top+podium,top+h,z0,z1,ox,oz);
  if(podium){const zf=z0<50?z1-2.6:z0+2.6,zz0=z0<50?z0:zf,zz1=z0<50?zf:z1;fbox(b,'k128Gray',a-ox,c-ox,top,top+podium,zz0,zz1,ox,oz,{tw:30.2,th:18});
   for(let x=Math.ceil(a/7.2)*7.2;x<c;x+=7.2)b.box('k128Conc',x-ox,top+podium/2,z0<50?z1-.4:z0+.4,.8,podium,.8);
   b.box('k128Conc',(a+c)/2-ox,top+podium-.35,z0<50?z1-.9:z0+.9,c-a,.7,1.8);}
  b.solid((a+c)/2-ox,(z0+z1)/2,c-a,z1-z0);yield;}
 // notch: bridging top floors (dark soffit at +36 m), paved floor, ground-floor glass doors in the back wall
 {const a=Math.max(216,bx0),c=Math.min(251,bx1);if(c>a){fbox(b,'k128White',a-ox,c-ox,top+33,top+52,84,97,ox,oz);b.box('k128Conc',(a+c)/2-ox,top+32.6,90.5,c-a,.8,13,0,.55);
  b.box('k128Pave',(a+c)/2-ox,top/2+.01,90.5,c-a,top+.02,13);b.walk((a+c)/2-ox,90.5,c-a,13,top+.02);
  for(let x=a+3;x<c-2;x+=4.4)b.box('k128Rail',x-ox,top+2,96.8,.12,4,.12);b.box('k128Rail',(a+c)/2-ox,top+4.1,96.8,c-a,.2,.2);yield;}}
 // stepped plaza in front of the white tower / atrium (rises from the north promenade to the podium)
 {const a=Math.max(196,bx0),c=Math.min(330,bx1);if(c>a){for(let k=0;k<8;k++){const z0=C.p1+k*(84-C.p1)/8,y=top+.15*(k+1);b.box('k128Steps',(a+c)/2-ox,y/2,z0+(84-z0)/2,c-a,y,84-z0);}
   b.walk((a+c)/2-ox,(C.p1+84)/2,c-a,84-C.p1,top+.6,0,.15);
   for(const x of[a+8,c-8])if(x>a&&x<c)b.box('k128Rail',x-ox,top+.8,(C.p1+84)/2,.05,.05,84-C.p1+.2);
   if(!lod)for(let x=Math.ceil(a/16)*16+4;x<c-2;x+=16)place(b,x-ox,top,C.p1+.9,0,P.addStreetLight,{height:4.6,arm:.5});
   // shrub hedges along the south edge of the plaza near the bridge (photo: right bank greenery)
   if(c>290)hedge(b,Math.max(a,292)-ox,c-ox,C.p1+.9,top,1.2);}}
 // left promenade: dense trees + lamps (photo: left bank)
 {const a=Math.max(112,bx0),c=Math.min(336,bx1);for(let x=Math.ceil((a+3)/9)*9;x<c-3;x+=9){const i=Math.round(x/9);if(i%3===0||(i%3===2&&x<170))place(b,x-ox,top,C.p0+1.6,0,P.addStreetTree,{seed:4000+i*13,scale:.95+(i%4)*.06});else place(b,x-ox,top,C.z0-.7,Math.PI,P.addStreetLight,{height:5,arm:.5});}
  // right promenade lamps + low hedges west of the plaza
  for(let x=Math.ceil((a+5)/24)*24;x<c-3;x+=24)if(!lod)place(b,x-ox,top,C.z1+.7,0,P.addStreetLight,{height:4,arm:.4});
  if(a<196)hedge(b,a-ox+1,Math.min(c,196)-ox,C.p1-1.4,top,1.1);yield;}
 // footbridge (camera platform) at city x 147.25..150.75
 if(bx0<=CANAL_CAM.x&&CANAL_CAM.x<bx1){const x=CANAL_CAM.x-ox,d=CANAL_CAM.deck,z0=C.p0+3,z1=C.p1-3;
  for(const xs of[x-1.75,x+1.75])b.box('k128Bridge',xs,d-.5,(z0+z1)/2,.18,1.0,z1-z0);b.box('k128Conc',x,d-.1,(z0+z1)/2,3.5,.2,z1-z0);
  b.walk(x,(z0+z1)/2,3.5,z1-z0,d);railingZ(b,x-1.7,z0,z1,d,lod);railingZ(b,x+1.7,z0+3,z1-3,d,lod);
  for(const z of[z0+1.5,z1-1.5]){for(let k=0;k<14;k++){const h=d-.15*k;b.box('k128Steps',x+1.75+.3*k+.15,h/2,z,.3,h,2.6);}
   b.walk(x+1.75+2.1,z,4.2,2.6,top+(d-top)/2,-(d-top)/4.2,0);}
  for(const z of[C.z0+.6,C.z1-.6])b.box('k128Conc',x,(WY+d-.2)/2,z,1.2,d-.2-WY,1.2);yield;}
 // distant skyline (only in block A's batch; it sits >= 3 blocks east so it never meets the procedural blocks there)
 if(plan.ix===CANAL_HERO.a){const S=[['k128White2',799,824,23,48,62],['k128White2',849,861,67,79,56],['k128White2',769,783,117,131,49],['k128Gray',749,761,-4,8,44],['k128Gray',749,766,8,25,43],['k128Green',709,726,15,32,36],['k128Gray',849,865,49,65,44],['k128White',799,813,77,91,34],['k128Gray',749,771,87,109,25],['k128White2',749,760,104,115,27]];
  S.push(['k128White',709,721,14,54,19],['k128Gray',729,741,-2,13,26],['k128Gray',749,761,54,68,19],['k128White2',769,781,68,88,23],['k128Gray',749,761,97,121,20],['k128White',709,721,117,140,16],['k128Gray',709,721,-22,0,21],['k128White2',789,801,38,64,16]);   // V129: low far band on the horizon (photo y 335..360)
  for(const[key,x0,x1,z0,z1,h]of S)fbox(b,key,x0-ox,x1-ox,top,top+h,z0,z1,ox,oz);yield;}
}
// block (4,5): the photo's two far towers (dark glass left, slender white right) replace those lots of the procedural block
function* heroFar(b,plan){const ox=plan.x,oz=plan.z,top=C.top;
 if(plan.ix===3){fbox(b,'k128GlassB',352-ox,388-ox,top,top+55,12,34,ox,oz);b.solid(370-ox,23,36,22);fbox(b,'k128White2',418-ox,432-ox,top,top+70,86,100,ox,oz);b.solid(425-ox,93,14,14);}yield;}
// ---------------------------------------------------------------- weather + F2 camera of the photo reach
// 11canal.png: clear late-morning sky, high bright sun from the south-west of the canal (white tower face lit), soft haze.
const SMOOTH=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function canal128Weather(cx,cz){const r=CANAL_HERO.row*B,dx=Math.max(100-cx,0,cx-560),dz=Math.max(r-30-cz,0,cz-(r+B+30));return 1-SMOOTH(0,40,Math.hypot(dx,dz));}
const ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE),toW=(x,y,z)=>new T.Vector3(ca*x+sa*z,y,-sa*x+ca*z);
export const CANAL_SUN=toW(-.35,1.25,-.55).normalize();
const B128={sky:new T.Color('#6f9fd8'),fog:new T.Color('#c4d3df'),sunColor:new T.Color('#fff4e2'),fill:new T.Color('#b7c9de'),ground:new T.Color('#a39d8f')};
export function canal128Env(o,w){const L=T.MathUtils.lerp;for(const k of['sky','fog','sunColor','fill','ground'])o[k].lerp(B128[k],w);o.clinic=L(o.clinic,1,w);o.hero=o.hero||w>.05;o.sun=o.sun.clone().lerp(CANAL_SUN,w).normalize();o.sunPower=L(o.sunPower,3.6,w);o.fillPower=L(o.fillPower,1.55,w);o.exposure=L(o.exposure,1.04,w);o.near=L(o.near,260,w);o.far=L(o.far,900,w);o.canal128=w;return o;}
export function canal128Waypoint(cityToWorld){const p=cityToWorld(CANAL_CAM.x,CANAL_CAM.z);return{...p,label:'图四 · 运河（维基 11canal.png）',yaw:CITY_ANGLE-Math.PI/2,pitch:0,eye:1.7,fov:34.3,referenceAspect:1024/768,range:900,urbanPhoto:true};}
