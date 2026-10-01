import { STATUE_PARTS, STATUE_REPORT } from './statue-data.js';

/** Original continuously sculpted classical figures. Synchronous and DOM/fetch-free. */
export function createSpaStatues(T, {textures={}}={}) {
  const group=new T.Group();group.name='Pair of hand-sculpted classical marble bath attendants';
  const seated=new T.Group();seated.name='Seated classical attendant with folded legs';
  const kneeling=new T.Group();kneeling.name='Kneeling classical attendant with turned head';
  kneeling.position.set(1,0,-.45);group.add(seated,kneeling);
  const decode=(value,Ctor)=>{const s=atob(value),bytes=new Uint8Array(s.length);for(let i=0;i<s.length;i++)bytes[i]=s.charCodeAt(i);return new Ctor(bytes.buffer);};
  const materials={};
  for (const kind of ['flesh','hair','drapery']) {
    const material=new T.MeshPhysicalMaterial({name:`Warm translucent carved marble — ${kind}`,color:kind==='hair'?0xe5dec9:kind==='drapery'?0xf0e9d8:0xf4ecda,roughness:.35,metalness:0,ior:1.47,clearcoat:.14,clearcoatRoughness:.28,sheen:.055,sheenRoughness:.7,sheenColor:new T.Color(0xffd9ac),side:kind==='drapery'?T.DoubleSide:T.FrontSide});
    if(textures.marble){material.map=textures.marble;}
    if(textures.marbleNormal){material.normalMap=textures.marbleNormal;material.normalScale=new T.Vector2(.12,.12);}
    if(textures.marbleRoughness)material.roughnessMap=textures.marbleRoughness;
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float statueWet;varying float vStatueWet;varying vec3 vSculptPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStatueWet=statueWet;vSculptPosition=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vStatueWet;varying vec3 vSculptPosition;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float marblePhase=vSculptPosition.x*32.0+vSculptPosition.y*17.0+sin(vSculptPosition.z*19.0+vSculptPosition.y*5.0)*1.25;
        float marbleVein=pow(.5+.5*sin(marblePhase),18.0);
        diffuseColor.rgb*=1.0-marbleVein*.036;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.88,.91,.91),vStatueWet*.45);`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.22,vStatueWet);');
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`// Gentle thin-edge warm diffusion approximation, not a physical volumetric SSS solver.
        float marbleEdge=pow(1.0-abs(dot(normal,normalize(vViewPosition))),2.4);
        outgoingLight+=diffuseColor.rgb*vec3(1.0,.65,.37)*marbleEdge*.055;
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>`v65-sculpted-marble-wet-sss-${kind}`;
    material.userData={subsurfaceApproximation:'warm view-dependent edge diffusion',contactWetness:'sculpt-space per-vertex contact mask',originalAsset:true};
    materials[kind]=material;
  }
  for(const part of STATUE_PARTS){
    const q=decode(part.positions,Uint16Array),positions=new Float32Array(q.length);
    for(let i=0;i<q.length;i++)positions[i]=part.min[i%3]+q[i]/65535*part.scale[i%3];
    const wet=decode(part.wet,Uint8Array),contact=new Float32Array(wet.length),uv=new Float32Array(wet.length*2);
    for(let i=0;i<wet.length;i++){contact[i]=wet[i]/255;uv[i*2]=positions[i*3]*1.6+.5;uv[i*2+1]=positions[i*3+1]*1.6;}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('statueWet',new T.BufferAttribute(contact,1));g.setIndex(new T.BufferAttribute(decode(part.indices,part.indexType===16?Uint16Array:Uint32Array),1));g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();
    const mesh=new T.Mesh(g,materials[part.kind]);mesh.name=`${part.pose}: ${part.kind} continuous sculpt ${part.name}`;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={statuePart:part.kind,statuePose:part.pose,triangleCount:g.index.count/3};
    (part.pose==='seated'?seated:kneeling).add(mesh);
  }
  group.userData={assetVersion:65,authorship:'Original procedural signed-distance sculpt; no image-derived geometry',geometryReport:STATUE_REPORT};
  return {group,statues:{seated,kneeling},materials,report:STATUE_REPORT};
}
