// Spatial authority: storage chunks do not impose room boundaries.
export const L0_CELL=3.6,L0_N=6,L0_CHUNK=21.6,L0_HEIGHT=2.72;
const K=L0_CHUNK,M=K*4,H=L0_HEIGHT;
export function l0Hash(x,z,s=0){let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(s|0,1442695041)^0x5eeda017;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
export const L0_LANDMARKS=[{name:'黄墙旧办公室',x:3,z:10,yaw:0},{name:'拱窗与清洁桶',x:35.5,z:23,yaw:-.64},{name:'无尽柱厅 · 120 × 130 米',x:2,z:83,yaw:0},{name:'深坑群',x:-39.6,z:9,yaw:-.3},{name:'熄灯区',x:8,z:-43,yaw:0},{name:'红室边缘',x:98,z:37,yaw:0},{name:'墙上配电箱',x:15.6,z:5,yaw:-Math.PI/2},{name:'家具遗留区',x:76,z:16,yaw:0}];
const FIXED=[{id:'arches-fixed',type:'arches',x0:31,x1:47,z0:-5,z1:31},{id:'columns-fixed',type:'columns',x0:-60,x1:60,z0:64.8,z1:194.4},{id:'pits-fixed',type:'pits',x0:-62,x1:-27,z0:-9,z1:29},{id:'blackout-fixed',type:'blackout',x0:-12,x1:28,z0:-63,z1:-30},{id:'red-fixed',type:'red',x0:91,x1:113,z0:23,z1:48}];
const ref={id:'reference',type:'classic',x0:-3,x1:24,z0:-16,z1:20},furnitureRoom={id:'furniture-fixed',type:'classic',x0:66,x1:88,z0:-5,z1:25};
const inside=(r,x,z,p=0)=>x>r.x0-p&&x<r.x1+p&&z>r.z0-p&&z<r.z1+p;
function regionsNear(x,z){const out=[...FIXED];for(let gz=Math.floor(z/210)-1;gz<=Math.floor(z/210)+1;gz++)for(let gx=Math.floor(x/210)-1;gx<=Math.floor(x/210)+1;gx++){if(Math.abs(gx)+Math.abs(gz)<2)continue;const h=l0Hash(gx,gz,804);if(h<.40)continue;const type=h<.68?'columns':h<.80?'arches':h<.89?'blackout':h<.96?'pits':'red',cx=gx*210+35+l0Hash(gx,gz,805)*110,cz=gz*210+30+l0Hash(gx,gz,806)*110,w=type==='columns'?95+l0Hash(gx,gz,807)*70:type==='arches'?30+l0Hash(gx,gz,807)*25:22+l0Hash(gx,gz,807)*25,d=type==='columns'?90+l0Hash(gx,gz,808)*70:30+l0Hash(gx,gz,808)*25;out.push({id:`${gx}:${gz}`,type,x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2});}return out;}
export function l0RegionAt(x,z){return regionsNear(x,z).find(r=>inside(r,x,z))||{id:'classic',type:'classic'};}
export function l0TypeAt(x,z){return l0RegionAt(x,z).type;}
export function l0Type(cx,cz){return l0TypeAt((cx+.5)*K,(cz+.5)*K);}
const macroCache=new Map();
function macro(mx,mz){const key=`${mx},${mz}`;if(macroCache.has(key))return macroCache.get(key);const walls=[],rooms=[];let seq=0;const rnd=s=>l0Hash(mx*931+s,mz*977-s,1802);const add=(x,z,w,d,id)=>walls.push({x,z,w,d,h:H,y:H/2,mat:Math.floor(rnd(id+81)*3),id:`m${key}:${id}`});
 function split(x0,z0,x1,z1,depth){const id=++seq,w=x1-x0,d=z1-z0;if(depth>6||Math.min(w,d)<7||w*d<70+170*rnd(id+200)){rooms.push({x0,z0,x1,z1,id});return;}let vertical=w>d*1.2||(w>d*.8&&rnd(id+11)>.5);if(vertical&&w<9)vertical=false;if(!vertical&&d<9)vertical=true;const span=vertical?d:w,cut=(vertical?x0:z0)+(vertical?w:d)*(.30+.40*rnd(id+19)),gap=2+3.7*rnd(id+34),door=(vertical?z0:x0)+span*(.22+.56*rnd(id+72)),lo=vertical?z0:x0,hi=vertical?z1:x1,a=Math.max(lo,door-gap/2),b=Math.min(hi,door+gap/2);
  if(a-lo>.45)vertical?add(cut,(lo+a)/2,.17,a-lo,id*2):add((lo+a)/2,cut,a-lo,.17,id*2);
  if(hi-b>.45)vertical?add(cut,(hi+b)/2,.17,hi-b,id*2+1):add((hi+b)/2,cut,hi-b,.17,id*2+1);
  if(vertical){split(x0,z0,cut,z1,depth+1);split(cut,z0,x1,z1,depth+1);}else{split(x0,z0,x1,cut,depth+1);split(x0,cut,x1,z1,depth+1);}
 }
 split(mx*M,mz*M,(mx+1)*M,(mz+1)*M,0);const result={walls,rooms};macroCache.set(key,result);if(macroCache.size>80)macroCache.delete(macroCache.keys().next().value);return result;}
function clippedWall(w,exclusions){const vertical=w.d>w.w;let intervals=[[vertical?w.z-w.d/2:w.x-w.w/2,vertical?w.z+w.d/2:w.x+w.w/2]];for(const r of exclusions){if(vertical?(w.x<=r.x0-.1||w.x>=r.x1+.1):(w.z<=r.z0-.1||w.z>=r.z1+.1))continue;const a=vertical?r.z0:r.x0,b=vertical?r.z1:r.x1;intervals=intervals.flatMap(([s,e])=>e<=a||s>=b?[[s,e]]:[[s,Math.max(s,a)],[Math.min(e,b),e]].filter(([s,e])=>e-s>.4));}return intervals.map(([a,b],i)=>({...w,id:w.id+':'+i,...(vertical?{z:(a+b)/2,d:b-a}:{x:(a+b)/2,w:b-a})}));}
export function createL0Chunk(cx,cz,revision=0){
 const ox=cx*K,oz=cz*K,type=l0Type(cx,cz),walls=[],pillars=[],holes=[],floors=[],arches=[],lights=[],details=[],puddles=[],furniture=[],outlets=[],mold=[],breakers=[],panels=[];
 const owns=(x,z)=>x>=ox-1e-6&&x<ox+K-1e-6&&z>=oz-1e-6&&z<oz+K-1e-6;
 const regions=regionsNear(ox+K/2,oz+K/2),exclusions=[ref,furnitureRoom,...regions.filter(r=>r.type==='columns'||r.type==='arches'||r.type==='pits')];
 const addWall=(x,z,w,d,mat=0,id='fixed')=>{if(owns(x,z))walls.push({x,z,w,d,mat,h:H,y:H/2,id});};
 // Unbalanced metric BSP: unequal rooms and independently offset openings, no chunk perimeter.
 for(let mz=Math.floor((oz-45)/M);mz<=Math.floor((oz+K+45)/M);mz++)for(let mx=Math.floor((ox-45)/M);mx<=Math.floor((ox+K+45)/M);mx++)for(const w of macro(mx,mz).walls)for(const p of clippedWall(w,exclusions))if(owns(p.x,p.z))walls.push(p);
 for(const [x,z,w,d,mat]of[[7,2.1,.19,7.8,0],[-.5,-.5,.19,8,1],[5.5,-6,16,.18,1],[17,4,.18,14,0],[0,11.8,10,.18,1],[19,-11,8,.18,1]])addWall(x,z,w,d,mat,'reference');
 for(const r of regions){if(r.x1<ox-90||r.x0>ox+K+90||r.z1<oz-90||r.z0>oz+K+90)continue;
  if(r.type==='columns'){for(let z=r.z0+4.7;z<r.z1-2;z+=6.3)for(let x=r.x0+4.15;x<r.x1-2;x+=6.3)if(owns(x,z))pillars.push({x,z,w:.60,d:.60,h:H,y:H/2,mat:0});}
  if(r.type==='arches'){const x=r.x0+(r.x1-r.x0)*.60;for(let z=r.z0+2.7;z<r.z1-2;z+=1.8)if(owns(x,z))arches.push({x,z,rotation:Math.PI/2,w:1.8,sill:.91,top:2.31});addWall(r.x0,(r.z0+r.z1)/2,.18,r.z1-r.z0,2,'arch-left');addWall((r.x0+r.x1)/2,r.z0,r.x1-r.x0,.18,2,'arch-end');}
 }
 for(let iz=0;iz<6;iz++)for(let ix=0;ix<6;ix++){const x=ox+(ix+.5)*3.6,z=oz+(iz+.5)*3.6,t=l0TypeAt(x,z),hh=l0Hash(Math.round(x*10),Math.round(z*10),908);let hole=null;if(t==='pits'&&hh>.23)holes.push(hole={x,z,w:1.6+hh*.8,d:1.75+hh*.6});if(!hole)floors.push({x,z,w:3.6,d:3.6,type:t});else{const rx=(3.6-hole.w)/2,rz=(3.6-hole.d)/2;floors.push({x:x-(3.6+hole.w)/4,z,w:rx,d:3.6,type:t},{x:x+(3.6+hole.w)/4,z,w:rx,d:3.6,type:t},{x,z:z-(3.6+hole.d)/4,w:hole.w,d:rz,type:t},{x,z:z+(3.6+hole.d)/4,w:hole.w,d:rz,type:t});}
  if((ix+iz)%2===0&&hh>.10)lights.push({x,z,on:t!=='blackout'&&hh>.15,phase:hh*6.28});const rr=l0Hash(cx*39+ix,cz*41+iz,909);if(rr<.072)details.push({x:x+.47,z:z+.21,kind:Math.floor(hh*4),rotation:hh>.5?0:Math.PI/2});else if(rr<.080)details.push({x:x+.47,z:z+.21,kind:4,rotation:0});else if(rr<.088)details.push({x:x-.38,z:z-.22,kind:5,rotation:hh*6.28});
  if(!hole&&t!=='columns'&&rr>.982)puddles.push({x,z,w:.8+hh,d:.6+hh*.9,phase:hh*6.28});
 }
 for(let i=0;i<walls.length;i++){const w=walls[i],vertical=w.d>w.w,len=Math.max(w.w,w.d),seed=Math.round(w.x*113)+Math.round(w.z*317),rand=s=>l0Hash(seed,i,s);if(len<1)continue;const sign=rand(93)>.5?1:-1,face={x:w.x+(vertical?sign*w.w/2:0),z:w.z+(vertical?0:sign*w.d/2),rotation:vertical?sign*Math.PI/2:sign>0?0:Math.PI};
  if(rand(301)<.095&&w.id!=='reference')panels.push({...w,style:Math.floor(rand(302)*10),height:.92,rotation:vertical?Math.PI/2:0});
  if(rand(308)<.32){const n=rand(309)<.055?12+Math.floor(rand(310)*22):1;for(let j=0;j<n;j++){const offset=(rand(330+j)-.5)*Math.max(.2,len-.45);outlets.push({...face,x:face.x+(vertical?0:offset),z:face.z+(vertical?offset:0),y:n>1?.25+rand(380+j)*1.85:.31,style:Math.floor(rand(440+j)*5),roll:n>1?(rand(490+j)-.5)*.7:0});}}
  if(rand(506)<.09)mold.push({...face,y:.35+rand(508)*1.1,w:Math.min(len-.1,.7+rand(510)*1.4),h:.6+rand(511)*1.4});
  if(len>3&&rand(518)<.023)breakers.push({...face,y:1.4,id:w.id+':'+seed,radius:13+rand(520)*8});
 }
 if(owns(16.91,5))breakers.push({x:16.91,z:5,y:1.4,rotation:-Math.PI/2,id:'entry-circuit',radius:15});
 const candidates=[];for(let mz=Math.floor(oz/M);mz<=Math.floor((oz+K)/M);mz++)for(let mx=Math.floor(ox/M);mx<=Math.floor((ox+K)/M);mx++)for(const r of macro(mx,mz).rooms){const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2,roll=l0Hash(mx*711+r.id,mz*919,700);if(owns(x,z)&&roll>.958&&!inside(ref,x,z)&&!inside(furnitureRoom,x,z)&&l0TypeAt(x,z)==='classic')candidates.push({x,z,kind:['sofa','armchair','recliner','bookcase','bureau','diningChair','spindleTable','crt','ovalChair','lamp'][Math.floor(l0Hash(mx+r.id,mz,702)*10)],rotation:l0Hash(mx+r.id,mz,703)*Math.PI*2});}
 const dimensions={sofa:[2.15,.96],armchair:[.96,.94],recliner:[1.02,1.16],bookcase:[.78,.34],bureau:[1.32,.50],diningChair:[.52,.57],spindleTable:[.86,.48],crt:[.66,.58],ovalChair:[.64,.64],lamp:[.46,.46],bin:[.57,.57],pail:[.31,.31]};
 const furnishing=p=>{if(!owns(p.x,p.z))return;const [w,d]=dimensions[p.kind];furniture.push({...p,w,d});};
 for(const p of candidates)if(!walls.some(w=>Math.abs(p.x-w.x)<w.w/2+1.5&&Math.abs(p.z-w.z)<w.d/2+1.5))furnishing(p);
 furnishing({kind:'bin',x:32,z:17.4,rotation:-.15});furnishing({kind:'pail',x:32.55,z:17.3,rotation:.3});
 for(const p of[{kind:'sofa',x:76,z:8,rotation:0},{kind:'armchair',x:78.25,z:8.4,rotation:-.45},{kind:'bookcase',x:73.4,z:7.6,rotation:.05},{kind:'diningChair',x:73.9,z:10.6,rotation:.28},{kind:'bureau',x:75.9,z:5.8,rotation:Math.PI},{kind:'spindleTable',x:78.25,z:10,rotation:0},{kind:'crt',x:76,z:5.8,y:.86,rotation:Math.PI},{kind:'lamp',x:78.25,z:10,y:.65,rotation:0}])furnishing(p);
 if(owns(17.095,8.5))for(let i=0;i<23;i++)outlets.push({x:17.095,z:7+l0Hash(i,17,600)*4,y:.3+l0Hash(i,19,600)*1.75,rotation:Math.PI/2,roll:(l0Hash(i,20,600)-.5)*.5,style:i%5});
 // Ceiling services share a reservation plan. Chunks only store these positions.
 const slot=p=>{p.x=ox+Math.floor((p.x-ox)/1.2)*1.2+.6;p.z=oz+Math.floor((p.z-oz)/.6)*.6+.3;return p;};
 lights.forEach(slot);const occupied=lights.map(p=>({...p,w:1.2,d:.6})),placed=[];
 for(const item of details){const base=slot({...item});for(const [dx,dz]of[[0,0],[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[0,2],[0,-2]]){const p={...base,x:base.x+dx*1.2,z:base.z+dz*.6,rotation:item.kind===1?0:item.rotation},w=item.kind===1||item.kind===4?1.2:.64,d=item.kind===1?.22:item.kind===4?.6:.64;if(p.x-w/2<ox-.001||p.x+w/2>ox+K+.001||p.z-d/2<oz-.001||p.z+d/2>oz+K+.001)continue;if(occupied.some(q=>Math.abs(p.x-q.x)<(w+q.w)/2+.01&&Math.abs(p.z-q.z)<(d+q.d)/2+.01))continue;if(walls.some(q=>Math.abs(p.x-q.x)<(w+q.w)/2&&Math.abs(p.z-q.z)<(d+q.d)/2))continue;placed.push(p);occupied.push({...p,w,d});break;}}
 return{cx,cz,ox,oz,type,revision,walls,pillars,holes,floors,arches,lights,details:placed,puddles,furniture,outlets,mold,breakers,panels};
}
export function l0SolidAt(chunk,x,z,r=.23){for(const w of [...chunk.walls,...chunk.pillars])if(Math.abs(x-w.x)<w.w/2+r&&Math.abs(z-w.z)<w.d/2+r)return true;for(const a of chunk.arches)if(Math.abs(x-a.x)<.13+r&&Math.abs(z-a.z)<a.w/2+r)return true;for(const f of chunk.furniture){if(f.y>.2)continue;const dx=x-f.x,dz=z-f.z,c=Math.cos(f.rotation||0),s=Math.sin(f.rotation||0);if(Math.abs(c*dx-s*dz)<f.w/2+r&&Math.abs(s*dx+c*dz)<f.d/2+r)return true;}return false;}
