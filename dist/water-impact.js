import * as T from './vendor/three.module.min.js';

// Three bounded draws. Attributes change only at spawn, clear, or a spatial/time
// rebase; all sheet, column, drop and mist motion is evaluated by the GPU.
const TAU = Math.PI * 2, CHUNK = 64, EVENTS = 10, MIST = 384;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
const asChunk = v => typeof v === 'bigint' ? v : BigInt(Math.trunc(finite(v)));

const commonVertex = `
uniform float uTime;
attribute vec3 iOrigin;
attribute float iBirth;
varying vec3 vWaterView;
varying vec3 vWaterWorld;
varying float vAlpha;
varying vec2 vWaterUv;
#include <common>
#include <fog_pars_vertex>
float sat(float x) { return clamp(x, 0.0, 1.0); }
float ease(float x) { x=sat(x); return x*x*(3.0-2.0*x); }
`;
const vertexFinish = `
  float proximity=distance((modelMatrix*vec4(transformed,1.)).xyz,cameraPosition);
  vAlpha*=clamp((proximity-.25)/.30,0.,1.);
  if(proximity<.25){transformed=vec3(0.0);vAlpha=0.;gl_Position=vec4(2.,2.,2.,1.);return;}
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vWaterView = -mvPosition.xyz;
  vWaterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
  if (vAlpha < 0.0001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
`;

const sheetVertex = commonVertex + `
attribute vec4 iShape; // base radius, expansion speed, launch speed, sheet lifetime
attribute vec4 iMotion; // horizontal direction, asymmetry, seed
attribute vec4 iJet; // delay, maximum height, duration, base width
attribute float aPart;
varying float vPart;
varying float vBreak;
varying float vSeed;
void main() {
  float t=uTime-iBirth;
  if(t<0.0 || t>max(iShape.w,iJet.x+iJet.z)){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
  if(distance((modelMatrix*vec4(iOrigin,1.)).xyz,cameraPosition)<.25){vec3 transformed=vec3(0.0);vAlpha=0.;gl_Position=vec4(2.,2.,2.,1.);return;}
  float theta=uv.x*6.28318530718;
  vec2 radial=vec2(cos(theta),sin(theta));
  float forward=max(0.0,dot(radial,iMotion.xy));
  float shape=1.0+0.065*sin(theta*3.0+iMotion.w)
    +0.033*cos(theta*7.0-iMotion.w)+forward*iMotion.z;
  vec3 transformed=iOrigin;
  vAlpha=0.0; vBreak=0.0; vPart=aPart; vSeed=iMotion.w; vWaterUv=uv;
  if (aPart < 0.5) {
    float q=min(uv.y,1.0);
    float breakup=ease((t-iShape.w*0.36)/(iShape.w*0.48));
    float rise=max(0.0,iShape.z*t-4.905*t*t);
    float radius=iShape.x+iShape.y*max(t,0.0)/(1.0+1.4*max(t,0.0));
    float fingers=0.88+0.09*sin(theta*11.0+iMotion.w)+0.05*sin(theta*17.0-iMotion.w);
    float flare=(0.020+iShape.z*0.021)*q*q;
    float curl=ease((q-0.72)/0.28)*breakup;
    float r=(radius+flare-0.025*curl)*shape;
    float y=rise*(0.60+forward*0.42)*pow(q,1.45)*mix(1.0,fingers,q*q);
    y-=min(rise*0.16,0.025)*curl;
    // Extra rows fold the upper edge continuously into a rounded, curling lip.
    float lipAngle=max(0.0,(uv.y-1.0)/0.07)*3.14159265359;
    float lip=(0.0025+iShape.z*0.0015)*(1.0-0.5*breakup);
    r+=lip*sin(lipAngle); y+=lip*(cos(lipAngle)-1.0);
    transformed+=vec3(radial.x*r,y,radial.y*r);
    transformed.xz+=iMotion.xy*iMotion.z*q*max(t,0.0)*0.22;
    vAlpha=ease(t/0.018)*ease((iShape.w-t)/0.12);
    // Large asymmetry is a walking sheet: heel/back edge is visibly quieter.
    vAlpha*=mix(1.0,0.24+0.76*forward,sat(iMotion.z*2.0));
    vBreak=breakup;
    if(t<0.0 || t>iShape.w) vAlpha=0.0;
  } else {
    float jt=t-iJet.x, q=uv.y;
    float phase=sat(jt/max(iJet.z,0.001));
    float rise=ease(jt/0.045);
    float fall=1.0-ease((phase-0.30)/0.70);
    float height=iJet.y*rise*fall;
    float pinch=ease((phase-0.36)/0.24)*ease((q-0.70)/0.30);
    float neck=1.0-0.70*pinch*(0.5+0.5*cos(q*25.0-phase*12.0));
    float radius=iJet.w*(1.0-0.90*q)*neck*(0.45+0.55*rise);
    // A continuous taper with a broad foot and narrow, uneven jet tip.
    radius+=iJet.w*0.18*pow(1.0-q,4.0);
    transformed+=vec3(radial.x*radius,height*q,radial.y*radius);
    transformed.xz+=iMotion.xy*height*q*q*0.075;
    vAlpha=rise*ease((iJet.z-jt)/0.09);
    vBreak=pinch;
    if(jt<0.0 || jt>iJet.z || iJet.y<0.006) vAlpha=0.0;
  }
  ${vertexFinish}
}`;

