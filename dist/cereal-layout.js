import {exitForField,exitCropFactor,ease} from './exit-route.js?v=56';
import {roadGrassNoise} from './road-surface.js?v=56';
import * as T from './vendor/three.module.min.js';
import {field,stringSeed,random,cropSample,wheatAllowed,surfaceHeight,periodOrigin} from './world.js?v=56';
import {prepareStaticSelection} from './static-selection.js?v=56';
export const CEREAL_CELL=40,CEREAL_RADIUS=35,CEREAL_LIMIT=25000,CEREAL_PADDING=2.2;
export const floorDiv=(a,b)=>a/b-(a%b<0n?1n:0n);
const fields=new Map();
function cachedField(x,z,seed){const key=`${seed}:${x},${z}`;let f=fields.get(key);if(!f){f=field(x,z,seed);fields.set(key,f);if(fields.size>36)fields.delete(fields.keys().next().value);}return f;}
export function generateCerealCell(cx,cz,seed){
 const start=performance.now(),rng=random(stringSeed(`${seed}:cereal41:${cx},${cz}`)),matrix=[],colors=[],kinds=[],pose=new T.Object3D(),crop={};
 const up=new T.Vector3(0,1,0),leanAxis=new T.Vector3(),yawRotation=new T.Quaternion();
 const wx=cx*40n,wz=cz*40n,fx=floorDiv(wx,64n),fz=floorDiv(wz,64n),rx=Number(wx-fx*64n),rz=Number(wz-fz*64n);
 const side=92,spacing=CEREAL_CELL/side; // multi-ear V39 tufts, 32% more roots/m² than V39
 for(let iz=0;iz<side;iz++)for(let ix=0;ix<side;ix++){
  const x=(ix+.02+rng()*.96)*spacing,z=(iz+.02+rng()*.96)*spacing;
  const tx=rx+x,tz=rz+z,dx=Math.floor(tx/64),dz=Math.floor(tz/64),f=cachedField(fx+BigInt(dx),fz+BigInt(dz),seed),lx=tx-dx*64,lz=tz-dz*64;
  const yaw=rng()*Math.PI*2,wx=lx+periodOrigin(f.x),wz=lz+periodOrigin(f.z);
  const fertility=roadGrassNoise(wx*.035,wz*.035),lodge=roadGrassNoise(wx*.075+77,wz*.075-42);
  const gaussian=(rng()+rng()+rng()+rng()-2)*.11;
  // Smooth bounds avoid clamping neighboring heads onto identical flat tops.
  const rise=1+.23*Math.tanh((fertility-.5)*1.6+gaussian*3);
  const fallen=Math.max(0,Math.min(1,(lodge-.61)/.17)),bend=fallen*fallen*(3-2*fallen);
  const direction=1.2+(roadGrassNoise(wx*.018+21,wz*.018-16)-.5)*1.4;
  if(!wheatAllowed(lx,lz,f))continue;cropSample(lx,lz,f,crop);const kind=crop.crop;
  if(kind===2&&(ix+iz)%2)continue;
  const succession=exitForField(lx,lz,f,{}),remaining=exitCropFactor(succession);if(remaining<.999&&rng()>remaining)continue;
  pose.position.set(x,surfaceHeight(lx,lz,f)-.015,z);
  // A shared storm direction bends neighboring clumps together. Yaw still
  // rotates each crossed tuft independently around that tilted growth axis.
  const lean=((3+rng()*5)+(kind===2?0:bend*(36+rng()*12)))*Math.PI/180;
  const leanDirection=bend>.05?direction+(rng()-.5)*.28:rng()*Math.PI*2;
  leanAxis.set(Math.cos(leanDirection)*Math.sin(lean),Math.cos(lean),Math.sin(leanDirection)*Math.sin(lean));
  pose.quaternion.setFromUnitVectors(up,leanAxis).multiply(yawRotation.setFromAxisAngle(up,yaw));
  // 95% of standing crop uses the original seven-ear tuft. Current single-ear
  // photos are sparse accents inside that dense canopy, never its main cover.
  const variant=kind===2||rng()<.95?0:1+Math.floor(rng()*3),mirror=rng()<.5?1:0;
  const width=kind===2?.25:variant===0?.80+rng()*.16+bend*.08:.18+rng()*.03;
  const height=kind===2?.18:(kind===1?1.35:1.52)*rise*(1-bend*.08)*(variant===0?1:.94);
  pose.scale.set(width,height*(.50+.50*remaining),width);pose.updateMatrix();
  const maturity=Math.max(0,Math.min(1,(roadGrassNoise(wx*.022-31,wz*.022+14)-.26)/.48));
  const green=[.68,.80,.40],gold=[1,.85,.53],dry=[.79,.66,.45],a=maturity<.56?green:gold,b=maturity<.56?gold:dry,u=maturity<.56?maturity/.56:(maturity-.56)/.44;
  const tone=(.88+rng()*.14)*(1-(1-remaining)*.25),hue=(rng()-.5)*.08;
  matrix.push(...pose.matrix.elements);
  if(kind===2)colors.push(.89,.86,.74);
  else colors.push((a[0]+(b[0]-a[0])*u)*tone*(1+hue),(a[1]+(b[1]-a[1])*u)*tone,(a[2]+(b[2]-a[2])*u)*tone*(1-hue));
  kinds.push(kind*8+variant*2+mirror);
 }
 const matrices=new Float32Array(matrix),tints=new Float32Array(colors),species=new Uint8Array(kinds);
 // 4 m observer cells; the larger padding encloses tall, broadly lodged tufts.
 // Every submitted vertex is within 35 m even at an observer-cell corner.
 const baked=prepareStaticSelection(matrices,tints,{size:40,step:4,radius:35,padding:CEREAL_PADDING,kinds:species});
 return {cx,cz,matrices,colors:tints,kinds:species,baked,generateMs:performance.now()-start};
}
