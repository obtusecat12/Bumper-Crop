// V147 D1 Maltose Market densify (spec notes/spec-1024-maltose-dense.md) — more stall structure on block (1,-1)'s schoolyard.
// Same block-local frame as maltose145*.js (slab top y .15). Real-shape models, own generated textures
// (bc/tools/maltose147_d1_assets.py <- art-v147 -> assets/l11-v147, baseColor + roughness + normal each):
//  extra pop-up tents (M4 tent()) with hanging canvas side/back curtains; blue poly-tarp canopies on 2x2 timber posts
//  (catenary sag, hemmed edge + grommets, guy ropes to stakes); striped market umbrellas (cast base, pole, 8 ribs +
//  stretchers, sagging panels, scalloped valance, finial); ground stalls = quilt / plaid / moving blankets laid on the court
//  (wrinkled, edges settling onto the slab); slatted produce crates (every slat its own grain crop) stacked as real
//  geometry; kraft cardboard boxes (3 kinds x 6 printed faces, some with open flaps) stacked; hand truck with 2 boxes;
//  black gridwall A-frames + straight panels with peg hooks; bulb string lights between tents (sagging wire, sockets,
//  warm emissive bulbs); 2 more garment racks; more folding tables + cloths (TB147, read by D2/D3 goods); 3 hand-lettered
//  signs. ?malt145=0 off (with the yard). Imports stalls at ?v=147a (goods must import the same).
import * as T from './vendor/three.module.min.js';
import {G,tent,table,garmentRack} from './maltose145-stalls.js?v=147a';
const A=new URL('./assets/l11-v147/',import.meta.url).href,PI=Math.PI,Y0=.15,V='?v=147a';
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp'+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const SIGN=[{"n":"sign_rec","asp":1.89,"u0":0.0,"u1":0.3333,"v0":0.6191,"v1":0.8828},{"n":"sign_blk","asp":1.403,"u0":0.3333,"u1":0.6667,"v0":0.5723,"v1":0.9277},{"n":"sign_bk","asp":1.361,"u0":0.6667,"u1":1.0,"v0":0.5664,"v1":0.9336}];
let M=null;
function addMats(m){if(m.m147tarp)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const tile=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={m147tarp:tile('tarp147',{side:T.DoubleSide}),m147umb:tile('umb147',{side:T.DoubleSide}),m147wood:tile('crate147'),m147card:tile('card147',{side:T.DoubleSide}),
  m147mov:tile('moving147',{side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}),m147plaid:tile('plaid147',{side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}),
  m147quilt:S({map:tex('quilt147',true,false),polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6,normalMap:tex('quilt147-n',false,false),roughnessMap:tex('quilt147-r',false,false),side:T.DoubleSide}),
  m147box:S({map:tex('box147',true,false),normalMap:tex('box147-n',false,false),roughnessMap:tex('box147-r',false,false),side:T.DoubleSide}),
  m147sign:S({map:tex('sign147',true,false),normalMap:tex('sign147-n',false,false),roughness:.8,alphaTest:.5,side:T.DoubleSide}),
  m147grid:S({map:tex('grid147'),normalMap:tex('grid147-n',false),roughness:.55,metalness:.3,alphaTest:.5,side:T.DoubleSide}),
  m147bulb:new T.MeshStandardMaterial({color:0xfff1d0,emissive:0xffc070,emissiveIntensity:1.6,roughness:.25,vertexColors:true})};
 for(const[k,v]of Object.entries(M))v.name='V147 '+k;}Object.assign(m,M);}
