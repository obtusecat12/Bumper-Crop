// V129 L11 subway station styles. Every station (hashed per block + line, see stationSpec) is composed from modules:
// style family (New York IRT/IND · Moscow pylon/column · London deep tube · London cut-and-cover), platform type (side /
// island with splayed tracks), ceiling form (low flat + steel beams / barrel vaults / twin circular bores / jack arches),
// wall finish, column style, sign style + language (fictional names), lighting, fare control, and the street entrance
// (stair with green globes / escalator under a ribbed barrel / roundel or M posts). Same envelope as V128 (hall half-width
// 11 m, platform -9, trackbed -10) so floors, stairs and colliders stay compatible; everything stays pure + hashed.
// Textures: art-l11v129/s129_*.png (each generated alone) -> tools/subway129_assets.py -> assets/l11-v129 (+ -n normals).
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE,} from './urban-materials.js?v=60';
import {urbanHash} from './urban-batch.js?v=69';
import {SUB} from './subway128-layout.js?v=128';
const A=new URL('./assets/l11-v129/',import.meta.url).href,S=SUB,BED=S.bed,PL=S.plat,HW=S.stHalf;
const loader=new T.TextureLoader();
function tex(name,srgb=true){const t=loader.load(A+name+'.webp?v=129');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
// ------------------------------------------------------------------------------------------------ station recipe
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const pick=(r,list)=>{let x=r()*list.reduce((s,q)=>s+q[1],0);for(const[v,w]of list){x-=w;if(x<=0)return v;}return list[0][0];};
export const STYLES=['ny','mos','tube','cut'];
export function stationSpec(ix,iz,line){
 const r=rng(urbanHash(ix*31+line*7+3,iz*17+11,0x5129));
 const style=pick(r,[['ny',30],['mos',25],['tube',25],['cut',20]]);
 const sp={style,line,name:Math.floor(r()*16),tone:.92+r()*.2,island:false};
 sp.island=(style==='ny'&&r()<.45)||(style==='mos'&&r()<.4);
 sp.sign=style==='ny'?'tablet':style==='mos'?'bronze':'roundel';if(r()<.15)sp.sign=pick(r,[['tablet',1],['bronze',1],['roundel',1]]);
 sp.lang=pick(r,style==='mos'?[['ru',55],['cn',20],['en',15],['jp',10]]:[['en',55],['cn',20],['jp',15],['ru',10]]);
 sp.band=r()<.5?0:1;sp.cols=pick(r,[['center',1],['edges',1],['both',1]]);
 sp.lamp=style==='ny'?(r()<.5?'bulb':'tube'):style==='mos'?(r()<.65?'chandelier':'torch'):(r()<.5?'strip':'globe');
 sp.pier=r()<.6?'pylon':'column';sp.red=r()<.5;sp.vault=r()<.5?'coffer':'mosaic';
 sp.xpass=[12,16,20][Math.floor(r()*3)];sp.dado=r()<.55;sp.poster=Math.floor(r()*4);
 sp.entrance=style==='ny'?'stair':(r()<.6?'escalator':'stair');sp.fare=style==='ny'||r()<.25;
 return sp;}
// ------------------------------------------------------------------------------------------------ names (all fictional)
const NAMES={
 en:['CANAL ST','HOPE ST','ELEVENTH AV','LOCK GATE','GLASS TOWER','WHITE TOWER','FOG HARBOUR','ENDLESS','ARCADE','DEPOT ROAD','SECOND BRIDGE','CULVERT LANE','NORTH SLUICE','MARKET','CENTRAL','TERMINUS'],
 ru:['КАНАЛЬНАЯ','УЛИЦА НАДЕЖДЫ','ОДИННАДЦАТАЯ','ШЛЮЗОВАЯ','СТЕКЛЯННАЯ','БЕЛАЯ БАШНЯ','ТУМАННАЯ','БЕСКОНЕЧНАЯ','ГАЛЕРЕЙНАЯ','ДЕПОВСКАЯ','ВТОРОЙ МОСТ','ВОДОСТОЧНАЯ','СЕВЕРНЫЙ ШЛЮЗ','РЫНОЧНАЯ','СРЕДИННАЯ','КОНЕЧНАЯ'],
 cn:['运河町','希望街','第十一街','闸口','玻璃塔','白塔','雾港','无尽','回廊','旧仓库','第二桥','暗渠','北水门','市场','中央','终点'],
 jp:['運河町','希望通','十一丁目','閘門前','硝子塔','白塔','霧港','無限','回廊','倉庫前','第二橋','暗渠','北水門','市場','中央','終点']};
const SUBT={en:null,ru:null,cn:NAMES.en,jp:NAMES.en};
// sign atlases: 2 x 8 cells of 512x128 on a 1024x1024 canvas, downscaled to 512x512 (low-fi), one per sign kind + language
const atlasCache=new Map();
function fitText(g,text,font,max){let s=parseInt(font);g.font=font;while(g.measureText(text).width>max&&s>8){s-=2;g.font=font.replace(/\d+px/,s+'px');}}
function signAtlas(kind,lang){const key=kind+lang;if(atlasCache.has(key))return atlasCache.get(key);
 const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d'),out=document.createElement('canvas');out.width=out.height=512;
 const t=new T.CanvasTexture(out);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.anisotropy=4;atlasCache.set(key,t);
 const cjk='"Noto Sans CJK SC","Noto Sans CJK JP","Microsoft YaHei",sans-serif',serif='Georgia,"Times New Roman",serif',sans='"Gill Sans","Johnston",Arial,Helvetica,sans-serif';
 const draw=bg=>{g.clearRect(0,0,1024,1024);
  for(let i=0;i<16;i++){const x=(i%2)*512,y=Math.floor(i/2)*128,n=NAMES[lang][i],sub=SUBT[lang]?.[i];g.save();g.translate(x,y);g.textAlign='center';g.textBaseline='middle';
   if(kind==='tablet'){if(bg)g.drawImage(bg,0,0,512,128);else{g.fillStyle='#c9b48a';g.fillRect(0,0,512,128);g.fillStyle='#efe6d0';g.fillRect(40,24,432,80);}
    g.fillStyle='#2a2f39';fitText(g,n,(lang==='en'||lang==='ru'?'bold 52px '+serif:'bold 56px '+cjk),380);g.fillText(n,256,sub?56:66);
    if(sub){g.fillStyle='#5b2f22';fitText(g,sub,'bold 20px '+serif,300);g.fillText(sub,256,92);}}
   else if(kind==='bronze'){g.fillStyle='#d9d6cf';g.fillRect(0,0,512,128);if(bg)g.drawImage(bg,0,0,512,128);
    const gr=g.createLinearGradient(0,30,0,100);gr.addColorStop(0,'#f2d58a');gr.addColorStop(.5,'#b88a3e');gr.addColorStop(1,'#6e4c1e');
    g.fillStyle='rgba(30,20,10,.55)';fitText(g,n,(lang==='ru'||lang==='en'?'bold 58px '+serif:'bold 60px '+cjk),440);g.fillText(n,259,(sub?54:66)+3);g.fillStyle=gr;g.fillText(n,256,sub?54:66);
    if(sub){g.fillStyle='#7a5524';fitText(g,sub,'bold 20px '+serif,360);g.fillText(sub,256,104);}}
   else{ // roundel: red ring, blue bar with the name
    g.lineWidth=22;g.strokeStyle='#d0241c';g.beginPath();g.arc(256,64,48,0,Math.PI*2);g.stroke();g.fillStyle='#1c2f86';g.fillRect(36,44,440,40);
    g.fillStyle='#fff';fitText(g,n,(lang==='en'||lang==='ru'?'bold 30px '+sans:'bold 32px '+cjk),420);g.fillText(n,256,65);
    if(sub){g.fillStyle='#1c2f86';fitText(g,sub,'bold 16px '+sans,300);g.fillText(sub,256,120);}}
   g.restore();}
  const o=out.getContext('2d');o.clearRect(0,0,512,512);o.imageSmoothingEnabled=true;o.drawImage(c,0,0,512,512);t.needsUpdate=true;};
 try{draw(null);}catch(e){}
 const bgName=kind==='tablet'?'ny_tablet':kind==='bronze'?'mos_marble':null;
 if(bgName&&typeof Image!=='undefined'){const im=new Image();im.onload=()=>{try{draw(im);}catch(e){}};im.src=A+bgName+'.webp?v=129';}
 return t;}
function entranceAtlas(){if(atlasCache.has('ent'))return atlasCache.get('ent');const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 // 2 x 4 cells of 256x128: 0 SUBWAY (NY), 1 big red M, 2 UNDERGROUND roundel, 3 地铁, 4 МЕТРО, 5 green globe label, 6-7 spare
 g.textAlign='center';g.textBaseline='middle';const cell=(i,f)=>{g.save();g.translate((i%2)*256,Math.floor(i/2)*128);f();g.restore();};
 cell(0,()=>{g.fillStyle='#14181c';g.fillRect(6,22,244,84);g.fillStyle='#f4f1e6';g.font='bold 44px Helvetica,Arial,sans-serif';g.fillText('SUBWAY',128,66);});
 cell(1,()=>{g.fillStyle='#e8e2d4';g.fillRect(0,0,256,128);g.fillStyle='#d1231b';g.font='bold 120px Georgia,serif';g.fillText('M',128,70);});
 cell(2,()=>{g.lineWidth=16;g.strokeStyle='#d0241c';g.beginPath();g.arc(128,64,46,0,7);g.stroke();g.fillStyle='#1c2f86';g.fillRect(14,49,228,30);g.fillStyle='#fff';g.font='bold 21px Arial,sans-serif';g.fillText('UNDERGROUND',128,65);});
 cell(3,()=>{g.fillStyle='#0f5132';g.fillRect(6,22,244,84);g.fillStyle='#fff';g.font='bold 56px "Noto Sans CJK SC",sans-serif';g.fillText('地铁',128,66);});
 cell(4,()=>{g.fillStyle='#7d1414';g.fillRect(6,22,244,84);g.fillStyle='#f1d38a';g.font='bold 50px Georgia,serif';g.fillText('МЕТРО',128,66);});
 cell(5,()=>{g.fillStyle='#183d2a';g.fillRect(6,22,244,84);g.fillStyle='#eaf2e6';g.font='bold 30px Helvetica,Arial,sans-serif';g.fillText('UPTOWN · DOWNTOWN',128,66);});
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;atlasCache.set('ent',t);return t;}
export const cellUV=i=>{const u0=(i%2)*.5,v1=1-Math.floor(i/2)/8;return[u0,v1-1/8,u0+.5,v1];};
const entUV=i=>{const u0=(i%2)*.5,v1=1-Math.floor(i/2)/4;return[u0,v1-1/4,u0+.5,v1];};
// ------------------------------------------------------------------------------------------------ materials
// unlit like V128 (lamp-rhythm light term) + the normal map read as relief under a light from above
const clock={value:0};
function ul(m,key,{map,nmap,color,transparent=false,alphaTest=0,tile}={}){
 const mat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,map:map||null,color:color??0xffffff,transparent,alphaTest});mat.name='V129 '+key;
 if(nmap)mat.userData.n=nmap;
 mat.onBeforeCompile=s=>{if(nmap)s.uniforms.uN={value:nmap};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSP;').replace('#include <project_vertex>','#include <project_vertex>\nvSP=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSP;'+(nmap?'uniform sampler2D uN;':'')).replace('#include <color_fragment>','#include <color_fragment>\n'+
   (nmap?'{vec3 nn=texture2D(uN,vMapUv).xyz*2.-1.;diffuseColor.rgb*=clamp(.6+.48*dot(normalize(nn),vec3(0.,.5,.866)),0.,1.25);}\n':'')+LIGHT);};
 mat.customProgramCacheKey=()=>'v129ul'+(map?'m':'')+(nmap?'n':'')+(alphaTest?'a':'');m[key]=mat;if(tile)URBAN_TILE_SIZE[key]=tile;return mat;}
