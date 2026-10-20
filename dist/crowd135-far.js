// V135-capital ④-3 crowd LOD tiers (notes/plan-v135-capital.md §3/§4). A = crowd135.js CPU frame copy (< 12 m).
// B (12–45 m): one InstancedMesh per body (12 draws). The Blender walk/idle frames of crowd135.bin are packed into a float
//   VAT per body (row = frame, texel vid = position, nb+vid = normal) and the head/prop bone matrices into a bone texture per
//   body type (row = frame, 3 texels per bone); the vertex shader reads the instance's frame. Head front + head130 rear band +
//   ears + all 8 props are merged into each body geometry; ears (long-hair faces) and props not worn collapse per instance.
//   Clothing = the same garments135 cells / V75 uv / YIQ hue + tint + value as tier A, carried as instance attributes; faces and
//   generated head130 rears come from one head atlas (two 128² tiles per type/face key, filled when a block's people spawn).
// C (45–150 m): one InstancedMesh of camera-facing quads for everyone. assets/crowd135/sprites135.png is baked offline from
//   tier B by scripts/crowd135/sprites135-bake.js (12 bodies x 8 directions x 9 frames, 24x48 px cells): R = shading, G = slot
//   (skin / top / bottom / shoe / hair), B = detail; the person's own colours (cell averages of its garments after the same
//   recolour, skin, hair, shoes) are instance attributes, so a person keeps its colours from A to C.
import * as T from './vendor/three.module.min.js';
export const PROPS135=['backpack','satchel','bag_kraft','bag_white','tote','phone','cap','beanie'];
const BONES=['head','spine','chest','hips','handL','handR'];
export const SPR135={cw:24,ch:48,cols:72,dirs:8,fcols:9,w:1.0,h:2.0};
const cap0=64;

const GLSL_COMMON=`
uniform sampler2D vatTex;uniform sampler2D boneTex;uniform float vatNB;
attribute vec3 cinfo;// cinfo.y part: 0 body, 1 face, 2 head130 rear, 3 ears, 4..11 props, 12.. hair styles (V137 Q2)
attribute vec2 cuv;
attribute vec4 iCells;attribute vec4 iTopC;attribute vec4 iBotC;attribute vec4 iMisc;attribute vec4 iSkin;attribute vec4 iShoe;attribute vec2 iProp;
flat varying vec3 vCA;flat varying vec3 vCB;flat varying vec2 vTile;varying vec2 vCuv;flat varying float vMode;flat varying float vSlot;
vec3 vatPos;vec3 vatNrm;
vec3 unpack135(float f){f=floor(f+.5);return vec3(floor(f/65536.),mod(floor(f/256.),256.),mod(f,256.))/255.;}
vec2 cell135(float c){return vec2(mod(c,8.)*64./512.,floor(c/8.)*64./320.);}
void vat135(){int fr=int(iMisc.z+.5),part=int(cinfo.y+.5);
 if(part==0){int vid=int(cinfo.x+.5);vatPos=texelFetch(vatTex,ivec2(vid,fr),0).xyz;vatNrm=texelFetch(vatTex,ivec2(vid+int(vatNB),fr),0).xyz;}
 else{int b=int(cinfo.x+.5)*3;vec4 a0=texelFetch(boneTex,ivec2(b,fr),0),a1=texelFetch(boneTex,ivec2(b+1,fr),0),a2=texelFetch(boneTex,ivec2(b+2,fr),0);
  mat3 R=mat3(a0.xyz,vec3(a0.w,a1.xy),vec3(a1.zw,a2.x));vatPos=R*position+a2.yzw;vatNrm=R*normal;
  bool hide=(part==3&&iSkin.w<.5)||(part>=4&&part<12&&((int(iShoe.w+.5)>>(part-4))&1)==0)||(part>=12&&int(iCells.z+.5)!=part-11);if(hide)vatPos=vec3(0.);}
 vCuv=cuv;vCB=vec3(0.,1.,1.);vTile=vec2(-1.);
 vSlot=part==0?0.:part<4?5.:6.;
 if(part==0){int s=int(cinfo.z+.5);vMode=0.;vSlot=s==0?0.:s<4?1.:s==4?2.:3.;
  if(s==0)vCA=iSkin.rgb;else if(s==5)vCA=iShoe.rgb;
  else if(s==4){vCA=iBotC.rgb;vCB=vec3(iBotC.w,1.,iMisc.y);vTile=cell135(iCells.y);}
  else{vCA=iTopC.rgb;vCB=vec3(iTopC.w,1.,iMisc.x);vTile=cell135(iCells.x+float(s-1));}}
 else if(part<4){vMode=1.;float t=iMisc.w*2.+(part==1?0.:1.);vTile=vec2(mod(t,8.),floor(t/8.))*128.;vCA=vec3(1.);}
 else if(part>=12){vMode=3.;vSlot=4.;vCA=unpack135(iCells.w);}
 else{vMode=2.;int tk=int(cinfo.z+.5);vCA=tk==1?unpack135(iProp.x):tk==2?unpack135(iProp.y):vec3(1.);}}
`;
const GLSL_FRAG_COMMON=`
uniform sampler2D garmMap;uniform sampler2D headAtlas;uniform sampler2D propMap;uniform sampler2D hairMap;uniform vec2 headAtlasSize;
flat varying vec3 vCA;flat varying vec3 vCB;flat varying vec2 vTile;varying vec2 vCuv;flat varying float vMode;
vec3 albedo135(){vec3 o;
 if(vMode<.5){if(vTile.x<0.)o=vCA;else{vec3 c=texture2D(garmMap,vTile+(clamp(vCuv,0.,1.)*62.+1.)/vec2(512.,320.)).rgb;
  vec3 q=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312)*c;float cs=cos(vCB.x),sn=sin(vCB.x);q.yz=mat2(cs,sn,-sn,cs)*q.yz;
  o=max(mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703)*q,0.)*vCB.z*vCA;}}
 else if(vMode<1.5)o=texture2D(headAtlas,(vTile+clamp(vCuv*128.,.5,127.5))/headAtlasSize).rgb;
 else if(vMode<2.5)o=texture2D(propMap,vCuv).rgb*vCA;else o=texture2D(hairMap,vCuv).r*2.*vCA;return o;}
`;
function patchB(mat,u){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+GLSL_COMMON)
  .replace('#include <beginnormal_vertex>','vat135();vec3 objectNormal=vatNrm;\n#ifdef USE_TANGENT\nvec3 objectTangent=vec3(1.,0.,0.);\n#endif')
  .replace('#include <begin_vertex>','vec3 transformed=vatPos;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+GLSL_FRAG_COMMON).replace('#include <map_fragment>','diffuseColor.rgb*=albedo135();');};
 mat.customProgramCacheKey=()=>'crowd135-vat';return mat;}

