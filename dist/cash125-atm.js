// V125b-L11: the LEFT Hope St ATM (bay x 54.4..56.6 un-mirrored, face z 2.52) keeps spitting out dollar bills.
// One InstancedMesh, one draw call. Every flying bill is animated entirely in the vertex shader from a single time
// uniform (no per-frame CPU work besides setting that uniform in onBeforeRender): eject from the dispenser slot,
// flutter/tumble/bend down to a FIXED landing spot on top of a fixed pile, rest there until the next bill lands,
// then sink 6 mm into the pile and vanish (recycled). The pile itself is static instances, so it never grows.
// Bill front/back are separate generated images (art-v125/v125_bill_*.png -> tools/v125_assets.py -> cash.webp);
// the back face samples the right half of the atlas via gl_FrontFacing.
import * as T from './vendor/three.module.min.js';
import {CASH125} from './outpost125-atlas.js?v=125b';
const BILL_W=.156,BILL_D=.066;
// group-local frame: origin on the ATM front face below the slot, +z = out toward the street, +x = viewer's right
export const CASH125_ATM={x:55.5,z:2.52,ground:.15,slot:[-.094,1.064,0],pile:[-.05,.44],pileR:.33,pileH:.095};
const N_FLY=7,INTERVAL=.6,EJECT=.38,FALL=1.95;
function rand(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createCash125({toWorld,Y,angle}){
 const C=CASH125_ATM,R=rand(12505),group=new T.Group();group.name='Hope St V125b / ATM cash fountain';
 const p=toWorld(C.x,C.z);group.position.set(p.x,Y,p.z);group.rotation.y=angle+Math.PI;
 const tex=new T.TextureLoader().load(new URL('./assets/v125-props/cash.webp?v=125b',import.meta.url).href);
 tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;
 const geo=new T.PlaneGeometry(BILL_W,BILL_D,4,1);geo.rotateX(-Math.PI/2); // lying flat, front up, long axis x
 const mat=new T.MeshLambertMaterial({map:tex,side:T.DoubleSide});
 const peak=C.ground+C.pileH,top=[C.pile[0],peak+.007,C.pile[1]],uT={value:0};
 const fr=CASH125.front,bk=CASH125.back;
 mat.onBeforeCompile=s=>{
  s.uniforms.uT=uT;
  s.vertexShader=`attribute float aPhase;attribute float aSeed;uniform float uT;
const vec3 SLOT=vec3(${C.slot.map(v=>v.toFixed(4)).join(',')});const vec3 TOP=vec3(${top.map(v=>v.toFixed(4)).join(',')});
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
`+s.vertexShader
  .replace('#include <beginnormal_vertex>',`
 mat3 bR=mat3(1.);vec3 bT=vec3(0.);float bBend=0.;float bVis=1.;
 if(aPhase>=0.){
  float C=${(N_FLY*INTERVAL).toFixed(3)},t=uT-aPhase,cyc=floor(t/C),a=t-cyc*C;
  float h=fract(sin((cyc*13.17+aSeed)*78.233)*43758.545),h2=fract(h*91.7+aSeed*.37),side=h2>.5?1.:-1.;
  float yawEnd=(h-.5)*2.6;
  if(a<${EJECT.toFixed(3)}){ // sliding out of the slot, nose dipping
   float e=a/${EJECT.toFixed(3)};bT=SLOT+vec3(0.,-.004,-.07+.135*e);bR=rX(-.25*e*e);
  }else if(a<${(EJECT+FALL).toFixed(3)}){ // flutter down: sway, tumble around the long axis, swing, bend
   float s=(a-${EJECT.toFixed(3)})/${FALL.toFixed(3)},env=sin(3.14159*s),land=smoothstep(.72,1.,s);
   vec3 from=SLOT+vec3(0.,-.004,.065);float c=mix(s*s,s,.62);
   bT=vec3(mix(from.x,TOP.x,s)+.10*sin(s*9.4+h*6.)*env,mix(from.y,TOP.y,c),mix(from.z,TOP.z,smoothstep(0.,1.,s))+.05*sin(s*6.9+1.+h2*4.)*env);
   float tumble=(1.-land)*side*(7.9*s+.6*sin(s*9.));   bR=rY(mix(.3*side,yawEnd,s)+.35*sin(s*5.+h*3.))*rZ(.55*sin(s*9.4+h*6.+1.57)*(1.-land))*rX(-.25+.25*s+tumble);
   bBend=1.6*sin(s*15.+h*4.)*(1.-land);
  }else{
   float r=a-${(EJECT+FALL).toFixed(3)};
   bT=TOP-vec3(0.,.006*clamp(r/${INTERVAL.toFixed(3)}-1.,0.,1.),0.);bR=rY(yawEnd);
   if(r>${(2*INTERVAL).toFixed(3)})bVis=0.; // covered by the next bills: recycled invisibly
  }
 }
 vec3 objectNormal=bR*vec3(normal);
 #ifdef USE_TANGENT
 vec3 objectTangent=vec3(tangent.xyz);
 #endif`)
  .replace('#include <begin_vertex>',`vec3 transformed=vec3(position);transformed.y+=bBend*transformed.x*transformed.x;transformed=(bR*transformed+bT)*bVis;`);
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
 vec2 bu=gl_FrontFacing?vec2(mix(${fr[0]},${fr[2]},vMapUv.x),mix(${fr[1]},${fr[3]},vMapUv.y)):vec2(mix(${bk[2]},${bk[0]},vMapUv.x),mix(${bk[1]},${bk[3]},vMapUv.y));
 vec4 sampledDiffuseColor=texture2D(map,bu);diffuseColor*=sampledDiffuseColor;`);
 };
 mat.customProgramCacheKey=()=>'cash125';
 // static pile: a low mound of bills following its own slope, plus a few strays around the edge
 const S=[];
 for(let i=0;i<112;i++){const a=R()*6.283,r=C.pileR*Math.sqrt(R())*.98,f=1-(r/C.pileR)**2,hgt=C.pileH*f*(.88+.12*R()),slope=Math.atan(2*C.pileH*r/C.pileR**2);
  S.push({x:C.pile[0]+Math.cos(a)*r,z:C.pile[1]+Math.sin(a)*r,y:C.ground+.002+hgt,yaw:R()*6.283,tilt:slope*.85,dir:a,flip:R()<.3});}
 for(let i=0;i<14;i++){const a=R()*6.283,r=C.pileR+.04+R()*.26;S.push({x:C.pile[0]+Math.cos(a)*r,z:C.pile[1]+Math.sin(a)*r,y:C.ground+.0015+i*.0003,yaw:R()*6.283,tilt:R()*.05,dir:a,flip:R()<.4});}
 S.sort((a,b)=>a.y-b.y);S.forEach((b,i)=>b.y+=i*.00012);
 // landing spot sits just above the highest static bill near the centre (compiled into the shader lazily)
 top[1]=Math.max(...S.filter(b=>Math.hypot(b.x-C.pile[0],b.z-C.pile[1])<.1).map(b=>b.y),peak)+.0045;
  const count=S.length+N_FLY,mesh=new T.InstancedMesh(geo,mat,count);mesh.name='Hope St V125b / dollar bills (pile + flying, shader-animated)';
 const phase=new Float32Array(count),seed=new Float32Array(count),m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),one=new T.Vector3(1,1,1),v=new T.Vector3();
 S.forEach((b,i)=>{
  // tilt the bill so it lies on the mound: rotate about the tangent (perpendicular to the radial direction)
  const axis=new T.Vector3(-Math.sin(b.dir),0,Math.cos(b.dir)),qt=new T.Quaternion().setFromAxisAngle(axis,-b.tilt);
  q.setFromEuler(e.set(b.flip?Math.PI:0,b.yaw,0));q.premultiply(qt);
  m4.compose(v.set(b.x,b.y,b.z),q,one);mesh.setMatrixAt(i,m4);phase[i]=-1;seed[i]=i;
 });
 for(let k=0;k<N_FLY;k++){const i=S.length+k;mesh.setMatrixAt(i,new T.Matrix4());phase[i]=k*INTERVAL;seed[i]=17.3*k+3.1;}
 geo.setAttribute('aPhase',new T.InstancedBufferAttribute(phase,1));geo.setAttribute('aSeed',new T.InstancedBufferAttribute(seed,1));
 mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
 const t0=performance.now();
 mesh.onBeforeRender=()=>{uT.value=((performance.now()-t0)/1000)%(N_FLY*INTERVAL*500);};
 group.add(mesh);
 return{object:group,mesh,count};
}
