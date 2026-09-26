// One shallow pool, 12 ballistic jets and 20 rim spills. No scene render targets,
// per-frame mesh allocation, or metal-looking opaque water. UrbanBatch-compatible.
import * as T from './vendor/three.module.min.js';

export const FOUNTAIN_WATER = Object.freeze({
  surfaceY: .31, poolRadius: 4.43,
  jets: 12, jetStartRadius: .21, jetEndRadius: 2.13,
  jetStartY: 2.28, jetLift: .52,
  spills: 20, spillStartRadius: 1.24, spillEndRadius: 1.40, spillStartY: 1.582
});
export const fountainWaterState = {
  clock: {value: 0}, center: {value: new T.Vector2()}, rotation: {value: 0}
};
const TAU = Math.PI * 2;

// Environment silhouettes are deliberately bounded local proxies. They are not
// screen-space reflections: the actual tile bottom is seen through alpha blending.
const environmentGLSL = `
vec3 fountainEnvironment(vec3 ray, vec2 at) {
  vec3 sky = mix(vec3(.46,.475,.465),vec3(.31,.355,.365),smoothstep(.02,.85,ray.y));
  float horizon = 1. - smoothstep(.06,.31,ray.y);
  sky = mix(sky,vec3(.19,.205,.185),horizon*.12);
  // The low strip at local Z=19 and clinic wing at Z=-27.7.
  if(ray.z>.001) {
    float hit=(19.-at.y)/ray.z; float x=at.x+hit*ray.x; float y=.31+hit*ray.y;
    if(hit>0. && x>-21.4 && x<13.4 && y>0. && y<6.1) {
      vec3 wall = y<3.1 ? vec3(.095,.135,.13) : vec3(.37,.365,.315);
      wall=mix(wall,vec3(.035,.14,.23),smoothstep(3.0,3.2,y)*(1.-smoothstep(3.65,3.9,y)));
      sky=mix(sky,wall,.82);
    }
  } else if(ray.z<-.001) {
    float hit=(-27.7-at.y)/ray.z; float x=at.x+hit*ray.x; float y=.31+hit*ray.y;
    if(hit>0. && x>-23.4 && x<-7.1 && y>0. && y<7.25)sky=mix(sky,vec3(.36,.365,.31),.82);
  }
  // Soft canopy reflections at the eight real plaza palm locations.
  for(int i=0;i<8;i++) {
    float f=float(i); vec2 q;
    if(i<3)q=vec2(-17.5,-12.+f*12.);
    else if(i<6)q=vec2(16.5,-12.+(f-3.)*12.);
    else q=vec2(i==6?-9.:7.,12.);
    float h=(8.1+mod(f,3.)*.75)*.82+.12;
    vec3 to=vec3(q.x-at.x,h-.31,q.y-at.y);
    float along=max(0.,dot(to,ray)); vec3 miss=to-ray*along;
    float crown=1.-smoothstep(1.5,2.8,length(miss*vec3(1.,1.5,1.)));
    sky=mix(sky,vec3(.075,.12,.068),crown*.82);
  }
  return sky;
}
`;
const poolGLSL = `
uniform float uFountainTime, uFountainRotation;
uniform vec2 uFountainCenter;
varying vec3 vFountainWorld;
varying vec2 vFountainAbsolute;
${environmentGLSL}
void fountainImpact(vec2 p,float count,float radius,float speed,inout vec2 gradient,inout float foam) {
  float stepAngle=6.28318530718/count;
  float sector=floor(atan(p.y,p.x)/stepAngle+.5);
  for(int n=-1;n<=1;n++) {
    float angle=(sector+float(n))*stepAngle;
    vec2 dxy=p-radius*vec2(cos(angle),sin(angle));
    float d=length(dxy),phase=d*31.-uFountainTime*speed+angle*1.7;
    float fade=exp(-d*5.1)*(1.-smoothstep(.50,.76,d));
    gradient+=dxy/max(d,.028)*(.0021*(31.*cos(phase)-5.1*sin(phase))*fade);
    foam+=exp(-d*d/0.008)*(.18+.08*sin(uFountainTime*14.+angle*2.));
  }
}
`;

