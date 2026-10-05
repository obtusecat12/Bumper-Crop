// Room grammar operates in continuous metres, independently from rendering chunks.
const M=86.4,H=2.72;
export const SPACE94_REGION={id:'enfilade94',type:'classic',x0:-136,x1:-78,z0:-46,z1:18};
export const SPACE94_VIEWS=[{name:'连续套间 · 厚墙拱门',x:-106.8,z:7.2,yaw:0},{name:'缓坡 · 红木栏杆',x:-122,z:-27,yaw:-1.52},{name:'梯背椅堆',x:150.2,z:10.3,yaw:0}];
export function createMacro94(mx,mz,hash){
 const walls=[],rooms=[],portals=[],rails=[];let sequence=0;const rnd=s=>hash(mx*931+s,mz*977-s,1894),key=mx+','+mz;
 function wall(x,z,w,d,id,kind='full',mat=0){const h=kind==='low'?1.07:kind==='beam'?.59:H;walls.push({x,z,w,d,h,y:kind==='beam'?H-h/2:h/2,mat,id:'m94:'+key+':'+id,kind});}
 function partition(vertical,cut,lo,hi,id,doorAt=null){
  const roll=rnd(id+71),thickness=[.18,.28,.44,.72,1.02][Math.min(4,Math.floor(rnd(id+44)**2*5))],mat=rnd(id+81)<.84?0:rnd(id+82)<.70?1:2;
  const gap=roll<.2?3.25:1.8+rnd(id+32)*1.5,door=doorAt??lo+(hi-lo)*(.20+rnd(id+72)*.60),a=Math.max(lo,door-gap/2),b=Math.min(hi,door+gap/2),style=roll<.24?'open':roll<.52?'round':roll<.69?'canted':roll<.85?'square':'wide';
  const kind=rnd(id+144)<.055?'low':rnd(id+145)<.045?'beam':'full';
  if(a-lo>.18)vertical?wall(cut,(lo+a)/2,thickness,a-lo,id+'a',kind,mat):wall((lo+a)/2,cut,a-lo,thickness,id+'a',kind,mat);
  if(hi-b>.18)vertical?wall(cut,(hi+b)/2,thickness,hi-b,id+'b',kind,mat):wall((hi+b)/2,cut,hi-b,thickness,id+'b',kind,mat);
  if(style!=='open'&&kind==='full')portals.push({x:vertical?cut:door,z:vertical?door:cut,w:b-a,d:thickness,rotation:vertical?Math.PI/2:0,style,mat,top:H,spring:style==='round'?1.65:2.12,rise:style==='round'?.83:.25,id:'portal:'+key+':'+id});
  if(kind==='low'&&rnd(id+188)<.43){const span=a-lo;if(span>2)rails.push({x:vertical?cut:(lo+a)/2,z:vertical?(lo+a)/2:cut,length:span,rotation:vertical?Math.PI/2:0,y:1.07});}
 }
 function split(x0,z0,x1,z1,depth){const id=++sequence,w=x1-x0,d=z1-z0;
  if(depth>5||Math.min(w,d)<6.8||w*d<58+190*rnd(id+200)){rooms.push({x0,z0,x1,z1,id});
   if(Math.min(w,d)>8&&rnd(id+307)<.27){const vertical=w<d,cut=vertical?x0+w*.29:z0+d*.3;const start=vertical?z0+1.5:x0+1.5,span=Math.min(5,(vertical?d:w)*.42);wall(vertical?cut:start+span/2,vertical?start+span/2:cut,vertical?.48:span,vertical?span:.48,id+'alcove',rnd(id+312)<.5?'low':'beam',0);}
   return;}
  let vertical=w>d*1.35||(w>d*.72&&rnd(id+11)>.5);const cut=(vertical?x0:z0)+(vertical?w:d)*(.30+.40*rnd(id+19));partition(vertical,cut,vertical?z0:x0,vertical?z1:x1,id);
  if(vertical){split(x0,z0,cut,z1,depth+1);split(cut,z0,x1,z1,depth+1);}else{split(x0,z0,x1,cut,depth+1);split(x0,cut,x1,z1,depth+1);}
 }
 // Each district starts with a long, traversable spine; tributaries have loops and broad unequal rooms.
 const x0=mx*M,z0=mz*M,x1=x0+M,z1=z0+M,vertical=rnd(1882)>.5,c=(vertical?x0:z0)+M*(.35+rnd(1883)*.30),cw=3.4+rnd(1884)*1.8;
 const long0=vertical?z0:x0,long1=vertical?z1:x1;
 for(const s of[-1,1]){const cut=c+s*cw/2;for(let j=0;j<6;j++){const lo=long0+j*M/6,hi=lo+M/6;partition(vertical,cut,lo,hi,1000+j+(s+1)*50,(lo+hi)/2);} }
 if(vertical){split(x0,z0,c-cw/2,z1,0);split(c+cw/2,z0,x1,z1,0);}else{split(x0,z0,x1,c-cw/2,0);split(x0,c+cw/2,x1,z1,0);}
 return{walls,rooms,portals,rails};
}
export function terrain94(x,z,hash){
 // A gently ramped floor plate with zero height/slope at district seams.
 const mx=Math.floor(x/M),mz=Math.floor(z/M),roll=hash(mx,mz,9491);if(roll>.14)return 0;
 const u=(x-mx*M)/M,v=(z-mz*M)/M,axis=hash(mx,mz,9492)>.5?u:v,other=hash(mx,mz,9492)>.5?v:u;
 const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 return (roll<.07?-.40:.36)*ease((axis-.16)/.16)*ease((.84-axis)/.16)*ease(other/.14)*ease((1-other)/.14);
}
export function showcase94(){
 const walls=[],portals=[],rails=[];const W=(x,z,w,d,h=H,mat=0,y=h/2)=>walls.push({x,z,w,d,h,y,mat,id:'space94'});
 // Long central enfilade, varied thick piers and rooms visible through door reveals.
 W(-109.5,-14,.54,55);W(-104.1,-14,.76,55);W(-106.8,-43,6.2,.65);
 for(let i=0;i<4;i++){const z=1-i*10.1,d=[.72,1.10,.44,.80][i],w=[2.5,3.12,2.24,2.8][i];W(-109.5+(5.4-w)/4,z,(5.4-w)/2,d);W(-104.1-(5.4-w)/4,z,(5.4-w)/2,d);portals.push({x:-106.8,z,w,d,rotation:0,style:['round','square','canted','round'][i],mat:0,top:H,spring:i===0||i===3?1.65:2.12,rise:i===0||i===3?.84:.20});}
 // Side gallery with half wall, ceiling beam, a low ramp and dark turned balustrade.
 W(-128,-18,.64,48);W(-118,6,20,.50);W(-123,-37,10,.50);W(-118,-17,.40,20,1.04);W(-118,-17,.58,20,.50,0,H-.25);
 rails.push({x:-117.8,z:-27.5,length:8.8,rotation:Math.PI/2,y:0});
 W(-93,-18,.32,38);W(-86,1,14,.54);W(-86,-37,14,.54);W(-85,-20,9,.36,1.10);
 return{walls,portals,rails};
}
export function showcaseHeight94(x,z){if(x< -126||x> -112||z< -36||z> -8)return 0;const s=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};return -.42*s((x+126)/3)*s((-112-x)/3)*s((z+36)/6)*s((-8-z)/6);}
