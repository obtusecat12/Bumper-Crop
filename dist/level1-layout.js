// Level 1 "Habitable Zone" layout. Pure functions shared by geometry, collision, map and (mirrored in GLSL) lighting.
// Grid: 8 m structural bays, concrete columns at bay corners, partition walls on bay edges.
export const L1_BAY=8,L1_CHUNK=64,L1_H=3.3,L1_COL=.9,L1_WALL=.3;
export function l1Hash(x,z,s){let h=Math.imul((x|0)+65536,0x27d4eb2d)^Math.imul((z|0)+65536,0x165667b1)^Math.imul(s|0,0x9e3779b9);h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return (h>>>8)/16777216;}
// keep the arrival bays open
const clear=(ix,iz)=>ix>=-1&&ix<=1&&iz>=-1&&iz<=1;
// wall along z=iz*8 from x=ix*8..ix*8+8 (between bays (ix,iz-1) and (ix,iz))
// long "run" walls: a few grid lines carry 64 m runs of corrugated wall lined with tubes (Aquila photo), one gap bay per run
const SH=1048576;
export function l1RunX(ix,iz){if(clear(ix,iz)&&clear(ix,iz-1))return false;if(l1Hash(0,iz,90)>=.1)return false;const g=(ix+SH)>>3;return l1Hash(g,iz,91)<.65&&((ix+SH)&7)!==Math.floor(l1Hash(g,iz,92)*8);}
export function l1RunZ(ix,iz){if(clear(ix,iz)&&clear(ix-1,iz))return false;if(l1Hash(ix,0,93)>=.1)return false;const g=(iz+SH)>>3;return l1Hash(ix,g,94)<.65&&((iz+SH)&7)!==Math.floor(l1Hash(ix,g,95)*8);}
export const l1RunSideX=iz=>l1Hash(0,iz,96)>.5?1:-1, l1RunSideZ=ix=>l1Hash(ix,0,97)>.5?1:-1;
export function l1WallX(ix,iz){if(clear(ix,iz)&&clear(ix,iz-1))return false;return l1Hash(ix,iz,2)<.15||l1RunX(ix,iz);}
// wall along x=ix*8 from z=iz*8..iz*8+8 (between bays (ix-1,iz) and (ix,iz))
export function l1WallZ(ix,iz){if(clear(ix,iz)&&clear(ix-1,iz))return false;return l1Hash(ix,iz,3)<.15||l1RunZ(ix,iz);}
// low (1.15 m) concrete partitions: collision + geometry only, they do not occlude light
export const l1LowX=(ix,iz)=>!l1WallX(ix,iz)&&!(clear(ix,iz)&&clear(ix,iz-1))&&l1Hash(ix,iz,98)<.07;
export const l1LowZ=(ix,iz)=>!l1WallZ(ix,iz)&&!(clear(ix,iz)&&clear(ix-1,iz))&&l1Hash(ix,iz,99)<.07;
export function l1Column(ix,iz){return l1Hash(ix,iz,1)>.1||l1WallX(ix,iz)||l1WallX(ix-1,iz)||l1WallZ(ix,iz)||l1WallZ(ix,iz-1);}
export const l1DoorX=(ix,iz)=>l1WallX(ix,iz)&&!l1RunX(ix,iz)&&l1Hash(ix,iz,4)<.22;
export const l1DoorZ=(ix,iz)=>l1WallZ(ix,iz)&&!l1RunZ(ix,iz)&&l1Hash(ix,iz,14)<.22;
export const l1Ceiling=(bx,bz)=>l1Hash(bx,bz,5)>.22;
export const l1ColumnTube=(cx,cz)=>l1Column(cx,cz)&&l1Hash(cx,cz,6)>.5;
export const l1ColumnFace=(cx,cz)=>Math.floor(l1Hash(cx,cz,11)*4); // 0:+x 1:-x 2:+z 3:-z
export const l1TubeX=(ix,iz)=>l1WallX(ix,iz)&&!l1RunX(ix,iz)&&!l1DoorX(ix,iz)&&l1Hash(ix,iz,7)>.35;
export const l1TubeZ=(ix,iz)=>l1WallZ(ix,iz)&&!l1RunZ(ix,iz)&&!l1DoorZ(ix,iz)&&l1Hash(ix,iz,17)>.35;
export const l1TubeSideX=(ix,iz)=>l1Hash(ix,iz,8)>.5?1:-1;
export const l1TubeSideZ=(ix,iz)=>l1Hash(ix,iz,18)>.5?1:-1;
export const l1TubeOffX=(ix,iz)=>(l1Hash(ix,iz,10)-.5)*4;
export const l1TubeOffZ=(ix,iz)=>(l1Hash(ix,iz,20)-.5)*4;

