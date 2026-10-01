import * as T from './vendor/three.module.min.js';
const SIZE=128,COUNT=SIZE*SIZE,PER_STALL=COUNT/4;
const passVS=`precision highp float;precision highp sampler2D;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
const flightGLSL=`
uniform sampler2D emitters;uniform vec4 valves;uniform float time;
float hash(float n){return fract(sin(n*12.9898+78.233)*43758.5453);}
void launch(float id,float phase,out vec3 p,out vec3 v){
 int stall=int(floor(id/4096.));int nozzle=int(mod(id,55.))+stall*55;
 p=texelFetch(emitters,ivec2(nozzle,0),0).xyz;
 vec3 dir=texelFetch(emitters,ivec2(nozzle,1),0).xyz;
 float seed=id+phase*37.;vec3 spread=vec3(hash(seed)*2.-1.,hash(seed+13.)*2.-1.,hash(seed+21.)*2.-1.);
 v=normalize(dir+spread*.055)*(1.53+hash(seed+7.)*.34);
}
vec3 flight(vec3 p,vec3 v,float age){float k=.18,e=exp(-k*age);vec3 terminal=vec3(0.,-9.81/k,0.);return p+terminal*age+(v-terminal)*(1.-e)/k;}
`;
export const showerComputeFragment=`precision highp float;precision highp sampler2D;in vec2 vUv;
uniform sampler2D oldPosition,oldVelocity;uniform float delta;uniform bool initialize;
layout(location=0)out vec4 nextPosition;layout(location=1)out vec4 nextVelocity;
${flightGLSL}
void main(){float id=floor(gl_FragCoord.y)*128.+floor(gl_FragCoord.x);int stall=int(floor(id/4096.));
 vec4 p=texture(oldPosition,vUv),v=texture(oldVelocity,vUv);float phase=floor(time*31.);
 if(valves[stall]<.5){nextPosition=vec4(0.,-50.,0.,-1.);nextVelocity=vec4(0.);return;}
 if(initialize||p.w<0.||p.y<.018||p.w>.85){
  vec3 start,velocity;launch(id,phase,start,velocity);float age=(initialize||p.w<0.)?hash(id+9.)*.57:hash(id+phase)*delta;
  nextPosition=vec4(flight(start,velocity,age),age);nextVelocity=vec4(mix(vec3(0.,-54.5,0.),velocity,exp(-.18*age)),phase);return;
 }
 float e=exp(-.18*delta);vec3 terminal=vec3(0.,-54.5,0.);
 vec3 moved=p.xyz+terminal*delta+(v.xyz-terminal)*(1.-e)/.18;
 nextPosition=vec4(moved,p.w+delta);nextVelocity=vec4(terminal+(v.xyz-terminal)*e,v.w);
}`;
const particleVS=`precision highp float;precision highp sampler2D;in vec3 position;in vec2 uv;in vec2 particleUV;
uniform mat4 modelViewMatrix,projectionMatrix;uniform sampler2D positions,velocities;uniform bool analytic;
out vec2 form;out vec3 viewPosition;out float opacityWeight;
${flightGLSL}
void main(){float id=floor(particleUV.y*128.)*128.+floor(particleUV.x*128.);int stall=int(floor(id/4096.));
 vec4 p=texture(positions,particleUV);vec3 velocity=texture(velocities,particleUV).xyz;
 if(analytic){vec3 start;float age=mod(time*.94+hash(id)*.62,.62);launch(id,floor(time),start,velocity);p=vec4(flight(start,velocity,age),age);velocity+=vec3(0.,-9.81*age,0.);}
 vec4 center=modelViewMatrix*vec4(p.xyz,1.);vec2 direction=(modelViewMatrix*vec4(velocity,0.)).xy;direction=normalize(direction+vec2(.0001));
 float seed=hash(id+1.);float width=.00065+seed*.0008;float lengthDrop=mix(.002,.009,seed)*(.6+min(length(velocity),5.)*.10);
 center.xy+=vec2(-direction.y,direction.x)*position.x*width+direction*position.y*lengthDrop;
 form=position.xy;viewPosition=center.xyz;opacityWeight=valves[stall]*smoothstep(.045,.12,p.w)*step(.012,p.y)*(p.w>=0.?1.:0.);
 gl_Position=projectionMatrix*center;
}`;
const jetVS=`precision highp float;precision highp sampler2D;in vec3 position;in vec2 uv;in vec2 emitterUV;in vec2 flow;
uniform mat4 modelViewMatrix,projectionMatrix;out vec2 form;out vec3 viewPosition;out float opacityWeight;
${flightGLSL}
void main(){int nozzle=int(emitterUV.x);int stall=int(emitterUV.y);vec3 start=texelFetch(emitters,ivec2(nozzle,0),0).xyz;
 vec3 dir=texelFetch(emitters,ivec2(nozzle,1),0).xyz;float speed=1.68,age=flow.x*.19;vec3 p=flight(start,dir*speed,age);
 vec3 side=normalize(cross(dir,vec3(0.,1.,0.))),up=normalize(cross(side,dir));
 float phase=age*speed*96.-time*29.+float(nozzle)*.71;float radius=.0011*(1.+.24*sin(phase));
 p+=(side*sin(phase*.83)+up*cos(phase*.67))*.00065*flow.x;
 p+=(side*cos(flow.y)+up*sin(flow.y))*radius;
 vec4 view=modelViewMatrix*vec4(p,1.);viewPosition=view.xyz;form=vec2(cos(flow.y)*.85,sin(flow.y)*.55);
 opacityWeight=valves[stall]*(1.-smoothstep(.58,1.,flow.x));gl_Position=projectionMatrix*view;
}`;
export const showerShaderSources={passVertex:passVS,particleVertex:particleVS,jetVertex:jetVS};
export const showerOpticsFragment=`precision highp float;precision highp sampler2D;uniform sampler2D sceneColor,sceneDepth;uniform vec2 resolution,nearFar;uniform vec3 lightView;
in vec2 form;in vec3 viewPosition;in float opacityWeight;out vec4 fragColor;
float linearDepth(float z){return nearFar.x*nearFar.y/(nearFar.y-(nearFar.y-nearFar.x)*z);}
void main(){float r2=dot(form,form);if(r2>1.||opacityWeight<.001)discard;
 vec2 screenUV=gl_FragCoord.xy/resolution;float opaqueDistance=linearDepth(texture(sceneDepth,screenUV).r);
 if(-viewPosition.z>opaqueDistance+.002)discard;
 vec3 N=normalize(vec3(form,sqrt(max(.001,1.-r2))));vec3 V=normalize(-viewPosition);float nv=max(.0,dot(N,V));
 float fresnel=.020+.980*pow(1.-nv,5.);vec2 offset=N.xy*(1.35+fresnel*.9)/resolution;
 vec2 refracted=clamp(screenUV+offset,.001,.999);if(linearDepth(texture(sceneDepth,refracted).r)<-viewPosition.z-.01)refracted=screenUV;
 vec3 background=texture(sceneColor,refracted).rgb;vec3 L=normalize(lightView-viewPosition);vec3 H=normalize(L+V);
 float glint=pow(max(0.,dot(N,H)),110.)*1.45+pow(max(0.,dot(N,normalize(vec3(-.45,.78,.7)))),90.)*.5;
 vec3 transmitted=background*(.98-.22*fresnel)+vec3(.90,.96,.98)*(glint+.035*fresnel);
 float silhouette=1.-smoothstep(.88,1.,r2);fragColor=vec4(transmitted,opacityWeight*silhouette*clamp(.20+.50*glint+.16*fresnel,0.,.82));
}`;
export function createHybridShower(scene,presets,nozzles){
 const emitData=new Float32Array(256*2*4);nozzles.forEach((n,i)=>{emitData.set([...n.position,1],i*4);emitData.set([...n.direction,1],(256+i)*4);});
 const emitters=new T.DataTexture(emitData,256,2,T.RGBAFormat,T.FloatType);emitters.needsUpdate=true;emitters.minFilter=emitters.magFilter=T.NearestFilter;emitters.generateMipmaps=false;
 const uniforms={emitters:{value:emitters},valves:{value:new T.Vector4()},time:{value:0},positions:{value:null},velocities:{value:null},analytic:{value:false},sceneColor:{value:null},sceneDepth:{value:null},resolution:{value:new T.Vector2()},nearFar:{value:new T.Vector2()},lightView:{value:new T.Vector3()}};
 const material=vs=>new T.RawShaderMaterial({name:'Refractive shower / physically lit droplets',glslVersion:T.GLSL3,vertexShader:vs,fragmentShader:showerOpticsFragment,uniforms,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false});
 const quad=new T.InstancedBufferGeometry();quad.setIndex([0,1,2,0,2,3]);quad.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));quad.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
 const lookup=new Float32Array(COUNT*2);for(let i=0;i<COUNT;i++){lookup[i*2]=(i%SIZE+.5)/SIZE;lookup[i*2+1]=(Math.floor(i/SIZE)+.5)/SIZE;}quad.setAttribute('particleUV',new T.InstancedBufferAttribute(lookup,2));quad.instanceCount=COUNT;
 const drops=new T.Mesh(quad,material(particleVS));drops.name='GPU shower beads / 16384';drops.frustumCulled=false;drops.layers.set(3);scene.add(drops);
 const positions=[],emitterUV=[],flow=[],uv=[],indices=[];
 for(let i=0;i<nozzles.length;i++){const base=positions.length/3;for(let s=0;s<=9;s++)for(let a=0;a<=4;a++){positions.push(...nozzles[i].position);emitterUV.push(i,Math.floor(i/55));flow.push(s/9,a/4*Math.PI*2);uv.push(a/4,s/9);}
  for(let s=0;s<9;s++)for(let a=0;a<4;a++){const j=base+s*5+a;indices.push(j,j+5,j+1,j+1,j+5,j+6);}}
 const geometry=new T.BufferGeometry();geometry.setIndex(indices);for(const[n,a,k]of[['position',positions,3],['emitterUV',emitterUV,2],['flow',flow,2],['uv',uv,2]])geometry.setAttribute(n,new T.Float32BufferAttribute(a,k));
 const jets=new T.Mesh(geometry,material(jetVS));jets.name='Dynamic nozzle filaments / crossfade to beads';jets.frustumCulled=false;jets.layers.set(3);scene.add(jets);
 let targets=null,swap=0,lastTime=0,t=0,initialized=false,computeScene=null,computeMat=null,computeQuad=null;
 const computeCamera=new T.Camera();
 const api={get active(){return presets.some(p=>p>0);},stats:{particles:COUNT,jets:nozzles.length,computePasses:0,mode:'pending'},update(time){t=time;uniforms.time.value=time;uniforms.valves.value.fromArray(presets.map(v=>v>0?1:0));},
  prepare(renderer){if(!api.active){lastTime=t;return;}if(!initialized){initialized=true;uniforms.analytic.value=!renderer.extensions.has('EXT_color_buffer_float');api.stats.mode=uniforms.analytic.value?'analytic GPU fallback':'GPU MRT ping-pong';
   if(!uniforms.analytic.value){targets=[0,1].map(()=>new T.WebGLRenderTarget(SIZE,SIZE,{count:2,type:T.FloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,generateMipmaps:false}));
    computeMat=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:passVS,fragmentShader:showerComputeFragment,uniforms:{emitters:uniforms.emitters,valves:uniforms.valves,time:uniforms.time,oldPosition:{value:null},oldVelocity:{value:null},delta:{value:0},initialize:{value:true}},depthTest:false,depthWrite:false,toneMapped:false});
    computeScene=new T.Scene();computeQuad=new T.Mesh(new T.PlaneGeometry(2,2),computeMat);computeQuad.frustumCulled=false;computeScene.add(computeQuad);}}
   if(targets){const prev=renderer.getRenderTarget(),auto=renderer.autoClear;const input=targets[swap],output=targets[1-swap];computeMat.uniforms.oldPosition.value=input.textures[0];computeMat.uniforms.oldVelocity.value=input.textures[1];computeMat.uniforms.delta.value=Math.max(0,Math.min(t-lastTime,1/30));
    try{renderer.autoClear=true;renderer.setRenderTarget(output);renderer.render(computeScene,computeCamera);swap=1-swap;uniforms.positions.value=output.textures[0];uniforms.velocities.value=output.textures[1];computeMat.uniforms.initialize.value=false;api.stats.computePasses++;}finally{renderer.setRenderTarget(prev);renderer.autoClear=auto;}}
   lastTime=t;
  },bind(color,depth,w,h,camera){uniforms.sceneColor.value=color;uniforms.sceneDepth.value=depth;uniforms.resolution.value.set(w,h);uniforms.nearFar.value.set(camera.near,camera.far);uniforms.lightView.value.set(-6.4,2.67,-3.6).applyMatrix4(camera.matrixWorldInverse);},
  dispose(){targets?.forEach(t=>t.dispose());computeQuad?.geometry.dispose();computeMat?.dispose();emitters.dispose();drops.geometry.dispose();drops.material.dispose();jets.geometry.dispose();jets.material.dispose();scene.remove(drops,jets);delete scene.userData.showerWater;}
 };scene.userData.showerWater=api;return api;
}
