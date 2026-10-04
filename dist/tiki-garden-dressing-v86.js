import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {gridSurface,card} from './tiki-mesh-v77.js';
import {SCULPTURE_ROWS86} from './tiki-garden-sculpture-uv-v86.js';
import {worldUV} from './bath-v61-materials.js';
export const GARDEN_DECOR85={table:{x:6.45,z:4.35},machine:{x:7.48,z:-7.20,ry:-Math.PI/2},footbath:{x:-4.85,z:.73,ry:Math.PI/2},botanist:{x:6.75,z:-2.80,ry:Math.PI/2}};
const TAU=Math.PI*2,rand=n=>{const q=Math.sin(n*127.1+7.71)*43758.5453;return q-Math.floor(q);};
function place(k,q,x,z,ry=0,y=0,scale=1){const o=q.finish('V86 architectural assembly');o.position.set(x,y,z);o.rotation.y=ry;o.scale.setScalar(scale);o.updateMatrixWorld(true);o.traverse(p=>{if(!p.isMesh)return;const key=Object.keys(k.m).find(key=>k.m[key]===p.material);k.add(p.geometry.clone().applyMatrix4(p.matrixWorld),key);p.geometry.dispose();});}
function plant(k,key,x,z,w,h,base=0,yaw=0){for(let j=0;j<3;j++)card(k,key,x,base+h*.49,z,w,h,yaw+j*Math.PI/3,[0,0,1,1],w*.04);}
function bamboo(k,x,y,z,height,r=.035,seed=1){const g=new T.CylinderGeometry(r*.91,r,height,6,4),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const yy=p.getY(i)+height*.5,node=Math.pow(Math.max(0,Math.cos(yy*TAU/.35+seed)),22),f=1+.075*node;p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);uv.setXY(i,(seed*.137)% .88+uv.getX(i)*.08,uv.getY(i)*height/.95);}g.computeVertexNormals();k.add(g,'bamboo',x,y,z);}
function bambooPanel(k,cx,y,z,w,h,seed=0){k.plane('reed',cx,y,z-.025,w,h,[0,0,0],[seed*.071,0,w/.72,h/1.28]);const n=Math.ceil(w/.071);for(let i=0;i<n;i++){const x=cx-w*.5+(i+.5)*w/n,hh=h+(rand(seed+i)-.5)*.055;bamboo(k,x,y+(hh-h)*.5,z,hh,.030+rand(seed+i+9)*.005,seed+i);}}
function stoneGeo(w,h,d,seed){const small=w+h+d<1.65,g=new T.SphereGeometry(1,small?8:16,small?6:12),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const f=1+.065*Math.sin(x*8+y*7+seed)+.035*Math.cos(z*13-y*8+seed*2);x=Math.sign(x)*Math.pow(Math.abs(x),.58);y=Math.sign(y)*Math.pow(Math.abs(y),.71);z=Math.sign(z)*Math.pow(Math.abs(z),.65);p.setXYZ(i,x*w*.5*f,y*h*.5*f,z*d*.5*f);}g.computeVertexNormals();return worldUV(g,.65);}
function lava(k,x,y,z,w,h,d,seed){k.add(stoneGeo(w,h,d,seed),'lava',x,y,z,[0,(rand(seed)*2-1)*.2,0]);}
function rockPier(k,x,z,w,h,d,seed=1){const rows=Math.ceil(h/.55),weights=Array.from({length:rows},(_,j)=>.70+rand(seed+j*17)*.60),total=weights.reduce((a,b)=>a+b,0);let base=0;
 for(let j=0;j<rows;j++){const hh=h*weights[j]/total,n=w>.95?(rand(seed+j*7)>.24?2:1):1,parts=Array.from({length:n},(_,i)=>.65+rand(seed+j*19+i)*.6),sum=parts.reduce((a,b)=>a+b,0);let left=x-w*.5;
  for(let i=0;i<n;i++){const ww=w*parts[i]/sum;lava(k,left+ww*.5,base+hh*.48,z+(rand(seed+i+j*8)-.5)*.15,ww*1.06,hh*(1.04+rand(seed+i*41)*.10),d+(rand(seed+i+41)-.5)*.17,seed+j*7+i);left+=ww;}base+=hh;}}
