// V131 L11 canal water: a Three.js port of Clearwater (https://github.com/Aureliengmz/clearwater) tuned for a shallow,
// murky, green-grey city canal and the game's PS1 'pixel' look. Ported parts: Tessendorf FFT wave spectrum (height + slope
// maps), wave-equation ripple simulation, refracted-grid caustics, Fresnel / absorption / in-scatter / LEAN-style distant
// highlights. NOT ported: the lens-diffraction glare and all full-screen post (the game has its own display filter).
// Changes vs the original: small patch (L 6 m), no swell, low RMS slope, low-res sims (FFT 64², ripples 128² over 16 m around
// the camera, caustics 128² from a 64² ray grid), single-channel caustics, analytic canal reflections (walls + building lines
// + sky, from V128) instead of the sea sky, canal bed of silt + the embankment wall under water, colour posterised with a
// 4x4 ordered dither so the surface sits with the low-fi textures. Everything is sampled in continuous city coordinates
// (rotated city frame, unshifted world positions from the batch geometry, camera minus the floating-origin offset of the
// mesh) so all hashed canal blocks share one seamless surface. Needs WebGL2 + EXT_color_buffer_float; otherwise (or with
// ?w131=0 / localStorage bumpercrop.w131=0) the V128 water shading is used unchanged.
//
// Clearwater by Aurélien (https://x.com/Aurelien_Gz) at Lumaris (https://lumaris.works) is MIT licensed; its notice
// (also in LICENSE-clearwater.txt next to this file):
// ---------------------------------------------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2026 Lumaris
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ---------------------------------------------------------------------------------------------------------------------------
import * as T from './vendor/three.module.min.js';
import {CITY_ORIGIN,CITY_ANGLE} from './urban-layout.js?v=60';
import {CANAL,canalBlock,canalRow} from './canal128-layout.js?v=128';

const C=CANAL,B=112,HW=(C.z1-C.z0)/2,MID=C.mid,ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
const Q=(()=>{try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams();}})();
const HI=Q.get('w131')==='hi';
// canal parameters (clearwater ocean: L 4.6, DEPTH 1.6, TARGET_SLOPE .078, RN 256 over 7 m, G 256 -> C 1024)
export const W131P={N:HI?128:64,LOGN:HI?7:6,L:6.0,DEPTH:1.1,TARGET_SLOPE:.034,RN:128,RSIZE:16,G:HI?128:64,CR:HI?256:128,CAUS_R:26,IOR:1.3335};
const P=W131P;
// shared uniforms (water + wall materials)
export const W131U={
 uW131:{value:0},uSurf131:{value:null},uRip131:{value:null},uCaus131:{value:null},uWall131:{value:null},
 uRipC131:{value:new T.Vector3(0,0,P.RSIZE)},uSun131:{value:new T.Vector3(-.3,.8,-.5).normalize()},uSunC131:{value:new T.Color(1,.93,.8)},
 uP131:{value:new T.Vector4(0,0,P.CAUS_R,0)},uK131:{value:new T.Vector4(P.L,P.DEPTH,0,0)},uWY131:{value:.28+C.water},
 uLow131:{value:[0,1,2,3].map(()=>new T.Vector4(0,0,0,0))},uTune131:{value:new T.Vector4(1,1,1,1)}
};
export const W131={state:'idle',reason:'',frames:0,ms:0,drops:0,emitters:new Map(),P,U:W131U};
globalThis.__w131=W131;
function disabledByUser(){try{if(Q.get('w131')==='0')return true;if(localStorage.getItem('bumpercrop.w131')==='0')return true;}catch(e){}return false;}

// ------------------------------------------------------------------------------------------------ emitters (canal130-life)
// block-local positions (x along the canal, z across), kinds: drain | boat | buoy | pontoon. Registered per block when the
// block's life dressing is built; deterministic, so re-registration simply overwrites.
export function canal131Emitters(plan,list){W131.emitters.set(plan.ix+','+plan.iz,list.map(e=>({...e,x:e.x+plan.x,z:e.z+plan.z,ph:((e.x*12.9898+e.z*78.233)%1+1)%1})));
 if(W131.emitters.size>40){const k=W131.emitters.keys().next().value;W131.emitters.delete(k);}}

// ------------------------------------------------------------------------------------------------ GPU passes
const VS=`precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`;
const HEAD=`precision highp float;precision highp sampler2D;precision highp int;in vec2 vUv;out vec4 o;\n`;
function raw(fs,uniforms,extra={}){return new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:VS,fragmentShader:HEAD+fs,uniforms,depthTest:false,depthWrite:false,...extra});}
function rt(n,type,{filter=T.NearestFilter,min=filter,wrap=T.RepeatWrapping,mip=false}={}){
 const r=new T.WebGLRenderTarget(n,n,{type,format:T.RGBAFormat,magFilter:filter,minFilter:min,wrapS:wrap,wrapT:wrap,depthBuffer:false,stencilBuffer:false,generateMipmaps:mip});
 r.texture.colorSpace=T.NoColorSpace;return r;}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// canal spectrum: short wind ripples along the canal, no swell, steep cut-off, weak counter-wind lobe
