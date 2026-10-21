// V138-retail-interiors R4: Layout A/B grid generator for the walk-in stores (replaces the R2/R3 provisional fills).
// Each store floor is planned on a grid before anything is built: wall runs first (back / side walls / front zone),
// then the free middle rectangle gets one of two interior generators, then a flood-fill on a 10 cm walk grid (player
// radius inflated) checks that the door reaches the front of every fixture; optional pieces (blockers, clutter,
// islands) that cut something off are dropped until it all connects. Only then is geometry emitted (with yields).
//  Layout A "maze" (old bodega / corner grocery): tall gondolas, narrow 0.95–1.2 m aisles, either
//    'zig'   rows along the depth, each broken once at staggered points, plus perpendicular blockers closing some aisles
//            (dead ends, the path has to jog through the breaks), or
//    'snake' rows across the store, alternately open at the left / right end → one serpentine path;
//    floor case stacks where the aisle still leaves ≥ 0.8 m.
//  Layout B "arena" (modern store): tall coolers along the walls, wide 1.6–2.1 m aisles, a grid of low islands in the
//    middle (chest freezers back to back, produce bins, low gondolas with end caps, promo pallets) so the whole floor is
//    visible from the door.
// Market: A 30 % / B 70 %; bodega: A 70 % / B 30 % (hash). URL ?r138lay=a|b forces, ?r138lay=old = the R2/R3 fills.
// Module library: retail138-market.js (R2) + retail138-bodega.js (R3). Frame: building centre, +z street, store floor
// x0..x1 × (d/2−sd)..d/2. Debug: window.__r138 collects per-store {kind,lay,variant,items,dropped}.
import {GOODS138,gondola138,endcap138,reachIn138,multideck138,chest138,checkout138,impulse138,promo138,baskets138,carts138,
 produceBin138,vegRack138,aisleSign138,addRetail138Market,caseBox138,retail138MarketFill} from './retail138-market.js?v=140a';
import {NEON138,liquorWall138,beerCave138,smokeCounter138,humidor138,cashier138,neonSign138,neonTube138,addRetail138Bodega,
 retail138BodegaFill} from './retail138-bodega.js?v=140a';
const PI=Math.PI,RAD=.27,G=.1;
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
function stack138(b,seed,{w=.55,d=.4,n=2}){const r=rng(seed);let y=0;for(let i=0;i<n;i++){const hh=.24+r()*.14;caseBox138(b,r,(r()-.5)*.04,y,(r()-.5)*.04,w-i*.03,hh,d-i*.02,(r()-.5)*.12);y+=hh;}b.solid(0,0,w,d);}
const FN={gondola:gondola138,endcap:endcap138,reachIn:reachIn138,multideck:multideck138,chest:chest138,checkout:checkout138,
 impulse:impulse138,promo:promo138,baskets:baskets138,carts:carts138,produceBin:produceBin138,vegRack:vegRack138,
 liquorWall:liquorWall138,beerCave:beerCave138,smokeCounter:smokeCounter138,humidor:humidor138,cashier:cashier138,stack:stack138};
