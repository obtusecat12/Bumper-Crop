import * as T from './vendor/three.module.min.js';
import {field,stringSeed,random,cropSample,wheatAllowed,surfaceHeight} from './world.js?v=39';
import {prepareStaticSelection} from './static-selection.js?v=39';
export const CEREAL_CELL=40,CEREAL_RADIUS=35,CEREAL_LIMIT=25000;
export const floorDiv=(a,b)=>a/b-(a%b<0n?1n:0n);
const fields=new Map();
function cachedField(x,z,seed){const key=`${seed}:${x},${z}`;let f=fields.get(key);if(!f){f=field(x,z,seed);fields.set(key,f);if(fields.size>36)fields.delete(fields.keys().next().value);}return f;}
export function generateCerealCell(cx,cz,seed){
 const start=performance.now(),rng=random(stringSeed(`${seed}:cereal39:${cx},${cz}`)),matrix=[],colors=[],kinds=[],pose=new T.Object3D(),crop={};
 const wx=cx*40n,wz=cz*40n,fx=floorDiv(wx,64n),fz=floorDiv(wz,64n),rx=Number(wx-fx*64n),rz=Number(wz-fz*64n);
 const spacing=.50; // two crossed photographs contain fourteen distinct ears per clump
 for(let iz=0;iz<80;iz++)for(let ix=0;ix<80;ix++){
  const x=(ix+.16+rng()*.68)*spacing,z=(iz+.16+rng()*.68)*spacing;
  const tx=rx+x,tz=rz+z,dx=Math.floor(tx/64),dz=Math.floor(tz/64),f=cachedField(fx+BigInt(dx),fz+BigInt(dz),seed),lx=tx-dx*64,lz=tz-dz*64;
  const yaw=rng()*Math.PI*2,height=1+(rng()<.5?-1:1)*(.05+rng()*.10),tilt=(3+rng()*5)*Math.PI/180,lean=rng()*Math.PI*2,tone=.95+rng()*.10;
  if(!wheatAllowed(lx,lz,f))continue;cropSample(lx,lz,f,crop);const kind=crop.crop;
  if(kind===2&&(ix+iz)%2)continue;
  pose.position.set(x,surfaceHeight(lx,lz,f)-.015,z);
  pose.rotation.set(Math.cos(lean)*tilt,yaw,Math.sin(lean)*tilt,'YXZ');
  const width=.78+rng()*.10;pose.scale.set(width,kind===2?.24:height*(kind===1?1.35:1.55),width);pose.updateMatrix();
  matrix.push(...pose.matrix.elements);colors.push(tone,tone*(.97+rng()*.035),tone*(.94+rng()*.055));kinds.push(kind);
 }
 const matrices=new Float32Array(matrix),tints=new Float32Array(colors),species=new Uint8Array(kinds);
 // 4 m observer cells, a 1.05 m allowance for width + tilt + maximum wind.
 // Every submitted vertex is within 35 m even at an observer-cell corner.
 const baked=prepareStaticSelection(matrices,tints,{size:40,step:4,radius:35,padding:1.05,kinds:species});
 return {cx,cz,matrices,colors:tints,kinds:species,baked,generateMs:performance.now()-start};
}
