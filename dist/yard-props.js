import * as T from './vendor/three.module.min.js';
import {surfaceHeight,buildingSize,roadDistance} from './world.js?v=30';
import {getYardAsset,isSharedYardAssetResource} from './yard-assets.js?v=30';

// Each independently seeded slot selects ONE cached object. Clusters describe
// places, never fixed inventories: changing a rejection cannot change a later
// slot's kind, geometry variant, count, lean, or preference for a support.
const TAU=Math.PI*2,UP=new T.Vector3(0,1,0),P=new T.Vector3(),N=new T.Vector3(),NM=new T.Matrix3();
const TOOLS=new Set(['sickle','shovel','fork','scythe']),LARGE=new Set(['crate','sack','hay']);
const TRIANGLE_BUDGET=25000;
export function isSharedYardPropResource(resource){return isSharedYardAssetResource(resource);}
function hash(seed,key,index=0,attempt=0){
 let h=(seed^Math.imul(index+1,0x45d9f3b)^Math.imul(attempt+1,0x27d4eb2d))>>>0;
 for(let j=0;j<key.length;j++)h=Math.imul(h^key.charCodeAt(j),16777619);
 h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return(h^h>>>16)>>>0;
}
function pick(items,u,weight=x=>x.weight){let total=0;for(const x of items)total+=weight(x);let t=u*total;for(const x of items){t-=weight(x);if(t<0)return x;}return items.at(-1);}
function corners(r){const c=Math.cos(r.a),s=Math.sin(r.a);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>({x:r.x+c*x*r.hx+s*z*r.hz,z:r.z-s*x*r.hx+c*z*r.hz}));}
function overlaps(a,b,margin=0){
 const ap=corners(a),bp=corners(b);
 for(const angle of[a.a,b.a])for(const [x,z]of[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]]){
  let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;
  for(const p of ap){const q=p.x*x+p.z*z;amin=Math.min(amin,q);amax=Math.max(amax,q);}for(const p of bp){const q=p.x*x+p.z*z;bmin=Math.min(bmin,q);bmax=Math.max(bmax,q);}
  if(amax+margin<=bmin||bmax+margin<=amin)return false;
 }return true;
}
function subtract(start,end,holes){let runs=[[start,end]];for(const [lo,hi]of holes){const next=[];for(const [a,b]of runs){if(hi<=a||lo>=b)next.push([a,b]);else{if(lo>a)next.push([a,lo]);if(hi<b)next.push([hi,b]);}}runs=next;}return runs;}