// local footprints [x0,z0,x1,z1] (module frame: back at z = 0, shopper side +z, length along x); two = usable from both faces
const FP={
 gondola:o=>o.double===false?[-o.len/2-.03,0,o.len/2+.03,.52]:[-o.len/2-.03,-.5,o.len/2+.03,.5],
 endcap:o=>{const w=o.w??1;return[-w/2-.04,0,w/2+.04,.42];},
 reachIn:o=>{const L=o.doors*.78+.1;return[-L/2,0,L/2,.9];},
 multideck:o=>[-o.len/2,0,o.len/2,.95],
 chest:o=>{const D=o.D??.92;return[-o.len/2-.02,-D/2-.02,o.len/2+.02,D/2+.02];},
 checkout:()=>[-2.0,-.72,1.62,.4],impulse:o=>[-(o.w??.9)/2,0,(o.w??.9)/2,.32],promo:()=>[-.54,-.44,.54,.44],
 baskets:()=>[-.26,-.19,.26,.19],carts:o=>[-.5,-.31,(o.n-1)*.26+.5,.31],
 produceBin:o=>{const l=o.len??1.6;return[-l/2-.03,-.57,l/2+.03,.57];},vegRack:o=>[-o.len/2,0,o.len/2,1.0],
 liquorWall:o=>[-o.len/2,0,o.len/2,o.depth??.34],beerCave:o=>[-o.len/2,0,o.len/2,1.05],
 smokeCounter:o=>{const l=o.len??1.8;return[-l/2-.02,0,l/2+.02,o.D??.6];},humidor:o=>{const w=o.w??1.3;return[-w/2-.02,0,w/2+.02,(o.D??.55)+.04];},
 cashier:o=>[-o.len/2-.06,0,o.len/2+.06,o.deep],stack:o=>[-o.w/2,-o.d/2,o.w/2,o.d/2]};
const TWO=new Set(['chest','promo','produceBin','stack','baskets','carts']);
const wpt=(lx,lz,x,z,ry)=>{const c=Math.cos(ry),s=Math.sin(ry);return[x+c*lx+s*lz,z-s*lx+c*lz];};
function wbox(f,x,z,ry){const p=[[f[0],f[1]],[f[2],f[1]],[f[0],f[3]],[f[2],f[3]]].map(([a,c])=>wpt(a,c,x,z,ry));
 return[Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))];}
