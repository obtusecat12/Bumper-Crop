import * as T from './vendor/three.module.min.js';
import {Reflector} from './vendor/Reflector.js';

// Official r180 Reflector uses an oblique projection near plane. In particular,
// it does NOT toggle renderer.clippingPlanes, which previously created 33 new
// shader programs when the player first crossed the changing-room doorway.
export function createChangingMirror73(scene,mirror){
 const reflector=new Reflector(mirror.geometry,{textureWidth:512,textureHeight:256,multisample:0,clipBias:.001});
 reflector.position.copy(mirror.position);reflector.quaternion.copy(mirror.quaternion);reflector.updateMatrixWorld(true);
 reflector.camera.layers.set(5);
 const target=reflector.getRenderTarget(),material=mirror.material;
 const frustum=new T.Frustum(),matrix=new T.Matrix4(),bounds=new T.Box3().setFromObject(mirror);
 const u={mirrorColor:{value:target.texture},mirrorMatrix:reflector.material.uniforms.textureMatrix,mirrorReady:{value:0},mirrorTexel:{value:new T.Vector2(1/512,1/256)}};
 const stats={captures:0,skips:0,lastFrame:-1,lastCalls:0,lastTriangles:0,lastCameraPosition:[0,0,0],sameFrame:true,globalClipPlanes:false};
 let rendering=false,initialized=false;
 material.onBeforeCompile=s=>{Object.assign(s.uniforms,u);s.vertexShader='varying vec3 mirrorLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nmirrorLocal=transformed;');s.fragmentShader='varying vec3 mirrorLocal;uniform sampler2D mirrorColor;uniform mat4 mirrorMatrix;uniform vec2 mirrorTexel;uniform float mirrorReady;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec4 mq=mirrorMatrix*vec4(mirrorLocal,1.);vec2 mu=mq.xy/max(.001,mq.w);vec2 md=mirrorTexel*(.30+roughnessFactor*roughnessFactor*5.);vec3 mr=(texture2D(mirrorColor,mu+md).rgb+texture2D(mirrorColor,mu-md).rgb+texture2D(mirrorColor,mu+vec2(md.x,-md.y)).rgb+texture2D(mirrorColor,mu+vec2(-md.x,md.y)).rgb)*.25;float mv=mirrorReady*step(0.,mu.x)*step(mu.x,1.)*step(0.,mu.y)*step(mu.y,1.);outgoingLight=mix(outgoingLight,mr*mix(vec3(.98),diffuseColor.rgb,.08),mv*mix(.96,.24,roughnessFactor));\n#include <opaque_fragment>`);
 };material.customProgramCacheKey=()=> 'oblique-hand-wiped-mirror-v73';
 function visibleFrom(camera){camera.updateMatrixWorld();if(camera.position.z<=mirror.position.z+.08||camera.position.z>7.3)return false;matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);return frustum.intersectsBox(bounds);}
 return{stats,target,camera:reflector.camera,
  prepare(renderer,camera,force=false){
   if(rendering||(!force&&!visibleFrom(camera))){stats.skips++;return false;}
   // No 6 Hz cache: camera motion and reflection are captured in the same frame.
   rendering=true;if(!initialized){renderer.initRenderTarget(target);initialized=true;}
   const visible=mirror.visible,needs=renderer.shadowMap.needsUpdate,auto=renderer.shadowMap.autoUpdate;
   const savedAutoReset=renderer.info.autoReset,calls=renderer.info.render.calls,triangles=renderer.info.render.triangles;
   mirror.visible=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.info.autoReset=false;
   try{reflector.onBeforeRender(renderer,scene,camera);u.mirrorReady.value=1;stats.captures++;stats.lastFrame=renderer.info.render.frame;stats.lastCalls=renderer.info.render.calls-calls;stats.lastTriangles=renderer.info.render.triangles-triangles;stats.lastCameraPosition=camera.position.toArray();return true;}
   finally{mirror.visible=visible;renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=needs;renderer.info.autoReset=savedAutoReset;rendering=false;}
  },dispose(){reflector.dispose();}
 };
}
