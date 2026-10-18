// V132-traffic core (pure logic, no three.js): slow driverless city cars on the L11 grid, hashed traffic-signal phases,
// stop lines, car following and a forward braking cone for the player. City coordinates (urban-layout: x/z, block 112 m,
// roads centred on block edges, half width 7.5 m). Right-hand traffic in the inner lane (1.7 m off the double yellow);
// the outer lane is the parking strip. Only simulated near the player (spawn 50–115 m out, removed past 130 m).
import {canalBlock} from './canal128-layout.js?v=128';
export const T132={B:112,LANE:1.7,BOX:7.5,STOP:17.2,CYCLE:36,SPAWN_MIN:50,SPAWN_MAX:115,DESPAWN:130,COUNT:9,
 VMIN:15/3.6,VMAX:25/3.6,CONE_LEN:7.5,CONE_TAN:.36,CONE_PAD:.45,PLAYER_GAP:1.3,CAR_GAP:2.2,DEC:2.6,AMAX:1.6,DMAX:9};
const{B,LANE,BOX}=T132;
export const hash132=(a,b=0,c=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(c|0,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return(h>>>0)/4294967296;};
// Authored / reserved blocks keep their own streets (urban-layout cityBlockPlan); open canal blocks lose their N-S roads.
export const reserved132=(ix,iz)=>(ix===1&&iz===2)||((ix===-1||ix===0)&&iz>=-3&&iz<4);
const segZ=(k,j)=>!reserved132(k-1,j)&&!reserved132(k,j)&&!canalBlock(k-1,j)&&!canalBlock(k,j);   // road x=k*B, z in [j*B,(j+1)*B]
const segX=(k,j)=>!reserved132(k,j-1)&&!reserved132(k,j);                                           // road z=j*B, x in [k*B,(k+1)*B]
// Can a car leave node (k,j) heading h ([hx,hz] unit axis vector)?
export function exitOK(k,j,h){return h[1]>0?segZ(k,j):h[1]<0?segZ(k,j-1):h[0]>0?segX(k,j):segX(k-1,j);}
const right=h=>[-h[1],h[0]];
export const axisOf=h=>h[1]!==0?'z':'x';
// Signal state at node (k,j) for an axis at time t (s): 'g' | 'y' | 'r'. N-S green 0–14, yellow 14–17, all red, E-W 18–32/32–35.
export function signal132(k,j,axis,t){const p=((t+hash132(k,j,7)*T132.CYCLE)%T132.CYCLE+T132.CYCLE)%T132.CYCLE;
 if(axis==='z')return p<14?'g':p<17?'y':'r';return p>=18&&p<32?'g':p>=32&&p<35?'y':'r';}
// ---- pieces: straight (lane between two junction boxes) and junction (straight 15 m or quadratic Bézier turn)
function straight(k,j,h){const r=right(h),nx=k*B,nz=j*B,p0=[nx+h[0]*BOX+r[0]*LANE,nz+h[1]*BOX+r[1]*LANE],len=B-2*BOX;
 return{kind:'s',k,j,h,to:[k+h[0],j+h[1]],p0,len,stop:len-(T132.STOP-BOX),at(d,o){o.x=p0[0]+h[0]*d;o.z=p0[1]+h[1]*d;o.hx=h[0];o.hz=h[1];return o;}};}
function junction(k,j,hi,ho){const ri=right(hi),ro=right(ho),nx=k*B,nz=j*B,P0=[nx-hi[0]*BOX+ri[0]*LANE,nz-hi[1]*BOX+ri[1]*LANE],P1=[nx+ho[0]*BOX+ro[0]*LANE,nz+ho[1]*BOX+ro[1]*LANE];
 if(hi[0]===ho[0]&&hi[1]===ho[1])return{kind:'j',k,j,h:ho,hi,len:2*BOX,at(d,o){o.x=P0[0]+hi[0]*d;o.z=P0[1]+hi[1]*d;o.hx=hi[0];o.hz=hi[1];return o;}};
 const C=[nx+LANE*(ri[0]+ro[0]),nz+LANE*(ri[1]+ro[1])],N=24,ts=[0],ls=[0];const q=t=>[(1-t)*(1-t)*P0[0]+2*(1-t)*t*C[0]+t*t*P1[0],(1-t)*(1-t)*P0[1]+2*(1-t)*t*C[1]+t*t*P1[1]];
 let prev=P0,L=0;for(let i=1;i<=N;i++){const t=i/N,p=q(t);L+=Math.hypot(p[0]-prev[0],p[1]-prev[1]);ts.push(t);ls.push(L);prev=p;}
 return{kind:'j',k,j,h:ho,hi,len:L,turn:ho[0]===-hi[1]&&ho[1]===hi[0]?'R':'L',at(d,o){let i=1;while(i<N&&ls[i]<d)i++;const f=Math.min(1,Math.max(0,(d-ls[i-1])/((ls[i]-ls[i-1])||1))),t=ts[i-1]+(ts[i]-ts[i-1])*f,p=q(t);
  const dx=2*(1-t)*(C[0]-P0[0])+2*t*(P1[0]-C[0]),dz=2*(1-t)*(C[1]-P0[1])+2*t*(P1[1]-C[1]),m=Math.hypot(dx,dz)||1;o.x=p[0];o.z=p[1];o.hx=dx/m;o.hz=dz/m;return o;}};}
// Choose the move at the node the straight piece s arrives at: straight .6, right .25, left .15 among open exits.
function chooseTurn(s,seed){const[k,j]=s.to,h=s.h,r=right(h),opts=[[h,.6],[r,.25],[[-r[0],-r[1]],.15]].filter(([e])=>exitOK(k,j,e));
 if(!opts.length)return null;let u=hash132(seed,k*31+j,h[0]*3+h[1]+5)*opts.reduce((a,o)=>a+o[1],0);for(const[e,w]of opts){if((u-=w)<=0)return e;}return opts[0][0];}
let SEQ=1;
// Car: {id,model,L,W,v,vmax,pieces,d,x,z,hx,hz,dead}
export function makeCar132(k,j,h,d,model,seed){const s=straight(k,j,h),car={id:SEQ++,seed,model:model.id,paint:model.paint,L:model.L,W:model.W,v:0,vmax:T132.VMIN+hash132(seed,3)*(T132.VMAX-T132.VMIN),pieces:[s],d,x:0,z:0,hx:h[0],hz:h[1],stopReason:''};
 car.v=car.vmax*.8;extend(car);place(car);return car;}
function extend(car){while(car.pieces.length<3){const last=car.pieces.at(-1);if(last.kind==='s'){if(last.dead)return;const e=chooseTurn(last,car.seed+car.pieces.length*7+last.k*13+last.j*17);if(!e){last.dead=true;return;}car.pieces.push(junction(last.to[0],last.to[1],last.h,e));}
 else car.pieces.push(straight(last.k,last.j,last.h));}}
const tmp={};function place(car){const p=car.pieces[0].at(car.d,tmp);car.x=p.x;car.z=p.z;car.hx=p.hx;car.hz=p.hz;}
// One step. player = {x,z} city coords (or null). t = signal clock (s).
export function step132(cars,player,t,dt){
 for(const c of cars){let stop=Infinity,why='';const p0=c.pieces[0],front=c.d+c.L/2;
  // 1) stop line: red, late yellow, or a dead end (no open exit)
  if(p0.kind==='s'&&front<=p0.stop+.3){const toLine=p0.stop-front;if(p0.dead){stop=toLine;why='end';}else{const s=signal132(p0.to[0],p0.to[1],axisOf(p0.h),t);if(s==='r'||(s==='y'&&toLine>c.v*c.v/(2*T132.DEC)+.6)){stop=toLine;why='signal';}}}
  // 1b) a left turn waits at the line while oncoming traffic still has to clear the node
  if(p0.kind==='s'&&!p0.dead&&c.pieces[1]?.turn==='L'&&front<=p0.stop+.3&&stop>p0.stop-front){const nx=p0.to[0]*T132.B,nz=p0.to[1]*T132.B;
   for(const o of cars){if(o===c||o.hx*c.hx+o.hz*c.hz>-.7)continue;const op=o.pieces[0],inJ=op.kind==='j'&&op.k===p0.to[0]&&op.j===p0.to[1];if(!inJ&&(o.v<.5||o.pieces[1]?.turn==='L'))continue;if(inJ&&op.turn==='L')continue;const dx=nx-o.x,dz=nz-o.z;if(Math.hypot(dx,dz)<45&&dx*o.hx+dz*o.hz>-9){stop=p0.stop-front;why='yield';break;}}}
  const rx=-c.hz,rz=c.hx;
  // 2) car ahead (any car in my path box; crossing conflicts resolved by id)
  for(const o of cars){if(o===c)continue;const dx=o.x-c.x,dz=o.z-c.z,al=dx*c.hx+dz*c.hz,lat=dx*rx+dz*rz;if(al<=0||al>30)continue;
   if(Math.abs(lat)>(c.W+o.W)/2*.55+.6)continue;const same=c.hx*o.hx+c.hz*o.hz;if(same<.3&&c.id<o.id&&al>(c.L+o.L)/2+.3)continue;
   const g=al-(c.L+o.L)/2-T132.CAR_GAP;if(g<stop){stop=g;why='car';}}
  // 3) player braking cone: 7.5 m ahead of the bumper, widening at tan≈20°
  if(player){const dx=player.x-c.x,dz=player.z-c.z,ah=dx*c.hx+dz*c.hz-c.L/2,lat=dx*rx+dz*rz;
   if(ah>-.4&&ah<T132.CONE_LEN&&Math.abs(lat)<c.W/2+T132.CONE_PAD+Math.max(0,ah)*T132.CONE_TAN){const g=ah-T132.PLAYER_GAP;if(g<stop){stop=g;why='player';}}}
  // Smooth stop: once above the comfortable profile sqrt(2·DEC·s), brake at the constant rate that ends exactly at s.
  const sd=Math.max(0,stop),target=stop===Infinity?c.vmax:sd<=.05?0:Math.min(c.vmax,Math.sqrt(2*T132.DEC*sd));
  const a=c.v>target&&stop!==Infinity?-Math.min(T132.DMAX,Math.max(c.v*c.v/(2*Math.max(sd,.02)),.5)):Math.max(-T132.DMAX,Math.min(T132.AMAX,(target-c.v)/.6));c.v=Math.max(0,c.v+a*dt);
  let move=c.v*dt;if(stop!==Infinity&&move>Math.max(0,stop)){move=Math.max(0,stop);if(stop<=.05)c.v=0;}
  c.stopReason=c.v<.05?why:'';c.d+=move;
  while(c.d>c.pieces[0].len&&c.pieces.length>1){c.d-=c.pieces[0].len;c.pieces.shift();extend(c);}
  if(c.d>c.pieces[0].len)c.d=c.pieces[0].len;place(c);
 }
}
// Spawn candidates: random open lane near the player, 50–115 m away, at least 14 m from any car in that lane.
export function trySpawn132(cars,player,rand,pickModel){
 for(let tries=0;tries<12;tries++){const k=Math.round(player.x/B)+Math.floor(rand()*5)-2,j=Math.round(player.z/B)+Math.floor(rand()*5)-2,hs=[[0,1],[0,-1],[1,0],[-1,0]],h=hs[Math.floor(rand()*4)];
  if(!exitOK(k,j,h))continue;const s=straight(k,j,h),d=4+rand()*(s.stop-8),pt=s.at(d,{});const dist=Math.hypot(pt.x-player.x,pt.z-player.z);if(dist<T132.SPAWN_MIN||dist>T132.SPAWN_MAX)continue;
  if(cars.some(o=>Math.hypot(o.x-pt.x,o.z-pt.z)<14))continue;const seed=Math.floor(rand()*1e9),m=pickModel(seed);return makeCar132(k,j,h,d,m,seed);}
 return null;}
export function cull132(cars,player){return cars.filter(c=>Math.hypot(c.x-player.x,c.z-player.z)<=T132.DESPAWN&&!(c.pieces[0].dead&&c.stopReason==='end'&&Math.hypot(c.x-player.x,c.z-player.z)>40));}
