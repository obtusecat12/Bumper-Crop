import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createFurniture94} from './level0-furniture94.js';
export const BOUNDS95={sofa:[2.15,1.0,.96],f94LinenSofa:[1.92,1.04,.96],f94VelvetSofa:[1.92,1.04,.96],f95CRT:[.54,.58,.50],f95OfficeChair:[.69,1.10,.70],f95TallChair:[.69,1.57,.70],f95CoffeeTable:[.83,.54,.83],f95DrawerTable:[.83,.92,.83],f95GlassCabinet:[.99,1.88,.48],f95Mirror:[.77,1.44,.15],f95Cooler:[.40,1.49,.41],f95Tube:[1.24,.038,.038],f95FiveDrawer:[.86,1.27,.49],f95StripeSofa:[1.92,1.04,.96],f95StripeArmchair:[.94,1.04,.96],f95FiveLegChair:[.50,1.08,.57],f95ChairTable:[1.62,1.49,1.62],f95FusedCRT:[.79,.78,.63],f95Sideboard:[1.51,.89,.48]};
export const SOCKETS95={chair:{fifthLeg:[0,.435,.16]},coffee:{drawer:[0,.54,0]},crt:{nested:[.26,.13,.04]}};
export function createFurniture95(T,existing){
 const result={},V=(...a)=>new T.Vector3(...a);
 function model(fn){const pools={};
  const put=(m,g,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);if(g.index)g=g.toNonIndexed();if(!g.attributes.color){const c=new Float32Array(g.attributes.position.count*3);c.fill(1);g.setAttribute('color',new T.BufferAttribute(c,3));}(pools[m]??=[]).push(g);};
  function box(m,x,y,z,w,h,d,r=.009,rx=0,ry=0,rz=0){r=Math.min(r,w*.4,h*.4,d*.4);const g=new T.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=V(p.getX(i),p.getY(i),p.getZ(i)),b=V(T.MathUtils.clamp(a.x,-w/2+r,w/2-r),T.MathUtils.clamp(a.y,-h/2+r,h/2-r),T.MathUtils.clamp(a.z,-d/2+r,d/2-r)),n=a.clone().sub(b).normalize();a.copy(b).addScaledVector(n,r);p.setXYZ(i,...a.toArray());}g.computeVertexNormals();if(/Walnut|Mahogany|Ebony|burl95/.test(m)){const uv=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.6?p.getZ(i)+z:p.getX(i)+x)/.68,(ny>.6?p.getZ(i)+z:p.getY(i)+y)/.68);}}put(m,g,x,y,z,rx,ry,rz);}
  function rod(m,a,b,r=.015,r2=r){const v=V(...b).sub(V(...a)),g=new T.CylinderGeometry(r2,r,v.length(),10);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),v.clone().normalize()));put(m,g,...V(...a).addScaledVector(v,.5).toArray());}
  const curve=(m,pts,r=.004,n=18)=>put(m,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>V(...a))),n,r,5,false));
  const lathe=(m,pts,x=0,y=0,z=0,n=28)=>put(m,new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),n),x,y,z);
  fn({put,box,rod,curve,lathe});return Object.entries(pools).map(([material,gs])=>{const geometry=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());return{material,geometry,matrix:new T.Matrix4(),castShadow:true};});
 }
 function copy(parts,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],remap={}){const matrix=new T.Matrix4().compose(V(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation,'YXZ')),V(...scale));return parts.map(p=>({...p,material:remap[p.material]||p.material,matrix:matrix.clone().multiply(p.matrix)}));}
 result.f95CRT=model(({box,put,lathe,curve})=>{
  box('crtPlastic95',0,.03,.035,.28,.06,.24,.022);lathe('crtPlastic95',[[.065,0],[.09,.025],[.076,.055],[.042,.13]],0,.055,.01);
  // Tapered four-sided CRT cabinet, stepped bezel and genuinely curved dark glass.
  const g=new T.BoxGeometry(.50,.39,.43,6,5,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i),t=(.215-z)/.43;p.setXYZ(i,p.getX(i)*(1-.40*t),p.getY(i)*(1-.26*t),z);}g.computeVertexNormals();put('crtPlastic95',g,0,.365,-.009);
  box('fShadow',0,.375,.211,.459,.326,.014,.015);
  for(const [x,y,w,h]of[[-.235,.365,.031,.392],[.235,.365,.031,.392],[0,.556,.48,.028],[0,.188,.48,.062]])box('crtPlastic95',x,y,.229,w,h,.035,.010);
  const screen=new T.PlaneGeometry(.427,.294,18,14),sp=screen.attributes.position;for(let i=0;i<sp.count;i++){const x=sp.getX(i),y=sp.getY(i);sp.setZ(i,.018*(1-(x/.216)**2)*(1-(y/.151)**2));}screen.computeVertexNormals();put('crtScreen95',screen,0,.383,.227);
  for(let i=0;i<5;i++)box('socketBrown',.092+i*.022,.191,.251,.012,.008,.009,.003);
  put('greenLed95',new T.SphereGeometry(.0032,6,4),.189,.191,.253);
  // Side and rear ventilation, seams and recessed plug panel.
  for(const side of[-1,1])for(let i=0;i<12;i++)box('fShadow',side*(.166+i*.005),.375,-.178+i*.022,.004,.122,.009,.001);
  put('crtVent95',new T.PlaneGeometry(.22,.17),0,.43,-.231,0,Math.PI);
  box('fShadow',0,.32,-.232,.19,.077,.004,.003);for(let i=0;i<7;i++)box('socketBrown',-.055+i*.018,.32,-.237,.009,.014,.006,.002);
  curve('cable95',[[.06,.29,-.24],[.15,.20,-.36],[.22,.023,-.39],[.33,.012,-.28]],.005,16);
 });
 function office(tall=false){const shift=tall?.45:0;return model(({box,rod,put,lathe,curve})=>{
  lathe('blackPlastic',[[.085,.07],[.06,.12],[.031,.13],[.031,.43+shift]],0,0,0,14);rod('kSteel',[0,.15,0],[0,.42+shift,0],.021);
  for(let i=0;i<5;i++){const a=i*6.283/5,x=Math.sin(a)*.29,z=Math.cos(a)*.29;rod('blackPlastic',[0,.12,0],[x,.08,z],.027,.019);for(const s of[-1,1])put('blackPlastic',new T.CylinderGeometry(.032,.032,.017,12),x+s*.014,.035,z,0,0,Math.PI/2);}
  box('fGreenSeat',0,.47+shift,0,.49,.10,.49,.048);box('blackPlastic',0,.419+shift,0,.44,.023,.44,.01);rod('blackPlastic',[0,.43+shift,-.18],[0,.91+shift,-.25],.025);box('fGreenSeat',0,.875+shift,-.239,.43,.38,.095,.042,-.12);
  for(const s of[-1,1]){curve('blackPlastic',[[s*.19,.42+shift,-.13],[s*.28,.58+shift,-.12],[s*.28,.67+shift,.06]],.019);box('blackPlastic',s*.285,.675+shift,.018,.064,.036,.27,.021);}
 });}
 result.f95OfficeChair=office();result.f95TallChair=office(true);
 result.f95CoffeeTable=model(({lathe,put,rod})=>{lathe('burl95',[[0,.49],[.397,.49],[.415,.503],[.415,.535],[.397,.546],[0,.546]]);lathe('fWalnut',[[.04,.07],[.065,.12],[.032,.23],[.07,.30],[.052,.38],[.07,.47],[.07,.491]],0,0,0,24);for(let i=0;i<4;i++){const a=i*Math.PI/2;rod('fWalnut',[0,.17,0],[Math.sin(a)*.28,.045,Math.cos(a)*.28],.045,.023);}});
 const drawerSocket=model(({box,rod})=>{box('fWalnut',0,.14,0,.34,.28,.29);box('burl95',0,.145,.155,.32,.233,.035,.006);for(const x of[-.08,.08])rod('fBrass',[x,.15,.178],[x,.15,.198],.008);rod('fBrass',[-.08,.15,.20],[.08,.15,.20],.007);});
 result.f95DrawerTable=[...result.f95CoffeeTable,...copy(drawerSocket,SOCKETS95.coffee.drawer,[0,.18,0],[1,1.24,1])];
 result.f95FiveDrawer=model(({box,rod})=>{
  box('fShadow',0,.674,0,.79,1.105,.40);for(const s of[-1,1]){box('fMahogany',s*.397,.667,0,.052,1.19,.46);for(const z of[-.18,.18])box('fMahogany',s*.344,.07,z,.074,.14,.074,.012);}
  box('burl95',0,1.267,0,.86,.063,.49,.016);box('fMahogany',0,.14,0,.83,.081,.46,.012);
  for(let j=0;j<5;j++){const y=.268+j*.218;box('burl95',0,y,.226,.747,.20,.040,.009);for(const x of[-.205,.205]){putHandle(box,rod,x,y,.258);}}
 });
 function putHandle(box,rod,x,y,z){for(const dx of[-.043,.043])box('fBrass',x+dx,y,z,.017,.024,.009,.004);rod('fBrass',[x-.043,y,z+.017],[x+.043,y,z+.017],.006);}
 result.f95GlassCabinet=model(({box,rod,put})=>{
  for(const x of[-.439,.439])box('fWalnut',x,.97,0,.067,1.71,.44);box('fWalnut',0,.97,-.212,.88,1.69,.032);box('fMahogany',0,1.847,0,.99,.079,.48,.015);box('fMahogany',0,.13,0,.97,.13,.46,.012);
  for(const x of[-.38,.38])for(const z of[-.16,.16])box('fMahogany',x,.065,z,.072,.13,.072);
  for(const y of[.27,.70,1.12,1.54])box('fWalnut',0,y,0,.85,.027,.37,.005);
  for(const s of[-1,1]){const cx=s*.226;for(const dx of[-.208,.208])box('fMahogany',cx+dx,1.008,.233,.029,1.602,.034,.004);for(const y of[.22,1.008,1.794])box('fMahogany',cx,y,.233,.437,.029,.034,.004);box('cabinetGlass95',cx,1.008,.234,.387,1.547,.008,.002);rod('fBrass',[s*.035,.94,.259],[s*.035,1.06,.259],.006);}
  for(let i=0;i<6;i++){const x=-.30+i*.12;box(i%2?'kBookRed':'kBookGreen',x,.436,-.06,.055,.30,.15,.003,0,0,(i%3-1)*.045);}
  for(let i=0;i<3;i++)put('ivory',new T.CylinderGeometry(.052,.043,.17,20),-.24+i*.23,.80,.015);
 });
 result.f95Mirror=model(({box,put})=>{box('fWalnut',0,.72,0,.76,1.43,.051,.013);box('mirror95',0,.75,.031,.628,1.257,.008,.003);for(const s of[-1,1]){box('fCarve',s*.348,.735,.046,.060,1.39,.032,.010);box('fBrass',s*.314,.75,.045,.009,1.275,.006,.003);}for(const y of[.056,1.406])box('fCarve',0,y,.046,.73,.063,.038,.012);box('fWalnut',0,.45,-.077,.054,.90,.045,.005,-.10);});
 result.f95Cooler=model(({box,lathe,rod,put})=>{
  box('coolerWhite95',0,.51,0,.37,.94,.35,.026);box('blackPlastic',0,.046,0,.38,.05,.36,.01);box('coolerWhite95',0,.986,0,.40,.046,.38,.011);
  box('fShadow',0,.71,.18,.255,.30,.012,.016);box('coolerArt95',0,.707,.192,.263,.301,.007,.004);
  for(const [x,mat]of[[-.073,'redTap95'],[.073,'blueKnob']]){rod('coolerWhite95',[x,.787,.19],[x,.787,.225],.019);box(mat,x,.819,.235,.035,.028,.068,.008);rod('coolerWhite95',[x,.787,.22],[x,.750,.24],.012);}
  box('blackPlastic',0,.545,.224,.26,.025,.10,.005);for(let i=0;i<11;i++)box('steel',-.114+i*.023,.56,.224,.007,.006,.08,.001);
  for(let i=0;i<12;i++)box('socketBrown',0,.135+i*.020,.176,.25,.008,.008,.001);
  lathe('jug95',[[.025,0],[.026,.055],[.078,.10],[.132,.15],[.135,.37],[.115,.435],[.066,.454],[0,.454]],0,1.01,0,24);
  for(const y of[1.18,1.24,1.34])put('jug95',new T.TorusGeometry(.136,.0055,4,24),0,y,0,Math.PI/2);lathe('blueKnob',[[.026,0],[.030,.019],[.03,.033]],0,.990,0,12);
 });
 result.f95Tube=model(({put,rod})=>{rod('tubeGlass95',[-.57,0,0],[.57,0,0],.014);for(const s of[-1,1]){rod('kSteel',[s*.57,0,0],[s*.606,0,0],.016);for(const z of[-.004,.004])rod('fBrass',[s*.606,0,z],[s*.621,0,z],.0015);}});
 const base=existing||createFurniture94(T);
 result.f95StripeSofa=copy(base.f94LinenSofa,[0,0,0],[0,0,0],[1,1,1],{fLinen:'stripe95'});
 result.f95StripeArmchair=copy(base.f94LinenArmchair,[0,0,0],[0,0,0],[1,1,1],{fLinen:'stripe95'});
 const extraLeg=model(({rod})=>rod('fMaple',[0,0,0],[.014,-.412,.07],.021,.028));
 result.f95FiveLegChair=[...base.f94SpindleChair,...copy(extraLeg,SOCKETS95.chair.fifthLeg)];
 result.f95FusedCRT=[...result.f95CRT,...copy(result.f95CRT,SOCKETS95.crt.nested,[.11,.48,0],[.91,1.07,.86])];
 // Socket-mounted chair backs/legs meet the shared table apron like the reference's wrong object.
 result.f95ChairTable=model(({box,rod,curve})=>{
  box('fWalnut',0,.856,0,1.16,.074,1.16,.014);for(const s of[-1,1]){box('fWalnut',s*.54,.76,0,.055,.18,1.11);box('fWalnut',0,.76,s*.54,1.11,.18,.055);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2,c=Math.cos(a),s=Math.sin(a),P=(x,y,z)=>[c*x+s*z,y,-s*x+c*z];
   box('fGreenSeat',s*.58,.887,c*.58,i%2?.40:.55,.057,i%2?.55:.40,.017);
   for(const x of[-.247,.247]){rod('fWalnut',P(x,.025,.72),P(x,.87,.68),.024,.035);rod('fWalnut',P(x,.85,.68),P(x,1.42,.76),.031,.033);}
   curve('fWalnut',[P(-.263,1.41,.759),P(-.13,1.39,.76),P(0,1.43,.76),P(.13,1.47,.76),P(.263,1.44,.759)],.045,22);
   rod('fWalnut',P(-.247,.30,.70),P(.247,.30,.70),.017);
  }
 });
 result.f95Sideboard=[...copy(result.f95FiveDrawer,[-.35,0,0],[0,0,0],[.82,.67,1]),...copy(result.f95FiveDrawer,[.35,0,0],[0,0,0],[.82,.67,1])];
 return result;
}
