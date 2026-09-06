import * as T from './vendor/three.module.min.js';
import { random, height, pondPoint, pondDistance, surfaceHeight } from './world.js';

// Reference-led rural pond. No image fetches, surface vegetation, or animals.
// Water and ground share world.js's irregular shoreline and elevation contract.
const TAU = Math.PI * 2;
const shared = new WeakSet();
const materialSets = new WeakMap();
const stillWind = { time: { value: 0 }, strength: { value: 0.32 } };
const dummy = new T.Object3D();
const tint = new T.Color();
const keep = resource => { shared.add(resource); return resource; };
export const isSharedLakeResource = resource => !!resource && shared.has(resource);

const waterHeader = `
uniform float uLakeTime;
uniform float uLakeWind;
varying vec2 vLakeXZ;
varying vec3 vLakeWorld;
varying float vLakeRadius;
float lakeHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float lakeNoise(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(lakeHash(i),lakeHash(i+vec2(1.,0.)),f.x),
    mix(lakeHash(i+vec2(0.,1.)),lakeHash(i+vec2(1.,1.)),f.x),f.y);
}
void lakeWave(inout vec3 wave,vec2 p,vec2 dir,float freq,float amplitude,float speed,float time) {
  float phase=dot(p,dir)*freq+time*speed;
  // Break long sine crests into short, natural wind ripples, never a grid.
  phase+=sin(dot(p,vec2(-dir.y,dir.x))*1.37+time*.12)*.64;
  float aa=1.-smoothstep(.7,3.1,fwidth(phase));
  wave.x+=sin(phase)*amplitude*aa;
  wave.yz+=cos(phase)*amplitude*freq*dir*aa;
}
vec3 lakeWaves(vec2 p,float time) {
  vec3 w=vec3(0.);
  lakeWave(w,p,normalize(vec2(.12,1.)),8.3,.0080,1.05,time);
  lakeWave(w,p,normalize(vec2(.24,1.)),18.7,.0034,1.54,time);
  lakeWave(w,p,normalize(vec2(-.09,1.)),35.4,.0014,2.03,time);
  lakeWave(w,p,normalize(vec2(.66,.75)),12.3,.0020,-.87,time);
  return w*(.68+clamp(uLakeWind,0.,1.)*.65);
}
`;

