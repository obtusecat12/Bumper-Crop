import * as T from './vendor/three.module.min.js';
import {BACKCOURT_PLAN as P} from './backcourt-layout-v70.js';
import {cornerTextures} from './backcourt-materials-v71.js';

// Local detail changes the existing ground shader. No second paving mesh,
// hidden layer or divergent walking height is introduced.
export function attachCornerGround(material){
 const tex=cornerTextures(),old=material.onBeforeCompile,key=material.customProgramCacheKey();
 const frame=new T.Vector4(P.origin.x,P.origin.z,Math.cos(P.angle),Math.sin(P.angle));
 material.onBeforeCompile=function(s,renderer){
  old.call(this,s,renderer);
  Object.assign(s.uniforms,{uCornerFrame:{value:frame},uCornerColor:{value:tex['stone-basecolor']},uCornerNormal:{value:tex['stone-normal']},uCornerRoughness:{value:tex['stone-roughness']},uCornerAO:{value:tex['stone-ao']},uCornerHeight:{value:tex['stone-height']},uCornerStain:{value:tex['water-stain']}});
  s.vertexShader='varying vec2 vCornerPosition;varying float vCornerUp;uniform vec4 uCornerFrame;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec2 cornerWorld=(modelMatrix*vec4(transformed,1.)).xz-uCornerFrame.xy;
    vCornerPosition=vec2(uCornerFrame.z*cornerWorld.x-uCornerFrame.w*cornerWorld.y,uCornerFrame.w*cornerWorld.x+uCornerFrame.z*cornerWorld.y);
    vCornerUp=abs(normalize(mat3(modelMatrix)*normal).y);`);
  s.fragmentShader=`varying vec2 vCornerPosition;varying float vCornerUp;
   uniform sampler2D uCornerColor,uCornerNormal,uCornerRoughness,uCornerAO,uCornerHeight,uCornerStain;
   vec3 cornerMappedNormal(vec3 eyePosition,vec3 baseNormal,vec2 uv,vec3 mapNormal){
    vec3 q0=dFdx(eyePosition),q1=dFdy(eyePosition);vec2 st0=dFdx(uv),st1=dFdy(uv);
    vec3 q1p=cross(q1,baseNormal),q0p=cross(baseNormal,q0);
    vec3 a=q1p*st0.x+q0p*st1.x,b=q1p*st0.y+q0p*st1.y;
    float scale=inversesqrt(max(max(dot(a,a),dot(b,b)),.000000001));
    return normalize(mat3(a*scale,b*scale,baseNormal)*mapNormal);
   }
   float cornerWet(vec2 p,vec2 center,vec2 span){vec2 uv=(p-center)/span+.5;return texture2D(uCornerStain,clamp(uv,0.,1.)).a*step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);}
   `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 cornerP=vCornerPosition;
   float cornerPatch=(smoothstep(26.0,27.2,cornerP.x)*(1.-smoothstep(40.8,42.0,cornerP.x)))*smoothstep(18.25,18.65,cornerP.y)*(1.-smoothstep(21.5,23.0,cornerP.y));
   cornerPatch*=smoothstep(.85,.98,vCornerUp);
   vec2 cornerUV=cornerP/1.45;
   float cornerWetness=0.;
   if(cornerPatch>.001){
    cornerWetness=max(cornerWet(cornerP,vec2(30.25,19.48),vec2(1.0,.83)),max(cornerWet(cornerP,vec2(35.30,20.43),vec2(.70,.54))*.35,cornerWet(cornerP,vec2(40.17,18.80),vec2(.71,.55))*.55));
    diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(uCornerColor,cornerUV).rgb*diffuse,cornerPatch*.64);
    float cornerFoot=(1.-smoothstep(18.36,18.76,cornerP.y))*cornerPatch;
    diffuseColor.rgb*=1.-cornerFoot*.23;
    diffuseColor.rgb*=1.-cornerWetness*cornerPatch*.21;
   }`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   if(cornerPatch>.001){vec3 cornerN=texture2D(uCornerNormal,cornerUV).xyz*2.-1.;cornerN.xy*=.48*(1.-2.*mod(floor(cornerUV),2.));normal=normalize(mix(normal,cornerMappedNormal(-vViewPosition,normal,cornerUV,cornerN),cornerPatch));}`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   if(cornerPatch>.001){float cornerR=texture2D(uCornerRoughness,cornerUV).g;
    roughnessFactor=mix(roughnessFactor,clamp(cornerR*.91,.46,.94),cornerPatch);
    roughnessFactor=mix(roughnessFactor,.15,cornerWetness*cornerPatch*.83);
   }`);
  s.fragmentShader=s.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
   if(cornerPatch>.001)reflectedLight.indirectDiffuse*=mix(1.,texture2D(uCornerAO,cornerUV).r,cornerPatch*.55);`);
 };
 material.customProgramCacheKey=()=>key+'|corner-ground-v71';material.needsUpdate=true;
 material.userData.cornerGround={region:[26,42,18.25,23],tileMetres:1.45,overlayMesh:false,walkingHeightUnchanged:true};
 return {rebase:(cx,cz)=>{frame.x=P.origin.x-Number(cx)*64;frame.y=P.origin.z-Number(cz)*64;},frame};
}
