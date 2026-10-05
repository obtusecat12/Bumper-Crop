import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {ATRIUM96 as A,atriumLevelY96,topWalls96,inAtrium96} from './level0-atrium-plan96.js';
import {ATRIUM_LEVELS97,FURNISHINGS97,CROSS_DOOR97} from './level0-atrium-plan97.js';
import {createWindows96} from './level0-windows96.js';

// Open construction sections, never solid balcony fascias. No stairs are generated here.
export function createAtrium96(T,renderer,scene,shared,props,ceiling){
 const root=new T.Group();root.name='Downward atrium · 22 exposed room tiers';root.position.set(A.x,0,A.z);scene.add(root);
 let activeFrame=null;const detailStats97={flatInsulation:0,verticalInsulation:0,studBays:0};
 const pools=new Map(),pending=[],materials=new Map(),cache=new Map(),lights=[];
 const loader=new T.TextureLoader();
 function tex(name,color,version=96){if(cache.has(name))return cache.get(name);let resolve,reject;pending.push(new Promise((a,b)=>{resolve=a;reject=b;}));const t=loader.load('./assets/level0-v'+version+'/'+name,resolve,undefined,reject);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());cache.set(name,t);return t;}
 function surface(name,color=0xffffff,roughness=1,normal=.16){return new T.MeshStandardMaterial({map:tex(name+'.webp',true),normalMap:tex(name+'-normal.webp'),roughnessMap:tex(name+'-roughness.webp'),color,roughness,normalScale:new T.Vector2(normal,normal)});}
 const plaster=surface('plaster',0xf7f0d8,1,.055),joist=surface('joist',0xbea982,.94,.24),pink=surface('pink-insulation',0xefc9c0,1,.6),poolTile=surface('pool-tile',0xb9d0cc,.64,.23);
 const brownDoor=surface('brown-door',0xbca484,.85,.14),whiteDoor=surface('white-door',0xf4eddb,.92,.11),rug=surface('rug',0xcbbcaf,1,.26);
 const plain=(c,r=.9)=>new T.MeshStandardMaterial({color:c,roughness:r});
 const chalk=plain(0xdbd7c5),ivory=plain(0xe1dfd2,.82),steel=plain(0x777b75,.61),silver=new T.MeshStandardMaterial({map:shared.duct95.map,normalMap:shared.duct95.normalMap,normalScale:new T.Vector2(.17,.17)}),black=plain(0x151713),dark=plain(0x39352b),wood=shared.fWalnut,brass=shared.fBrass;
 ivory.map=shared.coolerWhite95.map;ivory.normalMap=shared.enamel.normalMap;ivory.normalScale=new T.Vector2(.05,.05);
 steel.metalness=.32;silver.color.set(0xd0d2cc);silver.metalness=.08;silver.roughness=.44;silver.emissive.set(0x999d9b);silver.emissiveIntensity=.12;
 plaster.emissive=new T.Color(0x99906e);plaster.emissiveIntensity=.10;plaster.color.setRGB(1.28,1.23,1.08);joist.color.setRGB(1.55,1.35,1.10);brownDoor.color.setRGB(1.95,1.72,1.47);
 const carpet=shared.carpet;
 function grade(m,code,id){m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',code+'diffuseColor *= sampledDiffuseColor;'));};m.customProgramCacheKey=()=>id;}

 grade(silver,'sampledDiffuseColor.rgb=mix(vec3(.73,.76,.75),sampledDiffuseColor.rgb,.14);','atrium-silver96');
 grade(pink,'sampledDiffuseColor.rgb=mix(vec3(.74,.46,.45),sampledDiffuseColor.rgb,.40);','atrium-pink96');
 plaster.userData.period96=1.8;joist.userData.period96=.90;pink.userData.period96=.65;poolTile.userData.period96=1.65;carpet.userData.period96=.45;
 const ceilingMat=shared.ceiling;pink.color.setRGB(1.65,1.65,1.65);
 const generated=(name,roughness,normal)=>new T.MeshStandardMaterial({map:tex(name+'.webp',true,97),normalMap:tex(name+'-normal.webp',false,97),roughnessMap:tex(name+'-roughness.webp',false,97),roughness,normalScale:new T.Vector2(normal,normal)});
 const porous=generated('fiberglass-porous',.18,.78),gingham=generated('red-gingham',.43,.14),ticking=generated('mattress-ticking',.98,.36),cutWood=generated('wood-cut',.95,.31);
 const recessBlack=new T.MeshBasicMaterial({color:0x070806});cutWood.userData.period96=.42;
 const emit=new T.MeshBasicMaterial({color:0xfffef5,toneMapped:false}),warm=new T.MeshBasicMaterial({color:0xffdb96,toneMapped:false});
 shared.windowIvory96=ivory;shared.windowBlack96=new T.MeshBasicMaterial({color:0x020302});shared.windowGlass96=plain(0x060b0b,.20);shared.windowGlass96.metalness=.18;
 const windows=createWindows96(T);
 function depthMaterial(m){if(materials.has(m.uuid))return materials.get(m.uuid);const a=m.clone(),before=m.onBeforeCompile,program=m.customProgramCacheKey?.();a.vertexColors=true;
  a.onBeforeCompile=s=>{before.call(m,s,renderer);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float atriumY96;');s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\natriumY96=(modelMatrix*vec4(transformed,1.)).y;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float atriumY96;');s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight*=exp(-max(0.,-atriumY96-3.)*.064);\n#include <opaque_fragment>');};
  a.customProgramCacheKey=()=>`atrium96-${m.uuid}-${program}`;materials.set(m.uuid,a);return a;
 }
 function put(m,g,x=0,y=0,z=0,rx=0,ry=0,rz=0,cast=true,shade=1,matrix=null){
  if(matrix)g.applyMatrix4(matrix);else{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);}
  if(activeFrame)g.applyMatrix4(activeFrame);
  if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}
  const p=g.attributes.position,n=g.attributes.normal,colors=g.attributes.color,cs=[];
  for(let i=0;i<p.count;i++){const facing=n.getY(i),ambient=m===ceilingMat?1:facing<-.4?.65:facing>.5?1:.92,v=shade*ambient*cavityAO(p.getX(i),p.getY(i),p.getZ(i));cs.push((colors?.getX(i)??1)*v,(colors?.getY(i)??1)*v,(colors?.getZ(i)??1)*v);}
  g.setAttribute('color',new T.Float32BufferAttribute(cs,3));
  if(m.userData.period96){const uv=g.attributes.uv,k=m.userData.period96;for(let i=0;i<p.count;i++){if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/k,p.getZ(i)/k);else if(Math.abs(n.getX(i))>.5)uv.setXY(i,p.getZ(i)/k,p.getY(i)/k);else uv.setXY(i,p.getX(i)/k,p.getY(i)/k);}}
  const mat=depthMaterial(m),key=mat.uuid+cast;let pool=pools.get(key);if(!pool){pool={mat,cast,geos:[]};pools.set(key,pool);}pool.geos.push(g);
 }
 const shape=new T.Shape();shape.moveTo(-.497,-.497);shape.lineTo(.497,-.497);shape.lineTo(.497,.497);shape.lineTo(-.497,.497);shape.closePath();const unit=new T.ExtrudeGeometry(shape,{depth:.994,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,steps:1});unit.translate(0,0,-.497);
 function box(m,x,y,z,w,h,d,rx=0,ry=0,rz=0,cast=true,shade=1){const g=y<-24?new T.BoxGeometry(w,h,d):unit.clone().scale(w,h,d);put(m,g,x,y,z,rx,ry,rz,cast,shade);}
 function plane(m,x,y,z,w,h,rx=0,ry=0,shade=1){put(m,new T.PlaneGeometry(w,h),x,y,z,rx,ry,0,false,shade);}
 const vec=p=>new T.Vector3(...p);
 function tube(m,points,r=.012,segments=20,sides=7){put(m,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(vec)),segments,r,sides,false));}
 function addParts(parts,x,y,z,yaw=0,scale=[1,1,1],override=null,roll=0,pitch=0){if(!parts)return;const base=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,roll,'YXZ')),new T.Vector3(...scale));for(const p of parts){const m=override||shared[p.material]||dark;put(m,p.geometry.clone(),0,0,0,0,0,0,p.castShadow!==false,1,base.clone().multiply(p.matrix));}}
 function cavityAO(x,y,z){
  for(const l of ATRIUM_LEVELS97){if(l.n>6)break;const gap=l.n%2===0?.48:.80;if(y>l.y-.115||y<l.y-gap+.055)continue;
   for(const f of l.floors){if(f.poolDeck||f.poolBottom||x<f.x0||x>f.x1||z<f.z0||z>f.z1)continue;const inward=f.edge==='left'?f.x1-x:f.edge==='right'?x-f.x0:f.edge==='north'?f.z1-z:z-f.z0;return .47*Math.exp(-Math.max(0,inward)*1.65)+.09;}
  }return 1;
 }
 function wall(x,y,z,w,h,d,cut=false){
  if(!cut||y<-21){box(plaster,x,y+h/2,z,w,h,d);box(joist,x,y+.032,z,w+.014,.064,d+.014);return;}
  const ax=w>d,len=ax?w:d,th=ax?d:w;
  // Two plaster skins leave real empty stud bays. End grain, sill and header survive the section.
  for(const sign of[-1,1])box(plaster,x+(ax?0:sign*(th/2-.012)),y+h/2,z+(ax?sign*(th/2-.012):0),ax?len:.024,h,ax?.024:len);
  for(const yy of[y+.035,y+h-.035])box(cutWood,x,yy,z,ax?len:th-.049,.07,ax?th-.049:len);
  const count=Math.max(1,Math.floor(len/.54));for(let i=0;i<=count;i++){const a=-len/2+.04+i*(len-.08)/count;box(cutWood,x+(ax?a:0),y+h/2,z+(ax?0:a),ax?.055:th-.054,h-.14,ax?th-.054:.055);}
  // Recessed dark inner face visible only at the cut ends, never a sealed plaster cap.
  for(const sign of[-1,1]){const a=sign*(len/2-.105);box(recessBlack,x+(ax?a:0),y+h/2,z+(ax?0:a),ax?.014:th-.065,h-.19,ax?th-.065:.014,0,0,0,false);}
  box(joist,x,y+.032,z,w+.010,.064,d+.010);
 }
 function flatBatt(x,y,z,w=.88,d=.47,tilt=0,vertical=false,roll=0){detailStats97.flatInsulation++;
  const geo=new T.BoxGeometry(w,.13,d,12,2,7),p=geo.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),edge=Math.max(Math.abs(a)/(w/2),Math.abs(c)/(d/2));p.setXYZ(i,a+.014*Math.sin(c*61+a*31)*edge,b+.012*Math.sin(a*30+c*36)-.017*edge*edge,c+.012*Math.sin(a*47+c*29)*edge);}geo.computeVertexNormals();
  put(porous,geo,x,y,z,vertical?Math.PI/2:tilt,vertical?Math.PI/2:0,vertical?.10:roll,false);
  if(!vertical)for(let i=0;i<9;i++){const a=(i/8-.5)*w; tube(porous,[[x+a,y-.01,z+d*.47],[x+a+.012,y-.055,z+d*.51],[x+a+.025,y-.072,z+d*.48]],.0025,3,3);}
 }
 function iBeam(x,y,z,len,alongX=true){const w=.11,h=.29,t=.014;if(alongX){box(steel,x,y-h/2,z,len,t,w);box(steel,x,y+h/2,z,len,t,w);box(steel,x,y,z,len,h,.013);}else{box(steel,x,y-h/2,z,w,t,len);box(steel,x,y+h/2,z,w,t,len);box(steel,x,y,z,.013,h,len);}}
 function duct(points,r=.18){tube(silver,points,r,36,12);const curve=new T.CatmullRomCurve3(points.map(vec));for(let i=0;i<=23;i++){const t=i/23,p=curve.getPoint(t),tangent=curve.getTangent(t),g=new T.TorusGeometry(r+.009,.010,4,12);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),tangent));put(silver,g,p.x,p.y,p.z);}}
 function batt(x,y,z,pinkish=false,variant=1,scale=[1,1,1],yaw=0,grounded=false){if(grounded){let low=Infinity;for(const p of ceiling['batt'+variant]){p.geometry.computeBoundingBox();low=Math.min(low,p.geometry.boundingBox.min.y*scale[1]);}y-=low;}addParts(ceiling['batt'+variant],x,y,z,yaw,scale,pinkish?pink:shared.insulation95);}
 function door(x,y,z,yaw,{white=false,open=0,pet=false,width=.94}={}){
  const frame=new T.Matrix4().makeRotationY(yaw);frame.setPosition(x,y,z);
  const local=(m,g,xx,yy,zz,angle=0)=>{const mat=new T.Matrix4().makeTranslation(xx,yy,zz).multiply(new T.Matrix4().makeRotationY(angle));put(m,g,0,0,0,0,0,0,true,1,frame.clone().multiply(mat));};
  for(const sign of[-1,1])local(white?ivory:joist,new T.BoxGeometry(.063,2.16,.095),sign*(width/2+.032),1.08,0);
  local(white?ivory:joist,new T.BoxGeometry(width+.13,.068,.095),0,2.17,0);
  const pivot=new T.Matrix4().makeTranslation(-width/2,0,0).multiply(new T.Matrix4().makeRotationY(open)).multiply(new T.Matrix4().makeTranslation(width/2,0,0)),world=frame.clone().multiply(pivot);
  const leaf=(m,g,xx,yy,zz)=>{g.translate(xx,yy,zz);put(m,g,0,0,0,0,0,0,true,1,world);};
  leaf(white?ivory:joist,new T.BoxGeometry(width-.018,2.12,.045),0,1.06,0);
  for(const sign of[-1,1]){const g=new T.PlaneGeometry(width-.036,2.09);if(sign<0)g.rotateY(Math.PI);leaf(white?whiteDoor:brownDoor,g,0,1.066,sign*.025);
   // Frame rails and inset panel borders give the generated wood image actual relief.
   for(const yy of[.56,1.42,1.88])for(const xx of[-width*.24,width*.24]){
    const ww=width*.37,hh=yy===1.42?.50:.34;
    for(const edge of[-1,1])leaf(white?ivory:joist,new T.BoxGeometry(.012,hh,.012),xx+edge*ww/2,yy,sign*.029);
    for(const edge of[-1,1])leaf(white?ivory:joist,new T.BoxGeometry(ww,.012,.012),xx,yy+edge*hh/2,sign*.029);
   }
  }
  leaf(brass,new T.CylinderGeometry(.025,.025,.008,12).rotateX(Math.PI/2),width/2-.085,1.01,.030);
  leaf(brass,new T.SphereGeometry(.021,10,7),width/2-.085,1.01,.067);
  leaf(brass,new T.BoxGeometry(.092,.012,.023),width/2-.116,1.01,.072);
  if(pet){leaf(ivory,new T.BoxGeometry(.42,.38,.032),0,.386,.039);leaf(dark,new T.BoxGeometry(.35,.30,.006),0,.386,.058);for(let i=0;i<10;i++)leaf(ivory,new T.BoxGeometry(.36,.013,.021),0,.251+i*.030,.064);}
 }
 function floorSlab(x0,x1,z0,z1,y,n,edge,omitPool=false){
  if(omitPool)return;
  const w=x1-x0,d=z1-z0,x=(x0+x1)/2,z=(z0+z1)/2,gap=n%2===0?.48:.80;
  box(carpet,x,y-.04,z,w,.08,d);
  // The bottom sheet is separate. All four cut faces remain physically open.
  const recess=n<7?.75:.25,ax=edge==='left'||edge==='right',ox=edge==='left'?-recess/2:edge==='right'?recess/2:0,oz=edge==='north'?-recess/2:edge==='south'?recess/2:0;
  box(ceilingMat,x+ox,y-gap+.025,z+oz,Math.max(.04,w-(ax?recess:0)),.034,Math.max(.04,d-(ax?0:recess)),0,0,0,false,.78);
  if(n<7){
   const bx0=x0+(edge==='right'?recess:0),bx1=x1-(edge==='left'?recess:0),bz0=z0+(edge==='south'?recess:0),bz1=z1-(edge==='north'?recess:0);
   for(let xx=Math.ceil(bx0/1.2)*1.2;xx<bx1-.012;xx+=1.2)box(shared.grid,xx,y-gap+.002,(bz0+bz1)/2,.017,.009,bz1-bz0,0,0,0,false);
   for(let zz=Math.ceil(bz0/.6)*.6;zz<bz1-.012;zz+=.6)box(shared.grid,(bx0+bx1)/2,y-gap+.002,zz,bx1-bx0,.009,.017,0,0,0,false);
  }
  const alongX=edge==='left'||edge==='right',count=n<8?Math.max(2,Math.floor((alongX?d:w)/1.36)):2;
  for(let j=0;j<count;j++){const u=(j+.45)/count;if(alongX)iBeam(x,y-.25,z0+d*u,w-.05);else iBeam(x0+w*u,y-.25,z,d-.05,false);}
  const nWood=n<8?Math.max(2,Math.floor((alongX?w:d)/.53)):0;
  for(let j=0;j<=nWood;j++){const u=(j+.2)/(nWood+1);if(alongX)box(joist,x0+w*u,y-.13,z,.055,.13,d-.025);else box(joist,x,y-.13,z0+d*u,w-.025,.13,.055);}
  // Exposed timber rim is only 8cm deep, never a filled fascia hiding the services.
  if(alongX)box(joist,edge==='left'?x1-.035:x0+.035,y-.087,z,.065,.082,d);
  else box(joist,x,y-.087,edge==='north'?z1-.035:z0+.035,w,.082,.065);
  if(n<7){
   const xx=alongX?(edge==='left'?x1-.35:x0+.35):x,zz=alongX?z:(edge==='north'?z1-.35:z0+.35);
   // Flat perforated batts sit INSIDE the opening. A few ends slip over the cut edge.
   const count=Math.max(1,Math.floor((alongX?d:w)/1.05));
   for(let k=0;k<count;k++){const u=(k+.46)/count,px=alongX?xx+(edge==='left'?-.15:.15):x0+w*u,pz=alongX?z0+d*u:zz+(edge==='north'?-.15:.15);flatBatt(px,y-.19,pz,alongX?.72:.84,alongX?.83:.58,(n+k)%5===0?.20:0);}
   if(n<4&&(Math.round(x+z)+n)%3===0)flatBatt(alongX?(edge==='left'?x1-.18:x0+.18):x,y-.27,alongX?z:(edge==='north'?z1-.12:z0+.12),.88,.67,alongX?0:.28,false,alongX?(edge==='left'?-.25:.25):0);
   const back=1.10;
   if(alongX)box(recessBlack,edge==='left'?x1-back:x0+back,y-gap*.55,z,.025,gap-.16,d-.04,0,0,0,false);
   else box(recessBlack,x,y-gap*.55,edge==='north'?z1-back:z0+back,w-.04,gap-.16,.025,0,0,0,false);
   if((n+Math.round(z*3+x))%3!==0)batt(xx,y-.16,zz,(n+Math.round(x))%4===0,n%3,[alongX?1.22:1.6,.48,.9],alongX?Math.PI/2:0);
   if((n+Math.round(x*7+z))%3===0)tube(black,[[xx-.13,y-.18,zz],[xx+.12,y-.43,zz+.03],[xx+.22,y-.85,zz+.09],[xx+.09,y-1.1,zz+.10]],.009,14);
   if(n<5&&(Math.round(x+z)+n)%4===0)tube(black,[[xx,y-.19,zz-.25],[xx-.14,y-.63,zz-.09],[xx+.10,y-.91,zz+.24],[xx+.19,y-.51,zz+.36],[xx+.22,y-.19,zz+.42]],.009,23);
  }
 }
 function subtract(r,c){if(r.x1<=c.x0||r.x0>=c.x1||r.z1<=c.z0||r.z0>=c.z1)return[r];return[{...r,x1:Math.max(r.x0,c.x0)},{...r,x0:Math.min(r.x1,c.x1)},{x0:Math.max(r.x0,c.x0),x1:Math.min(r.x1,c.x1),z0:r.z0,z1:Math.max(r.z0,c.z0)},{x0:Math.max(r.x0,c.x0),x1:Math.min(r.x1,c.x1),z0:Math.min(r.z1,c.z1),z1:r.z1}].filter(q=>q.x1-q.x0>.003&&q.z1-q.z0>.003);}
 // Top perimeter matches the original walking plane exactly. The aperture is a real hole.
 for(const f of ATRIUM_LEVELS97[0].floors)floorSlab(f.x0,f.x1,f.z0,f.z1,0,0,f.edge);
 for(const w of ATRIUM_LEVELS97[0].walls)wall(w.x,w.y,w.z,w.w,w.h,w.d,w.cut);
 box(plaster,-6.96,2.45,4.86,.20,.54,.94);door(-6.845,0,4.86,Math.PI/2,{pet:true});
 addParts(props.f94LadderChair,6.74,0,-3.2,Math.PI/2,[.86,.95,.86]);
 addParts(windows.wall,-6.845,1.43,-6.5,Math.PI/2);
 // Gridded acoustic ceiling with square white fluorescent panels.
 for(let z=-14.1;z<14.4;z+=.6)for(let x=-11.1;x<11.4;x+=.6){
  const lamp=(Math.round((x+11.1)/.6)%6===2&&Math.round((z+14.1)/.6)%6===2);
  box(lamp?emit:ceilingMat,x,2.753,z,.591,.062,.591,0,0,0,false,lamp?1:.94);
  if(lamp){box(shared.grid,x,2.717,z,.595,.016,.595,0,0,0,false);plane(emit,x,2.705,z,.536,.536,Math.PI/2);}
 }
 for(let n=1;n<A.tiers;n++){
  const plan=ATRIUM_LEVELS97[n],y=plan.y,rich=n<=6,h=2.72;
  for(const f of plan.floors)if(!f.poolDeck&&!f.poolBottom)floorSlab(f.x0,f.x1,f.z0,f.z1,y,n,f.edge);
  for(const w of plan.walls)wall(w.x,w.y,w.z,w.w,w.h,w.d,w.cut);
  for(const l of plan.lamps)box(emit,l.x,l.y,l.z,.58,.015,.58,0,0,0,false,.68);
  for(const r of plan.rooms)if(r.pool)emptyPool(r.x0,r.x1,r.z0,r.z1,y);
  if(!rich)continue;
  if(n<=3){
   // Long attached cables reach the next floor, coil there, and share the debris vignette.
   for(const side of[-1,1])for(let k=0;k<2;k++){const x=side*(6.25+k*.42),z=-6.7+k*8.2+n*.3;
    tube(black,[[x,y+2.96,z],[x+.05*side,y+2.4,z+.05],[x-.13,y+1.4,z+.13],[x-.09,y+.20,z+.16],[x+side*.30,y+.018,z+.36],[x+side*.59,y+.018,z+.23],[x+side*.45,y+.018,z-.02]],.011,34);
    if(k===0)tube(black,[[x-.15,y+2.91,z],[x-.37,y+1.55,z-.04],[x-.54,y+1.34,z],[x-.64,y+1.91,z+.16],[x-.68,y+2.91,z+.2]],.009,26);
    box(ceilingMat,x+side*.48,y+.019,z+.53,.60,.038,.60,0,.18+n*.1);box(chalk,x+side*.7,y+.046,z+.43,.49,.022,.57,0,-.27);
   }
   // Silver supply runs are set against shadowed cavities, with visible joints and hangers.
   for(const side of[-1,1]){const z=-2+n*.37,x=side*6.1;duct([[x+side*.78,y+2.91,z-1.6],[x+side*.41,y+2.91,z-.8],[x,y+2.84,z],[x+.07*side,y+2.87,z+1.0]],.105);}
  }
  for(const p of FURNISHINGS97.filter(p=>p.n===n)){
   if(p.kind==='diningSection')diningSection(p.x,y,p.z,p.yaw);
   else if(p.kind==='bareMattress')mattress(p.x,y,p.z,p.yaw);
   else if(p.kind==='cutBed')cutBed(p.x,y,p.z,p.yaw);
   else addParts(props[p.kind],p.x,y,p.z,p.yaw,p.scale||[1,1,1]);
  }
  if(n===1){
   door(CROSS_DOOR97.x,y,CROSS_DOOR97.z,0,{width:CROSS_DOOR97.width});
   studBay(5.94,y,2.38,1.05,2.72,0,true);
   serviceChase(-8.42,y,-2);
   studBay(-6.3,y,-6.0,1.55,2.72,0,true);
   // Protruding sitting room: patterned rug, table, warm shade, wooden chair, open white door.
   plane(rug,-.14,y+.015,-9.82,3.16,2.96,-Math.PI/2);
   addParts(props.spindleTable,-.70,y,-9.71,.12,[.95,1,1]);addParts(props.lamp,-.70,y+.65,-9.71,.12,[.78,.78,.78]);
   addParts(props.f94LadderChair,.80,y,-9.60,-.30,[.94,.95,.94]);

   door(-2.025,y,-9.60,Math.PI/2,{white:true,open:-1.06,width:1.0});
   box(ivory,-2.65,y+.92,-10.42,.86,1.84,.045,.0,.1,-.08);
   // Visible warm sconce deep inside the right room.
   box(brass,11.175,y+1.68,-4.70,.055,.23,.13);box(warm,11.05,y+1.78,-4.70,.18,.27,.25,0,0,0,false);
   point(.0,y+1.21,-9.75,0xffcb83,8.5,5.0);point(10.72,y+1.77,-4.70,0xffc986,5.5,4.5);
   // Broad U-shaped flexible HVAC crossing exposed wood framing on upper left.
   duct([[-10.2,y+2.82,-5.8],[-9.5,y+1.85,-5.8],[-8.9,y+1.44,-5.8],[-8.0,y+1.70,-5.8],[-7.6,y+2.81,-5.8]],.30);
   for(let k=0;k<6;k++)box(joist,-10.2+k*.43,y+1.26,-5.98,.055,2.48,.085);
   roundStool(-9.9,y,-4.80);
   box(joist,-9.13,y+.09,-5.98,2.32,.10,.085);box(joist,-9.13,y+2.62,-5.98,2.32,.10,.085);
  }
  if(n===2){
   door(.70,y,14.185,Math.PI,{white:true});
   batt(-7.3,y,2.38,true,2,[1.50,.26,1.5],.32,true);
   box(chalk,-6.77,y+.023,3.20,.71,.044,.71,0,.17);box(chalk,-7.04,y+.059,3.01,.62,.032,.65,0,-.18);
   batt(-5.86,y+2.90,2.2,true,1,[2.0,1.0,1.2],Math.PI/2);
   duct([[7.55,y+3.08,-1.9],[6.03,y+3.08,-1.9],[5.75,y+2.94,-1.65]],.26);
   for(let k=0;k<5;k++){const a=k*.35;const pts=[];for(let i=0;i<=32;i++){const t=i/32*Math.PI*2;pts.push([-7.5+Math.cos(t)*(.18+a*.03),y+.025+k*.005,4.85+Math.sin(t)*(.18+a*.03)]);}tube(black,pts,.006,32,5);}
  }
  if(n===3){
   door(-8.55,y,-14.185,0,{pet:false});
   door(-11.185,y,3.50,Math.PI/2,{pet:false});
   batt(-6.48,y+2.68,3.8,false,1,[1.7,1.8,1.1],Math.PI/2);
   printer(7.22,y,-.54,-Math.PI/2);
   addParts(props.f95FiveDrawer,-7.75,y,-7.50,Math.PI/2,[1,1,1]);
  }
  if(n===4){bed(-8.33,y,3.5,Math.PI/2);kitchen(0.2,y,-13.55);}
  if(n===5){addParts(props.f95FiveDrawer,7.80,y,-6.9,-Math.PI/2,[1.0,1.0,1.0]);addParts(props.f95GlassCabinet,-8.94,y,-2.9,Math.PI/2,[1,1,1]);addParts(props.f94LadderChair,7.7,y,5.5,Math.PI/2,[1,1.5,1]);}
  if(n===6){addParts(props.sofa,-7.9,y,-5.2,Math.PI/2);addParts(props.f95FiveDrawer,2.6,y,-12.9,0,[.74,1.17,1]);}
 }
 // Dark structural post and long loose cable remain visibly attached at the upper section.
 box(steel,-5.55,-5.16,-5.92,.12,9.52,.12);tube(black,[[-5.43,-.24,-5.9],[-5.24,-2.1,-5.7],[-5.38,-4.8,-5.62],[-5.11,-6.8,-5.5],[-5.5,-7.31,-5.52]],.013,42);
 // No detailed objects below tier six: only darkening architecture and a remote lightless terminus.
 plane(new T.MeshBasicMaterial({color:0x020302}),0,-82,0,22.8,28.8,-Math.PI/2);
 function assembly(x,y,z,yaw,fn){const prior=activeFrame;activeFrame=new T.Matrix4().makeRotationY(yaw);activeFrame.setPosition(x,y,z);if(prior)activeFrame.premultiply(prior);fn();activeFrame=prior;}
 function studBay(x,y,z,w=1.1,h=2.72,yaw=0,insulated=true){detailStats97.studBays++;if(insulated)detailStats97.verticalInsulation++;assembly(x,y,z,yaw,()=>{
  for(const xx of[-w/2,0,w/2])box(cutWood,xx,h/2,0,.056,h,.14);
  for(const yy of[.05,h-.05])box(cutWood,0,yy,0,w+.055,.10,.14);
  if(insulated){const g=new T.BoxGeometry(w*.42,h*.77,.115,7,14,2),p=g.attributes.position;for(let i=0;i<p.count;i++){let a=p.getX(i),b=p.getY(i),c=p.getZ(i);const edge=Math.pow(Math.abs(a)/(w*.21),5),notch=.065*(Math.exp(-(((b+.30)/.10)**2))+.9*Math.exp(-(((b-.49)/.075)**2)));p.setXYZ(i,a+.025*Math.sin(b*35+a*20)-Math.sign(a)*notch*edge,b+.018*Math.sin(a*33)-(b< -h*.30?.07+.055*Math.sin(a*38):0),c+.022*Math.sin(b*11+a*24));}g.computeVertexNormals();put(porous,g,w*.245,h*.49,.008,0,0,-.07,false);for(let i=0;i<7;i++){const xx=w*.11+i*w*.04;tube(porous,[[xx,.30,.01],[xx+.008,.20,.019],[xx+.02,.14+(i%3)*.02,.008]],.003,4,3);}}
  for(const xx of[-w/2,0,w/2])for(const yy of[.15,h-.15])box(steel,xx,yy,.073,.019,.031,.004,0,0,0,false);
 });}
 function serviceChase(x,y,z){assembly(x,y,z,0,()=>{
  studBay(0,0,0,1.24,2.72,0,false);
  box(recessBlack,0,1.36,-.115,1.15,2.58,.022,0,0,0,false);
  for(const [xx,r]of[[-.33,.047],[.27,.066]]){
   tube(xx<0?steel:silver,[[xx,.08,0],[xx,1.02,0],[xx,2.58,0]],r,12,9);
   for(const yy of[.31,1.23,2.31]){box(steel,xx,yy,-.007,.18,.046,.16,0,0,0,false);put(silver,new T.TorusGeometry(r+.014,.012,5,10),xx,yy,.0,Math.PI/2);}
  }
  for(const yy of[.71,1.83])tube(silver,[[-.33,yy,0],[-.06,yy,0],[.22,yy+.13,0],[.27,yy+.21,0]],.027,15,7);
  tube(black,[[.49,2.69,.02],[.48,1.5,.05],[.46,.35,.035],[.30,.07,.09]],.01,20);
 });}
 function diningSection(x,y,z,yaw){assembly(x,y,z,yaw,()=>{
  // The retained half-table ends at z=-.34. Section exposes board core, apron and sawn legs.
  box(wood,0,.734,.005,1.85,.07,.68);box(cutWood,0,.734,-.340,1.846,.063,.009,0,0,0,true);
  box(gingham,0,.773,.019,1.88,.008,.65,0,0,0,false);
  // Flexible three-edge skirt; the cut edge remains a clean open section, not a fourth drape.
  const drape=(side)=>{const g=new T.PlaneGeometry(1.88,.27,24,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i);p.setZ(i,.011*Math.sin(u*21)*(1-(v+.135)/.27));}g.computeVertexNormals();put(gingham,g,0,.635,.355,0,side?Math.PI:0,0,false);};drape(0);
  for(const sign of[-1,1]){const g=new T.PlaneGeometry(.69,.22,12,5);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,.014*Math.sin(p.getX(i)*29));g.computeVertexNormals();put(gingham,g,sign*.939,.66,.016,0,sign*Math.PI/2,0,false);}
  for(const xx of[-.76,.76]){box(wood,xx,.34,.23,.068,.68,.068);box(wood,xx,.35,-.319,.068,.70,.031);box(cutWood,xx,.35,-.338,.064,.69,.009);}
  box(wood,0,.64,.233,1.56,.14,.04);for(const xx of[-.76,.76])box(cutWood,xx,.641,-.053,.04,.14,.61);
  // Empty glazed plate with genuine shallow bowl and raised rim.
  const profile=[[0,0],[.07,0],[.12,.006],[.151,.021],[.155,.027],[.14,.032],[.118,.020],[.066,.011],[0,.011]].map(p=>new T.Vector2(...p));
  put(ivory,new T.LatheGeometry(profile,28),-.16,.781,.075);
  put(shared.windowGlass96,new T.CylinderGeometry(.035,.047,.22,12),.57,.887,.10);
  tube(wood,[[.57,.84,.1],[.55,1.13,.1],[.50,1.27,.08]],.003,8,4);tube(wood,[[.57,.85,.1],[.59,1.16,.10],[.64,1.26,.15]],.003,8,4);
  for(const [xx,yy,zz]of[[.50,1.27,.08],[.64,1.26,.15]])for(let k=0;k<5;k++){const a=k*1.257;put(joist,new T.SphereGeometry(.024,5,3).scale(1,.32,.64),xx+Math.cos(a)*.022,yy,zz+Math.sin(a)*.022,0,a,0,false);}
 });}
 function mattress(x,y,z,yaw){assembly(x,y,z,yaw,()=>{
  // Support surface remains horizontal on carpet; torn shell reveals actual helical springs.
  const shell=new T.BoxGeometry(1.55,.235,1.57,18,5,20),sp=shell.attributes.position;
  for(let i=0;i<sp.count;i++){
   const v=new T.Vector3(sp.getX(i),sp.getY(i),sp.getZ(i)),c=new T.Vector3(T.MathUtils.clamp(v.x,-.73,.73),T.MathUtils.clamp(v.y,-.073,.073),T.MathUtils.clamp(v.z,-.740,.740)),delta=v.clone().sub(c);if(delta.lengthSq()>0)v.copy(c).add(delta.normalize().multiplyScalar(.0445));
   if(v.y>.07)v.y-=.023*Math.max(0,1-(v.x/.775)**2)*Math.max(0,1-(v.z/.785)**2);v.x+=.008*Math.sin(v.z*17)*Math.abs(v.x)/.775;sp.setXYZ(i,v.x,v.y,v.z);
  }shell.computeVertexNormals();put(ticking,shell,0,.118,.23);
  box(porous,0,.047,-.735,1.49,.038,.46,0,0,0,false,.76);
  box(ticking,-.735,.125,-.77,.08,.24,.48);box(ticking,.735,.125,-.77,.08,.24,.48);
  box(ticking,0,.028,-.73,1.55,.048,.49);
  for(const xx of[-.74,.74])tube(ticking,[[xx,.245,-.47],[xx,.253,.2],[xx,.242,1.0]],.013,12,6);
  tube(ticking,[[-.74,.24,1.0],[0,.246,1.025],[.74,.24,1.0]],.013,16,6);
  for(let i=0;i<6;i++){const xx=-.60+i*.24,pts=[];for(let j=0;j<=72;j++){const a=j/72*Math.PI*10;pts.push([xx+Math.cos(a)*.073,.050+j/72*.20,-.755+Math.sin(a)*.073]);}tube(steel,pts,.007,72,5);}
  // The loose torn ticking flap bends back, instead of hiding the spring cavity with an intact lid.
  const g=new T.PlaneGeometry(1.36,.29,18,6),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i);p.setXYZ(i,a,.025*Math.sin(a*9)+.09*Math.sin((b+.145)*8),b);}g.computeVertexNormals();put(ticking,g,0,.243,-.44,0,0,.03,true);
 });}
 function cutBed(x,y,z,yaw){assembly(x,y,z,yaw,()=>{
  // A half bed in section, with empty spring base extending past its severed mattress.
  box(wood,0,.20,.19,1.82,.23,1.70);box(cutWood,0,.20,-.663,1.82,.23,.012);
  box(ticking,0,.424,.54,1.75,.23,.99);box(porous,0,.417,.036,1.70,.19,.015);
  for(const xx of[-.87,.87])for(const zz of[-.58,.95])box(wood,xx,.10,zz,.07,.20,.07);
  box(wood,0,.74,1.09,1.91,.55,.07);
  for(let i=0;i<8;i++){const xx=-.76+i*.217,pts=[];for(let k=0;k<=45;k++){const a=k/45*Math.PI*8;pts.push([xx+.064*Math.cos(a),.315+k/45*.18,-.31+.064*Math.sin(a)]);}tube(steel,pts,.006,45,5);}
 });}
 function point(x,y,z,color,intensity,distance){const light=new T.PointLight(color,intensity,distance,2);light.position.set(x,y,z);light.castShadow=false;root.add(light);lights.push(light);}
 function roundStool(x,y,z){put(wood,new T.CylinderGeometry(.235,.225,.044,16),x,y+.61,z);for(let j=0;j<3;j++){const a=j*Math.PI*2/3,xx=Math.cos(a),zz=Math.sin(a);tube(wood,[[x+xx*.21,y+.015,z+zz*.21],[x+xx*.16,y+.31,z+zz*.16],[x+xx*.18,y+.59,z+zz*.18]],.019,7);}const pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;pts.push([x+Math.cos(a)*.172,y+.22,z+Math.sin(a)*.172]);}tube(wood,pts,.012,24);}
 function printer(x,y,z,yaw){const parts=[];const B=(m,a,b,c,w,h,d)=>{const geo=unit.clone();geo.scale(w,h,d);geo.translate(a,b,c);parts.push({m,geo});};
  B(ivory,0,.35,0,.63,.70,.57);B(black,0,.50,.292,.42,.22,.025);B(chalk,0,.735,0,.63,.035,.59);B(dark,0,.64,-.14,.44,.06,.24);B(ivory,0,.68,-.2,.47,.016,.27);B(black,0,.21,.292,.43,.043,.022);B(ivory,0,.189,.36,.45,.023,.20);
  for(const a of[-.23,.23])for(const c of[-.21,.21])B(black,a,.025,c,.054,.05,.05);
  B(shared.greenLed95,.213,.586,.31,.019,.011,.006);const m=new T.Matrix4().makeRotationY(yaw);m.setPosition(x,y,z);for(const p of parts)put(p.m,p.geo,0,0,0,0,0,0,true,1,m);}
 function bed(x,y,z,yaw){const mat=new T.Matrix4().makeRotationY(yaw);mat.setPosition(x,y,z);const B=(m,xx,yy,zz,w,h,d)=>{const g=unit.clone();g.scale(w,h,d);g.translate(xx,yy,zz);put(m,g,0,0,0,0,0,0,true,1,mat);};
  B(wood,0,.26,0,1.84,.27,2.18);B(shared.fLinen,0,.50,0,1.77,.24,2.08);B(shared.fLinen,0,.646,.27,1.79,.05,1.57);
  for(const xx of[-.47,.47])B(ivory,xx,.694,-.72,.67,.17,.40);
  for(const zz of[-1.14,1.14]){B(wood,0,zz<0?.93:.62,zz,1.94,zz<0?.58:.38,.09);for(const xx of[-.96,.96]){const g=new T.LatheGeometry([[.035,0],[.065,.07],[.037,.24],[.055,.35],[.033,.63],[.057,.71],[.035,.92],[.07,1.1]].map(q=>new T.Vector2(...q)),8);g.translate(xx,0,zz);put(wood,g,0,0,0,0,0,0,true,1,mat);}}
 }
 function kitchen(x,y,z){for(let i=-1;i<=1;i++){const xx=x+i*.65;box(ivory,xx,y+.43,z,.63,.84,.61);box(wood,xx,y+.88,z,.65,.055,.64);box(joist,xx,y+.45,z+.314,.56,.63,.022);box(brass,xx+.20,y+.68,z+.342,.078,.012,.018);box(ivory,xx,y+1.91,z-.14,.62,.58,.30);box(joist,xx,y+1.91,z+.018,.55,.51,.018);box(brass,xx+.20,y+1.77,z+.036,.04,.011,.018);}
  // Real recessed sink: rim around an empty bowl, drain and dry faucet.
  box(silver,x,y+.875,z,.43,.025,.44);box(dark,x,y+.895,z,.34,.016,.34);for(const s of[-1,1]){box(silver,x+s*.18,y+.914,z,.025,.035,.38);box(silver,x,y+.914,z+s*.18,.37,.035,.023);}tube(silver,[[x+.16,y+.89,z-.2],[x+.16,y+1.15,z-.2],[x+.16,y+1.22,z-.07],[x+.16,y+1.13,z-.02]],.016,18);
  for(const xx of[x-.80,x-.53])for(const zz of[z-.14,z+.14])put(black,new T.TorusGeometry(.092,.012,5,16),xx,y+.919,zz,Math.PI/2);
 }
 function emptyPool(x0,x1,z0,z1,y){const x=(x0+x1)/2,z=(z0+z1)/2,w=Math.min(3.5,x1-x0-.55),d=3.30;
  const left=x-w/2,right=x+w/2,front=z+d/2,back=z-d/2;
  for(const [a,b,c,e]of[[x0,left,z0,z1],[right,x1,z0,z1],[left,right,z0,back],[left,right,front,z1]]){box(carpet,(a+b)/2,y-.04,(c+e)/2,b-a,.08,e-c);}
  box(poolTile,x,y-.78,z,w,.08,d);for(const xx of[left,right])box(poolTile,xx,y-.36,z,.11,.76,d+.10);for(const zz of[back,front])box(poolTile,x,y-.36,zz,w,.76,.11);
  for(const xx of[left,right])box(chalk,xx,y+.02,z,.18,.055,d+.22);for(const zz of[back,front])box(chalk,x,y+.02,zz,w+.12,.055,.18);
  put(steel,new T.CylinderGeometry(.071,.071,.005,12),x,y-.736,z);
 }
 for(const p of pools.values()){const geo=mergeGeometries(p.geos,false);p.geos.forEach(g=>g.dispose());const mesh=new T.Mesh(geo,p.mat);mesh.castShadow=p.cast;mesh.receiveShadow=true;root.add(mesh);}
 unit.dispose();root.visible=false;
 return{root,windows,ready:Promise.all(pending),materials:{plaster,joist,pink,poolTile,brownDoor,whiteDoor,rug},update(x,z){root.visible=inAtrium96(x,z,70);for(const l of lights)l.visible=inAtrium96(x,z,22);},stats:{...detailStats97,longCablesAdded:12,floorCableLoopsAdded:6,fallenPanelsAdded:24,tiers:A.tiers,detailedTiers:6,walkableTiers:A.tiers,upwardStairs:0,authoredAnomalies:FURNISHINGS97.length,slabs:ATRIUM_LEVELS97.reduce((s,p)=>s+p.floors.length,0),walls:ATRIUM_LEVELS97.reduce((s,p)=>s+p.walls.length,0)}};
}
