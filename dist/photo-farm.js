import * as T from './vendor/three.module.min.js';
import {FARM,FARM_PLACEMENTS,FARM_TREES} from './farm-layout.js?v=36';
import {makeKephartBuildings,isSharedKephartResource} from './kephart-models.js?v=36';
import {makePhotoTree,isSharedPhotoTreeResource} from './photo-trees.js?v=36';
import {clipStaticSceneToTile} from './farm-clip.js?v=36';
import {height} from './world.js?v=36';
const cache=new WeakMap();
function source(wind){
 if(cache.has(wind))return cache.get(wind);
 const group=new T.Group();group.name='Kephart Farm / photographic reconstruction';
 const buildings=makeKephartBuildings({placements:FARM_PLACEMENTS});buildings.group.position.y=FARM.y;group.add(buildings.group);
 const colliders=buildings.colliders.map(c=>({...c}));
 for(const spec of FARM_TREES){const tree=makePhotoTree({...spec,wind});tree.group.position.set(spec.x,height(FARM.x+spec.x,FARM.z+spec.z),spec.z);group.add(tree.group);for(const c of tree.colliders)colliders.push({...c,x:c.x+spec.x,z:c.z+spec.z})}
 const result={group,colliders};cache.set(wind,result);return result;
}
export function makePhotoFarmChunk(f,wind){
 if(!f.farm||f.farm.x>41||f.farm.x+64< -131||f.farm.z>86||f.farm.z+64< -156)return null;
 const original=source(wind),{group,stats}=clipStaticSceneToTile(original.group,f.farm.x,f.farm.z);
 const colliders=original.colliders.filter(c=>{const r=c.kind==='circle'?c.r:Math.hypot(c.hx,c.hz);return c.x+r>=f.farm.x&&c.x-r<=f.farm.x+64&&c.z+r>=f.farm.z&&c.z-r<=f.farm.z+64}).map(c=>({...c,x:c.x-f.farm.x,z:c.z-f.farm.z}));
 group.userData.kephart=true;return {group,colliders,stats};
}
export const isSharedPhotoFarmResource=r=>isSharedKephartResource(r)||isSharedPhotoTreeResource(r);
