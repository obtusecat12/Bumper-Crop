import {SPAWN_BAKE} from './level0-spawn-cycles-data.js';
import {SPAWN_LOOK} from './level0-spawn-look.js';

const number=v=>Number(v).toFixed(7),v3=v=>`vec3(${v.map(number).join(',')})`;
export function createSpawnIrradiance(T,loader,pending){
  let resolve,reject;pending.push(new Promise((a,b)=>{resolve=a;reject=b;}));
  const texture=loader.load('./assets/level0-spawn-cycles/irradiance.webp',()=>resolve(),undefined,e=>reject(e));
  texture.colorSpace=T.NoColorSpace;texture.minFilter=texture.magFilter=T.LinearFilter;
  texture.generateMipmaps=false;texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;
  const enabled=new URLSearchParams(globalThis.location?.search||'').get('spawnBake')!=='0';
  const uniforms={spawnAtlas:{value:texture},spawnGain:{value:enabled?SPAWN_LOOK.bakeGain:0}};
  function glsl(kind){
    const fs=SPAWN_BAKE.faces.filter(f=>f.kind===(kind==='grid'?'ceiling':kind));
    const code=fs.map(f=>{
      const [x,y,w,h]=f.rect,a2=f.a.reduce((s,v)=>s+v*v,0),b2=f.b.reduce((s,v)=>s+v*v,0);
      return `{vec3 d=p-${v3(f.o)};float plane=abs(dot(d,${v3(f.n)}));vec2 uv=vec2(dot(d,${v3(f.a)})/${number(a2)},dot(d,${v3(f.b)})/${number(b2)});
if(plane<best&&dot(n,${v3(f.n)})>.7&&all(greaterThanEqual(uv,vec2(-.008)))&&all(lessThanEqual(uv,vec2(1.008)))){best=plane;coord=(vec2(${x}.0,${y}.0)+clamp(uv,0.,1.)*vec2(${w}.0,${h}.0))/${SPAWN_BAKE.size}.;found=1.;}}`;
    }).join('\n');
    return `uniform sampler2D spawnAtlas;uniform float spawnGain;
vec4 spawnIrradiance(vec3 world,vec3 n){vec3 p=world-${v3(SPAWN_BAKE.origin)};${kind==='grid'||kind==='ceiling'?'p.y=2.72;n=vec3(0.,-1.,0.);':''}
float best=.14,found=0.;vec2 coord=vec2(0.);${code}
float edge=min(min(p.x+10.,10.5-p.x),min(p.z+13.6,4.5-p.z));float weight=found*smoothstep(0.,1.2,edge)*step(.0001,spawnGain);
vec3 t=texture2D(spawnAtlas,coord).rgb;return vec4(t*t*12.*spawnGain,weight);}`;
  }
  return{uniforms,glsl};
}

export function injectSpawnBake(T,s,bake,kind){
  Object.assign(s.uniforms,bake.uniforms);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+bake.glsl(kind));
  let begin=T.ShaderChunk.lights_fragment_begin;
  // Existing static fill lights are replaced only at baked receivers. The player's
  // existing .42-radian spotlight (including its cookie/BRDF) remains fully live.
  begin=begin.replace('getSpotLightInfo( spotLight, geometryPosition, directLight );',
    'getSpotLightInfo( spotLight, geometryPosition, directLight ); directLight.color*=mix(1.-spawnSample.a,1.,step(.90,spotLight.coneCos)*step(spotLight.coneCos,.93));');
  begin=begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=1.-spawnSample.a;');
  begin=begin.replace('rectAreaLight = rectAreaLights[ i ];','rectAreaLight = rectAreaLights[ i ];rectAreaLight.color*=1.-spawnSample.a;');
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>','vec4 spawnSample=spawnIrradiance(l0World,normalize(l0Normal));\n'+begin);
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 spawnLiveDiffuse=reflectedLight.directDiffuse,spawnLiveSpecular=reflectedLight.directSpecular;');
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`reflectedLight.directDiffuse=mix(reflectedLight.directDiffuse,spawnLiveDiffuse,spawnSample.a);
// outgoingLight has already been summed by Three here: replace its static terms,
// while preserving the existing dynamic direct light terms without field dimming.
vec3 spawnLit=${kind==='grid'?'vec3(.50,.48,.30)':'diffuseColor.rgb'}*spawnSample.rgb*circuitAt(l0World)+spawnLiveDiffuse+spawnLiveSpecular;
outgoingLight=mix(outgoingLight,spawnLit,spawnSample.a);
#include <opaque_fragment>`);
}
