// Material detail reuses existing albedo/terrain samples. Geometry, coverage,
// draw count and texture residency stay unchanged.
export function createMaterialFinish(){
  const registered=new WeakSet();
  function attach(root){root.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(!m?.isMeshStandardMaterial||registered.has(m))continue;
      registered.add(m);if(m.alphaTest>0)m.alphaToCoverage=true;const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
      m.onBeforeCompile=function(shader,renderer){
        previous.call(this,shader,renderer);
        const s=shader.fragmentShader;
        if(s.includes('uniform sampler2D uRuralSoil')||s.includes('sampler2DArray uGroundAlbedo')){
          shader.fragmentShader=s.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            float earthGrain=clamp(soilDetail*4.,0.,1.);
            float earthDry=mix(.97,.84,earthGrain)*(.98+soilPatch*.02);
            float earthDamp=clamp(vMeadow.y*vMeadow.x,0.,1.);
            roughnessFactor=mix(mix(earthDry,.68,earthDamp*.65),.415,rut);`);
        }else if(s.includes('float ruralLuma=')){
          const bark=s.includes('vec2 barkUV=');
          shader.fragmentShader=s.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            roughnessFactor=mix(${bark?'.98,.83':'.90,.74'},clamp(ruralLuma*3.,0.,1.));`);
          shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
            float finishFade=1.-smoothstep(.008,.075,length(fwidth(${bark?'barkUV':'leafUV'})));
            float finishHeight=ruralLuma*${bark?'.005':'.00035'}*finishFade;
            vec3 finishDx=dFdx(-vViewPosition),finishDy=dFdy(-vViewPosition);
            vec3 finishRx=cross(finishDy,normal),finishRy=cross(normal,finishDx);
            float finishDet=dot(finishDx,finishRx);
            vec3 finishGradient=sign(finishDet)*(dFdx(finishHeight)*finishRx+dFdy(finishHeight)*finishRy);
            normal=normalize(max(abs(finishDet),.00000001)*normal-finishGradient);`);
        }else if(m.roughness>=.6){
          // Subtle weathering follows the material's existing stains and grain.
          // The shared water material already defines its own roughness field.
          shader.fragmentShader=s.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            ${m.userData.architectureBatch?'if(vSurface.y>=.6)':''}roughnessFactor=clamp(roughnessFactor*(.87+.13*(1.-clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))*2.,0.,1.))),.45,1.);`);
        }
      };
      m.customProgramCacheKey=()=>key+'|material-finish-v16';m.needsUpdate=true;
    }
  });}
  return {attach};
}
