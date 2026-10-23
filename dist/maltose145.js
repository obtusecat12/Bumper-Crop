// V145 M1 Maltose Market (麦芽糖市场) — the schoolyard the flea market stands on (ref files/ref-1023-maltose-market.webp).
// Frame: block-local metres of capital block (1,-1) (city x/z minus the block corner; y 0 = block ground; sidewalk top .15).
// Raised yard slab x 60..100, z 12..76 (top .15 = sidewalk level): maroon painted border ring, sage-green court paint,
// two street-side half courts (hoops at the z = 12 street fence, facing the photo camera which looks -z) + two rear half
// courts, worn white lines; 4.2 m black vinyl chain-link fence on pipe posts with top / mid / bottom rails, a double gate
// onto the z = -112 street sidewalk (x 61.2..64.8); four gooseneck hoops (pole, arm, backboard front/back, rim, net). Textures: bc/tools/
// maltose145_m1_assets.py -> assets/l11-v145. Colliders: fence runs, gate leaves, hoop poles. ?malt145=0 off.
import * as T from './vendor/three.module.min.js';
import {MALTOSE145} from './maltose145-layout.js?v=145a';
const A=new URL('./assets/l11-v145/',import.meta.url).href,PI=Math.PI;
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=145a');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
function addMats(m){if(m.m145court)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 M={m145court:S({map:tex('court145'),normalMap:tex('court145-n',false),roughnessMap:tex('court145-r',false),polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),
  m145track:S({map:tex('track145'),normalMap:tex('track145-n',false),roughnessMap:tex('track145-r',false),polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),
  m145line:S({map:tex('line145'),roughness:.8,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),
  m145chain:S({map:tex('chain145'),normalMap:tex('chain145-n',false),roughness:.55,transparent:true,depthWrite:false,side:T.DoubleSide}),   // blended, not alpha-tested: far fence keeps its mip-averaged dark haze like the photo
  m145post:S({side:T.DoubleSide,map:tex('post145'),normalMap:tex('post145-n',false),roughnessMap:tex('post145-r',false),metalness:.35}),
  m145pole:S({map:tex('pole145',true,false),normalMap:tex('pole145-n',false,false),roughnessMap:tex('pole145-r',false,false),metalness:.3}),
  m145board:S({map:tex('board145',true,false),normalMap:tex('board145-n',false,false),roughnessMap:tex('board145-r',false,false)}),
  m145boardb:S({map:tex('boardb145',true,false),roughness:.6,metalness:.4}),
  m145rim:S({side:T.DoubleSide,map:tex('rim145'),roughnessMap:tex('rim145-r',false),metalness:.4}),
  m145net:S({map:tex('net145'),roughness:.9,alphaTest:.4,side:T.DoubleSide})};
 for(const[k,v]of Object.entries(M))v.name='V145 '+k;}Object.assign(m,M);}
// ---- triangle soup per material, flushed into the batch at the end (same pattern as brick144's Soup)
class Soup{constructor(){this.p={};}
 tri(key,a,b,c,ua,ub,uc){const s=this.p[key]||(this.p[key]={pos:[],uv:[]});s.pos.push(...a,...b,...c);s.uv.push(...ua,...ub,...uc);}
 q(key,a,b,c,d,uv){this.tri(key,a,b,c,uv[0],uv[1],uv[2]);this.tri(key,a,c,d,uv[0],uv[2],uv[3]);}
 // horizontal quad facing up, world-planar uv (tile metres)
 up(key,x0,x1,z0,z1,y,tile){const U=(x,z)=>[x/tile,-z/tile];this.q(key,[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],[U(x0,z1),U(x1,z1),U(x1,z0),U(x0,z0)]);}
 // tube between a and b, radius r, n sides; uv u = around (circumference / tu), v = along (length / tv)
 tube(key,a,b,r,n=8,tu=.3,tv=.6,caps=false){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();d.normalize();
  const ref=Math.abs(d.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),e1=new T.Vector3().crossVectors(d,ref).normalize(),e2=new T.Vector3().crossVectors(d,e1);
  const C=2*PI*r/tu,ring=(P,k)=>{const t=k/n*2*PI;return P.clone().addScaledVector(e1,Math.cos(t)*r).addScaledVector(e2,Math.sin(t)*r).toArray();};
  for(let k=0;k<n;k++){const a0=ring(A,k),a1=ring(A,k+1),b0=ring(B,k),b1=ring(B,k+1),u0=k/n*C,u1=(k+1)/n*C;this.q(key,a0,a1,b1,b0,[[u0,0],[u1,0],[u1,L/tv],[u0,L/tv]]);
   if(caps){this.tri(key,B.toArray(),b0,b1,[.5,.5],[.5,0],[.6,0]);this.tri(key,A.toArray(),a1,a0,[.5,.5],[.5,0],[.6,0]);}}}
 // polyline tube (gooseneck arms)
 path(key,P,r,n,tu,tv){for(let i=0;i<P.length-1;i++)this.tube(key,P[i],P[i+1],r*1.0,n,tu,tv);}
 flush(b){for(const[k,s]of Object.entries(this.p)){if(!s.pos.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();b.add(g,k,0,0,0);g.dispose();}this.p={};}
}
const Y0=.15,YT=.153,YC=.156,YL=.159,LW=.05;
// ---- painted line strip along a polyline (closed=false); u along metres, v across
function strip(S,P,w=LW){let u=0;for(let i=0;i<P.length-1;i++){const[x0,z0]=P[i],[x1,z1]=P[i+1],dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz);if(l<1e-6)continue;const nx=-dz/l*w/2,nz=dx/l*w/2;
 S.q('m145line',[x0+nx,YL,z0+nz],[x1+nx,YL,z1+nz],[x1-nx,YL,z1-nz],[x0-nx,YL,z0-nz],[[u,0],[u+l,0],[u+l,1],[u,1]].map(([a,b])=>[a/1,b]));u+=l;}}
function arc(cx,cz,r,a0,a1,step=.3){const n=Math.max(2,Math.ceil(Math.abs(a1-a0)*r/step)),P=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;P.push([cx+Math.sin(a)*r,cz+Math.cos(a)*r]);}return P;}
// half court (FIBA metric): baseline at zb, s = +1 court runs to +z, centre x cx, width 15, half length 14
function halfCourt(S,cx,zb,s){const hw=7.5,zh=zb+s*14,rim=zb+s*1.575;
 strip(S,[[cx-hw,zh],[cx-hw,zb],[cx+hw,zb],[cx+hw,zh],[cx-hw,zh]]);
 const kw=2.45,zf=zb+s*5.8;strip(S,[[cx-kw,zb],[cx-kw,zf],[cx+kw,zf],[cx+kw,zb]]);
 // free-throw circle: solid outside half, dashed inside half
 strip(S,arc(cx,zf,1.8,-PI/2,PI/2).map(([x,z])=>[x,zf+(z-zf)*s]));
 for(let k=0;k<8;k++){const a0=PI/2+k*PI/8,a1=a0+PI/16;strip(S,arc(cx,zf,1.8,a0,a1).map(([x,z])=>[x,zf+(z-zf)*s]));}
 // three-point: straight 0.9 m in from the sidelines, then the 6.75 m arc about the rim
 const dz=Math.sqrt(6.75*6.75-6.6*6.6),ang=Math.asin(6.6/6.75);
 strip(S,[[cx-6.6,zb],[cx-6.6,rim+s*dz]]);strip(S,[[cx+6.6,zb],[cx+6.6,rim+s*dz]]);
 strip(S,arc(cx,rim,6.75,-ang,ang,.25).map(([x,z])=>[x,rim+(z-rim)*s]));
 // restricted-area arc + the centre-circle half at the half line + lane hash marks
 strip(S,arc(cx,rim,1.25,-PI/2,PI/2,.15).map(([x,z])=>[x,rim+(z-rim)*s]));
 strip(S,arc(cx,zh,1.8,PI/2,3*PI/2).map(([x,z])=>[x,zh+(z-zh)*s]));
 for(const sx of[-1,1])for(const d of[1.75,2.6,3.45,4.3]){const x=cx+sx*kw;strip(S,[[x,zb+s*d],[x+sx*.15,zb+s*d]],.05);}}
// ---- fence: runs of [x0,z0,x1,z1]; post spacing ~3 m; chain-link panel both sides (DoubleSide), top + mid + bottom rail
const FH=4.2;
function fenceRun(S,b,x0,z0,x1,z1,lod,{cornerA=true,cornerB=true}={}){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/3)),ux=(x1-x0)/L,uz=(z1-z0)/L;
 for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,end=(i===0&&cornerA)||(i===n&&cornerB),r=end?.05:.032;
  S.tube('m145post',[x,Y0,z],[x,FH+.06,z],r,lod?5:8,.2,.8);if(!lod)S.tube('m145post',[x,FH+.06,z],[x,FH+.1,z],r*.7,lod?5:8,.2,.8,true);   // post + dome cap stub
  b.circle(x,z,r+.03);}
 for(const y of lod?[FH]:[FH,2.1,Y0+.08])S.tube('m145post',[x0,y,z0],[x1,y,z1],y===FH?.021:.017,lod?4:6,.13,.6);
 // the mesh: one quad, 0.6 m tile, slightly off the post line so posts sit on one side as on a real fence
 const ox=-uz*.04,oz=ux*.04;S.q('m145chain',[x0+ox,Y0+.03,z0+oz],[x1+ox,Y0+.03,z1+oz],[x1+ox,FH,z1+oz],[x0+ox,FH,z0+oz],[[0,0],[L/.6,0],[L/.6,(FH-Y0)/.6],[0,(FH-Y0)/.6]]);
 b.solid((x0+x1)/2,(z0+z1)/2,L,.14,Math.atan2(-(z1-z0),x1-x0));}