// per-body VAT + per-type bone texture + merged geometry
function buildBody(lib,bi){const B=lib.bodies[bi],S=lib.meta.posScale,nb=B.verts,F=B.P.length/(nb*3),MP=B.map,nv=B.split;
 const vd=new Float32Array(nb*2*F*4);for(let f=0;f<F;f++)for(let i=0;i<nb;i++){const k=(f*nb+i)*3,a=(f*nb*2+i)*4,b=(f*nb*2+nb+i)*4;
  vd[a]=B.P[k]*S;vd[a+1]=B.P[k+1]*S;vd[a+2]=B.P[k+2]*S;vd[b]=B.N[k]/127;vd[b+1]=B.N[k+1]/127;vd[b+2]=B.N[k+2]/127;}
 const vat=new T.DataTexture(vd,nb*2,F,T.RGBAFormat,T.FloatType);vat.minFilter=vat.magFilter=T.NearestFilter;vat.needsUpdate=true;
 const P=[],N=[],U=[],C=[],I=[];let base=0;
 for(let i=0;i<nv;i++){const k=MP[i]*3;P.push(B.P[k]*S,B.P[k+1]*S,B.P[k+2]*S);N.push(B.N[k]/127,B.N[k+1]/127,B.N[k+2]/127);U.push(B.UV.array[i*2],B.UV.array[i*2+1]);C.push(MP[i],0,B.slot[i]);}
 for(let i=0;i<B.idx.count;i++)I.push(B.idx.array[i]);base=nv;
 const add=(g,bone,part,tk,partOf)=>{const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;
  for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));U.push(u.getX(i),u.getY(i));C.push(bone,partOf?partOf(i):part,tk);}
  if(g.index)for(let i=0;i<g.index.count;i++)I.push(base+g.index.array[i]);else for(let i=0;i<p.count;i++)I.push(base+i);base+=p.count;};
 const H=lib.headGeo(B.type);add(H.front,0,1,0);
 const ru=H.rear.attributes.uv,ear=i=>{const t=i-i%3;return ru.getY(t)<.285&&ru.getY(t+1)<.285&&ru.getY(t+2)<.285?3:2;};add(H.rear,0,2,0,ear);
 const AC=lib.acc[B.type]||{};PROPS135.forEach((n,k)=>{const a=AC[n];if(a)add(a.geo,BONES.indexOf(lib.meta.heads[B.type].acc[n].bone),4+k,n==='backpack'?1:n==='cap'?2:0);});
 lib.hairGeo(B.type).forEach((hg,s)=>{if(hg)add(hg,0,12+s,0);});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
 g.setAttribute('cuv',new T.Float32BufferAttribute(U,2));g.setAttribute('cinfo',new T.Float32BufferAttribute(C,3));g.setIndex(I);
 return{g,vat,nb,F,tris:I.length/3};}
