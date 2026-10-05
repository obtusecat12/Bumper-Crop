/** All coordinates below are in the existing outpost's metre-scale local frame. */
export const OUTHOUSE98=Object.freeze({x:5,z:34,y:-.34,width:1.72,depth:1.95,height:2.22,doorAngle:-.76,table:[-2.13,0,.32]});
export const CAMP_ACTORS98=Object.freeze([
 {id:'toilet',host:'outhouse',position:[0,.045,-.15],yaw:0,seat:.31,pose:'squat'},
 {id:'clerk',host:'office',position:[-1.7,0,-3.29],yaw:.015,seat:.486,pose:'smoke'},
 {id:'diner',host:'kitchen',position:[-2.23,0,.36],yaw:Math.PI/2-.0594,seat:.468,pose:'dine'},
 {id:'sleeper',host:'dorm',position:[-.99,.665,-.40],yaw:0,seat:0,pose:'sleep'},
 ...[0,2,4].map((n,j)=>{const a=n*Math.PI*2/5+.18,r=1.4+(n%2)*.2;return{id:['fireElder','fireYoung','fireWorker'][j],host:'rest',position:[Math.sin(a)*r,0,Math.cos(a)*r],yaw:a+Math.PI,seat:.424,pose:'warm'};})
]);
export const DINNER98=Object.freeze({plate:[-1.61,.824,.40],cup:[-1.61,.797,.77],water:.927,cycle:7.6,launch:2.15,flight:.47,sink:2.7});
export function outhouseFloor98(x,z,base){return Math.abs(x-OUTHOUSE98.x)<.86&&Math.abs(z-OUTHOUSE98.z)<.975?Math.max(base,OUTHOUSE98.y):base;}
export function outhouseSolids98(){const p=OUTHOUSE98;return[
 {kind:'obb',x:p.x-.86,z:p.z,hx:.06,hz:.98,angle:0},
 {kind:'obb',x:p.x+.86,z:p.z,hx:.06,hz:.98,angle:0},
 {kind:'obb',x:p.x,z:p.z-.975,hx:.86,hz:.055,angle:0},
 ...[-1,1].map(s=>({kind:'obb',x:p.x+s*.68,z:p.z+.975,hx:.18,hz:.055,angle:0})),
 {kind:'obb',x:p.x-.48+Math.cos(p.doorAngle)*.47,z:p.z+.995-Math.sin(p.doorAngle)*.47,hx:.47,hz:.04,angle:p.doorAngle},
 {kind:'obb',x:p.x,z:p.z-.20,hx:.35,hz:.4,angle:0},
 {kind:'obb',x:p.x+p.table[0],z:p.z+p.table[2],hx:.57,hz:.48,angle:0},
 {kind:'obb',x:p.x-1.17,z:p.z+.20,hx:.24,hz:.36,angle:0}
 ];}
