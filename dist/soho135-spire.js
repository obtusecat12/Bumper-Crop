// V135-capital ③-3b SoHo focal spire tower (layout: soho135-layout.js spire135Filter, lot = west front-row lot of block -2,5).
// A 1913-style Gothic terracotta skyscraper that closes the north end of the SoHo vista: a full-lot shaft, a set-back upper tier
// with corner pinnacles, a copper pyramid roof, a needle and a gilt ball. Every face of the shaft and of the tier is its own
// generated elevation (art-v135spire -> tools/spire135_assets.py -> assets/l11-v135s/spire.webp, cells SPIRE135_CELLS);
// the roof is a seamless verdigris copper texture tiled in metres. Built inside the block's UrbanBatch (streams/LODs with it).
// Lot frame is the block row's (back row: ry 0, local +z = north); cells are assigned so the shaftS/upperS faces look south
// (towards SoHo) and shaftW/upperW face the SoHo road (west) whatever the lot rotation.
import * as T from './vendor/three.module.min.js';
import {SPIRE141,soho141On,soho141Spire} from './soho141-facade.js?v=141g'; // V141 F3b real-geometry shaft base (S portal, W shopfronts)
const A=new URL('./assets/l11-v135s/',import.meta.url).href;
export const SPIRE135_CELLS=['shaftS','shaftW','shaftN','shaftE','upperS','upperW','upperN','upperE'];
function tex(name,srgb=true,rep=false){const t=new T.TextureLoader().load(A+name+'.webp?v=135v');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function addSpire135Materials(m){
 if(m.spire135)return m;
 m.spire135=new T.MeshStandardMaterial({map:tex('spire'),normalMap:tex('spire-n',false),normalScale:new T.Vector2(.8,.8),roughness:.8,vertexColors:true});
 m.spire135Cu=new T.MeshStandardMaterial({map:tex('spire-copper',true,true),roughness:.62,metalness:.25,vertexColors:true});
 m.spire135Stone=new T.MeshStandardMaterial({color:0xd8ccb2,roughness:.85,vertexColors:true});
 m.spire135Gilt=new T.MeshStandardMaterial({color:0xc9a24a,roughness:.35,metalness:.85,vertexColors:true});
 return m;
}
function geo(pos,uv,nr,b,key,tone=1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(nr,3));b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// facade quad: p = bl, br, tr, tl seen from outside; atlas cell c
function face(b,p,c,n,key='spire135',v0=0){const u0=c/SPIRE135_CELLS.length+.5/1024,u1=(c+1)/SPIRE135_CELLS.length-.5/1024,U=[[u0,v0],[u1,v0],[u1,1],[u0,1]],pos=[],uv=[],nr=[];
 for(const i of[0,1,2,0,2,3]){pos.push(...p[i]);uv.push(...U[i]);nr.push(...n);}geo(pos,uv,nr,b,key);}
// four facades of a box x +-hw, z +-hd, y0..y1, cells for the local faces [+z,+x,-z,-x]; pk[i] = face i pushed that far inside
function faces(b,hw,hd,y0,y1,c,pk=[0,0,0,0]){
 face(b,[[-hw,y0,hd-pk[0]],[hw,y0,hd-pk[0]],[hw,y1,hd-pk[0]],[-hw,y1,hd-pk[0]]],c[0],[0,0,1]);
 face(b,[[hw-pk[1],y0,hd],[hw-pk[1],y0,-hd],[hw-pk[1],y1,-hd],[hw-pk[1],y1,hd]],c[1],[1,0,0]);
 face(b,[[hw,y0,-hd+pk[2]],[-hw,y0,-hd+pk[2]],[-hw,y1,-hd+pk[2]],[hw,y1,-hd+pk[2]]],c[2],[0,0,-1]);
 face(b,[[-hw+pk[3],y0,-hd],[-hw+pk[3],y0,hd],[-hw+pk[3],y1,hd],[-hw+pk[3],y1,-hd]],c[3],[-1,0,0]);}
// V141 F3b: the shaftS / shaftW faces get their bottom (below a string course) as baked real geometry (soho141Spire) and a flat
// upper quad (own material key 'spire141', same atlas) from v = cutv up. Until the F4 SoHo re-bake the old full-height quads stay
// in the batch (same vertex counts -> per-block bake keys match) but are parked 2.2 m inside; the stone core steps back 1 m there.
const DIR=[[0,1],[1,0],[0,-1],[-1,0]];
function base141(b,hw,hd,hs,cell,lod){
 if(!b.mats.spire141)b.mats.spire141=b.mats.spire135.clone();
 for(let i=0;i<4;i++){const f=cell[i]===0?'S':cell[i]===1?'W':null;if(!f)continue;const F=SPIRE141[f],[dx,dz]=DIR[i],fw=dx?2*hd:2*hw,yc=F.cutv*hs,h=dx?hw:hd;
  const p=dx?[[dx*hw,yc,dx*hd],[dx*hw,yc,-dx*hd],[dx*hw,hs,-dx*hd],[dx*hw,hs,dx*hd]]:[[-dz*hw,yc,dz*hd],[dz*hw,yc,dz*hd],[dz*hw,hs,dz*hd],[-dz*hw,hs,dz*hd]];
  face(b,p,cell[i],[dx,0,dz],'spire141',F.cutv);
  b.push(dx*h,0,dz*h,Math.atan2(dx,dz));soho141Spire(b,f,lod,fw,yc);b.pop();}}
// copper pyramid, base half-size h at y0, apex at y0+ht; uv in metres / 5 (seamless tile)
function pyramid(b,h,y0,ht){const P=[[-h,h],[h,h],[h,-h],[-h,-h]],pos=[],uv=[],nr=[],sl=Math.hypot(h,ht);
 for(let i=0;i<4;i++){const a=P[i],c=P[(i+1)%4],mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2,l=Math.hypot(mx,mz),n=[mx/l*ht/sl,h/sl,mz/l*ht/sl];
  pos.push(a[0],y0,a[1],c[0],y0,c[1],0,y0+ht,0);uv.push(0,0,2*h/5,0,h/5,sl/5);nr.push(...n,...n,...n);}
 geo(pos,uv,nr,b,'spire135Cu');}
function pinnacle(b,x,z,y,s){b.box('spire135Stone',x,y+s*1.6,z,s,s*3.2,s,0,.92);b.add(new T.ConeGeometry(s*.72,s*3.4,4),'spire135Stone',x,y+s*3.2+s*1.7,z,1,1,1,Math.PI/4,0,0,.96);b.box('spire135Gilt',x,y+s*5.0,z,s*.18,s*.5,s*.18);}
// shaft height from the south elevation's aspect (2.9), tier from upperS (1.89); both stretched ~10 % for a slimmer silhouette
export function* spire135Task(b,spec,lod){
 addSpire135Materials(b.mats);const ry=spec.ry||0,cell=[[0,1],[1,0],[0,-1],[-1,0]].map(([x,z])=>{const cx=x*Math.cos(ry)+z*Math.sin(ry),cz=-x*Math.sin(ry)+z*Math.cos(ry);return Math.abs(cz)>Math.abs(cx)?(cz<0?0:2):(cx<0?1:3);});const w=spec.w-.1,d=spec.d-.1,hw=w/2,hd=d/2,hs=w*2.9*1.1,uw=Math.min(w,d)*.64,uh=uw*1.89*1.12;
 // shaft: stone core + four generated faces, cornice band with a small parapet
 const on141=soho141On(),pk=cell.map(c=>on141&&c<2?2.2:0),ins=cell.map(c=>on141&&c<2?1.0:.03);
 b.box('spire135Stone',(ins[3]-ins[1])/2,hs/2,(ins[2]-ins[0])/2,w-ins[1]-ins[3],hs,d-ins[0]-ins[2],0,.9);faces(b,hw,hd,0,hs,cell,pk);if(on141)base141(b,hw,hd,hs,cell,lod);
 b.box('spire135Stone',0,hs+.5,0,w+.9,1.0,d+.9,0,.95);b.box('spire135Stone',0,hs+1.25,0,w+.3,.5,d+.3,0,.86);
 b.solid(0,0,w,d);yield;
 // upper tier
 const y1=hs+1.5,y2=y1+uh,uh2=uw/2;b.box('spire135Stone',0,y1+uh/2,0,uw-.06,uh,uw-.06,0,.9);faces(b,uh2,uh2,y1,y2,cell.map(c=>c+4));
 b.box('spire135Stone',0,y2+.4,0,uw+.8,.8,uw+.8,0,.95);
 // copper roof, lantern band, needle, gilt ball
 const rh=uw*1.9;pyramid(b,uh2+.35,y2+.8,rh);yield;
 if(lod)return;
 for(const[sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){pinnacle(b,sx*(hw-.2),sz*(hd-.2),hs+1.5,1.1);pinnacle(b,sx*(uh2+.1),sz*(uh2+.1),y2+.8,.9);
  for(const t of[-1,1])pinnacle(b,sx*(hw-.2)+(t<0?-sx*hw*.66:0),sz*(hd-.2)+(t>0?-sz*hd*.66:0),hs+1.5,.6);}
 // small gabled dormers on each roof face (stone frame, dark opening)
 for(let i=0;i<4;i++){const a=i*Math.PI/2,r=(uh2+.35)*.55,y=y2+.8+rh*.45-.6,x=Math.sin(a)*r,z=Math.cos(a)*r;
  b.box('spire135Stone',x,y,z,1.5,2.2,1.4,a,.9);b.add(new T.ConeGeometry(1.1,1.0,4),'spire135Cu',x,y+1.55,z,1,1,1,a+Math.PI/4,0,0,.9);b.box('brickRed',x+Math.sin(a)*.71,y-.1,z+Math.cos(a)*.71,.8,1.4,.02,a,.25);}
 const top=y2+.8+rh;b.cylinder('spire135Cu',0,top-1.2,0,.55,.85,2.4,8);b.cylinder('spire135Gilt',0,top+6,0,.06,.32,12,6);
 b.add(new T.SphereGeometry(.75,8,6),'spire135Gilt',0,top+1.2,0,1,1,1,0,0,0,1);b.add(new T.SphereGeometry(.35,6,4),'spire135Gilt',0,top+8.5,0,1,1,1,0,0,0,1);
 yield;
}
