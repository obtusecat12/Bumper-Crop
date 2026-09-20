import * as T from './vendor/three.module.min.js';
export function createWetGround(){
 const uniforms={uWetAmount:{value:0},uWetRain:{value:0},uWetClock:{value:0},uWetSky:{value:new T.Color('#9eafb4')},uWetBarn:{value:new T.Vector3()}};
 const registered=new WeakSet();
 function attach(root){root.traverse(o=>{if(o.name!=='sculpted-ground-and-wheel-ruts'||registered.has(o.material))return;const m=o.material,old=m.onBeforeCompile,key=m.customProgramCacheKey();registered.add(m);
  m.onBeforeCompile=function(s,r){old.call(this,s,r);Object.assign(s.uniforms,uniforms);s.fragmentShader='uniform float uWetAmount,uWetRain,uWetClock;uniform vec3 uWetSky,uWetBarn;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    float puddle=0.;float wetRipple=0.;
    if(uWetAmount>.005){
     float lowSoil=noise2(q*.5+17.7)*.72+noise2(q*1.5)*.28;
     puddle=smoothstep(.55,.70,lowSoil)*(rut*.91+(1.-smoothstep(.5,2.,rd))*.13);
     puddle*=smoothstep(.08,.60,uWetAmount)*(1.-meadowCover*.8);
     // Roof-covered soil stays dry. Building floors are separate materials.
     if(uBuilding.w>.5){vec2 bp=p-uBuilding.xy;float bc=cos(uBuilding.z),bs=sin(uBuilding.z);if(all(lessThan(abs(vec2(bc*bp.x-bs*bp.y,bs*bp.x+bc*bp.y)),uSize)))puddle=0.;}
     if(uFarm.z>.5&&farmYard(p)<.15)puddle=0.;
     vec2 barnLocal=vLayerFogWorld.xz-uWetBarn.xy;if(uWetBarn.z>.5&&abs(barnLocal.x)<12.&&abs(barnLocal.y)<5.8)puddle=0.;
     vec2 cell=floor(q*1.8),local=fract(q*1.8)-.5;float seed=hash2(cell);float phase=fract(uWetClock*.82+seed);
     float ring=abs(length(local)-phase*.43);wetRipple=(1.-smoothstep(.015,.037,ring))*(1.-phase)*uWetRain*puddle;
     diffuseColor.rgb*=1.-uWetAmount*.16-puddle*.13;
     roughnessFactor=mix(roughnessFactor,.14,puddle);
    }
   `);
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`if(puddle>.001){float facing=pow(1.-abs(dot(normal,geometryViewDir)),3.);outgoingLight=mix(outgoingLight,uWetSky*(.60+wetRipple*.52),puddle*(.24+facing*.48));}#include <opaque_fragment>`.replace('}#include','}\n#include'));
  };m.customProgramCacheKey=()=>key+'|sparse-rut-puddles-v23';m.needsUpdate=true;
 });}
 function update({rain=0,wetness=0,time=0,state,sky}){uniforms.uWetRain.value=rain;uniforms.uWetAmount.value=wetness;uniforms.uWetClock.value=time;if(sky)uniforms.uWetSky.value.copy(sky);const near=state.cx>=-1n&&state.cx<=3n&&state.cz>=-4n&&state.cz<=0n;uniforms.uWetBarn.value.set(near?84-Number(state.cx)*64:0,near?-80-Number(state.cz)*64:0,near?1:0);}
 return {attach,update,uniforms};
}
