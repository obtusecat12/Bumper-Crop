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
  float alpha=vAlpha*(0.10+fresnel*0.58+rim*0.12+vPart*0.08);
  float roughness=mix(uRoughness,0.28,rim)+vBreak*0.08;
  gl_FragColor=vec4(waterLight(n,v,roughness),min(0.78,alpha));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const ballistic = `
attribute vec3 iVelocity;
attribute vec4 iData; // radius, lifetime, drag rate, opacity
attribute vec2 iSurface; // water level, seed
vec3 flight(float t) {
  float k=max(0.001,iData.z), e=exp(-k*t), a=(1.0-e)/k;
  return iOrigin+iVelocity*a+vec3(0.0,-9.81*(t-a)/k,0.0);
}
vec3 velocityAt(float t) {
  float k=max(0.001,iData.z), e=exp(-k*t);
  return iVelocity*e+vec3(0.0,-9.81*(1.0-e)/k,0.0);
}
`;
const dropVertex = commonVertex + ballistic + `
void main() {
  float age=uTime-iBirth, t=max(age,0.0);
  if(age<0.0 || age>iData.y){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
  vec3 center=flight(t), vel=velocityAt(t);
  vec3 direction=normalize(vel+vec3(0.0001));
  vec3 reference=abs(direction.y)>0.92?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
  vec3 right=normalize(cross(reference,direction)), forward=cross(direction,right);
  float stretch=1.0+min(1.4,length(vel)*0.21);
  vec3 transformed=center+iData.x*(right*position.x+direction*position.y*stretch+forward*position.z);
  vWaterUv=uv;
  vAlpha=iData.w*ease(age/0.012)*ease((iData.y-age)/0.085);
  if(age<0.0 || age>iData.y || center.y<iSurface.x+0.001) vAlpha=0.0;
  ${vertexFinish}
}`;
const dropFragment = waterFragment + `
void main() {
  if(vAlpha<0.003) discard;
  vec3 n=normalize(cross(dFdx(vWaterWorld),dFdy(vWaterWorld)));
  vec3 v=normalize(cameraPosition-vWaterWorld);
  if(dot(n,v)<0.0)n=-n;
  float F=0.0204+0.9796*pow(1.0-max(0.0,dot(n,v)),5.0);
  gl_FragColor=vec4(waterLight(n,v,uRoughness),vAlpha*(0.36+F*0.46));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
const mistVertex = commonVertex + ballistic + `
void main() {
  float age=uTime-iBirth, t=max(age,0.0);
  if(age<0.0 || age>iData.y){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
  vec3 center=flight(t);
  float growth=1.0+0.80*sat(t/max(iData.y,0.01));
  float angle=iSurface.y, c=cos(angle), s=sin(angle);
  vec2 quad=mat2(c,-s,s,c)*position.xy;
  vec3 cameraRight=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  vec3 cameraUp=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
  vec3 transformed=center+(cameraRight*quad.x+cameraUp*quad.y)*iData.x*growth;
  vWaterUv=uv;
  vAlpha=iData.w*ease(age/0.010)*pow(1.0-sat(age/max(iData.y,0.001)),1.65);
  if(age<0.0 || age>iData.y || center.y<iSurface.x+0.004) vAlpha=0.0;
  ${vertexFinish}
}`;
const mistFragment = `
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

export function createWaterImpact(scene,{limit=1536,rng=Math.random,onRipple=null}={}) {
  const capacity=clamp(Math.floor(finite(limit,1536)),32,2048);
  const group=new T.Group(); group.name='GPU crown, collapse jet, ballistic drops and fine spray';
  scene.add(group);
  const clock={value:0};
  const lightUniforms={uLightDirection:{value:new T.Vector3(-.38,.81,.45).normalize()},
    uLightColor:{value:new T.Color(1,1,1)},uLightIntensity:{value:1},uAmbientIntensity:{value:1}};
  let now=0, anchorX=null, anchorZ=null, disposed=false, side=1;
  const scheduled=[];
  const diagnostics={capacity,eventCapacity:EVENTS,mistCapacity:MIST,drawCalls:3,
    spawnUploads:0,rebaseUploads:0,emitted:0,rippleCallbacks:0};

  function material(name,vertexShader,fragmentShader,roughness) {
    const m=new T.ShaderMaterial({name,uniforms:{...T.UniformsUtils.clone(T.UniformsLib.fog),...lightUniforms,uTime:clock,uRoughness:{value:roughness}},
      vertexShader,fragmentShader,transparent:true,depthTest:true,depthWrite:false,
      side:T.DoubleSide,fog:true,toneMapped:true});
    m.forceSinglePass=true;
    // Both fog hooks and mvPosition remain available to atmosphere.attachFog().
    return m;
  }
  function pool(g,m,size,schema) {
    const attributes={};
    for(const [name,width] of Object.entries(schema)) {
      const a=new T.InstancedBufferAttribute(new Float32Array(size*width),width);
      a.setUsage(T.DynamicDrawUsage); g.setAttribute(name,a); attributes[name]=a;
    }
    attributes.iBirth.array.fill(-1e6);
    g.instanceCount=size;
    const mesh=new T.Mesh(g,m); mesh.frustumCulled=false; mesh.name=m.name;
    group.add(mesh);
    return {g,m,mesh,size,attributes,cursor:0,until:new Float64Array(size),lastEnd:0};
  }
  const common={iOrigin:3,iBirth:1};
  const sheets=pool(crownColumnGeometry(),material('GPU connected crown and delayed column',sheetVertex,sheetFragment,.11),EVENTS,
    {...common,iShape:4,iMotion:4,iJet:4});
  const dropBase=new T.IcosahedronGeometry(1,0);
  const dropGeometry=new T.InstancedBufferGeometry().copy(dropBase); dropBase.dispose();
  const drops=pool(dropGeometry,material('GPU analytic ballistic droplets',dropVertex,dropFragment,.12),capacity,
    {...common,iVelocity:3,iData:4,iSurface:2});
  const mistBase=new T.PlaneGeometry(2,2);
  const mistGeometry=new T.InstancedBufferGeometry().copy(mistBase); mistBase.dispose();
  const mist=pool(mistGeometry,material('GPU short lived fine spray',mistVertex,mistFragment,.5),MIST,
    {...common,iVelocity:3,iData:4,iSurface:2});
  const pools=[sheets,drops,mist];

  function write(p,slot,name,values) {
    const a=p.attributes[name], offset=slot*a.itemSize;
    a.array.set(values,offset);
    // Three merges these ranges before bufferSubData; unchanged slots stay on GPU.
    a.addUpdateRange(offset,a.itemSize); a.needsUpdate=true;
  }
  function acquire(p,birth,life) {
    const slot=p.cursor; p.cursor=(p.cursor+1)%p.size;
    p.until[slot]=birth+life; p.lastEnd=Math.max(p.lastEnd,birth+life);
    write(p,slot,'iBirth',[birth]); diagnostics.spawnUploads++;
    return slot;
  }
  function callback(event) {
    if(typeof onRipple==='function') {
      onRipple({cx:event.cx,cz:event.cz,x:event.x,z:event.z,radius:event.radius,strength:event.strength});
      diagnostics.rippleCallbacks++;
    }
  }
  function schedule(event,due,radius,strength,x=event.x,z=event.z) {
    // Fixed cap also protects a caller that emits repeatedly without update().
    if(scheduled.length>=EVENTS*5) scheduled.shift();
    scheduled.push({cx:event.cx,cz:event.cz,x,z,due,radius,strength});
  }
  function clear() {
    scheduled.length=0;
    for(const p of pools) {
      p.until.fill(0); p.lastEnd=0; p.cursor=0;
      p.attributes.iBirth.array.fill(-1e6); p.attributes.iBirth.clearUpdateRanges();
      p.attributes.iBirth.needsUpdate=true; p.mesh.visible=false;
    }
    group.visible=false;
  }
  function syncOrigin(state) {
    const cx=asChunk(state.cx), cz=asChunk(state.cz);
    if(anchorX===null) {anchorX=cx;anchorZ=cz;return;}
    if(cx===anchorX && cz===anchorZ)return;
    const bx=anchorX-cx, bz=anchorZ-cz;
    // Compare BigInts before conversion: a teleport cannot overflow to Infinity.
    if(bx < -16n || bx > 16n || bz < -16n || bz > 16n) clear();
    else {
      const dx=Number(bx)*CHUNK,dz=Number(bz)*CHUNK;
      for(const p of pools) {
        const a=p.attributes.iOrigin;
        for(let i=0;i<p.size;i++) if(p.until[i]>now) {
          a.array[i*3]+=dx; a.array[i*3+2]+=dz;
        }
        a.clearUpdateRanges();a.needsUpdate=true;diagnostics.rebaseUploads++;
      }
    }
    anchorX=cx;anchorZ=cz;
  }
  function rebaseTime() {
    if(now<128)return;
    const offset=Math.floor(now/120)*120;
    now-=offset;
    for(const p of pools) {
      const a=p.attributes.iBirth;
      for(let i=0;i<p.size;i++) { a.array[i]-=offset;p.until[i]-=offset; }
      p.lastEnd-=offset;a.clearUpdateRanges();a.needsUpdate=true;diagnostics.rebaseUploads++;
    }
    for(const e of scheduled)e.due-=offset;
  }
  function flightY(y,vy,k,t) {
    const a=-Math.expm1(-k*t)/k;
    return y+vy*a-9.81*(t-a)/k;
  }
  function flightDuration(y,vy,k,level,cap) {
    let lo=0,hi=cap;
    if(flightY(y,vy,k,hi)>level+.001)return cap;
    for(let j=0;j<14;j++) {
      const mid=(lo+hi)*.5;
      if(flightY(y,vy,k,mid)>level+.001)lo=mid;else hi=mid;
    }
    return Math.max(.025,hi);
  }
  function addParticle(p,event,birth,origin,velocity,radius,drag,maxLife,opacity,seed) {
    const life=flightDuration(origin[1],velocity[1],drag,event.level,maxLife);
    const slot=acquire(p,birth,life);
    write(p,slot,'iOrigin',origin);write(p,slot,'iVelocity',velocity);
    write(p,slot,'iData',[radius,life,drag,opacity]);write(p,slot,'iSurface',[event.level,seed]);
    return life;
  }
  function crownPoint(e,theta,t) {
    const c=Math.cos(theta),s=Math.sin(theta),forward=Math.max(0,c*e.dx+s*e.dz);
    const shape=1+.065*Math.sin(theta*3+e.seed)+.033*Math.cos(theta*7-e.seed)+forward*e.skew;
    const rise=Math.max(0,e.launch*t-4.905*t*t);
    const radius=(e.r0+e.radial*t/(1+1.4*t)+.020+e.launch*.021)*shape;
    const fingers=.88+.09*Math.sin(theta*11+e.seed)+.05*Math.sin(theta*17-e.seed);
    return [e.x+c*radius+e.dx*e.skew*t*.22,e.level+.008+rise*(.60+forward*.42)*fingers,
      e.z+s*radius+e.dz*e.skew*t*.22];
  }
  function emit(power,state,level) {
    if(disposed || !(power>0) || !Number.isFinite(level) || !state)return;
    syncOrigin(state);
    const energy=clamp(power,.06,2.5),strong=energy>.30;
    const intensity=clamp((energy-.30)/1.5,0,1);
    const vx=finite(state.velocity?.x),vz=finite(state.velocity?.z),speed=Math.hypot(vx,vz);
    const yaw=finite(state.yaw),dx=speed>.08?vx/speed:-Math.sin(yaw),dz=speed>.08?vz/speed:-Math.cos(yaw);
    // Foot-scale offset remains visible looking down from a 1.3 m wading eye.
    side=-side;
    const ahead=strong?.46:.30, lateral=strong?0:side*.115;
    const e={cx:asChunk(state.cx),cz:asChunk(state.cz),level,
      x:finite(state.x)+dx*ahead-dz*lateral,z:finite(state.z)+dz*ahead+dx*lateral,
      dx,dz,seed:rng()*TAU,skew:strong?.12+.12*Math.min(speed/3,1):.43,
      r0:strong?.105+.035*intensity:.047,
      radial:strong?.62+.50*intensity:.32+.10*rng(),
      launch:strong?1.65+1.05*intensity:1.05+.22*rng(),
      crownLife:strong?.43+.12*intensity:.26+.025*rng()};
    const depth=Number.isFinite(state.waterDepth)?Math.max(0,state.waterDepth):null;
    // Optional actual depth suppresses deep-cavity jets in a very thin puddle.
    const depthGate=depth===null?1:smooth((depth-.035)/.115);
    const jetHeight=energy>.70?(.22+.39*intensity)*depthGate:0;
    const jetDelay=.16+.07*intensity,jetLife=.35+.14*intensity,jetWidth=.025+.016*intensity;
    const slot=acquire(sheets,now,Math.max(e.crownLife,jetDelay+jetLife));
    write(sheets,slot,'iOrigin',[e.x,level+.008,e.z]);
    write(sheets,slot,'iShape',[e.r0,e.radial,e.launch,e.crownLife]);
    write(sheets,slot,'iMotion',[dx,dz,e.skew,e.seed]);
    write(sheets,slot,'iJet',[jetDelay,jetHeight,jetLife,jetWidth]);
    callback({...e,radius:strong?.18+.10*intensity:.105,strength:strong?-.011-.012*intensity:-.0045});
    schedule(e,now+jetDelay,strong?.17+.08*intensity:.095,strong?.006+.008*intensity:.0022);

    const count=strong?Math.round(280+500*intensity):54+Math.floor(rng()*30);
    for(let i=0;i<count;i++) {
      const theta=strong?rng()*TAU:Math.atan2(dz,dx)+(rng()-.5)*2.9;
      const delay=(strong?.025:.012)+rng()*(strong?.15:.065);
      const origin=crownPoint(e,theta,delay),c=Math.cos(theta),s=Math.sin(theta);
      const speedOut=(strong?.55+1.0*intensity:.34)*(.45+1.2*rng());
      const vy=(strong?1.0+1.6*intensity:.72)*(.55+.70*rng());
      const velocity=[c*speedOut+dx*Math.min(speed,4)*.16,vy,s*speedOut+dz*Math.min(speed,4)*.16];
      const size=rng(),radius=(strong?.0024:.0019)+Math.pow(size,3)*(strong?.013:.0055);
      const drag=.10+.14/(.15+size),birth=now+delay;
      const life=addParticle(drops,e,birth,origin,velocity,radius,drag,1.35,.65+.26*rng(),theta);
      // Only three representative return impulses; no GPU readback or per-drop CPU motion.
      if(i<3) {
        const travel=-Math.expm1(-drag*life)/drag;
        schedule(e,birth+life,.0625+.025*size,.0007+.0013*size,
          origin[0]+velocity[0]*travel,origin[2]+velocity[2]*travel);
      }
    }
    if(jetHeight>.006) {
      for(let i=0;i<24+Math.round(32*intensity);i++) {
        const jt=.080+rng()*.15,phase=jt/jetLife;
        const h=jetHeight*smooth(jt/.045)*(1-smooth((phase-.30)/.70));
        const angle=rng()*TAU,rad=.003+.013*rng();
        const origin=[e.x+dx*h*.075+Math.cos(angle)*rad,level+.008+h,e.z+dz*h*.075+Math.sin(angle)*rad];
        const velocity=[dx*.15+(rng()-.5)*.32,.50+rng()*(1+intensity),dz*.15+(rng()-.5)*.32];
        addParticle(drops,e,now+jetDelay+jt,origin,velocity,.0025+Math.pow(rng(),2)*.009,.12+.20*rng(),1.0,.76,angle);
      }
    }
    const mistCount=strong?58+Math.round(78*intensity):10;
    for(let i=0;i<mistCount;i++) {
      const theta=strong?rng()*TAU:Math.atan2(dz,dx)+(rng()-.5)*2.8;
      const delay=.015+rng()*(strong?.15:.055),origin=crownPoint(e,theta,delay);
      const spraySpeed=(strong?.65+intensity:.35)*(.45+rng());
      const velocity=[Math.cos(theta)*spraySpeed+dx*.25,.45+rng()*.90,Math.sin(theta)*spraySpeed+dz*.25];
      addParticle(mist,e,now+delay,origin,velocity,.007+Math.pow(rng(),2)*.022,3.0+5*rng(),
        .13+rng()*.20,.045+rng()*.085,rng()*TAU);
    }
    diagnostics.emitted++;
    for(const p of pools)p.mesh.visible=p.lastEnd>now;
    group.visible=true;
  }
  function update(dt,state,camera,enabled=true,lighting=null) {
    if(disposed)return;
    if(!enabled) {clear();return;}
    if(state)syncOrigin(state);
    // Optional world-space sun direction/weather values; uniform-only updates.
    // Accept either {sunDirection,color,intensity,ambientIntensity} or a Vector3.
    const light=lighting||state?.weatherLight;
    const direction=light?.sunDirection||light?.direction||light;
    if(direction && Number.isFinite(direction.x) && Number.isFinite(direction.y) && Number.isFinite(direction.z)
      && direction.x*direction.x+direction.y*direction.y+direction.z*direction.z>1e-8) {
      lightUniforms.uLightDirection.value.set(direction.x,direction.y,direction.z).normalize();
    }
    if(light?.color?.isColor)lightUniforms.uLightColor.value.copy(light.color);
    if(Number.isFinite(light?.intensity))lightUniforms.uLightIntensity.value=clamp(light.intensity,0,4);
    if(Number.isFinite(light?.ambientIntensity))lightUniforms.uAmbientIntensity.value=clamp(light.ambientIntensity,0,2);
    now+=Math.max(0,finite(dt));rebaseTime();clock.value=now;
    // Scheduling at most 50 feedback impulses is unrelated to particle animation.
    let keep=0;
    for(let i=0;i<scheduled.length;i++) {
      const event=scheduled[i];
      if(event.due<=now)callback(event);else scheduled[keep++]=event;
    }
    scheduled.length=keep;
    for(const p of pools)p.mesh.visible=p.lastEnd>now;
    group.visible=pools.some(p=>p.mesh.visible);
  }
  function dispose() {
    if(disposed)return;
    clear();disposed=true;scene.remove(group);
    for(const p of pools){p.g.dispose();p.m.dispose();}
  }
  clear();
  return {group,emit,update,clear,dispose,diagnostics};
}
