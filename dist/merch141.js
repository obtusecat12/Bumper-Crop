// V141 F5b: SoHo street-fair MERCH stalls + stall dressing, modelled in their real shapes (user 10-21 22:43 慢慢做、认真打磨;
// PROP RULE 10-21 22:30). Replaces the coloured boxes of soho135-fair.js's four merch kinds:
//  bags   - canvas totes (gusseted body, strap loops) standing and hanging from S-hooks on a bar under the front valance,
//           leather handbags (tapered extruded body, flap, arched handle), rattan market baskets, a tall floor basket
//  racks  - chrome clothes rail on castor feet with hangers (wire hook + shoulder bar) carrying shirts / dresses / sweaters
//           cut from real garment outlines (sleeves, collar dip, flared hem), plus folded-tee stacks on the table
//  piles  - stacks of folded clothes (fold roll on the front edge, sagging tops) and silk scarves draped over a front bar
//  chairs - two bentwood café chairs (walnut seat, splayed legs, leg ring, bent hoop back), honey jars and jar candles
// Stall dressing for every tent / banner / booth: ring sandbags round each leg foot, a catenary string of warm bulbs on
// the front (tents/banners on the eave, booths under the sign) on ~2/3 of stalls.
// One generated atlas (bc/tools/merch141_assets.py -> assets/l11-v141f/merch141{,_r,_n,_e}.webp; base / rough+metal /
// normal / emission for the bulbs). ?fair141=0 = the V135 boxes (same switch as F5a).
import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {MERCHUV141} from './merch141-uv.js?v=141j';
const A=new URL('./assets/l11-v141f/',import.meta.url).href,V='141j',PI=Math.PI,M='fairMerch141';
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addMerch141Materials(m){
 if(m[M])return m;
 const orm=tex('merch141_r');
 m[M]=new T.MeshStandardMaterial({map:tex('merch141',true),roughnessMap:orm,metalnessMap:orm,roughness:1,metalness:1,normalMap:tex('merch141_n'),normalScale:new T.Vector2(.8,.8),
  emissive:0xffffff,emissiveMap:tex('merch141_e',true),emissiveIntensity:1.6,vertexColors:true,side:T.DoubleSide});
 return m;
}
/** booth planks + d3's striped café awning (tiling maps; colour stays the material's own) */
let PL=null,AW=null;
export function plank141(){if(!PL){const a=tex('plank141',true),n=tex('plank141-n');for(const t of[a,n])t.wrapS=t.wrapT=T.RepeatWrapping;PL={map:a,normalMap:n,normalScale:new T.Vector2(.7,.7)};}return PL;}
export function awnStripe141(){if(!AW){const a=tex('awnstr141',true),n=tex('awnstr141-n');for(const t of[a,n])t.wrapS=t.wrapT=T.RepeatWrapping;AW={map:a,normalMap:n};}return AW;}

const R=k=>MERCHUV141[k];
const sub=(r,s0,t0,s1,t1)=>[r[0]+(r[2]-r[0])*s0,r[1]+(r[3]-r[1])*t0,r[0]+(r[2]-r[0])*s1,r[1]+(r[3]-r[1])*t1];
const Q=(k,i)=>sub(R(k),(i%2)*.5,1-((i>>1)+1)*.5,(i%2)*.5+.5,1-(i>>1)*.5);           // quadrant i (0 TL,1 TR,2 BL,3 BR)
const CHROME=()=>sub(Q('metal',0),.05,.05,.95,.95),WIRE=()=>sub(Q('metal',1),.05,.05,.95,.95),HWOOD=()=>sub(Q('metal',2),.05,.05,.95,.95),HPLAS=()=>sub(Q('metal',3),.05,.05,.95,.95);
const H=(a,b=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return(h>>>0)/4294967296;};
function remap(g,r){const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,r[0]+(r[2]-r[0])*Math.min(1,Math.max(0,u.getX(i))),r[1]+(r[3]-r[1])*Math.min(1,Math.max(0,u.getY(i))));return g;}
// planar uv over the geometry's own bbox (axis 'xy' front view / 'xz' top view) into rect r
function fit(g,r,ax='xy'){g.computeBoundingBox();const bb=g.boundingBox,p=g.attributes.position,a=ax[0],c=ax[1],u=new Float32Array(p.count*2);
 const lo=[bb.min[a],bb.min[c]],sp=[bb.max[a]-bb.min[a]||1,bb.max[c]-bb.min[c]||1],get=(i,k)=>k==='x'?p.getX(i):k==='y'?p.getY(i):p.getZ(i);
 for(let i=0;i<p.count;i++){u[i*2]=r[0]+(r[2]-r[0])*(get(i,a)-lo[0])/sp[0];u[i*2+1]=r[1]+(r[3]-r[1])*(ax==='xz'?1-(get(i,c)-lo[1])/sp[1]:(get(i,c)-lo[1])/sp[1]);}
 g.setAttribute('uv',new T.BufferAttribute(u,2));return g;}
