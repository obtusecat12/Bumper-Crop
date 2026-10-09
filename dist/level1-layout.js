// Level 1 "Habitable Zone" layout. Pure functions shared by geometry, collision, map and (mirrored in GLSL) lighting.
// Grid: 8 m structural bays, concrete columns at bay corners, partition walls on bay edges.
export const L1_BAY=8,L1_CHUNK=64,L1_H=3.3,L1_COL=.9,L1_WALL=.3;
export function l1Hash(x,z,s){let h=Math.imul((x|0)+65536,0x27d4eb2d)^Math.imul((z|0)+65536,0x165667b1)^Math.imul(s|0,0x9e3779b9);h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return (h>>>8)/16777216;}
// keep the arrival bays open
const clear=(ix,iz)=>ix>=-1&&ix<=1&&iz>=-1&&iz<=1;
// wall along z=iz*8 from x=ix*8..ix*8+8 (between bays (ix,iz-1) and (ix,iz))
export function l1WallX(ix,iz){if(clear(ix,iz)&&clear(ix,iz-1))return false;return l1Hash(ix,iz,2)<.15;}
// wall along x=ix*8 from z=iz*8..iz*8+8 (between bays (ix-1,iz) and (ix,iz))
export function l1WallZ(ix,iz){if(clear(ix,iz)&&clear(ix-1,iz))return false;return l1Hash(ix,iz,3)<.15;}
export function l1Column(ix,iz){return l1Hash(ix,iz,1)>.1||l1WallX(ix,iz)||l1WallX(ix-1,iz)||l1WallZ(ix,iz)||l1WallZ(ix,iz-1);}
export const l1DoorX=(ix,iz)=>l1WallX(ix,iz)&&l1Hash(ix,iz,4)<.22;
export const l1DoorZ=(ix,iz)=>l1WallZ(ix,iz)&&l1Hash(ix,iz,14)<.22;
export const l1Ceiling=(bx,bz)=>l1Hash(bx,bz,5)>.22;
export const l1ColumnTube=(cx,cz)=>l1Column(cx,cz)&&l1Hash(cx,cz,6)>.5;
export const l1ColumnFace=(cx,cz)=>Math.floor(l1Hash(cx,cz,11)*4); // 0:+x 1:-x 2:+z 3:-z
export const l1TubeX=(ix,iz)=>l1WallX(ix,iz)&&!l1DoorX(ix,iz)&&l1Hash(ix,iz,7)>.35;
export const l1TubeZ=(ix,iz)=>l1WallZ(ix,iz)&&!l1DoorZ(ix,iz)&&l1Hash(ix,iz,17)>.35;
export const l1TubeSideX=(ix,iz)=>l1Hash(ix,iz,8)>.5?1:-1;
export const l1TubeSideZ=(ix,iz)=>l1Hash(ix,iz,18)>.5?1:-1;
export const l1TubeOffX=(ix,iz)=>(l1Hash(ix,iz,10)-.5)*4;
export const l1TubeOffZ=(ix,iz)=>(l1Hash(ix,iz,20)-.5)*4;
// GLSL mirror of the above (must stay bit-identical).
export const L1_LAYOUT_GLSL=`
const float L1B=8.0;
float l1h(int x,int z,int s){uint h=(uint(x+65536)*0x27d4eb2du)^(uint(z+65536)*0x165667b1u)^(uint(s)*0x9e3779b9u);h=(h^(h>>15))*0x85ebca6bu;h=(h^(h>>13))*0xc2b2ae35u;h^=h>>16;return float(h>>8)/16777216.0;}
bool l1clear(int x,int z){return x>=-1&&x<=1&&z>=-1&&z<=1;}
bool l1wx(int x,int z){if(l1clear(x,z)&&l1clear(x,z-1))return false;return l1h(x,z,2)<.15;}
bool l1wz(int x,int z){if(l1clear(x,z)&&l1clear(x-1,z))return false;return l1h(x,z,3)<.15;}
bool l1col(int x,int z){return l1h(x,z,1)>.1||l1wx(x,z)||l1wx(x-1,z)||l1wz(x,z)||l1wz(x,z-1);}
bool l1dx(int x,int z){return l1wx(x,z)&&l1h(x,z,4)<.22;}
bool l1dz(int x,int z){return l1wz(x,z)&&l1h(x,z,14)<.22;}
`;
// Floating origin: the scene is drawn relative to O (a multiple of R, so every shader pattern —
// textures, noise, hashed bays — has a period dividing R and nothing shifts on a rebase).
// JS keeps true doubles; only the GPU sees small numbers. Camera is shifted for the render only.
export const L1_REBASE=1600;
export function l1Rebase(scene,R=L1_REBASE){const o={x:0,z:0};let cam=null;
 scene.onBeforeRender=(r,s,c)=>{if(cam||c.userData.l1Virt||c.parent||(o.x===0&&o.z===0))return;cam=c;c.position.x-=o.x;c.position.z-=o.z;c.updateMatrixWorld();};
 scene.onAfterRender=(r,s,c)=>{if(cam!==c)return;c.position.x+=o.x;c.position.z+=o.z;c.updateMatrixWorld();cam=null;};
 return{o,update(x,z){if(Math.abs(x-o.x)<=R*.75&&Math.abs(z-o.z)<=R*.75)return false;o.x=Math.round(x/R)*R;o.z=Math.round(z/R)*R;scene.position.set(-o.x,0,-o.z);scene.updateMatrixWorld();return true;}};}
