// Read-only QA for the current spring layout, generated shell and visible treads.
// Run: node tests/spring-v64/geometry-check.mjs.
import fs from 'node:fs';
import * as T from '../../dist/vendor/three.module.min.js';
import * as L from '../../dist/level27-layout.js';
import {SPRING_SHELL} from '../../dist/level27-shell-data.js';
import {naturalTreads} from '../../dist/spring-geology-v63.js';
const report={createdAt:new Date().toISOString(),failures:[],warnings:[],area:{},route:{},floor:{},treads:{},shell:{}};
const sceneSource=fs.readFileSync(new URL('../../dist/level27-scene.js',import.meta.url),'utf8');
const cullMargin=Number(sceneSource.match(/Math\.hypot\(x,z\)>radialLimit\(x,z\)\+([.\d]+)&&!inAnnex\(x,z\)/)?.[1]??.02);
const round=n=>Math.round(n*1e6)/1e6;
const problem=(kind,detail)=>report.failures.push({kind,...detail});
report.area.survey=L.polygonArea(L.CAVE_PLAN);report.area.error=report.area.survey-18.58;
const floatPlan=L.CAVE_PLAN.map(v=>v.map(Math.fround));report.area.renderedFloat32=L.polygonArea(floatPlan);
if(Math.abs(report.area.error)>1e-10)problem('water-area',{area:report.area.survey});
const routePoints=[{...L.ARRIVAL}];
for(let z=L.ARRIVAL.z;z<L.STAIRS.start;z+=.12)routePoints.push({x:L.stairCenter(z),z});
for(let n=0;n<=250;n++){const z=L.STAIRS.start+n*(L.STAIRS.count*L.STAIRS.tread)/250;routePoints.push({x:L.stairCenter(z),z});}
routePoints.push({x:3.12,z:.12},{x:3.50,z:.25},{x:3.15,z:.3},{x:2.85,z:.25},{x:2.45,z:.12},{x:1.4,z:0},{x:.05,z:0});
const wholeRoute=routePoints.concat(routePoints.slice(0,-1).reverse());
let pose={x:L.ARRIVAL.x,z:L.ARRIVAL.z},samples=0,maxStep=0,stalls=[],path=[{...pose,y:L.springFloor(pose.x,pose.z)}];
for(let waypoint=1;waypoint<wholeRoute.length;waypoint++){
 const target=wholeRoute[waypoint];let ok=false;
 for(let k=0;k<1200;k++){const dx=target.x-pose.x,dz=target.z-pose.z,d=Math.hypot(dx,dz);if(d<.005){ok=true;break;}const step=Math.min(.010,d),n={x:pose.x+dx/d*step,z:pose.z+dz/d*step},q=L.resolveSpring(pose,n),distance=Math.hypot(q.x-pose.x,q.z-pose.z);if(distance<.0001){stalls.push({waypoint,at:pose,wanted:n,allowed:L.springAllowed(n.x,n.z),fromY:L.springFloor(pose.x,pose.z),toY:L.springFloor(n.x,n.z)});break;}maxStep=Math.max(maxStep,Math.abs(L.springFloor(q.x,q.z)-L.springFloor(pose.x,pose.z)));pose=q;samples++;if(samples%8===0)path.push({...pose,y:L.springFloor(pose.x,pose.z)});}
 if(!ok){problem('route-blocked',stalls.at(-1)||{waypoint,at:pose});break;}
}
report.route={samples,maxStep,stalls,finalPose:pose,roundTripComplete:Math.hypot(pose.x-L.ARRIVAL.x,pose.z-L.ARRIVAL.z)<.02,waypoints:wholeRoute.length,poolCenterAllowed:L.springAllowed(.05,0),poolCenterIsPool:L.inPool(.05,0)};
let maxFloor=-Infinity,minFloor=Infinity,maxAt=null,nonSubmerged=0;
for(let i=0;i<720;i++){const a=i/720*Math.PI*2,lim=L.radialLimit(Math.cos(a),Math.sin(a));for(let j=0;j<=200;j++){const r=lim*j/200,x=Math.cos(a)*r,z=Math.sin(a)*r,y=L.poolFloor(x,z);if(y>maxFloor){maxFloor=y;maxAt=[x,z];}minFloor=Math.min(minFloor,y);if(y>=0)nonSubmerged++;}}
report.floor.authority={samples:720*201,min:minFloor,max:maxFloor,maxAt,nonSubmerged};if(nonSubmerged)problem('pool-floor-not-submerged',{nonSubmerged,maxFloor,maxAt});
// Exact piecewise-linear height and cell-culling of the visible floor geoGrid.
const floorMatch=sceneSource.match(/mesh\(geoGrid\((\d+),(\d+),\(u,v\)=>\{const x=(-?[\d.]+)\+u\*([\d.]+),z=(-?[\d.]+)\+v\*([\d.]+)/);
if(!floorMatch)throw Error('Current floor grid no longer matches diagnostic parser; update QA before use.');
const [nc,nr,x0,xSpan,z0,zSpan]=floorMatch.slice(1).map(Number),dx=xSpan/nc,dz=zSpan/nr;
const height=(i,j)=>{const x=x0+i*dx,z=z0+j*dz;return Math.fround(L.poolFloor(x||.0001,z||.0001));};
function visualHeight(x,z){const fi=(x-x0)/dx,fj=(z-z0)/dz,i=Math.floor(fi),j=Math.floor(fj);if(i<0||i>=nc||j<0||j>=nr)return null;const cx=x0+(i+.5)*dx,cz=z0+(j+.5)*dz;if(Math.hypot(cx,cz)>L.radialLimit(cx,cz)+cullMargin&&!L.inAnnex(cx,cz))return null;const u=fi-i,v=fj-j,a=height(i,j),b=height(i,j+1),c=height(i+1,j),d=height(i+1,j+1);return u+v<=1?a+(b-a)*v+(c-a)*u:d+(b-d)*(1-u)+(c-d)*(1-v);}
let missing=0,aboveWater=0,maxVisual=-Infinity,visualMaxAt=null,mismatches=[];
for(let i=0;i<720;i++){const a=i/720*Math.PI*2,lim=L.radialLimit(Math.cos(a),Math.sin(a));for(const fraction of [.5,.8,.9,.95,.975,.985,.995,.999,1]){const x=Math.cos(a)*lim*fraction,z=Math.sin(a)*lim*fraction,y=visualHeight(x,z);if(y===null){missing++;if(mismatches.length<8)mismatches.push({kind:'missing',x,z,fraction});continue;}if(y>maxVisual){maxVisual=y;visualMaxAt=[x,z,fraction];}if(y>=0){aboveWater++;if(mismatches.length<8)mismatches.push({kind:'above',x,z,y,fraction});}}}
report.floor.renderedGrid={samples:720*9,columns:nc,rows:nr,cullMargin,missing,aboveWater,max:maxVisual,maxAt:visualMaxAt,examples:mismatches};if(missing)problem('visible-floor-missing-below-water',{count:missing,examples:mismatches});if(aboveWater)problem('visible-floor-above-water',{count:aboveWater,max:maxVisual,at:visualMaxAt});
const treadGroup=naturalTreads(new T.MeshBasicMaterial({side:T.DoubleSide}));treadGroup.updateMatrixWorld(true);const ray=new T.Raycaster(),treadRows=[];let maxMismatch=0,maxMismatchAt=null;
for(let step=0;step<L.STAIRS.count;step++){let rowMax=0,missed=0;for(let j=1;j<=9;j++)for(const offset of [-.30,0,.30]){const z=L.STAIRS.start+(step+j/10)*L.STAIRS.tread,x=L.stairCenter(z)+offset;ray.set(new T.Vector3(x,2.7,z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(treadGroup,true)[0],expected=L.springFloor(x,z);if(!hit){missed++;continue;}const diff=Math.abs(hit.point.y-expected);rowMax=Math.max(rowMax,diff);if(diff>maxMismatch){maxMismatch=diff;maxMismatchAt={step,x,z,expected,visible:hit.point.y};}}
 treadRows.push({step:step+1,maximumDifference:rowMax,missing:missed});if(missed||rowMax>.003)problem('visible-tread-floor-mismatch',{step:step+1,maximumDifference:rowMax,missing:missed});}
report.treads={samples:270,maxMismatch,maxMismatchAt,steps:treadRows};
const decode=(s,C)=>{const b=Buffer.from(s,'base64');return new C(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const ints=decode(SPRING_SHELL.vertices,Int16Array),vertices=Float32Array.from(ints,v=>v/SPRING_SHELL.scale),indices=decode(SPRING_SHELL.indices,Uint32Array);const shellGeo=new T.BufferGeometry();shellGeo.setAttribute('position',new T.BufferAttribute(vertices,3));shellGeo.setIndex(new T.BufferAttribute(indices,1));const shell=new T.Mesh(shellGeo,new T.MeshBasicMaterial({side:T.DoubleSide}));shell.updateMatrixWorld(true);
// Spatially bucket shell faces for bounded route checks.
const cell=.35,buckets=new Map(),localMeshes=new Map();
for(let n=0;n<indices.length;n+=3){const ids=[indices[n],indices[n+1],indices[n+2]],xs=ids.map(i=>vertices[i*3]),zs=ids.map(i=>vertices[i*3+2]);for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const k=x+','+z;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(n);}}
function nearShell(x,z){const xx=Math.floor(x/cell),zz=Math.floor(z/cell),key=xx+','+zz;if(localMeshes.has(key))return localMeshes.get(key);const faces=new Set();for(let i=xx-1;i<=xx+1;i++)for(let j=zz-1;j<=zz+1;j++)for(const n of buckets.get(i+','+j)||[])faces.add(n);const ix=[];for(const n of faces)ix.push(indices[n],indices[n+1],indices[n+2]);const g=new T.BufferGeometry();g.setAttribute('position',shellGeo.attributes.position);g.setIndex(ix);const m=new T.Mesh(g,shell.material);m.updateMatrixWorld(true);localMeshes.set(key,m);return m;}
// Check head-level and chest-level clearance along the entire intended path.
let shellObstructions=[],floorPiercings=[],ceilingMin=Infinity,clearanceMin=Infinity;
for(let i=0;i<path.length;i++){const p=path[i],y=p.y,localShell=nearShell(p.x,p.z);
 ray.set(new T.Vector3(p.x,y+.08,p.z),new T.Vector3(0,1,0));const hits=ray.intersectObject(localShell),first=hits[0];if(first){ceilingMin=Math.min(ceilingMin,first.distance+.08);if(first.distance<1.60&&shellObstructions.length<20)shellObstructions.push({x:p.x,z:p.z,floor:y,shellY:first.point.y,availableHeight:first.distance+.08});}
 ray.set(new T.Vector3(p.x,y+.30,p.z),new T.Vector3(0,-1,0));const ground=ray.intersectObject(localShell)[0];if(ground&&ground.point.y>y+.015&&floorPiercings.length<20)floorPiercings.push({x:p.x,z:p.z,floor:y,shellY:ground.point.y});
 for(const h of [.25,1.0,1.65])for(let k=0;k<8;k++){const a=k/8*Math.PI*2;ray.set(new T.Vector3(p.x,y+h,p.z),new T.Vector3(Math.cos(a),0,Math.sin(a)));ray.far=.21;const hit=ray.intersectObject(localShell)[0];if(hit){clearanceMin=Math.min(clearanceMin,hit.distance);if(shellObstructions.length<20)shellObstructions.push({x:p.x,z:p.z,floor:y,height:h,clearance:hit.distance,hit:hit.point.toArray()});}ray.far=Infinity;}
}
report.shell={vertices:vertices.length/3,triangles:indices.length/3,pathSamples:path.length,minCeilingClearance:ceilingMin,minHorizontalClearance:clearanceMin===Infinity?'>=0.21':clearanceMin,obstructions:shellObstructions,floorPiercings};if(shellObstructions.length)problem('walkable-route-intersects-shell',{examples:shellObstructions});if(floorPiercings.length)problem('visible-shell-above-walk-floor',{examples:floorPiercings});
const output=new URL('./results/geometry-check-report.json',import.meta.url);fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

if(report.failures.length)process.exitCode=1;
