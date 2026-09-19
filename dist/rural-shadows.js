import * as T from './vendor/three.module.min.js';
import {CSM} from './vendor/csm/CSM.js';
import {SUN_DIRECTION,SUN_COLOR,SUN_INTENSITY} from './lighting-config.js?v=21';

// Contact-hardening filtering: four blocker samples and eight PCF samples.
// Fixed spatial samples avoid adding another temporal noise reconstruction pass.
const softShadow=`float getShadow(sampler2D shadowMap,vec2 shadowMapSize,float shadowIntensity,float shadowBias,float shadowRadius,vec4 shadowCoord){
  vec3 p=shadowCoord.xyz/shadowCoord.w;p.z+=shadowBias;
  if(p.x<=0.||p.x>=1.||p.y<=0.||p.y>=1.||p.z<=0.||p.z>=1.)return 1.;
  vec2 texel=1./shadowMapSize;
  float average=0.,blockers=0.;
  for(int i=0;i<4;i++){
    float a=float(i)*1.5707963+.392699;
    float d=unpackRGBAToDepth(texture2D(shadowMap,p.xy+vec2(cos(a),sin(a))*texel*3.));
    if(d<p.z){average+=d;blockers+=1.;}
  }
  // Even a small object missed by the wide blocker search gets contact PCF.
  float separation=blockers>0.?max(0.,p.z-average/blockers):0.;
  vec2 radius=max(texel*.8,min(texel*9.,vec2(separation*shadowRadius*.055)));
  float visibility=0.;
  for(int i=0;i<8;i++){
    float a=float(i)*2.3999632;
    float r=sqrt((float(i)+.5)/8.);
    visibility+=texture2DCompare(shadowMap,p.xy+vec2(cos(a),sin(a))*radius*r,p.z);
  }
  return mix(1.,visibility*.125,shadowIntensity);
}`;
export function ruralShadowChunk() {
  const original=T.ShaderChunk.shadowmap_pars_fragment,start=original.indexOf('float getShadow('),end=original.indexOf('vec2 cubeToUV',start);
  if(start<0||end<0)throw Error('Unsupported shadow shader');
  return original.slice(0,start)+softShadow+'\n'+original.slice(end);
}