function buildH0(){
 const N=P.N,L=P.L,rnd=mulberry(131),gauss=()=>{let u=0,v=0;while(!u)u=rnd();v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
 const kp=2*Math.PI/.85,kcut=2*Math.PI/.11,wd=[.94,.34],re=new Float32Array(N*N),im=new Float32Array(N*N);let s2=0;
 for(let m=0;m<N;m++)for(let n=0;n<N;n++){const nx=n<N/2?n:n-N,nz=m<N/2?m:m-N,kx=2*Math.PI*nx/L,kz=2*Math.PI*nz/L,k=Math.hypot(kx,kz);let Pk=0;
  if(k>1e-6){const lk=Math.log(k/kp),bump=Math.exp(-.5*(lk/.42)**2),tail=.05*Math.exp(-((kp/k)**2))*Math.exp(-((k/kcut)**2)),c=(kx*wd[0]+kz*wd[1])/k,spread=(.35+.65*c*c)*(c<0?.45:1);Pk=(bump+tail)*spread/(k*k*k*k);}
  const a=Math.sqrt(Pk/2),i=m*N+n;re[i]=gauss()*a;im[i]=gauss()*a;s2+=2*k*k*(re[i]*re[i]+im[i]*im[i]);}
 const sc=P.TARGET_SLOPE/Math.sqrt(s2),d=new Float32Array(N*N*4);
 for(let m=0;m<N;m++)for(let n=0;n<N;n++){const i=m*N+n,j=((N-m)%N)*N+((N-n)%N);d[i*4]=re[i]*sc;d[i*4+1]=im[i]*sc;d[i*4+2]=re[j]*sc;d[i*4+3]=-im[j]*sc;}
 const t=new T.DataTexture(d,N,N,T.RGBAFormat,T.FloatType);t.minFilter=t.magFilter=T.NearestFilter;t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}

function createSim(renderer){
 const N=P.N,gl=renderer.getContext();
 const quadGeo=new T.BufferGeometry();quadGeo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const quad=new T.Mesh(quadGeo);quad.frustumCulled=false;const scene=new T.Scene();scene.add(quad);const cam=new T.Camera();
 const h0=buildH0(),fftA=rt(N,T.FloatType),fftB=rt(N,T.FloatType),surf=rt(N,T.HalfFloatType,{filter:T.NearestFilter,min:T.NearestMipmapLinearFilter,mip:true});
 // completeness probe (EXT_color_buffer_float present but some drivers still refuse float FBOs)
 const prev=renderer.getRenderTarget();renderer.setRenderTarget(fftA);const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;renderer.setRenderTarget(surf);const ok2=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;renderer.setRenderTarget(prev);
 if(!ok||!ok2)throw Error('float render target incomplete');
 const mSpec=raw(`uniform sampler2D uH0;uniform float uT,uL;
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
void main(){ivec2 id=ivec2(gl_FragCoord.xy);vec4 s=texelFetch(uH0,id,0);vec2 n=vec2(id);n-=step(${N/2}.0,n)*${N}.0;
 vec2 k=6.28318530718*n/uL;float kl=length(k);float w=sqrt(9.81*kl+7.4e-5*kl*kl*kl);
 float w0=6.28318530718/60.0;w=floor(w/w0)*w0;   // dispersion quantised: seamless 60 s loop (time runs mod 60)
 float c=cos(w*uT),sn=sin(w*uT);vec2 H=cmul(s.xy,vec2(c,sn))+cmul(s.zw,vec2(c,-sn));
 vec2 C1=H-k.x*H;                        // h + i*dh/dx (IFFT of H + i*(i k.x H))
 vec2 C2=vec2(-k.y*H.y,k.y*H.x);o=vec4(C1,C2);}`,{uH0:{value:h0},uT:{value:0},uL:{value:P.L}});
 const mFFT=raw(`uniform sampler2D uSrc;uniform int uP,uHoriz;
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
void main(){ivec2 id=ivec2(gl_FragCoord.xy);int j=uHoriz==1?id.x:id.y;int k=j&(uP-1);int i=((j-(j&(2*uP-1)))>>1)+k;bool y1=(j&uP)!=0;
 ivec2 a=uHoriz==1?ivec2(i,id.y):ivec2(id.x,i);ivec2 b=uHoriz==1?ivec2(i+${N/2},id.y):ivec2(id.x,i+${N/2});
 vec4 x0=texelFetch(uSrc,a,0),x1=texelFetch(uSrc,b,0);float ang=3.14159265359*float(k)/float(uP);vec2 w=vec2(cos(ang),sin(ang));
 vec4 wx=vec4(cmul(w,x1.xy),cmul(w,x1.zw));o=y1?x0-wx:x0+wx;}`,{uSrc:{value:null},uP:{value:1},uHoriz:{value:1}});
 const mRes=raw(`uniform sampler2D uSrc;void main(){vec4 s=texelFetch(uSrc,ivec2(gl_FragCoord.xy),0);vec2 sl=vec2(s.y,s.z);o=vec4(s.x,sl,dot(sl,sl));}`,{uSrc:{value:null}});
 // ripples (wave equation, slower waves for 12.5 cm texels: k .05; up to 8 drops per step)
 const RN=P.RN,rip=[0,1].map(()=>rt(RN,T.HalfFloatType,{filter:T.LinearFilter,wrap:T.ClampToEdgeWrapping})),ripN=rt(RN,T.HalfFloatType,{filter:T.LinearFilter,wrap:T.ClampToEdgeWrapping});
 const drops=[...Array(8)].map(()=>new T.Vector4());
 const mRip=raw(`uniform sampler2D uSrc;uniform vec2 uShift;uniform vec4 uDrop[8];
void main(){vec2 px=1.0/vec2(textureSize(uSrc,0));vec2 uv=vUv+uShift;vec4 c=texture(uSrc,uv);
 float avg=.25*(texture(uSrc,uv+vec2(px.x,0)).r+texture(uSrc,uv-vec2(px.x,0)).r+texture(uSrc,uv+vec2(0,px.y)).r+texture(uSrc,uv-vec2(0,px.y)).r);
 float v=c.g+(avg-c.r)*.42;v*=.993;float h=c.r+v;h*=.997;
 for(int i=0;i<8;i++){vec4 d=uDrop[i];if(d.w!=0.0){float dd=length(vUv-d.xy);if(dd<d.z)h-=d.w*(.5+.5*cos(3.14159*dd/d.z));}}
 vec2 e=min(vUv,1.0-vUv);float edge=smoothstep(0.0,.08,min(e.x,e.y));h*=mix(.9,1.0,edge);v*=mix(.9,1.0,edge);
 if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){h=0.;v=0.;}o=vec4(h,v,0,1);}`,{uSrc:{value:null},uShift:{value:new T.Vector2()},uDrop:{value:drops}});
 const mRipN=raw(`uniform sampler2D uSrc;uniform float uTexel;
void main(){vec2 px=1.0/vec2(textureSize(uSrc,0));float r=texture(uSrc,vUv+vec2(px.x,0)).r,l=texture(uSrc,vUv-vec2(px.x,0)).r,u=texture(uSrc,vUv+vec2(0,px.y)).r,d=texture(uSrc,vUv-vec2(0,px.y)).r,h=texture(uSrc,vUv).r;
 o=vec4(h,(r-l)/(2.0*uTexel),(u-d)/(2.0*uTexel),(r+l+u+d-4.0*h)/(uTexel*uTexel));}`,{uSrc:{value:null},uTexel:{value:P.RSIZE/RN}});
 // caustics: refracted ray grid splatted with additive blending; area ratio = intensity (Evan Wallace / clearwater)
 const G=P.G,CR=P.CR,caus=rt(CR,T.HalfFloatType,{filter:T.LinearFilter,min:T.LinearMipmapLinearFilter,mip:true});
 const gp=[],gi=[];for(let j=0;j<=G;j++)for(let i=0;i<=G;i++)gp.push(i/G,j/G,0);for(let j=0;j<G;j++)for(let i=0;i<G;i++){const a=j*(G+1)+i,b=a+1,c=a+G+1,d=c+1;gi.push(a,b,c,b,d,c);}
 const gg=new T.InstancedBufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(gp,3));gg.setIndex(gi);gg.instanceCount=9;
 const mCaus=new T.RawShaderMaterial({glslVersion:T.GLSL3,depthTest:false,depthWrite:false,transparent:true,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneFactor,blendEquation:T.AddEquation,
  uniforms:{uSurf:{value:surf.texture},uL:{value:P.L},uDepth:{value:P.DEPTH},uIor:{value:P.IOR},uSun:{value:new T.Vector3(0,1,0)},uShift:{value:new T.Vector2()},uNorm:{value:(CR/P.L)**2}},
  vertexShader:`precision highp float;precision highp sampler2D;in vec3 position;uniform sampler2D uSurf;uniform float uL,uDepth,uIor;uniform vec3 uSun;uniform vec2 uShift;out vec2 vSrc;
void main(){vec2 aUV=position.xy;ivec2 off=ivec2(gl_InstanceID%3-1,gl_InstanceID/3-1);vec4 s=textureLod(uSurf,aUV,0.0);vec3 n=normalize(vec3(-s.y*2.2,1.0,-s.z*2.2));   // slope gain: canal waves are too gentle to focus over ~1 m otherwise
 vec3 r=refract(-uSun,n,1.0/uIor);vec3 P=vec3(aUV.x*uL,s.x,aUV.y*uL);vec3 F=P+r*((-uDepth-s.x)/r.y);vSrc=aUV*uL;vec2 c=(F.xz-uShift)/uL+vec2(off);gl_Position=vec4(c*2.0-1.0,0.0,1.0);}`,
  fragmentShader:`precision highp float;in vec2 vSrc;out vec4 o;uniform float uNorm;void main(){vec2 a=dFdx(vSrc),b=dFdy(vSrc);float I=min(abs(a.x*b.y-a.y*b.x)*uNorm,12.0);o=vec4(I);}`});
 const causMesh=new T.Mesh(gg,mCaus);causMesh.frustumCulled=false;const causScene=new T.Scene();causScene.add(causMesh);
 let ri=0,center=null,acc=0,last=performance.now(),cframe=0;
 function pass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(scene,cam);}
 function fft(t){mSpec.uniforms.uT.value=t;pass(mSpec,fftA);let src=fftA,dst=fftB;
  for(let horiz=1;horiz>=0;horiz--)for(let s=0;s<P.LOGN;s++){mFFT.uniforms.uSrc.value=src.texture;mFFT.uniforms.uP.value=1<<s;mFFT.uniforms.uHoriz.value=horiz;pass(mFFT,dst);[src,dst]=[dst,src];}
  mRes.uniforms.uSrc.value=src.texture;pass(mRes,surf);}
 function ripples(cx,cz,dropList){
  const tx=P.RSIZE/RN,nx=Math.round(cx/tx)*tx,nz=Math.round(cz/tx)*tx;let sx=0,sz=0;
  if(center){sx=(nx-center[0])/P.RSIZE;sz=(nz-center[1])/P.RSIZE;if(Math.abs(sx)>.5||Math.abs(sz)>.5){sx=sz=0;renderer.setRenderTarget(rip[0]);renderer.clear();renderer.setRenderTarget(rip[1]);renderer.clear();}}
  center=[nx,nz];W131U.uRipC131.value.set(nx,nz,P.RSIZE);
  for(let i=0;i<8;i++){const d=dropList[i];if(d)drops[i].set((d[0]-nx)/P.RSIZE+.5,(d[1]-nz)/P.RSIZE+.5,d[2]/P.RSIZE,d[3]);else drops[i].set(0,0,0,0);}
  mRip.uniforms.uSrc.value=rip[ri].texture;mRip.uniforms.uShift.value.set(sx,sz);pass(mRip,rip[1-ri]);ri=1-ri;
  mRipN.uniforms.uSrc.value=rip[ri].texture;pass(mRipN,ripN);}
 function caustics(sunC){
  const sy=Math.max(.2,sunC.y),sinI=Math.sqrt(1-sy*sy),sinT=sinI/P.IOR,cosT=Math.sqrt(1-sinT*sinT),hd=Math.hypot(sunC.x,sunC.z)||1,tanT=sinT/cosT;
  const sh=[-sunC.x/hd*P.DEPTH*tanT,-sunC.z/hd*P.DEPTH*tanT];mCaus.uniforms.uShift.value.set(sh[0],sh[1]);mCaus.uniforms.uSun.value.set(sunC.x,sy,sunC.z).normalize();
  W131U.uK131.value.z=sh[0];W131U.uK131.value.w=sh[1];
  renderer.setRenderTarget(caus);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(causScene,cam);}
 W131U.uSurf131.value=surf.texture;W131U.uRip131.value=ripN.texture;W131U.uCaus131.value=caus.texture;
 return{rts:{surf,rip,ripN,caus,fftA,fftB},fft,ripples,caustics,clearRip(){center=null;},step(t,cx,cz,drops,sunC){fft(t%60);ripples(cx,cz,drops);if((cframe++&1)===0)caustics(sunC);}};
}

