import * as T from './vendor/three.module.min.js';
import {ruralTextures} from './rural-textures.js?v=57';
export const surfaceVertex=`precision highp float;precision highp sampler2D;
in vec3 position;in vec2 lakeCoord;in float facetTone;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;
out vec3 worldP;out vec2 waterXZ;out float tone;
void main(){worldP=(modelMatrix*vec4(position,1.)).xyz;waterXZ=lakeCoord;tone=facetTone;gl_Position=projectionMatrix*viewMatrix*vec4(worldP,1.);}`;
export const surfaceFragment=`precision highp float;precision highp sampler2D;precision highp samplerCube;
uniform sampler2D normalA,normalB,sceneColor,sceneDepth,uImpactNormals,bottomSoil;
uniform samplerCube environment;uniform float environmentReady;
uniform mat4 viewMatrix,projectionMatrix,inverseProjection,cameraWorld;
uniform vec2 size,uImpactOrigin;uniform float time,nearPlane,farPlane,fadeDistance,uImpactActive;
uniform vec3 eye,sun,skyColor;uniform float mist;
in vec3 worldP;in vec2 waterXZ;in float tone;out vec4 outColor;
float linearZ(float d){return nearPlane*farPlane/(farPlane-d*(farPlane-nearPlane));}
vec3 scenePoint(vec2 q){vec4 p=inverseProjection*vec4(q*2.-1.,texture(sceneDepth,q).r*2.-1.,1.);return (cameraWorld*vec4(p.xyz/p.w,1.)).xyz;}
vec3 extinction(vec3 color,float d){vec3 transmission=exp(-vec3(.4,.15,.05)*max(0.,d));return color*transmission+vec3(.024,.061,.054)*(1.-transmission);}
vec3 skyReflection(vec3 direction,float roughness){
 if(environmentReady>.5)return textureLod(environment,direction,roughness*4.).rgb;
 return skyColor*mix(.42,1.,smoothstep(-.2,.4,direction.y));
}
vec3 underwaterReflection(vec3 direction){
 // An underwater ray reflected at the ceiling travels DOWN to the lakebed.
 // A screen-space vertical flip would instead mirror the sky and paint its
 // clouds as enormous dark patches on the underside of the lake.
 float reach=clamp((2.7+0.18*sin(worldP.x*.18+worldP.z*.12))/max(.14,-direction.y),1.5,26.);
 vec3 bedP=worldP+direction*reach;
 vec3 silt=texture(bottomSoil,bedP.xz*.25).rgb*vec3(1.08,1.58,2.10);
 vec3 result=extinction(silt,reach);
 // One projected-bed probe instead of a per-pixel raymarch: real lakebed
 // detail if it is on screen, texture fallback if occluded/off screen.
 vec4 clip=projectionMatrix*viewMatrix*vec4(bedP,1.);
 vec2 q=clip.xy/max(.001,clip.w)*.5+.5;
 if(clip.w>0.&&all(greaterThan(q,vec2(.001)))&&all(lessThan(q,vec2(.999)))){
  float sampleD=texture(sceneDepth,q).r;
  if(sampleD<.9998){vec3 hit=scenePoint(q);
   if(hit.y<worldP.y-.08&&distance(hit,bedP)<1.2)
    result=extinction(texture(sceneColor,q).rgb,reach);
  }
 }
 return result;
}
void main(){
 // Metre-scale, mip-filtered ripples; no directional sine wave field.
 vec2 base=waterXZ*.038;
 vec3 a=texture(normalA,base+vec2(.03,.02)*time).xyz*2.-1.;
 vec3 b=texture(normalB,base*1.37+vec2(-.02,.04)*time).xyz*2.-1.;
 vec3 n=normalize(vec3(a.xy+b.xy,a.z*b.z));
 float distanceToEye=length(worldP-eye);
 n.xy*=.31*(1.-smoothstep(8.,100.,distanceToEye));
 vec2 rip=(worldP.xz-uImpactOrigin)/24.;
 if(uImpactActive>.5&&all(greaterThan(rip,vec2(0)))&&all(lessThan(rip,vec2(1))))n.xy+=(texture(uImpactNormals,rip).rg*2.-1.)*.46;
 vec3 N=normalize(vec3(n.x,n.z,n.y)),V=normalize(worldP-eye),view=-V;
 vec3 faceN=gl_FrontFacing?N:-N;
 float NoV=max(0.,dot(faceN,view));float F=.02+.98*pow(1.-NoV,5.);
 // Geometric normal variance widens highlights instead of making white sparks.
 float variance=max(dot(dFdx(N),dFdx(N)),dot(dFdy(N),dFdy(N)));
 float roughness=clamp(sqrt(.22*.22+min(.014,variance*.8)),.15,.25);
 vec2 uv=gl_FragCoord.xy/size;float waterZ=linearZ(gl_FragCoord.z);
 float sceneZ=linearZ(texture(sceneDepth,uv).r),thickness=max(0.,sceneZ-waterZ);
 float shore=clamp(thickness/fadeDistance,0.,1.);
 vec2 bentUV=clamp(uv+N.xz*.025*shore,vec2(.001),vec2(.999));
 vec3 bed=scenePoint(bentUV);
 if(linearZ(texture(sceneDepth,bentUV).r)<waterZ||bed.y>worldP.y){bentUV=uv;bed=scenePoint(uv);}
 vec3 bottom=texture(sceneColor,bentUV).rgb;
 float path=length(bed-worldP);
 vec3 refracted=extinction(bottom,min(path,24.)),reflected=skyReflection(reflect(V,N),roughness);
 if(!gl_FrontFacing){
  vec3 R=refract(V,-N,1.333);float tir=1.-step(.0001,dot(R,R));
  vec2 windowUV=clamp(uv+(R.xz-V.xz)*.008,vec2(.001),vec2(.999));
  // The sky is an infinitely distant radiance source, so sample it by the
  // refracted WORLD direction. Keep opaque geometry (especially droplets)
  // from the actual scene capture when present at the window's screen UV.
  refracted=texture(sceneDepth,windowUV).r<.9998?
   texture(sceneColor,windowUV).rgb:skyReflection(R,roughness);
  reflected=underwaterReflection(reflect(V,-N));F=mix(F,1.,tir);shore=1.;
 }
 float exponent=max(2.,2./(roughness*roughness)-2.);
 float spec=pow(max(0.,dot(faceN,normalize(view+sun))),exponent);
 spec=floor(spec*4.)/4.*.38;
 vec3 water=mix(refracted,reflected,F)+vec3(.93,.96,1.)*spec*F;
 float noise=texture(normalA,base*1.8+vec2(.017,-.021)*time).r;
 float foam=step(.0001,thickness)*(1.-step(.3,thickness))*smoothstep(.52,.62,noise)*smoothstep(0.,.035,thickness);
 if(gl_FrontFacing)water=mix(water,vec3(.42,.46,.43),foam*.32);
 // Reflection already contains sky fog. Applying fog to transmitted lakebed
 // again would create an opaque grey sheet, so only blend at distant horizon.
 float fog=(1.-exp(-distanceToEye*(.001+mist*.012)))*smoothstep(30.,150.,distanceToEye);
 if(gl_FrontFacing)water=mix(water,skyColor,clamp(fog,0.,.65));
 // Transparent material, premixed physical transmission. Alpha feather is
 // already resolved against the immutable scene to avoid double transmission.
 outColor=vec4(mix(bottom,water,shore),1.);
}`;
export function createWaterSurface(ripples){
 const loader=new T.TextureLoader(),pending=[];
 const load=url=>{let yes,no;pending.push(new Promise((resolve,reject)=>{yes=resolve;no=reject;}));return loader.load(url,yes,undefined,no);};
 const normalA=load(new URL('./textures/v28/water-normal-a.png',import.meta.url).href),normalB=load(new URL('./textures/v28/water-normal-b.png',import.meta.url).href),atlas=load(new URL('./textures/v28/water-caustics-atlas.png',import.meta.url).href),bottomSoil=ruralTextures.soil;
 for(const t of [normalA,normalB]){t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;}
 atlas.colorSpace=T.NoColorSpace;atlas.minFilter=atlas.magFilter=T.LinearFilter;atlas.generateMipmaps=false;atlas.flipY=false;
 // One already-loaded terrain albedo is shared with the lake material.
 const time={value:0};const u={normalA:{value:normalA},normalB:{value:normalB},bottomSoil:{value:bottomSoil},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},environment:{value:null},environmentReady:{value:0},sceneColor:{value:null},sceneDepth:{value:null},size:{value:new T.Vector2()},time,nearPlane:{value:.1},farPlane:{value:480},fadeDistance:{value:.65},eye:{value:new T.Vector3()},sun:{value:new T.Vector3(-.45,.84,-.30).normalize()},skyColor:{value:new T.Color(.40,.47,.49)},mist:{value:0},...ripples.binding};
 const material=new T.RawShaderMaterial({name:'V29 Fresnel transmission and two-sided lake',glslVersion:T.GLSL3,vertexShader:surfaceVertex,fragmentShader:surfaceFragment,uniforms:u,side:T.DoubleSide,depthTest:true,depthWrite:true,transparent:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,blending:T.NormalBlending,toneMapped:false});
 const attached=new WeakSet();
 function attach(chunk){chunk.group.traverse(o=>{
  if(o.material?.name==='PS1 low-poly detailed ripple water'){o.userData.originalWaterMaterial=o.material;o.material=material;o.layers.set(2);o.userData.waterSurface=true;}
  if(o.name!=='sculpted-ground-and-wheel-ruts'||chunk.field.type!=='pond'||!o.material||attached.has(o.material))return;
  const m=o.material;attached.add(m);const compile=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m),f=chunk.field;
  m.onBeforeCompile=(s,r)=>{compile.call(m,s,r);s.uniforms.v28Caustics={value:atlas};s.uniforms.v28Time=time;s.uniforms.v28Lake={value:new T.Vector3(f.cx,f.lakeY,f.cz)};
   s.vertexShader='varying vec3 vCausticLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCausticLocal=position;');
   s.fragmentShader=`uniform sampler2D v28Caustics;uniform float v28Time;uniform vec3 v28Lake;varying vec3 vCausticLocal;
   vec2 causticUV(vec2 p,float frame){vec2 tile=vec2(mod(frame,4.),floor(frame/4.));return (tile+(fract(p)*255.+.5)/256.)/4.;}\n`+s.fragmentShader;
   // Apply to radiance after the terrain and lighting have finished. Injecting
   // at color_fragment gets overwritten by ground.js's diffuseColor.rgb=base.
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   float depthBelow=v28Lake.y-vCausticLocal.y;
   if(depthBelow>0.){
    float frame=mod(v28Time*5.,16.);vec2 p=(vCausticLocal.xz-v28Lake.xz)*.24;
    float c=mix(texture2D(v28Caustics,causticUV(p,floor(frame))).r,texture2D(v28Caustics,causticUV(p,mod(floor(frame)+1.,16.))).r,fract(frame));
    float wash=smoothstep(0.,.22,depthBelow)*exp(-depthBelow*.105);
    // Soft skylight supplies a visible bed; the moving network is intentionally
    // more pronounced than diffuse overcast caustics to match the reference.
    outgoingLight=max(outgoingLight,diffuseColor.rgb*vec3(.38,.46,.49));
    outgoingLight+=vec3(.48,.66,.65)*pow(c,.72)*wash*.88;
   }
   #include <opaque_fragment>`);
  };m.customProgramCacheKey=()=>key()+'|v31-caustics-after-lighting';m.needsUpdate=true;
 });}
 function update(clock,camera,color,sun,mist){time.value=clock;u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);u.eye.value.copy(camera.position);u.nearPlane.value=camera.near;u.farPlane.value=camera.far;if(color)u.skyColor.value.copy(color);if(sun)u.sun.value.copy(sun).normalize();u.mist.value=mist||0;}
 return {ready:Promise.all(pending),material,uniforms:u,normalA,normalB,bottomSoil,atlas,time,attach,update,dispose(){material.dispose();normalA.dispose();normalB.dispose();atlas.dispose();}};
}
