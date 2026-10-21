// V135-capital ③ SoHo street builder (layout: soho135-layout.js). Each lot = one cast-iron building: brick body (the block's
// party walls / back), its own generated front elevation (atlas cell), a projecting cornice cut from the top strip of that same
// elevation, a flat roof with parapet + wooden water tank on some, and a real-geometry black iron fire escape (platforms,
// railings, stair flights, drop ladder) on most. Built inside the procedural block's UrbanBatch (merged per material), so the
// SoHo frontage streams, LODs and unloads with its block. lod 1 = body + facade + cornice only.
import * as T from './vendor/three.module.min.js';
import {SOHO135} from './soho135-layout.js?v=135v';
import {SOHO141,soho141On,soho141Build} from './soho141-facade.js?v=141d'; // V141 real-geometry facades
const A=new URL('./assets/l11-v135s/',import.meta.url).href;
function tex(name,srgb=true){const t=new T.TextureLoader().load(A+name+'.webp?v=135s');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;t.generateMipmaps=true;return t;}
export function addSoho135Materials(m){
 if(m.soho135a)return m;
 for(const s of'abcd')m['soho135'+s]=new T.MeshStandardMaterial({map:tex('facade_'+s),normalMap:tex('facade_'+s+'-n',false),normalScale:new T.Vector2(.8,.8),roughness:.84,vertexColors:true});
 // ③-3 corner side returns: one generated elevation per corner building (tools/soho135_side_assets.py -> side.webp, 8 cells)
 m.soho135side=new T.MeshStandardMaterial({map:tex('side'),normalMap:tex('side-n',false),normalScale:new T.Vector2(.8,.8),roughness:.86,vertexColors:true});
 m.soho135Iron=new T.MeshStandardMaterial({color:0x232527,roughness:.55,metalness:.35,vertexColors:true});
 m.soho135Tank=new T.MeshStandardMaterial({color:0x6f5b45,roughness:.92,vertexColors:true});
 m.soho135Roof=new T.MeshStandardMaterial({color:0x4a4846,roughness:.97,vertexColors:true});
 return m;
}
const unit=new T.BoxGeometry(1,1,1);
// atlas order of side.webp (lot = side key + facade index); the wrap-around bay is on the image's left = street edge
const SIDE135=['a3','a4','b0','b3','c4','c2','d1','d3'];
// which local x end of a lot is an exposed corner (-1/+1) or 0: first lot of the run (z0+12) is the block's south end, last (z0+100) north
function cornerSide(spec){const S=spec.soho135,a=spec.z-spec.w/2-Math.floor((spec.z)/112)*112,b=spec.z+spec.w/2-Math.floor((spec.z)/112)*112;
 const south=Math.abs(a-12)<.05,north=Math.abs(b-100)<.05;if(!south&&!north)return 0;return (south?-1:1)*(S.flip?-1:1);}
// quad in the batch's local frame with explicit uv rect; p = 4 corners (bl, br, tr, tl), normal n
function quad(b,key,p,uv,n,tone=1){const g=new T.BufferGeometry(),[u0,v0,u1,v1]=uv,ix=[0,1,2,0,2,3],U=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],pos=[],tx=[],nr=[];
 for(const i of ix){pos.push(...p[i]);tx.push(...U[i]);nr.push(...n);}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(tx,2));g.setAttribute('normal',new T.Float32BufferAttribute(nr,3));b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// box whose six faces all sample one uv rect (cornice cut from the facade's own top strip)
function uvBox(b,key,x,y,z,w,h,d,uv,toneUnder=.55){const g=unit.clone(),t=g.attributes.uv,[u0,v0,u1,v1]=uv;for(let i=0;i<t.count;i++)t.setXY(i,u0+(u1-u0)*t.getX(i),v0+(v1-v0)*t.getY(i));
 b.add(g,key,x,y,z,w,h,d,0,0,0,1);g.dispose();b.box('soho135Iron',x,y-h/2-.02,z,w-.04,.04,d-.04,0,toneUnder);}
