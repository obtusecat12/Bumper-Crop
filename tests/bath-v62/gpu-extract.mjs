import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from '../../dist/vendor/three.module.min.js';
import { showerShaderSources, showerComputeFragment, showerOpticsFragment } from '../../dist/bath-v62-water.js';
import { createStallKit } from '../../dist/bath-v62-stall-kit.js';
import { SHOWER_HEADS } from '../../dist/bathhouse-layout.js';
const out=new URL('./',import.meta.url);
const nozzles=[];
for(let i=0;i<4;i++){
 const kit=createStallKit(T,{},i);
 kit.group.position.set(-8.275,0,SHOWER_HEADS[i].z);
 kit.group.rotation.y=Math.PI/2;
 kit.group.updateMatrixWorld(true);
 for(const n of kit.nozzles){
  nozzles.push({position:new T.Vector3(...n.position).applyMatrix4(kit.group.matrixWorld).toArray(),direction:new T.Vector3(...n.direction).transformDirection(kit.group.matrixWorld).toArray()});
 }
}
const prefix='#version 300 es\n';
const fixture={source:'level10/dist/bath-v62-water.js',sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../dist/bath-v62-water.js',import.meta.url))).digest('hex'),nozzles,programs:{compute:{vertex:prefix+showerShaderSources.passVertex,fragment:prefix+showerComputeFragment},particles:{vertex:prefix+showerShaderSources.particleVertex,fragment:prefix+showerOpticsFragment},jets:{vertex:prefix+showerShaderSources.jetVertex,fragment:prefix+showerOpticsFragment}}};
fs.writeFileSync(new URL('fixture.json',out),JSON.stringify(fixture,null,2));
console.log(JSON.stringify({programs:Object.keys(fixture.programs),nozzles:nozzles.length,sha256:fixture.sha256}));
