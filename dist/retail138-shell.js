// V138-retail-interiors R1: walk-in store shell inside a procedural L11 streetwall building (urban-streetwall.js).
// The store takes k whole facade bays of the ground floor and sd metres of depth. The building's ground storey is rebuilt
// around that cavity (left / right / back masses + a plenum slab whose underside is the ceiling), so the outside reads the
// same; the store front is a real aluminium storefront with see-through glass and a door opening, a fascia sign (fictional
// names, assets/l11-v138/signs.webp) and, for the bodega, a roll-shutter box + awning. Inside: own floor / wall / drop
// ceiling finishes, cove base, fluorescent troffers (market) or bare tube strips (bodega), staff door. Colliders keep the
// player in the cavity; a walk rectangle gives its floor. Fixtures (shelves, coolers, counters) come in R2–R4.
// Textures: bc/tools/retail138_assets.py (art-v138retail generated large → PS1 crush). lod 1 = shell + front only.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {retail138LayoutFill} from './retail138-grid.js?v=138f';
import {retail138BakeMark,retail138BakeDefaults,retail138Bake,r138GridPlane} from './retail138-bake.js?v=138g'; // R5 per-store light bake // R4 Layout A/B grid generator over the R2/R3 module libraries
const A=new URL('./assets/l11-v138/',import.meta.url).href,V='138a',PI=Math.PI;
function tex(name,srgb=true,rep=true){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
// interior finishes glow a little from their own albedo: the cavity sits in the sun's shadow and has no real lamps until the R5 bake
function finish(name,glow,rough=.9){const m=tex(name);return new T.MeshStandardMaterial({map:m,normalMap:tex(name+'_n',false),normalScale:new T.Vector2(.7,.7),emissive:0xffffff,emissiveMap:m,emissiveIntensity:glow,roughness:rough,vertexColors:true});}
export const SIGN138_COUNT=8; // atlas cells: 0–3 market, 4–7 bodega
export function addRetail138Materials(m){
 if(m.r138floorM)return m;
 m.r138floorM=finish('floor_m',.16,.55);m.r138floorB=finish('floor_b',.14,.6);m.r138ceil=finish('ceil',.26);
 m.r138wallM=finish('wall_m',.17,.7);m.r138wallB=finish('wall_b',.16,.8);
 Object.assign(URBAN_TILE_SIZE,{r138floorM:1.83,r138floorB:1.2,r138ceil:2.44,r138wallM:2.4,r138wallB:2.4});
 const s=tex('signs',true,false);s.wrapS=s.wrapT=T.ClampToEdgeWrapping;
 m.r138sign=new T.MeshStandardMaterial({map:s,emissive:0xffffff,emissiveMap:s,emissiveIntensity:.55,roughness:.6,vertexColors:true});
 m.r138glass=new T.MeshStandardMaterial({color:0x9db7b2,roughness:.08,metalness:.35,transparent:true,opacity:.2,depthWrite:false,vertexColors:true});
 m.r138alu=new T.MeshStandardMaterial({color:0xa7aaa6,roughness:.42,metalness:.55,vertexColors:true});
 m.r138dark=new T.MeshStandardMaterial({color:0x2a2b2c,roughness:.8,vertexColors:true});
 m.r138lamp=new T.MeshStandardMaterial({color:0xf4f6ee,emissive:0xf1f4e6,emissiveIntensity:1.05,roughness:.5,vertexColors:true});
 // R5c: dead troffers (no emission, baked like any surface) + one flickering tube bank per few markets
 m.r138lampOff=new T.MeshStandardMaterial({color:0xb4b7b0,roughness:.55,vertexColors:true});
 m.r138lampFlk=new T.MeshStandardMaterial({color:0xf4f6ee,emissive:0xe9f0e4,emissiveIntensity:.9,roughness:.5,vertexColors:true});
 {const f=m.r138lampFlk;let t=0;setInterval(()=>{t++;const q=Math.sin(t*.37)*Math.sin(t*.13+1.7);f.emissiveIntensity=q>.82?.12:q>.55&&(t&1)?.35:.9;},70);}
 m.r138door=new T.MeshStandardMaterial({color:0x6d7470,roughness:.62,metalness:.25,vertexColors:true});
 m.r138awnR=new T.MeshStandardMaterial({color:0x9b2420,roughness:.9,side:T.DoubleSide,vertexColors:true});
 m.r138awnG=new T.MeshStandardMaterial({color:0x1f5a3a,roughness:.9,side:T.DoubleSide,vertexColors:true});
 return m;
}
/** Store span on the facade grid. w = lot width, d = depth, bay/bays = the building's own bay grid. */
export function retail138Plan(spec,w,d,bay,bays){
 const R=spec.retail138,h=R.h>>>0,market=R.kind==='m';
 const want=market?Math.min(w-.8,12+(h>>>4)%5):Math.min(w-.8,6.2+((h>>>4)%4)*.9);
 const k=Math.max(1,Math.min(bays,Math.round(want/bay))),i0=bays>k?((h>>>12)%(bays-k+1)):0;
 const x0=Math.max(-w/2+.3,-w/2+i0*bay),x1=Math.min(w/2-.3,-w/2+(i0+k)*bay);
 const sd=market?Math.min(d-3,13+(h>>>7)%5):Math.min(d-4,9+(h>>>7)%4),C=market?3.5:3.15;
 const doorW=market?1.9:1.05,dx=market?((h>>>15)%3-1)*(x1-x0)*.25:(((h>>>15)%2)?1:-1)*((x1-x0)/2-1.1);
 return{kind:R.kind,market,h,i0,i1:i0+k,x0,x1,sd,C,doorX:(x0+x1)/2+dx,doorW,sign:(market?0:4)+(h>>>18)%4};
}
// inward-facing interior quad helpers (PlaneGeometry faces +z)
function wallX(b,key,x,z0,z1,y0,y1,face){r138GridPlane(b,key,URBAN_TILE_SIZE[key],x,(y0+y1)/2,(z0+z1)/2,z1-z0,y1-y0,face>0?PI/2:-PI/2,0,.45);}
function wallZ(b,key,z,x0,x1,y0,y1,face){r138GridPlane(b,key,URBAN_TILE_SIZE[key],(x0+x1)/2,(y0+y1)/2,z,x1-x0,y1-y0,face>0?0:PI,0,.45);}
/** Replaces the body box + solid of the streetwall building (non-arcade). wall = exterior material key. */
export function retail138Body(b,P,{w,d,h,ground,wall}){
 const zf=d/2,zb=zf-P.sd,{x0,x1}=P,cx=(x0+x1)/2,sw=x1-x0;
 if(h>ground+.01)b.box(wall,0,(h+ground)/2,0,w,h-ground,d);
 const L=x0+w/2,Rr=w/2-x1;
 b.box(wall,-w/2+L/2,ground/2,0,L,ground,d);b.solid(-w/2+L/2,0,L,d);
 b.box(wall,w/2-Rr/2,ground/2,0,Rr,ground,d);b.solid(w/2-Rr/2,0,Rr,d);
 b.box(wall,cx,ground/2,(zb-d/2)/2,sw,ground,zb+d/2);b.solid(cx,(zb-d/2)/2,sw,zb+d/2);
 b.box(wall,cx,(P.C+ground)/2,(zb+zf)/2,sw,ground-P.C,P.sd);
}
/** Storefront + interior finishes. Called after retail138Body, frame = building centre at sidewalk level, +z = street. */
export function* retail138Task(b,P,{w,d,ground,lod}){
 addRetail138Materials(b.mats);const mark=retail138BakeMark(b);
 const zf=d/2,zb=zf-P.sd,{x0,x1,C,market}=P,cx=(x0+x1)/2,sw=x1-x0,h=P.h;
 const FL=market?'r138floorM':'r138floorB',WL=market?'r138wallM':'r138wallB';
 // ---- interior finishes ----
 r138GridPlane(b,FL,URBAN_TILE_SIZE[FL],cx,.006,(zb+zf)/2,sw,P.sd,0,-PI/2,lod?99:.3);b.walk(cx,(zb+zf)/2,sw,P.sd,0);
 r138GridPlane(b,'r138ceil',URBAN_TILE_SIZE.r138ceil,cx,C-.006,(zb+zf)/2,sw,P.sd,0,PI/2,lod?99:.5);
 wallX(b,WL,x0+.006,zb,zf-.2,0,C,1);wallX(b,WL,x1-.006,zb,zf-.2,0,C,-1);wallZ(b,WL,zb+.006,x0,x1,0,C,1);
 for(const[x,f]of[[x0+.02,1],[x1-.02,-1]])b.box('r138dark',x,.05,(zb+zf)/2-.1,.03,.1,P.sd-.2);b.box('r138dark',cx,.05,zb+.02,sw,.1,.03);
 // staff door (back wall) + exit sign
 const sx=market?x1-1.6:x0+1.2;b.box('r138alu',sx,1.07,zb+.03,1.08,2.16,.06);b.box('r138door',sx,1.03,zb+.06,.92,2.04,.04);b.box('r138alu',sx+.36,1.0,zb+.1,.04,.04,.1);
 b.box('r138lamp',sx,2.4,zb+.07,.34,.14,.05,0,.9);
 yield;
 // ---- lights ----
 if(market){let n=0,flk=(h>>>9)%3===0?(h>>>13)%7:-1;for(let z=zb+1.6;z<zf-1.2;z+=2.44)for(let x=x0+1.6;x<x1-1.0;x+=3.0,n++){
   // R5c: ~1 in 4 troffers dead (hashed per fixture), at most one flickering → patchy ceiling instead of an even white grid
   let q=Math.imul(h^Math.imul(n+1,0x9e3779b1),0x85ebca6b)>>>0;q^=q>>>15;const off=q%100<24&&z<zf-3.2,lk=n===flk&&!off?'r138lampFlk':off?'r138lampOff':'r138lamp';
   b.box('r138alu',x,C-.012,z,.66,.02,1.26);b.box(lk,x,C-.024,z,.56,.012,1.16);}}
 else{for(let z=zb+1.3;z<zf-.9;z+=2.1){const x=cx+(((h>>>3)+Math.round(z))%2?.6:-.6);b.box('r138alu',x,C-.04,z,.12,.06,1.25);b.cylinder('r138lamp',x,C-.08,z,.024,.024,1.2,6,PI/2);}}
 yield;
 // ---- storefront (exterior face at z = zf) ----
 const dL=P.doorX-P.doorW/2,dR=P.doorX+P.doorW/2,gTop=market?2.85:2.6,kick=.42,zg=zf-.06;
 for(const[a,c]of[[x0,dL],[dR,x1]]){if(c-a<.05)continue;const m=(a+c)/2,ww=c-a;
  b.box('r138alu',m,kick/2,zg,ww,kick,.12);b.plane('r138glass',m,(kick+gTop)/2,zg,ww,gTop-kick);b.solid(m,zg,ww,.22);
  for(let x=a;x<=c+1e-3;x+=Math.max(1.2,ww/Math.max(1,Math.round(ww/2.2))))b.box('r138alu',Math.min(x,c),(gTop)/2,zg,.07,gTop,.13);}
 b.box('r138alu',cx,gTop+.04,zg,sw,.08,.14);for(const x of[dL,dR])b.box('r138alu',x,gTop/2,zg,.09,gTop,.15);
 // transom glazing up to the fascia, then the fascia band in the building's ground storey
 const fy0=gTop+.08,fy1=ground-.3;b.plane('r138glass',cx,(fy0+Math.min(fy1,C))/2,zg,sw,Math.min(fy1,C)-fy0);
 b.box('r138dark',cx,(Math.min(fy1,C)+ground)/2,zg+.02,sw,ground-Math.min(fy1,C),.1);
 // doors: market = sliding automatic leaves parked open behind the fixed glass; bodega = glass door swung inward
 if(market){for(const s of[-1,1]){const lx=P.doorX+s*(P.doorW*.75);b.box('r138alu',lx,1.1,zg-.12,P.doorW/2+.06,2.2,.05);b.plane('r138glass',lx,1.1,zg-.09,P.doorW/2-.04,2.08);}
  b.box('r138dark',P.doorX,gTop-.12,zg-.12,P.doorW*1.6,.2,.16);}
 else{b.push(dR-.05,0,zg-.05,-1.25);b.box('r138alu',-P.doorW/2,1.08,0,P.doorW,2.16,.05);b.plane('r138glass',-P.doorW/2,1.1,.03,P.doorW-.12,1.9);b.box('r138alu',-P.doorW+.12,1.05,.07,.03,.4,.05);b.pop();}
 // fascia sign over the storefront
 const fa=gTop+.14,fb=ground-.3-(market?0:.36),sh=Math.min(.9,fb-fa,(sw-.3)/5.33),sgw=sh*5.33,sy=(fa+fb)/2;
 {const g=new T.PlaneGeometry(sgw,sh),uv=g.attributes.uv,v0=1-(P.sign+1)/SIGN138_COUNT,v1=1-P.sign/SIGN138_COUNT;for(let i=0;i<uv.count;i++)uv.setY(i,v0+(v1-v0)*uv.getY(i)+(uv.getY(i)>.5?-.002:.002));
  b.box('r138dark',cx,sy,zf+.06,sgw+.12,sh+.12,.12);b.add(g,'r138sign',cx,sy,zf+.125);g.dispose();}
 yield;
 if(!market){
  // roll-shutter box above the sign + slats rolled up, and a short awning on some
  b.box('r138alu',cx,ground-.47,zf+.2,sw,.32,.32,0,.8);
  if(h%3!==0){const key=h%2?'r138awnR':'r138awnG',aw=sw-.2,g=new T.PlaneGeometry(aw,1.0),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=(p.getY(i)+.5);p.setXYZ(i,p.getX(i),-.45*t,t*1.0);}g.computeVertexNormals();b.add(g,key,cx,gTop+.32,zf+.12);g.dispose();
   for(const s of[-1,1])b.rod('r138alu',[cx+s*aw*.47,gTop+.32,zf+.12],[cx+s*aw*.47,gTop-.13,zf+1.1],.02);}
 }else{
  // cart corral stub + mat at the door
  b.box('r138dark',P.doorX,.008,zf-.9,P.doorW+.4,.012,1.2);
 }
 if(!lod){yield;
  if(!(typeof location!=='undefined'&&/[?&]r138fill=0/.test(location.search)))yield* retail138LayoutFill(b,P,{d});}
 retail138BakeDefaults(b,mark,P,{d});
 if(!lod){yield;yield* retail138Bake(b,mark,P,{d});}
}