const lathe=(pts,seg,r)=>remap(new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),seg),r);
const cache=new Map();const tpl=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
// merge parts (each [geometry, matrix]) into one non-indexed geometry with position/normal/uv
function merge(parts){const gs=parts.map(([g,m])=>{let q=g.index?g.toNonIndexed():g.clone();if(m)q.applyMatrix4(m);for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);if(!q.attributes.normal)q.computeVertexNormals();return q;});
 const out=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());return out;}
const MX=(x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),typeof s==='number'?new T.Vector3(s,s,s):new T.Vector3(...s));
// rod from a to b (unit cylinder along Y, uv rect r)
function rodM(a,b){const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va),L=d.length();const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
 return new T.Matrix4().compose(va.clone().add(vb).multiplyScalar(.5),q,new T.Vector3(1,L,1));}
const cylT=(r,seg,rect)=>remap(new T.CylinderGeometry(r,r,1,seg,1,true),rect);
const box=(w,h,d,r,segs=[1,1,1])=>{const g=new T.BoxGeometry(w,h,d,...segs);return remap(g,r);};
// add a template with a yaw (and optional tilt about x / z) in the current batch frame
const put=(b,g,x,y,z,ry=0,rx=0,rz=0,s=1)=>b.add(g,M,x,y,z,s,s,s,ry,rx,rz);

// ---------------- bags ----------------
// tote: thin gusseted body (front/back bulge), two strap loops; face = print cell / plain-colour quadrant
function toteG(face){return tpl('tote'+face,()=>{const w=.36,h=.4,d=.07,g=new T.BoxGeometry(w,h,d,4,4,1),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i)/w*2,y=p.getY(i)/h+.5,z=p.getZ(i);p.setZ(i,z*(1-Math.abs(x)**3*.6)*(.55+.45*(1-y))+Math.sign(z)*.008*(1-x*x));}
 g.computeVertexNormals();const r=face<0?R('tote'):sub(Q('totes',face),.04,.04,.96,.96);remap(g,r);
 const strap=remap(new T.TorusGeometry(.085,.007,4,10,PI),face<0?sub(R('tote'),0,0,.12,.12):sub(Q('totes',face),0,0,.1,.1));
 return merge([[g,MX(0,h/2,0)],[strap,MX(-.0,h,.03)],[strap,MX(0,h,-.03)]]);});}
// hanging tote: straps up over an S-hook
function handbagG(k){return tpl('hb'+k,()=>{const s=new T.Shape();s.moveTo(-.17,0);s.lineTo(.17,0);s.lineTo(.13,.2);s.lineTo(-.13,.2);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:2});g.translate(0,0,-.05);
 const r=sub(R('leather'),k*.3,.2,k*.3+.4,.8);fit(g,r,'xy');
 const flap=box(.27,.008,.11,sub(R('leather'),.5,0,.95,.3));const clasp=box(.03,.02,.008,CHROME());
 const handle=remap(new T.TorusGeometry(.08,.009,5,12,PI),sub(R('leather'),0,.85,.3,1));
 return merge([[g],[flap,MX(0,.208,.0,.0)],[clasp,MX(0,.19,.065)],[handle,MX(0,.21,0)]]);});}
function basketG(tall){return tpl('bk'+tall,()=>{const h=tall?.55:.22,r0=tall?.17:.15,r1=tall?.21:.19;
 const g=lathe([[0,.005],[r0,0],[r1,h],[r1+.012,h+.012],[r1-.008,h+.005],[r0-.01,.012],[0,.012]],14,R('straw'));
 const parts=[[g]];if(!tall){const hd=remap(new T.TorusGeometry(r1-.01,.01,4,12,PI),sub(R('straw'),0,0,.2,.2));parts.push([hd,MX(0,h,0)]);}
 return merge(parts);});}
const shook=()=>tpl('shook',()=>merge([[remap(new T.TorusGeometry(.018,.003,3,8,PI*1.2),WIRE()),MX(0,0,0,0,PI/2,0)],[remap(new T.TorusGeometry(.018,.003,3,8,PI*1.2),WIRE()),MX(0,-.034,0,0,PI/2,PI)]]));
function bags(b,w,z,top,seed){
 // table: 3 standing totes, 2 handbags, a small basket
 for(let i=0;i<3;i++)put(b,toteG(i===0?-1:(seed+i)%4),-w*.36+i*.3,top,z+.05+(i%2)*.1,(H(seed,i)-.5)*.3);
 for(let i=0;i<2;i++)put(b,handbagG(i),w*.1+i*.38,top,z+.1-i*.12,(H(seed,i+5)-.5)*.5);
 put(b,basketG(0),w*.38,top,z-.1,H(seed,9)*3);
 // hanging bars along both tent sides (below the front sign) with S-hooks + totes / handbags by their handles
 const yb=1.92;for(const sx of[-1,1]){const xb=sx*(w/2-.1);put(b,tpl('sbarZ',()=>merge([[cylT(.012,6,CHROME()),MX(0,0,0,PI/2,0,0,[1,1.6,1])]])),xb,yb,z-.55);
  for(let i=0;i<3;i++){const zz=z-1.15+i*.5,k=i+(sx>0?3:0);put(b,shook(),xb,yb-.02,zz,PI/2);
   if(k%2)put(b,toteG((seed+k)%4),xb,yb-.47,zz,PI/2+(H(seed,k+20)-.5)*.2,0,(H(seed,k+21)-.5)*.06);
   else put(b,handbagG(k>>1&1),xb,yb-.33,zz,PI/2+(H(seed,k+30)-.5)*.3);}}
 put(b,basketG(1),w*.3,0,z-1.0);put(b,basketG(1),w*.3-.45,0,z-1.05,1.3);
 for(let i=0;i<3;i++)put(b,toteG((seed+i+2)%4),w*.3+(i-1)*.05,.5,z-1.0+(i-1)*.04,(i-1)*.25,-.3+(i-1)*.1);}