let LIGHT='';
export function addSubway129Materials(m,light){
 if(m.s129NyTile)return m;LIGHT=light.replace('.07+1.05*','.40+.72*');
 for(const[key,file,tile]of[['s129NyTile','ny_tile',1.0],['s129BandA','ny_band_a',1.2],['s129BandB','ny_band_b',1.2],['s129Beam','ny_beam',.9],['s129Terr','terrazzo',3.2],['s129Marble','mos_marble',2.6],
  ['s129Red','mos_redmarble',2.2],['s129Vault','mos_vault',3.2],['s129MosFloor','mos_floor',3.6],['s129Relief','mos_relief',1],['s129LonTile','lon_tile',2.4],['s129Brick','lon_brick',2.2],['s129Iron','lon_iron',2.4],
  ['s129Cream','cream_sq',1.6],['s129Esc','esc_steps',1.0]])ul(m,key,{map:tex(file),nmap:tex(file+'-n',false),tile});
 for(const[key,file]of[['s129Booth','ny_booth'],['s129Mosaic','mos_mosaic'],['s129Tablet','ny_tablet']])ul(m,key,{map:tex(file)});
 for(let i=1;i<=4;i++)ul(m,'s129Poster'+i,{map:tex('lon_poster'+i)});
 ul(m,'s129Bronze',{color:0x9c7742});ul(m,'s129Black',{color:0x15171a});ul(m,'s129Steel',{color:0x8c8f90});ul(m,'s129Paint',{color:0x9d998d});ul(m,'s129Plaster',{color:0xe6dfcd});
 m.s129Glow=new T.MeshBasicMaterial({color:0xfff0c8,vertexColors:true});m.s129Glow.name='V129 lamp glow';
 m.s129Green=new T.MeshBasicMaterial({color:0x7cf09a,vertexColors:true});m.s129Green.name='V129 green globe';
 m.s129Tube=new T.MeshBasicMaterial({color:0xeef6ff,vertexColors:true});m.s129Tube.name='V129 fluorescent';
 {const mat=ul(m,'s129Ent',{alphaTest:.4});try{mat.map=entranceAtlas();}catch(e){}}
 return m;}