function waterMaterial(wind) {
  const mat = new T.MeshStandardMaterial({
    name: 'slate-blue wind-ripple water', color: '#314956', roughness: .34,
    metalness: .23, transparent: false, depthWrite: true,
  });
  mat.onBeforeCompile = shader => {
    shader.uniforms.uLakeTime = wind.time;
    shader.uniforms.uLakeWind = wind.strength;
    shader.vertexShader = `attribute float lakeRadius;
varying vec2 vLakeXZ; varying vec3 vLakeWorld; varying float vLakeRadius;
` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
vLakeXZ=position.xz; vLakeRadius=lakeRadius;
vLakeWorld=(modelMatrix*vec4(position,1.)).xyz;`);
    shader.fragmentShader = waterHeader + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec2 lakeP=vLakeXZ;
vec3 lakeW=lakeWaves(lakeP,uLakeTime);
lakeW*=.48+.85*lakeNoise(lakeP*vec2(5.6,1.7));
float lakeMottle=lakeNoise(lakeP*.57)*.58+lakeNoise(lakeP*1.8)*.42;
float lakeShallow=smoothstep(.89,1.,vLakeRadius);
vec3 lakeDeep=mix(vec3(.029,.047,.060),vec3(.051,.072,.087),lakeMottle);
vec3 lakeEdge=vec3(.087,.100,.103);
diffuseColor.rgb=mix(lakeDeep,lakeEdge,lakeShallow*.66);
diffuseColor.rgb*=.93+lakeW.x*16.0;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor=clamp(.29+lakeMottle*.16+lakeShallow*.07,.25,.55);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
vec3 lakeNormal=normalize(vec3(-lakeW.y,1.,-lakeW.z));
normal=normalize(mat3(viewMatrix)*lakeNormal);
`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
vec3 lakeEye=normalize(cameraPosition-vLakeWorld);
float lakeFresnel=pow(1.-max(dot(lakeNormal,lakeEye),0.),4.);
vec3 lakeReflection=reflect(-lakeEye,lakeNormal);
vec2 lakeSkyUV=lakeReflection.xz/(max(lakeReflection.y,0.)+.24)*2.3;
float lakeSky=lakeNoise(lakeSkyUV+vec2(uLakeTime*.004,0.));
vec3 lakeSkyTint=mix(vec3(.055,.079,.098),vec3(.107,.128,.143),lakeSky);
lakeSkyTint*=mix(.58,1.,smoothstep(-.04,.18,lakeReflection.y));
// A muted sky reflection remains readable under the game's cloudy lighting.
totalEmissiveRadiance+=lakeSkyTint*(.17+lakeFresnel*.62);
float lakeSilver=pow(max(dot(reflect(-normalize(vec3(-.42,.76,.49)),lakeNormal),lakeEye),0.),85.);
totalEmissiveRadiance+=vec3(.28,.31,.32)*lakeSilver*(1.-lakeShallow*.7);`);
  };
  mat.customProgramCacheKey = () => 'rural-lake-water-v4.1';
  return keep(mat);
}

function dryGrassMaterial(wind) {
  const mat = new T.MeshStandardMaterial({ name: 'dry shoreline bunchgrass', color: 0xffffff,
    vertexColors: true, side: T.DoubleSide, roughness: .95 });
  mat.onBeforeCompile = shader => {
    shader.uniforms.uLakeTime = wind.time;
    shader.uniforms.uLakeWind = wind.strength;
    shader.vertexShader = `uniform float uLakeTime; uniform float uLakeWind;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
vec3 lakeRoot=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
float lakeFlex=pow(clamp(position.y/1.4,0.,1.),1.65);
float lakeGust=sin(lakeRoot.x*.33+lakeRoot.z*.27-uLakeTime*1.18)*.55+
  sin(lakeRoot.x*.11-lakeRoot.z*.19-uLakeTime*.73)*.28;
float lakeBend=lakeFlex*(.035+uLakeWind*(.08+lakeGust*.10));
transformed.x+=lakeBend;
transformed.z+=lakeBend*.38+sin(uLakeTime*2.1+lakeRoot.z)*lakeFlex*.018;
`);
  };
  mat.customProgramCacheKey = () => 'rural-lake-straw-wind-v4.1';
  return keep(mat);
}

function resources(wind) {
  let set = materialSets.get(wind);
  if (!set) {
    set = { water: waterMaterial(wind), grass: dryGrassMaterial(wind) };
    materialSets.set(wind, set);
  }
  return set;
}

// Fixed angular boundary at all detail levels: LOD never changes the waterline.
function waterGeometry(f, y) {
  const sectors = 160, scales = [0, .38, .70, .88, .95, 1];
  const p = [f.cx,y,f.cz], radius = [0], index = [];
  for (let ring=1; ring<scales.length; ring++) {
    for (let i=0; i<sectors; i++) {
      const q = pondPoint(f, i/sectors*TAU, scales[ring]);
      p.push(q.x,y,q.z); radius.push(scales[ring]);
    }
  }
  for (let i=0; i<sectors; i++) index.push(0,1+(i+1)%sectors,1+i);
  for (let ring=1; ring<scales.length-1; ring++) {
    const a=1+(ring-1)*sectors,b=a+sectors;
    for(let i=0;i<sectors;i++) {
      const j=(i+1)%sectors;
      index.push(a+i,a+j,b+i,a+j,b+j,b+i);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p,3));
  g.setAttribute('lakeRadius', new T.Float32BufferAttribute(radius,1));
  g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

function tuftGeometry(blades, segments, rush) {
  const r=random(rush?0x2188:0x6671), p=[], cols=[], ids=[];
  const base=new T.Color('#655638'), middle=new T.Color('#a79970'), tip=new T.Color('#d9ceb0');
  const color=new T.Color();
  for(let i=0;i<blades;i++) {
    const a=i*2.399+r()*.7, dx=Math.cos(a),dz=Math.sin(a),rad=r()*.10;
    const h=rush?.80+r()*.57:.40+r()*.69;
    const bend=rush?.13+r()*.26:.20+r()*.39;
    const width=rush?.009+r()*.007:.012+r()*.017;
    const start=p.length/3;
    for(let j=0;j<=segments;j++) {
      const t=j/segments,b=t*t*(.68+t*.32),w=width*(1-t*.95);
      const x=dx*(rad+b*bend),z=dz*(rad+b*bend),y=h*t-bend*.20*t*t*t;
      color.copy(t<.45?base:middle).lerp(t<.45?middle:tip,t<.45?t/.45:(t-.45)/.55);
      for(const side of [-1,1]) {p.push(x-dz*w*side,y,z+dx*w*side);cols.push(color.r,color.g,color.b);}
    }
    for(let j=0;j<segments;j++) {const k=start+j*2;ids.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(ids);g.computeVertexNormals();
  g.computeBoundingSphere();return keep(g);
}

const tuftGeometries=[
  {grass:tuftGeometry(10,5,false),rush:tuftGeometry(9,5,true)},
  {grass:tuftGeometry(7,4,false),rush:tuftGeometry(6,4,true)},
  {grass:tuftGeometry(5,3,false),rush:tuftGeometry(4,3,true)},
];
const stoneGeometry=keep(new T.IcosahedronGeometry(1,0));
const stoneMaterial=keep(new T.MeshStandardMaterial({ name:'damp bank pebbles', color:'#7c7460', roughness:.77 }));
const mudMaterial=keep(new T.MeshStandardMaterial({ name:'small moist silt patches', color:0xffffff,
  vertexColors:true,roughness:.91,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1 }));

function shoreCandidates(f) {
  const r=random(f.seed^0x847721), items=[];
  for(let i=0;items.length<1080&&i<5000;i++) {
    const theta=r()*TAU;
    const patch=.48+.25*Math.sin(theta*3+f.shorePhase)+.17*Math.sin(theta*7-f.shorePhase*.6);
    if(r()>patch+.15)continue;
    const rush=r()<.23;
    const d=rush?1.012+r()*.10:1.038+Math.pow(r(),1.8)*.29;
    const q=pondPoint(f,theta,d),pd=pondDistance(q.x,q.z,f);
    // Keep crowns on the dry bank, clear of neighbouring road/field edges.
    if(pd<1.008||pd>1.35||q.x<7.1||q.z<7.1||q.x>56.9||q.z>56.9)continue;
    items.push({x:q.x,z:q.z,y:surfaceHeight(q.x,q.z,f)-.014,angle:r()*TAU,
      scale:.68+r()*.65,wide:.68+r()*.70,shade:r(),rush});
  }
  return items;
}

function addTufts(group,f,lod,material) {
  const all=shoreCandidates(f), limit=[1080,760,520][lod], items=all.slice(0,limit);
  for(const rush of [false,true]) {
    const points=items.filter(v=>v.rush===rush);
    const mesh=new T.InstancedMesh(tuftGeometries[lod][rush?'rush':'grass'],material,points.length);
    mesh.name=rush?'tall pale shoreline rushes':'bent straw bunchgrass';
    points.forEach((p,i)=>{
      dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);
      dummy.scale.set(p.wide,p.scale,p.wide);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      tint.setRGB(.81+p.shade*.19,.80+p.shade*.19,.77+p.shade*.20);mesh.setColorAt(i,tint);
    });
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.4;
    mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  group.userData.tuftCount=items.length;
}

function addShoreStones(group,f,lod) {
  const r=random(f.seed^0x2893),points=[],count=[190,108,52][lod];
  for(let i=0;i<count;i++) {
    const q=pondPoint(f,r()*TAU,1.005+Math.pow(r(),1.8)*.08);
    if(q.x<6.8||q.z<6.8||q.x>57.2||q.z>57.2)continue;
    const size=.025+Math.pow(r(),2)*.115;
    points.push({...q,size,y:surfaceHeight(q.x,q.z,f)+size*.19,angle:r()*TAU,shade:r()});
  }
  const mesh=new T.InstancedMesh(stoneGeometry,stoneMaterial,points.length);mesh.name='scattered damp shoreline pebbles';
  points.forEach((p,i)=>{
    dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(.2,p.angle,.14);
    dummy.scale.set(p.size*(1.1+p.shade*.55),p.size*.43,p.size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    tint.setRGB(.63+p.shade*.30,.62+p.shade*.28,.58+p.shade*.25);mesh.setColorAt(i,tint);
  });
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();mesh.receiveShadow=true;group.add(mesh);
}

function addMudPatches(group,f,lod) {
  const r=random(f.seed^0x41467),p=[],cols=[],ids=[],color=new T.Color();
  const count=[34,26,18][lod];
  for(let i=0;i<count;i++) {
    const theta=r()*TAU,q=pondPoint(f,theta,1.020+r()*.065),width=.12+r()*.35,depth=.08+r()*.20;
    if(q.x<7||q.z<7||q.x>57||q.z>57)continue;
    const points=[{x:q.x,z:q.z}], a=theta+(f.angle||0);
    for(let j=0;j<9;j++) {
      const t=j/9*TAU,rad=.7+r()*.3;
      points.push({x:q.x+Math.cos(t)*width*rad*Math.cos(a)-Math.sin(t)*depth*rad*Math.sin(a),
        z:q.z+Math.cos(t)*width*rad*Math.sin(a)+Math.sin(t)*depth*rad*Math.cos(a)});
    }
    const base=p.length/3;
    for(const v of points) {
      // Clip to the land side using the same world pond mask as the terrain.
      const d=pondDistance(v.x,v.z,f);if(d<1.004) {
        const s=1.005/Math.max(.001,d);v.x=f.cx+(v.x-f.cx)*s;v.z=f.cz+(v.z-f.cz)*s;
      }
      p.push(v.x,surfaceHeight(v.x,v.z,f)+.006,v.z);
      color.setRGB(.105+r()*.016,.091+r()*.014,.066+r()*.010);cols.push(color.r,color.g,color.b);
    }
    for(let j=0;j<9;j++)ids.push(base,base+1+(j+1)%9,base+1+j);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(ids);g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,mudMaterial);mesh.name='irregular damp silt patches';mesh.receiveShadow=true;group.add(mesh);
}

/** f: world pond feature; level: 0 near, 1 mid, 2 far; wind: shared time/strength uniforms. */
export function makeLake(f,level=0,wind=stillWind) {
  const lod=Math.max(0,Math.min(2,Math.floor(level))),set=resources(wind),group=new T.Group();
  group.name='rural slate-blue pond';
  const y=Number.isFinite(f.lakeY)?f.lakeY:height(f.cx,f.cz,f.x,f.z)-.45;
  const water=new T.Mesh(waterGeometry(f,y+.008),set.water);water.name='irregular slate-blue water';
  water.receiveShadow=true;group.add(water);addMudPatches(group,f,lod);addShoreStones(group,f,lod);addTufts(group,f,lod,set.grass);
  group.userData.lake={level:lod,waterY:y+.008,outlineSamples:160,shoreline:'world.pondPoint'};
  return group;
}