// ------------------------------------------------------------------------------------------------ per-frame driver
let sim=null,lastStep=0,lastT=0,clock=0,lastPlayer=null,rng=mulberry(9);
const tmpV=new T.Vector3(),tmpS=new T.Vector3();
function cityOf(wx,wz){const dx=wx-CITY_ORIGIN.x,dz=wz-CITY_ORIGIN.z;return[ca*dx-sa*dz,sa*dx+ca*dz];}
function toCityDir(v,out){return out.set(ca*v.x-sa*v.z,v.y,sa*v.x+ca*v.z);}
function findSun(scene){let s=null;scene.traverse(o=>{if(!s&&o.isDirectionalLight&&o.visible)s=o;});return s;}
let sunObj=null,sunScene=null,sunCheck=0;
function collectDrops(cam,dt){
 const [cx,cz]=cam,list=[],R=P.RSIZE*.45,now=clock;
 // player / camera over the water strip (pontoons, ladders, boats): feet ripples when moving, idle shuffle every ~1.2 s
 const iz=Math.floor(cz/B),lz=cz-iz*B,ix=Math.floor(cx/B),cn=canalRow(iz)?canalBlock(ix,iz):null;
 if(cn&&lz>C.z0+.2&&lz<C.z1-.2&&W131.camH<3.0){const moved=lastPlayer?Math.hypot(cx-lastPlayer[0],cz-lastPlayer[1]):1;
  if(moved>.35||rng()<dt/1.2){list.push([cx,cz,.9,.08]);lastPlayer=[cx,cz];}}
 for(const arr of W131.emitters.values())for(const e of arr){if(Math.abs(e.x-cx)>R||Math.abs(e.z-cz)>R)continue;
  if(e.k==='drain'){for(let k=0;k<2;k++)if(rng()<dt*(e.big?12:7))list.push([e.x+(rng()-.5)*.3*(e.big?1.6:1),e.z+(rng()*.25+.15)*e.s,e.big?.75:.55,e.big?.05:.035]);}
  else if(e.k==='buoy'){const p=(now/2.3+e.ph)%1;if(p<dt/2.3)list.push([e.x,e.z,.9,.06]);}
  else if(e.k==='boat'){const p=(now/(1.8+e.ph)+e.ph)%1;if(p<dt/(1.8+e.ph)*2){const sd=rng()<.5?-1:1,u=(rng()-.5)*e.len*.9,c=Math.cos(e.ry||0),sn=Math.sin(e.ry||0),lx=u,lz2=sd*(e.w/2+.15);list.push([e.x+c*lx+sn*lz2,e.z-sn*lx+c*lz2,.8,.04]);}}
  else if(e.k==='pontoon'){const p=(now/3.1+e.ph)%1;if(p<dt/3.1)list.push([e.x+(rng()-.5)*e.len,e.z+(rng()<.5?-1:1)*(e.w/2+.1),.8,.04]);}}
 // ambient life: an insect or a fish now and then within a few metres of the camera
 if(rng()<dt/1.4){const a=rng()*6.283,r=2+rng()*5,px=cx+Math.cos(a)*r,pz=cz+Math.sin(a)*r,pl=pz-Math.floor(pz/B)*B;if(pl>C.z0+.5&&pl<C.z1-.5)list.push([px,pz,.4,.03]);}
 for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 if(W131.inject){list.unshift(...W131.inject);W131.inject=null;}
 W131.drops+=Math.min(8,list.length);return list.slice(0,8);
}
function lowRanges(cx,cz){const ix=Math.floor(cx/B),iz=Math.floor(cz/B);let n=0;const out=W131U.uLow131.value;
 for(let dz=-2;dz<=2&&n<4;dz++){const z=iz+dz;if(!canalRow(z))continue;for(let dx=-2;dx<=2&&n<4;dx++){const c=canalBlock(ix+dx,z);if(!c)continue;const x0=(ix+dx)*B;
  if(c.portalW&&n<4)out[n++].set(x0,x0+30,z*B,1);if(c.portalE&&n<4)out[n++].set(x0+B-30,x0+B,z*B,1);}}
 for(;n<4;n++)out[n].set(0,0,0,0);}
