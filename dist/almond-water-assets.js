import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {almondProfile,almondProfileGLSL} from './almond-water-profiles.js?v=47';

// Object 1 containers, in metres. Templates/textures are shared; chunk workers
// transmit only deterministic anchors. There is no per-bottle frame polling.
export const ALMOND_VERSION=47,GLASS_LAYER=3;
const shared=new Set(),templates=new Map(),identity=new T.Matrix4(),UP=new T.Vector3(0,1,0);
const tex=(name,color=true)=>{const t=new T.DataTexture(new Uint8Array([128,128,128,255]),1,1);t.name=name;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.flipY=true;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;shared.add(t);return t;};
export const almondTextures={labels:tex('Almond water / four original vintage labels'),specialLabels:tex('Almond water / marble soda, contour soda, apothecary labels'),finishes:tex('Almond water / enamel steel nickel cork'),relief:tex('Almond water / scratches and roughness',false),emboss:tex('Moulded returnable bottle lettering',false)};
async function decode(url){const r=await fetch(url);if(!r.ok)throw Error('Almond water texture '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(im.width,im.height),ctx=c.getContext('2d');ctx.drawImage(im,0,0);im.close();return {data:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};}
export async function initializeAlmondTextures(read=decode){await Promise.all(Object.entries({labels:'v46/labels.webp',specialLabels:'v47/labels.webp',finishes:'v46/finishes.webp',relief:'v46/relief.png',emboss:'v46/emboss-normal.png'}).map(async([key,file])=>{const im=await read(new URL('./textures/almond-water-'+file,import.meta.url));almondTextures[key].image={data:new Uint8Array(im.data),width:im.width,height:im.height};almondTextures[key].needsUpdate=true;}));}
export function bottleHash(id){let n=2166136261;for(const c of String(id))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function almondVariant(id){const h=bottleHash(id),roll=h%100,kind=String(id).endsWith(':welcome')||roll<30?'thermos':roll<55?'glass':roll<73?'ramune':roll<90?'cola':'reagent';return {kind,finish:(h>>>9)%3,label:(h>>>14)%4,closure:(h>>>18)%3,paint:(h>>>22)%3,seed:h};}
export function almondName(v){return (v.kind==='thermos'?['烤漆保温瓶','旧银钢保温瓶','镀镍保温瓶'][v.finish]:v.kind==='ramune'?'波子汽水式弹珠瓶':v.kind==='cola'?'复古收腰汽水瓶':v.kind==='reagent'?'深色试剂瓶':(['皇冠盖','滚花旋盖','软木塞'][v.closure]+'玻璃瓶'))+' · 杏仁水';}
export function makeAlmondAnchor(x,y,z,id){const g=new T.Group();g.name='Almond-water streaming anchor';g.position.set(x,y,z);g.userData.almondAnchor=true;g.userData.almondVariant=almondVariant(id);return g;}
export const isSharedAlmondResource=r=>shared.has(r);

// A neutral rural reflection fallback is ready before the streamed sky cube.
function fallbackEnvironment(){const faces=[];for(let f=0;f<6;f++){const a=new Uint8Array(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=(y*16+x)*4,q=f===2?1:f===3?0:1-y/15;const c=q>.40?[.42,.46,.47]:[.19,.16,.10],shade=.92+.08*Math.cos(x*.4);a[i]=c[0]*255*shade;a[i+1]=c[1]*255*shade;a[i+2]=c[2]*255*shade;a[i+3]=255;}const t=new T.DataTexture(a,16,16);t.needsUpdate=true;faces.push(t);}const t=new T.CubeTexture(faces);t.colorSpace=T.NoColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;shared.add(t);return t;}
export const almondEnvironment={value:fallbackEnvironment()};
const environmentRotation={value:new T.Matrix3()};
const opaqueUniforms={almondLabels:{value:almondTextures.labels},almondSpecialLabels:{value:almondTextures.specialLabels},almondFinishes:{value:almondTextures.finishes},almondRelief:{value:almondTextures.relief},almondEnvironment,almondEnvironmentRotation:environmentRotation};
const opaqueVertex=`attribute vec4 bottleSurface;varying vec4 vBottleSurface;varying vec2 vBottleUV;\n`;
const opaqueFragment=`varying vec4 vBottleSurface;varying vec2 vBottleUV;
uniform sampler2D almondLabels,almondSpecialLabels,almondFinishes,almondRelief;uniform samplerCube almondEnvironment;uniform mat3 almondEnvironmentRotation;
vec2 bottleTile(float t){return vec2(mod(t,2.)*.5,1.-(floor(t/2.)+1.)*.5)+vec2(.005)+vBottleUV*.49;}
vec2 bottleLabel(float t){return vec2(.003+vBottleUV.x*.994,1.-(t+1.)*.25+.002+vBottleUV.y*.246);}
vec2 bottleSpecialLabel(float t){return vec2(.004+vBottleUV.x*.992,1.-(t+1.)/3.+.002+vBottleUV.y*(1./3.-.004));}
`;
function opaqueMaterial(hero=false){const m=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.55,metalness:.1});m.name='Merged almond-water opaque PBR';m.userData.almondWater=true;
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,opaqueUniforms);if(hero)s.uniforms.almondEnvironmentRotation=heroRotation;
  s.vertexShader=opaqueVertex+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBottleSurface=bottleSurface;vBottleUV=uv;');s.fragmentShader=opaqueFragment+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  if(vBottleSurface.x>=0.&&vBottleSurface.x<3.5){vec3 a=texture2D(almondFinishes,bottleTile(vBottleSurface.x)).rgb;if(vBottleSurface.x<.5)a=vec3(dot(a,vec3(.299,.587,.114))*2.3);diffuseColor.rgb*=a;}
  else if(vBottleSurface.x>7.5)diffuseColor.rgb*=texture2D(almondSpecialLabels,bottleSpecialLabel(vBottleSurface.x-8.)).rgb;
  else if(vBottleSurface.x>3.5)diffuseColor.rgb*=texture2D(almondLabels,bottleLabel(vBottleSurface.x-4.)).rgb;`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=vBottleSurface.z;if(vBottleSurface.x>=0.&&vBottleSurface.x<2.5)roughnessFactor=clamp(roughnessFactor+(texture2D(almondRelief,bottleTile(vBottleSurface.x)).b-.5)*.35,.45,.65);`);
  s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vBottleSurface.y;');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  if(vBottleSurface.x>=0.&&vBottleSurface.x<3.5){vec2 b=texture2D(almondRelief,bottleTile(vBottleSurface.x)).rg*2.-1.;vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);vec2 ux=dFdx(vBottleUV),uy=dFdy(vBottleUV);vec3 t=normalize(dx*uy.y-dy*ux.y+vec3(.000001)),bt=normalize(-dx*uy.x+dy*ux.x+vec3(.000001));normal=normalize(normal+t*b.x*.45+bt*b.y*.45);}`);
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
  vec3 er=almondEnvironmentRotation*inverseTransformDirection(reflect(-normalize(vViewPosition),normal),viewMatrix);
  vec3 sky=textureCube(almondEnvironment,er,roughnessFactor*3.).rgb;
  vec3 f0=mix(vec3(.04),diffuseColor.rgb,metalnessFactor);reflectedLight.indirectSpecular+=sky*f0*(.72-.24*roughnessFactor);`);
 };m.customProgramCacheKey=()=> 'almond-opaque-v47-'+hero;shared.add(m);return m;
}
const heroRotation={value:new T.Matrix3()},worldOpaque=opaqueMaterial(false),heroOpaque=opaqueMaterial(true);
export {heroRotation};

// Refraction reuses the existing opaque scene texture. It NEVER asks Three to
// render the terrain again for every physical material / transmissive bottle.
// The single glass boundary evaluates the glass + clear-liquid optical paths.
export const almondGlassVertex=`uniform vec2 liquidTilt;varying vec3 vGlassWorld,vGlassNormal,vGlassLocal,vGlassLocalView,vLiquidNormal;varying vec2 vGlassUV;
void main(){vec4 p=vec4(position,1.);vec3 n=normal;
#ifdef USE_INSTANCING
 p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
#endif
 vec4 wp=modelMatrix*p;vGlassWorld=wp.xyz;vGlassNormal=normalize(mat3(modelMatrix)*n);vGlassLocal=position;vGlassUV=uv;vLiquidNormal=normalize(mat3(modelMatrix)*vec3(liquidTilt.x,1.,liquidTilt.y));
 vec3 toEye=cameraPosition-wp.xyz;vGlassLocalView=vec3(dot(toEye,modelMatrix[0].xyz),dot(toEye,modelMatrix[1].xyz),dot(toEye,modelMatrix[2].xyz));
 gl_Position=projectionMatrix*viewMatrix*wp;
}`;
export const almondGlassFragment=`precision highp float;
uniform sampler2D sceneColor,embossNormal;uniform samplerCube almondEnvironment;
uniform vec2 resolution,liquidTilt,projectionScale;uniform mat3 environmentRotation;
uniform float transmission,roughness,ior,fillHeight,liquidTime,liquidMotion,bottleProfile,wallThickness;uniform vec3 glassAbsorption,marbleCenter;uniform vec2 liquidBounds,embossBand;
varying vec3 vGlassWorld,vGlassNormal,vGlassLocal,vGlassLocalView,vLiquidNormal;varying vec2 vGlassUV;
${almondProfileGLSL}
vec2 screenUV(vec2 p){return clamp(p,vec2(1.)/resolution,1.-vec2(1.)/resolution);}
void main(){
 vec3 N=normalize(vGlassNormal),V=normalize(cameraPosition-vGlassWorld),lv=normalize(vGlassLocalView);vec2 uv=gl_FragCoord.xy/resolution;
 // Mould lettering and scuffed heel have relief but no painted white outlines.
 if(vGlassLocal.y>embossBand.x&&vGlassLocal.y<embossBand.y){vec2 e=vec2(vGlassUV.x,clamp((vGlassLocal.y-embossBand.x)/(embossBand.y-embossBand.x),0.,1.));vec2 b=texture2D(embossNormal,e).rg*2.-1.;vec3 t=normalize(cross(vec3(0.,1.,0.),N)+vec3(.00001));N=normalize(N+t*b.x*.24+vec3(0.,b.y*.19,0.));}
 float facing=max(.035,dot(N,V)),f0=pow((ior-1.)/(ior+1.),2.);float fresnel=f0+(1.-f0)*pow(1.-facing,5.);fresnel=1.-pow(1.-fresnel,2.);
 vec3 localN=normalize(vec3(vGlassLocal.x,0.,vGlassLocal.z)+vec3(0.,.000001,0.));
 vec3 inside=refract(-lv,localN,1./1.333);if(dot(inside,inside)<.01)inside=-lv;
 vec3 plane=vec3(liquidTilt.x,1.,liquidTilt.y);
 float wave=(sin(vGlassLocal.x*135.+liquidTime*7.7)+sin(vGlassLocal.z*109.-liquidTime*6.1))*.00055*liquidMotion;
 float h=dot(plane,vGlassLocal)-fillHeight-wave;
 float liquid=(1.-smoothstep(-.00065,.00065,h))*step(vGlassLocal.y,liquidBounds.y);
 float wall=mix(wallThickness,.010,1.-smoothstep(.008,.029,vGlassLocal.y));
 if(bottleProfile>2.5&&vGlassLocal.y>.180)wall=.011;
 float thickness=2.*wall/max(.20,facing);float chord=max(.003,2.*innerRadius(vGlassLocal.y)*facing);
 vec3 vn=normalize(mat3(viewMatrix)*N);float distanceToEye=max(.1,length(cameraPosition-vGlassWorld));
 vec2 offset=vn.xy*projectionScale*(wall*(ior-1.)+chord*.333*liquid)/distanceToEye;
 vec3 through=texture2D(sceneColor,screenUV(uv-offset)).rgb;
 through*=exp(-glassAbsorption*thickness-vec3(.075,.035,.045)*chord*liquid);
 // Intersect the refracted ray with a volume-conserving free surface. The
 // cap is contained by the actual shoulder/neck profile, not an exposed disc.
 float den=dot(plane,inside),hit=-h/(abs(den)>.0001?den:.0001);vec3 q=vGlassLocal+inside*hit;
 float r=innerRadius(q.y),surfaceHit=step(.001,hit)*step(hit,chord*1.8)*step(length(q.xz),r)*step(liquidBounds.x,q.y)*step(q.y,liquidBounds.y);
 vec3 surfaceN=normalize(plane),rippleN=surfaceN+vec3(cos(q.x*135.+liquidTime*7.7),0.,cos(q.z*109.-liquidTime*6.1))*.035*liquidMotion;
 float sf=.0204+.9796*pow(1.-abs(dot(lv,normalize(rippleN))),5.);
 vec3 reflection=textureCube(almondEnvironment,environmentRotation*reflect(-V,N),roughness*3.).rgb;
 vec3 liquidReflection=textureCube(almondEnvironment,environmentRotation*reflect(-V,normalize(vLiquidNormal)),.25).rgb;
 through=mix(through,liquidReflection,surfaceHit*sf);
 float meniscus=(1.-smoothstep(.00045,.0015,abs(h)))*.40;
 through=mix(through,liquidReflection,meniscus);
 // A real ray/sphere intersection inside the Codd neck. The retained glass
 // marble adds no geometry or draw calls and is occluded by the outer bottle.
 if(bottleProfile>.5&&bottleProfile<1.5){
  vec3 oc=vGlassLocal-marbleCenter;float b=dot(oc,inside),disc=b*b-dot(oc,oc)+.0085*.0085;
  if(disc>0.){float mt=-b-sqrt(disc);if(mt>0.&&mt<.065){
   vec3 mn=normalize(oc+inside*mt);float mf=.045+.955*pow(1.-max(0.,dot(-inside,mn)),5.);
   vec2 mo=mn.xz*projectionScale*.012/distanceToEye;
   vec3 marble=texture2D(sceneColor,screenUV(uv-offset-mo)).rgb*vec3(.78,.94,.89);
   marble=mix(marble,reflection,clamp(mf+.12,0.,.92));
   marble+=vec3(.16)*pow(max(0.,dot(mn,normalize(vec3(-.5,.7,.6)))),24.);
   through=mix(through,marble,smoothstep(0.,.000006,disc));
  }}
 }
 // A microfacet lobe keeps the glass legible under a broad overcast sky.
 vec3 L=normalize(vec3(-.35,.8,.55)),H=normalize(V+L);float a=roughness*roughness,nh=max(0.,dot(N,H));
 float D=(a*a)/(3.14159*pow(nh*nh*(a*a-1.)+1.,2.));float highlight=min(.34,D*.0015)*facing;
 vec3 color=mix(through,reflection,fresnel)+vec3(highlight);color=mix(reflection,color,transmission);
 gl_FragColor=vec4(max(color,vec3(0.)),1.);
}`;
const glassBaseUniforms={sceneColor:{value:null},embossNormal:{value:almondTextures.emboss},almondEnvironment,resolution:{value:new T.Vector2(960,720)},projectionScale:{value:new T.Vector2(1,1)},environmentRotation:{value:new T.Matrix3()},liquidTilt:{value:new T.Vector2()},transmission:{value:.97},roughness:{value:.15},ior:{value:1.52},fillHeight:{value:.199},liquidTime:{value:0},liquidMotion:{value:0},glassAbsorption:{value:new T.Vector3(14.,2.5,8.5)},bottleProfile:{value:0},wallThickness:{value:.0025},liquidBounds:{value:new T.Vector2(.014,.250)},embossBand:{value:new T.Vector2(.136,.159)},marbleCenter:{value:new T.Vector3(0,.161,0)}};
const glassMaterials=new Map();
function configureGlass(m,v){const p=almondProfile(v.kind),u=m.uniforms;u.bottleProfile.value=p.index;u.wallThickness.value=p.wall;u.liquidBounds.value.set(p.bottom,p.top);u.embossBand.value.set(...p.emboss);u.fillHeight.value=p.fill;u.liquidTilt.value.set(0,0);u.liquidTime.value=0;u.liquidMotion.value=0;u.marbleCenter.value.set(0,.161,0);
 const palette=v.kind==='reagent'?[[60,250,490],[90,280,490],[110,185,310]]:v.kind==='ramune'?[[8,1.8,3.2],[4,1.5,2],[10,2.3,4]]:v.kind==='cola'?[[16,2,9],[12,3,8],[8,2.8,4]]:[[14,2.5,8.5],[9,5,1.5],[4,1.5,1]];
 u.glassAbsorption.value.set(...palette[v.label%3]);return m;
}
function glassMaterial(v,hero){const key=hero?'hero':v.kind+':'+String(v.label%3);if(glassMaterials.has(key)){const m=glassMaterials.get(key);return hero?configureGlass(m,v):m;}
 const uniforms={};for(const[k,u]of Object.entries(glassBaseUniforms))uniforms[k]=['sceneColor','almondEnvironment','resolution','projectionScale'].includes(k)&&!hero?u:{value:u.value?.clone?u.value.clone():u.value};uniforms.almondEnvironment=almondEnvironment;
 if(hero)uniforms.environmentRotation=heroRotation;
 const m=new T.ShaderMaterial({name:'Thick glass / optical transmission 0.97 / clear almond water',vertexShader:almondGlassVertex,fragmentShader:almondGlassFragment,uniforms,depthWrite:true,depthTest:true,side:T.FrontSide});m.userData.almondWater=true;m.userData.almondGlass=true;m.userData.transmission=.97;m.userData.ior=1.52;m.userData.roughness=.15;
 configureGlass(m,v);glassMaterials.set(key,m);shared.add(m);return m;
}
export function bindAlmondGlass(source,width,height,camera){glassBaseUniforms.sceneColor.value=source;glassBaseUniforms.resolution.value.set(width,height);glassBaseUniforms.projectionScale.value.set(camera.projectionMatrix.elements[0]*.5,camera.projectionMatrix.elements[5]*.5);}

function lathe(profile,n){return new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),n);}
function tube(points,r,n=6){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*3),r,n,false);}
function ring(r,y,wire,n){const g=new T.TorusGeometry(r,wire,4,n);g.rotateX(Math.PI/2);g.translate(0,y,0);return g;}
function paint(g,surface,color=0xffffff){const count=g.attributes.position.count,c=new T.Color(color),s=new Float32Array(count*4),col=new Float32Array(count*3);for(let i=0;i<count;i++){s.set(surface,i*4);col.set([c.r,c.g,c.b],i*3);}g.setAttribute('bottleSurface',new T.Float32BufferAttribute(s,4));g.setAttribute('color',new T.Float32BufferAttribute(col,3));return g;}
function merged(parts){const list=parts.map(g=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();return n;});const g=mergeGeometries(list,false);for(const p of list)p.dispose();g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);return g;}
function dent(g,strength=.0007){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(x,z),r=Math.hypot(x,z);if(r<.025||y<.027||y>.24)continue;const d=1-strength/r*(Math.exp(-(((y-.086)/.022)**2))*Math.exp(-(((a-1.7)/.24)**2))+.64*Math.exp(-(((y-.187)/.018)**2))*Math.exp(-(((a+1.0)/.19)**2)));p.setXYZ(i,x*d,y,z*d);}g.computeVertexNormals();return g;}
function thermosGeometry(v,hero){const n=hero?56:24,parts=[],finish=v.finish,paintColor=['#5e7782','#69715a','#7c5950'][v.paint],shellColor=finish===0?paintColor:0xffffff;
 const add=(g,t=finish,m=finish===0?.09:.82,r=.56,c=0xffffff)=>parts.push(paint(g,[t,m,r,0],c));
 add(dent(lathe([[0,.002],[.035,.002],[.041,.006],[.044,.012],[.044,.018],[.041,.022],[.041,.226],[.040,.236],[.035,.246],[.029,.25],[.029,.256],[0,.256]],n)),finish,finish===0?.08:.86,.56,shellColor);
 add(ring(.042,.017,.0015,n),1,.85,.5);add(ring(.0405,.028,.0007,n),1,.8,.52);
 add(lathe([[0,.237],[.030,.237],[.032,.241],[.032,.261],[.029,.265],[0,.265]],n),-1,.04,.62,'#222421');
 // Spiral thread, lip and cup seam remain distinct at inspection distance.
 if(hero){const p=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*6;p.push([Math.sin(a)*.0318,.242+i/64*.011,Math.cos(a)*.0318]);}add(tube(p,.00065,4),1,.82,.48);}
 const capType=v.finish===0||v.paint===1;
 add(lathe([[.035,.256],[.043,.256],[.045,.260],[.045,.293],[.043,.302],[.038,.307],[0,.307],[0,.303],[.035,.303],[.040,.295],[.040,.263],[.035,.263],[.035,.256]],n),capType?-1:1,capType?.04:.78,capType?.62:.53,capType?'#292a26':0xffffff);
 add(ring(.0444,.260,.001,n),1,.84,.51);add(ring(.044,.290,.00065,n),capType?-1:1,capType?.1:.8,.56,capType?'#191d1b':0xffffff);
 for(let i=0;i<3;i++)add(ring(.0451,.267+i*.006,.00055,n),-1,.05,.62,'#1e221e');
 // A formed strap handle belongs to the silver family, not every bottle.
 if(finish===1){add(tube([[.037,.220,0],[.064,.216,0],[.070,.202,0],[.070,.115,0],[.062,.102,0],[.039,.104,0]],.007,hero?8:5),-1,.05,.64,'#292c27');for(const y of [.214,.110])add(new T.BoxGeometry(.008,.019,.018).translate(.043,y,0),1,.8,.54);}
 // Small period paper badge. Full-size wrap labels are exclusive to glass.
 const label=new T.CylinderGeometry(.04135,.04135,.049,n,1,true,-.70,1.4);label.translate(0,.145,0);const uv=label.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.26+uv.getX(i)*.48,uv.getY(i));add(label,4+v.label,0,.83);
 return {opaque:merged(parts),glass:null,height:.309};
}
function glassGeometry(v,hero){const n=hero?64:28,parts=[],add=(g,t,m,r,c=0xffffff)=>parts.push(paint(g,[t,m,r,0],c));
 const g=lathe([[0,.003],[.027,.003],[.033,.007],[.035,.014],[.0355,.025],[.035,.048],[.0345,.062],[.0345,.148],[.034,.155],[.030,.167],[.023,.181],[.017,.191],[.013,.207],[.0126,.239],[.015,.241],[.015,.252],[.012,.256],[0,.256]],n);
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(x,z),r=Math.hypot(x,z);if(r<.004)continue;const lower=1-T.MathUtils.smoothstep(y,.045,.06),shoulder=T.MathUtils.smoothstep(y,.149,.163)*(1-T.MathUtils.smoothstep(y,.18,.195)),rib=(.0007*lower+.00045*shoulder)*Math.cos(a*24);p.setXYZ(i,x*(1+rib/r),y,z*(1+rib/r));}g.scale(.83,1,.83);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);
 const label=new T.CylinderGeometry(.03485,.03485,.062,n,1,true);label.rotateY(Math.PI);label.translate(0,.099,0);add(label,4+v.label,0,.84);
 if(v.closure===0){const cap=lathe([[0,.263],[.010,.263],[.016,.260],[.017,.258],[.0175,.247],[.015,.246]],hero?84:42);const a=cap.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),x=a.getX(i),z=a.getZ(i),r=Math.hypot(x,z);if(y<.259&&r>.01){const cr=.00135*Math.cos(Math.atan2(x,z)*21);a.setXYZ(i,x*(1+cr/r),y,z*(1+cr/r));}}cap.computeVertexNormals();add(cap,-1,.65,.51,['#765640','#455648','#707a7c','#975748'][v.label]);add(ring(.016,.259,.0006,n),1,.78,.49);}
 else if(v.closure===1){const cap=lathe([[0,.265],[.013,.265],[.016,.263],[.016,.244],[.014,.242]],hero?96:32);const a=cap.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),r=Math.hypot(x,z);if(r>.014){const k=1+.025*Math.cos(Math.atan2(x,z)*48);a.setXYZ(i,x*k,a.getY(i),z*k);}}cap.computeVertexNormals();add(cap,1,.83,.51);add(ring(.016,.246,.00065,n),1,.75,.55);}
 else{add(lathe([[0,.241],[.011,.241],[.0115,.271],[.0108,.275],[0,.275]],n),3,0,.92);add(ring(.0145,.249,.0007,n),1,.7,.54);}
 const op=merged(parts);op.scale(.83,1,.83);op.computeBoundingSphere();op.computeBoundingBox();return {opaque:op,glass:g,height:v.closure===2?.277:.267};
}
// The new families have genuinely different skins and closures. Labels follow
// their own profile, including the concave soda waist, with no hovering sleeve.
function finishGlass(g){g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);return g;}
function labelSkin(profile,n,y0,y1,{partial=false}={}){
 const shape=profile.filter(p=>p[0]>0),rad=y=>{for(let i=1;i<shape.length;i++)if(y<=shape[i][1]){const a=shape[i-1],b=shape[i],t=T.MathUtils.clamp((y-a[1])/Math.max(.00001,b[1]-a[1]),0,1);return T.MathUtils.lerp(a[0],b[0],t)+.00038;}return shape.at(-1)[0]+.00038;};
 const points=Array.from({length:9},(_,i)=>{const y=T.MathUtils.lerp(y0,y1,i/8);return new T.Vector2(rad(y),y);});
 const g=new T.LatheGeometry(points,n,partial?-1.06:0,partial?2.12:Math.PI*2);if(!partial)g.rotateY(Math.PI);
 if(partial){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,.27+uv.getX(i)*.46);}
 return g;
}
function crownCap(n,y,color,add){
 const g=lathe([[0,y+.010],[.010,y+.010],[.0146,y+.009],[.0166,y+.005],[.0166,y-.005],[.014,y-.006]],n),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);if(r>.012&&p.getY(i)<y+.008){const d=1+.07*Math.cos(Math.atan2(x,z)*21);p.setXYZ(i,x*d,p.getY(i),z*d);}}
 g.computeVertexNormals();add(g,-1,.65,.50,color);add(ring(.0153,y+.007,.00045,n),1,.8,.47);
}
function ramuneGeometry(v,hero){const n=hero?64:32,parts=[],add=(g,t=-1,m=.05,r=.64,c=0xffffff)=>parts.push(paint(g,[t,m,r,0],c));
 const profile=[[0,.002],[.0235,.002],[.028,.008],[.029,.016],[.0295,.031],[.029,.087],[.028,.101],[.025,.113],[.019,.127],[.0106,.141],[.0121,.149],[.0188,.160],[.0200,.175],[.0185,.190],[.0131,.205],[.0135,.218],[.017,.220],[.0175,.227],[.015,.231],[0,.231]];
 const g=lathe(profile,n),p=g.attributes.position;
 // Opposed Codd-neck dimples trap the marble above the narrow throat.
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(x,z),r=Math.hypot(x,z);if(r<.009)continue;const d=.0018*Math.exp(-(((y-.152)/.009)**2))*Math.pow(Math.abs(Math.cos(a)),12);p.setXYZ(i,x*(1-d/r),y,z*(1-d/r));}
 finishGlass(g);add(labelSkin(profile,n,.033,.086),8,0,.84);
 const blue=['#578f98','#6b8991','#4b7488'][v.paint];
 // Injection-moulded press collar, breakaway safety ring, recessed plunger.
 add(lathe([[.014,.215],[.019,.215],[.020,.220],[.020,.236],[.0178,.242],[.014,.242],[.014,.237],[.015,.236],[.015,.220],[.014,.215]],n),-1,.02,.59,blue);
 for(const y of [.218,.222,.234])add(ring(.020,y,.00048,n),-1,.01,.66,blue);
 const ribs=hero?32:16;for(let i=0;i<ribs;i++){const a=i/ribs*Math.PI*2;const q=new T.BoxGeometry(.00065,.010,.0013);q.translate(0,.228,.020);q.rotateY(a);add(q,-1,.02,.63,blue);}
 add(lathe([[0,.243],[.012,.243],[.014,.241],[.014,.237],[0,.237]],n),-1,.02,.71,'#b6c6bc');
 return {opaque:merged(parts),glass:g,height:.246};
}
function colaGeometry(v,hero){const n=hero?72:36,parts=[],add=(g,t=-1,m=.1,r=.60,c=0xffffff)=>parts.push(paint(g,[t,m,r,0],c));
 const profile=[[0,.002],[.025,.002],[.030,.008],[.0315,.018],[.032,.031],[.031,.048],[.029,.063],[.0265,.081],[.0254,.096],[.0260,.111],[.0277,.128],[.0301,.143],[.0312,.154],[.0303,.165],[.0277,.177],[.022,.189],[.0173,.200],[.0133,.214],[.0124,.237],[.0156,.240],[.0158,.249],[.013,.252],[0,.252]];
 const g=lathe(profile,n),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),r=Math.hypot(x,z);if(r<.003)continue;const skirt=T.MathUtils.smoothstep(y,.005,.019)*(1-T.MathUtils.smoothstep(y,.061,.078)),shoulder=T.MathUtils.smoothstep(y,.126,.143)*(1-T.MathUtils.smoothstep(y,.201,.218)),rib=.00105*(skirt+shoulder)*Math.cos(Math.atan2(x,z)*12);p.setXYZ(i,x*(1+rib/r),y,z*(1+rib/r));}
 finishGlass(g);add(labelSkin(profile,n,.079,.127),9,0,.81);
 crownCap(hero?84:42,.251,['#743631','#8b4032','#665248'][v.paint],add);
 return {opaque:merged(parts),glass:g,height:.263};
}
function reagentGeometry(v,hero){const n=hero?64:32,parts=[],add=(g,t=-1,m=.05,r=.7,c=0xffffff)=>parts.push(paint(g,[t,m,r,0],c));
 const profile=[[0,.002],[.031,.002],[.036,.007],[.038,.015],[.039,.026],[.039,.111],[.038,.121],[.035,.132],[.029,.142],[.021,.151],[.0182,.159],[.0183,.177],[.021,.179],[.021,.183],[.017,.185],[0,.185]];
 let g=lathe(profile,n);add(labelSkin(profile,n,.043,.103,{partial:true}),10,0,.91);
 let height=.204;
 if(v.closure===0){
  const stopper=lathe([[0,.172],[.0134,.172],[.0161,.185],[.0161,.190],[.0215,.190],[.024,.193],[.024,.205],[.021,.210],[0,.210]],n);
  g=merged([g,stopper]);height=.213;
  // A frosted ground-glass joint: a subdued translucent-looking matte band.
  add(ring(.0189,.182,.0008,n),-1,.04,.83,'#84715a');
 }else if(v.closure===1){
  const cap=lathe([[0,.203],[.017,.203],[.023,.201],[.023,.183],[.020,.180]],hero?96:32),p=cap.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);if(r>.02){const d=1+.026*Math.cos(Math.atan2(x,z)*32);p.setXYZ(i,x*d,p.getY(i),z*d);}}
  cap.computeVertexNormals();add(cap,-1,.025,.63,'#25211b');add(ring(.0225,.184,.00065,n),-1,.02,.71,'#322920');height=.206;
 }else{add(lathe([[0,.169],[.014,.169],[.015,.197],[.014,.201],[0,.201]],n),3,0,.95);add(ring(.0194,.178,.00045,n),1,.78,.62);}
 finishGlass(g);return {opaque:merged(parts),glass:g,height};
}
const constructors={thermos:thermosGeometry,glass:glassGeometry,ramune:ramuneGeometry,cola:colaGeometry,reagent:reagentGeometry};
export function makeAlmondBottle(v,{hero=false}={}){const key=[v.kind,...(v.kind==='thermos'?[v.finish,v.label,v.paint]:v.kind==='glass'?[v.label,v.closure]:v.kind==='reagent'?[v.closure]:[v.paint]),hero].join(':');let shape=templates.get(key);if(!shape){shape=(constructors[v.kind]||glassGeometry)(v,hero);templates.set(key,shape);}
 const group=new T.Group();group.name=almondName(v);group.userData.almondVariant={...v};group.userData.almondHeight=shape.height;
 const add=(geometry,material,layer,name)=>{const mesh=hero?new T.Mesh(geometry,material):new T.InstancedMesh(geometry,material,1);if(!hero){mesh.setMatrixAt(0,identity);mesh.instanceMatrix.setUsage(T.StaticDrawUsage);mesh.computeBoundingSphere();}mesh.name=name;mesh.layers.set(layer);mesh.castShadow=false;mesh.receiveShadow=!hero;mesh.userData.almondWater=true;group.add(mesh);return mesh;};
 add(shape.opaque,hero?heroOpaque:worldOpaque,0,'Almond water / merged body label closure');
 if(shape.glass){const m=add(shape.glass,glassMaterial(v,hero),GLASS_LAYER,'Almond water / refracting glass and moving liquid');m.userData.almondGlass=true;group.userData.glass=m;}
 return group;
}
export function hydrateAlmondPickups(chunk){for(const p of chunk.pickups){if(!p.mesh?.userData.almondAnchor)continue;const old=p.mesh,v=old.userData.almondVariant||almondVariant(p.id),g=makeAlmondBottle(v);g.position.copy(old.position);g.rotation.y=(v.seed/4294967296)*Math.PI*2;g.rotation.z=(v.seed%7-3)*.012;chunk.group.remove(old);chunk.group.add(g);p.mesh=g;p.almondVariant=v;}}
export function releaseAlmondBottle(group,{hero=false}={}){if(!group)return;group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(hero&&o.userData.almondGlass&&!shared.has(o.material))o.material.dispose();});group.removeFromParent();}
export function almondAssetStats(){return {templates:templates.size,sharedResources:shared.size,glassMaterials:glassMaterials.size};}
