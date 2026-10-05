import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
// Closed false windows: a black-backed sash and a grille with the original wall behind it.
export function createWindows96(T){
 const result={};
 const sh=new T.Shape();sh.moveTo(-.497,-.497);sh.lineTo(.497,-.497);sh.lineTo(.497,.497);sh.lineTo(-.497,.497);sh.closePath();const unit=new T.ExtrudeGeometry(sh,{depth:.994,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1});unit.translate(0,0,-.497);
 for(const kind of ['black','wall']){
  const pools={};
  function put(m,g,x,y,z){g.translate(x,y,z);if(g.index)g=g.toNonIndexed();const c=new Float32Array(g.attributes.position.count*3).fill(1);g.setAttribute('color',new T.BufferAttribute(c,3));(pools[m]??=[]).push(g);}
  const b=(m,x,y,z,w,h,d)=>put(m,unit.clone().scale(w,h,d),x,y,z);
  const w=kind==='black'?1.07:1.20,h=kind==='black'?1.56:1.78;
  // Raised casing, inner stop, substantial sill and narrow sash rebates.
  for(const s of[-1,1]){b('windowIvory96',s*(w/2+.044),0,.070,.088,h+.19,.082);b('windowIvory96',s*(w/2-.018),0,.112,.038,h,.057);}
  b('windowIvory96',0,h/2+.05,.070,w+.16,.10,.082);
  b('windowIvory96',0,-h/2-.057,.095,w+.23,.075,.20);
  b('windowIvory96',0,-h/2-.105,.046,w+.14,.043,.075);
  if(kind==='black'){
   b('windowBlack96',0,0,.019,w-.018,h-.012,.018);
   b('windowGlass96',0,0,.039,w-.075,h-.07,.008);
   b('windowIvory96',0,0,.117,w,.062,.069);
   b('windowIvory96',0,h*.25,.099,.034,h*.47,.044);
   b('windowIvory96',0,-h*.25,.093,.034,h*.47,.044);
   for(const yy of[-h/2+.022,h/2-.022])b('windowIvory96',0,yy,.1,w,.036,.044);
   b('windowIvory96',0,h/2+.22,.066,.14,.15,.04);put('lamp',new T.SphereGeometry(.041,10,7),0,h/2+.215,.137);
   b('fBrass',.045,.055,.159,.035,.011,.021);b('fBrass',.058,.068,.16,.044,.008,.017);
  }else{
   // No opaque fill: wallpaper remains visibly continuous through every opening.
   for(const x of[-w/6,w/6])b('windowIvory96',x,0,.089,.023,h,.035);
   for(const y of[-h/4,0,h/4])b('windowIvory96',0,y,.089,w,.023,.035);
  }
  result[kind]=Object.entries(pools).map(([material,geos])=>{const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());return{material,geometry,matrix:new T.Matrix4(),castShadow:true};});
 }
 unit.dispose();return result;
}

export function windowPlan96(walls,hash){
 const out=[];
 for(const w of walls){
  if(w.h<2.6||w.y-w.h/2>.02||w.id.startsWith('kane')||w.id==='reference')continue;
  const length=Math.max(w.w,w.d),seed=Math.round(w.x*97+w.z*211),roll=hash(seed,Math.round(length*30),9691);
  if(length<3.1||roll>.006)continue;
  const vertical=w.d>w.w,sign=hash(seed,0,9692)>.5?1:-1,shift=(hash(seed,0,9693)-.5)*(length-2.4),kind=roll<.003?'black':'wall';
  out.push({kind,x:w.x+(vertical?sign*w.w/2:shift),z:w.z+(vertical?shift:sign*w.d/2),y:kind==='black'?1.58:1.48,rotation:vertical?sign*Math.PI/2:sign>0?0:Math.PI,w:1.48,h:kind==='black'?1.76:1.98});
 }
 return out;
}
