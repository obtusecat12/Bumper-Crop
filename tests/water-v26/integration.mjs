import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {field,stringSeed,surfaceHeight,pondShoreDistance} from '../../dist/world.js?v=27';
import {CameraWaterTracker} from '../../dist/lens-physics.js?v=27';
const directory=new URL('../../dist/',import.meta.url),report={};
const baseline=JSON.parse(fs.readFileSync(new URL('./baseline.json',import.meta.url)));
for(const [name,hash] of Object.entries(baseline)){
 const source=fs.readFileSync(new URL(name+'.js',directory),'utf8').replace(/\?v=\d+/g,'?v=VERSION');
 assert.equal(createHash('sha256').update(source).digest('hex'),hash,`${name}: world/UI/VHS changed`);
}
report.unchanged=Object.keys(baseline);
const missing=[];
for(const name of fs.readdirSync(directory).filter(x=>x.endsWith('.js'))){
 const source=fs.readFileSync(new URL(name,directory),'utf8');
 for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)){
  if(!fs.existsSync(new URL(match[1].split('?')[0],new URL(name,directory))))missing.push([name,match[1]]);
 }
}
assert.deepEqual(missing,[]);report.relativeImports='resolved';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),f=field(-2n,0n,seed,false);
assert.equal(f.type,'pond');
const camera=new CameraWaterTracker(),eye=surfaceHeight(25,32,f)+1.77;
assert(pondShoreDistance(25,32,f)<0);assert(eye<f.lakeY);
camera.update({cameraHeight:f.lakeY+.5,hasWater:true,level:f.lakeY});
assert.equal(camera.update({cameraHeight:eye,hasWater:true,level:f.lakeY}).crossing,1);
assert.equal(camera.update({cameraHeight:f.lakeY+.3,hasWater:true,level:f.lakeY}).crossing,-1);
report.actualLakeCrossing={standingEye:eye,surface:f.lakeY,entry:true,emergence:true};
const main=fs.readFileSync(new URL('main.js',directory),'utf8');
assert(!main.includes('Math.max(floor,f.lakeY-.62)'));
assert(main.includes('waterRipples.attach(c.group)')&&main.includes('waterRipples.render()'));
assert(main.includes('priorLensSubmersion===false')&&main.includes('camera.position.y>wf.lakeY-.06'));
const display=fs.readFileSync(new URL('display-filter.js',directory),'utf8');
assert(display.indexOf('renderer.render(scene,view)')<display.indexOf('lensEffect?.render(width,height)'));
report.cameraAndEffects='camera-plane crossing, submerged stride suppression, shared final filter';
console.log(JSON.stringify(report,null,2));
