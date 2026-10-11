// V118b-L11 (parallel): Hope Street right-hand podium, redone after the V118 review.
// Authored in the un-mirrored Hope frame of reference-scenes.js hopeStreet(); photoHandedness() mirrors x later,
// so every textured quad here pre-flips u (print reads correctly in game).
// V118b rules: no fake interiors (patterned / frosted glass instead), every magazine, paper, box face and wall
// has its own generated texture (assets/l11-v118/*.webp from art-l11v118b via tools/hopest118b_assets.py),
// stacks and bundles are real geometry, and nothing is coplanar with the shared city pavement (exit-scene.js
// referenceGround already paves z -1.5..2.95 at y .15 along this face; V118's extra strip z-fought it).
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {H118B_KIOSK as K,H118B_GLASS as G} from './hopest118-atlas.js?v=118b';
const A=new URL('./assets/l11-v118/',import.meta.url).href;
export const H118_PROPS={atm:[0,.7187,.1875,.2812],atmside:[.1875,.7187,.0625,.2812],plank:[.25,.9062,.375,.0937],commute:[.25,.6562,.375,.25],cash:[.625,.7656,.1875,.1406],kioskback:[0,.375,.5,.2812],lotto:[.875,.2187,.0937,.1562],steel:[.25,0,.0625,.0625]};
const texCache={};
export function h118Texture(name,{repeat=false,nearest=false}={}){
 const k=name+repeat+nearest;if(texCache[k])return texCache[k];
 const t=new T.TextureLoader().load(A+name+'.webp?v=118b');t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;
 if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;if(nearest)t.magFilter=T.NearestFilter;
 return texCache[k]=t;
}
// tiled surfaces (metres per tile) – each face family has its own texture
const TILES={h118StoneUpper:['stoneupper',3.6],h118StonePier:['stonepier',1.25],h118GraniteBase:['granitebase',1.5],h118KioskL:['kioskl',1.3],h118KioskR:['kioskr',1.0],h118Ceiling:['ceiling',.62],h118Floor:['floor',.7]};
export function addHope118Materials(m){
 const props=h118Texture('props'),kiosk=h118Texture('kiosk',{nearest:true}),glass=h118Texture('glass');
 m.h118Props=new T.MeshStandardMaterial({map:props,roughness:.72,vertexColors:true});
 m.h118Glossy=new T.MeshStandardMaterial({map:props,roughness:.35,metalness:.05,vertexColors:true,emissiveMap:props,emissive:0xffffff,emissiveIntensity:.07});
 m.h118Kiosk=new T.MeshStandardMaterial({map:kiosk,roughness:.86,vertexColors:true});
 m.h118Mag=new T.MeshStandardMaterial({map:kiosk,roughness:.42,metalness:.04,vertexColors:true,emissiveMap:kiosk,emissive:0xffffff,emissiveIntensity:.06});
 m.h118Glass=new T.MeshStandardMaterial({map:glass,emissiveMap:glass,emissive:0xe8ecea,emissiveIntensity:.42,roughness:.24,metalness:.12,vertexColors:true});
 m.h118GlassLit=new T.MeshStandardMaterial({map:glass,emissiveMap:glass,emissive:0xfff1d2,emissiveIntensity:1.2,roughness:.3,vertexColors:true});
 m.h118GlassWin=new T.MeshStandardMaterial({map:glass,emissiveMap:glass,emissive:0xb9c4c0,emissiveIntensity:.22,roughness:.18,metalness:.2,vertexColors:true});
 m.h118Counter=new T.MeshStandardMaterial({map:h118Texture('counter'),roughness:.8,vertexColors:true});
 m.h118Cabinet=new T.MeshStandardMaterial({map:h118Texture('cabinet'),roughness:.8,vertexColors:true});
 for(const[k,[tex,tile]]of Object.entries(TILES)){m[k]=new T.MeshStandardMaterial({map:h118Texture(tex,{repeat:true}),roughness:k==='h118GraniteBase'?.45:.88,vertexColors:true});URBAN_TILE_SIZE[k]=tile;}
 m.h118Bronze=new T.MeshStandardMaterial({color:0x3b302a,roughness:.5,metalness:.55,vertexColors:true});
 m.h118Fitting=new T.MeshStandardMaterial({color:0xc9ccc8,roughness:.3,metalness:.85,vertexColors:true});
 m.h118Dark=new T.MeshStandardMaterial({color:0x1d1f1d,roughness:.8,vertexColors:true});
 m.h118Wire=new T.MeshStandardMaterial({color:0x8d918d,roughness:.42,metalness:.7,vertexColors:true});
 m.h118Twine=new T.MeshStandardMaterial({color:0xb79c69,roughness:.95,vertexColors:true});
 m.h118Peg=new T.MeshStandardMaterial({color:0xc8b48a,roughness:.8,vertexColors:true});
 m.h118Lamp=new T.MeshStandardMaterial({color:0xf4f1e2,emissive:0xfff6dc,emissiveIntensity:1.4,vertexColors:true});
 return m;
}
// ---- geometry helpers ----
const UPV=new T.Vector3(0,1,0);
function inset(r){const e=.5/1024;return[r[0]+e*Math.sign(r[2]),r[1]+e,r[2]-2*e*Math.sign(r[2]),r[3]-2*e];}
// One quad, centre c, outward normal n, size w x h; rect [u,v,w,h] (atlas) or tiled:true for raw repeat uvs.
function quadGeo(c,n,w,h,rect,up=UPV){
 const N=new T.Vector3(...n).normalize(),U=up.clone(),Rt=new T.Vector3().crossVectors(N.clone().negate(),U).normalize();U.crossVectors(Rt,N.clone().negate()).normalize().negate();
 if(U.dot(up)<0)U.negate();
 const C=new T.Vector3(...c),p=(sx,sy)=>C.clone().addScaledVector(Rt,sx*w/2).addScaledVector(U,sy*h/2);
 const r=rect.tiled?rect:inset(rect),u0=r[0],v0=r[1],u1=r[0]+r[2],v1=r[1]+r[3];
 const V=[[p(-1,-1),u1,v0],[p(1,-1),u0,v0],[p(1,1),u0,v1],[p(-1,-1),u1,v0],[p(1,1),u0,v1],[p(-1,1),u1,v1]];
 return{pos:V.flatMap(v=>v[0].toArray()),uv:V.flatMap(v=>[v[1],v[2]]),nrm:V.flatMap(()=>N.toArray())};
}
function build(parts){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(parts.flatMap(p=>p.pos),3));g.setAttribute('normal',new T.Float32BufferAttribute(parts.flatMap(p=>p.nrm),3));g.setAttribute('uv',new T.Float32BufferAttribute(parts.flatMap(p=>p.uv),2));return g;}
function addQuad(b,key,c,n,w,h,rect,tone=1,up=UPV){const g=build([quadGeo(c,n,w,h,rect,up)]);b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
const tiled=(w,h,t)=>Object.assign([0,0,w/t,h/t],{tiled:true});
const sub=(r,x0,y0,x1,y1)=>[r[0]+r[2]*x0,r[1]+r[3]*y0,r[2]*(x1-x0),r[3]*(y1-y0)];
// Box with per-face rects {px,nx,py,ny,pz,nz}; topUp sets which way the top image's "up" points (default -z).
function abox(b,key,x,y,z,w,h,d,faces,{ry=0,rx=0,rz=0,def,tone=1,skip=[],topUp=[0,0,-1]}={}){
 const F={px:[[w/2,0,0],[1,0,0],d,h],nx:[[-w/2,0,0],[-1,0,0],d,h],py:[[0,h/2,0],[0,1,0],w,d],ny:[[0,-h/2,0],[0,-1,0],w,d],pz:[[0,0,d/2],[0,0,1],w,h],nz:[[0,0,-d/2],[0,0,-1],w,h]},parts=[];
 for(const[k,[c,n,fw,fh]]of Object.entries(F)){if(skip.includes(k))continue;const r=faces[k]||def;if(!r)continue;parts.push(quadGeo(c,n,fw,fh,r,k==='py'||k==='ny'?new T.Vector3(...topUp):UPV));}
 const g=build(parts);b.add(g,key,x,y,z,1,1,1,ry,rx,rz,tone);g.dispose();
}
function urbanRand(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
let R=urbanRand(1181);
// one glass pane: variant v of the 6 generated panels, random sub-crop + mirror so no two panes match
function pane(b,key,c,n,w,h,v,tone){
 const r=G[v%G.length],s=.78+R()*.2,ox=R()*(1-s),oy=R()*(1-s*Math.min(1,h/w*.5)),hh=Math.min(1-oy,s*Math.min(1,h/w*.5)*2);
 let q=sub(r,ox,oy,ox+s,Math.min(1,oy+hh));if(R()<.5)q=[q[0]+q[2],q[1],-q[2],q[3]];
 addQuad(b,key,c,n,w,h,q,tone);
}
// ---- 1. Glass curtain-wall entrance above the plaza stair (image-30): frit / etched / reeded panels ----
function glassEntrance(b){
 const X=31.12,z0=3.4,z1=15.2,y0=3.45,y1=16.4,cols=10,cw=(z1-z0)/cols,rowsY=[3.45,6.15,8.75,11.35,13.95,16.4];
 b.box('h118StonePier',30.86,(y0+y1)/2,3.2,1.08,y1-y0,.4);b.box('h118StonePier',30.86,(y0+y1)/2,15.3,1.08,y1-y0,.2);
 b.box('h118Bronze',30.40,y1-.12,(z0+z1)/2,.18,.24,z1-z0+.2);for(const z of[z0,z1])b.box('h118Bronze',30.40,(y0+y1)/2,z,.18,y1-y0,.12);
 b.box('h118StoneUpper',30.86,y1+.02,(z0+z1)/2,1.08,.04,z1-z0);
 // panel families run in vertical bands like the reference (frit dots low, linear etch / cloud above), each pane its own crop
 const band=i=>i<2||i>7?1:i%3===0?4:i%2?0:2;
 for(let j=0;j<rowsY.length-1;j++){const ya=rowsY[j],yb=rowsY[j+1],top=j===rowsY.length-2;
  for(let i=0;i<cols;i++){const zc=z0+cw*(i+.5);if(j===0&&i>=2&&i<=7)continue;
   const tone=top?1:.86+R()*.14-(j===0?.1:0);
   pane(b,top?'h118GlassLit':'h118Glass',[X,(ya+yb)/2,zc],[-1,0,0],cw-.03,yb-ya-.03,top?(i%3===1?1:4):band(i)+(j===0?0:(j%2)*2),tone);
  }}
 // three pairs of frosted-mosaic / reeded glass doors (no fake lobby), bronze frames and pull bars
 for(const[za,zb]of[[z0+cw*2,z0+cw*4],[z0+cw*4,z0+cw*6],[z0+cw*6,z0+cw*8]]){const zc=(za+zb)/2,w=zb-za;
  for(const s of[-1,1])pane(b,'h118Glass',[X+.02,y0+1.3,zc+s*w/4],[-1,0,0],w/2-.05,2.6,s<0?5:3,.82+R()*.1);
  b.box('h118Bronze',X-.04,y0+2.66,zc,.14,.12,w);b.box('h118Bronze',X-.04,y0+.04,zc,.14,.08,w);
  for(const z of[za+.03,zc,zb-.03])b.box('h118Bronze',X-.04,y0+1.33,z,.14,2.66,.07);
  for(const s of[-1,1])b.rod('photoRail',[X-.14,y0+.75,zc+s*.12],[X-.14,y0+1.95,zc+s*.12],.018);
 }
 for(let i=0;i<=cols;i++){const z=z0+cw*i;b.box('h118Fitting',X-.06,(y0+y1)/2,z,.12,y1-y0,.035,0,.55);b.box('h118Dark',X+.12,(y0+y1)/2,z,.25,y1-y0,.05);}
 for(const y of rowsY)b.box('h118Fitting',X-.05,y,(z0+z1)/2,.09,.03,z1-z0,0,.6);
 for(const y of rowsY.slice(1,-1))for(let i=1;i<cols;i++){const z=z0+cw*i;
  b.cylinder('h118Fitting',X-.13,y,z,.035,.035,.10,8,0,Math.PI/2);
  for(const a of[.785,2.356,3.927,5.498]){const dy=Math.sin(a)*.17,dz=Math.cos(a)*.17;b.rod('h118Fitting',[X-.1,y,z],[X-.07,y+dy,z+dz],.014);b.cylinder('h118Fitting',X-.055,y+dy,z+dz,.028,.028,.03,8,0,Math.PI/2);}
 }
 b.box('h118Bronze',X-.05,y0+.06,(z0+z1)/2,.16,.12,z1-z0);
}
// ---- 2. Street (south) face: patterned-glass windows, two ATMs, COMMUTE SHOP kiosk ----
const FACE=2.78;
function southFace(b){
 const X0=30.32,X1=69.5,band=5.2,top=16.4;
 b.box('h118StoneUpper',(X0+X1)/2,(band+top)/2,FACE+.17,X1-X0,top-band,.34);
 for(let y=band+2.6;y<top;y+=2.6)b.box('photoFrame',(X0+X1)/2,y,FACE-.005,X1-X0,.03,.012);
 b.box('h118GraniteBase',(X0+X1)/2,band-.12,FACE-.06,X1-X0,.24,.18);
 b.box('h118StoneUpper',(X0+X1)/2,band-.55,FACE+.17,X1-X0,.66,.34);
 const bays=[['pier',30.32,31.6]];let x=31.6;
 for(let i=0;i<6;i++){bays.push(['win',x,x+2.4]);bays.push(['pier',x+2.4,x+3.4]);x+=3.4;}
 bays.push(['win',x,x+2.4]);x+=2.4;bays.push(['atm',x,x+2.2]);x+=2.2;bays.push(['win',x,x+2.4]);x+=2.4;bays.push(['atmx',x,x+2.2]);x+=2.2;
 bays.push(['pier',x,x+.5]);x+=.5;bays.push(['kiosk',x,x+4.4]);x+=4.4;bays.push(['pier',x,X1]);
 const sill=.95,head=3.85,depth=.46;let win=0;
 for(const[kind,a,c]of bays){const w=c-a,m=(a+c)/2;
  if(kind!=='kiosk'&&kind!=='win'){b.box('h118StonePier',m,(band-.88)/2,FACE+.17,w,band-.88,.34);b.box('h118GraniteBase',m,.45,FACE-.03,w,.9,.12);}
  if(kind==='win'){
   b.box('h118GraniteBase',m,sill/2,FACE-.03,w,sill,.12);b.box('h118StoneUpper',m,(head+band-.88)/2,FACE+.17,w,band-.88-head,.34);
   b.box('h118StonePier',m,sill-.1,FACE+.17,w,.2,.34);
   for(const s of[a,c])b.box('h118StonePier',s+(s===a?.05:-.05),(sill+head)/2,FACE+depth/2,.1,head-sill,depth);
   b.box('h118StonePier',m,head-.05,FACE+depth/2,w,.1,depth);b.box('h118GraniteBase',m,sill+.03,FACE+depth/2-.06,w,.06,depth+.12);
   // patterned glass: two lights per window, family varies window to window, every light its own crop
   const fam=[2,3,1,4,0,3,2,4,1][win%9];win++;const gw=(w-.2)/2,gy=(sill+head)/2+.03,gh=head-sill-.14;
   for(const s of[-1,1])pane(b,'h118GlassWin',[m+s*gw/2,gy,FACE+depth],[0,0,-1],gw-.02,gh,(fam+(s>0&&R()<.4?1:0))%5,.6+R()*.25);
   for(const dx of[-(w-.2)/2,0,(w-.2)/2])b.box('h118Bronze',m+dx,(sill+head)/2,FACE+depth-.03,.06,head-sill-.1,.06);
   for(const y of[sill+.1,head-.12,sill+2.15])b.box('h118Bronze',m,y,FACE+depth-.03,w-.18,.05,.06);
  }
  if(kind==='atm'||kind==='atmx')atm(b,m,kind==='atmx');
  if(kind==='kiosk')kiosk(b,a,c,band);
 }
 // east return pavement only where the shared city pavement (z<2.95) does not already lie
 b.box('sidewalk',70.0,.075,33.15,1.0,.15,60.3);b.walk(70.0,33.15,1.0,60.3,.15);
}
function atm(b,m,broken){
 const P=H118_PROPS,zf=FACE-.26,yc=1.52;
 b.box('h118GraniteBase',m,yc+.05,FACE-.035,1.18,1.62,.08);
 abox(b,'h118Glossy',m,yc,FACE-.13,.82,1.24,.26,{nz:P.atm,px:P.atmside,nx:P.atmside,py:P.atmside,ny:P.atmside},{def:P.atmside});
 abox(b,'h118Glossy',m,yc+.70,FACE-.19,.9,.12,.38,{},{def:P.atmside,rx:-.18});
 b.box('h118Dark',m,yc-.82,FACE-.05,.9,.16,.1);
 if(broken){const pl=P.plank,edge=sub(pl,0,0,1,.12);
  abox(b,'h118Props',m+.02,yc+.12,zf-.04,1.04,.27,.035,{nz:pl,pz:sub(pl,1,0,0,1)},{def:edge,rz:-.13});
  abox(b,'h118Props',m-.06,yc-.28,zf-.03,.98,.12,.03,{nz:sub(pl,.0,.05,.16,.4),pz:sub(pl,.84,.05,1,.4)},{def:edge,rz:.08});
  for(const[dx,dy]of[[-.42,.17],[.44,.06],[-.38,-.25],[.36,-.31]])b.cylinder('h118Fitting',m+dx,yc+dy+.02,zf-.065,.012,.012,.02,6,Math.PI/2);
 }
 b.solid(m,FACE-.16,1.0,.4);
}
// a stack of paper: real thickness, own front page on top, paper-edge texture on each side (different crops)
function paperStack(b,x,y,z,w,d,h,top,{ry=0,edge=0,key='h118Kiosk',topUp=[0,0,1]}={}){
 const e=k=>K['paperedge'+((edge+k)%3)],ey=Math.min(1,h/.16);
 abox(b,key,x,y+h/2,z,w,h,d,{py:K[top],px:sub(e(0),0,0,1,ey),nx:sub(e(1),0,0,1,ey),pz:sub(e(2),0,0,1,ey),nz:sub(e(1),0,1-ey,1,1),ny:K.paperedge0},{ry,topUp});
}
function magStack(b,x,y,z,w,d,h,top,{ry=0,edge=0,topUp=[0,0,1],rx=0}={}){
 const e=k=>K['magedge'+((edge+k)%3)],ey=Math.min(1,h/.12);
 abox(b,'h118Mag',x,y+h/2,z,w,h,d,{py:K[top],px:sub(e(0),0,0,1,ey),nx:sub(e(1),0,0,1,ey),pz:sub(e(2),0,0,1,ey),nz:sub(e(0),0,1-ey,1,1),ny:K.magedge1},{ry,rx,topUp});
}
// twine tied around a stack: one loop each way, crossing on top, with a knot
function twine(b,x,y0,z,w,d,h,ry){
 const c=Math.cos(ry),s=Math.sin(ry),P=(u,v)=>[x+c*u+s*v,z-s*u+c*v],t=.012;
 for(const[u,v,lw,ld]of[[0,0,w+.01,t],[0,0,t,d+.01]]){const[px,pz]=P(u,v);b.box('h118Twine',px,y0+h+.004,pz,lw,.008,ld,ry);}
 for(const sgn of[-1,1]){let[px,pz]=P(sgn*(w/2+.004),0);b.box('h118Twine',px,y0+h/2,pz,.008,h+.01,t,ry);[px,pz]=P(0,sgn*(d/2+.004));b.box('h118Twine',px,y0+h/2,pz,t,h+.01,.008,ry);}
 const[kx,kz]=P(.02,-.01);b.sphere('h118Twine',kx,y0+h+.012,kz,.018,.012,.018);b.rod('h118Twine',[kx,y0+h+.01,kz],[kx+.06,y0+h+.004,kz-.05],.004);
}
const MAG=n=>'mag'+String(n).padStart(2,'0'),NEWS=n=>'news'+String(n).padStart(2,'0'),FOLD=n=>'fold'+String(n).padStart(2,'0');
function kiosk(b,a,c,band){
 R=urbanRand(5577);
 const P=H118_PROPS,w=c-a,m=(a+c)/2,D=1.55,back=FACE+D,openTop=3.05,fl=.15;
 // shell: stone over the opening, painted plywood left wall, tin-and-notices right wall, pressed-tin ceiling, lino floor
 b.box('h118StoneUpper',m,(openTop+band-.88)/2,FACE+.17,w,band-.88-openTop,.34);
 b.box('h118Dark',a+.03,openTop/2,FACE+D/2,.06,openTop,D);b.box('h118Dark',c-.03,openTop/2,FACE+D/2,.06,openTop,D);
 addQuad(b,'h118KioskL',[a+.065,(openTop+fl)/2,FACE+D/2+.02],[1,0,0],D-.04,openTop-fl,tiled(D,openTop,1.3));
 addQuad(b,'h118KioskR',[c-.065,(openTop+fl)/2,FACE+D/2+.02],[-1,0,0],D-.04,openTop-fl,[0,0,1,1]);
 b.box('h118Dark',m,openTop+.02,FACE+D/2,w,.06,D);
 addQuad(b,'h118Ceiling',[m,openTop-.012,FACE+D/2],[0,-1,0],w-.12,D,tiled(w,D,.62),.9,new T.Vector3(0,0,1));
 b.box('h118Floor',m,fl/2,(2.95+back)/2,w-.12,fl,back-2.95);b.walk(m,(2.95+back)/2,w-.12,back-2.95,fl);
 for(const dz of[.55,1.1]){b.box('h118Lamp',m,openTop-.05,FACE+dz,w*.55,.035,.05);b.box('h118Dark',m,openTop-.025,FACE+dz,w*.6,.02,.09);}
 // back wall: shelves of stock (photo) over a sliding-door cabinet, magazines filed on the cabinet top
 addQuad(b,'h118Glossy',[m,2.0,back-.02],[0,0,-1],w-.14,2.1,P.kioskback,.92);
 b.box('h118Dark',m,(fl+.95)/2,back-.3,w-.14,.95-fl,.52);
 addQuad(b,'h118Cabinet',[m,(fl+.95)/2,back-.561],[0,0,-1],w-.16,.95-fl,[0,0,1,1]);
 for(let i=0;i<5;i++)magStack(b,a+.45+i*.82,.95,back-.3,.24,.31,.03+R()*.08,MAG(31+i),{ry:(R()-.5)*.2,edge:i,topUp:[0,0,-1]});
 // counter: bottle-green boarded front, worn top, stepped magazine display, paper piles at the ends
 const cz0=FACE-.21,cz1=FACE+.41,ch=1.02,cw2=w-.12;
 b.box('h118Dark',m,ch/2,(cz0+cz1)/2,cw2,ch,cz1-cz0);
 addQuad(b,'h118Counter',[m,ch/2,cz0-.004],[0,0,-1],cw2,ch,[0,0,1,1]);
 for(const s of[-1,1])addQuad(b,'h118Counter',[m+s*(cw2/2+.004),ch/2,(cz0+cz1)/2],[s,0,0],cz1-cz0,ch,s<0?[0,0,.18,1]:[.82,0,.18,1]);
 addQuad(b,'h118Counter',[m,ch+.004,(cz0+cz1)/2],[0,1,0],cw2,cz1-cz0,[.05,.62,.9,.3],.72,new T.Vector3(0,0,1));
 // sloped display board across the counter, three overlapping rows of magazine piles; 23 different titles
 const th=.3,len=(cz1-cz0-.1)/Math.cos(th),bz=(cz0+cz1)/2,by=ch+.03+Math.tan(th)*(cz1-cz0-.1)/2;
 abox(b,'h118Counter',m,by,bz,cw2-.7,.03,len,{py:[.0,.05,1,.5],pz:[0,0,1,.05],nz:[0,0,1,.05],px:[0,0,.05,.05],nx:[0,0,.05,.05],ny:[0,0,1,.3]},{rx:-th,topUp:[0,0,1]});
 for(const s of[-1,1])b.box('h118Dark',m+s*(cw2/2-.36),ch+.15,bz+.12,.04,.28,.3);
 let mi=1;
 for(let r=0;r<3;r++){const n=r<2?8:7,t=(.2+r*.3)-.5,zr=bz+t*len*Math.cos(th),yr=by+t*len*Math.sin(th)+.016;
  for(let i=0;i<n;i++){const x=m-(cw2-.95)/2+i*(cw2-.95)/(n-1)+(r%2)*.06+(R()-.5)*.04,h=.008+R()*.022;
   magStack(b,x,yr,zr,.215,.285,h,MAG(mi),{ry:(R()-.5)*.1,edge:mi,topUp:[0,0,1],rx:-th});mi++;}
 }
 // newspaper piles on the counter ends (own front pages, real thickness)
 paperStack(b,a+.3,ch,cz0+.2,.36,.27,.09,NEWS(1),{ry:.05,edge:0});paperStack(b,a+.29,ch+.09,cz0+.21,.36,.27,.012,NEWS(2),{ry:-.09,edge:1});
 paperStack(b,c-.3,ch,cz0+.18,.36,.27,.12,NEWS(3),{ry:-.04,edge:2});
 // hanging magazines on a wire under the lintel, each clipped by a wooden peg, all different
 b.rod('photoRail',[a+.1,2.78,FACE+.16],[c-.1,2.78,FACE+.16],.006);
 for(let i=0;i<7;i++){const x=a+.42+i*(w-.84)/6,sw=(R()-.5)*.06;
  abox(b,'h118Mag',x,2.48,FACE+.165,.3,.4,.006,{nz:K[MAG(24+i)],pz:K.magedge1,px:K.magedge0,nx:K.magedge2,py:K.magedge0,ny:K.magedge1},{rz:sw});
  b.box('h118Peg',x,2.73,FACE+.165,.025,.08,.03);}
 // CASH ONLY board, lotto card, sign box with bronze case and brackets
 addQuad(b,'h118Glossy',[a+.62,1.85,FACE+.35],[0,0,-1],.62,.46,P.cash,1);
 addQuad(b,'h118Glossy',[c-.4,1.62,FACE-.005],[0,0,-1],.42,.68,P.lotto,1);
 b.box('h118Bronze',m,3.62,FACE-.11,w*.82+.06,1.08,.16);
 addQuad(b,'h118Glossy',[m,3.62,FACE-.195],[0,0,-1],w*.82,1.02,P.commute,.95);
 for(const s of[-1,1])b.box('h118Dark',m+s*w*.3,3.62,FACE-.02,.06,.8,.1);
 // --- pavement (top y=.15): wire newspaper rack, tied bundles, cardboard boxes ---
 const g=.15;newsRack(b,a-.62,g,FACE-.5,.12);
 // two twine-tied bundles of returns, a strapped magazine bundle, three unwrap-textured boxes
 paperStack(b,c+.15,g,FACE-.95,.42,.3,.21,NEWS(4),{ry:.35,edge:1});twine(b,c+.15,g,FACE-.95,.42,.3,.21,.35);
 paperStack(b,c+.2,g+.21,FACE-.92,.42,.3,.15,NEWS(5),{ry:.2,edge:2});twine(b,c+.2,g+.21,FACE-.92,.42,.3,.15,.2);
 magStack(b,a+.9,g,FACE-.42,.28,.36,.18,MAG(36),{ry:-.15,edge:2});twine(b,a+.9,g,FACE-.42,.28,.36,.18,-.15);
 const BX=(id,x,y,z,bw,bh,bd,ry)=>abox(b,'h118Kiosk',x,y+bh/2,z,bw,bh,bd,{pz:K[id+'_pz'],nz:K[id+'_nz'],px:K[id+'_px'],nx:K[id+'_nx'],py:K[id+'_py'],ny:K[id+'_ny']},{ry,topUp:[0,0,-1]});
 BX('box1',c-.45,g,FACE-.42,.62,.46,.44,.06);BX('box2',c-.47,g+.46,FACE-.44,.56,.4,.4,-.14);BX('box3',c-1.08,g,FACE-.33,.42,.24,.3,.32);
 b.solid(c-.55,FACE-.42,1.5,.5);b.solid(c+.17,FACE-.7,.5,.7);
 b.solid(m,FACE+.1,w,.7);
}
// wire rack: welded steel uprights, three sloped wire trays with real folded-paper stacks, enamel header sign
function newsRack(b,x,y,z,ry){
 const W=.74,Dp=.44,H=1.32,c=Math.cos(ry),s=Math.sin(ry),P=(u,v)=>[x+c*u+s*v,z-s*u+c*v];
 const rod=(u0,y0,v0,u1,y1,v1,r=.007)=>{const[a0,b0]=P(u0,v0),[a1,b1]=P(u1,v1);b.rod('h118Wire',[a0,y+y0,b0],[a1,y+y1,b1],r);};
 for(const u of[-W/2,W/2])for(const v of[-Dp/2,Dp/2])rod(u,0,v,u,H,v,.011);
 for(const u of[-W/2,W/2])rod(u,.02,-Dp/2-.04,u,.02,Dp/2+.04,.012);
 // header sign at the top, facing the street
 {const[sx,sz]=P(0,-Dp/2-.01);b.box('h118Wire',sx,y+H-.06,sz,W+.02,.2,.012,ry);addQuad(b,'h118Kiosk',[sx-s*.008,y+H-.06,sz-c*.008],[-s,0,-c],W-.02,.18,K.racksign);}
 let f=1;
 for(let t=0;t<3;t++){const ty=.28+t*.33,rx=-.5;
  // tray: perimeter + slats, tilted toward the street, lip at the front
  const v0=-Dp/2+.03,v1=Dp/2-.03,dy=(v1-v0)*Math.sin(-rx)*.6;
  rod(-W/2,ty,v0,W/2,ty,v0);rod(-W/2,ty+dy,v1,W/2,ty+dy,v1);for(const u of[-W/2+.01,-.12,.12,W/2-.01])rod(u,ty,v0,u,ty+dy,v1,.005);
  rod(-W/2,ty+.06,v0-.02,W/2,ty+.06,v0-.02,.006);for(const u of[-W/2+.02,0,W/2-.02])rod(u,ty,v0,u,ty+.06,v0-.02,.005);
  // two piles of folded papers per tray, each its own masthead
  for(const u of[-.18,.18]){const[px,pz]=P(u,(v0+v1)/2+.02),h=.035+((t*2+(u>0))%3)*.02;
   abox(b,'h118Kiosk',px,y+ty+dy/2+h/2+.01,pz,.31,h,.27,{py:K[FOLD(f)],px:sub(K['paperedge'+f%3],0,0,1,.4),nx:sub(K['paperedge'+(f+1)%3],0,0,1,.4),pz:sub(K['paperedge'+(f+2)%3],0,0,1,.4),nz:sub(K['paperedge'+f%3],0,.5,1,.9),ny:K.paperedge1},{ry,rx,topUp:[0,0,1]});f++;}
 }
 // bottom shelf: a flat stack of today's paper
 {const[px,pz]=P(0,0);paperStack(b,px,y+.03,pz,.5,.33,.1,NEWS(8),{ry,edge:2,topUp:[0,0,1]});}
 b.solid(x,z,W+.1,Dp+.1,ry);
}
export function addHope118(b){R=urbanRand(1181);glassEntrance(b);southFace(b);}
