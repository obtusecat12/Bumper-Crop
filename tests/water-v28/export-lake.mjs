import fs from 'node:fs';import * as T from '../../dist/vendor/three.module.min.js';
import {field,stringSeed,surfaceHeight} from '../../dist/world.js';
import {waterGeometry} from '../../dist/lake.js';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),water=[],ground=[],center=field(-2n,0n,seed,false);
for(let z=-1;z<=1;z++)for(let x=-3;x<=-1;x++){
 const f=field(BigInt(x),BigInt(z),seed,false),ox=x*64,oz=z*64;
 for(let j=0;j<64;j++)for(let i=0;i<64;i++){
  const q=[[i,j],[i+1,j],[i,j+1],[i+1,j],[i+1,j+1],[i,j+1]];
  for(const [a,b]of q)ground.push(a+ox,surfaceHeight(a,b,f),b+oz);
 }
 if(f.type==='pond'){let g=waterGeometry(f,f.lakeY);if(g.index)g=g.toNonIndexed();const p=g.attributes.position.array,c=g.attributes.lakeCoord.array,t=g.attributes.facetTone.array;
  for(let i=0;i<p.length/3;i++)water.push(p[i*3]+ox,p[i*3+1],p[i*3+2]+oz,c[i*2],c[i*2+1],t[i]);g.dispose();}
}
const cameras=[];for(const [label,pos,look]of [['shore',[-35,3,69],[-95,-.5,31]],['surface',[-86,1.1,60],[-112,0,28]],['submerged',[-104,-2.4,28],[-104,2,22]]]){
 const c=new T.PerspectiveCamera(72,4/3,.075,480);c.position.fromArray(pos);c.lookAt(...look);c.updateMatrixWorld();cameras.push({label,eye:pos,projection:c.projectionMatrix.elements,view:c.matrixWorldInverse.elements,world:c.matrixWorld.elements,inverseProjection:c.projectionMatrixInverse.elements});}
const dir=(process.env.V28_FIXTURE_DIR||'/tmp/level10-v28')+'/';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'ground.bin',Buffer.from(new Float32Array(ground).buffer));fs.writeFileSync(dir+'water.bin',Buffer.from(new Float32Array(water).buffer));fs.writeFileSync(dir+'lake-fixture.json',JSON.stringify({level:center.lakeY,center:[-103,32],cameras}));
console.log({groundTriangles:ground.length/9,waterTriangles:water.length/18,level:center.lakeY});