// ---------------- garments ----------------
// outline (x right, y down from the shoulder line at y=0), extruded thin, gentle drape displacement
const OUT={shirt:[[-.08,0],[-.2,.03],[-.32,.24],[-.27,.28],[-.19,.16],[-.19,.62],[.19,.62],[.19,.16],[.27,.28],[.32,.24],[.2,.03],[.08,0],[0,.05]],
 dress:[[-.07,0],[-.16,.02],[-.17,.2],[-.13,.34],[-.27,.98],[.27,.98],[.13,.34],[.17,.2],[.16,.02],[.07,0],[0,.06]],
 sweater:[[-.09,0],[-.22,.04],[-.3,.58],[-.24,.6],[-.2,.22],[-.21,.6],[.21,.6],[.2,.22],[.24,.6],[.3,.58],[.22,.04],[.09,0],[0,.04]]};
function garmentG(kind,fab){return tpl('gm'+kind+fab,()=>{const pts=OUT[kind],s=new T.Shape();s.moveTo(pts[0][0],-pts[0][1]);for(const[x,y]of pts.slice(1))s.lineTo(x,-y);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:1,curveSegments:1});g.translate(0,0,-.0175);
 // drape: thin out toward the hem edge, wave the hem
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=-p.getY(i),x=p.getX(i);p.setZ(i,p.getZ(i)*(1-y*.5)+Math.sin(x*28+y*3)*.012*y);}
 g.computeVertexNormals();
 const r=fab==='tees'?Q('tees',0):fab.startsWith('tees')?Q('tees',+fab[4]):R(fab);fit(g,sub(r,.04,.04,.96,.96),'xy');return g;});}
const hangerG=k=>tpl('hg'+k,()=>{const shoulder=remap(new T.CylinderGeometry(.008,.008,.38,5),k?HWOOD():HPLAS());
 return merge([[shoulder,MX(0,-.02,0,0,0,PI/2)],[remap(new T.TorusGeometry(.025,.003,3,8,PI*1.3),WIRE()),MX(0,.028,0,0,0,-.2)],[cylT(.003,3,WIRE()),MX(0,.0,0,0,0,0,[1,.03,1])]]);});
const FABS=['denim','flannel','floral','knit','tees1','tees2','tees3','tees0','scarf'];
function rack(b,x0,x1,z,seed){const yb=1.62;rackFrame(b,x0,x1,z);
 const n=Math.max(5,Math.floor((x1-x0)/.09));for(let i=0;i<n;i++){const x=x0+.08+i*(x1-x0-.16)/(n-1),k=FABS[(seed+i*5)%FABS.length],kind=k==='floral'?'dress':k==='knit'?'sweater':'shirt';
  const ry=PI/2+(H(seed,i)-.5)*.35,face=i===0||i===n-1;put(b,hangerG(i%3===0?1:0),x,yb-.03,z,face?0:ry);put(b,garmentG(kind,k),x,yb-.06,z,face?0:ry,0,(H(seed,i+50)-.5)*.04);}}

// folded garment: box with a rolled front fold edge and a sagging top, fabric cell on every face
function foldG(fab,w=.3,d=.24,h=.04){return tpl('fd'+fab+w+d,()=>{const g=new T.BoxGeometry(w,h,d,6,2,4),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i)/w*2,y=p.getY(i)/h*2,z=p.getZ(i)/d*2;let yy=p.getY(i);
  if(y>0)yy-=.006*(1-x*x)*(1-z*z)+.004*Math.sin(x*6+z*4);if(z>.5){const t=(z-.5)*2;yy*=1-.25*t;p.setX(i,p.getX(i)*(1-.03*t));}p.setY(i,yy);
  if(Math.abs(x)>.9)p.setZ(i,p.getZ(i)*.97);}
 g.computeVertexNormals();const r=fab.startsWith('tees')?sub(Q('tees',+fab[4]),.1,.1,.9,.5):R(fab);return remap(g,sub(r,0,0,.6,.6));});}
