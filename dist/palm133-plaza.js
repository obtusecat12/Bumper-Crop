// V133-palm-plaza: L11「棕榈喷泉广场」 after the user's storm photo (files/uploads/IMG_4574):
// dark green-grey two-bowl tier fountain on an octagonal basin with an overflow veil into a
// blue-mosaic pool, wet terracotta pavers, a warm sodium lamp, and modelled broadleaf tree walls
// (leaf-mass volumes + alpha leaf cards). Textures: tools/palm133_assets.py -> assets/l11-v133p.
// Everything here is UrbanBatch geometry inside the clinic frame, so the city bake (bake133_sky)
// covers its AO/contact shadow; the lamp is the only realtime addition (one PointLight, no shadow).
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';

const TAU=Math.PI*2;
export const plaza133={time:{value:0},rain:{value:0},center:{value:new T.Vector2()},rot:{value:0},lamp:{value:new T.Vector3()},lights:[],glows:[]};
const FILES={pavers:['pavers133.webp',512,true],pavers_n:['pavers133_n.webp',512,false],pavers_r:['pavers133_r.webp',256,false],stone:['stone133.webp',256,true],stone_n:['stone133_n.webp',256,false],
 mosaic:['mosaic133.webp',512,true],mosaic_n:['mosaic133_n.webp',512,false],band:['band133.webp',256,true],leaf:['leaf133.webp',512,true],leafbody:['leafbody133.webp',256,true],bark:['bark133.webp',256,true],glow:['glow133.png',64,true]};
const tex={};
for(const[k,[,s,srgb]]of Object.entries(FILES)){const t=new T.DataTexture(new Uint8Array(k.endsWith('_n')?[128,128,255,255]:k==='leaf'||k==='glow'?[0,0,0,0]:[150,150,150,255]),1,1);t.name='Plaza133 / '+k;
 t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.flipY=true;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.wrapS=t.wrapT=k==='leaf'||k==='glow'?T.ClampToEdgeWrapping:T.RepeatWrapping;t.needsUpdate=true;tex[k]=t;}
let pending;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Plaza133 texture '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(ctx.getImageData(0,0,w,h).data),width:w,height:h};}
export function initializePlaza133(){return pending||(pending=Promise.all(Object.entries(FILES).map(async([k,[f,s]])=>{tex[k].image=await decode(new URL('./assets/l11-v133p/'+f,import.meta.url),s,s);tex[k].needsUpdate=true;})).catch(e=>{pending=null;throw e;}));}

