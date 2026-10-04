import {L0_CELL as S,L0_CHUNK as K,L0_HEIGHT as H,l0Hash,l0Type,createL0Chunk,l0SolidAt} from './level0-layout.js';
import {createL0Materials} from './level0-materials.js';
import {createLevel0DetailAssets} from './level0-ceiling-details.js';
export function createLevel0World(T,renderer){
 const scene=new T.Scene();scene.userData.noAtmosphere=true;scene.background=new T.Color(0x201e0e);scene.fog=new T.FogExp2(0x514d2e,.028);
 const group=new T.Group();group.name='Level 0 · 阈界';scene.add(group);
 const {mats,uniforms,ready}=createL0Materials(T,renderer),assets=createLevel0DetailAssets(T),box=new T.BoxGeometry(1,1,1),plane=new T.PlaneGeometry(1,1),floorPlane=plane.clone().rotateX(-Math.PI/2),tmp=new T.Object3D();
 const hemi=new T.HemisphereLight(0xfff4cb,0xb0a990,1.65);scene.add(hemi);
 const key=new T.DirectionalLight(0xfffae9,2.1);key.position.set(1,9,1);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-25;key.shadow.camera.right=25;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;key.shadow.camera.near=.5;key.shadow.camera.far=22;key.shadow.bias=-.0003;key.shadow.normalBias=.035;scene.add(key,key.target);
 const fill=new T.PointLight(0xffefb7,5,9,2);fill.castShadow=false;scene.add(fill);
 const bs=new T.Shape();bs.moveTo(-.497,-.497);bs.lineTo(.497,-.497);bs.lineTo(.497,.497);bs.lineTo(-.497,.497);bs.closePath();const wallBox=new T.ExtrudeGeometry(bs,{depth:.994,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1});wallBox.translate(0,0,-.497);
 const depression=new T.PlaneGeometry(S,S,12,12).rotateX(-Math.PI/2);const dp=depression.attributes.position;for(let i=0;i<dp.count;i++){const r=Math.hypot(dp.getX(i),dp.getZ(i))/(S*.48);dp.setY(i,-.16*Math.pow(Math.max(0,1-r*r),2));}depression.computeVertexNormals();
 const chunks=new Map(),revisions=new Map(),batches=new Map();let activeKey='',elapsed=0,lastShift=0,rebuildCount=0,instances=0;
 function add(geo,mat,x,y,z,w=1,h=1,d=1,rot=0,cast=true,receive=true){const id=geo.uuid+mat.uuid+(cast?'c':'n');let b=batches.get(id);if(!b){b={geo,mat,cast,receive,matrices:[]};batches.set(id,b);}tmp.position.set(x,y,z);tmp.rotation.set(0,rot,0);tmp.scale.set(w,h,d);tmp.updateMatrix();b.matrices.push(tmp.matrix.clone());}
 function addParts(parts,x,y,z,rot=0){tmp.position.set(x,y,z);tmp.rotation.set(0,rot,0);tmp.scale.set(1,1,1);tmp.updateMatrix();const placement=tmp.matrix.clone();for(const p of parts){const mat=mats[p.material]||mats.metal,id=p.geometry.uuid+mat.uuid+(p.castShadow?'c':'n');let b=batches.get(id);if(!b){b={geo:p.geometry,mat,cast:p.castShadow,receive:true,matrices:[]};batches.set(id,b);}b.matrices.push(placement.clone().multiply(p.matrix));}}
 // Extruded spandrel over a raised arched window. Its opening is real geometry.
 const shape=new T.Shape();const hw=S/4,rad=.61,sill=.91,spring=1.31,top=2.31;
 shape.moveTo(-hw,sill);shape.lineTo(-rad,sill);shape.lineTo(-rad,spring);shape.absarc(0,spring,rad,Math.PI,0,true);shape.lineTo(rad,sill);shape.lineTo(hw,sill);shape.lineTo(hw,top);shape.lineTo(-hw,top);shape.closePath();
 // Limit arch rise to reference proportions, then retain exact positive winding through extrusion.
 const archGeo=new T.ExtrudeGeometry(shape,{depth:.19,bevelEnabled:false,curveSegments:16});archGeo.translate(0,0,-.095);
 // Semicircle radius above would exceed beam top: use elliptical arch by custom curve samples.
 const sp=new T.Shape();sp.moveTo(-hw,sill);sp.lineTo(-rad,sill);sp.lineTo(-rad,1.35);for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;sp.lineTo(Math.cos(a)*rad,1.35+Math.sin(a)*.77);}sp.lineTo(rad,sill);sp.lineTo(hw,sill);sp.lineTo(hw,top);sp.lineTo(-hw,top);sp.closePath();archGeo.dispose();const realArch=new T.ExtrudeGeometry(sp,{depth:.188,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:12});realArch.translate(0,0,-.10);
 function ao(x,z,w,d){add(floorPlane,mats.ao,x,.012,z,w+.5,1,d+.5,0,false,false);}
 function generateMesh(c){
  const red=c.type==='red',wallM=red?[mats.red,mats.red,mats.red]:mats.wall,ground=red?mats.redFloor:mats.carpet;
  for(const f of c.floors){if(c.type==='blackout'&&l0Hash(Math.round(f.x/S),Math.round(f.z/S),71)>.63){add(depression,ground,f.x,0,f.z,1,1,1,0,false);add(floorPlane,mats.water,f.x,-.028,f.z,2.2,1,2.2,0,false,false);}else add(floorPlane,ground,f.x,0,f.z,f.w,1,f.d,0,false);}
  for(const w of [...c.walls,...c.pillars]){add(wallBox,wallM[w.mat||0],w.x,w.y,w.z,w.w,w.h,w.d);add(box,mats.trim,w.x,.08,w.z,w.w+.018,.16,w.d+.018);add(box,mats.trim,w.x,.38,w.z,w.w+.028,.035,w.d+.028);ao(w.x,w.z,w.w,w.d);}
  for(const a of c.arches){add(realArch,mats.pale,a.x,0,a.z,1,1,1,a.rotation);add(box,mats.pale,a.x,.455,a.z,.20,.91,a.w);add(box,mats.pale,a.x,2.505,a.z-a.w/2,.20,.41,.20);add(box,mats.trim,a.x,.06,a.z,.22,.12,a.w);ao(a.x,a.z,.20,a.w);}
  for(const h of c.holes){const dep=8;add(box,mats.pitWall,h.x-h.w/2-.04,-dep/2,h.z,.08,dep,h.d);add(box,mats.pitWall,h.x+h.w/2+.04,-dep/2,h.z,.08,dep,h.d);add(box,mats.pitWall,h.x,-dep/2,h.z-h.d/2-.04,h.w,dep,.08);add(box,mats.pitWall,h.x,-dep/2,h.z+h.d/2+.04,h.w,dep,.08);add(floorPlane,mats.void,h.x,-dep,h.z,h.w,1,h.d,0,false,false);}
  // Recessed fixtures fit the acoustic tile lattice; rare cavities remove real ceiling panels.
  const cav=c.details.filter(a=>a.kind===4).map(a=>({x:Math.floor((a.x-c.ox)/1.2)*1.2+c.ox+.6,z:Math.floor((a.z-c.oz)/.6)*.6+c.oz+.3}));
  const lamps=c.lights.map(a=>({...a,x:Math.floor((a.x-c.ox)/1.2)*1.2+c.ox+.6,z:Math.floor((a.z-c.oz)/.6)*.6+c.oz+.3}));
  for(let iz=0;iz<36;iz++)for(let ix=0;ix<18;ix++){const x=c.ox+(ix+.5)*1.2,z=c.oz+(iz+.5)*.6;if(cav.some(a=>Math.abs(a.x-x)<.1&&Math.abs(a.z-z)<.1))continue;const light=lamps.find(a=>Math.abs(a.x-x)<.1&&Math.abs(a.z-z)<.1);if(light){add(box,mats.metal,x,H-.026,z,1.18,.065,.58,0,false);add(box,light.on?mats.lamp:mats.lampOff,x,H-.063,z,1.09,.012,.46,0,false,false);add(box,mats.metal,x,H-.072,z,.019,.012,.46,0,false);}
  else add(box,mats.ceiling,x,H+.03,z,1.179,.06,.579,0,false);}
  for(let i=0;i<=18;i++)add(box,mats.metal,c.ox+i*1.2,H+.005,c.oz+K/2,.024,.025,K,0,false);
  for(let i=0;i<=36;i++)add(box,mats.metal,c.ox+K/2,H+.005,c.oz+i*.6,K,.025,.021,0,false);
  for(const d of c.details){if(d.kind<4)addParts(assets.vents[d.kind],d.x,H-.10,d.z,d.rotation);if(d.kind===5)addParts(assets.cables,d.x,H,d.z,d.rotation);}
  for(const a of cav){addParts(assets.cavity,a.x,H,a.z);addParts(assets.fallenTile,a.x,H,a.z);if(l0Hash(a.x,a.z,72)>.5)add(box,mats.ceiling,a.x+.6,.032,a.z+.4,.45,.035,.29,.42,true);}
  for(const p of c.puddles)add(floorPlane,mats.water,p.x,.018,p.z,p.w,1,p.d,p.phase,false,false);
  // Rare abandoned utilitarian furnishings, built from reusable instance parts.
  for(const f of c.furniture){const x=f.x,z=f.z;if(f.kind==='desk'){add(wallBox,mats.wood,x,.74,z,1.12,.06,.55);for(const dx of [-.49,.49])for(const dz of [-.21,.21])add(box,mats.metal,x+dx,.35,z+dz,.035,.70,.035);}else{add(wallBox,mats.fabric,x,.46,z,.45,.065,.43);add(wallBox,mats.fabric,x,.73,z+.21,.44,.43,.045);for(const dx of [-.19,.19])for(const dz of [-.18,.18])add(box,mats.metal,x+dx,.23,z+dz,.022,.46,.022);}ao(x,z,f.w,f.d);}
 }
 function getChunk(cx,cz){const k=`${cx},${cz}`;if(!chunks.has(k))chunks.set(k,createL0Chunk(cx,cz,revisions.get(k)||0));return chunks.get(k);}
 function build(cx,cz){group.children.slice().forEach(o=>{group.remove(o);o.dispose?.();});batches.clear();instances=0;for(const [k,c]of chunks)if(Math.abs(c.cx-cx)>3||Math.abs(c.cz-cz)>3)chunks.delete(k);for(let z=cz-2;z<=cz+2;z++)for(let x=cx-2;x<=cx+2;x++)generateMesh(getChunk(x,z));for(const b of batches.values()){const m=new T.InstancedMesh(b.geo,b.mat,b.matrices.length);b.matrices.forEach((v,i)=>m.setMatrixAt(i,v));m.instanceMatrix.setUsage(T.StaticDrawUsage);m.instanceMatrix.needsUpdate=true;m.castShadow=b.cast;m.receiveShadow=b.receive;m.computeBoundingSphere();m.name='L0 batch';group.add(m);instances+=b.matrices.length;}rebuildCount++;}
 function ensure(x,z){const cx=Math.floor(x/K),cz=Math.floor(z/K),k=`${cx},${cz}`;if(activeKey!==k){activeKey=k;build(cx,cz);}return getChunk(cx,cz);}
 function blocked(x,z,r=.25){const cx=Math.floor(x/K),cz=Math.floor(z/K);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(l0SolidAt(getChunk(cx+dx,cz+dz),x,z,r))return true;return false;}
 function safe(x,z){for(let d=0;d<30;d++)for(const [dx,dz]of [[d,0],[-d,0],[0,d],[0,-d]]){const px=x+dx*.35,pz=z+dz*.35;if(!blocked(px,pz,.32)&&!pitAt(px,pz))return{x:px,z:pz};}return{x:1.8,z:1.8};}
 function floorAt(x,z){const c=getChunk(Math.floor(x/K),Math.floor(z/K));if(c.type!=='blackout')return 0;const f=c.floors.find(f=>Math.abs(x-f.x)<S/2&&Math.abs(z-f.z)<S/2);if(!f||l0Hash(Math.round(f.x/S),Math.round(f.z/S),71)<=.63)return 0;const r=Math.hypot(x-f.x,z-f.z)/(S*.48);return -.16*Math.pow(Math.max(0,1-r*r),2);}
 function pitAt(x,z){return getChunk(Math.floor(x/K),Math.floor(z/K)).holes.some(h=>Math.abs(x-h.x)<h.w/2-.08&&Math.abs(z-h.z)<h.d/2-.08);}
 function update(dt,x,z,yaw){elapsed+=dt;uniforms.time.value=elapsed;const c=ensure(x,z),dark=c.type==='blackout',red=c.type==='red';uniforms.brightness.value=dark?.02:1;mats.ceiling.emissiveIntensity=dark?.003:.65;hemi.intensity=dark?.018:1.35;key.intensity=dark?.025:red?.9:1.95;fill.intensity=dark?0:.22;key.color.set(red?0xff8065:0xfffae7);hemi.color.set(red?0xd17b64:0xfffae7);key.position.set(Math.round(x/2)*2+1,9,Math.round(z/2)*2+.6);key.target.position.set(Math.round(x/2)*2,0,Math.round(z/2)*2);fill.position.set(Math.round(x/3.6)*3.6+1.8,H-.15,Math.round(z/3.6)*3.6+1.8);scene.fog.color.set(dark?0x050504:red?0x482218:0x514d2e);scene.fog.density=dark?.092:.028;
  // No edits in view, near player, or in stable arch zones. Only unloaded/behind chunks shift.
  if(elapsed-lastShift>48){lastShift=elapsed;const bx=Math.floor(x/K)-Math.round(-Math.sin(yaw)*4),bz=Math.floor(z/K)-Math.round(-Math.cos(yaw)*4),k=`${bx},${bz}`;if(l0Type(bx,bz)!=='arches'){revisions.set(k,(revisions.get(k)||0)+1);chunks.delete(k);}}
  return c.type;
 }
 function map(ctx,px,pz,cx,cy,scale,range){ctx.save();ctx.translate(cx,cy);for(let z=Math.floor((pz-range)/K);z<=Math.floor((pz+range)/K);z++)for(let x=Math.floor((px-range)/K);x<=Math.floor((px+range)/K);x++){const c=getChunk(x,z);ctx.fillStyle=c.type==='red'?'#774432':c.type==='blackout'?'#342f23':'#b1a374';ctx.fillRect((c.ox-px)*scale,(c.oz-pz)*scale,K*scale,K*scale);ctx.fillStyle='#564d32';for(const w of [...c.walls,...c.pillars,...c.furniture])ctx.fillRect((w.x-w.w/2-px)*scale,(w.z-w.d/2-pz)*scale,Math.max(w.w*scale,1),Math.max(w.d*scale,1));for(const a of c.arches)ctx.fillRect((a.x-.1-px)*scale,(a.z-a.w/2-pz)*scale,Math.max(.2*scale,1),a.w*scale);ctx.fillStyle='#16150e';for(const h of c.holes)ctx.fillRect((h.x-h.w/2-px)*scale,(h.z-h.d/2-pz)*scale,h.w*scale,h.d*scale);}ctx.restore();}
 return{scene,group,ready,ensure,update,blocked,safe,pitAt,floorAt,map,getChunk,materials:mats,landmarks:[{name:'阈界 · 黄墙回廊',x:9,z:9},{name:'拱窗长廊',x:K+3,z:9},{name:'无尽柱厅',x:9,z:K+9},{name:'深坑群',x:-K+2,z:2},{name:'熄灯区',x:2,z:-K+2},{name:'红室边缘',x:2*K+2,z:K+2}],stats:()=>({chunks:chunks.size,batches:group.children.length,instances,rebuildCount,textureUnits:renderer.capabilities.maxTextures,estimatedSamplerPeak:4})};
}