function stack(b,x,y,z,seed,n,fab,ry=0){for(let j=0;j<n;j++){const f=fab||FABS[(seed+j*3)%8];put(b,foldG(f),x+(H(seed,j)-.5)*.02,y+.02+j*.042,z+(H(seed,j+7)-.5)*.02,ry+(H(seed,j+3)-.5)*.12);}}
function racks(b,w,z,top,seed){for(let i=0;i<4;i++)stack(b,-w*.36+i*w*.24,top,z+.02,seed+i*11,2+((seed+i)%3),i%2?'tees'+((seed+i)%4):'');
 rack(b,-w/2+.2,w/2-.2,z-.9,seed);}
// scarf: long strip folded over a bar (bar axis = x at y 0): front tail hangs at +z, the shorter back tail at -z
function scarfG(k){return tpl('sf'+k,()=>{const L=1.0,W=.22,r=.012,g=new T.PlaneGeometry(W,L,1,18),p=g.attributes.position,off=.08+k*.04;
 for(let i=0;i<p.count;i++){const s=(p.getY(i)/L)*L+off,x=p.getX(i);let y,z;
  if(Math.abs(s)<r*PI/2){const a=s/r;y=r*Math.cos(a);z=r*Math.sin(a);}else{const h=Math.abs(s)-r*PI/2;y=-h;z=Math.sign(s)*(r+h*.04);}
  p.setXYZ(i,x+Math.sin(y*9+k)*.012*(-y),y,z+Math.sin(x*30+y*7)*.004);}
 g.computeVertexNormals();return remap(g,sub(R('scarf'),k*.25,0,k*.25+.5,1));});}
function piles(b,w,z,top,seed){const n=Math.max(4,Math.floor(w/.42));
 for(let i=0;i<n;i++)stack(b,-w/2+.35+i*(w-.7)/(n-1),top,z-.05+(H(seed,i)-.5)*.12,seed+i*13,2+((seed*7+i)%4),'',(H(seed,i+3)-.5)*.2);
 // front bar of scarves (on two short posts clamped to the table front)
 const yb=1.12,zb=z+.4;put(b,tpl('sbar'+w,()=>merge([[cylT(.01,6,CHROME()),MX(0,yb,0,0,0,PI/2,[1,w*.8,1])],[cylT(.012,6,CHROME()),MX(-w*.4,yb-.18,0,0,0,0,[1,.36,1])],[cylT(.012,6,CHROME()),MX(w*.4,yb-.18,0,0,0,0,[1,.36,1])]])),0,0,zb);
 for(let i=0;i<6;i++)put(b,scarfG(i%3),-w*.33+i*w*.13,yb,zb,(H(seed,i)-.5)*.15);
 for(let i=0;i<2;i++)put(b,basketG(1),-w*.25+i*.5,0,z-1.0,i);}

// ---------------- chairs (vintage) ----------------
const chairG=()=>tpl('chair',()=>{const P=[],wal=R('walnut'),dk=sub(R('walnut'),0,0,.3,1),sy=.45;
 P.push([fit(new T.CylinderGeometry(.2,.2,.03,14),wal,'xz'),MX(0,sy,0)]);
 const legs=[[-.15,-.15],[.15,-.15],[.15,.15],[-.15,.15]];for(const[x,z]of legs)P.push([cylT(.013,5,dk),rodM([x*1.25,0,z*1.25],[x*.85,sy,z*.85])]);
 P.push([remap(new T.TorusGeometry(.17,.009,4,14),dk),MX(0,.17,0,PI/2,0,0)]);
 for(const s of[-1,1])P.push([cylT(.014,5,dk),rodM([s*.14,sy-.02,-.14],[s*.15,.88,-.2])]);
 P.push([remap(new T.TorusGeometry(.15,.013,4,12,PI),dk),MX(0,.88,-.2,-.12,0,0)]);P.push([remap(new T.TorusGeometry(.1,.009,4,10,PI),dk),MX(0,.72,-.18,-.12,0,0)]);
 return merge(P);});
const jarG=k=>tpl('jar'+k,()=>merge([[lathe([[0,0],[.04,0],[.045,.01],[.045,.09],[.035,.105],[0,.105]],10,sub(R('jars'),0,1-(k+1)/4,1,1-k/4)),null],[lathe([[0,.104],[.037,.104],[.037,.122],[0,.124]],10,sub(R('glass'),.5,0,1,1)),null]]));
const candleG=()=>tpl('cdl',()=>merge([[lathe([[0,0],[.04,0],[.042,.08],[.036,.082],[0,.07]],10,sub(R('glass'),0,0,.5,1)),null],[cylT(.002,3,WIRE()),MX(0,.077,0,0,0,0,[1,.014,1])]]));
function chairs(b,w,z,top,seed){for(const s of[-1,1])put(b,chairG(),s*.6,0,z-1.0,s*.4+(H(seed,s+3)-.5)*.3);
 for(let i=0;i<6;i++)put(b,jarG((seed+i)%4),-w*.36+(i%3)*.12,top,z+.12-(i>>1&1)*0-(i>2?.14:0),H(seed,i)*6);
 for(let i=0;i<4;i++)put(b,candleG(),w*.05+(i%2)*.11,top,z+.1-(i>>1)*.12,H(seed,i+9)*6);
 put(b,basketG(0),w*.34,top,z,.4);for(let i=0;i<3;i++)put(b,jarG(i),w*.34+(i-1)*.08,top+.02,z+(i%2)*.05);}