// Overcast storm sky used by the fake reflections (kept in step with reference-scenes P133).
const skyGLSL=`
vec3 plaza133Sky(vec3 r){float y=clamp(r.y,-.2,1.);vec3 hz=vec3(.20,.235,.215),mid=vec3(.42,.45,.44),top=vec3(.33,.36,.36);
 vec3 c=mix(hz,mid,smoothstep(.02,.22,y));c=mix(c,top,smoothstep(.35,.95,y));return c;}
float plaza133Hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
`;
function share(m,name){m.name='Plaza133 / '+name;m.userData.urbanShared=true;return m;}
export function addPlazaMaterials133(m,clock){
 if(clock)plaza133.time=clock;
 const U=s=>{s.uniforms.uP133Time=plaza133.time;s.uniforms.uP133Rain=plaza133.rain;s.uniforms.uP133Center=plaza133.center;s.uniforms.uP133Rot=plaza133.rot;s.uniforms.uP133Lamp=plaza133.lamp;};
 // Wet terracotta: roughness map holds the puddles; a fake overcast sky reflection is added by Fresnel x wetness.
 const pav=m['p133:pavers']=share(new T.MeshStandardMaterial({map:tex.pavers,normalMap:tex.pavers_n,normalScale:new T.Vector2(.7,.7),roughnessMap:tex.pavers_r,roughness:1,metalness:0,color:0xffffff,vertexColors:true}),'wet terracotta pavers');
 pav.onBeforeCompile=s=>{U(s);s.fragmentShader=skyGLSL+s.fragmentShader.replace('#include <opaque_fragment>',`{
   vec3 vN=normalize(normal),vV=normalize(vViewPosition);float wet=clamp(1.-roughnessFactor*1.55,0.,1.);
   vec3 rW=inverseTransformDirection(reflect(-vV,vN),viewMatrix);float fr=.04+.96*pow(1.-clamp(dot(vN,vV),0.,1.),5.);
   outgoingLight=outgoingLight*(1.-.18*wet)+plaza133Sky(rW)*fr*(.25+.75*wet)*.9;}
   #include <opaque_fragment>`);};
 pav.customProgramCacheKey=()=>'plaza133-wet-pavers';
 m['p133:stone']=share(new T.MeshStandardMaterial({map:tex.stone,normalMap:tex.stone_n,normalScale:new T.Vector2(.8,.8),roughness:.62,metalness:0,color:0xc8d0c8,vertexColors:true}),'green-grey cast stone');
 m['p133:mosaic']=share(new T.MeshStandardMaterial({map:tex.mosaic,normalMap:tex.mosaic_n,normalScale:new T.Vector2(.5,.5),roughness:.35,metalness:0,vertexColors:true}),'blue pool mosaic');
 m['p133:band']=share(new T.MeshStandardMaterial({map:tex.band,roughness:.18,metalness:0,vertexColors:true}),'deep blue glazed band');
 m['p133:leaf']=share(new T.MeshStandardMaterial({map:tex.leaf,alphaTest:.5,side:T.DoubleSide,roughness:.86,metalness:0,color:0xf2f8ec,vertexColors:true}),'broadleaf cards');
 m['p133:leafbody']=share(new T.MeshStandardMaterial({map:tex.leafbody,roughness:.9,metalness:0,color:0xdce4d2,vertexColors:true}),'broadleaf mass');
 m['p133:bark']=share(new T.MeshStandardMaterial({map:tex.bark,roughness:.95,metalness:0,vertexColors:true}),'tree bark');
 m['p133:globe']=share(new T.MeshStandardMaterial({color:0xffc58a,emissive:0xff9a40,emissiveIntensity:2.6,roughness:.4,vertexColors:true}),'sodium lamp globe');m['p133:globe'].userData.dynamic=true;
 // Pool / basin / bowl water: procedural ripples, rain rings, curtain impacts, overcast reflection, long lamp streak.
 const water=m['p133:water']=share(new T.MeshStandardMaterial({color:0x1f6f8f,roughness:.07,metalness:0,transparent:true,opacity:.8,depthWrite:false,vertexColors:true}),'pool water');
 water.onBeforeCompile=s=>{U(s);
  s.vertexShader='attribute vec2 ring133;varying vec2 vRing133;varying vec2 vP133;varying vec3 vW133;varying vec3 vLampW133;uniform vec2 uP133Center;uniform float uP133Rot;uniform vec3 uP133Lamp;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vRing133=ring133;float c=cos(uP133Rot),sn=sin(uP133Rot);vec2 d=position.xz-uP133Center;vP133=vec2(c*d.x-sn*d.y,sn*d.x+c*d.y);
   vW133=(modelMatrix*vec4(transformed,1.)).xyz;vLampW133=(modelMatrix*vec4(uP133Lamp,1.)).xyz;`);
  s.fragmentShader='uniform float uP133Time,uP133Rain;varying vec2 vRing133;varying vec2 vP133;varying vec3 vW133;varying vec3 vLampW133;\n'+skyGLSL+s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 p=vP133;float t=uP133Time;vec2 g=vec2(.010*cos(p.x*7.1+p.y*4.3-t*1.6),.009*sin(p.y*8.7-p.x*3.2+t*1.3));g+=vec2(.006,.007)*cos(dot(p,vec2(15.1,-6.7))+t*2.4);
   float rr=vRing133.y>.5?max(max(abs(p.x),abs(p.y)),(abs(p.x)+abs(p.y))*.70711):length(p);float dd=rr-vRing133.x;float foam=0.;
   if(vRing133.x>0.){float w=exp(-abs(dd)*6.)*step(-.05,dd);g+=normalize(p+1e-4)*.05*w*cos(dd*40.-t*14.);foam=exp(-dd*dd*90.)*.8;}
   for(int L=0;L<2;L++){float sc=L==0?.42:.27;vec2 q=p/sc+float(L)*17.3;vec2 id=floor(q),f=fract(q)-.5;float h=plaza133Hash(id+float(L)*3.1);
    float age=fract(t*(.55+.4*h)+h*9.);vec2 o=vec2(plaza133Hash(id+.7),plaza133Hash(id+1.9))*.5-.25;vec2 dv=f-o;float r=length(dv),R=age*.48;
    float ring=exp(-pow((r-R)*14.,2.))*(1.-age)*uP133Rain;g+=dv/max(r,.02)*ring*.11*cos((r-R)*30.);}
   vec3 wN=normalize(vec3(-g.x,1.,-g.y));normal=normalize(mat3(viewMatrix)*wN);roughnessFactor=mix(.06,.22,min(1.,foam));`);
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`{
   vec3 V=normalize(cameraPosition-vW133);float fr=.02+.98*pow(1.-max(0.,dot(V,wN)),5.);vec3 R=reflect(-V,wN);
   vec3 env=plaza133Sky(R);vec3 L=vLampW133-vW133;float ld=length(L);L/=ld;
   vec3 Lh=normalize(vec3(L.x,0.,L.z)),Rh=normalize(vec3(R.x,0.,R.z)+1e-5);float dh=1.-dot(Lh,Rh),dv=R.y-L.y;
   float streak=exp(-dh*900.)*exp(-dv*dv*9.)*step(0.,R.y)*smoothstep(32.,6.,ld);
   outgoingLight=mix(outgoingLight*.85+vec3(.05,.13,.20),env*1.3+vec3(.02,.05,.08),.6*fr+.05)+vec3(1.,.62,.28)*streak*2.4+reflectedLight.directSpecular*.35+vec3(.30,.33,.32)*foam;
   diffuseColor.a=clamp(.26+fr*.5+foam*.3,.26,.8);}
   #include <opaque_fragment>`);};
 water.customProgramCacheKey=()=>'plaza133-water';
 // Falling sheets: thin streaked curtains and the octagonal overflow veil.
 const veil=m['p133:veil']=share(new T.MeshStandardMaterial({color:0xb8cbc6,roughness:.08,metalness:0,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide,vertexColors:true}),'falling water sheets');
 veil.onBeforeCompile=s=>{U(s);
  s.vertexShader='attribute vec2 flow133;varying vec2 vF133;uniform float uP133Time;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vF133=flow133;transformed+=normal*(.006*sin(flow133.x*21.+flow133.y*30.-uP133Time*9.)*flow133.y);`);
  s.fragmentShader='uniform float uP133Time;varying vec2 vF133;\n'+skyGLSL+s.fragmentShader.replace('#include <opaque_fragment>',`{
   float u=vF133.x,v=vF133.y,t=uP133Time;float col=floor(u*26.);float h=plaza133Hash(vec2(col,3.));
   float str=.5+.5*sin(u*163.+h*6.)*sin(u*57.+1.3);float pulse=.5+.5*sin(v*22.-t*(9.+h*4.)+h*20.);
   float brk=smoothstep(.55,1.,v)*step(.55,plaza133Hash(vec2(col,floor(v*9.-t*5.))));
   float a=(.08+.36*smoothstep(.25,.95,str)*(.6+.4*pulse))*(1.-brk*.75)*smoothstep(0.,.06,v)+exp(-pow((1.-v)*14.,2.))*.25;
   vec3 vN=normalize(normal),vV=normalize(vViewPosition);vec3 R=inverseTransformDirection(reflect(-vV,vN),viewMatrix);
   outgoingLight=mix(outgoingLight,plaza133Sky(R)*1.7+vec3(.14,.15,.15),.65)+reflectedLight.directSpecular*.6;diffuseColor.a=clamp(a,0.,.85);}
   #include <opaque_fragment>`);};
 veil.customProgramCacheKey=()=>'plaza133-veil';
 Object.assign(URBAN_TILE_SIZE,{'p133:pavers':3,'p133:stone':1.1,'p133:mosaic':1.28,'p133:band':.8,'p133:leafbody':1.3,'p133:bark':1.2});
 return m;
}

