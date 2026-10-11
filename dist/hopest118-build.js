// V118-L11 (parallel): Hope Street right-hand podium rebuild.
// Authored in the same un-mirrored Hope frame as reference-scenes.js hopeStreet(); the whole batch is later
// mirrored by photoHandedness(), so every atlas face below pre-flips u (text then reads correctly in game).
import * as T from './vendor/three.module.min.js';
const A=new URL('./assets/l11-v118/',import.meta.url).href;
export const H118_PROPS={atm:[0,.7187,.1875,.2812],atmside:[.1875,.7187,.0625,.2812],plank:[.25,.9062,.375,.0937],commute:[.25,.6562,.375,.25],cash:[.625,.7656,.1875,.1406],kioskback:[0,.375,.5,.2812],mags:[.5,.4062,.5,.25],rack:[0,.0937,.1875,.2812],boxside:[.1875,.125,.1562,.25],boxtop:[.3437,.25,.125,.125],boxend:[.4687,.25,.125,.125],poster0:[.5937,.25,.0937,.125],poster1:[.6875,.25,.0937,.125],poster2:[.7812,.25,.0937,.125],lotto:[.875,.2187,.0937,.1562],newstop:[.5937,.125,.125,.0937],wood:[0,0,.25,.0625],steel:[.25,0,.0625,.0625]};
const texCache={};
export function h118Texture(name,{repeat=false,nearest=false}={}){
 const k=name+repeat+nearest;if(texCache[k])return texCache[k];
 const t=new T.TextureLoader().load(A+name+'.webp?v=118h');t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
 if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;if(nearest){t.magFilter=T.NearestFilter;}
 return texCache[k]=t;
}
// Interior-mapped window: geometry uv spans the window 0..1; vertex colour (tone) picks room/lighting.
function interiorMaterial(){
 const m=new T.MeshBasicMaterial({map:h118Texture('room'),vertexColors:true});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vH118W;varying vec3 vH118N;varying vec2 vH118U;').replace('#include <fog_vertex>','#include <fog_vertex>\nvH118W=(modelMatrix*vec4(transformed,1.)).xyz;vH118N=normalize(mat3(modelMatrix)*normal);vH118U=uv;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vH118W;varying vec3 vH118N;varying vec2 vH118U;').replace('#include <map_fragment>',`
  vec3 N=normalize(vH118N),V=normalize(vH118W-cameraPosition);
  vec3 dp1=dFdx(vH118W),dp2=dFdy(vH118W);vec2 du1=dFdx(vH118U),du2=dFdy(vH118U);
  float det=sign(du1.x*du2.y-du2.x*du1.y);vec3 Tg=normalize(dp1*du2.y-dp2*du1.y)*det;vec3 Bg=normalize(dp2*du1.x-dp1*du2.x)*det;
  float c=vColor.r,room=c>.6?0.:1.;float lit=(c>.6?c>.8:c>.25)?1.:.38;
  vec3 d=vec3(dot(V,Tg),dot(V,Bg),dot(V,-N));d.x/=1.2;d.y/=1.5;d.z/=3.2; // half-width, half-height, depth (m)
  vec3 p=vec3(vH118U*2.-1.,0.);
  vec3 tb=vec3((sign(d.x)-p.x)/d.x,(sign(d.y)-p.y)/d.y,(1.-p.z)/max(d.z,1e-4));
  float t=min(min(tb.x,tb.y),tb.z);vec3 h=p+d*t;float f=clamp(h.z,0.,1.);
  vec2 k=vec2(.504,.39),sc=1./(1.+f*(1./k-1.));
  vec2 ruv=vec2(.5)+.5*h.xy*sc;ruv=clamp(ruv,.004,.996);ruv.x=(ruv.x+room)*.5;
  vec4 texelColor=texture2D(map,ruv);
  vec3 interior=texelColor.rgb*lit*(1.-f*.35);
  vec3 R=reflect(V,N);float sky=smoothstep(-.05,.35,R.y);
  vec3 env=mix(vec3(.16,.17,.16)+.08*step(.5,fract(R.x*1.7+R.z*1.7)),vec3(.78,.82,.76),sky);
  float fr=.06+.55*pow(1.-max(dot(-V,N),0.),4.);
  diffuseColor.rgb=mix(interior*vec3(.92,.95,.94),env,fr);`).replace('#include <color_fragment>','');
 };
 m.customProgramCacheKey=()=>'h118-interior-v1';return m;
}
export function addHope118Materials(m){
 const props=h118Texture('props'),frost=h118Texture('frost',{repeat:true});
 m.h118Props=new T.MeshStandardMaterial({map:props,roughness:.72,vertexColors:true});
 m.h118Glossy=new T.MeshStandardMaterial({map:props,roughness:.35,metalness:.05,vertexColors:true,emissiveMap:props,emissive:0xffffff,emissiveIntensity:.07});
 m.h118Frost=new T.MeshStandardMaterial({map:frost,emissiveMap:frost,color:0xffffff,emissive:0xe6eae8,emissiveIntensity:.5,roughness:.3,metalness:.1,vertexColors:true});
 m.h118FrostLit=new T.MeshStandardMaterial({map:frost,emissiveMap:frost,emissive:0xfff3d6,emissiveIntensity:1.25,roughness:.3,vertexColors:true});
 m.h118Room=interiorMaterial();
 m.h118Bronze=new T.MeshStandardMaterial({color:0x3b302a,roughness:.5,metalness:.55,vertexColors:true});
 m.h118Fitting=new T.MeshStandardMaterial({color:0xc9ccc8,roughness:.3,metalness:.85,vertexColors:true});
 m.h118Dark=new T.MeshStandardMaterial({color:0x1d1f1d,roughness:.8,vertexColors:true});
 return m;
}
// ---- geometry helpers ----
const UPV=new T.Vector3(0,1,0);
function inset(r){const e=.6/1024;return[r[0]+e,r[1]+e,r[2]-2*e,r[3]-2*e];}
// One quad, centre c, outward normal n, size w x h; rect: atlas rect or [0,0,ur,vr] for tiled maps.
function quadGeo(c,n,w,h,rect,up=UPV){
 const N=new T.Vector3(...n).normalize(),U=up.clone(),Rt=new T.Vector3().crossVectors(N.clone().negate(),U).normalize();U.crossVectors(Rt,N.clone().negate()).normalize().negate();
 // U recomputed to be orthogonal and pointing up
 if(U.dot(up)<0)U.negate();
 const C=new T.Vector3(...c),p=(sx,sy)=>C.clone().addScaledVector(Rt,sx*w/2).addScaledVector(U,sy*h/2);
 const r=rect.length===4&&rect[2]<=1&&rect[3]<=1&&!rect.tiled?inset(rect):rect,u0=r[0],v0=r[1],u1=r[0]+r[2],v1=r[1]+r[3];
 // pre-flipped u: left edge gets u1
 const V=[[p(-1,-1),u1,v0],[p(1,-1),u0,v0],[p(1,1),u0,v1],[p(-1,-1),u1,v0],[p(1,1),u0,v1],[p(-1,1),u1,v1]];
 return{pos:V.flatMap(v=>v[0].toArray()),uv:V.flatMap(v=>[v[1],v[2]]),nrm:V.flatMap(()=>N.toArray())};
}
function build(parts){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(parts.flatMap(p=>p.pos),3));g.setAttribute('normal',new T.Float32BufferAttribute(parts.flatMap(p=>p.nrm),3));g.setAttribute('uv',new T.Float32BufferAttribute(parts.flatMap(p=>p.uv),2));return g;}
function addQuad(b,key,c,n,w,h,rect,tone=1){const g=build([quadGeo(c,n,w,h,rect)]);b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// Atlas box: faces {px,nx,py,ny,pz,nz} rects (missing -> def). Local centre (0,0,0); placed via b.add pose.
function abox(b,key,x,y,z,w,h,d,faces,{ry=0,rx=0,rz=0,def=H118_PROPS.steel,tone=1,skip=[]}={}){
 const F={px:[[w/2,0,0],[1,0,0],d,h],nx:[[-w/2,0,0],[-1,0,0],d,h],py:[[0,h/2,0],[0,1,0],w,d],ny:[[0,-h/2,0],[0,-1,0],w,d],pz:[[0,0,d/2],[0,0,1],w,h],nz:[[0,0,-d/2],[0,0,-1],w,h]},parts=[];
 for(const[k,[c,n,fw,fh]]of Object.entries(F)){if(skip.includes(k))continue;parts.push(quadGeo(c,n,fw,fh,faces[k]||def,k==='py'||k==='ny'?new T.Vector3(0,0,-1):UPV));}
 const g=build(parts);b.add(g,key,x,y,z,1,1,1,ry,rx,rz,tone);g.dispose();
}
const R=urbanRand(1180);
function urbanRand(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// ---- 1. Glass curtain-wall entrance above the plaza stair (image-30) ----
// West face of the podium (x=30.32 outer, normal -x), recess z 3.4..15.2, y 3.45..16.4.
function glassEntrance(b){
 const X=31.12,z0=3.4,z1=15.2,y0=3.45,y1=16.4,cols=10,cw=(z1-z0)/cols,rowsY=[3.45,6.15,8.75,11.35,13.95,16.4];
 // reveals: corner pier, right return, soffit lining and a dark bronze surround
 b.box('photoPodium',30.86,(y0+y1)/2,3.2,1.08,y1-y0,.4);b.box('photoPodium',30.86,(y0+y1)/2,15.3,1.08,y1-y0,.2);
 b.box('h118Bronze',30.40,y1-.12,(z0+z1)/2,.18,.24,z1-z0+.2);for(const z of[z0,z1])b.box('h118Bronze',30.40,(y0+y1)/2,z,.18,y1-y0,.12);
 b.box('photoPodium',30.86,y1+.02,(z0+z1)/2,1.08,.04,z1-z0);
 // dim lobby slab seen through the glass, plus the lit lobby ceiling band
 for(let j=0;j<rowsY.length-1;j++){const ya=rowsY[j],yb=rowsY[j+1],top=j===rowsY.length-2;
  for(let i=0;i<cols;i++){const zc=z0+cw*(i+.5),door=j===0&&i>=2&&i<=7;
   if(door)continue;
   const key=top?'h118FrostLit':'h118Frost',tone=top?1:.84+R()*.16-(j===0?.12:0);
   const g=build([quadGeo([X,(ya+yb)/2,zc],[-1,0,0],cw-.03,yb-ya-.03,Object.assign([0,0,1,1.2],{tiled:true}))]);b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();
  }}
 // two pairs of glass doors at the landing with interior behind, bronze frames and pull bars
 for(const[za,zb]of[[z0+cw*2,z0+cw*4],[z0+cw*4,z0+cw*6],[z0+cw*6,z0+cw*8]]){const zc=(za+zb)/2,w=zb-za;
  addQuad(b,'h118Room',[X+.02,y0+1.3,zc],[-1,0,0],w-.06,2.6,[0,0,1,1],.98);
  b.box('h118Bronze',X-.04,y0+2.66,zc,.14,.12,w);b.box('h118Bronze',X-.04,y0+.04,zc,.14,.08,w);
  for(const z of[za+.03,zc,zb-.03])b.box('h118Bronze',X-.04,y0+1.33,z,.14,2.66,.07);
  for(const s of[-1,1])b.rod('photoRail',[X-.14,y0+.75,zc+s*.12],[X-.14,y0+1.95,zc+s*.12],.018);
  addQuad(b,'h118Frost',[X,y0+2.68,zc],[-1,0,0],w-.06,.0001+.02,Object.assign([0,0,1,.1],{tiled:true}));
 }
 // mullions (slim steel fins) and transoms
 for(let i=0;i<=cols;i++){const z=z0+cw*i;b.box('h118Fitting',X-.06,(y0+y1)/2,z,.12,y1-y0,.035,0,.55);b.box('h118Dark',X+.12,(y0+y1)/2,z,.25,y1-y0,.05);}
 for(const y of rowsY)b.box('h118Fitting',X-.05,y,(z0+z1)/2,.09,.03,z1-z0,0,.6);
 // point-fixed spider fittings: four splayed arms + bolt cap at every glass node
 for(const y of rowsY.slice(1,-1))for(let i=1;i<cols;i++){const z=z0+cw*i;
  b.cylinder('h118Fitting',X-.13,y,z,.035,.035,.10,8,0,Math.PI/2);
  for(const a of[.785,2.356,3.927,5.498]){const dy=Math.sin(a)*.17,dz=Math.cos(a)*.17;b.rod('h118Fitting',[X-.1,y,z],[X-.07,y+dy,z+dz],.014);b.cylinder('h118Fitting',X-.055,y+dy,z+dz,.028,.028,.03,8,0,Math.PI/2);}
 }
 // floor-level kick plate where the curtain wall lands on the stair landing
 b.box('h118Bronze',X-.05,y0+.06,(z0+z1)/2,.16,.12,z1-z0);
}
// ---- 2. Street (south) face: recessed fake-interior windows, two ATMs, COMMUTE SHOP kiosk ----
const FACE=2.78;
function southFace(b){
 const X0=30.32,X1=69.5,band=5.2,top=16.4;
 // solid upper wall and the granite base course run the whole length
 b.box('photoPodium',(X0+X1)/2,(band+top)/2,FACE+.17,X1-X0,top-band,.34);
 for(let y=band+2.6;y<top;y+=2.6)b.box('photoFrame',(X0+X1)/2,y,FACE-.005,X1-X0,.03,.012);
 b.box('photoGranite',(X0+X1)/2,band-.12,FACE-.06,X1-X0,.24,.18);
 b.box('photoPodium',(X0+X1)/2,band-.55,FACE+.17,X1-X0,.66,.34);
 // bays across the ground band
 const bays=[['pier',30.32,31.6]];let x=31.6;
 for(let i=0;i<6;i++){bays.push(['win',x,x+2.4]);bays.push(['pier',x+2.4,x+3.4]);x+=3.4;}
 bays.push(['win',x,x+2.4]);x+=2.4;bays.push(['atm',x,x+2.2]);x+=2.2;bays.push(['win',x,x+2.4]);x+=2.4;bays.push(['atmx',x,x+2.2]);x+=2.2;
 bays.push(['pier',x,x+.5]);x+=.5;bays.push(['kiosk',x,x+4.4]);x+=4.4;bays.push(['pier',x,X1]);
 const sill=.95,head=3.85,depth=.46;
 let room=0;
 for(const[kind,a,c]of bays){const w=c-a,m=(a+c)/2;
  if(kind!=='kiosk'&&kind!=='win'){b.box('photoPodium',m,(band-.88)/2,FACE+.17,w,band-.88,.34);b.box('photoGranite',m,.45,FACE-.03,w,.9,.12);}
  if(kind==='win'){
   b.box('photoGranite',m,sill/2,FACE-.03,w,sill,.12);b.box('photoPodium',m,(head+band-.88)/2,FACE+.17,w,band-.88-head,.34);
   b.box('photoPodium',m,sill-.1,FACE+.17,w,.2,.34);
   // reveals
   for(const s of[a,c])b.box('photoGranite',s+(s===a?.05:-.05),(sill+head)/2,FACE+depth/2,.1,head-sill,depth);
   b.box('photoGranite',m,head-.05,FACE+depth/2,w,.1,depth);b.box('photoGranite',m,sill+.03,FACE+depth/2-.06,w,.06,depth+.12);
   const tone=[.97,.5,.83,.97,.1,.5,.97,.83,.5][room%9];room++;
   addQuad(b,'h118Room',[m,(sill+head)/2+.03,FACE+depth],[0,0,-1],w-.2,head-sill-.14,[0,0,1,1],tone);
   for(const dx of[-(w-.2)/2,0,(w-.2)/2])b.box('h118Bronze',m+dx,(sill+head)/2,FACE+depth-.03,.06,head-sill-.1,.06);
   for(const y of[sill+.1,head-.12,sill+2.15])b.box('h118Bronze',m,y,FACE+depth-.03,w-.18,.05,.06);
  }
  if(kind==='atm'||kind==='atmx')atm(b,m,kind==='atmx');
  if(kind==='kiosk')kiosk(b,a,c,band);
 }
 // sidewalk strip along the street face, with granite kerb
 b.box('sidewalk',(31.05+70.4)/2,.075,(.62+FACE)/2,70.4-31.05,.15,FACE-.62);b.walk((31.05+70.4)/2,(.62+FACE)/2,70.4-31.05,FACE-.62,.15);
 b.box('photoGranite',(31.05+70.4)/2,.09,.62,70.4-31.05,.18,.16);
 b.box('sidewalk',70.0,.075,33,1.0,.15,60.6);b.walk(70.0,33,1.0,60.6,.15);
}
function atm(b,m,broken){
 const P=H118_PROPS,zf=FACE-.26,yc=1.42;
 // a granite surround recessed into the pier and the red machine fascia proud of it
 b.box('photoGranite',m,yc+.05,FACE-.035,1.18,1.62,.08);
 abox(b,'h118Glossy',m,yc,FACE-.13,.82,1.24,.26,{nz:P.atm,px:P.atmside,nx:P.atmside,py:P.atmside,ny:P.atmside},{def:P.atmside});
 abox(b,'h118Glossy',m,yc+.70,FACE-.19,.9,.12,.38,{},{def:P.atmside,rx:-.18});
 b.box('h118Dark',m,yc-.82,FACE-.05,.9,.16,.1);
 if(broken){
  abox(b,'h118Props',m+.02,yc+.12,zf-.04,1.04,.27,.035,{nz:P.plank},{def:P.wood,rz:-.13});
  abox(b,'h118Props',m-.06,yc-.28,zf-.03,.98,.12,.03,{},{def:P.wood,rz:.08});
  for(const[dx,dy]of[[-.42,.17],[.44,.06],[-.38,-.25],[.36,-.31]])b.cylinder('h118Fitting',m+dx,yc+dy+.02,zf-.065,.012,.012,.02,6,Math.PI/2);
 }
 b.solid(m,FACE-.16,1.0,.4);
}
function kiosk(b,a,c,band){
 const P=H118_PROPS,w=c-a,m=(a+c)/2,D=1.55,back=FACE+D,openTop=3.05;
 // recess shell: side walls, ceiling, back wall photo, floor
 b.box('photoPodium',m,(openTop+band-.88)/2,FACE+.17,w,band-.88-openTop,.34);
 for(const s of[a,c])abox(b,'h118Props',s+(s===a?.06:-.06),openTop/2,FACE+D/2,.12,openTop,D,{},{def:P.wood,tone:.55});
 b.box('h118Dark',m,openTop-.05,FACE+D/2,w,.1,D);b.box('lamp',m,openTop-.11,FACE+D*.6,w*.6,.02,.12);
 addQuad(b,'h118Glossy',[m,1.95,back-.02],[0,0,-1],w-.14,2.2,P.kioskback,.92);
 abox(b,'h118Props',m,.43,back-.35,w-.16,.86,.55,{nz:P.kioskback},{def:P.wood,tone:.5});
 // counter across the opening: green-painted timber front, magazines laid on a sloped top
 abox(b,'h118Props',m,.5,FACE+.1,w-.12,1.0,.62,{nz:P.wood,py:P.wood},{def:P.wood,tone:.78});
 {const g=build([quadGeo([0,0,0],[0,1,0],w-.2,.7,P.mags,new T.Vector3(0,0,-1))]);b.add(g,'h118Glossy',m,1.06,FACE+.02,1,1,1,0,-.22,0,1);g.dispose();}
 for(let i=0;i<6;i++){const x=a+.35+i*(w-.7)/5;abox(b,'h118Glossy',x,1.12+i%2*.02,FACE-.06,.32,.025,.4,{py:P['poster'+(i%3)]},{def:P.newstop,ry:(R()-.5)*.25,rx:-.2});}
 // hanging magazines on a wire above the counter, CASH ONLY board and lotto card
 b.rod('photoRail',[a+.1,2.72,FACE+.18],[c-.1,2.72,FACE+.18],.008);
 for(let i=0;i<7;i++){const x=a+.35+i*(w-.7)/6;addQuad(b,'h118Glossy',[x,2.45,FACE+.2],[0,0,-1],.36,.48,P['poster'+(i%3)],.95);}
 addQuad(b,'h118Glossy',[a+.62,1.85,FACE+.35],[0,0,-1],.62,.46,P.cash,1);
 addQuad(b,'h118Glossy',[c-.4,1.5,FACE-.005],[0,0,-1],.42,.68,P.lotto,1);
 addQuad(b,'h118Glossy',[a-.25,1.55,FACE-.005],[0,0,-1],.36,.5,P.poster1,.9);
 // COMMUTE SHOP sign box over the opening, mounted to the wall on two brackets
 abox(b,'h118Glossy',m,3.62,FACE-.12,w*.82,1.02,.18,{nz:P.commute},{def:P.atmside,tone:.6});
 for(const s of[-1,1])b.box('h118Dark',m+s*w*.3,3.62,FACE-.02,.06,.8,.1);
 // newspaper rack and a stack of unwrap-textured cardboard boxes on the pavement
 const rx=a-.05,rz=FACE-.55;
 abox(b,'h118Props',rx,.68,rz,.62,1.36,.36,{nz:P.rack,pz:P.rack},{def:P.steel,ry:.12});
 for(let k=0;k<3;k++)abox(b,'h118Glossy',rx+.0,.42+k*.4,rz-.2,.56,.02,.24,{py:P.newstop},{def:P.newstop,ry:.12,rx:-.55});
 b.solid(rx,rz,.7,.45);
 const boxes=[[c-.35,.25,FACE-.38,.62,.5,.44,.05],[c-.38,.72,FACE-.40,.56,.44,.4,-.12],[c-1.0,.22,FACE-.34,.5,.44,.36,.25]];
 for(const[x,y,z,bw,bh,bd,ry]of boxes)abox(b,'h118Props',x,y,z,bw,bh,bd,{pz:P.boxside,nz:P.boxside,px:P.boxend,nx:P.boxend,py:P.boxtop,ny:P.boxtop},{ry});
 b.solid(c-.6,FACE-.38,1.3,.5);
 b.solid(m,FACE+.1,w,.7);
}
export function addHope118(b){glassEntrance(b);southFace(b);}
