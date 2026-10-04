import * as T from './vendor/three.module.min.js';
import {UnrealBloomPass} from './vendor/tiki-post/UnrealBloomPass.js';
const vertex=`precision highp float;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
const atmosphere=`precision highp float;precision highp sampler2D;uniform sampler2D colorMap,depthMap;uniform mat4 inverseProjection,cameraWorld;uniform vec2 size;uniform float time;in vec2 uv;out vec4 fragColor;
vec3 reconstruct(vec2 q,float d){vec4 p=inverseProjection*vec4(q*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){float d=texture(depthMap,uv).r;vec3 p=reconstruct(uv,d),n=normalize(cross(dFdx(p),dFdy(p)));if(dot(n,-p)<0.)n=-n;
 float ao=0.,a0=hash(floor(uv*size))*.8;for(int i=0;i<8;i++){float a=float(i)*2.39996+a0,r=(3.+float(i)*1.4)/max(1.,-p.z*.34);vec2 q=clamp(uv+vec2(cos(a),sin(a))*r/size,.001,.999);vec3 delta=reconstruct(q,texture(depthMap,q).r)-p;float len=length(delta);ao+=max(dot(n,normalize(delta))-.16,0.)*(1.-smoothstep(.025,.38,len));}
 vec3 wp=(cameraWorld*vec4(p,1.)).xyz;float notWater=smoothstep(.10,.32,abs(wp.y+.17));float shade=1.-min(.24,ao*.14)*notWater;
 vec3 eye=cameraWorld[3].xyz,ray=wp-eye;float distance=length(ray),stepSize=min(distance,22.)/10.,trans=1.;vec3 haze=vec3(0.);
 for(int i=0;i<10;i++){vec3 q=eye+normalize(ray)*(float(i)+.5)*stepSize;
  float pool=exp(-dot((q.xz-vec2(-2.,-.65))/vec2(3.2,5.5),(q.xz-vec2(-2.,-.65))/vec2(3.2,5.5)));
  float rho=(.0025+.014*pool*exp(-pow((q.y-.04)*2.7,2.)))*(.4+.6*noise(q.xz*.5+vec2(time*.007,q.y*.25)));
  float f=exp(-dot(q.xz-vec2(4.75,1.4),q.xz-vec2(4.75,1.4))*.31)*exp(-max(0.,q.y)*.8);
  vec3 scatter=vec3(.026,.037,.031)+vec3(.018,.25,.35)*f;float alpha=1.-exp(-rho*stepSize);haze+=trans*alpha*scatter;trans*=1.-alpha;
 }
 fragColor=vec4(texture(colorMap,uv).rgb*shade*trans+haze,1.);}`;
export function createGardenEffects81(){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),camera=new T.Camera();
 const uniforms={colorMap:{value:null},depthMap:{value:null},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},size:{value:new T.Vector2()},time:{value:0}};
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:vertex,fragmentShader:atmosphere,uniforms,depthTest:false,depthWrite:false,toneMapped:false});const quad=new T.Mesh(g,material);quad.frustumCulled=false;scene.add(quad);const bloom=new UnrealBloomPass(new T.Vector2(640,400),.27,.35,1.15);bloom.renderToScreen=false;let out=null,w0=0,h0=0;
 return{stats:{ssaoSamples:8,mistSteps:10,selectiveWaterSSR:96,ssrRefinement:5,mirrorResolution:1024},setTime(t){uniforms.time.value=t;},
 compose(renderer,color,depth,view,w,h){if(!out||w!==w0||h!==h0){out?.dispose();out=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,depthBuffer:false});w0=w;h0=h;bloom.setSize(Math.ceil(w*.5),Math.ceil(h*.5));}
  const saved=renderer.getRenderTarget(),auto=renderer.autoClear;try{renderer.autoClear=true;uniforms.colorMap.value=color;uniforms.depthMap.value=depth;uniforms.inverseProjection.value.copy(view.projectionMatrixInverse);uniforms.cameraWorld.value.copy(view.matrixWorld);uniforms.size.value.set(w,h);renderer.setRenderTarget(out);renderer.render(scene,camera);bloom.render(renderer,null,out,0,false);return out.texture;}finally{renderer.setRenderTarget(saved);renderer.autoClear=auto;}
 },dispose(){g.dispose();material.dispose();out?.dispose();bloom.dispose();}};
}
