// V144 B (notes/spec-1022-capital-landmarks.md B, ref files/ref-1022-street-barricade.webp): a street barricade that closes
// the six-metre service-alley portal of capital block (-3,-1)'s north row (block-local x 53..59, building line z 100, facing
// the z = 0 east-west street ~60 m west of SoHo). B1 = the pallet pile: 36 pallets, each a real board/stringer/block build
// (stringer pallets with notched stringers, block pallets with nine blocks, a ply-topped one) from brick144-pallets-data.js,
// each with its own tile of the b1_pal atlas (bc/tools/brick144b1_assets.py: base + normal + roughness), leaning / stacked /
// standing in the photo's arrangement. Frame: origin = alley mouth centre on the building line, y 0 = alley ground,
// +z = out to the street, x across the alley (walls at |x| = 3). The whole mouth is one collider. ?barr144=0 off.
import * as T from './vendor/three.module.min.js';
import {PAL144,PAL144_ATLAS} from './brick144-pallets-data.js?v=144f';
import {CHIP144,CHIP144_SHEET_M} from './brick144-chips-data.js?v=144f';
export const BARRICADE144_ON=!/[?&]barr144=0\b/.test(globalThis.location?.search||'');
export const BARRICADE144={block:[-3,-1],x:56,z:100};
const A=new URL('./assets/l11-v144/',import.meta.url).href,PI=Math.PI;
function tx(n,srgb=true){const t=new T.TextureLoader().load(A+n+'.webp?v=144d');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
let M=null;
function mats(m){if(m.b144pal)return;if(!M){M={b144pal:new T.MeshStandardMaterial({map:tx('b1_pal'),normalMap:tx('b1_pal-n',false),roughnessMap:tx('b1_pal-r',false),roughness:1,metalness:0,vertexColors:true})};
 M.b144pal.normalScale=new T.Vector2(.9,.9);M.b144pal.name='V144 B1 pallets';}Object.assign(m,M);}
// ---- one pallet's geometry from its boxes: each face takes its own atlas rect; the face's long axis follows the rect's long
// axis (grain runs along the board); planar faces (deck top / bottom) map by footprint so painted text spans the boards.
const FACES=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]];
const CACHE=new Map();
function palletGeometry(name){
 if(CACHE.has(name))return CACHE.get(name);const P=PAL144[name],pos=[],uv=[],[AW,AH]=PAL144_ATLAS;
 for(const bx of P.boxes){const[x0,x1,y0,y1,z0,z1]=bx.b,E=[x1-x0,y1-y0,z1-z0];
  for(let f=0;f<6;f++){const C=FACES[f].map(([a,b,c])=>[a?x1:x0,b?y1:y0,c?z1:z0]),[u0,v0,u1,v1]=bx.f[f];
   let U;if(bx.p[f])U=C.map(p=>[u0+(p[0]-x0)/(x1-x0)*(u1-u0),v1-(p[2]-z0)/(z1-z0)*(v1-v0)]);
   else{const ea=Math.hypot(...C[1].map((v,i)=>v-C[0][i])),eb=Math.hypot(...C[3].map((v,i)=>v-C[0][i])),wide=(u1-u0)*AW>=(v1-v0)*AH,ab=[[0,0],[1,0],[1,1],[0,1]];
    U=ab.map(([a,b])=>(ea>=eb)===wide?[u0+a*(u1-u0),v0+b*(v1-v0)]:[u0+b*(u1-u0),v0+a*(v1-v0)]);}
   for(const i of[0,1,2,0,2,3]){pos.push(...C[i]);uv.push(...U[i]);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();CACHE.set(name,g);return g;}
// place: [pallet, x, z, ground (lowest point lands here), yaw, pitch (x), roll (z), spin (pre-rotation about the pallet's y)]
const _m=new T.Matrix4(),_s=new T.Matrix4(),_e=new T.Euler();
const POSE={};   // pallet name -> local point -> frame point (B2 ties the rope to 'amber')
function place(b,[name,x,z,g,ry=0,rx=0,rz=0,spin=0]){
 const geo=palletGeometry(name).clone();_s.makeRotationY(spin);_m.makeRotationFromEuler(_e.set(rx,ry,rz,'YXZ')).multiply(_s);geo.applyMatrix4(_m);
 geo.computeBoundingBox();const bb=geo.boundingBox,dy=g-bb.min.y,m=_m.clone();geo.translate(x,dy,z);b.add(geo,'b144pal',0,0,0);geo.dispose();
 POSE[name]=p=>{const v=new T.Vector3(...p).applyMatrix4(m);return[v.x+x,v.y+dy,v.z+z];};}
const UP=PI/2;
// the photo's pile, front (street side) to back; x right looking into the alley from the street
const PILE=[
 // back wall: pallets standing on edge across the whole alley, the tall pair leaning into an A-frame at the back right
 ['back5',-2.4,-2.55,0,.25,UP-.35,.06,UP],['back3',-1.35,-2.5,0,-.3,UP-.3,-.05,UP],['back1',-.25,-2.4,0,.15,UP-.4,.1,UP],['back2',.85,-2.65,0,.35,UP-.35,0,0],
 ['back6',2.55,-2.85,0,-.3,UP-.25,0,UP],['lean1',1.55,-2.15,0,.2,UP-.22,-.42,UP],['lean2',2.75,-2.3,0,-.25,UP-.2,.42,UP],
 ['redbr',1.05,-1.95,0,.45,UP-.22,0,0],                       // dark reddish pallet upright behind the stack
 ['base1',-.45,-1.85,0,.05],['base2',-.43,-1.88,.137,-.04],['base3',-.47,-1.84,.281,.07],['hiA',-.5,-1.98,.418,.04,UP-.2,0,UP],   // second tier, left of centre
 ['hiB',-1.95,-1.85,0,.3,UP-.55,0,UP],
 // middle: the right stack (hidden supports) with two pallets tipped on top, the grey pair, the ply-topped pallet with the red spray
 ['sup1',2.2,-1.15,0,.04],['sup2',2.18,-1.17,.137,-.05],['sup3',2.22,-1.12,.274,.02],['sup4',2.2,-1.16,.418,.06],['sup5',2.17,-1.14,.555,-.03],['sup6',2.21,-1.15,.692,.05],
 ['topgy',2.12,-.98,.83,.08,.2,0,0],['topgy2',2.2,-1.05,.98,-.1,.34,.06,0],
 ['under',.25,-.25,0,.06,0,.02,0],['grey2',.15,-.55,.137,-.04,0,0,0],['grey1',.1,-.75,.274,.03,.3,0,0],
 ['mid2',.45,-1.35,.4,.3,.62,0,0],['mid1',-.6,-.6,0,-.15,UP-.6,0,0],
 ['goply',1.05,-.45,.15,.45,.75,-.35,0],['grey3',1.35,-1.05,.1,.5,1.05,-.3,0],
 ['flatL',-.95,-1.25,0,.1],['backL',-.95,-1.45,.144,.08,UP-.15,0,UP],
 ['left',-2.25,-.55,0,.3,.12,.05,0],['farL',-2.3,-1.4,0,-.2,UP-.27,0,UP],['back4',.4,-1.75,.42,.2,.6,0,0],
 // front: the new pine "312" block pallet (bottom face out, leaning back), the pale one on its long edge, the orange one in the mud
 ['p312',-1.3,.3,0,-.55,-(UP+.36),-.06,0],['pale',2.15,-.35,0,-.05,UP-.12,0,0],['amber',2.45,.42,0,-.12,.52,0,0],
];
export function* barricade144Task(b,lod){
 mats(b.mats);for(let i=0;i<PILE.length;i++){place(b,PILE[i]);if(i%6===5)yield;}
 b.solid(0,-1.1,6.2,3.4);   // the alley is closed wall to wall
 yield* barricade144B2(b,lod,POSE,PAL144);   // B2: door slab, stove, bucket, DOOR board, tarps, shed, fence, bags, hay, rope, film
 yield* barricade144B3(b,lod);   // B3: mud ground + broken-wood chips
}

// ======================================================================================================================
// V144 B2: the rest of the photo's barricade, in the same frame. Every item is real geometry with its own texture set
// (bc/tools/brick144b2_assets.py -> assets/l11-v144/b2_*: base + -n normal + -r roughness): the white steel door slab lying
// on its face in front (hinges on the front edge, lever handle, aluminium kick strip, closer box, plastic-film shreds), the
// black cast-iron stove at front left (rounded lid, firebox door with a coiled spring handle, tree emblem, legs, flue
// collar), the white HDPE bucket on a hay bale, the long board with the green "DOOR" arrow (and a plain board), the blue
// tarp hung from a timber frame and the dark green tarp stretched in it (fold geometry + normal maps), the shed at the back
// right (lap-siding boards with blue graffiti, a blue corrugated panel, paper notices, posts, mono-pitch roof), the green
// pointed-picket fence at the back left, black garbage bags, loose hay, and the white rope tied over the orange pallet.
function tx2(n,srgb=true){const t=new T.TextureLoader().load(A+n+'.webp?v=144e');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M2=null;
function mats2(m){if(m.b2door)return;if(!M2){M2={};const std=(n,o={})=>{const q=new T.MeshStandardMaterial({map:tx2(n),normalMap:tx2(n+'-n',false),roughnessMap:tx2(n+'-r',false),roughness:1,metalness:0,vertexColors:true,...o});q.normalScale=new T.Vector2(.85,.85);return q;};
 for(const n of['door','dboard','board','post','tarpb','tarpg','shed','note','pick','hay','rope','bucket'])M2['b2'+n]=std('b2_'+n);
 M2.b2alu=std('b2_alu',{metalness:.3});M2.b2iron=std('b2_iron',{metalness:.35});M2.b2corr=std('b2_corr',{metalness:.4});M2.b2bag=std('b2_bag');
 for(const k of['b2tarpb','b2tarpg','b2note','b2bag','b2corr'])M2[k].side=T.DoubleSide;
 M2.b2tuft=new T.MeshStandardMaterial({map:tx2('b2_tuft'),alphaTest:.5,side:T.DoubleSide,roughness:1,metalness:0,vertexColors:true});{const t=M2.b2tuft.map;t.generateMipmaps=false;t.minFilter=T.NearestFilter;}
 M2.b2film=new T.MeshStandardMaterial({map:tx2('b2_film'),transparent:true,depthWrite:false,side:T.DoubleSide,roughness:.18,metalness:0,vertexColors:true});
 for(const[k,v]of Object.entries(M2))v.name='V144 B2 '+k;}Object.assign(m,M2);}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const hs=(a,b=0)=>{let h=Math.imul((a|0)^0x9e3779b9,0x85ebca6b)^Math.imul(b|0,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return(h>>>0)/4294967296;};
// quad soup builder (as in brick144-street.js) + smooth grids, extrusions and path tubes
class Q{constructor(){this.p={};this.g=[];}
 s(k){return this.p[k]||(this.p[k]={pos:[],uv:[]});}
 tri(k,a,b,c,ua,ub,uc,out){if(out&&dot(crs(sub(b,a),sub(c,a)),out)<0){[b,c]=[c,b];[ub,uc]=[uc,ub];}const s=this.s(k);s.pos.push(...a,...b,...c);s.uv.push(...ua,...ub,...uc);}
 q(k,a,b,c,d,uv,out){if(out&&dot(crs(sub(b,a),sub(d,a)),out)<0){[b,d]=[d,b];uv=[uv[0],uv[3],uv[2],uv[1]];}const s=this.s(k);s.pos.push(...a,...b,...c,...a,...c,...d);s.uv.push(...uv[0],...uv[1],...uv[2],...uv[0],...uv[2],...uv[3]);}
 box(k,x0,x1,y0,y1,z0,z1,r=[0,0,1,1]){const w=x1-x0,h=y1-y0,d=z1-z0;
  const R=(i,a,b)=>typeof r==='number'?[0,0,a/r,b/r]:Array.isArray(r[0])?r[i%r.length]:r,U=([u0,v0,u1,v1])=>[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
  this.q(k,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],U(R(0,w,h)));this.q(k,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],U(R(1,w,h)));
  this.q(k,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],U(R(2,d,h)));this.q(k,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],U(R(3,d,h)));
  this.q(k,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],U(R(4,w,d)));this.q(k,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],U(R(5,w,d)));}
 tube(k,a,b,r,n=6,tile=1,u0=0){const v=sub(b,a),L=Math.hypot(...v);if(L<1e-5)return;const ax=v.map(c=>c/L),up=Math.abs(ax[1])<.9?[0,1,0]:[1,0,0],e1=crs(ax,up),l1=Math.hypot(...e1),u1=e1.map(c=>c/l1),u2=crs(ax,u1);
  for(let i=0;i<n;i++){const t0=i/n*2*PI,t1=(i+1)/n*2*PI,o0=u1.map((c,j)=>(c*Math.cos(t0)+u2[j]*Math.sin(t0))*r),o1=u1.map((c,j)=>(c*Math.cos(t1)+u2[j]*Math.sin(t1))*r);
   this.q(k,a.map((c,j)=>c+o0[j]),a.map((c,j)=>c+o1[j]),b.map((c,j)=>c+o1[j]),b.map((c,j)=>c+o0[j]),[[i/n,u0],[(i+1)/n,u0],[(i+1)/n,u0+L/tile],[i/n,u0+L/tile]],o0.map((c,j)=>c+o1[j]));}}
 path(k,pts,r,n=6,tile=1){let u=0;for(let i=0;i<pts.length-1;i++){this.tube(k,pts[i],pts[i+1],r,n,tile,u);u+=Math.hypot(...sub(pts[i+1],pts[i]))/tile;}}
 lathe(k,cx,cz,prof,n=12,v0=0,v1=1,a0=0,cy=0){const L=[0];for(let i=1;i<prof.length;i++)L.push(L[i-1]+Math.hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));
  for(let j=0;j<n;j++){const t0=a0+j/n*2*PI,t1=a0+(j+1)/n*2*PI,P=(p,t)=>[cx+p[0]*Math.cos(t),cy+p[1],cz+p[0]*Math.sin(t)];
   for(let i=0;i<prof.length-1;i++){const va=v0+(v1-v0)*L[i]/L.at(-1),vb=v0+(v1-v0)*L[i+1]/L.at(-1),tm=(t0+t1)/2,dr=prof[i+1][1]-prof[i][1],dy=-(prof[i+1][0]-prof[i][0]);
    this.q(k,P(prof[i],t0),P(prof[i],t1),P(prof[i+1],t1),P(prof[i+1],t0),[[j/n,va],[(j+1)/n,va],[(j+1)/n,vb],[j/n,vb]],[Math.cos(tm)*dr,dy,Math.sin(tm)*dr]);}}}
 // convex profile [[z,y]...] (counter-clockwise seen from +x) extruded along x0..x1, caps fanned; tile = metres per uv unit
 extrude(k,prof,x0,x1,tile=.5){const n=prof.length;let s=0;const c=prof.reduce((a,p)=>[a[0]+p[0]/n,a[1]+p[1]/n],[0,0]);
  for(let i=0;i<n;i++){const a=prof[i],b=prof[(i+1)%n],l=Math.hypot(b[0]-a[0],b[1]-a[1]),mid=[0,(a[1]+b[1])/2-c[1],(a[0]+b[0])/2-c[0]];
   this.q(k,[x0,a[1],a[0]],[x1,a[1],a[0]],[x1,b[1],b[0]],[x0,b[1],b[0]],[[0,s/tile],[(x1-x0)/tile,s/tile],[(x1-x0)/tile,(s+l)/tile],[0,(s+l)/tile]],mid);s+=l;
   for(const[x,o]of[[x0,-1],[x1,1]])this.tri(k,[x,c[1],c[0]],[x,a[1],a[0]],[x,b[1],b[0]],[c[0]/tile,c[1]/tile],[a[0]/tile,a[1]/tile],[b[0]/tile,b[1]/tile],[o,0,0]);}}
 // smooth indexed grid: P(u,v) -> point, UV(u,v) -> uv; u,v in 0..1
 grid(k,nu,nv,P,UV=(u,v)=>[u,v]){const pos=[],uv=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){pos.push(...P(i/nu,j/nv));uv.push(...UV(i/nu,j/nv));}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+2,d=a+nu+1;idx.push(a,b,c,a,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();this.g.push([k,g]);}
 flush(b,x=0,y=0,z=0,ry=0){for(const[k,s]of Object.entries(this.p)){if(!s.pos.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();b.add(g,k,x,y,z,1,1,1,ry);g.dispose();}
  for(const[k,g]of this.g){b.add(g,k,x,y,z,1,1,1,ry);g.dispose();}this.p={};this.g=[];}
}
// rotate a local point by pitch rx (about x) then yaw ry, then offset
const pose=(p,o,ry=0,rx=0)=>{const y=p[1]*Math.cos(rx)-p[2]*Math.sin(rx),z=p[1]*Math.sin(rx)+p[2]*Math.cos(rx),c=Math.cos(ry),s=Math.sin(ry);return[o[0]+p[0]*c+z*s,o[1]+y,o[2]-p[0]*s+z*c];};
// ---- the white steel door slab, built flat (x = length, z = width, +z = hinge edge), then tilted onto the pile
const DL=2.03,DW=.91,DT=.045;
function doorSlab(S,lod){const x0=-DL/2,x1=DL/2,z0=-DW/2,z1=DW/2,h=DT/2,E=[0,0,1,.03];
 S.box('b2door',x0,x1,-h,h,z0,z1,[E,E,E,E,[0,0,1,1],[1,1,0,0]]);
 S.box('b2alu',x0+.015,x0+.37,h,h+.0025,z0+.02,z1-.02,[[0,0,.6,.01],[0,0,.6,.01],[0,0,.01,.6],[0,0,.01,.6],[0,0,.7,1],[0,0,.7,1]]);   // kick strip
 S.box('b2alu',x0-.004,x0,-h,h,z0,z1,[0,.5,.08,1]);   // end channel
 for(const hx of[-.72,0,.72]){S.box('b2alu',hx-.05,hx+.05,-h+.004,h-.004,z1,z1+.003,[.7,0,.9,.2]);S.tube('b2alu',[hx-.05,-h-.004,z1+.012],[hx+.05,-h-.004,z1+.012],.009,6,.2);
  S.box('b2alu',hx-.05,hx+.05,-h-.012,-h-.009,z1+.012,z1+.1,[.7,.2,.9,.5]);}                     // hinge leaf folded out under the edge
 const lx=-.18,lz=z0+.11;S.lathe('b2alu',lx,lz,[[.032,h],[.03,h+.012],[.012,h+.016],[0,h+.016]],lod?6:10);   // rose
 S.tube('b2alu',[lx,h+.012,lz],[lx,h+.05,lz],.008,6,.2);S.path('b2alu',[[lx,h+.05,lz],[lx+.02,h+.058,lz+.05],[lx+.03,h+.056,lz+.11],[lx+.028,h+.045,lz+.13]],.009,6,.2);   // lever
 S.lathe('b2alu',lx+.09,lz-.02,[[.011,h],[.011,h+.008],[0,h+.008]],6);   // lock cylinder
 S.box('b2alu',x1-.42,x1-.2,h,h+.055,.02,.09,[[0,.4,.5,.6],[0,.4,.5,.6],[.5,.4,.6,.6],[.5,.4,.6,.6],[0,.6,.5,.8],[0,.6,.5,.8]]);}