const hit=(a,c,m=0)=>a[0]<c[2]-m&&c[0]<a[2]-m&&a[1]<c[3]-m&&c[1]<a[3]-m;
class Site{
 constructor(P,zb,zf){this.P=P;this.zb=zb;this.zf=zf;this.items=[];this.decos=[];this.keep=[];this.dropped=0;}
 /** drop = optional piece (refused when it overlaps, may be removed by the walk check); acc = must be reachable. */
 add(t,seed,o,x,z,ry,{drop=false,acc=true,y=0}={}){
  const f=FP[t](o),box=wbox(f,x,z,ry),it={t,seed,o,x,y,z,ry,drop,acc,f,box};
  if(drop){const{x0,x1}=this.P;if(box[0]<x0+.02||box[2]>x1-.02||box[1]<this.zb+.02||box[3]>this.zf-.1){this.dropped++;return null;}
   if(this.items.some(q=>hit(q.box,box,.02))||this.keep.some(k=>hit(k,box))){this.dropped++;return null;}}
  this.items.push(it);return it;}
 deco(fn){this.decos.push(fn);}
 /** flood the walk grid from the door; returns the items whose front can't be reached. */
 unreached(){
  const{x0,x1,doorX}=this.P,zb=this.zb,zf=this.zf,nx=Math.ceil((x1-x0)/G),nz=Math.ceil((zf-zb)/G),blk=new Uint8Array(nx*nz),seen=new Uint8Array(nx*nz);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=x0+(i+.5)*G,z=zb+(j+.5)*G;
   if(x<x0+RAD||x>x1-RAD||z<zb+RAD||z>zf-.15){blk[j*nx+i]=1;continue;}
   for(const q of this.items){const a=q.box;if(x>a[0]-RAD&&x<a[2]+RAD&&z>a[1]-RAD&&z<a[3]+RAD){blk[j*nx+i]=1;break;}}}
  const cell=(x,z)=>{const i=Math.floor((x-x0)/G),j=Math.floor((z-zb)/G);return i<0||j<0||i>=nx||j>=nz?-1:j*nx+i;};
  const st=[cell(doorX,zf-.35)];if(st[0]<0||blk[st[0]])return this.items.filter(q=>q.acc);
  seen[st[0]]=1;while(st.length){const c=st.pop(),i=c%nx,j=(c/nx)|0;
   for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,e=j+dj;if(a<0||e<0||a>=nx||e>=nz)continue;const k=e*nx+a;if(!seen[k]&&!blk[k]){seen[k]=1;st.push(k);}}}
  this.reach=(x,z)=>{const c=cell(x,z);return c>=0&&seen[c]===1;};
  const out=[];for(const q of this.items){if(!q.acc)continue;const f=q.f,mx=(f[0]+f[2])/2,pts=[[mx,f[3]+RAD+.12]];
   if(TWO.has(q.t)||(q.t==='gondola'&&q.o.double!==false))pts.push([mx,f[1]-RAD-.12]);
   if(q.t==='gondola'||q.t==='chest')for(const s of[-1,1])pts.push([s*((f[2]-f[0])/2+RAD+.12)+mx,(f[1]+f[3])/2]);
   if(!pts.some(([a,c])=>{const[wx,wz]=wpt(a,c,q.x,q.z,q.ry);for(const dx of[0,-G,G])for(const dz of[0,-G,G])if(this.reach(wx+dx,wz+dz))return true;return false;}))out.push(q);}
  return out;}
 settle(){for(let k=0;k<60;k++){const u=this.unreached();if(!u.length)return;
   if(u.some(q=>!q.drop)){let i=this.items.length-1;while(i>=0&&!this.items[i].drop)i--;if(i<0)return;this.items.splice(i,1);this.dropped++;}
   else{for(const q of u){this.items.splice(this.items.indexOf(q),1);this.dropped++;}}}}
}
// ---- row helpers in a (u, v) frame: u = row length axis, v = across. alongZ → u = z, v = x. ----
function frame(alongZ){return{pt:(u,v)=>alongZ?[v,u]:[u,v],row:alongZ?PI/2:0,face:d=>alongZ?(d>0?0:PI):(d>0?PI/2:-PI/2),across:d=>alongZ?(d>0?PI/2:-PI/2):(d>0?0:PI)};}
/** Layout A maze in rectangle R = {u0,u1,v0,v1} (all aisles included). */
function mazeA(S,W,alongZ,o,r){
 const R=alongZ?{u0:W.z0,u1:W.z1,v0:W.x0,v1:W.x1}:{u0:W.x0,u1:W.x1,v0:W.z0,v1:W.z1},F=frame(alongZ),H=o.h,V=R.v1-R.v0,U=R.u1-R.u0,aMin=o.aisle,variant=o.variant;
 if(variant==='snake'){
  // rows across: u = across the store, rows stacked along v
  const n=Math.floor((V-aMin)/(1+aMin));if(n<1)return mazeA(S,W,true,{...o,variant:'zig'},r);
  const a=(V-n)/(n+1),open=Math.max(1.0,aMin+.05),flip=r()<.5;
  for(let i=0;i<n;i++){const v=R.v0+a*(i+1)+i+.5,left=(i%2===0)!==flip,us=left?R.u0+open:R.u0+.02,ue=left?R.u1-.02:R.u1-open,L=ue-us;if(L<1.22)continue;
   const[x,z]=F.pt((us+ue)/2,v);S.add('gondola',S.P.h^(i*733+41),{len:L,h:H,cats:o.cats(i)},x,z,F.row,{drop:true});
   const eu=left?us:ue,[ex,ez]=F.pt(eu+(left?-.01:.01),v);S.add('endcap',S.P.h^(i*733+43),{w:1.0,h:Math.min(1.6,H-.3),cat:o.capCat},ex,ez,F.face(left?-1:1),{drop:true});
   if(o.sign)S.deco(b=>{const[sx,sz]=F.pt((us+ue)/2,v+(i===n-1?-1:1)*(a/2+.5));b.push(sx,0,sz,F.across(1));aisleSign138(b,(i+(S.P.h>>>9))%8,S.P.C,0);b.pop();});}
  return'snake';}
 const n=Math.max(0,Math.floor((V-aMin)/(1+aMin)));if(n<1)return'none';
 const a=(V-n)/(n+1),us=R.u0+o.aBack,ue=R.u1-o.aFront,L=ue-us;if(L<1.22)return'none';
 const breaks=[];
 for(let i=0;i<n;i++){const v=R.v0+a*(i+1)+i+.5;let segs=[[us,ue]];
  if(L>=1.22*2+1.05&&r()<.85){const t=(i%2?.28:.55)+r()*.17,ub=us+L*t;segs=[[us,ub-.525],[ub+.525,ue]].filter(([p,q])=>q-p>=1.22);breaks.push({i,ub});}
  segs.forEach(([p,q],k)=>{const[x,z]=F.pt((p+q)/2,v);S.add('gondola',S.P.h^(i*977+k*31+7),{len:q-p,h:H,cats:o.cats(i)},x,z,F.row,{drop:true});});
  const[ex,ez]=F.pt(ue+.01,v);S.add('endcap',S.P.h^(i*977+5),{w:1.0,h:Math.min(1.6,H-.3),cat:o.capCat},ex,ez,F.face(1),{drop:true});
  if(o.sign&&i<n)S.deco(b=>{const[sx,sz]=F.pt(ue-.6,v+.5+a/2);b.push(sx,0,sz,F.face(1));aisleSign138(b,(i+(S.P.h>>>9))%8,S.P.C,0);b.pop();});}
 // blockers: a short single gondola across an aisle (between rows j−1 and j), away from both rows' breaks → dead end / jog
 for(let j=1;j<n;j++){if(r()>.5)continue;const vA=R.v0+a*j+(j-1)+1,vB=vA+a;
  const bad=breaks.filter(q=>q.i===j-1||q.i===j).map(q=>q.ub);let ub=null;
  for(let t=0;t<8&&ub==null;t++){const c=us+.6+r()*(L-1.2);if(bad.every(q=>Math.abs(q-c)>1.3))ub=c;}
  if(ub==null)continue;const[x,z]=F.pt(ub,(vA+vB)/2),dir=r()<.5?1:-1;
  S.add('gondola',S.P.h^(j*331+99),{len:a-.04,h:H,double:false,cats:[GOODS138.dry]},x-(alongZ?0:dir*.26),z-(alongZ?dir*.26:0),F.face(dir),{drop:true});}
 // clutter: case stacks against row sides where the aisle stays ≥ 0.8 m, and in the front cross aisle
 if(a-.42>=.8)for(let j=0;j<=n;j++)if(r()<.55){const v=R.v0+j*(a+1)+.21,u=us+.4+r()*(L-.8),[x,z]=F.pt(u,v);
  S.add('stack',S.P.h^(j*57+3),{w:.5+r()*.12,d:.38,n:1+((r()*3)|0)},x,z,F.row,{drop:true});}
 if(o.aFront>=1.15&&r()<.6){const[x,z]=F.pt(ue+o.aFront*.5,R.v0+a+.5+r()*Math.max(0,V-2*a-1));S.add('stack',S.P.h^777,{w:.58,d:.42,n:2+((r()*2)|0)},x,z,F.row,{drop:true});}
 return'zig';
}
/** Layout B arena: grid of low islands in R. kinds: array of island makers, chosen per cell; front row may be produce. */
function arenaB(S,W,alongZ,o,r){
 const R=alongZ?{u0:W.z0,u1:W.z1,v0:W.x0,v1:W.x1}:{u0:W.x0,u1:W.x1,v0:W.z0,v1:W.z1},F=frame(alongZ),V=R.v1-R.v0,U=R.u1-R.u0,cw=o.cw,a0=o.aisle;
 const nc=Math.max(0,Math.floor((V-a0)/(cw+a0))),nr=Math.max(0,Math.floor((U-a0)/(o.clMin+a0)));if(!nc||!nr)return 0;
 const cl=Math.min(o.clMax,(U-(nr+1)*a0)/nr);
 const av=(V-nc*cw)/(nc+1),au=(U-nr*cl)/(nr+1);let k=0;
 for(let i=0;i<nc;i++)for(let j=0;j<nr;j++){const v=R.v0+av*(i+1)+cw*(i+.5),u=R.u0+au*(j+1)+cl*(j+.5),front=j===nr-1,kind=o.pick(r,front,i,j,nr),tw=cl>3.6?2:1,tl=(cl-.1*tw)/tw;
  const s=S.P.h^(i*4111+j*613+17),[x,z]=F.pt(u,v);k++;
  if(kind==='chest2'){const len=Math.min(2.4,tl-.05);for(let t=0;t<tw;t++)for(const sd of[-1,1]){const[cx,cz]=F.pt(u+(t-(tw-1)/2)*(tl+.1),v+sd*.47);S.add('chest',s^(sd+t*5),{len},cx,cz,F.row,{drop:true});}}
  else if(kind==='chest'){S.add('chest',s,{len:Math.min(2.2,cl-.1)},x,z,F.row,{drop:true});}
  else if(kind==='produce'){const len=Math.min(1.8,tl-.1);for(let t=0;t<tw;t++)for(const sd of[-1,1]){const[cx,cz]=F.pt(u+(t-(tw-1)/2)*(tl+.1),v+sd*.58);S.add('produceBin',s^(sd+t*5),{len},cx,cz,F.across(sd),{drop:true});}}
  else if(kind==='gond'){const len=Math.max(1.22,Math.floor((cl-.86)/1.22)*1.22);S.add('gondola',s,{len,h:o.lowH,cats:[o.gcat,o.gcat]},x,z,F.row,{drop:true});
   if(len+.86<=cl+.35)for(const sd of[-1,1]){const[ex,ez]=F.pt(u+sd*(len/2+.01),v);S.add('endcap',s^(sd+9),{w:1.0,h:Math.min(1.4,o.lowH),cat:o.capCat},ex,ez,F.face(sd),{drop:true});}}
  else if(kind==='promo'){for(const du of[-.62,.62]){const[px,pz]=F.pt(u+du,v);S.add('promo',s^(du>0?3:5),{},px,pz,F.face(du>0?1:-1),{drop:true});}}}
 return k;
}
// ---------------------------------------------------------------- market ----
function planMarket(S,lay,r){
 const{P}=S,{x0,x1,C,h}=P,zb=S.zb,zf=S.zf,sx=x1-1.6,A=lay==='A';
 // back wall: drinks + frozen reach-ins up to the staff door
 const bl=sx-.8-(x0+.15),nd=Math.max(2,Math.floor(bl/.78)),na=Math.ceil(nd/2);
 S.add('reachIn',h,{doors:na,cat:GOODS138.cool},x0+.15+(na*.78+.1)/2,zb,0);
 if(nd-na>0)S.add('reachIn',h^7,{doors:nd-na,cat:GOODS138.frozen,frozen:true},x0+.15+na*.78+.1+((nd-na)*.78+.1)/2,zb,0);
 S.keep.push([sx-.7,zb,sx+.7,zb+1.4]);
 const zQ=zf-4.9,zA=zb+2.3;
 let wl=.95,wr=.52;
 if(A){// old grocery: tall wall gondolas both sides, a short dairy multideck in the back-left corner
  const md=2.5;S.add('multideck',h^11,{len:md},x0,zA+md/2,PI/2);
  const gl=Math.floor((zQ-.3-zA-md-.1)/1.22)*1.22;if(gl>=1.22)S.add('gondola',h^13,{len:gl,h:2.1,double:false},x0,zA+md+.1+gl/2,PI/2);
  const gr=Math.floor((zQ-.3-zA)/1.22)*1.22;if(gr>=1.22)S.add('gondola',h^17,{len:gr,h:2.1,double:false,cats:[GOODS138.dry.slice(10)]},x1,zA+gr/2,-PI/2);
 }else{// modern: dairy multideck run on the left, frozen reach-ins + misted veg wall on the right
  const mdl=Math.max(1.25,Math.floor((zQ-.3-zA)/1.25)*1.25);S.add('multideck',h^11,{len:mdl},x0,zA+mdl/2,PI/2);
  const vl=2.4,fd=Math.max(0,Math.floor((zQ-.4-vl-zA)/.78));
  S.add('vegRack',h^13,{len:vl},x1,zQ-.2-vl/2,-PI/2);
  if(fd>=2)S.add('reachIn',h^19,{doors:fd,cat:GOODS138.frozen,frozen:true},x1,zA+(fd*.78+.1)/2,-PI/2);
  wr=1.0;}
 const R={x0:x0+wl,x1:x1-wr,z0:zb+.9,z1:zQ};
 let variant;
 if(A){variant=(h>>>22)%3===0?'snake':'zig';
  variant=mazeA(S,R,variant!=='snake',{h:2.1,aisle:1.15,aBack:1.35,aFront:1.25,variant,sign:true,capCat:GOODS138.dry,cats:i=>[GOODS138.dry,GOODS138.dry]},r);}
 else{const mix=(h>>>21)%4;variant='arena'+mix;
  arenaB(S,{...R,z0:R.z0+.2},true,{cw:1.9,clMin:2.4,clMax:4.6,aisle:1.65,lowH:1.55,gcat:GOODS138.candy.concat(GOODS138.dry.slice(0,6)),capCat:GOODS138.candy,
   pick:(r,front,i,j,nr)=>mix!==3&&(nr>1?front:i%2===0)?'produce':mix===1?(i%2?'gond':'chest2'):mix===2?((i+j)%3===2?'promo':'chest2'):(r()<.5?'chest2':'gond')},r);}
 // front: checkout lanes on the side away from the door, carts + baskets by the door, produce bin / promo (A only)
 const doorLeft=P.doorX<(x0+x1)/2,span=doorLeft?[P.doorX+1.6,x1-.6]:[x0+.6,P.doorX-1.6],lanes=[];
 for(let x=span[1]-.55;x>span[0]+.3&&lanes.length<(A?2:3);x-=2.3)lanes.push(doorLeft?x:span[0]+(span[1]-x));
 lanes.forEach((x,i)=>S.add('checkout',h^(31+i),{lane:i+1},x,zf-2.7,-PI/2));
 S.keep.push([P.doorX-.8,zf-1.8,P.doorX+.8,zf]);
 const fx=doorLeft?Math.max(x0+1.2,P.doorX-2.2):Math.min(x1-1.2,P.doorX+2.2);
 S.add('carts',h^37,{n:2+(h>>>11)%3},fx,zf-1.2,PI,{drop:true});
 S.add('baskets',h^41,{n:5+(h>>>13)%4},P.doorX+(doorLeft?1.4:-1.4),zf-.7,0,{drop:true});
 if(A){if(((h>>>14)&1)===0)S.add('produceBin',h^43,{},fx,zQ+.25,0,{drop:true});else S.add('promo',h^47,{},fx,zQ+.3,0,{drop:true});}
 else S.add('promo',h^47,{},fx,zQ+.3,0,{drop:true});
 return variant;
}
// ---------------------------------------------------------------- bodega ----
function planBodega(S,lay,r){
 const{P}=S,{x0,x1,C,h}=P,zb=S.zb,zf=S.zf,cx=(x0+x1)/2,sw=x1-x0,doorRight=P.doorX>cx,A=lay==='A';
 const wallC=doorRight?x0:x1,face=doorRight?1:-1,ryW=doorRight?PI/2:-PI/2,wallD=doorRight?x1:x0,ryD=doorRight?-PI/2:PI/2;
 // back wall: beer cave from beside the staff door to the far wall
 const sdx=x0+1.2,cave0=sdx+.75,caveL=x1-.12-cave0;let caveEnd=zb;S.keep.push([sdx-.7,zb,sdx+.7,zb+1.3]);
 if(caveL>1.6){S.add('beerCave',h^3,{len:caveL,C},cave0+caveL/2,zb,0);caveEnd=zb+1.05;
  S.deco(b=>{b.push(cave0+caveL/2,2.62,zb+1.02,0);neonSign138(b,(h>>>6)%2?NEON138.coldBeer:NEON138.cerveza,{w:1.0,chainTo:C-2.62});b.pop();
   neonTube138(b,'r138tubeB',[cave0+.3,2.2,zb+1.0],[x1-.4,2.2,zb+1.0]);});}
 // counter wall: cashier booth at the front, liquor wall behind it, smoke counter in front of the liquor wall
 const bLen=Math.min(3.6,Math.max(2.4,P.sd*.32)),bz=zf-1.3-bLen/2,deep=1.75,bars=(h>>>9)%4===0;
 S.add('cashier',h^5,{len:bLen,deep,C,bars},wallC,bz,ryW,{acc:true});
 const lz1=bz-bLen/2-.1,lz0=caveEnd+.25,lLen=lz1-lz0;
 if(lLen>1.2)S.add('liquorWall',h^7,{len:lLen,C,y0:.45,depth:.4},wallC,(lz0+lz1)/2,ryW,{acc:false});
 const scL=Math.min(2.2,Math.max(0,lLen-.4));if(scL>.9)S.add('smokeCounter',h^11,{len:scL},wallC+face*(deep-.6),lz1-scL/2-.05,ryW);
 S.add('impulse',h^13,{w:.8,h:1.0},wallC+face*(deep+.01),bz-bLen/2+.6,ryW,{drop:true});
 S.deco(b=>{b.push(wallC+face*(deep-.04),2.55,bz+.3,ryW);neonSign138(b,(h>>>7)%2?NEON138.lotto:NEON138.atm,{w:.8,chainTo:C-2.55});b.pop();
  neonTube138(b,'r138tubeP',[wallC+face*(deep-.02),C-.05,bz-bLen/2],[wallC+face*(deep-.02),C-.05,bz+bLen/2]);});
 // door wall: A = humidor + tall snack gondola; B = grab-and-go reach-in coolers (energy drinks / water) + humidor at the back
 const hz=caveEnd+.85;let dDepth=.55;
 S.add('humidor',h^17,{w:1.3},wallD,hz,ryD);
 S.deco(b=>{b.push(wallD-face*.65,2.3,hz,ryD);neonSign138(b,NEON138.cigars,{w:.7,chainTo:C-2.3});b.pop();});
 const gz0=hz+.75,gz1=zf-1.6;
 if(A){const gl=Math.floor((gz1-gz0)/1.22)*1.22;if(gl>=1.22)S.add('gondola',h^19,{len:gl,double:false,h:1.95,cats:[GOODS138.candy.concat(GOODS138.dry.slice(8,14))]},wallD,gz0+gl/2,ryD);}
 else{const nd=Math.floor((gz1-gz0-.1)/.78);if(nd>=2){S.add('reachIn',h^19,{doors:nd,cat:GOODS138.cool},wallD,gz0+(nd*.78+.1)/2,ryD);dDepth=.9;}
  else{const gl=Math.floor((gz1-gz0)/1.22)*1.22;if(gl>=1.22)S.add('gondola',h^19,{len:gl,double:false,h:1.8},wallD,gz0+gl/2,ryD);}}
 S.keep.push([P.doorX-.75,zf-1.5,P.doorX+.75,zf]);
 // middle
 const va=wallC+face*2.1,vb=wallD-face*dDepth,R={x0:Math.min(va,vb),x1:Math.max(va,vb),z0:caveEnd,z1:zf-1.45};
 let variant;
 if(A){variant=(h>>>22)%2?'snake':'zig';
  variant=mazeA(S,R,variant!=='snake',{h:1.95,aisle:.95,aBack:1.0,aFront:1.1,variant,sign:false,capCat:GOODS138.candy,cats:i=>i%2?[GOODS138.dry,GOODS138.candy]:[GOODS138.candy,GOODS138.dry]},r);}
 else{variant='arena';
  const nIs=arenaB(S,R,true,{cw:1.0,clMin:1.7,clMax:3.2,aisle:1.0,lowH:1.55,gcat:GOODS138.dry.concat(GOODS138.candy),capCat:GOODS138.candy,
   pick:(r,front,i,j,nr)=>front&&nr>1?(r()<.25?'promo':r()<.4?'chest':'gond'):'gond'},r);
  // R5b: narrow B bodegas read empty → floor case stacks + an impulse rack along the island aisles (optional pieces;
  // the walk check drops any that cut a fixture off)
  for(let z=R.z0+.5,k=0;z<R.z1-.4;z+=.85,k++)for(const sd of[0,1]){if(r()<.45)continue;const x=sd?R.x1-.32:R.x0+.32;
   if(k%3===1&&r()<.5)S.add('impulse',h^(k*71+sd),{w:.7,h:1.1},x,z,sd?-PI/2:PI/2,{drop:true});
   else S.add('stack',h^(k*53+sd*7),{w:.5+r()*.1,d:.38,n:1+((r()*3)|0)},x,z,(r()-.5)*.3,{drop:true});}
  if(nIs<3){const[x,z]=[(R.x0+R.x1)/2,R.z1-.35];S.add('promo',h^991,{},x,z,0,{drop:true});}}
 // window neon facing the street
 const wx=doorRight?Math.max(x0+.8,P.doorX-1.7):Math.min(x1-.8,P.doorX+1.7);
 S.deco(b=>{b.push(wx,1.85,zf-.22,0);neonSign138(b,(h>>>5)%3===0?NEON138.hrs24:NEON138.open,{w:.8,chainTo:C-1.85});b.pop();
  if(sw>7.5){b.push(cx+(doorRight?-1:1)*.4,2.25,zf-.24,0);neonSign138(b,NEON138.vape,{w:.7,chainTo:C-2.25});b.pop();}});
 return variant;
}
const Q=typeof location!=='undefined'?location.search:'';
/** P = retail138Plan result, d = building depth. Plans, checks the walk graph, then builds. */
export function* retail138LayoutFill(b,P,{d}){
 const force=(/[?&]r138lay=(a|b|old)/i.exec(Q)||[])[1];
 if(force&&force.toLowerCase()==='old'){yield* (P.market?retail138MarketFill(b,P,{d}):retail138BodegaFill(b,P,{d}));return;}
 addRetail138Market(b.mats);addRetail138Bodega(b.mats);
 const h=P.h>>>0,lay=force?force.toUpperCase():(P.market?((h>>>20)%10<3?'A':'B'):((h>>>20)%10<7?'A':'B'));
 const S=new Site(P,d/2-P.sd,d/2),r=rng(h^0x4a7b);
 const variant=P.market?planMarket(S,lay,r):planBodega(S,lay,r);
 S.settle();
 if(typeof window!=='undefined')(window.__r138||(window.__r138=[])).push({kind:P.kind,h,lay,variant,items:S.items.length,dropped:S.dropped,sw:+(P.x1-P.x0).toFixed(2),sd:P.sd});
 yield;
 let k=0;for(const it of S.items){b.push(it.x,it.y,it.z,it.ry);FN[it.t](b,it.seed,it.o);b.pop();if(++k%5===0)yield;}
 for(const f of S.decos)f(b);
}
