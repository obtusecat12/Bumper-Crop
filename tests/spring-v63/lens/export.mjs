// Export production lens fields/shaders; generated buffers stay in the output folder.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const dist=path.join(root,'dist');
const out=path.resolve(process.argv[2]||path.join(os.tmpdir(),'level10-lens-v63'));
const baselineCommit='77f1c2c96b975812162316f52c2f755937e94b7f';
fs.mkdirSync(out,{recursive:true});
const names=['lens-physics.js','lens-water.js','water-pipeline.js'];
const oldSources=Object.fromEntries(names.map(name=>[name,execFileSync('git',['show',`${baselineCommit}:dist/${name}`],{cwd:root,encoding:'utf8'})]));
const dataURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const baselinePhysics=dataURL(oldSources['lens-physics.js']);
const beforeURL=name=>dataURL(oldSources[name].replace(/from '(\.\/[^']+)'/g,(_,relative)=>{
 const dependency=relative.split('?')[0];
 const url=dependency==='./lens-physics.js'?baselinePhysics:new URL(relative,pathToFileURL(dist+'/')).href;
 return `from '${url}'`;
}));
const before=await import(beforeURL('lens-water.js'));
const after=await import(pathToFileURL(path.join(dist,'lens-water.js')));
const pipeBefore=await import(beforeURL('water-pipeline.js'));
const pipeAfter=await import(pathToFileURL(path.join(dist,'water-pipeline.js')));
const shader=p=>({vertex:'#version 300 es\n'+p.passVertex,fused:'#version 300 es\n'+p.fusedFragment,resolve:'#version 300 es\n'+p.resolveFragment});
const hash=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const cases=[];
for(const [name,module] of [['before',before],['after',after]]){
 const lens=module.createLensWater({}, {rng:hash(723)});lens.physics.setAspect(2);
 const d=lens.physics.add(.42,.47,4.5,0,.14);d.tailX=.42;d.tailY=.12;
 const e=lens.physics.add(.67,.69,3.1,0,.08);e.tailX=.665;e.tailY=.34;
 lens.physics.deposit(.76,.3,.036,.4,5);
 const texture=lens.prepareField();
 fs.writeFileSync(path.join(out,name+'.bin'),texture.image.data);
 cases.push({name,width:texture.image.width,height:texture.image.height,fieldWidth:lens.physics.fieldWidth,fieldHeight:lens.physics.fieldHeight});
 lens.dispose();
}
assert.deepEqual(cases.map(c=>[c.width,c.height]),[[256,128],[1024,512]]);
const baseline=before.createLensWater({}, {rng:hash(43)}),patched=after.createLensWater({}, {rng:hash(43)});
const state={enabled:true,aspect:2,rain:0,humidity:.58,hasWater:false,sheltered:true,waterCrossing:{submerged:false,crossing:0}};
for(const lens of [baseline,patched]){lens.update(1/60,state);lens.showerContact();}
for(let i=0;i<480;i++){
 baseline.update(1/60,state);patched.update(1/60,state);
 if(i%10===0){baseline.prepareField();patched.prepareField();}
 assert.equal(baseline.physics.mass(),patched.physics.mass());
 assert.equal(baseline.wetWeight,patched.wetWeight);assert.equal(baseline.washWeight,patched.washWeight);
 assert.deepEqual(baseline.physics.drops,patched.physics.drops);assert.deepEqual(baseline.physics.film,patched.physics.film);
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));let maxHeightError=0;
const aspects=[.4,.75,1,4/3,2,3.1,4];
for(const aspect of aspects){
 const physics=new after.LensDropletPhysics();physics.setAspect(aspect);const sw=physics.fieldWidth,sh=physics.fieldHeight;
 for(let i=0;i<physics.film.length;i++){physics.film[i]=i%37===0?(i%7)*.003:0;physics.filmTotal+=physics.film[i];}
 const w=aspect>=1?1024:Math.max(256,Math.round(1024*aspect)),h=aspect>=1?Math.max(256,Math.round(1024/aspect)):1024;
 const field=physics.buildOpticalField(w,h),scale=1/(physics.cellArea*520);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=clamp((x+.5)*sw/w-.5,0,sw-1),sy=clamp((y+.5)*sh/h-.5,0,sh-1);
  const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),tx=sx-x0,ty=sy-y0;
  const a=physics.film[y0*sw+x0]*(1-tx)+physics.film[y0*sw+x1]*tx,b=physics.film[y1*sw+x0]*(1-tx)+physics.film[y1*sw+x1]*tx;
  const expected=Math.max(0,Math.min(1.6,(a*(1-ty)+b*ty)*scale)-.011);
  maxHeightError=Math.max(maxHeightError,Math.abs(expected-field.heightField[y*w+x]));
 }
}
assert(maxHeightError<1e-6);
const sha=source=>createHash('sha256').update(source).digest('hex');
const report={passed:true,baselineCommit,cases,physicsIdentical480Frames:true,physicsDeltaSeconds:1/60,
 equalAtEveryFrame:['droplet records','film array','total mass','wetWeight','washWeight'],
 sparseFilm:{aspects,maxHeightError,denseBilinearReferenceTolerance:1e-6},
 sourceSha256:Object.fromEntries(names.map(name=>[name,{before:sha(oldSources[name]),after:sha(fs.readFileSync(path.join(dist,name)))}])),
 limitations:['Deterministic Node simulation/field checks; no browser rendering or gameplay FPS claim.']};
fs.writeFileSync(path.join(out,'fixture.json'),JSON.stringify({cases,old:shader(pipeBefore),next:shader(pipeAfter),physicsIdentical480Frames:true,baselineCommit},null,2));
fs.writeFileSync(path.join(out,'physics-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
