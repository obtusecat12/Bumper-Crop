import {ATRIUM_LEVELS97,atriumSupport97,atriumLanding97,atriumBlocked97,atriumHeadroom97,atriumTier97,atriumMap97} from './level0-atrium-plan97.js';
import {createAtrium96} from './level0-atrium96.js';
import {ATRIUM_RECT96,inAtrium96,atriumPit96,atriumBlocked96,topWalls96} from './level0-atrium-plan96.js';
import {createCeiling95} from './level0-ceiling95.js';
import {createFurniture95} from './level0-furniture95.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createFurniture94} from './level0-furniture94.js';
import {createLevel0Occlusion94} from './level0-lighting94.js';
import {createFurniture93} from './level0-furniture93.js';
import {createKaneProps} from './level0-k-props.js';
import {createManilaField96} from './manila-field96.js';
import {inManila,nearManila,manilaRegionsNear} from './manila-plan.js';
import {L0_CELL as S,L0_CHUNK as K,L0_HEIGHT as H,l0Hash,l0Type,l0TypeAt,L0_LANDMARKS,createL0Chunk,l0SolidAt,l0FloorBase} from './level0-layout.js?v=117';
import {createL0Materials} from './level0-materials.js?v=117';
import {createLevel0LightField} from './level0-lightfield.js?v=104';
import {createLevel0DetailAssets} from './level0-ceiling-details.js';
import {createLevel0Props} from './level0-props.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
export function createLevel0World(T,renderer){
 RectAreaLightUniformsLib.init();
 const scene=new T.Scene();scene.userData.noAtmosphere=true;scene.userData.antialiasSamples=4;scene.userData.springVolume=createLevel0Occlusion94();scene.background=new T.Color(0x686752);scene.fog=new T.FogExp2(0x99977f,.016);
 const group=new T.Group();group.name='Level 0 · 阈界';scene.add(group);
 const field=createLevel0LightField(T,7*K),{mats,uniforms,ready}=createL0Materials(T,renderer,field.uniforms),assets=createLevel0DetailAssets(T),props={...createLevel0Props(T),...createKaneProps(T),...createFurniture93(T),...createFurniture94(T)},box=new T.BoxGeometry(1,1,1),plane=new T.PlaneGeometry(1,1),floorPlane=plane.clone().rotateX(-Math.PI/2),tmp=new T.Object3D();
 const ceiling95=createCeiling95(T);Object.assign(props,createFurniture95(T,props));
 const manila=createManilaField96(T,renderer,scene);
 const atrium=createAtrium96(T,renderer,scene,mats,props,ceiling95);
 const hemi=new T.HemisphereLight(0xfffbef,0xbcb9a4,2.1);scene.add(hemi);
 const key=new T.DirectionalLight(0xfff9e4,.48);key.position.set(1,9,1);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-25;key.shadow.camera.right=25;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;key.shadow.camera.near=.5;key.shadow.camera.far=22;key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.radius=4;key.shadow.autoUpdate=false;scene.add(key,key.target);
 const areas=Array.from({length:4},()=>{const light=new T.RectAreaLight(0xfff9e3,0,1.09,.46);light.rotation.x=-Math.PI/2;light.position.set(0,H-.085,0);scene.add(light);return light;});let keyCell='';
 // V103: the light set never changes size (no program recompiles); slots fade by rank-continuous weights.
 const slots=areas.map(()=>({id:-1,x:0,y:H-.085,z:0,free:true})),pick={id:new Float64Array(96),x:new Float32Array(96),y:new Float32Array(96),z:new Float32Array(96),d:new Float32Array(96)},shadowQueue=[];let env={dark:0,man:0,atri:0,red:0,init:false},typeCache={x:1e9,z:1e9,type:'classic'};const fades=new Map();
 const shadows=Array.from({length:2},()=>{const a=new T.SpotLight(0xfff6dc,5.5,12,1.18,.85,2);a.castShadow=true;a.shadow.mapSize.set(1024,1024);a.shadow.camera.near=.10;a.shadow.camera.far=12;a.shadow.normalBias=.014;a.shadow.bias=-.0002;a.shadow.radius=4;a.shadow.autoUpdate=false;a.intensity=0;scene.add(a,a.target);return a;});
 const bs=new T.Shape();bs.moveTo(-.497,-.497);bs.lineTo(.497,-.497);bs.lineTo(.497,.497);bs.lineTo(-.497,.497);bs.closePath();const wallBox=new T.ExtrudeGeometry(bs,{depth:.994,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1});wallBox.translate(0,0,-.497);const whiteColors=g=>{const a=new Float32Array(g.attributes.position.count*3);a.fill(1);g.setAttribute('color',new T.BufferAttribute(a,3));return g;};whiteColors(wallBox);
 const depression=new T.PlaneGeometry(S,S,12,12).rotateX(-Math.PI/2);const dp=depression.attributes.position;for(let i=0;i<dp.count;i++){const r=Math.hypot(dp.getX(i),dp.getZ(i))/(S*.48);dp.setY(i,-.16*Math.pow(Math.max(0,1-r*r),2));}depression.computeVertexNormals();
 // V104 troffer geometry (origin = ceiling plane): flange ring, sloped reflector well, recessed diffuser, halo plane.
 const troffer=(()=>{const parts=[];const ring=[[0,.2715,1.196,.053],[0,-.2715,1.196,.053],[.5715,0,.053,.49],[-.5715,0,.053,.49]];for(const[x,z,w,d]of ring){const g=new T.BoxGeometry(w,.012,d);g.translate(x,-.006,z);parts.push(g.toNonIndexed());}
  const frame=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const q=[],ox=.545,oz=.245,ix=.530,iz=.230,y0=-.012,y1=.040,push=(...v)=>q.push(...v);
  // four sloped quads, wound to face into the well (downward-inward)
  push(-ox,y0,-oz, ox,y0,-oz, ix,y1,-iz, -ox,y0,-oz, ix,y1,-iz, -ix,y1,-iz);
  push(ox,y0,oz, -ox,y0,oz, -ix,y1,iz, ox,y0,oz, -ix,y1,iz, ix,y1,iz);
  push(-ox,y0,oz, -ox,y0,-oz, -ix,y1,-iz, -ox,y0,oz, -ix,y1,-iz, -ix,y1,iz);
  push(ox,y0,-oz, ox,y0,oz, ix,y1,iz, ox,y0,-oz, ix,y1,iz, ix,y1,-iz);
  const well=new T.BufferGeometry();well.setAttribute('position',new T.Float32BufferAttribute(q,3));well.computeVertexNormals();well.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(q.length/3*2),2));
  const diffuser=new T.PlaneGeometry(1.06,.46).rotateX(Math.PI/2).translate(0,y1,0);
  const glow=new T.PlaneGeometry(3.2,2.0).rotateX(Math.PI/2).translate(0,-.014,0);
  return{frame,well,diffuser,glow};})();
 const chunks=new Map(),batches=new Map(),circuits=new Map(),leverRefs=new Map();let activeFeet=0;let activeKey='',elapsed=0,rebuildCount=0,instances=0,visibleBreakers=[];
 let recording=null;
 function emit(e){recording.push(e);}
 // A chunk's render plan is packed once into per-batch Float32Arrays; rebuilding the window only copies them.
 function pack(list){const groups=new Map();for(const e of list){const id=e.geo.uuid+e.mat.uuid+(e.cast?'c':'n');let g=groups.get(id);if(!g){g={id,geo:e.geo,mat:e.mat,cast:e.cast,receive:e.receive,items:[],levers:[]};groups.set(id,g);}if(e.track)g.levers.push({i:g.items.length,track:e.track});g.items.push(e.matrix);}const out=[];for(const g of groups.values()){const arr=new Float32Array(g.items.length*16);g.items.forEach((m,i)=>arr.set(m.elements,i*16));out.push({id:g.id,geo:g.geo,mat:g.mat,cast:g.cast,receive:g.receive,n:g.items.length,arr,levers:g.levers});}return out;}
 function add(geo,mat,x,y,z,w=1,h=1,d=1,rot=0,cast=true,receive=true){tmp.position.set(x,y,z);tmp.rotation.set(0,rot,0);tmp.scale.set(w,h,d);tmp.updateMatrix();emit({geo,mat,cast,receive,matrix:tmp.matrix.clone()});}
 function addParts(parts,x,y,z,rot=0,roll=0,pitch=0,track=null,scale=[1,1,1],quaternion=null,materialMode=null){if(!parts)return;tmp.position.set(x,y,z);tmp.rotation.set(pitch,rot,roll,'YXZ');tmp.scale.set(...scale);if(quaternion)tmp.quaternion.fromArray(quaternion);tmp.updateMatrix();const placement=tmp.matrix.clone();for(const p of parts)emit({geo:p.geometry,mat:materialMode&&!/Brass|Steel|Shadow|Glass|Screen|cable|Led/.test(p.material)?(materialMode==='carpet'?mats.carpet:mats.wall[0]):mats[p.material]||mats.metal,cast:p.castShadow,receive:true,matrix:placement.clone().multiply(p.matrix),track:track?{id:track,part:p.matrix,x,y,z,rot,roll}:null});}
 // Extruded spandrel over a raised arched window. Its opening is real geometry.
 const shape=new T.Shape();const hw=S/4,rad=.61,sill=.91,spring=1.31,top=2.31;
 shape.moveTo(-hw,sill);shape.lineTo(-rad,sill);shape.lineTo(-rad,spring);shape.absarc(0,spring,rad,Math.PI,0,true);shape.lineTo(rad,sill);shape.lineTo(hw,sill);shape.lineTo(hw,top);shape.lineTo(-hw,top);shape.closePath();
 // Limit arch rise to reference proportions, then retain exact positive winding through extrusion.
 const archGeo=new T.ExtrudeGeometry(shape,{depth:.19,bevelEnabled:false,curveSegments:16});archGeo.translate(0,0,-.095);
 // Semicircle radius above would exceed beam top: use elliptical arch by custom curve samples.
 const sp=new T.Shape();sp.moveTo(-hw,sill);sp.lineTo(-rad,sill);sp.lineTo(-rad,1.35);for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;sp.lineTo(Math.cos(a)*rad,1.35+Math.sin(a)*.77);}sp.lineTo(rad,sill);sp.lineTo(hw,sill);sp.lineTo(hw,top);sp.lineTo(-hw,top);sp.closePath();archGeo.dispose();const realArch=new T.ExtrudeGeometry(sp,{depth:.188,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:12});realArch.translate(0,0,-.10);
 function ao(x,z,w,d){if(Math.abs(l0FloorBase(x-w/2,z-d/2)-l0FloorBase(x+w/2,z+d/2))>.03)return;add(floorPlane,mats.ao,x,l0FloorBase(x,z)+.012,z,w+.42,1,d+.42,0,false,false);}
 const portalGeos={};for(const style of ['round','canted','square','wide']){const p=new T.Shape();p.moveTo(-.5,0);if(style==='round'){for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;p.lineTo(Math.cos(a)*.5,Math.sin(a)*.78);}}else if(style==='canted'){p.lineTo(-.34,.35);p.lineTo(.34,.35);p.lineTo(.5,0);}else{p.lineTo(.5,0);}p.lineTo(.5,1);p.lineTo(-.5,1);p.closePath();const g=new T.ExtrudeGeometry(p,{depth:.994,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,steps:1});g.translate(0,0,-.497);portalGeos[style]=g;}
 const rampPlane=new T.PlaneGeometry(1,1,8,8).rotateX(-Math.PI/2),rampGeos=new Map();
 const railPost=new T.LatheGeometry([[.023,0],[.029,.04],[.016,.14],[.028,.24],[.016,.38],[.025,.49],[.018,.57]].map(a=>new T.Vector2(...a)),8);
 whiteColors(railPost);
 function floorGeometry(f){const g=rampPlane.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)*f.w+f.x,z=p.getZ(i)*f.d+f.z;p.setXYZ(i,x,l0FloorBase(x,z),z);}g.computeVertexNormals();return g;}
 function puddleGeometry(c){const geos=[];
  for(const p of c.puddles){const g=new T.PlaneGeometry(p.w,p.d,12,12).rotateX(-Math.PI/2).rotateY(p.phase),pos=g.attributes.position;
   for(let i=0;i<pos.count;i++){const x=pos.getX(i)+p.x,z=pos.getZ(i)+p.z;pos.setXYZ(i,x,floorAt(x,z)+.002,z);}
   // Reject triangles at actual wall footprints. This also prevents smears across baseboards.
   const index=g.index.array,keep=[];for(let i=0;i<index.length;i+=3){const ids=[index[i],index[i+1],index[i+2]];if(ids.some(v=>c.walls.some(w=>Math.abs(pos.getX(v)-w.x)<w.w/2+.012&&Math.abs(pos.getZ(v)-w.z)<w.d/2+.012)))continue;keep.push(...ids);}g.setIndex(keep);g.computeVertexNormals();geos.push(g.toNonIndexed());g.dispose();
  }
  const merged=geos.length?mergeGeometries(geos,false):null;geos.forEach(g=>g.dispose());return merged;
 }
 function generateMesh(c){if(c.renderPlan)return c.renderPlan;recording=[];
  const red=c.type==='red',wallM=red?[mats.red,mats.red,mats.red]:mats.wall,ground=red?mats.redFloor:mats.carpet;
  const slopeParts=[];for(const f of c.floors){const ground=f.type==='red'?mats.redFloor:f.type==='spawn'?mats.spawnCarpet:mats.carpet;if(f.type==='blackout'&&l0Hash(Math.round(f.x/S),Math.round(f.z/S),71)>.94){add(depression,ground,f.x,0,f.z,1,1,1,0,false);add(floorPlane,mats.water,f.x,-.028,f.z,2.58,1,2.58,0,false,false);}else if([[-.5,-.5],[.5,.5],[0,0],[-.5,.5],[.5,-.5]].some(([a,b])=>Math.abs(l0FloorBase(f.x+a*f.w,f.z+b*f.d))>.001)){if(!c.slopeGeometry)slopeParts.push(floorGeometry(f));}else add(floorPlane,ground,f.x,0,f.z,f.w,1,f.d,0,false);}
  if(slopeParts.length){c.slopeGeometry=mergeGeometries(slopeParts,false);slopeParts.forEach(g=>g.dispose());}if(c.slopeGeometry)add(c.slopeGeometry,mats.carpet,0,0,0,1,1,1,0,false);
  for(const w of [...c.walls,...c.pillars]){const base=w.y-w.h/2;add(wallBox,l0TypeAt(w.x,w.z)==='red'?mats.red:w.kind==='column'?mats.columnWall:mats.wall[w.mat||0],w.x,w.y,w.z,w.w,w.h,w.d);if(base<.6&&w.mat!==5){add(box,mats.trim,w.x,base+.045,w.z,w.w+.010,.09,w.d+.010);ao(w.x,w.z,w.w,w.d);}if(w.h<1.6&&base<.6)add(wallBox,mats.railWood,w.x,base+w.h+.025,w.z,w.w+.058,.05,w.d+.058);}
  for(const p of c.portals)add(portalGeos[p.style],mats.wall[p.mat||0],p.x,p.spring,p.z,p.w,p.top-p.spring,p.d,p.rotation);
  for(const r of c.rails){const c0=Math.cos(r.rotation),s0=Math.sin(r.rotation),len=r.length,n=Math.ceil(len/.24);for(let i=0;i<=n;i++){const u=-len/2+i*len/n,x=r.x+u*c0,z=r.z-u*s0,base=(r.y||0)+l0FloorBase(x,z);add(railPost,mats.railWood,x,base+.26,z);if(i===0||i===n)add(wallBox,mats.railWood,x,base+.44,z,.105,.88,.105);if(i<n){const xx=r.x+(u+len/n)*c0,zz=r.z-(u+len/n)*s0,by=(r.y||0)+l0FloorBase(xx,zz),delta=new T.Vector3(xx-x,by-base,zz-z),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),delta.clone().normalize());for(const[y,h,d]of[[.87,.068,.095],[.22,.05,.06]])emit({geo:wallBox,mat:mats.railWood,cast:true,receive:true,matrix:new T.Matrix4().compose(new T.Vector3((x+xx)/2,(base+by)/2+y,(z+zz)/2),q,new T.Vector3(delta.length()+.002,h,d))});}}}
  for(const a of c.arches){add(realArch,mats.pale,a.x,0,a.z,1,1,1,a.rotation);add(box,mats.pale,a.x,.455,a.z,.20,.91,a.w);add(box,mats.pale,a.x,2.505,a.z-a.w/2,.20,.41,.20);add(box,mats.trim,a.x,.04,a.z,.212,.08,a.w);ao(a.x,a.z,.20,a.w);}
  for(const h of c.holes){const dep=8;add(box,mats.pitWall,h.x-h.w/2-.04,-dep/2,h.z,.08,dep,h.d);add(box,mats.pitWall,h.x+h.w/2+.04,-dep/2,h.z,.08,dep,h.d);add(box,mats.pitWall,h.x,-dep/2,h.z-h.d/2-.04,h.w,dep,.08);add(box,mats.pitWall,h.x,-dep/2,h.z+h.d/2+.04,h.w,dep,.08);add(floorPlane,mats.void,h.x,-dep,h.z,h.w,1,h.d,0,false,false);}
  // Recessed fixtures fit the acoustic tile lattice; rare cavities remove real ceiling panels.
  const damage=c.damage,lamps=c.lights,vents=c.details.filter(a=>a.kind<4);
  const services=[...manilaRegionsNear(c.ox+K/2,c.oz+K/2,30).map(r=>({x:r.x,z:r.z,w:10,d:10})),{x:302,z:70,w:22.8,d:28.8},...vents.map(a=>({...a,w:a.kind===1?1.205:.635,d:a.kind===1?.218:.635}))],openings=[...services,...damage.tiles],railCuts=[...services,...damage.breaks];
  if(damage.tiles.length){add(box,mats.void,c.ox+K/2,H+.86,c.oz+K/2,K,.05,K,0,false,false);for(const p of damage.tiles){add(box,mats.dark,p.x-.54,H+.54,p.z,.065,.14,.59,0,false);add(box,mats.dark,p.x+.54,H+.54,p.z,.065,.14,.59,0,false);}}
  for(let iz=0;iz<36;iz++)for(let ix=0;ix<18;ix++){const x=c.ox+(ix+.5)*1.2,z=c.oz+(iz+.5)*.6;const light=lamps.find(a=>Math.abs(a.x-x)<.1&&Math.abs(a.z-z)<.1);if(light&&!inManila(x,z,.6)&&!inAtrium96(x,z,.6)){add(troffer.frame,mats.lampFrame,x,H,z,1,1,1,0,false);add(troffer.well,light.on?mats.lampSide:mats.lampFrame,x,H,z,1,1,1,0,false,false);add(troffer.diffuser,light.on?mats.lamp:mats.lampOff,x,H,z,1,1,1,0,false,false);if(light.on)add(troffer.glow,mats.lampGlow,x,H,z,1,1,1,0,false,false);continue;}
   let pieces=[{x0:x-.5985,x1:x+.5985,z0:z-.2985,z1:z+.2985}];for(const o of openings){const a=o.x-o.w/2,b=o.x+o.w/2,u=o.z-o.d/2,v=o.z+o.d/2;pieces=pieces.flatMap(r=>{if(r.x1<=a||r.x0>=b||r.z1<=u||r.z0>=v)return[r];return[{...r,x1:Math.max(r.x0,a)},{...r,x0:Math.min(r.x1,b)},{x0:Math.max(r.x0,a),x1:Math.min(r.x1,b),z0:r.z0,z1:Math.max(r.z0,u)},{x0:Math.max(r.x0,a),x1:Math.min(r.x1,b),z0:Math.min(r.z1,v),z1:r.z1}].filter(q=>q.x1-q.x0>.003&&q.z1-q.z0>.003);});}for(const r of pieces)add(box,mats.ceiling,(r.x0+r.x1)/2,H+.03,(r.z0+r.z1)/2,r.x1-r.x0,.06,r.z1-r.z0,0,false);}
  // T-grid is retained under absent panels; only real service cuts and broken ribs interrupt it.
  for(const vertical of[true,false])for(let i=0;i<(vertical?18:36);i++){const cross=(vertical?c.ox:c.oz)+i*(vertical?1.2:.6);let spans=[[vertical?c.oz:c.ox,(vertical?c.oz:c.ox)+K]];for(const o of railCuts){if(Math.abs(cross-(vertical?o.x:o.z))>=(vertical?o.w:o.d)/2-.003)continue;const a=(vertical?o.z-o.d/2:o.x-o.w/2),b=(vertical?o.z+o.d/2:o.x+o.w/2);spans=spans.flatMap(([u,v])=>v<=a||u>=b?[[u,v]]:[[u,Math.max(u,a)],[Math.min(v,b),v]].filter(([u,v])=>v-u>.003));}for(const[a,b]of spans){if(vertical){add(box,mats.grid,cross,H+.004,(a+b)/2,.018,.012,b-a,0,false);add(box,mats.grid,cross,H+.037,(a+b)/2,.005,.058,b-a,0,false);}else{add(box,mats.grid,(a+b)/2,H+.004,cross,b-a,.012,.018,0,false);add(box,mats.grid,(a+b)/2,H+.037,cross,b-a,.058,.005,0,false);}}}
  for(const d of c.details){if(d.kind<4)addParts(assets.vents[d.kind],d.x,H-.018,d.z,d.rotation);if(d.kind===5)addParts(assets.cables,d.x,H,d.z,d.rotation);}
  for(const t of damage.tiles){if(t.state!=='missing')addParts(ceiling95[t.state+t.variant],t.x,H,t.z);}
  for(const m of damage.modules)addParts(ceiling95[m.kind],m.x,H+(m.y||0),m.z,m.rot,0,0,null,[m.sx||1,m.sy||1,m.sz||1]);
  if(c.puddles.length&&!c.waterGeometry)c.waterGeometry=puddleGeometry(c);if(c.waterGeometry)add(c.waterGeometry,mats.water,0,0,0,1,1,1,0,false,false);
  for(const p of c.windows)addParts(atrium.windows[p.kind],p.x,p.y,p.z,p.rotation);
  for(const f of c.furniture){addParts(props[f.kind],f.x,f.y||0,f.z,f.rotation||0,f.roll||0,f.pitch||0,null,f.scale,f.quaternion,f.materialMode);if(Math.abs((f.y||0)-l0FloorBase(f.x,f.z))<.03){const q=f.mapFootprint||f;ao(q.x,q.z,q.w,q.d);}}
  for(const p of c.panels){const vertical=p.d>p.w,len=Math.max(p.w,p.d),count=Math.max(1,Math.ceil(len/1.35)),bay=len/count;for(const sign of[-1,1]){const rot=vertical?sign*Math.PI/2:sign>0?0:Math.PI;for(let j=0;j<count;j++){const u=-len/2+(j+.5)*bay,x=p.x+(vertical?sign*(p.w/2+.007):u),z=p.z+(vertical?u:sign*(p.d/2+.007));add(plane,mats.panels[p.style],x,.46,z,bay,.92,1,rot,false);}
   if(sign===1)add(box,mats.trim,p.x,.925,p.z,p.w+.045,.035,p.d+.045,0,false);
  }}
  for(const o of c.outlets)addParts(props.outlets[o.style],o.x,o.y,o.z,o.rotation,o.roll);
  for(const p of c.mold){const n=new T.Vector3(Math.sin(p.rotation),0,Math.cos(p.rotation));add(plane,mats.mold,p.x+n.x*.012,p.y,p.z+n.z*.012,p.w,p.h,1,p.rotation,false,false);}
  for(const p of c.breakers){addParts(props.breaker,p.x,p.y,p.z,p.rotation);const nx=Math.sin(p.rotation),nz=Math.cos(p.rotation);addParts(props.lever,p.x+nx*.12,p.y+.21,p.z+nz*.12,p.rotation,0,circuits.has(p.id)?-.85:.30,p.id);}
  c.renderPlan=pack(recording);recording=null;return c.renderPlan;
 }
 function getChunk(cx,cz){const k=`${cx},${cz}`;if(!chunks.has(k))chunks.set(k,createL0Chunk(cx,cz));return chunks.get(k);}
 let center={cx:NaN,cz:NaN};
 function leverMatrix(r){tmp.position.set(r.x,r.y,r.z);tmp.rotation.set(circuits.has(r.id)?-.85:.30,r.rot,r.roll,'YXZ');tmp.scale.set(1,1,1);tmp.updateMatrix();return tmp.matrix.clone().multiply(r.part);}
 // V103: persistent per-batch InstancedMeshes. A window shift copies packed chunk arrays into the
 // existing buffers and uploads only the used range; no mesh churn, no whole-scene bounding work.
 function build(cx,cz){center={cx,cz};leverRefs.clear();visibleBreakers=[];instances=0;for(const [k,c]of chunks)if(Math.abs(c.cx-cx)>5||Math.abs(c.cz-cz)>5){c.slopeGeometry?.dispose();c.waterGeometry?.dispose();chunks.delete(k);}
  for(const b of batches.values()){b.count=0;b.parts.length=0;}
  for(let z=cz-3;z<=cz+3;z++)for(let x=cx-3;x<=cx+3;x++){const c=getChunk(x,z);for(const g of generateMesh(c)){let b=batches.get(g.id);if(!b){b={geo:g.geo,mat:g.mat,cast:g.cast,receive:g.receive,count:0,parts:[],mesh:null,capacity:0};batches.set(g.id,b);}b.parts.push(g);b.count+=g.n;}for(const p of c.breakers)visibleBreakers.push(p);}
  for(const [id,b]of batches){if(!b.count){if(b.mesh){group.remove(b.mesh);b.mesh.dispose();}batches.delete(id);continue;}
   if(!b.mesh||b.capacity<b.count){if(b.mesh){group.remove(b.mesh);b.mesh.dispose();}b.capacity=Math.ceil(b.count*1.35)+8;const m=new T.InstancedMesh(b.geo,b.mat,b.capacity);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=b.cast;m.receiveShadow=b.receive;m.frustumCulled=false;m.name='L0 batch / '+(b.mat.name||b.mat.type);b.mesh=m;group.add(m);}
   const m=b.mesh,arr=m.instanceMatrix.array;let offset=0;for(const g of b.parts){arr.set(g.arr,offset*16);for(const l of g.levers){const r=l.track,index=offset+l.i;leverMatrix(r).toArray(arr,index*16);let refs=leverRefs.get(r.id);if(!refs){refs=[];leverRefs.set(r.id,refs);}refs.push({...r,batch:b,index});}offset+=g.n;}
   m.count=b.count;m.instanceMatrix.clearUpdateRanges();m.instanceMatrix.addUpdateRange(0,b.count*16);m.instanceMatrix.needsUpdate=true;instances+=b.count;}
  rebuildCount++;computeField(true);manila.invalidate();}
 // Lamps of the resident window feed the light field. A pulled breaker removes its lamps' emission;
 // the field keeps the light that spills in from the rest of the floor.
 const fieldLamps=[];
 // Occluders baked into the field: full-height walls/columns block light; low partitions, arches and
 // floor-standing furniture only add ambient occlusion. Cached per chunk as [x0,x1,z0,z1,kind].
 function occOf(c){if(c.l0Occ)return c.l0Occ;const o=[];const put=(x,z,w,d,k)=>{if(!(w>0&&d>0))return;o.push(x-w/2,x+w/2,z-d/2,z+d/2,k);};
  for(const w of[...c.walls,...c.pillars]){const base=w.y-w.h/2;if(base>.6)continue;put(w.x,w.z,w.w,w.d,w.h>=2.2?1:.7);}
  for(const a of c.arches)put(a.x,a.z,.2,a.w,.75);
  for(const f of c.furniture){if(Math.abs((f.y||0)-l0FloorBase(f.x,f.z))>=.03)continue;const q=f.mapFootprint||f;if(q.w&&q.d)put(q.x,q.z,Math.min(q.w,4),Math.min(q.d,4),.5);}
  return c.l0Occ=Float32Array.from(o);}
 function computeField(instant){fieldLamps.length=0;const {cx,cz}=center;if(!Number.isFinite(cx))return;for(let z=cz-3;z<=cz+3;z++)for(let x=cx-3;x<=cx+3;x++)for(const l of getChunk(x,z).lights)if(l.on){let p=1;for(const c of circuits.values())p*=T.MathUtils.smoothstep(Math.hypot(l.x-c.x,l.z-c.z),c.radius*.82,c.radius);fieldLamps.push({x:l.x,z:l.z,power:p});}
  const ox=(cx-3)*K,oz=(cz-3)*K,neutral=[ATRIUM_RECT96,...manilaRegionsNear(ox+3.5*K,oz+3.5*K,95).map(r=>({x0:r.x-5.2,x1:r.x+5.2,z0:r.z-5.2,z1:r.z+5.2}))];
  const parts=[];let len=0;for(let z=cz-3;z<=cz+3;z++)for(let x=cx-3;x<=cx+3;x++){const a=occOf(getChunk(x,z));parts.push(a);len+=a.length;}const occ=new Float32Array(len);let off=0;for(const a of parts){occ.set(a,off);off+=a.length;}
  field.compute(ox,oz,fieldLamps,neutral,{instant,seconds:.65,occ,sync:!field.ready});field.ready=true;}
 // Generate chunk plans ahead of need, one per frame, so a window shift only copies packed arrays.
 function prefetch(){if(!Number.isFinite(center.cx))return;for(let r=1;r<=4;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const k=`${center.cx+dx},${center.cz+dz}`;if(!chunks.has(k)){getChunk(center.cx+dx,center.cz+dz);return;}const c=chunks.get(k);if(!c.renderPlan){generateMesh(c);return;}}}
 // Hysteresis: the window recentres only once the player is 2.5 m into a neighbouring chunk.
 function ensure(x,z){manila.prepare(x,z);const cx=Math.floor(x/K),cz=Math.floor(z/K),k=`${cx},${cz}`;if(activeKey!==k){const m=2.5,inside=Number.isFinite(center.cx)&&x>center.cx*K-m&&x<(center.cx+1)*K+m&&z>center.cz*K-m&&z<(center.cz+1)*K+m;if(!inside){activeKey=k;build(cx,cz);}}return getChunk(cx,cz);}
 function blocked(x,z,r=.25,feet=0,body=1.7){if(inAtrium96(x,z,r)||feet<-.4&&inAtrium96(x,z,2))return atriumBlocked97(x,z,r,feet,body);if(manila.blocked(x,z,r))return true;const cx=Math.floor(x/K),cz=Math.floor(z/K);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(l0SolidAt(getChunk(cx+dx,cz+dz),x,z,r))return true;return false;}
 function safe(x,z){for(let d=0;d<30;d++)for(const [dx,dz]of [[d,0],[-d,0],[0,d],[0,-d]]){const px=x+dx*.35,pz=z+dz*.35;if(!blocked(px,pz,.32)&&!pitAt(px,pz))return{x:px,z:pz};}return{x:1.8,z:1.8};}
 function floorAt(x,z,maxY=.15){if(inAtrium96(x,z))return atriumSupport97(x,z,maxY);const c=getChunk(Math.floor(x/K),Math.floor(z/K));if(l0TypeAt(x,z)!=='blackout')return l0FloorBase(x,z);const f=c.floors.find(f=>Math.abs(x-f.x)<S/2&&Math.abs(z-f.z)<S/2);if(!f||l0Hash(Math.round(f.x/S),Math.round(f.z/S),71)<=.94)return 0;const r=Math.hypot(x-f.x,z-f.z)/(S*.48);return -.16*Math.pow(Math.max(0,1-r*r),2);}
 function pitAt(x,z){return atriumPit96(x,z)||getChunk(Math.floor(x/K),Math.floor(z/K)).holes.some(h=>Math.abs(x-h.x)<h.w/2-.08&&Math.abs(z-h.z)<h.d/2-.08);}
 function supportAt(x,z,maxY=.15){if(inAtrium96(x,z))return atriumSupport97(x,z,maxY);if(pitAt(x,z))return -Infinity;const y=floorAt(x,z);return y<=maxY+.001?y:-Infinity;}
 function landingAt(x,z,from,to){if(inAtrium96(x,z))return atriumLanding97(x,z,from,to);const y=supportAt(x,z,from+.03);return y>=to-.001?y:null;}
 function headAt(x,z,feet,head){return inAtrium96(x,z)?atriumHeadroom97(x,z,feet,head):floorAt(x,z)+H;}
 function powerAt(x,z){let p=1;for(const c of circuits.values()){const t=T.MathUtils.smoothstep(Math.hypot(x-c.x,z-c.z),c.radius*.82,c.radius);p*=.038+.962*t;}return p;}
 function syncCuts(x,z){if(!fades.size){uniforms.cutCount.value=0;return;}const nearby=[...fades.values()].sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z)).slice(0,12);uniforms.cutCount.value=nearby.length;nearby.forEach((p,i)=>uniforms.cuts.value[i].set(p.x,p.z,p.radius,p.level));}
 function fadedPower(x,z){let p=1;for(const c of fades.values())p*=1-c.level*(1-T.MathUtils.smoothstep(Math.hypot(x-c.x,z-c.z),c.radius*.82,c.radius));return p;}
 function nearestBreaker(x,z,yaw){if(activeFeet< -1&&inAtrium96(x,z))return null;let best=null,dist=1.9;for(const b of visibleBreakers){const dx=b.x-x,dz=b.z-z,d=Math.hypot(dx,dz),nx=Math.sin(b.rotation),nz=Math.cos(b.rotation);if(d<dist&&(x-b.x)*nx+(z-b.z)*nz>0&&(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/Math.max(.01,d)>.7){best=b;dist=d;}}return best;}
 function toggleBreaker(p){if(circuits.has(p.id))circuits.delete(p.id);else circuits.set(p.id,{...p});const f=fades.get(p.id)||{x:p.x,z:p.z,radius:p.radius,level:0};f.target=circuits.has(p.id)?1:0;fades.set(p.id,f);computeField(false);for(const r of leverRefs.get(p.id)||[]){tmp.position.set(r.x,r.y,r.z);tmp.rotation.set(circuits.has(p.id)?-.85:.30,r.rot,r.roll,'YXZ');tmp.scale.set(1,1,1);tmp.updateMatrix();r.batch.mesh.setMatrixAt(r.index,tmp.matrix.clone().multiply(r.part));r.batch.mesh.instanceMatrix.needsUpdate=true;}syncCuts(p.x,p.z);return circuits.has(p.id);}
 const fogLit=new T.Color(0xa39b75),fogDark=new T.Color(0x16160f),fogRed=new T.Color(0x6e4334),fogAtri=new T.Color(0x1b1b17),hemiLit=new T.Color(0xfffee9),hemiRed=new T.Color(0xd19984),hemiMan=new T.Color(0xfffbef),groundLit=new T.Color(0xc4b894),groundMan=new T.Color(0xbcb9a4),keyLit=new T.Color(0xfff9e4),keyRed=new T.Color(0xffb09b),keyDark=new T.Color(0xc7cfba);
 const smooth01=v=>{v=Math.min(1,Math.max(0,v));return v*v*(3-2*v);},near5=[-1,-1,-1,-1,-1];
 function update(dt,x,z,yaw,feet=0){activeFeet=feet;atrium.update(x,z);manila.update(dt,x,z);elapsed+=dt;uniforms.time.value=elapsed;const rebuilt=rebuildCount;ensure(x,z);if(rebuilt===rebuildCount)prefetch();field.update(dt);
  for(const [id,f]of fades){f.level+=(f.target-f.level)*(1-Math.exp(-dt*7));if(Math.abs(f.target-f.level)<.002)f.level=f.target;if(f.level===0&&f.target===0)fades.delete(id);}syncCuts(x,z);
  if(Math.abs(x-typeCache.x)+Math.abs(z-typeCache.z)>.2)typeCache={x,z,type:l0TypeAt(x,z)};const type=typeCache.type,red=type==='red',man=nearManila(x,z),atri=inAtrium96(x,z,3),tier=atri?atriumTier97(feet):null;
  // Player-local environment follows the field and eases, so fog/ambient never switch at a zone edge.
  const f=field.sample(x,z),litHere=f.neutral>.5?1:Math.min(1,Math.max(0,(f.direct*.75+f.bounce*.55)/1.05)),k=env.init?1-Math.exp(-dt*2.2):1;env.init=true;
  env.dark+=(smooth01((.62-litHere)/.55)-env.dark)*k;env.man+=((man?1:0)-env.man)*k;env.atri+=((atri?1:0)-env.atri)*k;env.red+=((red?1:0)-env.red)*k;
  uniforms.darkness.value=env.dark;uniforms.brightness.value=1;mats.ceiling.emissiveIntensity=T.MathUtils.lerp(.10,.16,env.man);
  hemi.intensity=T.MathUtils.lerp(T.MathUtils.lerp(.50,1.34,env.man),1.42,env.atri*(1-env.man));hemi.color.copy(hemiLit).lerp(hemiRed,env.red).lerp(hemiMan,env.man);hemi.groundColor.copy(groundLit).lerp(groundMan,env.man);
  key.intensity=T.MathUtils.lerp(.21,.16,env.man);key.color.copy(keyLit).lerp(keyRed,env.red).lerp(keyDark,env.dark*(1-env.red));
  scene.fog.color.copy(fogLit).lerp(fogRed,env.red).lerp(fogDark,env.dark).lerp(fogAtri,env.atri);scene.fog.density=T.MathUtils.lerp(T.MathUtils.lerp(T.MathUtils.lerp(.009,.03,env.dark),.002,env.man),.006,env.atri);
  // Directional fill shadow: recentred on a 7.2 m grid (its 50 m frustum keeps >14 m of margin).
  const kx=Math.floor(x/7.2)*7.2,kz=Math.floor(z/7.2)*7.2,ky=atri?tier.y:0,kc=kx+','+kz+','+ky;if(kc!==keyCell){keyCell=kc;key.position.set(kx+3.6+1.6,ky+9,kz+3.6+1.1);key.target.position.set(kx+3.6,ky,kz+3.6);if(!shadowQueue.includes(key))shadowQueue.push(key);}
  // Nearest lamps feed the 4 area lights / 2 shadow spots. A lamp's weight is zero exactly when it
  // enters or leaves the nearest set, so slots are re-assigned invisibly (no pop, no recompile).
  let n=0;const cx=Math.floor(x/K),cz=Math.floor(z/K);
  if(atri&&feet<-.2){for(const l of tier.lamps){if(n>=96)break;pick.id[n]=-(n+1);pick.x[n]=l.x+302;pick.y[n]=l.y;pick.z[n]=l.z+70;n++;}}
  else for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const l of getChunk(cx+dx,cz+dz).lights){if(!l.on||n>=96)continue;pick.id[n]=Math.round(l.x*10)*1e6+Math.round(l.z*10);pick.x[n]=l.x;pick.y[n]=H-.085;pick.z[n]=l.z;n++;}
  near5.fill(-1);for(let i=0;i<n;i++){pick.d[i]=Math.hypot(x-pick.x[i],z-pick.z[i]);if(near5[4]>=0&&pick.d[i]>=pick.d[near5[4]])continue;let j=4;while(j>0&&(near5[j-1]<0||pick.d[i]<pick.d[near5[j-1]])){near5[j]=near5[j-1];j--;}near5[j]=i;}
  const d5=near5[4]>=0?Math.min(9,pick.d[near5[4]]):9;
  for(const sl of slots){sl.idx=-1;for(let j=0;j<4;j++)if(near5[j]>=0&&pick.id[near5[j]]===sl.id)sl.idx=near5[j];}
  for(let j=0;j<4;j++){const i=near5[j];if(i<0||slots.some(sl=>sl.idx===i))continue;const sl=slots.find(sl=>sl.idx<0);if(!sl)break;sl.idx=i;sl.id=pick.id[i];sl.x=pick.x[i];sl.y=pick.y[i];sl.z=pick.z[i];}
  const areaBase=T.MathUtils.lerp(T.MathUtils.lerp(6.0,3.8,env.man),5.5,env.atri*(1-env.man)),spotBase=4.2*(1-env.man);
  for(let i=0;i<slots.length;i++){const sl=slots[i],w=sl.idx<0?0:smooth01((d5-pick.d[sl.idx])/(.35*d5+.6))*fadedPower(sl.x,sl.z),a=areas[i];a.position.set(sl.x,sl.y,sl.z);a.intensity=areaBase*w;
   const sp=shadows[i];if(sp){sp.intensity=spotBase*w;if(sp.position.x!==sl.x||sp.position.y!==sl.y||sp.position.z!==sl.z){sp.position.set(sl.x,sl.y,sl.z);sp.target.position.set(sl.x,atri?tier.y:0,sl.z);if(!shadowQueue.includes(sp))shadowQueue.push(sp);}}}
  // At most one shadow map is re-rendered per frame.
  const next=shadowQueue.shift();if(next)next.shadow.needsUpdate=true;
  return type;
 }
 // Compile every light configuration Level 0 can reach (Manila rooms and the atrium switch their own
 // lights by distance), so walking into them never recompiles materials mid-game.
 async function prewarm(renderer,camera){const rooms=[manila.original.root,manila.copy.root,atrium.root],save=[];const lightsOf=r=>{const out=[];r.traverse(o=>{if(o.isLight)out.push(o);});return out;};for(const r of rooms){save.push([r,r.visible]);for(const l of lightsOf(r))save.push([l,l.visible]);}
  const set=(i,on)=>{const r=rooms[i];r.visible=on||r===manila.original.root;for(const l of lightsOf(r))l.visible=on;};
  try{for(const cfg of[-1,0,1,2]){for(let i=0;i<3;i++)set(i,i===cfg);await renderer.compileAsync(scene,camera);}}finally{for(const[o,v]of save)o.visible=v;}
  await renderer.compileAsync(scene,camera);}
 function map(ctx,px,pz,cx,cy,scale,range){ctx.save();ctx.translate(cx,cy);for(let z=Math.floor((pz-range)/K);z<=Math.floor((pz+range)/K);z++)for(let x=Math.floor((px-range)/K);x<=Math.floor((px+range)/K);x++){const c=getChunk(x,z);for(const f of c.floors){ctx.fillStyle=f.type==='red'?'#774432':f.type==='blackout'?'#342f23':'#b1a374';ctx.fillRect((f.x-f.w/2-px)*scale,(f.z-f.d/2-pz)*scale,f.w*scale,f.d*scale);}ctx.fillStyle='#564d32';for(const w of [...c.walls,...c.pillars])ctx.fillRect((w.x-w.w/2-px)*scale,(w.z-w.d/2-pz)*scale,Math.max(w.w*scale,1),Math.max(w.d*scale,1));for(const f of c.furniture){if(f.mapFootprint){const q=f.mapFootprint;ctx.fillRect((q.x-q.w/2-px)*scale,(q.z-q.d/2-pz)*scale,q.w*scale,q.d*scale);continue;}ctx.save();ctx.translate((f.x-px)*scale,(f.z-pz)*scale);ctx.rotate(-(f.rotation||0));ctx.fillRect(-f.w*scale/2,-f.d*scale/2,f.w*scale,f.d*scale);ctx.restore();}for(const a of c.arches)ctx.fillRect((a.x-.1-px)*scale,(a.z-a.w/2-pz)*scale,Math.max(.2*scale,1),a.w*scale);ctx.fillStyle='#16150e';for(const h of c.holes)ctx.fillRect((h.x-h.w/2-px)*scale,(h.z-h.d/2-pz)*scale,h.w*scale,h.d*scale);}ctx.restore();if(Math.abs(px-302)<range+12&&Math.abs(pz-70)<range+15){ctx.save();ctx.translate(cx+(302-px)*scale,cy+(70-pz)*scale);atriumMap97(ctx,scale,activeFeet);ctx.restore();}manila.map(ctx,px,pz,cx,cy,scale);}
 return{scene,group,field,prewarm,ready:Promise.all([ready,manila.ready,atrium.ready]),manila,atrium,ensure,update,blocked,safe,pitAt,floorAt,supportAt,landingAt,headAt,map,getChunk,powerAt,nearestBreaker,toggleBreaker,circuits,get breakers(){return visibleBreakers},materials:mats,landmarks:L0_LANDMARKS,stats:()=>({chunks:chunks.size,batches:group.children.length,instances,rebuildCount,textureUnits:renderer.capabilities.maxTextures,estimatedSamplerPeak:12,breakers:visibleBreakers.length,offCircuits:circuits.size})};
}
