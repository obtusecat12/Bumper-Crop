// Authored Level 0 spawn, reconstructed from the supplied 640 x 480 photograph.
// Local frame: u = right (+x), v = forward (-z). The fixed reference camera is
// 1.65 m high; its projection is shared with Blender. Normal play keeps its own pose.
// Authored fluorescent positions bypass the ordinary grid snap; apertures follow them.
export const SPAWN_C={x:-169.2,z:45.0}; // V117b: moved +.6 so the troffer row can sit at u=-1.8 as in the photo
const C=SPAWN_C,T=.15,H=2.72;
const X=u=>C.x+u,Z=v=>C.z-v;
export const SPAWN_REGION={id:'spawn117',type:'classic',x0:X(-10),x1:X(10.5),z0:Z(13.6),z1:Z(-4.5)};
export const inSpawn=(x,z,p=0)=>x>SPAWN_REGION.x0-p&&x<SPAWN_REGION.x1+p&&z>SPAWN_REGION.z0-p&&z<SPAWN_REGION.z1+p;
// Wall boxes share their dimensions with collision, minimap and the Blender export.
// Material indices: 3 classic paper, 4 dots, 6 stripes, 7 pale dots, 8 foreground dots.
const WU=(u0,u1,v,mat,id)=>({x:X((u0+u1)/2),z:Z(v+T/2),w:u1-u0,d:T,mat,id});
const WV=(v0,v1,u,mat,id)=>({x:X(u-T/2),z:Z((v0+v1)/2),w:T,d:v1-v0,mat,id});
const WR=(u0,v0,u1,v1,mat,id)=>{const du=u1-u0,dv=v1-v0,L=Math.hypot(du,dv),nu=dv/L,nv=-du/L,s=(-(u0+u1)*nu-(v0+v1)*nv)>0?1:-1;// shift half the thickness away from the camera side
 return{x:X((u0+u1)/2-s*nu*T/2),z:Z((v0+v1)/2-s*nv*T/2),w:L,d:T,ry:Math.atan2(dv,du),mat,id};};
// Reference reconstruction: shared physical partitions, floor contacts and four visible troffers.
const CU=-5.251895,SV=9.481091,EU=-1.338001,BV=12.9;
export const SPAWN_WALLS=[
 WU(-6.5,-1.672897,1.986116,8,'left-front'),       // left foreground partition
 WU(.079075,6.5,2.144020,3,'right-front'),        // right partition (chevron)
 WV(-3.2,1.986116,-6.5,4,'near-left'),         // camera room: left side, back
 WV(-3.2,2.144020,6.5,4,'near-right'),
 WU(-6.5,6.5,-3.2,4,'near-back'),
 WR(-4.905842,6.577127,CU,SV,7,'bay-left-side'),        // lit side wall on the far left (its near end is a free end)
 WR(CU,SV,EU,9.234490,6,'bay-stripe'),              // pin-stripe partition facing the camera, square to the side wall
 WU(CU,9.6,BV,7,'bay-back'),               // deep back wall seen past the partition's free end
 WV(4.6,BV,9.6,4,'bay-right'),
 WV(1.85,BV,-9.6,4,'dark-left'),           // unlit room behind the far-left wall (the dark strip in the photo)
 WU(-9.6,CU,BV,4,'dark-back'),
].map(w=>w.id==='left-front'?{...w,z:w.z+.03,d:.09}:w).map(w=>({...w,h:H,y:H/2,id:'spawn-wall-'+w.id}));
// Thin oak bumpers; the far-room continuations are appended below.
export const SPAWN_RAILS=[{x:X(-3.725),z:Z(1.986116)+.012,y:.27,w:3.85,d:.022}];// V119c: rail runs to ~13 cm short of the end face, as in the photo
export const SPAWN_OUTLETS=[{x:X(.628269),z:Z(2.144020)+.002,y:.36,rotation:0,style:0}];
// Four visible troffers plus three fixed fixtures illuminating the adjoining room.
export const SPAWN_LIGHTS=[[-1.596070,3.948719],[-1.536478,5.755593],[-1.482346,7.687029],[-1.397683,8.95],[4.2,9.9],[-4.2,-1.8],[1.8,-1.8]].map(([u,v],i)=>({x:X(u),z:Z(v),on:true,phase:i*1.7,spawn:true}));
export const SPAWN_VIEW={name:'出生点 · 经典原图机位',x:C.x,y:1.65,z:C.z,yaw:.159902,pitch:-.065198,roll:.04658,shiftY:.159204,fov:65.455542,manila:true,spawn:true};
export const SPAWN_PLAY={name:'出生点',x:C.x,z:C.z,yaw:.14,pitch:-.12,spawn:true};
// the tile you fall through in the first-run intro stays missing (ceiling slot grid: x ≡ .6 mod 1.2, z ≡ .3 mod .6)
export const SPAWN_HOLES=[{x:C.x-.6,z:C.z-.3}];

// Low skirting in the illuminated bay; foreground partitions retain the photo’s bare floor contact.
export const SPAWN_SKIRT=SPAWN_WALLS.filter(w=>/bay-left-side|bay-stripe|bay-back/.test(w.id)).map(w=>({...w,y:.065,h:.13,w:w.w+.016,d:w.d+.016,mat:9,id:w.id+'-skirt'}));

for(const w of SPAWN_WALLS.filter(w=>/bay-left-side|bay-stripe|bay-back/.test(w.id))){
 const ry=w.ry||0,co=Math.cos(ry),si=Math.sin(ry);
 if(w.w<w.d)SPAWN_RAILS.push({x:w.x+w.w/2+.012,z:w.z+.05,y:.29,w:.022,d:w.d-.22});
 else SPAWN_RAILS.push({x:w.x-.25*co+si*(w.d/2+.013),z:w.z+.25*si+co*(w.d/2+.013),y:.29,w:w.w-.5,d:.022,ry});
}
