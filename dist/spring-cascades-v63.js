/* Spring V63 — three independent water scales, in metres.
 * All meshes remain on layer 0. Hide group during the opaque capture, then
 * bind(capture.texture,capture.depthTexture,width,height,camera) before render.
 * prepare(renderer) executes at most four 1/60s MRT steps per update and is
 * safe before either the normal render or its captures. No texture is owned
 * or mutated unless it was created inside this module.
 */
const GRID=64, PARTICLES=GRID*GRID, GRAVITY=9.81;
const PASS_VERTEX=`precision highp float;
in vec3 position;out vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
const NOISE_GLSL=`
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+1.),f.x),f.y);}
float fnoise(vec2 p){return .58*noise(p)+.28*noise(p*2.03+7.1)+.14*noise(p*4.17+23.7);}
float waterFresnel(float c){c=clamp(c,0.,1.);float n=1.3335,ct=sqrt(1.-(1.-c*c)/(n*n));float rs=(c-n*ct)/(c+n*ct),rp=(n*c-ct)/(n*c+ct);return .5*(rs*rs+rp*rp);}
float linearDepth(float z,vec2 nf){return nf.x*nf.y/(nf.y-z*(nf.y-nf.x));}
`;
export const cascadeSheetVertex=`precision highp float;
in vec3 position,normal;in vec2 uv;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;
uniform float time,kind;
out vec2 vUv;out vec3 worldPosition,worldNormal,viewPosition;
void main(){vUv=uv;vec3 p=position;
 float amplitude=kind>1.5?.0022:.0038;
 float travel=uv.y*29.-time*(kind>1.5?2.4:15.);
 p+=normal*amplitude*(sin(travel+uv.x*24.)+.40*sin(travel*1.73-uv.x*38.));
 vec4 world=modelMatrix*vec4(p,1.);worldPosition=world.xyz;
 worldNormal=normalize(mat3(modelMatrix)*normal);vec4 view=viewMatrix*world;viewPosition=view.xyz;
 gl_Position=projectionMatrix*view;
}`;
export const cascadeSheetFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth,ripple,caustics,flowMap;
uniform vec2 resolution,nearFar;uniform vec3 eye;
uniform float time,kind,ready,pathLength,seed;
uniform vec4 pebbles[12];
in vec2 vUv;in vec3 worldPosition,worldNormal,viewPosition;out vec4 fragColor;
${NOISE_GLSL}
void main(){
 bool creek=kind>1.5;bool rivulet=kind>.5&&kind<1.5;
 vec2 q=vec2(vUv.x*6.7+seed,vUv.y*pathLength*2.5-time*1.5);
 vec2 flow=texture(flowMap,clamp(vUv,0.,1.)).rg*2.-1.;
 if(creek)q=worldPosition.xz*2.7-flow*time*.25;
 float n=fnoise(q),fine=fnoise(q*vec2(4.3,1.6)+vec2(7.,-time*.9));
 float rippleA=texture(ripple,q*.19+vec2(time*.011,-time*.023)).r;
 float rippleB=texture(ripple,q*.32+vec2(-time*.017,time*.014)).r;
 float edge=smoothstep(0.,.075+noise(vec2(vUv.y*31.,seed+2.))*.045,vUv.x)*smoothstep(0.,.065+noise(vec2(vUv.y*27.,seed+13.))*.065,1.-vUv.x);
 // Eroding holes and irregular boundaries belong to the moving film itself.
 float erosion=smoothstep(.19,.43,n+.12*sin(vUv.x*31.+n*4.));
 float coverage=mix(.025,.94,erosion)*edge;
 if(rivulet){edge=1.;coverage=.77;}
 if(creek)coverage=edge*.93;
 if(coverage<.012)discard;
 vec3 N=normalize(worldNormal);if(!gl_FrontFacing)N=-N;
 vec3 crossSlope=normalize(cross(abs(N.y)<.9?vec3(0.,1.,0.):vec3(0.,0.,1.),N));
 vec3 downSlope=normalize(cross(N,crossSlope));
 float dx=(fnoise(q+vec2(.045,0.))-fnoise(q-vec2(.045,0.)))*1.7;
 float dy=(fnoise(q+vec2(0.,.045))-fnoise(q-vec2(0.,.045)))*1.3;
 N=normalize(N+crossSlope*(dx+(rippleA-.5)*.14)+downSlope*(dy+(rippleB-.5)*.10));
 vec3 V=normalize(eye-worldPosition);float fresnel=waterFresnel(abs(dot(N,V)));
 vec2 screenUV=gl_FragCoord.xy/resolution;
 float waterDepth=-viewPosition.z;
 float behind=linearDepth(texture(sceneDepth,screenUV).r,nearFar)-waterDepth;
 if(ready>.5&&behind<-.014)discard;
 vec2 distortion=vec2(dx,dy+(rippleA-.5)*.10)*(creek?.009:.014);
 vec2 refrUV=clamp(screenUV+distortion,.001,.999);
 if(linearDepth(texture(sceneDepth,refrUV).r,nearFar)<waterDepth-.015)refrUV=screenUV;
 float depth=clamp(behind,0.,creek?.38:.075);
 vec3 transmitted=texture(sceneColor,refrUV).rgb*exp(-vec3(.55,.20,.16)*depth);
 vec3 reflected=vec3(.075,.105,.100)+vec3(.13,.15,.14)*pow(max(N.y,0.),2.);
 vec3 water=mix(transmitted,reflected,clamp(fresnel,.02,.58));
 water=mix(vec3(.075,.115,.107),water,ready);
 vec3 H=normalize(normalize(vec3(-.4,.9,.5))+V);
 float glint=pow(max(dot(N,H),0.),creek?92.:128.);
 water+=vec3(.75,.84,.81)*glint*.42;
 float foam=pow(smoothstep(.56,.9,fine),2.)*.20;
 foam+=smoothstep(.74,1.,vUv.y)*smoothstep(.49,.83,n)*.29;
 if(rivulet)foam*=.58;
 if(creek){
  foam=0.;
  for(int i=0;i<12;i++){
   vec4 p=pebbles[i];vec2 d=vec2((vUv.x-p.x)/max(p.z,.0001),(vUv.y-p.y)*pathLength/max(p.w,.0001));
   float ring=exp(-pow((length(d)-1.18)*3.9,2.));
   float wake=exp(-abs(d.x)*3.8)*exp(-max(d.y,0.)*.8)*step(0.,d.y)*step(d.y,5.);
   foam+=p.z>0.?(.40*ring+.15*wake)*smoothstep(.32,.76,fnoise(q*3.+float(i))):0.;
  }
  foam+=pow(max(0.,1.-edge),2.)*smoothstep(.39,.8,fine)*.23;
  float c=min(texture(caustics,worldPosition.xz*.86+flow*time*.011).r,texture(caustics,worldPosition.xz*.93-flow*time*.016).r);
  water+=vec3(.025,.055,.043)*pow(c,2.)*exp(-depth*3.);
 }
 foam=clamp(foam,0.,.66);
 water=mix(water,vec3(.78,.87,.82),foam);
 float alpha=coverage*clamp(.36+fresnel*.54+foam*.67+glint*.22,.12,.88);
 if(creek)alpha=coverage*clamp(.50+fresnel*.35+foam*.4,.42,.93);
 fragColor=vec4(water,alpha);
}`;
export const cascadeImpactVertex=`precision highp float;
in vec3 position;in vec2 uv;uniform mat4 modelViewMatrix,projectionMatrix;
out vec2 vUv;out vec3 viewPosition;
void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);viewPosition=p.xyz;gl_Position=projectionMatrix*p;}`;
export const cascadeImpactFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneDepth,ripple;uniform vec2 resolution,nearFar;uniform float time,seed,ready;
in vec2 vUv;in vec3 viewPosition;out vec4 fragColor;
${NOISE_GLSL}
void main(){vec2 p=(vUv-.5)*2.;float radius=length(p);
 if(radius>1.)discard;
 float behind=linearDepth(texture(sceneDepth,gl_FragCoord.xy/resolution).r,nearFar)+viewPosition.z;
 if(ready>.5&&behind<-.015)discard;
 float n=fnoise(p*7.+vec2(time*.35,-time*.42)+seed);
 float center=(1.-smoothstep(.06,.48,radius))*smoothstep(.30,.72,n);
 float foam=center*.56;
 for(int i=0;i<4;i++){
  float age=fract(time*.72+float(i)*.25+seed*.13),r=.13+age*.80;
  float band=exp(-pow((radius-r)*75.,2.));
  foam+=band*(1.-age)*(.13+.18*noise(p*10.+seed));
 }
 float broken=texture(ripple,p*.47+vec2(time*.016,-time*.028)).r;
 foam+=(1.-smoothstep(.14,.61,radius))*smoothstep(.60,.87,broken)*.23;
 float alpha=clamp(foam*(1.-smoothstep(.80,1.,radius)),0.,.61);
 if(alpha<.008)discard;
 fragColor=vec4(mix(vec3(.46,.64,.58),vec3(.87,.92,.85),clamp(center+n*.3,0.,1.)),alpha);
}`;
const FLIGHT_GLSL=`
uniform vec3 impacts[2];uniform float time,waterY;
float hash(float n){return fract(sin(n*12.9898+78.233)*43758.5453);}
void launch(float id,float cycle,out vec3 p,out vec3 velocity,out float lifespan){
 float s=id+cycle*19.13;float angle=hash(s+3.)*6.283185307;
 float radial=.16+hash(s+11.)*.42;float upward=.48+pow(hash(s+27.),1.8)*1.45;
 int source=int(mod(id,2.));vec2 circle=vec2(cos(angle),sin(angle));
 p=impacts[source]+vec3(circle.x,0.,circle.y)*(.012+hash(s+19.)*.095);
 p.y=waterY+.012+hash(s+31.)*.012;
 velocity=vec3(circle.x*radial,upward,circle.y*radial);
 lifespan=(upward+sqrt(upward*upward+19.62*(p.y-waterY)))/9.81;
}
vec3 flight(vec3 p,vec3 v,float age){return p+v*age+vec3(0.,-4.905*age*age,0.);}
`;
export const cascadeComputeFragment=`precision highp float;precision highp sampler2D;
in vec2 vUv;uniform sampler2D oldPosition,oldVelocity;uniform float delta;uniform bool initialize;
layout(location=0)out vec4 nextPosition;layout(location=1)out vec4 nextVelocity;
${FLIGHT_GLSL}
void main(){float id=floor(gl_FragCoord.y)*64.+floor(gl_FragCoord.x);
 vec4 p=texture(oldPosition,vUv),v=texture(oldVelocity,vUv);
 if(initialize||p.w>=v.w||p.y<waterY){
  vec3 start,velocity;float lifespan;launch(id,floor(time*19.)+hash(id)*7.,start,velocity,lifespan);
  float age=initialize?hash(id+17.)*lifespan:hash(id+time)*delta;
  nextPosition=vec4(flight(start,velocity,age),age);
  nextVelocity=vec4(velocity+vec3(0.,-9.81*age,0.),lifespan);return;
 }
 nextPosition=vec4(p.xyz+v.xyz*delta+vec3(0.,-4.905*delta*delta,0.),p.w+delta);
 nextVelocity=vec4(v.xyz+vec3(0.,-9.81*delta,0.),v.w);
}`;
export const cascadeParticleVertex=`precision highp float;precision highp sampler2D;
in vec3 position;in vec2 particleUV;
uniform mat4 modelViewMatrix,projectionMatrix;
uniform sampler2D positions,velocities;uniform bool analytic;
out vec2 form;out vec3 viewPosition;out float weight;
${FLIGHT_GLSL}
void main(){float id=floor(particleUV.y*64.)*64.+floor(particleUV.x*64.);
 vec4 p=texture(positions,particleUV),v=texture(velocities,particleUV);
 if(analytic){vec3 start,velocity;float lifespan;launch(id,0.,start,velocity,lifespan);float age=mod(time+hash(id)*lifespan,lifespan);p=vec4(flight(start,velocity,age),age);v=vec4(velocity+vec3(0.,-9.81*age,0.),lifespan);}
 vec4 center=modelViewMatrix*vec4(p.xyz,1.);
 vec2 dir=normalize((modelViewMatrix*vec4(v.xyz,0.)).xy+vec2(.00001));
 float size=.0013+pow(hash(id+9.),3.)*.0034;
 float stretch=1.1+min(length(v.xyz),2.)*.55;
 center.xy+=vec2(-dir.y,dir.x)*position.x*size+dir*position.y*size*stretch;
 form=position.xy;viewPosition=center.xyz;
 weight=smoothstep(.0,.024,p.w)*(1.-smoothstep(.80,1.,p.w/max(v.w,.001)))*step(waterY+.001,p.y);
 gl_Position=projectionMatrix*center;
}`;
export const cascadeParticleFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth;uniform vec2 resolution,nearFar;uniform float ready;
in vec2 form;in vec3 viewPosition;in float weight;out vec4 fragColor;
${NOISE_GLSL}
void main(){float r=dot(form,form);if(r>1.||weight<.002)discard;
 vec2 screenUV=gl_FragCoord.xy/resolution;
 float behind=linearDepth(texture(sceneDepth,screenUV).r,nearFar)+viewPosition.z;
 if(ready>.5&&behind<-.003)discard;
 vec3 N=normalize(vec3(form,sqrt(max(.001,1.-r))));vec3 V=normalize(-viewPosition);
 float f=waterFresnel(max(0.,dot(N,V)));
 vec2 uv=clamp(screenUV+N.xy*(.8+f*.9)/resolution,.001,.999);
 if(linearDepth(texture(sceneDepth,uv).r,nearFar)<-viewPosition.z-.008)uv=screenUV;
 vec3 base=mix(vec3(.20,.29,.27),texture(sceneColor,uv).rgb,ready);
 float glint=pow(max(0.,dot(N,normalize(V+vec3(-.4,.8,.5)))),95.);
 vec3 color=base*(1.-f*.35)+vec3(.78,.9,.86)*(glint*.9+f*.18);
 float soft=ready>.5?smoothstep(0.,.02,max(behind,0.)):1.;
 fragColor=vec4(color,weight*(1.-smoothstep(.82,1.,r))*soft*clamp(.14+glint*.5+f*.28,0.,.71));
}`;
export const shaderSources={passVertex:PASS_VERTEX,sheetVertex:cascadeSheetVertex,sheetFragment:cascadeSheetFragment,impactVertex:cascadeImpactVertex,impactFragment:cascadeImpactFragment,computeFragment:cascadeComputeFragment,particleVertex:cascadeParticleVertex,particleFragment:cascadeParticleFragment};

