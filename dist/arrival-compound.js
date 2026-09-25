// A small arrival farm along the existing road, north of the protected
// 20m start circle. The original road and fixed landmarks stay in place.
const parts=[
 {id:'barn',kind:'barn',x:34,z:13,width:15,depth:25,height:5.4,variant:2,angle:-Math.PI/2,hx:8.25,hz:13.25,finish:'gray'},
 {id:'silo',kind:'silo',x:50.2,z:9,r:2.85,height:11.8,angle:0},
 {id:'shed',kind:'shed',x:13,z:-7,width:17,depth:7,height:3.45,variant:5,angle:0,hx:9.25,hz:4.25},
 {id:'outhouse',kind:'outhouse',x:55,z:32,width:2.8,depth:3.2,height:2.7,variant:1,angle:-Math.PI/2,hx:2.15,hz:2.35},
 {id:'back-fence',kind:'fence',x:54,z:6,width:42,depth:.16,height:1.15,angle:Math.PI/2,hx:21,hz:.18},
 ...[-12,-4,4,12,20,28].map((z,i)=>({id:'tree-'+i,kind:'tree',x:61+(i%2)*.7,z,r:3,height:8.5+i%3*.7,angle:i*2.399,variant:i%3}))
];
export const ARRIVAL_COMPONENTS=parts;
export function arrivalCompound(cx,cz,height){
 if(cx< -1n||cx>1n||cz< -1n||cz>0n)return null;
 const dx=Number(cx)*64,dz=Number(cz)*64,id='arrival-barn-extension-v36';
 const components=parts.map((p,i)=>({...p,x:p.x-dx,z:p.z-dz,seed:813761+i*379,belongs:BigInt(Math.floor(p.x/64))===cx&&BigInt(Math.floor(p.z/64))===cz,groundY:height(p.x-dx,p.z-dz,cx,cz)+.04}));
 return {id,key:id,kind:'extension',seed:831641,finish:'gray',x:14-dx,z:13-dz,rot:0,yardHalfX:9,yardHalfZ:13,yardZ:0,bounds:[-4-dx,67-dx,-20-dz,37-dz],components,
 access:{x:-dx,z:13-dz},driveway:{x1:-dx,z1:13-dz,x2:17-dx,z2:13-dz,width:3.5}};
}
