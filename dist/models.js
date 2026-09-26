import {exitForField} from './exit-route.js?v=52';
import {isSharedExitTexture} from './exit-textures.js?v=52';
import {makeAlmondAnchor,isSharedAlmondResource} from './almond-water-assets.js?v=52';
import {bakeStaticLeafLOD} from './static-leaf-lod.js?v=52';
import {bakeStaticMeshLOD} from './static-mesh-lod.js?v=52';
import {bakeStaticSelection} from './static-selection.js?v=52';
import {isSharedVergeResource,consolidatePlantCards} from './verge-cards.js?v=52';
import {consolidateStaticArchitecture,mergeArchitectureParts} from './architecture-batch.js?v=52';
import {makeCompoundChunk,isSharedCompoundResource} from './compound-models.js?v=52';
import {makeReferenceBarn,isSharedReferenceBarnResource} from './reference-barn.js?v=52';
import {isSharedLandmarkTexture} from './landmark-textures.js?v=52';
import {makeMeadowVegetation,isSharedMeadowResource} from './meadow-vegetation.js?v=52';
import {makePhotoFarmChunk,isSharedPhotoFarmResource} from './photo-farm.js?v=52';
import * as T from './vendor/three.module.min.js';
import {buildDenseWheat,isSharedWheatResource} from './dense-wheat.js?v=52';
import {makeNature,isSharedNatureResource} from './nature.js?v=52';
import {makeRuralBuilding,isSharedBuildingResource} from './buildings.js?v=52';
import {makeYardProps,isSharedYardPropResource} from './yard-props.js?v=52';
import {isSharedRuralTexture} from './rural-textures.js?v=52';
import {makeLake,isSharedLakeResource} from './lake.js?v=52';
import {makeGround,makeVerge,isSharedGroundResource} from './ground.js?v=52';
import {CHUNK,field,random,height,surfaceHeight,laneOffset,mod,pondShoreDistance} from './world.js?v=52';
import {planRuralPower} from './rural-power-layout.js?v=52';
import {bakePowerPole,powerSpanCables} from './rural-power-parts.js?v=52';
const UP=new T.Vector3(0,1,0),dummy=new T.Object3D();
const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,7);
function noiseTexture(kind){const n=128,data=new Uint8Array(n*n*4),r=random(kind==='brick'?971:kind==='wood'?941:717);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4;let a=.72+r()*.28;if(kind==='wood')a*=.75+.25*Math.sin(x*.72+Math.sin(y*.04)*.3)**2;if(kind==='roof')a*=.75+.25*Math.sin(x*.72)**4;if(kind==='brick'){const mortar=y%16<2||(x+(Math.floor(y/16)%2)*16)%32<2;a=mortar?.58:a;}data[i]=Math.floor(255*a);data[i+1]=Math.floor(250*a);data[i+2]=Math.floor(237*a);data[i+3]=255;}const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t}
const woodTex=noiseTexture('wood'),brickTex=noiseTexture('brick'),roofTex=noiseTexture('roof');
export const worldSurfaceTextures=[woodTex,brickTex,roofTex];
function material(hex,texture=null){return new T.MeshStandardMaterial({color:hex,map:texture,roughness:1})}
export const materials={wood:material('#73624a',woodTex),darkwood:material('#3c3c30',woodTex),red:material('#793a2b',woodTex),brick:material('#956346',brickTex),trim:material('#b8b9a1',woodTex),roof:material('#626762',roofTex),steel:material('#77817b',roofTex),door:material('#3e5354',woodTex),black:material('#19231d'),nails:material('#5c6660'),floor:material('#6c6550'),label:material('#d8cfad'),cap:material('#938773')};
const glass=new T.MeshStandardMaterial({color:'#a1aa86',transparent:true,opacity:.75,roughness:.2,metalness:.12});
const bucket=new Map();Object.entries(materials).forEach(([k,m])=>bucket.set(m,k));
// Collapse architectural details into one geometry per material, per field.
class Batch{
 constructor(){this.parts=new Map()}
 add(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(dummy.matrix);if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(g)}
 box(mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){this.add(box,mat,x,y,z,sx,sy,sz,rx,ry,rz)}
 beam(mat,a,b,r=.07){const mid=a.clone().add(b).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(UP,b.clone().sub(a).normalize());dummy.position.copy(mid);dummy.quaternion.copy(q);dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();const g=cylinder.toNonIndexed();g.applyMatrix4(dummy.matrix);if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(g)}
 finish(group){for(const [mat,parts]of this.parts){let count=parts.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2),at=0;for(const g of parts){p.set(g.attributes.position.array,at*3);n.set(g.attributes.normal.array,at*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}}
}
export const makeBottle=makeAlmondAnchor;


export const wind={time:{value:0},player:{value:new T.Vector3()},strength:{value:.32}};
export const waterTime={value:0};
export function* createChunkTask(f,level,quality,collected){
 const group=new T.Group(),b=new Batch(),colliders=[],pickups=[],wheatBuckets=new Map(),powerPacket={poles:[],cables:[]};let complete=false;
 try{
  group.add(makeGround(f,level));yield 'ground';
  group.add(makeVerge(f,level,wind));yield 'verges';
  if(f.meadow){group.add(makeMeadowVegetation(f,level,wind));yield 'meadow';}
  const wheat=buildDenseWheat(f,level,quality,wind);group.add(wheat.mesh);yield 'wheat';
  // The independent 40 m cereal worker owns frozen near-field submissions.
  const nature=makeNature(f,level,wind);group.add(nature.group);colliders.push(...nature.colliders);yield 'nature';
  const powerPlan=planRuralPower(f);if(f.exit){const keep=p=>{const q=exitForField(p.x,p.z,f,{});return !q.active||q.progress<.40||q.distance>28+q.progress*70;};powerPlan.poles=powerPlan.poles.filter(keep);powerPlan.spans=powerPlan.spans.filter(s=>keep(s.a)&&keep(s.b));}for(const pole of powerPlan.poles){const baked=bakePowerPole(pole);powerPacket.poles.push({id:pole.id,transformer:pole.transformer,groups:baked.groups});powerPacket.cables.push(...baked.cables);if(pole.x>=0&&pole.x<64&&pole.z>=0&&pole.z<64)colliders.push({kind:'circle',x:pole.x,z:pole.z,r:.22});}for(const span of powerPlan.spans)powerPacket.cables.push(...powerSpanCables(span));yield 'power-network';
  if(f.type==='building'){
   const building=makeRuralBuilding(f,level);group.add(building.group);colliders.push(...building.colliders);pickups.push(...building.pickups);yield 'building';
   const yard=makeYardProps(f,level);group.add(yard.group);colliders.push(...yard.colliders);yield 'yard-props';
  }
  if(f.compounds?.length){const compounds=makeCompoundChunk(f,level,wind);group.add(compounds.group);colliders.push(...compounds.colliders);pickups.push(...compounds.pickups);yield 'farm-compounds';}
  const barn=makeReferenceBarn(f,level,wind);if(barn){group.add(barn.group);colliders.push(...barn.colliders);yield 'reference-barn'}
  const farm=makePhotoFarmChunk(f,wind);if(farm){group.add(farm.group);colliders.push(...farm.colliders);yield 'photo-farm'}
  if(f.type==='pond'){group.add(makeLake(f,level,wind));yield 'lake'}
  const r=random(f.seed^28391);
  if(f.roads[0].enabled&&r()<.30)pickups.push({id:f.key+':road',x:1.65,z:18+r()*23,y:0});
  if(f.x===0n&&f.z===0n)pickups.push({id:'0,0:welcome',x:1.9,z:46,y:0});
  for(const p of pickups){p.y=Math.max(p.y,surfaceHeight(p.x,p.z,f)+.004);if(!collected.has(p.id)){p.mesh=makeBottle(p.x,p.y,p.z,p.id);group.add(p.mesh)}}
  for(const w of wheat.candidates){const key=`${Math.floor(w.x/2)},${Math.floor(w.z/2)}`;if(!wheatBuckets.has(key))wheatBuckets.set(key,[]);wheatBuckets.get(key).push(w)}
  const doors=[];group.traverse(o=>{if(o.userData.dynamicDoor)doors.push(o);});
  for(const door of doors)consolidateStaticArchitecture(door,level);
  consolidateStaticArchitecture(group,level,new Set(pickups.map(p=>p.mesh).filter(Boolean)));yield 'static-batch';
  consolidatePlantCards(group,wind);
  group.traverse(m=>{
   if(m.isMesh&&!m.isInstancedMesh&&(m.material?.userData.architectureBatch||/bark|Merged trunks/.test(m.name)))bakeStaticMeshLOD(m);
   if(m.isInstancedMesh&&/Unified static tree|Individual leaves on small branch sprays/.test(m.name))bakeStaticLeafLOD(m);
   if(!m.isInstancedMesh||Object.values(m.geometry.attributes).some(a=>a.isInstancedBufferAttribute))return;
   if(/photographic-trackside|photographic-shade|bank grass|straw colonies|rush stands|verge-daisies|rut-gravel|bank pebbles/.test(m.name)){
    bakeStaticSelection(m,{radius:/daisies|gravel|pebbles/.test(m.name)?18:34,step:4,padding:1.2});
   }
  });yield 'freeze-selection';
  complete=true;return {group,powerPacket,colliders,pickups,wheatBuckets,softVolumes:[...nature.softVolumes,...(barn?.softVolumes||[])],field:f,level,quality};
 }finally{if(!complete)disposeChunk({group})}
}
// Offline validation can construct synchronously; gameplay advances one phase per frame.
export function makeChunk(...args){const task=createChunkTask(...args);let step;do{step=task.next()}while(!step.done);return step.value}
const isShared=r=>isSharedExitTexture(r)||isSharedAlmondResource(r)||isSharedVergeResource(r)||isSharedCompoundResource(r)||isSharedReferenceBarnResource(r)||isSharedLandmarkTexture(r)||isSharedMeadowResource(r)||isSharedPhotoFarmResource(r)||isSharedWheatResource(r)||isSharedNatureResource(r)||isSharedBuildingResource(r)||isSharedYardPropResource(r)||isSharedRuralTexture(r)||isSharedLakeResource(r)||isSharedGroundResource(r);
export const isSharedModelResource=r=>isSharedAlmondResource(r)||isShared(r)||[box,cylinder,glass,woodTex,brickTex,roofTex,...Object.values(materials)].includes(r);
export function disposeChunk(chunk){if(chunk.disposePacketResources){chunk.disposePacketResources();return}const disposed=new Set();chunk.group.traverse(o=>{
 if(o.isInstancedMesh)o.dispose();
 if(o.geometry&&!disposed.has(o.geometry)&&!isShared(o.geometry)&&![box,cylinder].includes(o.geometry)){disposed.add(o.geometry);o.geometry.dispose()}
 if(o.material&&!disposed.has(o.material)&&!isShared(o.material)&&!Object.values(materials).includes(o.material)&&o.material!==glass){disposed.add(o.material);o.material.userData.ownedParcelTexture?.dispose();o.material.staticTextures?.forEach(t=>t.dispose());o.material.dispose()}
});}