function film(S,o,ry,w,l,seed,droop=0){   // crumpled stretch-wrap shred: w across, l along, droops off its far end
 S.grid('b2film',6,8,(u,v)=>{const n=(hs(seed+Math.round(u*6),Math.round(v*8))-.5)*.05,x=(u-.5)*w*(1-.35*v),y=n+.015-droop*v*v,z=v*l;return pose([x,y,z],o,ry);},(u,v)=>[u*.8+hs(seed)*.2,v]);}
// ---- the black cast-iron stove (local: front = +z, centre bottom at origin)
function stove(S,lod){const W=.31,D=.25;
 for(const sx of[-1,1])for(const sz of[-1,1])S.box('b2iron',sx*W-.035+sx*.01,sx*W+.035-sx*.03,0,.18,sz*D-.035,sz*D+.035,.3);   // legs
 S.box('b2iron',-W,W,.18,.52,-D,D,.4);S.box('b2iron',-W-.02,W+.02,.17,.2,-D-.02,D+.02,.4);   // body + base flange
 const pr=[];for(let i=0;i<=6;i++){const t=i/6*PI/2;pr.push([D-.13+.13*Math.cos(t)+.01,.55+.12*Math.sin(t)]);}pr.unshift([D+.01,.52]);pr.push([-D-.01,.67],[-D-.01,.52]);
 S.extrude('b2iron',pr,-W-.015,W+.015,.4);   // rounded lid
 S.box('b2iron',-.2,.2,.24,.48,D,D+.012,.3);S.box('b2iron',-.17,.17,.26,.46,D+.012,D+.022,.3);   // firebox frame + door
 const coil=[];for(let i=0;i<=(lod?24:48);i++){const t=i/(lod?24:48),a=t*PI*2*7;coil.push([-.07+t*.14,.37+.016*Math.cos(a),D+.05+.016*Math.sin(a)]);}S.path('b2alu',coil,.0035,4,.1);   // spring handle
 S.tube('b2iron',[-.09,.37,D+.022],[-.09,.37,D+.05],.008,5);S.tube('b2iron',[.09,.37,D+.022],[.09,.37,D+.05],.008,5);
 for(const[y,w]of[[.27,.05],[.32,.04],[.36,.03]])S.tri('b2iron',[-.25-w,y-.03,D+.006],[-.25+w,y-.03,D+.006],[-.25,y+.04,D+.006],[0,0],[.1,0],[.05,.1],[0,0,1]);   // pine-tree emblem (raised)
 S.box('b2iron',-.255,-.245,.2,.24,D,D+.006,.2);
 S.lathe('b2iron',-.12,-.1,[[.075,.65],[.075,.73],[.085,.735],[.085,.75],[0,.75]],lod?8:12);   // flue collar
 S.box('b2iron',-W-.03,-W,.42,.46,-.06,.06,.2);S.box('b2iron',W,W+.03,.42,.46,-.06,.06,.2);}   // side lugs
