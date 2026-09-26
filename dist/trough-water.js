import * as T from './vendor/three.module.min.js';
import {ruralTextures} from './rural-textures.js?v=45';

// A small prop surface: ordinary alpha blending over actual stained geometry.
// No transmission pass, depth texture, planar reflection, or per-frame allocation.
const shared=new Set();
const flatNormal=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);
flatNormal.name='Trough / serializable flat-normal fallback';
flatNormal.colorSpace=T.NoColorSpace;flatNormal.needsUpdate=true;shared.add(flatNormal);
export const troughWaterTime={value:0};

export const troughWaterVertex=`
varying vec3 vTroughWorld;
varying vec2 vTroughCoord;
varying vec3 vTroughData;
#include <fog_pars_vertex>
void main(){
 vTroughCoord=uv;
 // Vertex colors carry dimensions and phase, so different trough sizes can
 // be merged by the compound batch into the same shared water material.
 vTroughData=color;
 vec4 worldPosition=modelMatrix*vec4(position,1.);
 vTroughWorld=worldPosition.xyz;
 vec4 mvPosition=modelViewMatrix*vec4(position,1.);
 gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
}`;

export const troughWaterFragment=`
uniform sampler2D uTroughNormalA,uTroughNormalB;
uniform float uTime;
uniform vec3 uTroughSky,uTroughSun;
varying vec3 vTroughWorld;
varying vec2 vTroughCoord;
varying vec3 vTroughData;
#include <fog_pars_fragment>
float troughHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float troughNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(troughHash(i),troughHash(i+vec2(1.,0.)),f.x),mix(troughHash(i+vec2(0.,1.)),troughHash(i+1.),f.x),f.y);
}
void main(){
 vec2 p=vTroughCoord,phase=vec2(vTroughData.b,vTroughData.b*.73);
 vec3 a=texture2D(uTroughNormalA,p*.46+phase+vec2(.005,-.003)*uTime).xyz*2.-1.;
 vec3 b=texture2D(uTroughNormalB,mat2(.8,.6,-.6,.8)*p*.73-phase+vec2(-.004,.005)*uTime).xyz*2.-1.;
 vec2 slopes=(a.xy/max(a.z,.25)+mat2(.8,-.6,.6,.8)*b.xy/max(b.z,.25))*.29;
 float viewDistance=length(cameraPosition-vTroughWorld);
 slopes*=1.-smoothstep(7.,45.,viewDistance);
 vec2 edgeDistances=max(vec2(0.),vTroughData.rg*.5-abs(p));
 float edge=min(edgeDistances.x,edgeDistances.y);
 float meniscus=1.-smoothstep(0.,.026,edge);
 // A very small upturned meniscus catches light along the wetted metal edge.
 slopes+=sign(p)*vec2(1.-smoothstep(0.,.023,edgeDistances.x),1.-smoothstep(0.,.023,edgeDistances.y))*.09;
 vec2 dxUV=dFdx(p),dyUV=dFdy(p);
 vec3 tangent=normalize((dFdx(vTroughWorld)*dyUV.y-dFdy(vTroughWorld)*dxUV.y)*sign(dxUV.x*dyUV.y-dxUV.y*dyUV.x));
 vec3 N=normalize(vec3(0.,1.,0.)+tangent*slopes.x+cross(tangent,vec3(0.,1.,0.))*slopes.y);
 vec3 V=normalize(cameraPosition-vTroughWorld),R=reflect(-V,N);
 float noV=max(.0,dot(N,V));
 float fresnel=.0204+.9796*pow(1.-noV,5.);
 // Cheap overcast-sky reflection. It follows the reflected view direction,
 // with broad clouds rather than a painted color on the water surface.
 vec2 skyUV=R.xz/(.38+abs(R.y));
 float clouds=troughNoise(skyUV*2.4+vec2(1.3,-.7))*.68+troughNoise(skyUV*5.1)*.32;
 vec3 reflected=uTroughSky*mix(.48,1.13,smoothstep(.13,.88,clouds));
 reflected*=mix(.70,1.,smoothstep(-.06,.55,R.y));
 reflected+=vec3(.09,.10,.10)*pow(max(R.y,0.),3.);
 vec3 H=normalize(V+normalize(uTroughSun));
 float variance=max(dot(dFdx(N),dFdx(N)),dot(dFdy(N),dFdy(N)));
 float exponent=mix(145.,45.,clamp(variance*150.,0.,1.));
 float specular=pow(max(0.,dot(N,H)),exponent)*.20;
 float broadGlint=pow(max(0.,dot(N,H)),20.)*.027;
 // Water transmittance is resolved by standard blending, not a color buffer.
 // Top-down stays clear; a low viewing angle becomes naturally reflective.
 float absorption=.135+meniscus*.04;
 float alpha=clamp(absorption+(1.-absorption)*fresnel,.13,.92);
 vec3 scatter=vec3(.055,.087,.072);
 vec3 premixed=scatter*absorption+reflected*fresnel*(1.-absorption);
 premixed+=vec3(.86,.92,.91)*(specular+broadGlint)*(.20+fresnel*.8);
 gl_FragColor=vec4(premixed/max(alpha,.001),alpha);
 #include <fog_fragment>
}`;

