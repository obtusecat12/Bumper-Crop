// V118-L11 (parallel): Hope Street kiosk keeper + passers-by. PS1-era low-poly people in the style of
// "The Imitator": flat-shaded lofted limbs, photo-sourced face/clothes on one 1024 atlas (nearest
// filtering), rigid single-bone skinning, eyelid quads that close on a lid bone, idle breathing,
// head turns and weight shifts. Animation runs from onBeforeRender, so no main-loop hook is needed.
import * as T from './vendor/three.module.min.js';
import {h118Texture,H118_PROPS} from './hopest118-build.js?v=118h';
const C={keeper_face:[0,.75,.25,.25],keeper_closed:[0,.5,.25,.25],keeper_eyes:[[.338,.492],[.655,.492]],keeper_torso:[0,.25,.25,.25],keeper_sleeve:[.125,0,.125,.125],keeper_hairback:[0,.125,.125,.125],keeper_pants:[.125,.125,.125,.125],keeper_skin:[0,.0625,.0625,.0625],keeper_shoe:[.0625,.0625,.0625,.0625],
woman_face:[.25,.75,.25,.25],woman_closed:[.25,.5,.25,.25],woman_eyes:[[.327,.534],[.673,.534]],woman_torso:[.25,.25,.25,.25],woman_sleeve:[.375,0,.125,.125],woman_hairback:[.25,.125,.125,.125],woman_pants:[.375,.125,.125,.125],woman_skin:[.25,.0625,.0625,.0625],woman_shoe:[.3125,.0625,.0625,.0625],
elder_face:[.5,.75,.25,.25],elder_closed:[.5,.5,.25,.25],elder_eyes:[[.321,.444],[.682,.444]],elder_torso:[.5,.25,.25,.25],elder_sleeve:[.625,0,.125,.125],elder_hairback:[.5,.125,.125,.125],elder_pants:[.625,.125,.125,.125],elder_skin:[.5,.0625,.0625,.0625],elder_shoe:[.5625,.0625,.0625,.0625],
young_face:[.75,.75,.25,.25],young_closed:[.75,.5,.25,.25],young_eyes:[[.3125,.5255],[.684,.5255]],young_torso:[.75,.25,.25,.25],young_sleeve:[.875,0,.125,.125],young_hairback:[.75,.125,.125,.125],young_pants:[.875,.125,.125,.125],young_skin:[.75,.0625,.0625,.0625],young_shoe:[.8125,.0625,.0625,.0625]};
const BONES=['root','hips','chest','neck','head','lidL','lidR','shL','elL','shR','elR','thL','knL','thR','knR'],PARENT=[-1,0,1,2,3,4,4,2,7,2,9,1,11,1,13];
const B=Object.fromEntries(BONES.map((n,i)=>[n,i]));
const inset=(r,e=.8/1024)=>[r[0]+e,r[1]+e,r[2]-2*e,r[3]-2*e];
const rectUV=(r,u,v)=>[r[0]+Math.min(1,Math.max(0,u))*r[2],r[1]+Math.min(1,Math.max(0,v))*r[3]];
// rows: [y, rx, rz, zc]; front(x,y,z)->[u,v] in 0..1, back likewise; bone(y)->index.
function loft(out,rows,segs,{front,back,bone,off=[0,0,0],cap=[true,true],frontRect,backRect}){
 const P=(i,j)=>{const[y,rx,rz,zc=0]=rows[i],a=j/segs*Math.PI*2;return[Math.sin(a)*rx,y,zc+Math.cos(a)*rz];};
 const tris=[];
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<segs;j++){const bl=P(i,j),br=P(i,j+1),tr=P(i+1,j+1),tl=P(i+1,j);tris.push([bl,br,tr],[bl,tr,tl]);}
 const capAt=(i,dir)=>{const[y,,,zc=0]=rows[i],c=[0,y,zc];for(let j=0;j<segs;j++)tris.push(dir>0?[c,P(i,j),P(i,j+1)]:[c,P(i,j+1),P(i,j)]);};
 if(cap[0])capAt(0,-1);if(cap[1])capAt(rows.length-1,1);
 const ymid=(rows[0][0]+rows.at(-1)[0])/2,zmid=rows[Math.floor(rows.length/2)][3]||0;
 for(let t of tris){
  const e1=t[1].map((v,k)=>v-t[0][k]),e2=t[2].map((v,k)=>v-t[0][k]);let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const cen=[0,1,2].map(k=>(t[0][k]+t[1][k]+t[2][k])/3),out_=[cen[0],cen[1]-ymid,cen[2]-zmid];
  if(n[0]*out_[0]+n[1]*out_[1]+n[2]*out_[2]<0){t=[t[0],t[2],t[1]];n=n.map(v=>-v);}
  const len=Math.hypot(...n)||1,isFront=n[2]/len>-.25,map=isFront?front:back,rect=inset(isFront?frontRect:backRect);
  for(const p of t){out.pos.push(p[0]+off[0],p[1]+off[1],p[2]+off[2]);out.uv.push(...rectUV(rect,...map(p[0],p[1],p[2])));out.bone.push(bone(p[1]+off[1]));}
 }
}
function quad(out,c,w,h,rect,bone,{tilt=0}={}){const r=inset(rect),x0=c[0]-w/2,x1=c[0]+w/2,y0=c[1]-h,y1=c[1],z=c[2];
 const V=[[x0,y0,z+tilt,r[0],r[1]],[x1,y0,z+tilt,r[0]+r[2],r[1]],[x1,y1,z,r[0]+r[2],r[1]+r[3]],[x0,y0,z+tilt,r[0],r[1]],[x1,y1,z,r[0]+r[2],r[1]+r[3]],[x0,y1,z,r[0],r[1]+r[3]]];
 for(const v of V){out.pos.push(v[0],v[1],v[2]);out.uv.push(v[3],v[4]);out.bone.push(bone);}}
