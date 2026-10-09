import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {campTexture98} from './camp-life-materials98.js';
const up=new T.Vector3(0,1,0),va=new T.Vector3(),vb=new T.Vector3();
const profile={toilet:{w:.98,h:1,hair:0x44382d,pants:0x54432e},clerk:{w:1.06,h:1,hair:0x5b5c54,pants:0x353b3c},diner:{w:1.08,h:1.01,hair:0x2c241e,pants:0x404650},sleeper:{w:.88,h:.97,hair:0x4e3028,pants:0x354454},fireElder:{w:1.0,h:1.01,hair:0x87847c,pants:0x4a4440},fireYoung:{w:.86,h:.95,hair:0x211f20,pants:0x4d4540},fireWorker:{w:1.10,h:1.03,hair:0x34352f,pants:0x45483b}};
const mesh=(p,g,m,pos=[0,0,0])=>{const o=new T.Mesh(g,m);o.position.fromArray(pos);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
const lambert=(map,color=0xffffff)=>new T.MeshLambertMaterial({map,color,flatShading:true,emissive:map?0xffffff:0,emissiveMap:map,emissiveIntensity:.035});
function loft(rows,n=8){const ps=[],uv=[],ind=[];rows.forEach(([y,rx,rz,z=0],i)=>{for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;ps.push(Math.sin(a)*rx,y,z+Math.cos(a)*rz);uv.push((Math.sin(a)+1)*.5,i/(rows.length-1));if(i&&j) {const k=i*(n+1)+j;ind.push(k,k-1,k-n-2,k,k-n-2,k-n-1);}}});for(const [row,flip] of [[0,false],[rows.length-1,true]]){const b=row*(n+1);for(let j=1;j<n-1;j++)ind.push(b,b+(flip?j:j+1),b+(flip?j+1:j));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;}
function headGeometry(){
 // Connected facial landmarks: jaw, mouth, nose tip, eye ridge and forehead; skull closes behind them.
 const ys=[0,.042,.095,.145,.181,.244,.294],xs=[.075,.094,.105,.108,.106,.088,.035],zs=[.072,.094,.102,.097,.094,.069,.014],imageY=[.914,.776,.630,.467,.363,.163,.035],p=[],uv=[],ix=[];
 for(let r=0;r<7;r++)for(let c=0;c<5;c++){const f=(c-2)/2;let z=zs[r]-(Math.abs(f)**1.6)*.035;if(c===2&&r===2)z+=.042;if(c===2&&r===3)z+=.012;p.push(f*xs[r],ys[r],z);uv.push(.5+f*xs[r]/.135*.35,1-imageY[r]);}
 for(let r=0;r<6;r++)for(let c=0;c<4;c++){const k=r*5+c;ix.push(k,k+1,k+5,k+1,k+6,k+5);}
 // Back of skull: the face rim is duplicated with its own wrap-around UVs, then one low-poly ring bulges out to the
 // occiput. Wound outward (the old single fan was wound inward, so back-face culling left the back of the head hollow);
 // the crown/occiput takes the hair material, the nape and under-jaw stay skin.
 const edge=[0,5,10,15,20,25,30,31,32,33,34,29,24,19,14,9,4,3,2,1],E=edge.length,apex=[0,.158,-.103],C=[0,.15,-.012];
 const wrap=q=>[.5+Math.atan2(q[0],-(q[2]-C[2]))/Math.PI*.5,q[1]/.3];
 const rim=p.length/3;for(const e of edge){const q=p.slice(e*3,e*3+3);p.push(...q);uv.push(...wrap(q));}
 const ring=p.length/3;for(const e of edge){const v=p.slice(e*3,e*3+3),q=v.map((x,a)=>x+(apex[a]-x)*.5),d=w=>Math.hypot(w[0]-C[0],w[1]-C[1],w[2]-C[2]),k=(d(v)*.5+d(apex)*.5)*1.04/d(q),m=q.map((x,a)=>C[a]+(x-C[a])*k);p.push(...m);uv.push(...wrap(m));}
 const back=p.length/3;p.push(...apex);uv.push(...wrap(apex));
 const skinT=[],hairT=[],put=(...t)=>{let y=0,z=0;for(const j of t){y+=p[j*3+1];z+=p[j*3+2];}(y/3>.115&&z/3<-.03?hairT:skinT).push(...t);};
 for(let i=0;i<E;i++){const a=rim+i,b=rim+(i+1)%E,ma=ring+i,mb=ring+(i+1)%E;put(a,b,ma);put(b,mb,ma);put(ma,mb,back);}
 ix.push(...skinT,...hairT);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.clearGroups();g.addGroup(0,144,0);g.addGroup(144,skinT.length,1);g.addGroup(144+skinT.length,hairT.length,2);g.computeVertexNormals();return g;
}
export function countTriangles98(root){let n=0;root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return n;}
export function createCampActor98(spec){
 const id=spec.id,p=profile[id],g=new T.Group();g.name='V98 adult / '+id;const motion=new T.Group();g.add(motion);const torso=new T.Group();motion.add(torso);const faceOpen=campTexture98(id+'/face'),faceClosed=campTexture98(id+'/face-closed');
 const skin=lambert(campTexture98(id+'/skin')),shirt=lambert(campTexture98(id+'/shirt')),fabric=lambert(campTexture98(id+'/fabric')),pants=lambert(campTexture98(id+'/fabric'),p.pants),shoes=lambert(campTexture98(id+'/hair'),0x494640),hair=lambert(campTexture98(id+'/hair'),0xbdb6ab),face=lambert(id==='sleeper'?faceClosed:faceOpen);
 const pelvis=mesh(motion,loft([[-.002,.147,.10],[.13,.151,.105]],6),pants);const bodyGeo=loft([[.1,.145,.108],[.29,.167*p.w,.112],[.48,.224*p.w,.105],[.54,.099,.077]],8);const buv=bodyGeo.attributes.uv,bp=bodyGeo.attributes.position,front=[],back=[];for(let k=0;k<bp.count;k++)buv.setXY(k,.5+bp.getX(k)/(.224*p.w)*.48,(bp.getY(k)-.10)/.44);for(let k=0;k<bodyGeo.index.count;k+=3){const tri=Array.from(bodyGeo.index.array.slice(k,k+3));(tri.reduce((v,j)=>v+bp.getZ(j),0)>.025?front:back).push(...tri);}bodyGeo.setIndex(front.concat(back));bodyGeo.clearGroups();bodyGeo.addGroup(0,front.length,0);bodyGeo.addGroup(front.length,back.length,1);const body=mesh(torso,bodyGeo,[shirt,fabric]);
 mesh(torso,new T.CylinderGeometry(.054,.064,.074,6),skin,[0,.545,0]);const head=new T.Group();head.position.set(0,.57,0);head.scale.x=.96+(p.w-.86)*.35;torso.add(head);mesh(head,headGeometry(),[face,skin,hair]);
 const scalp=loft([[.174,.109,.094,-.032],[.257,.088,.083,-.023],[.302,.037,.041,-.01]],8);const hp=mesh(head,scalp,hair); // Open the front hairline, leaving forehead and receding temples readable.
 const idx=scalp.index.array,keep=[];for(let n=0;n<idx.length;n+=3){const a=idx[n],b=idx[n+1],c=idx[n+2],pos=scalp.attributes.position;if((pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/3<.035||Math.min(pos.getY(a),pos.getY(b),pos.getY(c))>.257)keep.push(a,b,c);}scalp.setIndex(keep);scalp.computeVertexNormals();
 if(id==='sleeper'||id==='fireYoung')mesh(head,loft([[-.035,.103,.077,-.045],[.18,.116,.10,-.025]],8),hair).scale.z=1.13;
 for(const s of [-1,1]){const ear=mesh(head,new T.OctahedronGeometry(.028,0),skin,[s*.111,.116,.009]);ear.scale.set(.35,1,.6);}
 const limbs={},hands={};for(const s of [-1,1]){const key=s===-1?'L':'R';for(const [part,mat,r1,r2,n] of [['upper',fabric,.066,.09,5],['fore',id==='toilet'?skin:fabric,.046,.061,5],['thigh',pants,.082,.104,6],['shin',pants,.047,.069,6]]){const o=mesh(motion,new T.CylinderGeometry(r1,r2,1,n,1,false),mat);limbs[part+key]=o;}limbs['knee'+key]=mesh(motion,new T.OctahedronGeometry(.077,0),pants);limbs['elbow'+key]=mesh(motion,new T.OctahedronGeometry(.058,0),fabric);const hand=new T.Group();motion.add(hand);hands[key]=hand;mesh(hand,new T.BoxGeometry(.054,.086,.038),skin,[0,-.015,0]);for(let f=0;f<3;f++){const finger=mesh(hand,new T.BoxGeometry(.012,.039,.018),skin,[(f-1)*.015,-.066,.01]);finger.rotation.x=-.55;}const thumb=mesh(hand,new T.BoxGeometry(.018,.047,.021),skin,[s*.034,-.02,.018]);thumb.rotation.z=-s*.48;const foot=mesh(motion,new T.BoxGeometry(.116,.085,.245),shoes);limbs['foot'+key]=foot;}
 for(const hand of Object.values(hands)){const parts=[];for(const part of hand.children){part.updateMatrix();parts.push(part.geometry.clone().applyMatrix4(part.matrix));part.geometry.dispose();}hand.clear();mesh(hand,mergeGeometries(parts,false),skin);parts.forEach(g=>g.dispose());}
 const sockets={left:hands.L,right:hands.R,head};let blinkCount=0,lastBlink=false,lastTick=-1;const seed=spec.seed??id.split('').reduce((n,c)=>n+c.charCodeAt(0),0);let extraMotion=null;
 function segment(o,a,b){va.fromArray(a);vb.fromArray(b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.y=vb.length();o.quaternion.setFromUnitVectors(up,vb.normalize());}
 function update(time,gesture={}){const tick=Math.floor(time*15);if(tick===lastTick&&!gesture.force)return;lastTick=tick;const t=tick/15,breath=Math.sin(t*(id==='sleeper'?1.36:1.67)+seed)*.004,seat=spec.seat;
  const squat=spec.pose==='squat',sleep=spec.pose==='sleep';motion.position.y=seat;torso.position.y=breath;torso.position.x=sleep?-.05:0;torso.rotation.x=squat?.24:spec.pose==='warm'?.10:spec.pose==='dine'?.13:.035;body.scale.z=1+breath*1.3;
  head.rotation.set(squat?.18:spec.pose==='dine'?.2:.035,Math.round(Math.sin(t*.41+seed)*2)*.027,Math.sin(t*.26+seed)*.014);
  const period=3.4+(seed%19)*.11,phase=(t+seed*.217)%period,closed=sleep||phase<.2||((seed%3===0)&&phase>.31&&phase<.44);face.map=closed?faceClosed:faceOpen;if(closed&&!lastBlink)blinkCount++;lastBlink=closed;
  for(const s of [-1,1]){const k=s===-1?'L':'R',hip=[s*.105,.085,0],knee=sleep?[s*.06,-.26,.16]:squat?[s*.22,.23,.36]:[s*.145,-.01,.36],ankle=sleep?[s*.05,-.64,.12]:squat?[s*.21,-seat+.072,.17]:[s*.155,-seat+.074,.40];segment(limbs['thigh'+k],hip,knee);segment(limbs['shin'+k],knee,ankle);limbs['knee'+k].position.fromArray(knee);limbs['foot'+k].position.set(ankle[0],sleep?-.70:-seat+.048,ankle[2]+.075);limbs['foot'+k].rotation.y=s*.10;
   let shoulder=[s*.208*p.w,.465+breath,.055],elbow=[s*.22,.215,.195],hand=[s*.145,.15,.34];
   if(squat){shoulder=[s*.211,.452+breath,.12];elbow=[s*.225,.18,.30];hand=[s*.18,.025,.41];}
   if(spec.pose==='warm'){elbow=[s*.255,.27,.245];hand=[s*.15,.43+Math.sin(t*.73+seed+s)*.009,.52];}
   if(spec.pose==='smoke'&&s===1){const inhale=(Math.sin(t*.61+seed)+1)/2,raise=Math.max(0,Math.min(1,(inhale-.28)/.42));elbow=[.23-.04*raise,.21+.34*raise,.23+.06*raise];hand=[.15-.104*raise,.14+.495*raise,.34-.250*raise];}
   if(gesture.hand&&s===-1){hand=gesture.hand;elbow=[-.20,.27,.27];}
   if(sleep){shoulder=[s===1?.045:-.20,.46,.025];elbow=[s===1?.05:-.20,.27,.19];hand=[s*.10,.48,.20];}
   segment(limbs['upper'+k],shoulder,elbow);const foreLength=Math.hypot(...hand.map((v,n)=>v-elbow[n]));const wrist=hand.map((v,n)=>v-(v-elbow[n])/foreLength*.045);segment(limbs['fore'+k],elbow,wrist);limbs['elbow'+k].position.fromArray(elbow);hands[k].position.fromArray(hand);hands[k].rotation.set(spec.pose==='warm'?-1.3:squat?-.2:-.7,0,s*.15);
  }
  if(sleep){motion.position.y=0;motion.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,-1,0),new T.Vector3(0,0,-1),new T.Vector3(1,0,0)));torso.rotation.x=.10;head.rotation.y=.20;}
  if(extraMotion)extraMotion(t);
 }
 update(0);g.position.fromArray(spec.position);g.rotation.y=spec.yaw;g.userData.role=id;
 return{group:g,motion,head,torso,hands,sockets,update,setExtra(fn){extraMotion=fn;},diagnostics(){return{id,triangles:countTriangles98(g),blinkCount,closed:lastBlink,breathing:body.scale.z,faceSize:faceOpen.image.width};}};
}