function planterBed(k,outline,seed){const s=new T.Shape(outline.map(([x,z])=>new T.Vector2(x,-z))),g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);k.add(worldUV(g,.6),'soil',0,.07,0);for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.38);for(let j=0;j<n;j++){const t=(j+.5)/n;lava(k,a[0]+(b[0]-a[0])*t,.115,a[1]+(b[1]-a[1])*t,.37,.26,.33,seed+i*23+j);}}}
// A continuous carved front with facial depressions, paired with its generated
// orthographic UV. The sides/back are real wood volumes, never a flat cutout.
function idol(k,x,z,h,which=1,ry=0){const q=new TikiKit(k.m),w=h*(which===1?.27:.20),depth=w*.67,rows=SCULPTURE_ROWS86[which-1];
 const row=v=>{const f=Math.min(63.999,v*64),i=Math.floor(f),t=f-i;return rows[i].map((a,j)=>a+(rows[i+1][j]-a)*t);};
 const profile=(u,v)=>{const r=row(v),uvx=r[0]+(r[1]-r[0])*u,xx=(uvx-.5)*2,vv=r[2],eyes=which===1?.74001:.79719,mouth=which===1?.55485:.66539,nose=which===1?.66455:.75240,brow=which===1?.81928:.83365,hand=which===1?.32657:.25912;
  const gauss=(a,b)=>Math.exp(-a*a-b*b);let zz=depth*.47*Math.sqrt(Math.max(.12,1-xx*xx*.88));
  zz-=h*.031*gauss((Math.abs(xx)-.44)/.23,(vv-eyes)/.043);zz-=h*.030*Math.exp(-((xx/.78)**6)-((vv-mouth)/.057)**4);
  zz+=h*.029*gauss(xx/.23,(vv-nose)/.060)+h*.012*gauss((Math.abs(xx)-.41)/.32,(vv-brow)/.027);
  zz+=h*.018*gauss((Math.abs(xx)-.56)/.25,(vv-hand)/.070)+h*.018*gauss(xx/.39,(vv-.29)/.10);
  return[xx*w*.52,v*h,zz];};
 const front=gridSurface(profile,36,64),uv=front.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i),r=row(v);uv.setXY(i,r[0]+(r[1]-r[0])*u,r[2]);}q.add(front,'idol'+which);
 const back=gridSurface((u,v)=>{const a=Math.PI*.5+u*Math.PI,left=profile(0,v),right=profile(1,v),center=(left[0]+right[0])*.5,radius=(right[0]-left[0])*.5,edge=a<Math.PI?right[2]:left[2];return[center+Math.sin(a)*radius,v*h,Math.cos(a)*depth*.47+edge*Math.pow(Math.abs(Math.sin(a)),6)];},24,48);q.add(worldUV(back,.8),'wood');
 // End caps close the shared boundary; the generated base itself is retained.
 for(const v of[0,1]){const a=profile(0,v),b=profile(1,v);q.add(new T.CircleGeometry((b[0]-a[0])*.5,24),'wood',(a[0]+b[0])*.5,v*h,0,[v===0?Math.PI/2:-Math.PI/2,0,0],[1,depth/(b[0]-a[0]),1]);}
 place(k,q,x,z,ry);
}
function layeredThatch(k,width,zBack,zFront,backH,frontH,seed=1){
 // A dark structural roof and six overlaid fringed skirts give real depth.
 const core=gridSurface((u,v)=>[(u-.5)*width,backH+(frontH-backH)*v-.11,zBack+(zFront-zBack)*v],12,10);k.add(core,'roofUnderside');
 const courses=Math.ceil(Math.abs(zBack-zFront)/.67);for(let course=0;course<courses;course++)for(let layer=0;layer<2;layer++){const a=course/courses,b=Math.min(1,(course+1.15)/courses),g=gridSurface((u,v)=>{const t=a+(b-a)*v;return[(u-.5)*(width+layer*.035),backH+(frontH-backH)*t+.020*layer+.025*Math.sin(u*31+seed)*v,zBack+(zFront-zBack)*t];},24,5),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width/.78+seed*.27+layer*.19,1-uv.getY(i)*.96);k.add(g,'thatch');}
 for(let i=0;i<4;i++){const g=gridSurface((u,v)=>[(u-.5)*(width+.10),frontH+.08-v*(.37+.055*Math.sin(u*17+seed+i)),zFront-.035*i-.12*v],48,6),uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,uv.getX(j)*width/.74+i*.23,1-uv.getY(j));k.add(g,'thatch');}
}
function lantern(k,x,y,z,ry=0,hood=false){const q=new TikiKit(k.m);q.box('brass',0,0,-.085,.11,.31,.055,.018);q.tube('brass',[[0,.11,-.08],[0,.16,.08],[0,.16,.16]],.012,15);
 q.cyl('brass',0,.12,.15,.13,.16,.08,16);q.cyl('lampGlass',0,-.015,.15,.085,.080,.22,16);q.cyl('brass',0,-.14,.15,.115,.105,.045,16);
 for(let i=0;i<6;i++){const a=i*TAU/6;q.beam('brass',[Math.sin(a)*.092,-.12,.15+Math.cos(a)*.092],[Math.sin(a)*.092,.09,.15+Math.cos(a)*.092],.009,6);}
 if(hood)q.cyl('brass',0,.19,.15,.055,.21,.14,16);place(k,q,x,z,ry,y);
}
function door(k,x,z,w,ry,double=false){const q=new TikiKit(k.m),h=2.46;q.box('dark',0,h*.5,-.06,w+.16,h+.13,.12,.018);q.box('door',0,h*.5,.012,w,h,.055,.012);for(const s of[-1,1])bamboo(q,s*(w*.5+.045),h*.5,.07,h+.18,.05,s+3);q.beam('bamboo',[-w*.5-.09,h+.03,.07],[w*.5+.09,h+.03,.07],.047,10);
 const leaves=double?2:1,lw=w/leaves;for(let i=0;i<leaves;i++){const cx=-w/2+lw*(i+.5);q.box('frosted',cx,1.56,.052,lw-.16,1.48,.024,.004);for(let j=1;j<4;j++)q.box('wood',cx,.815+j*.37,.073,lw-.15,.028,.032,.004);for(let j=1;j<3;j++)q.box('wood',cx-lw*.5+.08+j*(lw-.16)/3,1.55,.073,.026,1.51,.03,.004);q.box('wood',cx,.44,.07,lw-.17,.45,.035,.009);const hx=cx+(double?(i===0?.29:-.29):.29);q.tube('brass',[[hx,.97,.09],[hx,1.00,.15],[hx,1.19,.15],[hx,1.22,.09]],.012,12);}
 place(k,q,x,z,ry);
}
// Geometry subtracts scenic openings from the actual wall, then puts the paint
// behind the raised lava piers. There is no black lightbox floating on masonry.
export function gardenWalls86(k,H=6.93){
 const specs=[
  {x:-8.4,z:-.9,ry:Math.PI/2,w:18.2,cuts:[{u:4.00,w:8.4,key:'rainforest1'}]},
  {x:8.4,z:-.9,ry:-Math.PI/2,w:18.2,cuts:[{u:-.95,w:9.4,key:'rainforest2'}]},
  {x:0,z:-10,ry:0,w:16.8,cuts:[{u:-2.65,w:7.90,key:'rainforest3'},{u:4.72,w:5.58,key:'rainforest4'}]},
  {x:0,z:8.2,ry:Math.PI,w:16.8,cuts:[{u:0,w:3.10,bottom:0,top:3.78,passage:true}]}
 ];
 for(const [si,s] of specs.entries()){const q=new TikiKit(k.m),cuts=s.cuts.map(c=>({...c,bottom:c.bottom??1.20,top:c.top??4.40}));let breaks=[-s.w/2,s.w/2,...cuts.flatMap(c=>[c.u-c.w/2,c.u+c.w/2])].sort((a,b)=>a-b);
  for(let i=0;i<breaks.length-1;i++){const left=breaks[i],right=breaks[i+1],mid=(left+right)*.5,c=cuts.find(c=>mid>c.u-c.w/2&&mid<c.u+c.w/2);if(right-left<.001)continue;if(!c)q.box('wall',mid,H*.5,-.05,right-left,H,.26,.012);else{if(c.bottom>0)q.box('wall',mid,c.bottom*.5,-.05,right-left,c.bottom,.26,.012);q.box('wall',mid,(c.top+H)*.5,-.05,right-left,H-c.top,.26,.012);}}
  for(const c of cuts){if(c.passage)continue;const hh=c.top-c.bottom;q.box('dark',c.u,c.bottom+hh*.5,-.28,c.w,hh,.08,.005);const span=Math.min(1,c.w/(hh*3));q.plane(c.key,c.u,c.bottom+hh*.5,-.225,c.w,hh,[0,0,0],[(1-span)*.5,0,span,1]);for(const side of[-1,1])q.box('lava',c.u+side*(c.w/2+.06),c.bottom+hh*.5,.045,.12,hh+.10,.54,.045);q.box('bamboo',c.u,c.top+.035,-.05,c.w,.07,.20,.02);}
  // Low bamboo skirting stops at the real porch opening rather than covering it.
  if(si===3){for(const side of[-1,1])bambooPanel(q,side*(s.w/4+.775),.62,.145,s.w/2-1.55,1.20,si*41+(side+1)*5);}else bambooPanel(q,0,.62,.145,s.w,1.20,si*41);
  if(si===3){for(const side of[-1,1])q.box('wood',side*(s.w/4+.775),1.22,.15,s.w/2-1.55,.075,.13,.025);}else q.box('wood',0,1.22,.15,s.w,.075,.13,.025);q.box('ceilingTrim',0,H-.09,.075,s.w,.18,.26,.025);
  place(k,q,s.x,s.z,s.ry);
 }
 // A new wall owns each decorative door; neither competes with the porch.
 door(k,8.22,6.57,1.81,-Math.PI/2,true);door(k,-7.42,-9.76,.91,0,false);
}
export function gardenPorch86(k){
 // The foyer is excavated outside the original surveyed room envelope.
 for(const side of[-1,1]){k.box('roofUnderside',side*1.49,1.69,9.88,.26,3.38,3.48,.03);const q=new TikiKit(k.m);bambooPanel(q,0,1.61,0,3.45,3.22,side+91);place(k,q,side*1.35,9.90,side>0?-Math.PI/2:Math.PI/2);}
 k.box('roofUnderside',0,3.38,9.88,3.17,.23,3.55,.025);k.box('roofUnderside',0,1.69,11.55,3.15,3.38,.22,.025);
 const rear=new TikiKit(k.m);bambooPanel(rear,0,1.65,-.03,3.0,3.25,151);place(k,rear,0,11.42,Math.PI);
 // Solid return leaf, worn frame, latch, hinges and a continuous sill.
 const dr=new TikiKit(k.m);dr.box('dark',0,1.28,-.015,1.70,2.61,.13,.02);dr.box('door',0,1.24,.070,1.48,2.45,.065,.022);for(const s of[-1,1])dr.box('wood',s*.787,1.28,.098,.095,2.61,.17,.022);dr.box('wood',0,2.555,.098,1.68,.095,.17,.022);for(const y of[.37,1.16,2.08])dr.cyl('brass',-.736,y,.12,.018,.018,.105,10);dr.tube('brass',[[.51,.96,.12],[.51,1.00,.18],[.51,1.20,.18],[.51,1.24,.12]],.014,14);dr.box('brass',.51,1.10,.112,.077,.31,.025,.008);dr.box('stonePath',0,.026,.05,1.63,.048,.23,.015);place(k,dr,0,11.36,Math.PI);
 // Left foreground is heavy lava; the second idol retreats into the right.
 rockPier(k,2.15,7.82,1.37,3.67,1.01,23);rockPier(k,-1.87,8.32,.70,3.42,.73,113);
 const roof=new TikiKit(k.m);layeredThatch(roof,5.70,11.60,6.45,3.93,3.15,5);place(k,roof,0,0);
 for(const x of[-2.70,2.70]){bamboo(k,x,1.62,6.60,3.24,.085,x>0?38:40);k.beam('bamboo',[x,3.05,6.65],[Math.sign(x)*1.50,3.57,9.33],.066,10);}k.beam('wood',[-2.78,3.13,6.62],[2.78,3.13,6.62],.086,12);
 planterBed(k,[[1.65,7.50],[1.72,6.33],[2.42,5.93],[3.78,6.47],[4.23,7.90],[3.10,8.08]],12);
 planterBed(k,[[-1.64,7.72],[-2.15,6.78],[-3.50,6.85],[-3.98,7.98],[-2.75,8.10]],63);
 idol(k,2.37,6.64,2.85,1,Math.PI+.10);idol(k,-1.04,8.94,2.38,2,Math.PI-.16);
 for(const p of[['banana',3.09,7.37,1.70,2.47,.08,.2],['monstera',3.14,6.47,1.73,1.58,.08,.1],['bromeliad',1.94,6.11,1.17,.83,.08,.4],['fern',3.84,7.33,1.25,1.19,.1,1.4],['monstera',-2.34,7.47,1.75,1.91,.08,.4],['bromeliad',-2.77,6.88,1.34,.93,.08,.8],['fern',-3.23,7.45,1.46,1.28,.09,.7]])plant(k,...p);
 lantern(k,-1.25,2.06,10.00,Math.PI/2,false);lantern(k,2.05,3.17,7.25,Math.PI,true);
}
export function gardenClosedBar86(k){const q=new TikiKit(k.m),W=5.80;
 q.box('dark',0,1.69,-.16,W,3.38,.20,.03);bambooPanel(q,0,1.69,-.035,W,3.36,210);q.box('wood',0,.35,.004,W,.70,.075,.018);
 q.box('dark',.25,1.81,.032,3.78,1.63,.14,.018);
 // The roller curtain has a folded profile across every horizontal metal slat.
 const shutter=gridSurface((u,v)=>[(u-.5)*3.59+.25,1.065+v*1.55,.116+.017*Math.sin(v*TAU*31)],2,248);q.add(shutter,'shutter');
 for(const s of[-1,1])q.box('shutterTrim',.25+s*1.858,1.84,.145,.072,1.65,.11,.014);q.box('shutterTrim',.25,1.077,.148,3.68,.045,.09,.008);
 q.box('wood',.25,.535,.48,3.98,1.01,.66,.04);q.plane('lauhala',.25,.535,.818,3.96,.94,[0,0,0],[0,0,3.3,.90]);
 for(let i=0;i<4;i++)bamboo(q,.25-1.97+i*1.313,.544,.85,1.06,.045,17+i*13);
 q.box('barWood',.25,1.069,.53,4.23,.101,.89,.046);q.box('barWood',.25,1.032,.987,4.17,.067,.053,.018);q.box('wood',.25,.059,.834,4.02,.092,.09,.022);
 q.box('wood',-2.28,2.62,.045,.52,.93,.04,.014);q.plane('notice',-2.28,2.62,.071,.464,.863);
 q.tube('brass',[[-2.58,2.07,.12],[-2.34,2.04,.21],[-2.04,2.07,.12]],.018,16);
 layeredThatch(q,4.51,.15,1.01,3.40,2.94,13);for(const s of[-1,1])q.beam('bamboo',[.25+s*2.02,2.65,.20],[.25+s*2.12,2.94,.96],.048,8);
 q.cyl('plantPot',1.86,1.19,.57,.108,.079,.22,14);q.cyl('soil',1.86,1.302,.57,.101,.101,.015,12);plant(q,'fern',1.86,.57,.49,.44,1.30,.4);
 q.cyl('plantPot',-1.45,1.17,.54,.13,.09,.19,14);plant(q,'bromeliad',-1.45,.54,.87,.77,1.26,1.1);
 // A rough black stone plinth owns both the sculpture and its muted ferns.
 for(let i=0;i<8;i++)lava(q,-2.45+(i%2)*.35,.13+Math.floor(i/4)*.20,.37+(Math.floor(i/2)%2)*.39,.44,.37,.44,352+i);
 idol(q,-2.37,.56,1.88,1,.13);plant(q,'fern',-2.10,1.06,1.03,.89,.05,.2);plant(q,'fern',-2.85,.83,.92,.98,.06,1.7);
 place(k,q,-8.10,4.75,Math.PI/2);
}
export function gardenDressing85(k){gardenWalls86(k);gardenPorch86(k);gardenClosedBar86(k);
 // Existing inhabitants and their supported stone seat retain exact positions.
 k.box('boulder',-4.93,.035,.73,.71,.31,.82,.13);k.box('boulder',-4.97,.19,.73,.64,.10,.67,.065);
 const names=['banana','croton','monstera','bromeliad','pineapple','fern'];
 for(const side of[-1,1]){const x=side*7.73,end=side<0?1.05:3.53,start=-7.1;
  planterBed(k,[[x-.37,start],[x+.40,start+.08],[x+.43,end],[x-.42,end-.08]],420+(side+1)*10);
  for(let i=0,z=-6.65;z<end;z+=1.37,i++){if(side>0&&z< -5.75)continue;const key=names[(i+(side>0?2:0))%6],h=[2.30,1.17,1.68,.94,1.06,1.24][(i+(side>0?2:0))%6];plant(k,key,x+(i%2?-.11:.06),z,h*.88,h,.08,i*.62);}}
 for(let i=0;i<9;i++){const x=-6.6+i*1.57;plant(k,names[(i+3)%6],x,-9.14,1.35,1.08+(i%3)*.34,.04,i*.49);}
}
