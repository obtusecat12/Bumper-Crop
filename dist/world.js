// Infinite signed BigInt cells with deterministic seed-based generation.
export const CHUNK=64;
export const mod=(n,m)=>((n%m)+m)%m;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
export function stringSeed(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export function chunkSeed(x,z,seed){return stringSeed(`${seed}:${x}:${z}`)}
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function periodOrigin(index){return Number(mod(index,1024n))*CHUNK}
export function height(x,z,cx=0n,cz=0n){const a=x+periodOrigin(cx),b=z+periodOrigin(cz),p=Math.PI*2/65536;return Math.sin(a*p*256)*.22+Math.cos(b*p*128)*.20+Math.sin((a+b)*p*64)*.27}
const SIZES=[[7,9,3],[2.8,3.2,2.7],[12,17,4.9],[13,19,5.1],[11,15,4.3],[13,9,3.7],[13,18,3.8],[8,11,3.2]];
export const BUILDING_NAMES=['风化木棚','旧外屋','红色谷仓','折线顶谷仓','砖砌谷仓','农具棚','空马厩','斜顶仓房'];
export function buildingSize(f){return SIZES[f.variant%8].map(v=>v*(f.buildingScale||1))}
export function buildingLocal(x,z,f){const a=f.buildingAngle||0,dx=x-f.cx,dz=z-f.cz;return {x:Math.cos(a)*dx-Math.sin(a)*dz,z:Math.sin(a)*dx+Math.cos(a)*dz}}
function landmark(x,z,seed){if(x===0n&&z===0n)return {type:'building',rank:0};if(x===-1n&&z===0n)return {type:'pond',rank:0};const r=random(chunkSeed(x,z,seed)^0x88aa72),v=r();return {type:v<.075?'pond':v<.13?'building':'wheat',rank:r()}}
function hasBuilding(x,z,seed,rank){if(x===0n&&z===0n)return true;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dz)continue;const other=landmark(x+BigInt(dx),z+BigInt(dz),seed);if(other.type==='building'&&other.rank<=rank)return false}return true}
function lane(axis,index,segment,seed,edge){const line=random(stringSeed(`${seed}:lane:${axis}:${index}`)),enabled=index===0n||line()<(axis==='x'?.76:.41),r=random(stringSeed(`${seed}:curve:${axis}:${index}:${segment}`));return {axis,edge,enabled,amplitude:(r()-.5)*1.1,harmonic:(r()-.5)*.32}}
export function laneOffset(l,t){return l.amplitude*Math.sin(Math.PI*t/64)+l.harmonic*Math.sin(Math.PI*t/32)}
export function roadSample(x,z,f,includeDrive=true){let distance=1e4,along=0;if(!f?.roads)return {distance:Math.min(x,64-x,z,64-z),along:z};for(const l of f.roads){if(!l.enabled)continue;const t=l.axis==='x'?z:x,d=Math.abs((l.axis==='x'?x:z)-l.edge-laneOffset(l,t));if(d<distance){distance=d;along=t}}
 if(includeDrive&&f.driveway){const d=f.driveway,vx=d.x2-d.x1,vz=d.z2-d.z1,len=Math.hypot(vx,vz),t=clamp(((x-d.x1)*vx+(z-d.z1)*vz)/(len*len),0,1),q=Math.hypot(x-d.x1-vx*t,z-d.z1-vz*t);if(q<distance){distance=q;along=t*len}}
 return {distance,along};}
