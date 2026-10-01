// V65 spring steam. Three.js is supplied by the caller so this module has no
// external dependency and shares exactly the renderer's Three.js instance.
// Integration: call compose after opaque + water rendering, before lens/tonemap.
// Inputs and returned texture are LINEAR scene-referred colour, no tonemapping.

// Scales are linear dimensions. The default main pass has 4/9 as many pixels
// as V63's half-resolution pass; reflection has 1/4 as many pixels.
export const SPRING_VOLUME_PROFILES=Object.freeze({
 performance:Object.freeze({scale:1/3,reflectionScale:.25,raySteps:28,reflectionRaySteps:24,simulationHz:30,lightingHz:12,cullVolume:true}),
 quality:Object.freeze({scale:.4,reflectionScale:1/3,raySteps:32,reflectionRaySteps:28,simulationHz:30,lightingHz:12,cullVolume:true}),
 low:Object.freeze({scale:.25,reflectionScale:.2,raySteps:24,reflectionRaySteps:24,simulationHz:24,lightingHz:10,cullVolume:true})
});
export const VOLUME_QUALITY=Object.freeze({noiseSize:64,fieldSize:32,shadowSteps:4,...SPRING_VOLUME_PROFILES.performance});
export function resolveVolumeProfile(value='performance'){
 const input=typeof value==='string'?SPRING_VOLUME_PROFILES[value]:value;
 if(!input)throw new Error('Unknown spring volume performance profile.');
 const p={...SPRING_VOLUME_PROFILES.performance,...input};
 const clamp=(n,low,high,fallback)=>Number.isFinite(Number(n))?Math.min(high,Math.max(low,Number(n))):fallback;
 p.scale=clamp(p.scale,.2,.5,1/3);p.reflectionScale=clamp(p.reflectionScale,.15,.5,.25);
 p.raySteps=Math.round(clamp(p.raySteps,16,48,28));p.reflectionRaySteps=Math.round(clamp(p.reflectionRaySteps,16,48,24));
 p.simulationHz=clamp(p.simulationHz,10,60,30);p.lightingHz=clamp(p.lightingHz,2,60,12);p.cullVolume=!!p.cullVolume;
 return Object.freeze(p);
}
export const passVertex=`precision highp float;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;

const fieldGLSL=`
precision highp float;
precision highp sampler2D;
precision highp sampler3D;
uniform sampler2D densityField,poolMask;
uniform sampler3D noiseVolume;
uniform vec3 boundsMin,boundsMax;
uniform float time,waterY;
// 32^3 concentration/heat cells in an 8 x 4 atlas. Sampling stays inside each
// tile; two hardware-bilinear lookups interpolate the z slices continuously.
vec2 fieldUV(vec3 p,float z){
 vec2 xy=clamp(p.xy,vec2(.5/32.),vec2(31.5/32.));
 return (vec2(mod(z,8.),floor(z/8.))+xy)/vec2(8.,4.);
}
vec2 fieldAt(vec3 p){
 if(any(lessThan(p,vec3(0.)))||any(greaterThan(p,vec3(1.))))return vec2(0.);
 float z=clamp(p.z*32.-.5,0.,31.),a=floor(z),b=min(31.,a+1.);
 return mix(texture(densityField,fieldUV(p,a)).rg,texture(densityField,fieldUV(p,b)).rg,fract(z));
}
float footprint(vec3 p){return texture(poolMask,(p.xz-boundsMin.xz)/(boundsMax.xz-boundsMin.xz)).r;}
vec2 cloudNoise(vec3 p){
 // Periodic 64^3 fBm + cellular noise. Slow bulk travel and opposing fine motion
 // make coherent rolling billows; there are no billboard or sprite volumes.
 vec3 q=p*vec3(.23,.34,.23)+vec3(time*.014,-time*.025,time*.009);
 vec2 a=texture(noiseVolume,q).rg;
 vec2 b=texture(noiseVolume,q*2.07+vec3(-time*.009,time*.012,.173)).rg;
 return vec2(a.r*.73+b.r*.27,a.g*.68+b.g*.32);
}
`;

export const advectionFragment=`${fieldGLSL}
uniform float dt,initialize;
in vec2 uv;out vec4 outColor;
vec3 velocity(vec3 p,float heat){
 // Curl of a smooth, time-dependent vector potential plus buoyancy. Curl is
 // divergence-free, so lateral eddies do not simply drain the density field.
 vec3 q=p*1.75+vec3(time*.17,-time*.11,time*.13);
 float cx=cos(q.y+.8*sin(q.z)),cy=cos(q.z+.7*sin(q.x)),cz=cos(q.x+.6*sin(q.y));
 vec3 curl=vec3(.6*cos(q.y)*cz-cy,.8*cos(q.z)*cx-cz,.7*cos(q.x)*cy-cx);
 return curl*.13+vec3(.045,.075+.12*heat,0.);
}
void main(){
 vec2 pixel=floor(gl_FragCoord.xy),tile=floor(pixel/32.);
 vec3 cell=vec3(mod(pixel.x,32.),mod(pixel.y,32.),tile.x+tile.y*8.);
 vec3 local=(cell+.5)/32.,span=boundsMax-boundsMin,p=boundsMin+local*span;
 float h=p.y-waterY,mask=footprint(p);
 vec2 original=fieldAt(local);
 vec3 back=local-velocity(p,original.g)*dt/span;
 vec2 advected=fieldAt(back);
 vec2 n=cloudNoise(p);
 float billow=smoothstep(.30,.67,n.x*.72+n.y*.28);
 float base=exp(-pow((h-.25)/.37,2.))*(.12+.88*billow);
 float plume=exp(-h*1.9)*smoothstep(.48,.72,n.x*.55+n.y*.45)*.42;
 float desired=(base+plume)*mask;
 // The lowest cells continuously receive warm, humid air. Above the belt,
 // actual prior-frame density is advected, cools and dissipates.
 float injection=(1.-smoothstep(.15,.61,h))*2.8;
 float density=advected.r*exp(-dt*(.22+h*.19));
 density=mix(density,desired,1.-exp(-dt*injection));
 float heat=advected.g*exp(-dt*.38);
 heat=mix(heat,mask,1.-exp(-dt*injection*1.25));
 if(initialize>.5){density=desired;heat=mask*exp(-h*.78);}
 // Time-based cooling at soft boundaries; the exact dry area is a hard sink.
 // Applying mask*top per frame would make dissipation depend on frame rate.
 float top=1.-smoothstep(1.7,2.10,h);
 float boundary=step(.001,mask)*exp(-dt*((1.-mask)*12.+(1.-top)*5.));
 outColor=vec4(clamp(density*boundary,0.,1.),clamp(heat*boundary,0.,1.),0.,1.);
}`;

const opticalGLSL=`${fieldGLSL}
uniform sampler2D sceneDepth;
uniform mat4 inverseProjection,cameraWorld;
uniform vec3 eye;
uniform vec2 halfSize;
uniform vec4 lampPositionPower[4];
uniform vec4 lampColorRange[4];
uniform int lampCount;
uniform float extinction,densityGain;
in vec2 uv;out vec4 outColor;
const float INV_FOUR_PI=.07957747154594767;
float densityAt(vec3 p){
 vec3 q=(p-boundsMin)/(boundsMax-boundsMin);
 if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return 0.;
 float h=p.y-waterY,mask=footprint(p);
 if(mask<.005)return 0.;
 vec2 field=fieldAt(q),n=cloudNoise(p);
 // Coarse advected parcels define each billow; finer 3D noise erodes edges.
 float erosion=mix(.45,1.43,smoothstep(.28,.70,n.x*.76+n.y*.24));
 float belt=1.-smoothstep(.45,.86,h);
 float fine=texture(noiseVolume,p*.83+vec3(-time*.035,-time*.052,time*.016)).g;
 float wisps=smoothstep(.37,.70,n.x+fine*.14)*exp(-max(0.,h-.45)*1.38);
 float rho=field.r*erosion*mix(.76,wisps+.17,1.-belt);
 return rho*mask*smoothstep(.008,.045,h)*(1.-smoothstep(1.72,2.10,h))*densityGain;
}
float phaseHG(float cosine){
 // cosine is between the direction TO light and the camera ray direction.
 // These are opposite to both physical photon directions, preserving cosine.
 float g=.35,d=max(.001,1.+g*g-2.*g*cosine);
 return INV_FOUR_PI*(1.-g*g)/(d*sqrt(d));
}
vec2 intersectBox(vec3 origin,vec3 direction){
 vec3 safeDir=mix(vec3(1e-6),direction,greaterThan(abs(direction),vec3(1e-6)));
 vec3 a=(boundsMin-origin)/safeDir,b=(boundsMax-origin)/safeDir;
 vec3 low=min(a,b),high=max(a,b);
 return vec2(max(max(low.x,low.y),low.z),min(min(high.x,high.y),high.z));
}
float shadowToLamp(vec3 p,vec3 dir,float distanceToLamp){
 float exitDistance=max(0.,intersectBox(p,dir).y);
 float distanceInside=min(distanceToLamp,exitDistance),stride=distanceInside/4.;
 float opticalDepth=0.;
 for(int s=0;s<4;s++)opticalDepth+=densityAt(p+dir*((float(s)+.5)*stride))*stride;
 return exp(-extinction*opticalDepth);
}
`;

// Integrate each lamp's four shadow taps once per voxel, not at every pixel's
// ray steps. Four transmittances fit in one RGBA field and are view independent.
export const lightCacheFragment=`${opticalGLSL}
void main(){
 vec2 pixel=floor(gl_FragCoord.xy),tile=floor(pixel/32.);
 vec3 cell=vec3(mod(pixel.x,32.),mod(pixel.y,32.),tile.x+tile.y*8.);
 vec3 p=boundsMin+(cell+.5)/32.*(boundsMax-boundsMin);
 vec4 visibility=vec4(1.);
 for(int l=0;l<4;l++){
  if(l>=lampCount)break;
  vec3 delta=lampPositionPower[l].xyz-p;float distanceToLamp=length(delta);
  visibility[l]=shadowToLamp(p,delta/max(distanceToLamp,.001),distanceToLamp);
 }
 outColor=visibility;
}`;

export const raymarchFragment=`${opticalGLSL}
uniform sampler2D lightField;
uniform int raySteps;
vec4 lightTransmissionAt(vec3 p){
 vec3 local=(p-boundsMin)/(boundsMax-boundsMin);
 float z=clamp(local.z*32.-.5,0.,31.),a=floor(z),b=min(31.,a+1.);
 return mix(texture(lightField,fieldUV(local,a)),texture(lightField,fieldUV(local,b)),fract(z));
}
vec3 illumination(vec3 p,vec3 ray){
 float h=p.y-waterY;
 // Isotropic ambient-radiance approximation: neutral cave fill, with a small
 // emerald bounce close to jade water. It is not a fake emissive volume.
 vec3 incident=vec3(.30,.335,.325)+vec3(.028,.094,.068)*exp(-h*2.4);
 vec4 visibility=lightTransmissionAt(p);
 for(int l=0;l<4;l++){
  if(l>=lampCount)break;
  vec3 delta=lampPositionPower[l].xyz-p;
  float d=length(delta);vec3 toLamp=delta/max(d,.001);
  float range=lampColorRange[l].a;
  float falloff=pow(clamp(1.-pow(d/max(range,.1),4.),0.,1.),2.)/max(.24,d*d);
  incident+=lampColorRange[l].rgb*lampPositionPower[l].w*falloff*phaseHG(dot(toLamp,ray))*visibility[l];
 }
 return incident;
}
void main(){
 vec4 v=inverseProjection*vec4(uv*2.-1.,1.,1.);
 vec3 ray=normalize(mat3(cameraWorld)*(v.xyz/v.w));
 float depth=texture(sceneDepth,uv).r;
 vec4 endpoint=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
 vec3 surface=(cameraWorld*vec4(endpoint.xyz/endpoint.w,1.)).xyz;
 float sceneDistance=depth>.999999?1e4:max(0.,dot(surface-eye,ray)-.014);
 vec2 interval=intersectBox(eye,ray);
 float begin=max(0.,interval.x),end=min(interval.y,sceneDistance);
 if(end<=begin){outColor=vec4(0.,0.,0.,1.);return;}
 float stride=(end-begin)/float(max(raySteps,1));
 // Spatially fixed interleaved-gradient dither avoids temporal sparkling.
 float jitter=fract(52.9829189*fract(dot(floor(uv*halfSize),vec2(.06711056,.00583715))));
 vec3 scatter=vec3(0.);float transmittance=1.;
 for(int i=0;i<48;i++){
  if(i>=raySteps)break;
  vec3 p=eye+ray*(begin+(float(i)+jitter)*stride);
  float density=densityAt(p);
  if(density>.001){
   float opticalDepth=density*extinction*stride;
   float stepTransmission=exp(-opticalDepth);
   // Analytic segment integration of sigma_s * L_i with albedo=.985.
   scatter+=transmittance*(1.-stepTransmission)*.985*illumination(p,ray);
   transmittance*=stepTransmission;
   if(transmittance<.018)break;
  }
 }
 outColor=vec4(scatter,transmittance);
}`;

export const compositeFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sourceColor,sceneDepth,volumeColor;
uniform vec2 halfSize;uniform vec2 nearFar;
in vec2 uv;out vec4 outColor;
float viewDepth(float raw){return nearFar.x*nearFar.y/(nearFar.y-raw*(nearFar.y-nearFar.x));}
void main(){
 vec2 pixel=uv*halfSize-.5,base=floor(pixel),fraction=fract(pixel);
 float depth=viewDepth(texture(sceneDepth,uv).r),sum=0.;vec4 fog=vec4(0.);
 for(int y=0;y<2;y++)for(int x=0;x<2;x++){
  vec2 p=clamp((base+vec2(float(x),float(y))+.5)/halfSize,.5/halfSize,1.-.5/halfSize);
  float z=viewDepth(texture(sceneDepth,p).r);
  float bilateral=exp(-abs(z-depth)/(.035+.018*depth));
  vec2 w=mix(1.-fraction,fraction,vec2(float(x),float(y)));
  float weight=w.x*w.y*bilateral;
  fog+=texture(volumeColor,p)*weight;sum+=weight;
 }
 fog=sum>.00001?fog/sum:vec4(0.,0.,0.,1.);
 vec4 source=texture(sourceColor,uv);
 outColor=vec4(source.rgb*clamp(fog.a,0.,1.)+fog.rgb,source.a);
}`;

