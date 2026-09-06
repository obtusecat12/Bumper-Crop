import * as T from './vendor/three.module.min.js';
import {surfaceHeight,roadDistance,laneOffset,pondDistance,pondPoint,buildingSize,buildingLocal,periodOrigin,random} from './world.js';

const dummy=new T.Object3D(),shared=new Set(),TAU=Math.PI*2;
const terrainDecl=`varying vec3 vTerrain;
uniform vec4 uLanes[4];
uniform vec4 uDrive;
uniform float uHasDrive;
uniform vec4 uPond;
uniform vec4 uShore;
uniform vec4 uBuilding;
uniform vec2 uSize;
uniform vec2 uWorldOffset;
float hash2(vec2 p){p=mod(p,2048.);vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
float laneD(vec2 p){float d=10000.;for(int i=0;i<4;i++){vec4 l=uLanes[i];if(l.w<.5)continue;float t=i<2?p.y:p.x;float c=l.x+l.y*sin(t*.0490873852)+l.z*sin(t*.0981747704);d=min(d,abs((i<2?p.x:p.y)-c));}if(uHasDrive>.5){vec2 a=p-uDrive.xy,v=uDrive.zw-uDrive.xy;d=min(d,length(a-v*clamp(dot(a,v)/max(dot(v,v),.0001),0.,1.)));}return d;}
float pondD(vec2 p){vec2 d=p-uPond.xy;float c=cos(uShore.x),s=sin(uShore.x);vec2 uv=vec2(c*d.x-s*d.y,s*d.x+c*d.y)/uPond.zw;float a=atan(uv.y,uv.x),ph=uShore.y;float r=1.+uShore.z*(.60*sin(3.*a+ph)+.28*sin(5.*a-ph*.7)+.12*sin(9.*a+ph*1.7));return length(uv)/r;}
`;
function groundMaterial(f){
 const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 m.onBeforeCompile=s=>{
  s.uniforms.uLanes={value:f.roads.map(l=>new T.Vector4(l.edge,l.amplitude,l.harmonic,l.enabled?1:0))};
  const d=f.driveway;
  s.uniforms.uDrive={value:d?new T.Vector4(d.x1,d.z1,d.x2,d.z2):new T.Vector4(0,0,1,1)};
  s.uniforms.uHasDrive={value:d?1:0};
  s.uniforms.uPond={value:new T.Vector4(f.cx,f.cz,f.rx,f.rz)};
  s.uniforms.uShore={value:new T.Vector4(f.angle,f.shorePhase,f.shoreAmplitude,f.type==='pond'?1:0)};
  s.uniforms.uBuilding={value:new T.Vector4(f.cx,f.cz,f.buildingAngle||0,f.type==='building'?1:0)};
  const [w,depth]=buildingSize(f);
  s.uniforms.uSize={value:new T.Vector2(w/2,depth/2)};
  s.uniforms.uWorldOffset={value:new T.Vector2(periodOrigin(f.x),periodOrigin(f.z))};
  s.vertexShader='varying vec3 vTerrain;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');
  // Keep this newline: Three's shader begins with a preprocessor directive.
  s.fragmentShader=terrainDecl+'\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=vTerrain.xz,g=p+uWorldOffset,q=p+mod(uWorldOffset,2048.);
   float broad=noise2(g*.125),soilPatch=noise2(g*.5),clods=noise2(q*5.);
   float fineFade=1.-smoothstep(.004,.035,length(fwidth(q)));
   float grain=(noise2(q*43.)*.56+noise2(q*97.)*.44-.5)*fineFade;
   float rd=laneD(p);
   float brokenEdge=(noise2(q*11.)-.5)*.082+(noise2(q*3.)-.5)*.10;
   float halfWidth=.235+(noise2(g*.5)-.5)*.065;
   float rut=1.-smoothstep(halfWidth-.075,halfWidth+.065,abs(rd-.77)+brokenEdge);
   float soilTone=clamp(.43+broad*.22+(soilPatch-.5)*.26+(clods-.5)*.20+grain*.19,0.,1.);
   vec3 dirt=mix(vec3(.114,.094,.065),vec3(.237,.205,.147),soilTone);
   float stoneSpeck=smoothstep(.77,.91,noise2(q*29.))*smoothstep(.43,.69,clods)*fineFade;
   float darkGrain=smoothstep(.75,.91,noise2(q*61.))*fineFade;
   dirt+=stoneSpeck*vec3(.047,.041,.030)-darkGrain*vec3(.017,.014,.010);
   vec3 grass=mix(vec3(.090,.119,.047),vec3(.175,.199,.092),.22+broad*.44+soilPatch*.26);
   grass*=.92+clods*.12+grain*.14;
   vec3 field=mix(vec3(.250,.198,.099),vec3(.374,.299,.157),.30+broad*.40+soilPatch*.20);
   field*=.94+clods*.10+grain*.13;
   float vergeBreak=(noise2(g*.5)-.5)*.63+(clods-.5)*.18;
   vec3 base=mix(grass,field,smoothstep(1.42,2.32,rd+vergeBreak));
   float scuff=(1.-smoothstep(.28,.55,rd))*smoothstep(.65,.84,noise2(q*2.))*.23;
   base=mix(base,dirt,scuff);
   base=mix(base,dirt,rut);
   if(uBuilding.w>.5){vec2 b=p-uBuilding.xy;float c=cos(uBuilding.z),s=sin(uBuilding.z);vec2 v=abs(vec2(c*b.x-s*b.y,s*b.x+c*b.y));float e=max(v.x-uSize.x,v.y-uSize.y);base=mix(dirt,base,smoothstep(1.3,3.5,e+(clods-.5)*.19));}
   if(uShore.w>.5){
    vec3 outside=base;float pd=pondD(p);
    vec3 silt=mix(vec3(.105,.099,.077),vec3(.205,.199,.157),soilTone);
    vec3 loam=mix(vec3(.34,.313,.228),vec3(.47,.433,.321),soilTone);
    vec3 drygrass=mix(vec3(.12,.141,.067),vec3(.245,.252,.134),.26+broad*.44+soilPatch*.18);
    base=mix(silt,loam,smoothstep(.994,1.018,pd));
    base=mix(base,drygrass,smoothstep(1.032,1.075,pd));
    // Restore the actual local road/field material across the entire outer bank.
    base=mix(base,outside,smoothstep(1.31,1.44,pd));
   }
   diffuseColor.rgb=base;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   // Millimetre-scale soil relief, filtered away as a pixel covers more ground.
   // The visible wheel grooves remain the actual displaced terrain geometry.
   float soilMicroHeight=(clods*.0024+grain*.0008)*fineFade;
   vec3 soilDx=dFdx(-vViewPosition),soilDy=dFdy(-vViewPosition);
   vec3 soilRx=cross(soilDy,normal),soilRy=cross(normal,soilDx);
   float soilDet=dot(soilDx,soilRx);
   vec3 soilGradient=sign(soilDet)*(dFdx(soilMicroHeight)*soilRx+dFdy(soilMicroHeight)*soilRy);
   normal=normalize(max(abs(soilDet),.00000001)*normal-soilGradient);
  `);
 };
 m.customProgramCacheKey=()=> 'rural-ground-v5-fine-soil';
 return m;
}
function samples(step,edges){
 const values=new Set([0,64]);
 for(let n=step;n<64;n+=step)values.add(n);
 for(const edge of edges){if(!edge.enabled)continue;for(let n=0;n<=20;n++)values.add(edge.edge===0?n*.16:64-n*.16)}
 return [...values].sort((a,b)=>a-b);
}
export function makeGround(f,level){
 const step=f.type==='pond'?(level===2?1:.65):f.type==='building'?1.5:2;
 const refine=(values,a,b)=>{
  if(!f.driveway)return values;
  const set=new Set(values),spacing=level===2?.64:level===1?.40:.26;
  for(let v=Math.max(.16,Math.min(a,b)-2.1);v<Math.min(63.84,Math.max(a,b)+2.1);v+=spacing)set.add(v);
  return [...set].sort((a,b)=>a-b);
 };
 // Add samples only through each driveway's bounding region. Oblique paths
 // retain real recessed ruts instead of crossing a coarse 1.5 m triangle.
 const xs=refine(samples(step,f.roads.slice(0,2)),f.driveway?.x1,f.driveway?.x2),zs=refine(samples(step,f.roads.slice(2)),f.driveway?.z1,f.driveway?.z2),p=[],uv=[],idx=[],nx=xs.length;
 // Every vertex uses the physics height. No overlay plane or texture-only groove.
 for(const z of zs)for(const x of xs){p.push(x,surfaceHeight(x,z,f),z);uv.push(x/64,z/64)}
 for(let z=0;z<zs.length-1;z++)for(let x=0;x<nx-1;x++){const a=z*nx+x,b=a+1,c=a+nx,d=c+1;idx.push(a,c,b,b,c,d)}
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(p,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
 const mesh=new T.Mesh(geo,groundMaterial(f));
 mesh.name='sculpted-ground-and-wheel-ruts';mesh.receiveShadow=true;
 return mesh;
}

// Narrow ribbons and separately cut pinnae preserve a small, fine silhouette.
class PlantGeometry{
 constructor(){this.p=[];this.c=[]}
 tri(a,b,c,tone){this.p.push(...a,...b,...c);for(let n=0;n<3;n++)this.c.push(tone.r,tone.g,tone.b)}
 quad(a,b,c,d,tone){this.tri(a,b,c,tone);this.tri(a,c,d,tone)}
 ribbon(a,b,width,tone){const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1,wx=dz/len*width,wz=-dx/len*width;this.quad([a[0]-wx,a[1],a[2]-wz],[a[0]+wx,a[1],a[2]+wz],[b[0]+wx*.7,b[1],b[2]+wz*.7],[b[0]-wx*.7,b[1],b[2]-wz*.7],tone)}
 leaf(a,b,w,tone){const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1,m=[a[0]+dx*.43,a[1]+(b[1]-a[1])*.43+.001,a[2]+dz*.43];this.quad(a,[m[0]+dz/len*w,m[1],m[2]-dx/len*w],b,[m[0]-dz/len*w,m[1]-.001,m[2]+dx/len*w],tone)}
 finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);return g}
}
function bladeGeometry(variant=0,far=false){
 const g=new PlantGeometry(),r=random(0x417faf+variant*971),tone=new T.Color();
 const count=far?3:variant===2?8:6;
 for(let i=0;i<count;i++){
  const a=r()*TAU,x=Math.cos(a)*r()*.037,z=Math.sin(a)*r()*.037,h=.075+r()*(variant===2?.125:.092),bend=.022+r()*.064,w=.0015+r()*.0017;
  const side=[-Math.sin(a),Math.cos(a)],segments=far?2:3;
  const dry=r()<.16;
  tone.setHSL(dry?.145:.195+r()*.035,dry?.25:.32,.19+r()*.095);
  for(let k=0;k<segments;k++){
   const t=k/segments,u=(k+1)/segments,at=q=>[x+Math.cos(a)*bend*q*q,h*q,z+Math.sin(a)*bend*q*q],v1=at(t),v2=at(u);
   const left=(v,q,s)=>[v[0]+side[0]*w*s*(1-q*.94),v[1],v[2]+side[1]*w*s*(1-q*.94)];
   g.quad(left(v1,t,-1),left(v1,t,1),left(v2,u,1),left(v2,u,-1),tone);
  }
 }
 return g.finish();
}
function fernGeometry(detailed=true){
 const g=new PlantGeometry(),r=random(0x74ce18),green=new T.Color(),stem=new T.Color('#505b2f');
 const fronds=detailed?6:4,pairs=detailed?11:7;
 for(let n=0;n<fronds;n++){
  const a=n*TAU/fronds+(r()-.5)*.35,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx,len=.24+r()*.12,rise=.19+r()*.13;
  const at=t=>[dx*len*t,rise*Math.sin(t*Math.PI*.77),dz*len*t];
  for(let j=0;j<9;j++)g.ribbon(at(j/9),at((j+1)/9),.00085,stem);
  for(let j=0;j<pairs;j++){
   const t=.17+j*(.76/pairs),a0=at(t),width=.078*Math.sin(t*Math.PI)*(.84+r()*.23),sweep=.021*(1-t);
   for(const sign of [-1,1]){
    const b=[a0[0]+sx*sign*width+dx*sweep,a0[1]-.011+width*.12,a0[2]+sz*sign*width+dz*sweep];
    green.setHSL(.224+r()*.020,.36,.175+r()*.059);
    if(!detailed){g.leaf(a0,b,.007*(1-t*.5),green);continue}
    g.ribbon(a0,b,.0005,stem);
    const vx=b[0]-a0[0],vz=b[2]-a0[2];
    for(let k=1;k<=5;k++){
     const u=k/6,base=[a0[0]+vx*u,a0[1]+(b[1]-a0[1])*u,a0[2]+vz*u],pl=.0125*(1-u*.55)*(1-t*.34);
     for(const side of [-1,1]){
      const tip=[base[0]+dx*side*pl+sx*sign*.007,base[1]+.0008,base[2]+dz*side*pl+sz*sign*.007];
      g.leaf(base,tip,.0033*(1-u*.45),green);
     }
    }
    g.leaf([a0[0]+vx*.82,a0[1]+(b[1]-a0[1])*.82,a0[2]+vz*.82],b,.0025,green);
   }
  }
 }
 return g.finish();
}
function daisyGeometry(){
 const g=new PlantGeometry(),green=new T.Color('#41542a'),white=new T.Color('#d4d1b8'),yellow=new T.Color('#b58c32');
 for(let i=0;i<5;i++){const a=i*TAU/5,base=[0,.004,0],tip=[Math.cos(a)*.034,.010,Math.sin(a)*.034];g.leaf(base,tip,.006,green)}
 const top=[.010,.109,.006];g.ribbon([0,0,0],top,.00075,green);
 for(let i=0;i<16;i++){
  const a=i*TAU/16,co=Math.cos(a),si=Math.sin(a),b=[top[0]+co*.003,top[1],top[2]+si*.003],t=[top[0]+co*.014,top[1]-.0025,top[2]+si*.014];
  g.leaf(b,t,.0018,white);
  const next=(i+1)*TAU/16;
  g.tri([top[0],top[1]+.0023,top[2]],[top[0]+co*.0044,top[1],top[2]+si*.0044],[top[0]+Math.cos(next)*.0044,top[1],top[2]+Math.sin(next)*.0044],yellow);
 }
 return g.finish();
}
const grassGeos=[bladeGeometry(0),bladeGeometry(1),bladeGeometry(2)],farGrassGeo=bladeGeometry(0,true);
const fernGeos=[fernGeometry(true),fernGeometry(false)],daisyGeo=daisyGeometry();
const plantMat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,side:T.DoubleSide});
const stoneGeo=new T.IcosahedronGeometry(1,0),stoneMat=new T.MeshStandardMaterial({color:'#77705e',roughness:1});
shared.add(plantMat);shared.add(stoneGeo);shared.add(stoneMat);
function addInstances(group,geo,mat,points,f,name){
 if(!points.length)return;
 const mesh=new T.InstancedMesh(geo,mat,points.length),tint=new T.Color();
 points.forEach((p,i)=>{
  dummy.position.set(p.x,surfaceHeight(p.x,p.z,f)+(p.y||-.003),p.z);
  dummy.rotation.set(p.tilt||0,p.a,0);
  dummy.scale.set(p.sx||p.s,p.sy||p.s,p.sz||p.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  if(p.tint!==undefined){tint.setRGB(p.tint,p.tint,p.tint);mesh.setColorAt(i,tint)}
 });
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.name=name;mesh.receiveShadow=true;
 group.add(mesh);
}
export function makeVerge(f,level){
 const group=new T.Group(),r=random(f.seed^0x11bad),grass=[],stones=[],ferns=[],daisies=[];
 group.name='fine-mixed-trackside-plants';
 const blocked=(x,z)=>{
  if(x<.08||z<.08||x>63.92||z>63.92)return true;
  if(f.type==='pond'&&pondDistance(x,z,f)<1.035)return true;
  if(f.type==='building'){const p=buildingLocal(x,z,f),[w,d]=buildingSize(f);if(Math.abs(p.x)<w/2+1.25&&Math.abs(p.z)<d/2+1.25)return true}
  return false;
 };
 const addGrass=(x,z,s,kind=0)=>{if(blocked(x,z))return;const d=roadDistance(x,z,f);if(Math.abs(d-.77)<.27)return;grass.push({x,z,s,a:r()*TAU,v:Math.floor(r()*3),tint:.82+r()*.27,lod:r(),kind})};
 const addFlower=(x,z)=>{if(blocked(x,z)||roadDistance(x,z,f)<1.22)return;daisies.push({x,z,s:.66+r()*.45,a:r()*TAU,tint:.91+r()*.11,lod:r()})};
 // Irregular clusters replace identical clumps placed at regular intervals.
 const seedLane=(point,length)=>{
  for(let t=.18;t<length-.18;t+=.21+r()*.32){
   if(r()<.11)continue;
   const median=point(t,(r()-.5)*.53);addGrass(median.x,median.z,.48+r()*.35,1);
   for(const side of [-1,1]){
    if(r()<.18)continue;
    const s=side*(1.28+r()*.65),p=point(t+(r()-.5)*.14,s);
    addGrass(p.x,p.z,.72+r()*.47);
    if(r()<.45){const q=point(t+(r()-.5)*.26,s+side*(.05+r()*.21));addGrass(q.x,q.z,.55+r()*.40)}
    if(r()<.023)addFlower(p.x+(r()-.5)*.28,p.z+(r()-.5)*.28);
   }
  }
 };
 for(const l of f.roads){if(!l.enabled)continue;seedLane((t,s)=>{const q=l.edge+laneOffset(l,t)+s;return l.axis==='x'?{x:q,z:t}:{x:t,z:q}},64)}
 if(f.driveway){const d=f.driveway,vx=d.x2-d.x1,vz=d.z2-d.z1,len=Math.hypot(vx,vz);if(len>.1)seedLane((t,s)=>({x:d.x1+vx*t/len-vz*s/len,z:d.z1+vz*t/len+vx*s/len}),len)}
 // Detached, uneven tufts soften the crop margin without filling wheel tracks.
 for(let i=0;i<1500;i++){
  const x=r()*64,z=r()*64,d=roadDistance(x,z,f);
  if(d>1.76&&d<2.50&&r()<.50)addGrass(x,z,.58+r()*.52);
  if(Math.abs(d-.77)<.24&&r()<.70&&!blocked(x,z)){
   const s=.007+r()**2*.021;
   stones.push({x,z,s,a:r()*TAU,tilt:r()*.7,sx:s*(1.15+r()*.6),sy:s*(.36+r()*.28),sz:s,y:s*.12,tint:.77+r()*.36,lod:r()});
  }
 }
 const fernAt=(x,z,scale)=>{
  if(blocked(x,z)||roadDistance(x,z,f)<1.72)return;
  if(ferns.some(p=>(p.x-x)**2+(p.z-z)**2<.20))return;
  ferns.push({x,z,s:scale,a:r()*TAU,tint:.82+r()*.24,lod:r()});
 };
 // Moist bank plants stay above water and occur in broken patches.
 if(f.type==='pond'){
  for(let i=0;i<520;i++){
   const a=r()*TAU,soilPatch=.5+.5*Math.sin(a*3+f.shorePhase),q=pondPoint(f,a,1.06+r()*.27);
   if(r()<.22+soilPatch*.58)addGrass(q.x+(r()-.5)*.11,q.z+(r()-.5)*.11,.66+r()*.52,2);
  }
  for(let i=0;i<55;i++){
   const a=r()*TAU,soilPatch=.5+.5*Math.sin(a*3+f.shorePhase+.8);
   if(r()>.12+soilPatch*.72)continue;
   const q=pondPoint(f,a,1.11+r()*.17);fernAt(q.x,q.z,.55+r()*.42);
  }
  for(let i=0;i<9;i++){const q=pondPoint(f,r()*TAU,1.24+r()*.14);if(r()<.36)addFlower(q.x,q.z)}
 }
 // Small fern colonies sit at shaded hedge/tree feet, not in exposed wheat.
 for(const shrub of f.shrubs||[]){
  if(r()>.14)continue;
  const a=r()*TAU,rad=shrub.width*shrub.scale*.41+.15;
  const x=shrub.x+Math.cos(a)*rad,z=shrub.z+Math.sin(a)*rad;
  if(roadDistance(x,z,f)<3.2)fernAt(x,z,.51+r()*.33);
 }
 for(const tree of f.trees||[]){
  if(r()>.45)continue;
  for(let i=0;i<2;i++){const a=r()*TAU,rad=(.66+r()*.64)*tree.scale;fernAt(tree.x+Math.cos(a)*rad,tree.z+Math.sin(a)*rad,.62+r()*.32)}
 }
 const near=level===0,far=level>=2;
 if(far){addInstances(group,farGrassGeo,plantMat,grass.filter(p=>p.lod<.20),f,'distant-fine-grass')}
 else{
  for(let v=0;v<3;v++)addInstances(group,grassGeos[v],plantMat,grass.filter(p=>p.v===v&&(near||p.lod<.55)),f,'fine-grass-variant-'+v);
  addInstances(group,fernGeos[near?0:1],plantMat,ferns.filter(p=>near||p.lod<.55),f,'small-feathered-ferns');
  addInstances(group,daisyGeo,plantMat,daisies.filter(p=>near||p.lod<.25),f,'rare-tiny-verge-daisies');
  addInstances(group,stoneGeo,stoneMat,stones.filter(p=>near||p.lod<.37),f,'scattered-fine-rut-gravel');
 }
 return group;
}
export const isSharedGroundResource=r=>shared.has(r);