function boneTex(lib,type){const H=lib.meta.heads[type],mats=[lib.headGeo(type).mats,...BONES.slice(1).map(b=>lib.view(Float32Array,H.bones[b]))],F=mats[0].length/12;
 const d=new Float32Array(18*F*4);for(let f=0;f<F;f++)for(let b=0;b<6;b++)for(let j=0;j<12;j++)d[(f*18+b*3)*4+j]=mats[b][f*12+j];
 const t=new T.DataTexture(d,18,F,T.RGBAFormat,T.FloatType);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;}

export const BAKE135={buildBody,boneTex,GLSL_COMMON,GLSL_FRAG_COMMON};
export const IATTR135=[['iCells',4],['iTopC',4],['iBotC',4],['iMisc',4],['iSkin',4],['iShoe',4],['iProp',2]];
function instAttrs(g,cap){const o={};for(const[n,s]of IATTR135){const a=new T.InstancedBufferAttribute(new Float32Array(cap*s),s);a.setUsage(T.DynamicDrawUsage);g.setAttribute(n,a);o[n]=a;}return o;}
const pack=c=>Math.round(Math.min(1,c.r)*255)*65536+Math.round(Math.min(1,c.g)*255)*256+Math.round(Math.min(1,c.b)*255);
// instance record of a look (crowd135.js look135): 26 floats, frame at [14]
export function bRecord135(L,headTile){const r=new Float32Array(26);
 r.set([L.t0,L.b0,(L.hairIx??-1)+1,L.hairC?pack(L.hairC):0, ...L.rT.t,L.rT.h, ...L.rB.t,L.rB.h, L.rT.v,L.rB.v,0,headTile, L.sk.r,L.sk.g,L.sk.b,L.ears?1:0, L.shoe.r,L.shoe.g,L.shoe.b,L.propMask, pack(L.tintA),pack(L.tintB)]);return r;}

export function createTierB135(lib,uniforms){const group=new T.Group();group.name='crowd135 tier B';const bodies=[];
 const tex={},mats=[];
 function body(bi){if(bodies[bi])return bodies[bi];const b=buildBody(lib,bi),type=lib.bodies[bi].type;tex[type]??=boneTex(lib,type);
  const m=patchB(Object.assign(new T.MeshLambertMaterial(),{name:'crowd135 B'}),{...uniforms,vatTex:{value:b.vat},boneTex:{value:tex[type]},vatNB:{value:b.nb}});mats.push(m);
  const mk=cap=>{const at=instAttrs(b.g,cap),mesh=new T.InstancedMesh(b.g,m,cap);mesh.frustumCulled=false;mesh.count=0;mesh.name='crowd135 B '+lib.bodies[bi].type+'/'+lib.bodies[bi].sil;return{mesh,at,cap};};
  const o={b,...mk(cap0),n:0,grow(){const c=o.cap*2,old=Object.fromEntries(IATTR135.map(([n])=>[n,o.at[n].array])),om=o.mesh.instanceMatrix.array;group.remove(o.mesh);o.mesh.dispose();Object.assign(o,mk(c));for(const[n]of IATTR135)o.at[n].array.set(old[n]);o.mesh.instanceMatrix.array.set(om);group.add(o.mesh);}};group.add(o.mesh);return bodies[bi]=o;}
 function begin(){for(const o of bodies)if(o)o.n=0;}
 // add one instance: world matrix m (Matrix4), record r (bRecord135), frame f
 function push(bi,m,r,f){const o=body(bi);if(o.n>=o.cap)o.grow();const i=o.n++;o.mesh.setMatrixAt(i,m);r[14]=f;let k=0;
  for(const[n,s]of IATTR135){o.at[n].array.set(r.subarray(k,k+s),i*s);k+=s;}}
 function end(){let tris=0;for(const o of bodies)if(o){o.mesh.count=o.n;if(o.n){o.mesh.instanceMatrix.needsUpdate=true;for(const[n]of IATTR135)o.at[n].needsUpdate=true;}tris+=o.n*o.b.tris;}return tris;}
 function dispose(){for(const o of bodies)if(o){o.mesh.dispose();o.b.g.dispose();o.b.vat.dispose();}for(const t of Object.values(tex))t.dispose();for(const m of mats)m.dispose();group.removeFromParent();}
 return{group,body,begin,push,end,dispose,get draws(){return bodies.filter(o=>o&&o.n).length;}};}

