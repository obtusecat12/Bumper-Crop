/* V65 localized HDR bloom. This is the UnrealBloomPass algorithm family:
 * luminance high-pass -> separable Gaussian pyramid -> weighted additive bloom.
 * Custom dependency-free adapter for the existing display pipeline, NOT an
 * imported UnrealBloomPass class. Three mips begin at 1/4 rather than 1/2 size.
 * No tone mapping or colour-space encoding occurs in these linear passes.
 * Algorithm reference: https://threejs.org/docs/pages/UnrealBloomPass.html
 */
export const bloomVertex=`precision highp float;in vec3 position;out vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
export const highPassFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sourceColor;uniform vec2 sourceSize;uniform float threshold,knee;
in vec2 vUv;out vec4 fragColor;
vec3 bright(vec2 q){vec3 c=texture(sourceColor,q).rgb;float l=dot(c,vec3(.2126,.7152,.0722));float w=smoothstep(threshold-knee,threshold+knee,l);return c*w;}
void main(){vec2 d=1./sourceSize;vec3 c=bright(vUv+vec2(-d.x,-d.y))+bright(vUv+vec2(d.x,-d.y))+bright(vUv+vec2(-d.x,d.y))+bright(vUv+d);fragColor=vec4(c*.25,1.);}`;
export const blurFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sourceColor;uniform vec2 texelStep;uniform float sigma;
in vec2 vUv;out vec4 fragColor;
void main(){float sum=1.;vec3 c=texture(sourceColor,vUv).rgb;
 for(int i=1;i<=5;i++){float x=float(i),w=exp(-.5*x*x/(sigma*sigma));vec2 d=texelStep*x;c+=(texture(sourceColor,vUv+d).rgb+texture(sourceColor,vUv-d).rgb)*w;sum+=2.*w;}
 fragColor=vec4(c/sum,1.);}`;
export const bloomCompositeFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sourceColor,bloom0,bloom1,bloom2;uniform float strength,radius;
in vec2 vUv;out vec4 fragColor;
void main(){vec4 src=texture(sourceColor,vUv);vec3 a=texture(bloom0,vUv).rgb,b=texture(bloom1,vUv).rgb,c=texture(bloom2,vUv).rgb;
 vec3 weights=mix(vec3(.58,.29,.13),vec3(.31,.38,.31),clamp(radius,0.,1.));
 fragColor=vec4(src.rgb+strength*(a*weights.x+b*weights.y+c*weights.z),src.a);}`;
export const bloomShaderSources=Object.freeze({vertex:bloomVertex,highPass:highPassFragment,blur:blurFragment,composite:bloomCompositeFragment});

export function createSpaBloom(T,{strength=.24,radius=.36,threshold=.92,knee=.18,cameraMinX=3.4,enabled=true}={}){
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),camera=new T.Camera();
 const make=(name,fragmentShader,uniforms)=>new T.RawShaderMaterial({name,glslVersion:T.GLSL3,vertexShader:bloomVertex,fragmentShader,uniforms,depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
 const high=make('Spa bloom / luminance extraction',highPassFragment,{sourceColor:{value:null},sourceSize:{value:new T.Vector2()},threshold:{value:threshold},knee:{value:knee}});
 const blur=make('Spa bloom / separable Gaussian',blurFragment,{sourceColor:{value:null},texelStep:{value:new T.Vector2()},sigma:{value:2.2}});
 const composite=make('Spa bloom / linear additive mip composite',bloomCompositeFragment,{sourceColor:{value:null},bloom0:{value:null},bloom1:{value:null},bloom2:{value:null},strength:{value:strength},radius:{value:radius}});
 const materials=[high,blur,composite],quad=new T.Mesh(geometry,high);quad.frustumCulled=false;scene.add(quad);
 let bright=null,horizontal=[],vertical=[],output=null,width=0,height=0,disposed=false,active=enabled;
 const stats={algorithm:'luminance high-pass + separable Gaussian pyramid + additive composite',mips:3,startScale:.25,passesLastCompose:0,totalPasses:0,skips:0,sizes:[]};
 function disposeTargets(){bright?.dispose();horizontal.forEach(t=>t.dispose());vertical.forEach(t=>t.dispose());output?.dispose();bright=null;horizontal=[];vertical=[];output=null;}
 function allocate(renderer,w,h){if(w===width&&h===height&&output)return;disposeTargets();width=w;height=h;const type=renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
  const target=(a,b)=>{const rt=new T.WebGLRenderTarget(a,b,{type,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false});rt.texture.colorSpace=T.NoColorSpace;rt.texture.generateMipmaps=false;return rt;};
  let a=Math.max(1,Math.ceil(w*.25)),b=Math.max(1,Math.ceil(h*.25));bright=target(a,b);stats.sizes=[];
  for(let i=0;i<3;i++){horizontal.push(target(a,b));vertical.push(target(a,b));stats.sizes.push([a,b]);a=Math.max(1,Math.ceil(a*.5));b=Math.max(1,Math.ceil(b*.5));}
  output=target(w,h);high.uniforms.sourceSize.value.set(w,h);
 }
 function draw(renderer,mat,rt){quad.material=mat;renderer.setRenderTarget(rt);renderer.render(scene,camera);stats.passesLastCompose++;stats.totalPasses++;}
 return{materials,stats,shaderSources:bloomShaderSources,get enabled(){return active;},set enabled(v){active=!!v;},
  compose(renderer,color,depth,viewCamera,w,h,time=0){
   stats.passesLastCompose=0;if(disposed||!active||!color||(viewCamera&&viewCamera.position.x<cameraMinX)){stats.skips++;return color;}
   allocate(renderer,Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
   const saved=renderer.getRenderTarget(),auto=renderer.autoClear,xr=renderer.xr.enabled,shadow=renderer.shadowMap.autoUpdate;
   try{renderer.autoClear=true;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;high.uniforms.sourceColor.value=color;draw(renderer,high,bright);let input=bright;
    for(let i=0;i<3;i++){blur.uniforms.sourceColor.value=input.texture;blur.uniforms.texelStep.value.set(1/input.width,0);blur.uniforms.sigma.value=1.65+i*.48;draw(renderer,blur,horizontal[i]);blur.uniforms.sourceColor.value=horizontal[i].texture;blur.uniforms.texelStep.value.set(0,1/horizontal[i].height);draw(renderer,blur,vertical[i]);input=vertical[i];}
    composite.uniforms.sourceColor.value=color;for(let i=0;i<3;i++)composite.uniforms['bloom'+i].value=vertical[i].texture;draw(renderer,composite,output);return output.texture;
   }finally{renderer.setRenderTarget(saved);renderer.autoClear=auto;renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadow;}
  },
  dispose(){if(disposed)return;disposed=true;disposeTargets();geometry.dispose();materials.forEach(m=>m.dispose());}
 };
}