const hash=(i)=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const TB147=[];   // [x,z,ry,len,cloth] tables added here (D2/D3 goods)
let g=null;
// local frame helper: O(ox,oy,oz,ry) maps item-local metres to block-local
const O=(ox,oy,oz,ry=0)=>{const c=Math.cos(ry),s=Math.sin(ry);return v=>[ox+v[0]*c+v[2]*s,oy+v[1],oz-v[0]*s+v[2]*c];};
const gr=(key,nu,nv,P,UV,o,tone=1)=>g.grid(key,nu,nv,(u,v)=>o(P(u,v)),UV,tone);
const quad=(key,o,a,b,c,d,uv,tone=1)=>{const L=(p,q,t)=>p.map((x,k)=>x+(q[k]-x)*t);gr(key,1,1,(u,v)=>L(L(a,b,u),L(d,c,u),v),(u,v)=>L(L(uv[0],uv[1],u),L(uv[3],uv[2],u),v),o,tone);};
// square / round bar between two local points
function bar(key,o,a,b,r,{n=4,sq=true,tu=.3,tv=.6,tone=1}={}){g.tube(key,o(a),o(b),r,n,tu,tv,sq,tone);}
// prism box with per-face uv rect fn F(face,u,v) (0 +z,1 -z,2 +x,3 -x,4 top,5 bottom)
function pbox(key,o,c,w,h,d,F,tone=1){const[x,y,z]=c,X0=x-w/2,X1=x+w/2,Y1=y+h,Z0=z-d/2,Z1=z+d/2,Q=(f,a,b,cc,dd,t=tone)=>{const L=(p,q,s)=>p.map((e,i)=>e+(q[i]-e)*s);gr(key,1,1,(u,v)=>L(L(a,b,u),L(dd,cc,u),v),(u,v)=>F(f,u,v),o,t);};
 Q(0,[X0,y,Z1],[X1,y,Z1],[X1,Y1,Z1],[X0,Y1,Z1]);Q(1,[X1,y,Z0],[X0,y,Z0],[X0,Y1,Z0],[X1,Y1,Z0]);Q(2,[X1,y,Z1],[X1,y,Z0],[X1,Y1,Z0],[X1,Y1,Z1]);
 Q(3,[X0,y,Z0],[X0,y,Z1],[X0,Y1,Z1],[X0,Y1,Z0]);Q(4,[X0,Y1,Z1],[X1,Y1,Z1],[X1,Y1,Z0],[X0,Y1,Z0]);Q(5,[X0,y,Z0],[X1,y,Z0],[X1,y,Z1],[X0,y,Z1],tone*.7);}
// ---------------- hanging canvas curtain from a to b (local), top y0 to bottom y1, soft vertical folds; front faces +normal of a->b
function curtain(o,key,a,b,y0,y1,{folds=6,amp=.045,seed=1}={}){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=-dz/L,nz=dx/L,ph=hash(seed)*6;
 gr(key,folds*4,4,(u,v)=>{const w=amp*Math.sin(u*folds*2*PI+ph)*(.25+.75*v)*(u<.02||u>.98?.2:1),bil=.02*v*v;return[a[0]+dx*u+nx*(w+bil),y0+(y1-y0)*v-.015*Math.sin(u*PI)*v,a[1]+dz*u+nz*(w+bil)];},
  (u,v)=>[u*L/1.5,-v*(y0-y1)/1.5],o);}
// tent with curtains: sides = list of edge indices (0 -z, 1 +x, 2 +z, 3 -x in tent-local), gap at the bottom
function tentC(b,x,z,ry,sides,{key='m145canvas',lod}={}){tent(g,b,x,z,ry,{key,lod});if(lod)return;const o=O(x,0,z,ry),h=1.47,E=Y0+2.15;
 const C=[[-h,-h],[h,-h],[h,h],[-h,h]];for(const k of sides){const p=C[k],q=C[(k+1)%4];curtain(o,key,p,q,E-.02,Y0+.12,{seed:x*3+k});}}
