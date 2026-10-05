import {createMacro94} from './level0-space94.js';
// Metric wall strokes form porous room shells, not a filled cell maze.
const M=86.4,H=2.72;
export const FIELD95={id:'porous95',type:'classic',x0:194,x1:262,z0:-92,z1:-24};
export const GALLERY95={id:'gallery95',type:'classic',x0:194,x1:225,z0:-4,z1:36};
export const VIEWS95=[{name:'开放空间 · 折返与梳齿墙',x:212,z:-64,yaw:-1.23},{name:'吊顶 · 连片破损与保温棉',x:217,z:3,yaw:0},{name:'错构家具 · 多余部件',x:216,z:27,yaw:0},{name:'沙发与柜子 · 堵塞走廊',x:199.7,z:25.9,yaw:0}];
function field(x0,z0,width,depth,seed,hash){
 const walls=[],rooms=[],portals=[],rails=[],rand=s=>hash(seed,s,9501);let id=0;
 const wall=(x,z,w,d,t=.24)=>walls.push({x:x0+x,z:z0+z,w:w||t,d:d||t,h:H,y:H/2,mat:0,kind:'full',id:'field95:'+seed+':'+id++});
 const line=(x1,z1,x2,z2,t=.24)=>wall((x1+x2)/2,(z1+z2)/2,Math.abs(x2-x1)||t,Math.abs(z2-z1)||t,t);
 const path=(pts,t=.24)=>{for(let i=1;i<pts.length;i++)line(...pts[i-1],...pts[i],t);};
 const sx=width/68,sz=depth/68,P=(pts,t=.24)=>path(pts.map(([x,z])=>[x*sx,z*sz]),t);
 // Broad asymmetric C-room, large interrupted perimeter; exits face the shared commons.
 P([[6,39],[6,9],[28,9],[28,18],[43,18]],.24+rand(2)*.15);
 P([[6,32],[14,32]],.24);P([[18,32],[43,32],[43,24],[46,24],[46,31],[51,31]],.24);
 P([[6,45],[6,53],[28,53],[28,39]],.24);
 P([[22,32],[28,32],[28,27]],.24);
 for(let j=0;j<3;j++){const xx=33+j*5;P([[xx,18],[xx,21+rand(12+j)*3]],.19);if(j!==1)P([[xx,32],[xx,28-rand(19+j)*2]],.20);}
 // Offset zigzags define both narrow service slots and an open route around them.
 P([[41,9],[38,9],[38,4],[45,4],[45,1]],.34);
 P([[46,15],[46,22],[43,22],[43,18]],.23);
 P([[51,13],[51,17],[55,17],[55,24],[63,24],[63,14]],.26);
 P([[54,28],[52,28],[52,32],[64,32],[64,26]],.25);
 P([[48,38],[48,42],[52,42],[52,46],[56,46],[56,49],[60,49]],.27);
 P([[40,58],[40,47],[45,47],[45,52],[47,52],[47,55],[45,55],[45,64],[58,64],[58,57],[66,57]],.32);
 P([[35,53],[35,67],[57,67]],.31);
 if(rand(22)<.64){P([[59,4],[59,9],[66,9]],.44);P([[61,38],[66,38]],.21);}
 if(rand(23)<.6)P([[16,59],[16,65],[23,65]],.20);
 rooms.push({x0:x0+7*sx,x1:x0+27*sx,z0:z0+10*sz,z1:z0+31*sz,id:1}, {x0:x0+7*sx,x1:x0+27*sx,z0:z0+34*sz,z1:z0+51*sz,id:2}, {x0:x0+19*sx,x1:x0+36*sx,z0:z0+55*sz,z1:z0+66*sz,id:3}, {x0:x0+54*sx,x1:x0+65*sx,z0:z0+26*sz,z1:z0+31*sz,id:4});
 return{walls,rooms,portals,rails};
}
export function createMacro95(mx,mz,hash){
 if(hash(mx,mz,9510)>.38)return createMacro94(mx,mz,hash);
 const seed=mx*931+mz*787,rand=s=>hash(seed,s,9591),walls=[],rooms=[];let serial=0;
 const stroke=(x1,z1,x2,z2,t=.24)=>{const length=Math.hypot(x2-x1,z2-z1),count=Math.ceil(length/26);for(let j=0;j<count;j++){const a=j/count,b=(j+1)/count;walls.push({x:mx*M+x1+(x2-x1)*(a+b)/2,z:mz*M+z1+(z2-z1)*(a+b)/2,w:Math.abs(x2-x1)*(b-a)||t,d:Math.abs(z2-z1)*(b-a)||t,h:H,y:H/2,kind:'full',mat:0,id:'porous95:'+seed+':'+serial++});}};
 const chain=(points,t)=>{for(let j=1;j<points.length;j++)stroke(...points[j-1],...points[j],t);};
 // Four unequal, independently open shells leave a connected 7–14m common space.
 const cutX=35+rand(1)*12,cutZ=34+rand(2)*15,gap=7+rand(3)*7;
 const bays=[[4,4,cutX-gap/2,cutZ-gap/2],[cutX+gap/2,3,81,cutZ-gap/2],[3,cutZ+gap/2,cutX-gap/2,82],[cutX+gap/2,cutZ+gap/2,82,82]];
 bays.forEach(([a,b,c,d],i)=>{
  a+=rand(i*31+5)*3;b+=rand(i*31+6)*3;c-=rand(i*31+7)*3;d-=rand(i*31+8)*3;
  const side=Math.floor(rand(i*31+9)*4),thickness=.18+rand(i*31+10)**2*.48,inset=2+rand(i*31+11)*3;
  // U, C and interrupted perimeter, with a separate free-standing wing.
  if(side===0)chain([[a,d],[a,b],[c,b],[c,d-inset]],thickness);
  else if(side===1)chain([[a,b],[c,b],[c,d],[a+inset,d]],thickness);
  else if(side===2)chain([[a,b+inset],[a,d],[c,d],[c,b]],thickness);
  else chain([[c,b],[a,b],[a,d],[c-inset,d]],thickness);
  const teeth=2+Math.floor(rand(i*31+12)*4),horizontal=side%2===0;
  for(let j=0;j<teeth;j++){const f=(j+1)/(teeth+1),len=1.8+rand(i*51+j+100)*3.2;if(horizontal){const z=side===0?b:d;stroke(a+(c-a)*f,z,a+(c-a)*f,z+(side===0?len:-len),.18+rand(i+j+204)*.12);}else{const x=side===1?c:a;stroke(x,b+(d-b)*f,x+(side===1?-len:len),b+(d-b)*f,.19);}}
  if(rand(i+280)<.62){const along=(c-a)*(.3+rand(i+281)*.2);stroke(a+along,d,c-inset,d,.21);}
  rooms.push({x0:mx*M+a+.5,x1:mx*M+c-.5,z0:mz*M+b+.5,z1:mz*M+d-.5,id:i+1});
 });
 // Short turning walls beside the commons make offset niches without sealing the district.
 const zStart=13+rand(311)*8,xStart=cutX-gap/2+1.7,step=2.3+rand(312)*.9;
 chain([[xStart,zStart],[xStart+step,zStart],[xStart+step,zStart+step],[xStart+2*step,zStart+step],[xStart+2*step,zStart+2*step]],.26);
 const zBottom=cutZ+gap/2+7;chain([[cutX-gap/2-3,zBottom],[cutX-gap/2-3,zBottom+7],[cutX-gap/2+1,zBottom+7]],.30);
 const plan={walls,rooms,portals:[],rails:[]};
 // Four rotation/mirror domains alter wall families without changing thickness or openings.
 const turn=Math.floor(hash(mx,mz,9511)*4),mirror=hash(mx,mz,9512)>.5,ox=(mx+.5)*M,oz=(mz+.5)*M;
 const transform=(x,z)=>{let a=x-ox,b=z-oz;if(mirror)a=-a;for(let i=0;i<turn;i++){const c=a;a=-b;b=c;}return[x=a+ox,z=b+oz];};
 for(const w of plan.walls){[w.x,w.z]=transform(w.x,w.z);if(turn%2)[w.w,w.d]=[w.d,w.w];}
 for(const r of plan.rooms){const a=transform(r.x0,r.z0),b=transform(r.x1,r.z1);r.x0=Math.min(a[0],b[0]);r.x1=Math.max(a[0],b[0]);r.z0=Math.min(a[1],b[1]);r.z1=Math.max(a[1],b[1]);}
 return plan;
}
export function showcase95(hash){
 const plan=field(FIELD95.x0,FIELD95.z0,68,68,95,hash);
 const W=(x,z,w,d)=>plan.walls.push({x,z,w,d,h:H,y:H/2,mat:0,id:'gallery95'});
 // A deliberately blocked dead-end room, with an independent clear eastern gallery route.
 W(196,11,.30,30);W(203.4,11,.32,30);W(199.7,-3.9,7.7,.32);
 W(223,15,.35,36);W(213.2,-3.9,19.8,.32);W(213.2,33.9,19.8,.32);
 W(207,13,.28,20);W(212,13,4,.28);W(222,13,2,.28);
 plan.rooms.push({x0:196.2,x1:203.2,z0:-3.5,z1:26,id:950},{x0:207.3,x1:222.8,z0:-3.5,z1:12.8,id:951});
 return plan;
}
