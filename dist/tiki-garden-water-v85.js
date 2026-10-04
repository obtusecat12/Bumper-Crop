import * as T from './vendor/three.module.min.js';
import {Reflector} from './vendor/Reflector.js';
import {GARDEN81,POOL_POLYGON81,poolEdge81} from './tiki-garden-plan-v85.js';
const commonGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
vec3 reconstruct(vec2 q,float d){vec4 p=inverseProjection*vec4(q*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
`;
const waterVertex=`precision highp float;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;uniform float time,mode;in vec3 position,normal;in vec2 uv;out vec3 worldPos,viewPos;out vec2 texCoord;
void main(){vec3 p=position;float r=length(p.xz-vec2(4.75,1.4));
 if(mode<.5)p.y+=.0018*sin(p.x*.63+p.z*.42+time*.24)+.0011*cos(p.z*.89-time*.19);
 else p.y+=.013*sin(r*28.-time*6.)+.006*cos(p.x*21.+time*4.)*sin(p.z*17.-time*3.)+.045*exp(-r*r*1.8)*sin(time*8.+r*20.);
 vec4 w=modelMatrix*vec4(p,1.);worldPos=w.xyz;vec4 v=modelViewMatrix*vec4(p,1.);viewPos=v.xyz;texCoord=uv;gl_Position=projectionMatrix*v;}`;
const waterFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth,mirrorMap,foamMap;uniform mat4 inverseProjection,projection,cameraWorld,viewMatrix,reflectionWorld;
uniform vec2 resolution;uniform float time,mode,metalness,roughness;in vec3 worldPos,viewPos;in vec2 texCoord;out vec4 fragColor;
${commonGLSL}
vec3 ssr(vec3 n,vec3 fallback){vec3 direction=normalize(reflect(normalize(viewPos),n));vec3 origin=viewPos+n*.035;float last=0.;vec2 hitUV=vec2(-1.);float confidence=0.;
 // World/view-distance traversal with a five-step binary depth intersection.
 // Only water fragments run this; it reuses the existing opaque HDR/depth.
 for(int i=0;i<96;i++){float t=.035+float(i)*.065+float(i*i)*.00050;vec3 p=origin+direction*t;if(p.z>-.07)break;vec4 projected=projection*vec4(p,1.);vec2 q=projected.xy/projected.w*.5+.5;if(any(lessThan(q,vec2(.002)))||any(greaterThan(q,vec2(.998))))break;
  float depth=texture(sceneDepth,q).r;vec3 behind=reconstruct(q,depth);float delta=behind.z-p.z;
  if(depth<.9999&&delta>0.&&delta<.18){float lo=last,hi=t;for(int j=0;j<5;j++){float mid=(lo+hi)*.5;vec3 pos=origin+direction*mid;vec4 pp=projection*vec4(pos,1.);vec2 uv=pp.xy/pp.w*.5+.5;float dd=reconstruct(uv,texture(sceneDepth,uv).r).z-pos.z;if(dd>0.)hi=mid;else lo=mid;hitUV=uv;}
   vec2 edge=min(hitUV,1.-hitUV);confidence=smoothstep(.008,.10,min(edge.x,edge.y));break;}last=t;
 }
 return hitUV.x<0.?fallback:mix(fallback,texture(sceneColor,hitUV).rgb,confidence*.52);
}
void main(){vec3 nWorld=normalize(cross(dFdx(worldPos),dFdy(worldPos)));if(nWorld.y<0.)nWorld=-nWorld;
 float r=length(worldPos.xz-vec2(4.75,1.4));
 if(mode<.5)nWorld=normalize(vec3(.0014*cos(worldPos.x*.63+worldPos.z*.42+time*.24),1.,.0018*sin(worldPos.z*.89-time*.19)));
 else nWorld=normalize(nWorld+vec3(.018*sin(worldPos.x*34.+time*3.),0.,.02*cos(worldPos.z*29.-time*4.)));
 vec3 n=normalize(mat3(viewMatrix)*nWorld),v=normalize(-viewPos);vec2 screen=gl_FragCoord.xy/resolution;
 vec2 offset=n.xy*(mode<.5?.020:.10)/max(.7,-viewPos.z),q=clamp(screen+offset,.002,.998);vec3 behind=reconstruct(q,texture(sceneDepth,q).r);if(behind.z>viewPos.z+.025){q=screen;behind=reconstruct(q,texture(sceneDepth,q).r);}
 float depth=clamp(length(behind-viewPos),.01,4.);vec3 absorption=exp(-vec3(1.8,.76,.95)*depth);vec3 refraction=texture(sceneColor,q).rgb*absorption;
 vec4 rp=reflectionWorld*vec4(worldPos,1.);vec2 rq=rp.xy/rp.w+nWorld.xz*.017;vec3 planar=texture(mirrorMap,clamp(rq,.002,.998)).rgb;
 vec3 reflection=mode<.5?ssr(n,planar):mix(planar,vec3(.014,.029,.041),.60);
 float fresnel=.045+.955*pow(1.-max(0.,dot(n,v)),5.);float reflectionWeight=mode<.5?mix(.24,.93,fresnel):mix(.08,.55,fresnel);
 reflectionWeight=mix(reflectionWeight,reflectionWeight+.08,metalness);vec3 c=mix(refraction+vec3(.007,.019,.014)*(1.-absorption),reflection,reflectionWeight);
 if(mode>.5){float turbulence=noise(worldPos.xz*13.+vec2(time*.19,-time*.14)),boil=exp(-r*r*1.72);float ring=pow(.5+.5*sin(r*27.-time*5.8),11.)*exp(-r*1.1);
  vec4 foam=texture(foamMap,worldPos.xz*.87+vec2(time*.013,-time*.019));float cover=clamp(boil*(.43+turbulence*.6)+ring*.15,0.,.85)*(foam.r*.35+.65);
  vec3 cyan=vec3(.006,.40,.67)*exp(-r*r*.70);c+=cyan*.45;c=mix(c,vec3(.04,1.15,1.90),cover*.52);c+=pow(max(0.,dot(n,normalize(vec3(-.2,.9,.3)))),45.)*vec3(.04,.32,.40)*.16;
 }
 fragColor=vec4(c,1.);
}`;
const fountainVertex=`precision highp float;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;uniform float time;in vec3 position;in vec2 uv;out vec3 worldPos,viewPos;out vec2 texCoord;
void main(){float a=position.x,phase=position.z,v=uv.y;float speed=time*(1.8+phase*.35);float radius=(.14+.52*v+.13*v*v)*(1.+.16*sin(a*7.+speed*2.)+.06*cos(a*17.-speed*2.7));float amplitude=.66+.20*sin(a*5.+speed*1.2+phase*13.)+.12*cos(a*9.-speed*2.4);float y=.08+amplitude*sin(v*3.141593)+.06*sin(a*13.+speed*3.)*sin(v*3.14159);
 radius+=.030*sin(v*23.-speed*4.+a*11.);y*=.84+phase*.20;
 vec3 p=vec3(4.75+cos(a)*radius,y,1.40+sin(a)*radius);vec4 w=modelMatrix*vec4(p,1.);worldPos=w.xyz;vec4 vp=modelViewMatrix*vec4(p,1.);viewPos=vp.xyz;texCoord=uv;gl_Position=projectionMatrix*vp;}`;
const fountainFragment=`precision highp float;precision highp sampler2D;uniform sampler2D sceneColor,sceneDepth;uniform mat4 inverseProjection;uniform vec2 resolution;uniform float time;in vec3 worldPos,viewPos;in vec2 texCoord;out vec4 fragColor;
${commonGLSL}
void main(){vec3 n=normalize(cross(dFdx(viewPos),dFdy(viewPos)));vec3 v=normalize(-viewPos);float f=pow(1.-abs(dot(n,v)),3.);vec2 flow=vec2(texCoord.x*73.,texCoord.y*11.-time*3.5);float density=noise(flow)*.62+noise(flow*vec2(.51,2.3))* .38;
 float erosion=smoothstep(.32,.61,density+(.7-texCoord.y)*.17),top=smoothstep(.99,.78,texCoord.y);float a=erosion*(.12+.25*f)*top;
 vec2 screen=gl_FragCoord.xy/resolution,q=clamp(screen+n.xy*.011,.002,.998);vec3 bg=texture(sceneColor,q).rgb;
 vec3 c=mix(bg,vec3(.004,.65,1.05),.68)+vec3(.015,.55,.82)*pow(density,4.)+vec3(.04,.80,1.30)*f*.65;
 fragColor=vec4(c,a);}`;
const sprayVertex=`precision highp float;uniform mat4 modelViewMatrix,projectionMatrix;uniform float time;uniform vec2 resolution;in vec3 position,velocity;in float phase,size,kind;out float age,cluster;out vec3 viewPos;
void main(){cluster=kind;age=fract(time*(.74+phase*.24)+phase);float t=age*.83;vec3 p=vec3(4.75,.24,1.40)+position+velocity*t+vec3(0.,-3.9*t*t,0.);viewPos=(modelViewMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*vec4(viewPos,1.);gl_PointSize=clamp(size*resolution.y/max(.2,-viewPos.z),1.,85.);}`;
const sprayFragment=`precision highp float;uniform sampler2D splashMap;in float age,cluster;in vec3 viewPos;out vec4 fragColor;
void main(){float lifetime=smoothstep(0.,.06,age)*(1.-smoothstep(.65,.99,age));if(cluster>.5){vec4 spray=texture(splashMap,gl_PointCoord);if(spray.a<.025)discard;fragColor=vec4(spray.rgb*vec3(.45,1.32,1.95),spray.a*lifetime*.72);return;}
vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;float a=(1.-smoothstep(.35,1.,r))*lifetime;vec3 n=vec3(p,sqrt(max(0.,1.-r)));float spec=pow(max(dot(n,normalize(vec3(-.4,.55,1.))),0.),26.);fragColor=vec4(vec3(.055,.82,1.37)+spec*vec3(.50,.85,1.05),a*.70);}`;
function poolSurface(){const pos=[],uv=[],ix=[],N=128,M=22,p=GARDEN81.pool;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const[x,z]=poolEdge81(i/N*Math.PI*2,j/M);pos.push(x,p.water,z);uv.push(x*.5,z*.5);}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,c=a+N+1;ix.push(a,a+1,c,a+1,c+1,c);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function createGardenWater81(scene,foamMap,splashMap){
 const mirror=new Reflector(new T.PlaneGeometry(10,15),{textureWidth:1024,textureHeight:1024,clipBias:.0003,multisample:0});mirror.rotation.x=-Math.PI/2;mirror.position.set(GARDEN81.pool.x,GARDEN81.pool.water,GARDEN81.pool.z);mirror.layers.set(7);mirror.visible=false;scene.add(mirror);mirror.updateMatrixWorld(true);mirror.camera.layers.set(0);
 const u={sceneColor:{value:null},sceneDepth:{value:null},mirrorMap:{value:mirror.getRenderTarget().texture},foamMap:{value:foamMap},inverseProjection:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},reflectionWorld:{value:new T.Matrix4()},resolution:{value:new T.Vector2(1,1)},time:{value:0}};
 const material=(name,vs,fs,extra={},transparent=false)=>new T.RawShaderMaterial({name,glslVersion:T.GLSL3,vertexShader:vs,fragmentShader:fs,uniforms:{...u,...extra},side:T.DoubleSide,depthTest:true,depthWrite:!transparent,transparent,toneMapped:false});
 const calm=material('Deep still water / selective 96-step SSR and oblique fallback',waterVertex,waterFragment,{mode:{value:0},metalness:{value:.65},roughness:{value:.025}});
 const fountain=material('Separate cyan fountain basin / rolling foam',waterVertex,waterFragment,{mode:{value:1},metalness:{value:.45},roughness:{value:.08}});
 const pool=new T.Mesh(poolSurface(),calm);pool.layers.set(3);pool.renderOrder=1;scene.add(pool);
 const f=GARDEN81.fountain,fg=new T.CircleGeometry(f.r-.015,112);fg.rotateX(-Math.PI/2);fg.translate(f.x,f.water,f.z);const basin=new T.Mesh(fg,fountain);basin.layers.set(3);basin.renderOrder=1;scene.add(basin);
 const sheetMat=material('Turbulent rising cyan water curtains',fountainVertex,fountainFragment,{},true);sheetMat.forceSinglePass=true;
 const p=[],uv=[],index=[];for(let shell=0;shell<3;shell++){const offset=p.length/3;for(let j=0;j<=32;j++)for(let i=0;i<=72;i++){p.push(i/72*Math.PI*2,0,shell*.33);uv.push(i/72,j/32);}for(let j=0;j<32;j++)for(let i=0;i<72;i++){const a=offset+j*73+i,c=a+73;index.push(a,a+1,c,a+1,c+1,c);}}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(p,3));sg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));sg.setIndex(index);sg.boundingSphere=new T.Sphere(new T.Vector3(f.x,.65,f.z),1.5);const sheet=new T.Mesh(sg,sheetMat);sheet.layers.set(3);sheet.renderOrder=3;scene.add(sheet);
 const count=704,positions=new Float32Array(count*3),velocity=new Float32Array(count*3),phase=new Float32Array(count),sizes=new Float32Array(count),kinds=new Float32Array(count);
 const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 for(let i=0;i<count;i++){const a=random(i+3)*Math.PI*2,s=random(i+88),rad=.40+s*1.35,origin=random(i+406)*.25,cluster=i<112;
  positions.set([Math.cos(a)*origin,random(i+96)*.12,Math.sin(a)*origin],i*3);velocity.set([Math.cos(a)*rad,1.35+random(i+11)*1.58,Math.sin(a)*rad],i*3);phase[i]=random(i+801);sizes[i]=cluster?.105+random(i+234)*.16:.005+.014*random(i+115);kinds[i]=cluster?1:0;}
 const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(positions,3));dg.setAttribute('velocity',new T.BufferAttribute(velocity,3));dg.setAttribute('phase',new T.BufferAttribute(phase,1));dg.setAttribute('size',new T.BufferAttribute(sizes,1));dg.setAttribute('kind',new T.BufferAttribute(kinds,1));dg.boundingSphere=new T.Sphere(new T.Vector3(f.x,.5,f.z),2.1);
 const dm=material('GPU ballistic droplets and photographic spray clusters',sprayVertex,sprayFragment,{splashMap:{value:splashMap}},true),drops=new T.Points(dg,dm);drops.layers.set(3);drops.renderOrder=4;scene.add(drops);
 let mainCamera=null,reflecting=false;const frustum=new T.Frustum(),matrix=new T.Matrix4(),inverseMirror=new T.Matrix4(),poolSphere=new T.Sphere(new T.Vector3(GARDEN81.pool.x,GARDEN81.pool.water,GARDEN81.pool.z),5.3);
 return{active:true,materials:[calm,fountain,sheetMat,dm],pool,basin,sheet,drops,mirror,
  setCamera(camera){mainCamera=camera;},
  prepare(renderer){if(!mainCamera||reflecting)return;matrix.multiplyMatrices(mainCamera.projectionMatrix,mainCamera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);if(!frustum.intersectsSphere(poolSphere))return;
   reflecting=true;const auto=renderer.autoClear;try{renderer.autoClear=true;mirror.onBeforeRender(renderer,scene,mainCamera);inverseMirror.copy(mirror.matrixWorld).invert();u.reflectionWorld.value.copy(mirror.material.uniforms.textureMatrix.value).multiply(inverseMirror);}finally{mirror.visible=false;renderer.autoClear=auto;reflecting=false;}
  },
  bind(color,depth,w,h,camera){u.sceneColor.value=color;u.sceneDepth.value=depth;u.resolution.value.set(w,h);u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.projection.value.copy(camera.projectionMatrix);u.cameraWorld.value.copy(camera.matrixWorld);},
  update(t){u.time.value=t;},
  dispose(){for(const o of[pool,basin,sheet,drops]){o.geometry.dispose();o.removeFromParent();}this.materials.forEach(m=>m.dispose());mirror.dispose();mirror.geometry.dispose();mirror.removeFromParent();}
 };
}