// ---- white bucket (5 gal) with wire handle
function bucket(S,lod){const n=lod?10:16;
 S.lathe('b2bucket',0,0,[[.0,.0],[.142,.0],[.145,.02],[.152,.3],[.156,.305],[.156,.32],[.153,.325],[.158,.36],[.164,.365],[.164,.38],[.151,.38]],n,0,1,0);
 S.lathe('b2bucket',0,0,[[.145,.38],[.14,.06],[0,.05]],n,.9,1);
 for(const s of[-1,1])S.box('b2bucket',-.012,.012,.33,.36,s*.165-.01,s*.165+.01,[.1,.9,.2,1]);
 const H=[];for(let i=0;i<=10;i++){const t=i/10*PI;H.push([0,.35+.17*Math.sin(t)*.35,-.17*Math.cos(t)]);}H[0][1]=H[10][1]=.345;S.path('b2alu',H.map(p=>[p[0]+.05*Math.sin(p[2]*9),p[1],p[2]]),.003,4,.1);}
// ---- hay bale and loose tufts
function bale(S){S.box('b2hay',-.45,.45,0,.36,-.23,.23,[[0,0,1,.4],[0,.5,1,.9],[.1,0,.6,.4],[.4,.5,.9,.9],[0,0,1,.5],[0,.5,1,1]]);
 for(const z of[-.12,.12])S.box('b2rope',-.452,.452,.358,.362,z-.004,z+.004,[0,0,.1,1]);}
