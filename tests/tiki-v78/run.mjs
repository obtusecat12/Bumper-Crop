import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import * as T from '../../dist/vendor/three.module.min.js';
import {TikiKit} from '../../dist/tiki-geometry-v76.js';
import {TIKI_DETAILS,tikiBlocked,resolveTiki} from '../../dist/tiki-plan-v78.js';
import {cocktailCounter,idolCorner,shelfBottles} from '../../dist/tiki-props-v78.js';
import {canoeBuffet} from '../../dist/tiki-buffet-v78.js';
import {moaiPond} from '../../dist/tiki-pond-v78.js';
for(const [name,shot]of Object.entries(TIKI_DETAILS.shots))assert(!tikiBlocked(shot.p[0],shot.p[2]),name+' camera must occupy walkable space');
// Both sides of the canoe remain reachable; the pond has a real viewing strip
// in front of its rim, rather than a camera placed inside a booth partition.
const routes=[[[0,5.45],[1.3,4.7],[1.5,-2.96],[2.48,-3.67]],[[0,5.45],[-2.7,4.7],[-2.7,-3.15],[-4.63,-3.15]],[[0,5.45],[1.1,4.95],[2.6,5.60]],[[0,5.45],[-1.5,4.0],[-1.52,-.55]]];
for(const route of routes)for(let j=1;j<route.length;j++){const a=route[j-1],b=route[j],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.06);for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;assert(!tikiBlocked(x,z),'Obstructed reference access '+[x,z]);}}
for(const q of[TIKI_DETAILS.pond,TIKI_DETAILS.canoe,TIKI_DETAILS.cocktail])assert(tikiBlocked(q.x,q.z));
const mats=new Proxy({},{get(o,key){return o[key]??(o[key]=new T.MeshStandardMaterial());}}),k=new TikiKit(mats);for(const f of[cocktailCounter,idolCorner,shelfBottles,canoeBuffet,moaiPond])f(k);const group=k.finish('V78 geometry verification');group.traverse(o=>{if(!o.geometry)return;for(const a of Object.values(o.geometry.attributes))assert([...a.array].every(Number.isFinite),o.name+' invalid vertex/UV');assert(o.geometry.boundingSphere.radius<20);});assert(group.userData.cityStats.triangles<190000);assert(group.userData.cityStats.draws<85,JSON.stringify(group.userData.cityStats));
const assets=JSON.parse(await readFile('art-source/tiki-v78/runtime-manifest.json'));assert.equal(assets.length,24);for(const a of assets)assert((await stat('dist/'+a.path)).size>1000,'Incomplete asset '+a.path);
const main=await readFile('dist/main.js','utf8');assert(main.includes("'./tiki-room-v78.js'"));assert(!main.includes('window.v78QA'));assert(main.includes('tikiTransition'));console.log('PASS: all five cameras walkable; four continuous routes; pond/canoe/bar collision; finite batched geometry; 24 new generated maps; local-only QA; existing transition retained.');console.log(group.userData.cityStats);