export function signKey(m,kind,lang){const k='s129Sign_'+kind+'_'+lang;if(!m[k]){const mat=ul(m,k,{alphaTest:kind==='roundel'?.4:0});try{mat.map=signAtlas(kind,lang);}catch(e){mat.color.set(0xd8d2c0);}}return k;}
// ------------------------------------------------------------------------------------------------ geometry helpers (frame: v across = x, u along = z)
function geo(b,key,p,uv,tone=1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
function quad(b,key,a,c,d,e,uv=[0,0,1,0,1,1,0,1],tone=1){const P=[a,c,d,a,d,e],U=[[uv[0],uv[1]],[uv[2],uv[3]],[uv[4],uv[5]],[uv[0],uv[1]],[uv[4],uv[5]],[uv[6],uv[7]]];geo(b,key,P.flat(),U.flat(),tone);}
// vertical panel on plane v=const, readable from the side the hall centre is on (sv = wall side)
function panel(b,key,v,sv,uc,yc,w,h,uv=[0,0,1,1],tone=1){const[u0,v0,u1,v1]=uv,a=uc-sv*w/2,c=uc+sv*w/2;quad(b,key,[v,yc-h/2,a],[v,yc-h/2,c],[v,yc+h/2,c],[v,yc+h/2,a],[u0,v0,u1,v0,u1,v1,u0,v1],tone);}
// panel on plane u=const (end walls, facing -su direction)
function panelU(b,key,u,su,vc,yc,w,h,uv=[0,0,1,1],tone=1){const[u0,v0,u1,v1]=uv,a=vc+su*w/2,c=vc-su*w/2;quad(b,key,[a,yc-h/2,u],[c,yc-h/2,u],[c,yc+h/2,u],[a,yc+h/2,u],[u0,v0,u1,v0,u1,v1,u0,v1],tone);}
// cylindrical surface with its axis along u: v=cv+r cos a, y=cy+r sin a, a in [a0,a1]
function arcU(b,key,cv,cy,r,a0,a1,u0,u1,{n=12,tile=URBAN_TILE_SIZE[key]||2,uvFull=false,tone=1,flipU=false}={}){if(u1-u0<.01)return;const p=[],uv=[];
 for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n,A=[cv+r*Math.cos(t0),cy+r*Math.sin(t0)],C=[cv+r*Math.cos(t1),cy+r*Math.sin(t1)];
  const s0=uvFull?i/n:r*Math.abs(t0-a0)/tile,s1=uvFull?(i+1)/n:r*Math.abs(t1-a0)/tile,w0=uvFull?(flipU?1:0):u0/tile,w1=uvFull?(flipU?0:1):u1/tile;
  p.push(A[0],A[1],u0,C[0],C[1],u0,C[0],C[1],u1,A[0],A[1],u0,C[0],C[1],u1,A[0],A[1],u1);uv.push(w0,s0,w0,s1,w1,s1,w0,s0,w1,s1,w1,s0);}
 geo(b,key,p,uv,tone);}
// cylindrical surface with its axis along v (jack arches, arch soffits): u=cu+r cos a, y=cy+r sin a
function arcV(b,key,cu,cy,r,a0,a1,v0,v1,{n=8,tile=URBAN_TILE_SIZE[key]||2,tone=1}={}){const p=[],uv=[];
 for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n,A=[cu+r*Math.cos(t0),cy+r*Math.sin(t0)],C=[cu+r*Math.cos(t1),cy+r*Math.sin(t1)];
  const s0=r*(t0-a0)/tile,s1=r*(t1-a0)/tile;p.push(v0,A[1],A[0],v0,C[1],C[0],v1,C[1],C[0],v0,A[1],A[0],v1,C[1],C[0],v1,A[1],A[0]);uv.push(v0/tile,s0,v0/tile,s1,v1/tile,s1,v0/tile,s0,v1/tile,s1,v1/tile,s0);}
 geo(b,key,p,uv,tone);}
// flat face on plane u (or v when alongV) between y0(t) and y1(t), t from t0..t1 (fills under / over arcs)
function fill(b,key,{u,t0,t1,y0,y1,alongV=false,n=10,tone=1}){const p=[],uv=[],tl=URBAN_TILE_SIZE[key]||2,P=(t,y)=>alongV?[u,y,t]:[t,y,u];
 for(let i=0;i<n;i++){const ta=t0+(t1-t0)*i/n,tb=t0+(t1-t0)*(i+1)/n,a0=y0(ta),a1=y1(ta),b0=y0(tb),b1=y1(tb);if(a1-a0<.005&&b1-b0<.005)continue;
  p.push(...P(ta,a0),...P(tb,b0),...P(tb,b1),...P(ta,a0),...P(tb,b1),...P(ta,a1));uv.push(ta/tl,a0/tl,tb/tl,b0/tl,tb/tl,b1/tl,ta/tl,a0/tl,tb/tl,b1/tl,ta/tl,a1/tl);}
 if(p.length)geo(b,key,p,uv,tone);}