export function createRuralShadows({renderer,scene,camera,quality='balanced'}) {
  const sizes={low:1024,balanced:1536,high:2048};
  const csm=new CSM({camera,parent:scene,cascades:2,maxFar:220,mode:'custom',
    customSplitsCallback:(count,near,far,out)=>{out.push(Math.min(.4,38/far),1)},
    shadowMapSize:sizes[quality]||1536,shadowBias:-.00006,
    lightDirection:new T.Vector3(...SUN_DIRECTION).normalize().negate(),lightIntensity:SUN_INTENSITY,
    lightNear:.5,lightFar:420,lightMargin:100});
  csm.fade=true;csm.updateFrustums();
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const compiled=new WeakMap(),animated=new Set();
  const registered=new WeakSet(),materialRoots=new WeakMap(),references=new Map(),shaderChunk=ruralShadowChunk();
  let dirty=true,lastUpdate=-Infinity,lastQuality=quality,origin='',lastPosition=new T.Vector3(Infinity,0,0),lastRotation=new T.Quaternion();
  const values={refreshes:0,casters:0,mapSize:csm.shadowMapSize};
  const corner=new T.Vector3();
  function supportDepth(i,face){
    const a=i?csm.breaks[i-1]:0,b=csm.breaks[i],d=Math.min(camera.far,csm.maxFar)-camera.near;
    return face==='near'?Math.max(camera.near,(a-.125*a*a)*d):Math.min(camera.far,(b+.125*b*b)*d);
  }
  function supportCorner(vertex,i,face){return corner.copy(vertex).multiplyScalar(supportDepth(i,face)/Math.max(.00001,-vertex.z));}
  function cachedCoverage(){
    camera.updateMatrixWorld(true);
    for(let i=0;i<csm.lights.length;i++){
      const c=csm.lights[i].shadow.camera,guard=(c.right-c.left)/csm.shadowMapSize;
      for(const face of ['near','far'])for(const v of csm.frustums[i].vertices[face]){
        supportCorner(v,i,face).applyMatrix4(camera.matrixWorld).applyMatrix4(c.matrixWorldInverse);
        if(corner.x<c.left+guard||corner.x>c.right-guard||corner.y<c.bottom+guard||corner.y>c.top-guard||-corner.z<c.near+guard||-corner.z>c.far-guard)return false;
      }
    }
    return true;
  }
  function attach(root) {
    const materials=new Set();let animatedCaster=false,restored=false;
    root.traverse(object=>{
      if(!object.isMesh)return;
      if(object.castShadow&&/foliage|leaves|sprays/i.test(object.name))animatedCaster=true;
      for(const m of Array.isArray(object.material)?object.material:[object.material]){
        if(!m||!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial))continue;
        object.receiveShadow=true;materials.add(m);
        if(registered.has(m)){if(!csm.shaders.has(m)&&compiled.has(m)){csm.shaders.set(m,compiled.get(m));restored=true;}continue;}
        const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
        csm.setupMaterial(m);const shadowCompile=m.onBeforeCompile;
        m.onBeforeCompile=function(shader,r){prior.call(this,shader,r);shadowCompile.call(this,shader,r);compiled.set(m,shader);shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',shaderChunk)};
        m.customProgramCacheKey=()=>key+'|rural-csm-pcss-v15';m.needsUpdate=true;registered.add(m);
      }
    });
    if(!materialRoots.has(root)){materialRoots.set(root,materials);for(const m of materials)references.set(m,(references.get(m)||0)+1);if(root.isMesh)root.addEventListener('dispose',()=>detach(root));}
    if(animatedCaster)animated.add(root);if(restored)csm._updateUniforms();
  }
  function detach(root) {
    for(const m of materialRoots.get(root)||[]){const n=(references.get(m)||1)-1;if(n)references.set(m,n);else{references.delete(m);csm.shaders.delete(m)}}
    materialRoots.delete(root);animated.delete(root);dirty=true;
  }
  function invalidate(){dirty=true;}
  function resize(nextQuality,maxFar=csm.maxFar) {
    const size=sizes[nextQuality]||1536;
    if(size!==csm.shadowMapSize){csm.shadowMapSize=size;for(const l of csm.lights){l.shadow.map?.dispose();l.shadow.map=null;l.shadow.mapSize.set(size,size)}values.mapSize=size;}
    lastQuality=nextQuality;csm.maxFar=Math.min(900,maxFar);csm.updateFrustums();
    // Cached light matrices remain fixed in world space between refreshes. A
    // small guard band covers normal walking/turning until the next update.
    for(let i=0;i<csm.lights.length;i++){
      const c=csm.lights[i].shadow.camera;let padding=i===0?2:6;
      for(const face of ['near','far'])for(const v of csm.frustums[i].vertices[face])padding=Math.max(padding,supportCorner(v,i,face).distanceTo(v)+(i===0?2:6));
      padding=Math.max(padding,(c.right-c.left)*.06);
      c.left-=padding;c.right+=padding;c.top+=padding;c.bottom-=padding;c.updateProjectionMatrix();
    }
    dirty=true;
  }
  function update({now,originKey='',quality=lastQuality,rain=0}) {
    if(quality!==lastQuality)resize(quality);
    const rebased=originKey!==origin;origin=originKey;
    const distance=camera.position.distanceToSquared(lastPosition),angle=camera.quaternion.angleTo(lastRotation);
    const moved=distance>.49||angle>.025,jump=distance>256||angle>.65;
    for(const l of csm.lights){l.color.set(SUN_COLOR);l.intensity=SUN_INTENSITY*(1-rain*.28);}
    // Wind is refreshed at 5 Hz, ordinary camera movement at most 10 Hz.
    // Static empty fields reuse their maps indefinitely. Teleports/rebases
    // cannot wait for the cadence because their cached coordinates are invalid.
    if(!dirty&&!rebased&&!jump&&cachedCoverage()){if(!moved&&(!animated.size||now-lastUpdate<200))return false;if(now-lastUpdate<100)return false;}
    camera.updateMatrixWorld(true);csm.update();
    for(let i=0;i<csm.lights.length;i++){
      const l=csm.lights[i],s=l.shadow;
      l.updateMatrixWorld(true);l.target.updateMatrixWorld(true);s.updateMatrices(l);
      let depth=0;
      for(const face of ['near','far'])for(const vertex of csm.frustums[i].vertices[face]){
        supportCorner(vertex,i,face).applyMatrix4(camera.matrixWorld).applyMatrix4(s.camera.matrixWorldInverse);
        depth=Math.max(depth,-corner.z);
      }
      // Fit light-space depth, including a guard for faded cascade overlap.
      // Camera FOV/aspect and telephoto views must not clip distant shadows.
      s.camera.far=Math.ceil((depth+16+Math.min(40,csm.maxFar*.05))/8)*8;
      s.camera.updateProjectionMatrix();s.updateMatrices(l);
      l.color.set(SUN_COLOR);l.intensity=SUN_INTENSITY*(1-rain*.28);
      s.normalBias=i===0?.035:.075;s.intensity=.93;
      // Carry depth/world-width scale through Three's per-shadow radius slot.
      s.radius=(s.camera.far-s.camera.near)/(s.camera.right-s.camera.left);
    }
    renderer.shadowMap.needsUpdate=true;dirty=false;lastUpdate=now;
    lastPosition.copy(camera.position);lastRotation.copy(camera.quaternion);values.refreshes++;
    return true;
  }
  function dispose(){for(const l of csm.lights)l.shadow.dispose();csm.remove();csm.shaders.clear();references.clear();animated.clear();}
  return {attach,detach,invalidate,resize,update,dispose,csm,values};
}