export function roadDistance(x,z,f){return roadSample(x,z,f).distance}
export function roadRelief(x,z,f){
 const profile=({distance:d,along:t})=>{
  if(d>1.6)return 0;
  // Shallow compressed earth, with changing rut width/depth instead of embossed
  // tractor-tread ridges. Every phase closes at cell boundaries.
  const phase=t*Math.PI/32,width=.225+.012*Math.sin(phase*3)+.006*Math.sin(phase*7);
  const depth=.081+.011*Math.sin(phase*2)+.007*Math.sin(phase*5);
  return -depth*Math.exp(-(((d-.77)/width)**2))+.018*Math.exp(-((d/.36)**2));
 };
 const plain=profile(roadSample(x,z,f,false));if(!f.driveway)return plain;
 const a=smooth(0,1.6,Math.min(x,z,64-x,64-z));return plain*(1-a)+profile(roadSample(x,z,f))*a;
}
export function pondRadius(f,a){const p=f.shorePhase||0;return 1+(f.shoreAmplitude||.075)*(.60*Math.sin(3*a+p)+.28*Math.sin(5*a-p*.7)+.12*Math.sin(9*a+p*1.7))}
export function pondPoint(f,a,scale=1){const r=pondRadius(f,a)*scale,u=Math.cos(a)*f.rx*r,v=Math.sin(a)*f.rz*r,c=Math.cos(f.angle||0),s=Math.sin(f.angle||0);return {x:f.cx+c*u+s*v,z:f.cz-s*u+c*v}}
export function pondDistance(x,z,f){const c=Math.cos(f.angle||0),s=Math.sin(f.angle||0),dx=x-f.cx,dz=z-f.cz,u=(c*dx-s*dz)/f.rx,v=(s*dx+c*dz)/f.rz;return Math.hypot(u,v)/pondRadius(f,Math.atan2(v,u))}
export function surfaceHeight(x,z,f){let y=height(x,z,f.x,f.z);if(f.type==='pond'){const d=pondDistance(x,z,f),water=f.lakeY;if(d<=1)return water-.045*(1-smooth(.96,1,d))-(f.depth||1.7)*smooth(0,.92,1-d);if(d<1.42){const t=clamp((d-1)/.42,0,1),rise=smooth(1,1.42,d);return water+(y-water)*rise+Math.sin(t*Math.PI)*(.20+.32*f.hill)}}
 if(f.type==='building'){const p=buildingLocal(x,z,f),[w,d]=buildingSize(f),edge=Math.max(Math.abs(p.x)-w/2,Math.abs(p.z)-d/2),a=smooth(.2,3.3,edge);y=(f.buildingY-.04)*(1-a)+y*a}return y+roadRelief(x,z,f);}
