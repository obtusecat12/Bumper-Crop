import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const base=new URL('../../dist/',import.meta.url).href;
const R=await import(base+'reference-scenes.js');
const X=await import(base+'exit-route.js');
const {createExitScene}=await import(base+'exit-scene.js');
const {resolveUrban}=await import(base+'urban-batch.js');
const props=[
 {id:'waterfall-vendor',local:[34.5,19.04],size:[1.02,1.89,.9],facing:0,ground:.02,collider:true},
 {id:'tandem-seat',local:[38.00,19.08],size:[2.15,.9,.64],facing:0,ground:.02,collider:true},
 {id:'coin-scale',local:[31.40,19.12],size:[.65,1.92,.8],facing:0,ground:.02,collider:true},
 {id:'notice-frame',local:[38.0,18.395],size:[1.62,.88,.075],facing:0,centerY:1.95,collider:false},
 {id:'ring-rubber-mat',local:[34.5,20.02],size:[1.42,.016,.68],facing:0,ground:.02,collider:false},
 {id:'opal-bulkhead',local:[34.5,18.48],size:[.42,.23,.18],facing:0,centerY:2.58,collider:false},
];
const intendedColliders=props.filter(p=>p.collider).map(p=>{const w=R.clinicToWorld(...p.local);return {kind:'obb',...w,w:p.size[0],d:p.size[2],ry:R.CLINIC_ANGLE};});
const {initializeVendingTextures}=await import(base+'vending-materials-v70.js');
const {loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
await initializeVendingTextures(async(url,w,h)=>{const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return {data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};});
const {createBackcourt}=await import(base+'backcourt-scene-v70.js');
const ex=createExitScene();const backcourt=ex.backcourt;const newColliders=backcourt.colliders;ex.setCity(true);const start=R.clinicToWorld(46.9,33.6);await ex.prepareAt(start.x,start.z);ex.update({cx:0n,cz:0n,...start});
const routes={
 'clinic-main-to-plaza':[[-6,-8],[20,-9],[20,2.1],[49,2.1],[49,21],[48,35],[58,36],[58,52],[57,61],[43,61]],
 'clinic-service-to-plaza':[[-19,33],[-19,42.1],[23,42.1],[24.1,47.4],[26.8,47.4],[26.8,26],[48,26],[73,26],[80,30],[86.5,30]],
 'new-vendor-approach':[[48,26],[38,24],[34.5,22.6],[34.5,20.32]],
 'waiting-seat-approach':[[38,24],[38,20.22]],
};
const checks={};
for(const [name,path]of Object.entries(routes)){let samples=0,maxDisplacement=0,maxHeightStep=0,lastHeight;const failures=[];
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4);for(let k=0;k<=n;k++){const t=k/n,local=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],p=R.clinicToWorld(...local),q={...p};ex.resolve(q,{cx:0n,cz:0n});resolveUrban(q,newColliders);const displacement=Math.hypot(q.x-p.x,q.z-p.z),height=ex.floorAt(p.x,p.z);maxDisplacement=Math.max(maxDisplacement,displacement);if(lastHeight!==undefined)maxHeightStep=Math.max(maxHeightStep,Math.abs(height-lastHeight));lastHeight=height;if(displacement>.001)failures.push({local,displacement});samples++;}}
 checks[name]={samples,maxDisplacement,maxHeightStep,failures:failures.slice(0,10),pass:maxDisplacement<.001&&maxHeightStep<.36};
}
const cameraLocal={position:[46.9,2.232,33.586],yaw:.91847,pitch:-.04377,fov:59.1035,aspect:1925/1173,confidence:'estimated from eight screenshot landmarks, reprojection RMS 8.6 pixels; verify visually, not recorded original pose'};
const p=R.clinicToWorld(cameraLocal.position[0],cameraLocal.position[2]);
const result={actualBackcourt:{stats:backcourt.object.userData.cityStats,colliders:backcourt.colliders,craft:backcourt.craft,cables:backcourt.cables,models:Object.fromEntries(Object.entries(backcourt.prototypes).map(([k,v])=>[k,v.report]))},frame:{origin:R.CLINIC_ORIGIN,angle:R.CLINIC_ANGLE,baseY:X.EXIT_CITY_Y},wall:{module:'clinic-district.js',localCenter:[33.75,3.26,11.97],size:[16.3,6.52,12.74],backFaceZ:18.34,x0:25.6,x1:41.9,roofTop:7.22},props:props.map(p=>({...p,world:R.clinicToWorld(...p.local),worldGroundY:X.EXIT_CITY_Y+(p.ground||0),worldYaw:R.CLINIC_ANGLE+(p.facing||0)})),camera:{...cameraLocal,world:[p.x,X.EXIT_CITY_Y+cameraLocal.position[1],p.z],worldYaw:R.CLINIC_ANGLE+cameraLocal.yaw},routes,checks};
fs.writeFileSync(new URL('./results/geometry-and-routes.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({stats:result.actualBackcourt.stats,craft:backcourt.craft,models:result.actualBackcourt.models,checks},null,2));
ex.dispose();
