// Fixed metric room, shared by rendering, collision, minimap and F2 photographs.
export const MANILA={x:117,z:-51,height:2.72,inner:4,outer:5,ring:7};
export const MANILA_RECT={id:'manila-fixed',type:'manila',x0:110,x1:124,z0:-58,z1:-44};
export const MANILA_TABLE={x:-2.14765,z:2.97859,r:.54929,height:.87796};
export const MANILA_CHAIRS=[{x:-1.69408,z:1.71657,yaw:0,scale:.9084,heightScale:.90419},{x:-.87,z:2.77,yaw:-1.20,scale:.9084,fallen:true}];
export const MANILA_DOORS=[{id:'north',x:-.42,z:-4.5,yaw:0,width:.94,angle:-1.10},{id:'east',x:4.5,z:-.30,yaw:-Math.PI/2,width:1.34,outerWidth:.82,angle:-1.38,hinge:1},{id:'south',x:.40,z:4.5,yaw:Math.PI,width:.98,angle:0},{id:'west',x:-4.5,z:.35,yaw:Math.PI/2,width:.94,angle:1.40}];
export const MANILA_VIEWS={doorway:{name:'马尼拉房间 · 门口原图机位',x:123.16401,y:1.18101,z:-51.80,yaw:1.915,pitch:-.00495,fov:37.35855,manila:true},interior:{name:'马尼拉房间 · 室内原图机位',x:115.75142,y:1.15146,z:-50.63805,yaw:3.17431,pitch:-.07885,fov:58.39784,manila:true}};
// A sparse deterministic field, not a one-off landmark. Original room/cameras stay fixed.
// 64m centre jitter guarantees at least 192m separation on neighboring grid axes, beyond the 170m streamed-copy diameter.
const rareCache=new Map(),CELL=256;
function rareHash(x,z,s){let h=Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(s,1442695041)^0x5eeda017;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function rareRoom(gx,gz){const key=gx+','+gz;if(rareCache.has(key))return rareCache.get(key);let r=null;
 if(rareHash(gx,gz,9601)<.14){const x=gx*CELL+96+rareHash(gx,gz,9602)*64,z=gz*CELL+96+rareHash(gx,gz,9603)*64;
  if(!(x>-210&&x<410&&z>-230&&z<280))r={id:'manila:'+key,type:'manila',x,z,x0:x-7,x1:x+7,z0:z-7,z1:z+7};}
 rareCache.set(key,r);if(rareCache.size>256)rareCache.delete(rareCache.keys().next().value);return r;}
export function manilaRegionsNear(x,z,range=100){const out=[{...MANILA_RECT,x:MANILA.x,z:MANILA.z}];for(let gz=Math.floor((z-range-7)/CELL);gz<=Math.floor((z+range+7)/CELL);gz++)for(let gx=Math.floor((x-range-7)/CELL);gx<=Math.floor((x+range+7)/CELL);gx++){const r=rareRoom(gx,gz);if(r)out.push(r);}return out;}
export const manilaAt=(x,z,p=0)=>manilaRegionsNear(x,z,5+p).find(q=>Math.abs(x-q.x)<5+p&&Math.abs(z-q.z)<5+p);
export const inManila=(x,z,p=0)=>!!manilaAt(x,z,p);
export const nearManila=(x,z)=>inManila(x,z,4);
export function subtractRectangle(f,a,b,u,v){const r={x0:f.x-f.w/2,x1:f.x+f.w/2,z0:f.z-f.d/2,z1:f.z+f.d/2};if(r.x1<=a||r.x0>=b||r.z1<=u||r.z0>=v)return[f];return[{...r,x1:Math.max(r.x0,a)},{...r,x0:Math.min(r.x1,b)},{x0:Math.max(r.x0,a),x1:Math.min(r.x1,b),z0:r.z0,z1:Math.max(r.z0,u)},{x0:Math.max(r.x0,a),x1:Math.min(r.x1,b),z0:Math.min(r.z1,v),z1:r.z1}].filter(q=>q.x1-q.x0>.001&&q.z1-q.z0>.001).map(q=>({...f,x:(q.x0+q.x1)/2,z:(q.z0+q.z1)/2,w:q.x1-q.x0,d:q.z1-q.z0}));}
export function subtractManilaFloor(f){let pieces=[f];for(const r of manilaRegionsNear(f.x,f.z,Math.max(f.w,f.d))){pieces=pieces.flatMap(p=>subtractRectangle(p,r.x-5,r.x+5,r.z-5,r.z+5));}return pieces;}
export function firstRareManila(){return manilaRegionsNear(0,0,1300).filter(r=>r.id!=='manila-fixed').sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))[0];}
export function manilaWalls(){const walls=[];for(const door of MANILA_DOORS){const vertical=door.id==='east'||door.id==='west',lo=vertical?-4:-5,hi=vertical?4:5,c=vertical?door.z:door.x,w=door.width;for(const[a,b]of[[lo,c-w/2],[c+w/2,hi]])walls.push({x:vertical?door.x:(a+b)/2,z:vertical?(a+b)/2:door.z,w:vertical?1:b-a,d:vertical?b-a:1,h:2.72,y:1.36});walls.push({x:door.x,z:door.z,w:vertical?1:w,d:vertical?w:1,h:.58,y:2.43,lintel:true});}return walls;}
