import * as T from './vendor/three.module.min.js';
export const surfaceVertex=`precision highp float;precision highp sampler2D;
in vec3 position;in vec2 lakeCoord;in float facetTone;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;
out vec3 worldP;out vec2 waterXZ;out float tone;
void main(){worldP=(modelMatrix*vec4(position,1.)).xyz;waterXZ=lakeCoord;tone=facetTone;gl_Position=projectionMatrix*viewMatrix*vec4(worldP,1.);}`;
export const surfaceFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D normalA,normalB,sceneColor,sceneDepth,uImpactNormals;
uniform vec2 size,uImpactOrigin;uniform float time,nearPlane,farPlane,fadeDistance,uImpactActive;
uniform vec3 eye,sun,skyColor;uniform float mist;
in vec3 worldP;in vec2 waterXZ;in float tone;out vec4 outColor;
float linearZ(float d){return nearPlane*farPlane/(farPlane-d*(farPlane-nearPlane));}
void main(){
 vec2 base=waterXZ*.10;
 vec3 a=texture(normalA,base+vec2(.03,.02)*time).xyz*2.-1.;
 vec3 b=texture(normalB,base*1.37+vec2(-.02,.04)*time).xyz*2.-1.;
 vec3 n=normalize(vec3(a.xy+b.xy,a.z*b.z));
 vec2 rip=(worldP.xz-uImpactOrigin)/24.;
 if(uImpactActive>.5&&all(greaterThan(rip,vec2(0)))&&all(lessThan(rip,vec2(1))))n.xy+=(texture(uImpactNormals,rip).rg*2.-1.)*.8;
 vec3 N=normalize(vec3(n.x,n.z,n.y));
 vec3 V=normalize(worldP-eye),view=-V;
 vec2 uv=gl_FragCoord.xy/size;float sceneZ=linearZ(texture(sceneDepth,uv).r),waterZ=linearZ(gl_FragCoord.z);
 float thickness=max(0.,sceneZ-waterZ),shore=clamp(thickness/fadeDistance,0.,1.);
 vec2 offset=N.xz*.013*shore;vec2 bentUV=clamp(uv+offset,vec2(.001),vec2(.999));
 // Do not refract a foreground bank into the water.
 if(linearZ(texture(sceneDepth,bentUV).r)<waterZ)bentUV=uv;
 vec3 bottom=texture(sceneColor,bentUV).rgb;
 vec3 reflection=mix(skyColor,vec3(.26,.34,.37),clamp(N.y*.5,0.,1.));
 float fresnel=.0204+.9796*pow(1.-abs(dot(N,view)),5.);
 float spec=pow(max(0.,dot(N,normalize(view+sun))),68.);
 float quantized=floor(spec*4.)/4.;
 vec3 absorbed=bottom*exp(-vec3(.3,.08,.02)*min(thickness,18.)) + vec3(.035,.085,.092)*(1.-exp(-thickness*.18));
 vec3 water=mix(absorbed,reflection,clamp(.16+fresnel*.72,0.,.92))*mix(.93,1.05,clamp(tone,0.,1.));
 water+=quantized*vec3(.56,.61,.58);
 if(!gl_FrontFacing){
  vec3 R=refract(V,-N,1.33);
  if(length(R)==0.)water=vec3(.026,.065,.078)+vec3(.024,.03,.035)*abs(N.x+N.z);
  else {vec2 windowUV=clamp(uv+R.xz*.022,vec2(.001),vec2(.999));water=mix(texture(sceneColor,windowUV).rgb,skyColor,.20);}
  shore=1.;
 }
 float noise=texture(normalA,base*2.4+vec2(.017,-.021)*time).r;
 float foam=step(.0001,thickness)*(1.-step(.3,thickness))*smoothstep(.50,.64,noise)*smoothstep(0.,.035,thickness);
 water=mix(water,vec3(.66,.70,.64),foam*.75);
 float fog=1.-exp(-length(worldP-eye)*(.003+mist*.025));water=mix(water,skyColor,clamp(fog,0.,.95));
 // Manual shore alpha avoids transparent sorting and preserves the opaque depth.
 outColor=vec4(mix(bottom,water,shore),1.);
}`;
export function createWaterSurface(ripples){
 const loader=new T.TextureLoader(),pending=[];
 const load=url=>{let yes,no;pending.push(new Promise((resolve,reject)=>{yes=resolve;no=reject;}));return loader.load(url,yes,undefined,no);};
 const normalA=load(new URL('./textures/v28/water-normal-a.png',import.meta.url).href),normalB=load(new URL('./textures/v28/water-normal-b.png',import.meta.url).href),atlas=load(new URL('./textures/v28/water-caustics-atlas.png',import.meta.url).href);
 for(const t of [normalA,normalB]){t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;}
 atlas.colorSpace=T.NoColorSpace;atlas.minFilter=atlas.magFilter=T.LinearFilter;atlas.generateMipmaps=false;atlas.flipY=false;
 const time={value:0};const u={normalA:{value:normalA},normalB:{value:normalB},sceneColor:{value:null},sceneDepth:{value:null},size:{value:new T.Vector2()},time,nearPlane:{value:.1},farPlane:{value:480},fadeDistance:{value:.65},eye:{value:new T.Vector3()},sun:{value:new T.Vector3(-.45,.84,-.30).normalize()},skyColor:{value:new T.Color(.40,.47,.49)},mist:{value:0},...ripples.binding};
 const material=new T.RawShaderMaterial({name:'V28 depth-softened two-sided lake',glslVersion:T.GLSL3,vertexShader:surfaceVertex,fragmentShader:surfaceFragment,uniforms:u,side:T.DoubleSide,depthTest:true,depthWrite:true,transparent:false,blending:T.NoBlending,toneMapped:false});
 const attached=new WeakSet();
 function attach(chunk){chunk.group.traverse(o=>{
  if(o.material?.name==='PS1 low-poly detailed ripple water'){o.userData.originalWaterMaterial=o.material;o.material=material;o.layers.set(2);o.userData.waterSurface=true;}
  if(o.name!=='sculpted-ground-and-wheel-ruts'||chunk.field.type!=='pond'||!o.material||attached.has(o.material))return;
  const m=o.material;attached.add(m);const compile=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m),f=chunk.field;
  m.onBeforeCompile=(s,r)=>{compile.call(m,s,r);s.uniforms.v28Caustics={value:atlas};s.uniforms.v28Time=time;s.uniforms.v28Lake={value:new T.Vector3(f.cx,f.lakeY,f.cz)};
   s.vertexShader='varying vec3 vCausticLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCausticLocal=position;');
   s.fragmentShader=`uniform sampler2D v28Caustics;uniform float v28Time;uniform vec3 v28Lake;varying vec3 vCausticLocal;
   vec2 causticUV(vec2 p,float frame){vec2 tile=vec2(mod(frame,4.),floor(frame/4.));return (tile+(fract(p)*255.+.5)/256.)/4.;}\n`+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float depthBelow=v28Lake.y-vCausticLocal.y;
   if(depthBelow>0.){float frame=mod(v28Time*8.,16.);vec2 p=(vCausticLocal.xz-v28Lake.xz)*.27;
   float c=mix(texture2D(v28Caustics,causticUV(p,floor(frame))).r,texture2D(v28Caustics,causticUV(p,mod(floor(frame)+1.,16.))).r,fract(frame));
   diffuseColor.rgb*=1.+c*.72*exp(-depthBelow*.19)*smoothstep(0.,.18,depthBelow);}`);
  };m.customProgramCacheKey=()=>key()+'|v28-caustics';m.needsUpdate=true;
 });}
 function update(clock,camera,color,sun,mist){time.value=clock;u.eye.value.copy(camera.position);u.nearPlane.value=camera.near;u.farPlane.value=camera.far;if(color)u.skyColor.value.copy(color);if(sun)u.sun.value.copy(sun).normalize();u.mist.value=mist||0;}
 return {ready:Promise.all(pending),material,uniforms:u,normalA,normalB,atlas,time,attach,update,dispose(){material.dispose();normalA.dispose();normalB.dispose();atlas.dispose();}};
}
