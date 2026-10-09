// Level 1 "宜居地带" — Aquila-sector halls (concrete car-park × warehouse).
// One merged mesh per 64 m chunk (one lit material, vertex colours), one emissive mesh per chunk,
// global floor/ceiling planes. Lighting is analytic and layout-hashed in the shader: a constant
// number of light evaluations per fragment, no scene lights → no program recompiles.
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createLevel1Corridors} from './level1-corridors.js?v=108';
import {l1Rebase,L1_BAY as B,L1_CHUNK as K,L1_H as H,L1_COL,L1_WALL,l1Hash,l1WallX,l1WallZ,l1Column,l1DoorX,l1DoorZ,l1Ceiling,l1ColumnTube,l1ColumnFace,l1TubeX,l1TubeZ,l1TubeSideX,l1TubeSideZ,l1TubeOffX,l1TubeOffZ,L1_LAYOUT_GLSL} from './level1-layout.js?v=108';

const LIGHT_GLSL=`${L1_LAYOUT_GLSL}
uniform ivec2 l1OB;// floating-origin offset in bays (integer, exact)
float lh(int x,int z,int s){return l1h(x+l1OB.x,z+l1OB.y,s);}
bool lwx(int x,int z){return l1wx(x+l1OB.x,z+l1OB.y);}bool lwz(int x,int z){return l1wz(x+l1OB.x,z+l1OB.y);}
bool lcol(int x,int z){return l1col(x+l1OB.x,z+l1OB.y);}bool ldx(int x,int z){return l1dx(x+l1OB.x,z+l1OB.y);}bool ldz(int x,int z){return l1dz(x+l1OB.x,z+l1OB.y);}
uniform float l1Power;uniform float l1Time;uniform vec3 l1Amb;uniform vec3 l1Lamp;
float l1fall(vec3 d,float k,float range){float r2=dot(d,d);float c=clamp(1.0-r2/(range*range),0.0,1.0);return c*c/(1.0+r2*k);}
float l1vis(int fx,int fz,int bx,int bz){int dx=bx-fx,dz=bz-fz;if(dx==0&&dz==0)return 1.0;int xl=max(fx,bx),zl=max(fz,bz);
 bool a=(dx!=0&&lwz(xl,fz))||(dz!=0&&lwx(bx,zl));bool b=(dz!=0&&lwx(fx,zl))||(dx!=0&&lwz(xl,bz));
 if(!a&&!b)return 1.0;if(!a||!b)return .55;return .04;}
vec3 l1light(vec3 P,vec3 N){
 vec3 Q=P+N*.06;int fx=int(floor(Q.x/L1B)),fz=int(floor(Q.z/L1B));float acc=0.0;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){int bx=fx+i,bz=fz+j;if(lh(bx,bz,5)<=.22)continue;
  vec3 lp=vec3(float(bx)*L1B+4.0,3.18,float(bz)*L1B+4.0);vec3 d=lp-P;vec3 l=normalize(d);
  float ndl=max(dot(N,l),0.0)*.82+.18*max(N.y*-.5+.5,0.0);float lobe=.35+.65*clamp(-l.y*-1.0,0.0,1.0);
  acc+=4.6*ndl*lobe*l1fall(d,.33,15.0)*l1vis(fx,fz,bx,bz);}
 // vertical tubes on columns (nearest corner neighbourhood)
 int cx0=int(floor(Q.x/L1B+.5)),cz0=int(floor(Q.z/L1B+.5));
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){int cx=cx0+i,cz=cz0+j;if(!(lcol(cx,cz)&&lh(cx,cz,6)>.5))continue;int f=int(floor(lh(cx,cz,11)*4.0));
  vec3 dir=f==0?vec3(1,0,0):f==1?vec3(-1,0,0):f==2?vec3(0,0,1):vec3(0,0,-1);vec3 lp=vec3(float(cx)*L1B,2.0,float(cz)*L1B)+dir*.52;vec3 d=lp-P;
  float side=smoothstep(-.05,.25,dot(P-lp+dir*.1,dir)+.0);vec3 l=normalize(d);float ndl=max(dot(N,l),0.0)*.9+.1;
  acc+=3.1*ndl*side*l1fall(d,.55,11.0);}
 // vertical tubes on walls
 for(int j=0;j<=1;j++)for(int i=-1;i<=1;i++){int ix=fx+i,iz=fz+j;if(!(lwx(ix,iz)&&!ldx(ix,iz)&&lh(ix,iz,7)>.35))continue;float s=lh(ix,iz,8)>.5?1.0:-1.0;
  vec3 lp=vec3(float(ix)*L1B+4.0+(lh(ix,iz,10)-.5)*4.0,2.0,float(iz)*L1B+s*.3);vec3 d=lp-P;float side=smoothstep(.0,.2,(P.z-float(iz)*L1B)*s);vec3 l=normalize(d);
  acc+=3.1*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.55,11.0);}
 for(int j=-1;j<=1;j++)for(int i=0;i<=1;i++){int ix=fx+i,iz=fz+j;if(!(lwz(ix,iz)&&!ldz(ix,iz)&&lh(ix,iz,17)>.35))continue;float s=lh(ix,iz,18)>.5?1.0:-1.0;
  vec3 lp=vec3(float(ix)*L1B+s*.3,2.0,float(iz)*L1B+4.0+(lh(ix,iz,20)-.5)*4.0);vec3 d=lp-P;float side=smoothstep(.0,.2,(P.x-float(ix)*L1B)*s);vec3 l=normalize(d);
  acc+=3.1*(max(dot(N,l),0.0)*.9+.1)*side*l1fall(d,.55,11.0);}
 // contact darkening at column feet and wall bases
 vec2 cc=abs(P.xz-vec2(float(cx0),float(cz0))*L1B);float colD=max(cc.x,cc.y)-.45;float ao=1.0-.45*(1.0-smoothstep(0.0,.7,colD))*(1.0-smoothstep(0.0,.9,P.y))*(lcol(cx0,cz0)?1.0:0.0);
 float hemi=mix(.55,1.0,N.y*.5+.5);
 return (l1Amb*hemi*(.08+.92*l1Power)+l1Lamp*acc*l1Power)*ao;}
`;
const NOISE_GLSL=`
float l1n(vec2 p,vec2 per){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);vec2 i0=mod(i,per),i1=mod(i+1.0,per);
 float a=l1h(int(i0.x),int(i0.y),97),b=l1h(int(i1.x),int(i0.y),97),c=l1h(int(i0.x),int(i1.y),97),d=l1h(int(i1.x),int(i1.y),97);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float l1fbm(vec2 p,float per){return l1n(p,vec2(per))*.55+l1n(p*2.0+7.1,vec2(per*2.0))*.28+l1n(p*4.0+3.3,vec2(per*4.0))*.17;}
`;
const VERT=`
attribute vec4 l1c;varying vec4 vC;varying vec3 vW;varying vec3 vN;
#ifdef L1_FLOOR
uniform mat4 l1TexMat;varying vec4 vR;
#endif
#include <common>
#include <fog_pars_vertex>
void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);vC=l1c;
#ifdef L1_FLOOR
vR=l1TexMat*vec4(position,1.0);
#endif
vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const FRAG=`
uniform sampler2D l1Floor,l1Wall,l1Ceil;
#ifdef L1_FLOOR
uniform sampler2D l1Mirror;varying vec4 vR;
#endif
varying vec4 vC;varying vec3 vW;varying vec3 vN;
#include <common>
#include <fog_pars_fragment>
${LIGHT_GLSL}
${NOISE_GLSL}
void main(){vec3 N=normalize(vN);vec3 alb=vC.rgb;
 if(vC.a>.5){vec3 t;
  if(N.y>.5)t=texture2D(l1Floor,vW.xz*.42).rgb;
  else if(N.y<-.5)t=mix(texture2D(l1Ceil,vW.xz*.5).rgb,vec3(.62),.5);
  else{vec2 uv=abs(N.x)>.5?vW.zy:vW.xy;t=texture2D(l1Wall,uv*vec2(.33,.31)).rgb;
   // grime band and splash streaks near the floor
   float g=1.0-smoothstep(.05,.75,vW.y)*.9;t*=1.0-.32*g*(.6+.4*l1n(vec2(uv.x*3.0,1.0),vec2(4800.0,1.0)));
   if(vW.y>${(H-.62).toFixed(2)})t=mix(texture2D(l1Ceil,uv*.5).rgb,vec3(.62),.5);}
  alb*=t*1.18;}
 vec3 lit=l1light(vW,N);vec3 col=alb*lit;
#ifdef L1_FLOOR
 vec2 p=vW.xz;float st=l1fbm(p*.11,176.0);float tyre=smoothstep(.7,.0,abs(fract(p.x*.125+.5)-.5)*8.0-1.0);
 col*=mix(.82,1.06,st)*(1.0-.12*tyre*l1n(p*vec2(.4,3.0),vec2(640.0,4800.0)));
 float pm=l1fbm(p*.085+vec2(13.7,4.1),136.0)+.18*l1n(p*.9,vec2(1440.0));float wet=smoothstep(.66,.75,pm);float pud=smoothstep(.745,.775,pm);
 col*=1.0-.38*wet;
 vec2 rip=vec2(l1n(p*3.1+mod(l1Time*.15,4960.0),vec2(4960.0)),l1n(p*3.3-mod(l1Time*.12,5280.0),vec2(5280.0)))-.5;vec4 r=vR;r.xy+=rip*.035*r.w;
 vec3 refl=texture2DProj(l1Mirror,r).rgb;vec3 V=normalize(cameraPosition-vW);float fres=.14+.62*pow(1.0-max(V.y,0.0),3.0);
 col=mix(col,col*.18+refl*fres*.9,pud);col+=refl*.06*wet*(1.0-pud);
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
 const uniforms={l1Floor:{value:tex('floor.webp')},l1Wall:{value:tex('wall.webp')},l1Ceil:{value:tex('ceiling.webp')},l1Power:{value:1},l1Time:{value:0},l1Amb:{value:new T.Vector3(.13,.14,.15)},l1Lamp:{value:new T.Vector3(.95,1.0,1.04)},l1OB:{value:new T.Vector2(0,0)}};
 const corridors=createLevel1Corridors(T,renderer,{wall:uniforms.l1Wall.value,floor:uniforms.l1Floor.value,ceil:uniforms.l1Ceil.value});let mode='halls',hallReturn=null;
 const mk=(defines={})=>new T.ShaderMaterial({uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{}]),vertexShader:VERT,fragmentShader:FRAG,fog:true,defines});
 const mat=mk();Object.assign(mat.uniforms,uniforms);
 const mirrorRT=new T.WebGLRenderTarget(256,256,{type:T.HalfFloatType});mirrorRT.texture.generateMipmaps=false;
 const floorMat=mk({L1_FLOOR:1});Object.assign(floorMat.uniforms,uniforms,{l1Mirror:{value:mirrorRT.texture},l1TexMat:{value:new T.Matrix4()}});
 const glowMat=new T.MeshBasicMaterial({vertexColors:true,fog:true,toneMapped:false}),exitMat=new T.MeshBasicMaterial({vertexColors:true,fog:false,toneMapped:false});
 // global floor and ceiling planes, snapped under the player
 const plane=(w,y,flip)=>{const g=new T.PlaneGeometry(w,w).rotateX(flip?Math.PI/2:-Math.PI/2);g.translate(0,y,0);col(g,flip?[.78,.79,.8,1]:[.8,.8,.79,1]);return g;};
 function col(g,c){const n=g.attributes.position.count,a=new Float32Array(n*4);for(let i=0;i<n;i++)a.set(c,i*4);g.setAttribute('l1c',new T.BufferAttribute(a,4));return g;}
 const floor=new T.Mesh(plane(256,0,false),floorMat),ceiling=new T.Mesh(plane(256,H,true),mat);floor.frustumCulled=ceiling.frustumCulled=false;scene.add(floor,ceiling);
 // ---- planar mirror for puddles (one low-res pass, same scene, floor hidden) ----
 const virt=Object.assign(new T.PerspectiveCamera(),{userData:{l1Virt:true}}),cp=new T.Vector3(),lookAt=new T.Vector3(),rot=new T.Matrix4(),up=new T.Vector3(),tgt=new T.Vector3();let mirroring=false,mirrorScale=.34;
 floor.onBeforeRender=(r,s,camera)=>{if(mirroring)return;mirroring=true;
  cp.setFromMatrixPosition(camera.matrixWorld);rot.extractRotation(camera.matrixWorld);lookAt.set(0,0,-1).applyMatrix4(rot).add(cp);
  virt.position.set(cp.x,-cp.y,cp.z);tgt.set(lookAt.x,-lookAt.y,lookAt.z);up.set(0,1,0).applyMatrix4(rot);up.y=-up.y;virt.up.copy(up);virt.lookAt(tgt);virt.far=camera.far;virt.updateMatrixWorld();virt.projectionMatrix.copy(camera.projectionMatrix);
  floorMat.uniforms.l1TexMat.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(virt.projectionMatrix).multiply(virt.matrixWorldInverse).multiply(floor.matrixWorld);
  const size=r.getDrawingBufferSize(new T.Vector2()),w=Math.max(64,Math.round(size.x*mirrorScale)),h=Math.max(64,Math.round(size.y*mirrorScale));if(mirrorRT.width!==w||mirrorRT.height!==h)mirrorRT.setSize(w,h);
  const prev=r.getRenderTarget(),xr=r.xr.enabled,sh=r.shadowMap.autoUpdate;floor.visible=false;r.xr.enabled=false;r.shadowMap.autoUpdate=false;r.setRenderTarget(mirrorRT);r.state.buffers.depth.setMask(true);if(r.autoClear===false)r.clear();r.render(scene,virt);r.setRenderTarget(prev);r.xr.enabled=xr;r.shadowMap.autoUpdate=sh;floor.visible=true;mirroring=false;};
 // ---- part library ----
 const box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,8,1,true).rotateZ(Math.PI/2),tmp=new T.Object3D();
 const C={concrete:[.80,.80,.79,1],column:[.86,.86,.85,1],beam:[.62,.62,.62,1],grey:[.44,.46,.47,0],conduit:[.58,.6,.6,0],red:[.55,.06,.04,0],white:[.78,.79,.78,0],tray:[.34,.35,.36,0],door:[.16,.17,.18,0],frame:[.30,.31,.31,0],ply:[.62,.48,.30,0],plyD:[.42,.31,.18,0],batten:[.82,.83,.82,0],panel:[.50,.52,.50,0],hose:[.62,.07,.05,0],sign:[.10,.12,.11,0],shelf:[.36,.42,.5,0],shelfB:[.78,.42,.12,0]};
 for(const k in C){const c=new T.Color(C[k][0],C[k][1],C[k][2]).convertSRGBToLinear();C[k]=[c.r,c.g,c.b,C[k][3]];}
 const GLOW={tube:[1.7,1.85,1.95],exit:[.15,1.4,.35],dim:[.5,.55,.6]};
 let parts=null,glows=null,exits=null,solids=null,ox0=0,oz0=0;
 function put(list,geo,c,x,y,z,w,h,d,ry=0){tmp.position.set(x-ox0,y,z-oz0);tmp.rotation.set(0,ry,0);tmp.scale.set(w,h,d);tmp.updateMatrix();const g=geo.clone().applyMatrix4(tmp.matrix);list.push(c.length===4?col(g,c):colGlow(g,c));}
 function colGlow(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set(c,i*3);g.setAttribute('color',new T.BufferAttribute(a,3));g.deleteAttribute('uv');return g;}
 const P=(...a)=>put(parts,...a),G=(...a)=>put(a[0]===GLOW.exit?exits:glows,box,...a);
 function solid(x,z,w,d){solids.push({x,z,w,d});}
 function buildChunk(cx,cz){parts=[];glows=[];exits=[];solids=[];const x0=cx*8,z0=cz*8;ox0=cx*K;oz0=cz*K;
  for(let iz=z0;iz<z0+8;iz++)for(let ix=x0;ix<x0+8;ix++){
   const X=ix*B,Z=iz*B,r=(s)=>l1Hash(ix,iz,s);
   // column at corner
   if(l1Column(ix,iz)){P(box,C.column,X,H/2,Z,L1_COL,H,L1_COL);
    if(l1ColumnTube(ix,iz)){const f=l1ColumnFace(ix,iz),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.035;G(GLOW.tube,X+dx*o,2.0,Z+dz*o,dx?.05:.07,1.22,dz?.05:.07);P(box,C.frame,X+dx*(o-.01),2.0,Z+dz*(o-.01),dx?.03:.11,1.32,dz?.03:.11);}
    else if(r(21)<.18){const f=Math.floor(r(22)*4),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.09;P(box,C.hose,X+dx*o,1.3,Z+dz*o,dx?.18:.62,.62,dz?.18:.62);}
    else if(r(21)>.93){const f=Math.floor(r(22)*4),dx=f===0?1:f===1?-1:0,dz=f===2?1:f===3?-1:0,o=L1_COL/2+.07;P(box,C.panel,X+dx*o,1.45,Z+dz*o,dx?.14:.5,.72,dz?.14:.5);}}
   // walls on the two edges this bay owns
   if(l1WallX(ix,iz)){P(box,C.concrete,X+4,H/2,Z,B,H,L1_WALL);solid(X+4,Z,B,L1_WALL+.02);decorWall(ix,iz,X+4,Z,'x');}
   if(l1WallZ(ix,iz)){P(box,C.concrete,X,H/2,Z+4,L1_WALL,H,B);solid(X,Z+4,L1_WALL+.02,B);decorWall(ix,iz,X,Z+4,'z');}
   // beams: deep along x on every grid line, shallower along z
   P(box,C.beam,X+4,H-.27,Z,B,.54,.5);P(box,C.beam,X,H-.17,Z+4,.42,.34,B);
   // services: conduit bundle, cable tray, sprinkler (red) and large white pipe, row-varied
   const row=(s)=>l1Hash(0,iz,s),col2=(s)=>l1Hash(ix,0,s);
   for(let k=0;k<3;k++)P(cyl,C.conduit,X+4,H-.62-k*.012,Z+2.2+k*.14,B,.045,.045);
   if(row(31)>.25)P(box,C.tray,X+4,H-.66,Z+3.4,B,.05,.42);
   if(row(32)>.35){P(cyl,C.red,X+4,H-.66,Z+5.3,B,.055,.055);if(r(33)>.4)P(cyl,C.red,X+2,H-.62-.2,Z+5.3,.04,.4,.04);}
   if(row(34)>.55)P(cyl,C.white,X+4,H-.72,Z+6.6,B,.16,.16);
   if(col2(35)>.6)P(cyl,C.grey,X+5.6,H-.8,Z+4,.11,.11,B,Math.PI/2);
   // ceiling batten (paired with the analytic lamp at bay centre)
   if(l1Ceiling(ix,iz)){const lit=true;P(box,C.batten,X+4,H-.035,Z+4,1.32,.07,.16);G(lit?GLOW.tube:GLOW.dim,X+4,H-.08,Z+4,1.22,.03,.07);}
   // debris and the odd crate
   if(r(40)<.12){const n=2+Math.floor(r(41)*4),bx=X+1.5+r(42)*5,bz=Z+1.5+r(43)*5;for(let k=0;k<n;k++){const a=l1Hash(ix*7+k,iz,44)*Math.PI,l=.8+l1Hash(ix,iz*5+k,45)*1.2;P(box,k%2?C.ply:C.plyD,bx+Math.cos(a)*.3,.03+k*.035,bz+Math.sin(a)*.3,l,.03,.14,a);}}
   // storage bays: retail back-room steel shelving lined with plywood crates (wiki: crates on shelves)
   if(r(70)<.07&&!(ix>=-1&&ix<=1&&iz>=-1&&iz<=1)){const alongX=r(71)>.5;for(const o of [-1.6,1.6]){const sx=alongX?X+4:X+4+o,sz=alongX?Z+4+o:Z+4,L=6.2,w=alongX?L:.62,d=alongX?.62:L;
     for(const e of [-1,1])for(const f of [-1,1])P(box,C.shelf,sx+(alongX?e*L/2:f*.29),1.2,sz+(alongX?f*.29:e*L/2),.05,2.4,.05);
     for(let lv=0;lv<4;lv++){const y=.12+lv*.74;P(box,C.shelf,sx,y,sz,w,.03,d);P(box,C.shelfB,sx+(alongX?0:.29),y+.05,sz+(alongX?.29:0),alongX?L:.03,.06,alongX?.03:L);
      if(lv<3)for(let k=0;k<5;k++){if(l1Hash(ix*13+k,iz*7+lv,72+(o>0?1:0))<.28)continue;const t=-L/2+.7+k*1.2,cs=.48+l1Hash(ix+k,iz+lv,74)*.18,ch=.36+l1Hash(ix-k,iz+lv,75)*.2;
       P(box,l1Hash(k,lv+ix,76)>.3?C.ply:C.plyD,sx+(alongX?t:0),y+.015+ch/2,sz+(alongX?0:t),alongX?cs*1.4:cs,ch,alongX?cs:cs*1.4);}}
     solid(sx,sz,w+.1,d+.1);}}
   if(r(46)<.07){const bx=X+1.6+r(47)*4.8,bz=Z+1.6+r(48)*4.8,s=.7+r(49)*.4;P(box,C.ply,bx,s*.42,bz,s,s*.84,s*.8,r(50)*.6);P(box,C.plyD,bx,s*.86,bz,s*1.02,.03,s*.82,r(50)*.6);solid(bx,bz,s*1.1,s*1.1);}
  }
  const geo=mergeGeometries(parts,false),glow=glows.length?mergeGeometries(glows,false):null;parts.forEach(g=>g.dispose());glows.forEach(g=>g.dispose());
  const group=new T.Group(),m=new T.Mesh(geo,mat);group.position.set(cx*K,0,cz*K);m.frustumCulled=true;group.add(m);if(glow){const gm=new T.Mesh(glow,glowMat);group.add(gm);}if(exits.length){const eg=mergeGeometries(exits,false);exits.forEach(g=>g.dispose());group.add(new T.Mesh(eg,exitMat));}
  const out={cx,cz,group,solids};parts=glows=exits=solids=null;return out;}
 function decorWall(ix,iz,x,z,axis){const ax=axis==='x',door=ax?l1DoorX(ix,iz):l1DoorZ(ix,iz),side=(ax?l1TubeSideX:l1TubeSideZ)(ix,iz);
  if(door){for(const s of [1,-1]){const o=L1_WALL/2+.02;const fx=ax?0:s*o,fz=ax?s*o:0,w=ax?2.0:.04,d=ax?.04:2.0;
    P(box,C.frame,x+fx,1.13,z+fz,ax?2.16:.06,2.26,ax?.06:2.16);P(box,C.door,x+fx*1.3,1.08,z+fz*1.3,w,2.12,d);
    P(box,C.white,x+(ax?.45:fx*1.6),1.05,z+(ax?fz*1.6:.45),ax?.5:.03,.04,ax?.03:.5);P(box,C.white,x+(ax?-.45:fx*1.6),1.05,z+(ax?fz*1.6:-.45),ax?.5:.03,.04,ax?.03:.5);
    P(box,C.sign,x+fx*1.4,2.52,z+fz*1.4,ax?.42:.06,.17,ax?.06:.42);G(GLOW.exit,x+fx*1.95,2.52,z+fz*1.95,ax?.36:.02,.12,ax?.02:.36);}}
  else if((ax?l1TubeX:l1TubeZ)(ix,iz)){const off=(ax?l1TubeOffX:l1TubeOffZ)(ix,iz),o=L1_WALL/2+.04;if(ax){G(GLOW.tube,x+off,2.0,z+side*o,.07,1.22,.05);P(box,C.frame,x+off,2.0,z+side*(o-.015),.12,1.32,.03);}else{G(GLOW.tube,x+side*o,2.0,z+off,.05,1.22,.07);P(box,C.frame,x+side*(o-.015),2.0,z+off,.03,1.32,.12);}}
  else if(l1Hash(ix,iz,ax?60:61)<.2){const o=L1_WALL/2+.06,off=(l1Hash(ix,iz,62)-.5)*4;if(ax)P(box,C.panel,x+off,1.5,z+side*o,.62,.82,.12);else P(box,C.panel,x+side*o,1.5,z+off,.12,.82,.62);}}
 // ---- streaming window: 3×3 chunks, one build per frame ----
 const rebase=l1Rebase(scene),chunks=new Map(),key=(a,b)=>a+','+b;let want=[],center='';
 function chunkAt(cx,cz){const k=key(cx,cz);let c=chunks.get(k);if(!c){c=buildChunk(cx,cz);chunks.set(k,c);scene.add(c.group);}return c;}
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
  const c=chunks.get(key(Math.floor(x/K),Math.floor(z/K)));if(c)for(const s of c.solids)if(Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r)return true;return false;}
 function safe(x,z){for(let rr=0;rr<12;rr+=.5)for(let a=0;a<16;a++){const px=x+Math.cos(a/16*Math.PI*2)*rr,pz=z+Math.sin(a/16*Math.PI*2)*rr;if(!blocked(px,pz,.45))return{x:px,z:pz};if(rr===0)break;}return{x,z};}
 // ---- Flickering: all lights die at random, for a random time; exit signs stay ----
 let flickerStart=0,elapsed=0,nextFlicker=70+Math.random()*120,flickerEnd=-1,power=1,forced=null;
 function update(dt,x,z){elapsed+=dt;if(mode==='halls'&&rebase.update(x,z))uniforms.l1OB.value.set(rebase.o.x/B,rebase.o.z/B);uniforms.l1Time.value=elapsed;if(mode==='halls'){plan(x,z);if(want.length){const[a,b]=want.shift();chunkAt(a,b);}}
  floor.position.set(Math.round(x/B)*B,0,Math.round(z/B)*B);ceiling.position.copy(floor.position);
  let target=1;if(forced!==null)target=forced;else{if(flickerEnd<0&&elapsed>nextFlicker){flickerStart=elapsed;flickerEnd=elapsed+6+Math.random()*16;}if(flickerEnd>0){target=0;if(elapsed<flickerStart+1.1)target=Math.sin(elapsed*47)+Math.sin(elapsed*31)>.4?1:0;if(elapsed>=flickerEnd){flickerEnd=-1;target=1;nextFlicker=elapsed+90+Math.random()*240;}}}
  power+=(target-power)*Math.min(1,dt*(target>power?4:16));uniforms.l1Power.value=power;glowMat.color.setScalar(.04+.96*power);if(mode==='corridor'){corridors.update(dt,x,z,power);return power<.3?'flicker':'corridor:'+(corridors.roomAt(x,z)||'');}
  return power<.3?'flicker':'halls';}
 function setPower(v){forced=v;}
 function nearDoor(x,z,yaw){if(mode==='corridor')return corridors.atDoor(x,z);const ix=Math.floor(x/B),iz=Math.floor(z/B);
  for(let j=0;j<=1;j++)for(let i=-1;i<=1;i++){const a=ix+i,b=iz+j;if(l1DoorX(a,b)){const dx=x-(a*B+4),dz=z-b*B;if(Math.abs(dx)<1.3&&Math.abs(dz)<1.4)return{x:a*B+4,z:b*B,side:Math.sign(dz)||1,axis:'x',id:a*7919+b*31};}}
  for(let j=-1;j<=1;j++)for(let i=0;i<=1;i++){const a=ix+i,b=iz+j;if(l1DoorZ(a,b)){const dx=x-a*B,dz=z-(b*B+4);if(Math.abs(dz)<1.3&&Math.abs(dx)<1.4)return{x:a*B,z:b*B+4,side:Math.sign(dx)||1,axis:'z',id:a*104729+b*13};}}return null;}
 function interact(x,z,yaw){const d=nearDoor(x,z,yaw);if(!d)return null;
  if(mode==='corridor'){mode='halls';const r=hallReturn;if(!d.exit)return{x:r.x,z:r.z,yaw:r.yaw,mode};
  // a hashed exit door: come out in the halls displaced by how far you walked in the labyrinth (infinite both ways)
  const q=safe(r.x+(x-1.2),r.z+(z-1.5));ensure(q.x,q.z);center='';return{x:q.x,z:q.z,yaw,mode};}
  hallReturn=d.axis==='x'?{x:d.x,z:d.z+d.side*1.1,yaw:d.side>0?0:Math.PI}:{x:d.x+d.side*1.1,z:d.z,yaw:d.side>0?Math.PI/2:-Math.PI/2};
  const p=corridors.build(Math.abs(d.id)%100000);mode='corridor';return{...p,mode};}

 function map(ctx,ox,oz,cxp,cyp,scale,radius){if(mode==='corridor')return corridors.map(ctx,ox,oz,cxp,cyp,scale,radius);ctx.save();ctx.fillStyle='#1d2022';ctx.fillRect(cxp-radius*scale,cyp-radius*scale,radius*scale*2,radius*scale*2);
  const x0=Math.floor((ox-radius)/B)-1,x1=Math.ceil((ox+radius)/B)+1,z0=Math.floor((oz-radius)/B)-1,z1=Math.ceil((oz+radius)/B)+1,sx=v=>cxp+(v-ox)*scale,sz=v=>cyp+(v-oz)*scale;
  ctx.fillStyle='#3a3f42';ctx.fillRect(sx(x0*B),sz(z0*B),(x1-x0)*B*scale,(z1-z0)*B*scale);
  ctx.fillStyle='#c9cfd2';for(let iz=z0;iz<=z1;iz++)for(let ix=x0;ix<=x1;ix++){const X=ix*B,Z=iz*B;if(l1WallX(ix,iz))ctx.fillRect(sx(X),sz(Z)-Math.max(1,.15*scale),B*scale,Math.max(2,.3*scale));if(l1WallZ(ix,iz))ctx.fillRect(sx(X)-Math.max(1,.15*scale),sz(Z),Math.max(2,.3*scale),B*scale);if(l1Column(ix,iz))ctx.fillRect(sx(X)-.45*scale,sz(Z)-.45*scale,Math.max(2,.9*scale),Math.max(2,.9*scale));
   if(l1DoorX(ix,iz)){ctx.fillStyle='#3fd36b';ctx.fillRect(sx(X+3),sz(Z)-1.5,2*scale,3);ctx.fillStyle='#c9cfd2';}if(l1DoorZ(ix,iz)){ctx.fillStyle='#3fd36b';ctx.fillRect(sx(X)-1.5,sz(Z+3),3,2*scale);ctx.fillStyle='#c9cfd2';}}
  ctx.restore();}
 const landmarks=[{name:'天鹰段 · 切入点',x:4,z:4,yaw:-.6,pitch:-.03},{name:'天鹰段 · 积水长廊',x:2.2,z:-3.2,yaw:-2.35,pitch:-.05},{name:'天鹰段 · 柱列纵深',x:-3,z:4.4,yaw:1.0,pitch:-.02},{name:'储物货架 · 板条箱',x:-12,z:-17.6,yaw:0,pitch:-.06}];
 async function prewarm(r,camera){ensure(camera.position.x,camera.position.z);await r.compileAsync(scene,camera);corridors.build(1);await r.compileAsync(corridors.scene,camera);}
 return{get scene(){return mode==='corridor'?corridors.scene:scene},get mode(){return mode},nearDoor,interact,ready:Promise.all(pending),ensure,update,blocked,safe,floorAt:()=>0,supportAt:(x,z,maxY=.15)=>maxY>=-.001?0:-Infinity,landingAt:(x,z,from,to)=>from>=-.03&&to<=0.001?0:null,headAt:()=>H,
  powerAt:()=>power,setPower,flicker:()=>{forced=null;flickerEnd=-1;nextFlicker=elapsed;},map,landmarks,prewarm,stats:()=>({chunks:chunks.size,drawCalls:chunks.size*2+2,origin:{...rebase.o},corridor:corridors.stats()}),corridors,get power(){return power},setMirrorScale:v=>{mirrorScale=v;}};
}
