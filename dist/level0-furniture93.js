import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
/** Metre-scale joinery and upholstery. Static once, merged by finish, instanced by world. */
export function createFurniture93(T){
 const V=(x,y,z)=>new T.Vector3(x,y,z),white=new T.Color(0xffffff);
 const clamp=T.MathUtils.clamp;
 function rounded(w,h,d,r=.008,n=4){
  r=Math.min(r,w*.45,h*.45,d*.45);const g=new T.BoxGeometry(w,h,d,n,n,n),p=g.attributes.position,no=g.attributes.normal;
  // Cubic grid remap concentrates samples at the fillet instead of subdividing flat panels.
  const axis=(v,size)=>{const t=v/(size/2);return Math.abs(t)>.99?v:Math.sign(t)*(size/2-r)*Math.min(1,Math.abs(t)*2);};
  for(let i=0;i<p.count;i++){let a=V(axis(p.getX(i),w),axis(p.getY(i),h),axis(p.getZ(i),d)),q=V(clamp(a.x,-w/2+r,w/2-r),clamp(a.y,-h/2+r,h/2-r),clamp(a.z,-d/2+r,d/2-r)),v=a.clone().sub(q).normalize();a.copy(q).addScaledVector(v,r);p.setXYZ(i,a.x,a.y,a.z);no.setXYZ(i,v.x,v.y,v.z);}return g;
 }
 function surface(nx,ny,fn){const p=[],uv=[],idx=[],col=[];for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const u=x/nx,v=y/ny,a=fn(u,v);p.push(...a.slice(0,3));uv.push(u,v);const c=a[3]??1;col.push(c,c,c);}for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+nx+1;idx.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 function make(fn){const pools={};
  const put=(m,g,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);g=g.index?g.toNonIndexed():g;if(!g.attributes.color){const c=new Float32Array(g.attributes.position.count*3);c.fill(1);g.setAttribute('color',new T.BufferAttribute(c,3));}(pools[m]??=[]).push(g);};
  const box=(m,x,y,z,w,h,d,r=.008,rx=0,ry=0,rz=0)=>{const g=rounded(w,h,d,r),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;const cloth=m==='fDamask',leather=['fOxblood','fTobacco','fLeatherEdge'].includes(m),wood=['fMahogany','fWalnut','fEbony'].includes(m);if(cloth||leather||wood){for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(cloth||leather){const scale=cloth?.57:.64;if(ay>ax&&ay>az){u=p.getX(i)/scale;v=p.getZ(i)/scale;}else if(ax>az){u=p.getZ(i)/scale;v=p.getY(i)/scale;}else{u=p.getX(i)/scale;v=p.getY(i)/scale;}}else if(w>h*2.4){u=(ay>.5?p.getZ(i):p.getY(i))/.50;v=p.getX(i)/1.25;}else if(ay>ax&&ay>az){u=p.getZ(i)/.60;v=p.getX(i)/1.25;}else{u=(ax>az?p.getZ(i):p.getX(i))/.85;v=p.getY(i)/1.55;}uv.setXY(i,u+.5,v+.5);}}put(m,g,x,y,z,rx,ry,rz);};
  const line=(m,points,r=.004,segments=30,closed=false)=>put(m,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p)),closed,'centripetal'),segments,r,5,closed));
  const rod=(m,a,b,r1,r2=r1)=>{const v=V(...b).sub(V(...a)),g=new T.CylinderGeometry(r2,r1,v.length(),8,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),v.clone().normalize()));put(m,g,...V(...a).addScaledVector(v,.5).toArray());};
  const turned=(m,x,z,h=.14,r=.039,y=0)=>put(m,new T.LatheGeometry([[r*.70,0],[r*.90,.015],[r*.98,.035],[r*.63,h*.43],[r*.75,h*.62],[r*.68,h*.82],[r,h]].map(a=>new T.Vector2(...a)),10),x,y,z);
  const ring=(m,x,y,z,r=.023)=>put(m,new T.TorusGeometry(r,.0035,5,14),x,y,z);
  const pull=(x,y,z,span=.08)=>{for(const dx of[-span/2,span/2]){put('fBrass',new T.SphereGeometry(.012,8,5),x+dx,y,z);box('fBrass',x+dx,y,z-.006,.026,.036,.006,.006);}line('fBrass',[[x-span/2,y,z],[x-span/2,y-.018,z+.017],[x,y-.024,z+.022],[x+span/2,y-.018,z+.017],[x+span/2,y,z]],.004,12);};
  fn({put,box,line,rod,turned,ring,pull});return Object.entries(pools).map(([material,geos])=>{const geometry=mergeGeometries(geos,false);for(const g of geos)g.dispose();geometry.computeBoundingBox();return{material,geometry,matrix:new T.Matrix4(),castShadow:true};});
 }
 function welt(box,line,m,x,y,z,w,d){const pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;pts.push([x+Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.35*(w/2-.018),y,z+Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.35*(d/2-.018)]);}line(m,pts,.0035,48,true);}
 const stud=(put,x,y,z)=>put('fBrass',new T.SphereGeometry(.0048,6,4),x,y,z);
 function leatherSeat(w=2.15,m='fOxblood',club=false){return make(({put,box,line,rod,turned})=>{
  const d=.94,armX=w/2-.145,sw=w-.57;for(const x of[-w/2+.17,w/2-.17])for(const z of[-.32,.32])turned('fEbony',x,z,.16,.041);
  box('fEbony',0,.173,0,w-.16,.045,.78,.010);box(m,0,.286,.015,w-.10,.23,.85,.044);
  // Three small resilient cushions, piped on both sides; set into, not hovering above, the seat frame.
  const seats=w>1.5?3:1,cs=sw/seats;
  for(let i=0;i<seats;i++){const x=(i-(seats-1)/2)*(cs+.006);box(m,x,.439,.065,cs-.009,.168,.67,.064);welt(box,line,'fLeatherEdge',x,.477,.065,cs-.009,.67);welt(box,line,m,x,.407,.065,cs-.009,.67);}
  // Closed upholstered back shell plus a separate genuinely indented diamond quilt face.
  box(m,0,.654,-.362,w-.21,.45,.17,.063,-.095);
  const width=w-.32,y0=.506,y1=.831,dx=.17,dy=.106;
  const face=surface(Math.ceil(width/.022),24,(u,v)=>{const x=(u-.5)*width,y=y0+(y1-y0)*v,xx=x/dx,yy=(y-y0)/dy;let dip=0;for(let row=-1;row<=4;row++){const by=y0+row*dy,bx=(Math.round(xx-(row%2)*.5)+(row%2)*.5)*dx;dip=Math.max(dip,Math.exp(-((x-bx)**2+(y-by)**2)/.00023));}const seam=Math.min(Math.abs(Math.sin(Math.PI*(xx+yy*.5))),Math.abs(Math.sin(Math.PI*(xx-yy*.5))));const puff=.025*Math.pow(seam,.45);return[x,y,-.196-(y-y0)*.075+puff-.024*dip, .83+.17*Math.min(1,seam*4)*(1-dip*.24)];});put(m,face);
  for(let row=0;row<4;row++){const y=y0+row*dy;for(let n=-9;n<=9;n++){const x=(n+(row%2)*.5)*dx;if(Math.abs(x)>width/2-.025)continue;put('fLeatherEdge',new T.SphereGeometry(.010,8,5),x,y,-.196-(y-y0)*.075-.020);}}
  // Top roll and long, shaped scroll arms; the front caps are padded, welted and nail-trimmed.
  put(m,new T.CylinderGeometry(.102,.102,w-.27,20,1),0,.828,-.337,0,0,Math.PI/2);
  for(const s of[-1,1]){const x=s*armX;box(m,x,.515,0,.238,.445,.84,.056);const arm=surface(26,12,(u,v)=>{const a=u*Math.PI*2,zz=-.365+v*.76,bulge=1+.055*Math.sin(v*Math.PI);return[x+Math.cos(a)*.143*bulge,.760+Math.sin(a)*.139*bulge,zz];});put(m,arm);put(m,new T.SphereGeometry(1,20,12).scale(.143,.139,.045),x,.760,.395);put(m,new T.SphereGeometry(1,16,10).scale(.143,.139,.04),x,.760,-.365);
   const points=[];for(let j=0;j<36;j++){const a=j/36*Math.PI*2;points.push([x+Math.cos(a)*.126,.760+Math.sin(a)*.121,.419]);}line('fLeatherEdge',points,.004,36,true);
   for(let j=0;j<14;j++){const a=(j/14)*Math.PI*2;stud(put,x+Math.cos(a)*.113,.760+Math.sin(a)*.108,.43);}
   line('fLeatherEdge',[[x+s*.098,.35,.418],[x+s*.092,.49,.42],[x+s*.069,.63,.422]],.003,12);
  }
  line('fLeatherEdge',[[-w/2+.16,.337,.445],[0,.345,.45],[w/2-.16,.337,.445]],.004,28);
  for(let j=0;j<Math.floor((w-.32)/.033);j++)stud(put,-w/2+.17+j*.033,.283,.447);
 });}
 function panel({box},mat,x,y,z,w,h){
  box(mat,x,y,z,w,h,.032,.004);
  const a=.043;box(mat,x,y,z+.020,w-a*2,h-a*2,.025,.012);
  // A narrow, darker quirk between the raised centre and the solid mortised frame.
  for(const s of[-1,1]){box(mat,x+s*(w/2-.017),y,z+.025,.032,h,.024,.005);box(mat,x,y+s*(h/2-.017),z+.025,w-.034,.032,.024,.005);}
 }
 function cabinet(mat='fWalnut',w=.9,h=1.88,d=.50,style=0){return make(o=>{const{box,put,turned,pull,line}=o;
  for(const x of[-w/2+.08,w/2-.08])for(const z of[-d/2+.075,d/2-.075])turned(mat,x,z,.11,.030);
  box('fShadow',0,h/2,0,w-.07,h-.15,d-.055,.004);
  for(const x of[-w/2+.021,w/2-.021]){box(mat,x,h/2,0,.040,h-.16,d-.035,.006);box(mat,x,h/2,0,.046,h-.27,d-.14,.012);}
  box(mat,0,h/2,-d/2+.019,w-.055,h-.18,.028,.003);
  const plinths=[[.119,.074,w-.01,d-.008],[.16,.025,w+.012,d+.004],[h-.034,.068,w,d],[h-.082,.021,w-.025,d-.018]];
  for(const[y,hh,ww,dd]of plinths)box(mat,0,y,0,ww,hh,dd,.009);
  // A physical cornice with a relief strip. Ebonized case has restrained brass banding.
  if(style!==2){box(mat,0,h-.105,d/2-.014,w-.055,.034,.035,.005);box('fCarve',0,h-.104,d/2+.005,w-.11,.027,.012,.003);}else{box('fBrass',0,h-.10,d/2+.005,w-.08,.009,.004,.002);}
  const top=h-.14,bottom=.185,drawH=h>1.5?.22:.20,doorTop=top-drawH-.012,doorH=doorTop-bottom;
  box(mat,0,top-drawH/2,d/2-.014,w-.10,drawH,.04,.005);for(const x of[-w*.23,w*.23])pull(x,top-drawH*.54,d/2+.025,.067);
  if(style===2){const dh=(doorH-.018)/4;for(let row=0;row<4;row++)for(const sign of[-1,1]){const pw=(w-.124)/2,x=sign*(pw/2+.004),y=bottom+dh*(row+.5);panel(o,mat,x,y,d/2-.015,pw,dh-.006);pull(x,y+.02,d/2+.042,.064);box('fBrass',x,y-.049,d/2+.035,.055,.022,.006,.003);box('fShadow',x,y-.049,d/2+.039,.042,.011,.002,.001);}}
  else for(const s of[-1,1]){const pw=(w-.124)/2,x=s*(pw/2+.004);panel(o,mat,x,bottom+doorH/2,d/2-.015,pw,doorH);const xx=s*.035;box('fBrass',xx,doorTop-.16,d/2+.035,.019,.044,.008,.005);put('fBrass',new T.SphereGeometry(.011,8,6),xx,doorTop-.153,d/2+.047);box('fShadow',xx,doorTop-.173,d/2+.040,.003,.010,.003,.001);
   for(const y of[bottom+.095,doorTop-.10]){box('fBrass',s*(w/2-.057),y,d/2+.023,.027,.030,.006,.003);put('fBrass',new T.CylinderGeometry(.004,.004,.039,7),s*(w/2-.059),y,d/2+.029);}
  }
  for(const s of[-1,1]){box(mat,s*(w/2-.037),h/2,d/2-.020,.028,h-.23,.07,.005);if(style===0)for(const dx of[-.007,.007])box('fCarve',s*(w/2-.037)+dx,h/2,d/2+.017,.005,h-.33,.004,.001);}
 });}
 function bureau(){return make(o=>{const{box,pull,turned}=o,w=1.34,h=.86,d=.54;for(const x of[-.58,.58])for(const z of[-.19,.19])turned('fMahogany',x,z,.12,.034);box('fShadow',0,.46,0,1.28,.67,.48);for(const s of[-1,1])box('fMahogany',s*.625,.475,-.005,.06,.68,.49,.009);box('fMahogany',0,.13,.006,1.30,.055,.51,.012);box('fMahogany',0,.831,0,1.34,.058,.54,.014);box('fCarve',0,.774,.245,1.20,.037,.025,.004);for(let row=0;row<3;row++){const y=.25+row*.204;box('fMahogany',0,y,.242,1.18,.194,.040,.007);box('fMahogany',0,y,.267,1.12,.15,.012,.007);for(const x of[-.34,.34])pull(x,y+.015,.286,.102);} });}
 function bookcase(){return make(o=>{const{box}=o;box('fWalnut',0,.82,-.155,.70,1.53,.022,.003);for(const s of[-1,1]){box('fWalnut',s*.365,.80,0,.048,1.60,.34,.007);box('fCarve',s*.366,.83,.166,.031,1.41,.016,.003);}for(const y of[.10,.48,.87,1.23,1.565]){box('fWalnut',0,y,0,.735,.036,.335,.007);box('fWalnut',0,y-.008,.168,.728,.029,.015,.005);}box('fWalnut',0,.039,0,.78,.078,.34,.012);box('fWalnut',0,1.581,0,.78,.038,.34,.009);});}
 function chair(arm=false){return make(({put,box,line,rod,turned})=>{
  for(const x of[-.19,.19])for(const z of[-.19,.18])turned('fWalnut',x,z,.415,.023);
  box('fWalnut',0,.409,0,.48,.060,.49,.025);box('fDamask',0,.456,.012,.428,.078,.417,.036);welt(box,line,'fWalnut',0,.472,.012,.428,.417);
  for(const s of[-1,1]){rod('fWalnut',[s*.211,.38,-.18],[s*.219,.95,-.245],.021,.026);box('fCarve',s*.208,.720,-.21,.030,.40,.045,.008,-.1);}
  box('fWalnut',0,.92,-.24,.48,.09,.046,.026);box('fCarve',0,.925,-.212,.39,.057,.016,.009);box('fDamask',0,.736,-.21,.358,.302,.07,.04,-.1);
  for(const s of[-1,1])rod('fWalnut',[s*.184,.16,-.19],[s*.184,.16,.18],.012);
  if(arm)for(const s of[-1,1]){rod('fWalnut',[s*.224,.46,.19],[s*.224,.64,.17],.019,.017);line('fWalnut',[[s*.225,.64,.19],[s*.229,.665,.09],[s*.23,.68,-.16]],.025,14);}
 });}
 function table(w=.86,h=.65,d=.48){return make(({box,turned,line})=>{for(const x of[-w/2+.075,w/2-.075])for(const z of[-d/2+.063,d/2-.063])turned('fWalnut',x,z,h-.064,.024);box('fWalnut',0,h-.029,0,w,.058,d,.012);for(const s of[-1,1]){box('fWalnut',0,h-.094,s*(d/2-.046),w-.09,.093,.024,.005);box('fWalnut',s*(w/2-.041),h-.094,0,.025,.093,d-.10,.004);}box('fCarve',0,h-.092,d/2-.029,w-.17,.045,.012,.004);});}
 function settee(){return make(({box,put,line,rod,turned})=>{const w=1.94;for(const x of[-.83,.83])for(const z of[-.28,.28])turned('fEbony',x,z,.20,.037);box('fEbony',0,.263,0,w-.13,.15,.74,.025);box('fCarve',0,.284,.367,w-.20,.074,.016,.003);box('fDamask',0,.407,.033,w-.36,.174,.67,.063);welt(box,line,'fEbony',0,.446,.033,w-.36,.67);for(const x of[-.86,.86])rod('fEbony',[x,.22,-.29],[x,.91,-.33],.026,.026);box('fEbony',0,.717,-.312,w-.05,.458,.097,.05,-.10);box('fDamask',0,.719,-.242,w-.23,.342,.135,.053,-.11);line('fEbony',[[-.81,.900,-.30],[-.40,.924,-.32],[0,.948,-.33],[.4,.924,-.32],[.81,.900,-.30]],.019,32);for(const s of[-1,1]){rod('fEbony',[s*.86,.3,.25],[s*.90,.69,.27],.026,.033);line('fEbony',[[s*.90,.68,.28],[s*.91,.706,.12],[s*.90,.744,-.12],[s*.86,.83,-.29]],.034,20);box('fDamask',s*.90,.704,.10,.082,.063,.37,.028,-.13);} });}
 const props={sofa:leatherSeat(),armchair:leatherSeat(.96,'fTobacco',true),recliner:leatherSeat(1.02,'fTobacco',true),bookcase:bookcase(),bureau:bureau(),diningChair:chair(),ovalChair:chair(true),spindleTable:table(),settee:settee(),ebonyCabinet:cabinet('fEbony',.9,1.88,.5,2),mahoganyCabinet:cabinet('fMahogany',.9,1.88,.5,0),walnutCabinet:cabinet('fWalnut',.9,1.88,.5,1)};
 props.kCabinet=cabinet('fMahogany',1.16,1.12,.80,0);props.kWalnutLow=cabinet('fWalnut',1.16,1.12,.80,1);props.kTallCabinet=props.walnutCabinet;props.kMahoganyTall=props.mahoganyCabinet;props.kEbonyTall=props.ebonyCabinet;
 props.kBookcase=props.bookcase;props.kSofa=leatherSeat(1.74);props.kArmchair=props.armchair;props.kWoodChair=props.diningChair;props.kSideTable=table(.66,.61,.50);props.kDesk=table(1.05,.79,.54);
 props.kSupportBoard=make(({box})=>box('fEbony',0,.023,0,2.40,.046,.85,.007));return props;
}
