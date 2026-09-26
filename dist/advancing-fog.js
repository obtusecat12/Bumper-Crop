import * as T from './vendor/three.module.min.js';
import {FogFront,FOG_MAX_DIST} from './fog-front.js?v=48';

export const fogVertex=`precision highp float;in vec3 position;out vec2 uv;
void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
// Integrate the medium only once per reduced-resolution ray. Depth discontinuities
// fall back to the exact ray rather than leaking distant fog onto a near stalk.
export const fogFieldGLSL=`
precision highp sampler3D;
uniform sampler2D sceneDepth;
uniform sampler3D fogNoise;
uniform mat4 inverseProjection,cameraWorld;
uniform vec2 fogOffset,terrainOrigin;
uniform float u_fogProgress,fogAmount,fogTime,maxDist,fogFar,groundCorrection,fogWaterActive,fogWaterLevel;
const vec2 wind=vec2(-.8,-.6);
vec3 fogWorld(vec2 q,float depth){vec4 p=inverseProjection*vec4(q*2.-1.,depth*2.-1.,1.);return (cameraWorld*vec4(p.xyz/p.w,1.)).xyz;}
float fogDistance(vec2 q){float d=texture(sceneDepth,q).r;return d>.99999?fogFar:min(fogFar,length(fogWorld(q,d)-cameraWorld[3].xyz));}
float groundAt(vec2 p){vec2 a=p+terrainOrigin;float k=6.28318530718/65536.;
 return sin(a.x*k*256.)*.22+cos(a.y*k*128.)*.20+sin((a.x+a.y)*k*64.)*.27
 +groundCorrection*exp(-length(p-cameraWorld[3].xz)*.05);}
float fogHash(vec2 p){vec3 v=fract(vec3(p.xyx)*.1031);v+=dot(v,v.yzx+33.33);return fract((v.x+v.y)*v.z);}
// Analytic gradient of smooth value noise, no four extra noise evaluations.
vec3 noiseGradient(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f),du=6.*f*(1.-f);
 float a=fogHash(i),b=fogHash(i+vec2(1,0)),c=fogHash(i+vec2(0,1)),d=fogHash(i+1.);
 return vec3(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),du.x*mix(b-a,d-c,u.y),du.y*mix(c-a,d-b,u.x));}
