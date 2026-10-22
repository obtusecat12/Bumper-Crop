// V144 A1 (notes/spec-1022-capital-landmarks.md A, ref files/ref-1022-capital-brickblock.webp): six-storey dark grey/plum brick
// apartment slab replacing the north-facing front row of capital block (-2,-1) (faces the z=0 road walked from the arrival to SoHo).
// Window layout = the reference photo rectified to 20 px/m (/workspace/work/v144/rect.png), every white box-frame unit transcribed
// by hand: g narrow glazed slit, h slit with a white upper panel, G glass pane, W opaque white panel; B = the deep projecting
// units of the two big-window columns. Real geometry: brick wall with true holes, white box surrounds extruded through the wall
// and proud of it, recessed glass with one of six generated interiors, mullions, panels, sills; ground floor = recessed dark metal
// cladding with red-framed slit windows, two entrances (cedar cladding + wood doors + recessed glass lobbies + canopies),
// parapet coping and a set-back roof plant room. Textures bc/tools/brick144_assets.py -> assets/l11-v144. Off: ?brick144=0.
import * as T from './vendor/three.module.min.js';
import {urbanHash} from './urban-batch.js?v=60';
const A=new URL('./assets/l11-v144/',import.meta.url).href;
import {BRICK144} from './brick144-layout.js?v=144a';
import {brick144StreetTask} from './brick144-street.js?v=144b'; // V144 A2 street + road works
const PX=20,EXT=7,WB=BRICK144.w,TOP=19.9+.45;   // photo px per metre, metres added west of the photo's left edge, width, roof height
// rows: photo y (top, bottom) of the white units, floor 6 (top) .. 2
const ROWS=[[42,78],[99,137],[156,195],[216,255],[277,318]];
const U=[
 '20-71:gWG 78-92:g 107-121:g 128-157:G 165-195:G 206-253:gWGG 261-275:g 294-308:h 315-366:Gg:B 378-392:g 400-472:GWGG 485-499:g 519-558:gG 571-609:Gg 640-653:h 662-713:Gg:B 727-763:GGg 795-806:g 817-882:GWG 893-904:g 918-953:Gg 998-1033:gG 1057-1100:G:C',
 '2-17:g 37-67:GG 79-129:gWG 137-150:g 162-191:GG 200-258:gWGg 292-305:h 312-363:Gg:B 393-432:gGG 440-488:GWg 505-535:G 548-600:gWGG 613-627:g 640-653:h 662-713:Gg:B 727-756:G 766-778:g 791-820:G 835-846:g 856-884:GG 895-969:gWGWg 1004-1015:g 1058-1100:G:C',
 '0-25:GG 50-88:gG 96-126:GG 133-189:gWG 200-213:g 234-271:gG 289-302:h 310-361:Gg:B 374-404:G 413-426:g 439-469:G 482-534:gWG 543-556:g 574-586:g 596-626:GG 640-652:h 662-713:Gg:B 732-744:g 754-822:GWG 832-843:g 866-903:gGG 918-929:g 943-972:G 1002-1013:g 1061-1100:G:C',
 '3-59:gWG 67-101:gWg 117-206:GWgWG 214-244:GG 256-269:g 286-299:g 309-359:Gg:B 372-385:g 398-467:GWG 476-489:g 516-555:gGG 569-608:Gg 640-652:h 663-714:Gg:B 728-766:Gg 794-822:GG 837-888:gWG 898-910:g 937-973:gG 1005-1042:gGG 1065-1100:G:C',
 '0-12:g 25-38:g 50-80:G 88-118:G 126-140:g 152-183:GG 190-204:g 215-229:g 237-267:G 285-297:g 305-357:Gg:B 370-400:G 410-423:g 436-532:ggWgWG 542-555:g 586-625:gG 640-652:h 662-714:Gg:B 728-741:g 755-785:GG 799-811:g 822-850:G 861-898:Gg 925-955:G 965-977:g 1011-1023:g 1067-1100:G:C'];
const parse=s=>s.split(' ').map(t=>{const[r,p,f='']=t.split(':'),[a,b]=r.split('-').map(Number);return{a,b,p,f};});
const GF={slits:[10,36,62,97,123,167,229,256,382,409,441,468,517,545,582,609,750,806,830,878,904],panelEnd:1000,
 doorL:[275,300],lobbyL:[305,358],canopyL:[298,364],woodR:[630,668],lobbyR:[668,720],canopyR:[626,724]};
