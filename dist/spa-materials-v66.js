import * as T from './vendor/three.module.min.js';
import {initializeSpaTextures as initializeOld,spaMaterials as oldMaterials,spaTextures as oldTextures} from './spa-materials-v65.js';
import {bathRefitTextures} from './bath-v61-materials.js?v=61';
import {springTextures} from './level27-materials.js?v=63';
const textures={};
const names=['ivory-square-tiles','limestone','golden-sun-art','white-terrycloth','ivory-lounger-vinyl','rubber-mat','monstera-leaf','glass-block'];
export async function initializeSpaTextures(decode){
 await Promise.all([initializeOld(decode),...names.flatMap(n=>['','-normal','-roughness','-ao'].map(async suffix=>{
  const key=n+suffix,url=new URL('./textures/spa-v66/'+key+'.webp',import.meta.url);let t;
  if(decode){const size=n==='limestone'?1024:512,im=await decode(url,size,size);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await new T.TextureLoader().loadAsync(url.href);
  t.name='Generated V66 / '+key;t.colorSpace=suffix?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=['golden-sun-art','monstera-leaf','glass-block'].includes(n)?T.ClampToEdgeWrapping:T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;textures[key]=t;
 }))]);
}
export function spaTextures(){return{...oldTextures(),...textures};}
const worldVarying=(shader)=>{
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 spaWorld,spaNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nspaWorld=(modelMatrix*vec4(position,1.)).xyz;spaNormal=normalize(mat3(modelMatrix)*normal);');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 spaWorld,spaNormal;');
};
export function spaMaterials(){
 const m=oldMaterials(),old=bathRefitTextures();
 const make=(key,r=.65,n=.4)=>new T.MeshStandardMaterial({name:'Spa V66 / '+key,map:textures[key],normalMap:textures[key+'-normal'],normalScale:new T.Vector2(n,n),roughnessMap:textures[key+'-roughness'],aoMap:textures[key+'-ao'],aoMapIntensity:.30,roughness:r});
 m.wall=make('ivory-square-tiles',.60,.38);m.wall.color.set(0xe0e7dc);
 m.floor=make('ivory-square-tiles',.68,.46);m.floor.color.set(0xc8d3c5);
 m.rock=make('limestone',.79,.72);m.rock.vertexColors=true;
 m.vinyl=make('ivory-lounger-vinyl',.51,.17);
 m.ceramic=make('ivory-lounger-vinyl',.20,.075);
 m.towel=make('white-terrycloth',.98,.51);m.towel.side=T.DoubleSide;
 m.rubber=make('rubber-mat',.70,.70);
 m.leaf=make('monstera-leaf',.52,.27);m.leaf.side=T.DoubleSide;m.leaf.alphaTest=.48;
 m.sun=make('golden-sun-art',.44,.73);m.sun.metalness=.24;
 m.brass=m.chrome.clone();m.brass.name='Spa V66 / worn lacquered brass';m.brass.color.set(0x967045);m.brass.roughness=.29;m.brass.normalScale.set(.16,.16);
 m.soil=m.rock.clone();m.soil.color.set(0x313425);m.soil.roughness=.96;m.soil.vertexColors=false;
 m.wood=new T.MeshStandardMaterial({name:'Spa V66 / sauna cedar',map:old.wood,normalMap:old['wood-normal'],roughnessMap:old['wood-roughness'],normalScale:new T.Vector2(.34,.34),roughness:.72,color:0xc5a074});
 m.stem=m.wood.clone();m.stem.name='Spa V66 / finely striated living petioles';m.stem.color.set(0x405a30);m.stem.roughness=.59;
 m.navy=make('ivory-square-tiles',.37,.28);m.navy.color.set(0x143746);
 m.ceiling=m.marble.clone();m.ceiling.name='Spa V66 / rounded mineral plaster soffit';m.ceiling.color.set(0x9babaf);m.ceiling.roughness=.90;m.ceiling.normalScale.set(.18,.18);
 m.glass=new T.MeshPhysicalMaterial({name:'Spa V66 / pressed wavy glass blocks',map:textures['glass-block'],normalMap:textures['glass-block-normal'],normalScale:new T.Vector2(.30,.30),roughness:.16,metalness:0,ior:1.5,transparent:true,opacity:.39,clearcoat:.7,clearcoatRoughness:.13,side:T.DoubleSide,depthWrite:false});
 m.glass.emissive.set(0xbf8746);m.glass.emissiveIntensity=.04;
 m.warm=m.vinyl.clone();m.warm.name='Spa V66 / warm waterproof downlight diffuser';m.warm.color.set(0xffd5a0);m.warm.emissive.set(0xffb964);m.warm.emissiveIntensity=1.6;
 m.glow.emissive.set(0x3286df);m.glow.emissiveIntensity=1.45;
 m.mural.emissiveIntensity=.30;m.mural.color.set(0xc8cfce);
 m.acrylic.color.set(0x36c0c9);m.acrylic.opacity=.76;m.acrylic.emissive.set(0x07515b);m.acrylic.emissiveIntensity=.28;
 const clock={value:0},marks={value:Array.from({length:12},()=>new T.Vector4(-100,-100,-100,0))},wetTexture={value:old.wetness};
 m.floor.onBeforeCompile=s=>{
  worldVarying(s);Object.assign(s.uniforms,{spaTime:clock,spaMarks:marks,spaWetMap:wetTexture});
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   uniform float spaTime;uniform vec4 spaMarks[12];uniform sampler2D spaWetMap;
   float spaWet(vec2 p){float r=length(p-vec2(8.9,-2.65));float n=texture2D(spaWetMap,p*.61).r;
    float belt=exp(-pow((r-2.75)/.42,2.))*.72;
    float trail=exp(-pow((p.x-10.50)/.39,2.))*smoothstep(-1.3,.2,p.y)*(1.-smoothstep(2.7,3.9,p.y))*.4;
    float wet=max(belt,trail)*smoothstep(.20,.76,n);
    for(int i=0;i<12;i++){vec2 d=p-spaMarks[i].xy;float a=spaMarks[i].w;d=mat2(cos(a),-sin(a),sin(a),cos(a))*d;float foot=1.-smoothstep(.65,1.,length(d/vec2(.085,.18)));wet=max(wet,foot*exp(-max(0.,spaTime-spaMarks[i].z)/65.)*.93);}
    return clamp(wet,0.,1.);}`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat floorWet=spaWet(spaWorld.xz);diffuseColor.rgb*=1.-floorWet*.25;');
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.055,floorWet);');
 };
 m.floor.customProgramCacheKey=()=> 'spa-v66-wet-footprints';
 m.rock.onBeforeCompile=s=>{
  worldVarying(s);
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 triW=pow(abs(normalize(spaNormal)),vec3(5.));triW/=max(.001,triW.x+triW.y+triW.z);
   vec3 triP=spaWorld*1.05;vec4 triColor=texture2D(map,triP.yz)*triW.x+texture2D(map,triP.xz)*triW.y+texture2D(map,triP.xy)*triW.z;diffuseColor*=triColor;`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 tx=texture2D(normalMap,triP.yz).xyz*2.-1.,ty=texture2D(normalMap,triP.xz).xyz*2.-1.,tz=texture2D(normalMap,triP.xy).xyz*2.-1.;
   vec3 perturb=vec3(0.,tx.x,tx.y)*triW.x+vec3(ty.x,0.,ty.y)*triW.y+vec3(tz.x,tz.y,0.)*triW.z;
   normal=normalize(normal+mat3(viewMatrix)*perturb*.56);`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float wetRock=(1.-smoothstep(.30,1.85,spaWorld.y))*.70+exp(-length(spaWorld.xz-vec2(7.57,-4.4))*2.)*.30;
   roughnessFactor=mix(.79,.13,clamp(wetRock,0.,1.));diffuseColor.rgb*=1.-wetRock*.24;`);
 };
 m.rock.customProgramCacheKey=()=> 'spa-v66-triplanar-wet-limestone';
 const caustics=springTextures()['water-caustics'];
 for(const material of[m.ceiling,m.wall]){
  material.onBeforeCompile=s=>{worldVarying(s);Object.assign(s.uniforms,{spaTime:clock,spaCaustic:{value:caustics}});
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float spaTime;uniform sampler2D spaCaustic;');
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float spread=exp(-length(spaWorld.xz-vec2(8.9,-2.65))*.40)*smoothstep(.40,2.65,spaWorld.y);
    vec2 cuv=spaWorld.xz*.49+spaWorld.y*.055;float ca=min(texture2D(spaCaustic,cuv+vec2(spaTime*.012,-spaTime*.016)).r,texture2D(spaCaustic,cuv*1.19+vec2(-spaTime*.015,spaTime*.009)).r);
    outgoingLight+=vec3(.018,.10,.16)*pow(ca,2.)*spread;
    #include <opaque_fragment>`);};
  material.customProgramCacheKey=()=> 'spa-v66-receiver-caustics';
 }
 return{...m,clock,marks,wetTexture};
}
