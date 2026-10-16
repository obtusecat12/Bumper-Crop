import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone as cloneSkin} from './vendor/SkeletonUtils.js';
import {SPRING_OCCUPANTS} from './level27-occupants-v68.js';
import {poolFloor} from './level27-layout.js?v=68';
import {retrofitSkinnedHead130} from './retro-head130-gen.js';

let templates=[];
export async function initializeSpringNPCs(load){
 const loader=new GLTFLoader();
 templates=await Promise.all(SPRING_OCCUPANTS.map(p=>{const url=new URL('./models/spring-v69/'+p.file,import.meta.url);return load?load(loader,url):loader.loadAsync(url.href);}));
 for(const gltf of templates)gltf.scene.traverse(o=>{if(!o.isMesh)return;for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(!m.isMeshBasicMaterial)throw new Error('Spring NPC must use baked unlit diffuse.');const t=m.map;if(t){t.colorSpace=T.SRGBColorSpace;t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.anisotropy=1;t.needsUpdate=true;const im=t.image;if(![128,256].includes(im.width)||im.width!==im.height)throw new Error('Spring NPC diffuse must be 128² or 256².');}}});
 templates.forEach((gltf,i)=>head130Retrofit(gltf.scene,SPRING_OCCUPANTS[i].id));
}

// V130-E: the V69 bathers wrapped one front photo all the way round the skull (mirrored face strip and the photo's
// ears on the back of the head) and carried two flat diamond ears. Rear triangles now use a generated head130 band and
// modelled ears; the front of the face keeps its original triangles and texels.
const HEAD130_L27={seated:{cheek:[.27,.55,.33,.66],hairTexture:null,hairColor:0xbdb9b1,hairY:a=>Math.cos(a)<-.2?.30:.56,hairTop:a=>.84,beard:.30,earV:[.37,.60],earZ:-.12},standing:{cheek:[.27,.55,.33,.66],hairRect:[.30,.04,.70,.12],hairY:a=>Math.cos(a)<-.2?.40:.66,earV:[.35,.59],earZ:-.12}};
function head130Retrofit(scene,id){
 const cfg=HEAD130_L27[id];if(!cfg)return;let face=null,body=null;
 scene.traverse(o=>{if(o.isSkinnedMesh){const n=(Array.isArray(o.material)?o.material[0]:o.material).name;if(n==='face')face=o;else if(n==='body')body=o;}});
 if(!face)return;const hi=face.skeleton.bones.findIndex(b=>b.name==='head');
 if(body&&hi>=0){const P=body.geometry.attributes.position,SI=body.geometry.attributes.skinIndex,SW=body.geometry.attributes.skinWeight;
  for(let t=0;t<P.count;t+=3){let all=true;for(let k=0;k<3;k++)if(!(SI.getX(t+k)===hi&&SW.getX(t+k)>.5))all=false;if(all)for(let k=1;k<3;k++)P.setXYZ(t+k,P.getX(t),P.getY(t),P.getZ(t));} // collapse the flat diamond ears
  P.needsUpdate=true;}
 retrofitSkinnedHead130(T,face,{...cfg,phi0:100,makeMaterial:tex=>{const m=face.material.clone();m.map=tex;m.name='face head130';return m;}});
}
function retroMaterial(src){
 const m=src.clone();m.name='PS2 baked diffuse / '+src.name;m.color.setRGB(.82,.83,.78);m.toneMapped=true;
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vRetroNormal,vRetroPosition;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('void main() {','void main() {\nvRetroNormal=normalize(mat3(modelMatrix)*normal);');
  s.vertexShader=s.vertexShader.replace('#include <skinnormal_vertex>','#include <skinnormal_vertex>\nvRetroNormal=normalize(mat3(modelMatrix)*objectNormal);');
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvRetroPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader='varying vec3 vRetroNormal,vRetroPosition;\n'+s.fragmentShader;
  // Painted anatomy remains in the generated diffuse. Only five low-cost
  // half-Lambert light bands and a restrained shoulder water sheen are added.
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 retroN=normalize(vRetroNormal),retroL=normalize(vec3(-.7,2.77,-1.72)-vRetroPosition);
   float halfLight=dot(retroN,retroL)*.5+.5;
   diffuseColor.rgb*=.57+.37*floor(halfLight*5.)/5.;
   float damp=(1.-smoothstep(.15,.48,vRetroPosition.y))*smoothstep(-.04,.05,vRetroPosition.y);
   float sheen=pow(max(dot(reflect(-retroL,retroN),normalize(cameraPosition-vRetroPosition)),0.),24.);
   diffuseColor.rgb+=vec3(.024,.027,.021)*damp*sheen;`);
 };m.customProgramCacheKey=()=> 'v69-npc-unlit-five-band';return m;
}

export function createSpringNPCs(){
 const group=new T.Group();group.name='Quiet spring bathers / generated PS1-PS2 UVs';const actors=[],diagnostics={actors:0,triangles:0,bones:[],animationHz:20,mainFrameCap:false,updates:0,material:'Unlit baked diffuse + five half-Lambert bands',nearest:true};
 templates.forEach((gltf,i)=>{
  const plan=SPRING_OCCUPANTS[i],root=cloneSkin(gltf.scene);root.name='Spring bather / '+plan.id;root.rotation.y=plan.yaw;
  // Seated feet project toward the deeper floor, away from the shallow rim.
  const footZ=plan.id==='seated'?.44:0,fx=plan.x+Math.sin(plan.yaw)*footZ,fz=plan.z+Math.cos(plan.yaw)*footZ;
  root.position.set(plan.x,poolFloor(fx,fz),plan.z);root.userData.occupant=plan.id;group.add(root);
  const materials=new Map(),skeletons=new Set();root.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;o.layers.set(0);o.frustumCulled=false; // bounds stay valid while the tiny idle clip deforms limbs
   o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{if(!materials.has(m))materials.set(m,retroMaterial(m));return materials.get(m);})[0];
   diagnostics.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.isSkinnedMesh)skeletons.add(o.skeleton);
  });
  diagnostics.bones.push(Math.max(...[...skeletons].map(s=>s.bones.length)));
  const mixer=new T.AnimationMixer(root);for(const clip of gltf.animations)mixer.clipAction(clip).play();mixer.setTime(plan.phase);
  root.updateMatrixWorld(true);for(const s of skeletons)s.update();actors.push({root,mixer,skeletons,plan});
 });diagnostics.actors=actors.length;
 let lastTick=-1;
 function update(time){const tick=Math.floor(time*20+1e-6);if(tick===lastTick)return;lastTick=tick;diagnostics.updates++;for(const a of actors){a.mixer.setTime(tick/20+a.plan.phase);a.root.updateMatrixWorld(true);for(const s of a.skeletons)s.update();}}
 function dispose(){for(const a of actors){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.root);a.root.traverse(o=>{if(o.isMesh)o.material.dispose();});for(const s of a.skeletons)s.dispose();}}
 return{group,actors,diagnostics,update,dispose};
}
