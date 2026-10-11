// V117 · Level 0 spawn: a fixed authored replica of the classic Backrooms photograph (files/level0-spawn-ref.webp).
// Local frame: camera C, u = right (+x), v = forward (−z). The photo camera stands ~1.5 m high, pitched ~15° down,
// vertical FOV ~64° at 4:3. Two foreground partitions frame a 1.6 m gap: dotted paper with a low oak bumper rail on
// the left, yellow arrow-chevron paper with one outlet on the right. Through the gap: a wide open bay lit by one
// row of troffers, an inside corner on the far left and a recessed back wall on the right.
// Lamps snap to the Level 0 ceiling slot grid (x ≡ .6 mod 1.2, z ≡ .3 mod .6), so C sits on that grid.
export const SPAWN_C={x:-169.8,z:45.0};
const C=SPAWN_C,T=.15,H=2.72;
const X=u=>C.x+u,Z=v=>C.z-v;
export const SPAWN_REGION={id:'spawn117',type:'classic',x0:X(-8.5),x1:X(10.5),z0:Z(17),z1:Z(-4.5)};
export const inSpawn=(x,z,p=0)=>x>SPAWN_REGION.x0-p&&x<SPAWN_REGION.x1+p&&z>SPAWN_REGION.z0-p&&z<SPAWN_REGION.z1+p;
// wall along u (faces ±v) or along v (faces ±u); mat 3 = spawn chevron, 4 = spawn dots
const WU=(u0,u1,v,mat,id)=>({x:X((u0+u1)/2),z:Z(v+T/2),w:u1-u0,d:T,mat,id});
const WV=(v0,v1,u,mat,id)=>({x:X(u-T/2),z:Z((v0+v1)/2),w:T,d:v1-v0,mat,id});
export const SPAWN_WALLS=[
 WU(-6.0,-1.9,2.25,4,'left-front'),        // left partition (dots), its end face at u=-1.5
 WU(0.12,6.0,1.95,3,'right-front'),        // right partition (chevron)
 WV(-3.2,2.25,-6.0,4,'near-left'),        // camera room: left side, back
 WV(-3.2,1.95,6.0,4,'near-right'),
 WU(-6.0,6.0,-3.2,4,'near-back'),
 WV(8.2,12.0,-5.1,4,'bay-left-side'),      // far-left inside corner: side wall then the dotted face
 WU(-5.1,-0.9,12.0,3,'bay-back-left'),
 WV(12.0,14.6,-0.75,4,'bay-jog'),          // short return at the corner, then the deeper back wall
 WU(-0.9,9.6,14.6,4,'bay-back'),
 WV(5.0,14.6,9.6,4,'bay-right'),
].map(w=>({...w,h:H,y:H/2,id:'spawn-wall-'+w.id}));
// oak bumper rail on the left partition (camera side, low) and on the far dotted wall
export const SPAWN_RAILS=[{x:X(-4.04),z:Z(2.25)+.012,y:.26,w:3.9,d:.03},{x:X(-3.0),z:Z(12.0)+.012,y:.26,w:4.0,d:.03}];
export const SPAWN_OUTLETS=[{x:X(.63),z:Z(1.95)+.002,y:.29,rotation:0,style:0}];
// one troffer row through the open bay + the camera room's own lamps (out of frame, light the partitions)
export const SPAWN_LIGHTS=[[-1.2,4.5],[-1.2,6.9],[-1.2,9.3],[-1.2,11.7],[3.6,6.9],[3.6,11.7],[-3.6,-.6],[2.4,-.6]].map(([u,v],i)=>({x:X(u),z:Z(v),on:true,phase:i*1.7,spawn:true}));
export const SPAWN_VIEW={name:'出生点 · 经典原图机位',x:C.x,y:1.5,z:C.z,yaw:.14,pitch:-.265,fov:64.6,manila:true,spawn:true};
export const SPAWN_PLAY={name:'出生点',x:C.x,z:C.z,yaw:.14,pitch:-.12,spawn:true};
// the tile you fall through in the first-run intro stays missing (ceiling slot grid: x ≡ .6 mod 1.2, z ≡ .3 mod .6)
export const SPAWN_HOLES=[{x:C.x,z:C.z-.3}];