export const shaderSources=Object.freeze({vertex:passVertex,advection:advectionFragment,lightCache:lightCacheFragment,raymarch:raymarchFragment,composite:compositeFragment});

function hash(x,y,z){let a=(Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647))>>>0;a=Math.imul(a^(a>>>13),1274126177)>>>0;return((a^(a>>>16))>>>0)/4294967295;}
function smooth(t){return t*t*t*(t*(t*6-15)+10);}
function latticeNoise(x,y,z,n){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=smooth(x-ix),fy=smooth(y-iy),fz=smooth(z-iz);
 const wrap=v=>((v%n)+n)%n,at=(a,b,c)=>hash(wrap(a),wrap(b),wrap(c));
 const mix=(a,b,t)=>a+(b-a)*t;
 return mix(mix(mix(at(ix,iy,iz),at(ix+1,iy,iz),fx),mix(at(ix,iy+1,iz),at(ix+1,iy+1,iz),fx),fy),mix(mix(at(ix,iy,iz+1),at(ix+1,iy,iz+1),fx),mix(at(ix,iy+1,iz+1),at(ix+1,iy+1,iz+1),fx),fy),fz);
}
export function makePeriodicNoiseData(size=64){
 const data=new Uint8Array(size*size*size*2),cells=6,features=[];
 for(let z=0;z<cells;z++)for(let y=0;y<cells;y++)for(let x=0;x<cells;x++)features.push([hash(x+43,y,z),hash(x,y+97,z),hash(x,y,z+137)]);
 const feature=(x,y,z)=>features[((z+cells)%cells*cells+(y+cells)%cells)*cells+(x+cells)%cells];
 let index=0;
 for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const px=(x+.5)/size,py=(y+.5)/size,pz=(z+.5)/size;
  const fbm=latticeNoise(px*4,py*4,pz*4,4)*.53+latticeNoise(px*8,py*8,pz*8,8)*.28+latticeNoise(px*16,py*16,pz*16,16)*.13+latticeNoise(px*32,py*32,pz*32,32)*.06;
  const ax=px*cells,ay=py*cells,az=pz*cells,bx=Math.floor(ax),by=Math.floor(ay),bz=Math.floor(az);let nearest=4;
  for(let oz=-1;oz<=1;oz++)for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
   const xx=bx+ox,yy=by+oy,zz=bz+oz,f=feature(xx,yy,zz),dx=xx+f[0]-ax,dy=yy+f[1]-ay,dz=zz+f[2]-az;
   nearest=Math.min(nearest,dx*dx+dy*dy+dz*dz);
  }
  data[index++]=Math.round(Math.max(0,Math.min(1,fbm))*255);
  data[index++]=Math.round(Math.max(0,1-Math.sqrt(nearest)/1.05)*255);
 }
 return data;
}

function inPolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function poolDefinition(poolPlan){
 const points=Array.isArray(poolPlan)?poolPlan:(poolPlan?.points||Array.from({length:64},(_,i)=>{const a=i*Math.PI/32;return[Math.cos(a)*2.35,Math.sin(a)*2.45];}));
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
 return {points,minX:Math.min(...xs)-.06,maxX:Math.max(...xs)+.06,minZ:Math.min(...zs)-.06,maxZ:Math.max(...zs)+.06,contains:typeof poolPlan?.contains==='function'?poolPlan.contains:null};
}
function makePoolMask(T,plan){
 const size=128,data=new Uint8Array(size*size),inside=(x,z)=>inPolygon(x,z,plan.points)&&(!plan.contains||plan.contains(x,z));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let covered=0;
  for(const dy of[.25,.75])for(const dx of[.25,.75]){const px=plan.minX+(x+dx)/size*(plan.maxX-plan.minX),pz=plan.minZ+(y+dy)/size*(plan.maxZ-plan.minZ);if(inside(px,pz))covered++;}
  data[y*size+x]=Math.round(covered*63.75);
 }
 const texture=new T.DataTexture(data,size,size,T.RedFormat,T.UnsignedByteType);
 texture.name='V65 exact pool-source footprint';texture.minFilter=texture.magFilter=T.LinearFilter;texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;texture.generateMipmaps=false;texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;return texture;
}