function tuft(S,x,y,z,s,seed){const a=hs(seed)*PI,w=.28*s,h=.13*s,u=hs(seed,1)<.5?0:.5;
 for(const t of[a,a+PI/2]){const c=Math.cos(t)*w/2,d=Math.sin(t)*w/2;S.q('b2tuft',[x-c,y,z-d],[x+c,y,z+d],[x+c,y+h,z+d],[x-c,y+h,z-d],[[u,0],[u+.5,0],[u+.5,1],[u,1]]);}}
// ---- garbage bag: lumpy blob, flattened bottom, gathered neck + knot
function bag(S,o,r,seed,lod){const nu=lod?8:14,nv=lod?6:10;
 S.grid('b2bag',nu,nv,(u,v)=>{const t=-u*2*PI,lat=-PI/2+v*PI*.92,neck=v>.8?1-(v-.8)/.12*.85:1,lump=1+(hs(seed+((u*nu)|0)%nu,(v*nv)|0)-.5)*.22;
  let x=Math.cos(lat)*Math.cos(t)*r[0]*lump*neck,y=(Math.sin(lat)+1)*r[1],z=Math.cos(lat)*Math.sin(t)*r[2]*lump*neck;y=Math.max(y,0.01+v*.02);return[o[0]+x,o[1]+y,o[2]+z];},(u,v)=>[u*2,v]);
 const top=[o[0],o[1]+2*r[1]*.98,o[2]];S.lathe('b2bag',top[0],top[2],[[.0,0],[.035,.01],[.045,.04],[.02,.07],[0,.075]],6,0,.3,seed,top[1]);
 for(const s of[-1,1])S.grid('b2bag',3,3,(u,v)=>[top[0]+s*(.02+v*.09),top[1]+.05+Math.sin(v*PI)*.04+(u-.5)*.02,top[2]+(u-.5)*.07*(1-v)],(u,v)=>[u*.3,v*.3]);}
