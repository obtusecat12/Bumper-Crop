// V134-blender: full per-vertex lighting baked offline in Blender Cycles (tools/bake134_blender.py).
// Unlike V133 (indirect only), the bake carries direct light, soft shadows, emissive fixtures and diffuse bounces,
// so baked materials drop the realtime direct DIFFUSE term and the flat ambient/IBL diffuse; realtime lights keep only
// their specular highlights and env reflections (glass, bottles, lacquer, metal). Skinned NPCs stay fully realtime.
// Data: base64 u8 RGBM per weld133 vertex, B = (rgb*a)^2 * 16 = outgoing radiance per unit albedo. No samplers. ?bake=0 off.
import * as T from './vendor/three.module.min.js';
import {weld133} from './venue133-bake.js?v=133b';
export const BAKE134_R=16.0;
function patch(src,U){
 const m=src.clone();m.name=src.name+' / bake134';const prev=src.onBeforeCompile,prevKey=src.customProgramCacheKey;
 m.onBeforeCompile=(sh,r)=>{if(prev!==T.Material.prototype.onBeforeCompile)prev.call(m,sh,r);
  sh.uniforms.bake134Gain=U.gain;sh.uniforms.bake134Direct=U.direct;sh.uniforms.bake134Spec=U.spec;
  sh.vertexShader='attribute vec4 bake134;\nvarying vec4 vBake134;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n\tvBake134 = bake134;');
  sh.fragmentShader='varying vec4 vBake134;\nuniform float bake134Gain;\nuniform float bake134Direct;\nuniform float bake134Spec;\n'+sh.fragmentShader.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
	{ vec3 bk = vBake134.rgb * vBake134.a; bk = bk * bk * ${BAKE134_R.toFixed(1)};
	#if defined( RE_IndirectDiffuse )
		irradiance = bk * ( PI * bake134Gain );
		#if defined( STANDARD )
		iblIrradiance = vec3( 0.0 );
		#endif
	#endif
		reflectedLight.directDiffuse *= bake134Direct;
		reflectedLight.directSpecular *= bake134Spec;
	}`);};
 m.customProgramCacheKey=()=>'bake134|'+(prevKey!==T.Material.prototype.customProgramCacheKey?prevKey.call(src):'');
 return m;
}
// list from collectBake133(scene,{L}) (same L as the dump); data {key: base64}
export function applyBake134(list,data,{gain=1,direct=0,spec=1,tune=null}={}){
 const U={gain:{value:gain},direct:{value:direct},spec:{value:spec}},mats=new Map();let hit=0,miss=0,verts=0;
 for(const {mesh,key} of list){const b=data[key];if(!b){miss++;continue;}
  const bin=atob(b),n=mesh.geometry.attributes.position.count,{remap,count}=weld133(mesh.geometry);if(bin.length!==count*4){miss++;continue;}
  const u=new Uint8Array(n*4);for(let i=0;i<n;i++){const j=remap[i]*4;u[i*4]=bin.charCodeAt(j);u[i*4+1]=bin.charCodeAt(j+1);u[i*4+2]=bin.charCodeAt(j+2);u[i*4+3]=bin.charCodeAt(j+3);}
  mesh.geometry.setAttribute('bake134',new T.BufferAttribute(u,4,true));
  let m=mats.get(mesh.material);if(!m){m=patch(mesh.material,U);if(tune)tune(m,mesh.material);mats.set(mesh.material,m);}mesh.material=m;hit++;verts+=n;}
 return {hit,miss,verts,materials:mats.size,uniforms:U,pairs:[...mats]};
}