const HG=3.2,HB=(398-343)/PX+.45;   // ground floor panel height (to the brick lintel band), photo bottom offset
const xm=px=>px/PX-WB/2+EXT, ym=py=>(398-py)/PX+.45;
let mats=null;
function tex(name,srgb=true,rep=true){const t=new T.TextureLoader().load(A+name+'.webp?v=144c');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function addMats(m){
 if(m.b144brick)return m;
 m.b144brick=new T.MeshStandardMaterial({map:tex('brick144'),normalMap:tex('brick144-n',false),roughnessMap:tex('brick144-r',false),roughness:1,metalness:0,vertexColors:true});
 m.b144panel=new T.MeshStandardMaterial({map:tex('panel144'),normalMap:tex('panel144-n',false),normalScale:new T.Vector2(.7,.7),roughness:.62,metalness:.35,vertexColors:true});
 m.b144wood=new T.MeshStandardMaterial({map:tex('wood144'),normalMap:tex('wood144-n',false),roughness:.55,metalness:0,vertexColors:true});
 m.b144trim=new T.MeshStandardMaterial({map:tex('trim144',true,false),normalMap:tex('trim144-n',false,false),normalScale:new T.Vector2(.3,.3),roughness:.5,metalness:.05,vertexColors:true});
 m.b144red=new T.MeshStandardMaterial({map:tex('redf144',true,false),roughness:.55,metalness:.3,vertexColors:true});
 m.b144glass=new T.MeshStandardMaterial({map:tex('win144',true,false),roughness:.14,metalness:.25,vertexColors:true});
 m.b144dark=new T.MeshStandardMaterial({color:0x1b2326,roughness:.18,metalness:.4,vertexColors:true});
 m.b144steel=new T.MeshStandardMaterial({color:0x3a3d3e,roughness:.45,metalness:.7,vertexColors:true});
 m.b144roof=new T.MeshStandardMaterial({color:0x4a4846,roughness:.95,metalness:0,vertexColors:true});
 return m;
}
// ---- raw quad soup per material, flushed into the batch at the end
class Soup{constructor(){this.p={};}
 q(key,a,b,c,d,uv){const s=this.p[key]||(this.p[key]={pos:[],uv:[]});s.pos.push(...a,...b,...c,...a,...c,...d);s.uv.push(...uv[0],...uv[1],...uv[2],...uv[0],...uv[2],...uv[3]);}
 // axis-aligned quad facing +z (front) at depth z, x0..x1, y0..y1, uv tiling (metres / tile) with offsets
 fz(key,x0,x1,y0,y1,z,tu,tv,ou=0,ov=0,flip=false){const U0=(x0+ou)/tu,U1=(x1+ou)/tu,V0=(y0+ov)/tv,V1=(y1+ov)/tv;
  if(flip)this.q(key,[x1,y0,z],[x0,y0,z],[x0,y1,z],[x1,y1,z],[[U1,V0],[U0,V0],[U0,V1],[U1,V1]]);else this.q(key,[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[[U0,V0],[U1,V0],[U1,V1],[U0,V1]]);}
 uvq(key,x0,x1,y0,y1,z,u0,u1,v0,v1){this.q(key,[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[[u0,v0],[u1,v0],[u1,v1],[u0,v1]]);}
 // box with its own 0..1 (or tiled) uv per face; x/y/z ranges
 box(key,x0,x1,y0,y1,z0,z1,tile=0){const t=(a,b)=>tile?[a/tile,b/tile]:null;const F=(a,b,c,d,w,h)=>this.q(key,a,b,c,d,tile?[[0,0],[w/tile,0],[w/tile,h/tile],[0,h/tile]]:[[0,0],[1,0],[1,1],[0,1]]);
  const w=x1-x0,h=y1-y0,d=z1-z0;
  F([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],w,h);F([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],w,h);
  F([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],d,h);F([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],d,h);
  F([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],w,d);F([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],w,d);}
 flush(b,x=0,y=0,z=0,ry=0){for(const[k,s]of Object.entries(this.p)){if(!s.pos.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();b.add(g,k,x,y,z,1,1,1,ry);g.dispose();}this.p={};}
}
// wall plane at z=0 over [x0,x1]x[y0,y1] minus rectangular holes (bands between hole y-edges)
function wallWithHoles(S,key,x0,x1,y0,y1,holes,tile,z=0){
 const ys=[...new Set([y0,y1,...holes.flatMap(h=>[h[2],h[3]]).filter(v=>v>y0&&v<y1)])].sort((a,b)=>a-b);
 for(let i=0;i<ys.length-1;i++){const a=ys[i],c=ys[i+1],m=(a+c)/2,hs=holes.filter(h=>h[2]<m&&h[3]>m).sort((p,q)=>p[0]-q[0]);let at=x0;
  for(const h of hs){if(h[0]>at)S.fz(key,at,Math.min(h[0],x1),a,c,z,tile,tile);at=Math.max(at,h[1]);}if(at<x1)S.fz(key,at,x1,a,c,z,tile,tile);}
}
// one white box-frame window unit on a wall at z=0 (outward +z); returns its hole
function unit(S,u,x0,x1,y0,y1,seed,lod){
 const big=u.f==='B',corner=u.f==='C',p=big?.32:corner?.14:.07,t=big?.17:.13,D=.30,zg=-.17;
 // surround: four boxes through the wall thickness and proud of it; the bottom one is the sill (a touch deeper + drip)
 S.box('b144trim',x0,x1,y1-t-(big?.04:0),y1,-D,p);S.box('b144trim',x0,x1,y0,y0+t,-D,p+.035);
 S.box('b144trim',x0,x0+t,y0+t,y1-t,-D,p);S.box('b144trim',x1-t,x1,y0+t,y1-t,-D,p);
 if(!lod)S.box('b144trim',x0-.02,x1+.02,y0-.025,y0+.005,p-.02,p+.06);
 const ix0=x0+t,ix1=x1-t,iy0=y0+t,iy1=y1-t-(big?.04:0),els=[...u.p],m=.06,gw=.24;
 const fixed=els.filter(e=>e==='g'||e==='h').length,flex=els.reduce((a,e)=>a+(e==='G'?1.45:e==='W'?1:0),0);
 const free=Math.max(.1,ix1-ix0-m*(els.length-1)-fixed*gw);let at=ix0,k=0;
 for(const e of els){const w=e==='g'||e==='h'?Math.min(gw,(ix1-ix0)/els.length):free*(e==='G'?1.45:1)/flex,a=at,c=at+w;at=c+m;
  if(k++&&!lod)S.box('b144trim',a-m,a,iy0,iy1,-.22,-.06);
  if(e==='W'){S.box('b144trim',a,c,iy0,iy1,-.2,-.12);continue;}
  let gy1=iy1;if(e==='h'){gy1=iy0+(iy1-iy0)*.52;S.box('b144trim',a,c,gy1,iy1,-.2,-.12);if(!lod)S.box('b144trim',a,c,gy1-.03,gy1,-.2,-.08);}
  // glass: an atlas cell (6 interiors, 3 x 2), a crop matching the pane's aspect at a hashed offset
  const h=urbanHash(seed,k,0x144),cell=corner?3:h%6,cu=cell%3,cv=1-Math.floor(cell/3),pw=c-a,ph=gy1-iy0,s=Math.min(1,pw/ph),sw=s*(.92),sh=sw*ph/pw>1?1:sw*ph/pw,
   ou=(1-sw)*((h>>>8)%97)/96,ov=(1-Math.min(1,sh))*((h>>>16)%89)/88;
  S.uvq('b144glass',a,c,iy0,gy1,zg,(cu+ou)/3,(cu+ou+sw)/3,(cv+ov)/2,(cv+ov+Math.min(1,sh))/2);
  if(big&&e==='G'&&!lod)S.box('b144trim',a,c,iy0+(gy1-iy0)*.8,iy0+(gy1-iy0)*.8+.05,-.2,-.1);
 }
 return[x0,x1,y0,y1];
}
// all the units of one face: rows of strings in photo px (pxToX maps a px x to the face's local x)
function unitsFace(S,list,pxToX,seed,lod){const holes=[];
 list.forEach((row,ri)=>{const[ty,by]=ROWS[ri];for(const u of row){const big=u.f==='B',x0=pxToX(u.a),x1=pxToX(u.b),y1=ym(ty)+(big?.15:0),y0=ym(by)-(big?.15:0);
  holes.push(unit(S,u,Math.min(x0,x1),Math.max(x0,x1),y0,y1,urbanHash(seed+ri,u.a,0x1440),lod));}});
 return holes;}
export function* brick144Task(b,spec,lod){
 addMats(b.mats);const S=new Soup(),d=BRICK144.depth,zf=spec.d/2,zb=zf-d,W2=WB/2,BT=2.4,rows=U.map(parse),seed=spec.seed|0;
 // ---- front face (local frame: x along the street, +z out of the facade)
 b.push(0,0,zf);
 // west extension: the photo's px 150..290 units repeated west of its left edge (px -140..0 = x -31..-24)
 const ext=rows.map(r=>r.filter(u=>u.a>=150&&u.b<=290).map(u=>({...u,a:u.a-290,b:u.b-290})));
 const holes=unitsFace(S,rows,xm,seed,lod);
 holes.push(...unitsFace(S,ext,xm,seed+77,lod));
 yield;
 // ground floor: slits, doors, lobbies are holes in the panel wall; the brick runs from HG up
 const gh=[],sl=GF.slits.map(xm),extSl=[-30.2,-28.9,-27.6,-26.2,-24.9];
 for(const x of[...extSl,...sl])gh.push([x-.22,x+.22,.9,2.45]);
 const dl=GF.doorL.map(xm),ll=GF.lobbyL.map(xm),wr=GF.woodR.map(xm),lr=GF.lobbyR.map(xm),pe=xm(GF.panelEnd);
 gh.push([dl[0],dl[1],0,HG-.25],[ll[0],ll[1],0,HG-.45],[wr[0],wr[1],0,HG-.1],[lr[0],lr[1],0,HG-.45]);
 wallWithHoles(S,'b144brick',-W2,W2,HG,TOP,holes,BT);
 // brick lintel soffit over the recessed cladding, and the brick ground floor east of the cladding
 S.q('b144brick',[-W2,HG,-.1],[pe,HG,-.1],[pe,HG,0],[-W2,HG,0],[[0,0],[(pe+W2)/BT,0],[(pe+W2)/BT,.1/BT],[0,.1/BT]]);
 wallWithHoles(S,'b144brick',pe,W2,0,HG,gh.filter(h=>h[0]>pe),BT);
 S.flush(b);b.pop();b.push(0,0,zf-.1);
 wallWithHoles(S,'b144panel',-W2,pe,0,HG,gh.filter(h=>h[1]<=pe),3.0);
 if(pe<W2)S.box('b144panel',pe-.02,pe,0,HG,0,.1);
 // red slit windows: frame + dark glass
 for(const x of[...extSl,...sl]){const a=x-.22,c=x+.22;if(c>pe)continue;S.box('b144red',a,c,.9,.96,-.16,.04);S.box('b144red',a,c,2.39,2.45,-.16,.04);S.box('b144red',a,a+.06,.96,2.39,-.16,.04);S.box('b144red',c-.06,c,.96,2.39,-.16,.04);S.fz('b144dark',a+.06,c-.06,.96,2.39,-.12,1,1);}
 // left door: cedar clad niche with a wood leaf + steel pull
 S.box('b144wood',dl[0],dl[1],0,HG-.25,-.35,-.25,1.2);S.box('b144wood',dl[0],dl[0]+.06,0,HG-.25,-.25,0,1.2);S.box('b144wood',dl[1]-.06,dl[1],0,HG-.25,-.25,0,1.2);S.box('b144wood',dl[0],dl[1],HG-.31,HG-.25,-.25,0,1.2);
 S.box('b144steel',dl[1]-.2,dl[1]-.17,.85,1.35,-.25,-.18);
 // recessed glass lobbies (dark side walls, red-framed storefront at the back, ceiling) + flat steel canopies
 for(const[l,cp,deep]of[[ll,GF.canopyL.map(xm),1.3],[lr,GF.canopyR.map(xm),1.2]]){const[a,c]=l,hh=HG-.45;
  S.box('b144panel',a,a+.05,0,hh,-deep,0,3);S.box('b144panel',c-.05,c,0,hh,-deep,0,3);S.box('b144panel',a,c,hh,hh+.05,-deep,0,3);
  S.fz('b144dark',a+.05,c-.05,0,hh,-deep+.02,1,1);const n=Math.max(2,Math.round((c-a)/.9));for(let i=0;i<=n;i++){const x=a+.05+(c-a-.1)*i/n;S.box('b144red',x-.03,x+.03,0,hh,-deep+.02,-deep+.09);}
  S.box('b144red',a+.05,c-.05,hh-.38,hh-.32,-deep+.02,-deep+.09);S.box('b144red',a+.05,c-.05,0,.12,-deep+.02,-deep+.09);
  if(!lod)S.box('b144steel',a+.05+(c-a)*.55,a+.05+(c-a)*.55+.03,.8,1.6,-deep+.09,-deep+.14);
  S.q('b144roof',[a,.005,0],[c,.005,0],[c,.005,-deep],[a,.005,-deep],[[0,0],[1,0],[1,1],[0,1]]);
  S.box('b144steel',cp[0],cp[1],HG-.08,HG+.05,0,1.05);S.box('b144steel',cp[0],cp[1],HG-.14,HG-.08,.95,1.05);}
 // east cedar cladding with a wood door
 S.box('b144wood',wr[0],wr[1],0,HG-.1,-.12,0,1.2);S.box('b144dark',wr[1]-1.05,wr[1]-.08,0,2.2,-.005,.012);S.box('b144wood',wr[1]-1.02,wr[1]-.11,.02,2.17,.012,.05,1.2);S.box('b144steel',wr[1]-.98,wr[1]-.95,.9,1.4,.05,.1);
 S.flush(b);b.pop();yield;
 // ---- parapet coping + side faces + back face + roof
 b.push(0,0,zf);S.box('b144steel',-W2-.04,W2+.04,TOP,TOP+.08,-d-.04,.06);S.flush(b);b.pop();
 const sideRows=ROWS.map((_,ri)=>[{a:0,b:13,p:ri%2?'g':'h',f:''},{a:40,b:76,p:'gG',f:''},{a:150,b:190,p:ri===2?'GG':'G',f:''},{a:240,b:254,p:'g',f:''}]);
 for(const s of[-1,1]){b.push(s*W2,0,zf-d/2,s*Math.PI/2);const hs=unitsFace(S,sideRows,px=>px/PX-d/2+.6,seed+s*11,lod);
  wallWithHoles(S,'b144brick',-d/2,d/2,0,TOP,hs,BT);S.flush(b);b.pop();}
 b.push(0,0,zb,Math.PI);
 const back=rows.map((r,ri)=>r.filter(u=>u.f!=='C'&&u.f!=='B'&&u.a>20&&u.b<1040).map(u=>({...u,p:u.p.replace(/W/g,'G')})));
 const bh=unitsFace(S,back,px=>-(px/PX-WB/2+EXT-2.5),seed+303,lod);wallWithHoles(S,'b144brick',-W2,W2,0,TOP,bh,BT);S.flush(b);b.pop();
 S.q('b144roof',[-W2,TOP,zf],[W2,TOP,zf],[W2,TOP,zb],[-W2,TOP,zb],[[0,0],[1,0],[1,1],[0,1]]);
 // roof plant room, set back 2 m, where the photo shows its pale box over the roofline (px 410..525): rendered block, steel louvres, door
 const px0=xm(410),px1=xm(525),pz1=zf-2,pz0=pz1-5.5,PH=2.4;
 S.box('concrete',px0,px1,TOP,TOP+PH,pz0,pz1,3);S.box('b144steel',px0-.05,px1+.05,TOP+PH,TOP+PH+.1,pz0-.05,pz1+.05);
 if(!lod){for(let i=0;i<7;i++)S.box('b144steel',px0+.8,px0+3.2,TOP+.5+i*.2,TOP+.58+i*.2,pz1,pz1+.06);S.box('b144dark',px1-1.6,px1-.6,TOP,TOP+2.1,pz1,pz1+.02);
  for(let i=0;i<3;i++)S.box('b144steel',xm(500)+i*3,xm(500)+i*3+1.4,TOP,TOP+1.1,zb+4,zb+5.2);}
 S.flush(b);
 b.solid(0,zf-d/2,WB,d);
 yield;
 yield* brick144StreetTask(b,spec,lod);
}
