import * as T from './vendor/three.module.min.js';
import { random, height, surfaceHeight, roadDistance } from './world.js?v=11';
import { pondPoint, pondDistance, pondBankPoint, pondMetrics, pondShoreWidth } from './lake-shape.js?v=11';

// Reference-led irregular rural lake: shared shapes, cross-tile water, and dense
// broken banks. The original layered wind-ripple / sky-reflection water is retained.
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
    shader.vertexShader = `attribute float lakeRadius; attribute vec2 lakeCoord;
varying vec2 vLakeXZ; varying vec3 vLakeWorld; varying float vLakeRadius;
` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
vLakeXZ=lakeCoord; vLakeRadius=lakeRadius;
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
  mat.customProgramCacheKey = () => 'rural-lake-water-v6.0';
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
  mat.customProgramCacheKey = () => 'rural-lake-straw-wind-v6.0';
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

// Clip only mesh triangles, never the authoritative outline. Each tile receives
// a projection of the same lake; no centre-owner dependency, road-shaped holes,
// duplicated water, or shoreline seam appears at the 64 m cell boundary.
function clipPolygon(poly,axis,bound,keepGreater){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const ai=keepGreater?a[axis]>=bound:a[axis]<=bound;
    const bi=keepGreater?b[axis]>=bound:b[axis]<=bound;
    if(ai)out.push(a);
    if(ai!==bi){
      const t=(bound-a[axis])/(b[axis]-a[axis]);
      out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,d:a.d+(b.d-a.d)*t});
    }
  }
  return out;
}
function waterGeometry(f,y){
  const sectors=320,scales=[0,.30,.60,.82,.94,1],rings=[];
  const positions=[],normals=[],radius=[],coords=[],indices=[];
  for(const scale of scales){
    const ring=[];
    for(let i=0;i<sectors;i++){
      const q=pondPoint(f,i/sectors*TAU,scale);ring.push({...q,d:scale});
    }
    rings.push(ring);
  }
  const emit=(a,b,c)=>{
    let poly=[a,b,c];
    for(const [axis,bound,greater] of [['x',0,true],['x',64,false],['z',0,true],['z',64,false]]){
      poly=clipPolygon(poly,axis,bound,greater);if(poly.length<3)return;
    }
    const base=positions.length/3;
    for(const v of poly){
      positions.push(v.x,y,v.z);normals.push(0,1,0);radius.push(v.d);
      coords.push(v.x-f.cx,v.z-f.cz);
    }
    for(let i=1;i<poly.length-1;i++)indices.push(base,base+i,base+i+1);
  };
  for(let i=0;i<sectors;i++)emit(rings[0][i],rings[1][(i+1)%sectors],rings[1][i]);
  for(let ring=1;ring<scales.length-1;ring++)for(let i=0;i<sectors;i++){
    const j=(i+1)%sectors,a=rings[ring],b=rings[ring+1];
    emit(a[i],a[j],b[i]);emit(a[j],b[j],b[i]);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  g.setAttribute('lakeRadius',new T.Float32BufferAttribute(radius,1));
  g.setAttribute('lakeCoord',new T.Float32BufferAttribute(coords,2));
  g.setIndex(indices);g.computeBoundingSphere();return g;
}

// Three interwoven growth habits: short living grass, sprawling straw, and
// taller thin rushes. Wider root spreads make overlapping patches, not evenly
// spaced identical vertical pom-poms.
function tuftGeometry(blades,segments,kind){
  const r=random(0x6671+kind*0x1289),p=[],cols=[],ids=[];
  const palette=kind===0?['#425032','#788057','#b9b18a']:
    kind===1?['#6a5e3e','#a5966e','#d5caa8']:['#625b3d','#a69b75','#d8cdb1'];
  const base=new T.Color(palette[0]),middle=new T.Color(palette[1]),tip=new T.Color(palette[2]),color=new T.Color();
  for(let i=0;i<blades;i++){
    const a=r()*TAU,dx=Math.cos(a),dz=Math.sin(a),rad=Math.sqrt(r())*(kind===2?.14:.28);
    const h=kind===2?.92+r()*.58:kind===1?.44+r()*.65:.25+r()*.39;
    const bend=kind===2?.12+r()*.27:kind===1?.27+r()*.55:.23+r()*.39;
    const width=kind===2?.009+r()*.007:kind===1?.011+r()*.016:.014+r()*.016;
    const lean=a+(r()-.5)*1.1,lx=Math.cos(lean),lz=Math.sin(lean),start=p.length/3;
    for(let j=0;j<=segments;j++){
      const t=j/segments,b=t*t*(.65+t*.35),w=width*(1-t*.96);
      const x=dx*rad+lx*b*bend,z=dz*rad+lz*b*bend,y=h*t-bend*.28*t*t*t;
      color.copy(t<.42?base:middle).lerp(t<.42?middle:tip,t<.42?t/.42:(t-.42)/.58);
      for(const side of [-1,1]){p.push(x-lz*w*side,y,z+lx*w*side);cols.push(color.r,color.g,color.b);}
    }
    for(let j=0;j<segments;j++){const k=start+j*2;ids.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(ids);g.computeVertexNormals();
  g.computeBoundingSphere();return keep(g);
}
const tuftGeometries=[
  [tuftGeometry(12,3,0),tuftGeometry(16,4,1),tuftGeometry(12,4,2)],
  [tuftGeometry(9,3,0),tuftGeometry(11,3,1),tuftGeometry(9,3,2)],
  [tuftGeometry(6,2,0),tuftGeometry(7,3,1),tuftGeometry(6,3,2)],
];
const stoneGeometry=keep(new T.IcosahedronGeometry(1,0));
const stoneMaterial=keep(new T.MeshStandardMaterial({ name:'damp bank pebbles', color:'#7c7460', roughness:.77 }));
const mudMaterial=keep(new T.MeshStandardMaterial({ name:'small moist silt patches', color:0xffffff,
  vertexColors:true,roughness:.91,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1 }));

const shoreCache=new Map();
const lakeSeed=f=>(f.lakeSeed??f.seed)>>>0;
const inTile=(x,z)=>x>=0&&z>=0&&x<64&&z<64;
function shoreCandidates(f){
  const key=`${lakeSeed(f)}:${f.rx}:${f.rz}:${f.angle}:${f.shorePhase}:${f.shoreAmplitude}`;
  let all=shoreCache.get(key);
  if(!all){
    const origin={...f,cx:0,cz:0},r=random(lakeSeed(f)^0x847721),items=[];
    let perimeter=0,previous=pondPoint(origin,0);
    for(let i=1;i<=320;i++){const q=pondPoint(origin,i/320*TAU);perimeter+=Math.hypot(q.x-previous.x,q.z-previous.z);previous=q;}
    const patchCount=Math.ceil(perimeter/3.1);
    for(let j=0;j<patchCount;j++){
      const a=r()*TAU,arc=pondPoint(origin,a),next=pondPoint(origin,a+.001);
      const speed=Math.hypot(next.x-arc.x,next.z-arc.z)/.001;
      const width=pondShoreWidth(origin,a),span=1.8+r()*5.8;
      const growth=.5+.32*Math.sin(a*3+f.shorePhase*.63)+.18*Math.sin(a*7-f.shorePhase*.41);
      // Whole bank reaches become exposed muddy/short-grass gaps; neighbouring
      // patches overlap densely and wander several metres onto the upper bank.
      if(growth<.28||(growth<.48&&r()<.60))continue;
      const family=r(),centre=.24+r()*width*.83,depth=.35+r()*width*.44;
      const count=52+Math.floor(span*depth*(10+r()*5));
      for(let i=0;i<count;i++){
        const aa=a+(r()+r()-1)*span/Math.max(1,speed);
        const dd=centre+(r()+r()-1)*depth;
        const q=pondBankPoint(origin,aa,dd),m=pondMetrics(q.x,q.z,origin);
        if(m.metres<.045||m.bank>1.18)continue;
        const choice=r(),kind=(family<.21&&m.metres<2.2&&choice<.82)?2:choice<.30?0:1;
        items.push({x:q.x,z:q.z,kind,angle:r()*TAU,scale:.66+r()*.73,
          wide:.72+r()*.82,shade:r(),priority:r()});
      }
    }
    // Small scattered low clumps soften the gaps without drawing a closed ring.
    for(let i=0;i<perimeter*1.7;i++){
      const a=r()*TAU,m=.20+r()*pondShoreWidth(origin,a),q=pondBankPoint(origin,a,m);
      if(r()>.25+.24*Math.sin(a*3+f.shorePhase))continue;
      items.push({x:q.x,z:q.z,kind:0,angle:r()*TAU,scale:.48+r()*.55,wide:.63+r()*.67,shade:r(),priority:r()});
    }
    all=items;shoreCache.set(key,all);
    // Small bounded CPU cache: full unload/reload is deterministic without
    // retaining thousands of lakes while travelling through an infinite world.
    if(shoreCache.size>24)shoreCache.delete(shoreCache.keys().next().value);
  }
  return all;
}
function addTufts(group,f,lod,material){
  const density=[1,.69,.39][lod],points=[[],[],[]];
  for(const p of shoreCandidates(f)){
    const x=p.x+f.cx,z=p.z+f.cz;
    if(p.priority>density||!inTile(x,z))continue;
    // Road cuts are enforced in terrain generation; allow natural bank grasses
    // at disabled lake crossings and keep active tracks genuinely passable.
    if(roadDistance(x,z,f)<1.68)continue;
    points[p.kind].push({...p,x,z,y:surfaceHeight(x,z,f)-.012});
  }
  let total=0;
  for(let kind=0;kind<3;kind++){
    const items=points[kind];if(!items.length)continue;total+=items.length;
    const mesh=new T.InstancedMesh(tuftGeometries[lod][kind],material,items.length);
    mesh.name=['low mixed bank grass','overlapping bent straw colonies','broken pale rush stands'][kind];
    items.forEach((p,i)=>{
      dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);
      const spread=p.wide*(lod===2?1.17:lod===1?1.06:1);
      dummy.scale.set(spread,p.scale,spread);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      tint.setRGB(.79+p.shade*.21,.79+p.shade*.20,.75+p.shade*.22);mesh.setColorAt(i,tint);
    });
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.5;
    mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  group.userData.tuftCount=total;
}

function addShoreStones(group,f,lod){
  const points=[],count=Math.round(Math.PI*(f.rx+f.rz)*1.5);
  for(let i=0;i<count;i++){
    const r=random((lakeSeed(f)^0x2893)^Math.imul(i+1,2654435761));
    if(r()>[1,.633,.32][lod])continue;
    const a=r()*TAU;
    if(r()<.5+.34*Math.sin(a*3+f.shorePhase))continue;
    const q=pondBankPoint(f,a,.045+Math.pow(r(),1.8)*.90),size=.025+Math.pow(r(),2)*.12;
    if(!inTile(q.x,q.z)||roadDistance(q.x,q.z,f)<1.7)continue;
    points.push({...q,size,y:surfaceHeight(q.x,q.z,f)+size*.17,angle:r()*TAU,shade:r()});
  }
  if(!points.length)return;
  const mesh=new T.InstancedMesh(stoneGeometry,stoneMaterial,points.length);mesh.name='scattered damp bank pebbles';
  points.forEach((p,i)=>{
    dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(.2,p.angle,.14);
    dummy.scale.set(p.size*(1.1+p.shade*.55),p.size*.43,p.size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    tint.setRGB(.63+p.shade*.30,.62+p.shade*.28,.58+p.shade*.25);mesh.setColorAt(i,tint);
  });
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();mesh.receiveShadow=true;group.add(mesh);
}
function addMudPatches(group,f,lod){
  const p=[],cols=[],ids=[],color=new T.Color();
  const count=Math.round(Math.PI*(f.rx+f.rz)*.28);
  for(let i=0;i<count;i++){
    const r=random((lakeSeed(f)^0x41467)^Math.imul(i+1,2654435761));
    if(r()>[1,.714,.429][lod])continue;
    const theta=r()*TAU,q=pondBankPoint(f,theta,.13+r()*.8),width=.24+r()*.69,depth=.14+r()*.44;
    // Avoid spanning a chunk edge: the terrain shader supplies continuous silt,
    // while these small raised micro-patches belong wholly to a single cell.
    if(q.x<width||q.z<width||q.x>64-width||q.z>64-width)continue;
    const points=[{x:q.x,z:q.z}],a=theta+(f.angle||0);
    for(let j=0;j<9;j++){
      const t=j/9*TAU,rad=.65+r()*.35;
      points.push({x:q.x+Math.cos(t)*width*rad*Math.cos(a)-Math.sin(t)*depth*rad*Math.sin(a),
        z:q.z+Math.cos(t)*width*rad*Math.sin(a)+Math.sin(t)*depth*rad*Math.cos(a)});
    }
    const base=p.length/3;
    for(const v of points){
      const d=pondDistance(v.x,v.z,f);
      if(d<1.001){const scale=1.002/Math.max(.001,d);v.x=f.cx+(v.x-f.cx)*scale;v.z=f.cz+(v.z-f.cz)*scale;}
      p.push(v.x,surfaceHeight(v.x,v.z,f)+.006,v.z);
      color.setRGB(.105+r()*.018,.091+r()*.015,.066+r()*.012);cols.push(color.r,color.g,color.b);
    }
    for(let j=0;j<9;j++)ids.push(base,base+1+(j+1)%9,base+1+j);
  }
  if(!p.length)return;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(ids);g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,mudMaterial);mesh.name='broken damp silt patches';mesh.receiveShadow=true;group.add(mesh);
}
/** f: shared lake projected into this tile; level 0 near, 1 mid, 2 far. */
export function makeLake(f,level=0,wind=stillWind){
  const lod=Math.max(0,Math.min(2,Math.floor(level))),set=resources(wind),group=new T.Group();
  group.name='large irregular rural lake';
  const y=Number.isFinite(f.lakeY)?f.lakeY:height(f.cx,f.cz,f.x,f.z)-.45;
  const geometry=waterGeometry(f,y+.008);
  if(geometry.index.count){
    const water=new T.Mesh(geometry,set.water);water.name='irregular slate-blue water';water.receiveShadow=true;group.add(water);
  }else geometry.dispose();
  addMudPatches(group,f,lod);addShoreStones(group,f,lod);addTufts(group,f,lod,set.grass);
  group.userData.lake={level:lod,waterY:y+.008,outlineSamples:320,shoreline:'lake-shape.js',lakeId:f.lakeId??null};
  return group;
}
