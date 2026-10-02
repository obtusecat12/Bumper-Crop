import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as T from '../../../dist/vendor/three.module.min.js';
import {createPdaRelics, PDA_GENERATED_KEY_UVS} from '../../../dist/pda-relics-v71.js';

const tiny=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);tiny.needsUpdate=true;
const materials=Object.fromEntries(['pdaBlack','rubber','steel','dark','screen','glass','keyboard','keyLegends'].map(key=>[key,
 new T.MeshStandardMaterial({name:key,map:tiny,normalMap:tiny,roughnessMap:tiny,roughness:.65})]));
const result=createPdaRelics(T,{materials});
const {object,charger,stats,craft}=result;
assert(stats.triangles<=9000);assert(stats.drawCalls<=10);
assert.equal(stats.triangles,8716);assert.equal(stats.drawCalls,10);
const observations=[];
for(const root of[object,charger])root.traverse(mesh=>{
 if(!mesh.isMesh)return;
 const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 assert(p&&n&&uv,mesh.name+' position, normal and UV attributes');
 assert.equal(p.count,n.count);assert.equal(p.count,uv.count);assert.equal(p.count%3,0);
 for(const attr of[p,n,uv])for(const v of attr.array)assert(Number.isFinite(v),mesh.name+' finite geometry');
 for(let i=0;i<n.count;i++)assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<2e-5,mesh.name+' unit normals');
 assert(mesh.material.map&&mesh.material.normalMap&&mesh.material.roughnessMap,mesh.name+' retains owner PBR maps');
 assert(Object.values(materials).includes(mesh.material),mesh.name+' supplied material identity');
 assert(mesh.castShadow&&mesh.receiveShadow);
 observations.push({name:mesh.name,triangles:p.count/3,uvRange:[Math.min(...uv.array),Math.max(...uv.array)]});
});
const letterKeys=craft[0].keys.filter(k=>/^[A-Z]$/.test(k.symbol));
assert.equal(letterKeys.length,26);assert.equal(new Set(letterKeys.map(k=>k.symbol)).size,26);
assert.equal(craft[0].physicalKeys,37);assert(craft[0].keys.some(k=>k.symbol==='space'&&k.width>.02));
for(const [symbol,uv]of Object.entries(PDA_GENERATED_KEY_UVS)){
 assert.equal(uv.length,4);uv.forEach(v=>assert(v>=0&&v<=1,symbol+' atlas crop bounds'));
 assert(uv[0]<uv[2]&&uv[1]<uv[3]);
}
object.updateMatrixWorld(true);
const raycaster=new T.Raycaster();
// Probe through actual removed wall patches, avoiding their visible contact tongues.
raycaster.set(new T.Vector3(-.060,-.0062,.002),new T.Vector3(1,0,0));
const usb=raycaster.intersectObject(object,true)[0];assert(usb);assert(usb.point.x>-.0351,'Mini-USB wall is recessed, not a front decal');
raycaster.set(new T.Vector3(.060,0,0),new T.Vector3(-1,0,0));
const stylus=raycaster.intersectObject(object,true)[0];assert(stylus);assert(stylus.point.x<.036,'Stylus side channel is recessed');
const upright=new T.Box3().setFromObject(object),chargerBounds=new T.Box3().setFromObject(charger);
assert(Math.abs(upright.min.z+.0137)<1e-7);assert(chargerBounds.min.y>=-1e-7);
assert(chargerBounds.max.y<.026);assert(craft[1].cables[0].minimumY>=.00019);
object.rotation.set(-Math.PI/2,0,-.38);object.updateMatrixWorld(true);
const laid=new T.Box3().setFromObject(object);object.position.y=-laid.min.y;object.updateMatrixWorld(true);
const grounded=new T.Box3().setFromObject(object);assert(Math.abs(grounded.min.y)<1e-7);
const report={pass:true,stats,physicalQwertyLetters:26,physicalKeys:37,finitePositionsNormalsUVs:true,ownerMapsRetained:true,
 miniUSBProbeX:usb.point.x,stylusRecessProbeX:stylus.point.x,chargerMinimumY:chargerBounds.min.y,
 cableMinimumY:craft[1].cables[0].minimumY,layGroundedMinimumY:grounded.min.y,
 uprightBounds:{min:upright.min.toArray(),max:upright.max.toArray()},chargerBounds:{min:chargerBounds.min.toArray(),max:chargerBounds.max.toArray()},meshes:observations};
await writeFile(new URL('./geometry-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
