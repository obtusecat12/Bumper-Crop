import * as T from './vendor/three.module.min.js';
import {mergeVertices} from './vendor/BufferGeometryUtils.js';
import {GARDEN81} from './tiki-garden-plan-v86.js';
// V118e-L11: the Indoor Tide Garden fountain, rebuilt after files/l11-fountain-ref.webp.
// An aerated bubbler jet (nested churning foam shells + ballistic droplets + base mist) rises from a
// turquoise-lit basin: translucent refracting water with ripples and surface foam, animated caustics on
// the poured-concrete bed, a rounded hand-poured concrete lip, a loose ring of natural boulders sunk in the
// gravel, and a procedural splash sound. Textures: textures/tiki-garden-v118e (generated large, low-fi).
const F=GARDEN81.fountain,CX=F.x,CZ=F.z,R=F.r,WATER=.115,LIP=.195,BED=-.30,TAU=Math.PI*2;
const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const cache=new Map(),ROOT=new URL('./textures/tiki-garden-v118e/',import.meta.url);
export async function preloadFountain118e(report=()=>{}){const loader=new T.TextureLoader(),names=['jetfoam','surfoam','caustics','concrete'];let done=0;
 await Promise.all(names.map(async n=>{if(!cache.has(n)){const t=await loader.loadAsync(new URL(n+'.webp',ROOT).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=n==='concrete'?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;cache.set(n,t);}report(++done/names.length);}));}
const tex=n=>{const t=cache.get(n);if(!t)throw Error('V118e fountain texture missing '+n);return t;};
const NOISE=`float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+1.),f.x),f.y),f.z);}`;
const CENTER=`const vec2 C=vec2(${CX.toFixed(3)},${CZ.toFixed(3)});`;

// ---------------------------------------------------------------- opaque: rim, basin, boulders
function lathe(profile,segments,seed){// profile [[r,y,v]...] -> ring around the fountain centre, radius jittered like hand-poured work
 const pos=[],uv=[],ix=[],n=profile.length;
 for(let i=0;i<=segments;i++){const a=i/segments*TAU,j=1+.006*Math.sin(a*3+seed)+.004*Math.sin(a*7-seed*2);
  for(const[r,y,v]of profile){const rr=r*j;pos.push(CX+Math.cos(a)*rr,y,CZ+Math.sin(a)*rr);uv.push(a*R*.9,v);}}
 for(let i=0;i<segments;i++)for(let k=0;k<n-1;k++){const a=i*n+k,b=a+n;ix.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function rimGeometry(){const p=[],ri=R-.01,ro=R+.17;
 // inner wall (from the bed up), rounded bull-nose lip, outer face down into the gravel
 p.push([ri+.015,BED-.02,0],[ri+.01,BED+.12,.12],[ri,WATER-.05,.30],[ri,LIP-.045,.46]);
 for(let k=0;k<=6;k++){const a=Math.PI-k/6*Math.PI,cx=(ri+ro)/2,rw=(ro-ri)/2;p.push([cx+Math.cos(a)*rw,LIP-.045+Math.sin(a)*.045*(1+.0*k),.46+k*.05]);}
 p.push([ro+.006,LIP-.10,.82],[ro+.018,-.035,.95]);
 // reverse winding so faces point outward / up
 return lathe(p.reverse(),160,1.7);
}
function bedGeometry(){const g=new T.CircleGeometry(R+.01,64,0,TAU);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z)/R;p.setY(i,BED-.025*(1-d*d));uv.setXY(i,x*.9,z*.9);}
 g.translate(CX,0,CZ);g.computeVertexNormals();return g;
}
function fbm(x,y,z,s){let a=0,f=1,w=.5;for(let o=0;o<4;o++){a+=w*Math.sin(x*f*2.1+s+Math.sin(z*f*1.7+s*.7))*Math.cos(y*f*2.6-s*.3+Math.sin(x*f*1.3));f*=2.03;w*=.5;}return a;}
export function boulderGeometry(w,h,d,seed){let g=new T.IcosahedronGeometry(1,3);g.deleteAttribute('normal');g.deleteAttribute('uv');g=mergeVertices(g);const p=g.attributes.position;
 const tilt=[rand(seed)*.5-.25,rand(seed+1)*.5-.25],flat=-.35-rand(seed+2)*.25;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  let f=1+.22*fbm(x,y,z,seed)+.05*fbm(x*3,y*3,z*3,seed+9);
  // a couple of fracture planes give the faceted, split look of field boulders
  const c1=.78+.1*rand(seed+3),k1=x*.6+z*.5+y*.62;if(k1>c1)f*=1-(k1-c1)*.55;
  const c2=.74+.1*rand(seed+4),k2=-x*.55+z*.3+y*.4;if(k2>c2)f*=1-(k2-c2)*.5;
  x*=f;y*=f;z*=f;y+=x*tilt[0]+z*tilt[1];if(y<flat)y=flat+(y-flat)*.18;
  p.setXYZ(i,x*w*.5,y*h*.5,z*d*.5);}
 g.computeVertexNormals();const n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i)),x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const s=1.15;if(ay>ax&&ay>az){uv[i*2]=x*s+seed*.37;uv[i*2+1]=z*s;}else if(ax>az){uv[i*2]=z*s+seed*.21;uv[i*2+1]=y*s;}else{uv[i*2]=x*s+seed*.13;uv[i*2+1]=y*s;}}
 g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
}
// Natural ring: irregular sizes, gaps, pairs, some sunk deep. Angle 0 = +X (the wall side of the room).
export const FOUNTAIN_ROCKS118E=[[.10,1.02,.62,.80],[.62,.66,.42,.58],[.98,.92,.58,.74],[1.45,.58,.36,.52],[1.80,1.10,.66,.82],[2.22,.74,.47,.63],[2.56,.52,.33,.46],[2.95,.96,.55,.72],[3.40,.70,.50,.60],[3.86,1.06,.64,.78],[4.30,.62,.40,.55],[4.72,.88,.56,.70],[5.14,.56,.34,.50],[5.52,.98,.60,.76],[5.95,.70,.44,.60]];
function rocks(group,m){const list=[];
 FOUNTAIN_ROCKS118E.forEach(([a,w,h,d],i)=>{a+=(rand(i+40)-.5)*.12;const out=R+.17+d*.36+rand(i+70)*.05,x=CX+Math.cos(a)*out,z=CZ+Math.sin(a)*out,sink=.28+rand(i+90)*.16;
  const g=boulderGeometry(w,h,d,i*7+3),mesh=new T.Mesh(g,m.boulder);mesh.position.set(x,h*.5-h*sink,z);mesh.rotation.set(0,-a+Math.PI/2+(rand(i+5)-.5)*.6,0);mesh.castShadow=mesh.receiveShadow=true;mesh.name='V118e fountain boulder '+i;group.add(mesh);list.push(mesh);
  // a small companion stone in some gaps
  if(i%3===1){const b=a+.21,o=R+.2+.18,s=.22+rand(i+11)*.14,g2=boulderGeometry(s*1.3,s*.8,s,i*13+5),m2=new T.Mesh(g2,m.boulder);m2.position.set(CX+Math.cos(b)*o,s*.18,CZ+Math.sin(b)*o);m2.rotation.y=rand(i)*TAU;m2.castShadow=m2.receiveShadow=true;group.add(m2);list.push(m2);}
 });
 return list;
}
function concreteMaterials(time){const c=tex('concrete');
 const rim=new T.MeshStandardMaterial({name:'V118e poured concrete lip',map:c,color:0xc4c4bf,roughness:.78,metalness:0,side:T.DoubleSide});
 rim.onBeforeCompile=s=>{s.uniforms.fTime=time;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nfWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fWorld;uniform float fTime;\n'+CENTER).replace('#include <map_fragment>',`#include <map_fragment>
 float fr=length(fWorld.xz-C);float wet=smoothstep(${(R+.05).toFixed(3)},${(R-.02).toFixed(3)},fr)*(1.-smoothstep(${(LIP-.01).toFixed(3)},${(LIP+.01).toFixed(3)},fWorld.y));
 wet=max(wet,1.-smoothstep(${(WATER+.005).toFixed(3)},${(WATER+.06).toFixed(3)},fWorld.y));diffuseColor.rgb*=mix(1.,.55,wet);`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float inner=smoothstep(${(R+.06).toFixed(3)},${(R-.01).toFixed(3)},fr);float lap=.5+.5*sin(fTime*2.3+atan(fWorld.z-C.y,fWorld.x-C.x)*9.);
 totalEmissiveRadiance+=vec3(.02,.42,.55)*inner*(.55+.45*lap)*smoothstep(${(LIP+.02).toFixed(3)},${(WATER-.02).toFixed(3)},fWorld.y)*.6;`);};
 rim.customProgramCacheKey=()=> 'v118e-rim';
 const bed=new T.MeshStandardMaterial({name:'V118e basin bed / animated caustics',map:c,color:0x7d9b9c,roughness:.55,metalness:0});
 bed.onBeforeCompile=s=>{s.uniforms.fTime=time;s.uniforms.caus={value:tex('caustics')};s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nfWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fWorld;uniform float fTime;uniform sampler2D caus;\n'+CENTER).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 vec2 q=fWorld.xz*.62;float ca=texture2D(caus,q+vec2(fTime*.031,fTime*.017)+.02*sin(q.yx*7.+fTime)).r,cb=texture2D(caus,q*1.37-vec2(fTime*.023,-fTime*.029)).r;float c=min(ca,cb)*1.6+ca*cb*.8;
 float fr=length(fWorld.xz-C);float glow=exp(-fr*fr*.55);
 totalEmissiveRadiance+=vec3(.05,.85,1.05)*c*(.35+1.1*glow)+vec3(.0,.10,.16)*glow;`);};
 bed.customProgramCacheKey=()=> 'v118e-bed';
 return{rim,bed};
}

// ---------------------------------------------------------------- optical layer: water surface
const surfVS=`precision highp float;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;uniform float time;in vec3 position;out vec3 worldPos,viewPos;
${CENTER}
void main(){vec3 p=position;float d=length(p.xz-C);p.y+=.010*sin(d*26.-time*7.5)*exp(-d*1.3)+.004*sin(p.x*9.+time*1.7)*cos(p.z*8.-time*1.3)+.02*exp(-d*d*9.)*sin(time*11.+d*30.);
 vec4 w=modelMatrix*vec4(p,1.);worldPos=w.xyz;vec4 v=modelViewMatrix*vec4(p,1.);viewPos=v.xyz;gl_Position=projectionMatrix*v;}`;
const surfFS=`precision highp float;precision highp sampler2D;uniform sampler2D sceneColor,sceneDepth,foamMap;uniform mat4 inverseProjection,viewMatrix;uniform vec2 resolution;uniform float time,glow;in vec3 worldPos,viewPos;out vec4 fragColor;
${CENTER}${NOISE}
vec3 reconstruct(vec2 q,float d){vec4 p=inverseProjection*vec4(q*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float hgt(vec2 x){float d=length(x-C);return .012*sin(d*26.-time*7.5)*exp(-d*1.1)+.006*sin(d*61.-time*13.)*exp(-d*2.)+.004*(vn(vec3(x*9.,time*1.1))-.5)+.003*(vn(vec3(x*23.,time*2.3))-.5)+.003*sin(dot(x,vec2(7.,4.))+time*1.9);}
void main(){vec2 x=worldPos.xz;float e=.012;vec3 nW=normalize(vec3(-(hgt(x+vec2(e,0))-hgt(x-vec2(e,0)))/(2.*e),1.,-(hgt(x+vec2(0,e))-hgt(x-vec2(0,e)))/(2.*e)));
 vec3 n=normalize(mat3(viewMatrix)*nW),v=normalize(-viewPos);vec2 screen=gl_FragCoord.xy/resolution;
 vec2 q=clamp(screen+nW.xz*.06/max(.8,-viewPos.z),.002,.998);vec3 behind=reconstruct(q,texture(sceneDepth,q).r);if(behind.z>viewPos.z+.02){q=screen;behind=reconstruct(q,texture(sceneDepth,q).r);}
 float thick=clamp(length(behind-viewPos),.0,3.);vec3 absorb=exp(-vec3(2.6,.42,.30)*thick);float d=length(x-C);float g=exp(-d*d*.45)*glow;
 vec3 refr=texture(sceneColor,q).rgb*absorb+vec3(.010,.42,.62)*(1.-absorb.g)*(.35+1.2*g);
 // reflection: dim ceiling + the fluorescent panels as soft streaks
 vec3 rv=reflect(-v,n);vec3 rw=normalize((vec4(rv,0.)*viewMatrix).xyz);float panel=pow(max(rw.y,0.),3.)*(.5+.5*smoothstep(.55,.95,vn(vec3(rw.xz/(rw.y+.2)*2.4,1.))));
 vec3 refl=vec3(.16,.19,.19)*panel+vec3(.02,.04,.045);float fres=.03+.97*pow(1.-max(dot(n,v),0.),5.);
 vec3 c=mix(refr,refl,fres*.85);
 // sparkle off the churned surface
 c+=vec3(.7,1.,1.)*pow(max(dot(rw,normalize(vec3(.2,1.,.3))),0.),220.)*1.6;
 // aerated foam: rafts drifting outward from the jet, thinning with distance
 float ang=atan(x.y-C.y,x.x-C.x);vec2 fu=vec2(ang*1.1,d*1.4-time*.22);float f1=texture(foamMap,fu+.04*nW.xz*8.).r,f2=texture(foamMap,(x-C)*.9+vec2(time*.03,-time*.02)).r;
 float cover=smoothstep(.40,.85,f1*.6+f2*.5+exp(-d*d*6.)*.9-d*.32)*(1.-smoothstep(.85,1.55,d))+smoothstep(.5,.9,f2)*smoothstep(${(R-.25).toFixed(2)},${(R-.04).toFixed(2)},d)*.35;
 c=mix(c,vec3(.55,1.25,1.45)*(.6+1.2*g),clamp(cover,0.,.92));
 fragColor=vec4(c,1.);}`;
// ---------------------------------------------------------------- the bubbler jet
const jetVS=`precision highp float;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;uniform float time;in vec3 position;in vec2 uv;out vec3 viewPos,worldPos;out vec2 vUv;out float shell;
${CENTER}${NOISE}
void main(){float a=position.x,v=uv.y,k=position.z;shell=k;float s=k/4.;
 float r0=.07+.17*s,top=.80+.20*(1.-s)+.05*sin(time*2.1+k),rf=.30+.42*s;
 // rise -> crown -> fall (quadratic bezier in radius/height), every shell churns on its own clock
 float tt=v;vec2 P0=vec2(r0,${WATER.toFixed(3)}),P1=vec2(r0*.55+rf*.25,top*1.45),P2=vec2(rf,${WATER.toFixed(3)});vec2 P=(1.-tt)*(1.-tt)*P0+2.*(1.-tt)*tt*P1+tt*tt*P2;
 float churn=vn(vec3(cos(a)*2.3+k*3.1,v*5.-time*2.4,sin(a)*2.3+time*.7));float puff=vn(vec3(cos(a)*5.,v*9.-time*4.1,sin(a)*5.));
 float rad=P.x*(1.+.38*(churn-.5)+.18*(puff-.5))+.03*sin(a*5.+time*3.+k);float y=P.y*(1.+.12*(churn-.5))+.03*sin(a*3.-time*5.)*sin(v*3.1416);
 vec3 p=vec3(C.x+cos(a)*rad,y,C.y+sin(a)*rad);vUv=vec2(a/6.2832,v);vec4 w=modelMatrix*vec4(p,1.);worldPos=w.xyz;vec4 vp=modelViewMatrix*vec4(p,1.);viewPos=vp.xyz;gl_Position=projectionMatrix*vp;}`;
const jetFS=`precision highp float;precision highp sampler2D;uniform sampler2D foamMap;uniform float time,glow;in vec3 viewPos,worldPos;in vec2 vUv;in float shell;out vec4 fragColor;
${NOISE}
void main(){vec3 n=normalize(cross(dFdx(viewPos),dFdy(viewPos)));float facing=abs(dot(n,normalize(-viewPos)));
 float rising=1.-smoothstep(.35,.6,vUv.y),speed=mix(.55,1.6,rising);
 vec2 fu=vec2(vUv.x*(3.+shell),vUv.y*1.6-time*speed*(vUv.y<.5?1.:-.6)+shell*.37);fu.x+=.08*sin(fu.y*6.+time*2.);
 float f=texture(foamMap,fu).r,f2=texture(foamMap,fu*vec2(1.7,.8)+vec2(.3,time*.4)).r;float foam=f*.65+f2*.45;
 float ends=smoothstep(.0,.06,vUv.y)*smoothstep(1.,.86,vUv.y);float edge=mix(1.,.55,facing);
 float a=smoothstep(.40+.10*shell/4.,.95,foam)*ends*(.30+.38*edge)*(shell<.5?1.1:.75);
 float y=clamp(worldPos.y-.1,0.,1.);
 vec3 lit=mix(vec3(.03,.62,.95),vec3(.62,1.15,1.3),smoothstep(.55,.98,foam))*glow*(1.15-y*.6);lit+=vec3(.3,.45,.5)*pow(foam,8.)*1.4;
 fragColor=vec4(lit,clamp(a,0.,1.));}`;
const dropVS=`precision highp float;uniform mat4 modelViewMatrix,projectionMatrix;uniform float time;uniform vec2 resolution;in vec3 position,velocity;in float phase,size;out float alpha;
${CENTER}
void main(){float life=1.15+phase*.5;float t=fract(time/life+phase)*life;vec3 p=vec3(C.x,${WATER.toFixed(3)},C.y)+position+velocity*t+vec3(0.,-4.9*t*t,0.);
 alpha=step(${(WATER-.02).toFixed(3)},p.y)*smoothstep(0.,.08,t);vec4 vp=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*vp;gl_PointSize=clamp(size*resolution.y/max(.25,-vp.z),1.,24.);}`;
const dropFS=`precision highp float;uniform float glow;in float alpha;out vec4 fragColor;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.||alpha<.01)discard;fragColor=vec4(vec3(.7,1.3,1.5)*glow,(1.-r)*alpha);}`;
const mistVS=`precision highp float;uniform mat4 modelViewMatrix,projectionMatrix;uniform float time;uniform vec2 resolution;in vec3 position;in float phase,size;out float alpha;out float rot;
${CENTER}
void main(){float t=fract(time*.35+phase);vec3 p=vec3(C.x,${(WATER+.04).toFixed(3)},C.y)+position*(1.+t*.8)+vec3(0.,t*.35,0.);alpha=sin(t*3.1416)*.5;rot=phase*6.28+time*.3;vec4 vp=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*vp;gl_PointSize=clamp(size*(1.+t)*resolution.y/max(.25,-vp.z),2.,260.);}`;
const mistFS=`precision highp float;uniform sampler2D foamMap;uniform float glow;in float alpha;in float rot;out vec4 fragColor;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;if(r>1.)discard;vec2 q=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*p;float f=texture(foamMap,q*.6+.5).r;fragColor=vec4(vec3(.45,1.2,1.5)*glow,(1.-r)*(1.-r)*alpha*(.35+.65*f)*.55);}`;

// ---------------------------------------------------------------- sound: procedural splashing bubbler
function fountainAudio(){let ctx=null,gain=null,panner=null,src=null;const pos=new T.Vector3(CX,.6,CZ),fwd=new T.Vector3(),up=new T.Vector3();
 function start(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{ctx=new AC();}catch(e){return;}
  const sr=ctx.sampleRate,len=Math.floor(sr*6),buf=ctx.createBuffer(2,len,sr);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b0=0,b1=0,b2=0,seed=ch*7919+13;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;};
   for(let i=0;i<len;i++){const w=rnd();b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.1848)*.11;}
   // droplet plops and splash bursts on top of the roar
   for(let k=0;k<520;k++){const at=Math.floor(Math.abs(rnd())*(len-4000)),f=500+Math.abs(rnd())*2600,amp=.05+Math.abs(rnd())*.12,dur=300+Math.floor(Math.abs(rnd())*1400);for(let i=0;i<dur;i++){const env=Math.exp(-i/(dur*.22));d[(at+i)%len]+=Math.sin(i/sr*TAU*f*(1+i/dur*.6))*env*amp;}}
   for(let i=0;i<2000;i++){const a=i/2000;d[i]=d[i]*a+d[len-2000+i]*(1-a);}}
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=140;
  panner=ctx.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=1.4;panner.rolloffFactor=1.25;panner.positionX.value=pos.x;panner.positionY.value=pos.y;panner.positionZ.value=pos.z;
  gain=ctx.createGain();gain.gain.value=0;src.connect(hp).connect(lp).connect(panner).connect(gain).connect(ctx.destination);src.start();}
 return{update(camera,playing){if(!ctx){if(playing)start();if(!ctx)return;}if(ctx.state==='suspended')ctx.resume().catch(()=>{});const l=ctx.listener;
   if(camera){camera.getWorldDirection(fwd);up.set(0,1,0).applyQuaternion(camera.quaternion);if(l.positionX){l.positionX.value=camera.position.x;l.positionY.value=camera.position.y;l.positionZ.value=camera.position.z;l.forwardX.value=fwd.x;l.forwardY.value=fwd.y;l.forwardZ.value=fwd.z;l.upX.value=up.x;l.upY.value=up.y;l.upZ.value=up.z;}else{l.setPosition(camera.position.x,camera.position.y,camera.position.z);l.setOrientation(fwd.x,fwd.y,fwd.z,up.x,up.y,up.z);}}
   gain.gain.setTargetAtTime(playing?.85:0,ctx.currentTime,.25);},
  dispose(){try{src?.stop();ctx?.close();}catch(e){}ctx=null;}};
}

export function createFountain118e(scene,m){const root=new T.Group();root.name='V118e fountain / lit bubbler, basin, lip, boulders';scene.add(root);
 const time={value:0},glow={value:1};const {rim,bed}=concreteMaterials(time);
 const rimMesh=new T.Mesh(rimGeometry(),rim);rimMesh.castShadow=rimMesh.receiveShadow=true;rimMesh.name='V118e concrete lip';root.add(rimMesh);
 const bedMesh=new T.Mesh(bedGeometry(),bed);bedMesh.receiveShadow=true;bedMesh.name='V118e caustic bed';root.add(bedMesh);
 const boulders=rocks(root,m);
 const pebbleList=[];for(let i=0;i<150;i++){const a=rand(i+300)*TAU,o=R+.21+rand(i+500)*.8,s=.035+rand(i+700)*.055;const g=boulderGeometry(s,s*.55,s*.8,i+900);g.rotateY(rand(i+13)*TAU);g.translate(CX+Math.cos(a)*o,s*.10,CZ+Math.sin(a)*o);pebbleList.push(g);}
 const pebbles=new T.Mesh(mergeGeometriesLite(pebbleList),m.boulder);pebbles.receiveShadow=true;pebbles.name='V118e washed-up gravel';root.add(pebbles);
 // optical meshes (layer 3, drawn after the opaque pass with its colour + depth)
 const u={sceneColor:{value:null},sceneDepth:{value:null},inverseProjection:{value:new T.Matrix4()},resolution:{value:new T.Vector2(1,1)},time,glow,foamMap:{value:tex('surfoam')}};
 const raw=(name,vs,fs,extra={},o={})=>new T.RawShaderMaterial({name,glslVersion:T.GLSL3,vertexShader:vs,fragmentShader:fs,uniforms:{...u,...extra},side:T.DoubleSide,toneMapped:false,...o});
 const surfGeom=radialDisc(R-.006,48,128);surfGeom.translate(CX,WATER,CZ);
 const surface=new T.Mesh(surfGeom,raw('V118e turquoise fountain water',surfVS,surfFS,{},{side:T.FrontSide}));surface.layers.set(3);surface.renderOrder=1;surface.frustumCulled=false;scene.add(surface);
 const jp=[],juv=[],ji=[];const NA=64,NV=36;for(let k=0;k<5;k++){const off=jp.length/3;for(let j=0;j<=NV;j++)for(let i=0;i<=NA;i++){jp.push(i/NA*TAU+k*.7,0,k);juv.push(i/NA,j/NV);}for(let j=0;j<NV;j++)for(let i=0;i<NA;i++){const a=off+j*(NA+1)+i,c=a+NA+1;ji.push(a,a+1,c,a+1,c+1,c);}}
 const jg=new T.BufferGeometry();jg.setAttribute('position',new T.Float32BufferAttribute(jp,3));jg.setAttribute('uv',new T.Float32BufferAttribute(juv,2));jg.setIndex(ji);jg.boundingSphere=new T.Sphere(new T.Vector3(CX,.6,CZ),1.4);
 const jet=new T.Mesh(jg,raw('V118e aerated bubbler shells',jetVS,jetFS,{foamMap:{value:tex('jetfoam')}},{transparent:true,depthWrite:false,blending:T.NormalBlending}));jet.layers.set(3);jet.renderOrder=3;scene.add(jet);
 const N=1100,dp=new Float32Array(N*3),dv=new Float32Array(N*3),ph=new Float32Array(N),sz=new Float32Array(N);
 for(let i=0;i<N;i++){const a=rand(i+1)*TAU,o=rand(i+2)*.16,up=2.6+rand(i+3)*1.7,out=.25+rand(i+4)*.85;dp.set([Math.cos(a)*o,0,Math.sin(a)*o],i*3);dv.set([Math.cos(a)*out,up,Math.sin(a)*out],i*3);ph[i]=rand(i+5);sz[i]=.010+rand(i+6)*.018;}
 const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dp,3));dg.setAttribute('velocity',new T.BufferAttribute(dv,3));dg.setAttribute('phase',new T.BufferAttribute(ph,1));dg.setAttribute('size',new T.BufferAttribute(sz,1));dg.boundingSphere=new T.Sphere(new T.Vector3(CX,.6,CZ),1.8);
 const drops=new T.Points(dg,raw('V118e ballistic droplets',dropVS,dropFS,{},{transparent:true,depthWrite:false}));drops.layers.set(3);drops.renderOrder=4;scene.add(drops);
 const M=46,mp=new Float32Array(M*3),mph=new Float32Array(M),ms=new Float32Array(M);for(let i=0;i<M;i++){const a=rand(i+50)*TAU,o=.15+rand(i+51)*.55;mp.set([Math.cos(a)*o,rand(i+52)*.12,Math.sin(a)*o],i*3);mph[i]=rand(i+53);ms[i]=.16+rand(i+54)*.22;}
 const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('phase',new T.BufferAttribute(mph,1));mg.setAttribute('size',new T.BufferAttribute(ms,1));mg.boundingSphere=new T.Sphere(new T.Vector3(CX,.4,CZ),1.5);
 const mist=new T.Points(mg,raw('V118e base mist',mistVS,mistFS,{},{transparent:true,depthWrite:false}));mist.layers.set(3);mist.renderOrder=5;scene.add(mist);
 const audio=fountainAudio();
 return{root,surface,jet,drops,mist,boulders,materials:[rim,bed,surface.material,jet.material,drops.material,mist.material],
  textures:['jetfoam','surfoam','caustics','concrete'].map(tex),
  bind(color,depth,w,h,camera){u.sceneColor.value=color;u.sceneDepth.value=depth;u.resolution.value.set(w,h);u.inverseProjection.value.copy(camera.projectionMatrixInverse);},
  update(t,camera=null,playing=true,lights=null){time.value=t;const flick=1+.05*Math.sin(t*9.1)+.035*Math.sin(t*23.7+1.3);glow.value=flick;if(lights){lights.cyan&&(lights.cyan.intensity=lights.cyanBase*flick);lights.spill&&(lights.spill.intensity=lights.spillBase*(1+.09*Math.sin(t*6.3)+.05*Math.sin(t*17.1)));}audio.update(camera,playing);},
  dispose(){audio.dispose();for(const o of[surface,jet,drops,mist]){o.geometry.dispose();o.removeFromParent();}root.traverse(o=>o.geometry?.dispose());[rim,bed,surface.material,jet.material,drops.material,mist.material].forEach(x=>x.dispose());root.removeFromParent();}};
}
function radialDisc(r,rings,segs){const pos=[],ix=[];pos.push(0,0,0);for(let j=1;j<=rings;j++){const rr=r*Math.pow(j/rings,1.35);for(let i=0;i<segs;i++){const a=i/segs*TAU;pos.push(Math.cos(a)*rr,0,Math.sin(a)*rr);}}
 for(let i=0;i<segs;i++)ix.push(0,1+(i+1)%segs,1+i);
 for(let j=1;j<rings;j++){const a0=1+(j-1)*segs,b0=1+j*segs;for(let i=0;i<segs;i++){const a=a0+i,b=a0+(i+1)%segs,c=b0+i,d=b0+(i+1)%segs;ix.push(a,b,c,b,d,c);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();return g;}
function mergeGeometriesLite(list){let n=0;for(const g of list)n+=(g.index?g.index.count:g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g0 of list){const g=g0.index?g0.toNonIndexed():g0;g.computeVertexNormals();pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;g.dispose();g0.dispose();}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(pos,3));out.setAttribute('normal',new T.BufferAttribute(nor,3));out.setAttribute('uv',new T.BufferAttribute(uv,2));return out;}