// ---- sectors (wiki: Aquila default, Gild, Gothic). One low-frequency value noise over 256 m lattice cells,
// integer-only (smoothstep weights in fixed point) so JS and GLSL agree bit for bit. High → Gild, low → Gothic;
// they can never touch (always an Aquila band between), and the arrival stays Aquila.
export const L1_SEC_G=.7,L1_SEC_O=.27;
const sb=(x,z,s)=>Math.floor(l1Hash(x,z,s)*256);
export function l1SecV(bx,bz){const X=bx+SH,Z=bz+SH,gx=X>>5,gz=Z>>5,fx=X&31,fz=Z&31,wx=(fx*fx*(96-2*fx))>>10,wz=(fz*fz*(96-2*fz))>>10;
 const a=sb(gx,gz,301),b=sb(gx+1,gz,301),c=sb(gx,gz+1,301),d=sb(gx+1,gz+1,301);return((a*(32-wx)+b*wx)*(32-wz)+(c*(32-wx)+d*wx)*wz)/261120;}
// 0 Aquila, 1 Gild, 2 Gothic
export function l1Sector(bx,bz){if(bx>=-2&&bx<=2&&bz>=-2&&bz<=2)return 0;const v=l1SecV(bx,bz);return v>L1_SEC_G?1:v<L1_SEC_O?2:0;}
export const L1_SEC_H=[3.3,5.6,4.25];

// ---- Level 2 thresholds: at most one per 512 m lattice cell (64 bays), hashed; site kept 12 bays inside its cell
// so a point only ever needs its own cell. p rises 0→1 from 80 m out to the maintenance door at the core.
export const L1_THR_R0=10,L1_THR_R1=80;
export function l1ThrSite(bx,bz){const gx=(bx+SH)>>6,gz=(bz+SH)>>6;if(l1Hash(gx,gz,320)>=.4)return null;
 const sx=gx*64-SH+12+Math.floor(l1Hash(gx,gz,321)*40),sz=gz*64-SH+12+Math.floor(l1Hash(gx,gz,322)*40);if(Math.abs(sx)<14&&Math.abs(sz)<14)return null;return{bx:sx,bz:sz,x:sx*8+4,z:sz*8+4,id:gx+':'+gz};}
