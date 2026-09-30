import * as T from './vendor/three.module.min.js';
import {bathRefitTextures} from './bath-v61-materials.js?v=61';
export function wetFloorMaterial(base,{heads=[],baseWet=.16}={}){
 const m=base.clone();m.name='Integrated wet ground / dielectric tile, wetness and ripple normals';
 const uniforms={bWet:{value:bathRefitTextures().wetness},bTime:{value:0},bFlow:{value:new T.Vector4()},bReflect:{value:null},bReflectMatrix:{value:new T.Matrix4()},bReflectReady:{value:0},bBaseWet:{value:baseWet}};
 const coords=heads.map(p=>`vec2(${p.x.toFixed(3)},${p.z.toFixed(3)})`);while(coords.length<4)coords.push('vec2(999.)');
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);
 s.vertexShader='varying vec3 bWorld;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nbWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
 s.fragmentShader=`varying vec3 bWorld;uniform sampler2D bWet,bReflect;uniform mat4 bReflectMatrix;uniform vec4 bFlow;uniform float bTime,bBaseWet,bReflectReady;float bathWet;vec2 bathRipple;\n`+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float patches=texture2D(bWet,bWorld.xz*.21).r;
 bathWet=smoothstep(.37,.69,patches)*bBaseWet;
 bathRipple=vec2(0.);
 ${coords.map((c,i)=>`{vec2 q=bWorld.xz-${c};float d=length(q);float f=bFlow[${i}]*exp(-d*d*.85);bathWet=max(bathWet,f*.95);float r=sin(d*62.-bTime*(13.+float(${i}))) * exp(-d*1.9)*f; bathRipple+=normalize(q+vec2(.001))*r*.027;}`).join('\n')}
 bathWet=clamp(bathWet,0.,.98);diffuseColor.rgb*=mix(1.,.74,bathWet);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.075,bathWet);');
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,normalize(normal+mat3(viewMatrix)*vec3(bathRipple.x,0.,bathRipple.y)),bathWet));');
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec4 pr=bReflectMatrix*vec4(bWorld,1.);vec2 ruv=pr.xy/max(.001,pr.w)+bathRipple*.16;
 float valid=bReflectReady*step(0.,ruv.x)*step(ruv.x,1.)*step(0.,ruv.y)*step(ruv.y,1.);
 vec3 reflection=texture2D(bReflect,clamp(ruv,.002,.998)).rgb;
 float fr=.045+.72*pow(1.-clamp(dot(normal,geometryViewDir),0.,1.),5.);
 outgoingLight=mix(outgoingLight,reflection,clamp(bathWet*valid*(.16+fr),0.,.60));
 #include <opaque_fragment>`);
 };
 m.customProgramCacheKey=()=>`bathWet61-${coords.join(',')}`;m.userData.wetUniforms=uniforms;return m;
}
export function createBathReflection(scene,materials){
 const target=new T.WebGLRenderTarget(384,256,{depthBuffer:true});target.texture.colorSpace=T.LinearSRGBColorSpace;
 const mirror=new T.PerspectiveCamera(),look=new T.Vector3(),dir=new T.Vector3(),textureMatrix=new T.Matrix4(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
 let tick=0,rendering=false;const plane=new T.Plane(new T.Vector3(0,1,0),-.035);
 return {render(renderer,camera){if(rendering||camera.position.x> -4.0)return;if(++tick%3!==1)return;rendering=true;
  mirror.copy(camera,false);mirror.position.copy(camera.position);mirror.position.y=.03-camera.position.y;camera.getWorldDirection(dir);look.copy(camera.position).add(dir);look.y=.03-look.y;mirror.up.set(0,-1,0);mirror.lookAt(look);mirror.updateMatrixWorld();mirror.projectionMatrix.copy(camera.projectionMatrix);mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  textureMatrix.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
  const hidden=[];scene.traverse(o=>{if(o.isMesh&&materials.includes(o.material)&&o.visible){hidden.push(o);o.visible=false;}});
  const prev=renderer.getRenderTarget(),oldClip=renderer.clippingPlanes,oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate;
  renderer.clippingPlanes=[plane];renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  try{renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,mirror);materials.forEach(m=>{const u=m.userData.wetUniforms;u.bReflect.value=target.texture;u.bReflectMatrix.value.copy(textureMatrix);u.bReflectReady.value=1;});}
  finally{renderer.setRenderTarget(prev);renderer.clippingPlanes=oldClip;renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;hidden.forEach(o=>o.visible=true);rendering=false;}
 },dispose(){target.dispose();}};
}
