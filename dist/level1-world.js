// Level 1 "宜居地带" — Aquila-sector halls (concrete car-park × warehouse).
// One merged mesh per 64 m chunk (one lit material, vertex colours), one emissive mesh per chunk,
// global floor/ceiling planes. Lighting is analytic and layout-hashed in the shader: a constant
// number of light evaluations per fragment, no scene lights → no program recompiles.
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {makeL1Props} from './level1-props.js?v=110';
import {createLevel1Corridors} from './level1-corridors.js?v=110';
import {l1Rebase,L1_BAY as B,L1_CHUNK as K,L1_H as H,L1_COL,L1_WALL,l1Hash,l1WallX,l1WallZ,l1Column,l1DoorX,l1DoorZ,l1Ceiling,l1ColumnTube,l1ColumnFace,l1TubeX,l1TubeZ,l1TubeSideX,l1TubeSideZ,l1TubeOffX,l1TubeOffZ,l1RunX,l1RunZ,l1RunSideX,l1RunSideZ,l1LowX,l1LowZ,l1Sector,l1SecV,L1_SEC_H,L1_SEC_G,L1_SEC_O,l1ThrSite,l1Thr,L1_LAYOUT_GLSL} from './level1-layout.js?v=110';

const LIGHT_GLSL=`${L1_LAYOUT_GLSL}
uniform ivec2 l1OB;// floating-origin offset in bays (integer, exact)
float lh(int x,int z,int s){return l1h(x+l1OB.x,z+l1OB.y,s);}
bool lwx(int x,int z){return l1wx(x+l1OB.x,z+l1OB.y);}bool lwz(int x,int z){return l1wz(x+l1OB.x,z+l1OB.y);}
bool lrx(int x,int z){return l1rx(x+l1OB.x,z+l1OB.y);}bool lrz(int x,int z){return l1rz(x+l1OB.x,z+l1OB.y);}
int lsec(int x,int z){return l1sec(x+l1OB.x,z+l1OB.y);}
bool lcol(int x,int z){return l1col(x+l1OB.x,z+l1OB.y);}bool ldx(int x,int z){return l1dx(x+l1OB.x,z+l1OB.y);}bool ldz(int x,int z){return l1dz(x+l1OB.x,z+l1OB.y);}
float l1AmbK=1.0,l1T=0.0;uniform float l1Power;uniform float l1Time;uniform vec3 l1Amb;uniform vec3 l1Lamp;
float l1fall(vec3 d,float k,float range){float r2=dot(d,d);float c=clamp(1.0-r2/(range*range),0.0,1.0);return c*c/(1.0+r2*k);}
float l1vis(int fx,int fz,int bx,int bz){int dx=bx-fx,dz=bz-fz;if(dx==0&&dz==0)return 1.0;int xl=max(fx,bx),zl=max(fz,bz);
 bool a=(dx!=0&&lwz(xl,fz))||(dz!=0&&lwx(bx,zl));bool b=(dz!=0&&lwx(fx,zl))||(dx!=0&&lwz(xl,bz));
 if(!a&&!b)return 1.0;if(!a||!b)return .55;return .04;}
vec3 l1light(vec3 P,vec3 N){
 vec3 Q=P+N*.06;int fx=int(floor(Q.x/L1B)),fz=int(floor(Q.z/L1B));vec3 acc=vec3(0.0);float up=0.0;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){int bx=fx+i,bz=fz+j;int k=lsec(bx,bz);float hl=lh(bx,bz,5);if(k==0&&hl<=.55||k==2&&hl<=.4)continue;
  // Aquila batten at 3.18 / Gild double battens hung at 4.75 under the open truss / Gothic warm lantern under the crown
  float ly=k==1?4.75:k==2?3.7:3.18,LI=k==1?4.8:k==2?3.6:3.9,LR=k==1?19.0:k==2?13.0:15.0;vec3 LC=k==2?vec3(1.08,.8,.52):k==1?vec3(1.0,1.0,.97):vec3(1.0);LC=mix(LC,vec3(1.1,.66,.36),l1T)*(1.0-.3*l1T);
  vec3 lp=vec3(float(bx)*L1B+4.0,ly,float(bz)*L1B+4.0);vec3 d=lp-P;vec3 l=normalize(d);
  float ndl=max(dot(N,l),0.0)*.82+.18*max(N.y*-.5+.5,0.0);float lobe=.35+.65*clamp(-l.y*-1.0,0.0,1.0);
  float vv=l1vis(fx,fz,bx,bz);acc+=LC*(LI*ndl*lobe*l1fall(d,k==1?.12:.33,LR)*vv);up+=l1fall(d,.2,13.0)*vv;}
 // vertical tubes on columns (nearest corner neighbourhood)
 int cx0=int(floor(Q.x/L1B+.5)),cz0=int(floor(Q.z/L1B+.5));
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){int cx=cx0+i,cz=cz0+j;if(!(lcol(cx,cz)&&lh(cx,cz,6)>.32)||lsec(cx,cz)==2)continue;int f=int(floor(lh(cx,cz,11)*4.0));
  vec3 dir=f==0?vec3(1,0,0):f==1?vec3(-1,0,0):f==2?vec3(0,0,1):vec3(0,0,-1);vec3 lp=vec3(float(cx)*L1B,2.0,float(cz)*L1B)+dir*.52;vec3 d=lp-P;
  float side=smoothstep(-.05,.25,dot(P-lp+dir*.1,dir)+.0);vec3 l=normalize(d);float ndl=max(dot(N,l),0.0)*.9+.1;
  acc+=(1.0-.5*l1T)*4.2*ndl*side*l1fall(d,.5,12.0);}
 // vertical tubes on walls
 for(int j=0;j<=1;j++)for(int i=-1;i<=1;i++){int ix=fx+i,iz=fz+j;if(lrx(ix,iz)){float s=lh(0,iz,96)>.5?1.0:-1.0;float x0=float(ix)*L1B;vec3 lp=vec3(clamp(P.x,x0+.5,x0+7.5),clamp(P.y,1.45,2.55),float(iz)*L1B+s*.3);vec3 d=lp-P;float side=smoothstep(.0,.2,(P.z-float(iz)*L1B)*s);vec3 l=normalize(d);acc+=(1.0-.5*l1T)*1.5*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.9,10.0);continue;}
  if(!(lwx(ix,iz)&&!ldx(ix,iz)&&lh(ix,iz,7)>.35))continue;float s=lh(ix,iz,8)>.5?1.0:-1.0;
  vec3 lp=vec3(float(ix)*L1B+4.0+(lh(ix,iz,10)-.5)*4.0,2.0,float(iz)*L1B+s*.3);vec3 d=lp-P;float side=smoothstep(.0,.2,(P.z-float(iz)*L1B)*s);vec3 l=normalize(d);
  acc+=(1.0-.5*l1T)*3.1*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.55,11.0);}
 for(int j=-1;j<=1;j++)for(int i=0;i<=1;i++){int ix=fx+i,iz=fz+j;if(lrz(ix,iz)){float s=lh(ix,0,97)>.5?1.0:-1.0;float z0=float(iz)*L1B;vec3 lp=vec3(float(ix)*L1B+s*.3,clamp(P.y,1.45,2.55),clamp(P.z,z0+.5,z0+7.5));vec3 d=lp-P;float side=smoothstep(.0,.2,(P.x-float(ix)*L1B)*s);vec3 l=normalize(d);acc+=(1.0-.5*l1T)*1.5*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.9,10.0);continue;}
  if(!(lwz(ix,iz)&&!ldz(ix,iz)&&lh(ix,iz,17)>.35))continue;float s=lh(ix,iz,18)>.5?1.0:-1.0;
  vec3 lp=vec3(float(ix)*L1B+s*.3,2.0,float(iz)*L1B+4.0+(lh(ix,iz,20)-.5)*4.0);vec3 d=lp-P;float side=smoothstep(.0,.2,(P.x-float(ix)*L1B)*s);vec3 l=normalize(d);
  acc+=(1.0-.5*l1T)*3.1*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.55,11.0);}
 // contact darkening at column feet and wall bases
 vec2 cc=abs(P.xz-vec2(float(cx0),float(cz0))*L1B);float colD=max(cc.x,cc.y)-.45;float ao=1.0-.45*(1.0-smoothstep(0.0,.7,colD))*(1.0-smoothstep(0.0,.9,P.y))*(lcol(cx0,cz0)?1.0:0.0);
 float hemi=mix(.55,1.0,N.y*.5+.5);
 // ceilings: bounce from the lit floor below (the photo's ceiling reads near-white)
 float cb=max(-N.y,0.0)*(.3*up+.03);vec3 accT=acc;
 return (l1Amb*hemi*l1AmbK*(.08+.92*l1Power)+l1Lamp*(accT+cb*(1.0-.6*l1T))*l1Power)*ao;}
`;
const NOISE_GLSL=`
float l1n(vec2 p,vec2 per){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);vec2 i0=mod(i,per),i1=mod(i+1.0,per);
 float a=l1h(int(i0.x),int(i0.y),97),b=l1h(int(i1.x),int(i0.y),97),c=l1h(int(i0.x),int(i1.y),97),d=l1h(int(i1.x),int(i1.y),97);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float l1fbm(vec2 p,float per){return l1n(p,vec2(per))*.55+l1n(p*2.0+7.1,vec2(per*2.0))*.28+l1n(p*4.0+3.3,vec2(per*4.0))*.17;}
`;
const VERT=`
attribute vec4 l1c;attribute vec4 l1t;varying vec4 vC;varying vec4 vT;varying vec2 vUv;varying vec3 vW;varying vec3 vN;
#ifdef L1_FLOOR
uniform mat4 l1TexMat;varying vec4 vR;
#endif
#include <common>
#include <fog_pars_vertex>
void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);vC=l1c;vT=l1t;vUv=uv;
#ifdef L1_FLOOR
vR=l1TexMat*vec4(position,1.0);
#endif
vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const FRAG=`
uniform highp sampler2DArray l1Atlas;
#ifdef L1_FLOOR
uniform sampler2D l1Mirror;varying vec4 vR;
#endif
varying vec4 vC;varying vec4 vT;varying vec2 vUv;varying vec3 vW;varying vec3 vN;
#include <common>
#include <fog_pars_fragment>
${LIGHT_GLSL}
${NOISE_GLSL}
void main(){vec3 N=normalize(vN);vec3 alb=vC.rgb;
 float sv=l1secf(vW.xz/L1B+vec2(l1OB));float gw=smoothstep(.62,.76,sv),ow=1.0-smoothstep(.21,.33,sv);l1T=l1thr(vW.xz/L1B+vec2(l1OB));l1AmbK=(1.0+.45*gw+.25*ow)*(1.0-.2*l1T);
 if(vT.x>=0.0){vec2 uv=vT.y<.5?vUv*vT.zw:vT.y<1.5?(abs(N.x)>.5?vec2(-vW.z*sign(N.x),vW.y):abs(N.y)>.5?vW.xz:vec2(vW.x*sign(N.z),vW.y))*vT.z:vT.y<2.5?vUv.yx*vT.zw:vUv;
  vec4 s=texture(l1Atlas,vec3(uv,vT.x));if(vT.y>2.5&&s.a<.5)discard;vec3 t=s.rgb;
  if(vT.y>.5&&vT.y<1.5&&abs(N.y)<.5){t=mix(t,t*vec3(1.04,.97,.86),ow*.6);t=mix(t,t*vec3(.86,.74,.6),l1T*.7);
   float g=1.0-smoothstep(.05,.75,vW.y)*.9;t*=1.0-.3*g*(.6+.4*l1n(vec2(uv.x*3.0,1.0),vec2(4800.0,1.0)));}
  alb*=t;}
 vec3 lit=l1light(vW,N);vec3 col=alb*lit;
#ifdef L1_FLOOR
 vec2 p=vW.xz;float st=l1fbm(p*.11,176.0);{float pm0=l1fbm(p*.2+vec2(13.7,4.1),320.0)*.78+.1*l1fbm(p*.05,80.0)+.22*l1n(p*.7,vec2(1120.0))+.04*l1n(p*3.0,vec2(4800.0));col=mix(col,texture(l1Atlas,vec3(p*.25,4.0)).rgb*vC.rgb*lit,smoothstep(.48,.6,pm0)*(1.0-gw)*.7);}float tyre=smoothstep(.7,.0,abs(fract(p.x*.125+.5)-.5)*8.0-1.0);
 col*=mix(.8,1.06,st)*(1.0-.1*tyre*l1n(p*vec2(.4,3.0),vec2(640.0,4800.0)));
 // dark tyre tracks running down the driving aisles (bay centres), wandering slightly
 {int lx=int(floor(p.x/L1B)),lz=int(floor(p.y/L1B));float tr=0.0;
  if(lh(lx,-l1OB.y,150)>.12){float w=(l1n(vec2(p.y*.05,float(lx+l1OB.x)),vec2(80.0,65536.0))-.5)*1.6;float u=p.x-float(lx)*L1B-4.0-w;float d=min(abs(u-.8),abs(u+.8));tr=max(tr,(1.0-smoothstep(.04,.32,d))*(.45+.55*l1n(p*vec2(1.7,1.7),vec2(2720.0)))*smoothstep(.3,.65,l1n(vec2(p.y*.09,float(lx+l1OB.x)*3.0),vec2(144.0,65536.0))));}
  if(lh(-l1OB.x,lz,151)>.55){float w=(l1n(vec2(p.x*.05,float(lz+l1OB.y)),vec2(80.0,65536.0))-.5)*1.6;float u=p.y-float(lz)*L1B-4.0-w;float d=min(abs(u-.8),abs(u+.8));tr=max(tr,(1.0-smoothstep(.04,.32,d))*(.45+.55*l1n(p*vec2(1.7,1.7),vec2(2720.0)))*smoothstep(.3,.65,l1n(vec2(p.x*.09,float(lz+l1OB.y)*3.0),vec2(144.0,65536.0))));}
  float oil=smoothstep(.62,.8,l1fbm(p*.21+vec2(5.3,1.7),336.0));col*=(1.0-.42*tr*(1.0-ow))*(1.0-.35*oil*(1.0-.5*gw));
  // Gild: lighter swept slab; Gothic: painted parking bays between the round columns
  col*=(1.0+.25*gw)*(1.0-.35*l1T);vec2 q=p-floor(p/L1B)*L1B;float pl=(1.0-smoothstep(.04,.07,min(abs(q.x-2.67),abs(q.x-5.33))))*step(.6,q.y)*step(q.y,5.2)+(1.0-smoothstep(.04,.07,abs(q.y-5.2)))*step(.3,q.x)*step(q.x,7.7);
  col=mix(col,vec3(.5,.48,.44)*(.55+.45*st)*l1Power,pl*ow*.8);}
 float pm=l1fbm(p*.2+vec2(13.7,4.1),320.0)*.78+.1*l1fbm(p*.05,80.0)+.22*l1n(p*.7,vec2(1120.0))+.04*l1n(p*3.0,vec2(4800.0));float dry=(1.0-gw)*(1.0-.75*ow)*(1.0-.8*l1T);float wet=smoothstep(.5,.62,pm)*dry;float pud=smoothstep(.615,.625,pm)*dry;
 col*=1.0-.5*wet;
 vec2 rip=vec2(l1n(p*3.1+mod(l1Time*.15,4960.0),vec2(4960.0)),l1n(p*3.3-mod(l1Time*.12,5280.0),vec2(5280.0)))-.5;vec4 r=vR;r.xy+=rip*.004*r.w;
 vec3 refl=texture2DProj(l1Mirror,r).rgb;vec3 V=normalize(cameraPosition-vW);float fres=.38+.55*pow(1.0-max(V.y,0.0),3.0);
 col=mix(col,col*.22+refl*fres*1.1,pud);col+=refl*.12*wet*(1.0-pud);
#endif
 gl_FragColor=vec4(col,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;

export function createLevel1World(T,renderer){
 const scene=new T.Scene();scene.userData.noAtmosphere=true;scene.background=new T.Color(0x24282b);scene.fog=new T.FogExp2(0x2b3033,.03);
 const loader=new T.TextureLoader(),pending=[];
 const tex=(f,rep=true)=>{let ok,no;pending.push(new Promise((a,b)=>{ok=a;no=b;}));const t=loader.load('./assets/level1/'+f+'?v=1',ok,undefined,no);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.generateMipmaps=true;return t;};
 const lin=c=>new T.Color(c).convertSRGBToLinear?.()??new T.Color(c);
 const AL={"conc": 0, "col": 1, "ceil": 2, "floor": 3, "floorwet": 4, "corr": 5, "form": 6, "paint": 7, "crate1": 8, "crate2": 9, "osb": 10, "carton": 11, "cartontop": 12, "tote": 13, "locker": 14, "rustbox": 15, "pipew": 16, "piper": 17, "galv": 18, "foil": 19, "lag": 20, "rust": 21, "steel": 22, "grate": 23, "door2": 24, "exit": 25, "fluor": 26, "hose": 27, "epanel": 28, "dooryel": 29, "doorwood": 30, "grille": 31, "peel": 32, "yellow": 33, "wains": 34, "wfloor": 35, "beam": 36, "window": 37, "brick": 38, "cream": 39, "leather": 40, "bucket": 41, "wetsign": 42, "ac": 43, "padded": 44, "cloth": 45, "paper": 46, "hazard": 47, "ceilstain": 48, "concwet": 49, "exitcn": 50, "chrome": 51, "tread": 52, "orange": 53, "straw": 54, "colF": 55, "colE": 56, "colG": 57, "colB3": 58, "colD": 59, "colA7": 60, "colH": 61, "colC2": 62, "crate4": 63, "crate5": 64, "carton2": 65, "carton3": 66, "tote2": 67, "tote3": 68, "tote4": 69, "locker2": 70};
 const TX=(n,m,su=1,sv=1,ax=0,top)=>{const t=[AL[n],m,su,sv,ax];if(top)t.top=AL[top];return t;};
 const atlas=new T.DataArrayTexture(new Uint8Array(4*256*256*80),256,256,80);Object.assign(atlas,{format:T.RGBAFormat,colorSpace:T.SRGBColorSpace,wrapS:T.RepeatWrapping,wrapT:T.RepeatWrapping,minFilter:T.LinearMipmapLinearFilter,magFilter:T.LinearFilter,generateMipmaps:true,anisotropy:4});
 pending.push(fetch('./assets/level1/atlas.webp?v=110').then(r=>r.blob()).then(b=>createImageBitmap(b,{premultiplyAlpha:'none',colorSpaceConversion:'none'})).then(img=>{const c=document.createElement('canvas');c.width=2176;c.height=2720;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const d=atlas.image.data;for(let l=0;l<80;l++){const px=g.getImageData((l%8)*272+8,Math.floor(l/8)*272+8,256,256).data;for(let y=0;y<256;y++)d.set(px.subarray((255-y)*1024,(256-y)*1024),l*262144+y*1024);}atlas.needsUpdate=true;}));
 const uniforms={l1Atlas:{value:atlas},l1Floor:{value:tex('floor.webp')},l1Wall:{value:tex('wall.webp')},l1Ceil:{value:tex('ceiling.webp')},l1Power:{value:1},l1Time:{value:0},l1Amb:{value:new T.Vector3(.11,.115,.12)},l1Lamp:{value:new T.Vector3(.95,1.0,1.04)},l1OB:{value:new T.Vector2(0,0)}};
 const corridors=createLevel1Corridors(T,renderer,{wall:uniforms.l1Wall.value,floor:uniforms.l1Floor.value,ceil:uniforms.l1Ceil.value});let mode='halls',hallReturn=null;
 const mk=(defines={})=>new T.ShaderMaterial({uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{}]),vertexShader:VERT,fragmentShader:FRAG,fog:true,defines});
 const mat=mk();Object.assign(mat.uniforms,uniforms);
 const mirrorRT=new T.WebGLRenderTarget(256,256,{type:T.HalfFloatType});mirrorRT.texture.generateMipmaps=false;
 const floorMat=mk({L1_FLOOR:1});Object.assign(floorMat.uniforms,uniforms,{l1Mirror:{value:mirrorRT.texture},l1TexMat:{value:new T.Matrix4()}});
 const GV=`attribute vec4 l1t;attribute vec3 color;varying vec4 vT;varying vec2 vUv;varying vec3 vCol;
#include <common>
#include <fog_pars_vertex>
void main(){vT=l1t;vUv=uv;vCol=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,GF=`uniform highp sampler2DArray l1Atlas;uniform float l1Glow;varying vec4 vT;varying vec2 vUv;varying vec3 vCol;
#include <common>
#include <fog_pars_fragment>
void main(){vec3 c=vCol;if(vT.x>=0.0)c*=texture(l1Atlas,vec3(vUv*vT.zw,vT.x)).rgb*1.35;gl_FragColor=vec4(c*l1Glow,1.0);
#include <colorspace_fragment>
#include <fog_fragment>
}`;
 const mkGlow=fog=>{const m=new T.ShaderMaterial({uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{l1Glow:{value:1}}]),vertexShader:GV,fragmentShader:GF,fog});m.uniforms.l1Atlas=uniforms.l1Atlas;return m;};
 const glowMat=mkGlow(true),exitMat=mkGlow(false);glowMat.color={setScalar:v=>{glowMat.uniforms.l1Glow.value=v;}};
 // global floor and ceiling planes, snapped under the player
 const plane=(w,y,flip)=>{const g=new T.PlaneGeometry(w,w).rotateX(flip?Math.PI/2:-Math.PI/2);g.translate(0,y,0);const c=flip?[.78,.79,.8,1]:[.9,.9,.89,1];c.t=flip?TX('ceil',1,.25):TX('floor',1,.25);col(g,c);return g;};
 const NOT=[-1,0,1,1];
 function texAttr(g,t,dims){const n=g.attributes.position.count,a=new Float32Array(n*4);t=t||NOT;let su=t[2],sv=t[3];if(dims&&t[1]===2)su=t[2]*Math.max(dims[0],dims[1],dims[2]);
  for(let i=0;i<n;i++){a[i*4]=t[0];a[i*4+1]=t[1];a[i*4+2]=su;a[i*4+3]=sv;}if(t.top!==undefined&&n===24)for(let i=8;i<12;i++)a[i*4]=t.top;
  if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(n*2),2));g.setAttribute('l1t',new T.BufferAttribute(a,4));return g;}
 function col(g,c,dims){const n=g.attributes.position.count,a=new Float32Array(n*4);for(let i=0;i<n;i++)a.set(c,i*4);g.setAttribute('l1c',new T.BufferAttribute(a,4));return texAttr(g,c.t,dims);}
 const floor=new T.Mesh(plane(256,0,false),floorMat),ceiling=new T.Mesh(plane(256,H,true),mat);floor.frustumCulled=ceiling.frustumCulled=false;scene.add(floor);
 // one constant hemisphere light for the few stock-material props (almond-water bottles); the hall shader ignores scene lights, so it never recompiles
 const propLight=new T.HemisphereLight(0xe6ecef,0x6a6c6a,1.1);scene.add(propLight);
 // ---- planar mirror for puddles (one low-res pass, same scene, floor hidden) ----
 const virt=Object.assign(new T.PerspectiveCamera(),{userData:{l1Virt:true}}),cp=new T.Vector3(),lookAt=new T.Vector3(),rot=new T.Matrix4(),up=new T.Vector3(),tgt=new T.Vector3();let mirroring=false,mirrorScale=.34;
 floor.onBeforeRender=(r,s,camera)=>{if(mirroring)return;mirroring=true;
  cp.setFromMatrixPosition(camera.matrixWorld);rot.extractRotation(camera.matrixWorld);lookAt.set(0,0,-1).applyMatrix4(rot).add(cp);
  virt.position.set(cp.x,-cp.y,cp.z);tgt.set(lookAt.x,-lookAt.y,lookAt.z);up.set(0,1,0).applyMatrix4(rot);up.y=-up.y;virt.up.copy(up);virt.lookAt(tgt);virt.far=camera.far;virt.updateMatrixWorld();virt.projectionMatrix.copy(camera.projectionMatrix);
  floorMat.uniforms.l1TexMat.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(virt.projectionMatrix).multiply(virt.matrixWorldInverse).multiply(floor.matrixWorld);
  const size=r.getDrawingBufferSize(new T.Vector2()),w=Math.max(64,Math.round(size.x*mirrorScale)),h=Math.max(64,Math.round(size.y*mirrorScale));if(mirrorRT.width!==w||mirrorRT.height!==h)mirrorRT.setSize(w,h);
  const prev=r.getRenderTarget(),xr=r.xr.enabled,sh=r.shadowMap.autoUpdate;floor.visible=false;r.xr.enabled=false;r.shadowMap.autoUpdate=false;r.setRenderTarget(mirrorRT);r.state.buffers.depth.setMask(true);if(r.autoClear===false)r.clear();r.render(scene,virt);r.setRenderTarget(prev);r.xr.enabled=xr;r.shadowMap.autoUpdate=sh;floor.visible=true;mirroring=false;};
 // ---- part library ----
 const gcyl=new T.CylinderGeometry(1,1,1,12,1,false).rotateZ(Math.PI/2),vcyl=new T.CylinderGeometry(1,1,1,8,1,false),box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,8,1,true).rotateZ(Math.PI/2),tmp=new T.Object3D();
 // [r,g,b,flag] tint + .t=[layer,mode,su,sv,lenAxis] (mode 0 uv, 1 world-projected (su tiles/m, 1600*su integer), 2 pipe (uv swapped, su per metre of length), 3 decal cut-out)
 const CM={concrete:[[.92,.92,.9,1],TX('conc',1,.3125)],clad:[[1,1,1,3],TX('corr',1,.5)],low:[[.86,.86,.84,1],TX('conc',1,.5)],column:[[.96,.96,.94,1],TX('col',1,.625)],beam:[[.82,.82,.8,1],TX('col',1,.3125)],ceil:[[.85,.85,.84,1],TX('ceil',1,.25)],
  yellow:[[1,.82,.3,0],TX('paint',1,1)],mark:[[.2,.2,.2,0]],grey:[[.8,.82,.84,0],TX('steel',2,.8,1)],conduit:[[.9,.92,.92,0],TX('pipew',2,.8,1)],red:[[1,.9,.9,0],TX('piper',2,.8,1)],white:[[1,1,1,0],TX('pipew',2,1.2,1)],
  tray:[[.8,.8,.8,0],TX('galv',1,1)],door:[[1,1,1,0],TX('door2',0)],frame:[[.6,.62,.62,0],TX('steel',1,1.25)],ply:[[1,1,1,0],TX('osb',1,1.25)],plyD:[[.7,.62,.55,0],TX('osb',1,1.25)],batten:[[.95,.95,.95,0],TX('steel',1,1.25)],
  panel:[[1,1,1,0],TX('epanel',0)],hose:[[1,1,1,0],TX('hose',0)],sign:[[.5,.5,.5,0],TX('steel',1,2)],shelf:[[.6,.72,.95,0],TX('steel',1,1.25)],rust:[[1,1,1,0],TX('rust',2,.8,1)],copper:[[1,.75,.6,0],TX('rust',2,.8,1)],
  pipeG:[[.75,.78,.78,0],TX('steel',2,.8,1)],dial:[[.95,.93,.85,0],TX('paper',0)],needle:[[.7,.05,.03,0]],door2:[[1,1,1,0],TX('rustbox',0)],paper:[[1,1,1,0],TX('paper',0)],tape:[[.8,.75,.55,0]],steel:[[.55,.57,.6,0],TX('steel',1,1.25)],
  deck:[[.75,.75,.75,0],TX('galv',1,.5)],duct:[[1,1,1,0],TX('galv',2,.5,1)],gcol:[[1,.97,.9,1],TX('cream',1,.625)],vault:[[1,.97,.9,1],TX('cream',1,.3125)],wire:[[.1,.1,.1,0]],shelfB:[[1,.55,.2,0],TX('steel',1,1.25)],
  osb:[[1,1,1,0],TX('osb',0)],osbD:[[.45,.4,.35,0],TX('osb',0)],straw:[[1,1,1,0],TX('straw',0)],chrome:[[1,1,1,0],TX('chrome',0)],leather:[[1,1,1,0],TX('leather',0)],steelP:[[.5,.52,.5,0],TX('steel',0)],
  bucket:[[1,1,1,0],TX('bucket',0)],wetsign:[[1,1,1,0],TX('wetsign',0)],ac:[[1,1,1,0],Object.assign(TX('ac',0),{})],pipeW:[[1,1,1,0],TX('pipew',2,1,1)],plyW:[[1,1,1,0],TX('crate2',0)],alu:[[.95,.97,1,0],TX('steel',0)],
  rubber:[[.6,.6,.6,0],TX('tread',0)],bikeF:[[.7,.12,.1,0],TX('steel',0)],cable:[[.12,.12,.12,0]],cone:[[1,1,1,0],TX('orange',0)],cartontop:[[1,1,1,0],TX('cartontop',0)],foil:[[.9,.95,1,0],TX('foil',0)],
  cloth:[[1,1,1,0],TX('cloth',1,2)],letter:[[1,1,1,0],TX('colF',3)],exitT:[[1,1,1,0],TX('exit',0)],fluor:[[1,1,1,0],TX('fluor',0)],lag:[[1,1,1,0],TX('lag',2,.8,1)],grille:[[1,1,1,0],TX('grille',0)],hazard:[[1,1,1,0],TX('hazard',0)]};
 for(const[k,top]of[['crate1','crate1'],['crate2','crate4'],['crate4','crate4'],['crate5','crate1'],['carton','cartontop'],['carton2','cartontop'],['carton3','cartontop'],['tote','tote4'],['tote2','tote2'],['tote3','tote3'],['tote4','tote4'],['locker','locker'],['locker2','locker2'],['rustbox','rustbox']])CM[k]=[[1,1,1,0],TX(k,0,1,1,0,top)];
 const C={};for(const k in CM){const[c0,t]=CM[k];const c=new T.Color(Math.min(1,c0[0]),Math.min(1,c0[1]),Math.min(1,c0[2])).convertSRGBToLinear();C[k]=[c.r*(c0[0]>1?c0[0]:1),c.g,c.b,c0[3]];C[k].t=t;}
 const LET=['colF','colE','colG','colB3','colD','colA7','colH','colC2'].map(n=>{const c=[1,1,1,0];c.t=TX(n,3);return c;});
 const GLOW={amber:[2.4,1.0,.3],warm:[2.2,1.6,.9],tube:[1.7,1.85,1.95],exit:[1.25,1.35,1.25],dim:[.5,.55,.6]};GLOW.tube.t=TX('fluor',0);GLOW.dim.t=TX('fluor',0);GLOW.exit.t=TX('exitcn',0);
 let parts=null,glows=null,exits=null,solids=null,ox0=0,oz0=0;
 tmp.rotation.order='YXZ';
 function put(list,geo,c,x,y,z,w,h,d,ry=0,rx=0,rz=0){tmp.position.set(x-ox0,y,z-oz0);tmp.rotation.set(rx,ry,rz);tmp.scale.set(w,h,d);tmp.updateMatrix();const g=geo.clone().applyMatrix4(tmp.matrix);list.push(c.length===4?col(g,c,[w,h,d]):colGlow(g,c));}
 function colGlow(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set(c,i*3);g.setAttribute('color',new T.BufferAttribute(a,3));return texAttr(g,c.t);}
 const P=(...a)=>put(parts,...a),G=(...a)=>put(a[0]===GLOW.exit?exits:glows,box,...a);
 function solid(x,z,w,d){solids.push({x,z,w,d});}
 const PR=makeL1Props(T,{P,C,box,cyl,vcyl,solid});
 // ---- group landmarks (pure): ~1 in 5 chunks, on a wall face (beside a door when the wall has one) ----
 const CLOTH=[[.62,.08,.06],[.08,.22,.6],[.85,.62,.05],[.1,.45,.15],[.42,.12,.5],[.85,.4,.08]].map(c=>{const k=new T.Color(...c).convertSRGBToLinear(),o=[k.r*2.2,k.g*2.2,k.b*2.2,0];o.t=C.cloth.t;return o;});
 const NOTES=['纸条：“水是干净的。拿一瓶，留一瓶。”','纸条：“灯灭了就别动，等它回来。”','纸条：“绿灯门后面的走廊每次都不一样。记住来时的柱子。”','纸条：“蓝布 = 安全。红布 = 别久留。”','纸条：“地上的水不能喝。”','纸条：“管子越来越多的地方，别往深处走。那边是 Level 2。”','纸条：“M.E.G. 来过。补给每周三补。”','纸条：“听见笑声就往有灯的地方走。”'];
 const campCache=new Map();
 function campAt(cx,cz){const k=cx+','+cz;if(campCache.has(k))return campCache.get(k);let out=null;
  if(l1Hash(cx,cz,180)<.2)for(let t=0;t<16&&!out;t++){const ix=cx*8+Math.floor(l1Hash(cx,cz,181+t)*8),iz=cz*8+Math.floor(l1Hash(cx,cz,201+t)*8),ax=l1Hash(cx,cz,221+t)>.5,side=l1Hash(cx,cz,241+t)>.5?1:-1;
   if(ax?!(l1WallX(ix,iz)&&!l1RunX(ix,iz)):!(l1WallZ(ix,iz)&&!l1RunZ(ix,iz)))continue;const door=ax?l1DoorX(ix,iz):l1DoorZ(ix,iz),u=door?(l1Hash(ix,iz,260)>.5?2.1:-2.1):(l1Hash(ix,iz,261)-.5)*3.6;
   const X=ix*B,Z=iz*B,x=ax?X+4+u:X+side*(L1_WALL/2),z=ax?Z+side*(L1_WALL/2):Z+4+u;out={x,z,nx:ax?0:side,nz:ax?side:0,door,col:CLOTH[Math.floor(l1Hash(cx,cz,262)*CLOTH.length)],col2:CLOTH[Math.floor(l1Hash(cx,cz,263)*CLOTH.length)],note:NOTES[Math.floor(l1Hash(cx,cz,264)*NOTES.length)],id:`level1:${cx},${cz}:camp`};
   out.bottle={x:x+out.nx*.42,y:.455,z:z+out.nz*.42};}
  campCache.set(k,out);if(campCache.size>2000)campCache.delete(campCache.keys().next().value);return out;}
 // the maintenance door faces an open side of its bay (pure, shared by geometry and interaction)
 function siteDir(st){const D=[[0,1],[0,-1],[1,0],[-1,0]],o=Math.floor(l1Hash(st.bx,st.bz,323)*4);for(let k=0;k<4;k++){const[fx,fz]=D[(o+k)%4],w=fz===1?l1WallX(st.bx,st.bz+1):fz===-1?l1WallX(st.bx,st.bz):fx===1?l1WallZ(st.bx+1,st.bz):l1WallZ(st.bx,st.bz);if(!w)return[fx,fz];}return D[o];}
 // ---- sector pieces ----
 const HC2=2.45,HP2=L1_SEC_H[2],arch=t=>HC2+(HP2-HC2)*(1-Math.pow(1-Math.max(0,Math.min(1,t)),1.6));
 const ceilQuad=new T.PlaneGeometry(B,B).rotateX(Math.PI/2),vaultBase=new T.PlaneGeometry(B,B,10,10).rotateX(Math.PI/2);
 const capital=new T.CylinderGeometry(1.0,.36,.5,12,1,false),shaft=new T.CylinderGeometry(.36,.4,1,12,1,true);
 function vaultGeo(X,Z){const g=vaultBase.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.max(arch(1-Math.abs(x)/4),arch(1-Math.abs(z)/4)));}
  g.translate(X+4-ox0,0,Z+4-oz0);g.computeVertexNormals();return col(g,C.vault);}
 // vertical strip on a bay edge from the gothic edge arch up to `top`, both faces (axis 'x': runs along x at z=Z)
 function spandrel(X,Z,axis,top){const n=10,pos=[],nor=[],uv=[],idx=[];for(const f of [1,-1]){const b0=pos.length/3;
   for(let i=0;i<=n;i++){const u=i/n*B,y0=arch(1-Math.abs(u-4)/4),x=axis==='x'?X+u:X,z=axis==='x'?Z:Z+u;pos.push(x-ox0,y0,z-oz0,x-ox0,top,z-oz0);
    for(let k=0;k<2;k++){nor.push(axis==='x'?0:f,0,axis==='x'?f:0);uv.push(0,0);}}
   for(let i=0;i<n;i++){const a=b0+i*2;if((f>0)===(axis==='x'))idx.push(a,a+2,a+1,a+1,a+2,a+3);else idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);return col(g,C.vault);}
 // chunk build is a generator: two bay rows per step, so streaming spreads one chunk over ~5 frames.
 // The shared scratch lists are restored after every yield (a synchronous ensure() may build another chunk in between).
 function buildChunk(cx,cz){const g=chunkGen(cx,cz);let r;do r=g.next();while(!r.done);return r.value;}
 function* chunkGen(cx,cz){parts=[];glows=[];exits=[];solids=[];const x0=cx*8,z0=cz*8;ox0=cx*K;oz0=cz*K;const ctx={parts,glows,exits,solids};
  const resume=()=>{parts=ctx.parts;glows=ctx.glows;exits=ctx.exits;solids=ctx.solids;ox0=cx*K;oz0=cz*K;};
  const kc=new Map(),kind=(a,b)=>{const k=a*100003+b;let v=kc.get(k);if(v===undefined){v=l1Sector(a,b);kc.set(k,v);}return v;},hgt=(a,b)=>L1_SEC_H[kind(a,b)];
  for(let iz=z0;iz<z0+8;iz++){if(iz>z0){yield;resume();}for(let ix=x0;ix<x0+8;ix++){
   const X=ix*B,Z=iz*B,r=(s)=>l1Hash(ix,iz,s),kb=kind(ix,iz),hb=L1_SEC_H[kb],gw=Math.max(0,Math.min(1,(l1SecV(ix,iz)-.62)/.14))*(kb===2?0:1);
   const hX=Math.max(hb,hgt(ix,iz-1)),hZ=Math.max(hb,hgt(ix-1,iz)),hCol=Math.max(hX,hZ,hgt(ix-1,iz-1));
   // column at corner (Gothic: round shaft + mushroom capital when all four bays are Gothic)
   const goth=kb===2&&kind(ix-1,iz)===2&&kind(ix,iz-1)===2&&kind(ix-1,iz-1)===2;
   if(goth&&(l1Hash(ix,iz,1)>.1||l1WallX(ix,iz)||l1WallX(ix-1,iz)||l1WallZ(ix,iz)||l1WallZ(ix,iz-1))){P(shaft,C.gcol,X,1.03,Z,1,2.06,1);P(capital,C.gcol,X,2.3,Z,1,1,1);P(box,C.gcol,X,.06,Z,.95,.12,.95);}
   else if(l1Column(ix,iz)){P(box,C.column,X,hCol/2,Z,L1_COL,hCol,L1_COL);
    if(l1ColumnTube(ix,iz)&&kb!==2){const f=l1ColumnFace(ix,iz),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.035;G(GLOW.tube,X+dx*o,2.0,Z+dz*o,dx?.05:.07,1.22,dz?.05:.07);P(box,C.frame,X+dx*(o-.01),2.0,Z+dz*(o-.01),dx?.03:.11,1.32,dz?.03:.11);}
    if(r(23)<.3){const q=r(24)>.5?1:-1,o=L1_COL/2+.006;P(box,C.yellow,X+q*o,1.0,Z+o,.05,2.0,.012);}
    if(kb===0&&r(26)<.55){const Lc=LET[Math.floor(r(27)*LET.length)],o=L1_COL/2+.004,y=1.65;for(const[dx,dz]of[[0,1],[0,-1],[1,0],[-1,0]])if(r(28+dx+dz*2)<.7)P(box,Lc,X+dx*o,y,Z+dz*o,dz?.46:.004,.46,dx?.46:.004);}
    if(l1ColumnTube(ix,iz)&&kb!==2){}else if(r(21)<.18){const f=Math.floor(r(22)*4),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.09;P(box,C.hose,X+dx*o,1.3,Z+dz*o,dx?.18:.62,.62,dz?.18:.62);}
    else if(r(21)>.93){const f=Math.floor(r(22)*4),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.07;P(box,C.panel,X+dx*o,1.45,Z+dz*o,dx?.14:.5,.72,dz?.14:.5);}}
   // walls on the two edges this bay owns
   if(l1WallX(ix,iz)){P(box,C.concrete,X+4,hX/2,Z,B,hX,L1_WALL);solid(X+4,Z,B,L1_WALL+.02);decorWall(ix,iz,X+4,Z,'x');}
   if(l1WallZ(ix,iz)){P(box,C.concrete,X,hZ/2,Z+4,L1_WALL,hZ,B);solid(X,Z+4,L1_WALL+.02,B);decorWall(ix,iz,X,Z+4,'z');}
   // long corrugated runs (Aquila photo, right side): cladding + a vertical tube every 2 m
   if(l1RunX(ix,iz)){const s=l1RunSideX(iz),o=L1_WALL/2+.03;P(box,C.clad,X+4,H/2-.05,Z+s*o,B,H-.1,.05);for(let k=0;k<4;k++){G(GLOW.tube,X+1+k*2,2.0,Z+s*(o+.04),.07,1.22,.05);P(box,C.frame,X+1+k*2,2.0,Z+s*(o+.02),.12,1.32,.03);}}
   if(l1RunZ(ix,iz)){const s=l1RunSideZ(ix),o=L1_WALL/2+.03;P(box,C.clad,X+s*o,H/2-.05,Z+4,.05,H-.1,B);for(let k=0;k<4;k++){G(GLOW.tube,X+s*(o+.04),2.0,Z+1+k*2,.05,1.22,.07);P(box,C.frame,X+s*(o+.02),2.0,Z+1+k*2,.03,1.32,.12);}}
   // low concrete partitions (ramp parapets in the photo)
   if(l1LowX(ix,iz)){const a=r(160)*2,b=r(161)*2;P(box,C.low,X+4+(a-b)/2,.58,Z,B-1-a-b,1.16,.24);}
   if(l1LowZ(ix,iz)){const a=r(162)*2,b=r(163)*2;P(box,C.low,X,.58,Z+4+(a-b)/2,.24,1.16,B-1-a-b);}
   // sector seams: fascia between flat ceilings of different height, arched spandrel on Gothic edges
   for(const[ax,ka,kb2,top,hh]of[['x',kind(ix,iz-1),kb,hX,Math.min(hb,hgt(ix,iz-1))],['z',kind(ix-1,iz),kb,hZ,Math.min(hb,hgt(ix-1,iz))]]){if(ka===kb2)continue;if((ax==='x'?l1WallX:l1WallZ)(ix,iz))continue;
    if(ka===2||kb2===2)parts.push(spandrel(X,Z,ax,top));else if(ax==='x')P(box,C.beam,X+4,(hh+top)/2,Z,B,top-hh,.32);else P(box,C.beam,X,(hh+top)/2,Z+4,.32,top-hh,B);}
   const row=(s)=>l1Hash(0,iz,s),col2=(s)=>l1Hash(ix,0,s);
   if(kb===2){parts.push(vaultGeo(X,Z));if(r(5)>.4){P(box,C.wire,X+4,(HP2+3.8)/2,Z+4,.02,HP2-3.8,.02);P(box,C.frame,X+4,3.86,Z+4,.3,.12,.3);G(GLOW.warm,X+4,3.7,Z+4,.2,.24,.2);}}
   else if(kb===1){const HG=L1_SEC_H[1];P(ceilQuad,C.deck,X+4,HG,Z+4,1,1,1);
    // open steel truss on every x grid line, purlins along z, the odd big duct
    P(box,C.steel,X+4,HG-.12,Z,B,.14,.16);P(box,C.steel,X+4,HG-.78,Z,B,.12,.14);for(let k=0;k<8;k++)P(box,C.steel,X+.5+k,HG-.45,Z,.06,.66,.06,0);
    for(let k=0;k<4;k++)P(box,C.steel,X+1+k*2,HG-.25,Z+4,.08,.1,B);P(box,C.steel,X,HG-.2,Z+4,.22,.3,B);
    if(row(36)>.45)P(cyl,C.duct,X+4,HG-1.25,Z+6.2,B,.36,.36);if(row(37)>.6)P(cyl,C.red,X+4,HG-.95,Z+2.4,B,.05,.05);
    for(const dz of [2.6,5.4]){P(box,C.wire,X+3.4,(HG+4.86)/2,Z+dz,.015,HG-4.86,.015);P(box,C.wire,X+4.6,(HG+4.86)/2,Z+dz,.015,HG-4.86,.015);P(box,C.batten,X+4,4.82,Z+dz,1.5,.08,.2);G(GLOW.tube,X+4,4.77,Z+dz,1.4,.03,.12);}}
   else{P(ceilQuad,C.ceil,X+4,H,Z+4,1,1,1);
   // drop beams: wide shallow downstands along x on grid lines, narrower along z (image-19)
   P(box,C.beam,X+4,H-.07,Z,B,.14,1.1);if(col2(44)>.5)P(box,C.beam,X,H-.05,Z+4,.9,.1,B);
   // sprinkler mains: thin white pipes on threaded hanger rods, red pendant heads every ~2.7 m, the odd branch across
   const o1=1.4+row(31)*1.6,y1=H-.48-row(38)*.12;P(cyl,C.white,X+4,y1,Z+o1,B,.032,.032);for(const hx of[1.3,5.3])P(box,C.wire,X+hx,(H+y1)/2,Z+o1,.01,H-y1,.01);
   for(const hx of[.6,3.3,6.0]){P(box,C.white,X+hx,y1-.06,Z+o1,.018,.12,.018);P(vcyl,C.red,X+hx,y1-.14,Z+o1,.026,.05,.026);}
   if(row(32)>.3){const o2=4.6+row(33)*2.4,y2=H-.42;P(cyl,C.white,X+4,y2,Z+o2,B,.045,.045);for(const hx of[2.6,6.6])P(box,C.wire,X+hx,(H+y2)/2,Z+o2,.01,H-y2,.01);if(r(39)>.55)P(vcyl,C.red,X+2+r(40)*4,y2-.07,Z+o2,.026,.05,.026);}
   if(col2(35)>.5){const xo=1.2+col2(36)*5.6;P(cyl,C.white,X+xo,H-.36,Z+4,B,.028,.028,Math.PI/2);if(r(41)>.4)P(vcyl,C.red,X+xo,H-.43,Z+1.5+r(42)*5,.026,.05,.026);}
   if(r(45)<.18){const a=(r(46)>.5?1:-1)*(.35+r(47)*.4),L=B/Math.cos(a);P(cyl,C.white,X+4,H-.3,Z+4,L,.026,.026,a);}
   if(row(34)>.62)for(let k=0;k<3;k++)P(cyl,C.conduit,X+4,H-.3-k*.012,Z+6.9+k*.1,B,.022,.022);
   if(row(37)>.82)P(box,C.tray,X+4,H-.5,Z+3.2,B,.05,.36);
   // ceiling batten (paired with the analytic lamp at bay centre)
   if(l1Ceiling(ix,iz)){const lit=l1Hash(ix,iz,342)>l1Thr(X+4,Z+4)*.7,a=(r(343)-.5)*.5;P(box,C.batten,X+4,H-.03,Z+4,1.3,.06,.2,a);G(lit?GLOW.tube:GLOW.dim,X+4,H-.075,Z+4,1.22,.03,.16,a);}}
   // Level 2 threshold: pipes and gauges multiply toward the core, battens die out
   const th=l1Thr(X+4,Z+4);if(th>.02){const n=Math.floor(th*9+.3);const hc=kb===1?L1_SEC_H[1]:kb===2?HC2:H;
    // pipe k of a grid row/column keeps its offset, height and colour along the whole line, so runs stay continuous and thicken toward the core
    for(let k=0;k<n;k++){const along=k%2===0,L=along?iz:ix,rad=.04+l1Hash(L,k,332)*.11,y=Math.max(2.3,hc-.4-l1Hash(L,k,333)*Math.max(0,hc-2.6)),o=.6+l1Hash(L,k,334)*6.8,c=[C.rust,C.copper,C.pipeG,C.grey][Math.floor(l1Hash(L,k,335)*4)];
     if(along)P(cyl,c,X+4,y,Z+o,B,rad,rad);else P(cyl,c,X+o,y,Z+4,B,rad,rad,Math.PI/2);}
    // vertical risers beside the column + a gauge cluster on it
    if(l1Column(ix,iz)&&r(336)<th){const dx=r(337)>.5?.62:-.62;P(vcyl,C.pipeG,X+dx,hc/2,Z+.3,.09,hc,.09,0);
     const py=1.45;P(gcyl,C.dial,X+dx,py,Z+.3+.02,.02,.16,.16,Math.PI/2);P(gcyl,C.pipeG,X+dx,py,Z+.3-.01,.03,.18,.18,Math.PI/2);P(box,C.needle,X+dx+.03,py+.04,Z+.3+.06,.012,.11,.01);
     if(r(338)<th)P(gcyl,C.needle,X+dx,1.05,Z+.42,.025,.17,.17,Math.PI/2);}
    // wall gauges
    if(l1WallX(ix,iz)&&!l1DoorX(ix,iz)&&r(339)<th*.9){const sd=r(340)>.5?1:-1,u=X+4+(r(341)-.5)*4;for(let g=0;g<1+Math.floor(th*3);g++){const gx=u+g*.45,gy=1.3+((g*7)%3)*.22;P(gcyl,C.dial,gx,gy,Z+sd*.18,.02,.13,.13,Math.PI/2);P(gcyl,C.pipeG,gx,gy,Z+sd*.16,.03,.15,.15,Math.PI/2);P(box,C.needle,gx+.02,gy+.03,Z+sd*.2,.01,.09,.01);}
     P(vcyl,C.copper,u+.6,(hc+1.3)/2,Z+sd*.24,.05,hc-1.3,.05,0);}
   }
   // storage shelving: rare (Gild a bit more), mostly half-empty
   if(r(70)<.012+.07*gw&&!(ix>=-1&&ix<=1&&iz>=-1&&iz<=1)){const alongX=r(71)>.5,o=(r(77)>.5?1.6:-1.6),sx=alongX?X+4:X+4+o,sz=alongX?Z+4+o:Z+4,L=6.2,w=alongX?L:.62,d=alongX?.62:L;
     for(const e of [-1,1])for(const f of [-1,1])P(box,C.shelf,sx+(alongX?e*L/2:f*.29),1.2,sz+(alongX?f*.29:e*L/2),.05,2.4,.05);
     for(let lv=0;lv<4;lv++){const y=.12+lv*.74;P(box,C.shelf,sx,y,sz,w,.03,d);P(box,C.shelfB,sx+(alongX?0:.29),y+.05,sz+(alongX?.29:0),alongX?L:.03,.06,alongX?.03:L);
      if(lv<3)for(let k=0;k<5;k++){if(l1Hash(ix*13+k,iz*7+lv,72)<.55)continue;const t=-L/2+.7+k*1.2;PR.crate(sx+(alongX?t:0),sz+(alongX?0:t),alongX?0:Math.PI/2,y+.015,Math.floor(l1Hash(ix+k,iz+lv,74)*14),.7);}}
     solid(sx,sz,w+.1,d+.1);}
   // leftovers: a hand-composed vignette in ~1 bay in 7, backed against a wall when the bay has one
   else if(r(80)<.22+.12*gw&&!(ix===0&&iz===0)){const wx=l1WallX(ix,iz),wz=l1WallZ(ix,iz),k=ix*977+iz*131;
     const set=kb===1?PR.STORE:r(81)<.35?PR.GARAGE:(wx||wz)?PR.WALL:PR.FREE,n=1+Math.floor(r(82)*(r(83)<.3?3:1.6));
     for(let q=0;q<n;q++){const kind=set[Math.floor(l1Hash(ix+q*31,iz,84)*set.length)];let x,z,ry;
      if((wx||wz)&&q<2){const along=1.4+l1Hash(ix,iz+q*17,85)*5.2;if(wx){x=X+along;z=Z+L1_WALL/2+.45;ry=0;}else{x=X+L1_WALL/2+.45;z=Z+along;ry=-Math.PI/2;}ry+=(l1Hash(ix,iz,86+q)-.5)*.25;}
      else{x=X+1.6+l1Hash(ix,iz+q,87)*4.8;z=Z+1.6+l1Hash(ix+q,iz,88)*4.8;ry=l1Hash(ix,iz,89+q)*6.28;}
      PR.place(kind,x,z,ry,k+q*7);}}
   else if(r(40)<.05)PR.debris(X+1.5+r(42)*5,Z+1.5+r(43)*5,0,ix*31+iz);
  }}
  yield;resume();
  // Level 2 maintenance door at a threshold core
  const site=l1ThrSite(x0+4,z0+4);if(site&&site.bx>=x0&&site.bx<x0+8&&site.bz>=z0&&site.bz<z0+8){const st=site,{x,z}=st,kb=kind(st.bx,st.bz),hc=kb===1?L1_SEC_H[1]:kb===2?HC2:H,[fx,fz]=siteDir(st),rx=fz,rz=-fx,alongZ=fx===0;
   const Q=(g,c,a,y,b,w,h,d,disc=false)=>put(c.length===4?parts:glows,g,c,x+a*rx+b*fx,y,z+a*rz+b*fz,disc?w:alongZ?w:d,h,disc?d:alongZ?d:w,disc?(alongZ?Math.PI/2:0):0);
   Q(box,C.concrete,0,hc/2,0,5,hc,1.6);solid(x,z,alongZ?5.1:1.7,alongZ?1.7:5.1);Q(box,C.frame,0,1.17,.81,1.5,2.34,.04);Q(box,C.door2,0,1.1,.84,1.3,2.18,.04);Q(box,C.pipeG,.45,1.05,.88,.08,.36,.05);
   Q(box,C.yellow,-1.6,.6,.81,.5,1.2,.02);for(const yy of [.35,.6,.85])Q(box,C.mark,-1.6,yy,.825,.4,.08,.01);
   Q(box,C.sign,0,2.55,.84,.7,.2,.04);Q(box,GLOW.amber,0,2.55,.87,.62,.13,.02);Q(box,GLOW.amber,1.1,2.25,.9,.14,.14,.1);
   for(let k=0;k<7;k++){const a=-2.1+k*.7,rad=.07+(k%3)*.05,c=[C.rust,C.copper,C.pipeG];Q(vcyl,c[k%3],a,hc-.2,-.2+((k*3)%4)*.12,rad,.6,rad);
    put(parts,cyl,c[(k+1)%3],x+a*rx-4.4*fx,hc-.45-(k%3)*.18,z+a*rz-4.4*fz,B,rad,rad,alongZ?Math.PI/2:0);}
   Q(gcyl,C.dial,1.6,1.5,.82,.02,.2,.2,true);Q(gcyl,C.dial,2.0,1.3,.82,.02,.14,.14,true);Q(box,C.needle,1.62,1.55,.84,.012,.14,.01);Q(gcyl,C.needle,-1.2,1.35,.84,.03,.24,.24,true);}
  // group landmarks: coloured cloth + almond water + a note on a wall (wiki: the M.E.G./groups' markers)
  const camp=campAt(cx,cz);if(camp){const{x,z,nx,nz,col:cc}=camp,ax=nz!==0,w=(a,b)=>ax?a:b,F=(o)=>[x+nx*o,z+nz*o];
   let[fx,fz]=F(.17);P(box,cc,fx,1.75,fz,w(1.15,.02),1.25,w(.02,1.15));[fx,fz]=F(.18);P(box,camp.col2,fx+w(.25,0),1.2,fz+w(0,.25),w(.35,.022),.5,w(.022,.35));
   [fx,fz]=F(.19);P(box,C.paper,fx+w(.7,0),1.55,fz+w(0,.7),w(.22,.01),.3,w(.01,.22));P(box,C.tape,fx+w(.7,0),1.69,fz+w(0,.7),w(.1,.012),.03,w(.012,.1));
   [fx,fz]=F(.42);PR.crate(fx,fz,ax?0:Math.PI/2,0,1,.75);solid(fx,fz,.6,.6);}
  yield;resume();
  const geo=mergeGeometries(parts,false),glow=glows.length?mergeGeometries(glows,false):null;parts.forEach(g=>g.dispose());glows.forEach(g=>g.dispose());
  const group=new T.Group(),m=new T.Mesh(geo,mat);group.position.set(cx*K,0,cz*K);m.frustumCulled=true;group.add(m);if(glow){const gm=new T.Mesh(glow,glowMat);group.add(gm);}if(exits.length){const eg=mergeGeometries(exits,false);exits.forEach(g=>g.dispose());group.add(new T.Mesh(eg,exitMat));}
  const out={cx,cz,group,solids};parts=glows=exits=solids=null;return out;}
 function decorWall(ix,iz,x,z,axis){if(axis==='x'?l1RunX(ix,iz):l1RunZ(ix,iz))return;const ax=axis==='x',door=ax?l1DoorX(ix,iz):l1DoorZ(ix,iz),side=(ax?l1TubeSideX:l1TubeSideZ)(ix,iz);
  if(door){for(const s of [1,-1]){const o=L1_WALL/2+.02;const fx=ax?0:s*o,fz=ax?s*o:0,w=ax?2.0:.04,d=ax?.04:2.0;
    P(box,C.frame,x+fx,1.13,z+fz,ax?2.16:.06,2.26,ax?.06:2.16);P(box,C.door,x+fx*1.3,1.08,z+fz*1.3,w,2.12,d);
    P(box,C.white,x+(ax?.45:fx*1.6),1.05,z+(ax?fz*1.6:.45),ax?.5:.03,.04,ax?.03:.5);P(box,C.white,x+(ax?-.45:fx*1.6),1.05,z+(ax?fz*1.6:-.45),ax?.5:.03,.04,ax?.03:.5);
    P(box,C.sign,x+fx*1.4,2.52,z+fz*1.4,ax?.5:.06,.24,ax?.06:.5);G(GLOW.exit,x+fx*1.95,2.52,z+fz*1.95,ax?.46:.02,.2,ax?.02:.46);}}
  else if((ax?l1TubeX:l1TubeZ)(ix,iz)){const off=(ax?l1TubeOffX:l1TubeOffZ)(ix,iz),o=L1_WALL/2+.04;if(ax){G(GLOW.tube,x+off,2.0,z+side*o,.07,1.22,.05);P(box,C.frame,x+off,2.0,z+side*(o-.015),.12,1.32,.03);}else{G(GLOW.tube,x+side*o,2.0,z+off,.05,1.22,.07);P(box,C.frame,x+side*(o-.015),2.0,z+off,.03,1.32,.12);}}
  else if(l1Hash(ix,iz,ax?60:61)<.2){const o=L1_WALL/2+.06,off=(l1Hash(ix,iz,62)-.5)*4;if(ax)P(box,C.panel,x+off,1.5,z+side*o,.62,.82,.12);else P(box,C.panel,x+side*o,1.5,z+off,.12,.82,.62);}}
 // ---- streaming window: 3×3 chunks, one build per frame ----
 const rebase=l1Rebase(scene),chunks=new Map(),key=(a,b)=>a+','+b;let want=[],center='';
 let building=null;
 function chunkAt(cx,cz){const k=key(cx,cz);let c=chunks.get(k);if(!c){if(building&&building.k===k){let r;do r=building.g.next();while(!r.done);c=r.value;building=null;}else c=buildChunk(cx,cz);chunks.set(k,c);scene.add(c.group);}return c;}
 function stepBuild(){if(!building){while(want.length){const[a,b]=want.shift(),k=key(a,b);if(!chunks.has(k)){building={k,g:chunkGen(a,b)};break;}}}if(!building)return;const r=building.g.next();if(r.done){chunks.set(building.k,r.value);scene.add(r.value.group);building=null;}}
 function ensure(x,z){if(mode==='corridor')return corridors.ensure(x,z);const cx=Math.floor(x/K),cz=Math.floor(z/K);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)chunkAt(cx+dx,cz+dz);}
 function plan(x,z){const cx=Math.floor((x+K/2)/K-.5),cz=Math.floor((z+K/2)/K-.5),k=key(Math.floor(x/K),Math.floor(z/K));if(k===center)return;center=k;const ccx=Math.floor(x/K),ccz=Math.floor(z/K);want=[];
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(!chunks.has(key(ccx+dx,ccz+dz)))want.push([ccx+dx,ccz+dz]);
  for(const[k2,c]of chunks)if(Math.abs(c.cx-ccx)>2||Math.abs(c.cz-ccz)>2){scene.remove(c.group);c.group.traverse(o=>o.geometry?.dispose());chunks.delete(k2);}}
 // ---- collision ----
 function blocked(x,z,r=.25){if(mode==='corridor')return corridors.blocked(x,z,r);const cx=Math.round(x/B),cz=Math.round(z/B),hc=L1_COL/2+r;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=(cx+i)*B,Z=(cz+j)*B;if(Math.abs(x-X)<hc&&Math.abs(z-Z)<hc&&l1Column(cx+i,cz+j))return true;}
  const ix=Math.floor(x/B),iz=Math.floor(z/B),hw=L1_WALL/2+r;
  for(let j=0;j<=1;j++)if(Math.abs(z-(iz+j)*B)<hw&&l1WallX(ix,iz+j))return true;
  for(let i=0;i<=1;i++)if(Math.abs(x-(ix+i)*B)<hw&&l1WallZ(ix+i,iz))return true;
  const lw=.12+r,low=(a,b,s)=>{const p=l1Hash(a,b,s)*2,q=l1Hash(a,b,s+1)*2;return[.5+p,B-.5-q];};
  for(let j=0;j<=1;j++)if(Math.abs(z-(iz+j)*B)<lw&&l1LowX(ix,iz+j)){const[u0,u1]=low(ix,iz+j,160),u=x-ix*B;if(u>u0-r&&u<u1+r)return true;}
  for(let i=0;i<=1;i++)if(Math.abs(x-(ix+i)*B)<lw&&l1LowZ(ix+i,iz)){const[u0,u1]=low(ix+i,iz,162),u=z-iz*B;if(u>u0-r&&u<u1+r)return true;}
  const c=chunks.get(key(Math.floor(x/K),Math.floor(z/K)));if(c)for(const s of c.solids)if(Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r)return true;return false;}
 function safe(x,z){for(let rr=0;rr<12;rr+=.5)for(let a=0;a<16;a++){const px=x+Math.cos(a/16*Math.PI*2)*rr,pz=z+Math.sin(a/16*Math.PI*2)*rr;if(!blocked(px,pz,.45))return{x:px,z:pz};if(rr===0)break;}return{x,z};}
 // ---- Flickering: all lights die at random, for a random time; exit signs stay ----
 let flickerStart=0,elapsed=0,nextFlicker=70+Math.random()*120,flickerEnd=-1,power=1,forced=null;
 function update(dt,x,z){elapsed+=dt;if(mode==='halls'&&rebase.update(x,z))uniforms.l1OB.value.set(rebase.o.x/B,rebase.o.z/B);uniforms.l1Time.value=elapsed;if(mode==='halls'){plan(x,z);stepBuild();}
  floor.position.set(Math.round(x/B)*B,0,Math.round(z/B)*B);ceiling.position.copy(floor.position);
  let target=1;if(forced!==null)target=forced;else{if(flickerEnd<0&&elapsed>nextFlicker){flickerStart=elapsed;flickerEnd=elapsed+6+Math.random()*16;}if(flickerEnd>0){target=0;if(elapsed<flickerStart+1.1)target=Math.sin(elapsed*47)+Math.sin(elapsed*31)>.4?1:0;if(elapsed>=flickerEnd){flickerEnd=-1;target=1;nextFlicker=elapsed+90+Math.random()*240;}}}
  power+=(target-power)*Math.min(1,dt*(target>power?4:16));uniforms.l1Power.value=power;glowMat.color.setScalar(.04+.96*power);propLight.intensity=.08+1.02*power;if(mode==='corridor'){corridors.update(dt,x,z,power);return power<.3?'flicker':'corridor:'+(corridors.roomAt(x,z)||'');}
  return power<.3?'flicker':'halls';}
 function setPower(v){forced=v;}
 function nearDoor(x,z,yaw){if(mode==='corridor')return corridors.atDoor(x,z);const ix=Math.floor(x/B),iz=Math.floor(z/B);
  for(let j=0;j<=1;j++)for(let i=-1;i<=1;i++){const a=ix+i,b=iz+j;if(l1DoorX(a,b)){const dx=x-(a*B+4),dz=z-b*B;if(Math.abs(dx)<1.3&&Math.abs(dz)<1.4)return{x:a*B+4,z:b*B,side:Math.sign(dz)||1,axis:'x',id:a*7919+b*31};}}
  for(let j=-1;j<=1;j++)for(let i=0;i<=1;i++){const a=ix+i,b=iz+j;if(l1DoorZ(a,b)){const dx=x-a*B,dz=z-(b*B+4);if(Math.abs(dz)<1.3&&Math.abs(dx)<1.4)return{x:a*B,z:b*B+4,side:Math.sign(dx)||1,axis:'z',id:a*104729+b*13};}}return null;}
 function nearCamp(x,z){if(mode!=='halls')return null;const cx=Math.floor(x/K),cz=Math.floor(z/K);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const c=campAt(cx+i,cz+j);if(c&&Math.hypot(c.bottle.x-x,c.bottle.z-z)<1.9)return c;}return null;}
 function camps(x,z){const cx=Math.floor(x/K),cz=Math.floor(z/K),o=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const c=campAt(cx+i,cz+j);if(c)o.push(c);}return o;}
 function nearThreshold(x,z){if(mode!=='halls')return null;const s=l1ThrSite(Math.floor(x/B),Math.floor(z/B));if(!s)return null;const[fx,fz]=siteDir(s),a=(x-s.x)*fz-(z-s.z)*fx,b=(x-s.x)*fx+(z-s.z)*fz;if(Math.abs(a)<1.1&&b>.8&&b<2.3)return{level2:true,label:'E 推开维修门 · 前往 Level 2（尚未开放，会回到进入 Level 1 前的位置）'};return null;}
 function interact(x,z,yaw){if(nearThreshold(x,z))return{level2:true};const d=nearDoor(x,z,yaw);if(!d)return null;
  if(mode==='corridor'){mode='halls';const r=hallReturn;if(!d.exit)return{x:r.x,z:r.z,yaw:r.yaw,mode};
  // a hashed exit door: come out in the halls displaced by how far you walked in the labyrinth (infinite both ways)
  const q=safe(r.x+(x-1.2),r.z+(z-1.5));ensure(q.x,q.z);center='';return{x:q.x,z:q.z,yaw,mode};}
  hallReturn=d.axis==='x'?{x:d.x,z:d.z+d.side*1.1,yaw:d.side>0?0:Math.PI}:{x:d.x+d.side*1.1,z:d.z,yaw:d.side>0?Math.PI/2:-Math.PI/2};
  const p=corridors.build(Math.abs(d.id)%100000);mode='corridor';return{...p,mode};}

 function map(ctx,ox,oz,cxp,cyp,scale,radius){if(mode==='corridor')return corridors.map(ctx,ox,oz,cxp,cyp,scale,radius);ctx.save();ctx.fillStyle='#1d2022';ctx.fillRect(cxp-radius*scale,cyp-radius*scale,radius*scale*2,radius*scale*2);
  const x0=Math.floor((ox-radius)/B)-1,x1=Math.ceil((ox+radius)/B)+1,z0=Math.floor((oz-radius)/B)-1,z1=Math.ceil((oz+radius)/B)+1,sx=v=>cxp+(v-ox)*scale,sz=v=>cyp+(v-oz)*scale;
  ctx.fillStyle='#3a3f42';ctx.fillRect(sx(x0*B),sz(z0*B),(x1-x0)*B*scale,(z1-z0)*B*scale);
  for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){const k=l1Sector(ix,iz);if(k){ctx.fillStyle=k===1?'#4a4f50':'#3f3a33';ctx.fillRect(sx(ix*B),sz(iz*B),B*scale+.5,B*scale+.5);}}
  ctx.fillStyle='#c9cfd2';for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){const X=ix*B,Z=iz*B;if(l1WallX(ix,iz))ctx.fillRect(sx(X),sz(Z)-Math.max(1,.15*scale),B*scale,Math.max(2,.3*scale));if(l1WallZ(ix,iz))ctx.fillRect(sx(X)-Math.max(1,.15*scale),sz(Z),Math.max(2,.3*scale),B*scale);if(l1LowX(ix,iz)){ctx.fillStyle='#7d8487';ctx.fillRect(sx(X+.5),sz(Z)-1,(B-1)*scale,2);ctx.fillStyle='#c9cfd2';}if(l1LowZ(ix,iz)){ctx.fillStyle='#7d8487';ctx.fillRect(sx(X)-1,sz(Z+.5),2,(B-1)*scale);ctx.fillStyle='#c9cfd2';}if(l1Column(ix,iz))ctx.fillRect(sx(X)-.45*scale,sz(Z)-.45*scale,Math.max(2,.9*scale),Math.max(2,.9*scale));
   if(l1DoorX(ix,iz)){ctx.fillStyle='#3fd36b';ctx.fillRect(sx(X+3),sz(Z)-1.5,2*scale,3);ctx.fillStyle='#c9cfd2';}if(l1DoorZ(ix,iz)){ctx.fillStyle='#3fd36b';ctx.fillRect(sx(X)-1.5,sz(Z+3),3,2*scale);ctx.fillStyle='#c9cfd2';}}
  for(const c of camps(ox,oz)){ctx.fillStyle=`rgb(${c.col.map(v=>Math.round(Math.pow(v,1/2.2)*255)).slice(0,3).join(',')})`;ctx.fillRect(sx(c.x)-3,sz(c.z)-3,6,6);}
  {const s=l1ThrSite(Math.floor(ox/B),Math.floor(oz/B));if(s&&Math.abs(s.x-ox)<radius+8&&Math.abs(s.z-oz)<radius+8){ctx.fillStyle='#e58a2a';ctx.fillRect(sx(s.x)-2.5*scale,sz(s.z)-.8*scale,5*scale,1.6*scale);}}
  ctx.restore();}
 const landmarks=[{name:'天鹰段 · 切入点',x:4,z:4,yaw:-.6,pitch:-.03},{name:'天鹰段 · 积水长廊',x:2.2,z:-3.2,yaw:-2.35,pitch:-.05},{name:'天鹰段 · 柱列纵深',x:-3,z:4.4,yaw:1.0,pitch:-.02},{name:'储物货架 · 板条箱',x:-12,z:-17.6,yaw:0,pitch:-.06}];
 // hashed features nearest the arrival (found from the pure layout, so they work anywhere in the infinite plane)
 {const spiral=(R,f)=>{for(let r=0;r<R;r++)for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++){if(Math.max(Math.abs(x),Math.abs(z))!==r)continue;const v=f(x,z);if(v)return v;}return null;};
  const sec=k=>spiral(160,(x,z)=>l1Sector(x,z)===k&&[[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]].every(([a,b])=>l1Sector(x+a,z+b)===k)?{x:x*B+4,z:z*B+4}:null);
  const g=sec(1),o=sec(2);if(g)landmarks.push({name:'跃金段 · 货架仓库',x:g.x,z:g.z,yaw:.4,pitch:.12});if(o)landmarks.push({name:'哥特段 · 拱顶柱厅',x:o.x,z:o.z,yaw:.3,pitch:.15});
  const c=spiral(12,(x,z)=>campAt(x,z));if(c)landmarks.push({name:'团体地标 · 彩布与杏仁水',x:c.bottle.x+c.nx*2.2,z:c.bottle.z+c.nz*2.2,yaw:Math.atan2(c.nx,c.nz),pitch:-.12});
  const t=spiral(6,(x,z)=>l1ThrSite(x*64+32,z*64+32));if(t){const[fx,fz]=siteDir(t);landmarks.push({name:'阈界 · 通往 Level 2 的管道区',x:t.x+fx*6,z:t.z+fz*6,yaw:Math.atan2(fx,fz),pitch:.06});}}
 async function prewarm(r,camera){ensure(camera.position.x,camera.position.z);await r.compileAsync(scene,camera);corridors.build(1);await r.compileAsync(corridors.scene,camera);}
 return{hallsScene:scene,nearCamp,camps,nearThreshold,threshold:(x,z)=>l1Thr(x,z),sector:(x,z)=>l1Sector(Math.floor(x/B),Math.floor(z/B)),get scene(){return mode==='corridor'?corridors.scene:scene},get mode(){return mode},nearDoor,interact,ready:Promise.all(pending),ensure,update,blocked,safe,floorAt:()=>0,supportAt:(x,z,maxY=.15)=>maxY>=-.001?0:-Infinity,landingAt:(x,z,from,to)=>from>=-.03&&to<=0.001?0:null,headAt:()=>H,
  powerAt:()=>power,setPower,toHalls:()=>{if(mode!=='halls'){mode='halls';center='';}},flicker:()=>{forced=null;flickerEnd=-1;nextFlicker=elapsed;},map,landmarks,prewarm,stats:()=>({chunks:chunks.size,drawCalls:chunks.size*2+2,origin:{...rebase.o},corridor:corridors.stats()}),corridors,get power(){return power},setMirrorScale:v=>{mirrorScale=v;}};
}
