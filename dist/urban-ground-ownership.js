// A surface has one owner. Clip coverage instead of hiding coincident layers
// with camera-dependent depth offsets.
import {exitPoint,ease} from './exit-route.js?v=60';
const origin=exitPoint(382),a=Math.atan2(origin.tx,origin.tz),ca=Math.cos(a),sa=Math.sin(a);
export const approachRoadHalf=s=>{const r=2.05+ease(80,265,s)*2.05+ease(290,420,s)*6.9;return r+(11-r)*ease(327,350,s);};
export const approachRoadTop=s=>.028*(1-ease(336,350,s));
export const FABRIC_GROUND_POLYGON=[[-112,-198],[-112,-32],[112,-32],[112,-198]];
// The soil/rut/aggregate blend remains owned by rural terrain until the actual
// authored road starts. These exact polygons drive BOTH mesh clipping and GLSL.
export const TRANSITION_TERRAIN_QUADS=[];
const transitionHalf=s=>approachRoadHalf(s)+4.7+10*(1-ease(178,218,s));
for(let s=140;s<218;s+=6){const e=Math.min(218,s+6),p=exitPoint(s),q=exitPoint(e),r=transitionHalf(s),t=transitionHalf(e);TRANSITION_TERRAIN_QUADS.push([[p.x-p.nx*r,p.z-p.nz*r],[q.x-q.nx*t,q.z-q.nz*t],[q.x+q.nx*t,q.z+q.nz*t],[p.x+p.nx*r,p.z+p.nz*r]].map(([x,z])=>cityGroundPoint(x,z)));}
export const APPROACH_GROUND_QUADS=[];
for(let s=218;s<352;s+=2){const p=exitPoint(s),q=exitPoint(s+2),r=approachRoadHalf(s),t=approachRoadHalf(s+2);APPROACH_GROUND_QUADS.push([[p.x-p.nx*r,p.z-p.nz*r],[q.x-q.nx*t,q.z-q.nz*t],[q.x+q.nx*t,q.z+q.nz*t],[p.x+p.nx*r,p.z+p.nz*r]].map(([x,z])=>cityGroundPoint(x,z)));}
const cp=exitPoint(282),clinicOrigin={x:cp.x+cp.nx*28,z:cp.z+cp.nz*28},clinicAngle=Math.atan2(cp.nx,cp.nz),cc=Math.cos(clinicAngle),cs=Math.sin(clinicAngle);
const clinicCity=(x,z)=>cityGroundPoint(clinicOrigin.x+cc*x+cs*z,clinicOrigin.z-cs*x+cc*z);
export const CLINIC_GROUND_POLYGON=[[-21.76,-24],[21.76,-24],[21.76,52],[-21.76,52]].map(([x,z])=>clinicCity(x,z));
export const DISTRICT_GROUND_RECTS=[[21.76,42,-18,5.48],[25.6,70,18.4,62.1],[42,70,3.82,18.4],[27.6,70,62.1,82.3]];
export const DISTRICT_GROUND_POLYGONS=DISTRICT_GROUND_RECTS.map(([a,c,u,v])=>[[a,u],[c,u],[c,v],[a,v]].map(([x,z])=>clinicCity(x,z)));
export const HOPE_GROUND_RECTS=[[-112,112,-32,-12.5],[-165,165,-12.5,10.5],[-112,112,10.5,448]];
export function cityGroundPoint(x,z){const dx=x-origin.x,dz=z-origin.z;return[ca*dx-sa*dz,sa*dx+ca*dz];}
export function clipPolygon(poly,distance,inside=true){const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=distance(p),dq=distance(q),ip=inside?dp>=-1e-8:dp<=1e-8,iq=inside?dq>=-1e-8:dq<=1e-8;if(ip)out.push(p);if(ip!==iq){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}}return out;}
export function subtractConvex(poly,shape){
 // Disjoint footprints must stay intact; extending distant clipping lines
 // through an unrelated sidewalk creates needless slivers and shared edges.
 const px=poly.map(p=>p[0]),pz=poly.map(p=>p[2]),sx=shape.map(p=>p[0]),sz=shape.map(p=>p[1]);
 if(Math.max(...px)<=Math.min(...sx)+1e-8||Math.min(...px)>=Math.max(...sx)-1e-8||Math.max(...pz)<=Math.min(...sz)+1e-8||Math.min(...pz)>=Math.max(...sz)-1e-8)return[poly];
 let pending=poly;const out=[];const signed=shape.reduce((n,p,i)=>{const q=shape[(i+1)%shape.length];return n+p[0]*q[1]-q[0]*p[1];},0),sign=signed>=0?1:-1;for(let i=0;i<shape.length&&pending.length>2;i++){const a=shape[i],b=shape[(i+1)%shape.length],d=p=>sign*((b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]));const outside=clipPolygon(pending,d,false);if(outside.length>2)out.push(outside);pending=clipPolygon(pending,d,true);}return out;
}
export function subtractRectangles(x0,x1,z0,z1,holes){const xs=[x0,x1],zs=[z0,z1];for(const h of holes){for(const x of[h[0],h[1]])if(x>x0&&x<x1)xs.push(x);for(const z of[h[2],h[3]])if(z>z0&&z<z1)zs.push(z);}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);const out=[];for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const a=xs[i],c=xs[i+1],u=zs[j],v=zs[j+1];if(c-a<1e-6||v-u<1e-6)continue;if(!holes.some(h=>(a+c)/2>h[0]&&(a+c)/2<h[1]&&(u+v)/2>h[2]&&(u+v)/2<h[3]))out.push([a,c,u,v]);}return out;}
const convexGLSL=poly=>{const area=poly.reduce((n,p,i)=>{const q=poly[(i+1)%poly.length];return n+p[0]*q[1]-q[0]*p[1]},0),sign=area>0?1:-1;return '('+poly.map((a,i)=>{const c=poly[(i+1)%poly.length],dx=sign*(c[0]-a[0]),dz=sign*(c[1]-a[1]);return `(${dx.toFixed(8)}*(p.y-(${a[1].toFixed(8)}))-(${dz.toFixed(8)})*(p.x-(${a[0].toFixed(8)}))>=0.)`;}).join('&&')+')';};
export function transitionTerrainOwns(x,z){const p=cityGroundPoint(x,z);return TRANSITION_TERRAIN_QUADS.some(poly=>{let sign=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],d=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(Math.abs(d)<1e-7)continue;const s=Math.sign(d);if(sign&&s!==sign)return false;sign=s;}return true;});}
export const AUTHORED_GROUND_GLSL=`
vec2 authoredCity(vec2 w){vec2 p=w-vec2(${origin.x.toFixed(10)},${origin.z.toFixed(10)});return vec2(${ca.toFixed(10)}*p.x-(${sa.toFixed(10)})*p.y,${sa.toFixed(10)}*p.x+${ca.toFixed(10)}*p.y);}
bool authoredTransitionTerrain(vec2 p){return ${TRANSITION_TERRAIN_QUADS.map(convexGLSL).join('||')};}
bool authoredFabricGround(vec2 w){vec2 p=authoredCity(w);return p.x>=-112.&&p.x<=112.&&p.y>=-198.&&p.y<=-32.&&!authoredTransitionTerrain(p);}
bool authoredHopeGround(vec2 w){vec2 p=authoredCity(w);return (abs(p.x)<112.&&p.y>=-32.&&p.y<=448.)||(abs(p.x)<165.&&p.y>=-12.5&&p.y<=10.5);}
vec2 authoredClinic(vec2 w){vec2 p=w-vec2(${clinicOrigin.x.toFixed(10)},${clinicOrigin.z.toFixed(10)});return vec2(${cc.toFixed(10)}*p.x-(${cs.toFixed(10)})*p.y,${cs.toFixed(10)}*p.x+${cc.toFixed(10)}*p.y);}
bool authoredDistrictGround(vec2 w){vec2 p=authoredClinic(w);return ${DISTRICT_GROUND_RECTS.map(([x0,x1,z0,z1])=>`(p.x>=${x0.toFixed(4)}&&p.x<=${x1.toFixed(4)}&&p.y>=${z0.toFixed(4)}&&p.y<=${z1.toFixed(4)})`).join('||')};}
`;

