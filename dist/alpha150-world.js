import {RADIO_FINISHES,RADIO_PLACEMENT150} from './alpha150-radio.js';
import {ALPHA150,ALPHA_ZONES150,ALPHA_ROOMS150,ALPHA_WALLS150,alphaBlocked150,alphaHead150,alphaSafe150,zoneAt150,describeChunk150} from './alpha150-plan.js?v=150s3r';
import {createAlphaStream150} from './alpha150-stream.js?v=150s3r';
// Stage 2 architectural finishes; authored photographic maps and Cycles room maps arrive in stages 3/5.
const COLORS={floor:0x777970,ceiling:0xb8b6a4,wall:0xb8b6a4,skirt:0x4a5b51,gate:0x536962,fixture:0x626963,diffuser:0xe6e1bd};
export function createAlphaMaterials150(T){
 const finishes=new Map(),rooms=new Map();
 function ensureRoom(id){rooms.set(id,(rooms.get(id)||0)+1);}
 function releaseRoom(id){const n=(rooms.get(id)||1)-1;if(n)rooms.set(id,n);else rooms.delete(id);}
 function materialFor(key,roomId){let rec=finishes.get(key);if(!rec){const radio=key.startsWith('radio:');const material=radio?new T.MeshStandardMaterial({color:RADIO_FINISHES[key.slice(6)],roughness:.84,metalness:key==='radio:rail'?.35:.03}):new T.MeshLambertMaterial({color:COLORS[key]||0xb7b3a4});if(key==='radio:enamel'&&typeof document!=='undefined'){const loader=new T.TextureLoader();material.color.setHex(0xffffff);for(const [slot,name] of [['map','rack-enamel.webp'],['normalMap','rack-enamel-normal.webp']]){const tex=loader.load(new URL('./assets/alpha150/'+name,import.meta.url).href);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);if(slot==='map')tex.colorSpace=T.SRGBColorSpace;material[slot]=tex;}material.normalScale.set(.32,.32);}if(key==='diffuser'||key==='radio:tube'){material.emissive.setHex(0xf3f1df);material.emissiveIntensity=.7;}rec={material,refs:0};finishes.set(key,rec);}return rec.material;}
 function acquire(keys,roomIds){for(const key of keys){materialFor(key);finishes.get(key).refs++;}roomIds.forEach(ensureRoom);}
 function release(keys,roomIds){roomIds.forEach(releaseRoom);for(const key of keys){const rec=finishes.get(key);if(rec&&--rec.refs<=0){for(const k of ['map','normalMap','roughnessMap','lightMap'])rec.material[k]?.dispose();rec.material.dispose();finishes.delete(key);}}}
 function dispose(){for(const rec of finishes.values()){for(const k of ['map','normalMap','roughnessMap','lightMap'])rec.material[k]?.dispose();rec.material.dispose();}finishes.clear();rooms.clear();}
 return{materialFor,ensureRoom,releaseRoom,acquire,release,dispose,stats:()=>({materials:finishes.size,rooms:rooms.size,roomRefs:[...rooms.values()].reduce((a,b)=>a+b,0)})};
}
// A chamfered box has real bevel faces. UVs are metre-scaled and remain stable across chunk seams.
export function appendBox150(out,b,bevel=.014){
 const h=[b.w/2,b.h/2,b.d/2],c=[b.x,b.y,b.z],v=Math.min(bevel,...h.map(x=>x*.35)),a=h.map(x=>x-v);
 const emit=(p,q,r,n)=>{const u=q.map((x,i)=>x-p[i]),w=r.map((x,i)=>x-p[i]),cross=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];if(cross.reduce((s,x,i)=>s+x*n[i],0)<0)[q,r]=[r,q];const len=Math.hypot(...n),normal=n.map(x=>x/len),major=Math.abs(normal[1])>.6?1:Math.abs(normal[0])>.6?0:2;for(const p0 of [p,q,r]){const p=p0.map((x,i)=>x+c[i]);out.position.push(...p);out.normal.push(...normal);out.uv.push(major===0?p[2]:p[0],major===1?p[2]:p[1]);}};
 const quad=(ps,n)=>{emit(ps[0],ps[1],ps[2],n);emit(ps[0],ps[2],ps[3],n);};
 for(let k=0;k<3;k++)for(const s of [-1,1]){const u=(k+1)%3,w=(k+2)%3,n=[0,0,0];n[k]=s;quad([[-1,-1],[1,-1],[1,1],[-1,1]].map(([su,sw])=>{const p=[0,0,0];p[k]=s*h[k];p[u]=su*a[u];p[w]=sw*a[w];return p;}),n);}
 if(!v)return;
 for(let k=0;k<3;k++){const u=(k+1)%3,w=(k+2)%3;for(const su of [-1,1])for(const sw of [-1,1]){const n=[0,0,0];n[u]=su;n[w]=sw;quad([[-1,0],[1,0],[1,1],[-1,1]].map(([sk,edge])=>{const p=[0,0,0];p[k]=sk*a[k];p[u]=su*(edge?a[u]:h[u]);p[w]=sw*(edge?h[w]:a[w]);return p;}),n);}}
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){const s=[x,y,z],p=[0,1,2].map(k=>a.map((v,i)=>s[i]*(i===k?h[i]:v)));emit(...p,s);}
}
export function createAlphaWorld150(T){
 const scene=new T.Scene();scene.name='M.E.G. Alpha · independent streamed interior';scene.userData.noAtmosphere=true;
 scene.background=new T.Color(0x242a28);scene.fog=new T.FogExp2(0x373e38,.019);
 const materials=createAlphaMaterials150(T);
 // Temporary readable construction lighting, never presented as a completed static bake.
 scene.add(new T.HemisphereLight(0xfff2ce,0x44554b,1.25));
 const fills=Array.from({length:3},()=>{const p=new T.PointLight(0xffe5b4,18,20,2);p.castShadow=false;scene.add(p);return p;});
 let worker=null,serial=0,lastX=ALPHA150.entry.x,lastZ=ALPHA150.entry.z,disposed=false;
 const jobs=new Map();
 try{worker=new Worker(new URL('./alpha150-worker.js?v=150s3r',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{const job=jobs.get(data.job);if(!job)return;jobs.delete(data.job);data.error?job.reject(Error(data.error)):job.resolve(data.desc);};
  worker.onerror=()=>{worker?.terminate();worker=null;for(const job of jobs.values()){try{job.resolve(describeChunk150(job.id));}catch(e){job.reject(e);}}jobs.clear();};
 }catch{}
 const prepare=(id,token)=>new Promise((resolve,reject)=>{
  if(!worker){setTimeout(()=>{if(token.cancelled){reject(Error('cancelled'));return;}try{resolve(describeChunk150(id));}catch(e){reject(e);}},0);return;}
  const job=++serial;jobs.set(job,{id,resolve,reject});token.abort=()=>{jobs.delete(job);worker?.postMessage({cancel:job});reject(Error('cancelled'));};worker.postMessage({job,id});
 });
 function release(item){scene.remove(item.group);item.group.traverse(o=>{o.geometry?.dispose();if(o.userData.ownedMaterial){o.material.map?.dispose();o.material.dispose();}});materials.release(item.keys,item.rooms);}
 function* create(desc){const group=new T.Group();group.name='alpha:'+desc.id;const keys=[...new Set([...desc.boxes.map(b=>b.kind),...(desc.props||[]).map(p=>'radio:'+p.mat),...(desc.signs.length?['skirt']:[])])];materials.acquire(keys,desc.rooms);const item={group,keys,rooms:desc.rooms,chunk:desc.chunk};let done=false;
  try{const arrays=new Map();let n=0;
   for(const b of desc.boxes){let out=arrays.get(b.kind);if(!out){out={position:[],normal:[],uv:[]};arrays.set(b.kind,out);}appendBox150(out,b,['wall','gate','fixture'].includes(b.kind)?.014:0);if(++n%8===0)yield;}
   for(const p of desc.props||[]){const key='radio:'+p.mat;let out=arrays.get(key);if(!out){out={position:[],normal:[],uv:[]};arrays.set(key,out);}appendRadioPart150(T,out,p);yield;}
   for(const [kind,a]of arrays){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(a.normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(a.uv,2));g.computeBoundingSphere();const mesh=new T.Mesh(g,materials.materialFor(kind));mesh.castShadow=!['diffuser','fixture','radio:tube'].includes(kind);mesh.receiveShadow=true;mesh.userData.alphaKind=kind;group.add(mesh);yield;}
   for(const sign of desc.signs){if(typeof document==='undefined')continue;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#273b36';ctx.fillRect(0,0,512,128);ctx.fillStyle='#eee4bf';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText(sign.text,256,59);ctx.font='18px monospace';ctx.fillText('M.E.G. ALPHA  /  '+sign.zone.toUpperCase(),256,99);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshLambertMaterial({map:tex,side:T.DoubleSide});const panel=new T.Mesh(new T.BoxGeometry(3.6,.9,.08),mat);panel.position.set(sign.x+1.5,sign.y,sign.z);panel.userData.ownedMaterial=true;group.add(panel);for(const dx of [-1.6,1.6]){const pole=new T.Mesh(new T.BoxGeometry(.065,2.5,.065),materials.materialFor('skirt'));pole.position.set(sign.x+1.5+dx,1.25,sign.z);group.add(pole);}yield;}
   scene.add(group);done=true;return item;
  }finally{if(!done)release(item);}
 }
 const stream=createAlphaStream150({prepare,create,release});
 const entry={...ALPHA150.entry};
 function update(dt,x,z){stream.plan(x,z,x-lastX,z-lastZ);stream.tick();lastX=x;lastZ=z;const gx=Math.round(x/12)*12,gz=Math.round(z/12)*12;fills.forEach((p,i)=>p.position.set(gx+(i-1)*12,3.1,gz));return'alpha:'+(zoneAt150(x,z)?.id||'concourse');}
 function map(ctx,ox,oz,cx,cy,scale,radius){ctx.save();const sx=x=>cx+(x-ox)*scale,sz=z=>cy+(z-oz)*scale;ctx.fillStyle='#343b37';ctx.fillRect(sx(0),sz(0),ALPHA150.width*scale,ALPHA150.depth*scale);for(const z of ALPHA_ZONES150){ctx.fillStyle=z.color;ctx.globalAlpha=.42;ctx.fillRect(sx(z.x),sz(z.z),z.w*scale,z.d*scale);ctx.globalAlpha=1;if(scale>.35){ctx.fillStyle='#ece9d5';ctx.font='10px sans-serif';ctx.fillText(z.name,sx(z.x+2),sz(z.z+2)+11);}}ctx.strokeStyle='#c6c9b7';ctx.lineWidth=Math.max(1,.2*scale);for(const w of ALPHA_WALLS150)if(w.y<1.8){ctx.fillStyle='#c6c9b7';ctx.fillRect(sx(w.x-w.w/2),sz(w.z-w.d/2),Math.max(1,w.w*scale),Math.max(1,w.d*scale));}ctx.strokeStyle='#e5dec1';ctx.lineWidth=2;ctx.strokeRect(sx(0),sz(0),ALPHA150.width*scale,ALPHA150.depth*scale);ctx.fillStyle='#71c79c';ctx.fillRect(sx(0)-2,sz(182),4,6*scale);ctx.restore();}
 return{scene,entry,ready:Promise.resolve(),materials,update,map,ensure:(x,z)=>stream.ensure(x,z),safe:alphaSafe150,blocked:(x,z,r=.25)=>alphaBlocked150(x,z,r)||!stream.isReady(x,z,r),headAt:alphaHead150,floorAt:()=>0,supportAt:(x,z,maxY=.15)=>maxY>=0?0:-Infinity,landingAt:(x,z,from,to)=>from>=0&&to<=0?0:null,
  nearDoor:(x,z)=>x<3&&Math.abs(z-ALPHA150.exit.z)<2.5?{alpha:true,back:true,label:'E 返回 Level 1 · Alpha 西门'}:null,
  suspend(){stream.clear();},stats:()=>({...stream.stats(),...materials.stats(),worker:!!worker}),
  dispose(){if(disposed)return;disposed=true;stream.dispose();worker?.terminate();worker=null;for(const j of jobs.values())j.reject(Error('Alpha disposed'));jobs.clear();materials.dispose();scene.clear();}};
}

// A single small primitive per generator step, merged into one mesh per finish afterward.
export function appendRadioPart150(T,out,p){
 let g;
 if(p.shape==='box'){
  const a={position:[],normal:[],uv:[]};appendBox150(a,{...p,x:0,y:0,z:0},.006);g=new T.BufferGeometry();for(const [k,n]of [['position',3],['normal',3],['uv',2]])g.setAttribute(k,new T.Float32BufferAttribute(a[k],n));
 }else if(p.shape==='disc'){g=new T.CylinderGeometry(p.r,p.r,p.depth,12);g.rotateX(Math.PI/2);}
 else {const a=new T.Vector3(...p.a),b=new T.Vector3(...p.b);g=new T.CylinderGeometry(p.r,p.r,a.distanceTo(b),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());}
 if(p.shape!=='cable'){g.rotateZ(p.rz||0);g.translate(p.x,p.y,p.z);}
 g.translate(RADIO_PLACEMENT150.x,0,RADIO_PLACEMENT150.z);
 const count=g.index?.count||g.attributes.position.count;
 for(let i=0;i<count;i++){const j=g.index?g.index.getX(i):i;for(const k of ['position','normal','uv']){const a=g.attributes[k];for(let n=0;n<a.itemSize;n++)out[k].push(a.array[j*a.itemSize+n]);}}
 g.dispose();
}