// segmental vault between v=va..vb springing at ys with rise f: returns {cv,cy,r,a0,a1,y(v)}
function vault(va,vb,ys,f){const w=(vb-va)/2,cv=(va+vb)/2,r=(w*w+f*f)/(2*f),cy=ys+f-r,a0=Math.atan2(ys-cy,w),a1=Math.PI-a0;return{cv,cy,r,a0,a1,y:v=>cy+Math.sqrt(Math.max(0,r*r-(v-cv)**2))};}
const pieces=(a,c,skip)=>!skip||skip[1]<=a||skip[0]>=c?[[a,c]]:[[a,Math.max(a,skip[0])],[Math.min(c,skip[1]),c]].filter(q=>q[1]-q[0]>.01);
const piecesN=(a,c,skips)=>{let out=[[a,c]];for(const s of skips)if(s)out=out.flatMap(([p,q])=>pieces(p,q,s));return out;};
const inside=(u,skips)=>skips.some(s=>s&&u>s[0]-.5&&u<s[1]+.5);
function rail(b,v0,u0,v1,u1){const dv=v1-v0,du=u1-u0,L=Math.hypot(dv,du);b.box('s128Rail',(v0+v1)/2,BED+.08,(u0+u1)/2,.08,.16,L,Math.atan2(dv,du));}
function track(b,va,ua,vb,ub){for(const g of[-.72,.72])rail(b,va+g,ua,vb+g,ub);const dv=vb-va,du=ub-ua,L=Math.hypot(dv,du),n=Math.floor(L/.65);for(let k=0;k<n;k++){const t=(k+.5)/n;b.box('s128Dark',va+dv*t,BED+.02,ua+du*t,2.4,.05,.22,Math.atan2(dv,du),1.4);}}
function chandelier(b,v,y,u,lod){b.box('s129Bronze',v,y-.45,u,.06,.9,.06);b.cylinder('s129Bronze',v,y-1.0,u,.62,.5,.14,10);b.cylinder('s129Bronze',v,y-1.32,u,.28,.42,.5,8);
 b.sphere('s129Glow',v,y-1.62,u,.2,.24,.2);if(!lod)for(let k=0;k<8;k++){const a=k*Math.PI/4;b.sphere('s129Glow',v+.62*Math.cos(a),y-.86,u+.62*Math.sin(a),.09,.13,.09);b.box('s129Bronze',v+.62*Math.cos(a),y-.96,u+.62*Math.sin(a),.04,.12,.04);}}
function globeLamp(b,v,y,u){b.box('s129Black',v,y-.4,u,.04,.8,.04);b.sphere('s129Glow',v,y-.95,u,.22,.22,.22);}
function ibeam(b,v,y0,y1,u,ry=0){const h=y1-y0,yc=(y0+y1)/2;b.box('s129Beam',v,yc,u,.05,h,.3,ry);b.box('s129Beam',v,yc,u-.15,.34,h,.04,ry);b.box('s129Beam',v,yc,u+.15,.34,h,.04,ry);
 b.box('s129Beam',v,y1-.08,u,.5,.16,.5,ry);b.box('s129Beam',v,y0+.05,u,.46,.1,.46,ry);}