// ---------------- blue tarp canopy on four 2x2 posts: w along x, d along z, front (+z) higher; catenary sag, hem + grommets, guy ropes
function tarpCanopy(b,x,z,ry,w,d,{lod=false,seed=1}={}){const o=O(x,0,z,ry),hf=Y0+2.35,hb=Y0+2.05,ov=.12,P=[[-w/2,-d/2,hb],[w/2,-d/2,hb],[w/2,d/2,hf],[-w/2,d/2,hf]];
 for(const[px,pz,ph]of P){pbox('m147wood',o,[px,Y0,pz],.045,ph-Y0+.03,.045,(f,u,v)=>[u*.045/.5+hash(px*7+pz)*.8,v*(ph-Y0)/.5]);
  if(!lod){bar('m145dst',o,[px,Y0+.002,pz-.08],[px,Y0+.002,pz+.08],.025,{tone:.6});}}   // sandbag-ish weight plate
 const H=(u,v)=>hb+(hf-hb)*v,ph=hash(seed)*6,N=lod?4:14;
 gr('m147tarp',N,N,(u,v)=>{const X=(u-.5)*(w+2*ov),Z=(v-.5)*(d+2*ov),inner=Math.sin(PI*u)*Math.sin(PI*v);
   const sag=.16*inner+.025*Math.sin(u*9+ph)*Math.sin(v*7)*inner;const edge=Math.max(Math.abs(u-.5),Math.abs(v-.5))>.5-ov/(w+2*ov)*.9?.03:0;return[X,H(u,v)+.04-sag-edge,Z];},
  (u,v)=>[(u-.5)*(w+2*ov)/1.4,(v-.5)*(d+2*ov)/1.4],o);
 if(lod)return;
 // hem fold-over along front + back edges (drooping lip) and grommets at the post corners + middles
 for(const s of[-1,1]){const zz=s*(d/2+ov),hh=s>0?hf:hb;gr('m147tarp',8,1,(u,v)=>[(u-.5)*(w+2*ov),hh+.04-.03-v*.09-.02*Math.sin(u*PI*5+ph),zz+s*.01*v],(u,v)=>[u*(w+2*ov)/1.4,v*.07],o,.9);
  for(const t of[0,.5,1])g.cyl('m145chr',o([(t-.5)*w,hh+.006,zz-s*.03]),.012,.006,6);}
 // guy ropes from the front corners to stakes
 for(const sx of[-1,1]){const top=[sx*w/2,hf,d/2],st=[sx*(w/2+.35),Y0+.02,d/2+.9];bar('m147wood',o,top,st,.004,{n:3,sq:false,tu:.02,tv:.1,tone:.95});bar('m145dst',o,st,[st[0],Y0+.18,st[2]-.03],.006,{tone:.8});}
 for(const[px,pz]of P){const q=o([px,0,pz]);b.circle(q[0],q[2],.06);}}
// ---------------- striped market umbrella (r 1.3): cast base, pole, 8 ribs + stretchers, sagging panels, scalloped valance, finial
function umbrella(b,x,z,{r=1.3,lod=false,rot=0}={}){const o=O(x,0,z,rot),top=Y0+2.42,rim=Y0+2.02,n=8;
 // base: cast iron disc, profile ring + collar
 g.cyl('m145dst',o([0,Y0,0]),.26,.04,12,.2,.2,.7);g.cyl('m145dst',o([0,Y0+.04,0]),.16,.05,10,.2,.2,.75);g.cyl('m145dst',o([0,Y0+.09,0]),.04,.12,8,.1,.1,.8);
 g.tube('m145chr',o([0,Y0+.05,0]),o([0,top+.06,0]),.019,8,.12,.6);
 if(!lod){g.cyl('m145dst',o([0,Y0+1.62,0]),.03,.07,8);g.tube('m145chr',o([0,Y0+1.25,0]),o([0,Y0+1.25,.09]),.004,4,.03,.05);}   // runner + crank
 const R=(k,rr,y)=>{const a=k/n*2*PI;return[Math.cos(a)*rr,y,Math.sin(a)*rr];};
 for(let k=0;k<n;k++){bar('m145dst',o,[0,top,0],R(k,r,rim),.006,{sq:true});if(!lod)bar('m145dst',o,[0,Y0+1.68,0],R(k,r*.55,top-(top-rim)*.55-.01),.004,{sq:true});
  // panel between rib k and k+1: u along the rim, v from rim (0) to the hub (1); sag between ribs
  gr('m147umb',lod?2:5,lod?2:6,(u,v)=>{const a=(k+u)/n*2*PI,rr=r*(1-v)*(1-.06*Math.sin(PI*u)*(1-v)),y=rim+(top-rim)*v-(.05*Math.sin(PI*u)*Math.sin(PI*Math.min(1,v*1.1)));return[Math.cos(a)*rr,y+.012,Math.sin(a)*rr];},
   (u,v)=>[u*2*PI*r/n/.6,v*r/.6],o);
  if(!lod)gr('m147umb',5,1,(u,v)=>{const a=(k+u)/n*2*PI,sc=.11-.05*Math.abs(Math.sin(u*PI*2));return[Math.cos(a)*r*(1+.01*v),rim+.012-v*sc,Math.sin(a)*r*(1+.01*v)];},(u,v)=>[u*2*PI*r/n/.6,v*.1/.6],o,.92);}
 g.cyl('m147wood',o([0,top+.04,0]),.03,.07,8,.1,.1);if(!lod)g.cyl('m147wood',o([0,top+.11,0]),.018,.04,6,.1,.1);
 const q=o([0,0,0]);b.circle(q[0],q[2],.28);}