export function addFountainWaterMaterials(m, {clock, center} = {}) {
  if(clock)fountainWaterState.clock=clock;
  if(center)fountainWaterState.center=center;
  const uniforms=s=>{
    s.uniforms.uFountainTime=fountainWaterState.clock;
    s.uniforms.uFountainCenter=fountainWaterState.center;
    s.uniforms.uFountainRotation=fountainWaterState.rotation;
  };
  const shared=(mat,name)=>{mat.name=name;mat.userData.urbanShared=true;mat.userData.fountainLiquid=true;return mat;};
  const water=m.fountainWater=shared(new T.MeshStandardMaterial({
    color:0x7caaa2,roughness:.11,metalness:0,vertexColors:true,
    transparent:true,opacity:.25,depthWrite:false,side:T.FrontSide
  }),'Fountain / translucent rippling water');
  water.onBeforeCompile=s=>{
    uniforms(s);
    s.vertexShader='varying vec3 vFountainWorld;varying vec2 vFountainAbsolute;\n'+s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvFountainAbsolute=position.xz;vFountainWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader=poolGLSL+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float fc=cos(uFountainRotation),fs=sin(uFountainRotation);
      mat2 fountainToLocal=mat2(fc,fs,-fs,fc),fountainToWorld=mat2(fc,-fs,fs,fc);
      vec2 poolP=fountainToLocal*(vFountainAbsolute-uFountainCenter);
      float ft=uFountainTime, impactFoam=0.;
      vec2 poolGradient=vec2(.013*cos(poolP.x*10.1+poolP.y*6.3-ft*2.2),.011*sin(poolP.y*12.7-poolP.x*5.2+ft*1.8));
      poolGradient+=vec2(.008,.011)*cos(dot(poolP,vec2(19.1,-8.7))+ft*3.1);
      fountainImpact(poolP,12.,${FOUNTAIN_WATER.jetEndRadius.toFixed(2)},7.8,poolGradient,impactFoam);
      fountainImpact(poolP,20.,${FOUNTAIN_WATER.spillEndRadius.toFixed(2)},8.5,poolGradient,impactFoam);
      poolGradient*=1.-smoothstep(4.10,4.43,length(poolP));
      vec2 worldGradient=fountainToWorld*poolGradient;
      vec3 fountainNormal=normalize(vec3(-worldGradient.x,1.,-worldGradient.y));
      normal=normalize(mat3(viewMatrix)*fountainNormal);
      roughnessFactor=mix(.095,.20,min(1.,impactFoam*2.));`);
    s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 poolView=normalize(cameraPosition-vFountainWorld);
      float waterFresnel=.0204+.9796*pow(1.-max(0.,dot(poolView,fountainNormal)),5.);
      vec3 poolRay=reflect(-poolView,fountainNormal);
      vec2 poolRayLocal=fountainToLocal*poolRay.xz;
      vec3 poolReflection=fountainEnvironment(vec3(poolRayLocal.x,poolRay.y,poolRayLocal.y),poolP);
      outgoingLight=mix(outgoingLight*.47,poolReflection,.70)+reflectedLight.directSpecular*.40;
      outgoingLight+=vec3(.28,.30,.27)*impactFoam;
      diffuseColor.a=clamp(.19+waterFresnel*.69+impactFoam*.12,.19,.90);
      #include <opaque_fragment>`);
  };
  water.customProgramCacheKey=()=> 'fountain-pool-transmission-v54';

  const jet=m.fountainJet=shared(new T.MeshStandardMaterial({
    color:0xa9c4bc,roughness:.085,metalness:0,vertexColors:true,
    transparent:true,opacity:.36,depthWrite:false,side:T.FrontSide
  }),'Fountain / continuous flowing jets');
  jet.onBeforeCompile=s=>{
    uniforms(s);
    s.vertexShader='uniform float uFountainTime;attribute vec3 fountainFlow;varying vec3 vFountainFlow;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vFountainFlow=fountainFlow;
      float flowT=fountainFlow.x,flowSeed=fountainFlow.y;
      float attached=sin(flowT*3.14159265);
      transformed+=normal*(.0017*sin(flowT*52.-uFountainTime*15.+flowSeed)*attached);`);
    s.fragmentShader='uniform float uFountainTime;varying vec3 vFountainFlow;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
      float flowT=vFountainFlow.x,flowSeed=vFountainFlow.y;
      float pulses=.5+.5*sin(flowT*91.-uFountainTime*27.+flowSeed);
      float breakup=smoothstep(.69,1.,flowT);
      float segment=smoothstep(.035,.22,pulses);
      float jetEdge=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.);
      diffuseColor.a=(.19+jetEdge*.37)*(.72+.28*pulses)*mix(1.,segment,breakup*.81);
      outgoingLight=mix(outgoingLight*.40,vec3(.38,.43,.41),.68)+reflectedLight.directSpecular*.48;
      #include <opaque_fragment>`);
  };
  jet.customProgramCacheKey=()=> 'fountain-continuous-jets-v54';

  const drops=m.fountainSplash=shared(new T.MeshStandardMaterial({
    color:0xb3cac0,roughness:.08,metalness:0,vertexColors:true,
    transparent:true,opacity:.42,depthWrite:false
  }),'Fountain / impact droplets');
  drops.onBeforeCompile=s=>{
    uniforms(s);
    s.vertexShader='uniform float uFountainTime;attribute vec4 fountainDrop;attribute vec2 fountainDrift;varying float vDropAge;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float age=fract(uFountainTime*fountainDrop.z+fountainDrop.x);
      vDropAge=age;
      transformed.xz+=fountainDrift*age;
      transformed.y+=4.*fountainDrop.y*age*(1.-age);`);
    s.fragmentShader='varying float vDropAge;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
      diffuseColor.a*=smoothstep(0.,.07,vDropAge)*(1.-smoothstep(.79,1.,vDropAge));
      outgoingLight=mix(outgoingLight*.40,vec3(.38,.43,.41),.60)+reflectedLight.directSpecular*.55;
      #include <opaque_fragment>`);
  };
  drops.customProgramCacheKey=()=> 'fountain-ballistic-splash-v54';
  return m;
}

