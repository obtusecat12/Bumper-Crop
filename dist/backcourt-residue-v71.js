import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {BACKCOURT_PLAN as P,backcourtWorld} from './backcourt-layout-v70.js';
import {createCornerMaterials} from './backcourt-materials-v71.js';
import {createPdaRelics} from './pda-relics-v71.js';
import {createClippingRelics} from './clipping-relics-v71.js';
import {almondEnvironment} from './almond-water-assets.js?v=60';

export const CORNER_PLAN=Object.freeze({
 pda:{x:35.25,z:20.30,yaw:-.38},charger:{x:35.43,z:20.32,yaw:.32},
 fountain:{x:30.20,z:19.10,y:-.45,yaw:-.12},
 monitor:{x:40.20,z:18.40,y:1.06,yaw:-.15},
 chair:{x:28.60,z:19.45,y:-.35,yaw:.21},
 wallZ:P.wallZ,groundY:P.groundY,
});

export function createCornerResidue(){
 const object=new T.Group();object.name='Palm Court / interrupted service corner V71';
 object.position.set(P.origin.x,P.groundY,P.origin.z);object.rotation.y=P.angle;
 const materials=createCornerMaterials(),colliders=[],craft=[];
 for(const m of new Set(Object.values(materials))){m.envMap=almondEnvironment.value;m.envMapIntensity=.45;}
 const pda=createPdaRelics(T,{materials}),relics=createClippingRelics(T,{materials});
 const plan=CORNER_PLAN;
 // Device is face up, its back physically rests on the paving. Its separate
 // charger and cord stay in Y-up ground space; no rotated floating cable.
 pda.object.rotation.set(-Math.PI/2,0,plan.pda.yaw);
 const groundPose=new T.Box3().setFromObject(pda.object);
 pda.object.position.set(plan.pda.x,-groundPose.min.y,plan.pda.z);
 object.add(pda.object);
 pda.charger.rotation.y=plan.charger.yaw;pda.charger.position.set(plan.charger.x,0,plan.charger.z);object.add(pda.charger);
 for(const name of ['fountain','monitor','chair']){
  const o=relics[name],q=plan[name];o.position.set(q.x,q.y,q.z);o.rotation.y=q.yaw;
  o.userData.intentionalClipping=true;o.userData.clipSurface=name==='monitor'?'existing rear wall':'existing stone ground';object.add(o);
 }
 craft.push(...(pda.craft||[]),...(relics.craft||[]));
 // Only the visible footprint blocks walking; buried portions add no
 // invisible obstacle. The PDA remains passable, like the dropped drinks.
 for(const [name,w,d]of [['fountain',.56,.48],['chair',.52,.52],['monitor',.46,.24]]){
  const q=plan[name],p=backcourtWorld(q.x,q.z+(name==='monitor'?.11:0));colliders.push({kind:'obb',x:p.x,z:p.z,w,d,ry:P.angle+q.yaw});
 }
 const additions=new Map(),pose=new T.Object3D();
 function batch(g,key,x=0,y=0,z=0,rx=0,ry=0,rz=0){const a=g.index?g.toNonIndexed():g.clone();pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.updateMatrix();a.applyMatrix4(pose.matrix);if(!a.attributes.uv1)a.setAttribute('uv1',a.attributes.uv.clone());if(!additions.has(key))additions.set(key,[]);additions.get(key).push(a);g.dispose();}
 // A continuous 45 mm cove rounds the architecture-to-ground junction.
 // Geometry is an actual quarter arc with a horizontal ground tangent.
 const positions=[],uv=[],ix=[],r=.045,n=7;
 for(let side=0;side<2;side++)for(let j=0;j<=n;j++){const a=j/n*Math.PI/2;positions.push(side?41.86:25.64,r*(1-Math.sin(a)),P.wallZ+r*(1-Math.cos(a)));uv.push(side?11.18:0,j/n*.08);}
 for(let j=0;j<n;j++){const a=j,b=j+1,c=n+1+j,d=c+1;ix.push(a,b,c,b,d,c);}
 const cove=new T.BufferGeometry();cove.setAttribute('position',new T.Float32BufferAttribute(positions,3));cove.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cove.setIndex(ix);cove.computeVertexNormals();batch(cove,'stone');
 const grime=[ [26.60,.76,1.52,0],[29.03,.52,1.04,1],[32.05,.54,1.08,0],[35.75,.70,1.40,1],[39.72,.62,1.24,0],[41.14,.48,.96,1] ];
 for(const[x,h,w,flip]of grime){const g=new T.PlaneGeometry(w,h);if(flip){const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setX(i,1-u.getX(i));}batch(g,'wall-foot',x,h*.42,P.wallZ);}
 batch(new T.PlaneGeometry(.48,.96),'wall-dust',25.69,.48,P.wallZ);
 batch(new T.PlaneGeometry(.22,.44),'wall-dust',40.2,.82,P.wallZ);
 for(const[key,geos]of additions){const g=mergeGeometries(geos,false);geos.forEach(a=>a.dispose());const m=new T.Mesh(g,materials[key]);m.name='V71 corner / '+key;m.castShadow=false;m.receiveShadow=true;m.userData.exitStatic=true;object.add(m);}
 // Merge all static craft by material after final world-local placement.
 // Props retain semantic transform/craft records, but do not cost a draw per
 // button, vent, screw or chair leg. Neither existing V70 objects nor physics
 // buffers are touched.
 object.updateMatrixWorld(true);const merged=new Map(),inv=object.matrixWorld.clone().invert();let triangles=0,modeledParts=0;
 object.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!g.attributes.uv1)g.setAttribute('uv1',g.attributes.uv.clone());const mat=o.material;if(!merged.has(mat))merged.set(mat,[]);merged.get(mat).push(g);triangles+=g.attributes.position.count/3;modeledParts++;});
 object.traverse(o=>o.geometry?.dispose());object.clear();
 for(const[mat,list]of merged){const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());geometry.computeBoundingSphere();geometry.computeBoundingBox();const mesh=new T.Mesh(geometry,mat);mesh.name='V71 static / '+mat.name;mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;mesh.userData.exitStatic=true;mesh.updateMatrix();mesh.matrixAutoUpdate=false;object.add(mesh);}
 // Small unshadowed emitters: self emission alone does not illuminate
 // adjacent paving in the raster renderer. No transmission/cube captures.
 const vendLight=new T.PointLight(0xa8cace,.65,2.5,2);vendLight.name='V71 existing vending artwork spill';vendLight.position.set(34.5,.82,19.72);vendLight.castShadow=false;
 const pdaLight=new T.PointLight(0x83ced0,.017,.52,2);pdaLight.name='V71 PDA screen spill';pdaLight.position.set(plan.pda.x,.038,plan.pda.z-.020);pdaLight.castShadow=false;
 object.add(vendLight,pdaLight);
 object.userData.cityStats={draws:merged.size,triangles,parts:pda.stats.parts+relics.stats.parts+grime.length+3,sourceBatches:modeledParts};
 object.userData.cornerPlan=plan;object.userData.intentionalClipping=['fountain','monitor','chair'];object.userData.cornerCraft=craft;
 return {object,colliders,materials,craft,plan,lights:[vendLight,pdaLight],dispose(){for(const m of new Set(Object.values(materials)))m.dispose();}};
}