/**
 * @param T The same Three.js module used to create the renderer.
 * @param options.poolPlan Polygon [[x,z],...] or {points, contains(x,z)}.
 * @param options.lights Array of {p:[x,y,z],color,power,range}, up to four.
 * compose(renderer,sourceColor,depth,camera,w,h,timeSeconds,channel='main') returns Texture.
 * composeReflection(...same arguments without channel) keeps its own outputs.
 * Both views reuse the same world density and lamp cache at configured rates.
 * options.performanceProfile accepts 'performance', 'quality', 'low', or an
 * object overriding scale, reflectionScale, steps and simulation/lighting Hz.
 * All pass inputs remain immutable. The returned composite never aliases them.
 */
export function createSpringVolume(T,{waterY=0,lights=[],poolPlan,density=1,extinction=2.55,performanceProfile='performance'}={}){
 let profile=resolveVolumeProfile(performanceProfile);
 const plan=poolDefinition(poolPlan),noise=new T.Data3DTexture(makePeriodicNoiseData(),64,64,64);
 noise.name='V65 periodic 64³ fBm + Worley';noise.format=T.RGFormat;noise.type=T.UnsignedByteType;noise.minFilter=noise.magFilter=T.LinearFilter;noise.wrapS=noise.wrapT=noise.wrapR=T.RepeatWrapping;noise.unpackAlignment=1;noise.generateMipmaps=false;noise.colorSpace=T.NoColorSpace;noise.needsUpdate=true;
 const mask=makePoolMask(T,plan),boundsMin=new T.Vector3(plan.minX,waterY+.008,plan.minZ),boundsMax=new T.Vector3(plan.maxX,waterY+2.12,plan.maxZ);
 const lampPositionPower=Array.from({length:4},()=>new T.Vector4()),lampColorRange=Array.from({length:4},()=>new T.Vector4());
 // A 2400 K incandescent approximation is the default for colourless lamps.
 for(let i=0;i<Math.min(4,lights.length);i++){const l=lights[i],p=l.p||l.position?.toArray?.()||[0,2,0],c=l.color?.isColor?l.color.clone():new T.Color(l.color??0xff9d47);lampPositionPower[i].set(p[0],p[1],p[2],l.power??l.intensity??8);lampColorRange[i].set(c.r,c.g,c.b,l.range??l.distance??8);}
 const common={densityField:{value:null},poolMask:{value:mask},noiseVolume:{value:noise},boundsMin:{value:boundsMin},boundsMax:{value:boundsMax},time:{value:0},waterY:{value:waterY}};
 const simulationUniforms={...common,dt:{value:1/60},initialize:{value:1}};
 const volumeUniforms={...common,sceneDepth:{value:null},lightField:{value:null},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},eye:{value:new T.Vector3()},halfSize:{value:new T.Vector2()},raySteps:{value:profile.raySteps},lampPositionPower:{value:lampPositionPower},lampColorRange:{value:lampColorRange},lampCount:{value:Math.min(lights.length,4)},densityGain:{value:density},extinction:{value:extinction}};
 const compositeUniforms={sourceColor:{value:null},sceneDepth:{value:null},volumeColor:{value:null},halfSize:volumeUniforms.halfSize,nearFar:{value:new T.Vector2(.06,40)}};
 const lightCacheUniforms={...common,...Object.fromEntries(['lampPositionPower','lampCount','extinction','densityGain'].map(key=>[key,volumeUniforms[key]]))};
 const material=(fragmentShader,uniforms)=>new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:passVertex,fragmentShader,uniforms,depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
 const simulation=material(advectionFragment,simulationUniforms),lightCache=material(lightCacheFragment,lightCacheUniforms),volume=material(raymarchFragment,volumeUniforms),composite=material(compositeFragment,compositeUniforms);
 simulation.name='V65 GPU steam density/heat advection';lightCache.name='V65 cached four-lamp volume shadows';volume.name='V65 Beer-Lambert single scattering';composite.name='V65 depth-aware steam resolve';
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),screenCamera=new T.Camera(),quad=new T.Mesh(geometry,simulation);quad.frustumCulled=false;scene.add(quad);
 let fieldRead=null,fieldWrite=null,lightTarget=null,lastSimulationTime=null,lastPresentedTime=null,lastLightTime=null,lastLightDensity=null,lastLightExtinction=null,disposed=false,initialized=false;
 const channels=new Map();
 const volumeBounds=new T.Box3(boundsMin.clone(),boundsMax.clone()),viewProjection=new T.Matrix4(),frustum=new T.Frustum();
 const diagnostics={active:true,profile,raySteps:profile.raySteps,reflectionRaySteps:profile.reflectionRaySteps,shadowSteps:4,noiseSize:64,noiseChannels:'fBm, Worley',simulationCells:32768,simulationModel:'GPU semi-Lagrangian density/heat grid',independentParticleSprites:0,lightCacheCells:32768,halfResolution:false,resolutionScale:profile.scale,reflectionScale:profile.reflectionScale,simulationHz:profile.simulationHz,lightingHz:profile.lightingHz,depthOcclusion:true,singleScattering:true,multipleScattering:false,geometryLightShadows:false,composeCalls:0,frames:0,simulationPasses:0,simulationReuses:0,lightCachePasses:0,lightCacheReuses:0,raymarchPasses:0,compositePasses:0,culledViews:0,zeroDensityViews:0,raySampleBudget:0,lightDensitySampleBudget:0,halfWidth:0,halfHeight:0,renderTargetType:null,channels:{}};
 function makeTarget(w,h,type){const target=new T.WebGLRenderTarget(w,h,{type,format:T.RGBAFormat,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});target.texture.colorSpace=T.NoColorSpace;return target;}
 function allocate(w,h,channel){
  const type=T.HalfFloatType;
  diagnostics.renderTargetType='RGBA16F';
  if(!fieldRead){fieldRead=makeTarget(256,128,type);fieldWrite=makeTarget(256,128,type);lightTarget=makeTarget(256,128,type);initialized=false;}
  let targets=channels.get(channel);
  const reflection=channel==='reflection',scale=reflection?profile.reflectionScale:profile.scale,steps=reflection?profile.reflectionRaySteps:profile.raySteps;
  const hw=Math.max(1,Math.ceil(w*scale)),hh=Math.max(1,Math.ceil(h*scale));
  if(!targets||targets.width!==w||targets.height!==h||targets.half.width!==hw||targets.half.height!==hh){
   targets?.half.dispose();targets?.output.dispose();targets={width:w,height:h,half:makeTarget(hw,hh,type),output:makeTarget(w,h,type)};channels.set(channel,targets);
  }
  volumeUniforms.halfSize.value.set(hw,hh);volumeUniforms.raySteps.value=steps;diagnostics.halfWidth=hw;diagnostics.halfHeight=hh;
  diagnostics.channels[channel]={...diagnostics.channels[channel],width:w,height:h,halfWidth:hw,halfHeight:hh,raymarchWidth:hw,raymarchHeight:hh,scale,raySteps:steps};return targets;
 }
 function draw(renderer,mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(scene,screenCamera);}
 function compose(renderer,sourceTexture,depthTexture,camera,w,h,time=0,channel='main'){
  if(disposed)throw new Error('Spring volume has been disposed.');
  if(!sourceTexture||!depthTexture)throw new Error('Spring volume requires separate source colour and scene depth textures.');
  diagnostics.composeCalls++;
  if(!renderer.extensions.has('EXT_color_buffer_float')){diagnostics.active=false;diagnostics.unsupported='Float colour attachments unavailable; source HDR preserved by bypassing steam.';return sourceTexture;}
  diagnostics.active=true;
  if(volumeUniforms.densityGain.value<=.0001){diagnostics.zeroDensityViews++;return sourceTexture;}
  camera.updateMatrixWorld();
  if(profile.cullVolume){
   viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(viewProjection);
   if(!frustum.intersectsBox(volumeBounds)){diagnostics.culledViews++;return sourceTexture;}
  }
  w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));
  const targets=allocate(w,h,channel),halfTarget=targets.half,outputTarget=targets.output;
  if(sourceTexture===outputTarget.texture)throw new Error('Spring volume source cannot be its previous output; use the current scene source.');
  const savedTarget=renderer.getRenderTarget(),autoClear=renderer.autoClear,xr=renderer.xr.enabled;
  try{
   renderer.autoClear=true;renderer.xr.enabled=false;
   // Rewinding the scene clock restarts the field. A repeated main/reflection
   // time reuses both GPU caches. Slow frames never trigger catch-up pass bursts.
   if(lastPresentedTime!==null&&time<lastPresentedTime-.00001)reset();
   lastPresentedTime=time;common.time.value=time;
   const simulationDue=!initialized||lastSimulationTime===null||time-lastSimulationTime+1e-7>=1/profile.simulationHz;
   if(simulationDue){
    const dt=lastSimulationTime===null?1/profile.simulationHz:Math.min(.1,Math.max(0,time-lastSimulationTime));
    simulationUniforms.dt.value=dt;simulationUniforms.initialize.value=initialized?0:1;common.densityField.value=fieldRead.texture;
    // Reading and writing ALWAYS use different attachments.
    draw(renderer,simulation,fieldWrite);[fieldRead,fieldWrite]=[fieldWrite,fieldRead];initialized=true;lastSimulationTime=time;diagnostics.simulationPasses++;
   }else diagnostics.simulationReuses++;
   common.densityField.value=fieldRead.texture;
   if(lastLightTime===null||time-lastLightTime+1e-7>=1/profile.lightingHz||lastLightDensity!==volumeUniforms.densityGain.value||lastLightExtinction!==volumeUniforms.extinction.value){
    draw(renderer,lightCache,lightTarget);lastLightTime=time;lastLightDensity=volumeUniforms.densityGain.value;lastLightExtinction=volumeUniforms.extinction.value;diagnostics.lightCachePasses++;
    diagnostics.lightDensitySampleBudget+=32768*volumeUniforms.lampCount.value*4;
   }else diagnostics.lightCacheReuses++;
   volumeUniforms.lightField.value=lightTarget.texture;
   volumeUniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);volumeUniforms.cameraWorld.value.copy(camera.matrixWorld);volumeUniforms.eye.value.setFromMatrixPosition(camera.matrixWorld);volumeUniforms.sceneDepth.value=depthTexture;
   draw(renderer,volume,halfTarget);diagnostics.raymarchPasses++;
   const sampleBudget=halfTarget.width*halfTarget.height*volumeUniforms.raySteps.value;
   diagnostics.raySampleBudget+=sampleBudget;
   const channelStats=diagnostics.channels[channel];channelStats.frames=(channelStats.frames||0)+1;channelStats.raySampleBudget=(channelStats.raySampleBudget||0)+sampleBudget;
   compositeUniforms.sourceColor.value=sourceTexture;compositeUniforms.sceneDepth.value=depthTexture;compositeUniforms.volumeColor.value=halfTarget.texture;compositeUniforms.nearFar.value.set(camera.near,camera.far);
   draw(renderer,composite,outputTarget);diagnostics.compositePasses++;diagnostics.frames++;return outputTarget.texture;
  // setRenderTarget restores that target's viewport/scissor; global viewport
  // setters are deliberately untouched (their HiDPI units may differ).
  }finally{renderer.autoClear=autoClear;renderer.xr.enabled=xr;renderer.setRenderTarget(savedTarget);}
 }
 function reset(){initialized=false;lastSimulationTime=null;lastPresentedTime=null;lastLightTime=null;}
 function setPerformanceProfile(value){profile=resolveVolumeProfile(value);Object.assign(diagnostics,{profile,raySteps:profile.raySteps,reflectionRaySteps:profile.reflectionRaySteps,resolutionScale:profile.scale,reflectionScale:profile.reflectionScale,simulationHz:profile.simulationHz,lightingHz:profile.lightingHz});return profile;}
 function contextLost(){fieldRead?.dispose();fieldWrite?.dispose();lightTarget?.dispose();for(const targets of channels.values()){targets.half.dispose();targets.output.dispose();}channels.clear();diagnostics.channels={};fieldRead=fieldWrite=lightTarget=null;reset();}
 function dispose(){if(disposed)return;contextLost();noise.dispose();mask.dispose();geometry.dispose();simulation.dispose();lightCache.dispose();volume.dispose();composite.dispose();disposed=true;diagnostics.active=false;}
 return {compose,composeReflection:(renderer,sourceTexture,depthTexture,camera,w,h,time)=>compose(renderer,sourceTexture,depthTexture,camera,w,h,time,'reflection'),dispose,diagnostics,reset,contextLost,setPerformanceProfile,getPerformanceProfile:()=>profile,invalidateLighting(){lastLightTime=null;},uniforms:volumeUniforms,setDensity(value){volumeUniforms.densityGain.value=Math.max(0,Number(value)||0);}};
}