// ---------------- sign-matched stalls (V135 sign atlas: Popsy's Kettle Corn, Sunglasses $5, Big Al's Tube Socks,
// Bazar Anatolia hats/scarves/pashmina, Henna by Priya) ----------------
// kettle corn: steel kettle on a ring stand over a burner, popcorn heap + wooden paddle, sifting tray, clear bags of corn
const popBagG=s=>tpl('pb'+s,()=>{const w=.2*s,h=.36*s,d=.1*s,g=new T.BoxGeometry(w,h,d,3,5,2),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i)/w*2,y=p.getY(i)/h+.5,z=p.getZ(i)/d*2;const pinch=y>.85?1-(y-.85)/.15*.8:1;p.setX(i,p.getX(i)*(pinch*.9+.1)*(1+.08*(1-z*z)));p.setZ(i,p.getZ(i)*pinch*(1+.15*(1-x*x)));}
 g.computeVertexNormals();remap(g,R('popbag'));const tie=remap(new T.CylinderGeometry(.012*s,.012*s,.025*s,6),sub(R('popbag'),0,.92,1,1));
 return merge([[g,MX(0,h/2,0)],[tie,MX(0,h*.94,0)]]);});
function kettle(b,w,z,top,seed){const kx=-w*.22,kz=z-1.0,ky=.62;
 const k=tpl('ket',()=>{const P=[],ky=.52;const bowl=lathe([[0,-.36],[.2,-.34],[.36,-.22],[.44,0],[.46,.02],[.44,.035],[.41,0],[.33,-.2],[.18,-.31],[0,-.33]],18,R('kettle'));P.push([bowl,MX(0,ky+.36,0)]);
  for(let i=0;i<3;i++){const a=i/3*2*PI;P.push([cylT(.018,5,WIRE()),rodM([Math.cos(a)*.48,0,Math.sin(a)*.48],[Math.cos(a)*.4,ky+.3,Math.sin(a)*.4])]);}
  P.push([remap(new T.TorusGeometry(.41,.014,4,18),WIRE()),MX(0,ky+.3,0,PI/2,0,0)]);P.push([remap(new T.TorusGeometry(.45,.01,4,18),WIRE()),MX(0,.15,0,PI/2,0,0)]);
  P.push([lathe([[0,ky-.1],[.16,ky-.1],[.17,ky-.04],[0,ky-.04]],12,WIRE()),null]);P.push([cylT(.02,5,WIRE()),rodM([0,.15,.0],[0,ky-.1,0])]);   // burner on its post
  P.push([planarCap(.36,.08,R('popcorn')),MX(0,ky+.33,0)]);
  P.push([remap(new T.BoxGeometry(.09,.014,.36),WOODP()),MX(.12,ky+.4,.06,.0,.4,.5)]);P.push([cylT(.014,5,WOODP()),rodM([.2,ky+.45,.15],[.6,ky+1.0,.5])]);
  return merge(P);});put(b,k,kx,0,kz,H(seed,1)*6);
 // tank feeding the burner
 put(b,tpl('tank',()=>lathe([[0,0],[.13,0],[.15,.04],[.15,.4],[.12,.47],[.05,.5],[.04,.56],[0,.56]],12,sub(R('kettle'),.6,.6,1,1))),kx-.55,0,kz-.15);
 // sifting tray on the table + bags
 put(b,tpl('tray',()=>merge([[box(.62,.012,.4,R('kettle')),MX(0,.006,0)],...[-1,1].map(s=>[box(.62,.08,.012,R('kettle')),MX(0,.04,s*.2)]),...[-1,1].map(s=>[box(.012,.08,.4,R('kettle')),MX(s*.31,.04,0)]),[planarCap(.29,.05,R('popcorn'),.62/.58,.4/.58),MX(0,.012,0)]])),-w*.25,top,z);
 for(let i=0;i<7;i++)put(b,popBagG(i<4?1:1.4),w*.02+(i%4)*.17+(i>3?.08:0),top,z+(i>3?-.15:.12),(H(seed,i)-.5)*.4);
 const yb=1.92;for(const sx of[-1,1]){const xb=sx*(w/2-.1);put(b,tpl('sbarZ',()=>merge([[cylT(.012,6,CHROME()),MX(0,0,0,PI/2,0,0,[1,1.6,1])]])),xb,yb,z-.55);
  for(let i=0;i<4;i++){const zz=z-1.2+i*.38;put(b,shook(),xb,yb-.02,zz,PI/2);put(b,popBagG(1.4),xb,yb-.57,zz,PI/2+(H(seed,i+sx)-.5)*.3);}}}
