import * as T from './vendor/three.module.min.js';
import {HOPE_GROUND_RECTS} from './urban-ground-ownership.js?v=60';
import {UrbanBatch,urbanRandom} from './urban-batch.js?v=60';
import {exitPoint,exitSample,EXIT_CITY_Y,ease} from './exit-route.js?v=60';
import {CITY_ORIGIN,CITY_ANGLE,cityToWorld,worldToCity} from './urban-layout.js?v=60';
import * as P from './urban-props.js?v=60';
import {addBuilding} from './urban-buildings.js?v=60';
const Y=EXIT_CITY_Y,UP=new T.Vector3(0,1,0),plane=new T.PlaneGeometry(1,1);
const CLINIC_PATH=282,cp=exitPoint(CLINIC_PATH);
export const CLINIC_ANGLE=Math.atan2(cp.nx,cp.nz);
export const CLINIC_ORIGIN={x:cp.x+cp.nx*28,z:cp.z+cp.nz*28};
export function clinicToWorld(x,z,out={}){const c=Math.cos(CLINIC_ANGLE),s=Math.sin(CLINIC_ANGLE);out.x=CLINIC_ORIGIN.x+c*x+s*z;out.z=CLINIC_ORIGIN.z-s*x+c*z;return out;}
function clinicLocal(wx,wz){const c=Math.cos(CLINIC_ANGLE),s=Math.sin(CLINIC_ANGLE),x=wx-CLINIC_ORIGIN.x,z=wz-CLINIC_ORIGIN.z;return{x:c*x-s*z,z:s*x+c*z};}
const place=(b,x,y,z,ry,fn,args={})=>{b.push(x,y,z,ry);fn(b,args);b.pop();};
function quad(b,key,points,uv=[0,0,1,0,1,1,0,1],tone=1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();if(g.attributes.normal.getY(0)<-.01){g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();}b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
function rail(b,a,c,height=1.04,key='photoRail'){for(const h of[height,.52])b.rod(key,[a[0],a[1]+h,a[2]],[c[0],c[1]+h,c[2]],.026);const n=Math.max(1,Math.ceil(Math.hypot(c[0]-a[0],c[2]-a[2])/1.8));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(c[0]-a[0])*t,y=a[1]+(c[1]-a[1])*t,z=a[2]+(c[2]-a[2])*t;b.rod(key,[x,y,z],[x,y+height,z],.027);}}
// A ramp is a concrete volume, with its lower edges meeting the courtyard.
// quad() reverses its supplied winding, so side loops below run inward first.
function rampWedge(b,x0,x1,z0,z1,h0,h1,{bottom0=.02,bottom1=.02,key='sidewalk',walk=true}={}){
 const w=x1-x0,d=z1-z0;
 quad(b,key,[[x0,h0,z0],[x1,h1,z0],[x1,h1,z1],[x0,h0,z1]],[0,0,w/2,0,w/2,d/2,0,d/2]);
 quad(b,'photoGranite',[[x0,bottom0,z0],[x1,bottom1,z0],[x1,h1,z0],[x0,h0,z0]],[0,0,w/.75,0,w/.75,h1/.75,0,h0/.75]);
 quad(b,'photoGranite',[[x1,bottom1,z1],[x0,bottom0,z1],[x0,h0,z1],[x1,h1,z1]],[0,0,w/.75,0,w/.75,h0/.75,0,h1/.75]);
 if(h0>bottom0+.0001)quad(b,'photoGranite',[[x0,bottom0,z1],[x0,bottom0,z0],[x0,h0,z0],[x0,h0,z1]],[0,0,d/.75,0,d/.75,h0/.75,0,h0/.75]);
 if(h1>bottom1+.0001)quad(b,'photoGranite',[[x1,bottom1,z0],[x1,bottom1,z1],[x1,h1,z1],[x1,h1,z0]],[0,0,d/.75,0,d/.75,h1/.75,0,h1/.75]);
 if(walk)b.walk((x0+x1)/2,(z0+z1)/2,w,d,(h0+h1)/2,(h1-h0)/w,0);
}
function rampKerb(b,x0,x1,z0,z1,h0,h1){rampWedge(b,x0,x1,z0,z1,h0+.095,h1+.095,{bottom0:h0,bottom1:h1,key:'photoGranite',walk:false});}
function facade(b,{w,h,cols,rows,key='photoStone',recess=.16,sill=1.2,window=1.7,seed=1,ground=5,fin=false}){
 const r=urbanRandom(seed),bw=w/cols,fh=(h-ground)/rows;
 if(!fin)b.box(key,0,h/2,.10,w,h,.20);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=-w/2+bw*(i+.5),y=ground+fh*(j+.5),ww=fin?bw*.78:Math.min(window,bw*.68),wh=fin?fh-.2:Math.min(2.65,fh*.56),z=fin?-.30:-recess;
  b.box('photoShade',x,y,z+.09,ww+.12,wh+.12,.04);
  b.plane('photoGlass',x,y,z-.012,ww,wh,Math.PI,0,.62+r()*.5);
  if(!fin&&r()>.19){const n=2+Math.floor(r()*3);for(let k=0;k<n;k++){const a=x-ww/2+(k+.5)*ww/n;b.plane('photoCurtain',a,y,z-.025,ww/n*.68,wh*.96,Math.PI,0,.51+r()*.5);}}
  b.box('photoFrame',x,y-wh/2-.035,z-.03,ww+.14,.07,.18);b.box('photoFrame',x,y+wh/2+.025,z-.03,ww+.14,.045,.15);
  if(!fin&&j>2&&(i+j*3)%17===0){b.plane('photoGlass',x+ww*.24,y,z-.21,ww*.46,wh*.93,Math.PI+.29,0,.83);b.box('photoFrame',x+ww*.47,y,z-.18,.035,wh,.12);}
  if(!fin&&(i*3+j)%13===0)b.box(key,x-ww*.3,y-wh/2-.23,-.025,.075,.4,.007,0,.79);
  for(const dx of[-ww/2,0,ww/2])b.box('photoFrame',x+dx,y,z-.04,.035,wh,.1);
 }
 // Shallow ribs preserve visible glazing down the oblique street view; the
 // former .60 m fin-to-glass lead closed every bay beyond the first few rows.
 if(fin){for(let i=0;i<=cols;i++)b.box(key,-w/2+i*bw,(h+ground)/2,-.28,Math.min(.32,bw*.18),h-ground,.32);for(let j=0;j<=rows;j++)b.box(key,0,ground+j*fh,-.29,w,.12,.20);}
 else for(let i=0;i<=cols;i++)b.box(key,-w/2+i*bw,(h+ground)/2,-.07,.18,h-ground,.3,0,.87);
}
function storefront(b,w,{key='photoRetail',base=.15,top=4.1,step=2.1,logo=false}={}){
 b.box('photoShade',0,(top+base)/2,.22,w,top-base,.2);b.plane(key,0,(top+base)/2,.09,w,top-base,Math.PI,0,1);
 for(const side of[-1,1])b.box('photoFrame',side*w/2,(top+base)/2,.015,.085,top-base,.30);
 b.box('photoFrame',0,top+.035,.025,w+.13,.10,.29);b.box('photoGranite',0,base-.045,.025,w+.16,.09,.35);
 for(let x=-w/2;x<=w/2+.01;x+=step)b.box('photoFrame',x,(top+base)/2,-.035,.055,top-base,.11);
 for(const y of[base,top,top-.65])b.box('photoFrame',0,y,-.035,w,.05,.11);
 b.box('photoSteel',-w*.2,1.45,-.1,.025,.38,.04);b.box('photoSteel',-w*.2+.10,1.45,-.1,.025,.38,.04);
 if(logo)b.plane('photoFamima',0,top+.51,-.34,Math.min(5.8,w),.84,Math.PI);
 if(key==='photoShop'){for(let i=0;i<3;i++){const h=base*(i+1)/3;b.box('photoGranite',0,h/2,-.6+i*.19,w,h,.30);b.box('yellow',0,h+.003,-.74+i*.19,w,.01,.045,0,.8);}for(const x of[-w*.32,w*.31]){b.rod('photoRail',[x,base,-.75],[x,base+1,-.75],.025);b.rod('photoRail',[x,base+1,-.75],[x,base+1,.04],.025);}}
}
function streetTree(b,x,z,{height=10.4,width=7.4,seed=1,shadow=true,small=false}={}){
 const r=urbanRandom(seed),trunk=height*.38,ry=.17+r()*.34;
 const lean=(r()-.5)*.45,root=[x,.12,z],joint=[x+lean,trunk*.58,z-.12],fork=[x-lean*.6,trunk,z+.18];
 b.rod('photoTrunk',root,joint,.23);b.rod('photoTrunk',joint,fork,.16);
 for(let i=0;i<5;i++){const a=i*2.399+r()*.8,h=trunk+height*(.17+r()*.16),end=[x+Math.cos(a)*width*(.18+r()*.12),h,z+Math.sin(a)*width*.23];b.rod('photoTrunk',i%2?joint:fork,end,.065+r()*.035);b.rod('photoTrunk',end,[end[0]+Math.cos(a+.5)*.65,end[1]+.65,end[2]+Math.sin(a+.5)*.65],.026);}
 for(let i=0;i<4;i++){const a=i*1.6;b.rod('photoTrunk',[x,.22,z],[x+Math.cos(a)*.43,.06,z+Math.sin(a)*.43],.06);}
 if(z>150)for(let j=0;j<2;j++)b.plane('photoTree',x,height*.47,z,width,height,j*Math.PI/2+.1,0,.72);
 const n=small?8:z>150?8:15;
 for(let k=0;k<n;k++){const a=k*2.399,rad=(k%4)/4,px=x+Math.cos(a)*width*.32*rad,pz=z+Math.sin(a)*width*.29*rad,py=height*.64+Math.sin(k*1.63)*height*.14,sz=width*(.48+r()*.15);for(let j=0;j<3;j++)b.plane('photoCrown',px,py,pz,sz,sz*.90,ry+j*Math.PI/3,0,.88+r()*.14);}
 for(let i=0;i<9;i++){const a=i*2.399,px=x+Math.cos(a)*width*.37,pz=z+Math.sin(a)*width*.34;for(let j=0;j<2;j++)b.plane('photoLeaf',px,height*.61+Math.sin(i)*.7,pz,2.5,2.1,a+j*Math.PI/2,0,.8);}
 b.circle(x,z,.29);b.box('photoSteel',x,.012,z,1.44,.025,1.44);for(let i=-4;i<=4;i++)b.box('photoGranite',x+i*.15,.031,z,.026,.014,1.33);
}
function smallCar(b,x,z,ry=0,tone=.6){b.push(x,.05,z,ry);b.box('photoSteel',0,.48,0,1.76,.60,4.4,0,tone);b.box('photoGlass',0,.97,-.12,1.58,.61,2.25,0,.7);b.box('photoSteel',0,1.30,-.2,1.61,.10,2,0,tone);b.box('photoSteel',0,.82,1.52,1.76,.12,1.2,0,tone);for(const s of[-1,1]){b.box('photoFrame',s*.73,1.02,-.1,.06,.61,2.3);for(const z of[-1.35,1.4])b.cylinder('rubber',s*.90,.35,z,.34,.34,.20,12,0,Math.PI/2);b.box('white',s*.58,.55,2.24,.46,.17,.02);b.box('red',s*.60,.60,-2.24,.43,.12,.02);}b.box('photoFrame',0,.35,2.26,1.7,.08,.06);b.solid(0,0,1.95,4.5);b.pop();}
function signal(b,x,z,{height=6.7,arm=0,side=1,ped=false}={}){
 b.cylinder('photoPole',x,height/2,z,.075,.105,height,10);for(const[y,rt,rb,h]of[[.10,.28,.30,.20],[.25,.21,.26,.10],[.56,.13,.21,.54],[.85,.14,.14,.055]])b.cylinder('photoPole',x,y,z,rt,rb,h,12);
 if(arm){b.rod('photoSteel',[x,height-.4,z],[x-side*arm*.6,height+.12,z],.057);b.rod('photoSteel',[x-side*arm*.6,height+.12,z],[x-side*arm,height+.19,z],.057);}
 const sx=x-side*arm;b.box('dark',sx,height-.70,z-.035,.46,1.22,.29);
 for(let k=0;k<3;k++){b.cylinder(k===0?'signalRed':'photoShade',sx,height-.31-k*.37,z-.198,.119,.119,.027,16,Math.PI/2);b.box('dark',sx,height-.16-k*.37,z-.25,.38,.05,.26);}
 if(ped){b.box('dark',x,3.1,z-.03,.42,.45,.27);b.plane('photoWalkHand',x,3.1,z-.18,.34,.40,Math.PI);}
 b.cylinder('photoSignalHot',sx,height-.31,z-.216,.073,.073,.017,16,Math.PI/2);
 b.circle(x,z,.12);
}
function streetLamp(b,x,z,side,height=10.7){b.cylinder('photoSteel',x,height/2,z,.065,.10,height,10);let a=[x,height-.8,z];for(let i=1;i<=6;i++){const t=i/6,c=[x-side*3.4*t,height-.8+Math.sin(t*Math.PI/2)*.9,z];b.rod('photoSteel',a,c,.04);a=c;}b.box('photoSteel',x-side*3.5,height+.08,z,.62,.14,.24);}
function hopeStreet(mats){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,Y,CITY_ORIGIN.z,CITY_ANGLE);
 for(const[x0,x1,z0,z1]of HOPE_GROUND_RECTS)b.box('photoAsphalt',(x0+x1)/2,-.04,(z0+z1)/2,x1-x0,.08,z1-z0);
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
 for(let z=14;z<70;z+=6){b.push(-14,0,z,-Math.PI/2);storefront(b,5.7,{key:'photoShop',base:.46,logo:z<27});b.pop();b.box('photoPrecast',-13.55,2.15,z+3,.65,4.3,.66);}
 b.push(-25,0,7.12,0);storefront(b,9,{key:'photoShop',base:.46,logo:true});b.pop();
 // Projecting circular shop signs, tied to the arcade's actual brackets.
 for(const z of[17,24]){b.rod('photoFrame',[-14.1,4.48,z],[-13.08,4.48,z],.04);b.cylinder('photoFrame',-13.07,4.48,z,.43,.43,.26,32,Math.PI/2);b.cylinder('dark',-13.07,4.48,z-.14,.386,.386,.025,32,Math.PI/2);b.plane('photoFamimaRound',-13.07,4.48,z-.16,.56,.56,Math.PI);}
 for(const x of[-14.4,-18,-23])b.cylinder('yellow',x,.57,5.8,.065,.072,1.1,8);
 // Ivory office behind the first block, then the blue glass slab beyond it.
 b.box('photoCream',-33,35,99,36,70,58);b.solid(-33,99,36,58);
 b.push(-14.8,0,99,-Math.PI/2);facade(b,{w:58,h:70,cols:14,rows:18,key:'photoCream',ground:4,window:1.5,seed:14});b.pop();
 b.push(-33,0,69.9,0);facade(b,{w:36,h:70,cols:8,rows:18,key:'photoCream',ground:4,window:1.5,seed:64});b.pop();
 b.box('photoGlassBlue',-41,49,151,37,98,42);for(let z=130;z<=172;z+=2.8)b.box('photoFrame',-22.4,49,z,.075,98,.04);for(let y=4;y<98;y+=3.2)b.box('photoFrame',-41,y,129.9,37,.045,.045);
 // Right foreground corporate tower and its paneled, raised public entrance.
 b.box('photoPodium',50,8.2,33,37.2,16.4,60);b.solid(50,33,39,60);b.box('photoPodium',50,8.2,2.95,39,16.4,.35);
 b.box('photoPodium',30.5,1.725,33,.36,3.45,60);b.box('photoPodium',30.5,11.3,33,.36,10.2,60);for(const[a,c]of[[3,4.05],[7.75,9.75],[13.45,63]])b.box('photoPodium',30.5,4.825,(a+c)/2,.36,2.75,c-a);b.box('photoGlass',50,51.6,33,39,70.4,60);
 for(let z=3;z<=63;z+=2.1)b.box('photoCream',30.42,51.6,z,.16,70.4,.15);for(let y=17;y<=87;y+=3.6)b.box('photoCream',30.35,y,33,.18,.065,60);
 for(let x=31;x<=69;x+=2.1)b.box('photoCream',x,51.6,2.94,.16,70.4,.15);
 for(let y=0;y<=16.5;y+=2.6){for(const[a,c]of(y>3.45&&y<6.25?[[3,4.05],[7.75,9.75],[13.45,63]]:[[3,63]]))b.box('photoFrame',30.29,y,(a+c)/2,.024,.032,c-a);b.box('photoFrame',50,y,2.90,39,.032,.03);}for(let z=3;z<63;z+=3.2){const portal=(z>4.05&&z<7.75)||(z>9.75&&z<13.45);for(const[a,c]of(portal?[[0,3.45],[6.25,16.4]]:[[0,16.4]]))b.box('photoFrame',30.29,(a+c)/2,z,.024,c-a,.032);}
 // Concrete/stone outdoor stair climbing sideways from the corner.
 for(let i=0;i<23;i++){const x=15.3+i*.42,h=(i+1)*.15;b.box('photoGranite',x,h/2,9,.43,h,13);b.walk(x,9,.43,13,h);}b.box('photoGranite',27.8,1.725,9,6.5,3.45,13);b.walk(27.8,9,6.5,13,3.45);
 // A solid granite stair cheek supports a single grasp rail and inset tread lights.
 {const g=new T.BoxGeometry(10.3,1,.36),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)>0?1.04+(p.getX(i)+5.15)/10.3*3.45:0);g.computeVertexNormals();g.deleteAttribute('uv');b.add(g,'photoGranite',20.225,0,15.55);g.dispose();b.solid(20.225,15.55,10.3,.36);}
 for(const z of[2.5,15.37]){b.rod('photoRail',[15.15,1.08,z],[25.35,4.47,z],.027);b.rod('photoRail',[15.15,1.08,z],[14.88,1.08,z],.027);b.rod('photoRail',[25.35,4.47,z],[30.18,4.47,z],.027);for(let i=0;i<7;i++){const x=15.3+i*1.6,h=1.13+i*.57;if(z<3)b.rod('photoRail',[x,h-.97,z],[x,h,z],.026);else b.rod('photoRail',[x,h,15.52],[x,h,z],.015);}}
 for(let i=1;i<22;i+=3){const x=15.3+i*.42,h=(i+1)*.15+.56;b.cylinder('photoSteel',x,h,15.35,.095,.095,.045,12,Math.PI/2);b.box('lamp',x,h-.023,15.31,.11,.028,.015);}
 // Real entry recesses at the raised landing, aligned with the tower skin.
 for(const z of[5.9,11.6]){b.push(30.90,3.45,z,Math.PI/2);storefront(b,3.7,{key:'photoLobby',base:.03,top:2.75,step:1.85});for(const x of[-.13,.13])b.rod('photoRail',[x,1.02,-.12],[x,1.79,-.12],.024);b.pop();}
 for(const z of[4.05,7.75,9.75,13.45])b.box('photoBronze',30.73,4.85,z,.70,2.8,.095);for(const z of[5.9,11.6])b.box('photoBronze',30.73,6.24,z,.70,.10,3.85);
 // Raised granite planting terraces and the dark horizontal air-intake louvers.
 for(const [z,d]of[[25,15],[44,17]]){b.box('photoGranite',20,.73,z,9,1.46,d);b.box('bark',20,1.48,z,8.5,.03,d-.5);b.solid(20,z,9,d);b.box('photoShade',29.9,3.15,z,.20,3.1,d);for(let y=1.68;y<4.7;y+=.18)b.box('photoSteel',29.72,y,z,.25,.065,d);for(let k=0;k<14;k++){const pz=z-d/2+.7+k*(d-1.4)/13;b.plane('photoLeaf',15.8,1.8,pz,1.1,.82,Math.PI/2,0,.95);if(k%2===0){b.sphere('white',15.72,1.71,pz,.13,.08,.14);b.sphere('white',15.85,1.70,pz+.16,.12,.07,.1);}}}
 for(let y=2.6;y<16.4;y+=2.6)for(let z=4;z<62;z+=3.2)for(const dy of[-.075,.075]){b.box('photoRail',30.265,y+dy,z,.025,.045,.045);b.box('photoFrame',30.25,y-.12,z+.03,.017,.20,.012,0,.75);}
 // PEGASUS: beige panel tower, close-spaced small windows and a narrow vertical banner.
 const px=33.3,pz=130,pw=36,pd=50,ph=95;
 b.box('photoStone',px,ph/2,pz,pw,ph,pd);b.solid(px,pz,pw,pd);
 b.push(px+3.25,0,pz-pd/2-.02,0);facade(b,{w:pw-6.5,h:ph,cols:10,rows:20,ground:5.2,window:2.1,seed:621});b.pop();
 b.push(px-pw/2-.03,0,pz,Math.PI/2);facade(b,{w:pd,h:ph,cols:10,rows:20,ground:5.2,window:2.4,seed:61});b.pop();
 b.plane('photoBanner',20.8,36.8,104.69,3.8,32,Math.PI);b.rod('photoBronze',[18.82,52.85,104.62],[22.78,52.85,104.62],.04);
 for(let z=110;z<151;z+=5){b.push(15.05,0,z,Math.PI/2);storefront(b,4.85,{key:z%10?'photoRetail':'photoShop',top:4.55,step:2.42});b.pop();}
 // Right depth is formed by a slender glass-and-concrete fin slab.
 b.box('photoGlassBlue',27.5,46,175,27,92,31);b.push(13.9,0,175,Math.PI/2);facade(b,{w:31,h:92,cols:12,rows:23,key:'photoCream',ground:5,fin:true});b.pop();
 b.box('photoStone',27,25,219,29,50,35);b.push(27,0,201.4,0);facade(b,{w:29,h:50,cols:8,rows:14,ground:4,window:2,seed:20});b.pop();
 b.box('photoCream',-26,18,250,25,36,49);b.push(-13.4,0,250,-Math.PI/2);facade(b,{w:49,h:36,cols:15,rows:10,key:'photoCream',ground:4,window:1.9});b.pop();
 for(let i=0;i<7;i++){const s=i%2?1:-1,z=283+i*29,h=24+(i*13%39);b.box(i%3?'photoCream':'photoGlassBlue',s*(19+i%3*5),h/2,z,26,h,25);}
 b.box('photoCream',-24,25,420,25,50,20);for(let y=4;y<50;y+=3.5)b.box('photoGlassBlue',-24,y,409.94,24,.9,.1);
 // Tree locations and street hardware are authored, not randomly scattered.
 for(const [s,zs]of[[-1,[15,36,54,71,89,109,129,151,174,198,225,251,280]],[1,[26,46,66,88,110,132,156,180,207,237,267,296]]])for(let i=0;i<zs.length;i++)streetTree(b,s*12.1,zs[i],{height:i<3?10.2-i*.36:8.8,width:i<2?8.7:6.5,seed:100+i+s*21,shadow:true});
 streetTree(b,-13.8,-10.5,{height:11.5,width:10.6,seed:985,shadow:true});streetTree(b,-13.8,-23,{height:11.8,width:10.2,seed:987,shadow:true});
 signal(b,-11.95,5.5,{height:5.8,ped:true});signal(b,11.8,15.2,{height:8.0,arm:3.8,side:1});b.plane('photoHope',11.5,5.58,10.6,1.36,.44,Math.PI);
 b.rod('photoSteel',[11.8,5.8,15.2],[11.8,5.8,10.7],.035);signal(b,11.6,36,{height:5.6,ped:true});
 for(const s of[-1,1])for(const z of[21,92,166,242])streetLamp(b,s*12.2,z,s,10.9);
 place(b,-12.6,.19,4,0,P.addHydrant);place(b,12.6,.19,32,0,P.addHydrant);for(const s of[-1,1])for(const z of[44,105,184,255]){place(b,s*12.6,.19,z,0,P.addParkingMeter);place(b,s*14.3,.19,z+4,0,P.addTrashBin);}
 for(const side of[-1,1])for(let i=0;i<6;i++){b.push(side*88,0,40+i*64,side<0?Math.PI/2:-Math.PI/2);addBuilding(b,{type:['two_story_shops','parking_garage','international_tower','office_podium','brutalist_slab','bank_branch'][i],w:38,d:31,floors:[2,6,13,8,10,1][i],seed:781+i+side*29,lod:1});b.pop();}
 b.cylinder('photoPole',-12.25,1.7,9.2,.037,.049,3.4,8);b.box('photoFrame',-12.25,2.87,9.2,.55,.77,.055);b.plane('photoBus',-12.25,2.87,9.16,.51,.73,Math.PI);
 b.cylinder('photoPole',13.5,1.15,44,.035,.045,2.3,8);b.plane('photoParking',13.5,1.8,43.96,.66,.94,Math.PI);
 for(const s of[-1,1]){const x=s*10.88;b.box('dark',x,.085,6.8,.16,.15,1.0);b.box('photoGranite',x,.18,6.8,.32,.06,1.18);}
 for(const z of[6.9,41.2]){b.cylinder('photoBronze',12.6,.58,z,.36,.39,1.1,16);b.cylinder('photoBronze',12.6,1.17,z,.40,.40,.12,16);b.box('dark',12.6,1.14,z-.30,.40,.13,.045);b.plane('photoBus',12.6,.62,z-.396,.18,.28,Math.PI);}
 smallCar(b,-8.7,57,0,.45);smallCar(b,-8.7,64,0,.71);smallCar(b,8.8,187,Math.PI,.70);smallCar(b,-8.7,300,0,.77);smallCar(b,8.8,310,0,.63);
 b.pop();return{object:b.finish('Hope Street / authored photographic reconstruction'),colliders:b.colliders,walks:b.walks};
}
function dish(b,x,y,z,r=1.4){
 const rot=new T.Euler(-.4,.2,0),center=new T.Vector3(x,y,z),frame=(u,v,w)=>new T.Vector3(u/.64,v,w).applyEuler(rot).add(center).toArray(),point=(t,a)=>frame(t*Math.cos(a),t*Math.sin(a),t*t/(r*2));
 for(let k=1;k<=6;k++){const t=r*k/6;for(let i=0;i<32;i++)b.rod('photoSteel',point(t,i*Math.PI/16),point(t,(i+1)*Math.PI/16),k===6?.018:.008);}
 for(let i=0;i<28;i++)for(let k=0;k<6;k++)b.rod('photoSteel',point(r*k/6,i*Math.PI/14),point(r*(k+1)/6,i*Math.PI/14),.011);
 // Rim, focus and rear hub share the bowl's tilt; no disconnected feed rods.
 const feed=frame(0,0,r*.5),hub=frame(0,0,-.18),mount=[-23,7.8,20];
 for(const a of[Math.PI/2,Math.PI*7/6,Math.PI*11/6])b.rod('photoSteel',point(r*.94,a),feed,.025);
 b.sphere('photoSteel',...feed,.075,.075,.075);b.rod('photoSteel',hub,[x,y,z],.09);
 // The pedestal sits on the 4.90 m return roof; the mast and yoke are continuous.
 b.box('photoStucco',-23,5.0,20,1.25,.20,1.05);
 b.cylinder('photoSteel',-23,6.45,20,.085,.11,2.7,10);
 b.rod('photoSteel',mount,hub,.065);
 for(const u of[-.32,.32]){const axle=frame(u,0,-.18);b.rod('photoSteel',mount,axle,.043);b.rod('photoSteel',axle,hub,.035);}
 b.rod('photoSteel',[-23,6.6,20],hub,.038);
 for(const dx of[-.40,.40]){b.box('photoSteel',-23+dx,5.13,20,.17,.06,.25);b.rod('photoSteel',[-23+dx,5.16,20],[-23,6.24,20],.035);}
}
function clinicCourt(mats){
 const b=new UrbanBatch(mats);b.push(CLINIC_ORIGIN.x,Y,CLINIC_ORIGIN.z,CLINIC_ANGLE);
 b.box('photoCobble',0,-.02,10.15,68,.08,56.3);b.walk(0,10.15,68,56.3,.02);
 quad(b,'photoAsphalt',[[-34,.025,-24],[-34,.02,-18],[34,.02,-18],[34,.025,-24]],[0,0,0,1.5,11,1.5,11,0]);b.walk(0,-21,68,6,.025);
 b.box('photoGranite',0,.018,-18.03,68,.022,.16);b.box('photoGranite',34,.07,10.15,.20,.18,56.3);
 // Adjacent service asphalt and the rear street belong to the district fabric.
 b.box('photoMosaic',-21.3,4.31,5.95,18,8.62,.70);b.solid(-21.3,5.95,18,.70);b.box('photoMosaic',-30.3,4.31,14.4,.70,8.62,17.6);b.solid(-30.3,14.4,.70,17.6);b.box('photoBronze',-21.3,8.68,5.95,18.2,.12,.87);b.box('photoCream',-35,4.2,18.5,10,8.4,26);b.solid(-35,18.5,10,26);
 // Pharmacy is a complete two-storey shell. Its lower floor steps back around
 // the ramp approach; the 2.47 m pedestrian throat stays clear below the arcade.
 for(const[x,w,z,d]of[[-21.615625,16.66875,7.125,2.35],[-23.25625,13.3875,10.45,4.3]]){
  b.box('photoStucco',x,1.785,z,w,3.53,d);b.solid(x,z,w,d);
 }
 b.box('photoStucco',-21.615625,5.85,9.275,16.66875,4.6,6.65);
 b.box('photoGranite',-21.615625,8.225,9.275,16.66875,.15,6.65);
 for(const z of[8.2,12.42]){b.box('photoCream',-13.58,1.785,z,.38,3.53,.36);b.solid(-13.58,z,.38,.36);}
 b.box('photoCream',-13.58,3.5,10.31,.45,.24,4.62);
 for(const z of[7.45,9.7,11.55]){
  b.box('photoShade',-13.24,5.8,z,.18,1.96,1.56);
  b.plane('photoGlass',-13.149,5.8,z,1.43,1.82,Math.PI/2);
  for(const dz of[-.74,0,.74])b.box('photoFrame',-13.13,5.8,z+dz,.11,1.96,.045);
  for(const y of[4.84,6.76])b.box('photoFrame',-13.13,y,z,.11,.065,1.56);
  b.box('photoGranite',-13.10,4.79,z,.24,.09,1.67);
 }
 b.box('photoStucco',8.1,3.4,24.3,42.5,6.8,12.6);b.solid(8.1,24.3,42.5,12.6);
 for(const[x,w,h,z]of[[-8.9,8,2.5,22.5],[-.8,11,1.85,26],[10.5,9,.8,26],[20,16,2.1,27]]){b.box('photoStucco',x,6.8+h/2,z,w,h,8);b.box('photoBronze',x,6.83+h,z-4,w,.065,.13);}
 // Left return wing, old satellite dish, black tank and chimney.
 b.box('photoCream',-15.7,2.45,23.3,15.8,4.9,14);b.solid(-15.7,23.3,15.8,14);
 b.box('photoStucco',-15.7,5.32,25.5,15.8,.85,9.6);b.box('photoBlue',-15.7,3.03,15.55,15.8,.55,.62);b.plane('photoDermica',-15.1,4.17,16.25,11.2,1.12,Math.PI);
 b.push(-15.7,0,16.1,0);storefront(b,15.3,{key:'photoDermicaGlass',base:.16,top:2.75,step:3.06});b.pop();
 quad(b,'photoCanvas',[[-23.6,3.42,16.15],[-7.8,3.42,16.15],[-7.8,2.98,14.7],[-23.6,2.98,14.7]],[0,0,5,0,5,1,0,1]);
 for(const x of[-23,-8.5])b.box('photoRail',x,1.48,14.78,.09,2.96,.10);
 b.box('brickRed',-17,6.2,21.8,.75,2.5,.8);b.box('photoBronze',-17,7.48,21.8,.92,.15,.98);dish(b,-24.4,8.73,20,1.55);
 b.cylinder('dark',-10.35,9.91,19,.56,.62,1.25,12);b.box('photoStucco',-10.35,8.84,19,2,.90,2.2);
 for(let y=7;y<26;y+=1.3){for(const x of[14.3,14.63])b.rod('photoSteel',[x,y,28.7],[x,y+1.3,28.7],.02);b.rod('photoSteel',[14.3,y,28.7],[14.63,y+1.3,28.7],.014);b.rod('photoSteel',[14.63,y,28.7],[14.3,y+1.3,28.7],.014);}for(const[x,y,z]of[[-7.5,9.3,25],[26.5,8.9,28.9]]){b.box('photoSteel',x,y+.025,z,.34,.05,.34);b.rod('photoSteel',[14.45,25.8,28.7],[x,y+.05,z],.009);}
 // Separate physical lightboxes, matching the three reference signs.
 const signs=[[-6.0,10.1,'photoClinic'],[3.65,7.4,'photoLab'],[13.05,11,'photoMarisa']];
 for(const[x,w,key]of signs){b.box('photoFrame',x,5.58,17.83,w+.13,1.78,.29);b.plane(key,x,5.58,17.65,w,1.67,Math.PI);}
 b.box('photoFrame',26.2,5.58,17.83,8.1,1.78,.29);b.plane('sign:bakery',26.2,5.58,17.65,7.95,1.65,Math.PI);
 // Long blue triangular canvas canopy, with crisp steel seams and a dropped valance.
 quad(b,'photoCanvas',[[-12,4.70,17.40],[30.2,4.70,17.40],[30.2,3.67,14.62],[-12,3.67,14.62]],[0,0,12,0,12,1,0,1]);
 b.box('photoBlue',9.1,3.59,14.60,42.2,.20,.045);for(let x=-12;x<31;x+=6.02)b.rod('photoSteel',[x,4.72,17.41],[x,3.69,14.62],.012);
 quad(b,'photoBlue',[[-12,3.64,17.4],[-12,4.70,17.4],[-12,3.67,14.62],[-12,3.64,14.62]]);
 // Glass and aluminium fronts: clinic frosted panes, dark green lab, bakery double doors.
 b.push(-6,0,17.5,0);storefront(b,10.4,{key:'photoClinicInside',base:.74,top:3.57,step:5.2});for(const x of[-4.1,-2.05,0,2.05,4.1])b.box('photoFrame',x,2.96,-.06,.06,.7,.1);b.box('photoFrame',0,2.66,-.06,10.4,.065,.1);b.pop();
 b.push(3.7,0,17.48,0);storefront(b,7.5,{key:'photoGlass',base:.55,top:3.57,step:3.75});for(const x of[-2.4,0,2.4])b.plane('photoLabWindow',x,2.1,-.095,2.35,2.89,Math.PI);b.pop();
 b.push(13.05,0,17.47,0);storefront(b,11,{key:'photoBakeryInside',base:.37,top:3.57,step:5.5});for(const x of[-5.1,-1.7,1.7,5.1]){b.box('rust',x,1.88,-.07,.10,3,.12);for(let k=0;k<5;k++)b.box('photoBronze',x+1.2,.9+k*.28,-.095,.54,.07,.02);}b.pop();
 b.push(24.1,0,17.47,0);storefront(b,10.6,{key:'photoRetail',base:.37,top:3.57,step:5.3});b.pop();
 for(const x of[-11.4,-.6,7.6,18.7,29.5])b.box('photoRail',x,1.83,17.35,.20,3.6,.18);
 b.box('photoGranite',9.2,.19,15.95,43,.38,3.2);b.walk(9.2,15.95,43,3.2,.38);
 // Solid switchback: both inclined runs, the 1.66 m turning landing and
 // the 1.60 m upper bridge meet exactly; handrails follow the same endpoints.
 b.box('photoGranite',-7.3,.37,15.4,10.8,.70,2.7);b.walk(-7.3,15.4,10.8,2.7,.72);
 rampWedge(b,-12.7,-2,9.7,11.4,.02,.58);
 rampWedge(b,-10.2,-2,12,13.7,.72,.58);
 b.box('sidewalk',-.7,.30,11.7,2.6,.56,4.0);b.walk(-.7,11.7,2.6,4,.58);
 b.box('sidewalk',-11.45,.37,13.025,2.5,.70,2.05);b.walk(-11.45,13.025,2.5,2.05,.72);
 for(const z of[9.74,11.36])rail(b,[-12.7,.02,z],[-2,.58,z]);
 for(const z of[12.04,13.66])rail(b,[-10.2,.72,z],[-2,.58,z]);
 rail(b,[-2,.58,9.74],[.50,.58,9.74]);rail(b,[.50,.58,9.74],[.50,.58,13.66]);rail(b,[.50,.58,13.66],[-2,.58,13.66]);
 rail(b,[-2,.58,11.36],[-2,.58,12.04]);
 rail(b,[-10.2,.72,12.04],[-12.65,.72,12.04]);rail(b,[-12.65,.72,12.04],[-12.65,.72,16.70]);
 for(const[z0,z1]of[[9.70,9.81],[11.29,11.40]])rampKerb(b,-12.7,-2,z0,z1,.02,.58);
 for(const[z0,z1]of[[12,12.11],[13.59,13.70]])rampKerb(b,-10.2,-2,z0,z1,.72,.58);
 for(const z of[9.755,13.645])b.box('photoGranite',-.7,.6275,z,2.6,.095,.11);
 b.box('photoGranite',.545,.6275,11.7,.11,.095,4);
 b.box('photoGranite',-11.45,.7675,12.055,2.5,.095,.11);
 b.box('photoGranite',-12.645,.7675,14.35,.11,.095,4.7);
 // Two grounded 170 mm risers connect the raised clinic landing to the shop walk.
 for(const[x,w,top]of[[-1.62,.56,.55],[-1.06,.56,.38]]){b.box('photoGranite',x,(top+.02)/2,15.4,w,top-.02,2.7);b.walk(x,15.4,w,2.7,top);}
 for(let x=-17;x<30;x+=3.4){b.box('white',x,.028,6.7,.08,.009,5,0,.5);place(b,x+1.6,.05,8.8,0,P.addWheelStop);}
 // Blue awning, support struts and curb faces cast the actual courtyard shadows.
 for(let x=-11.4;x<30;x+=6.02){b.rod('photoRail',[x,3.3,17.38],[x,3.66,14.75],.022);b.rod('photoRail',[x,4.62,17.37],[x,3.66,14.75],.021);}
 for(const x of[-11.5,19.1,29.5]){b.rod('photoRail',[x,6.65,17.48],[x,.33,17.48],.042);b.rod('photoRail',[x,.33,17.48],[x,.16,17.05],.042);}
 for(const[x,roof,z]of[[-10,6.8,27.2],[9,7.6,27],[24,8.9,27]]){for(const dx of[-.66,.66])b.box('photoSteel',x+dx,roof+.10,z,.12,.20,1.2);b.box('metal',x,roof+.55,z,1.9,.7,1.35);for(let i=0;i<8;i++)b.box('photoShade',x-.77+i*.22,roof+.56,z-.70,.05,.48,.02);}
 b.cylinder('photoCream',18,8.96,30,.81,.81,.12,12);b.cylinder('dark',18,9.62,30,.7,.73,1.2,12);
 // Service frontage faces the new rear lane, with glazed workrooms, a door,
 // loading sill and drains instead of an unbroken blank billboard wall.
 for(const x of[-7,1,9,17,24]){
  b.box('photoFrame',x,3.3,30.67,3.05,1.8,.12);b.plane('photoGlass',x,3.3,30.743,2.88,1.62);
  for(const dx of[-.72,0,.72])b.box('photoFrame',x+dx,3.3,30.77,.048,1.67,.045);
  b.box('photoGranite',x,2.37,30.81,3.24,.12,.38);
 }
 b.box('photoFrame',-1.9,1.56,30.68,1.85,2.84,.13);b.box('photoSteel',-1.9,1.55,30.76,1.68,2.67,.075);
 b.plane('photoGlass',-1.9,2.12,30.807,1.38,.88);b.rod('photoRail',[-1.3,1.05,30.85],[-1.3,1.51,30.85],.025);
 b.box('photoGranite',-1.9,.09,31.15,2.4,.14,1.1);b.walk(-1.9,31.15,2.4,1.1,.16);
 for(const x of[-12.6,28.9]){b.rod('photoBronze',[x,.15,30.83],[x,6.65,30.83],.055);b.rod('photoBronze',[x,6.65,30.83],[x,6.80,30.48],.055);b.box('photoShade',x,.04,31.0,.44,.04,.48);}
 for(const x of[-12,30]){b.box('photoGranite',x,.24,15.5,.18,.48,4.2);}
 streetTree(b,-17.4,15.3,{height:5.8,width:3.5,seed:65,small:true,shadow:true});
 b.pop();return{object:b.finish('Clinical plaza / authored photographic reconstruction'),colliders:b.colliders,walks:b.walks};
}
function photoHandedness(part,origin,angle,scaleX=1){
 const c=Math.cos(angle),s=Math.sin(angle),reflect=(x,z)=>{const dx=x-origin.x,dz=z-origin.z,u=c*dx-s*dz,v=s*dx+c*dz;return{x:origin.x-c*u*scaleX+s*v,z:origin.z+s*u*scaleX+c*v};};
 part.object.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,isLetter=['photoClinic','photoLab','photoMarisa','photoLabWindow','photoBanner','photoFamima','photoHope','photoDermica','photoShop','photoLobby','photoRetail','photoDermicaGlass','photoBakeryInside','photoClinicInside','photoFamimaRound','photoBus','photoParking','photoWalkHand'].some(k=>m.material===part.materials?.[k])||Object.entries(part.materials||{}).some(([k,v])=>k.startsWith('sign:')&&m.material===v);for(let i=0;i<p.count;i++){const q=reflect(p.getX(i),p.getZ(i));p.setXYZ(i,q.x,p.getY(i),q.z);const nx=c*n.getX(i)-s*n.getZ(i),nz=s*n.getX(i)+c*n.getZ(i),v=new T.Vector3(-c*nx/scaleX+s*nz,n.getY(i),s*nx/scaleX+c*nz).normalize();n.setXYZ(i,v.x,v.y,v.z);if(u&&isLetter)u.setX(i,1-u.getX(i));}
 // Restore winding after the handedness conversion; signs keep their readable UV orientation.
 for(const a of Object.values(g.attributes))for(let i=0;i<a.count;i+=3)for(let j=0;j<a.itemSize;j++){const t=a.array[(i+1)*a.itemSize+j];a.array[(i+1)*a.itemSize+j]=a.array[(i+2)*a.itemSize+j];a.array[(i+2)*a.itemSize+j]=t;}g.computeBoundingBox();g.computeBoundingSphere();});
 for(const q of part.colliders){Object.assign(q,reflect(q.x,q.z));if(q.kind==='obb'){q.ry=2*angle-q.ry;q.w*=scaleX;}else q.r*=Math.min(1,scaleX);}
 for(const q of part.walks){Object.assign(q,reflect(q.x,q.z));q.ry=2*angle-q.ry;q.w*=scaleX;q.slopeX=-q.slopeX/scaleX;}
 return part;
}
export function createReferenceScenes(mats){const hope=hopeStreet(mats),clinic=clinicCourt(mats),object=new T.Group();hope.materials=clinic.materials=mats;photoHandedness(hope,CITY_ORIGIN,CITY_ANGLE);photoHandedness(clinic,CLINIC_ORIGIN,CLINIC_ANGLE,.64);object.name='Two photographic street landmarks';object.add(hope.object,clinic.object);object.userData.cityStats={triangles:hope.object.userData.cityStats.triangles+clinic.object.userData.cityStats.triangles,draws:hope.object.userData.cityStats.draws+clinic.object.userData.cityStats.draws,parts:0};return{object,hope,clinic,colliders:[...hope.colliders,...clinic.colliders],walks:[...hope.walks,...clinic.walks]};}
export function referenceWaypoint(name){
 if(name==='photo-clinic'){const p=clinicToWorld(-6.4,-7.5);return{...p,label:'图二 · 诊所与糕点房',yaw:CLINIC_ANGLE+Math.PI+.326,pitch:.135,eye:1.7,fov:49.8,referenceAspect:2048/1278,range:480,urbanPhoto:true};}
 const p=cityToWorld(2.8,-22);return{...p,label:'图一 · Hope St',yaw:CITY_ANGLE+Math.PI-.025,pitch:.15,eye:1.8,fov:41.8,referenceAspect:2048/1393,range:510,urbanPhoto:true};
}
const WORLD_HOPE_SUN=new T.Vector3(.72,1,-.62).applyAxisAngle(UP,CITY_ANGLE).normalize(),WORLD_CLINIC_SUN=new T.Vector3(.80,1,-.55).applyAxisAngle(UP,CLINIC_ANGLE).normalize();
export function referenceEnvironment(wx,wz,level){const c=clinicLocal(wx,wz),p=worldToCity(wx,wz),clinic=Math.max(1-ease(38,76,Math.hypot(c.x-5,c.z-12)),1-ease(0,28,Math.hypot(Math.max(25.6-c.x,0,c.x-70),Math.max(18.4-c.z,0,c.z-77))))*(1-ease(345,377,p.z+382));const route=exitSample(wx,wz,{}),urban=level===11?1:ease(220,350,route.s)*route.influence;if(urban<.001)return null;const q=Math.min(1,clinic);return{amount:urban,clinic:q,hero:(Math.abs(p.x)<62&&p.z>-50&&p.z<335)||q>.05,sky:new T.Color('#cdd7bc').lerp(new T.Color('#558ac7'),q),fog:new T.Color('#cdd7bc').lerp(new T.Color('#adbfc9'),q),sun:WORLD_HOPE_SUN.clone().lerp(WORLD_CLINIC_SUN,q).normalize(),sunColor:new T.Color('#fff2d8').lerp(new T.Color('#fff9ee'),q),sunPower:2.65+q*.4,fill:new T.Color('#d2d6d3').lerp(new T.Color('#c0cde0'),q),ground:new T.Color('#a4a297').lerp(new T.Color('#aaa69c'),q),fillPower:1.9+q*.1,exposure:1.14-q*.015,near:210,far:510};}