// called from the water material's onBeforeRender (Reflector pattern: nested renders into our own targets, state restored)
function drive(renderer,scene,camera,object){
 const now=performance.now();if(now-lastStep<7)return;const dt=Math.min(.1,lastStep?(now-lastStep)/1000:.016);lastStep=now;clock+=dt;
 if(W131.state==='off')return;
 if(!sim){if(W131.state==='failed')return;
  if(disabledByUser()){W131.state='off';W131.reason='disabled by ?w131=0 / localStorage';return;}
  if(!renderer.capabilities.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float')){W131.state='off';W131.reason='no WebGL2 EXT_color_buffer_float -> V128 water';return;}
  const prevT=renderer.getRenderTarget();try{sim=createSim(renderer);W131.sim=sim;W131.renderer=renderer;W131.state='on';}catch(e){W131.state='failed';W131.reason=String(e&&e.message||e);console.warn('[canal131] fallback to V128 water:',W131.reason);renderer.setRenderTarget(prevT);return;}renderer.setRenderTarget(prevT);}
 const t0=performance.now();
 // camera in unshifted world = camera world position minus the mesh's floating-origin offset
 camera.getWorldPosition(tmpV);object.updateWorldMatrix(true,false);tmpS.setFromMatrixPosition(object.matrixWorld);tmpV.sub(tmpS);
 const cam=cityOf(tmpV.x,tmpV.z);W131.camH=tmpV.y-W131U.uWY131.value;W131.cam=cam;
 if(scene!==sunScene||now-sunCheck>3000){sunScene=scene;sunCheck=now;sunObj=findSun(scene);}
 if(sunObj){sunObj.getWorldPosition(tmpS);sunObj.target.getWorldPosition(tmpV);tmpS.sub(tmpV).normalize();toCityDir(tmpS,W131U.uSun131.value);W131U.uSunC131.value.copy(sunObj.color).multiplyScalar(Math.min(1.6,sunObj.intensity/3));}
 W131U.uP131.value.set(cam[0],cam[1],P.CAUS_R,clock);lowRanges(cam[0],cam[1]);
 const prevTarget=renderer.getRenderTarget(),prevXr=renderer.xr.enabled,prevShadow=renderer.shadowMap.autoUpdate,prevClear=renderer.getClearColor(new T.Color()),prevAlpha=renderer.getClearAlpha(),prevAuto=renderer.autoClear;
 renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.autoClear=false;renderer.setClearColor(0x000000,0);
 try{sim.step(clock,cam[0],cam[1],collectDrops(cam,dt),W131U.uSun131.value);W131U.uW131.value=1;}
 catch(e){W131.state='failed';W131.reason=String(e&&e.message||e);W131U.uW131.value=0;console.warn('[canal131] sim failed, V128 water:',W131.reason);}
 finally{renderer.setRenderTarget(prevTarget);renderer.xr.enabled=prevXr;renderer.shadowMap.autoUpdate=prevShadow;renderer.setClearColor(prevClear,prevAlpha);renderer.autoClear=prevAuto;if(camera.viewport)renderer.state.viewport(camera.viewport);}
 W131.frames++;W131.ms=W131.ms*.95+(performance.now()-t0)*.05;
}

// ------------------------------------------------------------------------------------------------ shader chunks
const COMMON=`uniform float uW131;uniform sampler2D uSurf131,uRip131,uCaus131,uWall131;uniform vec3 uRipC131,uSun131,uSunC131;uniform vec4 uP131,uK131,uTune131;uniform float uWY131;uniform vec4 uLow131[4];
float w131h(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float w131n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(w131h(i),w131h(i+vec2(1,0)),u.x),mix(w131h(i+vec2(0,1)),w131h(i+vec2(1,1)),u.x),u.y);}
float w131fr(float ci,float n){ci=clamp(ci,0.,1.);float st2=(1.-ci*ci)/(n*n);if(st2>=1.)return 1.;float ct=sqrt(1.-st2);float rs=(ci-n*ct)/(ci+n*ct),rp=(n*ci-ct)/(n*ci+ct);return .5*(rs*rs+rp*rp);}
float w131caus(vec2 xz,float lod){return texture(uCaus131,(xz-uK131.zw)/uK131.x,lod).r;}
float w131near(vec2 xz){return 1.-smoothstep(uP131.z*.55,uP131.z,length(xz-uP131.xy));}
vec3 w131post(vec3 c){ // PS1-ish: 5-bit per channel in display space with a 4x4 ordered dither
 const mat4 BY=mat4(0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);ivec2 q=ivec2(mod(gl_FragCoord.xy,4.));float d=(BY[q.x][q.y]+.5)/16.-.5;
 vec3 s=pow(max(c,0.),vec3(1./2.2));s=floor(s*31.+.5+d)/31.;return pow(max(s,0.),vec3(2.2));}
`;
// the new water shading; runs in the canal frame (a = city x, cz = city z, local c across the channel)
function waterChunk(){const top=(C.top-C.water).toFixed(2);return `
{vec2 d0=vP.xz-uO;float a=uR.x*d0.x-uR.y*d0.y,cz=uR.y*d0.x+uR.x*d0.y;
 vec3 v=normalize(vP-vCam);vec3 wd=vec3(uR.x*v.x-uR.y*v.z,v.y,uR.y*v.x+uR.x*v.z);wd.y=min(wd.y,-.002);wd=normalize(wd);
 float dist=length(vP-vCam);vec2 S0=vec2(a,cz);float L=uK131.x;
 const mat2 M=mat2(.8,-.6,.6,.8);const float SC=.41,WB=.16;
 // height-field intersection (fixed point): FFT patch + rotated half-scale patch + local ripples
 vec2 xz=S0;vec4 A,Bq,R;float hs=0.;
 for(int i=0;i<2;i++){A=texture(uSurf131,xz/L);Bq=texture(uSurf131,(M*xz)/(L*SC)+.37);R=texture(uRip131,(xz-uRipC131.xy)/uRipC131.z+.5);hs=A.x+WB*SC*Bq.x+R.x;xz=S0+wd.xz*(hs/wd.y);}
 vec2 ruv=(xz-uRipC131.xy)/uRipC131.z+.5;float rin=step(0.,ruv.x)*step(ruv.x,1.)*step(0.,ruv.y)*step(ruv.y,1.);
 vec2 slope=(A.yz+WB*(transpose(M)*Bq.yz))/(1.+dist*.012)+R.yz*rin;   // calmer far water keeps the facade reflections of the photo
 float var=max(A.w-dot(A.yz,A.yz),0.)+WB*WB*max(Bq.w-dot(Bq.yz,Bq.yz),0.)+.0004*smoothstep(20.,160.,dist);
 vec3 n=normalize(vec3(-slope.x,1.,-slope.y));vec3 vv=-wd;float nv=dot(n,vv);if(nv<.02){n=normalize(n+vv*(.02-nv));nv=dot(n,vv);}
 float F=w131fr(nv,1.3335);
 float c=mod(xz.y,112.)-${MID.toFixed(1)};
 // ---- reflection: V128 analytic canal (embankment walls, building lines, sky) with the new normal
 vec3 r=reflect(wd,n);r.y=max(r.y,.004);vec3 refl;
 {float side=r.z>=0.?1.:-1.;float tw=(side*${HW.toFixed(1)}-c)/(abs(r.z)<1e-4?1e-4*side:r.z);float yw=tw*r.y;
  if(tw>0.&&yw<${top}){vec3 wc=texture2D(uWall131,vec2((xz.x+tw*r.x)/3.15,(yw-1.45)/1.9),2.).rgb;refl=pow(wc,vec3(2.2))*.32*(.8+.2*h1(floor((xz.x+tw*r.x)*.5)));}
  else{float tf=(side*${(C.p1-C.mid+4).toFixed(1)}-c)/(abs(r.z)<1e-4?1e-4*side:r.z);float yf=tf*r.y,af=xz.x+tf*r.x;float seg=floor(af/31.);
   float hb=26.+52.*h1(seg+side*17.);vec3 sky=mix(uHor,uSky,clamp(r.y*2.2,0.,1.))*.52;
   if(tf>0.&&yf<hb){vec3 f=side>0.?texture2D(uFacR,vec2(af/40.,yf/22.4),3.).rgb:texture2D(uFacL,vec2(af/35.5,yf/20.),3.).rgb;f=pow(f,vec3(2.2));refl=mix(f*.28,sky,.3);}
   else refl=sky;}}
 refl*=uTune131.z;
 // ---- sun glints: Beckmann with slope-variance widening (LEAN-style), clamped so the pixel filter does not sparkle
 vec3 Ls=normalize(uSun131);float a2=.0009+1.4*var;vec3 hh=normalize(vv+Ls);float nh=max(dot(n,hh),0.),nl=max(dot(n,Ls),0.);
 float c2=max(nh*nh,1e-4),tan2=(1.-c2)/c2;float D=exp(-tan2/a2)/(3.14159*a2*c2*c2);float Vis=.5/(nl*sqrt(nv*nv*(1.-a2)+a2)+nv*sqrt(nl*nl*(1.-a2)+a2)+1e-5);
 vec3 spec=uSunC131*min(D*Vis*w131fr(max(dot(hh,vv),0.),1.3335)*nl,9.)*.55*step(0.,Ls.y);
 // ---- refraction into shallow murky water: canal bed (silt, sloping up at the walls) or the embankment wall
 const vec3 SA=vec3(.78,.42,.56),SS=vec3(.30,.31,.27),ST=SA+SS;   // murky green-grey: ~1.5 m visibility
 vec3 tr=refract(wd,n,1./1.3335);vec3 Pp=vec3(xz.x,0.,c);
 float edge=${HW.toFixed(1)}-abs(c);float depth=uK131.y*(.62+.38*smoothstep(0.,5.,edge))+.18*(w131n(vec2(xz.x,c)*.21)-.5);
 float s=depth/max(-tr.y,.05);vec3 FP=Pp+tr*s;bool wall=false;
 if(abs(FP.z)>${HW.toFixed(1)}){float sd=FP.z>0.?1.:-1.;s=(sd*${HW.toFixed(1)}-Pp.z)/tr.z;FP=Pp+tr*s;wall=true;}
 s=max(s,0.);float dh=-FP.y;vec2 fw=vec2(FP.x,FP.z+(xz.y-c));
 vec3 alb;
 if(wall){alb=pow(texture2D(uWall131,vec2(FP.x/3.15,(FP.y-1.45)/1.9),1.).rgb,vec3(2.2))*vec3(.62,.78,.52);}
 else{float k=w131n(fw*.6),g=w131n(fw*2.3+5.),lf=smoothstep(.78,.86,w131n(fw*3.1+11.));
  alb=mix(vec3(.11,.10,.065),vec3(.20,.19,.13),k)*(.8+.4*g);alb=mix(alb,vec3(.07,.11,.05),smoothstep(.55,.8,w131n(fw*.33+3.))*.7);alb=mix(alb,vec3(.16,.09,.04),lf*.8);}
 vec3 sT=refract(-Ls,vec3(0,1,0),1./1.3335);float Ts=1.-w131fr(max(Ls.y,0.),1.3335);
 float near=w131near(fw);float cs=w131caus(fw+sT.xz/(-sT.y)*0.,1.);
 vec2 Sx=fw-sT.xz*dh/(-sT.y);float lap=texture(uRip131,(Sx-uRipC131.xy)/uRipC131.z+.5).a;cs*=clamp(1./(1.+.12*dh*lap),.45,3.);
 cs=mix(1.,pow(cs,1.4),near*.9);
 vec3 SUN=uSunC131*1.8*uTune131.x;vec3 SKYI=mix(uHor,uSky,.5)*1.05*uTune131.y;
 vec3 Esun=SUN*Ts*exp(-ST*dh/max(-sT.y,.2))*cs*max(-sT.y,0.)*step(0.,Ls.y);
 vec3 Esky=SKYI*exp(-(SA+.4*SS)*dh*1.25);
 vec3 Lfl=alb/3.14159*(Esun+Esky)*(wall?.7:1.);
 vec3 Tv=exp(-ST*s);float cosS=dot(sT,-tr);float g8=.75;float ph=(1.-g8*g8)/(12.566*pow(1.+g8*g8-2.*g8*cosS,1.5));
 vec3 Lmid=SUN*Ts*exp(-ST*dh*.5/max(-sT.y,.2))*(ph+.03)+SKYI*exp(-SA*dh*.6)/12.566;
 vec3 Lin=SS/ST*Lmid*(1.-Tv)*vec3(.92,1.,.82)*.42;
 vec3 under=Lfl*Tv+Lin;
 // floating specks (pollen / silt) near the surface, only close by
 {vec2 q=(xz+tr.xz*.18/max(-tr.y,.05))*9.+vec2(uP131.w*.05,uP131.w*.02);vec2 id=floor(q),f=fract(q)-.5;float rr=w131h(id);
  under+=smoothstep(.2,0.,length(f))*step(.985,rr)*(1.-smoothstep(4.,12.,dist))*SUN*.012;}
 vec3 col=F*refl+(1.-F)*under+spec*F*4.;
 if(uTune131.z<0.)col=vec3(.5+R.x*25.,w131caus(fw,0.)*.25,.5+A.y*8.);   // debug: ripple height | caustics | FFT slope
 diffuseColor.rgb=w131post(col);}`;}
const WALL=`
if(uW131>.5){vec2 d0=vW131.xz-uO131;float a=uR131.x*d0.x-uR131.y*d0.y,cz=uR131.y*d0.x+uR131.x*d0.y;float cl=mod(cz,112.)-${MID.toFixed(1)};
 float wy=uWY131;for(int i=0;i<4;i++){vec4 q=uLow131[i];if(q.w>0.&&a>q.x&&a<q.y&&cz>q.z&&cz<q.z+112.)wy=uWY131-${(C.water+4.4).toFixed(2)};}
 float hy=vW131.y-wy,near=w131near(vec2(a,cz));
 if(near>0.&&hy>-.03&&hy<2.2&&abs(abs(cl)-${HW.toFixed(1)})<1.){
  vec3 Ls=normalize(uSun131);float face=clamp(-Ls.z*sign(cl),0.,1.)*.75+.25;
  float I=w131caus(vec2(a+hy*.4,(cl>0.?1.:-1.)*hy*3.1+cz*.0),0.);   // reflected caustic: the bed pattern stretched up the wall
  float band=exp(-hy*2.)*smoothstep(-.03,.08,hy);
  outgoingLight+=uSunC131*max(I-1.1,0.)*.8*band*near*face*step(0.,Ls.y)*uTune131.w;}}
`;
function patchCommon(s){Object.assign(s.uniforms,W131U);}
// wraps the V128 water material: its V128 shading stays as the fallback branch (uW131 = 0)
export function canal131Water(mat,wallTex){
 const prev=mat.onBeforeCompile;W131U.uWall131.value=wallTex;
 mat.onBeforeCompile=(s,r)=>{prev.call(mat,s,r);patchCommon(s);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+COMMON);
  const a='{vec2 d0=vP.xz-uO;',b='diffuseColor.rgb=mix(uDeep,refl,fr);}';
  if(!s.fragmentShader.includes(a)||!s.fragmentShader.includes(b)){console.warn('[canal131] V128 water shader markers missing; keeping V128');return;}
  s.fragmentShader=s.fragmentShader.replace(a,'if(uW131<.5)'+a).replace(b,b+'else'+waterChunk());};
 mat.customProgramCacheKey=()=>'canal131-water';
 const prevR=mat.onBeforeRender;
 mat.onBeforeRender=function(renderer,scene,camera,geometry,object){prevR&&prevR.call(this,renderer,scene,camera,geometry,object);try{drive(renderer,scene,camera,object);}catch(e){W131U.uW131.value=0;W131.state='failed';W131.reason=String(e&&e.message||e);}};
 mat.userData.canal131=true;return mat;
}
// embankment walls / facing: reflected caustics dancing on the wall just above the waterline, near the camera only
export function canal131Wall(mat){
 if(!mat||mat.userData.canal131)return mat;mat.userData.canal131=true;const prev=mat.onBeforeCompile;
 mat.onBeforeCompile=(s,r)=>{prev&&prev.call(mat,s,r);patchCommon(s);s.uniforms.uO131={value:new T.Vector2(CITY_ORIGIN.x,CITY_ORIGIN.z)};s.uniforms.uR131={value:new T.Vector2(ca,sa)};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW131;').replace('#include <project_vertex>','#include <project_vertex>\nvW131=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vW131;uniform vec2 uO131,uR131;\n'+COMMON).replace('#include <opaque_fragment>',WALL+'#include <opaque_fragment>');};
 const k=mat.customProgramCacheKey?.bind(mat);mat.customProgramCacheKey=()=>'canal131-wall|'+(k?k():'');return mat;
}
