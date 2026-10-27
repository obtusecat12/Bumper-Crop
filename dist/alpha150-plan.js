// Alpha design scale (not an official survey). All bounds, rendering and collision share this plan.
export const ALPHA150 = Object.freeze({width:300,depth:260,chunk:24,height:3.4,wall:.22,
 exterior:{x0:640,x1:940,z0:-640,z1:-380},
 entry:{x:4,z:185,yaw:-Math.PI/2},exit:{x:1.1,z:185,yaw:Math.PI/2},
 gate:{x:640,z:-455,approachX:636.8,approachZ:-455},
 source:'https://backrooms-wiki-cn.wikidot.com/base-alpha'});
export const ALPHA_ZONES150 = Object.freeze([
 {id:'exploration',name:'探险署',code:'EX',x:8,z:8,w:94,d:122,color:'#64746d',roomNames:['无线电控制室','任务会议室','装备储藏室','干员休息室']},
 {id:'administration',name:'行政署',code:'AD',x:130,z:8,w:76,d:46,color:'#8c9274',roomNames:['登记大厅','行政办公室','报告会议室','物资分拣室']},
 {id:'archives',name:'档案署',code:'AR',x:108,z:60,w:32,d:44,color:'#a18d62',roomNames:['档案工位','纸档库','技术支援室']},
 {id:'research',name:'研究署',code:'RE',x:146,z:60,w:98,d:44,color:'#859a99',roomNames:['生物实验室','研究办公室','样本储藏室']},
 {id:'anemoia',name:'爱念陌异区',code:'AN',x:212,z:8,w:80,d:46,color:'#7a8da3',roomNames:['生活单元']},
 {id:'scarlet',name:'猩红区',code:'SC',x:108,z:110,w:106,d:54,color:'#986e70',roomNames:['生活单元']},
 {id:'pioneer',name:'先驱区',code:'PI',x:50,z:170,w:108,d:50,color:'#9c8e75',roomNames:['生活单元']},
 {id:'zephyr',name:'西风区',code:'ZE',x:164,z:170,w:50,d:68,color:'#768e83',roomNames:['生活单元']},
 {id:'laevo',name:'莱沃区',code:'LA',x:220,z:110,w:50,d:110,color:'#7b8797',roomNames:['生活单元']},
 {id:'expansion',name:'南部扩建',code:'SO',x:164,z:244,w:50,d:14,color:'#ae965d',roomNames:[]}
]);
export const ALPHA_ROOMS150=[];
for(const zone of ALPHA_ZONES150){
 if(!zone.roomNames.length)continue;
 const cols=Math.max(1,Math.floor(zone.w/24)),rows=Math.max(1,Math.floor(zone.d/22));
 const cellW=zone.w/cols,cellD=zone.d/rows;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const n=j*cols+i;
  ALPHA_ROOMS150.push({id:`${zone.id}-${String(n+1).padStart(2,'0')}`,zone:zone.id,
   name:zone.roomNames[n%zone.roomNames.length],x:zone.x+i*cellW+2,z:zone.z+j*cellD+2,
   w:cellW-4,d:cellD-4,door:2.4,head:2.55,height:ALPHA150.height});
 }
}
export function zoneAt150(x,z){return ALPHA_ZONES150.find(a=>x>=a.x&&x<=a.x+a.w&&z>=a.z&&z<=a.z+a.d);}
export function roomAt150(x,z){return ALPHA_ROOMS150.find(a=>x>a.x&&x<a.x+a.w&&z>a.z&&z<a.z+a.d);}
export const ALPHA_WALLS150=[];
function wall(id,x,z,w,d,h=ALPHA150.height,y=0){ALPHA_WALLS150.push({id,x,z,w,d,h,y});}
const W=ALPHA150.width,D=ALPHA150.depth,t=ALPHA150.wall;
wall('perimeter-n',W/2,t/2,W,t);wall('perimeter-s',W/2,D-t/2,W,t);
wall('perimeter-e',W-t/2,D/2,t,D);
wall('perimeter-w-n',t/2,91,t,182);wall('perimeter-w-s',t/2,224,t,72);
wall('west-link-n',25,179,50,t);wall('west-link-s',25,191,50,t);
wall('west-door',t/2,185,.28,6,2.7);wall('west-header',t/2,185,.32,6,.7,2.7);
for(const r of ALPHA_ROOMS150){
 const x=r.x,z=r.z,w=r.w,d=r.d,leaf=(w-r.door)/2;
 wall(r.id+'-n',x+w/2,z,w,t);wall(r.id+'-w',x,z+d/2,t,d);wall(r.id+'-e',x+w,z+d/2,t,d);
 wall(r.id+'-s0',x+leaf/2,z+d,leaf,t);wall(r.id+'-s1',x+w-leaf/2,z+d,leaf,t);
 wall(r.id+'-header',x+w/2,z+d,r.door,t,r.height-r.head,r.head);
}
export function insideAlpha150(x,z,r=0){return x>=r&&x<=W-r&&z>=r&&z<=D-r;}
export function alphaBlocked150(x,z,r=.25){
 if(!insideAlpha150(x,z,r))return true;
 return ALPHA_WALLS150.some(a=>a.y<1.8&&Math.abs(x-a.x)<a.w/2+r&&Math.abs(z-a.z)<a.d/2+r);
}
export function alphaHead150(x,z,r=.25){
 let top=ALPHA150.height;
 for(const a of ALPHA_WALLS150)if(a.y>1.8&&Math.abs(x-a.x)<a.w/2+r&&Math.abs(z-a.z)<a.d/2+r)top=Math.min(top,a.y);
 return top;
}
export function alphaSafe150(x,z){
 x=Math.max(.7,Math.min(W-.7,x));z=Math.max(.7,Math.min(D-.7,z));
 for(let radius=0;radius<=20;radius+=.5)for(let k=0;k<(radius?24:1);k++){
  const a=k/24*Math.PI*2,px=x+Math.cos(a)*radius,pz=z+Math.sin(a)*radius;
  if(!alphaBlocked150(px,pz,.45))return{x:px,z:pz};
 }
 return{x:ALPHA150.entry.x,z:ALPHA150.entry.z};
}
export function inAlphaExterior150(x,z,r=0){const b=ALPHA150.exterior;return x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r;}
export function exteriorApproach150(x,z){return x>628&&x<641&&Math.abs(z-ALPHA150.gate.z)<4;}
export function exteriorSafe150(x,z,r=.5){
 if(!inAlphaExterior150(x,z,r))return{x,z};
 const b=ALPHA150.exterior,q=[{x:b.x0-r,z},{x:b.x1+r,z},{x,z:b.z0-r},{x,z:b.z1+r}];
 q.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));return q[0];
}
export const ALPHA_CHUNKS150=[];
for(let z=0;z<D;z+=ALPHA150.chunk)for(let x=0;x<W;x+=ALPHA150.chunk){const w=Math.min(ALPHA150.chunk,W-x),d=Math.min(ALPHA150.chunk,D-z);ALPHA_CHUNKS150.push({id:`${x/24}:${z/24}`,x,z,w,d,cx:x+w/2,cz:z+d/2});}
export function chunkAt150(x,z){return ALPHA_CHUNKS150.find(c=>x>=c.x&&x<c.x+c.w&&z>=c.z&&z<c.z+c.d);}
// JSON-only descriptions are built in a Worker; Three resources are allocated in bounded main-thread batches.
export function describeChunk150(id){
 const c=ALPHA_CHUNKS150.find(c=>c.id===id);if(!c)throw Error('Unknown Alpha chunk '+id);
 const boxes=[],rooms=new Set();
 const box=(kind,x,y,z,w,h,d,roomId=null)=>{boxes.push({kind,x,y,z,w,h,d,roomId});if(roomId)rooms.add(roomId);};
 box('floor',c.cx,-.09,c.cz,c.w,.18,c.d);box('ceiling',c.cx,3.49,c.cz,c.w,.18,c.d);
 for(const a of ALPHA_WALLS150){
  const x0=Math.max(c.x,a.x-a.w/2),x1=Math.min(c.x+c.w,a.x+a.w/2),z0=Math.max(c.z,a.z-a.d/2),z1=Math.min(c.z+c.d,a.z+a.d/2);
  if(x1-x0<.001||z1-z0<.001)continue;
  const roomId=ALPHA_ROOMS150.find(r=>a.id.startsWith(r.id+'-'))?.id||null;
  box(a.id==='west-door'?'gate':'wall',(x0+x1)/2,a.y+a.h/2,(z0+z1)/2,x1-x0,a.h,z1-z0,roomId);
  if(a.y===0&&a.id!=='west-door')box('skirt',(x0+x1)/2,.1,(z0+z1)/2,x1-x0+.012,.2,z1-z0+.012,roomId);
 }
 for(const r of ALPHA_ROOMS150)if(r.x<c.x+c.w&&r.x+r.w>c.x&&r.z<c.z+c.d&&r.z+r.d>c.z)rooms.add(r.id);
 // Each emitter belongs to exactly one half-open chunk; no lights are created per room.
 for(let z=6;z<D;z+=12)for(let x=6;x<W;x+=12)if(x>=c.x&&x<c.x+c.w&&z>=c.z&&z<c.z+c.d){
  box('fixture',x,3.34,z,1.28,.12,.34);box('diffuser',x,3.27,z,1.12,.025,.24);
 }
 const signs=ALPHA_ZONES150.filter(a=>a.x>=c.x&&a.x<c.x+c.w&&a.z>=c.z&&a.z<c.z+c.d).map(a=>({text:a.code+' · '+a.name,x:a.x+1,z:a.z,y:2.5,zone:a.id}));
 return{id,chunk:c,boxes,rooms:[...rooms],signs};
}
