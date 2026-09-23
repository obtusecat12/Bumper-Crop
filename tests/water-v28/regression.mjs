import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {field,stringSeed,surfaceHeight} from '../../dist/world.js';
const root=new URL('../../',import.meta.url),dist=new URL('dist/',root),baseline=JSON.parse(fs.readFileSync(new URL('../water-v26/baseline.json',import.meta.url)));
const unchanged=[];for(const [name,hash]of Object.entries(baseline)){if(name==='world'||name==='display-filter')continue;const src=fs.readFileSync(new URL(name+'.js',dist),'utf8').replace(/\?v=\d+/g,'?v=VERSION');assert.equal(createHash('sha256').update(src).digest('hex'),hash,name);unchanged.push(name);}
const original=execFileSync('git',['show','c6cfef48b9933f4596ba92e5ffb1d78784d1ae3f:dist/world.js'],{cwd:root,encoding:'utf8'}).replace(/from '(\.\/[^']+)'/g,(_,p)=>'from '+JSON.stringify(new URL(p,dist).href));
const old=await import('data:text/javascript;base64,'+Buffer.from(original).toString('base64'));
const seed=stringSeed('CHLORINE / ABUNDANCE / 10');let count=0;
for(let z=-8;z<8;z++)for(let x=-8;x<8;x++){const a=field(BigInt(x),BigInt(z),seed),b=old.field(BigInt(x),BigInt(z),seed);assert.deepEqual(a,b,'fixed world placement retained');if(a.type!=='pond')for(const [u,v]of [[2,8],[32,31],[63,61]])assert(Math.abs(surfaceHeight(u,v,a)-old.surfaceHeight(u,v,b))<1e-10);count++;}
for(const name of fs.readdirSync(dist).filter(x=>x.endsWith('.js'))){const s=fs.readFileSync(new URL(name,dist),'utf8');for(const m of s.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g))assert(fs.existsSync(new URL(m[1].split('?')[0],new URL(name,dist))),name+' missing '+m[1]);}
console.log(JSON.stringify({pass:true,unchanged,fixedWorldFields:count,nonLakeTerrain:'identical',imports:'resolved'}));
