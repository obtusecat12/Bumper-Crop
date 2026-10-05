import {ATRIUM96 as A,atriumLevelY96,topWalls96,inAtrium96} from './level0-atrium-plan96.js';
// One metric authority for rendered slabs, cut walls, player support and maps.
const subtract=(r,c)=>r.x1<=c.x0||r.x0>=c.x1||r.z1<=c.z0||r.z0>=c.z1?[r]:[
 {...r,x1:Math.max(r.x0,c.x0)},{...r,x0:Math.min(r.x1,c.x1)},
 {...r,x0:Math.max(r.x0,c.x0),x1:Math.min(r.x1,c.x1),z1:Math.max(r.z0,c.z0)},
 {...r,x0:Math.max(r.x0,c.x0),x1:Math.min(r.x1,c.x1),z0:Math.min(r.z1,c.z1)}
].filter(q=>q.x1-q.x0>.003&&q.z1-q.z0>.003);
export const ATRIUM_LEVELS97=[];
for(let n=0;n<A.tiers;n++){
 const y=atriumLevelY96(n),floors=[],walls=[],lamps=[],rooms=[];
 const slab=(x0,x1,z0,z1,edge,extra={})=>floors.push({x0,x1,z0,z1,y,n,edge,...extra});
 const wall=(x,z,w,d,h=2.72,base=y,cut=true)=>walls.push({x,z,w,d,h,y:base,cut});
 if(n===0){
  for(const [x0,x1,z0,z1,edge]of[[-11.4,-6,-14.4,14.4,'left'],[6,11.4,-14.4,14.4,'right'],[-6,6,-14.4,-10,'north'],[-6,6,10,14.4,'south']])slab(x0,x1,z0,z1,edge);
  for(const w of topWalls96)wall(w.x,w.z,w.w,w.d,2.72,0,false);
 }else{
  const sideRects=[];
  for(const side of[-1,1])for(let j=0;j<5;j++){
   const edge=side<0?'left':'right',outer=side*11.4,z0=-10+j*4,z1=z0+4;
   const front=side*(5.55+[.2,.6,-.32,.45,-.12][(j+n)%5]),x0=side<0?outer:front,x1=side<0?front:outer;
   const room={x0,x1,z0,z1,side,j,edge};sideRects.push(room);rooms.push(room);
   if(n===4&&side===1&&j===3){
    const x=(x0+x1)/2,z=(z0+z1)/2,w=Math.min(3.5,x1-x0-.55),d=3.30,pool={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2};
    for(const q of subtract(room,pool))slab(q.x0,q.x1,q.z0,q.z1,edge,{poolDeck:true});
    floors.push({...pool,y:y-.74,n,edge,poolBottom:true});room.pool=true;
   }else slab(x0,x1,z0,z1,edge);
   wall(side*11.30,(z0+z1)/2,.20,4,2.72,y,false);
   if(j===0||j===4||(j+n)%3!==1){const end=front+side*(n<=6?.48:.1);wall((outer+end)/2,z0,Math.abs(outer-end),.18);}
   if(n<=6&&!(n===5&&side===1&&j===3))lamps.push({x:(x0+x1)/2,z:(z0+z1)/2,y:y+2.66});
  }
  // Outer corner returns close the room envelope below the original Level0 floor.
  for(const side of[-1,1])for(const end of[-1,1])wall(side*11.30,end*12.20,.20,4.40,2.72,y,false);
  for(const side of[-1,1]){
   // Irregular room widths and staggered cuts remove the repeated blank near-side facade.
   const edges=side>0?[-11.4,-3.1+[0,.65,-.35][n%3],2.55+[.25,-.45,.70][n%3],11.4]:[-11.4,-2,2,11.4];
   for(let j=0;j<3;j++){
    const x0=edges[j],x1=edges[j+1],front=side*(n===1&&side<0&&j===1?7.75:side>0?9.05+[.45,-.85,.95,-.35][(j+n)%4]:9.7+[.15,-.55,.25][(j+n)%3]);
    const z0=side<0?-14.4:front,z1=side<0?front:14.4,edge=side<0?'north':'south';
    const room={x0,x1,z0,z1,side,j,edge};rooms.push(room);
    let pieces=[room];for(const c of sideRects)pieces=pieces.flatMap(r=>subtract(r,c));
    for(const q of pieces)slab(q.x0,q.x1,q.z0,q.z1,edge);
    wall((x0+x1)/2,side*14.30,x1-x0,.20,2.72,y,false);
    if(j!==0)wall(x0,(z0+z1)/2,.18,Math.max(.2,z1-z0-.23));
    if(n<=6)lamps.push({x:(x0+x1)/2,z:(z0+z1)/2,y:y+2.665});
   }
  }
 }
 ATRIUM_LEVELS97.push({n,y,floors,walls,lamps,rooms});
}
const lower1=ATRIUM_LEVELS97[1],lower2=ATRIUM_LEVELS97[2],lower3=ATRIUM_LEVELS97[3];
// Remove both skins where the service chase and insulated stud bay are exposed.
for(const [z,x0,x1]of[[-2,-9.04,-7.80],[-6,-7.075,-5.525]]){
 const index=lower1.walls.findIndex(w=>Math.abs(w.z-z)<.01&&w.x<0&&w.w>1);
 if(index>=0){const q=lower1.walls.splice(index,1)[0],left=q.x-q.w/2,right=q.x+q.w/2;
  if(x0>left)lower1.walls.push({...q,x:(left+x0)/2,w:x0-left});
  if(right>x1)lower1.walls.push({...q,x:(x1+right)/2,w:right-x1});
 }
}
// Existing white half-open door and its wall remain in the same position.
lower1.walls.push({x:-2.11,z:-12,w:.14,d:3.52,h:2.72,y:lower1.y,cut:true},{x:-2.11,z:-8.16,w:.14,d:.53,h:2.72,y:lower1.y,cut:true},{x:-2.11,z:-9.58,w:.14,d:1.03,h:.55,y:lower1.y+2.17,cut:true});
// Cross-wall near the first ledge: real doorway with a cut timber end, as ref 5.
export const CROSS_DOOR97={n:1,x:7.85,z:2.38,y:lower1.y,width:.94};
lower1.walls.push({x:6.91,z:2.38,w:.89,d:.18,h:2.72,y:lower1.y,cut:true},{x:9.89,z:2.38,w:2.92,d:.18,h:2.72,y:lower1.y,cut:true},{x:7.85,z:2.38,w:1.0,d:.18,h:.55,y:lower1.y+2.17,cut:true});
// Authored first-three-level anomalies. These exact transforms drive geometry and collision.
export const FURNISHINGS97=[
 {kind:'diningSection',n:1,x:-7.78,z:7.65,yaw:-Math.PI/2,w:1.85,d:.68,h:.78},
 {kind:'f94LadderChair',n:1,x:-9.05,z:7.68,yaw:Math.PI/2,w:.48,d:.51,h:1.02},
 {kind:'bareMattress',n:2,x:9.66,z:8.0,yaw:-.48,w:1.55,d:2.03,h:.24},
 {kind:'f95GlassCabinet',n:2,x:-.95,z:12.96,yaw:Math.PI,w:1.35,d:.5,h:1.8},
 {kind:'f95FiveDrawer',n:1,x:4.10,z:13.32,yaw:Math.PI,w:.9,d:.5,h:1.3},
 {kind:'cutBed',n:3,x:9.12,z:-7.9,yaw:Math.PI/2,w:1.8,d:2.12,h:.82},
 {kind:'f94LadderChair',n:3,x:.45,z:12.62,yaw:.38,w:.48,d:.51,h:1.02},
 {kind:'f95FusedCRT',n:3,x:-4.05,z:-12.83,yaw:.75,w:.9,d:.52,h:.66}
];
for(let i=0;i<7;i++)FURNISHINGS97.push({kind:'f95StripeSofa',n:2,x:-11.24+i*.85,z:-4.8,yaw:Math.PI/2,scale:[1.45*.30**i,1.45*.30**i,1.45*.30**i],w:1.92,d:.96,h:1.04,anomaly:'geometric diminution'});
const boxOf=p=>{const sx=p.scale?.[0]??1,sy=p.scale?.[1]??1,sz=p.scale?.[2]??1,c=Math.abs(Math.cos(p.yaw||0)),s=Math.abs(Math.sin(p.yaw||0));return{x:p.x,z:p.z,w:p.w*sx*c+p.d*sz*s,d:p.w*sx*s+p.d*sz*c,y:atriumLevelY96(p.n),h:p.h*sy};};
const props=FURNISHINGS97.filter(p=>(p.scale?.[0]??1)>.12).map(boxOf);
props.push({x:-5.55,z:-5.92,w:.12,d:.12,y:-9.92,h:9.52},{x:-8.42,z:-2,w:1.3,d:.20,y:lower1.y,h:2.72},{x:-6.3,z:-6,w:1.6,d:.16,y:lower1.y,h:2.72},{x:5.94,z:2.38,w:1.1,d:.17,y:lower1.y,h:2.72},{x:6.74,z:-3.2,w:.52,d:.54,y:0,h:.95},{x:-6.96,z:4.86,w:.045,d:.94,y:0,h:2.12},{x:CROSS_DOOR97.x,z:CROSS_DOOR97.z,w:.94,d:.045,y:lower1.y,h:2.12},
 {x:-.7,z:-9.71,w:.66,d:.66,y:lower1.y,h:.65},{x:.8,z:-9.6,w:.51,d:.53,y:lower1.y,h:1},
 {x:-2.46,z:-10.04,w:.9,d:.53,y:lower1.y,h:2.12},{x:7.22,z:-.54,w:.57,d:.63,y:lower3.y,h:.76},{x:-7.75,z:-7.5,w:.5,d:.9,y:lower3.y,h:1.3});
