// V130-A L11 canal life (user 2026-10-16 22:30, notes/spec-1016-2230.md A): the canal looked empty and cheap.
// 1) Fake interiors behind the tower glass: interior mapping per window cell (ray/box hit inside a virtual room, the hit point is
//    projected back onto a one-point-perspective room photo). 24 room/shop photos (art-l11v130/q130_r*/s*, each generated alone)
//    x per-cell hash of mirror, depth, light state (lit warm/cool, dim, dark), roller blinds, vertical blinds, curtains, tint
//    -> neighbouring windows never match. Glass keeps the original facade photo as its reflection, weighted by Fresnel.
// 2) Facade dressing on the photo reach: shopfronts (bulkhead, mullions, interior-mapped shop glass, fascia + sign, awnings,
//    blade sign), cornices/parapets, glass fins, cafe terrace (tables, chairs, umbrellas), planters, benches, bins, bike racks.
// 3) Canal life on every open canal block: stained/mossy embankment facing, drain outfalls, ladders with grab hoops, lifebuoys,
//    moored narrowboats, pontoons with a rowboat, marker buoys.
// Textures: tools/canal130_assets.py -> assets/l11-v130 (low-fi 128-512 px, seamless where tiled, luminance normal maps,
// six-face unwrap strips [+x,-x,+y,-y,+z,-z] for the bin and the planter).
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {urbanHash} from './urban-batch.js?v=69';
import {CANAL} from './canal128-layout.js?v=128';
const A=new URL('./assets/l11-v130/',import.meta.url).href,C=CANAL,WY=C.water,TOP=C.top;
const loader=new T.TextureLoader();
function tex(name,{srgb=true,rep=true}={}){const t=loader.load(A+name+'.webp?v=130');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
// back-wall fraction of each room photo (info.json rooms), atlas 6 x 4, index 20..23 = shops
const ROOM_F=[.36,.4,.7,.55,.45,.62,.45,.5,.55,.55,.35,.3,.55,.3,.55,.55,.4,.55,.6,.5,.4,.3,.55,.45];
let ROOMS=null;const rooms=()=>ROOMS||(ROOMS=(()=>{const t=tex('rooms',{rep:false});t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return t;})());
// facade window grids (per texture tile: columns x floors, phase in tile fractions, glass mask mode/threshold) measured from
// the l11-v128 facade textures (row/column autocorrelation + glass-mask phase, see version-history V130-A)
export const IM_FACADES={
 k128GlassA:{grid:[8,5],phase:[15/256,1-21/256],mask:[0,.56],min:.22,br:1.0},
 k128Green:{grid:[10,4],phase:[0,1-34/256],mask:[1,.12],min:.2,br:.9},
 k128Gray:{grid:[6,5],phase:[0,1-17/256],mask:[0,.35],min:.12,br:.9},
 k128White:{grid:[8,7],phase:[0,1-11/256],mask:[1,.10],min:.3,br:.75},
 k128Atrium:{grid:[4,6],phase:[51/256,1-17/256],mask:[1,.25],min:.42,br:.6},
};
// interior-mapping patch for a MeshStandardMaterial whose map uses world-anchored facade UVs (u along the face, v up)
export function patchInterior130(mat,{tile,grid,phase=[0,0],mask=[2,0],min=.2,br=1,range=[0,20],shops=[20,4],shopY=5.6,near=110,far=210}){
 if(mat.userData.im130)return mat;mat.userData.im130=true;
 const U={uRooms:{value:rooms()},uTile:{value:new T.Vector2(...tile)},uGrid:{value:new T.Vector2(...grid)},uPh:{value:new T.Vector2(...phase)},
  uMask:{value:new T.Vector2(...mask)},uIM:{value:new T.Vector4(near,far,min,br)},uRange:{value:new T.Vector4(range[0],range[1],shops[0],shops[1])},uShopY:{value:shopY},uF:{value:ROOM_F}};
 const prev=mat.onBeforeCompile;
 mat.onBeforeCompile=(s,r)=>{prev?.call(mat,s,r);Object.assign(s.uniforms,U);
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vIMp;varying vec3 vIMn;')
   .replace('#include <project_vertex>','#include <project_vertex>\nvIMp=(modelMatrix*vec4(transformed,1.)).xyz;vIMn=normalize(mat3(modelMatrix)*objectNormal);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vIMp;varying vec3 vIMn;uniform sampler2D uRooms;uniform vec2 uTile,uGrid,uPh,uMask;uniform vec4 uIM,uRange;uniform float uShopY;uniform float uF[24];
float imH(vec2 p,float k){return fract(sin(dot(p,vec2(127.1,311.7))+k*74.7)*43758.5453);}`)
  .replace('#include <map_fragment>',`#include <map_fragment>
vec3 imE=vec3(0.);
{vec3 N=normalize(vIMn);vec3 V=vIMp-cameraPosition;float dist=length(V);V/=dist;float fade=(1.-smoothstep(uIM.x,uIM.y,dist))*step(abs(N.y),.5);
 if(fade>0.){
  vec3 tc=texture2D(map,vMapUv).rgb;vec3 ts=pow(max(tc,vec3(0.)),vec3(1./2.2));float lum=dot(ts,vec3(.3,.59,.11)),chr=max(ts.r,max(ts.g,ts.b))-min(ts.r,min(ts.g,ts.b));
  float m=uMask.x<.5?1.-smoothstep(uMask.y-.06,uMask.y+.06,lum):uMask.x<1.5?smoothstep(uMask.y-.04,uMask.y+.04,chr):1.;
  vec3 Tn=normalize(cross(vec3(0.,1.,0.),N));vec2 c=vMapUv*uGrid-uPh*uGrid;vec2 id=floor(c),q=fract(c);
  float fk=dot(floor(N*3.+.5),vec3(1.3,2.9,4.7));
  float h0=imH(id,fk),h1=imH(id,fk+1.),h2=imH(id,fk+2.),h3=imH(id,fk+3.),h4=imH(id,fk+4.),h5=imH(id,fk+5.),h6=imH(id,fk+6.),h7=imH(id,fk+7.);
  float ly=vMapUv.y*uTile.y;bool shop=ly<uShopY&&uRange.w>0.;
  float idx=shop?uRange.z+floor(h1*uRange.w):uRange.x+floor(h1*uRange.y);
  vec3 d=vec3(dot(V,Tn),V.y,max(dot(V,-N),1e-3));
  float cw=uTile.x/uGrid.x,ch=uTile.y/uGrid.y,D=cw*(.75+1.1*h0);
  vec3 o=vec3(q.x*cw,q.y*ch,0.);
  float tx=(d.x>0.?cw-o.x:-o.x)/(abs(d.x)<1e-4?1e-4:d.x),ty=(d.y>0.?ch-o.y:-o.y)/(abs(d.y)<1e-4?1e-4:d.y),tz=D/d.z;
  vec3 P=o+d*min(min(tx,ty),tz);vec3 R3=vec3(P.x/cw-.5,P.y/ch-.5,P.z/D);
  int ii=int(idx);float f=uF[ii];float sc=1./(1.+R3.z*(1./f-1.));vec2 ru=.5+R3.xy*sc;if(h2>.5)ru.x=1.-ru.x;
  float col=mod(idx,6.),row=floor(idx/6.);vec2 au=(vec2(col,3.-row)+clamp(ru,.006,.994))/vec2(6.,4.);
  vec3 room=textureLod(uRooms,au,clamp(log2(dist*.07),0.,4.)).rgb;
  float L=shop?(h3<.85?1.15:.3):(h3<.26?.95:h3<.66?.3:.06);
  room*=L*mix(vec3(1.08,.9,.7),vec3(.86,.96,1.08),h6)*(.85+.3*h7);
  vec3 bc=mix(vec3(.72,.68,.58),vec3(.55,.6,.62),h7)*(.35+.55*min(L,1.))+.06;
  if(!shop){
   if(h4<.34){float bl=.12+.85*h5;if(q.y>1.-bl)room=bc*(.8+.2*step(.5,fract(q.y*ch*7.)));}
   else if(h4<.48){if(fract(q.x*cw*5.)<.4+.5*h5)room=bc*.9;}
   else if(h4<.62){float cu=.1+.3*h5;if(q.x<cu||q.x>1.-cu*(.6+.8*h0))room=mix(vec3(.5,.18,.15),vec3(.75,.7,.55),h7)*(.3+.6*min(L,1.))*(.85+.15*sin(q.x*cw*38.));}
  }
  room*=mix(vec3(1.),tc/max(dot(tc,vec3(.3,.59,.11)),.02),.35);   // glass body tint
  float F=clamp(uIM.z+(1.-uIM.z)*pow(1.-d.z,4.),0.,1.);F=max(F,smoothstep(25.,170.,dist)*.62);
  float w=m*fade;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*F,w);imE=room*(1.-F)*w*uIM.w;
 }}`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=imE;');
 };
 mat.customProgramCacheKey=()=>'im130:'+mask.join(',')+(prev?'+':'');
 mat.needsUpdate=true;return mat;
}
// --------------------------------------------------------------------------------------------- materials
export function addCanal130Materials(m){
 if(m.k130Wood)return m;
 const std=(name,o={})=>{const ns=o.ns??.8;const mm=new T.MeshStandardMaterial({map:tex(name),normalMap:tex(name+'-n',{srgb:false}),normalScale:new T.Vector2(ns,ns),roughness:o.r??.85,metalness:o.mt??0,vertexColors:true,...(o.x||{})});return mm;};
 m.k130Wood=std('wood');URBAN_TILE_SIZE.k130Wood=1.6;
 m.k130Deck=std('deck');URBAN_TILE_SIZE.k130Deck=2.4;
 m.k130Awn1=std('awn1',{ns:.4});m.k130Awn2=std('awn2',{ns:.4});URBAN_TILE_SIZE.k130Awn1=1.8;URBAN_TILE_SIZE.k130Awn2=2.4;
 m.k130Umb=std('umb',{ns:.3,x:{side:T.DoubleSide}});
 m.k130Cornice=std('cornice',{ns:1});URBAN_TILE_SIZE.k130Cornice=2.2;
 m.k130Spandrel=std('spandrel',{ns:.7,r:.6,mt:.15});URBAN_TILE_SIZE.k130Spandrel=3;
 m.k130Embank=std('embank',{ns:1});
 m.k130Outfall=std('outfall',{ns:1});
 m.k130Boat=std('boat',{ns:.8,r:.7});
 m.k130Bin=std('bin',{ns:.8,r:.6,mt:.2});m.k130Planter=std('planter',{ns:1});
 for(let k=1;k<=6;k++)m['k130Sign'+k]=std('sign'+k,{ns:.5,r:.6});
 const col=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:o.r??.6,metalness:o.mt??0,vertexColors:true,...(o.x||{})});
 m.k130Iron=col(0x1d2421,{r:.5,mt:.45});m.k130Steel=col(0x8d9496,{r:.35,mt:.7});m.k130Rust=col(0x5a3a26,{r:.8,mt:.3});
 m.k130Alu=col(0xb9bcbc,{r:.4,mt:.6});m.k130Red=col(0xb4231c,{r:.55});m.k130White=col(0xe6e3dc,{r:.6});m.k130Black=col(0x111214,{r:.7});
 m.k130Orange=col(0xe0601c,{r:.6});m.k130Green=col(0x2f5a3a,{r:.6});m.k130Navy=col(0x1f2c4a,{r:.6});m.k130Cream=col(0xd9cfb4,{r:.7});
 m.k130Fender=col(0x2a2622,{r:.95});m.k130Leaf=col(0x3c6a2e,{r:.95});m.k130Bloom=col(0xc0405a,{r:.9});m.k130Soil=col(0x2b2219,{r:1});
 m.k130Glow=new T.MeshBasicMaterial({color:0xfff0c8,vertexColors:true});
 m.k130Drip=new T.MeshBasicMaterial({color:0x223322,transparent:true,opacity:.35,depthWrite:false,vertexColors:true});
 // shop glass: same interior shader, mask 'all', shop photos only, dark glass base
 const base=new T.DataTexture(new Uint8Array([40,52,58,255,34,46,52,255,46,58,64,255,38,50,56,255]),2,2);base.colorSpace=T.SRGBColorSpace;base.wrapS=base.wrapT=T.RepeatWrapping;base.needsUpdate=true;
 m.k130Shop=new T.MeshStandardMaterial({map:base,roughness:.15,metalness:.1,vertexColors:true});
 patchInterior130(m.k130Shop,{tile:[3.2,4.2],grid:[1,1],phase:[0,0],mask:[2,0],min:.14,br:1.15,range:[17,7],shops:[17,7],shopY:99,near:70,far:130});
 m.k130Win=new T.MeshStandardMaterial({map:base,roughness:.15,metalness:.1,vertexColors:true});
 patchInterior130(m.k130Win,{tile:[2.4,3.4],grid:[1,1],mask:[2,0],min:.18,br:1,range:[0,20],shops:[0,0],near:70,far:130});
 return m;
}
// patch the V128 facade materials (called once per material set)
export function patchFacades130(m){for(const[key,cfg]of Object.entries(IM_FACADES))if(m[key])patchInterior130(m[key],{tile:m[key].userData.tile,...cfg});}
// --------------------------------------------------------------------------------------------- geometry helpers
const place=(b,x,y,z,ry,fn,args)=>{b.push(x,y,z,ry);fn(b,args||{});b.pop();};
// quad on a vertical face with world-anchored facade UVs (normal +z when dir=1, -z when dir=-1; u along the face tangent)
function paneZ(b,key,x0,x1,y0,y1,z,dir,ox,tw,th){
 const g=new T.BufferGeometry(),u0=dir>0?(ox+x0)/tw:-(ox+x1)/tw,u1=dir>0?(ox+x1)/tw:-(ox+x0)/tw,v0=y0/th,v1=y1/th;
 const P=dir>0?[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]:[[x1,y0],[x0,y0],[x0,y1],[x1,y1]],UV=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],p=[],n=[],uv=[];
 for(const i of[0,1,2,0,2,3]){p.push(P[i][0],P[i][1],z);n.push(0,0,dir);uv.push(...UV[i]);}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));b.add(g,key,0,0,0);g.dispose();
}
// plain quad with explicit uv (pts ccw seen from the normal side)
function quad(b,key,pts,uvs,nn){const g=new T.BufferGeometry(),p=[],n=[],uv=[];for(const i of[0,1,2,0,2,3]){p.push(...pts[i]);n.push(...nn);uv.push(...uvs[i]);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));b.add(g,key,0,0,0);g.dispose();}
// box with a six-face unwrap strip [+x,-x,+y,-y,+z,-z]
const UBOX=new T.BoxGeometry(1,1,1);
function ubox(b,key,x,y,z,w,h,d,ry=0){const g=UBOX.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setX(i,(f+.02+uv.getX(i)*.96)/6);}b.add(g,key,x,y,z,w,h,d,ry);g.dispose();}
const TORUS=new T.TorusGeometry(1,.06,4,12),TORUS_B=new T.TorusGeometry(1,.16,5,12),CONE=new T.ConeGeometry(1,1,8,1,true);
// --------------------------------------------------------------------------------------------- street furniture
function bench(b,{seed=0}){ // cast iron ends + 5 wood slats (seat + back), faces +z
 for(const x of[-.75,.75]){b.box('k130Iron',x,.22,0,.07,.44,.55);b.box('k130Iron',x,.62,-.24,.07,.42,.07);b.box('k130Iron',x,.44,.02,.07,.05,.5);}
 for(let k=0;k<3;k++)b.box('k130Wood',0,.47,-.15+k*.14,1.75,.04,.11);
 for(let k=0;k<2;k++)b.box('k130Wood',0,.63+k*.15,-.27,1.75,.1,.035);
 if(seed%5===0){b.box('k130White',.3,.5,.05,.22,.012,.3,.3);}   // forgotten newspaper
 b.solid(0,0,1.8,.6);
}
function bin(b){ubox(b,'k130Bin',0,.48,0,.5,.96,.42);b.box('k130Iron',0,.98,0,.54,.04,.46);b.box('k130Iron',0,.03,0,.54,.06,.46);b.solid(0,0,.55,.48);}
function planter(b,{seed=0,w=1.8}){ubox(b,'k130Planter',0,.32,0,w,.64,.8);
 for(let i=0;i<5;i++){const h=urbanHash(seed,i,0x130)%1000/1000;b.sphere('k130Leaf',-w/2+.25+(w-.5)*i/4,.68+h*.18,(h-.5)*.3,.26+h*.12,.22+h*.2,.24);if(h>.6)b.sphere('k130Bloom',-w/2+.3+(w-.5)*i/4,.86+h*.15,(h-.5)*.25,.07,.07,.07);}
 b.solid(0,0,w,.8);
}
function bike(b,{c='k130Red',ry=0}){ // leaning on a rack, wheel plane = local yz
 b.push(0,0,0,ry);for(const z of[-.52,.52])b.add(TORUS,'k130Black',0,.34,z,.34,.34,.34,Math.PI/2);
 const P=(y,z)=>[0,y,z];b.rod(c,P(.34,-.52),P(.62,-.05),.022);b.rod(c,P(.62,-.05),P(.34,.12),.022);b.rod(c,P(.34,.12),P(.34,-.52),.018);b.rod(c,P(.62,-.05),P(.72,.42),.022);
 b.rod(c,P(.72,.42),P(.34,.12),.022);b.rod(c,P(.72,.42),P(.34,.52),.02);b.rod('k130Steel',P(.72,.42),P(.86,.38),.016);b.box('k130Black',0,.88,.38,.42,.03,.03);b.box('k130Black',0,.72,-.12,.09,.04,.22);
 b.pop();
}
function bikeRack(b,{seed=0,n=4}){for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.9;b.rod('k130Steel',[x,0,-.35],[x,.75,-.35],.03);b.rod('k130Steel',[x,0,.35],[x,.75,.35],.03);b.rod('k130Steel',[x,.75,-.35],[x,.75,.35],.03);
  const h=urbanHash(seed,i,0xb1c)%100;if(h<58)place(b,x+.12,0,0,0,bike,{c:['k130Red','k130Navy','k130Green','k130Black','k130Cream'][h%5]});}
 b.solid(0,0,n*.9,.9);}
function cafeSet(b,{seed=0,umb=true}){ // round table, 2-3 chairs, optional umbrella
 b.cylinder('k130Alu',0,.73,0,.36,.36,.03,10);b.cylinder('k130Iron',0,.37,0,.03,.03,.72,6);b.cylinder('k130Iron',0,.02,0,.22,.25,.04,8);
 const n=2+urbanHash(seed,1,0xcaf)%2;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+seed*.7,x=Math.cos(a)*.62,z=Math.sin(a)*.62;b.push(x,0,z,-a+Math.PI/2);b.box('k130Alu',0,.45,0,.42,.03,.42);b.box('k130Alu',0,.68,-.2,.42,.42,.03);for(const sx of[-.18,.18])for(const sz of[-.18,.18])b.rod('k130Alu',[sx,0,sz],[sx,.45,sz],.012);b.pop();}
 if(urbanHash(seed,2,0xcaf)%3===0){b.cylinder('k130White',.12,.79,.05,.04,.03,.09,8);b.cylinder('k130White',-.1,.76,-.08,.07,.07,.01,10);}   // cup + saucer
 if(umb){b.cylinder('k130White',0,1.35,0,.025,.025,2.1,6);b.add(CONE,'k130Umb',0,2.28,0,1.35,.45,1.35);b.cylinder('k130Umb',0,2.05,0,1.35,1.35,.12,8);}
 b.solid(0,0,1.5,1.5);
}
function lifebuoy(b){b.box('k130Iron',0,.7,0,.08,1.4,.08);b.box('k130Iron',0,1.32,.06,.5,.05,.05);b.add(TORUS_B,'k130Orange',0,.95,.1,.3,.3,.3);for(let k=0;k<4;k++)b.box('k130White',Math.cos(k*Math.PI/2)*.3,.95+Math.sin(k*Math.PI/2)*.3,.1,.09,.09,.11);b.solid(0,0,.3,.3);}
function streetLamp130(b){ // cast-iron canal lamp with a lantern head (warm glow)
 b.cylinder('k130Iron',0,.25,0,.16,.2,.5,8);b.cylinder('k130Iron',0,2.1,0,.05,.075,3.4,8);b.cylinder('k130Iron',0,3.85,0,.12,.05,.25,8);
 b.box('k130Glow',0,4.2,0,.26,.42,.26);for(const[x,z]of[[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]])b.box('k130Iron',x,4.2,z,.03,.46,.03);b.add(CONE,'k130Iron',0,4.5,0,.24,.2,.24);b.solid(0,0,.35,.35);}
// --------------------------------------------------------------------------------------------- embankment + water
// facing (moss / tide line / rust) on both channel walls, drain outfalls, ladders, lifebuoys, boats, pontoons, buoys
function wallFacing(b,x0,x1,wy){for(const[z,s]of[[C.z0,1],[C.z1,-1]]){const zz=z+s*.012,y0=wy-.35,y1=TOP-.12,L=x1-x0,u=L/3.4;
 const pts=s>0?[[x0,y0,zz],[x1,y0,zz],[x1,y1,zz],[x0,y1,zz]]:[[x1,y0,zz],[x0,y0,zz],[x0,y1,zz],[x1,y1,zz]];quad(b,'k130Embank',pts,[[0,0],[u,0],[u,1],[0,1]],[0,0,s]);}}
function outfall(b,x,z,s,wy,big){const r=big?.55:.32,y=wy+.25+r;b.plane('k130Outfall',x,y-.15,z+s*.02,r*3,r*3.3,s>0?0:Math.PI);b.cylinder('k130Rust',x,y,z+s*.12,r,r,.26,10,Math.PI/2);b.cylinder('k130Black',x,y,z+s*.26,r*.82,r*.82,.02,10,Math.PI/2);
 b.plane('k130Drip',x,(wy+y)/2-.05,z+s*.03,r*1.2,y-wy,s>0?0:Math.PI);}
function ladder(b,x,z,s,wy){const y0=wy-1.2,y1=TOP;for(const dx of[-.22,.22]){b.box('k130Iron',x+dx,(y0+y1)/2,z+s*.14,.05,y1-y0,.05);b.rod('k130Iron',[x+dx,TOP+.05,z-s*.05],[x+dx,TOP+.95,z-s*.05],.03);b.rod('k130Iron',[x+dx,TOP+.95,z-s*.05],[x+dx,TOP+.95,z+s*.12],.03);b.rod('k130Iron',[x+dx,TOP+.95,z+s*.12],[x+dx,TOP-.1,z+s*.14],.03);}
 for(let y=y0+.2;y<y1;y+=.3)b.box('k130Iron',x,y,z+s*.16,.44,.03,.03);}
function narrowboat(b,{seed=0,len=17,ry=0}){ // hull + cabin, painted sides (boat texture on both sides), roof clutter
 b.push(0,0,0,ry);const L=len,W=2.05,h0=WY-.45,h1=WY+.5,h2=WY+1.7;
 b.box('k130Black',0,(h0+h1)/2,0,L-1.4,h1-h0,W);b.box('k130Black',L/2-.45,(h0+h1)/2+.05,0,.9,h1-h0+.1,W*.62);b.box('k130Black',-L/2+.4,(h0+h1)/2,0,.8,h1-h0,W*.8);
 b.box('k130Red',-.3,(h1+h2)/2,0,L-3,h2-h1,W*.84);
 // painted sides: hull part of the boat texture on the hull, cabin part on the cabin side (v split 0.45)
 for(const s of[1,-1])for(const[zh,ya,yb,va,vb,xa,xb]of[[W/2+.012,h0+.1,h1,0,.45,-L/2+.7,L/2-.7],[W*.42+.012,h1,h2,.45,1,-L/2+1.2,L/2-1.8]]){const z=s*zh,u0=(xa+L/2)/L,u1=(xb+L/2)/L;
  const pts=s>0?[[xa,ya,z],[xb,ya,z],[xb,yb,z],[xa,yb,z]]:[[xb,ya,z],[xa,ya,z],[xa,yb,z],[xb,yb,z]];quad(b,'k130Boat',pts,s>0?[[u0,va],[u1,va],[u1,vb],[u0,vb]]:[[u1,va],[u0,va],[u0,vb],[u1,vb]],[0,0,s]);}b.box('k130Cream',-.3,h2+.04,0,L-2.9,.08,W*.9);
 b.box('k130Green',L/2-1.8,h1+.2,0,.1,.5,W*.9);b.box('k130Fender',L/2-.02,h1-.2,0,.2,.35,.5);b.box('k130Fender',-L/2,h1-.2,0,.2,.35,.6);
 b.cylinder('k130Black',L/2-4,h2+.45,.35,.08,.08,.8,6);b.cylinder('k130Black',L/2-4,h2+.9,.35,.13,.1,.12,6);
 for(let i=0;i<3;i++){const x=-L/2+3+i*2.2,hh=urbanHash(seed,i,0xb0a)%100;if(hh<70){b.box('k130Rust',x,h2+.16,-.4,.5,.24,.3);b.sphere('k130Leaf',x,h2+.38,-.4,.3,.22,.2);if(hh<35)b.sphere('k130Bloom',x+.1,h2+.5,-.4,.08,.08,.08);}}
 if(seed%2)b.box('k130Navy',-L/2+5,h2+.2,.4,1.2,.3,.6);   // tarpaulin bundle
 b.box('k130Wood',-L/2+1.6,h2+.12,.5,2.2,.1,.18);              // spare plank on the roof
 for(let k=0;k<4;k++)b.box('k130Fender',-L/2+2+k*(L-4)/3,h0+.75,-W/2-.04,.25,.32,.08);
 b.pop();
}
function rowboat(b){const h0=WY-.15;b.box('k130White',0,h0+.18,0,3.2,.42,1.25);b.box('k130Navy',0,h0+.42,0,3.25,.06,1.3);b.box('k130Wood',0,h0+.3,0,.3,.05,1.15);b.box('k130Wood',.9,h0+.3,0,.3,.05,1.15);b.add(CONE,'k130White',1.95,h0+.18,0,.6,.7,.42,0,0,-Math.PI/2);}
function pontoon(b,{len=11,w=2.4}){ // floating deck on drums, cleats, gangway ladder up to the coping
 const y=WY+.32;b.box('k130Deck',0,y,0,len,.16,w);for(let x=-len/2+1;x<len/2;x+=2.2)for(const z of[-w/3,w/3])b.cylinder('k130Navy',x,WY+.05,z,.32,.32,.9,8,0,Math.PI/2);
 for(const x of[-len/2+.6,len/2-.6])b.box('k130Iron',x,y+.12,-w/2+.15,.25,.08,.08);b.box('k130Fender',0,y-.05,w/2,len,.12,.1);
 for(let x=-len/2+.3;x<len/2;x+=1.8)b.box('k130Iron',x,y+.55,-w/2+.06,.04,.9,.04);b.box('k130Iron',0,y+1,-w/2+.06,len-.4,.04,.04);
}
function buoy(b,{c='k130Red'}){b.cylinder(c,0,WY+.25,0,.32,.42,.6,8);b.cylinder('k130White',0,WY+.65,0,.1,.32,.2,8);b.cylinder(c,0,WY+.95,0,.04,.04,.45,6);b.sphere('k130Glow',0,WY+1.2,0,.06,.06,.06);}
// --------------------------------------------------------------------------------------------- per block (all open canal blocks)
export function* canal130Life(b,plan,lod){
 addCanal130Materials(b.mats);patchFacades130(b.mats);
 const cn=plan.canal;if(!cn)return;const hs=(i,k)=>urbanHash(plan.ix*7+i,plan.iz*13+k,0x130a);
 const lw=cn.portalW?30:0,le=cn.portalE?112-30:112;
 wallFacing(b,lw,le,WY);if(cn.portalW)wallFacing(b,0,lw,-4.4);if(cn.portalE)wallFacing(b,le,112,-4.4);yield;
 // outfalls + ladders on both walls
 for(const[z,s]of[[C.z0,1],[C.z1,-1]]){for(let k=0;k<3;k++){const x=lw+8+(le-lw-16)*(k+.2+.6*(hs(k,s>0?1:2)%100)/100)/3;outfall(b,x,z,s,WY,hs(k,s+5)%3===0);}
  for(let x=lw+14+(hs(9,s+9)%8);x<le-6;x+=27)if(!lod)ladder(b,x,z,s,WY);}
 yield;if(lod)return;
 // lifebuoys on the promenades (behind the railing), boats + pontoon + buoys on the water
 for(const[z,s]of[[C.z0-.6,-1],[C.z1+.6,1]])for(let x=lw+20+(hs(3,s+3)%10);x<le-8;x+=46)place(b,x,TOP,z,s>0?Math.PI:0,lifebuoy);
 if(!cn.hero){
  const nb=hs(4,4)%3;for(let i=0;i<nb;i++){const south=(hs(i,40)%2)===0,x=Math.min(le-12,lw+14+i*((le-lw-28)/Math.max(1,nb))+(hs(i,41)%6));place(b,x,0,south?C.z0+1.2:C.z1-1.2,south?0:Math.PI,narrowboat,{seed:hs(i,42),len:15+hs(i,43)%6});}
  if(hs(5,5)%2){const x=lw+(le-lw)*.62;place(b,x,0,C.z1-1.35,0,pontoon,{len:10});place(b,x+1,0,C.z1-3.4,.08,rowboat);}
  if(cn.portalE||cn.portalW){const x=cn.portalE?le-9:lw+9;for(const z of[C.z0+6,C.z1-6])place(b,x,0,z,0,buoy,{c:z<C.mid?'k130Red':'k130Green'});}
  // promenade furniture between the V128 trees (x = px0+6+22k) and lamps (x = px0+17+22k)
  const px0=cn.noRoadW?0:12,px1=cn.noRoadE?112:100;
  for(const[edge,s]of[[C.z0,-1],[C.z1,1]]){for(let x=px0+11.5,i=0;x<px1-3;x+=11,i++){const h=hs(i,s+20)%10,z=edge+s*2.6;
   if(h<4){place(b,x,TOP,z,s>0?Math.PI:0,bench,{seed:hs(i,s+21)});if(h<2)place(b,x+1.4,TOP,z-s*.05,0,bin);}
   else if(h<6)place(b,x,TOP,edge+s*3.6,0,planter,{seed:hs(i,s+22)});else if(h<7)place(b,x,TOP,edge+s*3.3,0,bikeRack,{seed:hs(i,s+23),n:3});}yield;}
 }
 if(cn.hero)yield* heroLife(b,plan);
}
// --------------------------------------------------------------------------------------------- photo reach (city x, see canal128 HERO)
// a run of shopfronts on a building face at zf (facade normal dir), between x0..x1 (city x), units ~6-7 m
const SIGNS=[[1,'k130Awn1'],[2,null],[3,'k130Awn2'],[4,null],[5,'k130Awn1'],[6,'k130Awn2']];
function shopRow(b,ox,x0,x1,zf,dir,seed,{fascia=true,awn=true,bladeAt=-1}={}){
 const n=Math.max(1,Math.round((x1-x0)/6.6)),w=(x1-x0)/n;
 for(let i=0;i<n;i++){const a=x0+i*w-ox,c=a+w,mid=(a+c)/2,z=zf+dir*.16,h=urbanHash(seed,i,0x5b0);const[sg,awk]=SIGNS[(seed+i)%6];
  b.box('k130Spandrel',mid,.5,zf+dir*.15,w-.1,.7,.3);                         // bulkhead / stall riser
  paneZ(b,'k130Shop',a+.15,c-.15,.85,3.35,z,dir,ox,3.2,4.2);                  // shop glass (interior mapped)
  for(let x=a+.12;x<=c-.1;x+=Math.max(1.1,(w-.3)/Math.max(2,Math.round(w/1.6))))b.box('k130Iron',x,2.1,z+dir*.03,.08,2.55,.1);   // mullions
  b.box('k130Iron',mid,2.75,z+dir*.03,w-.2,.07,.1);b.box('k130Iron',mid,.85,z+dir*.03,w-.2,.08,.1);
  const dx=a+w*(.2+.5*(h%100)/100);b.box('k130Black',dx,1.6,z+dir*.02,1.1,1.5,.05);b.box('k130Alu',dx+.4,1.5,z+dir*.08,.04,.4,.05);  // door + handle
  if(fascia){b.box('k130Iron',mid,3.75,zf+dir*.2,w-.05,.85,.4);const sw=Math.min(w*.72,4.6);b.plane('k130Sign'+sg,mid,3.75,zf+dir*.41,sw,sw/4.1,dir>0?0:Math.PI);
   b.box('k130Glow',mid,4.22,zf+dir*.45,sw*.9,.03,.06);}
  if(awn&&awk&&h%3!==0){const dep=1.5,ang=.32;b.add(new T.BoxGeometry(1,1,1),awk,mid,3.05,zf+dir*(.4+dep/2),w-.4,.04,dep/Math.cos(ang),0,dir*ang);   // sloped canvas
   b.box(awk,mid,2.85-Math.tan(ang)*0+-.0,zf+dir*(.4+dep),w-.4,.32,.03);for(const sx of[-1,1])b.rod('k130Iron',[mid+sx*(w/2-.3),3.3,zf+dir*.35],[mid+sx*(w/2-.3),2.75,zf+dir*(.4+dep)],.02);}
  if(i===bladeAt){b.box('k130Iron',c-.4,4.55,zf+dir*.55,.06,.06,1.1);b.box('k130White',c-.4,4.1,zf+dir*.95,.06,.8,.8);b.box('k130Green',c-.4,4.1,zf+dir*.95,.08,.5,.15);b.box('k130Green',c-.4,4.1,zf+dir*.95,.08,.15,.5);}
 }
}
function cornice(b,ox,x0,x1,z0,z1,y,{key='k130Cornice',h=.55,p=.28}={}){
 b.box(key,(x0+x1)/2-ox,y-h/2,z0-p/2,x1-x0+2*p,h,p);b.box(key,(x0+x1)/2-ox,y-h/2,z1+p/2,x1-x0+2*p,h,p);
 b.box(key,x0-ox-p/2,y-h/2,(z0+z1)/2,p,h,z1-z0);b.box(key,x1-ox+p/2,y-h/2,(z0+z1)/2,p,h,z1-z0);}
function* heroLife(b,plan){
 const ox=plan.x,bx0=ox,bx1=ox+112,inb=(x0,x1)=>[Math.max(x0,bx0),Math.min(x1,bx1)],ok=([a,c])=>c-a>1;
 // shopfronts: grey slab (face z 32), grey slab + green glass (z 34), glassA podium behind the colonnade (z 31.4), white tower podium (z 84, facing -z)
 for(const[x0,x1,zf,dir,seed,o]of[[124,150,32,1,1,{bladeAt:1}],[258,285,34,1,3,{}],[285,322,34,1,5,{bladeAt:0}],[150,258,31.4,1,0,{fascia:true,awn:false}],[150,214,86.6,-1,2,{}],[253.5,320,86.6,-1,4,{bladeAt:2}]]){
  const r=inb(x0,x1);if(!ok(r))continue;const y0=zf>50?1.35:0;
  if(y0){b.box('k128Pave',(r[0]+r[1])/2-ox,(TOP+y0)/2,85.3,r[1]-r[0],TOP+y0,2.6);b.walk((r[0]+r[1])/2-ox,85.3,r[1]-r[0],2.6,TOP+y0);}
  b.push(0,y0,0,0);shopRow(b,ox,r[0],r[1],zf,dir,seed,o);b.pop();yield;}
 // cornices + parapets on the photo-reach buildings, metal coping on the glass towers, glass fins on the lower glassA floors
 for(const[key,x0,x1,z0,z1,h]of[['s',124,150,12,32,30],['g',150,258,12,34,72],['s',258,285,14,34,27],['g',285,322,16,34,27],['s',150,214,84,100,54],['s',253.5,320,84,100,47],['s',124,150,80,100,26]]){
  const[a,c]=inb(x0,x1);if(c-a<.5)continue;const y=TOP+h;
  if(key==='s'){cornice(b,ox,a,c,z0,z1,y+.1,{});b.box('k130Cornice',(a+c)/2-ox,y+.55,z0<50?z1-.12:z0+.12,c-a,.9,.24);   // parapet
   cornice(b,ox,a,c,z0,z1,TOP+6.4,{h:.32,p:.14});}   // string course over the shop floor
  else{cornice(b,ox,a,c,z0,z1,y+.2,{key:'k130Alu',h:.4,p:.1});}
  yield;}
 {const[a,c]=inb(150,258);for(let x=Math.ceil(a/2.22)*2.22;x<c;x+=2.22)b.box('k130Alu',x-ox,TOP+9+12,34.12,.07,24,.24);yield;}
 // cafe terrace in front of Cafe Lumen (grey slab 124..150) and the bakery (258..285): tables + umbrellas on the promenade
 for(const[x0,x1,s]of[[126,148,1],[260,283,3]]){const[a,c]=inb(x0,x1);if(c-a<3)continue;let i=0;for(let x=a+1.6;x<c-1;x+=3.1,i++)if(Math.abs(x-Math.round(x/9)*9)>1.5)place(b,x-ox,TOP,i%2?36.9:35.2,0,cafeSet,{seed:s*31+i,umb:i%3!==1});
  for(const x of[a+.6,c-.6])place(b,x-ox,TOP,34.5,Math.PI/2,planter,{seed:s+x|0,w:1.2});yield;}
 // promenade furniture (south bank: between the V128 tree/lamp rhythm of 9 m; north bank under the 24 m lamps)
 {const[a,c]=inb(150,336);let i=0;for(let x=Math.ceil((a-4.5)/18)*18+4.5;x<c-2;x+=18,i++){if((x>124&&x<150)||(x>258&&x<285))continue;const k=urbanHash(i,x|0,0x5e)%4;
   if(k<2)place(b,x-ox,TOP,37.2,0,bench,{seed:i});if(k===0)place(b,x+1.5-ox,TOP,37.3,0,bin);if(k===2)place(b,x-ox,TOP,35,0,bikeRack,{seed:i,n:4});if(k===3)place(b,x-ox,TOP,35,0,planter,{seed:i});}yield;}
 {const[a,c]=inb(196,330);let i=0;for(let x=Math.ceil(a/16)*16+12;x<c-2;x+=16,i++){const k=urbanHash(i,7,0x5f)%3;place(b,x-ox,TOP,77.4,Math.PI,bench,{seed:i+9});if(k===0)place(b,x-ox+1.5,TOP,77.4,0,bin);if(k===1)place(b,x-ox,TOP+1.05,83,0,planter,{seed:i+40,w:2.4});}yield;}
 {const[a,c]=inb(150,196);for(let x=Math.ceil(a/14)*14+6;x<c-2;x+=14)place(b,x-ox,TOP,77.2,0,bikeRack,{seed:x|0,n:5});yield;}
 // canal lamps on the north plaza edge + footbridge heads
 {const[a,c]=inb(140,330);for(let x=Math.ceil(a/32)*32+20;x<c;x+=32)place(b,x-ox,TOP+.15,80.6,0,streetLamp130);yield;}
 // boats in the reach: a narrowboat on the south wall, a pontoon with a rowboat on the north wall, buoys toward the lock
 for(const[x,fn,z,ry,args]of[[206,narrowboat,C.z0+1.2,0,{seed:7,len:18}],[235,pontoon,C.z1-1.35,0,{len:12}],[236,rowboat,C.z1-3.5,.1,{}],[318,narrowboat,C.z1-1.2,Math.PI,{seed:8,len:16}],[425,buoy,C.z0+7,0,{c:'k130Red'}],[425,buoy,C.z1-7,0,{c:'k130Green'}]]){
  if(x>=bx0&&x<bx1){place(b,x-ox,0,z,ry,fn,args);yield;}}
}