const WOODP=()=>sub(R('walnut'),.6,0,1,1);
// shallow dome (heap) of radius r, height h, planar-mapped from the top
function planarCap(r,h,rect,sx=1,sz=1){const g=new T.SphereGeometry(r,14,5,0,2*PI,0,PI/2);g.scale(sx,h/r,sz);const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)*(1+.15*Math.sin(p.getX(i)*40)*Math.cos(p.getZ(i)*37)));g.computeVertexNormals();return fit(g,rect,'xz');}

// sunglasses: lens pair (oval discs), bridge, folded / open temples; frame & lens styles from the 'shades' cell
const SHADE=['blk','tort'];
const shadesG=(k,open)=>tpl('sh'+k+open,()=>{const fr=Q('shades',k%2),ln=sub(Q('shades',2+(k>>1&1)),.1,.1,.9,.9),P=[];
 for(const s of[-1,1]){const lens=fit(new T.CircleGeometry(.026,10),ln,'xy');lens.scale(1.15,1,1);P.push([lens,MX(s*.034,0,.002)]);
  P.push([remap(new T.TorusGeometry(.027,.003,3,12),fr),MX(s*.034,0,0,0,0,0,[1.15,1,1])]);
  P.push([box(.004,.004,.13,fr),open?MX(s*.066,.01,-.065):MX(s*.02,.006,-.012,0,s*1.45,0)]);}
 P.push([box(.016,.004,.004,fr),MX(0,.012,0)]);return merge(P);});
function shades(b,w,z,top,seed){
 // black velvet display board on the table, rows of glasses lying open toward the walking strip
 put(b,tpl('felt'+w,()=>box(w-.6,.015,.6,Q('shades',0))),0,top+.008,z);
 for(let r=0;r<3;r++)for(let i=0;i<9;i++)put(b,shadesG((seed+i+r*3)%4,1),-w/2+.45+i*(w-.9)/8,top+.03,z+.2-r*.19,0,-1.2,0);
 // two spinner towers behind the table: pole + 4 faces x 5 tiers of hook rods, glasses hung folded
 for(const sx of[-1,1]){const tx=sx*w*.28,tz=z-.95;put(b,tpl('spin',()=>merge([[cylT(.018,6,CHROME()),MX(0,.85,0,0,0,0,[1,1.7,1])],[lathe([[0,0],[.25,0],[.25,.03],[0,.04]],12,WIRE()),null],
  [remap(new T.BoxGeometry(.06,.25,.06),Q('shades',0)),MX(0,1.75,0)]])),tx,0,tz);
  for(let f=0;f<4;f++)for(let t=0;t<5;t++){const a=f*PI/2+(H(seed,sx)*.6),y=.7+t*.22,rx=Math.sin(a)*.13,rz=Math.cos(a)*.13;put(b,shadesG((seed+f+t)%4,0),tx+rx,y,tz+rz,a);}}
 // a little standing mirror
 put(b,tpl('mir',()=>merge([[box(.22,.3,.015,Q('shades',3)),MX(0,.16,0)],[box(.24,.32,.01,Q('shades',1)),MX(0,.16,-.012)],[box(.03,.012,.12,Q('shades',1)),MX(0,.006,-.05)]])),w/2-.42,top,z-.15,-.4,-.15);}

// tube socks: banded 3-pair bundles in crates/heaps, folded tees, pairs hung over a front bar
const sockBundleG=k=>tpl('sb'+k,()=>{const row=sub(R('socks'),0,1-(k+1)/4,.74,1-k/4),band=sub(R('socks'),.76,1-(k+1)/4,1,1-k/4);
 const g=new T.BoxGeometry(.42,.06,.11,6,1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i)/.055,y=p.getY(i)/.03;p.setY(i,p.getY(i)*(1-.35*z*z));p.setZ(i,p.getZ(i)*(1-.2*y*y));}
 g.computeVertexNormals();remap(g,row);return merge([[g],[remap(new T.BoxGeometry(.08,.068,.122),band),MX(.03,0,0)]]);});
const sockHangG=k=>tpl('sh2'+k,()=>{const L=.9,W=.09,r=.01,g=new T.PlaneGeometry(W,L,1,14),p=g.attributes.position,off=.06;
 for(let i=0;i<p.count;i++){const s=p.getY(i)+off,x=p.getX(i);let y,zz;if(Math.abs(s)<r*PI/2){const a=s/r;y=r*Math.cos(a);zz=r*Math.sin(a);}else{y=-(Math.abs(s)-r*PI/2);zz=Math.sign(s)*r;}
  const foot=-y>.36?(-y-.36)*1.1:0;p.setXYZ(i,x,y+foot*.4,zz+Math.sign(s)*foot*.5);}
 g.computeVertexNormals();const u=g.attributes.uv;for(let i=0;i<u.count;i++){const a=u.getX(i),c=u.getY(i);u.setXY(i,1-c,a);}return remap(g,sub(R('socks'),0,1-(k+1)/4,.74,1-k/4));});