const waterMaterial=new T.ShaderMaterial({
 name:'Compound / translucent rippled trough water',
 uniforms:{...T.UniformsUtils.clone(T.UniformsLib.fog),uTime:troughWaterTime,uTroughNormalA:{value:flatNormal},uTroughNormalB:{value:flatNormal},uTroughSky:{value:new T.Color(.40,.47,.49)},uTroughSun:{value:new T.Vector3(-.45,.84,-.30).normalize()}},
 vertexShader:troughWaterVertex,fragmentShader:troughWaterFragment,
 vertexColors:true,transparent:true,opacity:1,depthWrite:false,depthTest:true,
 side:T.FrontSide,blending:T.NormalBlending,fog:true,toneMapped:false
});
waterMaterial.userData.troughWater=true;shared.add(waterMaterial);

const bedMaterial=new T.MeshStandardMaterial({
 name:'Compound / submerged stained trough lining',color:'#c9c6ae',
 map:ruralTextures.soil,roughness:.80,metalness:.08,vertexColors:true,side:T.DoubleSide
});
bedMaterial.userData.troughLining=true;
bedMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec2 vTroughBedUV;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTroughBedUV=uv;');
 shader.fragmentShader=`varying vec2 vTroughBedUV;
 float troughBedHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float troughBedNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(troughBedHash(i),troughBedHash(i+vec2(1.,0.)),f.x),mix(troughBedHash(i+vec2(0.,1.)),troughBedHash(i+1.),f.x),f.y);}
 `+shader.fragmentShader;
 // Reuse only the fine irregular grain of the soil map as sediment. Its
 // exposure is lifted so the real bottom remains readable through the water.
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
  #ifdef USE_MAP
   vec4 troughSediment=texture2D(map,vMapUv);
   diffuseColor.rgb*=mix(vec3(.62),troughSediment.rgb*1.4,.34);
  #endif
 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float bedPatch=troughBedNoise(vTroughBedUV*vec2(3.7,4.9))*.7+troughBedNoise(vTroughBedUV*vec2(16.,21.))*.3;
  float bedGrit=troughBedNoise(vTroughBedUV*140.);
  diffuseColor.rgb*=mix(vec3(.34,.43,.27),vec3(.81,.82,.67),smoothstep(.18,.79,bedPatch))*(.89+bedGrit*.18);
 `);
};
bedMaterial.customProgramCacheKey=()=> 'trough-lining-v37-1';shared.add(bedMaterial);

export function isSharedTroughWaterResource(resource){return shared.has(resource);}

// Call once for each completed/rehydrated chunk, after the lake normal maps
// are ready. Existing main-thread uniforms stay shared: no traversal per frame.
export function bindTroughWater(root,surface,time=troughWaterTime){
 root.traverse(object=>{
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(!material?.userData?.troughWater)continue;
   object.castShadow=false;object.receiveShadow=false;
   material.uniforms.uTime=time;
   if(surface?.normalA)material.uniforms.uTroughNormalA.value=surface.normalA;
   if(surface?.normalB)material.uniforms.uTroughNormalB.value=surface.normalB;
   // Keep each packet uniform object intact: its rehydrated onBeforeCompile
   // closes over that object. Share mutable Color/Vector3 values instead.
   if(surface?.uniforms?.skyColor)material.uniforms.uTroughSky.value=surface.uniforms.skyColor.value;
   if(surface?.uniforms?.sun)material.uniforms.uTroughSun.value=surface.uniforms.sun.value;
  }
 });
}

/** Interior dimensions in metres. Surface y=0, floor y=-waterDepth. */
export function makeTroughWater(width,depth,seed=1,{waterDepth=.395,level=0}={}){
 const w=Math.max(.30,width),d=Math.max(.25,depth),fill=Math.max(.05,waterDepth);
 const group=new T.Group();group.name='Trough / water and visible lining';
 const geometry=new T.PlaneGeometry(w,d);geometry.rotateX(-Math.PI/2);
 const positions=geometry.attributes.position,uv=geometry.attributes.uv;
 const phase=((seed>>>0)%4093)/4093*13.7,data=new Float32Array(positions.count*3);
 for(let i=0;i<positions.count;i++){
  uv.setXY(i,positions.getX(i),positions.getZ(i));data.set([w,d,phase],i*3);
 }
 geometry.setAttribute('color',new T.BufferAttribute(data,3));
 const water=new T.Mesh(geometry,waterMaterial);water.name=waterMaterial.name;water.castShadow=false;group.add(water);

 const p=[],n=[],tex=[],col=[];
 function vertex(v,normal,color,uv){p.push(...v);n.push(...normal);tex.push(...uv);col.push(...color);}
 function quad(a,b,c,d,normal,colors,uvs){
  for(const i of [0,1,2,0,2,3])vertex([a,b,c,d][i],normal,colors[i],uvs[i]);
 }
 function color(x,z,y){
  const s=Math.sin(x*8.9+z*7.6+phase*5.2)*Math.sin(x*2.6-z*5.1+phase);
  const edge=Math.min(w/2-Math.abs(x),d/2-Math.abs(z));
  const deep=1-Math.max(0,Math.min(1,(y+fill)/fill));
  const shade=(.78+s*.13)*(edge<.065?.71:1);
  // Brown mineral tide mark above the current surface, olive silt below it.
  const tint=y>-.035?[.63,.48,.31]:deep>.75?[.66,.71,.52]:[.62,.70,.55];
  return tint.map(c=>c*shade);
 }
 const nx=level>0?4:8,nz=level>0?2:3;
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const x0=-w/2+w*ix/nx,x1=-w/2+w*(ix+1)/nx,z0=-d/2+d*iz/nz,z1=-d/2+d*(iz+1)/nz;
  const v=[[x0,-fill,z0],[x0,-fill,z1],[x1,-fill,z1],[x1,-fill,z0]];
  quad(...v,[0,1,0],v.map(a=>color(a[0],a[2],a[1])),v.map(a=>[a[0]*.55+phase,a[2]*.55]));
 }
 // Four real inner walls show depth and a narrow irregular historic waterline.
 // They sit a few millimetres in front of the parent trough's inner metal wall.
 const ys=[-fill,-fill*.38,-.021,.025];
 for(const side of [-1,1])for(const axis of [0,2]){
  const along=axis===0?d:w,count=axis===0?nz:nx,wall=(axis===0?w:d)/2;
  for(let i=0;i<count;i++)for(let j=0;j<ys.length-1;j++){
   const a=-along/2+along*i/count,b=-along/2+along*(i+1)/count;
   const make=(q,y)=>axis===0?[side*wall,y,q]:[q,y,side*wall];
   const v=[make(a,ys[j]),make(b,ys[j]),make(b,ys[j+1]),make(a,ys[j+1])];
   const normal=axis===0?[-side,0,0]:[0,0,-side];
   quad(...v,normal,v.map(a=>color(a[0],a[2],a[1])),[[a*.55+phase,ys[j]*.55],[b*.55+phase,ys[j]*.55],[b*.55+phase,ys[j+1]*.55],[a*.55+phase,ys[j+1]*.55]]);
  }
 }
 const bedGeometry=new T.BufferGeometry();
 for(const [key,values,size]of [['position',p,3],['normal',n,3],['uv',tex,2],['color',col,3]])bedGeometry.setAttribute(key,new T.Float32BufferAttribute(values,size));
 bedGeometry.computeBoundingSphere();const bed=new T.Mesh(bedGeometry,bedMaterial);bed.name=bedMaterial.name;bed.receiveShadow=true;group.add(bed);
 return group;
}