export function fountainPath(kind,angle,t) {
  const f=FOUNTAIN_WATER;
  const radius=kind==='jet'
    ?f.jetStartRadius+(f.jetEndRadius-f.jetStartRadius)*t
    :f.spillStartRadius+(f.spillEndRadius-f.spillStartRadius)*t;
  const y=kind==='jet'
    ?f.jetStartY+f.jetLift*t-(f.jetStartY+f.jetLift-f.surfaceY)*t*t
    :f.spillStartY-(f.spillStartY-f.surfaceY)*t*t;
  return new T.Vector3(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
}

function flowTube(b,x,z,kind,angle,seed) {
  const segments=kind==='jet'?24:16,sides=kind==='jet'?6:5;
  const positions=[],uv=[],indices=[],flow=[];
  for(let j=0;j<=segments;j++) {
    const t=j/segments,p=fountainPath(kind,angle,t);
    const tangent=fountainPath(kind,angle,Math.min(1,t+.0005)).sub(fountainPath(kind,angle,Math.max(0,t-.0005))).normalize();
    const side=new T.Vector3(-Math.sin(angle),0,Math.cos(angle));
    const other=new T.Vector3().crossVectors(tangent,side).normalize();
    const radius=kind==='jet'?.016*(1-.61*t):.012*(1-.42*t);
    for(let k=0;k<=sides;k++) {
      const phase=k/sides*TAU;
      const at=p.clone().addScaledVector(side,Math.cos(phase)*radius).addScaledVector(other,Math.sin(phase)*radius);
      positions.push(x+at.x,at.y,z+at.z);uv.push(k/sides,t);flow.push(t,seed,kind==='jet'?0:1);
    }
    if(j<segments)for(let k=0;k<sides;k++){const a=j*(sides+1)+k,c=a+sides+1;indices.push(a,a+1,c,a+1,c+1,c);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('fountainFlow',new T.Float32BufferAttribute(flow,3));g.setIndex(indices);g.computeVertexNormals();b.add(g,'fountainJet',0,0,0);g.dispose();
}

// Replaces the old disk and both old rod loops, retaining the existing stonework.
// Call while b is pushed into the clinic coordinate frame (Y already included).
export function addFountainLiquid(b,x,z) {
  const c=b.point(x,FOUNTAIN_WATER.surfaceY,z);
  fountainWaterState.center.value.set(c.x,c.z);
  fountainWaterState.rotation.value=b.frame.ry;
  const disk=new T.CircleGeometry(FOUNTAIN_WATER.poolRadius,96);
  disk.rotateX(-Math.PI/2);b.add(disk,'fountainWater',x,FOUNTAIN_WATER.surfaceY,z);disk.dispose();
  const upperDisk=new T.CircleGeometry(1.237,48);
  upperDisk.rotateX(-Math.PI/2);b.add(upperDisk,'fountainWater',x,1.585,z);upperDisk.dispose();
  const impacts=[];
  for(const[kind,count]of[['jet',FOUNTAIN_WATER.jets],['spill',FOUNTAIN_WATER.spills]]) {
    for(let i=0;i<count;i++) {
      const a=i*TAU/count,seed=i*1.717+(kind==='jet'?0:5.2);
      flowTube(b,x,z,kind,a,seed);
      const point=fountainPath(kind,a,1);impacts.push({kind,angle:a,x:point.x,y:point.y,z:point.z});
      if(kind==='jet') {
        // Short bronze nozzles actually connect the water to the center finial.
        b.rod('photoBronze',[x+Math.cos(a)*.11,2.25,z+Math.sin(a)*.11],[x+Math.cos(a)*.225,2.284,z+Math.sin(a)*.225],.021);
      }
    }
  }
  // Each impact owns three small droplets. All trajectories live on the GPU.
  const positions=[],normals=[],uv=[],drop=[],drift=[];
  const base=new T.OctahedronGeometry(1,0),p=base.attributes.position,n=base.attributes.normal;
  for(let i=0;i<impacts.length;i++)for(let j=0;j<3;j++) {
    const q=impacts[i],seed=(i*17+j*37)%101/101;
    const direction=q.angle+(j-1)*1.7+.37,worldDirection=direction-b.frame.ry;
    const range=.075+seed*.12,radius=.007+seed*.006,height=.047+seed*.085;
    for(let k=0;k<p.count;k++) {
      positions.push(x+q.x+p.getX(k)*radius,FOUNTAIN_WATER.surfaceY+.008+p.getY(k)*radius*1.4,z+q.z+p.getZ(k)*radius);
      normals.push(n.getX(k),n.getY(k),n.getZ(k));uv.push(0,0);
      drop.push(seed,height,2.0+seed*.7,j);
      drift.push(Math.cos(worldDirection)*range,Math.sin(worldDirection)*range);
    }
  }
  base.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('fountainDrop',new T.Float32BufferAttribute(drop,4));g.setAttribute('fountainDrift',new T.Float32BufferAttribute(drift,2));b.add(g,'fountainSplash',0,0,0);g.dispose();
  return impacts;
}

export function finishFountainLiquid(root) {
  root.traverse(o=>{if(o.isMesh&&o.material?.userData.fountainLiquid){
    o.castShadow=false;o.receiveShadow=true;
    // Pool before streams before drops: the world remains visible underneath.
    o.renderOrder=o.material.name.includes('translucent')?1:o.material.name.includes('jets')?2:3;
    // The ballistic drops move at most .20 m beyond their static bounds.
    if(o.geometry.boundingSphere)o.geometry.boundingSphere.radius+=.24;
  }});
}