// gate leaf: pipe frame + mesh, hinge at (hx,hz), width w, swung to angle a (0 = closed along +x)
function gateLeaf(S,b,hx,hz,w,a,lod){const H=2.6,ux=Math.cos(a),uz=-Math.sin(a),P=t=>[hx+ux*w*t,hz+uz*w*t],[ex,ez]=P(1),y0=Y0+.06;
 for(const[x,z]of[[hx,hz],[ex,ez]])S.tube('m145post',[x,y0,z],[x,H,z],.024,lod?4:6,.15,.6);
 for(const y of[y0,H,(y0+H)/2])S.tube('m145post',[hx,y,hz],[ex,y,ez],.02,lod?4:6,.13,.6);
 if(!lod)S.tube('m145post',[hx,y0,hz],[ex,H,ez],.014,5,.1,.6);   // diagonal brace
 S.q('m145chain',[hx,y0,hz],[ex,y0,ez],[ex,H,ez],[hx,H,hz],[[0,0],[w/.6,0],[w/.6,(H-y0)/.6],[0,(H-y0)/.6]]);
 b.solid((hx+ex)/2,(hz+ez)/2,w,.1,a);
 // drop rod + latch fork on the free end
 if(!lod){S.tube('m145post',[ex,y0-.06,ez],[ex,1.3,ez],.009,4,.06,.3);}}
