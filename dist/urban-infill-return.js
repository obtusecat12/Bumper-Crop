// Residual-parcel infill. Reservation protects surveyed footprints, not entire blocks.
// A shared plan drives rendering, collisions and both city maps.
import {exitPoint} from './exit-route.js';
const B=112,PI=Math.PI;
let obstacles=[],approachFrontages=[],revision=0;const cache=new Map();
const corners=q=>{const c=Math.cos(q.ry||0),s=Math.sin(q.ry||0);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[q.x+c*a*q.w/2+s*b*q.d/2,q.z-s*a*q.w/2+c*b*q.d/2]);};
function overlap(a,b,pad){const ac=corners(a),bc=corners(b);for(const r of[a.ry||0,b.ry||0])for(const n of[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]]){const ap=ac.map(p=>p[0]*n[0]+p[1]*n[1]),bp=bc.map(p=>p[0]*n[0]+p[1]*n[1]);if(Math.max(...ap)+pad<=Math.min(...bp)||Math.max(...bp)+pad<=Math.min(...ap))return false;}return true;}
export function setInfillObstacles(solids,frame){const c=Math.cos(frame.angle),s=Math.sin(frame.angle);obstacles=solids.map(q=>{const x=q.x-frame.x,z=q.z-frame.z;return{x:c*x-s*z,z:s*x+c*z,w:q.w||q.r*2,d:q.d||q.r*2,ry:(q.ry||0)-frame.angle,small:q.kind==='circle'||Math.max(q.w||0,q.d||0)<3};});
 // These three unchanged photo masses formerly had no collision record.
 for(const q of[[-27.5,175,27,31],[-27,219,29,35],[26,250,25,49]])obstacles.push({x:q[0],z:q[1],w:q[2],d:q[3],ry:0});
 // Milling service mouth: 4.5m carriageway plus its two authored buildings.
 obstacles.push({x:79,z:198,w:52,d:30,ry:0});
 // The original curved approach stays open inside the newly occupied parcels.
 // Protect its surveyed centre line, verges and sidewalks, not 224m-wide blocks.
 for(let d=45;d<382;d+=8){const p=exitPoint(d),dx=p.x-frame.x,dz=p.z-frame.z;obstacles.push({x:c*dx-s*dz,z:s*dx+c*dz,w:d<270?19:30,d:11,ry:Math.atan2(p.tx,p.tz)-frame.angle});}
 // In the two formerly empty northern parcels the original approach bends
 // 24 degrees across the grid. Frontage must follow that actual road tangent.
 approachFrontages=[];for(let d=52;d<218;d+=16.3){const p=exitPoint(d),dx=p.x-frame.x,dz=p.z-frame.z,ry=Math.atan2(p.tx,p.tz)-frame.angle;
  for(const side of[-1,1])approachFrontages.push({x:c*dx-s*dz+side*Math.cos(ry)*23,z:s*dx+c*dz-side*Math.sin(ry)*23,ry:ry-side*PI/2,seed:86101+Math.round(d)*19+(side+1)*7});}
 cache.clear();revision++;}
export function infillPlan(ix,iz){const id=ix+','+iz+':'+revision;if(cache.has(id))return cache.get(id);const plans=[];if(![-1,0].includes(ix)||iz< -3||iz>3)return plans;
 const side=ix<0?-1:1,z0=iz*B;
 function propose(x,z,w,d,ry,seed,floors){const q={x,z,w,d,ry};if(obstacles.some(o=>overlap(q,o,o.small?1.1:1.35))||plans.some(o=>overlap(q,o,.025)))return false;plans.push({...q,seed,floors,type:['brick_walkup','two_story_shops','photo_studio','bank_branch','terraced_office','corner_market'][seed%6],streetwall:true,infill:true,lot:'mixed'});return true;}
 if(iz<0)for(const q of approachFrontages)if(Math.floor(q.x/B)===ix&&Math.floor(q.z/B)===iz)propose(q.x,q.z,16.1,18,q.ry,q.seed,3+q.seed%3);
 // Continuous 18m-deep inner streetwall; 5m walks define the service street.
 for(let k=0;k<6;k++){const z=z0+14+k*16.35;propose(side*56,z,16.30,18,side>0?PI/2:-PI/2,81601+iz*113+k*31+(side+1)*7,3+Math.abs(iz+k)%5);}
 // Restore Hope St frontage wherever a protected photographic mass is absent.
 for(let k=0;k<6;k++){const z=z0+15+k*16.1;propose(side*27,z,16.05,22,side>0?-PI/2:PI/2,81901+iz*97+k*17+(side+1)*3,4+Math.abs(iz+k)%5);}
 // Small corner infill ties the outer frontage to existing office and parking buildings.
 for(let k=0;k<9;k++){const z=z0+13+k*10.3;propose(side*91,z,10.25,18,side>0?PI/2:-PI/2,82601+iz*139+k*11+(side+1)*9,2+Math.abs(iz+k)%4);}
 // Narrow, road-facing shops occupy the residual strip beside the curved
 // original approach. A full 22m-deep prototype cannot fit this real parcel.
 if(iz<0)for(let k=0;k<6;k++)propose(side*40,z0+15+k*14.8,14.65,12,side>0?-PI/2:PI/2,84211+iz*181+k*29+(side+1)*13,2+(k%3));
 cache.set(id,plans);return plans;}
