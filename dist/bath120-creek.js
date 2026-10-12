// V121-bath: Level 27 entrance creek rebuilt (spec-1011-2236 item 4).
// Natural pebble channel bed, rounded wet cobbles, a flowing surface whose
// normals and foam are two-phase flow-mapped along the channel, white water at
// the lip drop and behind stones, darkened wet banks and soft rising steam.
// Same route authority (level27-creek.js); the carved rock shell is unchanged.
import * as T from './vendor/three.module.min.js';
const ROOT=new URL('./assets/bath-v120/',import.meta.url);const tex={};let loading=null;
export function preloadCreek121(){if(loading)return loading;const l=new T.TextureLoader();loading=Promise.all(['creek-bed','creek-bed-normal','creek-foam'].map(async n=>{const t=await l.loadAsync(new URL(n+'.webp',ROOT).href);t.name='V121 creek / '+n;t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=n==='creek-bed'?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;tex[n]=t;})).catch(e=>{loading=null;throw e;});return loading;}
const NOISE=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.55+vn(p*2.07+3.1)*.28+vn(p*4.13-7.7)*.17;}
float linDepth(float z,vec2 nf){return nf.x*nf.y/(nf.y-z*(nf.y-nf.x));}
float fres(float c){c=clamp(c,0.,1.);return .02+.98*pow(1.-c,5.);}`;
const waterV=`precision highp float;in vec3 position;in vec2 uv;in vec3 flowInfo;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;uniform float time;
out vec2 vUv;out vec3 vInfo,wPos,vPos;
void main(){vUv=uv;vInfo=flowInfo;vec3 p=position;
 float s=flowInfo.x;p.y+=sin(s*9.-time*6.)*.0025*flowInfo.y+sin(s*23.+uv.x*11.-time*9.)*.0012;
 vec4 w=modelMatrix*vec4(p,1.);wPos=w.xyz;vec4 v=viewMatrix*w;vPos=v.xyz;gl_Position=projectionMatrix*v;}`;
// flowInfo: x = arclength (m), y = speed (m/s), z = drop factor (0 flat .. 1 at the lip)
const waterF=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth,foamTex,bedTex;uniform vec2 resolution,nearFar;uniform vec3 eye;uniform mat4 viewMatrix;uniform float time,ready;
uniform vec4 stones[24];
in vec2 vUv;in vec3 vInfo,wPos,vPos;out vec4 o;
${NOISE}
float hgt(vec2 st){return fbm(st*vec2(5.5,2.6))*.6+vn(st*vec2(13.,5.))*.4;}
void main(){
 float u=vUv.x,s=vInfo.x,speed=vInfo.y,drop=vInfo.z;
 float bank=1.-pow(abs(u*2.-1.),2.);
 float sp=speed*(.45+.55*bank);
 // Two-phase flow mapping: two copies advected downstream, cross-faded so the
 // pattern never stretches; phase offset is noise-driven to hide the pulse.
 float ph=fbm(vec2(u*3.,s*.7))*.6;
 float t0=fract(time*.55+ph),t1=fract(time*.55+ph+.5),w0=1.-abs(t0*2.-1.);
 vec2 st=vec2(u*1.1,s);
 vec2 a=st-vec2(0.,t0*sp*1.8),b=st-vec2(0.,t1*sp*1.8)+vec2(.37,.21);
 float e=.02;
 vec2 ga=vec2(hgt(a+vec2(e,0.))-hgt(a-vec2(e,0.)),hgt(a+vec2(0.,e))-hgt(a-vec2(0.,e)));
 vec2 gb=vec2(hgt(b+vec2(e,0.))-hgt(b-vec2(e,0.)),hgt(b+vec2(0.,e))-hgt(b-vec2(0.,e)));
 vec2 g=mix(gb,ga,w0)*(1.6+drop*2.5);
 // ribbon frame: across = dFdx-free approximation from world derivatives
 vec3 dx=dFdx(wPos),dy=dFdy(wPos);vec3 Ng=normalize(cross(dx,dy));if(Ng.y<0.)Ng=-Ng;
 vec3 along=normalize(vec3(-Ng.x,0.,-Ng.z)+vec3(1e-4));
 vec3 N=normalize(vec3(0.,1.,0.)+vec3(g.x,0.,g.y)*.9);N=normalize(mix(N,Ng,.3));
 vec3 V=normalize(eye-wPos);float f=fres(abs(dot(N,V)));
 vec2 scr=gl_FragCoord.xy/resolution;
 float zs=-vPos.z,zb=linDepth(texture(sceneDepth,scr).r,nearFar),depthBelow=max(0.,zb-zs);
 if(ready>.5&&zb<zs-.012)discard;
 vec3 nv=normalize(mat3(viewMatrix)*N);vec2 q=clamp(scr+nv.xy*.018*clamp(depthBelow*6.,0.,1.),.5/resolution,1.-.5/resolution);
 if(linDepth(texture(sceneDepth,q).r,nearFar)<zs)q=scr;
 vec3 behind=texture(sceneColor,q).rgb;
 float path=depthBelow*1.8;
 vec3 trans=exp(-vec3(.55,.22,.26)*path*2.2);
 vec3 col=behind*trans*vec3(1.04,1.03,.96)+vec3(.030,.052,.040)*(1.-trans);
 // caustic shimmer on the bed
 float c=pow(vn((wPos.xz+g*.5)*9.+vec2(time*.4,-time*.7)),3.)*1.4*exp(-path*2.);col+=behind*c*.35;
 vec3 R=reflect(-V,N);vec3 sky=vec3(.045,.040,.032)+vec3(.95,.70,.42)*pow(max(0.,dot(R,normalize(vec3(.15,.55,.82)))),60.)*.8+vec3(.55,.42,.28)*pow(max(0.,dot(R,normalize(vec3(-.4,.6,-.7)))),40.);
 col=mix(col,sky,clamp(f*1.1,0.,.42));col+=vec3(1.,.85,.62)*pow(max(0.,dot(R,normalize(vec3(.1,.7,.7)))),220.)*.45;
 // Foam: lip drop, stone wakes, bank lines; all advected by the same flow.
 vec2 fa=vec2(u*.9,s*.55)-vec2(0.,t0*sp*.9),fb=vec2(u*.9,s*.55)-vec2(0.,t1*sp*.9)+vec2(.5,.3);
 float fm=mix(texture(foamTex,fb).r,texture(foamTex,fa).r,w0);
 float wake=0.;for(int i=0;i<24;i++){vec4 k=stones[i];if(k.w<=0.)continue;vec2 d=wPos.xz-k.xy;float down=dot(d,k.zw)/max(1e-3,length(k.zw));float side=length(d-k.zw*down/max(1e-6,dot(k.zw,k.zw)));
  float r=k.w;float bow=smoothstep(r*1.45,r*.95,length(d))*(down<0.?.85:.35);float tongue=down>0.?smoothstep(r*1.3,0.,side*(1.-.25*sin(down*40.-time*9.)))*exp(-down/(r*5.))*.75:0.;wake=max(wake,bow+tongue);}
 float lines=smoothstep(.10,.0,u)+smoothstep(.90,1.,u);float clump=fbm(vec2(u*6.,s*3.)-vec2(0.,time*sp*1.6));
 float foam=clamp(drop*1.4+wake*1.1+lines*.30,0.,1.)*smoothstep(.30,.75,fm*.6+clump*.6+drop*.3);
 foam+=smoothstep(.72,.95,fm)*.05*bank;
 col=mix(col,vec3(.86,.88,.84)*(.75+.25*clump),clamp(foam,0.,.92));
 float edge=smoothstep(0.,.05,u)*smoothstep(0.,.05,1.-u);
 col=mix(vec3(.04,.06,.055),col,ready);
 o=vec4(col,edge*(.86+.14*foam));
}`;
const wetV=`precision highp float;in vec3 position;in vec2 uv;uniform mat4 modelMatrix,viewMatrix,projectionMatrix;out vec2 vUv;out vec3 wPos;
void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);wPos=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const wetF=`precision highp float;in vec2 vUv;in vec3 wPos;out vec4 o;uniform float time;
${NOISE}
void main(){float u=abs(vUv.x*2.-1.);float n=fbm(wPos.xz*7.)*.5+fbm(wPos.xz*23.)*.2;
 float wet=1.-smoothstep(.45+n*.40,.92+n*.1,u);float splash=step(.985,vn(wPos.xz*40.+floor(time*2.)))*smoothstep(1.,.7,u);
 float dark=clamp(wet*.62+splash*.3,0.,.75);o=vec4(vec3(1.-dark),1.);}`; // multiply blend
const steamV=`precision highp float;in vec3 position;in vec4 seed;uniform mat4 modelViewMatrix,projectionMatrix,viewMatrix,modelMatrix;uniform float time;
out vec2 vQ;out vec3 vPos;out float vA,vSeed;
void main(){float life=fract(time*seed.w*.09+seed.x);vec3 c=position;c.y+=life*.85;
 c.x+=sin(time*.6+seed.y*6.28+life*4.)*.12*life;c.z+=cos(time*.5+seed.z*6.28+life*3.)*.12*life;
 vec4 v=viewMatrix*vec4(c,1.);vec2 corner=vec2(gl_VertexID%2==0?-1.:1.,gl_VertexID/2%2==0?-1.:1.);
 float size=(.10+.32*life)*(.7+seed.y*.6);float ang=seed.z*6.28+time*.15*(seed.x-.5)+life*1.2;mat2 R=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
 v.xy+=R*corner*size;vQ=corner;vPos=v.xyz;vA=smoothstep(0.,.18,life)*(1.-smoothstep(.45,1.,life));vSeed=seed.y*17.+seed.z*5.;gl_Position=projectionMatrix*v;}`;
const steamF=`precision highp float;precision highp sampler2D;uniform sampler2D sceneDepth;uniform vec2 resolution,nearFar;uniform float time,ready,gain;
in vec2 vQ;in vec3 vPos;in float vA,vSeed;out vec4 o;
${NOISE}
void main(){float r=length(vQ);if(r>1.)discard;
 vec2 p=vQ*1.3+vSeed;float n=fbm(p*1.6+vec2(0.,-time*.25));float sw=fbm(vec2(atan(vQ.y,vQ.x)*1.2+n*2.,r*3.-time*.3)+vSeed);
 float strand=pow(1.-abs(2.*fbm(p*2.6+n*1.8)-1.),4.);
 float d=(1.-smoothstep(.0,1.,r))*(1.-smoothstep(.0,1.,r))*(smoothstep(.35,.8,n)*.5+strand*.9+sw*.15);
 float soft=1.;if(ready>.5){float zb=linDepth(texture(sceneDepth,gl_FragCoord.xy/resolution).r,nearFar);soft=clamp((zb+vPos.z)/.25,0.,1.);}
 float a=clamp(d*vA*gain*soft,0.,1.)*smoothstep(.0,.35,-vPos.z);if(a<.002)discard;o=vec4(vec3(.62,.64,.60)*a,a);}`; // premultiplied

export function createCreek121(T_,{channel,bedAt,scene,stoneTextures={}}){
 if(!tex['creek-bed'])throw new Error('preloadCreek121() must finish first');
 const group=new T.Group();group.name='V121 creek water + steam (layer 3)';const solid=new T.Group();solid.name='V121 creek bed, cobbles and wet banks';scene.add(solid);
 const spine=channel.spine,N=spine.length,rows=N-1,cols=20,s=[0];for(let i=1;i<N;i++)s.push(s[i-1]+Math.hypot(spine[i].x-spine[i-1].x,spine[i].y-spine[i-1].y,spine[i].z-spine[i-1].z));
 const frame=i=>{const a=spine[Math.max(0,i-1)],b=spine[Math.min(N-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;return{tx,tz,sx:-tz,sz:tx};};
 const sec=i=>channel.section(spine[i].x,spine[i].z);
 const geoms=[],mats=[];
 // Water ribbon.
 const pos=[],uv=[],info=[],idx=[];
 for(let j=0;j<N;j++){const p=spine[j],f=frame(j),w=sec(j).width*.97,drop=Math.max(0,(p.t-.80)/.20)**1.5,speed=.35+drop*.9;
  for(let i=0;i<=cols;i++){const u=i/cols,a=(u-.5)*w*(.95+.05*Math.sin(j*.7+i));pos.push(p.x+f.sx*a,p.y+.004,p.z+f.sz*a);uv.push(u,p.t);info.push(s[j],speed,drop);}}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(pos,3));wg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));wg.setAttribute('flowInfo',new T.Float32BufferAttribute(info,3));wg.setIndex(idx);geoms.push(wg);
 const fallback=new T.DataTexture(new Uint8Array([128,128,128,255]),1,1);fallback.needsUpdate=true;
 const u={time:{value:0},ready:{value:0},sceneColor:{value:fallback},sceneDepth:{value:fallback},foamTex:{value:tex['creek-foam']},bedTex:{value:tex['creek-bed']},resolution:{value:new T.Vector2(1,1)},nearFar:{value:new T.Vector2(.06,40)},eye:{value:new T.Vector3()},stones:{value:Array.from({length:24},()=>new T.Vector4())},gain:{value:.10}};
 const waterMat=new T.RawShaderMaterial({name:'V121 flow-mapped creek water',glslVersion:T.GLSL3,vertexShader:waterV,fragmentShader:waterF,uniforms:u,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});mats.push(waterMat);
 const water=new T.Mesh(wg,waterMat);water.name='V121 flowing creek surface';water.renderOrder=3;water.frustumCulled=false;group.add(water);
 // Pebble bed ribbon conforming to the carved channel (just above the shell bed).
 const bp=[],bu=[],bi=[],bc=14;
 for(let j=0;j<N;j++){const p=spine[j],f=frame(j),w=sec(j).width*1.02;for(let i=0;i<=bc;i++){const a=(i/bc-.5)*w,x=p.x+f.sx*a,z=p.z+f.sz*a;const y=bedAt(x,z);bp.push(x,y+.004,z);bu.push(a*1.4,s[j]*1.4);}}
 for(let j=0;j<rows;j++)for(let i=0;i<bc;i++){const a=j*(bc+1)+i,b=a+bc+1;bi.push(a,b,a+1,a+1,b,b+1);}
 const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setAttribute('uv',new T.Float32BufferAttribute(bu,2));bg.setIndex(bi);bg.computeVertexNormals();geoms.push(bg);
 const bedMat=new T.MeshStandardMaterial({name:'V121 natural pebble creek bed',map:tex['creek-bed'],normalMap:tex['creek-bed-normal'],normalScale:new T.Vector2(1.2,1.2),roughness:.25,color:0xb8b2a0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});mats.push(bedMat);
 const bed=new T.Mesh(bg,bedMat);bed.name='V121 pebble channel bed';bed.receiveShadow=true;solid.add(bed);
 // Wet darkened banks (multiply), 22 cm each side of the water edge.
 const kp=[],ku=[],ki=[],kc=10;
 for(let j=0;j<N;j++){const p=spine[j],f=frame(j),w=sec(j).width*.5;for(let i=0;i<=kc;i++){const v=i/kc,a=(v-.5)*2*(w+.34),x=p.x+f.sx*a,z=p.z+f.sz*a;kp.push(x,Math.max(bedAt(x,z),p.y-.01)+.006,z);ku.push(v,p.t);}}
 for(let j=0;j<rows;j++)for(let i=0;i<kc;i++){const a=j*(kc+1)+i,b=a+kc+1;ki.push(a,b,a+1,a+1,b,b+1);}
 const kg=new T.BufferGeometry();kg.setAttribute('position',new T.Float32BufferAttribute(kp,3));kg.setAttribute('uv',new T.Float32BufferAttribute(ku,2));kg.setIndex(ki);geoms.push(kg);
 const wetMat=new T.RawShaderMaterial({name:'V121 wet bank darkening',glslVersion:T.GLSL3,vertexShader:wetV,fragmentShader:wetF,uniforms:{time:u.time},transparent:true,depthWrite:false,blending:T.MultiplyBlending,premultipliedAlpha:true,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,toneMapped:false});mats.push(wetMat);
 const wet=new T.Mesh(kg,wetMat);wet.name='V121 wet stone banks';wet.renderOrder=1;solid.add(wet);
 // Natural stones (InstancedMesh, 6 shape variants): a dense submerged pebble
 // bed, cobbles breaking the surface (they drive the foam wakes), and bank
 // cobbles/boulders in irregular clusters that break the straight carved shore.
 let seed=2701;const rnd=()=>{seed=(seed*1103515245+12345)>>>0;return seed/4294967296;};
 const variants=[];for(let v=0;v<6;v++){const g=new T.IcosahedronGeometry(1,2),gp=g.attributes.position,ph=rnd()*10,fl=.15+rnd()*.25;
  for(let i=0;i<gp.count;i++){const vx=gp.getX(i),vy=gp.getY(i),vz=gp.getZ(i),d=1+.13*Math.sin(vx*2.6+ph)*Math.cos(vz*2.2+ph*1.3)+.06*Math.sin(vy*5.+ph*2);gp.setXYZ(i,vx*d,(vy<0?vy*(1-fl):vy)*d,vz*d);}
  g.computeVertexNormals();const uvA=g.attributes.uv;for(let i=0;i<uvA.count;i++)uvA.setXY(i,uvA.getX(i)*.6,uvA.getY(i)*.6);variants.push(g);geoms.push(g);}
 const wetStone=new T.MeshStandardMaterial({name:'V121 wet water-rounded stones',normalMap:tex['creek-bed-normal'],normalScale:new T.Vector2(.25,.25),roughness:.2,color:0xffffff});mats.push(wetStone);
 const dryStone=new T.MeshStandardMaterial({name:'V121 bank stones',normalMap:tex['creek-bed-normal'],normalScale:new T.Vector2(.45,.45),roughness:.7,color:0xffffff});mats.push(dryStone);
 // darken the lower (wet) part of bank stones near the waterline
 dryStone.onBeforeCompile=sh=>{sh.uniforms.wl={value:0};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float wY;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nwY=(modelMatrix*instanceMatrix*vec4(transformed,1.)).y;\n#else\nwY=(modelMatrix*vec4(transformed,1.)).y;\n#endif');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float wY;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat wetK=1.-smoothstep(1.86,1.93,wY);roughnessFactor=mix(roughnessFactor,.22,wetK);diffuseColor.rgb*=1.-.35*wetK;');};
 dryStone.customProgramCacheKey=()=>'v121-bank-stone';
 const palette=[0xb9b4aa,0xcfc8b8,0x9a968e,0xc2b8a2,0xa8a297,0xdcd6c8,0xb3a48e,0x8c8880,0xc9b9a0,0x7d7a74];
 const lists=[[],[]];const stones=[];let k=0;const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),SC=new T.Vector3(),P=new T.Vector3(),C=new T.Color();
 const put=(dry,x,z,rx,ry,rz,sink)=>{const y=bedAt(x,z)+ry*(1-sink);E.set((rnd()-.5)*.5,rnd()*6.28,(rnd()-.5)*.5);Q.setFromEuler(E);P.set(x,y,z);SC.set(rx,ry,rz);M.compose(P,Q,SC);C.setHex(palette[Math.floor(rnd()*palette.length)]).multiplyScalar(.85+rnd()*.3);lists[dry?1:0].push({m:M.clone(),c:C.clone(),v:Math.floor(rnd()*6)});return y;};
 const at=(t,across)=>{const j=Math.min(N-1,Math.max(0,Math.round(t*(N-1)))),p=spine[j],f=frame(j),w=sec(j).width;return{p,f,w,x:p.x+f.sx*across*w,z:p.z+f.sz*across*w,j};};
 // 1) submerged pebble bed (2-5 cm), packed
 for(let n=0;n<420;n++){const t=.02+rnd()*.96,q=at(t,(rnd()-.5)*.9),r=.022+rnd()*rnd()*.05;put(false,q.x,q.z,r*(1.1+rnd()*.5),r*(.45+rnd()*.25),r*(.9+rnd()*.5),.35);}
 // 2) cobbles that break the surface (8-15 cm) -> foam wakes
 for(let n=0;n<22;n++){const t=.06+rnd()*.86,q=at(t,(rnd()-.5)*.75),r=.07+rnd()*.07;const y=put(false,q.x,q.z,r*(1.15+rnd()*.4),r*(.75+rnd()*.25),r*(1+rnd()*.3),.25);
  if(k<24&&y+r*.6>q.p.y-.01)u.stones.value[k++].set(q.x,q.z,q.f.tx,q.f.tz).w=r*1.15;}
 // 3) bank: clusters of cobbles and a few boulders straddling the waterline on both sides
 for(let c=0;c<34;c++){const t=.03+rnd()*.94,side=rnd()<.5?-1:1,big=rnd()<.28,cnt=big?2+Math.floor(rnd()*3):4+Math.floor(rnd()*6);
  for(let n=0;n<cnt;n++){const off=side*(.47+rnd()*(big?.30:.22))+(rnd()-.5)*.06,q=at(t+(rnd()-.5)*.025,off),r=(n===0&&big)?.13+rnd()*.12:.035+rnd()*.075;put(Math.abs(off)>.52,q.x,q.z,r*(1.1+rnd()*.5),r*(.55+rnd()*.3),r*(.95+rnd()*.45),.3);}}
 for(const [dry,list] of [[0,lists[0]],[1,lists[1]]])for(let v=0;v<6;v++){const sub=list.filter(e=>e.v===v);if(!sub.length)continue;const im=new T.InstancedMesh(variants[v],dry?dryStone:wetStone,sub.length);sub.forEach((e,i)=>{im.setMatrixAt(i,e.m);im.setColorAt(i,e.c);});im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;im.userData.keepIndexed=true;im.castShadow=im.receiveShadow=true;im.name=dry?'V121 bank cobbles and boulders':'V121 creek pebbles and cobbles';im.computeBoundingSphere();solid.add(im);stones.push(im);}
 // Soft steam: 90 camera-facing soft particles hugging the warm channel, rising and dissipating.
 const S=90,sp=new Float32Array(S*4*3),sd=new Float32Array(S*4*4),si=[];
 for(let i=0;i<S;i++){const t=.45+rnd()*.55,j=Math.min(N-1,Math.round(t*(N-1))),p=spine[j],f=frame(j),a=(rnd()-.5)*sec(j).width*.8,sx=rnd(),sy=rnd(),sz=rnd(),sw=.6+rnd()*.8;
  for(let c=0;c<4;c++){sp.set([p.x+f.sx*a,p.y+.03,p.z+f.sz*a],(i*4+c)*3);sd.set([sx,sy,sz,sw],(i*4+c)*4);}const b=i*4;si.push(b,b+1,b+2,b+2,b+1,b+3);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));sg.setAttribute('seed',new T.BufferAttribute(sd,4));sg.setIndex(si);geoms.push(sg);
 const steamMat=new T.RawShaderMaterial({name:'V121 soft creek steam',glslVersion:T.GLSL3,vertexShader:steamV,fragmentShader:steamF,uniforms:u,transparent:true,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,toneMapped:false});mats.push(steamMat);
 const steam=new T.Mesh(sg,steamMat);steam.name='V121 creek steam wisps';steam.frustumCulled=false;steam.renderOrder=8;group.add(steam);
 let disposed=false;
 return{group,solid,water,material:waterMat,stones,
  update(t){u.time.value=t;},prepare(){},
  bind(color,depth,w,h,camera){u.sceneColor.value=color;u.sceneDepth.value=depth;u.resolution.value.set(Math.max(1,w),Math.max(1,h));u.nearFar.value.set(camera.near,camera.far);u.eye.value.copy(camera.position);u.ready.value=color&&depth?1:0;},
  dispose(){if(disposed)return;disposed=true;geoms.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());fallback.dispose();group.removeFromParent();solid.removeFromParent();}};
}