// ---- hoop: pole behind the baseline, gooseneck arm, backboard (front texture / rear sheet / steel edge), rim, net.
// (x, zb) = baseline centre; s = +1 board faces +z (court runs to +z)
function hoop(S,b,x,zb,s,lod){const zBoard=zb+s*1.2,zPole=zb-s*.55,yb=2.9,BW=1.6,BH=1.1,Td=.05,n=lod?6:10;
 S.tube('m145pole',[x,Y0,zPole],[x,3.4,zPole],.06,n,.38,4.5);b.circle(x,zPole,.1);
 // base plate + anchor nuts
 S.tube('m145post',[x,Y0,zPole],[x,Y0+.02,zPole],.16,n,.5,.2,true);
 // gooseneck: bend forward over the baseline to the board's rear bracket
 const arm=[];for(let i=0;i<=(lod?3:7);i++){const t=i/(lod?3:7),a=t*PI/2;arm.push([x,3.4+Math.sin(a)*.45,zPole+s*(1-Math.cos(a))*.45]);}
 arm.push([x,3.85,zBoard-s*(Td+.18)]);S.path('m145pole',arm,.055,n,.35,.6);
 // bracket down the board back + two braces
 S.tube('m145pole',[x,3.85,zBoard-s*(Td+.18)],[x,yb+.25,zBoard-s*(Td+.18)],.04,n,.25,.5);
 for(const dx of[-.45,.45])S.tube('m145pole',[x,3.6,zBoard-s*(Td+.18)],[x+dx,yb+.5,zBoard-s*Td],.02,lod?4:6,.13,.4);
 // board: front face (photo texture), rear face, four steel edges
 const xl=x-BW/2,xr=x+BW/2,yt=yb+BH,zf=zBoard,zr=zBoard-s*Td;
 if(s>0){S.q('m145board',[xl,yb,zf],[xr,yb,zf],[xr,yt,zf],[xl,yt,zf],[[0,0],[1,0],[1,1],[0,1]]);S.q('m145boardb',[xr,yb,zr],[xl,yb,zr],[xl,yt,zr],[xr,yt,zr],[[0,0],[1,0],[1,1],[0,1]]);}
 else{S.q('m145board',[xr,yb,zf],[xl,yb,zf],[xl,yt,zf],[xr,yt,zf],[[0,0],[1,0],[1,1],[0,1]]);S.q('m145boardb',[xl,yb,zr],[xr,yb,zr],[xr,yt,zr],[xl,yt,zr],[[0,0],[1,0],[1,1],[0,1]]);}
 const E=(a,b,c,d,l)=>S.q('m145post',a,b,c,d,[[0,0],[l/.6,0],[l/.6,.08],[0,.08]]);
 const fz=Math.min(zf,zr),bz=Math.max(zf,zr);
 E([xl,yt,bz],[xr,yt,bz],[xr,yt,fz],[xl,yt,fz],BW);E([xl,yb,fz],[xr,yb,fz],[xr,yb,bz],[xl,yb,bz],BW);
 E([xr,yb,bz],[xr,yb,fz],[xr,yt,fz],[xr,yt,bz],BH);E([xl,yb,fz],[xl,yb,bz],[xl,yt,bz],[xl,yt,fz],BH);
 // rim: torus of tube segments, 0.2286 m ring radius, 3.05 m high, plus the bracket plate and net hooks
 const rr=.2286,rz=zf+s*(rr+.15),ry=3.05,K=lod?10:18,ring=k=>[x+Math.sin(k/K*2*PI)*rr,ry,rz+Math.cos(k/K*2*PI)*rr];
 for(let k=0;k<K;k++)S.tube('m145rim',ring(k),ring(k+1),.009,lod?4:5,.06,.15);
 S.tube('m145rim',[x,ry,zf],[x,ry,rz-s*rr],.018,5,.1,.2);for(const dx of[-.08,.08])S.tube('m145rim',[x+dx,ry,zf],[x+dx*.4,ry,rz-s*rr+s*.02],.01,4,.06,.15);
 S.q('m145rim',[x-.13,ry-.12,zf+s*.004],[x+.13,ry-.12,zf+s*.004],[x+.13,ry+.03,zf+s*.004],[x-.13,ry+.03,zf+s*.004],[[0,0],[.5,0],[.5,.3],[0,.3]]);
 if(!lod){const NK=12,r1=.15,h=.42;for(let k=0;k<NK;k++){const a0=k/NK*2*PI,a1=(k+1)/NK*2*PI,P=(a,r,y)=>[x+Math.sin(a)*r,y,rz+Math.cos(a)*r];
  S.q('m145net',P(a0,rr,ry-.01),P(a1,rr,ry-.01),P(a1,r1,ry-h),P(a0,r1,ry-h),[[k/NK,1],[(k+1)/NK,1],[(k+1)/NK,0],[k/NK,0]]);}}}
