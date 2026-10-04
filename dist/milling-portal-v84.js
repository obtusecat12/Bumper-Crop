import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {worldUV} from './bath-v61-materials.js';
import {returnPoint,returnFloor,RETURN_MOUTH} from './milling-return-layout.js';
const PI=Math.PI,Y=RETURN_MOUTH.y;
// The same surveyed entrance is used on BOTH sides of the scene handoff.
// Continuous offset walls, rather than overlapping rotated boxes, define its bends.
export function createMillingPortal(m,{sacks,pallet}){
 const k=new TikiKit(m),colliders=[],half=2.25;
 for(const side of[-1,1]){
  const pts=[];for(let s=0;s<=49;s+=.5){const p=returnPoint(s);pts.push(new T.Vector2(p.x+p.nx*half*side,-p.z-p.nz*half*side));}
  const out=side<0?-10.7:18.5,shape=new T.Shape();shape.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))shape.lineTo(p.x,p.y);shape.lineTo(out,pts.at(-1).y);shape.lineTo(out,0);shape.closePath();
  const h=side<0?13.6:6.55,g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});g.rotateX(-PI/2);k.add(worldUV(g,1.15),side<0?'brick':'steel',0,Y,0);
  for(let s=0;s<49;s+=.75){const a=returnPoint(s),b=returnPoint(Math.min(49,s+.75)),x=a.x+a.nx*half*side,z=a.z+a.nz*half*side,xx=b.x+b.nx*half*side,zz=b.z+b.nz*half*side,dx=xx-x,dz=zz-z,d=Math.hypot(dx,dz),ry=Math.atan2(dx,dz);colliders.push({kind:'obb',x:(x+xx)/2,z:(z+zz)/2,w:.25,d:d+.025,ry});k.beam('cement',[x,Y+.13,z],[xx,Y+.13,zz],.13,4);k.beam('metal',[x,Y+h-.13,z],[xx,Y+h-.13,zz],.035,6);}
 }
 // The covered inner dogleg conceals sky and adjacent block façades at the portal.
 const turn=returnPoint(18),turnAngle=Math.atan2(turn.tx,turn.tz);k.box('steel',turn.x,Y+3.70,turn.z,7.4,.15,8.5,.025,turnAngle);
 for(const off of[-2.2,2.2]){const x=turn.x+turn.tx*off,z=turn.z+turn.tz*off;k.box('metal',x,Y+3.48,z,5.8,.22,.14,.012,turnAngle);}
 for(const side of[-1,1]){const x=turn.x+turn.nx*2.18*side,z=turn.z+turn.nz*2.18*side;k.box('metal',x,Y+3.17,z,.12,.68,1.3,.012,turnAngle);k.box('lamp',x-turn.nx*side*.08,Y+3.16,z-turn.nz*side*.08,.035,.10,.45,.014,turnAngle);}
 // Brick windows/HVAC occupy different bays. Curved blind warehouse walls stay solid.
 for(const s of[3.4,8,43.2,47.1]){const p=returnPoint(s),ry=Math.atan2(p.tx,p.tz),n=p.nx,zz=p.nz;for(let f=0;f<4;f++){const y=Y+2.0+f*3.13,x=p.x-n*2.18,z=p.z-zz*2.18;k.box('cement',x,y,z,.16,1.94,1.42,.02,ry);k.box('glass',p.x-n*2.08,y+.02,p.z-zz*2.08,.035,1.69,1.18,.009,ry);k.box('metal',p.x-n*2.055,y,p.z-zz*2.055,.04,.035,1.22,.005,ry);k.box('metal',p.x-n*2.055,y,p.z-zz*2.055,.04,1.69,.043,.005,ry);k.box('cement',p.x-n*2.08,y-.97,p.z-zz*2.08,.38,.10,1.56,.015,ry);}}
 for(const z of[5.7,23.0]){const p=returnPoint(z);for(let f=0;f<3;f++){const x=p.x-p.nx*1.96,zz=p.z-p.nz*1.96,y=Y+3.25+f*3.1,ry=Math.atan2(p.tx,p.tz);k.box('steel',x,y,zz,.60,.52,.79,.035,ry);for(let j=0;j<7;j++)k.box('metal',x+p.nx*.31,y-.2+j*.062,zz+p.nz*.31,.02,.018,.65,.002,ry);}}
 // Recessed rolling loading door before the bend, complete dock and bumper corners.
 k.box('metal',2.18,Y+2.13,7,.19,3.46,4.1,.02);k.box('steel',2.06,Y+2.13,7,.06,3.28,3.85,.015);for(let i=0;i<19;i++)k.box('metal',2.02,Y+.56+i*.17,7,.028,.019,3.85,.002);k.box('cement',1.95,Y+.28,7,.60,.56,4.28,.04);for(const z of[5.35,8.65])k.box('metal',1.60,Y+.53,z,.14,.94,.20,.024);
 // 4.35m underside, real I-sections, open grating and guarded maintenance catwalk.
 for(const z of[3.0,4.5]){k.box('metal',0,Y+4.40,z,4.92,.10,.32,.01);k.box('metal',0,Y+4.67,z,4.92,.10,.32,.01);k.box('metal',0,Y+4.535,z,4.92,.26,.075,.006);for(const x of[-2.28,2.28]){k.box('metal',x,Y+4.50,z,.20,.58,.57,.012);for(const a of[-.16,.16])k.cyl('metal',x,Y+4.83,z+a,.035,.035,.035,8);}}
 for(let x=-2.2;x<=2.2;x+=.15)k.box('metal',x,Y+4.75,3.75,.065,.07,1.48,.004);
 for(const z of[3.04,4.46]){for(let x=-2.25;x<=2.25;x+=.45)k.beam('metal',[x,Y+4.80,z],[x,Y+5.84,z],.021,8);for(const y of[5.29,5.84])k.beam('metal',[-2.4,Y+y,z],[2.4,Y+y,z],.031,10);}
 k.beam('metal',[-2.23,Y+3.78,3],[.05,Y+4.36,3],.045);k.beam('metal',[2.23,Y+3.78,4.5],[-.05,Y+4.36,4.5],.045);
 for(let i=0;i<4;i++)k.tube('metal',[[-2.4,Y+6.3+i*.055,1.5],[0,Y+5.85+i*.055,2],[2.4,Y+6.42+i*.055,2.8]],.014,18);
 // Black steel escape above the sacks, outside the walkable head volume.
 for(let f=1;f<=3;f++){const y=Y+f*3.12+.12;k.box('metal',-1.81,y,10.0,.83,.08,1.86,.009);for(const z of[9.1,10.9]){k.beam('metal',[-1.40,y,z],[-1.40,y+1.04,z],.022);k.beam('metal',[-2.20,y+1.04,z],[-1.40,y+1.04,z],.022);}for(let j=0;j<7;j++)k.beam('metal',[-1.39,y,9.1+j*.3],[-1.39,y+1.04,9.1+j*.3],.013);k.beam('metal',[-1.39,y+1.04,9.1],[-1.39,y+1.04,10.9],.026);}
 for(const z of[9.7,10.22])k.beam('metal',[-1.50,Y+1.4,z],[-1.50,Y+10.3,z],.023);for(let y=1.45;y<10.3;y+=.29)k.beam('metal',[-1.50,Y+y,9.7],[-1.50,Y+y,10.22],.014);
 // Front corner guards leave a 3.18m centre gap; a shallow worn speed hump.
 for(const x of[-1.88,1.88]){k.cyl('yellow',x,Y+.46,-.20,.17,.19,.92,16);k.sphere('yellow',x,Y+.92,-.20,.17,.085,.17);k.cyl('metal',x,Y+.62,-.20,.174,.174,.09,16);colliders.push({kind:'circle',x,z:-.20,r:.19});}
 const hump=new T.CylinderGeometry(.13,.13,3.42,20,1,false,0,PI);hump.rotateZ(PI/2);k.add(hump,'asphalt',0,Y-.02,1.15);for(const x of[-1.3,-.65,0,.65,1.3])k.box('yellow',x,Y+.065,1.15,.26,.025,.18,.011);
 // Municipal dumpster: sheet-metal body, two lids, handles, hinge and four casters.
 const dx=-3.55,dz=-1.10;k.box('green',dx,Y+.78,dz,1.8,1.25,1.04,.055);for(const xx of[-.77,.77])for(const zz of[-.39,.39]){k.box('metal',dx+xx,Y+.20,dz+zz,.12,.22,.12,.012);const wheel=new T.CylinderGeometry(.12,.12,.065,12);wheel.rotateZ(PI/2);k.add(wheel,'metal',dx+xx,Y+.12,dz+zz);}for(const xx of[-.45,.45]){k.box('metal',dx+xx,Y+1.45,dz,.85,.09,1.09,.035);k.box('green',dx+xx,Y+1.38,dz,.87,.12,1.0,.025);k.beam('metal',[dx+xx-.12,Y+1.46,dz-.43],[dx+xx+.12,Y+1.46,dz-.43],.027);}for(const xx of[-.91,.91])k.tube('metal',[[dx+xx,Y+1.1,dz-.17],[dx+xx*1.04,Y+1.1,dz-.17],[dx+xx*1.04,Y+1.1,dz+.17],[dx+xx,Y+1.1,dz+.17]],.023,10);colliders.push({kind:'obb',x:dx,z:dz,w:1.86,d:1.13,ry:0});
 for(const [key,x,z,w,h,ry]of[['warning-no',-2.15,2,1.04,.70,PI/2],['warning-staff',2.145,2.6,.90,.60,-PI/2],['warning-vehicles',-.3,-.02,1.48,.99,PI]]){const y=Y+(key==='warning-vehicles'?3.32:2.14);if(key==='warning-vehicles'){k.box('metal',0,y,z,4.95,1.09,.16,.012);k.plane(key,x,y,z-.10,w,h,[0,ry,0]);}else{k.box('metal',x,y,z,.055,h+.08,w+.08,.018);k.plane(key,x+(x<0?.04:-.04),y,z,w,h,[0,ry,0]);}}
 // Seal only the two adjoining parcel seams. Existing fixed buildings are untouched.
 k.box('brick',-11.45,Y+1.40,1.1,1.8,2.80,.32,.025);k.box('cement',-11.45,Y+2.84,1.1,1.95,.10,.40,.012);colliders.push({kind:'obb',x:-11.45,z:1.1,w:1.8,d:.36,ry:0});
 k.box('steel',20.0,Y+1.51,1.0,3.0,3.02,.15,.015);for(const x of[18.5,20,21.5])k.box('metal',x,Y+1.60,1,.09,3.20,.16,.01);colliders.push({kind:'obb',x:20,z:1,w:3,d:.18,ry:0});
 for(const [s,side]of[[5.5,-1],[25,-1],[43,-1]]){const p=returnPoint(s),x=p.x+p.nx*1.76*side,z=p.z+p.nz*1.76*side;pallet(k,x,z,.02,Y);for(let row=0;row<2;row++)for(let i=0;i<2-row;i++)sacks(k,x+(i-(1-row)/2)*.46,Y+.39+row*.30,z,{paper:i%2===0,lean:PI/2,angle:(i-1)*.08,scale:.85});sacks(k,x-p.nx*side*.4,Y+.39,z+.63,{angle:.13,lean:-.17,torn:true,scale:.94});colliders.push({kind:'obb',x,z,w:.83,d:1.30,ry:0});k.plane('flour',x+.30,Y+.008,z+.57,1.30,.80,[-PI/2,0,.13]);}
 // An overturned pallet is modelled as separate weathered timber slats.
 const loose=new TikiKit(m);for(const x of[-.43,0,.43])loose.box('wood',x,.055,0,.15,.11,1.0,.009);for(let i=0;i<7;i++)loose.box('wood',-.51+i*.17,.145,0,.145,.07,1.03,.01);const fallen=loose.finish('Fallen loading pallet');fallen.position.set(3.7,Y+.38,-.85);fallen.rotation.set(.50,.20,.24);
 const object=k.finish('Shared dogleg loading portal');object.add(fallen);object.userData.portalLength=49;return{object,colliders};
}
export function createIndustrialBackdrop(m){
 const root=new T.Group();root.name='Generated industrial horizon / two alpha silhouettes';
 for(const [s,side,key,w,h]of[[123,-1,'backdrop-a',91,30.3],[151,1,'backdrop-b',108,36]]){const p=returnPoint(s),o=new T.Mesh(new T.PlaneGeometry(w,h),m[key]);o.position.set(p.x+side*34,Y+h/2-1.0,p.z+18);o.rotation.y=side<0?2.14:-2.14;o.castShadow=false;o.receiveShadow=false;root.add(o);}
 return root;
}
