// Residual-parcel infill. Reservation protects surveyed footprints, not entire blocks.
// A shared plan drives rendering, collisions and both city maps.
const B=112,PI=Math.PI;
let obstacles=[],revision=0;const cache=new Map();
const corners=q=>{const c=Math.cos(q.ry||0),s=Math.sin(q.ry||0);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[q.x+c*a*q.w/2+s*b*q.d/2,q.z-s*a*q.w/2+c*b*q.d/2]);};
function overlap(a,b,pad){const ac=corners(a),bc=corners(b);for(const r of[a.ry||0,b.ry||0])for(const n of[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]]){const ap=ac.map(p=>p[0]*n[0]+p[1]*n[1]),bp=bc.map(p=>p[0]*n[0]+p[1]*n[1]);if(Math.max(...ap)+pad<=Math.min(...bp)||Math.max(...bp)+pad<=Math.min(...ap))return false;}return true;}
export function setInfillObstacles(solids,frame){const c=Math.cos(frame.angle),s=Math.sin(frame.angle);obstacles=solids.map(q=>{const x=q.x-frame.x,z=q.z-frame.z;return{x:c*x-s*z,z:s*x+c*z,w:q.w||q.r*2,d:q.d||q.r*2,ry:(q.ry||0)-frame.angle,small:q.kind==='circle'||Math.max(q.w||0,q.d||0)<3};});
 // These three unchanged photo masses formerly had no collision record.
 for(const q of[[-27.5,175,27,31],[-27,219,29,35],[26,250,25,49]])obstacles.push({x:q[0],z:q[1],w:q[2],d:q[3],ry:0});
 // Milling service mouth: 4.5m carriageway plus its two authored buildings.
 obstacles.push({x:87,z:194,w:34,d:20,ry:0});cache.clear();revision++;}
export function infillPlan(ix,iz){const id=ix+','+iz+':'+revision;if(cache.has(id))return cache.get(id);const plans=[];if(![-1,0].includes(ix)||iz<0||iz>3)return plans;
 const side=ix<0?-1:1,z0=iz*B;
 function propose(x,z,w,d,ry,seed,floors){const q={x,z,w,d,ry};if(obstacles.some(o=>overlap(q,o,o.small?1.1:1.35))||plans.some(o=>overlap(q,o,.025)))return false;plans.push({...q,seed,floors,type:['brick_walkup','two_story_shops','photo_studio','bank_branch','terraced_office','corner_market'][seed%6],streetwall:true,infill:true,lot:'mixed'});return true;}
 // Continuous 18m-deep inner streetwall; 5m walks define the service street.
 for(let k=0;k<6;k++){const z=z0+14+k*16.35;propose(side*56,z,16.30,18,side>0?PI/2:-PI/2,81601+iz*113+k*31+(side+1)*7,3+(iz+k)%5);}
 // Restore Hope St frontage wherever a protected photographic mass is absent.
 for(let k=0;k<6;k++){const z=z0+15+k*16.1;propose(side*27,z,16.05,22,side>0?-PI/2:PI/2,81901+iz*97+k*17+(side+1)*3,4+(iz+k)%5);}
 // Small corner infill ties the outer frontage to existing office and parking buildings.
 for(let k=0;k<9;k++){const z=z0+13+k*10.3;propose(side*91,z,10.25,18,side>0?PI/2:-PI/2,82601+iz*139+k*11+(side+1)*9,2+(iz+k)%4);}
 cache.set(id,plans);return plans;}