// ---- tarp hung from a beam (folds, sag, foot pooling on the ground); x0..x1, top y, plane z
function tarpHung(S,k,x0,x1,top,z,seed){const W=x1-x0,H=top+.25;
 S.grid(k,22,16,(u,v)=>{const x=x0+u*W,ty=top-.025*Math.abs(Math.sin(u*PI*4));let y=ty-v*H,zz=z;
  const fold=Math.sin(u*W*7+hs(seed)*6)*.075*(.35+v)+Math.sin(u*W*19+v*3)*.018+Math.sin(u*W*3.1)*.04*v;zz+=fold;
  if(y<.02){zz+=(.02-y)*1.1;y=.02+Math.abs(Math.sin(u*W*7))*.03;}return[x,y,zz];},(u,v)=>[u*W/.9,v*H/.9]);}
function tarpFramed(S,k,x0,x1,y0,y1,z,seed){const W=x1-x0,H=y1-y0;   // stretched in the frame, bellied + creased
 S.grid(k,16,16,(u,v)=>{const b=Math.sin(u*PI)*Math.sin(v*PI);let zz=z+b*.07+Math.sin((u*1.7+v)*W*8+seed)*.012*b+(Math.abs(u-v*.8-.15)<.06?-.02*b:0);return[x0+u*W,y0+v*H,zz];},(u,v)=>[u*W/.9,v*H/.9]);}
