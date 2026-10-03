// V73 additions remain inside the existing V72 room envelope.
export const LOUNGE73={sofa:{x:-4.03,z:9.63,yaw:Math.PI/2,width:2.24,depth:.94},table:{x:-2.83,z:9.63,yaw:Math.PI/2,width:1.23,depth:.63},rug:{x:-3.32,z:10.30,width:3.80,depth:2.53,yaw:Math.PI/2},chairZ:11.70,fern:{x:4.21,z:13.00},cabinet:{x:4.51,z:7.58,width:1.83,depth:.37}};
export const OPEN_LOCKERS73=[{column:4,tier:1,content:'soap',angle:-1.38},{column:6,tier:1,content:'clothes',angle:-1.54}];
export const WALL_LAMPS73=[{x:-4.48,z:8.56,yaw:Math.PI/2},{x:-4.48,z:11.63,yaw:Math.PI/2},{x:2.90,z:6.69,yaw:0},{x:4.48,z:12.07,yaw:-Math.PI/2}];
export function loungeBlocked73(x,z){
 for(const p of[LOUNGE73.sofa,LOUNGE73.table]){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw),u=c*dx-s*dz,v=s*dx+c*dz;if(Math.abs(u)<p.width/2+.20&&Math.abs(v)<p.depth/2+.20)return true;}
 if(Math.hypot(x-LOUNGE73.fern.x,z-LOUNGE73.fern.z)<.56)return true;
 if(x>4.04&&z>6.48&&z<8.70)return true;
 return false;
}