export function inClearing(x,z,f){if(f.type==='pond')return pondDistance(x,z,f)<1.39;if(f.type==='building'){const p=buildingLocal(x,z,f),[w,d]=buildingSize(f);return Math.abs(p.x)<w/2+3.4&&Math.abs(p.z)<d/2+4.3}return false}
function vegetationCover(f){const buckets=new Map();for(const t of [...f.trees.map(t=>({x:t.x,z:t.z,r:1.15*t.scale})),...f.shrubs.map(s=>({x:s.x,z:s.z,r:s.width*s.scale*.46}))]){for(let z=Math.floor((t.z-t.r)/4);z<=Math.floor((t.z+t.r)/4);z++)for(let x=Math.floor((t.x-t.r)/4);x<=Math.floor((t.x+t.r)/4);x++){const key=z*17+x;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(t)}}f.cover=buckets}
function addVegetation(f,r){const valid=(x,z,margin=0)=>x>2.5&&x<61.5&&z>2.5&&z<61.5&&roadDistance(x,z,f)>2.7+margin&&!inClearing(x,z,f),addTree=(x,z,v,scale)=>{if(!valid(x,z))return;f.trees.push({x,z,variant:v,scale,rotation:r()*Math.PI*2,seed:Math.floor(r()*4294967296)})};const mode=r();f.vegetationMode=mode<.021?'windbreak':mode<.080?'grove':'scattered';
 if(f.vegetationMode==='windbreak'){const side=r()<.5,offset=6+r()*5,v=r()<.7?5:1;for(let i=0;i<10;i++)for(let row=0;row<(r()<.23?2:1);row++){const t=9+i*4.4+(r()-.5)*.9;addTree(side?offset+row*3.4:t,side?t:offset+row*3.4,v,.75+r()*.35)}}
 else if(f.vegetationMode==='grove'){const gx=12+r()*39,gz=12+r()*39,n=7+Math.floor(r()*5),v=Math.floor(r()*5);for(let i=0;i<n;i++){const a=i*2.399+r()*.6,rad=2+Math.sqrt(r())*6;addTree(gx+Math.cos(a)*rad,gz+Math.sin(a)*rad,r()<.72?v:Math.floor(r()*6),.62+r()*.55)}}
 else{const n=r()<.36?0:1+Math.floor(r()*3);for(let i=0;i<n;i++){const side=r()<.5;addTree(side?4+r()*5:8+r()*48,side?8+r()*48:4+r()*5,Math.floor(r()*6),.67+r()*.65)}}
 // Broken, mixed living field boundaries, never continuous invisible walls.
 for(const axis of ['x','z']){if(r()<.17)continue;const gap=16+r()*31,baseWidth=1.55+r()*.65,dominant=Math.floor(r()*4),offset=3.2+r()*.8;for(let t=6+r()*2;t<60;t+=1.4+r()*.9){if(Math.abs(t-gap)<2.4||r()<.10)continue;const x=axis==='x'?offset+.25*Math.sin(t*.19):t,z=axis==='z'?offset+.25*Math.sin(t*.19):t;if(!valid(x,z,-.65))continue;f.shrubs.push({x,z,width:baseWidth*(.85+r()*.25),scale:.82+r()*.28,rotation:r()*6.283,variant:r()<.70?dominant:Math.floor(r()*4),seed:Math.floor(r()*4294967296)})}}
 vegetationCover(f);
}
export function field(x,z,seed){const cs=chunkSeed(x,z,seed),r=random(cs^0x127abab),candidate=landmark(x,z,seed);let type=candidate.type;if(type==='building'&&!hasBuilding(x,z,seed,candidate.rank))type='wheat';const small=r()<.56,variant=small?[0,1,7][Math.floor(r()*3)]:[2,3,4,5,6][Math.floor(r()*5)],f={key:`${x},${z}`,x,z,type,variant,cx:18+r()*28,cz:18+r()*28,rx:7+r()**.65*13,rz:5+r()**.75*10,seed:cs,tint:r(),trees:[],shrubs:[],angle:(r()-.5)*Math.PI,shorePhase:r()*6.283,shoreAmplitude:.045+r()*.065,hill:r(),depth:1+r()*1.7,buildingScale:.85+r()*.29};
 f.roads=[lane('x',x,z,seed,0),lane('x',x+1n,z,seed,64),lane('z',z,x,seed,0),lane('z',z+1n,x,seed,64)];
 if(type==='pond'){if(x===-1n&&z===0n){f.rx=19;f.rz=12;f.angle=-.24;f.shoreAmplitude=.063;f.hill=.74}const ex=Math.hypot(f.rx*Math.cos(f.angle),f.rz*Math.sin(f.angle))*1.54,ez=Math.hypot(f.rx*Math.sin(f.angle),f.rz*Math.cos(f.angle))*1.54;f.cx=32+(r()-.5)*Math.max(0,58-ex*2);f.cz=32+(r()-.5)*Math.max(0,58-ez*2);f.lakeY=height(f.cx,f.cz,x,z)-.48}
 if(type==='building'){if(x===0n&&z===0n){f.variant=2;f.cx=32;f.cz=27;f.buildingScale=.96}const endpoints=f.roads.filter(l=>l.enabled).map(l=>l.axis==='x'?{x:clamp(l.edge+laneOffset(l,f.cz),0,64),z:f.cz}:{x:f.cx,z:clamp(l.edge+laneOffset(l,f.cx),0,64)}).sort((a,b)=>Math.hypot(a.x-f.cx,a.z-f.cz)-Math.hypot(b.x-f.cx,b.z-f.cz));
 const target=x===0n&&z===0n?{x:0,z:29}:(endpoints[0]||{x:Math.max(4,f.cx-11),z:Math.min(60,f.cz+14)});f.buildingAngle=Math.atan2(target.x-f.cx,target.z-f.cz)+(r()-.5)*.45;if(x===0n&&z===0n)f.buildingAngle=-Math.PI*.45;const [w,d]=buildingSize(f),dist=d/2+3.1;f.buildingY=height(f.cx,f.cz,x,z)+.04;f.driveway={x1:f.cx+Math.sin(f.buildingAngle)*dist,z1:f.cz+Math.cos(f.buildingAngle)*dist,x2:target.x,z2:target.z}}
 addVegetation(f,r);return f;
}
export function wheatAllowed(x,z,f){if(x<.3||z<.3||x>63.7||z>63.7||roadDistance(x,z,f)<2.05||inClearing(x,z,f))return false;for(const p of f.cover?.get(Math.floor(z/4)*17+Math.floor(x/4))||[])if(Math.hypot(x-p.x,z-p.z)<p.r)return false;return true}
export function wheatCandidates(f,count=10800){const r=random(f.seed^0x734821),items=[];for(let i=0;i<count;i++){const x=.6+r()*62.8,z=.6+r()*62.8,s=.78+r()*.37,a=r()*6.283,t=r();if(wheatAllowed(x,z,f))items.push({x,z,s,a,t,i})}return items}
function resolveBox(position,radius,c){const nx=clamp(position.x,c.x1,c.x2),nz=clamp(position.z,c.z1,c.z2),dx=position.x-nx,dz=position.z-nz,d=Math.hypot(dx,dz);if(d>0&&d<radius){position.x=nx+dx/d*radius;position.z=nz+dz/d*radius}else if(d===0){const options=[{d:position.x-c.x1,axis:'x',v:c.x1-radius},{d:c.x2-position.x,axis:'x',v:c.x2+radius},{d:position.z-c.z1,axis:'z',v:c.z1-radius},{d:c.z2-position.z,axis:'z',v:c.z2+radius}];options.sort((a,b)=>a.d-b.d);position[options[0].axis]=options[0].v}}
export function resolveSolid(position,radius,colliders){for(const c of colliders){if(c.kind==='circle'){let dx=position.x-c.x,dz=position.z-c.z,dist=Math.hypot(dx,dz),min=radius+c.r;if(dist<min){if(dist<.00001){dx=1;dz=0;dist=1}position.x=c.x+dx/dist*min;position.z=c.z+dz/dist*min}}
 else if(c.kind==='obb'){const co=Math.cos(c.angle),si=Math.sin(c.angle),dx=position.x-c.x,dz=position.z-c.z,p={x:co*dx-si*dz,z:si*dx+co*dz};resolveBox(p,radius,{x1:-c.hx,x2:c.hx,z1:-c.hz,z2:c.hz});position.x=c.x+co*p.x+si*p.z;position.z=c.z-si*p.x+co*p.z}else if(c.kind==='box')resolveBox(position,radius,c)}return position}
export function vegetationDrag(position,volumes){let drag=0;for(const v of volumes||[]){const d=Math.hypot(position.x-v.x,position.z-v.z);if(d<v.r)drag=Math.max(drag,(v.drag||.2)*(1-d/v.r))}return drag}
export function rebase(state){let dx=0,dz=0;while(state.x<0){state.x+=CHUNK;dx--}while(state.x>=CHUNK){state.x-=CHUNK;dx++}while(state.z<0){state.z+=CHUNK;dz--}while(state.z>=CHUNK){state.z-=CHUNK;dz++}state.cx+=BigInt(dx);state.cz+=BigInt(dz);return {dx,dz}}