// ------------------------------------------------------------------------------------------------ the station hall
// opts: st0/st1 hall range, wallSkip [cx0,cx1] (canal under/over), ceilSkip (canal chamber / glass), stairV (+1/-1/0), lod
export function* station129(b,sp,{st0,st1,wallSkip,ceilSkip,stairV,lod}){
 const m=b.mats,st=sp.style,island=sp.island,skips=[wallSkip],cs=[ceilSkip||wallSkip];
 const sz0=S.stair0-.3,sz1=S.stair0+S.stairLen+.3,ss=Math.sign(stairV||0);   // stair zone on side ss
 const wallKey=st==='ny'?'s129NyTile':st==='mos'?'s129Marble':st==='tube'?'s129LonTile':'s129Brick';
 const floorKey=st==='mos'?'s129MosFloor':'s129Terr';
 const C=st==='ny'?-5.7:st==='cut'?-4.75:-4.5;   // flat ceiling height (NY low)
 const len=(a,c)=>c-a,mid=(a,c)=>(a+c)/2;
 // ---------------- platforms + track splay (island) -----------------
 const isl0=st0+14,isl1=st1-14,TV=6.2;
 for(const[a,c]of piecesN(st0,st1,skips)){
  if(!island)for(const sv of[-1,1]){b.box(floorKey,sv*8,(BED+PL)/2-.1,mid(a,c),6,PL-BED+.2,len(a,c),0,1.1);b.box('s128Edge',sv*5.2,PL+.005,mid(a,c),.4,.012,len(a,c),0,1.5);b.walk(sv*8,mid(a,c),6,len(a,c),PL);}
  else{for(const sv of[-1,1]){b.box(floorKey,sv*9.4,(BED+PL)/2-.1,mid(a,c),3.2,PL-BED+.2,len(a,c),0,1.1);b.box('s128Edge',sv*8.0,PL+.005,mid(a,c),.4,.012,len(a,c),0,1.5);b.walk(sv*9.4,mid(a,c),3.2,len(a,c),PL);
    b.box('s128Ballast',sv*6.4,BED-.15,mid(a,c),2.8,.3,len(a,c));b.walk(sv*6.4,mid(a,c),2.8,len(a,c),BED);}
   const i0=Math.max(a,isl0),i1=Math.min(c,isl1);if(i1-i0>.5){b.box(floorKey,0,(BED+PL)/2-.1,mid(i0,i1),9.2,PL-BED+.2,len(i0,i1),0,1.1);for(const sv of[-1,1])b.box('s128Edge',sv*4.4,PL+.005,mid(i0,i1),.4,.012,len(i0,i1),0,1.5);b.walk(0,mid(i0,i1),9.2,len(i0,i1),PL);}}
 }
 if(island){track(b,-2.2,st0,-TV,isl0);track(b,2.2,st0,TV,isl0);track(b,-TV,isl0,-TV,isl1);track(b,TV,isl0,TV,isl1);track(b,-TV,isl1,-2.2,st1);track(b,TV,isl1,2.2,st1);
  for(const u of[isl0,isl1]){b.box(floorKey,0,(BED+PL)/2-.1,u,6.4,PL-BED+.2,.6,0,.8);}}
 yield 0;
 // ---------------- walls (outer, v = +-11) -----------------
 const wallTop=st==='ny'?C:st==='cut'?-4.3:st==='mos'?-5.0:-4.5;
 const chz=cs[0]&&cs[0]!==wallSkip?cs[0]:null;
 const wp=piecesN(st0,st1,skips).flatMap(([a,c])=>!chz?[[a,c,0]]:[[a,Math.min(c,chz[0]),0],[Math.max(a,chz[0]),Math.min(c,chz[1]),1],[Math.max(a,chz[1]),c,0]].filter(q=>q[1]-q[0]>.01));
 for(const[a,c,ch]of wp)for(const sv of[-1,1]){
  const vis=st!=='tube'||ch||(sv===ss&&c>sz0&&a<sz1),top=ch?-4.5:wallTop;
  if(vis)b.box(wallKey,sv*(HW+.3),(BED+top)/2,mid(a,c),.6,top-BED+.2,len(a,c),0,sp.tone);
  b.solid(sv*(HW+.3),mid(a,c),.6,len(a,c));if(ch)continue;
  if(st==='ny'){const bk=sp.band?'s129BandB':'s129BandA';for(const[y0,y1]of[[PL+2.45,PL+2.8]]){const v=sv*(HW-.02);quad(b,bk,[v,y0,a],[v,y0,c],[v,y1,c],[v,y1,a],[a/1.2,0,c/1.2,0,c/1.2,1,a/1.2,1]);}}
  if(st==='cut'&&sp.dado){b.box('s129Cream',sv*(HW-.03),PL+.7,mid(a,c),.06,1.4,len(a,c));b.box('s129Black',sv*(HW-.05),PL+1.42,mid(a,c),.06,.06,len(a,c));}
  if(st==='mos'){b.box('s129Red',sv*(HW-.05),PL+.25,mid(a,c),.12,.5,len(a,c),0,.75);b.box('s129Bronze',sv*(HW-.08),-5.05,mid(a,c),.18,.14,len(a,c));}
 }
 // end walls (5 m tunnel -> 11 m hall) + header up to the hall crown
 const crown=st==='mos'?-2.4:-4.5;
 for(const u of[st0,st1])for(const sv of[-1,1]){b.box(wallKey,sv*8.3,(BED+Math.max(crown,-4.5))/2,u,5.4,Math.max(crown,-4.5)-BED+.6,.6,0,sp.tone);b.solid(sv*8.3,u,5.4,.6);}
 for(const u of[st0,st1]){if(st==='ny')b.box(wallKey,0,(C-4.5)/2,u,10.6,C+4.5>0?.01:(-4.5-C)+.2,.6,0,sp.tone);if(st==='mos')b.box(wallKey,0,(-4.5+crown)/2,u,10.6,crown+4.5+.3,.6,0,sp.tone);}
 yield 0;
 // ---------------- ceilings / vaults / bores -----------------
 const stairCut=(a,c)=>ss&&c>sz0&&a<sz1;
 const flatWithHole=(a,c,y,v0,v1,key)=>{ // flat slab over v0..v1 (absolute, v0<v1) with the stair hole on side ss
  const h0=ss>0?S.stairX0:-S.stairX1,h1=ss>0?S.stairX1:-S.stairX0;
  for(const[e,f]of pieces(a,c,[sz0+.3,sz1-.3])){b.box(key,(v0+v1)/2,y+.15,mid(e,f),v1-v0,.3,len(e,f));}
  const e=Math.max(a,sz0+.3),f=Math.min(c,sz1-.3);if(f-e>.01){if(h0>v0)b.box(key,(v0+h0)/2,y+.15,mid(e,f),h0-v0,.3,f-e);if(v1>h1)b.box(key,(h1+v1)/2,y+.15,mid(e,f),v1-h1,.3,f-e);}};
 const ceilP=piecesN(st0,st1,cs);
 if(st==='ny'){
  for(const[a,c]of ceilP){flatWithHole(a,c,C,-HW-.6,HW+.6,'s129Paint');
   if(stairCut(a,c)){const e=Math.max(a,sz0),f=Math.min(c,sz1),v=ss*S.stairX0;b.box(wallKey,v-ss*.1,(C-4.5)/2,mid(e,f),.2,-4.5-C,f-e);b.box(wallKey,ss*(HW+.2),(C-4.5)/2,mid(e,f),.4,-4.5-C,f-e);}
   const rows=island?[-2.4,2.4]:sp.cols==='center'?[0]:sp.cols==='edges'?[-5.6,5.6]:[-5.6,0,5.6];
   for(const v of rows){b.box('s129Beam',v,C-.2,mid(a,c),.3,.4,len(a,c));for(let u=Math.ceil(a/4.6)*4.6;u<c-.3;u+=4.6){if(stairCut(u-.5,u+.5)&&Math.abs(v-ss*9.5)<2)continue;const base=(!island&&Math.abs(v)<1)?BED:PL;if(island&&(u<isl0+1||u>isl1-1))continue;ibeam(b,v,base,C-.4,u);b.solid(v,u,.45,.45);}}
   for(let u=Math.ceil(a/4.6)*4.6;u<c;u+=4.6)b.box('s129Beam',0,C-.12,u,2*HW,.24,.22);
   if(!lod)for(let u=Math.ceil(a/4.6)*4.6+2.3;u<c;u+=4.6)for(const v of(island?[-6.2,0,6.2,-9.5,9.5]:[-8,-2.6,2.6,8])){if(stairCut(u-1,u+1)&&Math.abs(v-ss*9.5)<2.2)continue;
    if(sp.lamp==='bulb'){b.box('s129Black',v,C-.12,u,.05,.24,.05);b.sphere('s129Glow',v,C-.32,u,.11,.13,.11);}else b.box('s129Tube',v,C-.06,u,.12,.07,1.5);}}}
 else if(st==='cut'){
  for(const[a,c]of ceilP){if(stairCut(a,c))flatWithHole(Math.max(a,sz0),Math.min(c,sz1),-4.45,-HW-.6,HW+.6,'s129Brick');
   for(let u=Math.ceil(a/3.2)*3.2;u<c-.01;u+=3.2){b.box('s129Iron',0,-4.95,u,2*HW+.6,.5,.34);}
   for(let u=Math.floor(a/3.2)*3.2;u<c;u+=3.2){const e=Math.max(a,u+.17),f=Math.min(c,u+3.2-.17);if(f-e<.1)continue;
    if(stairCut(e,f))continue;
    arcV(b,'s129Brick',(u+u+3.2)/2,-4.95-1.8,2.02,Math.PI/2-.82,Math.PI/2+.82,-HW-.3,HW+.3);}
   for(let u=Math.ceil(a/6.4)*6.4+3.2;u<c-1;u+=6.4){b.cylinder('s129Iron',0,(BED-4.7)/2,u,.17,.2,-4.7-BED,8);b.cylinder('s129Iron',0,-4.95,u,.42,.18,.4,8);b.solid(0,u,.4,.4);}
   if(!lod)for(let u=Math.ceil(a/6.4)*6.4;u<c;u+=6.4)for(const sv of[-1,1]){if(stairCut(u-1,u+1)&&sv===ss)continue;if(sp.lamp==='globe')globeLamp(b,sv*7.6,-4.7,u);else b.box('s129Tube',sv*7.6,-4.78,u,.14,.08,2.2);}}}
 else if(st==='mos'){
  const cw=island?2.6:7.4,ys=-5.3,cv=vault(-cw+.4,cw-.4,ys,island?1.6:2.9),sv1=vault(cw+.4,HW,ys,island?1.7:1.0),sv0=vault(-HW,-cw-.4,ys,island?1.7:1.0);
  for(const[a,c]of ceilP){arcU(b,'s129Vault',cv.cv,cv.cy,cv.r,cv.a0,cv.a1,a,c,{n:14});
   for(const[side,sw]of[[1,sv1],[-1,sv0]]){if(side===ss){for(const[e,f]of pieces(a,c,[sz0,sz1]))arcU(b,'s129Vault',sw.cv,sw.cy,sw.r,sw.a0,sw.a1,e,f,{n:10,tone:.86});
     const e=Math.max(a,sz0),f=Math.min(c,sz1);if(f-e>.01){const v0=side>0?cw+.4:-HW,v1=side>0?HW:-cw-.4;flatWithHole(e,f,-4.6,v0,v1,'s129Plaster');b.box('s129Plaster',side*(cw+.4),(ys-4.45)/2,mid(e,f),.1,-4.45-ys,f-e);
      for(const uu of[e,f])fill(b,'s129Plaster',{u:uu,t0:v0,t1:v1,y0:()=>-4.45,y1:t=>sw.y(t),n:10});}}
    else arcU(b,'s129Vault',sw.cv,sw.cy,sw.r,sw.a0,sw.a1,a,c,{n:10,tone:.86});}
   // the pier rows (pylons with arches, or columns with an architrave) along v = +-cw
   const P=7.6;for(const sv of[-1,1]){const v=sv*cw,key=sp.red?'s129Red':'s129Marble',bt=island?PL:PL;
    if(sp.pier==='pylon'){for(let u=Math.floor(a/P)*P;u<c;u+=P){const p0=Math.max(a,u+.1),p1=Math.min(c,u+4.1);if(p1-p0>.2){b.box(key,v,(bt+ys)/2,mid(p0,p1),1.6,ys-bt,len(p0,p1));b.solid(v,mid(p0,p1),1.6,len(p0,p1));
       b.box('s129Black',v,bt+.18,mid(p0,p1),1.7,.36,len(p0,p1)+.06);b.box('s129Bronze',v,ys-.2,mid(p0,p1),1.75,.14,len(p0,p1)+.08);
       if(!lod&&p1-p0>3.9){if((Math.round(u/P)+sp.name)%2===0)panel(b,'s129Relief',v+sv*-.81,-sv,mid(p0,p1),-6.7,2.6,1.5);
        if(sp.lamp==='torch'){for(const s2 of[-1,1]){b.box('s129Bronze',v+s2*.95,-6.6,mid(p0,p1),.12,1.2,.12);b.sphere('s129Glow',v+s2*1.0,-5.85,mid(p0,p1),.22,.3,.22);}}}}
      // arch between pylons: soffit + spandrels on both faces
      const o0=u+4.1,o1=u+P+.1,ac=(o0+o1)/2,rr=(o1-o0)/2,yc=ys-rr;if(o1>a&&o0<c&&o0>=a-.01&&o1<=c+.01){arcV(b,key,ac,yc,rr,0,Math.PI,v-.8,v+.8,{n:10});
       for(const fv of[v-.8,v+.8])fill(b,key,{u:fv,alongV:true,t0:o0,t1:o1,y0:t=>yc+Math.sqrt(Math.max(0,rr*rr-(t-ac)**2)),y1:()=>ys,n:10});}}}
    else{b.box(key,v,ys+.3,mid(a,c),1.0,.6,len(a,c));for(const e2 of[-.5,.5])b.box('s129Bronze',v+e2,ys-.04,mid(a,c),.08,.1,len(a,c));
     for(let u=Math.ceil(a/6)*6+3;u<c-.5;u+=6){b.cylinder(key,v,(bt+ys)/2,u,.42,.46,ys-bt,12);b.cylinder('s129Bronze',v,ys-.25,u,.62,.42,.5,12);b.cylinder('s129Black',v,bt+.2,u,.55,.6,.4,12);b.solid(v,u,.9,.9);}}}
   // lamps + mosaic medallions in the central vault
   if(!lod)for(let u=Math.floor(a/P)*P+P/2+2.05;u<c;u+=P){if(u<a+.5)continue;if(sp.lamp==='chandelier')chandelier(b,0,cv.y(0),u,lod);else b.box('s129Glow',0,cv.y(0)-.08,u,.5,.1,2.2);
    if(sp.vault==='mosaic'&&(Math.round(u/P)%2===0)){const y=cv.y(0)-.03;quad(b,'s129Mosaic',[-1.3,y-.12,u-1.3],[1.3,y-.12,u-1.3],[1.3,y-.12,u+1.3],[-1.3,y-.12,u+1.3]);}}}
 }
 else{ // tube: twin circular bores (track + platform each), spine with cross-passages, roundels/posters on the curved wall
  const R=5.4,CY=BED,a0=Math.asin((PL-CY)/R);
  for(const[a,c]of ceilP){
   const xp=[];for(let u=Math.ceil((a+3)/sp.xpass)*sp.xpass;u<c-3;u+=sp.xpass)xp.push([u-1.2,u+1.2]);
   for(const sv of[-1,1]){const cvv=sv*5.6,aIn=sv>0?Math.PI:0,aOut=sv>0?a0:Math.PI-a0,aCrown=Math.PI/2,aPass=sv>0?Math.acos((1.6-5.6)/R):Math.PI-Math.acos((1.6-5.6)/R);
    // inner half (crown -> spine), broken at the cross-passages
    let uu=a;for(const[p0,p1]of[...xp,[c,c]]){arcU(b,'s129LonTile',cvv,CY,R,aCrown,aIn,uu,Math.min(p0,c),{n:10,tone:sp.tone});if(p1>p0){arcU(b,'s129LonTile',cvv,CY,R,aCrown,aPass,p0,p1,{n:6,tone:sp.tone});}uu=p1;}
    // outer half (crown -> platform), replaced by a flat ceiling + wall in the stair zone
    for(const[e,f]of(sv===ss?pieces(a,c,[sz0,sz1]):[[a,c]]))arcU(b,'s129LonTile',cvv,CY,R,aOut,aCrown,e,f,{n:10,tone:sp.tone});
    if(sv===ss){const e=Math.max(a,sz0),f=Math.min(c,sz1);if(f-e>.01){flatWithHole(e,f,-4.6,sv>0?5.6:-HW-.3,sv>0?HW+.3:-5.6,'s129LonTile');for(const u of[e,f])fill(b,'s129LonTile',{u,t0:sv>0?5.6:-HW,t1:sv>0?HW:-5.6,y0:t=>CY+Math.sqrt(Math.max(0,R*R-(t-cvv)**2)),y1:()=>-4.45,n:10});}}
    // strip light along the crown + roundels and curved posters over the platform
    if(!lod){b.box('s129Tube',cvv,-4.75,mid(a,c),.16,.08,len(a,c)-.4);
     for(let u=Math.ceil(a/14)*14+4;u<c-3;u+=14){if(sv===ss&&u>sz0-3&&u<sz1+3)continue;const k=signKey(m,sp.sign,sp.lang),[q0,q1,q2,q3]=cellUV(sp.name);
      panel(b,k,sv*9.3,sv,u,-6.9,2.8,.7,[q0,q1,q2,q3]);b.box('s129Black',sv*9.55,-6.9,u,.5,.06,.06);
      for(const du of[-4.2,4.2]){const pu=u+du,pa=Math.asin((-7.9-CY)/R);const at=Math.asin((-6.2-CY)/R),A0=sv>0?pa:Math.PI-pa,A1=sv>0?at:Math.PI-at;arcU(b,'s129Poster'+(1+((sp.poster+Math.round(pu))&3)),cvv,CY,R-.04,A0,A1,pu-.8,pu+.8,{n:4,uvFull:true,flipU:sv<0});}}}}
   // spine between the bores (solid except at the passages) + passage boxes
   let uu=a;for(const[p0,p1]of[...xp,[c,c]]){if(p0-uu>.05){b.box('s129LonTile',0,(BED-9.3)/2,mid(uu,p0),.5,.7,p0-uu,0,sp.tone);b.solid(0,mid(uu,p0),1.2,p0-uu);}uu=p1;}
   for(const[p0,p1]of xp){b.box('s129LonTile',0,-6.4+.15,mid(p0,p1),3.2,.3,p1-p0,0,sp.tone);
    for(const u of[p0,p1])fill(b,'s129LonTile',{u,t0:-1.6,t1:1.6,y0:t=>CY+Math.sqrt(Math.max(0,R*R-(Math.abs(t)-5.6)**2)),y1:()=>-6.4,n:8});
    if(!lod)b.box('s129Glow',0,-6.45,mid(p0,p1),.3,.05,.8);}
  }
  // end walls: the rock between the two bores and the 5 m tunnel mouth
  for(const u of[st0,st1])if(!inside(u,cs))fill(b,'s129LonTile',{u,t0:-5.3,t1:5.3,y0:t=>CY+Math.sqrt(Math.max(0,R*R-(Math.abs(t)-5.6)**2)),y1:()=>-4.45,n:16});
 }
 yield 0;
 // ---------------- name signs on the outer walls + benches, fare control -----------------
 if(st!=='tube'){const k=signKey(m,sp.sign,sp.lang),uv=cellUV(sp.name),step=sp.sign==='roundel'?13:15,ys=sp.sign==='roundel'?PL+2.0:PL+1.65,w=sp.sign==='roundel'?3.0:2.8,h=sp.sign==='roundel'?.75:.7;
  for(const[a,c]of piecesN(st0,st1,[...skips,...cs]))for(let u=Math.ceil((a+3)/step)*step;u<c-2;u+=step)for(const sv of[-1,1]){if(sv===ss&&u>sz0-2&&u<sz1+2)continue;
   panel(b,k,sv*(HW-.04),sv,u,ys,w,h,uv);
   if(st==='cut'&&!lod&&(Math.round(u/step)&1))panel(b,'s129Poster'+(1+((sp.poster+Math.round(u))&3)),sv*(HW-.05),sv,u+6.5,PL+1.7,1.2,1.8);}
  if(!lod)for(const[a,c]of piecesN(st0,st1,[...skips,...cs]))for(let u=Math.ceil((a+8)/20)*20;u<c-3;u+=20)for(const sv of[-1,1]){if(sv===ss&&u>sz0-3&&u<sz1+3)continue;const v=sv*(island?10.3:10.2);
   b.box(st==='mos'?'s129Bronze':'s129Beam',v,PL+.45,u,.45,.06,2.4);b.box(st==='mos'?'s129Marble':'s129Black',v,PL+.22,u-.9,.4,.44,.1);b.box(st==='mos'?'s129Marble':'s129Black',v,PL+.22,u+.9,.4,.44,.1);}
 }
 if(sp.fare&&ss&&!inside(S.stair0+S.stairLen+4,cs)&&!inside(S.stair0+S.stairLen+4,skips)){const u=S.stair0+S.stairLen+3.4,vb0=island?8.0:5.4,vb1=HW;
  // fare control across the platform next to the stair foot: token/ticket booth + a row of turnstiles
  const bw=1.7,bc=ss*(vb1-bw/2-.1);b.box('s129Beam',bc,PL+1.2,u+.6,bw,2.4,2.0,0,.8);b.solid(bc,u+.6,bw,2.0);panelU(b,'s129Booth',u-.42,1,bc,PL+1.25,bw,1.7);
  b.box('s129Black',bc,PL+2.45,u+.6,bw+.1,.12,2.1);
  for(let v=vb0+.5;v<vb1-bw-.4;v+=.9){const vv=ss*v;b.box('s129Steel',vv,PL+.5,u,.22,1.0,.5,0,.9);b.cylinder('s129Steel',vv+.12*ss,PL+.95,u,.06,.06,.2,6);for(let k=0;k<3;k++){const a=k*2.094;b.box('s129Steel',vv+ss*.3,PL+.92+.18*Math.sin(a),u+.18*Math.cos(a),.5,.03,.03);}}}
}
// ------------------------------------------------------------------------------------------------ street entrance dressing (street batch)
// called per stair with its frame already pushed (stair across v0..v1, descending along +u from u0); top = street level
export function entrance129(b,sp,{v0,v1,u0,u1,top,lod,sv,ix,iz}){
 const st=sp.style,m=b.mats,vc=(v0+v1)/2,L=u1-u0,drop=top-S.plat;
 // street markers at the open end
 if(st==='ny'){for(const v of[v0,v1]){b.box('s129Green',v,top+1.5,u0+.15,.06,3.0,.06,0,.5);b.sphere('s129Green',v,top+3.05,u0+.15,.2,.2,.2);b.box('s129Black',v,top+2.85,u0+.15,.14,.14,.14);}
  const k='s129Ent',[q0,q1,q2,q3]=entUV(0);quad(b,k,[v1,top+1.15,u0+.05],[v0,top+1.15,u0+.05],[v0,top+1.55,u0+.05],[v1,top+1.55,u0+.05],[q0,q1,q2,q1,q2,q3,q0,q3]);}
 else{const vo=sv>0?v1:v0,v=vo+sv*.6,cell=st==='mos'?1:2,[q0,q1,q2,q3]=entUV(cell);b.box('s129Black',v,top+1.6,u0+.4,.1,3.2,.1);
  for(const s of[1,-1])quad(b,'s129Ent',[v+s*.7,top+3.0,u0+.4-s*.01],[v-s*.7,top+3.0,u0+.4-s*.01],[v-s*.7,top+3.7,u0+.4-s*.01],[v+s*.7,top+3.7,u0+.4-s*.01],[q0,q1,q2,q1,q2,q3,q0,q3]);}
 if(sp.entrance!=='escalator')return;
 // escalator: two lanes + centre/side balustrades with black handrails; step key swapped by the caller
 const yAt=u=>top-(u-u0)/L*drop;
 const bk=st==='mos'?'s129Bronze':st==='tube'?'s129Beam':'s129Steel';for(const v of[v0+.12,vc,v1-.12]){quad(b,bk,[v,yAt(u0)+.05,u0],[v,yAt(u1)+.05,u1],[v,yAt(u1)+.9,u1],[v,yAt(u0)+.9,u0],[0,0,L,0,L,1,0,1],st==='mos'?.45:.62);b.rod('s129Black',[v,yAt(u0)+.93,u0],[v,yAt(u1)+.93,u1],.05);}
 if(st==='mos'&&!lod)for(let u=u0+2;u<u1-1;u+=2.6){const y=yAt(u);b.box('s129Bronze',vc,y+1.6,u,.08,1.2,.08);b.sphere('s129Glow',vc,y+2.3,u,.15,.2,.15);}
 // ribbed barrel over the lower part of the shaft (kept below street level)
 const r=(v1-v0)/2+.35,key=st==='mos'?'s129Vault':st==='tube'?'s129LonTile':'s129Brick';
 for(let k=0;k<12;k++){const ua=u0+L*(.52+.04*k),ub=ua+L*.04;if(ub>u1)break;const ya=yAt(ua)+2.3,yb=yAt(ub)+2.3;if(ya+r>top-.25)continue;
  const p=[],uv=[];for(let i=0;i<8;i++){const t0=Math.PI*i/8,t1=Math.PI*(i+1)/8,A=[vc+r*Math.cos(t0),r*Math.sin(t0)],C=[vc+r*Math.cos(t1),r*Math.sin(t1)];
   p.push(A[0],ya+A[1],ua,C[0],ya+C[1],ua,C[0],yb+C[1],ub,A[0],ya+A[1],ua,C[0],yb+C[1],ub,A[0],yb+A[1],ub);uv.push(i/4,ua/2,(i+1)/4,ua/2,(i+1)/4,ub/2,i/4,ua/2,(i+1)/4,ub/2,i/4,ub/2);}
  geo(b,key,p,uv);if(k%3===0&&!lod)b.box('s129Glow',vc,ya+r-.06,(ua+ub)/2,.6,.06,.12);}
 if(st==='tube'&&!lod)for(let u=u0+3;u<u1-1;u+=2.4){const y=yAt(u);panel(b,'s129Poster'+(1+((sp.poster+Math.round(u))&3)),(sv>0?v1:v0)-sv*.04,sv,u,y+1.9,.9,1.3);}
}
export function stepKey(sp){return sp.entrance==='escalator'?'s129Esc':null;}
export function shaftKey(sp){return sp.style==='ny'?'s129NyTile':sp.style==='mos'?'s129Marble':sp.style==='tube'?'s129LonTile':'s129Brick';}