// ---- shed at the back right: lap siding front with graffiti, corrugated blue panel, notices, posts, mono-pitch roof
function shed(S,x0,x1,z0,z1,lod){const H=2.3,Hb=2.0,n=10,bh=H/n,W=x1-x0;
 for(let i=0;i<n;i++){const y=i*bh,v0=Math.max(0,1-(y+bh-.75)/1.55),v1=Math.max(0,1-(y-.75)/1.55),tt=.012;   // graffiti on the top 1.55 m
  const V=y<.75?[(i%3)*.33,.92,(i%3)*.33+.33,1]:[0,1-v1,1,1-v0];
  S.q('b2shed',[x0,y,z0+tt+.006],[x1,y,z0+tt+.006],[x1,y+bh+.02,z0+.006],[x0,y+bh+.02,z0+.006],[[V[0],V[1]],[V[2],V[1]],[V[2],V[3]],[V[0],V[3]]],[0,.2,1]);
  S.q('b2shed',[x0,y,z0+.006],[x1,y,z0+.006],[x1,y,z0+tt+.006],[x0,y,z0+tt+.006],[[0,.99],[1,.99],[1,1],[0,1]],[0,-1,0]);}
 for(const sx of[x0,x1])S.box('b2post',sx-.05,sx+.05,0,H+.05,z0-.04,z0+.06,[[0,0,1,.5],[0,.5,1,1],[0,0,1,.5],[0,.5,1,1],[0,0,1,.05],[0,0,1,.05]]);
 S.box('b2shed',x1-.02,x1,0,H,z1,z0,[0,.3,.5,.9]);S.q('b2shed',[x0,0,z1],[x0,0,z0],[x0,Hb,z0],[x0,Hb,z1],[[0,.3],[.6,.3],[.6,.9],[0,.9]],[-1,0,0]);
 S.box('b2board',x0-.1,x1+.05,H+.05,H+.2,z0+.06,z0+.09,[0,0,1,1]);   // fascia
 const rz0=z0+.25,rz1=z1-.1;S.q('b2alu',[x0-.1,H+.12,rz0],[x1+.05,H+.12,rz0],[x1+.05,Hb+.1,rz1],[x0-.1,Hb+.1,rz1],[[0,0],[2,0],[2,2],[0,2]],[0,1,.2]);
 // corrugated blue panel nailed on the left of the front
 const cx0=x0+.08,cx1=x0+.62,cy0=.85,cy1=2.22,nr=lod?8:14;
 S.grid('b2corr',nr*4,1,(u,v)=>[cx0+u*(cx1-cx0),cy0+v*(cy1-cy0),z0+.035+.012*Math.sin(u*nr*2*PI)],(u,v)=>[u,v]);
 // notices: black flyer high right, white typed notice on the corrugated panel's edge, a small sticker
 S.q('b2note',[x0+.86,1.86,z0+.03],[x0+1.08,1.86,z0+.03],[x0+1.08,2.18,z0+.03],[x0+.86,2.18,z0+.03],[[0,0],[.5,0],[.5,1],[0,1]],[0,0,1]);
 S.q('b2note',[x0+.64,1.32,z0+.052],[x0+.82,1.32,z0+.052],[x0+.82,1.56,z0+.052],[x0+.64,1.56,z0+.052],[[.5,0],[1,0],[1,1],[.5,1]],[0,0,1]);
 S.q('b2note',[x0+1.5,1.08,z0+.03],[x0+1.58,1.08,z0+.03],[x0+1.58,1.18,z0+.03],[x0+1.5,1.18,z0+.03],[[.5,.6],[.7,.6],[.7,.85],[.5,.85]],[0,0,1]);}
// ---- green picket fence: posts, two rails, pointed pickets (pentagon prisms)
function fence(S,x0,x1,z,lod){const H=1.3,pw=.075,pt=.02,gap=.05;
 for(const x of[x0,(x0+x1)/2,x1])S.box('b2pick',x-.04,x+.04,0,H-.05,z-.06,z+.02,[[0,0,.2,1],[.2,0,.4,1],[.4,0,.5,1],[.5,0,.6,1],[.6,0,.7,.1],[.6,0,.7,.1]]);
 for(const y of[.22,.78])S.box('b2pick',x0,x1,y,y+.07,z-.045,z-.02,[[0,.1,1,.2],[0,.3,1,.4],[0,0,.1,.1],[0,0,.1,.1],[0,.5,1,.55],[0,.6,1,.65]]);
 let i=0;for(let x=x0+.02;x<x1-pw;x+=pw+gap,i++){const h=H-.02*hs(i,7),u=(i%5)*.2,P=[[x,0],[x+pw,0],[x+pw,h-.06],[x+pw/2,h],[x,h-.06]];
  for(let j=0;j<5;j++){const a=P[j],b=P[(j+1)%5];S.q('b2pick',[a[0],a[1],z],[b[0],b[1],z],[b[0],b[1],z+pt],[a[0],a[1],z+pt],[[u,0],[u+.03,0],[u+.03,.5],[u,.5]]);}
  for(const[zz,o]of[[z+pt,1],[z,-1]]){S.q('b2pick',[x,0,zz],[x+pw,0,zz],[x+pw,h-.06,zz],[x,h-.06,zz],[[u,0],[u+.15,0],[u+.15,1],[u,1]],[0,0,o]);S.tri('b2pick',[x,h-.06,zz],[x+pw,h-.06,zz],[x+pw/2,h,zz],[u,.94],[u+.15,.94],[u+.075,1],[0,0,o]);}}}
