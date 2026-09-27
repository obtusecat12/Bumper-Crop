import * as T from './vendor/three.module.min.js';

export const WINDOW_COUNT=100,SIGN_COUNT=72,WINDOW_W=480,WINDOW_H=320,SIGN_W=128,SIGN_H=128;
function arrayTexture(name,count){const data=new Uint8Array(count*4);for(let i=0;i<count;i++)data.set([155,161,158,255],i*4);const t=new T.DataArrayTexture(data,1,1,count);t.name=name;t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;}
export const windowArray=arrayTexture('100 independently generated shop interiors',WINDOW_COUNT),signArray=arrayTexture('72 independently designed commercial signs',SIGN_COUNT);
export let signCatalog=[],windowCatalog=[];
let pending;
async function defaultDecode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Urban asset '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);im.close();return new Uint8Array(ctx.getImageData(0,0,w,h).data);}
export function initializeUrbanAssets(decode=defaultDecode,readCatalog=async url=>(await fetch(url)).json()){
 return pending||(pending=(async()=>{const catalog=await readCatalog(new URL('./textures/urban-v52/catalog.json',import.meta.url));if(catalog.windows.length!==WINDOW_COUNT||catalog.signs.length<SIGN_COUNT)throw Error('Incomplete urban asset library');signCatalog=catalog.signs;windowCatalog=catalog.windows;
 for(const [items,texture,w,h]of[[catalog.windows,windowArray,WINDOW_W,WINDOW_H],[catalog.signs.slice(0,SIGN_COUNT),signArray,SIGN_W,SIGN_H]]){const pixels=new Uint8Array(w*h*4*items.length);let cursor=0;await Promise.all(Array.from({length:6},async()=>{for(;;){const i=cursor++;if(i>=items.length)return;const a=await decode(new URL('./textures/urban-v52/'+items[i].file,import.meta.url),w,h);pixels.set(a.data||a,i*w*h*4);}}));texture.image={data:pixels,width:w,height:h,depth:items.length};texture.needsUpdate=true;}
 })().catch(e=>{pending=null;throw e}));
}
export function signIndex(seed,kind='fascia'){const items=signCatalog.filter(s=>s.kind===kind);return items.length?items[(seed>>>0)%items.length].index:(seed>>>0)%SIGN_COUNT;}
export function signAspect(index){return signCatalog[index]?.aspect||3;}
export function storefrontSign(windowIndex,seed){const category=windowCatalog[windowIndex]?.business,items=signCatalog.filter(s=>s.kind==='fascia'&&s.category===category);return items.length?items[(seed>>>0)%items.length].index:signIndex(seed,'fascia');}
export function addUrbanAssetMaterials(m){
 for(const[key,texture,emission]of[['shopWindow',windowArray,.20],['citySign',signArray,.07]]){
  const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:key==='shopWindow'?.20:.7,metalness:key==='shopWindow'?.15:.04,vertexColors:true,side:T.DoubleSide});
  mat.onBeforeCompile=s=>{s.uniforms.uUrbanArray={value:texture};s.vertexShader='attribute float assetLayer; varying float vAssetLayer; varying vec2 vAssetUv;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAssetLayer=assetLayer;vAssetUv=uv;');s.fragmentShader='uniform highp sampler2DArray uUrbanArray; varying float vAssetLayer; varying vec2 vAssetUv;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 urbanTexel=texture(uUrbanArray,vec3(clamp(vec2(vAssetUv.x,1.-vAssetUv.y),vec2(.002),vec2(.998)),floor(vAssetLayer+.5))); diffuseColor*=urbanTexel;`);s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\ntotalEmissiveRadiance+=urbanTexel.rgb*${emission.toFixed(2)};`);};mat.customProgramCacheKey=()=>key+'-array-v52';mat.name='Urban v52 / '+key;mat.userData.urbanShared=true;m[key]=mat;
 }
 return m;
}

// The high-rise room is a bounded analytic interior: a ray intersects its back,
// ceiling and side walls; blinds sit on a closer plane. Reflections are view dependent.
export function installUrbanGlass(mat){
 mat.map=null;mat.color.set(0xa1b4b7);mat.roughness=.05;mat.metalness=.9;mat.emissive.set(0x637277);mat.emissiveIntensity=.12;
 mat.onBeforeCompile=s=>{s.vertexShader='varying vec3 vUrbanPosition;varying vec2 vUrbanUv;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvUrbanUv=uv;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvUrbanPosition=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader=`varying vec3 vUrbanPosition;varying vec2 vUrbanUv;
float urbanHash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
`+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 vec3 N=inverseTransformDirection(geometryNormal,viewMatrix),V=normalize(cameraPosition-vUrbanPosition);
 vec3 U=normalize(cross(vec3(0.,1.,0.),N)+vec3(.0001,0.,0.));vec3 B=normalize(cross(N,U));
 vec2 cell=floor(vUrbanUv),uv=fract(vUrbanUv);float id=urbanHash2(cell);
 vec3 ray=normalize(vec3(-dot(V,U)*.5,-dot(V,B)*.6,-max(.22,abs(dot(V,N))))),pos=vec3(uv*2.-1.,1.);
 vec3 inv=1./(ray+vec3(.00001));vec3 limits=(sign(ray)-pos)*inv;float distance=min(min(limits.x,limits.y),limits.z);vec3 room=pos+ray*distance;
 vec3 interior=mix(vec3(.09,.12,.125),vec3(.24,.25,.22),id)*(.70+.30*step(abs(room.x),.97));
 float desk=(1.-smoothstep(.04,.07,abs(room.y+.45)))*(1.-step(.76,abs(room.x)));interior=mix(interior,vec3(.29,.23,.16),desk*.55);
 vec2 blindUv=uv-vec2(dot(V,U),dot(V,B))*.035/max(.25,abs(dot(V,N)));float slats=.64+.36*smoothstep(.2,.5,fract(blindUv.y*17.));float blindMask=step(.35+id*.45,blindUv.y)*step(.22,id);
 interior=mix(interior,vec3(.39,.415,.39)*slats,blindMask*.82);float tube=(1.-smoothstep(.016,.04,abs(room.y-.75)))*(1.-step(.66,abs(room.x)));interior+=tube*vec3(.18,.20,.18)*step(.7,id);
 vec3 R=reflect(-V,N);vec3 reflected=mix(vec3(.13,.155,.145),vec3(.54,.65,.73),smoothstep(-.25,.65,R.y));float neighbor=step(.3,fract(atan(R.x,R.z)*3.6))*(1.-smoothstep(-.05,.32,R.y));reflected*=1.-neighbor*.24;
 float fresnel=.22+.57*pow(1.-abs(dot(V,N)),4.);reflectedLight.indirectSpecular+=reflected*fresnel;
 reflectedLight.indirectDiffuse+=interior*(1.-fresnel)*.70;
`);};mat.customProgramCacheKey=()=> 'urban-interior-parallax-reflection-v52';
}