// ---------------- ground blanket w x d laid on the court; key quilt (whole image) or tiled; wrinkles, edge settles to the slab
function blanket(x,z,ry,w,d,key,{seed=1,lod=false}={}){const o=O(x,0,z,ry),ph=hash(seed)*6,N=lod?3:16,whole=key==='m147quilt';
 gr(key,N,N,(u,v)=>{const e=Math.min(u,1-u,v,1-v),edge=Math.min(1,e*(Math.min(w,d))/.06);
   const wr=.012*Math.sin(u*11+ph)*Math.sin(v*8+ph*.7)+.008*Math.sin(u*23+v*17+ph);return[(u-.5)*w,Y0+.008+(.014+Math.max(0,wr))*edge,(v-.5)*d];},
  whole?(u,v)=>[u,v]:(u,v)=>[u*w/.9,v*d/.9],o);}
// ---------------- slatted produce crate .5 x .32 (h) x .32 (d), open top, at local c (bottom centre), yaw a
function crate(o,c,a=0,{seed=1,lod=false}={}){const q=(v)=>{const cc=Math.cos(a),ss=Math.sin(a);return o([c[0]+v[0]*cc+v[2]*ss,c[1]+v[1],c[2]-v[0]*ss+v[2]*cc]);};
 const W=.5,H=.3,D=.32,t=.012,sl=.07;let s=seed;const U=(len,ht)=>{const ou=hash(s++)*3,ov=hash(s++)*3;return(f,u,v)=>{const a2=f<2||f>3?len:t,b2=f<4?ht:t;return[ou+u*(f===4||f===5?len:a2)/.5,ov+v*(f===4||f===5?t*4:b2)/.5];};};
 // corner posts
 for(const sx of[-1,1])for(const sz of[-1,1])pbox('m147wood',q,[sx*(W/2-.02),0,sz*(D/2-.02)],.04,H,.04,U(.04,H),.85);
 if(lod){pbox('m147wood',q,[0,0,0],W,H,D,U(W,H),.9);return;}
 // side slats (3 per long side, 2 per short side) with gaps; bottom slats
 for(const sz of[-1,1])for(let k=0;k<3;k++)pbox('m147wood',q,[0,.02+k*(H-.03)/3,sz*(D/2-.006)],W-.005,sl,t,U(W,sl),.95-.05*k);
 for(const sx of[-1,1])for(let k=0;k<2;k++)pbox('m147wood',q,[sx*(W/2-.006),.03+k*(H-.06)/2+.02,0],t,sl+.02,D-.05,(f,u,v)=>[hash(s++)+u*D/.5,v*.09/.5],.9);
 for(let k=0;k<3;k++)pbox('m147wood',q,[0,.004,(k-1)*(D/3)],W-.06,t,sl,U(W,t),.7);}
function crateStack(b,x,z,ry,layout,{lod=false,seed=1}={}){const o=O(x,0,z,ry);let s=seed;   // layout: [[lx,lz,level,yaw],...]
 for(const[lx,lz,lv,a]of layout)crate(o,[lx,Y0+lv*.302,lz],a||0,{seed:s+=17,lod});const q=o([0,0,0]);b.solid(q[0],q[2],1.1,.7,ry);}