function socks(b,w,z,top,seed){
 for(let i=0;i<4;i++)for(let j=0;j<3+(i+seed)%3;j++)put(b,sockBundleG((i+j+seed)%4),-w*.38+i*.26,top+.03+j*.055,z-.08+(H(seed,i*7+j)-.5)*.04,PI/2+(H(seed,i+j*5)-.5)*.25);
 for(let i=0;i<2;i++)stack(b,w*.22+i*.36,top,z,seed+i*11,3+i,'tees'+((seed+i)%4));
 const yb=1.12,zb=z+.4;put(b,tpl('sbar'+w,()=>merge([[cylT(.01,6,CHROME()),MX(0,yb,0,0,0,PI/2,[1,w*.8,1])],[cylT(.012,6,CHROME()),MX(-w*.4,yb-.18,0,0,0,0,[1,.36,1])],[cylT(.012,6,CHROME()),MX(w*.4,yb-.18,0,0,0,0,[1,.36,1])]])),0,0,zb);
 for(let i=0;i<14;i++)put(b,sockHangG((seed+i)%4),-w*.38+i*w*.058,yb,zb,(H(seed,i)-.5)*.2);
 for(let i=0;i<2;i++)put(b,basketG(1),-w*.25+i*.5,0,z-1.0,i);for(let i=0;i<6;i++)put(b,sockBundleG(i%4),-w*.25+(i%2?.5:0)+(H(seed,i)-.5)*.1,.56,z-1.0+(H(seed,i+3)-.5)*.1,H(seed,i)*3,(H(seed,i+5)-.5)*.6);}

// hats / scarves / pashmina: rail of pashminas folded over hangers, scarves on the table, straw fedoras + knit beanies, bags on the side bar
const fedoraG=()=>tpl('fed',()=>merge([[lathe([[0,.13],[.07,.125],[.09,.1],[.095,.05],[.1,.012],[.19,.0],[.2,.008],[.1,.024],[0,.03]],14,R('straw')),null],[remap(new T.CylinderGeometry(.097,.1,.03,14,1,true),Q('pashmina',3)),MX(0,.03,0)]]));
const beanieG=k=>tpl('bn'+k,()=>{const g=new T.SphereGeometry(.1,12,6,0,2*PI,0,PI/2);g.scale(1,1.15,1);remap(g,R('knit'));const cuff=remap(new T.CylinderGeometry(.104,.104,.05,12,1,true),sub(Q('pashmina',k),0,0,1,.4));return merge([[g],[cuff,MX(0,.0,0)]]);});
const shawlG=k=>tpl('sw'+k,()=>{const L=1.3,W=.34,r=.01,g=new T.PlaneGeometry(W,L,2,16),p=g.attributes.position,off=.05;
 for(let i=0;i<p.count;i++){const s=p.getY(i)+off,x=p.getX(i);let y,zz;if(Math.abs(s)<r*PI/2){const a=s/r;y=r*Math.cos(a);zz=r*Math.sin(a);}else{const h=Math.abs(s)-r*PI/2;y=-h;zz=Math.sign(s)*(r+h*.05);}
  p.setXYZ(i,x*(1-.25*Math.max(0,1+y*3)),y,zz+Math.sin(x*25-y*6)*.01);}
 g.computeVertexNormals();return remap(g,k<4?sub(Q('pashmina',k),.05,0,.95,1):k===4?sub(R('scarf'),.2,0,.8,1):sub(R('floral'),.1,0,.9,1));});
function scarves(b,w,z,top,seed){
 for(let i=0;i<3;i++)put(b,fedoraG(),-w*.36+i*.22,top,z+.1-(i%2)*.14,H(seed,i)*6,(H(seed,i+4)-.5)*.1);
 for(let i=0;i<3;i++)put(b,beanieG((seed+i)%4),w*.12+i*.2,top,z+.12,H(seed,i+9)*6);
 for(let i=0;i<3;i++)put(b,foldG(i===1?'scarf':'floral',.3,.24,.03),w*.12+i*.2,top+.02,z-.14,(H(seed,i+12)-.5)*.3);
 put(b,basketG(0),w*.4,top,z-.12);
 // rail of pashminas (on the rack frame)
 const x0=-w/2+.2,x1=w/2-.2,zr=z-.9,yb=1.62; rackFrame(b,x0,x1,zr);const n=11;for(let i=0;i<n;i++){const x=x0+.1+i*(x1-x0-.2)/(n-1);put(b,hangerG(1),x,yb-.03,zr,PI/2);put(b,shawlG((seed+i*3)%6),x,yb-.05,zr,PI/2+(H(seed,i)-.5)*.2);}
 const ys=1.92;for(const sx of[-1,1]){const xb=sx*(w/2-.1);put(b,tpl('sbarZ',()=>merge([[cylT(.012,6,CHROME()),MX(0,0,0,PI/2,0,0,[1,1.6,1])]])),xb,ys,z-.55);
  for(let i=0;i<3;i++){const zz=z-1.15+i*.5;put(b,shook(),xb,ys-.02,zz,PI/2);if(i%2)put(b,basketG(0),xb,ys-.3,zz,PI/2,PI/2*.9);else put(b,handbagG(i>>1&1),xb,ys-.33,zz,PI/2+(H(seed,i+30)-.5)*.3);}}}