export function* barricade144B2(b,lod,POSE,PAL){
 mats2(b.mats);const S=new Q();
 // door slab: hinge edge on the ground, top edge propped on the low pallets (B3 matched to the photo camera: ~55 deg, face to the street)
 const drx=.95,dry=-.06,dO=[.56,DW/2*Math.sin(drx)+DT/2+.012,.56];
 doorSlab(S,lod);
 {const s=S.p;S.p={};for(const[k,v]of Object.entries(s)){const P=v.pos;for(let i=0;i<P.length;i+=3){const q=pose([P[i],P[i+1],P[i+2]],dO,dry,drx);P[i]=q[0];P[i+1]=q[1];P[i+2]=q[2];}S.p[k]=v;}}
 film(S,pose([DL/2-.32,DT/2,-DW/2+.05],dO,dry,drx),-.3,.3,.42,11,.05);film(S,pose([DL/2-.12,DT/2,-DW/2+.3],dO,dry,drx),-1.2,.22,.36,23,.18);
 S.flush(b);b.solid(.56,.56,2.1,.62,dry);yield;
 // stove (front left, angled to the street)
 stove(S,lod);S.flush(b,-2.5,0,.52,.32);b.solid(-2.5,.52,.72,.6,.32);
 // DOOR board on edge on the low left pallet + a plain board on top; hay bale with the bucket behind them
 S.box('b2dboard',-1.25,1.25,0,.24,-.014,.014,[[0,0,1,1],[1,0,0,1],[0,0,.01,1],[0,0,.01,1],[0,0,1,.05],[0,.95,1,1]]);S.flush(b,-1.72,.32,-.22,.02);
 S.box('b2board',-1.15,1.15,0,.035,-.11,.11,[[0,0,1,.15],[0,.85,1,1],[0,0,.02,1],[0,0,.02,1],[0,0,1,1],[0,0,1,1]]);S.flush(b,-1.85,.565,-.32,-.04);
 bale(S);S.flush(b,-2.48,.32,-.78,.12);bucket(S,lod);S.flush(b,-2.5,.68,-.8,.4);
 for(let i=0;i<10;i++)tuft(S,-2.48+(hs(i,1)-.5)*.85,.67,-.78+(hs(i,2)-.5)*.4,.7+hs(i,3)*.6,i);
 for(let i=0;i<16;i++)tuft(S,-2.9+hs(i,4)*1.3,0,.0+hs(i,5)*.75,.6+hs(i,6)*.7,40+i);   // loose hay on the ground left
 S.q('b2hay',[-3,.012,-.1],[-1.6,.012,-.1],[-1.55,.012,.95],[-3,.012,.9],[[0,0],[1.4,0],[1.45,1],[0,1]],[0,1,0]);S.flush(b);yield;
 // white rope over the orange pallet, loose end trailing on the ground
 {let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const bx of PAL.amber.boxes){const q=bx.b;lo=[Math.min(lo[0],q[0]),Math.min(lo[1],q[2]),Math.min(lo[2],q[4])];hi=[Math.max(hi[0],q[1]),Math.max(hi[1],q[3]),Math.max(hi[2],q[5])];}
  const P=POSE.amber,yt=hi[1]+.008,L=[[lo[0]+.25,yt,lo[2]-.005],[lo[0]+.45,yt,lo[2]+.3],[hi[0]-.55,yt,(lo[2]+hi[2])/2+.15],[hi[0]-.3,yt,hi[2]-.05],[hi[0]-.26,yt-.03,hi[2]+.012],[hi[0]-.24,lo[1]+.03,hi[2]+.02]].map(P);
  const e=L.at(-1);L.push([e[0]+.05,.012,e[2]+.15],[e[0]+.25,.01,e[2]+.32],[e[0]+.5,.01,e[2]+.36]);
  const s=L[0];L.unshift([s[0]-.02,s[1]-.12,s[2]-.03]);S.path('b2rope',L,.007,lod?4:6,.25);
  film(S,P([lo[0]+.05,yt,lo[2]+.1]),.9,.2,.35,51,.22);S.flush(b);}
 // back: timber frame with the blue tarp hung and the dark green tarp stretched in it
 const fz=-3.55;for(const x of[-2.5,-.6,.95])S.box('b2post',x-.045,x+.045,0,2.75,fz-.045,fz+.045,[[0,0,.5,1],[.5,0,1,1],[0,0,.5,1],[.5,0,1,1],[0,0,.5,.03],[0,0,.5,.03]]);
 S.box('b2post',-2.6,1.05,2.75,2.84,fz-.045,fz+.045,[[0,0,.5,1],[.5,0,1,1],[0,0,.1,.1],[0,0,.1,.1],[0,0,.5,1],[0,0,.5,1]].map(r=>[r[1],r[0],r[3],r[2]]));
 S.box('b2post',-.6,.95,.35,.42,fz-.03,fz+.03,[.5,0,.9,1]);S.box('b2post',-.6,.95,2.55,2.62,fz-.03,fz+.03,[0,0,.4,1]);
 tarpHung(S,'b2tarpb',-2.45,-.62,2.72,fz+.06,3);tarpFramed(S,'b2tarpg',-.56,.91,.42,2.55,fz+.035,7);
 S.flush(b);b.solid(-.8,fz,3.7,.25);yield;
 // shed (back right) and fence (back left)
 shed(S,1.05,2.98,-3.45,-5.6,lod);S.flush(b);b.solid(2.0,-4.5,1.95,2.15);
 fence(S,-3,-1.5,0,lod);S.flush(b,0,0,-3.42,0);b.solid(-2.25,-3.42,1.5,.12);yield;
 // garbage bags: back left by the fence, one behind the right stack, one squeezed at the front right of the stove
 bag(S,[-2.6,0,-3.12],[.25,.28,.22],3,lod);bag(S,[-1.85,.32,-.72],[.26,.22,.22],9,lod);bag(S,[-2.0,.66,-.95],[.2,.18,.18],17,lod);
 bag(S,[2.6,0,-3.1],[.3,.3,.26],21,lod);bag(S,[-2.85,.32,-.3],[.18,.16,.16],29,lod);S.flush(b);
}

