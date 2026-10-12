import * as T from './vendor/three.module.min.js';
// V126-L11 mill join (user feedback on image-49): the flour-mill mouth no longer sits in a bare asphalt field.
// Local return frame (same as mill121-dressing.js): building faces at z=0, street toward -z, x>0 = dark
// corrugated shed (to x=18.5), x<0 = brick block (to x=-10.7). City kerb line is z=-4.5 (city x 104.5), the
// carriageway runs along x. G = city slab top, S = G+.15 = sidewalk top = alley mouth floor.
// Adds: continuous concrete sidewalk + precast kerb + gutter pan, driveway apron with kerb returns where the
// alley meets the street, kerb ramp + tactile pad at the existing mid-block crosswalk, cracked/patched parking
// lane, edge line, parking T-marks, loading-bay box and hatch, yellow kerb, oil stains, storm inlets, manholes,
// gravel strips, cross-quad weeds, three wooden utility poles with sagging wires, and two gap closers: a brick
// infill + lean-to between the shed and the beige colonnade block (+x) and a chain-link gate + lean-to shed
// between the brick block and its neighbour (-x). Every texture is its own generated image (assets/l11-v126).
const PI=Math.PI;let tex=null;
function textures(){if(tex)return tex;const L=new T.TextureLoader(),ld=(n,srgb=true,rep=true)=>{const t=L.load(new URL('./assets/l11-v126/'+n+'.webp',import.meta.url).href);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
 tex={};for(const n of['asphalt','sidewalk','brickwall','corrugated','gravel','pole','curb']){tex[n]=ld(n);tex[n+'N']=ld(n+'-n',false);}
 for(const n of['manhole','drain']){tex[n]=ld(n,true,false);tex[n+'N']=ld(n+'-n',false,false);}
 for(const n of['oil','weeds','paint'])tex[n]=ld(n,true,false);tex.paint.wrapS=T.RepeatWrapping;tex.chainlink=ld('chainlink');return tex;}
function materials(){const t=textures(),S=o=>new T.MeshStandardMaterial(o),V=(x)=>new T.Vector2(x,x),off=f=>({polygonOffset:true,polygonOffsetFactor:f,polygonOffsetUnits:f});
 return{
  walk:S({name:'M126 / broom-finished sidewalk slabs',map:t.sidewalk,normalMap:t.sidewalkN,normalScale:V(.8),roughness:.93,color:0xb4b1aa}),
  apron:S({name:'M126 / driveway apron concrete (newer pour)',map:t.sidewalk,normalMap:t.sidewalkN,normalScale:V(.7),roughness:.9,color:0xc2beb4}),
  gutter:S({name:'M126 / gutter pan',map:t.sidewalk,normalMap:t.sidewalkN,normalScale:V(.6),roughness:.95,color:0x9d9a92,...off(-1)}),
  curb:S({name:'M126 / precast kerb',side:T.DoubleSide,map:t.curb,normalMap:t.curbN,normalScale:V(.9),roughness:.9,color:0xd4d1c9}),
  asph:S({name:'M126 / cracked parking-lane asphalt',map:t.asphalt,normalMap:t.asphaltN,normalScale:V(.9),roughness:.96,color:0xa9a9a7,...off(-1)}),
  patch:S({name:'M126 / saw-cut asphalt patches',map:t.asphalt,normalMap:t.asphaltN,normalScale:V(.7),roughness:.92,color:0x8a8886,...off(-2)}),
  paintW:S({name:'M126 / worn white road paint',map:t.paint,transparent:true,depthWrite:false,roughness:.8,color:0xffffff,...off(-4)}),
  paintY:S({name:'M126 / worn yellow road paint',map:t.paint,transparent:true,depthWrite:false,roughness:.8,color:0xf2c33a,...off(-4)}),
  oil:S({name:'M126 / oil stains',map:t.oil,transparent:true,depthWrite:false,roughness:.35,metalness:.05,opacity:.82,...off(-5)}),
  manhole:S({name:'M126 / sewer cover',map:t.manhole,normalMap:t.manholeN,normalScale:V(1.2),roughness:.62,metalness:.35}),
  drain:S({name:'M126 / storm grate',map:t.drain,normalMap:t.drainN,normalScale:V(1.2),roughness:.7,metalness:.3,...off(-3)}),
  gravel:S({name:'M126 / gravel strips',map:t.gravel,normalMap:t.gravelN,normalScale:V(1.1),roughness:1,color:0xcfcac0,...off(-2)}),
  brick:S({name:'M126 / infill brick',map:t.brickwall,normalMap:t.brickwallN,normalScale:V(1),roughness:.92,color:0xd0c4bb}),
  corr:S({name:'M126 / galvanised lean-to sheet',map:t.corrugated,normalMap:t.corrugatedN,normalScale:V(1.2),roughness:.62,metalness:.35,color:0xc4c4bd,side:T.DoubleSide}),
  pole:S({name:'M126 / creosote pole',map:t.pole,normalMap:t.poleN,normalScale:V(.9),roughness:.95,color:0xbcb3a8}),
  chain:S({name:'M126 / chain-link mesh',map:t.chainlink,alphaTest:.5,side:T.DoubleSide,roughness:.55,metalness:.45,color:0xc9cbc8}),
  steel:S({name:'M126 / galvanised pipe and hardware',roughness:.5,metalness:.55,color:0x8e918f}),
  door:S({name:'M126 / painted steel door',roughness:.7,metalness:.25,color:0x3d4a44}),
  dark:S({name:'M126 / kerb inlet throat / insulators',roughness:.9,color:0x1b1a19}),
  tactile:S({name:'M126 / tactile warning pad',side:T.DoubleSide,roughness:.8,color:0xd8b22e}),
  weeds:S({name:'M126 / weed cards',map:t.weeds,alphaTest:.45,side:T.DoubleSide,roughness:.97,color:0xd6d3bf}),
  wire:new T.MeshBasicMaterial({name:'M126 / overhead wires',color:0x1c1c1c})};}
let seed=126;const rnd=()=>((seed=Math.imul(seed^seed>>>15,2246822519)+0x9e3779b9|0)>>>0)/4294967296;
class Builder{constructor(){this.b={};}
 buf(k){return this.b[k]||(this.b[k]={p:[],n:[],u:[]});}
 tri(k,a,b,c,ua,ub,uc){const q=this.buf(k),e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);for(const[v,uv]of[[a,ua],[b,ub],[c,uc]]){q.p.push(...v);q.n.push(...n);q.u.push(...uv);}}
 quad(k,a,b,c,d,ua,ub,uc,ud){this.tri(k,a,b,c,ua,ub,uc);this.tri(k,a,c,d,ua,uc,ud);}
 quadR(k,a,b,c,d,ua,ub,uc,ud){this.quad(k,d,c,b,a,ud,uc,ub,ua);}
 // horizontal rectangle (CCW from above), planar world UVs
 flat(k,x0,x1,z0,z1,y,s=1,ou=0,ov=0){const U=(x,z)=>[x/s+ou,-z/s+ov];this.quad(k,[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],U(x0,z1),U(x1,z1),U(x1,z0),U(x0,z0));}
 // sloped rectangle along z: y0 at z0, y1 at z1
 rampZ(k,x0,x1,z0,z1,y0,y1,s=1){const U=(x,z)=>[x/s,-z/s];this.quad(k,[x0,y1,z1],[x1,y1,z1],[x1,y0,z0],[x0,y0,z0],U(x0,z1),U(x1,z1),U(x1,z0),U(x0,z0));}
 // axis-aligned box, world-mapped UV; faces: list of 'top','bottom','front'(-z),'back'(+z),'left'(-x),'right'(+x)
 box(k,x0,x1,y0,y1,z0,z1,s=1,faces=['top','front','back','left','right'],ky){const F={top:()=>this.flat(ky||k,x0,x1,z0,z1,y1,s),
  front:()=>this.quadR(k,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0/s,y0/s],[x1/s,y0/s],[x1/s,y1/s],[x0/s,y1/s]),
  back:()=>this.quadR(k,[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[-x1/s,y0/s],[-x0/s,y0/s],[-x0/s,y1/s],[-x1/s,y1/s]),
  left:()=>this.quadR(k,[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[-z1/s,y0/s],[-z0/s,y0/s],[-z0/s,y1/s],[-z1/s,y1/s]),
  right:()=>this.quadR(k,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[z0/s,y0/s],[z1/s,y0/s],[z1/s,y1/s],[z0/s,y1/s]),
  bottom:()=>this.quad(k,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,0],[1,0],[1,1],[0,1])};for(const f of faces)F[f]();}
 geo(k,g,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){g=g.index?g.toNonIndexed():g;const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));g.applyMatrix4(m);const q=this.buf(k),p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){q.p.push(p.getX(i),p.getY(i),p.getZ(i));q.n.push(n.getX(i),n.getY(i),n.getZ(i));q.u.push(u?u.getX(i):0,u?u.getY(i):0);}g.dispose();}
 // cylinder between two points
 beam(k,a,b,r,seg=6,uvLen=1){const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length(),g=new T.CylinderGeometry(r,r,L,seg,1,true);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*L/uvLen);g.translate(0,L/2,0);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));this.geo(k,g,a[0],a[1],a[2]);}
 // painted stripe on the ground (u along its length, v across)
 stripe(k,ax,az,bx,bz,w,y,uLen=4){const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz),nx=-dz/L*w/2,nz=dx/L*w/2,u0=rnd()*7,u1=u0+L/uLen;this.quadR(k,[ax-nx,y,az-nz],[bx-nx,y,bz-nz],[bx+nx,y,bz+nz],[ax+nx,y,az+nz],[u0,0],[u1,0],[u1,1],[u0,1]);}
 decal(k,x,z,w,d,y,rot=0,uv=[0,0,1,1]){const c=Math.cos(rot),s=Math.sin(rot),P=(a,b)=>[x+a*c-b*s,y,z+a*s+b*c];this.quad(k,P(-w/2,d/2),P(w/2,d/2),P(w/2,-d/2),P(-w/2,-d/2),[uv[0],uv[1]],[uv[0]+uv[2],uv[1]],[uv[0]+uv[2],uv[1]+uv[3]],[uv[0],uv[1]+uv[3]]);}
 weed(x,y,z,h=.55){const w=h*.68,a=rnd()*PI;for(let i=0;i<2;i++){const r=a+i*PI/2,c=Math.cos(r)*w/2,s=Math.sin(r)*w/2,f=rnd()<.5;this.quad('weeds',[x-c,y,z-s],[x+c,y,z+s],[x+c,y+h,z+s],[x-c,y+h,z-s],[f?1:0,0],[f?0:1,0],[f?0:1,1],[f?1:0,1]);}}
 finish(m,name){const root=new T.Group();root.name=name;for(const[k,q]of Object.entries(this.b)){if(!q.p.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(q.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(q.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(q.u,2));g.computeBoundingSphere();const o=new T.Mesh(g,m[k]);o.name=name+' / '+k;o.receiveShadow=true;o.castShadow=!['paintW','paintY','oil','asph','patch','gutter','gravel','drain','wire','walk','apron'].includes(k);if(['paintW','paintY','oil'].includes(k))o.renderOrder=2;root.add(o);}return root;}}

export function createMillJoin({ground:G=0,toWorld,angle=0}={}){
 const m=materials(),b=new Builder(),colliders=[],walks=[],S=G+.15;seed=126;
 const KERB=-4.5,KB=-4.32,GUT=-4.95,X0=-43,X1=58,DRV=3.4,CW0=13.3,CW1=16.3,BACK=.3;
 const walk=(x0,x1,z0,z1,y,slopeZ=0)=>{const cx=(x0+x1)/2,cz=(z0+z1)/2,w=toWorld?toWorld(cx,cz):{x:cx,z:cz};walks.push({x:w.x,z:w.z,y,w:x1-x0,d:z1-z0,ry:angle,slopeX:0,slopeZ});};
 // ---- sidewalk slabs (3 runs) + kerb + gutter pan
 for(const[x0,x1]of[[X0,-DRV],[DRV,CW0],[CW1,X1]]){b.box('walk',x0,x1,G-.05,S,KB,1.0,6,['top']);walk(x0,x1,KB,.3,S);
  b.box('curb',x0,x1,G-.03,S+.005,KERB,KB,2.2,['top','front'],'curb');b.flat('gutter',x0,x1,GUT,KERB,G+.006,6,.37,.11);
  for(const x of[x0,x1])if(x!==X0&&x!==X1)b.box('curb',Math.min(x,x+(x===x0?0:-.18)),Math.max(x,x+(x===x0?.18:0)),G-.03,S+.005,KERB,KB,2.2,x===x0?['left']:['right']);
  if(x0===X0||x1===X1){const x=x0===X0?x0:x1;b.box('curb',x0===X0?x-.01:x,x0===X0?x:x+.01,G-.03,S,KERB,-3.6,1,[x0===X0?'left':'right']);}}
 // ---- driveway apron: flat crossing (sidewalk continues across), then the ramp down to a 25 mm lip
 b.flat('apron',-DRV,DRV,-3.0,BACK,S+.012,6,.23,.41);walk(-DRV,DRV,-3.0,BACK,S+.012);
 b.rampZ('apron',-DRV,DRV,KERB,-3.0,G+.025,S+.012,6);walk(-DRV,DRV,KERB,-3.0,(G+.025+S+.012)/2,(S+.012-G-.025)/1.5);
 for(const s of[-1,1]){const x=s*DRV;b.quad('curb',...(s<0?[[x,G+.025,KERB],[x,G-.03,KERB],[x,S+.005,-3.0],[x,S+.012,-3.0]]:[[x,G-.03,KERB],[x,G+.025,KERB],[x,S+.012,-3.0],[x,S+.005,-3.0]]),[0,0],[0,.1],[1,.3],[1,.32]);}
 b.box('curb',-DRV,DRV,G-.03,G+.025,KERB-.02,KERB,2.2,['top','front']);b.flat('gutter',-DRV,DRV,GUT,KERB-.02,G+.006,6,.1,.3);
 for(let i=-2;i<=2;i++)b.box('dark',i*1.36-.006,i*1.36+.006,S+.012,S+.0135,-3.0,BACK,1,['top']); // tooled control joints
 // ---- kerb ramp + tactile pad at the existing mid-block crosswalk
 b.flat('walk',CW0,CW1,-2.9,BACK,S,6,.5,.2);walk(CW0,CW1,-2.9,BACK,S);
 b.rampZ('walk',CW0,CW1,KERB,-2.9,G+.02,S,6);walk(CW0,CW1,KERB,-2.9,(G+.02+S)/2,(S-G-.02)/1.6);
 for(const x of[CW0,CW1])b.quad('curb',...(x===CW0?[[x,G+.02,KERB],[x,G-.03,KERB],[x,S,-2.9],[x,S,-2.9]]:[[x,G-.03,KERB],[x,G+.02,KERB],[x,S,-2.9],[x,S,-2.9]]),[0,0],[0,.1],[1,.3],[1,.3]);
 b.flat('gutter',CW0,CW1,GUT,KERB,G+.006,6,.2,.6);
 {const y0=G+.02,y1=S,z0=KERB+.05,z1=KERB+.65,t=v=>y0+(y1-y0)*(v-KERB)/1.6;b.quad('tactile',[CW0+.15,t(z1)+.006,z1],[CW1-.15,t(z1)+.006,z1],[CW1-.15,t(z0)+.006,z0],[CW0+.15,t(z0)+.006,z0],[0,0],[1,0],[1,1],[0,1]);
  const dome=new T.SphereGeometry(.018,5,3,0,PI*2,0,PI/2);for(let i=0;i<14;i++)for(let j=0;j<3;j++){const x=CW0+.3+i*.19,z=z0+.12+j*.18;b.geo('tactile',dome.clone(),x,t(z)+.006,z);}dome.dispose();}
 // ---- parking lane: cracked asphalt overlay to the edge line, patches, paint
 const LANE=-7.0;b.flat('asph',X0,X1,LANE,GUT,G+.008,5);
 for(let i=0;i<9;i++){const x=X0+5+rnd()*(X1-X0-10),z=-5.4-rnd()*6,w=1.2+rnd()*3.2,d=.8+rnd()*1.6;b.decal('patch',x,z,w,d,G+.011+i*.0004,(rnd()-.5)*.08,[rnd(),rnd(),w/5,d/5]);}
 b.stripe('paintW',X0,LANE+.06,X1,LANE+.06,.12,G+.014,5);
 // parking T-marks every 6.4 m; none across the driveway, the loading bay or the crosswalk approach
 for(const[x0,x1]of[[-40,-5.2],[18.4,55]])for(let x=x0;x<=x1+.01;x+=6.4){b.stripe('paintW',x,GUT-.05,x,LANE+.12,.1,G+.015,4);b.stripe('paintW',x-.45,LANE+.42,x+.45,LANE+.42,.1,G+.015,4);}
 // loading bay in front of the shed: yellow box, diagonal hatch at its ends
 {const a=5.2,c=12.2,z0=GUT-.05,z1=LANE+.12,y=G+.016;for(const[p,q]of[[[a,z0],[c,z0]],[[a,z1],[c,z1]],[[a,z0],[a,z1]],[[c,z0],[c,z1]]])b.stripe('paintY',p[0],p[1],q[0],q[1],.12,y,4);
  for(let i=0;i<3;i++){b.stripe('paintY',a+.25+i*.55,z1+.1,a+.95+i*.55,z0-.1,.11,y,4);b.stripe('paintY',c-.95-i*.55,z0-.1,c-.25-i*.55,z1+.1,.11,y,4);}}
 // yellow kerb (no parking) either side of the driveway and at the crosswalk
 for(const[x0,x1]of[[-5.2,-DRV],[DRV,5.2],[12.2,CW0],[CW1,18.4]]){b.quadR('paintY',[x0,G+.01,KERB-.004],[x1,G+.01,KERB-.004],[x1,S,KERB-.004],[x0,S,KERB-.004],[rnd()*3,0],[rnd()*3+(x1-x0)/4,0],[rnd()*3+(x1-x0)/4,1],[rnd()*3,1]);b.flat('paintY',x0,x1,KERB,KB,S+.006,1,0,0);}
 // oil stains: centres of stalls, the bay and the apron mouth
 const oil=(x,z,y,w)=>{const q=Math.floor(rnd()*2),r=Math.floor(rnd()*2);b.decal('oil',x,z,w,w*.72,y,rnd()*PI*2,[q*.5,r*.5,.5,.5]);};
 for(let x=-36.8;x<-6;x+=6.4)if(rnd()<.8)oil(x+(rnd()-.5)*1.2,-5.8+(rnd()-.5)*.5,G+.018,.8+rnd()*.9);
 for(let x=21.6;x<54;x+=6.4)if(rnd()<.75)oil(x+(rnd()-.5)*1.2,-5.8+(rnd()-.5)*.5,G+.018,.7+rnd()*.9);
 for(const[x,z]of[[7,-5.7],[9.8,-6.1],[-.6,-2.2],[1.2,-1.0],[25,-9.9]])oil(x,z,z>KB?S+.02:G+.018,.9+rnd()*1.1);
 // ---- storm inlets (grate in the gutter + throat in the kerb face) and sewer covers in the travel lane
 for(const x of[-9.6,10.6,30.4,47.2]){b.decal('drain',x,(GUT+KERB)/2,1.0,.44,G+.012);b.box('dark',x-.55,x+.55,G+.012,G+.105,KERB-.005,KERB+.02,1,['front']);}
 {const disc=new T.CylinderGeometry(.36,.37,.03,20),ring=new T.CylinderGeometry(.41,.43,.02,20);const uv=disc.attributes.uv,po=disc.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,.5+po.getX(i)/.74*.92,.5-po.getZ(i)/.74*.92);
  for(const[x,z,r]of[[-21.5,-9.4,.3],[33.5,-9.9,1.4],[2.4,-10.6,2.2]]){b.geo('steel',ring.clone(),x,G+.006,z);b.geo('manhole',disc.clone(),x,G+.016,z,0,r);}disc.dispose();ring.dispose();}
 // ---- gravel strips: open strip along the brick block foot, the gap closers and the far sidewalk ends
 for(const[x0,x1,z0,z1]of[[-10.4,-4.9,-.75,BACK],[18.6,20.6,-1.55,-.75],[-12.95,-10.7,-.75,BACK],[X1-3.4,X1,-1.8,-.9],[X0,X0+3.2,-.9,BACK]]){b.box('gravel',x0,x1,S,S+.025,z0,z1,1.6,['top']);b.box('curb',x0,x1,S-.005,S+.03,z0-.06,z0,1,['top','front']);
  for(let i=0;i<Math.ceil((x1-x0)*1.3);i++)b.weed(x0+rnd()*(x1-x0),S+.02,z0+.08+rnd()*(z1-z0-.1),.32+rnd()*.42);}
 // weeds in the kerb joint and slab joints
 for(let i=0;i<46;i++){const x=X0+rnd()*(X1-X0);if(Math.abs(x)<DRV+.2||(x>CW0-.2&&x<CW1+.2))continue;rnd()<.6?b.weed(x,G+.006,KERB-.06-rnd()*.25,.22+rnd()*.32):b.weed(x,S,-(Math.floor(rnd()*3)+.0)*1.5-.02+(rnd()<.3?.3:0),.16+rnd()*.22);}
 // ---- utility poles along the kerb, crossarms, insulators, transformer can, sagging wires
 const poles=[[-33.5,-3.85],[-12.0,-3.85],[26.2,-3.85],[52.5,-3.85]];
 const TOP=9.4,arm=[];for(const[i,[x,z]]of poles.entries()){b.beam('pole',[x,G-.2,z],[x+(i%2?.04:-.03),S+TOP,z+.02],.15,8,2.2);b.geo('pole',new T.CylinderGeometry(.155,.15,.04,8),x,S+TOP+.02,z);
  b.box('pole',x-1.25,x+1.25,S+TOP-.55,S+TOP-.42,z-.06,z+.06,1.2,['top','bottom','front','back','left','right']);for(const s of[-1,1])b.beam('steel',[x+s*.08,S+TOP-.9,z+.05],[x+s*.9,S+TOP-.48,z+.05],.018,4);
  const ins=[];for(const dx of[-1.1,-.4,.4,1.1]){b.geo('dark',new T.CylinderGeometry(.035,.05,.16,6),x+dx,S+TOP-.33,z);ins.push([x+dx,S+TOP-.25,z]);}arm.push(ins);
  b.beam('steel',[x+.16,S+.4,z],[x+.16,S+3.2,z],.03,6);if(i===1){b.geo('steel',new T.CylinderGeometry(.32,.32,.95,10),x,S+TOP-1.9,z-.36);b.box('steel',x-.06,x+.06,S+TOP-2.0,S+TOP-1.7,z-.2,z-.04,1);b.beam('dark',[x,S+TOP-1.4,z-.36],[x+.4,S+TOP-.27,z],.012,4);}
  colliders.push({kind:'circle',x,z,r:.2});}
 const sag=(a,c,dip,k='wire')=>{const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new T.Vector3(a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t-dip*4*t*(1-t),a[2]+(c[2]-a[2])*t));}b.geo(k,new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.012,3,false),0,0,0);};
 for(let i=0;i<arm.length-1;i++)for(let w=0;w<4;w++)sag(arm[i][w],arm[i+1][w],.55+w*.06);
 for(const w of[0,1,2,3]){const a=arm[0][w],c=arm.at(-1)[w];sag(a,[a[0]-30,a[1]+.4,a[2]+.6],.5);sag(c,[c[0]+30,c[1]+.3,c[2]-.5],.5);}
 // service drop from the second pole to the brick block
 sag([-12.0,S+TOP-1.1,-3.85],[-10.0,S+6.8,-.05],.25);
 // ---- GAP +x: shed (to x 18.5) .. beige colonnade block (from x≈20.6, front z≈-1.5): brick infill with steel door + lean-to
 {const x0=18.42,x1=20.75,zf=-1.45,zb=24,h=3.6;b.box('brick',x0,x1,S-.02,S+h,zf,zb,2.4,['front','top']);b.box('brick',x0,x1,S+h,S+h+.12,zf-.06,zb,1,['front','top'],'curb');
  b.box('door',19.05,20.05,S,S+2.15,zf-.035,zf,1,['front','left','right','top']);b.box('steel',19.0,20.1,S+2.15,S+2.25,zf-.05,zf,1,['front','top']);b.box('steel',19.85,19.95,S+1.0,S+1.1,zf-.08,zf-.035,1,['front','left','right','top']);
  for(const y of[.15,1.95])b.box('steel',19.06,20.04,S+y,S+y+.06,zf-.05,zf-.035,1,['front','top']);
  // lean-to: galvanised sheet roof from the shed eaves (6.55) falling to the infill parapet
  const y0=S+6.15,y1=S+h+.25;b.quad('corr',[x0,y0,zf-.25],[x0,y0,zb],[x1+.05,y1,zb],[x1+.05,y1,zf-.25],[0,0],[0,(zb-zf)/1.8],[1.3,(zb-zf)/1.8],[1.3,0]);
  b.quad('corr',[x0,y0,zf-.25],[x1+.05,y1,zf-.25],[x1+.05,S+h+.12,zf-.25],[x0,S+h+.12,zf-.25],[0,y0/1.8],[1.3,y1/1.8],[1.3,(S+h)/1.8],[0,(S+h)/1.8]);
  b.beam('steel',[x0+.1,y0-.1,zf-.2],[x1,y1-.1,zf-.2],.04,6);b.beam('steel',[x1-.2,S+h+.3,zf-.3],[x1-.2,S+.1,zf-.3],.045,6);b.beam('steel',[x1-.2,S+.1,zf-.3],[x1-.45,S+.03,zf-.55],.045,6);
  colliders.push({kind:'obb',x:(x0+x1)/2,z:(zf+zb)/2,w:x1-x0,d:zb-zf,ry:0});}
 // ---- GAP -x: brick block (to x -10.7) .. neighbour (from x≈-12.9, front z≈.6): chain-link gate + lean-to shed behind
 {const x0=-12.95,x1=-10.62,zf=-.05,h=2.15;for(const x of[x0+.05,x1-.05,(x0+x1)/2])b.beam('steel',[x,S-.1,zf],[x,S+h+.12,zf],x===(x0+x1)/2?.028:.038,8);
  b.beam('steel',[x0,S+h,zf],[x1,S+h,zf],.022,6);b.beam('steel',[x0,S+.08,zf],[x1,S+.08,zf],.018,6);
  for(const[a,c]of[[x0+.09,(x0+x1)/2-.04],[(x0+x1)/2+.04,x1-.09]]){b.quad('chain',[a,S+.1,zf],[c,S+.1,zf],[c,S+h-.03,zf],[a,S+h-.03,zf],[a/.6,.1/.6],[c/.6,.1/.6],[c/.6,(h-.03)/.6],[a/.6,(h-.03)/.6]);
   b.beam('steel',[a,S+.12,zf],[a,S+h-.05,zf],.016,5);b.beam('steel',[c,S+.12,zf],[c,S+h-.05,zf],.016,5);b.beam('steel',[a,S+h-.05,zf],[c,S+h-.05,zf],.016,5);b.beam('steel',[a,S+.12,zf],[c,S+.12,zf],.016,5);}
  b.box('steel',(x0+x1)/2-.09,(x0+x1)/2+.09,S+1.02,S+1.12,zf-.05,zf+.05,1,['front','back','top','left','right']);b.beam('dark',[(x0+x1)/2-.07,S+1.07,zf-.07],[(x0+x1)/2+.07,S+1.07,zf-.07],.02,4);
  // barbed wire on angled arms
  for(const x of[x0+.05,x1-.05])b.beam('steel',[x,S+h+.1,zf],[x,S+h+.45,zf-.3],.014,4);for(let w=0;w<3;w++)b.beam('dark',[x0,S+h+.2+w*.11,zf-.08-w*.09],[x1,S+h+.2+w*.11,zf-.08-w*.09],.006,3);
  // lean-to shed in the gap: galvanised front wall above a block plinth, mono-pitch roof rising to the brick block
  const sf=1.45,sb=30,hf=3.0,hb=3.7;b.box('brick',x0,x1,S-.02,S+.45,sf,sb,2.4,['front','top']);b.quad('corr',[x0,S+.45,sf],[x1,S+.45,sf],[x1,S+hf,sf],[x0,S+hf,sf],[x0/1.8,0],[x1/1.8,0],[x1/1.8,(hf-.45)/1.8],[x0/1.8,(hf-.45)/1.8]);
  b.quad('corr',[x0-.05,S+hf+.05,sf-.3],[x1+.02,S+hb,sf-.3],[x1+.02,S+hb,sb],[x0-.05,S+hf+.05,sb],[0,0],[1.3,0],[1.3,(sb-sf)/1.8],[0,(sb-sf)/1.8]);
  b.box('door',-12.35,-11.25,S+.45,S+2.5,sf-.03,sf,1,['front','left','right','top']);for(let i=0;i<14;i++)b.box('steel',-12.33,-11.27,S+.55+i*.14,S+.58+i*.14,sf-.05,sf-.03,1,['front','top']);
  b.box('curb',x0,x1,S,S+.015,zf-.05,sf,1,['top']);
  colliders.push({kind:'obb',x:(x0+x1)/2,z:zf,w:x1-x0,d:.15,ry:0},{kind:'obb',x:(x0+x1)/2,z:(sf+sb)/2,w:x1-x0,d:sb-sf,ry:0});}

 // ---- the street west of the crosswalk was bare city slab: asphalt, centre line, lane lines, edge line
 {const XE=84;b.flat('asph',CW1,XE,-19.5,LANE,G+.007,5,.3,.6);b.flat('asph',X1,XE,LANE,-3.6,G+.008,5,.1,.2);b.flat('asph',-XE,X0,LANE,-3.6,G+.008,5,.4,.7);b.stripe('paintW',-XE,LANE+.06,X0,LANE+.06,.12,G+.014,5);
  b.stripe('paintW',X1,LANE+.06,XE,LANE+.06,.12,G+.014,5);for(const z of[-11.9,-12.1])b.stripe('paintY',37.5,z,XE,z,.1,G+.014,4);
  for(const z of[-8.7,-15.3])for(let x=38;x<XE-3;x+=9)b.stripe('paintW',x,z,x+3,z,.12,G+.014,3);
  b.stripe('paintW',37.4,-12.2,37.4,-19.3,.4,G+.015,2);
  for(let i=0;i<7;i++){const x=CW1+3+rnd()*(XE-CW1-6),z=-8-rnd()*10.5,w=1.2+rnd()*3,d=.8+rnd()*1.5;b.decal('patch',x,z,w,d,G+.011+i*.0004,(rnd()-.5)*.08,[rnd(),rnd(),w/5,d/5]);}
  for(let x=40;x<XE;x+=7+rnd()*6)oil(x,-9.8-rnd()*1.2,G+.018,.6+rnd()*.7);}
 // ---- two more parcel seams on this frontage: masonry wall + chain-link gate
 const gate=(x0,x1,zf,h=2.15)=>{for(const x of[x0+.05,x1-.05,(x0+x1)/2])b.beam('steel',[x,S-.1,zf],[x,S+h+.12,zf],x===(x0+x1)/2?.028:.038,8);
  b.beam('steel',[x0,S+h,zf],[x1,S+h,zf],.022,6);b.beam('steel',[x0,S+.08,zf],[x1,S+.08,zf],.018,6);
  for(const[a,c]of[[x0+.09,(x0+x1)/2-.04],[(x0+x1)/2+.04,x1-.09]]){b.quad('chain',[a,S+.1,zf],[c,S+.1,zf],[c,S+h-.03,zf],[a,S+h-.03,zf],[a/.6,.1/.6],[c/.6,.1/.6],[c/.6,(h-.03)/.6],[a/.6,(h-.03)/.6]);
   for(const[p,q]of[[[a,.12],[a,h-.05]],[[c,.12],[c,h-.05]],[[a,h-.05],[c,h-.05]],[[a,.12],[c,.12]]])b.beam('steel',[p[0],S+p[1],zf],[q[0],S+q[1],zf],.016,5);}
  b.box('steel',(x0+x1)/2-.09,(x0+x1)/2+.09,S+1.02,S+1.12,zf-.05,zf+.05,1,['front','back','top','left','right']);
  for(const x of[x0+.05,x1-.05])b.beam('steel',[x,S+h+.1,zf],[x,S+h+.45,zf-.3],.014,4);for(let w=0;w<3;w++)b.beam('dark',[x0,S+h+.2+w*.11,zf-.08-w*.09],[x1,S+h+.2+w*.11,zf-.08-w*.09],.006,3);
  colliders.push({kind:'obb',x:(x0+x1)/2,z:zf,w:x1-x0,d:.15,ry:0});};
 {const x0=55.6,x1=58.55,zf=-.1;b.box('brick',x0,x0+.42,S-.02,S+2.6,zf-.21,zf+.21,2.4,['front','top','left','right']);b.box('brick',x1-.42,x1,S-.02,S+2.6,zf-.21,zf+.21,2.4,['front','top','left','right']);
  for(const x of[x0,x1-.42])b.box('curb',x-.04,x+.46,S+2.6,S+2.68,zf-.25,zf+.25,1,['front','top','left','right']);gate(x0+.42,x1-.42,zf);b.box('brick',x0,x1,S-.02,S+2.3,zf+1.8,zf+2.0,2.4,['front','top']);
  for(let i=0;i<4;i++)b.weed(x0+.5+rnd()*1.9,S,zf+.15+rnd()*.5,.3+rnd()*.35);}
 {const x0=-43.35,x1=-38.9,zf=-.05;b.box('brick',x0,x1,S-.02,S+.7,zf-.22,zf+.22,2.4,['front','top','left','right']);for(const x of[x0,(x0+x1)/2-.2,x1-.4])b.box('brick',x,x+.4,S-.02,S+2.5,zf-.22,zf+.22,2.4,['front','top','left','right']);
  b.box('curb',x0-.03,x1+.03,S+.7,S+.76,zf-.25,zf+.25,1,['front','top']);gate(x0+.4,(x0+x1)/2-.2,zf-.25,2.3);
  {const a=(x0+x1)/2+.2,c=x1-.4,h=2.3;b.quad('chain',[a,S+.7,zf],[c,S+.7,zf],[c,S+h,zf],[a,S+h,zf],[a/.6,0],[c/.6,0],[c/.6,(h-.7)/.6],[a/.6,(h-.7)/.6]);b.beam('steel',[a,S+h,zf],[c,S+h,zf],.02,5);}
  b.box('corr',x0,x1,S+2.2,S+2.6,zf+.3,zf+6,1.8,['front']);b.quad('corr',[x0,S+2.6,zf+.2],[x1,S+2.6,zf+.2],[x1,S+3.0,zf+6],[x0,S+3.0,zf+6],[0,0],[2.4,0],[2.4,3.2],[0,3.2]);
  colliders.push({kind:'obb',x:(x0+x1)/2,z:zf,w:x1-x0,d:.44,ry:0});}
 const object=b.finish(m,'Mill mouth V126 join');return{object,colliders,walks,materials:m};}