export function* maltose145Task(b,lod){
 addMats(b.mats);const S=new Soup(),{X0,X1,Z0,Z1,gate}=MALTOSE145;
 // slab: concrete body (sidewalk material) up to .15, border ring + court paint on top
 b.box('sidewalk',(X0+X1)/2,Y0/2,(Z0+Z1)/2,X1-X0,Y0,Z1-Z0);b.walk((X0+X1)/2,(Z0+Z1)/2,X1-X0,Z1-Z0,Y0);
 const cx0=62,cx1=98,cz0=Z0+2,cz1=Z1-2;
 S.up('m145track',X0,X1,cz1,Z1,YT,3);S.up('m145track',X0,X1,Z0,cz0,YT,3);S.up('m145track',X0,cx0,cz0,cz1,YT,3);S.up('m145track',cx1,X1,cz0,cz1,YT,3);
 S.up('m145court',cx0,cx1,cz0,cz1,YC,4);yield;
 // border line between paint fields + the photo's white line along the left track
 strip(S,[[cx0,cz0],[cx0,cz1],[cx1,cz1],[cx1,cz0],[cx0,cz0]],.06);
 for(const cx of[70,90]){halfCourt(S,cx,Z0+2.5,1);halfCourt(S,cx,Z1-2.5,-1);}yield;
 // fence: south (z = -112 street) run with the gate gap, east (x = 224 avenue), north, west (to the inner service court)
 const e=.35,ZG=Z0+e;fenceRun(S,b,X0+e,ZG,gate[0],ZG,lod);fenceRun(S,b,gate[1],ZG,X1-e,ZG,lod);
 fenceRun(S,b,X1-e,ZG,X1-e,Z1-e,lod);fenceRun(S,b,X1-e,Z1-e,X0+e,Z1-e,lod);fenceRun(S,b,X0+e,Z1-e,X0+e,ZG,lod);
 // gate header across the opening (top rail continues) + two leaves swung in against the fence
 S.tube('m145post',[gate[0],FH,ZG],[gate[1],FH,ZG],.021,lod?4:6,.13,.6);S.tube('m145post',[gate[0],2.75,ZG],[gate[1],2.75,ZG],.024,lod?4:6,.13,.6);
 S.q('m145chain',[gate[0],2.75,ZG-.04],[gate[1],2.75,ZG-.04],[gate[1],FH,ZG-.04],[gate[0],FH,ZG-.04],[[0,0],[(gate[1]-gate[0])/.6,0],[(gate[1]-gate[0])/.6,(FH-2.75)/.6],[0,(FH-2.75)/.6]]);
 const gw=(gate[1]-gate[0])/2-.03;gateLeaf(S,b,gate[0]+.06,ZG+.06,gw,-(PI/2+.17),lod);gateLeaf(S,b,gate[1]-.06,ZG+.06,gw,-(PI/2-.17),lod);yield;
 // hoops: the two street-side ones stand at the street fence facing the photo camera (+z); two more at the rear baselines
 for(const cx of[70,90]){hoop(S,b,cx,Z0+2.5,1,lod);hoop(S,b,cx,Z1-2.5,-1,lod);}
 S.flush(b);yield;}
