// Metres. The original dry pool and all showers keep their surveyed positions.
// New path: street -> large reception -> left door -> changing -> right pool door.
export const RECEPTION={x0:-4.8,x1:4.8,z0:6.4,z1:13.6,ceiling:3.05};
export const CHANGING={x0:-4.1,x1:4.1,z0:.16,z1:6.4,ceiling:2.88};
export const LOBBY_DOOR={x:-2.2,z:6.4,width:1.65,height:2.38};
export const POOL_DOOR={x:2.25,z:.08,width:1.65,height:2.32};
export const RECEPTION_COUNTER={x:2.8,z:9.7,yaw:-Math.PI/2,width:2.2,depth:.88};
export const LOCKER_ROWS=[{x:-3.77,z:3.52,yaw:Math.PI/2,count:8},{x:3.77,z:4.32,yaw:-Math.PI/2,count:5}];
export const BENCHES=[{x:-1.16,z:3.56,yaw:Math.PI/2,length:2.58},{x:1.35,z:4.42,yaw:Math.PI/2,length:1.76}];
export const WAITING_Z=[8.55,9.60,10.65,11.70];
export const BATH_V72_ARRIVAL={x:0,z:12.45,yaw:0,pitch:-.035};
export const inReception=(x,z)=>x>RECEPTION.x0+.23&&x<RECEPTION.x1-.23&&z>6.15&&z<13.47;
export const inChanging=(x,z)=>x>-3.87&&x<3.87&&z>.0&&z<6.62;
export const atBathExit=(x,z)=>Math.abs(x)<.88&&z>12.75;
export function newBathAllowed(x,z){
 if(!inReception(x,z)&&!inChanging(x,z))return false;
 if(Math.abs(z-LOBBY_DOOR.z)<.30&&Math.abs(x-LOBBY_DOOR.x)>LOBBY_DOOR.width/2-.21)return false;
 if(inReception(x,z)&&z>6.69){
  if(Math.abs(x-2.8)<.66&&Math.abs(z-9.7)<1.30)return false;
  if(x< -3.56&&z>8.03&&z<12.21)return false;
  if(Math.hypot(x+3.93,z-12.74)<.58)return false;
  if(x< -3.16&&z>6.91&&z<7.91)return false;
 }
 if(inChanging(x,z)&&z<6.12){
  if(x< -3.15&&z>1.73&&z<5.31)return false;
  if(x>3.15&&z>3.14&&z<5.5)return false;
  for(const b of BENCHES)if(Math.abs(x-b.x)<.46&&Math.abs(z-b.z)<b.length/2+.21)return false;
  if(x>-.35&&x<1.51&&z<1.07)return false;
  if(Math.hypot(x+3.30,z-1.06)<.51||Math.hypot(x+2.77,z-.74)<.43)return false;
 }
 return true;
}
