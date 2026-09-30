import fs from 'node:fs';
import {createLensWater} from '../../dist/lens-water.js?v=61';
import {passVertex,fusedFragment} from '../../dist/water-pipeline.js?v=61';
const lens=createLensWater({}, {rng:()=>.376});let seed=61;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};lens.physics.rng=rng;
for(let i=0;i<150;i++){if(i%12===0)lens.spray(.9);lens.update(1/60,{enabled:true,rain:0,humidity:.92,sheltered:true,hasWater:false,cameraHeight:1.77,level:-10,aspect:1.5,pitch:-.6,roll:0,accelX:0,waterCrossing:{submerged:false,crossing:0}});}
const t=lens.prepareField();const path=process.argv[2];fs.mkdirSync(path,{recursive:true});fs.writeFileSync(path+'/lens.bin',Buffer.from(t.image.data));fs.writeFileSync(path+'/optics.json',JSON.stringify({vertex:'#version 300 es\n'+passVertex,fragment:'#version 300 es\n'+fusedFragment,width:t.image.width,height:t.image.height,weight:lens.wetWeight}));console.log({droplets:lens.physics.drops?.length,field:[t.image.width,t.image.height],weight:lens.wetWeight});
