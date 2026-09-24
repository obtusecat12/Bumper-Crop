import fs from 'node:fs';import {createLensWater} from '../../dist/lens-water.js';
let seed=82771;const rng=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
const lens=createLensWater({},{rng}),dir='/tmp/level10-v31',s={enabled:true,aspect:4/3,rain:0,humidity:.8,pitch:0,roll:0,accelX:0,waterCrossing:{submerged:false,crossing:0}},frames=[];
lens.update(0,s);s.waterCrossing={submerged:true,crossing:1};lens.update(0,s);s.waterCrossing.crossing=0;
function save(name){const wet=lens.prepareField(),b=lens.microbubbles.texture;fs.writeFileSync(dir+'/'+name+'-wet.bin',wet.image.data);fs.writeFileSync(dir+'/'+name+'-bubble.bin',b.image.data);frames.push({name,wet:lens.wetWeight,bubble:lens.microbubbles.weight,age:lens.washAge,wash:lens.washWeight,submerged:lens.submerged,wetSize:[wet.image.width,wet.image.height],bubbleSize:[b.image.width,b.image.height]});}
let t=0;for(const target of [.12,.60,1.8,4.]){while(t+1e-6<target){const d=Math.min(1/60,target-t);lens.update(d,s);t+=d;}save('entry-'+target);}
s.waterCrossing={submerged:false,crossing:-1};lens.update(0,s);s.waterCrossing.crossing=0;t=0;
for(const target of [.15,.8,1.6,3.5,6.,7.6]){while(t+1e-6<target){const d=Math.min(1/60,target-t);lens.update(d,s);t+=d;}save('exit-'+target);}
fs.writeFileSync(dir+'/optics.json',JSON.stringify(frames));lens.dispose();console.log('Exported entry/exit fields');