function tilt(b,key,x,y,z,len,th,wd,rz){b.add(unit,key,x,y,z,len,th,wd,0,0,rz);}
// one fire-escape stack across bay x0..x1 in front of the facade (local z = zf), platforms at the given floor levels
function fireEscape(b,x0,x1,zf,levels){const K='soho135Iron',w=x1-x0,cx=(x0+x1)/2,dep=1.15,zc=zf+dep/2+.05;
 for(let k=0;k<levels.length;k++){const y=levels[k];
  b.box(K,cx,y,zc,w,.06,dep);                                                // grated platform
  for(const yy of[y+1.0,y+.5])b.box(K,cx,yy,zf+dep+.04,w,.045,.045);        // front rails
  for(const sx of[x0,x1])for(const yy of[y+1.0,y+.5])b.box(K,sx,yy,zc,.045,.045,dep); // end rails
  for(let x=x0;x<=x1+1e-3;x+=.62)b.box(K,x,y+.5,zf+dep+.04,.035,1.0,.035);  // balusters
  for(const sx of[x0+.15,x1-.15])b.add(unit,K,sx,y-.42,zf+.5,.06,.06,1.25,0,-.72,0); // diagonal brackets
  if(k<levels.length-1){const h=levels[k+1]-y,run=w*.62,len=Math.hypot(h,run),a=Math.atan2(h,run)*(k%2?-1:1),sx=k%2?x1-run/2-.1:x0+run/2+.1;
   tilt(b,K,sx,y+h/2,zf+dep-.4,len,.05,.62,a);                              // stair flight (alternating)
   tilt(b,K,sx,y+h/2+.85,zf+dep-.1,len,.04,.04,a);}                          // its handrail
 }
 // drop ladder from the lowest platform to 2.7 m above the sidewalk
 const y0=levels[0],lx=x1-.7,top=y0,bot=2.7;for(const sx of[lx-.22,lx+.22])b.box(K,sx,(top+bot)/2,zf+dep-.1,.05,top-bot,.05);
 for(let y=bot+.15;y<top;y+=.35)b.box(K,lx,y,zf+dep-.1,.44,.035,.035);
}
function tank(b,x,y,z,r){b.cylinder('soho135Tank',x,y+2.2+1.5,z,r,r,3.0,9);b.add(new T.ConeGeometry(r*1.06,1.0,9),'soho135Tank',x,y+2.2+3.5,z,1,1,1,0,0,0,.78);
 for(const[dx,dz]of[[-1,-1],[1,-1],[1,1],[-1,1]])b.box('soho135Iron',x+dx*r*.7,y+1.1,z+dz*r*.7,.16,2.2,.16);
 b.box('soho135Iron',x,y+2.2,z,r*1.7,.1,r*1.7);for(let i=0;i<3;i++)b.cylinder('soho135Iron',x,y+2.6+i*.95,z,r+.03,r+.03,.06,9);}
// spec: a lot from soho135Lots (b already pushed to the lot centre at sidewalk level, local +z = street)
export function* soho135BuildingTask(b,spec,lod){
 addSoho135Materials(b.mats);const S=spec.soho135,w=spec.w,d=spec.d,H=S.H,key='soho135'+S.side,h=(spec.seed>>>0);
 const cw=1/S.cells,u0=S.i*cw+.5/1024,u1=(S.i+1)*cw-.5/1024,zf=d/2;
 // V141: facades rebuilt as real geometry. Until the F4 SoHo re-bake the old pieces stay in the batch (same vertex counts ->
 // the per-block bake keys still match) but are parked 2.2 m inside the body; the body front steps back 1 m for the recesses.
 const f141=SOHO141[S.side+S.i]&&soho141On(),zO=f141?zf-2.2:zf;
 // body (brick party walls, back, roof deck) + roof parapet
 if(f141)b.box(h%2?'brickRed':'brickOchre',0,H/2,-.56,w-.04,H,d-1.12,0,.94);else b.box(h%2?'brickRed':'brickOchre',0,H/2,-.06,w-.04,H,d-.12,0,.94);b.box('soho135Roof',0,H+.03,-.06,w-.5,.08,d-.6);
 for(const[x,z,ww,dd]of[[0,-d/2+.15,w-.04,.3],[-w/2+.17,-.06,.3,d-.4],[w/2-.17,-.06,.3,d-.4]])b.box(h%2?'brickRed':'brickOchre',x,H+.5,z,ww,1.0,dd,0,.9);
 // the generated elevation, full height, 1 cm proud of the body
 quad(b,key,[[-w/2,0,zO],[w/2,0,zO],[w/2,H,zO],[-w/2,H,zO]],[u0,0,u1,1],[0,0,1]);
 // projecting cornice: top 4 % of the elevation, 0.75 m out; sheet-metal cap
 const cs=cornerSide(spec),ci=SIDE135.indexOf(S.side+S.i);
 if(cs&&ci>=0){const x=cs*(w/2-.005),zb=-d/2,su0=ci/SIDE135.length+.5/2048,su1=(ci+1)/SIDE135.length-.5/2048;
  if(cs<0)quad(b,'soho135side',[[x,0,zb],[x,0,zf],[x,H,zf],[x,H,zb]],[su1,0,su0,1],[-1,0,0]);
  else quad(b,'soho135side',[[x,0,zf],[x,0,zb],[x,H,zb],[x,H,zf]],[su0,0,su1,1],[1,0,0]);}
 const ch=Math.max(.9,H*.035);uvBox(b,key,0,H-ch/2,zO+.38,w+.1,ch,.76,[u0,.962,u1,.995]);b.box('soho135Iron',0,H+.03,zO+.35,w+.16,.06,.84,0,.8);
 if(f141)soho141Build(b,spec,lod,S.side+S.i);
 b.solid(0,-.06,w,d);yield;
 if(lod)return;
 // fire escape on 3 of 4 buildings (the bay hashed per lot), from the 2nd storey up
 if(h%4!==1&&S.n>=4){const fw=Math.min(7.2,w*.46),x0=-w/2+.6+((h>>>3)%100)/100*(w-fw-1.2),lv=[];const k=S.scale;
  for(let f=2;f<=S.n;f++)lv.push((SOHO135.ground+SOHO135.storey*(f-2))*k+.05);
  fireEscape(b,x0,x0+fw,zO+.01,lv);yield;}
 if(h%3===0){const r=1.5+(h>>>5)%3*.2;tank(b,((h>>>7)%2?-1:1)*Math.max(0,w/2-3.2),H+.05,-d/2+3.2,r);}
 else b.box('soho135Iron',((h>>>7)%2?-1:1)*(w/4),H+.6,-d/4,2.2,1.1,1.6,0,.7); // stair bulkhead / HVAC
 yield;
}
