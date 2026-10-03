import * as T from './vendor/three.module.min.js';
// Reuses the game's opaque HDR + depth capture. Every glass/ice/water batch
// samples that capture; no transmission recapture for every individual glass.
const vertex=`precision highp float;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;uniform mat3 normalMatrix;uniform float time,mode;in vec3 position,normal;in vec2 uv;out vec3 worldPos,viewPos,viewNormal;out vec2 texCoord;
void main(){vec3 p=position;if(mode>1.5&&mode<2.5){float r=length(p.xz-vec2(-4.93,-4.93));p.y+=.003*sin(p.x*27.+p.z*17.+time*1.8)+.005*sin(r*34.-time*5.)*exp(-r*2.2);}vec4 w=modelMatrix*vec4(p,1.);vec4 v=modelViewMatrix*vec4(p,1.);worldPos=w.xyz;viewPos=v.xyz;viewNormal=normalize(normalMatrix*normal);texCoord=uv;gl_Position=projectionMatrix*v;}`;
const fragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth,normalMap,detailMap,foamMap;uniform mat4 inverseProjection,cameraWorld;uniform vec2 resolution;uniform float time,mode,ior,thickness,opacity,roughness;uniform vec3 tint;uniform vec3 lampPos[8],lampColor[8];in vec3 worldPos,viewPos,viewNormal;in vec2 texCoord;out vec4 fragColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
vec3 reconstruct(vec2 uv,float d){vec4 q=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return q.xyz/q.w;}
void main(){vec2 screen=gl_FragCoord.xy/resolution;vec3 n=normalize(viewNormal),v=normalize(-viewPos);if(!gl_FrontFacing)n=-n;float water=step(1.5,mode),fall=step(2.5,mode),ice=step(.5,mode)*(1.-water);
 vec2 flowUV=worldPos.xz*3.5+vec2(time*.026,-time*.019);if(fall>.5)flowUV=texCoord*vec2(2.1,2.6)+vec2(time*.03,-time*.62);
 vec3 na=texture(normalMap,flowUV).xyz*2.-1.,nb=texture(normalMap,flowUV*1.37-vec2(time*.04,time*.08)).xyz*2.-1.;
 if(water>.5){vec3 worldN=normalize(vec3((na.x+nb.x)*.13,1.,(na.y+nb.y)*.13));n=normalize(mat3(transpose(cameraWorld))*worldN);if(fall>.5)n=normalize(n+vec3(na.xy*.2,0.));}else n=normalize(n+vec3(na.xy*.018,0.));
 float f0=pow((ior-1.)/(ior+1.),2.),fresnel=f0+(1.-f0)*pow(1.-abs(dot(n,v)),5.);
 vec2 offset=n.xy*(ior-1.)*thickness/max(.8,-viewPos.z);offset=clamp(offset,vec2(-.026),vec2(.026));vec2 q=clamp(screen+offset,.001,.999);float bd=texture(sceneDepth,q).r;vec3 behind=reconstruct(q,bd);if(behind.z>viewPos.z+.025)q=screen;
 float path=water>.5?clamp(length(behind-viewPos)*.22,.02,1.1):thickness;vec3 absorption=exp(-(vec3(1.)-tint)*path*(water>.5?3.2:14.0));vec2 blur=vec2(roughness*1.1)/resolution;
 vec3 transmitted=(texture(sceneColor,q+blur).rgb+texture(sceneColor,q-blur).rgb)*.5*absorption;vec3 reflection=vec3(.085,.075,.058),spec=vec3(0.);
 vec3 worldN=normalize(mat3(cameraWorld)*n),worldV=normalize(cameraWorld[3].xyz-worldPos);
 for(int i=0;i<8;i++){vec3 dl=lampPos[i]-worldPos;float ds=max(dot(dl,dl),.07);vec3 l=normalize(dl),h=normalize(l+worldV);float highlight=pow(max(dot(worldN,h),0.),mix(280.,80.,roughness));spec+=lampColor[i]*highlight/(1.+ds);reflection+=lampColor[i]*pow(max(dot(reflect(-worldV,worldN),l),0.),18.)/(1.+ds)*.13;}
 vec3 c=mix(transmitted,reflection,fresnel)+spec*.32; if(water<.5&&ice<.5){float silhouette=pow(1.-abs(dot(n,v)),2.);vec3 glassBody=tint*(.10+.055*max(worldN.y,0.));c=mix(c,glassBody,.22+silhouette*.42)+vec3(.15,.13,.10)*pow(1.-abs(dot(n,v)),8.);}float a=opacity;
 if(ice>.5){float fracture=texture(detailMap,texCoord*.5+vec2(0.,.5)).r;c+=vec3(.06,.073,.071)*fracture;c=mix(c,transmitted,.24);}
 if(water>.5){
  float r=length(worldPos.xz-vec2(-4.93,-4.93));
  vec2 adv=worldPos.xz+vec2(sin(worldPos.z*3.+time*.25),cos(worldPos.x*2.-time*.19))*.018;
  float noiseR=noise(adv*5.3+vec2(time*.013,-time*.006));
  float raft=smoothstep(.58,.78,noiseR)*.80;
  float impact=exp(-r*r*22.)*.88;
  vec2 fu=(adv-vec2(-6.1,-6.1))*.64;vec4 foamTex=texture(foamMap,fu);
  float cells=pow(noise(adv*140.),3.);float foam=clamp((raft*(.3+foamTex.a*.7)+impact)*(.50+cells*.45),0.,.88);
  float ring=pow(.5+.5*sin(r*55.-time*8.5),14.)*exp(-r*4.)*.14;
  foam=(foam+ring)*(1.-fall);
  float left=exp(-dot((worldPos.xz-vec2(-5.58,-4.66))/vec2(.48,.40),(worldPos.xz-vec2(-5.58,-4.66))/vec2(.48,.40)));
  float right=exp(-dot((worldPos.xz-vec2(-4.16,-4.94))/vec2(.51,.50),(worldPos.xz-vec2(-4.16,-4.94))/vec2(.51,.50)));
  vec3 led=vec3(.82,.48,.035)*left+vec3(.065,.55,.22)*right;
  c+=led*(.22+path*.22)*(1.-fall);
  vec3 litFoam=vec3(.56,.59,.51)+led*.50;
  c=mix(c,litFoam,foam);
  if(fall>.5){float down=1.-texCoord.y,speed=sqrt(.025+down);vec2 stream=vec2(texCoord.x*36.,sqrt(down+.035)*10.-time*2.8);float strands=noise(stream),erosion=noise(vec2(texCoord.x*82.,down*22.-time*4.));float edge=smoothstep(0.,.025,texCoord.x)*smoothstep(0.,.025,1.-texCoord.x);float tear=mix(1.,smoothstep(.17,.39,strands+erosion*.6),smoothstep(.45,1.,down));a=edge*tear*(.36+.24*strands);c+=vec3(.16,.18,.15)*pow(strands,4.)+.025*vec3(1.);}
 }

 fragColor=vec4(c,a);}`;
export function createTikiOptics(m,tex){
 const lamps=[[-4.93,2.26,-1.3],[-4.93,2.26,1.60],[-4.93,2.26,4.50],[4.07,2.24,-3.7],[4.07,2.24,-.5],[4.07,2.24,2.7],[4.0,2.6,-5.6],[-.2,2.5,-3.5]].map(p=>new T.Vector3(...p));
 const common={sceneColor:{value:null},sceneDepth:{value:null},normalMap:{value:tex('moai/normal')},detailMap:{value:tex('iceOrchids')},foamMap:{value:tex('pondFoam')||tex('iceOrchids')},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},resolution:{value:new T.Vector2(1,1)},time:{value:0},lampPos:{value:lamps},lampColor:{value:lamps.map(()=>new T.Color(0xffb45c).multiplyScalar(2.5))}};
 const materials=[];
 const make=(name,{tint=0xf1fff4,mode=0,ior=1.47,thickness=.075,opacity=1,roughness=.08,order=2}={})=>{const mat=new T.RawShaderMaterial({name,glslVersion:T.GLSL3,vertexShader:vertex,fragmentShader:fragment,uniforms:{...common,tint:{value:new T.Color(tint)},mode:{value:mode},ior:{value:ior},thickness:{value:thickness},opacity:{value:opacity},roughness:{value:roughness}},transparent:true,depthWrite:false,depthTest:true,side:mode===0?T.FrontSide:T.DoubleSide,toneMapped:false});mat.forceSinglePass=true;mat.userData={optical:true,order};materials.push(mat);return mat;};
 m.clearGlass=make('Scene-refracting thick clear glass');m.amberGlass=make('Amber bottle refraction',{tint:0xc99043,thickness:.22});m.greenGlass=make('Green bottle refraction',{tint:0x7dab6a,thickness:.2});m.brownGlass=make('Dark brown bottle glass',{tint:0x905026,thickness:.17});m.blueGlass=make('Blue glass refraction',{tint:0x599dba,thickness:.15});m.liquid=make('Pale citrus liquid meniscus',{tint:0xe5dc87,ior:1.335,thickness:.09,order:1});m.ice=make('Crushed ice refractive facets',{tint:0xe8fff7,ior:1.31,thickness:.04,mode:1,order:3});m.pondWater=make('Moai pond depth refraction and impact foam',{tint:0xaaa27b,ior:1.333,thickness:.14,mode:2,order:1});m.fallWater=make('Falling eroded water sheet',{tint:0xf2fff9,ior:1.333,thickness:.065,mode:3,order:4});
 return{materials,active:true,prepare(){},bind(color,depth,w,h,camera){common.sceneColor.value=color;common.sceneDepth.value=depth;common.resolution.value.set(w,h);common.inverseProjection.value.copy(camera.projectionMatrixInverse);common.cameraWorld.value.copy(camera.matrixWorld);},update(t){common.time.value=t;},dispose(){materials.forEach(x=>x.dispose());}};
}
