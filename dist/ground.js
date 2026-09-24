import {landmarkTextures} from './landmark-textures.js?v=31';
import {meadowEnvironment} from './meadow-layout.js?v=31';
import {FARM,FARM_FOOTPRINTS,FARM_MASK_GLSL,farmRoadWeight,farmFootprintDistance} from './farm-layout.js?v=31';
import {pondShapeGLSL} from './lake-shape.js?v=31';
import * as T from './vendor/three.module.min.js';
import {ruralTextures} from './rural-textures.js?v=31';
import {surfaceHeight,roadDistance,roadProfile,laneOffset,pondDistance,pondPoint,pondBankPoint,pondMetrics,buildingSize,buildingLocal,periodOrigin,random} from './world.js?v=31';

const dummy=new T.Object3D(),shared=new Set(),TAU=Math.PI*2;
const terrainDecl=`varying vec3 vTerrain;
varying vec4 vMeadow;
uniform sampler2D uRuralSoil;
uniform sampler2D uRuralPath;
uniform sampler2D uRuralTurf;
uniform vec4 uLanes[4];
uniform vec4 uDrive;
uniform float uHasDrive;
uniform vec4 uPond;
uniform vec4 uShore;
uniform vec4 uBuilding;
uniform vec2 uSize;
uniform vec2 uWorldOffset;
uniform vec3 uFarm;
uniform vec4 uFarmBuildings[6];
uniform vec2 uFarmSizes[6];
${FARM_MASK_GLSL}
float farmRoadMask(vec2 p){
 return uFarm.z<.5?1.:1.-farmMaskAt(p+uFarm.xy);
}
float farmYard(vec2 p){
 float dist=10000.;vec2 q=p+uFarm.xy;
 for(int i=0;i<6;i++){vec4 b=uFarmBuildings[i];vec2 d=q-b.xy;float c=cos(b.z),s=sin(b.z);vec2 e=abs(vec2(c*d.x-s*d.y,s*d.x+c*d.y))-uFarmSizes[i];dist=min(dist,length(max(e,vec2(0.)))+min(max(e.x,e.y),0.));}return dist;
}

float hash2(vec2 p){p=mod(p,2048.);vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
void pathData(float d,float t,float weight,float edgeOffset,inout vec4 info){
 if(weight<=0.)return;
 info.x=min(info.x,d+(1.-weight)*2.6);
 if(d>2.65)return;
 float phase=t*.0981747704;
 float offset=.77+.020*sin(phase*5.)+.012*sin(phase*11.);
 float width=.235+.022*sin(phase*3.)+.012*sin(phase*7.);
 float wheel=(1.-smoothstep(width*.42,width+.075,abs(d-offset)+edgeOffset))*weight;
 info.y=max(info.y,wheel);
 float cover=(1.-smoothstep(.86,1.80,d))*weight;
 if(cover>info.z){info.w=info.z;info.z=cover;}else info.w=max(info.w,cover);
}
vec3 laneData(vec2 p,float edgeOffset){
 vec4 info=vec4(10000.,0.,0.,0.);
 for(int i=0;i<4;i++){
  vec4 l=uLanes[i];if(l.w<.5)continue;
  float t=i<2?p.y:p.x;
  float c=l.x+l.y*sin(t*.0490873852)+l.z*sin(t*.0981747704);
  pathData(abs((i<2?p.x:p.y)-c),t,farmRoadMask(p),edgeOffset,info);
 }
 if(uHasDrive>.5){
  vec2 a=p-uDrive.xy,v=uDrive.zw-uDrive.xy;float len=max(length(v),.01);
  float t=dot(a,v)/len,across=abs(a.x*v.y-a.y*v.x)/len;
  float corridor=smoothstep(-4.6,-2.2,t)*(1.-smoothstep(len-.04,len+.72,t));
  float boundary=smoothstep(0.,.24,min(min(p.x,p.y),min(64.-p.x,64.-p.y)));
  info.x=min(info.x,across+(1.-corridor)*3.8);
  pathData(across,t,corridor*boundary*smoothstep(-1.6,3.4,t),edgeOffset,info);
 }
 return vec3(info.x,info.y,info.w);
}
${pondShapeGLSL}
`;
function groundMaterial(f){
 const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 m.onBeforeCompile=s=>{
  s.uniforms.uRuralSoil={value:ruralTextures.soil};
  s.uniforms.uRuralPath={value:ruralTextures.path};
  s.uniforms.uRuralTurf={value:ruralTextures.turf};
  s.uniforms.uFarm={value:new T.Vector3(f.farm?.x||0,f.farm?.z||0,f.farm?1:0)};
  s.uniforms.uFarmBuildings={value:FARM_FOOTPRINTS.map(p=>new T.Vector4(p.x,p.z,p.angle,0))};
  s.uniforms.uFarmSizes={value:FARM_FOOTPRINTS.map(p=>new T.Vector2(p.hx,p.hz))};
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
  s.vertexShader='varying vec3 vTerrain;\nvarying vec4 vMeadow;\n'+(f.meadow?'attribute vec4 meadowData;\n':'')+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position; vMeadow='+(f.meadow?'meadowData':'vec4(0.)')+';');
  // Keep this newline: Three's shader begins with a preprocessor directive.
  s.fragmentShader=terrainDecl+'\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=vTerrain.xz,g=p+uWorldOffset,q=p+mod(uWorldOffset,2048.);
   float broad=noise2(g*.125),soilPatch=noise2(g*.5),clods=noise2(q*5.);
   float fineFade=1.-smoothstep(.004,.035,length(fwidth(q)));
   float grain=0.;if(fineFade>0.)grain=(noise2(q*43.)*.56+noise2(q*97.)*.44-.5)*fineFade;
   // At most 6 cm of irregular soil at the rut edge; the authoritative recessed
   // wheel geometry and collision height are unchanged. Integer noise scales
   // preserve the same color at the repeating world-coordinate boundary.
   float roadEdgeOffset=(noise2(q*3.)-.5)*.080+(clods-.5)*.040;
   vec3 tracks=laneData(p,roadEdgeOffset);float rd=tracks.x;
   // Each pair survives intersections. Min distance is only used for the verge.
   float edgeBreak=(noise2(q*11.)-.5)*.13+(clods-.5)*.11;
   float rut=smoothstep(.015,.97,clamp(tracks.y+edgeBreak*tracks.y*(1.-tracks.y)*4.,0.,1.));
   float soilTone=clamp(.43+broad*.22+(soilPatch-.5)*.26+(clods-.5)*.20+grain*.19,0.,1.);
   vec3 dirt=mix(vec3(.114,.094,.065),vec3(.237,.205,.147),soilTone);
   float stoneSpeck=0.,darkGrain=0.;if(fineFade>0.){stoneSpeck=smoothstep(.77,.91,noise2(q*29.))*smoothstep(.43,.69,clods)*fineFade;darkGrain=smoothstep(.75,.91,noise2(q*61.))*fineFade;}
   dirt+=stoneSpeck*vec3(.047,.041,.030)-darkGrain*vec3(.017,.014,.010);
   vec3 grass=mix(vec3(.082,.111,.041),vec3(.166,.191,.079),.22+broad*.44+soilPatch*.26);
   grass*=.92+clods*.12+grain*.14;
   // Three resident albedo samples, shared across all streamed tiles. The
   // authoritative rut mask still blends surfaces: no photographed road strips.
   vec3 soilAlbedo=texture2D(uRuralSoil,q*.25).rgb;
   vec3 pathAlbedo=texture2D(uRuralPath,q*.5).rgb;
   vec3 turfAlbedo=texture2D(uRuralTurf,q*.5).rgb;
   float soilDetail=dot(soilAlbedo,vec3(.2126,.7152,.0722));
   float materialDetail=.30+.70*fineFade;
   dirt=mix(dirt,mix(soilAlbedo,pathAlbedo,rut)*(.92+soilPatch*.16),.72*materialDetail);
   grass*=mix(1.,clamp(.60+dot(turfAlbedo,vec3(.2126,.7152,.0722))*3.,.65,1.38),materialDetail);
   grass=mix(grass,turfAlbedo,.22*materialDetail);
   // Exposed earth beneath wheat is the brown soil albedo itself. V9 only
   // multiplied a yellow canopy-like field color by texture luminance, which
   // lost both its brown hue and its granular contrast. Mipmaps handle distance;
   // do not fade back to that yellow base when the camera covers more ground.
   vec3 field=soilAlbedo*vec3(.86,.80,.74)*(.91+broad*.14+(soilPatch-.5)*.08);
   float vergeBreak=(noise2(g*.5)-.5)*.63+(clods-.5)*.18;
   vec3 base=mix(grass,field,smoothstep(1.42,2.32,rd+vergeBreak));
   // A vertex-sampled ecological field adds no fragment texture fetches.
   float meadowCover=smoothstep(.06,.76,vMeadow.x);
   vec3 meadowGrass=mix(grass*vec3(1.05,.96,.83),grass*vec3(.88,1.06,.91),vMeadow.y);
   meadowGrass*=.91+vMeadow.w*.15;
   float meadowLitter=smoothstep(.32,.70,1.-vMeadow.w)*(.20+clods*.35);
   meadowGrass=mix(meadowGrass,soilAlbedo*vec3(.80,.73,.57),meadowLitter);
   base=mix(base,meadowGrass,meadowCover);
   float scuff=(1.-smoothstep(.30,1.45,rd))*smoothstep(.57,.80,noise2(q*1.8))*.36;
   scuff=max(scuff,tracks.z*(.54+soilPatch*.35));
   base=mix(base,dirt,scuff);
   base=mix(base,dirt,rut);
// Irregular aged soil around the existing building footprint.
// Uses its existing p,g,q,dirt,base,broad,soilPatch,clods,grain and uniforms.
// The same terrain mesh and surfaceHeight remain authoritative: zero overlays,
// zero geometry, zero draw calls, zero extra texture samples, zero new uniforms.
if(uBuilding.w>.5){
 vec2 b=p-uBuilding.xy;
 float c=cos(uBuilding.z),s=sin(uBuilding.z);
 vec2 local=vec2(c*b.x-s*b.y,s*b.x+c*b.y);
 vec2 outside=abs(local)-uSize;
 float e=length(max(outside,vec2(0.)))+min(max(outside.x,outside.y),0.);
 // A broken yard edge varies over metres as well as centimetres. Its rounded
 // corners and asymmetric patches avoid the former uniform rectangular halo.
 float yardBreak=(soilPatch-.5)*1.60+(broad-.5)*1.20+(clods-.5)*.25;
 yardBreak+=sin(local.x*.43+local.y*.27)*.20;
 float yard=1.-smoothstep(.65,3.35,e+yardBreak);
 vec3 yardDirt=dirt*(.94+soilPatch*.08);
 // Exposed roof edges shed water into a narrow, incomplete darker drip zone.
 float longSide=1.-smoothstep(uSize.y-.25,uSize.y+.42,abs(local.y));
 float drip=(1.-smoothstep(.11,.48,abs(abs(local.x)-uSize.x-.39)))*longSide;
 drip*=.16+.16*smoothstep(.28,.72,clods);
 yardDirt*=1.-drip;
 // Old compacted dust and fine pale fragments collect in the surrounding soil.
 float dryDust=smoothstep(.50,.82,soilPatch)*(1.-smoothstep(.15,2.45,e));
 yardDirt+=dryDust*vec3(.014,.012,.008)+grain*vec3(.004,.003,.002);
 base=mix(base,yardDirt,yard);
}

   if(uShore.w>.5){
    vec3 outside=base;vec4 shore=pondMetricsV6(p,uPond,uShore);float bank=shore.w;
    // Preserve the resident granular loam under water. The earlier lakebed
    // overwrote it with nearly constant mud, hiding all nearby geometry.
    vec3 silt=soilAlbedo*vec3(1.36,2.00,2.80)*(.84+soilTone*.36);
    // Reuse near-field clods/specks already calculated above; no additional
    // noise octave or sampler is paid for by the water surface.
    silt+=stoneSpeck*vec3(.055,.051,.044)-darkGrain*vec3(.018,.019,.015);
    vec3 loam=mix(vec3(.34,.313,.228),vec3(.47,.433,.321),soilTone);
    vec3 drygrass=mix(vec3(.12,.141,.067),vec3(.245,.252,.134),.26+broad*.44+soilPatch*.18);
    base=mix(silt,loam,smoothstep(-.22,.55,shore.y));
    base=mix(base,drygrass,smoothstep(.11,.40,bank));
    // Restore the actual local road/field material across the entire outer bank.
    base=mix(base,outside,smoothstep(.65,1.12,bank));
   }
   if(uFarm.z>.5){
    float e=farmYard(p),edge=(soilPatch-.5)*1.7+(broad-.5)*1.1+(clods-.5)*.25;
    float yard=1.-smoothstep(.35,3.4,e+edge);
    base=mix(base,dirt*(.94+soilPatch*.08)+grain*.004,yard);
   }
   diffuseColor.rgb=base;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   // Millimetre-scale soil relief, filtered away as a pixel covers more ground.
   // The visible wheel grooves remain the actual displaced terrain geometry.
   float soilMicroHeight=(clods*.0018+grain*.0006+soilDetail*.0060)*fineFade;
   vec3 soilDx=dFdx(-vViewPosition),soilDy=dFdy(-vViewPosition);
   vec3 soilRx=cross(soilDy,normal),soilRy=cross(normal,soilDx);
   float soilDet=dot(soilDx,soilRx);
   vec3 soilGradient=sign(soilDet)*(dFdx(soilMicroHeight)*soilRx+dFdy(soilMicroHeight)*soilRy);
   normal=normalize(max(abs(soilDet),.00000001)*normal-soilGradient);
  `);
 };
 m.customProgramCacheKey=()=> 'rural-ground-v12-meadow-'+!!f.meadow;
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
 const xs=refine(samples(step,f.roads.slice(0,2)),f.driveway?.x1,f.driveway?.x2),zs=refine(samples(step,f.roads.slice(2)),f.driveway?.z1,f.driveway?.z2),nx=xs.length,nz=zs.length;
 const p=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2),idx=new (nx*nz>65535?Uint32Array:Uint16Array)((nx-1)*(nz-1)*6);
 let pi=0,ui=0,ii=0;
 // Every vertex uses the physics height. No overlay plane or texture-only groove.
 for(const z of zs)for(const x of xs){p[pi++]=x;p[pi++]=surfaceHeight(x,z,f);p[pi++]=z;uv[ui++]=x/64;uv[ui++]=z/64}
 for(let z=0;z<nz-1;z++)for(let x=0;x<nx-1;x++){const a=z*nx+x,b=a+1,c=a+nx,d=c+1;idx[ii++]=a;idx[ii++]=c;idx[ii++]=b;idx[ii++]=b;idx[ii++]=c;idx[ii++]=d}
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.BufferAttribute(p,3));
 geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 if(f.meadow){const data=new Float32Array(nx*nz*4),sample={};let n=0;for(const z of zs)for(const x of xs){meadowEnvironment(x,z,f.meadow,sample);data[n++]=sample.cover;data[n++]=sample.moisture;data[n++]=sample.shade;data[n++]=sample.patchDensity;}geo.setAttribute('meadowData',new T.BufferAttribute(data,4));}
 geo.setIndex(new T.BufferAttribute(idx,1));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
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
function bladeGeometry(variant=0,detail=0){
 const g=new PlantGeometry(),r=random(0x417faf+variant*971),tone=new T.Color(),baseTone=new T.Color(),basalTone=new T.Color();
 const far=detail>=2,count=detail===0?7:detail===1?5:4;
 for(let i=0;i<count;i++){
  const a=i*2.399963+r()*.48,rad=Math.sqrt(r())*.15,x=Math.cos(a)*rad,z=Math.sin(a)*rad,h=.12+r()*(variant===2?.16:.14),bend=.050+r()*.15,w=.0042+r()*.0030;
  const side=[-Math.sin(a),Math.cos(a)];
  const dry=r()<.10;
  tone.setHSL(dry?.145:.195+r()*.035,dry?.29:.38,.20+r()*.095);
  baseTone.copy(tone).multiplyScalar(.80);
  basalTone.copy(baseTone).multiplyScalar(.44);
  const b0=[x-side[0]*w,0,z-side[1]*w],b1=[x+side[0]*w,0,z+side[1]*w],tip=[x+Math.cos(a)*bend,h,z+Math.sin(a)*bend];
  if(far){g.tri(b0,b1,tip,tone);continue}
  const t=.57,mx=x+Math.cos(a)*bend*t*t,mz=z+Math.sin(a)*bend*t*t;
  const m0=[mx-side[0]*w*.54,h*t,mz-side[1]*w*.54],m1=[mx+side[0]*w*.54,h*t,mz+side[1]*w*.54];
  // Two triangles below the bend and one tapered tip preserve the silhouette.
  g.quad(b0,b1,m1,m0,baseTone);g.tri(m0,m1,tip,tone);
  if(detail===0||i<2){
   // Short, sprawling basal leaves fill the space between upright blades.
   // One triangle each gives real low coverage without transparent-card fill.
   const a0=a+1.15+r()*.85,dx=Math.cos(a0),dz=Math.sin(a0),length=.13+r()*.12,bw=.006+r()*.0025;
   g.tri([x-dz*bw,.004,z+dx*bw],[x+dz*bw,.004,z-dx*bw],[x+dx*length,.025+r()*.045,z+dz*length],basalTone);
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
const grassGeos=[bladeGeometry(0),bladeGeometry(1),bladeGeometry(2)],midGrassGeos=[bladeGeometry(0,1),bladeGeometry(1,1),bladeGeometry(2,1)],farGrassGeo=bladeGeometry(0,2);
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
// Dense turf uses packed numeric streams rather than thousands of point objects.
function addTurfInstances(group,geo,points,f,name){
 const count=points.length/6;if(!count)return;
 const mesh=new T.InstancedMesh(geo,plantMat,count),tint=new T.Color();
 for(let i=0,j=0;i<count;i++,j+=6){
  const x=points[j],z=points[j+1],s=points[j+2];
  dummy.position.set(x,surfaceHeight(x,z,f)-.005,z);
  dummy.rotation.set(0,points[j+3],0);dummy.scale.set(s,s*points[j+5],s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  const value=points[j+4];tint.setRGB(value,value,value);mesh.setColorAt(i,tint);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
 mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.name=name;mesh.receiveShadow=true;group.add(mesh);
}
const turfClamp=v=>Math.max(0,Math.min(1,v));
function turfHash(a,b){let n=Math.imul(a,374761393)^Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function turfNoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);
 const a=turfHash(ix,iz),b=turfHash(ix+1,iz),c=turfHash(ix,iz+1),d=turfHash(ix+1,iz+1);
 return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}
export function makeVerge(f,level){
 const group=new T.Group(),r=random(f.seed^0x11bad),grass=[[],[],[]],stones=[],ferns=[],daisies=[],road={};
 const near=level===0,far=level>=2,worldX=periodOrigin(f.x)%2048,worldZ=periodOrigin(f.z)%2048;
 const size=buildingSize(f),halfW=size[0]/2,halfD=size[1]/2,co=Math.cos(f.buildingAngle||0),si=Math.sin(f.buildingAngle||0);
 group.name='dense-fine-trackside-turf';
 const blocked=(x,z)=>{
  if(farmFootprintDistance(x,z,f)<.4)return true;
  if(x<.08||z<.08||x>63.92||z>63.92)return true;
  if(f.type==='pond'&&pondMetrics(x,z,f).metres<.38)return true;
  if(f.type==='building'){const dx=x-f.cx,dz=z-f.cz;if(Math.abs(co*dx-si*dz)<halfW+1.25&&Math.abs(si*dx+co*dz)<halfD+1.25)return true}
  return false;
 };
 const addGrass=(x,z,s,kind=0)=>{
  if(blocked(x,z))return;roadProfile(x,z,f,road);if(road.rut>.14)return;
  const lush=turfNoise((x+worldX)*.66,(z+worldZ)*.66),small=turfNoise((x+worldX)*2.5,(z+worldZ)*2.5);
  // Coherent gaps and a few flattened tufts read as trampling, not missing dots.
  const worn=turfClamp((.38-lush)*3.8)+road.junction*(.64+small*.30);
  if(r()<worn*.78||r()<.035)return;
  const bucket=far?0:Math.floor(r()*3),heightScale=.88-Math.min(.64,worn*.70);
  grass[bucket].push(x,z,s*(.90+lush*.20),r()*TAU,.85+r()*.27,heightScale);
 };
 const addFlower=(x,z)=>{if(blocked(x,z)||roadDistance(x,z,f)<1.22)return;daisies.push({x,z,s:.66+r()*.45,a:r()*TAU,tint:.91+r()*.11,lod:r()})};
 // Staggered rows form overlapping sward across the full median and shoulders.
 // Row/column jitter and coherent thin patches remove any planting-grid pattern.
 const spacing=near?.28:far?.60:.38,offsets=[-.31,-.16,.00,.16,.31,1.17,1.43,1.70,1.98,-1.17,-1.43,-1.70,-1.98];
 const seedLane=(l,drive)=>{
  const vx=drive?drive.x2-drive.x1:0,vz=drive?drive.z2-drive.z1:0,len=drive?Math.hypot(vx,vz):64;
  if(len<.1)return;
  for(let t=.10+r()*spacing;t<len-.10;t+=spacing*(.82+r()*.36)){
   const shift=(r()-.5)*.09;
   for(let i=0;i<offsets.length;i++){
    const a=t+(r()-.5)*spacing*.9,s=offsets[i]+shift+(r()-.5)*.11;
    let x,z;
    if(drive){x=drive.x1+vx*a/len-vz*s/len;z=drive.z1+vz*a/len+vx*s/len}
    else{const c=l.edge+laneOffset(l,a)+s;x=l.axis==='x'?c:a;z=l.axis==='x'?a:c}
    if(farmRoadWeight(x,z,f)<.1)continue;
    addGrass(x,z,(i<5?.90:.96)+r()*.14,i<5?1:0);
    if(i>=5&&r()<.0018)addFlower(x+(r()-.5)*.3,z+(r()-.5)*.3);
   }
  }
 };
 for(const l of f.roads)if(l.enabled)seedLane(l,null);
 if(f.driveway)seedLane(null,f.driveway);
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
  for(let i=0;i<55;i++){
   const a=r()*TAU,soilPatch=.5+.5*Math.sin(a*3+f.shorePhase+.8);
   if(r()>.12+soilPatch*.72)continue;
   const q=pondBankPoint(f,a,2+r()*4);fernAt(q.x,q.z,.55+r()*.42);
  }
  for(let i=0;i<9;i++){const q=pondBankPoint(f,r()*TAU,4+r()*3);if(r()<.36)addFlower(q.x,q.z)}
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
 // The farm's small yard turf remains separate from natural meadow vegetation.
 if(f.farm){
  const span=near?.38:far?.75:.52;
  for(let z=.2;z<64;z+=span)for(let x=.2;x<64;x+=span){
   const px=x+(r()-.5)*span*.85,pz=z+(r()-.5)*span*.85,d=farmFootprintDistance(px,pz,f);
   if(d>.45&&d<3.3&&r()<.30)addGrass(px,pz,.48+r()*.36);
  }
 }
 if(far){addTurfInstances(group,farGrassGeo,grass[0],f,'distant-dense-fine-grass')}
 else{
  for(let v=0;v<3;v++)addTurfInstances(group,(near?grassGeos:midGrassGeos)[v],grass[v],f,'dense-fine-grass-variant-'+v);
  addInstances(group,fernGeos[near?0:1],plantMat,ferns.filter(p=>near||p.lod<.55),f,'small-feathered-ferns');
  addInstances(group,daisyGeo,plantMat,daisies.filter(p=>near||p.lod<.25),f,'rare-tiny-verge-daisies');
  addInstances(group,stoneGeo,stoneMat,stones.filter(p=>near||p.lod<.37),f,'scattered-fine-rut-gravel');
 }
 return group;
}
export const isSharedGroundResource=r=>shared.has(r);