function fallbackTexture(T){const t=new T.DataTexture(new Uint8Array([128,128,128,255]),1,1,T.RGBAFormat);t.needsUpdate=true;return t;}
function baseUniforms(T,textures={}){
 const fallback=fallbackTexture(T);
 return {fallback,uniforms:{time:{value:0},kind:{value:0},seed:{value:0},pathLength:{value:1},ready:{value:0},sceneColor:{value:fallback},sceneDepth:{value:fallback},ripple:{value:textures['spring-ripples']||fallback},caustics:{value:textures['water-caustics']||fallback},flowMap:{value:fallback},resolution:{value:new T.Vector2(1,1)},nearFar:{value:new T.Vector2(.06,40)},eye:{value:new T.Vector3()},pebbles:{value:Array.from({length:12},()=>new T.Vector4())}}};
}
function rawMaterial(T,name,uniforms,vertexShader,fragmentShader){return new T.RawShaderMaterial({name,uniforms,glslVersion:T.GLSL3,vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false});}
function bindUniforms(uniforms,color,depth,w,h,camera){uniforms.sceneColor.value=color;uniforms.sceneDepth.value=depth;uniforms.resolution.value.set(Math.max(1,w),Math.max(1,h));uniforms.nearFar.value.set(camera.near,camera.far);uniforms.eye?.value.copy(camera.position);uniforms.ready.value=color&&depth?1:0;}
function makePath(T,input){
 if(!Array.isArray(input)||input.length<2)throw new Error('Each cascade requires at least two ordered path points.');
 const points=input.map(p=>p.isVector3?p.clone():new T.Vector3(...p));
 if(points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw new Error('Cascade paths must contain finite coordinates.');
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));
 const total=lengths.at(-1);if(total<.001)throw new Error('A cascade path must have nonzero length.');
 const planar=points.at(-1).clone().sub(points[0]);planar.y=0;if(planar.lengthSq()<.00001)planar.set(-points[0].x,0,-points[0].z);if(planar.lengthSq()<.00001)planar.set(0,0,1);planar.normalize();
 const side=new T.Vector3(-planar.z,0,planar.x);
 function point(v){const d=Math.max(0,Math.min(1,v))*total;let j=1;while(j<lengths.length-1&&lengths[j]<d)j++;return points[j-1].clone().lerp(points[j],(d-lengths[j-1])/Math.max(.00001,lengths[j]-lengths[j-1]));}
 function tangent(v){return point(Math.min(1,v+.003)).sub(point(Math.max(0,v-.003))).normalize();}
 return{points,length:total,point,tangent,side};
}
function ribbon(T,path,width,rows=180,cols=28,creek=false){
 const positions=[],uv=[],indices=[];
 for(let j=0;j<=rows;j++){const v=j/rows,c=path.point(v),t=path.tangent(v);let side=path.side;
  if(creek){side=new T.Vector3(-t.z,0,t.x);if(side.lengthSq()<.0001)side=path.side;else side.normalize();}
  const normal=creek?new T.Vector3(0,1,0):new T.Vector3().crossVectors(side,t).normalize();
  // The supplied polyline is the surveyed wet rock face. Crosswise geometry
  // creates folded ribbons; no smoothing spline cuts through a ledge.
  for(let i=0;i<=cols;i++){const u=i/cols,across=u-.5;
   const edge=.87+.075*Math.sin(v*36.+u*7.)+.055*Math.sin(v*73.-u*11.);
   const meander=creek?.012*Math.sin(v*24.):.014*Math.sin(v*21.);
   const fold=creek?.004*Math.sin(u*17.+v*35.):.0065*Math.sin(u*39.+v*26.)+.0035*Math.cos(u*65.-v*51.);
   const p=c.clone().addScaledVector(side,across*width*edge+meander).addScaledVector(normal,fold+.010);
   positions.push(p.x,p.y,p.z);uv.push(u,v);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function rivuletGeometry(T,path,offset,index){
 const p=[],uv=[],indices=[],rows=140,segments=5;
 for(let j=0;j<=rows;j++){
  const v=j/rows,t=path.tangent(v),normal=new T.Vector3().crossVectors(path.side,t).normalize();
  const center=path.point(v).addScaledVector(path.side,offset+.009*Math.sin(v*29.+index*4.)).addScaledVector(normal,.016);
  const radius=(.007+(index%4)*.0025)*(.72+.28*Math.sin(v*31.+index));
  for(let n=0;n<=segments;n++){const a=n/segments*Math.PI*2,q=center.clone().addScaledVector(path.side,Math.cos(a)*radius).addScaledVector(normal,Math.sin(a)*radius);p.push(q.x,q.y,q.z);uv.push(n/segments,v);}
 }
 for(let j=0;j<rows;j++)for(let n=0;n<segments;n++){const a=j*(segments+1)+n,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function makeParticleGeometry(T){
 const g=new T.InstancedBufferGeometry();g.setIndex([0,1,2,0,2,3]);g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));
 const uv=new Float32Array(PARTICLES*2);for(let i=0;i<PARTICLES;i++){uv[i*2]=(i%GRID+.5)/GRID;uv[i*2+1]=(Math.floor(i/GRID)+.5)/GRID;}
 g.setAttribute('particleUV',new T.InstancedBufferAttribute(uv,2));g.instanceCount=PARTICLES;return g;
}

export function createSpringCascades(T,{paths,textures={},waterY=0,widths=[.75,.95]}={}){
 if(!Array.isArray(paths)||paths.length!==2)throw new Error('Spring cascades require exactly two source paths.');
 const group=new T.Group();group.name='Two rock-following cascades / film, rivulets and ballistic impacts';
 const {uniforms:shared,fallback}=baseUniforms(T,textures),materials=[],geometries=[],allUniforms=[];
 const routes=paths.map(p=>makePath(T,p));
 const impacts=routes.map(p=>new T.Vector3(p.points.at(-1).x,waterY+.014,p.points.at(-1).z));
 const makeMat=(name,u,v,f)=>{const m=rawMaterial(T,name,u,v,f);materials.push(m);allUniforms.push(u);return m;};
 routes.forEach((path,k)=>{
  const source=new T.Group();source.name=k?'Mineral ledge cascade':'Creek lip cascade';group.add(source);
  const u={...shared,seed:{value:k*7.17+1.},pathLength:{value:path.length},kind:{value:0}};
  const sheet=new T.Mesh(ribbon(T,path,widths[k]),makeMat('Refractive irregular water film',u,cascadeSheetVertex,cascadeSheetFragment));sheet.renderOrder=3;sheet.name='Eroded broad water sheet';source.add(sheet);geometries.push(sheet.geometry);
  const ru={...u,kind:{value:1}},rivuletMat=makeMat('Clear narrow gravity rivulets',ru,cascadeSheetVertex,cascadeSheetFragment);
  for(let n=0;n<11;n++){const g=rivuletGeometry(T,path,(n-5)*widths[k]*.076,n+k*11),m=new T.Mesh(g,rivuletMat);m.name='Separate refractive rivulet '+(n+1);m.renderOrder=4;source.add(m);geometries.push(g);}
  const foamU={...shared,seed:{value:k*7.17+.7}},foamG=new T.PlaneGeometry(widths[k]*1.75,.94,1,1);foamG.rotateX(-Math.PI/2);
  const foam=new T.Mesh(foamG,makeMat('Local impact foam and concentric waves',foamU,cascadeImpactVertex,cascadeImpactFragment));foam.position.copy(impacts[k]);foam.renderOrder=6;foam.name='Impact foam / four expanding concentric ripples';source.add(foam);geometries.push(foamG);
 });
 const particleUniforms={...shared,impacts:{value:impacts},waterY:{value:waterY},positions:{value:fallback},velocities:{value:fallback},analytic:{value:true}};
 const particleGeo=makeParticleGeometry(T),particleMaterial=makeMat('4096 refractive impact beads',particleUniforms,cascadeParticleVertex,cascadeParticleFragment);
 const particles=new T.Mesh(particleGeo,particleMaterial);particles.name='4096 GPU ballistic impact droplets / gravity 9.81 m/s²';particles.frustumCulled=false;particles.renderOrder=7;group.add(particles);geometries.push(particleGeo);
 let targets=null,swap=0,initialized=false,pending=0,disposed=false,computeScene=null,computeMaterial=null,computeMesh=null;
 const computeCamera=new T.Camera();
 const stats={particles:PARTICLES,sources:2,mode:'unprepared',computePasses:0,gravity:GRAVITY};
 function prepare(renderer){
  if(disposed)return;
  if(!initialized){initialized=true;const canFloat=renderer.extensions.has('EXT_color_buffer_float');stats.mode=canFloat?'RGBA32F MRT ping-pong':'analytic GPU fallback';particleUniforms.analytic.value=!canFloat;
   if(canFloat){
    targets=[0,1].map(()=>new T.WebGLRenderTarget(GRID,GRID,{count:2,type:T.FloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false}));
    targets.forEach(rt=>rt.textures.forEach(t=>{t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;}));
    computeMaterial=new T.RawShaderMaterial({name:'Impact particle state / exact gravity integration',glslVersion:T.GLSL3,vertexShader:PASS_VERTEX,fragmentShader:cascadeComputeFragment,uniforms:{impacts:particleUniforms.impacts,waterY:particleUniforms.waterY,time:shared.time,oldPosition:{value:fallback},oldVelocity:{value:fallback},delta:{value:0},initialize:{value:true}},depthTest:false,depthWrite:false,toneMapped:false});
    computeScene=new T.Scene();computeMesh=new T.Mesh(new T.PlaneGeometry(2,2),computeMaterial);computeMesh.frustumCulled=false;computeScene.add(computeMesh);
   }
  }
  if(!targets){pending=0;return;}
  if(pending<=0&&!computeMaterial.uniforms.initialize.value)return;
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear,xr=renderer.xr.enabled,shadow=renderer.shadowMap.autoUpdate;
  try{renderer.autoClear=true;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;
   let steps=0;
   do{const dt=Math.min(pending,1/60),input=targets[swap],output=targets[1-swap];
    computeMaterial.uniforms.oldPosition.value=input.textures[0];computeMaterial.uniforms.oldVelocity.value=input.textures[1];computeMaterial.uniforms.delta.value=dt;
    renderer.setRenderTarget(output);renderer.render(computeScene,computeCamera);swap=1-swap;
    particleUniforms.positions.value=output.textures[0];particleUniforms.velocities.value=output.textures[1];computeMaterial.uniforms.initialize.value=false;
    pending=Math.max(0,pending-dt);stats.computePasses++;steps++;
   }while(pending>1e-6&&steps<4);
  }finally{renderer.setRenderTarget(previous);renderer.autoClear=auto;renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadow;}
 }
 return{group,impacts,particles,stats,shaderSources,
  update(time,dt=1/60){shared.time.value=time;pending=Math.min(1/15,pending+Math.max(0,Math.min(.067,dt)));},
  prepare,
  bind(color,depth,w,h,camera){bindUniforms(shared,color,depth,w,h,camera);},
  dispose(){if(disposed)return;disposed=true;targets?.forEach(t=>t.dispose());computeMesh?.geometry.dispose();computeMaterial?.dispose();geometries.forEach(g=>g.dispose());new Set(materials).forEach(m=>m.dispose());fallback.dispose();group.removeFromParent();}
 };
}

export function createFlowStream(T,{points,width=1.02,textures={},pebbleCount=12}={}){
 const path=makePath(T,points),group=new T.Group();group.name='Meandering shallow creek / directional flow and pebble wakes';
 const {uniforms,fallback}=baseUniforms(T,textures);uniforms.kind.value=2;uniforms.pathLength.value=path.length;
 // RG records world-XZ tangent, BA carries speed and curl. The texture follows
 // ribbon coordinates and is independent of the retained spring normal map.
 const cols=32,rows=256,data=new Uint8Array(cols*rows*4);
 for(let j=0;j<rows;j++){const t=path.tangent(j/(rows-1));for(let i=0;i<cols;i++){const u=i/(cols-1),idx=(j*cols+i)*4,bend=Math.sin(j*.13+i*.41)*.06;
  data[idx]=Math.round((t.x*.92+bend)*127.5+127.5);data[idx+1]=Math.round((t.z*.92-bend)*127.5+127.5);data[idx+2]=Math.round((.48+Math.sin(u*Math.PI)*.45)*255);data[idx+3]=255;
 }}
 const flowMap=new T.DataTexture(data,cols,rows,T.RGBAFormat);flowMap.minFilter=flowMap.magFilter=T.LinearFilter;flowMap.wrapS=flowMap.wrapT=T.ClampToEdgeWrapping;flowMap.generateMipmaps=false;flowMap.needsUpdate=true;uniforms.flowMap.value=flowMap;
 const geometry=ribbon(T,path,width,220,22,true),material=rawMaterial(T,'Clear flowing creek / tangent flowmap and pebble foam',uniforms,cascadeSheetVertex,cascadeSheetFragment);
 const water=new T.Mesh(geometry,material);water.name='Undulating clear creek surface';water.renderOrder=3;group.add(water);
 const stoneGeometry=new T.IcosahedronGeometry(1,1),stoneMaterial=new T.MeshStandardMaterial({name:'Wet embedded creek pebbles',color:0x655f4e,roughness:.48,metalness:.02,map:textures['riverbed-pebbles']||textures['limestone-strata']||null,normalMap:textures['riverbed-pebbles-normal']||null,normalScale:new T.Vector2(.6,.6),roughnessMap:textures['riverbed-pebbles-roughness']||null});
 const n=Math.min(12,Math.max(0,pebbleCount));
 for(let i=0;i<n;i++){const u=.18+((i*.61803398875)%1)*.64,v=.08+((i*.38196601125)%1)*.86,r=.031+(i%4)*.008;
  const p=path.point(v),t=path.tangent(v),side=new T.Vector3(-t.z,0,t.x).normalize();p.addScaledVector(side,(u-.5)*width);p.y-=.022;
  const mesh=new T.Mesh(stoneGeometry,stoneMaterial);mesh.position.copy(p);mesh.scale.set(r*1.20,r*.62,r*.85);mesh.rotation.set(i*.31,i*1.71,i*.13);mesh.name='Embedded rounded stream pebble '+(i+1);mesh.receiveShadow=true;group.add(mesh);
  uniforms.pebbles.value[i].set(u,v,r/width,r);
 }
 let disposed=false;
 return{group,water,material,flowMap,shaderSources,
  update(time){uniforms.time.value=time;},prepare(){},bind(color,depth,w,h,camera){bindUniforms(uniforms,color,depth,w,h,camera);},
  dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();stoneGeometry.dispose();stoneMaterial.dispose();flowMap.dispose();fallback.dispose();group.removeFromParent();}
 };
}
