import {exitForField,EXIT_GLSL,transitionProgress} from './exit-route.js?v=50';
import {exitTextures} from './exit-textures.js?v=50';
import {roadGrassNoise,ROAD_NOISE_GLSL} from './road-surface.js?v=50';
import {plantCardGeometry,plantCardMaterial} from './verge-cards.js?v=50';
import {landmarkTextures} from './landmark-textures.js?v=50';
import {meadowEnvironment} from './meadow-layout.js?v=50';
import {FARM,FARM_FOOTPRINTS,FARM_MASK_GLSL,farmRoadWeight,farmFootprintDistance} from './farm-layout.js?v=50';
import {pondShapeGLSL,pondHabitat} from './lake-shape.js?v=50';
import * as T from './vendor/three.module.min.js';
import {ruralTextures} from './rural-textures.js?v=50';
import {compoundAt,shoreGrassCover,surfaceHeight,cropSample,roadDistance,roadProfile,laneOffset,pondDistance,pondPoint,pondBankPoint,pondMetrics,buildingSize,buildingLocal,periodOrigin,random} from './world.js?v=50';

const dummy=new T.Object3D(),shared=new Set(),TAU=Math.PI*2;
const terrainDecl=`varying vec3 vTerrain;
varying vec3 vCropWorld; uniform float uTime;
varying vec4 vMeadow;
varying vec4 vShoreData;
varying float vShoreGrass; varying float vTrackMud; varying float vYard; varying float vTrackRelief;
uniform float uWaterHeight;
uniform sampler2D uPatchwork; uniform sampler2D uRoadFrame;
uniform float uPatchSize;
uniform highp sampler2DArray uGroundAlbedo;
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
${ROAD_NOISE_GLSL}
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
vec4 parcelData(vec2 p){return texture2D(uPatchwork,(clamp(p,vec2(0.),vec2(64.))*((uPatchSize-1.)/64.)+.5)/uPatchSize);}
vec3 laneData(vec2 p,float edgeOffset){vec4 d=parcelData(p);return vec3(d.r*16.,d.g,d.a);}
${pondShapeGLSL}
`;
const patchTextureCache=new WeakMap(),roadFrameCache=new WeakMap();
function patchworkTexture(f,level){
 const old=patchTextureCache.get(f);if(old?.level===level)return old.texture;
 const size=level===0?512:256,data=new Uint8Array(size*size*4),frames=new Uint8Array(size*size*4),road={},crop={};
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){const x=i*64/(size-1),z=j*64/(size-1),k=(j*size+i)*4;
  roadProfile(x,z,f,road);cropSample(x,z,f,crop);data[k]=Math.round(Math.max(0,Math.min(16,road.distance))*255/16);data[k+1]=Math.round(road.rut*255);data[k+2]=(crop.crop*3+crop.angleIndex)*28;data[k+3]=Math.round(road.junction*255);
  const dist=Math.round(Math.min(16,Math.max(0,road.distance))*65535/16),along=Math.round(((road.along%64+64)%64)*65535/64);
  frames[k]=dist>>8;frames[k+1]=dist&255;frames[k+2]=along>>8;frames[k+3]=along&255;}
 const t=new T.DataTexture(data,size,size);t.name='parcel road/crop atlas';t.userData.chunkOwned=true;t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;const frame=new T.DataTexture(frames,size,size);frame.userData.chunkOwned=true;frame.magFilter=frame.minFilter=T.LinearFilter;frame.generateMipmaps=false;frame.needsUpdate=true;roadFrameCache.set(f,frame);patchTextureCache.set(f,{level,texture:t});return t;
}
const cropTime={value:0};
export function updateCropGroundTime(time){cropTime.value=time;}
function groundMaterial(f,level){
 const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1}),patch=patchworkTexture(f,level);m.userData.ownedParcelTexture=patch;
 m.onBeforeCompile=s=>{
  if(f.exit){s.uniforms.uExitOffset={value:new T.Vector2(Number(f.x)*64,Number(f.z)*64)};s.uniforms.uExitAsphalt={value:exitTextures['road-asphalt']};s.uniforms.u_transitionProgress=transitionProgress;}
  s.uniforms.uTime=cropTime;s.uniforms.uRoadFrame={value:roadFrameCache.get(f)};
  s.uniforms.uPatchwork={value:patch};s.uniforms.uPatchSize={value:patch.image.width};
  s.uniforms.uGroundAlbedo={value:ruralTextures.groundArray};
  s.uniforms.uWaterHeight={value:f.lakeY||0};
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
  s.vertexShader='varying vec3 vCropWorld; attribute float yardData; attribute float shoreGrass; attribute float trackMud; attribute float trackRelief; varying float vShoreGrass; varying float vTrackMud; varying float vYard; varying float vTrackRelief;\nvarying vec3 vTerrain;\nvarying vec4 vMeadow;\nvarying vec4 vShoreData;\n'+(f.type==='pond'?'attribute vec4 shoreData;\n':'')+(f.meadow?'attribute vec4 meadowData;\n':'')+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCropWorld=(modelMatrix*vec4(position,1.)).xyz; vTerrain=position; vShoreGrass=shoreGrass; vTrackMud=trackMud;vTrackRelief=trackRelief; vYard=yardData; vMeadow='+(f.meadow?'meadowData':'vec4(0.)')+'; vShoreData='+(f.type==='pond'?'shoreData':'vec4(0.)')+';');
  // Keep this newline: Three's shader begins with a preprocessor directive.
  s.fragmentShader=(f.exit?'uniform vec2 uExitOffset;uniform sampler2D uExitAsphalt;uniform float u_transitionProgress;\n'+EXIT_GLSL:'')+terrainDecl+'\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=vTerrain.xz,g=p+uWorldOffset,q=p+mod(uWorldOffset,2048.);
   float broad=noise2(g*.125),soilPatch=noise2(g*.5),clods=noise2(q*5.);
   vec4 roadFrame=texture2D(uRoadFrame,(clamp(p,vec2(0.),vec2(64.))*((uPatchSize-1.)/64.)+.5)/uPatchSize);
   float roadAcross=dot(roadFrame.rg,vec2(256.,1.))*255.*16./65535.;
   float roadAlong=dot(roadFrame.ba,vec2(256.,1.))*255.*64./65535.;
   float fineFade=1.-smoothstep(.004,.035,length(fwidth(q)));
   float grain=0.;if(fineFade>0.)grain=(noise2(q*43.)*.56+noise2(q*97.)*.44-.5)*fineFade;
   // Shading micro-erosion is centred on the shared recessed wheel profile.
   // The road layout stays fixed while the groove gains its requested relief.
   float roadEdgeOffset=(noise2(q*3.)-.5)*.080+(clods-.5)*.040;
   vec3 tracks=laneData(p,roadEdgeOffset);float rd=roadAcross;
   // Each pair survives intersections. Min distance is only used for the verge.
   // Fractured edges are filtered in screen space; no white paint strips.
   float erosion=0.;if(rd<2.7)erosion=(roadSimplex(q*6.)-.5)*.15+(roadVoronoi(q*18.)-.5)*.04;
   float wheelX=abs(rd-.9)+erosion,edgeAA=max(.012,length(fwidth(q))*.32);
   float rut=(1.-smoothstep(.155-edgeAA,.190+edgeAA,wheelX));
   rut=max(rut,tracks.y*tracks.z*.82);rut*=1.-smoothstep(1.75,2.1,rd);
   float berm=.04*exp(-pow((wheelX-.215)/.065,2.)*2.);
   float grooveHeight=-.10*rut+berm;
   float treadPhase=roadAlong*4.+abs(rd-.9)*6.928;
   float treadWidth=max(.04,fwidth(treadPhase)*.8);
   float tread=(1.-smoothstep(.11,.11+treadWidth,abs(fract(treadPhase)-.5)))*rut*fineFade;
   float soilTone=clamp(.43+broad*.22+(soilPatch-.5)*.26+(clods-.5)*.20+grain*.19,0.,1.);
   vec3 dirt=mix(vec3(.114,.094,.065),vec3(.237,.205,.147),soilTone);
   float stoneSpeck=0.,darkGrain=0.;if(fineFade>0.){stoneSpeck=smoothstep(.77,.91,noise2(q*29.))*smoothstep(.43,.69,clods)*fineFade;darkGrain=smoothstep(.75,.91,noise2(q*61.))*fineFade;}
   dirt+=stoneSpeck*vec3(.047,.041,.030)-darkGrain*vec3(.017,.014,.010);
   vec3 grass=mix(vec3(.082,.111,.041),vec3(.166,.191,.079),.22+broad*.44+soilPatch*.26);
   grass*=.92+clods*.12+grain*.14;
   // Three resident albedo samples, shared across all streamed tiles. The
   // authoritative rut mask still blends surfaces: no photographed road strips.
   vec3 soilAlbedo=texture(uGroundAlbedo,vec3(q*.25,0.)).rgb;
   vec3 pathAlbedo=texture(uGroundAlbedo,vec3(q*.5,1.)).rgb;
   vec3 turfAlbedo=texture(uGroundAlbedo,vec3(q*.5,2.)).rgb;
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
   float cropCode=floor(texture2D(uPatchwork,(floor(clamp(p,vec2(0.),vec2(64.))*(uPatchSize-1.)/64.+.5)+.5)/uPatchSize).b*255./28.+.5),cropKind=floor(cropCode/3.),cropAngle=mod(cropCode,3.)*.7853981634;
   vec2 rowN=vec2(cos(cropAngle),sin(cropAngle));
   float rowPhase=dot(q,rowN),rowLines=.5+.5*cos(rowPhase*20.94);
   if(cropKind>1.5){
    field=soilAlbedo*vec3(.84,.77,.65)*(.84+soilPatch*.15);
    float straw=(1.-smoothstep(.04,.14,abs(fract(dot(q,rowN)/.30)-.5)))*smoothstep(.38,.65,noise2(q*5.));
    float litter=smoothstep(.64,.81,noise2(q*12.))*smoothstep(.32,.65,noise2(q*.65));
    field=mix(field,vec3(.30,.245,.148),straw*.31+litter*.44);
   }
   // The same ground carries distant wheat; no raised, z-fighting canopy.
   float cropRange=length(vCropWorld.xz-cameraPosition.xz);
   float farCrop=smoothstep(15.,25.,cropRange)*(1.-step(1.5,cropKind));
   float wheatWave=.5+.5*sin(dot(q,vec2(.22,.17))-uTime*1.3+noise2(q*.11)*2.);
   // Dense canopy coverage reaches 100% BEFORE the last physical cards fade.
   // Low-frequency maturity and filtered seed-head flecks replace bare dirt;
   // no extra field meshes, instance uploads, or distant alpha overdraw.
   float headAA=1.-smoothstep(.05,.25,length(fwidth(q)));
   float canopyHeads=(noise2(q*8.)-.5)*headAA;
   float maturity=clamp(.30+broad*.40+noise2(g*.025)*.22,0.,1.);
   vec3 cropGold=mix(vec3(.245,.148,.037),vec3(.435,.294,.090),maturity);
   cropGold*=.88+wheatWave*.17+canopyHeads*.20;
   if(cropKind>.5)cropGold*=vec3(.86,.87,.77);
   field=mix(field,cropGold,farCrop);
   float vergeBreak=(noise2(g*.5)-.5)*.63+(clods-.5)*.18;
   float roadExtent=1.-smoothstep(1.55,2.25,rd+vergeBreak);
   float brokenMask=smoothstep(.45,.55,roadSimplex(q*1.7)*.7+roadSimplex(q*5.1+19.)*.3);
   brokenMask*=1.-smoothstep(.03,.18,rut);brokenMask*=1.-tracks.z*.78;
   vec3 roadSoil=mix(soilAlbedo,pathAlbedo,.56)*vec3(.90,.79,.59)*(.89+soilPatch*.18);
   vec3 roadGrass=mix(grass*.68,turfAlbedo*vec3(.48,.56,.36),.40);
   vec3 roadBase=mix(roadSoil,roadGrass,brokenMask*.67);
   vec3 base=mix(field,roadBase,roadExtent);
   // A vertex-sampled ecological field adds no fragment texture fetches.
   float meadowCover=smoothstep(.06,.76,vMeadow.x);
   vec3 meadowGrass=mix(grass*vec3(1.05,.96,.83),grass*vec3(.88,1.06,.91),vMeadow.y);
   meadowGrass*=.91+vMeadow.w*.15;
   float meadowLitter=smoothstep(.32,.70,1.-vMeadow.w)*(.20+clods*.35);
   meadowGrass=mix(meadowGrass,soilAlbedo*vec3(.80,.73,.57),meadowLitter);
   base=mix(base,meadowGrass,meadowCover);
   base=mix(base,grass*vec3(.94,1.035,.96),smoothstep(.04,.75,vShoreGrass));
   float scuff=(1.-smoothstep(.30,1.45,rd))*smoothstep(.57,.80,noise2(q*1.8))*.36;
   scuff=max(scuff,tracks.z*(.54+soilPatch*.35));
   base=mix(base,roadSoil,scuff*roadExtent);
   vec3 compacted=roadSoil*vec3(.54,.52,.48)*(1.-tread*.12);
   base=mix(base,compacted,rut);
   base=mix(base,dirt*vec3(.57,.56,.50),vTrackMud*(.75+soilPatch*.25));
   base=mix(base,dirt*vec3(.76,.72,.66),vYard*(.90+soilPatch*.10));
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
    // Height + final geometric slope, not a constant-width distance outline.
    float h=vTerrain.y-uWaterHeight;
    vec3 terrainN=normalize(cross(dFdx(vTerrain),dFdy(vTerrain)));
    float slope=length(terrainN.xz)/max(.035,abs(terrainN.y));
    float lowSlope=1.-clamp(slope*2.8,0.,1.);
    float shoreGate=1.-smoothstep(12.,25.,max(0.,vShoreData.x));
    float beach=smoothstep(-.20,.13,h)*(1.-smoothstep(.34,.63,h))*lowSlope*shoreGate;
    float wet=smoothstep(-.16,.02,h)*(1.-smoothstep(.14,.48,h))*lowSlope*shoreGate;
    vec3 sediment=texture(uGroundAlbedo,vec3(q*.5,4.)).rgb*(.83+soilPatch*.20);
    float wetDark=(1.-smoothstep(-.1,.19,h))*.20;
    sediment*=1.-wetDark;
    float rockMask=clamp(vShoreData.y*.80+smoothstep(.23,.85,slope)*shoreGate,0.,1.);
    // Blended triplanar projection preserves detail without axis-switch seams.
    vec3 triWeights=pow(abs(terrainN),vec3(4.));triWeights/=max(.001,triWeights.x+triWeights.y+triWeights.z);
    vec3 rock=(texture(uGroundAlbedo,vec3(vec2(q.y,vTerrain.y)*.32,3.)).rgb*triWeights.x+
      texture(uGroundAlbedo,vec3(q*.32,3.)).rgb*triWeights.y+
      texture(uGroundAlbedo,vec3(vec2(q.x,vTerrain.y)*.32,3.)).rgb*triWeights.z)*(.82+soilPatch*.16);
    float underwater=1.-smoothstep(-.025,.025,h);
    base=mix(base,sediment,underwater);
    base=mix(base,sediment,beach*.94);
    base=mix(base,mix(sediment,grass,.60),wet*.60);
    base=mix(base,rock,rockMask*shoreGate*(1.-smoothstep(.85,1.7,h)));

   }
   if(uFarm.z>.5){
    float e=farmYard(p),edge=(soilPatch-.5)*1.7+(broad-.5)*1.1+(clods-.5)*.25;
    float yard=1.-smoothstep(.35,3.4,e+edge);
    base=mix(base,dirt*(.94+soilPatch*.08)+grain*.004,yard);
   }
   ${f.exit?`vec4 exitQ=exitField(p+uExitOffset);
   float exitUrban=exitEase(.28,.72,exitQ.x),exitCrop=exitEase(.24,.76,exitQ.x)*exitQ.z;
   float exitRoad=(1.-smoothstep(exitQ.w-.25,exitQ.w+.48+(soilPatch-.5)*.5,exitQ.y))*exitQ.z;
   float exitPatch=smoothstep(.30,.70,soilPatch*.55+broad*.45);
   float exitWear=smoothstep(exitPatch-.28,exitPatch+.18,exitUrban)*exitEase(.22,.35,exitQ.x);
   vec3 exitAsphalt=texture2D(uExitAsphalt,(p+uExitOffset)/3.).rgb;
   vec3 waste=soilAlbedo*vec3(.68,.64,.57)*(1.-clods*.12);
   base=mix(base,waste,exitCrop*(1.-exitRoad));
   base=mix(base,base*vec3(.67,.60,.48),exitRoad*exitEase(.03,.30,exitQ.x)*brokenMask*(1.-exitUrban)*.42);
   base=mix(base,exitAsphalt,exitRoad*exitWear);
   base*=1.-.008*u_transitionProgress*exitQ.z;`:''}
   diffuseColor.rgb=base;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   // Millimetre-scale soil relief, filtered away as a pixel covers more ground.
   // The visible wheel grooves remain the actual displaced terrain geometry.
   float cropBump=farCrop*smoothstep(2.3,3.1,rd)*(1.-meadowCover)*(1.-vShoreGrass)*(1.-vYard);
   float soilMicroHeight=(clods*.0018+grain*.0006+soilDetail*.0060)*fineFade+cropBump*wheatWave*.016 + (grooveHeight-vTrackRelief)*roadExtent-tread*.009;
   ${f.exit?`soilMicroHeight*=1.-exitRoad*exitUrban;`:""}
   vec3 soilDx=dFdx(-vViewPosition),soilDy=dFdy(-vViewPosition);
   vec3 soilRx=cross(soilDy,normal),soilRy=cross(normal,soilDx);
   float soilDet=dot(soilDx,soilRx);
   vec3 soilGradient=sign(soilDet)*(dFdx(soilMicroHeight)*soilRx+dFdy(soilMicroHeight)*soilRy);
   normal=normalize(max(abs(soilDet),.00000001)*normal-soilGradient);
  `);
 };
 m.customProgramCacheKey=()=> 'exit-v48-'+!!f.exit+'-'+!!f.meadow+'-'+(f.type==='pond');
 return m;
}
function samples(step,edges){
 const values=new Set([0,64]);
 for(let n=step;n<64;n+=step)values.add(n);
 for(const edge of edges){if(!edge.enabled)continue;for(let n=0;n<=20;n++)values.add(edge.edge===0?n*.16:64-n*.16)}
 return [...values].sort((a,b)=>a-b);
}
const groundGeometryCache=new WeakMap();
export function terrainGeometry(f,level){
 const old=groundGeometryCache.get(f);if(old?.level===level)return old.geo;
 const roadStep=[.5,1,2][level],step=(f.type==='pond'?1:2)*[1,2,4][level],n=64/step,cells=new Uint8Array(n*n),sample={};
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=(i+.5)*step,z=(j+.5)*step;roadProfile(x,z,f,sample);cells[j*n+i]=sample.distance<2.1||sample.rut>.01?1:0;
 }
 const positions=[],tex=[],indices=[],lookup=new Map(),coordinates=[];
 const vertex=(x,z)=>{const key=x+','+z;let i=lookup.get(key);if(i!==undefined)return i;i=positions.length/3;lookup.set(key,i);let y=surfaceHeight(x,z,f);

 positions.push(x,y,z);tex.push(x/64,z/64);coordinates.push([x,z]);return i;};
 const tri=(a,b,c)=>indices.push(vertex(...a),vertex(...b),vertex(...c));
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=i*step,z=j*step,refined=cells[j*n+i],div=refined?Math.round(step/roadStep):1,h=step/div;
  if(refined){for(let b=0;b<div;b++)for(let a=0;a<div;a++){
   const xx=x+a*h,zz=z+b*h;
   if(h>.5&&(xx===0||zz===0||xx+h===64||zz+h===64)){
    const ring=[],edge=(ax,az,bx,bz,boundary)=>{const n=boundary?h/.5:1;for(let k=0;k<n;k++)ring.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n]);};
    edge(xx,zz,xx,zz+h,xx===0);edge(xx,zz+h,xx+h,zz+h,zz+h===64);edge(xx+h,zz+h,xx+h,zz,xx+h===64);edge(xx+h,zz,xx,zz,zz===0);
    for(let k=0;k<ring.length;k++)tri([xx+h/2,zz+h/2],ring[k],ring[(k+1)%ring.length]);
   }else{tri([xx,zz],[xx,zz+h],[xx+h,zz]);tri([xx+h,zz],[xx,zz+h],[xx+h,zz+h]);}
  }continue;}
  // Stitch a coarse cell to a refined neighbor with an edge fan; no T junctions.
  const around=[];
  const edge=(ax,az,bx,bz,fine)=>{const boundary=ax===bx&&(ax===0||ax===64)||az===bz&&(az===0||az===64),count=boundary?step/.5:fine?Math.round(step/roadStep):1;for(let k=0;k<count;k++)around.push([ax+(bx-ax)*k/count,az+(bz-az)*k/count]);};
  edge(x,z,x,z+step,i===0||cells[j*n+i-1]);edge(x,z+step,x+step,z+step,j===n-1||cells[(j+1)*n+i]);edge(x+step,z+step,x+step,z,i===n-1||cells[j*n+i+1]);edge(x+step,z,x,z,j===0||cells[(j-1)*n+i]);
  if(around.length===4){tri(around[0],around[1],around[3]);tri(around[3],around[1],around[2]);}
  else for(let k=0;k<around.length;k++)tri([x+step/2,z+step/2],around[k],around[(k+1)%around.length]);
 }
 const p=new Float32Array(positions),uv=new Float32Array(tex),idx=new (positions.length/3>65535?Uint32Array:Uint16Array)(indices);
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.BufferAttribute(p,3));
 geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 const yardData=new Float32Array(coordinates.length),trackMud=new Float32Array(coordinates.length),trackRelief=new Float32Array(coordinates.length),roadSample={};
 for(let i=0;i<coordinates.length;i++){const [x,z]=coordinates[i];roadProfile(x,z,f,roadSample);yardData[i]=roadSample.yard||0;trackMud[i]=roadSample.mud||0;trackRelief[i]=roadSample.relief||0;}
 geo.setAttribute('trackRelief',new T.BufferAttribute(trackRelief,1));geo.setAttribute('yardData',new T.BufferAttribute(yardData,1));geo.setAttribute('trackMud',new T.BufferAttribute(trackMud,1));
 geo.setAttribute('shoreGrass',new T.Float32BufferAttribute(coordinates.map(([x,z])=>shoreGrassCover(x,z,f)),1));
 if(f.type==='pond'){const data=new Float32Array(coordinates.length*4),m={};let n=0;for(const [x,z] of coordinates){pondHabitat(x,z,f,m);data[n++]=m.metres;data[n++]=m.rock;data[n++]=m.sediment;data[n++]=m.wetland}geo.setAttribute('shoreData',new T.BufferAttribute(data,4));}

 if(f.meadow){const data=new Float32Array(coordinates.length*4),sample={};let n=0;for(const [x,z] of coordinates){meadowEnvironment(x,z,f.meadow,sample);data[n++]=sample.cover;data[n++]=sample.moisture;data[n++]=sample.shade;data[n++]=sample.patchDensity;}geo.setAttribute('meadowData',new T.BufferAttribute(data,4));}
 geo.setIndex(new T.BufferAttribute(idx,1));geo.computeVertexNormals();
 {const normal=geo.attributes.normal.array;let n=0;for(const [x,z] of coordinates){const drive=x>0&&x<64&&z>0&&z<64,dx=(surfaceHeight(x+.12,z,f,drive)-surfaceHeight(x-.12,z,f,drive))/.24,dz=(surfaceHeight(x,z+.12,f,drive)-surfaceHeight(x,z-.12,f,drive))/.24,len=Math.hypot(dx,1,dz);normal[n++]=-dx/len;normal[n++]=1/len;normal[n++]=-dz/len}}
 geo.computeBoundingBox();geo.computeBoundingSphere();
 groundGeometryCache.set(f,{level,geo});return geo;
}
export function makeGround(f,level){
 const geo=terrainGeometry(f,level);
 const mesh=new T.Mesh(geo,groundMaterial(f,level));
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
function addTurfInstances(group,geo,points,f,name,material=plantMat){
 const count=points.length/6;if(!count)return;
 const mesh=new T.InstancedMesh(geo,material,count),tint=new T.Color();
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
export function makeVerge(f,level,wind){
 const group=new T.Group(),r=random(f.seed^0x11bad),grass=[[],[],[]],stones=[],ferns=[],daisies=[],road={};
 const near=level===0,far=level>=2,worldX=periodOrigin(f.x)%2048,worldZ=periodOrigin(f.z)%2048;
 const size=buildingSize(f),halfW=size[0]/2,halfD=size[1]/2,co=Math.cos(f.buildingAngle||0),si=Math.sin(f.buildingAngle||0);
 group.name='dense-fine-trackside-turf';
 const blocked=(x,z)=>{
  const e=exitForField(x,z,f,{});if(e.active&&(e.progress>.42&&e.distance<e.halfWidth+12||e.progress>.87&&e.distance<55))return true;
  if(f.compounds?.length){const a=compoundAt(x,z,f,{});if(a.footprint<.5||a.yard>.04)return true;}
  if(farmFootprintDistance(x,z,f)<.4)return true;
  if(x<.08||z<.08||x>63.92||z>63.92)return true;
  if(f.type==='pond'&&pondMetrics(x,z,f).metres<.38)return true;
  if(f.type==='building'){const dx=x-f.cx,dz=z-f.cz;if(Math.abs(co*dx-si*dz)<halfW+1.25&&Math.abs(si*dx+co*dz)<halfD+1.25)return true}
  return false;
 };
 const addGrass=(x,z,s,kind=0)=>{
  if(blocked(x,z))return;roadProfile(x,z,f,road);if(road.rut>.035||road.yard>.04)return;
  if(road.distance<1.6&&roadGrassNoise(x+worldX,z+worldZ)<.52)return;
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
 for(let z=.08;z<64;z+=spacing)for(let x=.08;x<64;x+=spacing){
  const xx=x+(r()-.5)*spacing*.8,zz=z+(r()-.5)*spacing*.8;roadProfile(xx,zz,f,road);
  if(road.distance<2.32&&road.rut<.035)addGrass(xx,zz,.75+r()*.32);
 }
 // Detached, uneven tufts soften the crop margin without filling wheel tracks.
 for(let i=0;i<1500;i++){
  const x=r()*64,z=r()*64,d=roadDistance(x,z,f);
  if(d>1.76&&d<2.50&&r()<.50)addGrass(x,z,.58+r()*.52);
  if(Math.abs(d-.9)<.24&&r()<.70&&!blocked(x,z)){
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
 // Independent stream leaves all original arrival vegetation draws untouched.
 if(f.roadLakes?.length){const sr=random(f.seed^0x357b19),step=near?.62:far?1.4:.95;
  for(let z=.1;z<64;z+=step)for(let x=.1;x<64;x+=step){const px=x+(sr()-.5)*step*.9,pz=z+(sr()-.5)*step*.9,c=shoreGrassCover(px,pz,f);if(c<.05||sr()>c*.84||blocked(px,pz))continue;roadProfile(px,pz,f,road);if(road.rut>.035||road.yard>.04)continue;
   grass[far?0:Math.floor(sr()*3)].push(px,pz,.68+sr()*.62,sr()*TAU,.80+sr()*.27,.85+sr()*.42);
  }
 }
 const photo=plantCardMaterial(wind);
 // Same positions, rut/shore masks and clump distribution; four real triangles.
 for(let v=0;v<3;v++){
  const points=grass[v],parts=[[],[]];
  for(let i=0;i<points.length;i+=6){const patch=turfNoise((points[i]+worldX)*.22,(points[i+1]+worldZ)*.22);const k=patch>.63?1:0;parts[k].push(...points.slice(i,i+6));}
  for(let k=0;k<2;k++)addTurfInstances(group,plantCardGeometry([0,1,2,0,0,1][v*2+k]),parts[k],f,'photographic-trackside-grass-'+v+'-'+k,photo);
 }
 if(!far){
  addInstances(group,plantCardGeometry(4),photo,ferns.filter(p=>near||p.lod<.55),f,'photographic-shade-ferns');
  addInstances(group,daisyGeo,plantMat,daisies.filter(p=>near||p.lod<.25),f,'rare-tiny-verge-daisies');
  addInstances(group,stoneGeo,stoneMat,stones.filter(p=>near||p.lod<.37),f,'scattered-fine-rut-gravel');
 }
 return group;
}
export const isSharedGroundResource=r=>shared.has(r);

export function snapshotGround(f,level){
 const g=groundGeometryCache.get(f)?.geo,t=patchTextureCache.get(f)?.texture;if(!g||!t)return null;
 return {level,attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,{array:a.array,itemSize:a.itemSize}])),index:g.index.array,frame:{data:roadFrameCache.get(f).image.data,width:t.image.width,height:t.image.height},patch:{data:t.image.data,width:t.image.width,height:t.image.height}};
}
export function restoreGround(f,cached){
 if(!cached)return;const geo=new T.BufferGeometry();for(const [k,a]of Object.entries(cached.attributes))geo.setAttribute(k,new T.BufferAttribute(a.array,a.itemSize));geo.setIndex(new T.BufferAttribute(cached.index,1));geo.computeBoundingBox();geo.computeBoundingSphere();groundGeometryCache.set(f,{level:cached.level,geo});
 const rf=cached.frame;if(!rf)return;const rt=new T.DataTexture(rf.data,rf.width,rf.height);rt.userData.chunkOwned=true;rt.magFilter=rt.minFilter=T.LinearFilter;rt.generateMipmaps=false;rt.needsUpdate=true;roadFrameCache.set(f,rt);
 const p=cached.patch,t=new T.DataTexture(p.data,p.width,p.height);t.name='parcel road/crop atlas';t.userData.chunkOwned=true;t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;patchTextureCache.set(f,{level:cached.level,texture:t});
}
