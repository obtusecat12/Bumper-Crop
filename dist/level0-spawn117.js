// V117 · Level 0 spawn: a fixed authored replica of the classic Backrooms photograph (files/level0-spawn-ref.webp).
// Local frame: camera C, u = right (+x), v = forward (−z). The photo camera stands ~1.5 m high, pitched ~15° down,
// vertical FOV ~64° at 4:3. Two foreground partitions frame a 1.6 m gap: dotted paper with a low oak bumper rail on
// the left, yellow arrow-chevron paper with one outlet on the right. Through the gap: a wide open bay lit by one
// row of troffers, an inside corner on the far left and a recessed back wall on the right.
// Lamps snap to the Level 0 ceiling slot grid (x ≡ .6 mod 1.2, z ≡ .3 mod .6), so C sits on that grid.
export const SPAWN_C={x:-169.2,z:45.0}; // V117b: moved +.6 so the troffer row can sit at u=-1.8 as in the photo
const C=SPAWN_C,T=.15,H=2.72;
const X=u=>C.x+u,Z=v=>C.z-v;
export const SPAWN_REGION={id:'spawn117',type:'classic',x0:X(-10),x1:X(10.5),z0:Z(13.6),z1:Z(-4.5)};
export const inSpawn=(x,z,p=0)=>x>SPAWN_REGION.x0-p&&x<SPAWN_REGION.x1+p&&z>SPAWN_REGION.z0-p&&z<SPAWN_REGION.z1+p;
// V117b layout, solved from the photo by back-projecting floor contacts (camera 1.5 m, pitch −.265, vfov 64.6°, yaw .14):
// left partition end u=−1.62/v≈1.85, right partition edge u=.08/v≈1.78, far-left lit side wall u≈−5.3 from v 7.0,
// the pin-stripe partition running from that corner (−5.3,10.9) at ~29° to its free end (−1.04,8.52), back wall v≈12.9.
// The pin-stripe partition is the one rotated wall (ry); collision/occlusion understand ry, AO decals skip it.
// wall along u (faces ±v) or along v (faces ±u); mat 3 = chevron, 4 = pin-dot, 6 = pin-stripe
const WU=(u0,u1,v,mat,id)=>({x:X((u0+u1)/2),z:Z(v+T/2),w:u1-u0,d:T,mat,id});
const WV=(v0,v1,u,mat,id)=>({x:X(u-T/2),z:Z((v0+v1)/2),w:T,d:v1-v0,mat,id});
const WR=(u0,v0,u1,v1,mat,id)=>{const du=u1-u0,dv=v1-v0,L=Math.hypot(du,dv),nu=dv/L,nv=-du/L,s=nv<0?1:-1;// shift half the thickness away from the camera side
 return{x:X((u0+u1)/2-s*nu*T/2),z:Z((v0+v1)/2-s*nv*T/2),w:L+.12,d:T,ry:Math.atan2(dv,du),mat,id};};
// V119: user rule — right-angle partitions only (the photo's slightly skewed far partition is squared up), and a
// single thin wood bumper rail on the left partition; no other rails.
const CU=-5.0,SV=10.2,EU=-1.55,BV=12.9;
export const SPAWN_WALLS=[
 WU(-6.5,-1.62,1.85,4,'left-front'),       // left partition (dots), end face at u=-1.62
 WU(0.08,6.5,1.78,3,'right-front'),        // right partition (chevron)
 WV(-3.2,1.85,-6.5,4,'near-left'),         // camera room: left side, back
 WV(-3.2,1.78,6.5,4,'near-right'),
 WU(-6.5,6.5,-3.2,4,'near-back'),
 WV(7.0,SV+T,CU,4,'bay-left-side'),        // lit side wall on the far left (its near end is a free end)
 WU(CU,EU,SV,6,'bay-stripe'),              // pin-stripe partition facing the camera, square to the side wall
 WU(CU,9.6,BV,4,'bay-back'),               // deep back wall seen past the partition's free end
 WV(4.6,BV,9.6,4,'bay-right'),
 WV(1.85,BV,-9.6,4,'dark-left'),           // unlit room behind the far-left wall (the dark strip in the photo)
 WU(-9.6,CU,BV,4,'dark-back'),
].map(w=>({...w,h:H,y:H/2,id:'spawn-wall-'+w.id}));
// one thin oak bumper rail on the camera side of the left partition only
export const SPAWN_RAILS=[{x:X(-3.9),z:Z(1.85)+.012,y:.27,w:3.6,d:.022}];
export const SPAWN_OUTLETS=[{x:X(.63),z:Z(1.78)+.002,y:.29,rotation:0,style:0}];
// one troffer row through the open bay (u≈−1.2, every 2.4 m as in the photo) + the camera room's own lamps
export const SPAWN_LIGHTS=[[-1.8,5.1],[-1.8,7.5],[-1.8,9.9],[-1.8,12.3],[4.2,9.9],[-4.2,-.6],[1.8,-.6]].map(([u,v],i)=>({x:X(u),z:Z(v),on:true,phase:i*1.7,spawn:true}));
export const SPAWN_VIEW={name:'出生点 · 经典原图机位',x:C.x,y:1.5,z:C.z,yaw:.14,pitch:-.265,fov:64.6,manila:true,spawn:true};
export const SPAWN_PLAY={name:'出生点',x:C.x,z:C.z,yaw:.14,pitch:-.12,spawn:true};
// the tile you fall through in the first-run intro stays missing (ceiling slot grid: x ≡ .6 mod 1.2, z ≡ .3 mod .6)
export const SPAWN_HOLES=[{x:C.x-.6,z:C.z-.3}];