// ---- geometry helpers -------------------------------------------------------------------------
// Revolve an (r,y) profile around (cx,cz). Traverse the cross-section outside-up / top-inward /
// inside-down / bottom-outward so faces point out. Non-indexed, flat normals (PS1 facets).
// uvMode: 'none' (projected by the batch), 'wall' (arc, y)/tile, 'flow' adds flow133 (arc m, 0..1).
function revolve(profile,n,{phase=0,lobes=null,uv='none',tile=1,attr=null}={}){
 const P=[],UV=[],F=[],A=[];const len=[0];for(let j=1;j<profile.length;j++)len.push(len[j-1]+Math.hypot(profile[j][0]-profile[j-1][0],profile[j][1]-profile[j-1][1]));
 const pt=(i,j)=>{const a=phase+i/n*TAU,[r0,y]=profile[j],r=lobes?r0*lobes(a,r0,y):r0;return[Math.cos(a)*r,y,Math.sin(a)*r,a,r];};
 for(let i=0;i<n;i++)for(let j=0;j<profile.length-1;j++){const q=[pt(i,j),pt(i,j+1),pt(i+1,j),pt(i+1,j),pt(i,j+1),pt(i+1,j+1)],js=[j,j+1,j,j,j+1,j+1],is=[i,i,i+1,i+1,i,i+1];
  for(let k=0;k<6;k++){const v=q[k];P.push(v[0],v[1],v[2]);const arc=(phase+is[k]/n*TAU)*profile[js[k]][0];
   if(uv==='wall')UV.push(arc/tile,v[1]/tile);else if(uv==='flow'){UV.push(arc,len[js[k]]/len[len.length-1]);F.push(arc,len[js[k]]/len[len.length-1]);}
   if(attr)A.push(...attr);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));if(uv!=='none')g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));if(uv==='flow')g.setAttribute('flow133',new T.Float32BufferAttribute(F,2));if(attr)g.setAttribute('ring133',new T.Float32BufferAttribute(A,attr.length));g.computeVertexNormals();return g;}