const waterFragment = `
float bayer4(vec2 p){ivec2 q=ivec2(mod(floor(p),4.));int x=q.x,y=q.y;
 int a=((x&1)^(y&1))*2+(y&1),b=(((x>>1)&1)^((y>>1)&1))*2+((y>>1)&1);
 return (float(a*4+b)+.5)/16.;}

varying vec3 vWaterView;
varying vec3 vWaterWorld;
varying float vAlpha;
varying vec2 vWaterUv;
uniform float uRoughness;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform float uAmbientIntensity;
#include <common>
#include <fog_pars_fragment>
vec3 waterLight(vec3 n, vec3 v, float roughness) {
  vec3 l=normalize(uLightDirection);
  vec3 h=normalize(l+v);
  float NoV=max(0.035,abs(dot(n,v)));
  float NoL=max(0.0,dot(n,l));
  float NoH=max(0.0,dot(n,h));
  float VoH=max(0.0,dot(v,h));
  roughness=clamp(roughness,0.07,0.55);
  float a=max(0.045,roughness*roughness), a2=a*a;
  float denom=NoH*NoH*(a2-1.0)+1.0;
  float D=a2/max(0.00001,3.14159265*denom*denom);
  float k=(roughness+1.0)*(roughness+1.0)*0.125;
  float G=(NoV/(NoV*(1.0-k)+k))*(NoL/(NoL*(1.0-k)+k));
  float F=0.0204+0.9796*pow(1.0-VoH,5.0);
  float spec=min(1.9,D*G*F/max(0.02,4.0*NoV*max(NoL,0.01)))*NoL;
  float edge=0.0204+0.9796*pow(1.0-NoV,5.0);
  // Neutral sky/ground reflection; water has no white diffuse/foam component.
  vec3 reflected=mix(vec3(0.075,0.085,0.083),vec3(0.52,0.56,0.55),
    smoothstep(-0.35,0.75,reflect(-v,n).y));
  return reflected*(0.40+edge*0.75)*uAmbientIntensity+uLightColor*spec*uLightIntensity;
}
`;
const sheetFragment = waterFragment + `
varying float vPart;
varying float vBreak;
varying float vSeed;
void main() {
  if(vAlpha<0.003) discard;
  float theta=vWaterUv.x*6.28318530718;
  float tear=sin(theta*13.0+vSeed)*sin(theta*7.0-vSeed*0.7);
  float rupture=vBreak*smoothstep(0.58,1.0,vWaterUv.y);
  if(vPart<0.5 && rupture>0.52 && tear>1.0-rupture) discard;
  if(vPart>0.5 && vBreak>0.82 && vWaterUv.y>0.88) discard;
  vec3 n=normalize(cross(dFdx(vWaterWorld),dFdy(vWaterWorld)));
  vec3 v=normalize(cameraPosition-vWaterWorld);
  if(dot(n,v)<0.0) n=-n;
  float fresnel=0.0204+0.9796*pow(1.0-max(0.0,dot(n,v)),5.0);
  float rim=smoothstep(0.86,1.0,vWaterUv.y)*(1.0-vPart);
  float alpha=vAlpha*(0.34+fresnel*0.48+rim*0.18+vPart*0.08);
  float roughness=mix(uRoughness,0.28,rim)+vBreak*0.08;
  gl_FragColor=vec4(waterLight(n,v,roughness),min(0.78,alpha));
  if(gl_FragColor.a<bayer4(gl_FragCoord.xy))discard;gl_FragColor.a=1.;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const ballistic = `
