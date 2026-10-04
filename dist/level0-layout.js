// The authoritative Level 0 topology: rendering, collision and maps consume this data.
export const L0_CELL = 3.6;
export const L0_N = 6;
export const L0_CHUNK = L0_CELL * L0_N;
export const L0_HEIGHT = 2.72;
export function l0Hash(x,z,s=0) { let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^Math.imul(s|0,1442695041)^0x5eeda017;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296; }
export function l0Type(cx,cz) {
  const fixed={'0,0':'classic','1,0':'arches','0,1':'columns','-1,0':'pits','0,-1':'blackout','2,1':'red'};
  if(fixed[`${cx},${cz}`])return fixed[`${cx},${cz}`];
  if(Math.abs(cx)+Math.abs(cz)<3)return 'classic';
  const r=l0Hash(Math.floor(cx/2),Math.floor(cz/2),401);
  return r<.12?'arches':r<.29?'columns':r<.35?'pits':r<.42?'blackout':r<.46?'red':'classic';
}
export function createL0Chunk(cx,cz,revision=0) {
 const S=L0_CELL,N=L0_N,K=L0_CHUNK,H=L0_HEIGHT,ox=cx*K,oz=cz*K,type=l0Type(cx,cz);
 const rand=(a,b=0)=>l0Hash(cx*971+a,cz*997+b,revision*37+809);
 const furniture=[],walls=[],pillars=[],holes=[],floors=[],arches=[],lights=[],details=[],puddles=[];
 const wx=(x)=>ox+x,wz=(z)=>oz+z;
 const wall=(x,z,w,d,h=H,mat=0,y=h/2)=>walls.push({x:wx(x),z:wz(z),w,d,h,y,mat});
 const pillar=(x,z,w=.42,d=.42)=>pillars.push({x:wx(x),z:wz(z),w,d,h:H,y:H/2,mat:0});
 // Stable perimeter gates align in adjacent chunks; no independently randomized seams.
 for(let i=0;i<N;i++) {
   if(i!==2&&i!==3){wall(i*S+S/2,0,S,.14);wall(0,i*S+S/2,.14,S);}
 }
 if(type==='classic'||type==='blackout'||type==='red') {
  // A spanning tree guarantees reachability. Extra openings create broad, irregular office rooms.
  const edges=new Set(),visited=new Set([0]),stack=[0];
  while(stack.length){const a=stack[stack.length-1],x=a%N,z=Math.floor(a/N),nb=[];
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,b=nz*N+nx;if(nx>=0&&nz>=0&&nx<N&&nz<N&&!visited.has(b))nb.push(b);}
   if(!nb.length){stack.pop();continue;}const b=nb[Math.floor(rand(a+101,visited.size)*nb.length)];edges.add(`${Math.min(a,b)},${Math.max(a,b)}`);visited.add(b);stack.push(b);
  }
  for(let z=0;z<N;z++)for(let x=0;x<N;x++) {
   const a=z*N+x,mat=Math.floor(rand(x+39,z+71)*3);
   if(x<N-1&&!edges.has(`${a},${a+1}`)&&rand(x+57,z+24)>.20)wall((x+1)*S,z*S+S/2,.15,S,H,mat);
   if(z<N-1&&!edges.has(`${a},${a+N}`)&&rand(x+93,z+59)>.20)wall(x*S+S/2,(z+1)*S,S,.15,H,mat);
   if(rand(x+90,z+304)>.92&&!(cx===0&&cz===0&&x===2&&z===2))pillar(x*S+S*.72,z*S+S*.70,.48,.48);
  }
 } else if(type==='columns') {
  for(let z=1;z<6;z++)for(let x=1;x<6;x++)if(!(z===3&&x===3))pillar(x*S+(revision?rand(x,z)*.32:0),z*S,.62,.62);
 } else if(type==='arches') {
  // Raised arched window divider, matching the reference rather than floor-height fantasy doorways.
  for(const row of [2,4])for(let i=0;i<8;i++)arches.push({x:wx(row*S),z:wz(S+(i+.5)*S/2),rotation:Math.PI/2,w:S/2, sill:.91,top:2.31});
  for(const row of [2,4]){pillar(row*S,S*.5,.28,.28);pillar(row*S,S*5.5,.28,.28);}
 } else if(type==='pits') {
  for(let z=1;z<5;z++)for(let x=1;x<5;x++)holes.push({x:wx((x+.5)*S),z:wz((z+.5)*S),w:1.9,d:1.9});
 }
 // Tile-sized floor patches retain continuous world UVs, and genuinely omit pit centers.
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const px=wx((x+.5)*S),pz=wz((z+.5)*S),hole=holes.find(h=>h.x===px&&h.z===pz);
  if(!hole)floors.push({x:px,z:pz,w:S,d:S});
  else {const rim=(S-hole.w)/2;floors.push({x:px-(S+hole.w)/4,z:pz,w:rim,d:S},{x:px+(S+hole.w)/4,z:pz,w:rim,d:S},{x:px,z:pz-(S+hole.d)/4,w:hole.w,d:rim},{x:px,z:pz+(S+hole.d)/4,w:hole.w,d:rim});}
  if((x+z)%2===0||rand(x+351,z)>.78)lights.push({x:px,z:pz,on:type!=='blackout'&&rand(x+509,z)>.07,phase:rand(x+290,z)*6.28});
  const dr=rand(x+881,z+64);if(dr<.17)details.push({x:px+S*.23,z:pz+S*.21,kind:Math.floor(rand(x+712,z)*4),rotation:rand(x+813,z)>.5?0:Math.PI/2});
  else if(dr<.192)details.push({x:px+S*.19,z:pz+S*.15,kind:4,rotation:0});
  else if(dr<.214)details.push({x:px-S*.22,z:pz-S*.22,kind:5,rotation:rand(x+931,z)*6.28});
  if(!hole&&type!=='columns'&&rand(x+772,z)>.76)puddles.push({x:px+rand(x+774,z)-.5,z:pz+rand(x+775,z)-.5,w:1+rand(x+779,z)*2.2,d:.6+rand(x+778,z)*1.6,phase:rand(x+781,z)*6.28});
 }
 if(l0Hash(cx,cz,54)<.17&&type!=='pits'){furniture.push({x:ox+S*.45,z:oz+S*.45,w:1.12,d:.55,kind:'desk'},{x:ox+S*.45,z:oz+S*.45+1.05,w:.45,d:.48,kind:'chair'});}
 return {cx,cz,ox,oz,type,revision,furniture,walls,pillars,holes,floors,arches,lights,details,puddles};
}
export function l0SolidAt(chunk,x,z,r=.23){
 for(const w of [...chunk.walls,...chunk.pillars,...chunk.furniture])if(Math.abs(x-w.x)<w.w/2+r&&Math.abs(z-w.z)<w.d/2+r)return true;
 for(const a of chunk.arches)if(Math.abs(x-a.x)<.13+r&&Math.abs(z-a.z)<a.w/2+r)return true;
 return false;
}
