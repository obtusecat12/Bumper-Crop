import * as T from './vendor/three.module.min.js';
import {UrbanBatch,urbanRandom} from './urban-batch.js?v=50';
import {exitPoint,exitSample,EXIT_CITY_Y,ease} from './exit-route.js?v=50';
import {CITY_ORIGIN,CITY_ANGLE,cityToWorld,worldToCity} from './urban-layout.js?v=50';
import * as P from './urban-props.js?v=50';
const Y=EXIT_CITY_Y,UP=new T.Vector3(0,1,0),plane=new T.PlaneGeometry(1,1);
const CLINIC_PATH=282,cp=exitPoint(CLINIC_PATH),CLINIC_ANGLE=Math.atan2(cp.nx,cp.nz);
export const CLINIC_ORIGIN={x:cp.x+cp.nx*28,z:cp.z+cp.nz*28};
export function clinicToWorld(x,z,out={}){const c=Math.cos(CLINIC_ANGLE),s=Math.sin(CLINIC_ANGLE);out.x=CLINIC_ORIGIN.x+c*x+s*z;out.z=CLINIC_ORIGIN.z-s*x+c*z;return out;}
function clinicLocal(wx,wz){const c=Math.cos(CLINIC_ANGLE),s=Math.sin(CLINIC_ANGLE),x=wx-CLINIC_ORIGIN.x,z=wz-CLINIC_ORIGIN.z;return{x:c*x-s*z,z:s*x+c*z};}
const place=(b,x,y,z,ry,fn,args={})=>{b.push(x,y,z,ry);fn(b,args);b.pop();};
function quad(b,key,points,uv=[0,0,1,0,1,1,0,1],tone=1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();if(g.attributes.normal.getY(0)<-.01){g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();}b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
function rail(b,a,c,height=1.04,key='photoRail'){for(const h of[height,.52])b.rod(key,[a[0],a[1]+h,a[2]],[c[0],c[1]+h,c[2]],.026);const n=Math.max(1,Math.ceil(Math.hypot(c[0]-a[0],c[2]-a[2])/1.8));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(c[0]-a[0])*t,y=a[1]+(c[1]-a[1])*t,z=a[2]+(c[2]-a[2])*t;b.rod(key,[x,y,z],[x,y+height,z],.027);}}
function facade(b,{w,h,cols,rows,key='photoStone',recess=.16,sill=1.2,window=1.7,seed=1,ground=5,fin=false}){
 const r=urbanRandom(seed),bw=w/cols,fh=(h-ground)/rows;
 if(!fin)b.box(key,0,h/2,.10,w,h,.20);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=-w/2+bw*(i+.5),y=ground+fh*(j+.5),ww=fin?bw*.72:Math.min(window,bw*.68),wh=fin?fh-.2:Math.min(1.6,fh*.56),z=-recess;
  b.box('photoShade',x,y,z+.09,ww+.12,wh+.12,.04);
  b.plane('photoGlass',x,y,z-.012,ww,wh,Math.PI,0,.62+r()*.5);
  if(!fin&&r()>.19){const n=2+Math.floor(r()*3);for(let k=0;k<n;k++){const a=x-ww/2+(k+.5)*ww/n;b.plane('photoCurtain',a,y,z-.025,ww/n*.68,wh*.96,Math.PI,0,.51+r()*.5);}}
  b.box('photoFrame',x,y-wh/2-.035,z-.03,ww+.14,.07,.18);b.box('photoFrame',x,y+wh/2+.025,z-.03,ww+.14,.045,.15);
  for(const dx of[-ww/2,0,ww/2])b.box('photoFrame',x+dx,y,z-.04,.035,wh,.1);
 }
 if(fin){for(let i=0;i<=cols;i++)b.box(key,-w/2+i*bw,(h+ground)/2,-.38,.40,h-ground,.78);for(let j=0;j<=rows;j++)b.box(key,0,ground+j*fh,-.12,w,.2,.35);}
 else for(let i=0;i<=cols;i++)b.box(key,-w/2+i*bw,(h+ground)/2,-.07,.18,h-ground,.3,0,.87);
}
function storefront(b,w,{key='photoGlass',base=.15,top=4.1,step=2.1,logo=false}={}){
 b.box('photoShade',0,(top+base)/2,.22,w,top-base,.2);b.plane(key,0,(top+base)/2,.09,w,top-base,Math.PI,0,.85);
 for(let x=-w/2;x<=w/2+.01;x+=step)b.box('photoFrame',x,(top+base)/2,-.035,.055,top-base,.11);
 for(const y of[base,top,top-.65])b.box('photoFrame',0,y,-.035,w,.05,.11);
 b.box('photoSteel',-w*.2,1.45,-.1,.025,.38,.04);b.box('photoSteel',-w*.2+.10,1.45,-.1,.025,.38,.04);
 if(logo)b.plane('photoFamima',0,top+.62,-.34,Math.min(5.8,w),1.04,Math.PI);
}
function streetTree(b,x,z,{height=10.4,width=7.4,seed=1,shadow=true,small=false}={}){
 const r=urbanRandom(seed),trunk=height*.38,ry=.17+r()*.34;
 b.cylinder('photoTrunk',x,trunk/2,z,.18,.29,trunk,9);
 for(let i=0;i<5;i++){const a=i*2.399+r()*.3,end=[x+Math.cos(a)*width*.28,trunk+height*.21+r()*.9,z+Math.sin(a)*width*.25];b.rod('photoTrunk',[x,trunk*.52,z],end,.075);}
 if(z>150)for(let j=0;j<2;j++)b.plane('photoTree',x,height*.47,z,width,height,j*Math.PI/2+.1,0,.72);
 const n=small?8:z>150?8:15;
 for(let k=0;k<n;k++){const a=k*2.399,rad=(k%4)/4,px=x+Math.cos(a)*width*.32*rad,pz=z+Math.sin(a)*width*.29*rad,py=height*.64+Math.sin(k*1.63)*height*.14,sz=width*(.48+r()*.15);for(let j=0;j<3;j++)b.plane('photoCrown',px,py,pz,sz,sz*.90,ry+j*Math.PI/3,0,.64+r()*.18);}
 for(let i=0;i<9;i++){const a=i*2.399,px=x+Math.cos(a)*width*.37,pz=z+Math.sin(a)*width*.34;for(let j=0;j<2;j++)b.plane('photoLeaf',px,height*.61+Math.sin(i)*.7,pz,2.5,2.1,a+j*Math.PI/2,0,.8);}
 // A separate alpha canopy projection provides fine still leaf shadows between
 // cascaded shadow updates; geometry and lighting retain the real tree volume.
 if(shadow)b.plane('photoTreeShadow',x-height*.46,.025,z-height*.19,width*1.1,width*.84,-.27,-Math.PI/2);
 b.circle(x,z,.29);b.box('photoSteel',x,.012,z,1.44,.025,1.44);for(let i=-4;i<=4;i++)b.box('photoGranite',x+i*.15,.031,z,.026,.014,1.33);
}
function smallCar(b,x,z,ry=0,tone=.6){b.push(x,.05,z,ry);b.box('photoSteel',0,.48,0,1.76,.60,4.4,0,tone);b.box('photoGlass',0,.97,-.12,1.58,.61,2.25,0,.7);b.box('photoSteel',0,1.30,-.2,1.61,.10,2,0,tone);b.box('photoSteel',0,.82,1.52,1.76,.12,1.2,0,tone);for(const s of[-1,1]){b.box('photoFrame',s*.73,1.02,-.1,.06,.61,2.3);for(const z of[-1.35,1.4])b.cylinder('rubber',s*.90,.35,z,.34,.34,.20,12,0,Math.PI/2);b.box('white',s*.58,.55,2.24,.46,.17,.02);b.box('red',s*.60,.60,-2.24,.43,.12,.02);}b.box('photoFrame',0,.35,2.26,1.7,.08,.06);b.solid(0,0,1.95,4.5);b.pop();}
function signal(b,x,z,{height=6.7,arm=0,side=1,ped=false}={}){
 b.cylinder('photoSteel',x,height/2,z,.075,.105,height,10);b.cylinder('photoSteel',x,.2,z,.18,.22,.40,10);
 if(arm){b.rod('photoSteel',[x,height-.4,z],[x-side*arm*.6,height+.12,z],.057);b.rod('photoSteel',[x-side*arm*.6,height+.12,z],[x-side*arm,height+.19,z],.057);}
 const sx=x-side*arm;b.box('dark',sx,height-.70,z-.035,.46,1.22,.29);
 for(let k=0;k<3;k++){b.cylinder(k===0?'signalRed':k===1?'rust':'green',sx,height-.31-k*.37,z-.198,.119,.119,.027,16,Math.PI/2);b.box('dark',sx,height-.16-k*.37,z-.25,.38,.05,.26);}
 if(ped){b.box('dark',x,3.1,z-.03,.42,.45,.27);b.plane('sign:pedestrian',x,3.1,z-.18,.34,.36,Math.PI);}
 b.circle(x,z,.12);
}
function streetLamp(b,x,z,side,height=10.7){b.cylinder('photoSteel',x,height/2,z,.065,.10,height,10);let a=[x,height-.8,z];for(let i=1;i<=6;i++){const t=i/6,c=[x-side*3.4*t,height-.8+Math.sin(t*Math.PI/2)*.9,z];b.rod('photoSteel',a,c,.04);a=c;}b.box('photoSteel',x-side*3.5,height+.08,z,.62,.14,.24);}
function hopeStreet(mats){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,Y,CITY_ORIGIN.z,CITY_ANGLE);
 b.box('photoAsphalt',0,-.04,208,224,.08,480);b.box('photoAsphalt',0,-.036,-1,330,.08,23);
 for(const s of[-1,1]){b.box('sidewalk',s*14,.09,175,6,.18,330);b.walk(s*14,175,6,330,.18);b.box('photoGranite',s*11.05,.13,175,.19,.26,330);b.box('photoRedCurb',s*11.01,.125,39,.04,.20,67);for(let z=6;z<330;z+=3.8)b.box('photoFrame',s*14,.184,z,5.8,.005,.012);}
 // The reference intersection uses thin worn crossing/stop lines, not a zebra crossing.
 for(const z of[-4,5.3])b.box('white',0,.015,z,22,.012,.14,0,.44);
 for(const s of[-1,1]){b.box('yellow',s*.14,.018,179,.10,.009,330,0,.71);for(let z=18;z<330;z+=9)b.box('white',s*4.6,.017,z,.085,.009,3.6,0,.51);}
 b.box('yellow',0,.02,-3,104,.01,.10,0,.52);b.box('yellow',0,.02,-3.3,104,.01,.10,0,.52);
 place(b,2,.024,-9,0,P.addManhole);place(b,-10.6,.026,13,0,P.addStormDrain);place(b,10.6,.026,18,0,P.addStormDrain);
 // Left foreground tower: deep dark vertical concrete ribs above a recessed shop arcade.
 b.box('photoPrecast',-30,31,39,31,62,62);b.solid(-30,39,31,62);
 b.push(-14.4,0,39,-Math.PI/2);facade(b,{w:62,h:62,cols:34,rows:17,key:'photoPrecast',ground:5,fin:true,seed:48});b.pop();
 b.push(-30,0,7.9,0);facade(b,{w:31,h:62,cols:17,rows:17,key:'photoPrecast',ground:5,fin:true});b.pop();
 b.box('dark',-14.2,4.4,39,.9,1.25,62);b.box('dark',-30,4.4,7.2,31,1.25,.9);
 for(let z=14;z<70;z+=6){b.push(-14,0,z,-Math.PI/2);storefront(b,5.7,{logo:z<27});b.pop();b.box('photoPrecast',-13.55,2.15,z+3,.65,4.3,.66);}
 b.push(-25,0,7.12,0);storefront(b,9,{logo:true});b.pop();
 for(const x of[-14.4,-18,-23])b.cylinder('yellow',x,.57,5.8,.065,.072,1.1,8);
 // Ivory office behind the first block, then the blue glass slab beyond it.
 b.box('photoCream',-33,35,99,36,70,58);b.solid(-33,99,36,58);
 b.push(-14.8,0,99,-Math.PI/2);facade(b,{w:58,h:70,cols:14,rows:18,key:'photoCream',ground:4,window:2.4,seed:14});b.pop();
 b.push(-33,0,69.9,0);facade(b,{w:36,h:70,cols:8,rows:18,key:'photoCream',ground:4,window:2.9,seed:64});b.pop();
 b.box('photoGlassBlue',-41,49,151,37,98,42);for(let z=130;z<=172;z+=2.8)b.box('photoFrame',-22.4,49,z,.075,98,.04);for(let y=4;y<98;y+=3.2)b.box('photoFrame',-41,y,129.9,37,.045,.045);
 // Right foreground corporate tower and its paneled, raised public entrance.
 b.box('photoPodium',50,8.2,40,39,16.4,46);b.solid(50,40,39,46);b.box('photoPodium',56,8.2,10,27,16.4,14);b.solid(56,10,27,14);b.box('photoGlass',50,51.6,33,39,70.4,60);
 for(let z=3;z<=63;z+=2.85)b.box('photoCream',30.42,51.6,z,.16,70.4,.15);for(let y=17;y<=87;y+=3.15)b.box('photoCream',30.35,y,33,.18,.12,60);
 for(let x=31;x<=69;x+=2.85)b.box('photoCream',x,51.6,2.94,.16,70.4,.15);
 for(let y=0;y<=16.5;y+=2.6){b.box('photoFrame',30.29,y,33,.024,.032,60);b.box('photoFrame',50,y,2.90,39,.032,.03);}for(let z=3;z<63;z+=3.2)b.box('photoFrame',30.29,8.2,z,.024,16.4,.032);
 // Concrete/stone outdoor stair climbing sideways from the corner.
 for(let i=0;i<23;i++){const x=15.3+i*.42,h=(i+1)*.15;b.box('photoGranite',x,h/2,9,.43,h,13);b.walk(x,9,.43,13,h);}b.box('photoGranite',27,1.72,9,5,3.44,13);b.walk(27,9,5,13,3.44);
 for(const z of[2.4,15.6])rail(b,[15.1,.15,z],[25.3,3.45,z],1.02,'photoRail');rail(b,[25.3,3.45,15.6],[31,3.45,15.6],1.02,'photoRail');
 for(let z=18;z<50;z+=3)b.box('photoGlass',15,1.35,z,.10,2.7,2.9,0,.6);
 // PEGASUS: beige panel tower, close-spaced small windows and a narrow vertical banner.
 const px=33.3,pz=130,pw=36,pd=50,ph=95;
 b.box('photoStone',px,ph/2,pz,pw,ph,pd);b.solid(px,pz,pw,pd);
 b.push(px+3.25,0,pz-pd/2-.02,0);facade(b,{w:pw-6.5,h:ph,cols:10,rows:20,ground:5.2,window:2.1,seed:621});b.pop();
 b.push(px-pw/2-.03,0,pz,Math.PI/2);facade(b,{w:pd,h:ph,cols:10,rows:20,ground:5.2,window:2.4,seed:61});b.pop();
 b.plane('photoBanner',18.6,35.3,104.69,3.8,32,Math.PI);b.rod('photoBronze',[16.62,51.35,104.62],[20.58,51.35,104.62],.04);
 b.push(15.05,0,130,Math.PI/2);storefront(b,45,{top:4.55});b.pop();
 // Right depth is formed by a slender glass-and-concrete fin slab.
 b.box('photoGlassBlue',27.5,46,175,27,92,31);b.push(13.9,0,175,Math.PI/2);facade(b,{w:31,h:92,cols:12,rows:23,key:'photoCream',ground:5,fin:true});b.pop();
 b.box('photoStone',27,25,219,29,50,35);b.push(27,0,201.4,0);facade(b,{w:29,h:50,cols:8,rows:14,ground:4,window:2,seed:20});b.pop();
 b.box('photoCream',-26,18,250,25,36,49);b.push(-13.4,0,250,-Math.PI/2);facade(b,{w:49,h:36,cols:15,rows:10,key:'photoCream',ground:4,window:1.9});b.pop();
 for(let i=0;i<7;i++){const s=i%2?1:-1,z=283+i*29,h=24+(i*13%39);b.box(i%3?'photoCream':'photoGlassBlue',s*(19+i%3*5),h/2,z,26,h,25);}
 b.box('photoCream',-24,25,420,25,50,20);for(let y=4;y<50;y+=3.5)b.box('photoGlassBlue',-24,y,409.94,24,.9,.1);
 // Tree locations and street hardware are authored, not randomly scattered.
 for(const [s,zs]of[[-1,[15,36,54,71,89,109,129,151,174,198,225,251,280]],[1,[26,46,66,88,110,132,156,180,207,237,267,296]]])for(let i=0;i<zs.length;i++)streetTree(b,s*12.1,zs[i],{height:i<3?10.2-i*.36:8.8,width:i<2?8.7:6.5,seed:100+i+s*21,shadow:true});
 streetTree(b,13.8,-10.5,{height:10.5,width:9.6,seed:985,shadow:true});streetTree(b,13.8,-23,{height:10.8,width:9,seed:987,shadow:true});
 signal(b,-11.95,5.5,{height:5.8,ped:true});signal(b,11.8,15.2,{height:8.0,arm:3.8,side:1});b.plane('photoHope',11.5,5.58,10.6,1.36,.44,Math.PI);
 b.rod('photoSteel',[11.8,5.8,15.2],[11.8,5.8,10.7],.035);signal(b,11.6,36,{height:5.6,ped:true});
 for(const s of[-1,1])for(const z of[21,92,166,242])streetLamp(b,s*12.2,z,s,10.9);
 place(b,-12.6,.19,4,0,P.addHydrant);place(b,12.6,.19,32,0,P.addHydrant);for(const s of[-1,1])for(const z of[44,105,184,255]){place(b,s*12.6,.19,z,0,P.addParkingMeter);place(b,s*14.3,.19,z+4,0,P.addTrashBin);}
 smallCar(b,-8.7,57,0,.45);smallCar(b,-8.7,64,0,.71);smallCar(b,8.8,187,Math.PI,.70);smallCar(b,-8.7,300,0,.77);smallCar(b,8.8,310,0,.63);
 b.pop();return{object:b.finish('Hope Street / authored photographic reconstruction'),colliders:b.colliders,walks:b.walks};
}
function dish(b,x,y,z,r=1.4){const g=new T.BufferGeometry(),p=[],idx=[],rings=8,n=28;for(let j=0;j<=rings;j++)for(let i=0;i<=n;i++){const t=j/rings*r,a=i/n*Math.PI*2;p.push(t*Math.cos(a),t*Math.sin(a),t*t/(r*2));}for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i;idx.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,'dishMesh',x,y,z,1,1,1,.2,-.4);g.dispose();b.rod('photoSteel',[x,y-r,z+.4],[x,y+r*.3,z-.8],.045);b.rod('photoSteel',[x-r*.85,y,z+.2],[x,y+r*.3,z-.8],.03);b.rod('photoSteel',[x+r*.85,y,z+.2],[x,y+r*.3,z-.8],.03);b.cylinder('photoSteel',x,y-r-1,z,.08,.1,2,8);}
function clinicCourt(mats){
 const b=new UrbanBatch(mats);b.push(CLINIC_ORIGIN.x,Y,CLINIC_ORIGIN.z,CLINIC_ANGLE);
 b.box('photoCobble',0,-.02,18,68,.08,88);b.walk(0,18,68,88,.02);
 b.box('photoMosaic',-18.5,4.25,7,6.6,8.5,2.7);b.solid(-18.5,7,6.6,2.7);b.box('photoBronze',-18.5,8.54,7,6.8,.14,2.9);
 b.box('photoStucco',8.1,3.4,24.3,42.5,6.8,12.6);b.solid(8.1,24.3,42.5,12.6);
 for(const[x,w,h,z]of[[-8.9,8,1.2,25.1],[-.8,11,1.85,26],[10.5,9,.8,26],[20,16,2.1,27]]){b.box('photoStucco',x,6.8+h/2,z,w,h,8);b.box('photoBronze',x,6.83+h,z-4,w,.065,.13);}
 // Left return wing, old satellite dish, black tank and chimney.
 b.box('photoCream',-14,2.35,19,10,4.7,5);b.solid(-14,19,10,5);b.box('photoBlue',-14,3.60,16.15,10,.62,.42);b.plane('photoDermica',-14,4.35,16.39,9.7,.9,Math.PI);
 b.box('brickRed',-17,6.2,21.8,.75,2.5,.8);b.box('photoBronze',-17,7.48,21.8,.92,.15,.98);dish(b,-16,8.1,23.8,1.55);
 b.cylinder('dark',-3,8.55,28,.56,.62,1.25,12);b.box('photoStucco',-3,7.5,28,2,1,2.2);
 for(let y=7;y<26;y+=1.3){for(const x of[14.3,14.63])b.rod('photoSteel',[x,y,28.7],[x,y+1.3,28.7],.02);b.rod('photoSteel',[14.3,y,28.7],[14.63,y+1.3,28.7],.014);b.rod('photoSteel',[14.63,y,28.7],[14.3,y+1.3,28.7],.014);}for(const x of[-8,30])b.rod('photoSteel',[14.45,25.8,28.7],[x,7,33],.009);
 // Separate physical lightboxes, matching the three reference signs.
 const signs=[[-6.0,10.1,'photoClinic'],[3.65,7.4,'photoLab'],[13.05,11,'photoMarisa']];
 for(const[x,w,key]of signs){b.box('photoFrame',x,5.58,17.83,w+.13,1.78,.29);b.plane(key,x,5.58,17.65,w,1.67,Math.PI);}
 b.box('photoFrame',26.2,5.58,17.83,8.1,1.78,.29);b.plane('sign:bakery',26.2,5.58,17.65,7.95,1.65,Math.PI);
 // Long blue triangular canvas canopy, with crisp steel seams and a dropped valance.
 quad(b,'photoCanvas',[[-12,4.34,17.40],[30.2,4.34,17.40],[30.2,3.67,14.62],[-12,3.67,14.62]],[0,0,12,0,12,1,0,1]);
 b.box('photoBlue',9.1,3.59,14.60,42.2,.20,.045);for(let x=-12;x<31;x+=6.02)b.rod('photoSteel',[x,4.36,17.41],[x,3.69,14.62],.012);
 quad(b,'photoBlue',[[-12,3.64,17.4],[-12,4.34,17.4],[-12,3.67,14.62],[-12,3.64,14.62]]);
 // Glass and aluminium fronts: clinic frosted panes, dark green lab, bakery double doors.
 b.push(-6,0,17.5,0);storefront(b,10.4,{key:'photoFrost',base:.74,top:3.57,step:2.05});b.plane('photoGlass',0,3.18,-.045,10.3,.64,Math.PI);for(const x of[-4.1,-2.05,0,2.05,4.1])b.box('photoFrame',x,2.96,-.06,.06,.7,.1);b.box('photoFrame',0,2.66,-.06,10.4,.065,.1);b.pop();
 b.push(3.7,0,17.48,0);storefront(b,7.5,{key:'photoGlass',base:.55,top:3.57,step:3.75});for(const x of[-2.4,0,2.4])b.plane('photoLabWindow',x,2.1,-.095,2.35,2.89,Math.PI);b.pop();
 b.push(13.05,0,17.47,0);storefront(b,11,{key:'photoGlass',base:.37,top:3.57,step:3.45});for(const x of[-5.1,-1.7,1.7,5.1]){b.box('rust',x,1.88,-.07,.10,3,.12);for(let k=0;k<5;k++)b.box('photoBronze',x+1.2,.9+k*.28,-.095,.54,.07,.02);}b.pop();
 b.push(24.1,0,17.47,0);storefront(b,10.6,{key:'photoGlass',base:.37,top:3.57,step:3.4});b.pop();
 for(const x of[-11.4,-.6,7.6,18.7,29.5])b.box('photoRail',x,1.83,17.35,.20,3.6,.18);
 b.box('photoGranite',9.2,.19,15.95,43,.38,3.2);b.walk(9.2,15.95,43,3.2,.38);
 // Switchback accessible ramp, curb edges and paired white tubular rails.
 b.box('photoGranite',-7.3,.36,15.4,10.8,.72,2.7);b.walk(-7.3,15.4,10.8,2.7,.72);
 quad(b,'sidewalk',[[-12.7,.10,9.7],[-2,.58,9.7],[-2,.58,11.4],[-12.7,.10,11.4]]);b.walk(-7.35,10.55,10.7,1.7,.34,.48/10.7,0);
 quad(b,'sidewalk',[[-12.7,.72,12],[-2,.58,12],[-2,.58,13.7],[-12.7,.72,13.7]]);b.walk(-7.35,12.85,10.7,1.7,.65,-.14/10.7,0);
 b.box('sidewalk',-1.2,.29,11.7,1.6,.58,4.0);b.walk(-1.2,11.7,1.6,4,.58);
 for(const z of[9.65,11.45])rail(b,[-12.7,.10,z],[-2,.58,z]);for(const z of[12.05,13.75])rail(b,[-12.7,.72,z],[-2,.58,z]);rail(b,[-.40,.58,9.65],[-.40,.58,13.75]);rail(b,[-12.7,.72,13.75],[-12.7,.72,16.7]);
 for(const z of[9.65,13.75])b.box('photoGranite',-7.35,.15,z,10.7,.30,.13);
 for(let x=-17;x<30;x+=3.4){b.box('white',x,.028,6.7,.08,.009,5,0,.5);place(b,x+1.6,.05,8.8,0,P.addWheelStop);}
 // Sharp shade under the canopy is tied to its footprint, not painted into the signs.
 b.plane('photoSoftShadow',9,.401,16,42,2.8,0,-Math.PI/2);
 streetTree(b,-17.4,15.3,{height:5.8,width:3.5,seed:65,small:true,shadow:true});
 b.pop();return{object:b.finish('Clinical plaza / authored photographic reconstruction'),colliders:b.colliders,walks:b.walks};
}
function photoHandedness(part,origin,angle,scaleX=1){
 const c=Math.cos(angle),s=Math.sin(angle),reflect=(x,z)=>{const dx=x-origin.x,dz=z-origin.z,u=c*dx-s*dz,v=s*dx+c*dz;return{x:origin.x-c*u*scaleX+s*v,z:origin.z+s*u*scaleX+c*v};};
 part.object.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,isLetter=['photoClinic','photoLab','photoMarisa','photoLabWindow','photoBanner','photoFamima','photoHope','photoDermica'].some(k=>m.material===part.materials?.[k]);for(let i=0;i<p.count;i++){const q=reflect(p.getX(i),p.getZ(i));p.setXYZ(i,q.x,p.getY(i),q.z);const nx=c*n.getX(i)-s*n.getZ(i),nz=s*n.getX(i)+c*n.getZ(i),v=new T.Vector3(-c*nx/scaleX+s*nz,n.getY(i),s*nx/scaleX+c*nz).normalize();n.setXYZ(i,v.x,v.y,v.z);if(u&&isLetter)u.setX(i,1-u.getX(i));}
 // Restore winding after the handedness conversion; signs keep their readable UV orientation.
 for(const a of Object.values(g.attributes))for(let i=0;i<a.count;i+=3)for(let j=0;j<a.itemSize;j++){const t=a.array[(i+1)*a.itemSize+j];a.array[(i+1)*a.itemSize+j]=a.array[(i+2)*a.itemSize+j];a.array[(i+2)*a.itemSize+j]=t;}g.computeBoundingBox();g.computeBoundingSphere();});
 for(const q of part.colliders){Object.assign(q,reflect(q.x,q.z));if(q.kind==='obb'){q.ry=2*angle-q.ry;q.w*=scaleX;}else q.r*=Math.min(1,scaleX);}
 for(const q of part.walks){Object.assign(q,reflect(q.x,q.z));q.ry=2*angle-q.ry;q.w*=scaleX;q.slopeX=-q.slopeX/scaleX;}
 return part;
}
export function createReferenceScenes(mats){const hope=hopeStreet(mats),clinic=clinicCourt(mats),object=new T.Group();hope.materials=clinic.materials=mats;photoHandedness(hope,CITY_ORIGIN,CITY_ANGLE);photoHandedness(clinic,CLINIC_ORIGIN,CLINIC_ANGLE,.64);object.name='Two photographic street landmarks';object.add(hope.object,clinic.object);object.userData.cityStats={triangles:hope.object.userData.cityStats.triangles+clinic.object.userData.cityStats.triangles,draws:hope.object.userData.cityStats.draws+clinic.object.userData.cityStats.draws,parts:0};return{object,hope,clinic,colliders:[...hope.colliders,...clinic.colliders],walks:[...hope.walks,...clinic.walks]};}
export function referenceWaypoint(name){
 if(name==='photo-clinic'){const p=clinicToWorld(-6.4,-7.5);return{...p,label:'图二 · 诊所与糕点房',yaw:CLINIC_ANGLE+Math.PI+.326,pitch:.135,eye:1.7,fov:49.8,referenceAspect:1024/683,range:480,urbanPhoto:true};}
 const p=cityToWorld(2.8,-22);return{...p,label:'图一 · Hope St',yaw:CITY_ANGLE+Math.PI-.025,pitch:.15,eye:1.8,fov:41.8,referenceAspect:1000/681,range:510,urbanPhoto:true};
}
const WORLD_HOPE_SUN=new T.Vector3(-.85,1.1,.10).applyAxisAngle(UP,CITY_ANGLE).normalize(),WORLD_CLINIC_SUN=new T.Vector3(1,.95,-.38).applyAxisAngle(UP,CLINIC_ANGLE).normalize();
export function referenceEnvironment(wx,wz,level){const c=clinicLocal(wx,wz),p=worldToCity(wx,wz),clinic=(1-ease(38,76,Math.hypot(c.x-5,c.z-12)))*(1-ease(345,377,p.z+382));const route=exitSample(wx,wz,{}),urban=level===11?1:ease(220,350,route.s)*route.influence;if(urban<.001)return null;const q=Math.min(1,clinic);return{amount:urban,clinic:q,hero:(Math.abs(p.x)<62&&p.z>-50&&p.z<335)||q>.05,sky:new T.Color('#cdd7bc').lerp(new T.Color('#2d78cf'),q),fog:new T.Color('#cdd7bc').lerp(new T.Color('#95bddf'),q),sun:WORLD_HOPE_SUN.clone().lerp(WORLD_CLINIC_SUN,q).normalize(),sunColor:new T.Color('#fff2d8').lerp(new T.Color('#fff9ee'),q),sunPower:2.45+q*.45,fill:new T.Color('#b8c6cd').lerp(new T.Color('#9cbbef'),q),fillPower:1.35+q*.15,exposure:1.18-q*.04,near:210,far:510};}