// ---------------- kraft cardboard box (kind k 0..2), w x h x d; 6 faces = 6 atlas cells; open: top flaps folded out
function cbox(o,c,w,h,d,k,a=0,{open=false}={}){const q=(v)=>{const cc=Math.cos(a),ss=Math.sin(a);return o([c[0]+v[0]*cc+v[2]*ss,c[1]+v[1],c[2]-v[0]*ss+v[2]*cc]);};
 const cel=(f,u,v)=>[(f+u)/6,1-(k+1-v)/3],MAP=[0,1,2,3,4,5];
 if(!open){pbox('m147box',q,[0,0,0],w,h,d,(f,u,v)=>cel(MAP[f],u,v));return;}
 // walls without lid + 4 flaps opened outward ~ 110 deg; inside = darker
 const X0=-w/2,X1=w/2,Z0=-d/2,Z1=d/2;
 const W4=[[[X0,Z1],[X1,Z1],0],[[X1,Z0],[X0,Z0],1],[[X1,Z1],[X1,Z0],2],[[X0,Z0],[X0,Z1],3]];
 for(const[p0,p1,f]of W4){quad('m147box',q,[p0[0],0,p0[1]],[p1[0],0,p1[1]],[p1[0],h,p1[1]],[p0[0],h,p0[1]],[cel(f,0,0),cel(f,1,0),cel(f,1,1),cel(f,0,1)]);
  quad('m147box',q,[p1[0]*.995,.005,p1[1]*.995],[p0[0]*.995,.005,p0[1]*.995],[p0[0]*.995,h,p0[1]*.995],[p1[0]*.995,h,p1[1]*.995],[cel(5,0,0),cel(5,1,0),cel(5,1,1),cel(5,0,1)],.5);
  // flap: hinged on the top edge, folded out and down (length = half the across depth)
  const nx=(p1[1]-p0[1]),nz=-(p1[0]-p0[0]),nl=Math.hypot(nx,nz),fl=(f<2?d:w)/2*.95,ang=.35;
  const out=[nx/nl*Math.cos(ang)*fl,-Math.sin(ang)*fl,nz/nl*Math.cos(ang)*fl];
  quad('m147box',q,[p0[0],h,p0[1]],[p1[0],h,p1[1]],[p1[0]+out[0],h+out[1],p1[1]+out[2]],[p0[0]+out[0],h+out[1],p0[1]+out[2]],[cel(4,0,.5),cel(4,1,.5),cel(4,1,0),cel(4,0,0)],.95);}
 quad('m147box',q,[X0,.004,Z1],[X1,.004,Z1],[X1,.004,Z0],[X0,.004,Z0],[cel(5,0,0),cel(5,1,0),cel(5,1,1),cel(5,0,1)],.45);}
function boxStack(b,x,z,ry,list,{solid=true}={}){const o=O(x,0,z,ry);for(const[lx,ly,lz,w,h,d,k,a,op]of list)cbox(o,[lx,Y0+ly,lz],w,h,d,k,a||0,{open:op});if(solid){const q=o([0,0,0]);b.solid(q[0],q[2],1,.7,ry);}}
// ---------------- hand truck (nose plate, two uprights + cross bars, axle + 2 rubber wheels) leaning back, carrying boxes
function handTruck(b,x,z,ry){const o=O(x,0,z,ry),lean=.32,cl=Math.cos(lean),sl=Math.sin(lean),U=(lx,t)=>[lx,Y0+.12+t*cl*1.2,-.05-t*sl*1.2];
 for(const sx of[-.18,.18]){bar('m145dst',o,U(sx,0),U(sx,1),.012,{n:6,sq:false,tone:.55});}
 for(const t of[.25,.5,.75])bar('m145dst',o,U(-.18,t),U(.18,t),.008,{n:6,sq:false,tone:.55});
 bar('m145chr',o,U(-.2,1),U(.2,1),.013,{n:6,sq:false});   // handle
 quad('m145dst',o,[-.2,Y0+.012,.2],[.2,Y0+.012,.2],[.2,Y0+.012,-.03],[-.2,Y0+.012,-.03],[[0,0],[.4/.3,0],[.4/.3,.23/.3],[0,.23/.3]],.65);   // nose plate
 bar('m145dst',o,[-.26,Y0+.12,-.1],[.26,Y0+.12,-.1],.01,{n:6,sq:false,tone:.5});
 for(const sx of[-.26,.26]){g.tube('m145dst',o([sx-.03,Y0+.12,-.1]),o([sx+.03,Y0+.12,-.1]),.12,12,.3,.2,false,.32);for(const e of[-1,1])g.grid('m145dst',12,1,(u,v)=>o([sx+e*.03,Y0+.12+Math.sin(u*2*PI)*.12*(1-v*.6),-.1+Math.cos(u*2*PI)*.12*(1-v*.6)]),(u,v)=>[u,v],v=>.3+.5*0);}
 // two boxes on the plate, leaning with the frame
 const ob=v=>{const y=v[1]-Y0-.015,zz=v[2];return o([v[0],Y0+.015+y*cl+(zz-.09)*sl*0,zz-y*sl]);};
 cbox(ob,[0,Y0+.015,.09],.42,.32,.24,2);cbox(ob,[0,Y0+.335,.09],.38,.28,.22,0,.06);
 const q=o([0,0,0]);b.solid(q[0],q[2],.6,.55,ry);}
