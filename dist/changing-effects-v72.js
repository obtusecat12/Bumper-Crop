import * as T from './vendor/three.module.min.js';
import {createSpaBloom} from './spa-bloom-v65.js';
const vertex=`precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
export const changingOcclusionFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D colorMap,depthMap;uniform mat4 inverseProjection,cameraWorld;uniform vec2 size;uniform float time;
in vec2 vUv;out vec4 fragColor;
vec3 viewPoint(vec2 uv,float d){vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){float d=texture(depthMap,vUv).r;vec3 p=viewPoint(vUv,d),c=texture(colorMap,vUv).rgb;if(d>.9999){fragColor=vec4(c,1);return;}
 vec3 n=normalize(cross(dFdx(p),dFdy(p)));float occlusion=0.;float radius=clamp(38./max(1.,-p.z),2.5,22.);float phi=hash(vec3(floor(vUv*size),0))*6.283185;
 for(int i=0;i<12;i++){float a=float(i)*2.399963+phi,r=sqrt((float(i)+.5)/12.)*radius;vec2 q=clamp(vUv+vec2(cos(a),sin(a))*r/size,.001,.999);vec3 v=viewPoint(q,texture(depthMap,q).r)-p;float dist=length(v);occlusion+=max(dot(n,normalize(v))-.13,0.)*(1.-smoothstep(.03,.56,dist));}
 c*=1.-min(.44,occlusion*.16);
 // A shallow, true spatial fog integration restricted to the pool doorway.
 // It samples 3D density on the camera ray, stops at scene depth and fades
 // vertically. It never draws a translucent floor card across furniture.
 vec3 eye=cameraWorld[3].xyz,end=(cameraWorld*vec4(p,1.)).xyz;float len=length(end-eye),trans=1.;vec3 mist=vec3(0.);float stepLen=min(len,7.)/8.;
 for(int i=0;i<8;i++){vec3 q=mix(eye,end,(float(i)+.5)*stepLen/max(.001,len));float region=exp(-pow((q.x-2.25)/1.03,2.)-pow(q.z/1.75,2.))*exp(-max(q.y,0.)*3.8)*step(-.1,q.z);float rho=region*smoothstep(.25,.76,noise3(q*2.8-vec3(time*.05,time*.02,time*.06)))*.40;float a=1.-exp(-rho*stepLen);mist+=trans*a*vec3(.29,.44,.43);trans*=1.-a;}
 fragColor=vec4(c*trans+mist,1.);}`;
export function createChangingEffects(){
 const geo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));const scene=new T.Scene(),screen=new T.Camera();
 const u={colorMap:{value:null},depthMap:{value:null},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},size:{value:new T.Vector2()},time:{value:0}};
 const mat=new T.RawShaderMaterial({name:'Changing depth SSAO and threshold steam',glslVersion:T.GLSL3,vertexShader:vertex,fragmentShader:changingOcclusionFragment,uniforms:u,depthTest:false,depthWrite:false,toneMapped:false});const quad=new T.Mesh(geo,mat);quad.frustumCulled=false;scene.add(quad);
 const bloom=createSpaBloom(T,{cameraMinX:-999,strength:.15,radius:.22,threshold:1.18,knee:.30});let target=null,w0=0,h0=0,time=0;
 return{setTime(t){time=t;},compose(renderer,color,depth,camera,w,h){if(camera.position.z<-.3||camera.position.x>4.20)return color;
  // One depth-based screen pass, no duplicate geometry or normal prepass.
  if(!target||w!==w0||h!==h0){target?.dispose();w0=w;h0=h;target=new T.WebGLRenderTarget(w,h,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:false});}
  const prev=renderer.getRenderTarget();u.colorMap.value=color;u.depthMap.value=depth;u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);u.size.value.set(w,h);u.time.value=time;renderer.setRenderTarget(target);renderer.render(scene,screen);renderer.setRenderTarget(prev);return bloom.compose(renderer,target.texture,depth,camera,w,h,time);
 },dispose(){target?.dispose();geo.dispose();mat.dispose();bloom.dispose();}};
}
export function createChangingMirror(scene,mirror){
 const material=mirror.material,target=new T.WebGLRenderTarget(320,180,{depthBuffer:true,minFilter:T.LinearFilter}),reflected=new T.PerspectiveCamera(),dir=new T.Vector3(),look=new T.Vector3(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),matrix=new T.Matrix4(),plane=new T.Plane(new T.Vector3(0,0,1),-.24);let last=-100,rendering=false;
 const u={mirrorColor:{value:target.texture},mirrorMatrix:{value:matrix},mirrorReady:{value:0}};
 material.onBeforeCompile=s=>{Object.assign(s.uniforms,u);s.vertexShader='varying vec3 mirrorWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nmirrorWorld=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader='varying vec3 mirrorWorld;uniform sampler2D mirrorColor;uniform mat4 mirrorMatrix;uniform float mirrorReady;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec4 mq=mirrorMatrix*vec4(mirrorWorld,1.);vec2 mu=mq.xy/max(.001,mq.w);vec2 md=vec2(.016)*roughnessFactor*roughnessFactor;vec3 mr=(texture2D(mirrorColor,mu+md).rgb+texture2D(mirrorColor,mu-md).rgb+texture2D(mirrorColor,mu+vec2(md.x,-md.y)).rgb+texture2D(mirrorColor,mu+vec2(-md.x,md.y)).rgb)*.25;float mv=mirrorReady*step(0.,mu.x)*step(mu.x,1.)*step(0.,mu.y)*step(mu.y,1.);outgoingLight=mix(outgoingLight,mr*mix(vec3(.96),diffuseColor.rgb,.15),mv*mix(.88,.22,roughnessFactor));\n#include <opaque_fragment>`);};material.customProgramCacheKey=()=> 'hand-wiped-condensation-mirror-v72';
 return{prepare(renderer,camera,t){if(rendering||camera.position.z<.45||camera.position.z>7||camera.position.x>4||t-last<.16)return;last=t;rendering=true;const planeZ=mirror.position.z;
  reflected.copy(camera,false);reflected.position.copy(camera.position);reflected.position.z=2*planeZ-camera.position.z;camera.getWorldDirection(dir);look.copy(camera.position).add(dir);look.z=2*planeZ-look.z;reflected.up.copy(camera.up);reflected.lookAt(look);reflected.layers.set(0);reflected.updateMatrixWorld();matrix.copy(bias).multiply(reflected.projectionMatrix).multiply(reflected.matrixWorldInverse);
  const prev=renderer.getRenderTarget(),clip=renderer.clippingPlanes,auto=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate;const visible=mirror.visible;mirror.visible=false;renderer.clippingPlanes=[plane];renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  try{renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,reflected);u.mirrorReady.value=1;}finally{mirror.visible=visible;renderer.setRenderTarget(prev);renderer.clippingPlanes=clip;renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=needs;rendering=false;}
 },dispose(){target.dispose();}};
}
