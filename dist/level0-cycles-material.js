import * as T from './vendor/three.module.min.js';
// Replace static illumination, retain the existing player spotlight and material maps.
export function cyclesMaterial(src,{id,uniforms={},glsl='',sample='vec4(vCyclesBake*vCyclesBake*4.,1.)',vertex=false}={}){
 const m=src.clone(),before=src.onBeforeCompile,key=src.customProgramCacheKey?.();
 m.onBeforeCompile=(s,r)=>{before.call(m,s,r);Object.assign(s.uniforms,uniforms);
 const vary='varying vec3 cyclesWorld;varying vec2 cyclesUv;'+(vertex?'varying vec3 vCyclesBake;':'');
 s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\n'+vary+(vertex?'\nattribute vec3 cyclesBake;':''));
 s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\nvec4 cp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\ncp=instanceMatrix*cp;\n#endif\ncyclesWorld=(modelMatrix*cp).xyz;cyclesUv=uv;${vertex?'vCyclesBake=cyclesBake;':''}`);
 s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+vary+'\n'+glsl);
 let begin=s.fragmentShader.replace('#include <lights_fragment_begin>',T.ShaderChunk.lights_fragment_begin);
 begin=begin.replace('getSpotLightInfo( spotLight, geometryPosition, directLight );','getSpotLightInfo( spotLight, geometryPosition, directLight );directLight.color*=mix(1.-cyclesSample.a,1.,step(.90,spotLight.coneCos)*step(spotLight.coneCos,.93));');
 begin=begin.replace('getPointLightInfo( pointLight, geometryPosition, directLight );','getPointLightInfo( pointLight, geometryPosition, directLight );directLight.color*=1.-cyclesSample.a;');
 begin=begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=1.-cyclesSample.a;');
 begin=begin.replace('rectAreaLight = rectAreaLights[ i ];','rectAreaLight = rectAreaLights[ i ];rectAreaLight.color*=1.-cyclesSample.a;');
 s.fragmentShader=begin.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nvec4 cyclesSample='+sample+';');
 s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 cyclesLive=reflectedLight.directDiffuse+reflectedLight.directSpecular;');
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,diffuseColor.rgb*cyclesSample.rgb+cyclesLive,cyclesSample.a);\n#include <opaque_fragment>');
 };m.customProgramCacheKey=()=>`cycles149-${id}-${key}`;return m;
}
