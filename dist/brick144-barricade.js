// V144 B (notes/spec-1022-capital-landmarks.md B, ref files/ref-1022-street-barricade.webp): a street barricade that closes
// the six-metre service-alley portal of capital block (-3,-1)'s north row (block-local x 53..59, building line z 100, facing
// the z = 0 east-west street ~60 m west of SoHo). B1 = the pallet pile: 36 pallets, each a real board/stringer/block build
// (stringer pallets with notched stringers, block pallets with nine blocks, a ply-topped one) from brick144-pallets-data.js,
// each with its own tile of the b1_pal atlas (bc/tools/brick144b1_assets.py: base + normal + roughness), leaning / stacked /
// standing in the photo's arrangement. Frame: origin = alley mouth centre on the building line, y 0 = alley ground,
// +z = out to the street, x across the alley (walls at |x| = 3). The whole mouth is one collider. ?barr144=0 off.
import * as T from './vendor/three.module.min.js';
import {PAL144,PAL144_ATLAS} from './brick144-pallets-data.js?v=144d';
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
function place(b,[name,x,z,g,ry=0,rx=0,rz=0,spin=0]){
 const geo=palletGeometry(name).clone();_s.makeRotationY(spin);_m.makeRotationFromEuler(_e.set(rx,ry,rz,'YXZ')).multiply(_s);geo.applyMatrix4(_m);
 geo.computeBoundingBox();const bb=geo.boundingBox;geo.translate(x,g-bb.min.y,z);b.add(geo,'b144pal',0,0,0);geo.dispose();}
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
 ['p312',-1.3,.3,0,-.55,-(UP+.36),-.06,0],['pale',2.15,-.35,0,-.05,UP-.12,0,0],['amber',2.45,.3,0,-.12,.32,0,0],
];
export function* barricade144Task(b,lod){
 mats(b.mats);for(let i=0;i<PILE.length;i++){place(b,PILE[i]);if(i%6===5)yield;}
 b.solid(0,-1.1,6.2,3.4);   // the alley is closed wall to wall
}