// henna: artist + client chairs, design binder open on the table, henna cones, paste jars, chalk price easel
const coneG=()=>tpl('hcone',()=>merge([[lathe([[0,0],[.006,0],[.022,.11],[.02,.13],[.008,.14],[0,.15]],8,sub(R('jars'),0,.75,.5,1)),null]]));
const binderG=()=>tpl('bind',()=>{const pg=box(.56,.012,.36,sub(R('henna'),.02,.02,.98,.98));const cov=box(.6,.008,.4,Q('pashmina',0));
 return merge([[cov,MX(0,.004,0)],[pg,MX(0,.014,0)],[remap(new T.CylinderGeometry(.012,.012,.3,6),CHROME()),MX(0,.02,0,PI/2,0,0)]]);});
function henna(b,w,z,top,seed){
 put(b,chairG(),-w*.15,0,z-.75,PI+.2);put(b,chairG(),w/2-.35,0,z+.05,-PI/2+.3);
 put(b,binderG(),w*.1,top,z+.05,(H(seed,1)-.5)*.2);
 for(let i=0;i<6;i++)put(b,coneG(),-w*.38+i*.04,top,z+.1,H(seed,i)*6,PI/2,0);
 for(let i=0;i<4;i++)put(b,jarG(i),-w*.32+(i%2)*.1,top,z-.12+(i>>1)*.0-(i>1?.12:0),H(seed,i)*6);
 for(let i=0;i<2;i++)put(b,candleG(),-w*.1+i*.1,top,z-.16,H(seed,i+9)*6);
 // chalk easel on the street side
 put(b,tpl('easel',()=>merge([[box(.5,.5,.02,R('board')),MX(0,.95,0,-.08,0,0)],...[-1,1].map(s=>[cylT(.014,5,WOODP()),rodM([s*.26,0,.1],[s*.2,1.22,-.02])]),[cylT(.014,5,WOODP()),rodM([0,0,-.4],[0,1.15,-.05])],[box(.5,.03,.05,WOODP()),MX(0,.69,.03)]])),-w/2+.45,0,z+.75,.35);}
function rackFrame(b,x0,x1,z){const yb=1.62;put(b,tpl('rk'+(x1-x0).toFixed(2),()=>{const L=x1-x0,P=[];P.push([cylT(.014,6,CHROME()),MX(0,yb,0,0,0,PI/2,[1,L,1])]);
  for(const s of[-1,1]){P.push([cylT(.014,6,CHROME()),MX(s*L/2,yb/2,0,0,0,0,[1,yb,1])]);P.push([cylT(.012,6,CHROME()),MX(s*L/2,.06,0,PI/2,0,0,[1,.5,1])]);
   for(const zz of[-.24,.24])P.push([remap(new T.SphereGeometry(.025,6,4),WIRE()),MX(s*L/2,.025,zz)]);}
  return merge(P);}),(x0+x1)/2,0,z);}

const MERCH={bags,racks,piles,chairs,kettle,shades,socks,scarves,henna};
export const isMerch141=k=>k in MERCH;
export function goodsMerch141(b,kind,w,z,seed,top=.78){addMerch141Materials(b.mats);MERCH[kind](b,w,z,top,seed);}

// ---------------- stall dressing ----------------
const sandbagG=()=>tpl('sbag',()=>lathe([[.034,0],[.1,0],[.13,.03],[.135,.07],[.12,.11],[.08,.13],[.034,.13],[.034,0]],10,R('sandbag')));
/** ring sandbag round each leg foot (legs at the tent corners) */
export function sandbags141(b,w,d,seed){addMerch141Materials(b.mats);for(const[k,[x,z]]of[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].entries())put(b,sandbagG(),x,0,z,H(seed,k)*6,0,(H(seed,k+4)-.5)*.06);}
const bulbG=()=>tpl('bulb',()=>merge([[lathe([[0,-.05],[.014,-.048],[.024,-.03],[.022,-.012],[.012,0],[0,0]],8,R('bulb')),null],[cylT(.009,6,sub(R('bulb'),0,.8,1,1)),MX(0,.008,0,0,0,0,[1,.02,1])]]));
/** catenary string of bulbs from (x0,y,z) to (x1,y,z), tied at `ties` points, sag per span */
export function lights141(b,x0,x1,y,z,seed,ties=3,sag=.12){addMerch141Materials(b.mats);const spans=ties-1,P=[];
 for(let s=0;s<spans;s++){const a=x0+(x1-x0)*s/spans,c=x0+(x1-x0)*(s+1)/spans,n=8,yy=t=>y-sag*4*t*(1-t);
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;P.push([cylT(.003,3,WIRE()),rodM([a+(c-a)*t0,yy(t0),z],[a+(c-a)*t1,yy(t1),z])]);}
  for(let i=1;i<4;i++){const t=i/4;P.push([bulbG(),MX(a+(c-a)*t,yy(t)-.008,z)]);}}
 const g=merge(P);b.add(g,M,0,0,0);g.dispose();}