function disk(R,n,y,phase,ring){const P=[];for(let i=0;i<n;i++){const a=phase+i/n*TAU,c=phase+(i+1)/n*TAU;P.push(0,y,0,Math.cos(c)*R,y,Math.sin(c)*R,Math.cos(a)*R,y,Math.sin(a)*R);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.computeVertexNormals();if(g.attributes.normal.getY(0)<0){for(let i=0;i<P.length;i+=9)for(let k=0;k<3;k++){const t=P[i+3+k];P[i+3+k]=P[i+6+k];P[i+6+k]=t;}g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.computeVertexNormals();}
 if(ring){const A=[];for(let i=0;i<P.length/3;i++)A.push(...ring);g.setAttribute('ring133',new T.Float32BufferAttribute(A,2));}return g;}
const put=(b,g,key,x,z)=>{b.add(g,key,x,0,z);g.dispose();};

// ---- fountain ---------------------------------------------------------------------------------
// Local plaza ground = .12. Big pool water .06 (r 4.95), octagonal basin water .665, bowls 2.0 / 2.97.
export const PLAZA133_FOUNTAIN={poolR:4.95,copeR:5.25,oct:2.60};
export function fountain133(b,x,z){
 const c=b.point(x,0,z);plaza133.center.value.set(c.x,c.z);plaza133.rot.value=b.frame.ry;
 const O=Math.PI/8;
 b.circle(x,z,5.3);
 // big pool: wet terracotta coping, deep blue glazed band at the water line, blue mosaic below
 put(b,revolve([[5.25,.10],[5.25,.165],[4.95,.165]],72),'p133:pavers',x,z);
 put(b,revolve([[4.95,.165],[4.95,-.03]],72,{uv:'wall',tile:.8}),'p133:band',x,z);
 put(b,revolve([[4.95,-.03],[4.95,-.42],[0,-.42]].slice(0,2),72,{uv:'wall',tile:1.28}),'p133:mosaic',x,z);
 put(b,disk(4.96,72,-.42,0),'p133:mosaic',x,z);
 // octagonal basin: wall, overhanging coping, inner face; mosaic floor
 put(b,revolve([[2.49,-.42],[2.49,.575],[2.61,.575],[2.61,.655],[2.18,.655],[2.18,.25]],8,{phase:O}),'p133:stone',x,z);
 put(b,disk(2.19,8,.25,O),'p133:mosaic',x,z);
 // plinth + column + two lobed bowls + finial in one lathe
 const lob=(a,r,y)=>y>1.7&&y<2.1&&r>1.15?1+.045*Math.cos(16*a)*(r-1.15)/.6:y>2.62&&y<3.05&&r>.6?1+.05*Math.cos(12*a)*(r-.6)/.4:1;
 put(b,revolve([[.98,.25],[.98,.44],[.84,.50],[.84,.74],[.62,.80]],8,{phase:O}),'p133:stone',x,z);
 put(b,revolve([[.50,.80],[.50,.90],[.40,.98],[.33,1.30],[.36,1.44],[.42,1.52],[.36,1.62],[.90,1.70],[1.45,1.86],[1.75,1.99],[1.75,2.06],[1.62,2.06],[1.50,1.99],[.80,1.88],[.30,1.86],
  [.22,1.86],[.22,2.18],[.31,2.28],[.18,2.44],[.21,2.60],[.56,2.72],[.99,2.95],[.99,3.01],[.90,3.01],[.80,2.96],[.30,2.90],[.13,2.90],[.13,3.14],[.21,3.22],[.08,3.36],[0,3.38]],28,{lobes:lob}),'p133:stone',x,z);
 // water surfaces (ring133 = impact radius, octagon metric flag)
 put(b,disk(4.95,72,.06,0,[2.50,1]),'p133:water',x,z);
 put(b,disk(2.61,8,.665,O,[1.97,0]),'p133:water',x,z);
 put(b,disk(1.60,32,1.995,0,[1.16,0]),'p133:water',x,z);
 put(b,disk(.88,24,2.975,0,[.48,0]),'p133:water',x,z);
 // falling sheets
 put(b,revolve([[2.61,.668],[2.665,.63],[2.70,.45],[2.71,.25],[2.71,.06]],8,{phase:O,uv:'flow'}),'p133:veil',x,z);
 put(b,revolve([[1.77,2.03],[1.81,1.92],[1.86,1.66],[1.91,1.30],[1.95,.95],[1.97,.665]],48,{uv:'flow'}),'p133:veil',x,z);
 put(b,revolve([[1.01,3.00],[1.04,2.90],[1.08,2.66],[1.12,2.36],[1.16,2.00]],36,{uv:'flow'}),'p133:veil',x,z);
 put(b,revolve([[.05,3.37],[.09,3.55],[.17,3.63],[.27,3.55],[.37,3.30],[.47,2.98]],20,{uv:'flow'}),'p133:veil',x,z);
}

// ---- broadleaf tree walls ---------------------------------------------------------------------
function rnd(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,2246822519)+0x9e3779b9>>>0)/4294967296);}
// One big tree: trunk + limbs (bark), canopy volumes (jittered icosahedra with leaf-mass texture,
// normals pushed out from the canopy centre) and alpha leaf cards on the volumes' skins.
export function tree133(b,x,z,{seed=1,h=5.6,R=3.6,out=[0,0],flat=.72}={}){
 const r=rnd(seed),cx=x+out[0],cz=z+out[1],cy=h;
 b.circle(x,z,.42);
 const base=[x,.1,z],fork=[x+out[0]*.25,2.4+r()*.5,z+out[1]*.25];b.rod('p133:bark',base,fork,.26);
 const clumps=[];const N=8+Math.floor(r()*3);
 for(let i=0;i<N;i++){const a=i/N*TAU+r()*.6,e=(r()-.35)*1.1,d=R*(.45+.45*r());clumps.push([cx+Math.cos(a)*d*Math.cos(e),cy+Math.sin(e)*d*flat,cz+Math.sin(a)*d*Math.cos(e),R*(.42+.22*r())]);}
 clumps.push([cx,cy+R*.25,cz,R*.62]);
 for(let i=0;i<3;i++){const a=r()*TAU;clumps.push([cx+Math.cos(a)*R*.5+out[0]*.4,1.7+r()*1.1,cz+Math.sin(a)*R*.5+out[1]*.4,R*(.36+.12*r())]);}
 for(const q of clumps){const mid=[(fork[0]+q[0])/2,(fork[1]+q[1])/2-.3,(fork[2]+q[2])/2];b.rod('p133:bark',fork,mid,.14);b.rod('p133:bark',mid,[q[0],q[1]-q[3]*.3,q[2]],.08);}
 const pos=[],nrm=[],uv=[];const tmp=new T.Vector3();
 for(const q of clumps){
  // volume
  const ico=new T.IcosahedronGeometry(q[3]*.78,1).toNonIndexed();const p=ico.attributes.position;
  for(let k=0;k<p.count;k++){tmp.set(p.getX(k),p.getY(k),p.getZ(k));const j=1+.22*Math.sin(tmp.x*3.1+seed)*Math.cos(tmp.z*2.7+tmp.y*1.9);tmp.multiplyScalar(j);tmp.y*=.82;p.setXYZ(k,tmp.x+q[0],tmp.y+q[1],tmp.z+q[2]);}
  ico.deleteAttribute('uv');ico.computeVertexNormals();const nn=ico.attributes.normal;
  for(let k=0;k<p.count;k++){tmp.set(p.getX(k)-cx,(p.getY(k)-cy)*1.3,p.getZ(k)-cz).normalize();const n2=new T.Vector3(nn.getX(k),nn.getY(k),nn.getZ(k)).lerp(tmp,.7).normalize();nn.setXYZ(k,n2.x,n2.y,n2.z);}
  const shade=.62+.38*Math.min(1,Math.max(0,(q[1]-cy+R*.5)/R));b.add(ico,'p133:leafbody',0,0,0,1,1,1,0,0,0,shade);ico.dispose();
  // cards on the skin
  const M=18+Math.floor(r()*7);
  for(let k=0;k<M;k++){const th=r()*TAU,ph=Math.acos(1.6*r()-.75);const dir=new T.Vector3(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th));
   const c0=new T.Vector3(q[0],q[1],q[2]).addScaledVector(dir,q[3]*(.62+.25*r()));const s=q[3]*(.55+.35*r());
   const t1=new T.Vector3(-dir.z,0,dir.x).normalize();if(t1.lengthSq()<.1)t1.set(1,0,0);const up=new T.Vector3(0,1,0).addScaledVector(dir,-dir.y).normalize();const ang=(r()-.5)*1.2;
   const ax=t1.clone().multiplyScalar(Math.cos(ang)).addScaledVector(up,Math.sin(ang)),ay=up.clone().multiplyScalar(Math.cos(ang)).addScaledVector(t1,-Math.sin(ang));
   const qd=Math.floor(r()*4),u0=(qd%2)*.5,v0=(qd>>1)*.5;
   const cross=r()<.5;for(let w=0;w<(cross?2:1);w++){const A=w?dir.clone().cross(ay).normalize():ax;
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>c0.clone().addScaledVector(A,i*s*.5).addScaledVector(ay,j*s*.5));
    const nW=tmp.copy(c0).sub(new T.Vector3(cx,cy-R*.2,cz)).normalize().clone();
    for(const id of[0,1,2,0,2,3]){const v=corners[id];pos.push(v.x,v.y,v.z);nrm.push(nW.x,nW.y,nW.z);uv.push(u0+(id===1||id===2?.5:0),v0+(id>=2?.5:0));}}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nrm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));b.add(g,'p133:leaf',0,0,0);g.dispose();
}

