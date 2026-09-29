import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const {AD_CATALOG,adFor,AD_SIZES}=await import('../../dist/advertising-assets.js?v=57'),{UrbanBatch}=await import('../../dist/urban-batch.js?v=57'),{createUrbanMaterials}=await import('../../dist/urban-materials.js?v=57'),{addStreetwallBuilding}=await import('../../dist/urban-streetwall.js?v=57');
const hashes=new Set(),layers=new Map();assert.equal(AD_CATALOG.length,120);
for(const a of AD_CATALOG){const bytes=fs.readFileSync('art-source/advertising-v55/'+a.id+'.png'),hash=createHash('sha256').update(bytes).digest('hex');assert(!hashes.has(hash),'duplicate original '+a.id);hashes.add(hash);const im=await loadImage('dist/textures/advertising-v55/'+a.file);assert(im.width>=384&&im.height>=200,a.id+' undersized');const key=a.textureGroup+':'+a.layer;assert(!layers.has(key));layers.set(key,a.id);}
const coverage=new Set();for(const kind of new Set(AD_CATALOG.map(a=>a.kind)))for(let s=0;s<4000;s++)coverage.add(adFor(s*3,kind).id);assert.equal(coverage.size,119,'all random ads must be reachable even with conditional placement seeds');
const overlap=(a,b,padding=false)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+(padding?a.pad+b.pad:0)-1e-8&&Math.abs(a.y-b.y)<(a.h+b.h)/2+(padding?a.pad+b.pad:0)-1e-8;
const mats=createUrbanMaterials();let count=0,ac=0,blades=0;
for(const type of['brick_walkup','brutalist_slab','international_tower','strip_mall','parking_garage','office_podium'])for(let seed=1;seed<=36;seed++){
 const b=new UrbanBatch(mats),spec={w:12+(seed%5)*3,d:13+(seed%4)*3,floors:type==='strip_mall'?2:4+seed%7,type,seed};const report=addStreetwallBuilding(b,spec).facade;
 for(const q of report.front){if(['air-conditioner','blade-sign'].includes(q.kind)){for(const other of report.front)if(other!==q)assert(!overlap(q,other,true),`${q.kind} intersects ${other.kind}, ${type}, seed ${seed}`);q.kind==='air-conditioner'?ac++:blades++;}if(q.kind==='fascia')for(const other of report.front)if(['shop-opening','canopy-anchor','floor-beam'].includes(other.kind))assert(!overlap(q,other),`fascia intersects ${other.kind}, seed ${seed}`);}
 const root=b.finish('QA facade');root.traverse(o=>o.geometry?.dispose());count++;
}
assert(ac>20,'AC placement must remain populated');assert(blades>15,'projecting signs must remain populated');
const bytes=Object.entries(AD_SIZES).reduce((n,[group,[w,h]])=>n+w*h*4*AD_CATALOG.filter(a=>a.textureGroup===group).length,0)+768*2304*4;
const report={originalAds:hashes.size,ordinaryAdCoverage:coverage.size,fixedHero:'ad-120',facadesChecked:count,clearAC:ac,clearBlades:blades,advertisingGPUBaseMiB:+(bytes/1024**2).toFixed(1)};console.log(report);fs.writeFileSync(new URL('./results/facades-ads.json',import.meta.url),JSON.stringify(report,null,2));
