/* V65 spa: one broad two-film waterfall, displaced Jacuzzi water and local spray.
 * Caller owns opaque capture. Hide .group for capture; call prepare(renderer)
 * once after update(), then bind(color,depth,DISPLAY_W,DISPLAY_H,camera).
 * Screen UV uses destination dimensions, independent of capture resolution.
 * No SSR: captured colour is refraction; reflected radiance is analytic room fill.
 */
export {createSpaBloom,bloomShaderSources} from './spa-bloom-v65.js';
const GRID=32,COUNT=GRID*GRID;
export const passVertex=`precision highp float;in vec3 position;out vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
const noiseGLSL=`
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+1.),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+4.17)*.29+noise(p*4.07-8.9)*.14;}
float fresnelWater(float ci){ci=clamp(ci,0.,1.);float eta=1.333,ct=sqrt(1.-(1.-ci*ci)/(eta*eta));float rs=(ci-eta*ct)/(ci+eta*ct),rp=(eta*ci-ct)/(eta*ci+ct);return .5*(rs*rs+rp*rp);}
float linearDepth(float z,vec2 nf){return nf.x*nf.y/(nf.y-z*(nf.y-nf.x));}
`;
const opticsGLSL=`
uniform sampler2D sceneColor,sceneDepth,normalA,normalB,ripple,caustics;
uniform vec2 resolution,nearFar,poolCenter;
uniform vec3 eye,impact;
uniform mat4 viewMatrix,projectionMatrix,inverseProjection,cameraWorld;
uniform float time,ready,waterY,bottomY,radius;
${noiseGLSL}
vec3 worldAt(vec2 uv,float d){vec4 v=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return (cameraWorld*vec4(v.xyz/v.w,1.)).xyz;}
vec2 safeUV(vec2 q){return clamp(q,.5/resolution,1.-.5/resolution);}
vec2 refractUV(vec2 screen,vec3 viewNormal,float surfaceZ,float strength){
 vec2 offset=viewNormal.xy*strength*vec2(resolution.y/resolution.x,1.);
 vec2 q=safeUV(screen+offset);
 // Do not pull a dry coping/foreground pixel into the water surface.
 if(linearDepth(texture(sceneDepth,q).r,nearFar)<surfaceZ+.015)q=screen;
 return q;
}
`;
const heightGLSL=`
float waterHeight(vec2 p){
 vec2 a=p-(poolCenter+vec2(.02,.23)),b=p-(poolCenter+vec2(-.23,-.32));
 float ra=length(a),rb=length(b),ri=length(p-impact.xz);
 float m=.033*exp(-ra*ra/.24)*(1.+.28*sin(time*5.7+ra*9.));
 m+=.024*exp(-rb*rb/.16)*(1.+.32*sin(time*6.4-rb*8.));
 float phase=.72*sin(p.x*7.3+time*.83)*sin(p.y*8.1-time*.67);
 m+=sin(ra*20.-time*6.7+phase)*.011*exp(-ra*.74);
 m+=sin(rb*23.-time*7.6-phase*.8)*.008*exp(-rb*.90);
 m+=sin(ri*29.-time*8.9)*.009*exp(-ri*2.1);
 m+=sin(p.x*12.+p.y*7.+time*2.1)*sin(p.y*10.-time*1.8)*.0035;
 return m*(1.-smoothstep(radius-.16,radius,length(p-poolCenter)));
}
`;
export const waterVertex=`precision highp float;in vec3 position;in vec2 uv;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;
uniform vec2 poolCenter;uniform vec3 impact;uniform float time,radius;
out vec2 vUv;out vec3 worldPosition,worldNormal,viewPosition;
${heightGLSL}
void main(){vUv=uv;vec3 p=position;p.y+=waterHeight(p.xz);float e=.014;
 vec2 slope=vec2(waterHeight(p.xz+vec2(e,0.))-waterHeight(p.xz-vec2(e,0.)),waterHeight(p.xz+vec2(0.,e))-waterHeight(p.xz-vec2(0.,e)))/(2.*e);
 worldNormal=normalize(mat3(modelMatrix)*vec3(-slope.x,1.,-slope.y));
 vec4 world=modelMatrix*vec4(p,1.);worldPosition=world.xyz;vec4 view=viewMatrix*world;viewPosition=view.xyz;gl_Position=projectionMatrix*view;
}`;
export const waterFragment=`precision highp float;precision highp sampler2D;
in vec2 vUv;in vec3 worldPosition,worldNormal,viewPosition;out vec4 fragColor;
${opticsGLSL}
float jacuzzi(vec2 d,float scale,float phase){
 float r=length(d)/scale,theta=atan(d.y,d.x);
 vec2 drift=vec2(sin(theta+time*.31),cos(theta-time*.23))*.12;
 float n=fbm(d*14.+drift+vec2(time*.37,-time*.42)+phase);
 float swirl=fbm(vec2(theta*2.5-r*2.8,r*11.-time*.78)+phase);
 float body=1.-smoothstep(.27,1.25,r+(n-.5)*.34);
 float cells=smoothstep(.33,.65,n*.73+swirl*.27);
 float core=(1.-smoothstep(.17,.81,r))*.57;
 float spreading=exp(-pow((r-1.1-fract(time*.51+phase)*.60)/.055,2.))*(1.-fract(time*.51+phase))*.10;
 return clamp((body*(.14+cells*.76)+core)*(.88+.12*sin(time*4.7+phase))+spreading,0.,.97);
}
void main(){
 vec2 p=worldPosition.xz,screen=gl_FragCoord.xy/resolution;
 vec3 na=texture(normalA,p*.82+vec2(time*.021,-time*.034)).xyz*2.-1.;
 vec3 nb=texture(normalB,p*1.31+vec2(-time*.029,time*.017)).xyz*2.-1.;
 vec2 micro=(na.xy*.60+nb.xy*.40)*.17;
 float grainA=texture(ripple,p*.61+vec2(time*.015,-time*.019)).r;
 float grainB=texture(ripple,p*.93+vec2(-time*.017,time*.011)).r;
 vec3 N=normalize(worldNormal+vec3(micro.x,0.,micro.y));
 vec3 V=normalize(eye-worldPosition);float f=fresnelWater(abs(dot(N,V)));
 vec3 nView=normalize(mat3(viewMatrix)*N);
 vec2 refracted=refractUV(screen,nView,-viewPosition.z,.024);
 float raw=texture(sceneDepth,refracted).r;
 vec3 bed=worldAt(refracted,raw);
 // Reconstructed scene intersection gives the actual optical path to tile.
 float opticalPath=clamp(length(bed-worldPosition),0.,2.8);
 if(raw>.99999)opticalPath=max(.08,(waterY-bottomY)/max(.18,abs(V.y)));
 float verticalDepth=clamp(waterY-bed.y,0.,waterY-bottomY+.15);
 vec3 transmittance=exp(-vec3(1.38,.49,.105)*opticalPath);
 vec3 tint=mix(vec3(.026,.44,.51),vec3(.012,.085,.28),smoothstep(.08,.82,verticalDepth));
 vec3 base=texture(sceneColor,refracted).rgb;
 vec3 transmitted=base*transmittance+tint*(1.-transmittance)*.64;
 float cells=texture(caustics,p*.92+vec2(time*.017,-time*.014)+micro*.17).r;
 float cellsB=texture(caustics,p*1.07+vec2(-time*.013,time*.016)-micro*.11).r;
 transmitted+=vec3(.022,.12,.14)*pow(clamp(min(cells,cellsB)*1.23,0.,1.),2.5)*exp(-verticalDepth*.85);
 vec3 reflected=mix(vec3(.11,.25,.30),vec3(.30,.43,.47),clamp(N.y,0.,1.));
 vec3 color=mix(transmitted,reflected,clamp(f,0.,.72));
 vec3 L=normalize(vec3(-.14,.60,-.78));float glint=pow(max(0.,dot(reflect(-L,N),V)),115.);
 color+=vec3(.72,.84,.86)*glint*.24*smoothstep(.21,.79,grainA*.61+grainB*.39);
 float foam=jacuzzi(p-(poolCenter+vec2(.02,.23)),.84,0.);
 foam=max(foam,jacuzzi(p-(poolCenter+vec2(-.23,-.32)),.59,2.7)*.92);
 float ri=length((p-impact.xz)*vec2(.92,1.25));
 float splash=(1.-smoothstep(.05,.43,ri))*smoothstep(.32,.68,fbm(p*20.+vec2(time*1.1,-time*.91)));
 foam=max(foam,splash*.89);
 // Retained grayscale spring texture breaks soft foam into wet flowing cells.
 foam*=.88+.12*smoothstep(.25,.8,grainA*.57+grainB*.43);
 vec3 froth=mix(vec3(.50,.73,.76),vec3(.92,.985,1.02),clamp(foam+.23,0.,1.));
 color=mix(color,froth,foam);
 color=mix(vec3(.012,.15,.28),color,ready);
 fragColor=vec4(color,1.);
}`;
export const fallVertex=`precision highp float;in vec3 position,normal;in vec2 uv;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;uniform float time,layer;
out vec2 vUv;out vec3 worldPosition,worldNormal,viewPosition;
void main(){vUv=uv;vec3 p=position;float flutter=sin(uv.x*31.+uv.y*43.-time*12.)*.0014+sin(uv.x*67.-uv.y*24.+time*17.)*.0006;
 p+=normal*(flutter+layer*.007);vec4 w=modelMatrix*vec4(p,1.);worldPosition=w.xyz;worldNormal=normalize(mat3(modelMatrix)*normal);vec4 v=viewMatrix*w;viewPosition=v.xyz;gl_Position=projectionMatrix*v;
}`;
export const fallFragment=`precision highp float;precision highp sampler2D;
uniform float layer,flightTime;
in vec2 vUv;in vec3 worldPosition,worldNormal,viewPosition;out vec4 fragColor;
${opticsGLSL}
void main(){
 float age=vUv.y*flightTime;
 // UV.y follows flight time, so detail accelerates down the gravity parabola.
 vec2 q1=vec2(vUv.x*3.8,age*5.8-time*(layer>.5?4.1:3.2));
 vec2 q2=vec2(vUv.x*6.5+1.71,age*8.3-time*(layer>.5?5.7:4.7));
 vec3 a=texture(normalA,q1).xyz*2.-1.,b=texture(normalB,q2).xyz*2.-1.;
 float n=fbm(vec2(vUv.x*22.+layer*7.,age*16.-time*12.));
 float fine=fbm(vec2(vUv.x*64.-layer*3.,age*31.-time*22.));
 float ragged=(n-.5)*.024+(fine-.5)*.011;
 float edge=smoothstep(0.,.036,min(vUv.x,1.-vUv.x)+ragged);
 float erosion=1.-smoothstep(.77,.96,fine)*smoothstep(.3,1.,vUv.y)*.70;
 float coverage=edge*erosion;if(coverage<.015)discard;
 vec3 tangent=normalize(cross(vec3(0.,1.,0.),worldNormal));
 vec3 bitangent=normalize(cross(worldNormal,tangent));
 vec3 N=normalize(worldNormal+tangent*(a.x*.20+b.x*.11)+bitangent*(a.y*.12+b.y*.08));
 vec3 V=normalize(eye-worldPosition);if(dot(N,V)<0.)N=-N;
 float f=fresnelWater(dot(N,V));vec2 screen=gl_FragCoord.xy/resolution;
 float gap=linearDepth(texture(sceneDepth,screen).r,nearFar)+viewPosition.z;
 if(ready>.5&&gap<-.012)discard;
 vec2 refUV=refractUV(screen,normalize(mat3(viewMatrix)*N),-viewPosition.z,.009+layer*.002);
 vec3 behind=texture(sceneColor,refUV).rgb;
 vec3 transmitted=behind*exp(-vec3(.20,.055,.025)*(.034+.020*n));
 vec3 reflected=vec3(.16,.34,.38)+vec3(.38,.47,.49)*pow(max(0.,dot(reflect(normalize(vec3(.3,-.9,-.1)),N),V)),75.);
 vec3 water=mix(transmitted,reflected,min(.80,f));
 // Narrow vertical streak glints and only a little aeration near landing.
 float streak=pow(max(0.,.5+.5*sin(vUv.x*211.+n*9.)),11.)*(.065+.13*fine);
 float aeration=smoothstep(.87,1.,vUv.y)*smoothstep(.63,.84,fine)*.13;
 water+=vec3(.53,.65,.69)*streak;water=mix(water,vec3(.75,.89,.91),aeration);
 water=mix(vec3(.11,.27,.31),water,ready);
 // Two films model a single thin sheet. Each transmits captured surroundings;
 // none receives a uniform white opacity or a second waterfall emitter.
 float alpha=coverage*(layer>.5?.27:.84);
 fragColor=vec4(water,alpha);
}`;
export const foamVertex=`precision highp float;in vec3 position;in vec2 uv;
uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix;out vec2 vUv;out vec3 viewPosition,worldPosition;
void main(){vUv=uv;worldPosition=(modelMatrix*vec4(position,1.)).xyz;vec4 p=modelViewMatrix*vec4(position,1.);viewPosition=p.xyz;gl_Position=projectionMatrix*p;}`;
export const foamFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneDepth,ripple;uniform vec2 resolution,nearFar,poolCenter;uniform float time,ready,radius;
in vec2 vUv;in vec3 viewPosition,worldPosition;out vec4 fragColor;
${noiseGLSL}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.||length(worldPosition.xz-poolCenter)>radius-.012)discard;
 float behind=linearDepth(texture(sceneDepth,gl_FragCoord.xy/resolution).r,nearFar)+viewPosition.z;if(ready>.5&&behind<-.01)discard;
 float n=fbm(p*9.+vec2(time*.8,-time*.7)),foam=(1.-smoothstep(.04,.37,r))*smoothstep(.28,.72,n)*.72;
 for(int i=0;i<4;i++){float age=fract(time*.77+float(i)*.25),radius=.10+age*.84;float ring=exp(-pow((r-radius)*63.,2.));foam+=ring*(1.-age)*(.10+.18*n);}
 foam*=1.-smoothstep(.75,1.,r);if(foam<.008)discard;fragColor=vec4(.82,.955,.99,clamp(foam,0.,.79));
}`;
const flightGLSL=`
uniform vec3 impact;uniform float time,waterY;
float hash(float x){return fract(sin(x*12.9898+78.233)*43758.5453);}
void launch(float id,float cycle,out vec3 start,out vec3 velocity,out float lifespan){
 float s=id+cycle*17.13,a=hash(s+3.)*6.2831853;vec2 c=vec2(cos(a),sin(a));
 start=impact+vec3((hash(s+19.)-.5)*.66,.013,c.y*.075);
 start.y=waterY+.013;float radial=.18+hash(s+9.)*.41,up=.50+pow(hash(s+31.),2.)*1.28;
 velocity=vec3(c.x*radial,up,c.y*radial+.09);lifespan=(up+sqrt(up*up+.25506))/9.81;
}
vec3 flight(vec3 p,vec3 v,float a){return p+v*a+vec3(0.,-4.905*a*a,0.);}
`;
export const computeFragment=`precision highp float;precision highp sampler2D;
in vec2 vUv;uniform sampler2D oldPosition,oldVelocity;uniform float delta;uniform bool initialize;
layout(location=0)out vec4 nextPosition;layout(location=1)out vec4 nextVelocity;
${flightGLSL}
void main(){float id=floor(gl_FragCoord.y)*32.+floor(gl_FragCoord.x);vec4 p=texture(oldPosition,vUv),v=texture(oldVelocity,vUv);
 if(initialize||p.w>=v.w||p.y<waterY){vec3 start,velocity;float lifespan;launch(id,floor(time*19.)+hash(id)*7.,start,velocity,lifespan);float age=initialize?hash(id+17.)*lifespan:hash(id+time)*delta;
 nextPosition=vec4(flight(start,velocity,age),age);nextVelocity=vec4(velocity+vec3(0.,-9.81*age,0.),lifespan);return;}
 nextPosition=vec4(p.xyz+v.xyz*delta+vec3(0.,-4.905*delta*delta,0.),p.w+delta);nextVelocity=vec4(v.xyz+vec3(0.,-9.81*delta,0.),v.w);
}`;
export const particleVertex=`precision highp float;precision highp sampler2D;
in vec3 position;in vec2 particleUV;uniform mat4 modelViewMatrix,projectionMatrix;
uniform sampler2D positions,velocities;uniform bool analytic;out vec2 form;out vec3 viewPosition;out float weight;
${flightGLSL}
void main(){float id=floor(particleUV.y*32.)*32.+floor(particleUV.x*32.);vec4 p=texture(positions,particleUV),v=texture(velocities,particleUV);
 if(analytic){vec3 start,velocity;float lifespan;launch(id,0.,start,velocity,lifespan);float age=mod(time+hash(id)*lifespan,lifespan);p=vec4(flight(start,velocity,age),age);v=vec4(velocity+vec3(0.,-9.81*age,0.),lifespan);}
 vec4 center=modelViewMatrix*vec4(p.xyz,1.);vec2 dir=normalize((modelViewMatrix*vec4(v.xyz,0.)).xy+vec2(.0001));
 float size=.0018+pow(hash(id+9.),2.)*.0042;center.xy+=vec2(-dir.y,dir.x)*position.x*size+dir*position.y*size*(1.1+min(length(v.xyz),2.)*.4);
 form=position.xy;viewPosition=center.xyz;weight=smoothstep(0.,.022,p.w)*(1.-smoothstep(.78,1.,p.w/max(v.w,.001)))*step(waterY+.001,p.y);gl_Position=projectionMatrix*center;
}`;
export const particleFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D sceneColor,sceneDepth;uniform vec2 resolution,nearFar;uniform float ready;
in vec2 form;in vec3 viewPosition;in float weight;out vec4 fragColor;
${noiseGLSL}
void main(){float r=dot(form,form);if(r>1.||weight<.002)discard;vec2 screen=gl_FragCoord.xy/resolution;
 float gap=linearDepth(texture(sceneDepth,screen).r,nearFar)+viewPosition.z;if(ready>.5&&gap<-.003)discard;
 vec3 N=normalize(vec3(form,sqrt(max(.001,1.-r)))),V=normalize(-viewPosition);float f=fresnelWater(max(0.,dot(N,V)));
 vec2 q=clamp(screen+N.xy*(.9+f)/resolution,.5/resolution,1.-.5/resolution);if(linearDepth(texture(sceneDepth,q).r,nearFar)<-viewPosition.z)q=screen;
 float glint=pow(max(0.,dot(N,normalize(vec3(-.45,.68,.73)))),70.);
 vec3 c=texture(sceneColor,q).rgb*(1.-f*.25)+vec3(.64,.82,.86)*(glint*.67+f*.16);
 fragColor=vec4(c,weight*(1.-smoothstep(.80,1.,r))*clamp(.28+glint*.48+f*.24,0.,.85));
}`;
export const shaderSources=Object.freeze({passVertex,waterVertex,waterFragment,fallVertex,fallFragment,foamVertex,foamFragment,computeFragment,particleVertex,particleFragment});

function fallbackTexture(T,rgba){const t=new T.DataTexture(new Uint8Array(rgba),1,1,T.RGBAFormat);t.needsUpdate=true;t.colorSpace=T.NoColorSpace;return t;}
function makeNormal(T,seed){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const a=x/size*Math.PI*2,b=y/size*Math.PI*2;
  const dx=Math.cos(a*3.+b*2.+seed)*.29+Math.cos(a*7.-b*4.+seed*2.)*.18+Math.cos(a*13.+b*9.-seed)*.08;
  const dy=Math.cos(a*3.+b*2.+seed)*.19-Math.cos(a*7.-b*4.+seed*2.)*.10+Math.cos(a*13.+b*9.-seed)*.06;
  const len=Math.hypot(dx,dy,1),i=(y*size+x)*4;data.set([Math.round((dx/len*.5+.5)*255),Math.round((dy/len*.5+.5)*255),Math.round((1/len*.5+.5)*255),255],i);
 }
 const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=t.magFilter=T.LinearFilter;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;
}
function poolGeometry(T,c,r,y){const p=[],uv=[],idx=[],rings=61,segs=96;for(let j=0;j<=rings;j++)for(let k=0;k<=segs;k++){const a=k/segs*Math.PI*2,d=r*j/rings;p.push(c[0]+Math.cos(a)*d,y,c[1]+Math.sin(a)*d);uv.push(.5+Math.cos(a)*j/rings*.5,.5+Math.sin(a)*j/rings*.5);}for(let j=0;j<rings;j++)for(let k=0;k<segs;k++){const a=j*(segs+1)+k,b=a+segs+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function fallGeometry(T,outlet,impact,width,landingWidth){
 const p=[],uv=[],idx=[],rows=56,cols=24,drop=Math.max(.05,outlet[1]-impact[1]),flightTime=Math.sqrt(2*drop/9.81);
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const f=j/rows,u=i/cols,age=f*flightTime,localWidth=width+(landingWidth-width)*f;p.push(outlet[0]+(impact[0]-outlet[0])*f+(u-.5)*localWidth,outlet[1]-4.905*age*age,outlet[2]+(impact[2]-outlet[2])*f);uv.push(u,f);}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return{geometry:g,flightTime};
}
function particleGeometry(T){const g=new T.InstancedBufferGeometry();g.setIndex([0,1,2,0,2,3]);g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));const a=new Float32Array(COUNT*2);for(let i=0;i<COUNT;i++){a[i*2]=(i%GRID+.5)/GRID;a[i*2+1]=(Math.floor(i/GRID)+.5)/GRID;}g.setAttribute('particleUV',new T.InstancedBufferAttribute(a,2));g.instanceCount=COUNT;return g;}

export function createSpaWater(T,{textures={},poolCenter=[8.9,-2.65],radius=2.32,waterY=-.14,bottomY=-.99,outlet=[7.1,1.06,-4.85],outletWidth=1.02,landingWidth=.70,impact=[7.5,-.14,-4.10]}={}){
 const group=new T.Group();group.name='Spa / refractive pool, one dual-film waterfall and splash';
 const ownedTextures=[],materials=[],geometries=[];const own=t=>(ownedTextures.push(t),t);
 const fallback=own(fallbackTexture(T,[128,128,128,255]));
 const u={time:{value:0},ready:{value:0},sceneColor:{value:fallback},sceneDepth:{value:fallback},normalA:{value:textures['water-normal-a']||textures.normalA||own(makeNormal(T,.7))},normalB:{value:textures['water-normal-b']||textures.normalB||own(makeNormal(T,3.8))},ripple:{value:textures['spring-ripples']||fallback},caustics:{value:textures['water-caustics']||fallback},resolution:{value:new T.Vector2(1,1)},nearFar:{value:new T.Vector2(.06,40)},poolCenter:{value:new T.Vector2(...poolCenter)},radius:{value:radius},waterY:{value:waterY},bottomY:{value:bottomY},impact:{value:new T.Vector3(...impact)},eye:{value:new T.Vector3()},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()}};
 const material=(name,v,f,uniforms=u,transparent=true)=>{const m=new T.RawShaderMaterial({name,glslVersion:T.GLSL3,vertexShader:v,fragmentShader:f,uniforms,transparent,depthTest:true,depthWrite:!transparent,side:T.DoubleSide,toneMapped:false});materials.push(m);return m;};
 const mesh=(name,g,m,order,parent=group)=>{geometries.push(g);const o=new T.Mesh(g,m);o.name=name;o.renderOrder=order;o.frustumCulled=false;parent.add(o);return o;};
 const water=mesh('Deep-blue turquoise spa / dynamic Jacuzzi surface',poolGeometry(T,poolCenter,radius,waterY),material('Depth Beer-Lambert spa water / 1.333 Fresnel',waterVertex,waterFragment,u,false),2);
 const fall=new T.Group();fall.name='ONE broad waterfall / two thin optical films';group.add(fall);
 const path=fallGeometry(T,outlet,impact,outletWidth,landingWidth);
 for(let layer=0;layer<2;layer++){const g=layer?path.geometry.clone():path.geometry;mesh('Waterfall film '+(layer+1),g,material('Gravity film '+(layer+1),fallVertex,fallFragment,{...u,layer:{value:layer},flightTime:{value:path.flightTime}}),3+layer,fall);}
 const fg=new T.PlaneGeometry(outletWidth*1.80,1.16);fg.rotateX(-Math.PI/2);const foam=mesh('Localized waterfall landing / concentric foam rings',fg,material('Landing foam',foamVertex,foamFragment),6);foam.position.set(impact[0],waterY+.024,impact[2]);
 const pu={...u,positions:{value:fallback},velocities:{value:fallback},analytic:{value:true}};
 const particles=mesh('1024 GPU impact droplets / one emitter band',particleGeometry(T),material('Local refractive spray',particleVertex,particleFragment,pu),7);
 let disposed=false,initialized=false,targets=null,swap=0,pending=false,delta=1/60,computeMaterial=null,computeQuad=null,computeScene=null;const computeCamera=new T.Camera();
 const stats={particles:COUNT,sources:1,filmLayers:2,waterVertices:water.geometry.attributes.position.count,computePasses:0,computePassesLastPrepare:0,mode:'unprepared',gravity:9.81};
 function prepare(renderer){
  if(disposed)return;stats.computePassesLastPrepare=0;
  if(!initialized){initialized=true;const ok=renderer.extensions.has('EXT_color_buffer_float');pu.analytic.value=!ok;stats.mode=ok?'RGBA32F MRT ping-pong':'analytic GPU fallback';
   if(ok){targets=[0,1].map(()=>new T.WebGLRenderTarget(GRID,GRID,{count:2,type:T.FloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false}));targets.forEach(rt=>rt.textures.forEach(t=>{t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;}));
    computeMaterial=new T.RawShaderMaterial({name:'Spa spray state / one MRT update per frame',glslVersion:T.GLSL3,vertexShader:passVertex,fragmentShader:computeFragment,uniforms:{impact:u.impact,waterY:u.waterY,time:u.time,oldPosition:{value:fallback},oldVelocity:{value:fallback},delta:{value:0},initialize:{value:true}},depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
    materials.push(computeMaterial);computeScene=new T.Scene();computeQuad=new T.Mesh(new T.PlaneGeometry(2,2),computeMaterial);computeQuad.frustumCulled=false;computeScene.add(computeQuad);
   }
  }
  if(!targets){pending=false;return;}if(!pending&&!computeMaterial.uniforms.initialize.value)return;
  const saved=renderer.getRenderTarget(),auto=renderer.autoClear,xr=renderer.xr.enabled,shadow=renderer.shadowMap.autoUpdate;
  try{renderer.autoClear=true;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;const src=targets[swap],dst=targets[1-swap];computeMaterial.uniforms.oldPosition.value=src.textures[0];computeMaterial.uniforms.oldVelocity.value=src.textures[1];computeMaterial.uniforms.delta.value=delta;renderer.setRenderTarget(dst);renderer.render(computeScene,computeCamera);swap=1-swap;pu.positions.value=dst.textures[0];pu.velocities.value=dst.textures[1];computeMaterial.uniforms.initialize.value=false;pending=false;stats.computePasses++;stats.computePassesLastPrepare=1;
  }finally{renderer.setRenderTarget(saved);renderer.autoClear=auto;renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadow;}
 }
 return{group,water,fall,foam,particles,materials,uniforms:u,stats,shaderSources,impact:u.impact.value,
  update(time,dt=1/60){u.time.value=time;delta=Math.max(0,Math.min(.05,dt));pending=true;},prepare,
  bind(color,depth,w,h,camera){u.sceneColor.value=color;u.sceneDepth.value=depth;u.resolution.value.set(Math.max(1,w),Math.max(1,h));u.nearFar.value.set(camera.near,camera.far);u.eye.value.copy(camera.position);u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);u.ready.value=color&&depth?1:0;},
  dispose(){if(disposed)return;disposed=true;targets?.forEach(t=>t.dispose());computeQuad?.geometry.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());ownedTextures.forEach(t=>t.dispose());group.removeFromParent();}
 };
}