// Exact V9 structural dimensions and opening positions from buildings.js.
// Windows are excluded for their full width, including frames. No imaginary
// front wall is offered for the implement shelter or optional porch/side bay.
function wallSegments(v,w,d,h,s){
 const hw=w/2,front=d/2,back=-front,t=v===4?.27:.14,walls=[];
 function wall(id,axis,fixed,start,end,height,openings=[],extra=[]){
  const windowHoles=openings.map(o=>[o.at-o.width/2-.16,o.at+o.width/2+.16]);
  const holes=[...windowHoles,...extra];
  const columns=[start,end,...openings.flatMap(o=>[o.at-o.width/2,o.at+o.width/2])].sort((a,b)=>a-b);
  const rows=[0,height,...openings.flatMap(o=>[o.bottom,o.bottom+o.height]).filter(y=>y>0&&y<height)].sort((a,b)=>a-b);
  for(const [lo,hi]of subtract(start+.39,end-.39,holes))if(hi-lo>.44)walls.push({id:`${id}:${lo.toFixed(2)}`,axis,side:Math.sign(fixed),plane:(fixed+Math.sign(fixed)*t/2)*s,start:lo*s,end:hi*s,height:height*s,columns:columns.map(x=>x*s),rows:rows.map(y=>y*s),siding:v===4?'brick':v===0?'horizontal':'vertical',boardWidth:(v===1?.16:.30)*s,scale:s,weight:(id==='front'?1.30:id==='back'?.48:1)});
 }
 const at=(n,width,bottom,height)=>({at:n,width,bottom,height});
 const sideWindows=v===2?[at(-d*.18,1.15,2.15,1.3)]:v===3?[-5.8,-2.2,1.4,5].map(n=>at(n,1.42,1.55,1.4)):v===4?[-3.6,1.7].map(n=>at(n,1.05,1.58,1.15)):v===6?[-5.6,-1.8,2.0,5.8].map(n=>at(n,1.32,1.70,1.05)):[];
 const sideH=v===5?h-.9:v===7?h-.75:h;
 for(const side of[-1,1]){
  let openings=sideWindows,extra=[];
  if(v===0&&side<0)openings=[at(-1.8,1,1.2,.92)];
  if(v===1&&side<0)openings=[at(-.6,.46,2.02,.38)];
  if(v===7&&side>0){openings=[at(-2.4,1.16,1.2,.86)];extra.push([front-4.13,front-.65]);}
  if(v===4)for(let z=back+1.2;z<front;z+=3.15)extra.push([z-.25,z+.25]);
  wall(side<0?'left':'right','x',side*hw,back,front,sideH,openings,extra);
 }
 wall('back','z',back,-hw,hw,v===5?h-.9:h,v===6?[at(0,3.4,0,3.15)]:[]);
 if([2,3,4,6,7].includes(v)){
  const dw=({2:4.4,3:4,4:3.6,6:3.4,7:3.6})[v],doorX=v===7?-.55:0;
  // Parked sliding leaves and their braces cover the neighbouring wall.
  wall('front','z',front,-hw,hw,v===7?h-.75:h,[at(doorX,dw,0,v===7?2.35:3.15)],[[doorX-dw-.23,doorX+dw+.23]]);
 }
 return walls;
}
function snapBoard(segment,tangent){
 if(segment.siding!=='vertical')return tangent;
 const xs=segment.columns;
 for(let i=0;i<xs.length-1;i++)if(tangent>=xs[i]&&tangent<=xs[i+1]){
  const n=Math.max(1,Math.ceil((xs[i+1]-xs[i])/segment.boardWidth)),bw=(xs[i+1]-xs[i])/n;
  return xs[i]+(Math.min(n-1,Math.floor((tangent-xs[i])/bw))+.5)*bw;
 }return tangent;
}
function onBoard(segment,tangent,y){
 if(tangent<segment.start||tangent>segment.end||y<.075*segment.scale||y>segment.height-.075*segment.scale)return false;
 if(segment.siding!=='horizontal')return true;
 const ys=segment.rows,s=segment.scale;
 for(let i=0;i<ys.length-1;i++)if(y>=ys[i]&&y<=ys[i+1]){
  const n=Math.max(1,Math.ceil((ys[i+1]-ys[i])/(.235*s))),bh=(ys[i+1]-ys[i])/n;
  const frac=(y-ys[i])%bh;return frac>.006*s+.001&&frac<bh-.006*s-.001;
 }return false;
}
class Batch{
 constructor(){this.parts=new Map();this.triangles=0;}
 add(asset,matrix){
  asset.group.updateMatrixWorld(true);
  asset.group.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry,m=mesh.material;if(Array.isArray(m))throw new Error('Yard assets must have one material per mesh');
   if(!this.parts.has(m))this.parts.set(m,{p:[],n:[],u:[],c:[]});const a=this.parts.get(m),mat=matrix.clone().multiply(mesh.matrixWorld);NM.getNormalMatrix(mat);
   const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,col=g.attributes.color,idx=g.index,count=idx?idx.count:p.count;
   for(let j=0;j<count;j++){const i=idx?idx.getX(j):j;P.fromBufferAttribute(p,i).applyMatrix4(mat);N.fromBufferAttribute(n,i).applyNormalMatrix(NM);a.p.push(P.x,P.y,P.z);a.n.push(N.x,N.y,N.z);a.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0);a.c.push(col?col.getX(i):1,col?col.getY(i):1,col?col.getZ(i):1);}
   this.triangles+=count/3;
  });
 }
 finish(group){let bytes=0;for(const [m,a]of this.parts){const g=new T.BufferGeometry();for(const [name,key,size]of[['position','p',3],['normal','n',3],['uv','u',2],['color','c',3]]){const attr=new T.Float32BufferAttribute(a[key],size);g.setAttribute(name,attr);bytes+=attr.array.byteLength;}g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=!m.transparent;mesh.receiveShadow=true;mesh.userData.decorativeYardProp=true;if(m.transparent)mesh.renderOrder=1;group.add(mesh);}return{draws:group.children.length,triangles:this.triangles,geometryBytes:bytes};}
}
function assetTriangles(asset){if(asset.stats?.triangles)return asset.stats.triangles;let n=0;asset.group.traverse(m=>{if(m.isMesh)n+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});return n;}
function transformedBounds(asset,matrix){return asset.bounds.clone().applyMatrix4(matrix);}
function rectFor(asset,matrix,yaw){
 // Bounding the 8 exact asset bounds corners in the yaw frame preserves a
 // stable footprint even when a rigid ground slope/lean changes its silhouette.
 const b=asset.bounds,inv=new T.Matrix4().makeRotationY(-yaw),bb=new T.Box3();
 for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])bb.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(matrix).applyMatrix4(inv));
 const center=bb.getCenter(new T.Vector3()).applyMatrix4(new T.Matrix4().makeRotationY(yaw));
 return{x:center.x,z:center.z,hx:(bb.max.x-bb.min.x)/2,hz:(bb.max.z-bb.min.z)/2,a:yaw};
}