// ---------------- gridwall: straight panel w x h on T-legs, or A-frame pair; peg hooks (D2/D3 hang goods on them)
function gridPanel(o,x0,x1,ylo,yhi,zf,tilt=0){const A=[x0,ylo,zf],B=[x1,ylo,zf],Cc=[x1,yhi,zf-tilt],D=[x0,yhi,zf-tilt],w=x1-x0,h=yhi-ylo;
 quad('m147grid',o,A,B,Cc,D,[[0,0],[w/.3,0],[w/.3,h/.3],[0,h/.3]]);
 for(const[p,q2]of[[A,B],[B,Cc],[Cc,D],[D,A]])bar('m145dst',o,p,q2,.009,{n:6,sq:false,tone:.4});}
function gridwall(b,x,z,ry,{w=1.2,h=1.83,aframe=false,hooks=true,lod=false,seed=1}={}){const o=O(x,0,z,ry),hooksAt=[];
 if(aframe){const sp=.42;for(const s of[-1,1]){const zf=s*sp;gridPanel(o,-w/2,w/2,Y0+.03,Y0+h,zf,zf*.92);bar('m145dst',o,[-w/2,Y0+.02,zf],[w/2,Y0+.02,zf],.012,{tone:.4});}
  bar('m145chr',o,[-w/2,Y0+h,.03],[w/2,Y0+h,-.03],.005,{n:4,sq:false});}
 else{gridPanel(o,-w/2,w/2,Y0+.12,Y0+h,0);for(const sx of[-w/2,w/2])bar('m145dst',o,[sx,Y0+.01,-.32],[sx,Y0+.01,.32],.018,{tone:.4});}
 if(hooks&&!lod){const rows=aframe?[[.42,.6],[.42,1.15],[.42,1.55]]:[[0,.55],[0,1.0],[0,1.45]];let s=seed;
  for(const[zf,yy]of rows)for(let i=0;i<3;i++){const lx=-w/2+.2+i*(w-.4)/2+(hash(s++)-.5)*.08,zz=aframe?zf-(yy/h)*zf*.92:0;
   for(const side of aframe?[1,-1]:[1]){const z0=side*(aframe?Math.abs(zz):0),dir=side;bar('m145chr',o,[lx,Y0+yy,z0],[lx,Y0+yy-.02,z0+dir*.17],.0025,{n:3,sq:false,tu:.02,tv:.1});
    bar('m145chr',o,[lx,Y0+yy-.02,z0+dir*.17],[lx,Y0+yy+.01,z0+dir*.19],.0025,{n:3,sq:false,tu:.02,tv:.1});hooksAt.push(o([lx,Y0+yy-.02,z0+dir*.15]));}}}
 const q=o([0,0,0]);b.solid(q[0],q[2],w+.05,aframe?.9:.65,ry);return hooksAt;}