float macroFbm(vec2 p){
 // R already contains three baked octaves; G contributes the fourth octave.
 vec4 n=textureLod(fogNoise,vec3(p*.25,.173),0.);
 float fine=textureLod(fogNoise,vec3(p*1.0,.619),0.).g;
 return n.r*.94+fine*.06;
}
float fogFront(vec2 p){vec2 q=p+fogOffset;
 // 160 m interior margin puts the entire activation area behind the front at
 // 90 s. At 0 s its closest possible edge is still beyond the 350 m horizon.
 return dot(q,wind)+160.+macroFbm(q*.003)*120.-(1.-u_fogProgress)*maxDist;
}
float fogWake(){return smoothstep(.72,1.,u_fogProgress);}
float medium(vec3 p){
 float wake=fogWake(),front=wake>=1.?26.:fogFront(p.xz);if(front<=-18.&&wake<=0.)return 0.;
 vec2 q=(p.xz+fogOffset)*.04+wind*fogTime*.08;
 vec3 n=noiseGradient(q*.53);q+=vec2(-n.z,n.y)*.4;
 vec2 strandUV=vec2(dot(q,wind)*.20,dot(q,vec2(-wind.y,wind.x))*1.7);
 vec4 strand=textureLod(fogNoise,vec3(strandUV*.125,p.y*.09+fogTime*.002),0.);
 float thread=pow(max(0.,1.-abs(strand.g-.5)*3.4),2.);
 float fibres=textureLod(fogNoise,vec3(strandUV*.5,p.y*.25-fogTime*.007),0.).b;
 thread*=.72+.28*smoothstep(.26,.66,fibres);
 float wispy=.65+.66*thread+.12*(strand.b-.5);
 float height=exp(-.25*max(0.,p.y-groundAt(p.xz)));
 return mix(smoothstep(-18.,26.,front),1.,wake)*height*wispy*fogAmount;
}
float integrateFog(vec2 q,float distance){
 if(fogAmount<.0001||u_fogProgress<=0.)return 0.;
 vec3 ro=cameraWorld[3].xyz,rd=normalize(fogWorld(q,.9999)-ro);
 // Bound the occupied interval analytically before sampling the noisy front.
 // Noise is in [0,1], so no fog can exist below this conservative plane.
 float start=0.,end=distance,slope=dot(rd.xz,wind);
 float plane=dot(ro.xz+fogOffset,wind)+298.-(1.-u_fogProgress)*maxDist;
 if(fogWake()<=0.){
  if(abs(slope)<.00001){if(plane<0.)return 0.;}
  else if(slope>0.)start=max(0.,-plane/slope);else end=min(end,-plane/slope);
 }
 if(fogWaterActive>.5){
  if(ro.y<fogWaterLevel){if(rd.y<=0.)return 0.;start=max(start,(fogWaterLevel-ro.y)/rd.y);}
  else if(rd.y<0.)end=min(end,(fogWaterLevel-ro.y)/rd.y);
 }
 if(rd.y>.0001)end=min(end,max(0.,(24.-ro.y)/rd.y));
 if(end<=start)return 0.;
 float tau=0.,previous=start;
 int steps=int(clamp(ceil((end-start)/.65),4.,32.));
 for(int i=0;i<32;i++){
  if(i>=steps)break;
  float f=float(i+1)/float(steps);float next=start+(end-start)*f*f;
  float step=next-previous;vec3 p=ro+rd*(previous+step*.5);
  tau+=.34*medium(p)*step;previous=next;
  if(tau>9.2)break;
 }
 return min(tau,12.);
}`;
export const fogIntegrateFragment=`precision highp float;precision highp sampler2D;
in vec2 uv;out vec4 result;
${fogFieldGLSL}
void main(){float d=fogDistance(uv);result=vec4(integrateFog(uv,d)/12.,log2(1.+d)/log2(1.+fogFar),0.,1.);}`;
export const fogCompositeFragment=`precision highp float;precision highp sampler2D;
in vec2 uv;out vec4 result;uniform sampler2D picture,fogField;uniform vec2 fogSize;uniform vec3 fogColor;
${fogFieldGLSL}
void main(){vec4 original=texture(picture,uv);if(fogAmount<.0001||u_fogProgress<=0.){result=original;return;}
 float d=fogDistance(uv);vec2 p=uv*fogSize-.5,base=floor(p),f=fract(p);
 float tau=0.,total=0.;
 for(int y=0;y<2;y++)for(int x=0;x<2;x++){
  vec2 cell=vec2(x,y);vec4 v=texture(fogField,(base+cell+.5)/fogSize);
  v.r*=12.;v.g=exp2(v.g*log2(1.+fogFar))-1.;
  float bilateral=exp(-abs(v.g-d)/max(.18,d*.018));
  vec2 w=mix(1.-f,f,cell);float weight=w.x*w.y*bilateral;
  tau+=v.r*weight;total+=weight;
 }
 // Sparse silhouettes missed by the reduced depth buffer use their own depth.
 tau=total>.12?tau/total:integrateFog(uv,d);
 float trans=exp(-tau);result=vec4(original.rgb*trans+fogColor*(1.-trans),original.a);
}`;

const wrap=v=>typeof v==='bigint'?Number((v%1024n+1024n)%1024n)*64:((Number(v)||0)%65536+65536)%65536;
export function createAdvancingFog(renderer,noise){
 const front=new FogFront();
 const u={sceneDepth:{value:null},fogNoise:{value:noise},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},fogOffset:{value:new T.Vector2()},terrainOrigin:{value:new T.Vector2()},u_fogProgress:{value:0},fogAmount:{value:0},fogTime:{value:0},maxDist:{value:FOG_MAX_DIST},fogFar:{value:480},groundCorrection:{value:0},fogWaterActive:{value:0},fogWaterLevel:{value:0},picture:{value:null},fogField:{value:null},fogSize:{value:new T.Vector2()},fogColor:{value:new T.Color().setRGB(.72,.75,.76,T.SRGBColorSpace)}};
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const material=f=>new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:fogVertex,fragmentShader:f,uniforms:f===fogIntegrateFragment?{...u,picture:{value:null},fogField:{value:null}}:u,depthWrite:false,depthTest:false,blending:T.NoBlending,toneMapped:false});
 const integrate=material(fogIntegrateFragment),composite=material(fogCompositeFragment),scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(geometry,integrate);quad.frustumCulled=false;scene.add(quad);
 let field=null,output=null,width=0,height=0;
 const stats={active:false,passes:0,fieldPixels:0,maxSteps:32,progress:0};
 function release(){field?.dispose();output?.dispose();field=output=null;width=height=0;}
 function allocate(w,h){if(width===w&&height===h&&field)return;release();width=w;height=h;
  const options={type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:false,stencilBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter,generateMipmaps:false};
  field=new T.WebGLRenderTarget(Math.ceil(w/3),Math.ceil(h/3),options);output=new T.WebGLRenderTarget(w,h,{...options,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  field.texture.colorSpace=output.texture.colorSpace=T.NoColorSpace;field.texture.name='fog-optical-depth-distance';output.texture.name='fogged-linear-scene';u.fogSize.value.set(field.width,field.height);u.fogField.value=field.texture;stats.fieldPixels=field.width*field.height;
 }
 function update(options={}){front.update(options);u.u_fogProgress.value=front.progress;u.fogAmount.value=front.amount;u.fogTime.value=options.time||0;u.fogOffset.value.set(front.offsetX,front.offsetZ);u.terrainOrigin.value.set(wrap(options.originX),wrap(options.originZ));stats.progress=front.progress;stats.active=front.amount>0&&front.progress>0;
  const c=options.camera;if(c){const a=c.position.x+u.terrainOrigin.value.x,b=c.position.z+u.terrainOrigin.value.y,k=Math.PI*2/65536;const ground=Math.sin(a*k*256)*.22+Math.cos(b*k*128)*.20+Math.sin((a+b)*k*64)*.27;u.groundCorrection.value=Number.isFinite(options.groundHeight)?options.groundHeight-ground:0;}
 }
 function compose(source,view,{waterActive=false,level=0}={}){if(!stats.active)return source.texture;
  allocate(source.width,source.height);u.fogWaterActive.value=waterActive?1:0;u.fogWaterLevel.value=level;view.updateMatrixWorld(true);u.inverseProjection.value.copy(view.projectionMatrixInverse);u.cameraWorld.value.copy(view.matrixWorld);u.fogFar.value=Math.max(480,view.far);u.picture.value=source.texture;u.sceneDepth.value=source.depthTexture;
  const prior=renderer.getRenderTarget(),auto=renderer.autoClear;
  try{renderer.autoClear=true;quad.material=integrate;renderer.setRenderTarget(field);renderer.render(scene,camera);quad.material=composite;renderer.setRenderTarget(output);renderer.render(scene,camera);stats.passes+=2;}finally{renderer.setRenderTarget(prior);renderer.autoClear=auto;}
  return output.texture;
 }
 return {front,uniforms:u,stats,update,compose,localAmount(camera){const f=(camera.position.x+front.offsetX)*-.8+(camera.position.z+front.offsetZ)*-.6+160-(1-front.progress)*FOG_MAX_DIST;const t=T.MathUtils.clamp((f+18)/44,0,1);const w=T.MathUtils.smoothstep(front.progress,.72,1);return front.amount*(t*t*(3-2*t)*(1-w)+w);},contextLost:release,dispose(){release();geometry.dispose();integrate.dispose();composite.dispose();}};
}
