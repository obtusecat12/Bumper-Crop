import {roadGrassNoise} from './road-surface.js?v=40';
import * as T from './vendor/three.module.min.js';
import {field,stringSeed,random,cropSample,wheatAllowed,surfaceHeight,periodOrigin} from './world.js?v=40';
import {prepareStaticSelection} from './static-selection.js?v=40';
export const CEREAL_CELL=40,CEREAL_RADIUS=35,CEREAL_LIMIT=25000;
export const floorDiv=(a,b)=>a/b-(a%b<0n?1n:0n);
const fields=new Map();
function cachedField(x,z,seed){const key=`${seed}:${x},${z}`;let f=fields.get(key);if(!f){f=field(x,z,seed);fields.set(key,f);if(fields.size>36)fields.delete(fields.keys().next().value);}return f;}
export function generateCerealCell(cx,cz,seed){
 const start=performance.now(),rng=random(stringSeed(`${seed}:cereal39:${cx},${cz}`)),matrix=[],colors=[],kinds=[],pose=new T.Object3D(),crop={};
 const wx=cx*40n,wz=cz*40n,fx=floorDiv(wx,64n),fz=floorDiv(wz,64n),rx=Number(wx-fx*64n),rz=Number(wz-fz*64n);
 const spacing=.40,side=100; // one slender plant per crossed card; fixed instance budget
 for(let iz=0;iz<side;iz++)for(let ix=0;ix<side;ix++){
  const x=(ix+.16+rng()*.68)*spacing,z=(iz+.16+rng()*.68)*spacing;
  const tx=rx+x,tz=rz+z,dx=Math.floor(tx/64),dz=Math.floor(tz/64),f=cachedField(fx+BigInt(dx),fz+BigInt(dz),seed),lx=tx-dx*64,lz=tz-dz*64;
  const yaw=rng()*Math.PI*2,wx=lx+periodOrigin(f.x),wz=lz+periodOrigin(f.z);
  const fertility=roadGrassNoise(wx*.035,wz*.035),lodge=roadGrassNoise(wx*.095+77,wz*.095-42);
  const gaussian=(rng()+rng()+rng()+rng()-2)*.15;
  const height=.95*Math.max(.8,Math.min(1.2,1+(fertility-.5)*.32+gaussian));
  const tiltX=(rng()-.5)*8*Math.PI/180,tiltZ=(rng()-.5)*8*Math.PI/180,tone=.86+rng()*.08;
  if(!wheatAllowed(lx,lz,f))continue;cropSample(lx,lz,f,crop);const kind=crop.crop;
  if(kind===2&&(ix+iz)%2)continue;
  pose.position.set(x,surfaceHeight(lx,lz,f)-.015,z);
  pose.rotation.set(tiltX+(lodge>.69?.22:0),yaw,tiltZ,'YXZ');
  const variant=lodge>.69?3:Math.min(2,Math.floor(rng()*3)),mirror=rng()<.5?1:0;
  const width=kind===2?.25:.18;pose.scale.set(width,kind===2?.18:height,width);pose.updateMatrix();
  const hue=(rng()-.5)*.12,maturity=(fertility-.5)*.12;
  matrix.push(...pose.matrix.elements);colors.push(tone*(1+hue),tone*(.96-hue*.45+maturity),tone*(.83-hue*.4));kinds.push(kind*8+variant*2+mirror);
 }
 const matrices=new Float32Array(matrix),tints=new Float32Array(colors),species=new Uint8Array(kinds);
 // 4 m observer cells, a 1.05 m allowance for width + tilt + maximum wind.
 // Every submitted vertex is within 35 m even at an observer-cell corner.
 const baked=prepareStaticSelection(matrices,tints,{size:40,step:4,radius:35,padding:1.05,kinds:species});
 return {cx,cz,matrices,colors:tints,kinds:species,baked,generateMs:performance.now()-start};
}