export function l1Thr(x,z){const s=l1ThrSite(Math.floor(x/8),Math.floor(z/8));if(!s)return 0;const d=Math.hypot(x-s.x,z-s.z),t=Math.max(0,Math.min(1,(L1_THR_R1-d)/(L1_THR_R1-L1_THR_R0)));return t*t*(3-2*t);}
// GLSL mirror of the above (must stay bit-identical).
export const L1_LAYOUT_GLSL=`
const float L1B=8.0;
float l1h(int x,int z,int s){uint h=(uint(x+65536)*0x27d4eb2du)^(uint(z+65536)*0x165667b1u)^(uint(s)*0x9e3779b9u);h=(h^(h>>15))*0x85ebca6bu;h=(h^(h>>13))*0xc2b2ae35u;h^=h>>16;return float(h>>8)/16777216.0;}
bool l1clear(int x,int z){return x>=-1&&x<=1&&z>=-1&&z<=1;}
bool l1rx(int x,int z){if(l1clear(x,z)&&l1clear(x,z-1))return false;if(l1h(0,z,90)>=.1)return false;int g=(x+1048576)>>3;return l1h(g,z,91)<.65&&((x+1048576)&7)!=int(floor(l1h(g,z,92)*8.0));}
bool l1rz(int x,int z){if(l1clear(x,z)&&l1clear(x-1,z))return false;if(l1h(x,0,93)>=.1)return false;int g=(z+1048576)>>3;return l1h(x,g,94)<.65&&((z+1048576)&7)!=int(floor(l1h(x,g,95)*8.0));}
bool l1wx(int x,int z){if(l1clear(x,z)&&l1clear(x,z-1))return false;return l1h(x,z,2)<.15||l1rx(x,z);}
bool l1wz(int x,int z){if(l1clear(x,z)&&l1clear(x-1,z))return false;return l1h(x,z,3)<.15||l1rz(x,z);}
bool l1col(int x,int z){return l1h(x,z,1)>.1||l1wx(x,z)||l1wx(x-1,z)||l1wz(x,z)||l1wz(x,z-1);}
bool l1dx(int x,int z){return l1wx(x,z)&&!l1rx(x,z)&&l1h(x,z,4)<.22;}
bool l1dz(int x,int z){return l1wz(x,z)&&!l1rz(x,z)&&l1h(x,z,14)<.22;}
int l1sb(int x,int z,int s){return int(floor(l1h(x,z,s)*256.0));}
float l1secv(int bx,int bz){int X=bx+1048576,Z=bz+1048576,gx=X>>5,gz=Z>>5,fx=X&31,fz=Z&31,wx=(fx*fx*(96-2*fx))>>10,wz=(fz*fz*(96-2*fz))>>10;
 int a=l1sb(gx,gz,301),b=l1sb(gx+1,gz,301),c=l1sb(gx,gz+1,301),d=l1sb(gx+1,gz+1,301);return float((a*(32-wx)+b*wx)*(32-wz)+(c*(32-wx)+d*wx)*wz)/261120.0;}
int l1sec(int bx,int bz){if(bx>=-2&&bx<=2&&bz>=-2&&bz<=2)return 0;float v=l1secv(bx,bz);return v>.7?1:v<.27?2:0;}
// continuous version for shading blends (float weights), bf = global bay coordinate
float l1secf(vec2 bf){ivec2 ib=ivec2(floor(bf));vec2 fr=fract(bf);int X=ib.x+1048576,Z=ib.y+1048576,gx=X>>5,gz=Z>>5;vec2 f=(vec2(float(X&31),float(Z&31))+fr)/32.0;f=f*f*(3.0-2.0*f);
 float a=float(l1sb(gx,gz,301)),b=float(l1sb(gx+1,gz,301)),c=float(l1sb(gx,gz+1,301)),d=float(l1sb(gx+1,gz+1,301));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y)/255.0;}
float l1thr(vec2 bf){ivec2 ib=ivec2(floor(bf));int gx=(ib.x+1048576)>>6,gz=(ib.y+1048576)>>6;if(l1h(gx,gz,320)>=.4)return 0.0;
 int sx=gx*64-1048576+12+int(floor(l1h(gx,gz,321)*40.0)),sz=gz*64-1048576+12+int(floor(l1h(gx,gz,322)*40.0));if(abs(sx)<14&&abs(sz)<14)return 0.0;
 vec2 d=(bf-vec2(float(sx),float(sz))-.5)*8.0;return smoothstep(0.0,1.0,clamp((80.0-length(d))/70.0,0.0,1.0));}
`;
// Floating origin: the scene is drawn relative to O (a multiple of R, so every shader pattern —
// textures, noise, hashed bays — has a period dividing R and nothing shifts on a rebase).
// JS keeps true doubles; only the GPU sees small numbers. Camera is shifted for the render only.
export const L1_REBASE=1600;
export function l1Rebase(scene,R=L1_REBASE){const o={x:0,z:0};let cam=null;
 scene.onBeforeRender=(r,s,c)=>{if(cam||c.userData.l1Virt||c.parent||(o.x===0&&o.z===0))return;cam=c;c.position.x-=o.x;c.position.z-=o.z;c.updateMatrixWorld();};
 scene.onAfterRender=(r,s,c)=>{if(cam!==c)return;c.position.x+=o.x;c.position.z+=o.z;c.updateMatrixWorld();cam=null;};
 return{o,update(x,z){if(Math.abs(x-o.x)<=R*.75&&Math.abs(z-o.z)<=R*.75)return false;o.x=Math.round(x/R)*R;o.z=Math.round(z/R)*R;scene.position.set(-o.x,0,-o.z);scene.updateMatrixWorld();return true;}};}