props.push({x:-8.33,z:3.5,w:2.30,d:2.04,y:atriumLevelY96(4),h:1.1},{x:.2,z:-13.55,w:1.95,d:.65,y:atriumLevelY96(4),h:2.2},{x:7.8,z:-6.9,w:.49,d:.86,y:atriumLevelY96(5),h:1.27},{x:-8.94,z:-2.9,w:.48,d:.99,y:atriumLevelY96(5),h:1.88},{x:7.7,z:5.5,w:.54,d:.52,y:atriumLevelY96(5),h:1.5},{x:-7.9,z:-5.2,w:.96,d:2.15,y:atriumLevelY96(6),h:1.0},{x:2.6,z:-12.9,w:.64,d:.49,y:atriumLevelY96(6),h:1.49});
const allFloors=ATRIUM_LEVELS97.flatMap(l=>l.floors),allWalls=ATRIUM_LEVELS97.flatMap(l=>l.walls).concat(props);
const contains=(r,x,z,p=0)=>x>=r.x0-p&&x<=r.x1+p&&z>=r.z0-p&&z<=r.z1+p;
export function atriumSupport97(x,z,ceilingY=.12){x-=A.x;z-=A.z;let best=-Infinity;for(const f of allFloors)if(f.y<=ceilingY+.001&&f.y>best&&contains(f,x,z))best=f.y;return best;}
export function atriumLanding97(x,z,from,to){const y=atriumSupport97(x,z,from+.025);return y>=to-.001&&y<=from+.025?y:null;}
export function atriumBlocked97(x,z,r=.25,feet=0,body=1.7){
 if(!inAtrium96(x,z,r))return feet<-.2;const xx=x-A.x,zz=z-A.z;
 for(const q of allWalls)if(feet<q.y+q.h-.04&&feet+body>q.y+.04&&Math.abs(xx-q.x)<q.w/2+r&&Math.abs(zz-q.z)<q.d/2+r)return true;
 // Real slab edges, not infinitely tall footprints. The .08m deck remains solid from below.
 for(const f of allFloors)if(feet<f.y-.045&&feet+body>f.y-.075&&contains(f,xx,zz,r))return true;
 return false;
}
export function atriumHeadroom97(x,z,feet,head){let hit=Infinity;x-=A.x;z-=A.z;for(const f of allFloors){const y=f.y-(f.n%2===0?.48:.80);if(y>feet+.12&&y<head&&contains(f,x,z))hit=Math.min(hit,y);}if(feet>=-.1)hit=Math.min(hit,2.72);return hit;}
export function atriumTier97(feet=0){return ATRIUM_LEVELS97.reduce((a,l)=>Math.abs(l.y-feet)<Math.abs(a.y-feet)?l:a,ATRIUM_LEVELS97[0]);}
export function atriumMap97(ctx,scale,feet=0){const l=atriumTier97(feet);ctx.fillStyle='#16150e';ctx.fillRect(-11.4*scale,-14.4*scale,22.8*scale,28.8*scale);ctx.fillStyle='#b1a374';for(const f of l.floors)ctx.fillRect(f.x0*scale,f.z0*scale,(f.x1-f.x0)*scale,(f.z1-f.z0)*scale);ctx.fillStyle='#625c49';for(const w of l.walls.concat(props.filter(p=>Math.abs(p.y-l.y)<.1)))ctx.fillRect((w.x-w.w/2)*scale,(w.z-w.d/2)*scale,Math.max(1,w.w*scale),Math.max(1,w.d*scale));}