// ---------------- bulb string light: sagging wire a->b (block-local), socket + bulb every sp metres
function lights(a,b2,{sag=.3,sp=.5,lod=false}={}){const N=14,P=t=>[a[0]+(b2[0]-a[0])*t,a[1]+(b2[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b2[2]-a[2])*t];
 for(let i=0;i<N;i++)g.tube('m145dst',P(i/N),P((i+1)/N),.0035,3,.02,.2,false,.4);
 const L=Math.hypot(b2[0]-a[0],b2[2]-a[2]),n=Math.max(2,Math.floor(L/sp));if(lod)return;
 for(let k=1;k<n;k++){const p=P(k/n);g.cyl('m145dst',[p[0],p[1]-.05,p[2]],.011,.05,6,.05,.05,.35);
  const prof=[[0,0],[.022,.006],[.032,.024],[.03,.04],[.016,.052],[.011,.056]];
  g.grid('m147bulb',8,prof.length-1,(u,v)=>{const pr=prof[Math.round(v*(prof.length-1))],an=u*2*PI;return[p[0]+Math.cos(an)*pr[0],p[1]-.05-.056+pr[1],p[2]+Math.sin(an)*pr[0]];},(u,v)=>[u,v]);}}
// ---------------- hand-lettered sign card on a stake / taped; i into SIGN; c centre, width w, yaw ry
function sign(i,c,w,ry,{stake=0,rz=0,curl=.02}={}){const S=SIGN[i],h=w/S.asp,cs=Math.cos(ry),sn=Math.sin(ry),cr=Math.cos(rz),sr=Math.sin(rz),dv=S.v1-S.v0;
 for(const back of[0,1])g.grid('m147sign',5,5,(u,v)=>{const lx=(u-.5)*w,ly=(v-.5)*h,lz=curl*Math.pow(2*u-1,2)-(back?.002:0),rx=lx*cr-ly*sr,rY=lx*sr+ly*cr;return[c[0]+rx*cs+lz*sn,c[1]+rY,c[2]-rx*sn+lz*cs];},
  (u,v)=>[S.u0+(back?1-u:u)*(S.u1-S.u0),(back?S.v0-.5:S.v0)+v*dv]);
 if(stake)g.tube('m147wood',[c[0]-sn*.01,c[1]-h/2-stake,c[2]-cs*.01],[c[0]-sn*.01,c[1]+h*.3,c[2]-cs*.01],.008,4,.05,.3,true);}
// ======================================================================== layout
const RF=-12*PI/180;
export function* maltose147StallsTask(b,lod){addMats(b.mats);g=new G();TB147.length=0;
 const tb=(x,z,r,l,c)=>{TB147.push([x,z,r,l,c]);table(g,b,x,z,r,{len:l,cloth:c,seed:TB147.length*7+3,lod,drop:c==='p'?.62:.55});};
 // --- deep field: 5 more tents (2 with canvas back/side curtains), a table under each
 const TENTS=[[77.2,23.4,RF,[0]],[62.9,30.4,RF+.08,[0,3]],[90.1,15.2,RF-.05,[]],[93.4,33.0,-PI/2+RF,[1,2]],[93.6,23.0,-PI/2+RF,[0]]];
 TENTS.forEach(([x,z,r,sd],k)=>{tentC(b,x,z,r,sd,{lod});tb(x+.05,z+.5,r,1.83,['w','r','p','w','r'][k]);});yield;
 // --- blue tarp canopies: left aisle (over 2 tables) and behind the camera
 tarpCanopy(b,66.6,47.2,PI/2,4.2,3.0,{lod,seed:3});tb(67.4,46.0,PI/2,2.44,'w');tb(65.6,47.6,PI/2,1.83,null);
 tarpCanopy(b,86.0,69.0,PI,3.6,2.8,{lod,seed:5});tb(86.0,68.4,PI,2.44,'r');
 // --- umbrellas with a table each (right corner, the rear yard, mid-left)
 umbrella(b,95.6,42.2,{lod,rot:.3});tb(95.4,41.2,-PI/2,1.22,'w');
 umbrella(b,70.6,68.8,{lod,rot:.1});tb(70.6,68.0,PI,1.83,'p');
 umbrella(b,69.6,38.6,{lod,rot:.6});yield;
 // --- ground stalls on blankets (mid band between the tents and the near tables, left aisle, rear yard)
 blanket(79.1,43.0,RF,2.0,1.45,'m147quilt',{seed:1,lod});blanket(82.5,42.3,RF+.1,1.8,1.4,'m147plaid',{seed:2,lod});
 blanket(69.4,40.1,.3,1.9,1.5,'m147mov',{seed:3,lod});blanket(77.9,70.6,PI+.05,2.1,1.6,'m147plaid',{seed:4,lod});blanket(91.8,46.6,-PI/2,1.9,1.3,'m147mov',{seed:5,lod});
 if(!lod){sign(1,[80.6,Y0+.62,43.75],.42,RF,{stake:.45});sign(0,[68.35,Y0+.98,47.6],.36,PI/2,{stake:.8,curl:.01});}
 // --- crate stacks (real slats) and cardboard box stacks
 crateStack(b,69.8,52.4,PI/2+.1,[[-.26,0,0,.02],[.26,0,0,-.03],[-.24,0,1,.05],[.27,0,1,0],[0,.01,2,-.08]],{lod,seed:11});
 crateStack(b,92.2,29.6,.2,[[-.26,0,0,0],[.26,0,0,.04],[0,.0,1,-.06]],{lod,seed:23});
 crateStack(b,80.6,68.4,PI+.3,[[-.26,0,0,0],[.26,0,0,0],[.26,.4,0,.5],[-.24,0,1,.03]],{lod,seed:37});
 crateStack(b,64.4,35.0,.7,[[0,0,0,0],[0,.02,1,.1]],{lod,seed:41});
 boxStack(b,63.4,54.8,.25,[[0,0,0,.6,.42,.42,0],[.66,0,.04,.5,.36,.36,2,.1],[.05,.42,0,.55,.4,.4,1,-.08],[.65,.36,.02,.46,.32,.34,2,.12,true]]);
 boxStack(b,90.4,36.6,-.4,[[0,0,0,.55,.38,.4,1],[0,.38,0,.5,.34,.38,0,.15,true]]);
 boxStack(b,89.6,71.2,.15,[[0,0,0,.6,.42,.42,2],[.64,0,0,.6,.42,.42,0,.05],[.32,.42,0,.55,.38,.4,1,-.1]]);
 if(!lod){handTruck(b,71.2,44.6,PI/2+.5);handTruck(b,88.0,66.2,-.4);}yield;
 // --- gridwalls (A-frame mid band, straight panels behind the left row + by the right tents)
 gridwall(b,85.6,42.4,RF,{aframe:true,lod,seed:2});gridwall(b,72.3,33.6,PI/2,{lod,seed:5});gridwall(b,91.9,26.6,-PI/2,{w:1.5,lod,seed:9});gridwall(b,83.2,66.0,0,{w:1.2,lod,seed:13});
 // --- more tables to thicken the far field and the rear yard
 tb(81.6,39.0,RF,1.83,'w');tb(84.6,38.3,RF,1.83,'r');tb(66.0,26.0,RF+PI/2,2.44,'w');tb(96.5,36.0,-PI/2,1.83,'p');tb(75.0,66.4,PI,2.44,'w');tb(92.5,62.8,PI+.2,1.83,'r');
 if(!lod)sign(2,[81.6+.55,Y0+.92,39.0-.05],.24,RF,{stake:.17});yield;
 // --- 2 more garment racks (the M4 garments, other orders)
 garmentRack(g,b,90.6,39.6,-PI/2+.3,[4,6,0,2,7,3,5],{lod});garmentRack(g,b,73.8,62.6,PI/2,[3,1,7,5,0,6,2,4],{lod});yield;
 // --- string lights: tent eaves / peaks across the deep field and along the tarp
 if(!lod){const E=Y0+2.18,PK=Y0+2.9;
  lights([74.4,PK,37.4],[79.6,PK,30.2],{sag:.35});lights([79.6,PK,30.2],[84.9,PK,32.2],{sag:.3});lights([84.9,PK,32.2],[88.3,PK,24.8],{sag:.35});
  lights([68.6,PK,29.6],[74.4,PK,37.4],{sag:.4});lights([77.2,PK,23.4],[79.6,PK,30.2],{sag:.3});lights([88.3,PK,24.8],[93.6,PK,23.0],{sag:.3});lights([88.3,PK,24.8],[93.4,PK,33.0],{sag:.4});
  lights([68.0,Y0+2.22,45.2],[68.0,Y0+2.22,49.2],{sag:.14,sp:.45});
  lights([84.3,Y0+2.22,67.65],[87.7,Y0+2.22,67.65],{sag:.14,sp:.45});}
 g.flush(b);yield;}
