import {BOUNDS95} from './level0-furniture95.js';
// Exact transformed AABB shared by collision and maps, including non-uniform anomalies.
export function place95(kind,x,z,{y=0,rotation=0,pitch=0,roll=0,scale=[1,1,1],materialMode=null}={}){
 const [w,h,d]=BOUNDS95[kind]||[1,1,1],c=Math.cos(rotation),s=Math.sin(rotation),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity,y0=Infinity,y1=-Infinity;
 for(const px of[-w/2,w/2])for(const py of[0,h])for(const pz of[-d/2,d/2]){let a=px*scale[0],b=py*scale[1],e=pz*scale[2];[a,b]=[a*cr-b*sr,a*sr+b*cr];[b,e]=[b*cp-e*sp,b*sp+e*cp];[a,e]=[a*c+e*s,-a*s+e*c];x0=Math.min(x0,x+a);x1=Math.max(x1,x+a);z0=Math.min(z0,z+e);z1=Math.max(z1,z+e);y0=Math.min(y0,y+b);y1=Math.max(y1,y+b);}
 const footprint={x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0};return{kind,x,z,y,rotation,pitch,roll,scale,materialMode,w:footprint.w,d:footprint.d,mapFootprint:footprint,collider:y0<1.83&&y1>.15?footprint:null};
}
export function blockage95(r,seed,hash,floor=()=>0){
 const out=[],width=Math.min(10,r.x1-r.x0-.44),depth=Math.min(29,r.z1-r.z0-1.0),x=(r.x0+r.x1)/2,z0=r.z0+.85,cols=Math.max(2,Math.floor(width/2.13)),rows=Math.max(3,Math.floor(depth/1.74)),bay=width/cols;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  let xj=x+(i-(cols-1)/2)*bay+(hash(seed,j*cols+i,9528)-.5)*.1,z=z0+j*1.74+(hash(seed,i+j,9529)-.5)*.16,roll=hash(seed+i,j,9530),kind=j===rows-1?(i===0?'f95StripeSofa':i===1?'f95StripeSofa':'f95StripeArmchair'):j<2?(roll<.5?'f95GlassCabinet':'f95FiveDrawer'):j===rows-2&&i===cols-1?'f95GlassCabinet':roll<.15?'f95StripeArmchair':roll<.35?'f94VelvetSofa':roll<.49?'sofa':roll<.61?'f94LinenSofa':'f95StripeSofa',rotation=j===rows-1?(i===1?Math.PI/2:0):j===rows-2?(i===cols-1?Math.PI:.12):roll<.32?Math.PI/2:j%2===0?0:Math.PI;if(j===rows-1&&i===1)z-=.38;if(j===rows-2&&i===0){kind='f95FiveDrawer';rotation=Math.PI*.5;}
  out.push(place95(kind,xj,z,{rotation:rotation+(roll-.5)*.19,y:floor(xj,z),scale:kind==='f95StripeSofa'?[Math.min(1.10,(bay-.07)/1.92),1,1]:[1,1,1]}));
  if(j<2&&kind==='f95FiveDrawer'&&roll>.45)out.push(place95('f95CRT',xj,z,{rotation:.35,y:floor(xj,z)+1.299}));
 }
 return out;
}
export function showcaseFurniture95(hash){
 const out=blockage95({x0:196.25,x1:203.15,z0:-3.2,z1:25.3},195,hash);
 const add=(kind,x,z,opts={})=>out.push(place95(kind,x,z,opts));
 add('f95ChairTable',215.6,22.2);add('f95FiveLegChair',211.5,22.7,{rotation:.26});add('f95TallChair',219.9,21.8,{rotation:-.32});
 add('f95FiveDrawer',216.5,16.4);add('f95FusedCRT',216.5,16.4,{y:1.30,rotation:.06});add('f95DrawerTable',212.1,17.5,{rotation:.14});
 add('f95GlassCabinet',221.2,16.2,{rotation:-.07});add('f95Mirror',209.3,16.1,{rotation:.18});
 add('f95StripeArmchair',209.1,25.4,{rotation:.41});add('f95Sideboard',220.7,27.2,{scale:[1,.65,1.35],rotation:-.2});
 add('f95OfficeChair',211.8,30.8,{rotation:.9,materialMode:'carpet'});add('f95FiveDrawer',218.2,31.8,{scale:[1.25,.74,1],materialMode:'wallpaper'});
 add('f95Cooler',218.8,9,{rotation:.3});add('f95Cooler',212.9,9.2,{y:.208,roll:Math.PI/2,rotation:.34});
 add('f95Tube',213.8,10.2,{y:.019,rotation:.42});add('f95Tube',213.7,10.4,{y:.020,rotation:-.19});
 add('f95CoffeeTable',220.7,3.3);add('f95CRT',220.7,3.3,{y:.55,rotation:-.32});
 return out;
}
