// Selective half-resolution SSR. Reuses the already-rendered scene and depth;
// no second scene render, ground plane or mirror camera. Misses retain PBR.
export const reflectVertex=`precision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
export const reflectFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth,wetMap;uniform mat4 inverseProjection,cameraWorld,ssrView,ssrProjection;
uniform vec2 resolution;uniform float time;uniform vec4 marks[12];in vec2 vUv;out vec4 fragColor;
vec3 viewAt(vec2 q,float d){vec4 v=inverseProjection*vec4(q*2.-1.,d*2.-1.,1.);return v.xyz/v.w;}
float wetness(vec2 p){float r=length(p-vec2(8.9,-2.65)),n=texture(wetMap,p*.61).r;
 float belt=exp(-pow((r-2.75)/.42,2.))*.72;
 float trail=exp(-pow((p.x-10.5)/.39,2.))*smoothstep(-1.3,.2,p.y)*(1.-smoothstep(2.7,3.9,p.y))*.4;
 float wet=max(belt,trail)*smoothstep(.20,.76,n);
 for(int i=0;i<12;i++){vec2 d=p-marks[i].xy;float a=marks[i].w;d=mat2(cos(a),-sin(a),sin(a),cos(a))*d;
  float foot=1.-smoothstep(.65,1.,length(d/vec2(.085,.18)));wet=max(wet,foot*exp(-max(0.,time-marks[i].z)/65.)*.93);}
 return clamp(wet,0.,1.);
}
void main(){fragColor=vec4(0.);float dep=texture(sceneDepth,vUv).r;if(dep>.99999)return;
 vec3 p=viewAt(vUv,dep),world=(cameraWorld*vec4(p,1.)).xyz;
 if(world.x<4.28||world.x>12.74||world.z< -5.45||world.z>4.68||abs(world.y)>.038||length(world.xz-vec2(8.9,-2.65))<2.52)return;
 float wet=wetness(world.xz);if(wet<.055)return;
 vec2 slope=vec2(sin(world.x*31.+world.z*16.+time*.2),sin(world.z*27.-world.x*13.))*.010;
 vec3 n=normalize(mat3(ssrView)*vec3(slope.x,1.,slope.y));vec3 ray=normalize(reflect(normalize(p),n));
 vec3 start=p+n*.026;float travel=.07,stepSize=.085;vec2 hitUV=vec2(0.);float confidence=0.;
 for(int i=0;i<24;i++){travel+=stepSize;stepSize*=1.15;vec3 probe=start+ray*travel;if(probe.z>-.08)break;
  vec4 clip=ssrProjection*vec4(probe,1.);vec2 q=clip.xy/clip.w*.5+.5;if(any(lessThan(q,vec2(.008)))||any(greaterThan(q,vec2(.992))))break;
  float d=texture(sceneDepth,q).r;if(d>.99999)continue;vec3 other=viewAt(q,d);float gap=other.z-probe.z;
  if(gap>0.&&gap<stepSize*1.35+.04){hitUV=q;confidence=1.-smoothstep(.025,.26,abs((cameraWorld*vec4(other,1.)).y));confidence=1.-confidence;break;}
 }
 if(confidence<.01)return;vec2 edge=min(hitUV,1.-hitUV);confidence*=smoothstep(0.,.10,min(edge.x,edge.y));
 vec2 px=vec2(1.4)/resolution;vec3 reflection=(texture(sceneColor,hitUV).rgb*2.+texture(sceneColor,hitUV+px).rgb+texture(sceneColor,hitUV-px).rgb)*.25;
 float fresnel=.035+.78*pow(1.-max(0.,dot(normalize(-p),n)),5.);
 fragColor=vec4(reflection,clamp(wet*fresnel*confidence,.0,.62));
}`;
export const reflectComposite=`precision highp float;precision highp sampler2D;uniform sampler2D sourceColor,reflection,sceneDepth;uniform mat4 inverseProjection,cameraWorld;in vec2 vUv;out vec4 fragColor;
void main(){vec4 c=texture(sourceColor,vUv),r=texture(reflection,vUv);vec4 v=inverseProjection*vec4(vUv*2.-1.,texture(sceneDepth,vUv).r*2.-1.,1.);vec3 w=(cameraWorld*vec4(v.xyz/v.w,1.)).xyz;float mask=1.-smoothstep(.018,.042,abs(w.y));fragColor=vec4(mix(c.rgb,r.rgb,r.a*mask),c.a);}`;
export function createSpaReflections(T,{wetTexture,marks,clock}){
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),camera=new T.Camera();
 const common={inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},sceneDepth:{value:null}};
 const ray=new T.RawShaderMaterial({name:'V66 selective 24-step floor SSR',glslVersion:T.GLSL3,vertexShader:reflectVertex,fragmentShader:reflectFragment,uniforms:{...common,sceneColor:{value:null},wetMap:wetTexture,marks,time:clock,resolution:{value:new T.Vector2()},ssrView:{value:new T.Matrix4()},ssrProjection:{value:new T.Matrix4()}},depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
 const composite=new T.RawShaderMaterial({name:'V66 SSR depth-aware resolve',glslVersion:T.GLSL3,vertexShader:reflectVertex,fragmentShader:reflectComposite,uniforms:{...common,sourceColor:{value:null},reflection:{value:null}},depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
 const quad=new T.Mesh(geometry,ray);quad.frustumCulled=false;scene.add(quad);let half=null,output=null,width=0,height=0;const stats={sceneCaptures:0,raySteps:24,scale:.5,passes:0};
 function allocate(renderer,w,h){if(w===width&&h===height&&output)return;half?.dispose();output?.dispose();width=w;height=h;const type=renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
  const target=(w,h)=>new T.WebGLRenderTarget(w,h,{type,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});half=target(Math.ceil(w*.5),Math.ceil(h*.5));output=target(w,h);}
 return{stats,materials:[ray,composite],compose(renderer,color,depth,view,w,h){allocate(renderer,w,h);common.sceneDepth.value=depth;common.inverseProjection.value.copy(view.projectionMatrixInverse);common.cameraWorld.value.copy(view.matrixWorld);ray.uniforms.ssrView.value.copy(view.matrixWorldInverse);ray.uniforms.ssrProjection.value.copy(view.projectionMatrix);ray.uniforms.sceneColor.value=color;ray.uniforms.resolution.value.set(w,h);composite.uniforms.sourceColor.value=color;composite.uniforms.reflection.value=half.texture;
  const saved=renderer.getRenderTarget(),auto=renderer.autoClear,xr=renderer.xr.enabled,shadow=renderer.shadowMap.autoUpdate;
  try{renderer.autoClear=true;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;quad.material=ray;renderer.setRenderTarget(half);renderer.render(scene,camera);quad.material=composite;renderer.setRenderTarget(output);renderer.render(scene,camera);stats.passes+=2;return output.texture;}
  finally{renderer.setRenderTarget(saved);renderer.autoClear=auto;renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadow;}
 },dispose(){half?.dispose();output?.dispose();geometry.dispose();ray.dispose();composite.dispose();}};
}
