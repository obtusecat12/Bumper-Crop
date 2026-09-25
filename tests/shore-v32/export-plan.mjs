import fs from 'node:fs';
import {field,stringSeed,surfaceHeight} from '../../dist/world.js';
import {pondMetrics,pondContours,pondBounds,pondHabitat,lakeCacheStats} from '../../dist/lake-shape.js';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),f=field(-2n,0n,seed,false);const lakes=[{...f,cx:0,cz:0},...[2391,8132,19277].map((s,i)=>({...f,cx:0,cz:0,lakeSeed:s,rx:58+i*11,rz:42+i*7,angle:i*.42}))];
fs.mkdirSync('/tmp/shore-v32',{recursive:true});let records=[];
for(let j=0;j<lakes.length;j++){const f=lakes[j],bounds=pondBounds(f),w=400,h=320,span=240,step=span/w;const data=new Float32Array(w*h*5),m={};const start=performance.now();
 for(let z=0;z<h;z++)for(let x=0;x<w;x++){const xx=(x-w/2)*step,zz=(z-h/2)*step;pondHabitat(xx,zz,f,m);const i=(z*w+x)*5;data.set([m.metres,m.relativeHeight,m.rock,m.beach,m.wetland],i)}
 const file=`lake-${j}.bin`;fs.writeFileSync('/tmp/shore-v32/'+file,Buffer.from(data.buffer));const loops=pondContours(f);records.push({j,file,w,h,span,loops,bounds,ms:performance.now()-start});}
fs.writeFileSync('/tmp/shore-v32/plans.json',JSON.stringify(records));console.log(records.map(({j,bounds,ms,loops})=>({j,bounds,ms,loops:loops.length})),lakeCacheStats());