const STYLE={keeper:{s:1.0,w:1.1,bottom:.86,sleeveSkin:false},woman:{s:.95,w:.9,bottom:.56,sleeveSkin:false},elder:{s:.98,w:1.02,bottom:.9,sleeveSkin:true},young:{s:1.02,w:.95,bottom:.7,sleeveSkin:false}};
function bodyGeometry(id){
 const st=STYLE[id],k=n=>C[id+'_'+n],o={pos:[],uv:[],bone:[]},W=st.w;
 const HEAD=1.50,HH=.245,FW=.19;
 // head: front projection of the cropped face photo, back of skull takes the hair tile
 const hr=[[0,.045,.05,.012],[.03,.062,.075,.004],[.07,.074,.092,0],[.11,.08,.1,0],[.15,.083,.1,0],[.19,.08,.095,-.005],[.22,.068,.08,-.01],[.238,.042,.052,-.012],[.247,.012,.016,-.012]];
 loft(o,hr,10,{off:[0,HEAD,0],front:(x,y)=>[.5+x/FW,y/HH],back:(x,y)=>[.5-x/FW,y/HH],frontRect:k('face'),backRect:k('hairback'),bone:()=>B.head});
 // nose wedge
 {const ry=.095,zf=.1;const tip=[0,HEAD+ry,zf+.024],l=[-.016,HEAD+ry-.012,zf-.004],r=[.016,HEAD+ry-.012,zf-.004],t=[0,HEAD+ry+.035,zf-.002],rc=inset(k('face'));
  for(const tri of[[l,tip,t],[tip,r,t],[l,r,tip]])for(const p of tri){o.pos.push(...p);o.uv.push(...rectUV(rc,.5+p[0]/FW,(p[1]-HEAD)/HH));o.bone.push(B.head);}}
 // eyelids (closed-eye frame), top edge on the lid bone
 const lids=[];for(const[i,[ex,ey]]of k('eyes').entries()){const x=(ex-.5)*FW,y=HEAD+(1-ey)*HH,rx=.081,rz=.1,z=rz*Math.sqrt(Math.max(0,1-(x/rx)**2))+.004,cl=k('closed'),lw=.04,lh=.02;
  const r=[cl[0]+(ex-lw/FW/2)*cl[2],cl[1]+(1-ey-lh/HH*.45)*cl[3],lw/FW*cl[2],lh/HH*cl[3]];quad(o,[x,y+lh*.55,z],lw,lh,r,i?B.lidR:B.lidL,{tilt:.004});lids.push([x,y+lh*.55,z]);}
 // neck
 loft(o,[[1.38,.05,.05],[1.53,.045,.045,-.005]],6,{front:()=>[.5,.5],back:()=>[.5,.5],frontRect:k('skin'),backRect:k('skin'),bone:()=>B.neck,cap:[false,false]});
 // torso / coat
 const yb=st.bottom,tr=[[yb,.17*W,.11],[.95,.165*W,.105],[1.1,.158*W,.1],[1.28,.172*W,.108],[1.38,.19*W,.11],[1.44,.13*W,.085],[1.47,.06,.05]];
 if(yb<.8)tr.splice(0,1,[yb,.215*W,.15],[.78,.19*W,.125]);
 const ty=y=>(y-yb)/(1.47-yb);
 loft(o,tr,8,{front:(x,y)=>[.5+x/(.4*W),ty(y)],back:(x,y)=>[.5-x/(.4*W),ty(y)*.7+.15],frontRect:k('torso'),backRect:k('sleeve'),bone:y=>y<1.02?B.hips:B.chest});
 // arms
 for(const s of[1,-1]){const sh=s>0?B.shL:B.shR,el=s>0?B.elL:B.elR,x0=s*(.205*W);
  loft(o,[[1.41,.052,.055],[1.27,.05,.05],[1.12,.045,.046]],6,{off:[x0,0,0],front:(x,y)=>[.5+x/.12,(y-1.1)/.33],back:(x,y)=>[.5-x/.12,(y-1.1)/.33],frontRect:k('sleeve'),backRect:k('sleeve'),bone:()=>sh});
  const fr=st.sleeveSkin?k('skin'):k('sleeve');
  loft(o,[[1.13,.044,.045],[.98,.04,.041],[.86,.035,.036]],6,{off:[x0,0,0],front:(x,y)=>[.5+x/.1,(y-.84)/.3],back:(x,y)=>[.5-x/.1,(y-.84)/.3],frontRect:fr,backRect:fr,bone:()=>el});
  loft(o,[[.865,.03,.02],[.80,.034,.022],[.75,.026,.018]],5,{off:[x0,0,.005],front:()=>[.5,.5],back:()=>[.5,.5],frontRect:k('skin'),backRect:k('skin'),bone:()=>el});
 }
 // legs + shoes
 for(const s of[1,-1]){const th=s>0?B.thL:B.thR,kn=s>0?B.knL:B.knR,x0=s*.088*W;
  loft(o,[[.97,.075,.08],[.75,.063,.068],[.5,.052,.056]],6,{off:[x0,0,0],front:(x,y)=>[.5+x/.16,(y-.5)/.47],back:(x,y)=>[.5-x/.16,(y-.5)/.47],frontRect:k('pants'),backRect:k('pants'),bone:()=>th,cap:[false,true]});
  loft(o,[[.51,.052,.056],[.25,.045,.047],[.08,.04,.042]],6,{off:[x0,0,0],front:(x,y)=>[.5+x/.12,(y-.08)/.43],back:(x,y)=>[.5-x/.12,(y-.08)/.43],frontRect:k('pants'),backRect:k('pants'),bone:()=>kn,cap:[false,false]});
  loft(o,[[0,.048,.12,.04],[.05,.05,.12,.04],[.10,.044,.06,.0]],5,{off:[x0,0,0],front:()=>[.5,.5],back:()=>[.5,.5],frontRect:k('shoe'),backRect:k('shoe'),bone:()=>kn});
 }
 const g=new T.BufferGeometry(),n=o.bone.length,si=new Uint16Array(n*4),sw=new Float32Array(n*4);for(let i=0;i<n;i++){si[i*4]=o.bone[i];sw[i*4]=1;}
 g.setAttribute('position',new T.Float32BufferAttribute(o.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(o.uv,2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));g.computeVertexNormals();
 return{geometry:g,lids,W};
}
function skeleton(id,lids,W){
 const at={root:[0,0,0],hips:[0,.97,0],chest:[0,1.05,0],neck:[0,1.42,0],head:[0,1.5,0],lidL:lids[0],lidR:lids[1],shL:[.205*W,1.41,0],elL:[.205*W,1.125,0],shR:[-.205*W,1.41,0],elR:[-.205*W,1.125,0],thL:[.088*W,.95,0],knL:[.088*W,.5,0],thR:[-.088*W,.95,0],knR:[-.088*W,.5,0]};
 const bones=BONES.map(n=>{const b=new T.Bone();b.name=id+'/'+n;return b;});
 BONES.forEach((n,i)=>{const p=at[n],q=PARENT[i]>=0?at[BONES[PARENT[i]]]:[0,0,0];bones[i].position.set(p[0]-q[0],p[1]-q[1],p[2]-q[2]);if(PARENT[i]>=0)bones[PARENT[i]].add(bones[i]);});
 return bones;
}
let chrMat=null;
function material(){if(chrMat)return chrMat;const map=h118Texture('chr',{nearest:true});map.generateMipmaps=true;chrMat=new T.MeshStandardMaterial({map,roughness:.86,metalness:0,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.05});return chrMat;}
function rnd(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// Hope-frame (un-mirrored, as authored in reference-scenes.js) placements on the podium's street face.
const FACE=2.78;
const CAST=[
 {id:'keeper',x:63.9,z:FACE+.78,y:0,face:[0,-1],pose:'counter',seed:3},
 {id:'woman',x:55.45,z:FACE-.72,y:.15,face:[0,1],pose:'atm',seed:7},
 {id:'elder',x:60.25,z:1.62,y:.15,face:[.55,-.6],pose:'read',seed:11},
 {id:'young',x:34,z:1.45,y:.15,face:[1,0],pose:'walk',seed:19,path:[33.2,57.6]},
];
export function createHope118People({toWorld,Y,angle}){
 const group=new T.Group();group.name='Hope St V118 people';const mat=material(),people=[];
 for(const c of CAST){if(globalThis.H118_SKIP&&globalThis.H118_SKIP.includes(c.id))continue;
  // CPU-skinned: an invisible SkinnedMesh is the rig, a plain flat-shaded Mesh is what renders. Robust on every
  // GPU (SwiftShader loses the context on GPU skinning) and cheap: ~2k vertices per person, only when on screen.
  const {geometry,lids,W}=bodyGeometry(c.id),bones=skeleton(c.id,lids,W),rig=new T.SkinnedMesh(geometry,mat);rig.visible=false;rig.frustumCulled=false;
  const shown=new T.BufferGeometry();shown.setAttribute('position',geometry.attributes.position.clone());shown.setAttribute('uv',geometry.attributes.uv);shown.setAttribute('normal',geometry.attributes.normal.clone());shown.computeBoundingSphere();shown.boundingSphere.radius+=.6;
  const mesh=new T.Mesh(shown,mat);mesh.name='Hope St V118 / '+c.id;mesh.castShadow=mesh.receiveShadow=true;
  const holder=new T.Group();holder.add(bones[0],rig,mesh);holder.updateMatrixWorld(true);rig.bind(new T.Skeleton(bones));holder.scale.setScalar(STYLE[c.id].s);group.add(holder);
  const r=rnd(c.seed),st={c,mesh,rig,holder,bones,r,blinkAt:1+r()*3,blinkEnd:0,lookAt:0,yaw:0,yawT:0,pitchT:0,pitch:0,last:-1,phase:r()*10,x:c.x,dir:1};
  if(c.pose==='read'){const P=H118_PROPS.newstop,Q=H118_PROPS.rack,pm=new T.MeshStandardMaterial({map:h118Texture('props'),roughness:.9}),paper=new T.Group();
   for(const[r,ry]of[[P,Math.PI],[[Q[0]+Q[2]*.05,Q[1]+Q[3]*.05,Q[2]*.9,Q[3]*.32],0]]){const g=new T.PlaneGeometry(.52,.36),u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,r[0]+u.getX(i)*r[2],r[1]+u.getY(i)*r[3]);const m=new T.Mesh(g,pm);m.rotation.y=ry;m.castShadow=true;paper.add(m);}
   paper.name='Hope St V118 / newspaper';paper.position.set(0,.14,.42);paper.rotation.x=-.55;bones[B.chest].add(paper);st.paper=paper;}
  place(st,c.x,c.z,c.face);people.push(st);
  if(!globalThis.H118_NOANIM)mesh.onBeforeRender=(r,sc,cam)=>animate(st,cam);
 }
 function place(st,x,z,[dx,dz]){const p=toWorld(x,z);st.holder.position.set(p.x,Y+st.c.y,p.z);st.holder.rotation.y=angle+Math.atan2(-dx,dz);st.holder.updateMatrix();}
 const _v=new T.Vector3(),_w=new T.Vector3();
 function animate(st,cam){
  const now=performance.now()/1000;if(now===st.last)return;const dt=Math.min(.1,st.last<0?0:now-st.last);st.last=now;
  const b=st.bones,c=st.c,t=now+st.phase,r=st.r;
  for(const x of b)x.rotation.set(0,0,0);
  // breathing (chest), weight shift (hips sway, counter-tilt chest, legs keep the feet planted)
  const br=Math.sin(t*2*Math.PI/(3.4+(c.seed%5)*.25));b[B.chest].scale.set(1+.012*br,1+.005*br,1+.022*br);
  const ws=Math.sin(t*.37)*.6+Math.sin(t*.13)*.4;b[B.hips].position.x=.018*ws;b[B.hips].rotation.z=.03*ws;b[B.chest].rotation.z=-.038*ws;b[B.thL].rotation.z=-.03*ws-.012*ws;b[B.thR].rotation.z=-.03*ws+.012*ws;
  b[B.shL].rotation.z=.07+.01*br;b[B.shR].rotation.z=-.07-.01*br;
  // head: pick a new glance target every few seconds, ease toward it
  if(now>st.lookAt){st.lookAt=now+1.8+r()*4.2;const wide=c.pose==='counter'?1:c.pose==='walk'?.35:.6;st.yawT=(r()-.5)*1.3*wide;st.pitchT=(r()-.5)*.18;if(c.pose==='read'&&r()<.6){st.yawT*=.2;st.pitchT=.38;}if(c.pose==='atm'&&r()<.7){st.yawT=(r()-.5)*.2;st.pitchT=.22;}}
  const e=1-Math.exp(-dt*3.2);st.yaw+=(st.yawT-st.yaw)*e;st.pitch+=(st.pitchT-st.pitch)*e;
  b[B.neck].rotation.y=st.yaw*.35;b[B.head].rotation.y=st.yaw*.65;b[B.neck].rotation.x=st.pitch*.4;b[B.head].rotation.x=st.pitch*.6;b[B.chest].rotation.y=st.yaw*.12;
  // blink (eyelids fold up onto the lid bone); occasional double blink
  if(now>st.blinkAt){st.blinkEnd=now+.12;st.blinkAt=now+(r()<.15?.28:2.2+r()*4);}
  const lid=now<st.blinkEnd?1:.04;b[B.lidL].scale.y=b[B.lidR].scale.y=lid;
  if(c.pose==='counter'){b[B.chest].rotation.x=.16;b[B.shL].rotation.x=b[B.shR].rotation.x=-.62;b[B.elL].rotation.x=b[B.elR].rotation.x=-1.05;b[B.shL].rotation.z=.18;b[B.shR].rotation.z=-.18;b[B.head].rotation.x-=.1;}
  if(c.pose==='atm'){const press=Math.max(0,Math.sin(t*4.1))**8;b[B.shR].rotation.x=-.95;b[B.elR].rotation.x=-.75-.12*press;b[B.shR].rotation.z=.15;b[B.shL].rotation.x=-.12;b[B.elL].rotation.x=-.35;}
  if(c.pose==='read'){b[B.shL].rotation.x=b[B.shR].rotation.x=-.5;b[B.elL].rotation.x=b[B.elR].rotation.x=-1.15;b[B.shL].rotation.z=-.12;b[B.shR].rotation.z=.12;b[B.chest].rotation.x=.06;}
  if(c.pose==='walk'){
   const [x0,x1]=c.path,sp=1.15;st.x+=st.dir*sp*dt;if(st.x>x1){st.x=x1;st.dir=-1;}if(st.x<x0){st.x=x0;st.dir=1;}
   const ph=st.x*Math.PI/.72,sw=Math.sin(ph);
   b[B.thL].rotation.x=.42*sw;b[B.thR].rotation.x=-.42*sw;b[B.knL].rotation.x=.55*Math.max(0,-Math.cos(ph))+.05;b[B.knR].rotation.x=.55*Math.max(0,Math.cos(ph))+.05;
   b[B.shL].rotation.x=-.32*sw;b[B.shR].rotation.x=.32*sw;b[B.elL].rotation.x=b[B.elR].rotation.x=-.28;b[B.hips].position.y=.97-.018*Math.abs(Math.cos(ph))+.01;b[B.hips].rotation.y=.07*sw;b[B.chest].rotation.y=-.1*sw;
   place(st,st.x,c.z,[st.dir,0]);
  }else b[B.hips].position.y=.97;
  st.holder.updateMatrixWorld(true);
  // skin on the CPU when the camera is close enough to read the motion (walker always, it travels)
  if(cam&&c.pose!=='walk'&&cam.getWorldPosition(_w).distanceTo(st.holder.getWorldPosition(_v))>70&&st.skinned)return;
  st.skinned=true;st.rig.skeleton.update();const src=st.rig.geometry.attributes.position,dst=st.mesh.geometry.attributes.position;
  for(let i=0;i<src.count;i++){_v.fromBufferAttribute(src,i);st.rig.applyBoneTransform(i,_v);dst.setXYZ(i,_v.x,_v.y,_v.z);}
  dst.needsUpdate=true;st.mesh.geometry.computeVertexNormals();
 }
 return{object:group,people,update:()=>{}};
}