export function makeYardProps(f,level=0){
 const group=new T.Group();group.name='varied-working-yard';const colliders=[];
 const stats={version:10,level,props:[],clusters:[],workstations:[],rejected:0,rejections:{},draws:0,triangles:0,geometryBytes:0};
 if(f.type!=='building')return{group,colliders,stats};
 const v=((f.variant||0)%8+8)%8,s=f.buildingScale||1,[w,d,h]=buildingSize({...f,variant:v}),hw=w/2,front=d/2,angle=f.buildingAngle||0,c=Math.cos(angle),sn=Math.sin(angle),seed=(f.seed??1)>>>0;
 const R=(key,index=0,attempt=0)=>hash(seed,key,index,attempt)/4294967296,toWorld=(x,z)=>({x:f.cx+c*x+sn*z,z:f.cz-sn*x+c*z});
 const terrain=(x,z)=>{const p=toWorld(x,z);return surfaceHeight(p.x,p.z,f);};
 const segments=wallSegments(v,w/s,d/s,h/s,s),out=new Batch(),placed=[],supports=[];
 const buildingY=(f.buildingY??surfaceHeight(f.cx,f.cz,f))+.035,doorX=(v===0?-1.15:v===7?-.55:0)*s,dw=[1.55,1.12,4.4,4,3.6,13,3.4,3.6][v]*s;
 group.position.set(f.cx,0,f.cz);group.rotation.y=angle;
 const wallRect={x:0,z:0,hx:hw+(v===4?.20:.14)*s,hz:front+.14*s,a:0};
 const reserved=[{x:doorX,z:front+1.6*s,hx:dw/2+.58*s,hz:1.85*s,a:0}];
 if(v===0)reserved.push({x:0,z:front+.83*s,hx:2.81*s,hz:1.0*s,a:0});
 if(v===1)reserved.push({x:.9*s,z:front+.65*s,hx:.85*s,hz:.80*s,a:0});
 if(v===6)reserved.push({x:0,z:-front-1.55*s,hx:dw/2+.58*s,hz:1.8*s,a:0});
 if(v===7)reserved.push({x:hw+1.05*s,z:front-2.4*s,hx:1.22*s,hz:1.78*s,a:0});
 const cap=v===1?3+Math.floor(R('count')*3):Math.min(19,Math.max(8,Math.round(6+Math.sqrt(w*d)*.46+R('count')*5)));
 const clusterCount=v===1?1+Math.floor(R('cluster-count')*2):2+Math.floor(R('cluster-count')*(v===0||v===7?2:4));
 for(let i=0;i<clusterCount;i++){
  const segment=pick(segments,R('cluster-wall',i),q=>(q.end-q.start)*q.weight);
  const t=segment.start+(segment.end-segment.start)*(.12+.76*R('cluster-along',i));
  const outward=.57+R('cluster-out',i)*1.06,spread=.53+R('cluster-spread',i)*.93;
  const x=segment.axis==='x'?segment.plane+segment.side*outward:t,z=segment.axis==='z'?segment.plane+segment.side*outward:t;
  stats.clusters.push({id:i,x,z,spread,segment:segment.id});
 }
 const hayPreference=R('hay-presence')<([.18,.02,.82,.71,.41,.60,.91,.24][v])?1:0;
 const vessels=R('vessel-presence')<.65?1:.05;
 const weights=[['crate',v===1?1.8:3.5],['basket',1.35],['sack',v===1?.15:2.3],['hay',hayPreference*([.3,0,3.1,2.2,1.2,2.2,3.8,.7][v])],['bottle',.60*vessels],['jar',.46*vessels],['jug',.63*vessels],['sickle',v===1?.08:.34],['shovel',v===1?.30:.84],['fork',v===1?.06:.75],['scythe',v===1?0:.60]].map(([kind,weight])=>({kind,weight}));
 const reject=reason=>{stats.rejected++;stats.rejections[reason]=(stats.rejections[reason]||0)+1;return false;};
 function boundsAllowed(rect,tool=false){
  const pts=corners(rect),worldPts=pts.map(q=>toWorld(q.x,q.z));
  if(pts.some(q=>Math.abs(q.x)>hw+3.12||Math.abs(q.z)>front+3.12))return'yard-edge';
  if(worldPts.some(q=>q.x<.18||q.z<.18||q.x>63.82||q.z>63.82))return'tile-seam';
  if(reserved.some(q=>overlaps(rect,q,.065)))return'entrance';
  if(!tool&&overlaps(rect,wallRect,.055))return'building';
  if(f.roads?.length&&worldPts.some(q=>roadDistance(q.x,q.z,f)<1.36))return'road';
  return null;
 }
 function baseContact(asset,matrix){
  let y=-Infinity;const points=asset.basePoints?.length?asset.basePoints:[[0,0,0]];
  for(const q of points){const p=new T.Vector3(...q).applyMatrix4(matrix);y=Math.max(y,terrain(p.x,p.z)-p.y);}
  matrix.elements[13]+=y+.001;
  let min=Infinity,max=-Infinity,contactBandMax=-Infinity;const gaps=[];for(const q of points){const p=new T.Vector3(...q).applyMatrix4(matrix),gap=p.y-terrain(p.x,p.z);min=Math.min(min,gap);max=Math.max(max,gap);gaps.push(gap);}
  // basePoints is the complete lower envelope candidate set, including raised
  // blade shoulders and sack folds. Those are not supposed to touch the dirt.
  // Report contact feet separately from naturally raised lower geometry.
  for(const gap of gaps)if(gap<=min+.025)contactBandMax=Math.max(contactBandMax,gap);
  return{min,max,contactBandMax,lowerGeometryRange:max-min};
 }
 function rigidGround(asset,x,z,yaw,scale){
  const eps=.13,gx=(terrain(x+eps,z)-terrain(x-eps,z))/(2*eps),gz=(terrain(x,z+eps)-terrain(x,z-eps))/(2*eps);
  const slope=new T.Quaternion().setFromUnitVectors(UP,new T.Vector3(-gx,1,-gz).normalize()),turn=new T.Quaternion().setFromAxisAngle(UP,yaw);
  const matrix=new T.Matrix4().compose(new T.Vector3(x,0,z),slope.multiply(turn),new T.Vector3(scale,scale,scale));
  return{matrix,contact:baseContact(asset,matrix)};
 }
 function geometryOutsideWall(asset,matrix,segment){
  let safe=true;asset.group.updateMatrixWorld(true);
  asset.group.traverse(mesh=>{if(!mesh.isMesh||!safe)return;const m=matrix.clone().multiply(mesh.matrixWorld),p=mesh.geometry.attributes.position;
   for(let i=0;i<p.count;i++){P.fromBufferAttribute(p,i).applyMatrix4(m);const coordinate=segment.axis==='x'?P.x:P.z;
    if((coordinate-segment.plane)*segment.side<-.004){safe=false;break;}
    // The brick barn has an actual wider, 38 cm high exterior base course.
    if(v===4&&segment.axis==='x'&&P.y<buildingY+.38*s&&Math.abs(P.x)<hw+.20*s-.003){safe=false;break;}
   }
  });return safe;
 }
 function add(asset,kind,id,matrix,yaw,scale,mode,contact,extra={}){
  const rect=rectFor(asset,matrix,yaw),box=transformedBounds(asset,matrix),tool=TOOLS.has(kind),supportId=extra.supportId??null;
  const bad=boundsAllowed(rect,tool);if(bad)return reject(bad);
  for(const q of placed){if(q.id===supportId)continue;if(box.min.y>=q.box.max.y-.004||box.max.y<=q.box.min.y+.004)continue;if(overlaps(rect,q.rect,tool||q.tool?.055:.075))return reject('object');}
  if(contact&&(contact.min<.0005||contact.min>.0015))return reject('ground-contact');
  const tris=assetTriangles(asset);if(out.triangles+tris>TRIANGLE_BUDGET)return reject('triangle-budget');
  out.add(asset,matrix);
  const p={id,kind,assetVariant:extra.assetVariant,mode,x:matrix.elements[12],z:matrix.elements[14],baseY:matrix.elements[13],angle:yaw,scale,solid:LARGE.has(kind)&&supportId===null,rect:{...rect},supportId,groundResidual:contact?{...contact}:null,matrix:[...matrix.elements],...extra};
  placed.push({id,asset,kind,matrix:matrix.clone(),rect,box,tool,scale,p});stats.props.push(p);
  if(p.solid){const center=toWorld(rect.x,rect.z);colliders.push({kind:'obb',x:center.x,z:center.z,hx:rect.hx+.025,hz:rect.hz+.025,angle:angle+yaw});}
  if(!stats.workstations.includes(mode))stats.workstations.push(mode);
  if(!tool&&(asset.supportPlane||asset.nestPlane)&&supportId===null)supports.push(placed.at(-1));
  return true;
 }
 function trySupport(asset,kind,id,variant){
  const eligible=supports.filter(q=>(q.kind==='crate'&&q.asset.closed!==false&&q.asset.supportPlane&&['crate','bottle','jar','jug','basket','sack'].includes(kind))||(q.kind==='hay'&&kind==='hay')||(q.kind==='basket'&&kind==='basket'&&q.asset.nestPlane));
  if(!eligible.length)return false;
  for(let attempt=0;attempt<4;attempt++){
   const q=eligible[Math.floor(R('support-choice',id,attempt)*eligible.length)],nested=q.kind==='basket',plane=nested?q.asset.nestPlane:q.asset.supportPlane;if(!plane)continue;
   const yawOffset=(R('support-yaw',id,attempt)-.5)*(kind==='hay'?.32:kind==='crate'?.15:1.1),scale=nested?q.scale*(.69+R('nest-size',id)*.13):kind==='crate'?q.scale*(.83+R('stack-size',id)*.09):kind==='hay'?q.scale*(.88+R('hay-stack-size',id)*.08):.94+R('size',id)*.12;
   const halfX=(asset.bounds.max.x-asset.bounds.min.x)*scale/2,halfZ=(asset.bounds.max.z-asset.bounds.min.z)*scale/2,cc=Math.abs(Math.cos(yawOffset)),ss=Math.abs(Math.sin(yawOffset)),hx=(cc*halfX+ss*halfZ)/q.scale,hz=(ss*halfX+cc*halfZ)/q.scale;
   const overhang=kind==='hay'?.14:0,roomX=plane.halfX-hx+overhang,roomZ=plane.halfZ-hz+overhang;if(roomX<0||roomZ<0)continue;
   const dx=(plane.centerX||0)+(R('support-x',id,attempt)-.5)*2*roomX,dz=(plane.centerZ||0)+(R('support-z',id,attempt)-.5)*2*roomZ;
   const local=new T.Matrix4().compose(new T.Vector3(dx,plane.height+.002,dz),new T.Quaternion().setFromAxisAngle(UP,yawOffset),new T.Vector3(scale/q.scale,scale/q.scale,scale/q.scale)),matrix=q.matrix.clone().multiply(local);
   if(add(asset,kind,id,matrix,q.p.angle+yawOffset,scale,nested?'nested-basket':kind==='hay'?'stacked-hay':'crate-supplies',null,{assetVariant:variant,supportId:q.id,supportLocal:{x:dx,y:plane.height+.002,z:dz},partialOverhang:overhang>0}))return true;
  }return false;
 }
 function tryTool(asset,kind,id,variant){
  if(!asset.wallContact)return reject('missing-wall-contact');
  for(let attempt=0;attempt<24;attempt++){
   const cluster=stats.clusters[Math.floor(R('tool-cluster',id,attempt)*stats.clusters.length)],nearCluster=R('tool-near-cluster',id,attempt)<.64;
   const segment=nearCluster?segments.find(q=>q.id===cluster.segment):pick(segments,R('tool-wall',id,attempt),q=>(q.end-q.start)*q.weight*(q.axis==='x'?1.7:1)),span=segment.end-segment.start;
   let tangent=nearCluster?(segment.axis==='x'?cluster.z:cluster.x)+(R('tool-along',id,attempt)-.5)*cluster.spread*1.8:segment.start+span*(.07+.86*R('tool-along',id,attempt));tangent=snapBoard(segment,tangent);
   const lean=(5+13*R('tool-lean',id,attempt))*Math.PI/180,yaw=segment.axis==='x'?segment.side*Math.PI/2:segment.side>0?0:Math.PI,scale=.95+R('size',id)*.10;
   const rotation=new T.Matrix4().makeRotationY(yaw).multiply(new T.Matrix4().makeRotationX(-lean)).scale(new T.Vector3(scale,scale,scale)),contactPoint=new T.Vector3(...asset.wallContact).applyMatrix4(rotation);
   const target=segment.axis==='x'?new T.Vector3(segment.plane,0,tangent):new T.Vector3(tangent,0,segment.plane);
   rotation.setPosition(target.x-contactPoint.x,0,target.z-contactPoint.z);
   const ground=baseContact(asset,rotation),top=new T.Vector3(...asset.wallContact).applyMatrix4(rotation),wallY=top.y-buildingY;
   if(!onBoard(segment,tangent,wallY)){reject('wall-board-gap');continue;}
   if(!geometryOutsideWall(asset,rotation,segment)){reject('wall-penetration');continue;}
   const worldTop=toWorld(top.x,top.z),wall={segment:segment.id,axis:segment.axis,side:segment.side,plane:segment.plane,tangent,buildingLocalY:wallY,localPoint:[top.x,top.y,top.z],worldPoint:[worldTop.x,top.y,worldTop.z],residual:Math.abs((segment.axis==='x'?top.x:top.z)-segment.plane),siding:segment.siding};
   if(add(asset,kind,id,rotation,yaw,scale,'wall-tools',ground,{assetVariant:variant,leanDegrees:lean*180/Math.PI,wallContact:wall}))return true;
  }return false;
 }
 for(let id=0;id<cap;id++){
  const kind=pick(weights,R('kind',id)).kind,variant=Math.floor(R('variant',id)*8),asset=getYardAsset(kind,variant);
  if(TOOLS.has(kind)){tryTool(asset,kind,id,variant);continue;}
  const supportChance=['bottle','jar','jug'].includes(kind)?.93:kind==='hay'?.54:kind==='basket'?.35:kind==='crate'?.31:.23;
  if(R('support-preference',id)<supportChance&&trySupport(asset,kind,id,variant))continue;
  for(let attempt=0;attempt<22;attempt++){
   let cluster=stats.clusters[Math.floor(R('cluster-choice',id,attempt)*stats.clusters.length)],x,z;
   const adjacent=kind==='sack'&&placed.filter(q=>['crate','basket','sack'].includes(q.kind)&&q.p.supportId===null);
   if(adjacent?.length&&R('sack-adjacency',id)<.76){const supply=adjacent[Math.floor(R('supply-choice',id,attempt)*adjacent.length)],a=R('supply-angle',id,attempt)*TAU,rad=.65+R('supply-distance',id,attempt)*.84;x=supply.rect.x+Math.cos(a)*rad;z=supply.rect.z+Math.sin(a)*rad;}
   else{const a=R('place-angle',id,attempt)*TAU,rad=Math.sqrt(R('place-radius',id,attempt))*cluster.spread;x=cluster.x+Math.cos(a)*rad;z=cluster.z+Math.sin(a)*rad;}
   const yaw=(R('yaw',id,attempt)-.5)*(kind==='hay'||kind==='crate'?.75:TAU),scale=.93+R('size',id)*.13,{matrix,contact}=rigidGround(asset,x,z,yaw,scale);
   if(add(asset,kind,id,matrix,yaw,scale,'yard-cluster',contact,{assetVariant:variant,clusterId:cluster.id}))break;
  }
 }
 stats.targetCount=cap;stats.objectCount=stats.props.length;stats.exposedWalls=segments.map(({columns,rows,...q})=>q);stats.entranceReservations=reserved;stats.composition=stats.props.map(p=>`${p.kind}.${p.assetVariant}@${p.x.toFixed(2)},${p.z.toFixed(2)}:${p.mode}`).join('|');
 stats.compositionHash=hash(seed,stats.composition).toString(16);Object.assign(stats,out.finish(group));group.userData.yardProps={version:10,variant:v,decorativeOnly:true,compositionHash:stats.compositionHash};
 return{group,colliders,stats};
}
