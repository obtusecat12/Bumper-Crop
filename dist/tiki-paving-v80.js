import * as T from './vendor/three.module.min.js';
import {TIKI_FACADE as F} from './tiki-plan-v76.js';
import {texture80} from './tiki-additions-materials-v80.js';
// Modify the existing granite walk in the facade's local frame. No duplicate slab.
export function attachTikiPaving80(material){const old=material.onBeforeCompile,key=material.customProgramCacheKey(),frame=new T.Vector4(F.origin.x,F.origin.z,Math.cos(F.angle),Math.sin(F.angle));
 material.onBeforeCompile=function(s,r){old.call(this,s,r);Object.assign(s.uniforms,{uTikiPaveFrame:{value:frame},uTikiPaveColor:{value:texture80('exterior/sidewalk-albedo-1024')},uTikiPaveNormal:{value:texture80('exterior/sidewalk-normal-512',true)},uTikiPaveRough:{value:texture80('exterior/sidewalk-roughness-512',true)}});
 s.vertexShader='varying vec2 vTikiPave;varying float vTikiUp;uniform vec4 uTikiPaveFrame;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec2 tp=(modelMatrix*vec4(transformed,1.)).xz-uTikiPaveFrame.xy;
 vTikiPave=vec2(uTikiPaveFrame.z*tp.x-uTikiPaveFrame.w*tp.y,uTikiPaveFrame.w*tp.x+uTikiPaveFrame.z*tp.y);vTikiUp=abs(normalize(mat3(modelMatrix)*normal).y);`);
 s.fragmentShader=`varying vec2 vTikiPave;varying float vTikiUp;uniform sampler2D uTikiPaveColor,uTikiPaveNormal,uTikiPaveRough;
 vec3 tikiPaveNormal(vec3 eye,vec3 n,vec2 uv,vec3 mn){vec3 q0=dFdx(eye),q1=dFdy(eye);vec2 s0=dFdx(uv),s1=dFdy(uv);vec3 a=cross(q1,n)*s0.x+cross(n,q0)*s1.x,b=cross(q1,n)*s0.y+cross(n,q0)*s1.y;float f=inversesqrt(max(max(dot(a,a),dot(b,b)),1e-8));return normalize(mat3(a*f,b*f,n)*mn);}
 `+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float tikiPatch=(1.-smoothstep(12.1,12.5,abs(vTikiPave.x)))*smoothstep(.20,.40,vTikiPave.y)*(1.-smoothstep(3.35,3.5,vTikiPave.y))*smoothstep(.90,.99,vTikiUp);
 vec2 tikiUV=vTikiPave/2.;if(tikiPatch>.001)diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(uTikiPaveColor,tikiUV).rgb,tikiPatch);`);
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 if(tikiPatch>.001){vec3 tn=texture2D(uTikiPaveNormal,tikiUV).xyz*2.-1.;tn.xy*=.34;normal=normalize(mix(normal,tikiPaveNormal(-vViewPosition,normal,tikiUV,tn),tikiPatch));}`);
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 if(tikiPatch>.001)roughnessFactor=mix(roughnessFactor,max(.5,texture2D(uTikiPaveRough,tikiUV).g),tikiPatch);`);
 };material.customProgramCacheKey=()=>key+'|v80-existing-tiki-pavement';material.needsUpdate=true;
 // Pre-request so network work does not begin during a shader compilation.
 texture80('exterior/sidewalk-albedo-1024');texture80('exterior/sidewalk-normal-512',true);texture80('exterior/sidewalk-roughness-512',true);
 return{rebase(cx,cz){frame.x=F.origin.x-Number(cx)*64;frame.y=F.origin.z-Number(cz)*64;}};
}