// ======================================================================================================================
// V144 B3: the ground of the photo. A shaped mud sheet (wall to wall in the alley, spilling out over the sidewalk with a
// ragged front edge, slight lumps) with its own seamless texture set b3_mud (base/-n/-r from art-v144/b144b3_mud.png), and
// broken-wood chips + splinters strewn mostly in front of the pile: each chip is the convex outline of one piece segmented
// from the generated chip sheet (brick144-chips-data.js, bc/tools/brick144b3_assets.py), extruded to its thickness, top =
// the piece's own pixels, bottom + sides = its edge colour. Flat on the ground, so no colliders.
let M3=null;
function mats3(m){if(m.b3mud)return;if(!M3){const t=(n,s=true)=>{const q=new T.TextureLoader().load(A+n+'.webp?v=144f');if(s)q.colorSpace=T.SRGBColorSpace;q.anisotropy=4;q.magFilter=T.NearestFilter;q.wrapS=q.wrapT=T.RepeatWrapping;return q;};
 M3={b3mud:new T.MeshStandardMaterial({map:t('b3_mud'),normalMap:t('b3_mud-n',false),roughnessMap:t('b3_mud-r',false),roughness:1,metalness:0,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  b3chip:new T.MeshStandardMaterial({map:t('b3_chip'),normalMap:t('b3_chip-n',false),roughnessMap:t('b3_chip-r',false),roughness:1,metalness:0,vertexColors:true})};
 M3.b3mud.normalScale=new T.Vector2(1.1,1.1);M3.b3mud.name='V144 B3 mud';M3.b3chip.name='V144 B3 chips';}Object.assign(m,M3);}
const MUD_BACK=-6.2,MUD_TILE=1.6;
const mudFront=u=>2.3+.5*Math.sin(u*9.1+.7)+.22*Math.sin(u*23.7+2.1)-1.2*Math.pow(Math.abs(u*2-1),3);   // ragged front edge (frame z)
function mudGround(S,lod){const nu=lod?20:48,nv=lod?14:28;
 S.grid('b3mud',nu,nv,(u,v)=>{const zf=mudFront(u),z=zf+v*(MUD_BACK-zf),out=Math.max(0,z)/Math.max(.1,zf),spread=.45*out*(1+.5*Math.sin(u*17));
  const x=(u*2-1)*(3+spread),lump=.006+.006*(Math.sin(x*5.3+z*3.1)*.5+.5)*(Math.sin(x*11.9-z*7.7)*.5+.5)+.005*(1-out);   // stays 3..17 mm above the paving
  const edge=(u===0||u===1||v===0)?-.004:0;return[x,lump+edge,z];},(u,v)=>{const zf=mudFront(u),z=zf+v*(MUD_BACK-zf),x=(u*2-1)*(3+.45*Math.max(0,z)/Math.max(.1,zf));return[x/MUD_TILE,-z/MUD_TILE];});}
function chip(S,P,o,s,yaw,tilt,th){   // P = convex outline in sheet uv; s = metres per uv unit; o = centre on the ground
 const c=P.reduce((a,p)=>[a[0]+p[0]/P.length,a[1]+p[1]/P.length],[0,0]),cs=Math.cos(yaw),sn=Math.sin(yaw);
 const L=(p,y)=>{const lx=(p[0]-c[0])*s,lz=-(p[1]-c[1])*s,yy=y+lx*tilt;return[o[0]+lx*cs+lz*sn,o[1]+yy,o[2]-lx*sn+lz*cs];};
 const top=P.map(p=>L(p,th)),bot=P.map(p=>L(p,0)),eu=[c[0]+(P[0][0]-c[0])*.85,c[1]+(P[0][1]-c[1])*.85],cc=L(c,th);
 for(let i=0;i<P.length;i++){const j=(i+1)%P.length;S.tri('b3chip',cc,top[i],top[j],c,P[i],P[j],[0,1,0]);
  const e0=[c[0]+(P[i][0]-c[0])*.85,c[1]+(P[i][1]-c[1])*.85],e1=[c[0]+(P[j][0]-c[0])*.85,c[1]+(P[j][1]-c[1])*.85];
  const mid=[(top[i][0]+top[j][0])/2-cc[0],0,(top[i][2]+top[j][2])/2-cc[2]];S.q('b3chip',bot[i],bot[j],top[j],top[i],[e0,e1,e1,e0],mid);}}
export function* barricade144B3(b,lod){
 mats3(b.mats);const S=new Q();mudGround(S,lod);S.flush(b);yield;
 // chips: 3/4 in a fan in front of the pile (z 0.2..2.4, thicker near the door), the rest scattered in the alley; skip under the stove
 const N=lod?50:170;
 for(let i=0;i<N;i++){const p=CHIP144[(hs(i,71)*CHIP144.length)|0],front=i%4!==3;
  let x,z;if(front){const r=hs(i,72);z=.15+Math.pow(r,1.4)*2.2;x=(hs(i,73)*2-1)*(2.9-.25*z)+.4;}else{z=MUD_BACK+.3+hs(i,74)*5.6;x=(hs(i,73)*2-1)*2.8;}
  if(z>mudFront((x/3.4+1)/2)-.1)z=mudFront((x/3.4+1)/2)-.15;if(Math.abs(x+2.5)<.42&&Math.abs(z-.52)<.35)continue;
  const kind=p.k,s=CHIP144_SHEET_M*(kind==='pale'?.75+hs(i,75)*.5:.55+hs(i,75)*.6),th=kind==='pale'?.006+hs(i,76)*.006:.008+hs(i,76)*.012;
  chip(S,p.h,[x,.019,z],s*1.15,hs(i,77)*PI*2,(hs(i,78)-.5)*.12,th);}
 S.flush(b);
}