attribute vec3 iVelocity;
attribute vec4 iData; // radius, lifetime, drag rate, opacity
attribute vec2 iSurface; // water level, seed
vec3 flight(float t) {return iOrigin+iVelocity*t+0.5*vec3(0.,-9.81,0.)*t*t;}
vec3 velocityAt(float t) {return iVelocity+vec3(0.,-9.81,0.)*t;}

`;
const dropVertex = commonVertex + ballistic + `
void main() {
  float age=uTime-iBirth, t=max(age,0.0);
  if(age<0.0 || age>iData.y){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
  vec3 center=flight(t), vel=velocityAt(t);
  if(distance((modelMatrix*vec4(center,1.)).xyz,cameraPosition)<.25){vec3 transformed=vec3(0.0);vAlpha=0.;gl_Position=vec4(2.,2.,2.,1.);return;}
  vec3 direction=normalize(vel+vec3(0.0001));
  vec3 reference=abs(direction.y)>0.92?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
  vec3 right=normalize(cross(reference,direction)), forward=cross(direction,right);
  float stretch=1.0+min(1.4,length(vel)*0.21);
  vec3 transformed=center+iData.x*(right*position.x+direction*position.y*stretch+forward*position.z);
  vWaterUv=uv;
  vAlpha=iData.w*ease(age/0.012)*ease((iData.y-age)/0.085);
  if(age<0.0 || age>iData.y) vAlpha=0.0;
  ${vertexFinish}
}`;
const dropFragment = waterFragment + `
void main() {
  if(vAlpha<0.003) discard;
  vec3 n=normalize(cross(dFdx(vWaterWorld),dFdy(vWaterWorld)));
  vec3 v=normalize(cameraPosition-vWaterWorld);
  if(dot(n,v)<0.0)n=-n;
  float F=0.0204+0.9796*pow(1.0-max(0.0,dot(n,v)),5.0);
  gl_FragColor=vec4(waterLight(n,v,uRoughness),vAlpha*(0.62+F*0.38));
  if(gl_FragColor.a<bayer4(gl_FragCoord.xy))discard;gl_FragColor.a=1.;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
const mistVertex = commonVertex + ballistic + `
void main() {
  float age=uTime-iBirth, t=max(age,0.0);
  if(age<0.0 || age>iData.y){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
  vec3 center=flight(t);
  if(distance((modelMatrix*vec4(center,1.)).xyz,cameraPosition)<.25){vec3 transformed=vec3(0.0);vAlpha=0.;gl_Position=vec4(2.,2.,2.,1.);return;}
  float growth=1.0+0.80*sat(t/max(iData.y,0.01));
  float angle=iSurface.y, c=cos(angle), s=sin(angle);
  vec2 quad=mat2(c,-s,s,c)*position.xy;
  vec3 cameraRight=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  vec3 cameraUp=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
  vec3 transformed=center+(cameraRight*quad.x+cameraUp*quad.y)*iData.x*growth;
  vWaterUv=uv;
  vAlpha=iData.w*ease(age/0.010)*pow(1.0-sat(age/max(iData.y,0.001)),1.65);
  if(age<0.0 || age>iData.y) vAlpha=0.0;
  ${vertexFinish}
}`;
const mistFragment = `
float bayer4(vec2 p){ivec2 q=ivec2(mod(floor(p),4.));int x=q.x,y=q.y;
 int a=((x&1)^(y&1))*2+(y&1),b=(((x>>1)&1)^((y>>1)&1))*2+((y>>1)&1);
 return (float(a*4+b)+.5)/16.;}

varying vec3 vWaterView;
varying float vAlpha;
varying vec2 vWaterUv;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 q=vWaterUv*2.0-1.0;
  float r2=dot(q,q);
  if(r2>1.0 || vAlpha<0.001) discard;
  float coverage=exp(-r2*4.5)*(1.0-smoothstep(0.65,1.0,r2));
  // Small neutral translucent flecks, not luminous smoke or a white torus.
  gl_FragColor=vec4(vec3(0.39,0.425,0.415),vAlpha*coverage);
  if(gl_FragColor.a<bayer4(gl_FragCoord.xy))discard;gl_FragColor.a=1.;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function crownColumnGeometry() {
  const p=[], uv=[], part=[], indices=[];
  function surface(segments, rows, kind) {
    const base=p.length/3;
    for(let j=0;j<rows.length;j++) for(let i=0;i<=segments;i++) {
      p.push(0,0,0); uv.push(i/segments,rows[j]); part.push(kind);
      if(j<rows.length-1 && i<segments) {
        const a=base+j*(segments+1)+i, b=a+1, c=a+segments+1, d=c+1;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  surface(48,[0,.15,.35,.58,.76,.90,1,1.035,1.07],0);
  surface(16,Array.from({length:13},(_,i)=>i/12),1);
  const g=new T.InstancedBufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('aPart',new T.Float32BufferAttribute(part,1));
  g.setIndex(indices);
  return g;
}

export function createWaterImpact(scene,{limit=1536,rng=Math.random,onRipple=null}={}){
 const group=new T.Group();group.name='World-space Bayer splash';scene.add(group);
 const clock={value:0},light={uLightDirection:{value:new T.Vector3(-.4,.8,.4).normalize()},uLightColor:{value:new T.Color(1,1,1)},uLightIntensity:{value:1},uAmbientIntensity:{value:1}};
 const diagnostics={emitted:0,capacity:limit,drawCalls:3,spawnUploads:0,rebaseUploads:0,rippleCallbacks:0};
 let now=0,cx=null,cz=null,disposed=false;
 function pool(g,vs,fs,count,schema,name){
  const m=new T.ShaderMaterial({name,vertexShader:vs,fragmentShader:fs,uniforms:{...T.UniformsUtils.clone(T.UniformsLib.fog),...light,uTime:clock,uRoughness:{value:.14}},transparent:false,blending:T.NoBlending,depthWrite:true,depthTest:true,side:T.DoubleSide,fog:true});
  const attributes={};for(const key in schema){const a=new T.InstancedBufferAttribute(new Float32Array(count*schema[key]),schema[key]);a.setUsage(T.DynamicDrawUsage);g.setAttribute(key,a);attributes[key]=a;}
  attributes.iBirth.array.fill(-1e6);g.instanceCount=count;
  const mesh=new T.InstancedMesh(g,m,count);mesh.frustumCulled=false;mesh.name=name;group.add(mesh);
  return {g,m,mesh,attributes,count,cursor:0,end:0};
 }
 const sheets=pool(crownColumnGeometry(),sheetVertex,sheetFragment,10,{iOrigin:3,iBirth:1,iShape:4,iMotion:4,iJet:4},'Bayer water crown and Worthington jet');
 const base=new T.IcosahedronGeometry(1,0),dg=new T.InstancedBufferGeometry().copy(base);base.dispose();
 const drops=pool(dg,dropVertex,dropFragment,limit,{iOrigin:3,iBirth:1,iVelocity:3,iData:4,iSurface:2},'Bayer ballistic world droplets');
 const plane=new T.PlaneGeometry(2,2),mg=new T.InstancedBufferGeometry().copy(plane);plane.dispose();
 const mist=pool(mg,mistVertex,mistFragment,384,{iOrigin:3,iBirth:1,iVelocity:3,iData:4,iSurface:2},'Bayer spray mist');
 const pools=[sheets,drops,mist],event={cx:0n,cz:0n,x:0,z:0,radius:.2,strength:.04};
 const scheduled=new Float64Array(32*5);scheduled.fill(-99);let nextReturn=0;
 function write(p,i,key,a,b=0,c=0,d=0){const at=p.attributes[key],o=i*at.itemSize;at.array[o]=a;if(at.itemSize>1)at.array[o+1]=b;if(at.itemSize>2)at.array[o+2]=c;if(at.itemSize>3)at.array[o+3]=d;}
 function upload(p){for(const key in p.attributes)p.attributes[key].needsUpdate=true;diagnostics.spawnUploads++;}
 function acquire(p,birth,life){const i=p.cursor;p.cursor=(i+1)%p.count;p.end=Math.max(p.end,birth+life);write(p,i,'iBirth',birth);return i;}
 function sync(s){if(cx===null){cx=s.cx;cz=s.cz;return;}const bx=cx-s.cx,bz=cz-s.cz;if(!bx&&!bz)return;
  if(bx < -16n||bx>16n||bz < -16n||bz>16n)clear();
  else {const dx=Number(bx)*64,dz=Number(bz)*64;for(let k=0;k<3;k++){const p=pools[k],a=p.attributes.iOrigin.array;for(let i=0;i<a.length;i+=3){a[i]+=dx;a[i+2]+=dz;}p.attributes.iOrigin.needsUpdate=true;}for(let i=0;i<32;i++){scheduled[i*5+1]+=dx;scheduled[i*5+2]+=dz;}diagnostics.rebaseUploads++;}
  cx=s.cx;cz=s.cz;
 }
 function ripple(x,z,strength,radius=.2){if(!onRipple)return;event.cx=cx;event.cz=cz;event.x=x;event.z=z;event.strength=strength;event.radius=radius;onRipple(event);diagnostics.rippleCallbacks++;}
 function spawn(p,x,y,z,vx,vy,vz,size,birth,life,opacity,level,seed){const i=acquire(p,birth,life);write(p,i,'iOrigin',x,y,z);write(p,i,'iVelocity',vx,vy,vz);write(p,i,'iData',size,life,0,opacity);write(p,i,'iSurface',level,seed);}
 function emit(power,s,level){if(disposed||!(power>0)||!Number.isFinite(level))return;sync(s);
  const energy=clamp(power,.1,2.5),strong=energy>.3,n=strong?Math.round(260+energy*180):48,x=s.x,z=s.z;
  const seed=rng()*TAU,dx=-Math.sin(s.yaw||0),dz=-Math.cos(s.yaw||0),i=acquire(sheets,now,.85);
  write(sheets,i,'iOrigin',x,level+.006,z);write(sheets,i,'iShape',.085,.6+energy*.38,1.5+energy*.65,.55+energy*.09);
  write(sheets,i,'iMotion',dx,dz,.16,seed);write(sheets,i,'iJet',.18,.32+energy*.32,.52,.03+energy*.009);upload(sheets);
  ripple(x,z,.028+energy*.015);
  for(let j=0;j<n;j++){const a=rng()*TAU,r=.08+rng()*.09,speed=.65+rng()*1.3*energy,vy=1.1+rng()*2.2*energy,delay=rng()*.13;
   const vx=Math.cos(a)*speed,vz=Math.sin(a)*speed,ox=x+Math.cos(a)*r,oz=z+Math.sin(a)*r;
   spawn(drops,ox,level+.02,oz,vx,vy,vz,.009+rng()**3*.045,now+delay,1.5+rng(),.92,level,a);
   if(j<4){const fall=(vy+Math.sqrt(vy*vy+2*9.81*.02))/9.81,k=nextReturn*5;scheduled[k]=now+delay+fall;scheduled[k+1]=ox+vx*fall;scheduled[k+2]=oz+vz*fall;scheduled[k+3]=.004+energy*.002;nextReturn=(nextReturn+1)%32;}
  }
  // Fine spray has the same exact ballistic law, smaller and shorter visible fade.
  for(let j=0;j<70;j++){const a=rng()*TAU,speed=.35+rng()*1.3;spawn(mist,x,level+.12,z,Math.cos(a)*speed,.7+rng(),Math.sin(a)*speed,.025+rng()*.05,now+rng()*.12,1.5+rng(),.14+rng()*.16,level,a);}
  upload(drops);upload(mist);diagnostics.emitted++;group.visible=true;for(let k=0;k<3;k++)pools[k].mesh.visible=pools[k].end>now;
 }
 function update(dt,s,camera,enabled=true,lighting){if(disposed)return;if(s)sync(s);if(!enabled)return;now+=Math.max(0,Math.min(.1,dt));clock.value=now;
  if(lighting?.sunDirection)light.uLightDirection.value.copy(lighting.sunDirection);if(lighting?.color)light.uLightColor.value.copy(lighting.color);
  if(lighting){light.uLightIntensity.value=lighting.intensity??1;light.uAmbientIntensity.value=lighting.ambientIntensity??1;}
  for(let i=0;i<32;i++){const j=i*5;if(scheduled[j]>0&&scheduled[j]<=now){ripple(scheduled[j+1],scheduled[j+2],scheduled[j+3],.1);scheduled[j]=-99;}}
  let visible=false;for(let k=0;k<3;k++){pools[k].mesh.visible=pools[k].end>now;visible||=pools[k].mesh.visible;}group.visible=visible;
 }
 function clear(){for(let k=0;k<3;k++){const p=pools[k];p.attributes.iBirth.array.fill(-1e6);p.attributes.iBirth.needsUpdate=true;p.mesh.visible=false;p.end=0;}scheduled.fill(-99);group.visible=false;}
 return {group,emit,update,clear,diagnostics,dispose(){if(disposed)return;disposed=true;scene.remove(group);for(let k=0;k<3;k++){pools[k].mesh.dispose();pools[k].g.dispose();pools[k].m.dispose();}}};
}
