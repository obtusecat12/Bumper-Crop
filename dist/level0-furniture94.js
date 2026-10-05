import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
// Distinct silhouettes; centimetre joinery, metre-density UVs, permanent shared batches.
export function createFurniture94(T){
 const V=(...p)=>new T.Vector3(...p), result={};
 function model(fn){const pools={};
  function put(mat,g,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);if(g.index)g=g.toNonIndexed();if(!g.attributes.color){const a=new Float32Array(g.attributes.position.count*3);a.fill(1);g.setAttribute('color',new T.BufferAttribute(a,3));}(pools[mat]??=[]).push(g);}
  function box(mat,x,y,z,w,h,d,r=.008,rx=0,ry=0,rz=0){r=Math.min(r,w*.4,h*.4,d*.4);const g=new T.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const a=V(p.getX(i),p.getY(i),p.getZ(i));for(const [k,s]of[['x',w],['y',h],['z',d]])if(Math.abs(a[k])<s*.49)a[k]=Math.sign(a[k])*(s/2-r)*Math.min(1,Math.abs(a[k])/(s*.25));const q=V(T.MathUtils.clamp(a.x,-w/2+r,w/2-r),T.MathUtils.clamp(a.y,-h/2+r,h/2-r),T.MathUtils.clamp(a.z,-d/2+r,d/2-r)),nn=a.clone().sub(q).normalize();a.copy(q).addScaledVector(nn,r);p.setXYZ(i,...a.toArray());n.setXYZ(i,...nn.toArray());const wood=['fMaple','fWalnut','fEbony','fMahogany'].includes(mat),scale=wood?1.1:.36;uv.setXY(i,(Math.abs(nn.x)>.6?a.z:a.x)/scale,(Math.abs(nn.y)>.6?a.z:a.y)/scale);}
   put(mat,g,x,y,z,rx,ry,rz);
  }
  function rod(mat,a,b,r1=.017,r2=r1){const delta=V(...b).sub(V(...a)),g=new T.CylinderGeometry(r2,r1,delta.length(),8,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),delta.clone().normalize()));put(mat,g,...V(...a).addScaledVector(delta,.5).toArray());}
  function curve(mat,points,r=.003,n=24){put(mat,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),n,r,5,false));}
  function piping(mat,x,y,z,w,d){const pts=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;pts.push([x+Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.28*(w/2-.01),y,z+Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.28*(d/2-.01)]);}curve(mat,pts,.003,40);}
  fn({put,box,rod,curve,piping});return Object.entries(pools).map(([material,gs])=>{const geometry=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());geometry.computeBoundingBox();return{material,geometry,matrix:new T.Matrix4(),castShadow:true};});
 }
 function chair(mat,spindle=false,padded=false){return model(({box,rod,curve,put})=>{
  for(const x of[-.185,.185])for(const z of[-.19,.19])rod(mat,[x*1.12,.022,z*1.1],[x,.45,z],.021,.026);
  box(mat,0,.423,0,.47,.065,.46,.02);if(padded)box('fGreenSeat',0,.473,.008,.42,.065,.41,.023);else box(mat,0,.462,0,.43,.018,.42,.007);
  for(const s of[-1,1]){rod(mat,[s*.197,.41,-.188],[s*.223,1.005,-.255],.021,.025);rod(mat,[s*.191,.18,-.196],[s*.191,.18,.196],.012);}
  rod(mat,[-.198,.20,-.193],[.198,.20,-.193],.012);
  if(spindle){for(let i=-2;i<=2;i++)rod(mat,[i*.075,.48,-.201],[i*.085,.95,-.253],.009,.010);curve(mat,[[-.237,.968,-.255],[-.16,1.027,-.267],[0,1.061,-.275],[.16,1.027,-.267],[.237,.968,-.255]],.027,20);}
  else for(const y of[.655,.80,.962])box(mat,0,y,-.206-(y-.46)*.10,.438,.068,.040,.014,-.10);
 });}
 function upholstery(w,mat,style=0){return model(({box,rod,curve,put,piping})=>{
  for(const x of[-w/2+.13,w/2-.13])for(const z of[-.31,.31])box('fMaple',x,.09,z,.064,.18,.064,.012);
  box(mat,0,.268,0,w,.26,.84,.072);box(mat,0,.66,-.33,w,.66,.22,.090,-.13);
  const seats=w>1.4?2:1,inside=w-.36;
  for(let i=0;i<seats;i++){const x=(i-(seats-1)/2)*inside/seats,sw=inside/seats-.015;box(mat,x,.477,.09,sw,.18,.66,.080);piping(mat,x,.523,.09,sw,.66);box(mat,x,.762,-.177,sw,.42,.20,.083,-.12);curve(mat,[[x-sw/2+.04,.611,-.071],[x,.595,-.055],[x+sw/2-.04,.611,-.071]],.0025,16);}
  for(const s of[-1,1]){const x=s*(w/2-.105);box(mat,x,.50,0,.225,.39,.91,.092);box(mat,x,.665,.025,.28,.25,.92,.114);curve(mat,[[x+s*.095,.35,.442],[x+s*.112,.53,.452],[x+s*.076,.693,.455],[x,.734,.455],[x-s*.072,.693,.45]],.004,24);}
  piping(mat,0,.315,0,w,.86);
  // Small puckering at stitched cushion edges, independent of the generated weave.
  for(let i=0;i<seats;i++){const x=(i-(seats-1)/2)*inside/seats;for(const s of[-1,1])curve(mat,[[x+s*(inside/seats/2-.05),.527,.38],[x+s*(inside/seats/2-.025),.516,.37],[x+s*(inside/seats/2-.01),.49,.33]],.0017,6);}
 });}
 function openCase(w,h,d,mat,wardrobe=false){return model(({box,rod})=>{
  for(const s of[-1,1])box(mat,s*(w/2-.017),h/2,0,.034,h,d,.006);
  box(mat,0,h/2,-d/2+.011,w-.05,h-.035,.022,.004);
  for(const y of wardrobe?[.045,h-.033]:[.045,h*.26,h*.51,h*.76,h-.033]){box(mat,0,y,0,w,.045,d,.007);box(mat,0,y-.009,d/2-.001,w,.028,.017,.004);}
  if(wardrobe){rod('fBrass',[-w/2+.04,h-.19,0],[w/2-.04,h-.19,0],.011);box(mat,0,h-.085,d/2,w,.075,.045,.013);}
 });}
 function dresser(){return model(({box,rod})=>{
  box('fShadow',0,.46,0,1.23,.67,.47);
  for(const s of[-1,1]){box('fMaple',s*.608,.46,0,.043,.73,.52);for(const z of[-.19,.19])box('fMaple',s*.55,.07,z,.055,.14,.055);}
  box('fMaple',0,.84,0,1.32,.064,.56,.015);box('fMaple',0,.126,0,1.28,.067,.53,.013);
  for(let i=0;i<4;i++){const y=.235+i*.165;box('fMaple',0,y,.263,1.19,.155,.042,.007);for(const x of[-.35,.35]){for(const dx of[-.047,.047])box('fBrass',x+dx,y,.294,.013,.025,.015,.003);rod('fBrass',[x-.047,y,.314],[x+.047,y,.314],.007);}}
 });}
 result.f94LadderChair=chair('fWalnut',false,true);result.f94SpindleChair=chair('fMaple',true);result.f94EbonyChair=chair('fEbony',false);
 result.f94LinenArmchair=upholstery(.94,'fLinen');result.f94VelvetSofa=upholstery(1.92,'fVelvet');result.f94LinenSofa=upholstery(1.92,'fLinen');
 result.f94OpenBookcase=openCase(.86,1.85,.34,'fWalnut');result.f94Wardrobe=openCase(1.06,1.96,.58,'fMahogany',true);result.f94MapleChest=dresser();
 result.f94Panel=model(({box})=>{box('fWalnut',0,.9,0,.88,1.8,.048,.008);for(const x of[-.40,.40])box('fMahogany',x,.9,.032,.060,1.8,.033,.004);for(const y of[.04,.90,1.76])box('fMahogany',0,y,.032,.80,.065,.033,.004);});
 result.f94Footstool=model(({box,piping})=>{for(const x of[-.23,.23])for(const z of[-.17,.17])box('fMaple',x,.16,z,.038,.32,.038,.008);box('fGreenSeat',0,.332,0,.58,.14,.46,.065);piping('fGreenSeat',0,.368,0,.58,.46);});
 return result;
}