// Tall tapered terracotta planter (photo's patio pots); returns soil height.
export function pot133(b,x,z){put(b,revolve([[.30,.12],[.35,.20],[.47,.84],[.52,.88],[.52,.97],[.45,.97],[.43,.90]],14),'district:terracotta',x,z);
 b.cylinder('bark',x,.9,z,.43,.43,.02,12);b.circle(x,z,.55);return .91;}

// ---- sodium lamp ------------------------------------------------------------------------------
export function lamp133(b,x,z,{h=2.85}={}){
 b.cylinder('photoSteel',x,.32,z,.11,.14,.4,8);b.rod('photoSteel',[x,.5,z],[x,h-.25,z],.045);
 b.cylinder('photoSteel',x,h-.22,z,.08,.06,.1,8);b.sphere('p133:globe',x,h,z,.19,.21,.19);b.cylinder('photoSteel',x,h+.22,z,.06,.16,.06,8);
 const q=b.point(x,h,z),p=new T.Vector3(q.x,q.y,q.z);plaza133.lamp.value.copy(p);plaza133.lights.push(p);b.circle(x,z,.18);
}
export function finishPlaza133(object){
 object.traverse(o=>{if(!o.isMesh)return;const n=o.material?.name||'';if(n.includes('pool water')){o.renderOrder=1;o.castShadow=false;o.userData.noBake133=true;}
  if(n.includes('falling water')){o.renderOrder=2;o.castShadow=false;o.receiveShadow=false;o.userData.noBake133=true;}if(n.includes('sodium')){o.castShadow=false;o.userData.noBake133=true;}});
 for(const p of plaza133.lights){const L=new T.PointLight(0xff9a48,34,22,2);L.name='Plaza133 sodium lamp';L.position.copy(p);L.castShadow=false;object.add(L);
  for(const[s,o]of[[1.5,.95],[5.2,.32]]){const sp=new T.Sprite(new T.SpriteMaterial({map:tex.glow,color:0xffa555,transparent:true,opacity:o,depthWrite:false,blending:T.AdditiveBlending,fog:true}));sp.scale.set(s,s,1);sp.position.copy(p);sp.renderOrder=3;sp.name='Plaza133 lamp glow';object.add(sp);plaza133.glows.push(sp);}}
 plaza133.lights.length=0;
}