// Both ends sample the same world-aligned aggregate at the ownership boundary.
export function addApproachGroundMaterial(m){
 const color=m.photoAsphalt.color.toArray().map(x=>x.toFixed(8)).join(',');
 function vertex(s){s.vertexShader='varying vec3 vAuthoredGround;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAuthoredGround=position;');s.fragmentShader='varying vec3 vAuthoredGround;\n'+AUTHORED_GROUND_GLSL+s.fragmentShader;}
 m.photoAsphalt.onBeforeCompile=s=>{vertex(s);s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','diffuseColor*=texture2D(map,authoredCity(vAuthoredGround.xz)/4.);');};m.photoAsphalt.customProgramCacheKey=()=> 'photo-road-world-uv-v53';
 const mat=m.approachAsphalt=m.asphalt.clone();mat.name='Urban approach / blended aggregate';mat.userData.urbanShared=true;
 mat.onBeforeCompile=s=>{vertex(s);s.uniforms.uApproachDestination={value:m.photoAsphalt.map};s.fragmentShader='uniform sampler2D uApproachDestination;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec2 roadUV=authoredCity(vAuthoredGround.xz);vec3 fromAggregate=texture2D(map,vMapUv).rgb;vec3 toAggregate=texture2D(uApproachDestination,roadUV/4.).rgb*vec3(${color});diffuseColor.rgb*=mix(fromAggregate,toAggregate,smoothstep(-55.,-32.,roadUV.y));`);};mat.customProgramCacheKey=()=> 'approach-road-continuous-material-v53';return m;
}