// ---- tier C: sprite impostors
export function createTierC135(sprites){const S=SPR135,W=S.cw*S.cols,H=S.ch*12;
 const g0=new T.PlaneGeometry(S.w,S.h);g0.translate(0,S.h/2,0);const g=new T.BufferGeometry();g.index=g0.index;g.setAttribute('position',g0.attributes.position);g.setAttribute('uv',g0.attributes.uv);g.setAttribute('normal',g0.attributes.normal);
 const A=[['sC',2],['sSkin',3],['sTop',3],['sBot',3],['sShoe',3],['sHair',3]];
 const mat=new T.MeshLambertMaterial({alphaTest:.5});mat.name='crowd135 C';
 mat.onBeforeCompile=sh=>{sh.uniforms.sprMap={value:sprites};
  sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
attribute vec2 sC;attribute vec3 sSkin;attribute vec3 sTop;attribute vec3 sBot;attribute vec3 sShoe;attribute vec3 sHair;
flat varying vec3 cSkin;flat varying vec3 cTop;flat varying vec3 cBot;flat varying vec3 cShoe;flat varying vec3 cHair;flat varying vec2 cCell;varying vec2 cLoc;
vec3 sprW;vec3 sprN;`)
   .replace('#include <beginnormal_vertex>',`mat4 IM=modelMatrix*instanceMatrix;vec3 cW=(IM*vec4(0.,0.,0.,1.)).xyz,fz=(IM*vec4(0.,0.,1.,0.)).xyz,fx=(IM*vec4(1.,0.,0.,0.)).xyz;
 vec2 tc=normalize(cameraPosition.xz-cW.xz+vec2(1e-5));float ang=atan(dot(tc,normalize(fx.xz)),dot(tc,normalize(fz.xz)));float dk=mod(floor(ang/.7853982+.5),8.);
 sprW=cW+vec3(tc.y,0.,-tc.x)*position.x+vec3(0.,position.y,0.);sprN=vec3(tc.x,0.,tc.y);
 cCell=vec2((dk*${S.fcols}.+sC.y)*${S.cw}.,sC.x*${S.ch}.);cLoc=uv*vec2(${S.cw}.,${S.ch}.);
 cSkin=sSkin;cTop=sTop;cBot=sBot;cShoe=sShoe;cHair=sHair;vec3 objectNormal=sprN;`)
   .replace('#include <defaultnormal_vertex>','vec3 transformedNormal=normalize(mat3(viewMatrix)*sprN);')
   .replace('#include <project_vertex>','vec4 mvPosition=viewMatrix*vec4(sprW,1.);gl_Position=projectionMatrix*mvPosition;')
   .replace('#include <worldpos_vertex>','');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D sprMap;flat varying vec3 cSkin;flat varying vec3 cTop;flat varying vec3 cBot;flat varying vec3 cShoe;flat varying vec3 cHair;flat varying vec2 cCell;varying vec2 cLoc;`)
   .replace('#include <map_fragment>',`vec4 s=texture2D(sprMap,(cCell+clamp(cLoc,vec2(.5),vec2(${S.cw}.-.5,${S.ch}.-.5)))/vec2(${W}.,${H}.));if(s.a<.5)discard;
 int sl=int(s.g*255./32.);vec3 col=sl==0?cSkin:sl==1?cTop:sl==2?cBot:sl==3?cShoe:cHair;diffuseColor.rgb*=col*s.r*1.25*(s.b*2.);`)
   .replace('#include <alphatest_fragment>','');};
 mat.customProgramCacheKey=()=>'crowd135-spr';
 let cap=0,mesh=null,at={},n=0;const group=new T.Group();group.name='crowd135 tier C';
 function mk(c){if(mesh){group.remove(mesh);mesh.dispose();}cap=c;at={};for(const[k,s]of A){const a=new T.InstancedBufferAttribute(new Float32Array(c*s),s);a.setUsage(T.DynamicDrawUsage);g.setAttribute(k,a);at[k]=a;}
  mesh=new T.InstancedMesh(g,mat,c);mesh.frustumCulled=false;mesh.count=0;mesh.name='crowd135 C sprites';group.add(mesh);}
 mk(128);
 // record: 17 floats [body, fcol, skin3, top3, bot3, shoe3, hair3]
 function begin(){n=0;}
 function push(m,r,fcol){if(n>=cap){const old=Object.fromEntries(A.map(([k])=>[k,at[k].array])),om=mesh.instanceMatrix.array;mk(cap*2);for(const[k]of A)at[k].array.set(old[k]);mesh.instanceMatrix.array.set(om);}
  const i=n++;mesh.setMatrixAt(i,m);r[1]=fcol;let k=0;for(const[a,s]of A){at[a].array.set(r.subarray(k,k+s),i*s);k+=s;}}
 function end(){mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;for(const[k]of A)at[k].needsUpdate=true;}return n*2;}
 function dispose(){mesh.dispose();g.dispose();mat.dispose();group.removeFromParent();}
 return{group,begin,push,end,dispose};}
