import * as T from './vendor/three.module.min.js';
import {addBox,addPlane,addTube,worldUV} from './bath-v61-materials.js?v=61';
import {changingMaterials} from './changing-materials-v72.js';
import {LOCKER_ROWS,BENCHES,POOL_DOOR} from './bathhouse-plan-v72.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
export const CHANGING_POINT_LIGHTS=[{p:[0,2.52,3.55],color:0xe1e6b8,power:8,range:8},{p:[2.25,.36,-.25],color:0x74cedb,power:.65,range:3.2}];
export const BATH_AREA_LIGHTS=[{p:[0,2.79,8.3],power:3.3,w:1.42,h:.28,color:0xf0e7c6},{p:[0,2.79,11.5],power:3.3,w:1.42,h:.28,color:0xf0e7c6},{p:[-1.1,2.69,3.65],power:4.1,w:.28,h:1.38,color:0xdfe8b9},{p:[1.3,2.69,4.05],power:3.7,w:.28,h:1.38,color:0xe6e9bf}];
function rectHole(s,x,y,w,h){const q=new T.Path();q.moveTo(x-w/2,y-h/2);q.lineTo(x-w/2,y+h/2);q.lineTo(x+w/2,y+h/2);q.lineTo(x+w/2,y-h/2);q.closePath();s.holes.push(q);}
function numberMaterial(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#d9d3b1';c.fillRect(0,0,512,256);c.fillStyle='#273a37';c.textAlign='center';c.font='bold 29px monospace';for(let i=0;i<26;i++)c.fillText(String(i+1).padStart(2,'0'),(i%8)*64+32,Math.floor(i/8)*64+42);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({name:'Functional enamel locker numerals',map:t,roughness:.65});}
function locker(T,m,numbers,number){
 const root=new T.Group();root.name=`Retro double locker ${number}`;const box=(mat,x,y,z,w,h,d,name,r=.007)=>addBox(root,mat,x,y,z,w,h,d,name,r);
 box(m.locker,0,1.03,-.215,.414,1.87,.032,'Folded steel back');for(const x of[-.207,.207])box(m.locker,x,1.03,0,.024,1.87,.45,'Rolled locker side');
 for(const y of[.098,1.015,1.972])box(m.locker,0,y,0,.414,.028,.45,'Locker shelf and top return');
 for(const x of[-.162,.162])for(const z of[-.16,.16])box(m.dark,x,.050,z,.045,.10,.045,'Grounded rusted locker foot');
 for(let tier=0;tier<2;tier++){
  const y=.552+tier*.932,w=.375,h=.859,s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();
  for(const dy of[-.265,.245])for(let i=0;i<3;i++)rectHole(s,0,dy+i*.040,.222,.019);
  const g=new T.ExtrudeGeometry(s,{depth:.013,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.002,bevelThickness:.002,curveSegments:2});g.translate(0,0,-.005);
  const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),yy=a.getY(i);const dent=.006*Math.exp(-((x+.095)**2/.003+(yy-.105)**2/.005));a.setZ(i,a.getZ(i)-dent+Math.sin(yy*7+number)*.0015);}g.computeVertexNormals();worldUV(g,.46);
  const door=new T.Mesh(g,m.locker);door.name='Dented thick door with open stamped ventilation slots';door.position.set((number%3-1)*.001,y,.230+(number%4)*.001);door.castShadow=door.receiveShadow=true;root.add(door);
  for(const dy of[-.265,.245])for(let i=0;i<3;i++){const blade=box(m.locker,0,y+dy+i*.040-.009,.235,.225,.013,.017,'Pressed louver hood',.002);blade.rotation.x=-.43;}
  for(const x of[-.205,.205])box(m.dark,x,y,.231,.016,.899,.025,'Uneven recessed door reveal',.003);
  for(const yy of[y-.30,y+.30])box(m.chrome,-.191,yy,.247,.022,.073,.020,'Physical folded hinge',.004);
  const tag=addPlane(root,numbers,0,y+.369,.245,.066,.039,0,0,'Inset numbered plaque');const uv=tag.geometry.attributes.uv,idx=number*2+tier;for(let i=0;i<uv.count;i++)uv.setXY(i,(idx%8+uv.getX(i))/8,1-(Math.floor(idx/8)+1-uv.getY(i))/4);
  for(const x of[-.037,.037])box(m.chrome,x,y+.369,.244,.008,.048,.008,'Recessed plaque frame',.001);for(const yy of[y+.345,y+.393])box(m.chrome,0,yy,.244,.081,.007,.008,'Plaque frame lip',.001);
  const lock=new T.Mesh(new T.TorusGeometry(.020,.006,6,14),m.chrome);lock.position.set(.115,y-.062,.254);root.add(lock);box(m.dark,.115,y-.062,.252,.009,.022,.003,'Mechanical key slot',.001);
  addTube(root,m.chrome,[[.116,y+.083,.247],[.116,y+.069,.279],[.116,y+.002,.279],[.116,y-.012,.247]],.009,'Bent locker pull',10);
 }
 return root;
}
function cloth(root,m,x,z,length=.74,width=.55){
 // One continuous, heavy cloth: both falls remain joined over the slatted seat.
 const g=new T.PlaneGeometry(width,length,24,36),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const u=a.getX(i)/width+.5,v=a.getY(i)/length+.5,across=(v-.5)*length;let y=.487,zz=across;
  if(across<-.205){y-=(-.205-across)*1.75;zz=-.205-Math.sin((-.205-across)*7)*.035;}else if(across>.205){y-=(across-.205)*1.9;zz=.205+Math.sin((across-.205)*7)*.035;}
  y+=.010*Math.sin(u*31+v*3)+.004*Math.sin(v*47+u*5);a.setXYZ(i,x+(u-.5)*width,y,z+zz);
 }g.computeVertexNormals();g.setAttribute('uv1',g.attributes.uv.clone());const o=new T.Mesh(g,m);o.name='Continuous hanging wet terry towel';o.material.side=T.DoubleSide;o.castShadow=o.receiveShadow=true;root.add(o);return o;
}
function basket(root,m,x,z,ry){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;g.name='Open perforated 1990s laundry basket';root.add(g);addBox(g,m,0,.026,0,.47,.045,.33,'Basket bottom',.018);
 for(const y of[.075,.18,.29,.36]){for(const zz of[-.185,.185])addBox(g,m,0,y,zz,.54,.017,.02,'Basket horizontal rim',.007);for(const xx of[-.26,.26])addBox(g,m,xx,y,0,.02,.017,.37,'Basket side rim',.007);}
 for(let i=0;i<9;i++)for(const side of[-1,1])addBox(g,m,-.24+i*.060,.20,side*.184,.014,.31,.016,'Open basket grille',.005);
 for(let i=0;i<5;i++)for(const side of[-1,1])addBox(g,m,side*.26,.20,-.153+i*.076,.014,.31,.016,'Side basket grille',.005);
 for(const side of[-1,1])addTube(g,m,[[side*.26,.33,-.10],[side*.27,.41,-.10],[side*.27,.41,.10],[side*.26,.33,.10]],.015,'Molded carrying handle',12);
}
function vanity(root,m){const g=new T.Group();g.name='Tiled vanity with two recessed ceramic basins';g.position.set(.58,0,.58);root.add(g);
 const s=new T.Shape();s.moveTo(-.78,-.29);s.lineTo(.78,-.29);s.lineTo(.78,.29);s.lineTo(-.78,.29);s.closePath();
 for(const x of[-.40,.40]){const h=new T.Path();h.absellipse(x,0,.258,.192,0,Math.PI*2,true,0);s.holes.push(h);}
 const top=new T.ExtrudeGeometry(s,{depth:.062,bevelEnabled:true,bevelSize:.013,bevelThickness:.01,bevelSegments:2,curveSegments:20});top.rotateX(-Math.PI/2);worldUV(top,.4);const slab=new T.Mesh(top,m.wet);slab.position.y=.875;slab.castShadow=slab.receiveShadow=true;g.add(slab);
 for(const x of[-.40,.40]){const geo=new T.LatheGeometry([[.029,0],[.085,.013],[.152,.060],[.213,.135],[.255,.180],[.268,.188]].map(p=>new T.Vector2(...p)),28);geo.scale(1,1,.74);worldUV(geo,.4);const bowl=new T.Mesh(geo,m.tile);bowl.position.set(x,.703,0);bowl.material.side=T.DoubleSide;g.add(bowl);
  const ring=new T.Mesh(new T.TorusGeometry(.027,.004,6,18),m.chrome);ring.rotation.x=-Math.PI/2;ring.position.set(x,.706,0);g.add(ring);addBox(g,m.dark,x,.703,0,.045,.005,.041,'Sink drain recess',.01);
  addTube(g,m.chrome,[[x,.72,0],[x,.47,0],[x,.39,-.07],[x,.44,-.16],[x,.63,-.18]],.024,'Connected P-trap drain',20);
  addTube(g,m.chrome,[[x,.924,-.22],[x,1.073,-.22],[x,1.092,-.12],[x,1.036,-.083]],.018,'Gooseneck faucet',18);
  for(const sign of[-1,1]){const xx=x+sign*.135;addTube(g,m.chrome,[[xx,.924,-.22],[xx,.99,-.22]],.019,'Valve stem',4);for(const axis of[0,1]){const o=addBox(g,m.chrome,xx,1.005,-.22,axis?.018:.095,.018,axis?.095:.018,'Old cross faucet handle',.006);}}
 }
 for(const x of[-.67,.67])addTube(g,m.steel,[[x,.06,-.16],[x,.86,-.16],[x,.86,.20]],.024,'Vanity steel bracket',8);
}
export function* buildChangingRoom72(scene,root){
 const m=changingMaterials(),box=(mat,x,y,z,w,h,d,n='',r=.02)=>{const o=addBox(root,mat,x,y,z,w,h,d,n,r);worldUV(o.geometry,(mat===m.tile||mat===m.wet)? .4:1);return o;};
 box(m.wet,0,-.075,3.28,8.20,.15,6.24,'Changing room floor continuous to pool threshold');
 for(const x of[-4.10,4.10]){box(m.tile,x,1.44,3.28,.16,2.88,6.24,'Small glazed changing wall tiles');box(m.tile,x-Math.sign(x)*.10,.06,3.28,.10,.12,6.23,'Coved ceramic wall foot',.033);}
 box(m.tile,0,2.96,3.28,8.37,.16,6.39,'Continuous low locker room ceiling');
 // Matching ceramic finish on the back of the original pool partition.
 for(const[a,b]of[[-4.1,POOL_DOOR.x-POOL_DOOR.width/2],[POOL_DOOR.x+POOL_DOOR.width/2,4.1]])box(m.tile,(a+b)/2,1.44,.182,b-a,2.88,.04,'Unified tiled pool door wall',.007);
 box(m.tile,POOL_DOOR.x,2.54,.182,POOL_DOOR.width,.68,.04,'Tiled pool lintel',.007);
 for(const x of[POOL_DOOR.x-POOL_DOOR.width/2,POOL_DOOR.x+POOL_DOOR.width/2])box(m.chrome,x,1.15,.07,.055,2.30,.20,'Pool door physical reveal',.007);
 box(m.tile,POOL_DOOR.x,.008,.075,POOL_DOOR.width,.015,.28,'Flush pool doorway threshold',.004);
 const numbers=numberMaterial();let count=0;
 for(const row of LOCKER_ROWS){for(let i=0;i<row.count;i++){const o=locker(T,m,numbers,count++);o.position.set(row.x,0,row.z+(i-(row.count-1)/2)*.432);o.rotation.y=row.yaw;root.add(o);yield{part:'lockers',count};}}
 for(const b of BENCHES){const g=new T.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.yaw;g.name='Rounded slatted wooden bench';root.add(g);
  for(let i=0;i<5;i++){const slat=addBox(g,m.wood,0,.444,-.18+i*.09,b.length,.063,.078,'Worn rounded wood slat',.014);worldUV(slat.geometry,.6);}
  for(const x of[-b.length*.33,b.length*.33]){addTube(g,m.steel,[[x,.03,-.17],[x,.375,-.17],[x,.391,.17],[x,.03,.17]],.026,'Heavy iron bench trestle',12);for(const z of[-.17,.17]){const flange=new T.Mesh(new T.CylinderGeometry(.062,.062,.017,12),m.steel);flange.position.set(x,.012,z);g.add(flange);for(const dx of[-.036,.036])addBox(g,m.chrome,x+dx,.025,z,.010,.011,.010,'Flange anchor bolt',.002);}}
  addTube(g,m.steel,[[-b.length*.33,.22,0],[b.length*.33,.22,0]],.023,'Under-seat longitudinal brace',4);
  cloth(g,m.towel,-b.length*.22,0,.84,.54);
 }
 vanity(root,m);yield{part:'vanity'};
 basket(root,m.basket,-3.29,1.07,.17);basket(root,m.basket,-2.77,.74,-.32);
 for(const [x,z,w,d,angle]of[[-2.18,6.00,1.19,.64,.035],[2.24,.72,1.13,.74,-.07]]){
  const g=new T.PlaneGeometry(w,d,30,20),a=g.attributes.position;for(let i=0;i<a.count;i++){const xx=a.getX(i),zz=a.getY(i),curl=.054*Math.exp(-((xx-w*.5)**2/.018+(zz-d*.5)**2/.06));a.setXYZ(i,xx,.016+curl,zz);}g.computeVertexNormals();g.setAttribute('uv1',g.attributes.uv.clone());const o=new T.Mesh(g,m.rubber);o.material.side=T.DoubleSide;o.name='Thick coin rubber mat with curled corner';o.position.set(x,0,z);o.rotation.y=angle;o.castShadow=o.receiveShadow=true;root.add(o);
 }
 const mirror=new T.Mesh(new T.PlaneGeometry(1.68,.88,16,10),m.mirror);mirror.name='Condensation mirror with hand-wiped center';mirror.position.set(.58,1.76,.232);scene.add(mirror);
 for(const x of[-.29,1.45])box(m.chrome,x,1.76,.248,.034,.95,.036,'Tarnished mirror frame',.007);for(const y of[1.29,2.23])box(m.chrome,.58,y,.248,1.77,.031,.036,'Mirror edge channel',.006);
 const fanRoot=new T.Group();fanRoot.position.set(-3.993,2.18,1.02);fanRoot.rotation.y=Math.PI/2;root.add(fanRoot);addBox(fanRoot,m.dark,0,0,-.065,.51,.51,.12,'Wall vent actual dark throat');
 for(const x of[-.272,.272])addBox(fanRoot,m.steel,x,0,.02,.032,.57,.06,'Vent riveted frame');for(const y of[-.272,.272])addBox(fanRoot,m.steel,0,y,.02,.55,.032,.06,'Vent frame');
 // Moving fan is outside the static batches. Grill remains physically in front.
 const fan=new T.Group();fan.name='Slow heavy extractor rotor';fan.position.copy(fanRoot.position);fan.quaternion.copy(fanRoot.quaternion);scene.add(fan);
 for(let i=0;i<4;i++){const s=new T.Shape();s.moveTo(-.035,.025);s.quadraticCurveTo(-.105,.18,-.063,.206);s.quadraticCurveTo(.105,.209,.105,.119);s.lineTo(.039,.025);const b=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSegments:1,bevelSize:.004,bevelThickness:.003,curveSegments:5}),m.steel);b.rotation.z=i*Math.PI/2;fan.add(b);}
 const hub=new T.Mesh(new T.SphereGeometry(.046,12,6),m.steel);hub.scale.z=.6;fan.add(hub);for(let i=0;i<9;i++){const blade=addBox(fanRoot,m.steel,0,-.224+i*.056,.071,.48,.016,.054,'Thick fixed exhaust louvers',.003);blade.rotation.x=-.42;}
 const flickerBulbs=[];
 for(const [x,z]of[[-1.1,3.65],[1.3,4.05]]){
  box(m.steel,x,2.78,z,.37,.11,1.55,'Hung twin-tube sealed fixture trough',.017);
  for(const dz of[-.54,.54])addTube(root,m.steel,[[x,2.86,z+dz],[x,2.95,z+dz]],.013,'Ceiling suspension stub',4);
  for(const dx of[-.091,.091]){const tube=new T.Mesh(new T.CylinderGeometry(.026,.026,1.38,12),m.glow);tube.rotation.x=Math.PI/2;tube.position.set(x+dx,2.709,z);tube.name='Physical fluorescent tube';root.add(tube);if(x>0)flickerBulbs.push(tube);
   for(const dz of[-.71,.71])box(m.basket,x+dx,2.718,z+dz,.072,.065,.055,'Porcelain tube endcap',.009);
  }
  for(const dz of[-.62,-.30,0,.30,.62])addTube(root,m.steel,[[x-.18,2.76,z+dz],[x-.18,2.661,z+dz],[x+.18,2.661,z+dz],[x+.18,2.76,z+dz]],.006,'Protective metal lamp cage',8);
 }
 RectAreaLightUniformsLib.init();const areas=BATH_AREA_LIGHTS.map(p=>{const l=new T.RectAreaLight(p.color,p.power,p.w,p.h);l.position.fromArray(p.p);l.lookAt(l.position.x,0,l.position.z);scene.add(l);return l;});
 const points=CHANGING_POINT_LIGHTS.map((p,i)=>{const l=new T.PointLight(p.color,p.power,p.range,2);l.position.fromArray(p.p);l.castShadow=i===0;l.shadow.mapSize.set(1024,1024);l.shadow.normalBias=.025;l.shadow.bias=-.0004;l.shadow.camera.near=.1;l.shadow.camera.far=p.range;scene.add(l);return l;});
 let audioCtx=null,buzz=null,osc=[];
 function audio(ctx,master,player,enabled){if(ctx!==audioCtx){audioCtx=ctx;buzz=ctx.createGain();buzz.gain.value=0;buzz.connect(master);for(const f of[60,120]){const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;o.connect(buzz);o.start();osc.push(o);}}
  const d=Math.hypot(player.x-1.3,player.z-4.05);buzz.gain.setTargetAtTime(enabled?.008/(1+d*d*.22):0,ctx.currentTime,.14);}
 const fl=m.glow.clone();fl.name='One worn fluorescent ballast';fl.userData.dynamic=true;flickerBulbs.forEach(o=>o.material=fl);
 const noise=t=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f),a=Math.sin(i*127.1+311.7)*43758.5453,b=Math.sin((i+1)*127.1+311.7)*43758.5453;return (a-Math.floor(a))*(1-u)+(b-Math.floor(b))*u;};
 return{materials:m,mirror,areas,points,fan,
  update(t){fan.rotation.z=t*.095;const n=noise(t*19.7),f=.95-.10*smoothstep(.78,.95,n)-.11*smoothstep(.94,1,noise(t*2.1));areas[3].intensity=BATH_AREA_LIGHTS[3].power*f;fl.emissiveIntensity=2.5*f;m.wet.userData.clock.value=t;},
  audio,mute(){if(buzz)buzz.gain.setTargetAtTime(0,audioCtx.currentTime,.05);},dispose(){osc.forEach(o=>{o.stop();o.disconnect();});buzz?.disconnect();}
 };
}
function smoothstep(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);}
