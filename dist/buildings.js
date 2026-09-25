import * as T from './vendor/three.module.min.js';
import {height,random} from './world.js?v=37';
import {ruralTextures} from './rural-textures.js?v=37';

// Main-wall dimensions; roof overhangs/optional porch are described by footprint.
export const RURAL_BUILDING_SIZES = Object.freeze([[7,9,3],[2.8,3.2,2.7],[12,17,4.9],[13,19,5.1],[11,15,4.3],[13,9,3.7],[13,18,3.8],[8,11,3.2]].map(Object.freeze));
export function unscaledBuildingDimensions(f){const d=RURAL_BUILDING_SIZES[((f.variant||0)%8+8)%8];return [f.buildingDimensions?.[0]||f.buildingWidth||d[0],f.buildingDimensions?.[1]||f.buildingDepth||d[1],f.buildingDimensions?.[2]||f.buildingHeight||d[2]];}
export function buildingDimensions(f){return unscaledBuildingDimensions(f).map(n=>n*(f.buildingScale||1));}
export function variantSize(v){return [...RURAL_BUILDING_SIZES[((v||0)%8+8)%8]];}
const unitBox=new T.BoxGeometry(1,1,1).toNonIndexed();
// The dusty floor grid is the sole top surface. Removing the slab's covered
// top eliminates grazing-angle depth shimmer without raising floor elevation.
const floorSlabGeo=new T.BufferGeometry();
for(const name of ['position','normal','uv']){
 const source=unitBox.attributes[name],out=[];
 for(let i=0;i<source.count;i++)if(unitBox.attributes.normal.getY(i)<.5)for(let k=0;k<source.itemSize;k++)out.push(source.array[i*source.itemSize+k]);
 floorSlabGeo.setAttribute(name,new T.Float32BufferAttribute(out,source.itemSize));
}
const barrelGeo=new T.CylinderGeometry(.43,.39,1.04,12,3).toNonIndexed();
const hoopGeo=new T.CylinderGeometry(.441,.441,.045,12,1,true).toNonIndexed();
const stoneGeo=new T.DodecahedronGeometry(1,0);
const cylinder=new T.CylinderGeometry(1,1,1,8).toNonIndexed();
const up=new T.Vector3(0,1,0),tmp=new T.Object3D(),vv=new T.Vector3(),nn=new T.Vector3();
const mat3=new T.Matrix3();
function texture(kind){
 // One small, shared, mipmapped map per surface. Macro stains and fine grain
 // are baked once; weather never adds a per-frame shader-noise pass.
 const n=128,data=new Uint8Array(n*n*4),r=random(({wood:93421,roof:39473,brick:18273,floor:81547,stone:22763})[kind]);
 const TAU=Math.PI*2,columns=Array.from({length:n},()=>.78+r()*.22);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=x/n,vv=y/n,a=TAU*u,b=TAU*vv;
  const broad=.5+.22*Math.sin(a)+.17*Math.sin(b*2+a)+.11*Math.cos(a*3-b*2);
  const grain=Math.sin(a*23+.72*Math.sin(b*2)+.27*Math.sin(a*3+b));
  let value=.85+r()*.15,red=1,green=.98,blue=.93;
  if(kind==='wood'||kind==='floor'){
   const knot=Math.sin(a*7+Math.sin(b*2)*.9)*Math.sin(b*3);
   value*=.83+.12*grain*grain+.05*broad;
   value*=.92+.08*columns[x];
   if(knot>.86)value*=.85;
   // Fine longitudinal checks and pale fibres, rather than repeating dark bars.
   if(grain<-.965&&Math.sin(b*5+a*2)>.20)value*=.64;
   if(kind==='floor'){
    const dust=.13+.16*broad;
    value=value*(1-dust)+.81*dust;
    // Four broad planks per repeat. Grain and joints share mip filtering, so
    // their subpixel detail fades instead of shimmering as separate dark boxes.
    const across=x%32;
    if(across<2||across>30)value*=.49+.26*broad;
    if((y+(Math.floor(x/32)%4)*32)%128<1)value*=.61;
    green=.965;blue=.88;
   }
  }else if(kind==='roof'){
   value*=.80+.16*Math.cos(a*8)**6+.04*broad;
   const oxide=Math.max(0,broad-.48)*(.32+.68*columns[x]);
   red=1;green=.99-oxide*.25;blue=.95-oxide*.42;
  }else if(kind==='brick'){
   const mortar=y%24<2||(x+(Math.floor(y/24)%2)*24)%48<2;
   value=mortar?.57:.74+.20*r()+broad*.06;
  }else{
   value*=.72+.20*broad+.08*Math.sin(a*9+b*5)**2;
   green=.975;blue=.89;
  }
  const i=(y*n+x)*4;data[i]=255*value*red;data[i+1]=255*value*green;data[i+2]=255*value*blue;data[i+3]=255;
 }
 const tex=new T.DataTexture(data,n,n);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.anisotropy=4;tex.generateMipmaps=true;tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;return tex;
}
const woodTex=texture('wood'),roofTex=texture('roof'),brickTex=texture('brick'),floorTex=texture('floor'),stoneTex=texture('stone');
const shared=new Set([unitBox,floorSlabGeo,barrelGeo,hoopGeo,stoneGeo,cylinder,woodTex,roofTex,brickTex,floorTex,stoneTex]);
function material(color,map=null){let m=new T.MeshStandardMaterial({color,map,vertexColors:true,roughness:1,side:T.DoubleSide});shared.add(m);return m;}
const M={wood:material('#938b7c',woodTex),red:material('#914e40',woodTex),darkRed:material('#72483d',woodTex),dark:material('#514b40',woodTex),trim:material('#bfbaa5',woodTex),brick:material('#956950',brickTex),brickDark:material('#71584b',brickTex),stone:material('#817b6c',stoneTex),roof:material('#4c5350',roofTex),tin:material('#7b827a',roofTex),rust:material('#795b45',roofTex),black:material('#202e2a'),metal:material('#515950'),floor:material('#867b61',floorTex),hay:material('#92815a')};
export function isSharedBuildingResource(resource){return shared.has(resource);}
M.farmRed=material('#c4bbb1',ruralTextures.barnRed);
// Finishes share finite material/texture pools. Masonry keeps its brick map
// and jamb construction when painted, rather than turning into timber boards.
const FINISH={gray:M.wood,red:M.farmRed,ochre:material('#a79866',woodTex),whitewash:material('#cec7b0',woodTex),olive:material('#78836a',woodTex),darkwood:material('#65584b',woodTex)};
const BRICK_FINISH={gray:material('#8b8b7c',brickTex),red:M.brick,ochre:material('#a49466',brickTex),whitewash:material('#c5c0a8',brickTex),olive:material('#858769',brickTex),darkwood:material('#665849',brickTex)};
for(const [finish,mat]of Object.entries(FINISH))mat.name='Rural timber / '+finish;
for(const [finish,mat]of Object.entries(BRICK_FINISH))mat.name='Rural masonry / '+finish;
for(const [name,mat]of Object.entries({dark:M.roof,tin:M.tin,rust:M.rust}))mat.name='Rural roof / '+name;

// Every board, brace, shingle-course and prop is merged by material. Vertex
// colour gives deterministic wear without one material or draw call per board.
class Batch{
 constructor(r,weather,level=0){this.parts=new Map();this.r=r;this.weather=weather;this.level=level;this.boxes=0;this.halfWidth=0;this.halfDepth=0;}
 add(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,shade=null){
  tmp.position.set(x,y,z);tmp.rotation.set(rx,ry,rz);tmp.scale.set(sx,sy,sz);tmp.updateMatrix();this.matrix(geo,mat,tmp.matrix,shade);
 }
 matrix(geo,mat,matrix,shade=null){
  // Consume exactly the same random values even when subpixel details are
  // omitted. Doors, porch choices, stored equipment and colliders stay stable.
  const shade0=shade===null?1-this.weather*.23+this.r()*.15:shade;
  if(this.level&&geo===unitBox){const e=matrix.elements,spans=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])].sort((a,b)=>b-a);if(spans[1]<(this.level===2?.115:.035)||spans[0]<(this.level===2?.24:.10))return;}
  if(!this.parts.has(mat))this.parts.set(mat,{p:[],n:[],u:[],c:[]});const a=this.parts.get(mat),p=geo.attributes.position,n=geo.attributes.normal;mat3.getNormalMatrix(matrix);
  for(let i=0;i<p.count;i++){
   vv.fromBufferAttribute(p,i).applyMatrix4(matrix);nn.fromBufferAttribute(n,i).applyNormalMatrix(mat3);
   a.p.push(vv.x,vv.y,vv.z);a.n.push(nn.x,nn.y,nn.z);
   let nx=Math.abs(nn.x),ny=Math.abs(nn.y),nz=Math.abs(nn.z);
   if(ny>nx&&ny>nz)a.u.push(mat===M.floor?(vv.x+this.halfWidth-.12)/1.2:vv.x*.6,vv.z*.6);else if(nx>nz)a.u.push(vv.z*.6,vv.y*.6);else a.u.push(vv.x*.6,vv.y*.6);
   // Stable object-space weather: rain-darkened feet, sun-washed upper wood,
   // and dust retained against walls. No random draws alter generation choices.
   let red=shade0,green=shade0,blue=shade0;
   if(mat.map===woodTex||mat.map===brickTex){
    const basal=Math.max(0,1-Math.max(0,vv.y)/1.45);
    const mottled=.89+.11*Math.sin(vv.x*.79+vv.z*.53+this.weather*5)**2;
    const wear=mottled*(1-basal*(.16+this.weather*.09));
    red*=wear;green*=wear*(1-basal*.035);blue*=wear*(1-basal*.085);
   }
   if((mat===M.floor||mat===M.stone)&&nn.y>.7&&vv.y<.04){
    const edge=Math.min(this.halfWidth-Math.abs(vv.x),this.halfDepth-Math.abs(vv.z));
    const corner=Math.max(0,1-edge/1.25);
    const patch=.92+.10*Math.sin(vv.x*.93+this.weather*4)*Math.cos(vv.z*.66)+.06*Math.sin(vv.z*2.1+vv.x*.31);
    const tone=patch*(1-corner*.12);
    red*=tone;green*=tone*.963;blue*=tone*.864;
   }
   a.c.push(red,green,blue);
  }
 }
 box(mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,shade=null){if(w<=.0001||h<=.0001||d<=.0001)return;this.boxes++;this.add(unitBox,mat,x,y,z,w,h,d,rx,ry,rz,shade);}
 boardPanel(mat,x,y,z,w,h,d,count){let shade=0;for(let i=0;i<count;i++)shade+=1-this.weather*.23+this.r()*.15;this.box(mat,x,y,z,w,h,d,0,0,0,shade/count);}
 beam(mat,a,b,w=.12,d=w){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);tmp.position.copy(av).add(bv).multiplyScalar(.5);tmp.quaternion.setFromUnitVectors(up,delta.clone().normalize());tmp.scale.set(w,delta.length(),d);tmp.updateMatrix();this.matrix(unitBox,mat,tmp.matrix);}
 polygon(mat,points,shade=1){
  let p=[];for(let i=1;i<points.length-1;i++)p.push(...points[0],...points[i],...points[i+1]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();this.add(g,mat,0,0,0,1,1,1,0,0,0,shade);g.dispose();
 }
 finish(group){for(const [mat,a]of this.parts){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(a.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(a.u,2));g.setAttribute('color',new T.Float32BufferAttribute(a.c,3));g.computeBoundingSphere();g.computeBoundingBox();const mesh=new T.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}}
}
export function makeRuralBuilding(f,level=0){
 // Existing authored landmarks retain their exact historical geometry.
 level=f.compoundLod?Math.max(0,Math.min(2,level|0)):0;
 const v=((f.variant||0)%8+8)%8,[w,d,h]=unscaledBuildingDimensions(f),s=f.buildingScale||1,angle=f.buildingAngle||0;
 const r=random((f.seed||1)^0x8a7e551),weather=.35+r()*.65,b=new Batch(r,weather,level),group=new T.Group(),colliders=[],pickups=[],rainRoofs=[];
 const y=f.buildingY??height(f.cx,f.cz,f.x,f.z),c=Math.cos(angle),sn=Math.sin(angle),isBrick=v===4;
 const defaultWall=isBrick?(r()<.5?M.brick:M.brickDark):(v===2?M.red:v===3?(r()<.65?M.red:M.wood):v===6?M.darkRed:M.wood);
 const wallMat=(isBrick?BRICK_FINISH:FINISH)[f.buildingFinish]||defaultWall;
 const defaultRoof=r()<.2?M.rust:r()<.55?M.roof:M.tin,roofMat=({rust:M.rust,tin:M.tin,dark:M.roof,iron:M.roof})[f.buildingRoofFinish]||defaultRoof,trim=(v===2||v===3||v===6)?M.trim:M.dark;
 const front=d/2,back=-d/2,wallRuns=[],detailRandom=random((f.seed||1)^0x41c6f93b);b.halfWidth=w/2;b.halfDepth=d/2;
 function world(x,z){return{x:f.cx+s*(c*x+sn*z),z:f.cz+s*(-sn*x+c*z)};}
 function solid(x,z,hx,hz,localAngle=0){const p=world(x,z);colliders.push({kind:'obb',x:p.x,z:p.z,hx:hx*s,hz:hz*s,angle:angle+localAngle});}
 function block(mat,x,yy,z,ww,hh,dd,ry=0,collide=true){b.box(mat,x,yy,z,ww,hh,dd,0,ry);if(collide)solid(x,z,ww/2,dd/2,ry);}
 // A wall is composed around actual holes. Only floor-reaching openings split
 // the movement collider; a window sill remains solid at player height.
 function wall(axis,fixed,start,end,hh,openings=[],mat=wallMat,siding='vertical',base=0){
  const thickness=isBrick&&mat===wallMat?.27:.14;
  const doorIntervals=openings.filter(o=>o.bottom<.15).map(o=>[o.at-o.width/2,o.at+o.width/2]).sort((a,b)=>a[0]-b[0]);
  let from=start;for(const [lo,hi]of [...doorIntervals,[end,end]]){if(lo>from&&base<.15){const mid=(from+lo)/2;if(axis==='z')solid(mid,fixed,(lo-from)/2,thickness/2);else solid(fixed,mid,thickness/2,(lo-from)/2);wallRuns.push({axis,fixed,start:from,end:lo,thickness});}from=Math.max(from,hi);}
  const xs=[start,end,...openings.flatMap(o=>[o.at-o.width/2,o.at+o.width/2]).filter(a=>a>start&&a<end)].sort((a,b)=>a-b);
  const ys=[base,hh,...openings.flatMap(o=>[o.bottom,o.bottom+o.height]).filter(a=>a>base&&a<hh)].sort((a,b)=>a-b);
  for(let xi=0;xi<xs.length-1;xi++)for(let yi=0;yi<ys.length-1;yi++){
   const a=xs[xi],e=xs[xi+1],low=ys[yi],high=ys[yi+1],mx=(a+e)/2,my=(low+high)/2;
   if(e-a<=.0001||high-low<=.0001)continue;
   if(openings.some(o=>Math.abs(mx-o.at)<o.width/2-.001&&my>o.bottom&&my<o.bottom+o.height))continue;
   const stone=mat===M.brick||mat===M.brickDark||(isBrick&&mat===wallMat);
   if(stone){if(axis==='z')b.box(mat,mx,my,fixed,e-a,high-low,thickness);else b.box(mat,fixed,my,mx,thickness,high-low,e-a);continue;}
   if(siding==='horizontal'){
    if(level){const count=Math.max(1,Math.ceil((high-low)/.235));if(axis==='z')b.boardPanel(mat,mx,my,fixed,e-a,high-low,thickness,count);else b.boardPanel(mat,fixed,my,mx,thickness,high-low,e-a,count);continue;}
    const n=Math.max(1,Math.ceil((high-low)/.235));for(let j=0;j<n;j++){const bh=(high-low)/n,yy=low+(j+.5)*bh;if(axis==='z')b.box(mat,mx,yy,fixed,e-a,bh-.012,thickness,0,0,0);else b.box(mat,fixed,yy,mx,thickness,bh-.012,e-a);}
   }else{
    if(level){const count=Math.max(1,Math.ceil((e-a)/(v===1?.16:.30)));if(axis==='z')b.boardPanel(mat,mx,my,fixed,e-a,high-low,thickness,count);else b.boardPanel(mat,fixed,my,mx,thickness,high-low,e-a,count);continue;}
    const n=Math.max(1,Math.ceil((e-a)/(v===1?.16:.30)));for(let j=0;j<n;j++){const bw=(e-a)/n,at=a+(j+.5)*bw;if(axis==='z')b.box(mat,at,my,fixed,bw-.011,high-low,thickness);else b.box(mat,fixed,my,at,thickness,high-low,bw-.011);}
   }
  }
  for(const o of openings){if(o.bottom<.15)continue;windowFrame(axis,fixed,o,trim);}
 }
 function windowFrame(axis,fixed,o,mat){
  const off=fixed>=0?.11:-.11;
  function piece(a,yy,ww,hh,dep=.09){if(axis==='z')b.box(mat,a,yy,fixed+off,ww,hh,dep);else b.box(mat,fixed+off,yy,a,dep,hh,ww);}
  for(const a of[o.at-o.width/2,o.at+o.width/2])piece(a,o.bottom+o.height/2,.105,o.height+.14);
  for(const yy of[o.bottom,o.bottom+o.height])piece(o.at,yy,o.width+.18,.095);
  piece(o.at,o.bottom+o.height/2,.045,o.height);piece(o.at,o.bottom+o.height/2,o.width,.045);
  // Recessed opaque blue-green panes preserve clear window silhouette.
  if(axis==='z')b.box(M.black,o.at,o.bottom+o.height/2,fixed-.025*Math.sign(fixed),o.width-.07,o.height-.07,.023,0,0,0,.94);
  else b.box(M.black,fixed-.025*Math.sign(fixed),o.bottom+o.height/2,o.at,.023,o.height-.07,o.width-.07,0,0,0,.94);
 }
 function floor(wood=true){
  b.add(floorSlabGeo,wood?M.floor:M.stone,0,-.07,0,w-.15,.14,d-.12);
  // Plank seams are baked into floorTex at their original 30 cm spacing.
  // The old explicit-shade seam boxes consumed no generation random numbers.
  // An inexpensive low grid lets corner grime and tracked dust vary across the
  // floor; it is merged into its existing material draw. Floor height is intact.
  const nx=level===2?2:Math.max(2,Math.ceil(w/1.7)),nz=level===2?2:Math.max(2,Math.ceil(d/1.7));
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
   const x0=-w/2+.078+(w-.156)*ix/nx,x1=-w/2+.078+(w-.156)*(ix+1)/nx;
   const z0=back+.064+(d-.128)*iz/nz,z1=back+.064+(d-.128)*(iz+1)/nz;
   b.polygon(wood?M.floor:M.stone,[[x0,.002,z0],[x0,.002,z1],[x1,.002,z1],[x1,.002,z0]],1);
  }
 }
 function cornerPosts(){for(const xx of[-w/2,w/2])for(const zz of[back,front])b.box(trim,xx,h/2,zz,.18,h,.19);}
 function gableProfile(width,wallH,rise,mat=roofMat,roofDepth=d,z0=0){
  const e=.42,hw=width/2;
  const points=[[-hw,wallH],[0,wallH+rise],[hw,wallH]];
  roofSegments([[-hw-e,wallH-e*rise/hw],[0,wallH+rise],[hw+e,wallH-e*rise/hw]],roofDepth+e*2,mat,z0);
  for(const zz of[-roofDepth/2,roofDepth/2]){
   b.polygon(wallMat,points.map(([x,yy])=>[x,yy,z0+zz]));
   for(let xx=-hw+.3;xx<hw;xx+=.32){const rh=rise*(1-Math.abs(xx)/hw);b.box(wallMat,xx,wallH+rh/2,z0+zz,.026,rh,.045,0,0,0,.77);}
   b.beam(trim,[-hw-.18,wallH,z0+zz+.03],[0,wallH+rise+.06,z0+zz+.03],.14);
   b.beam(trim,[0,wallH+rise+.06,z0+zz+.03],[hw+.18,wallH,z0+zz+.03],.14);
  }
  for(let zz=-roofDepth/2+.8;zz<roofDepth/2;zz+=2.4){
   b.beam(M.dark,[-hw+.13,wallH-.15,z0+zz],[hw-.13,wallH-.15,z0+zz],.17);
   for(const sign of[-1,1])b.beam(M.dark,[sign*(hw-.15),wallH-.11,z0+zz],[0,wallH+rise-.15,z0+zz],.16);
   b.beam(M.dark,[0,wallH-.1,z0+zz],[0,wallH+rise-.16,z0+zz],.11);
  }
  b.box(mat,0,wallH+rise+.06,z0,.17,.14,roofDepth+.9);
 }
 function roofSegments(points,depth,mat,z0=0){
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],slope=(b[1]-a[1])/(b[0]-a[0]);rainRoofs.push({minX:Math.min(a[0],b[0]),maxX:Math.max(a[0],b[0]),minZ:z0-depth/2,maxZ:z0+depth/2,y0:a[1]-slope*a[0]+.09,yx:slope,yz:0});}
  for(let i=0;i<points.length-1;i++){
   const a=points[i],q=points[i+1],dx=q[0]-a[0],dy=q[1]-a[1],len=Math.hypot(dx,dy),rot=Math.atan2(dy,dx),cx=(a[0]+q[0])/2,cy=(a[1]+q[1])/2;
   b.box(mat,cx,cy,z0,len,.10,depth,0,0,rot);
   // Raised seams and transverse laps read as corrugated/standing-seam sheet.
   for(let zz=-depth/2+.15;zz<depth/2;zz+=mat===M.roof?.55:.74)b.box(mat,cx,cy+.065,z0+zz,len,.025,.026,0,0,rot,.89+r()*.18);
   for(let t=.22;t<1;t+=.26)b.box(mat,a[0]+dx*t,a[1]+dy*t+.072,z0,.027,.020,depth,0,0,rot,.83);
  }
 }
 function roofBeamPosts(){for(let zz=back+.45;zz<=front-.45;zz+=3.0){for(const sign of[-1,1]){const xx=sign*(w/2-.25);b.box(M.dark,xx,h/2,zz,.19,h,.19);b.beam(M.dark,[xx,h-1,zz],[xx-sign*.8,h-.2,zz],.13);}}}
 function entrance(at,width,dh,zz=front,slide=true){
  // Worn timber threshold reaches the graded earth; its top stays flush.
  b.box(M.dark,at,-.050,zz+.12,width-.045,.105,.30,0,0,0,.96);
  for(const sign of[-1,1])b.box(trim,at+sign*(width/2+.06),dh/2,zz+.06,.15,dh,.19);
  b.box(trim,at,dh+.06,zz+.10,width+.3,.19,.20);
  const leaf=width/2;
  if(slide){
   b.box(M.metal,at,dh+.28,zz+.13,width*2+.22,.07,.08);
   for(const sign of[-1,1]){let x=at+sign*(width/2+leaf/2+.04);doorPanel(x,dh/2,zz+.21,leaf-.09,dh-.09,0);}
  }else{
   const yaw=-1.3,hinge=at+width/2,dx=Math.cos(yaw)*width/2,dz=-Math.sin(yaw)*width/2;
   doorPanel(hinge+dx,dh/2,zz+dz,width-.10,dh-.09,yaw);solid(hinge+dx,zz+dz,(width-.10)/2,.065,yaw);
  }
 }
 function doorPanel(x,yy,z,width,hh,yaw){
  const cc=Math.cos(yaw),ss=Math.sin(yaw);function pt(lx,ly,lz=0){return[x+cc*lx+ss*lz,yy+ly,z-ss*lx+cc*lz];}
  for(let i=0;i<Math.ceil(width/.23);i++){let bw=width/Math.ceil(width/.23),p=pt(-width/2+(i+.5)*bw,0);b.box(isBrick?M.wood:wallMat,...p,bw-.012,hh,.1,0,yaw);}
  for(const dy of[-hh*.37,hh*.37]){let p=pt(0,dy,.072);b.box(trim,...p,width,.10,.055,0,yaw);}
  b.beam(trim,pt(-width*.44,-hh*.36,.09),pt(width*.44,hh*.36,.09),.065);
  if(width>1.2)b.beam(trim,pt(width*.44,-hh*.36,.09),pt(-width*.44,hh*.36,.09),.065);
  for(const dy of[-hh*.30,hh*.30]){let p=pt(-width*.32,dy,.112);b.box(M.metal,...p,.29,.035,.025,0,yaw);}
  let p=pt(width*.35,0,.14);b.box(M.metal,...p,.035,.19,.025,0,yaw);
 }
 function barrel(x,z){b.add(barrelGeo,r()<.5?M.dark:M.rust,x,.53,z);for(const yy of[.19,.78])b.add(hoopGeo,M.metal,x,yy,z);b.add(cylinder,M.metal,x+.20,1.065,z+.12,.048,.017,.048);solid(x,z,.44,.44);}
 function lumber(x,z,len=3){for(let j=0;j<12;j++){let yy=.06+Math.floor(j/3)*.12,xx=x+(j%3-.9)*.22;b.box(j%3?M.wood:M.dark,xx,yy,z+(r()-.5)*.13,.19,.105,len,0,(r()-.5)*.035);}solid(x,z,.45,len/2);}
 function ladder(x,z,hh=3.8){const lean=.35;for(const sign of[-1,1])b.beam(M.wood,[x+sign*.28,.05,z+lean],[x+sign*.28,hh,z],.075);for(let yy=.3;yy<hh;yy+=.29)b.box(M.dark,x,yy,z+lean*(1-yy/hh),.65,.075,.065);solid(x,z+.18,.36,.22);}
 function bench(x,z,len=2.4){b.box(M.wood,x,.90,z,len,.13,.68);for(const xx of[-len*.42,len*.42])for(const zz of[-.24,.24])b.box(M.dark,x+xx,.44,z+zz,.095,.9,.095);b.box(M.dark,x,.24,z,len-.1,.08,.51);solid(x,z,len/2,.36);}
 function smallVent(x,yy,z){b.box(M.black,x,yy,z,.64,.52,.035);for(let k=0;k<5;k++)b.box(trim,x,yy-.2+k*.1,z+.036,.67,.033,.085,.16);}
 function porch(ww,deep=1.8){const zz=front+deep/2;rainRoofs.push({minX:-ww/2-.18,maxX:ww/2+.18,minZ:front-.18,maxZ:front+deep+.18,y0:2.80-Math.tan(.14)*zz,yx:0,yz:Math.tan(.14)}); b.box(M.floor,0,-.03,zz,ww,.11,deep);for(const xx of[-ww/2,ww/2]){b.box(M.dark,xx,1.28,front+deep-.15,.14,2.56,.14);solid(xx,front+deep-.15,.08,.08);b.beam(M.dark,[xx,1.9,front+deep-.15],[xx,2.6,front+deep-.8],.1);}b.box(roofMat,0,2.72,zz,ww+.35,.1,deep+.36,-.14);}
 function hayBales(x,z,n=3){for(let i=0;i<n;i++){let zz=z+(i%2)*.72,xx=x+Math.floor(i/2)*.80;b.box(M.hay,xx,.31,zz,.77,.60,.64,0,(r()-.5)*.06);for(const dx of[-.24,.24])b.box(M.dark,xx+dx,.619,zz,.018,.012,.66,0,0,0,.87);}solid(x+(Math.floor((n-1)/2))*.4,z+.35,.4+Math.floor((n-1)/2)*.4,.7);}

 if(v===0){ // Narrow weatherboard workshop, offset door and optional porch.
  floor();let door={at:-1.15,width:1.55,bottom:0,height:2.4};
  wall('z',front,-w/2,w/2,h,[door,{at:1.65,width:1.1,bottom:1.15,height:1.05}],wallMat,'horizontal');
  wall('z',back,-w/2,w/2,h,[],wallMat,'horizontal');
  wall('x',-w/2,back,front,h,[{at:-1.8,width:1.0,bottom:1.2,height:.92}],wallMat,'horizontal');
  wall('x',w/2,back,front,h,[],wallMat,'horizontal');cornerPosts();gableProfile(w,h,1.45);entrance(-1.15,1.55,2.4,front,false);roofBeamPosts();
  bench(w/2-1.55,back+1.1,2.6);if(r()<.6)barrel(-w/2+.65,back+.7);else lumber(-w/2+.6,back+2,2.5);
  if(r()<.47)porch(5.2,1.65);smallVent(0,h+.52,front+.10);
 }else if(v===1){ // Compact privy, steep front gable and detailed open plank door.
  floor();const door={at:0,width:1.12,bottom:0,height:2.32};wall('z',front,-w/2,w/2,h,[door]);wall('z',back,-w/2,w/2,h);
  wall('x',-w/2,back,front,h,[{at:-.6,width:.46,bottom:2.02,height:.38}]);wall('x',w/2,back,front,h);cornerPosts();gableProfile(w,h,.95);entrance(0,1.12,2.32,front,false);
  // Seat is built around a visible dark opening; no central doorway blocker.
  b.box(M.dark,0,.37,back+.45,2.1,.74,.80);b.box(M.wood,-.68,.79,back+.45,.74,.11,.85);b.box(M.wood,.68,.79,back+.45,.74,.11,.85);b.box(M.wood,0,.79,back+.12,.62,.11,.2);b.box(M.wood,0,.79,back+.79,.62,.11,.15);solid(0,back+.45,1.07,.45);
  smallVent(0,h+.34,front+.10);for(let yy=.25;yy<2.45;yy+=.24){b.box(M.dark,-w/2-.08,yy,back+.55,.02,.012,.31,0,0,0,.67);b.box(M.dark,w/2+.08,yy,front-.48,.02,.012,.35,0,0,0,.71);}
  if(r()<.65){b.add(cylinder,M.metal,w/2-.26,h+.21,back+.32,.065,1.4,.065);b.box(M.metal,w/2-.26,h+.95,back+.32,.23,.04,.23);}
 }else if(v===2){ // Tall red wagon barn: broad central doorway, hay hood, trusses.
  floor();const dw=4.4,dh=3.9;wall('z',front,-w/2,w/2,h,[{at:0,width:dw,bottom:0,height:dh}]);wall('z',back,-w/2,w/2,h);
  for(const side of[-1,1])wall('x',side*w/2,back,front,h,[{at:-d*.18,width:1.15,bottom:2.15,height:1.3}]);cornerPosts();gableProfile(w,h,3.2);entrance(0,dw,dh);roofBeamPosts();
  b.box(M.dark,0,h+.75,front+.06,2.12,1.52,.07);for(const sign of[-1,1]){b.box(trim,sign*1.1,h+.75,front+.14,.10,1.65,.12);b.beam(trim,[sign*1.05,h+.08,front+.18],[-sign*1.05,h+1.48,front+.18],.09);}b.box(trim,0,h+1.52,front+.15,2.3,.1,.13);
  rainRoofs.push({minX:-.625,maxX:.625,minZ:front-.37,maxZ:front+1.33,y0:h+3.15,yx:0,yz:0});b.box(roofMat,0,h+3.10,front+.48,1.25,.1,1.7);b.beam(M.dark,[0,h+2.2,front-.1],[0,h+2.2,front+1.4],.12);
  lumber(-w/2+1.1,back+3,3.5);if(r()<.55)ladder(w/2-1,back+1.1,4.5);else barrel(w/2-.75,back+.7);
  b.box(M.dark,0,h-.42,back+2,w-.45,.17,3.9);for(let xx=-w/2+.3;xx<w/2;xx+=.27)b.box(M.floor,xx,h-.30,back+2,.25,.10,3.7);
 }else if(v===3){ // Dairy barn: gambrel double-pitch roof, two ventilators, window row.
  floor(false);const dw=4,dh=3.7;wall('z',front,-w/2,w/2,h,[{at:0,width:dw,bottom:0,height:dh}]);wall('z',back,-w/2,w/2,h);
  for(const side of[-1,1])wall('x',side*w/2,back,front,h,[-5.8,-2.2,1.4,5].map(at=>({at,width:1.42,bottom:1.55,height:1.40})));
  cornerPosts();roofBeamPosts();entrance(0,dw,dh);let profile=[[-w/2-.4,h-.15],[-w*.29,h+2.9],[0,h+4.1],[w*.29,h+2.9],[w/2+.4,h-.15]];roofSegments(profile,d+.9,roofMat);
  for(const zz of[back,front]){b.polygon(wallMat,[[-w/2,h,zz],[-w*.29,h+2.9,zz],[0,h+4.1,zz],[w*.29,h+2.9,zz],[w/2,h,zz]]);for(let i=0;i<profile.length-1;i++)b.beam(trim,[profile[i][0],profile[i][1],zz+.06],[profile[i+1][0],profile[i+1][1],zz+.06],.15);smallVent(0,h+2.75,zz+.12);}
  for(let zz=back+1;zz<front;zz+=2.8){b.box(M.dark,0,h-.2,zz,w-.3,.20,.21);for(let i=0;i<profile.length-1;i++)b.beam(M.dark,[profile[i][0]*.96,profile[i][1]-.20,zz],[profile[i+1][0]*.96,profile[i+1][1]-.20,zz],.16);for(const sign of[-1,1])b.beam(M.dark,[sign*w*.4,h-.1,zz],[sign*w*.28,h+2.65,zz],.14);}
  for(const zz of[-d*.25,d*.25]){b.box(M.dark,0,h+4.28,zz,.95,.55,.95);for(let yy=h+4.05;yy<h+4.58;yy+=.12){b.box(trim,0,yy,zz+.49,1.04,.04,.06);b.box(trim,0,yy,zz-.49,1.04,.04,.06);}b.add(cylinder,roofMat,0,h+4.83,zz,.75,.16,.75);b.box(roofMat,0,h+4.73,zz,1.20,.1,1.20);}
  // Stanchions line one wall; broad central aisle stays unobstructed.
  for(let zz=back+2;zz<front-2;zz+=1.45){b.box(M.metal,-w/2+2.0,1.05,zz,.07,2.1,.07);b.beam(M.metal,[-w/2+2,1.80,zz],[-w/2+.4,1.8,zz],.06);}solid(-w/2+1.12,-.1,1.1,d/2-1.9);
  b.box(M.wood,-w/2+1.1,.34,0,1.50,.12,d-3);lumber(w/2-.75,back+2,3);if(r()<.55)barrel(w/2-.75,front-2);
 }else if(v===4){ // Brick barn: deep masonry jambs, brick vents, shallow roof.
  floor(false);const dw=3.6,dh=3.25;wall('z',front,-w/2,w/2,h,[{at:0,width:dw,bottom:0,height:dh}]);wall('z',back,-w/2,w/2,h);
  for(const side of[-1,1])wall('x',side*w/2,back,front,h,[-3.6,1.7].map(at=>({at,width:1.05,bottom:1.58,height:1.15})));
  gableProfile(w,h,2.0,f.buildingRoofFinish?roofMat:M.roof);entrance(0,dw,dh);roofBeamPosts();
  // Soldier course around doorway and dentil cornice carry the masonry silhouette.
  for(let xx=-dw/2-.12;xx<dw/2+.18;xx+=.22)b.box(M.brick,xx,dh+.20,front+.17,.18,.34,.12,0,0,0,.95+r()*.14);
  for(const zz of[front,back]){b.box(M.brick,0,h-.10,zz,w+.2,.20,.38);for(let xx=-w/2+.2;xx<w/2;xx+=.49)b.box(M.brick,xx,h-.29,zz,.24,.16,.41);for(let row=0;row<3;row++)for(let col=-row;col<=row;col++)b.box(M.black,col*.30,h+1.45-row*.29,zz+.155,.15,.15,.03);}
  for(const side of[-1,1]){b.box(M.brick,side*w/2,.19,0,.40,.38,d);for(let zz=back+1.2;zz<front;zz+=3.15)b.box(M.brick,side*(w/2+.1),h/2,zz,.30,h,.32);}
  bench(w/2-1.15,back+1,2.1);if(r()<.5)barrel(-w/2+.7,back+.7);else lumber(-w/2+.75,back+2.2,2.6);
 }else if(v===5){ // Open implement shelter: three broad bays, tall front shed roof.
  floor(false);wall('z',back,-w/2,w/2,h-.9);wall('x',-w/2,back,front,h-.9);wall('x',w/2,back,front,h-.9);for(const xx of[-w/2,w/2])b.polygon(wallMat,[[xx,h-.9,back],[xx,h-.9,front],[xx,h,front]]);
  rainRoofs.push({minX:-w/2-.43,maxX:w/2+.43,minZ:back-.5,maxZ:front+.5,y0:h-.28,yx:0,yz:.9/d});let roofAngle=-Math.atan2(.9,d);b.box(roofMat,0,h-.40,0,w+.85,.12,Math.hypot(d+1,.9),roofAngle);for(let xx=-w/2-.3;xx<w/2+.4;xx+=.62)b.box(roofMat,xx,h-.325,0,.035,.035,d+.95,roofAngle);
  const posts=[-w/2,-w/6,w/6,w/2];for(const xx of posts){block(M.dark,xx,h/2,front,.23,h,.23);b.box(M.dark,xx,h/2-.4,back,.23,h-.8,.23);for(const sign of[-1,1])if(Math.abs(xx+sign*.85)<w/2+.01)b.beam(M.wood,[xx,h-1.15,front],[xx+sign*.9,h-.13,front],.15);b.beam(M.dark,[xx,h-.23,front],[xx,h-.98,back],.18);}
  for(let xx=-w/2+.25;xx<w/2;xx+=.42)b.box(M.dark,xx,(h-.9)/2,back-.09,.033,h-.95,.025);for(const side of[-1,1])for(let zz=back+.3;zz<front;zz+=.65)b.box(M.dark,side*(w/2+.09),(h-.9)/2,zz,.025,h-.95,.032);b.box(M.dark,0,h-.2,front,w+.1,.30,.23);b.box(M.dark,0,h-1.0,back,w+.1,.24,.21);for(let zz=back+.3;zz<front;zz+=1.1)b.box(M.dark,0,h-.48+zz/d*.9,zz,w,.11,.10);
  lumber(-w/2+1,back+2,3.1);if(r()<.62){barrel(w/2-.75,back+.8);barrel(w/2-1.7,back+.7);}else hayBales(w/2-1.5,back+1,4);
 }else if(v===6){ // Horse stable with raised monitor and lower side roofs.
  floor();const dw=3.4,dh=3.15;for(const zz of[front,back])wall('z',zz,-w/2,w/2,h,[{at:0,width:dw,bottom:0,height:dh}]);
  for(const side of[-1,1])wall('x',side*w/2,back,front,h,[-5.6,-1.8,2.0,5.8].map(at=>({at,width:1.32,bottom:1.70,height:1.05})));
  cornerPosts();entrance(0,dw,dh);roofBeamPosts();const mw=4.5,mh=h+1.2;
  for(const side of[-1,1]){roofSegments([[side*w/2,h],[side*mw/2,h+.75]].sort((a,b)=>a[0]-b[0]),d+.8,roofMat);wall('x',side*mw/2,back,front,mh,[-5,0,5].map(at=>({at,width:2.0,bottom:h+.88,height:.22})),wallMat,'horizontal',h+.75);}
  // Close the low wing gables below the monitor; these formerly admitted a
  // broad wedge of sky above each front/back wall. Open doorways are unchanged.
  for(const zz of[back,front])for(const side of[-1,1])b.polygon(wallMat,[[side*w/2,h,zz],[side*mw/2,h+.75,zz],[side*mw/2,h,zz]],.94);
  for(const zz of[back,front]){b.box(wallMat,0,h+.60,zz,mw,1.2,.14);smallVent(0,h+.64,zz+.12);}gableProfile(mw,mh,1.12,roofMat);b.box(trim,0,mh+.02,front,mw,.15,.20);
  // Six stalls with kick boards, open upper rails and solid partitions.
  for(const side of[-1,1])for(let zz=back+1.1;zz<front-2;zz+=3.55){
   let x=side*(w/2+2)/2,len=w/2-2;for(let yy=.15;yy<1.2;yy+=.23)b.box(M.wood,x,yy,zz,len,.20,.10);for(const yy of[1.45,1.85])b.box(M.dark,x,yy,zz,len,.09,.08);for(const xx of[side*2,side*(w/2-.2)])b.box(M.dark,xx,1.0,zz,.13,2.0,.13);solid(x,zz,len/2,.075);
   b.box(M.wood,side*(w/2-.55),.68,zz+1.1,.64,.15,1.0);solid(side*(w/2-.55),zz+1.1,.37,.54);
  }
  if(r()<.6)hayBales(-w/2+.8,front-2.0,2);b.box(M.metal,w/2+.11,2.0,front-1.0,.04,.27,.17);
 }else{ // Low single-slope store, broad opening and short covered side bay.
  floor();const low=h-.75,dh=2.35,dw=3.6;wall('z',front,-w/2,w/2,low,[{at:-.55,width:dw,bottom:0,height:dh}]);wall('z',back,-w/2,w/2,h);wall('x',-w/2,back,front,low);wall('x',w/2,back,front,low,[{at:-2.4,width:1.16,bottom:1.2,height:.86}]);
  // Triangular closures meet the one-way slope exactly.
  for(const xx of[-w/2,w/2])b.polygon(wallMat,[[xx,low,back],[xx,h,back],[xx,low,front]]);
  rainRoofs.push({minX:-w/2-.4,maxX:w/2+.4,minZ:back-.45,maxZ:front+.45,y0:(h+low)/2+.14,yx:0,yz:-.75/d});const rot=Math.atan2(.75,d);b.box(roofMat,0,(h+low)/2+.05,0,w+.8,.12,Math.hypot(d+.9,.75),rot);for(let xx=-w/2-.3;xx<w/2+.4;xx+=.55)b.box(roofMat,xx,(h+low)/2+.12,0,.035,.03,d+.8,rot);
  entrance(-.55,dw,dh);for(let zz=back+.5;zz<front;zz+=2.0){let yy=h-(zz-back)/d*.75-.16;b.box(M.dark,0,yy,zz,w-.1,.17,.16);for(const side of[-1,1])b.box(M.dark,side*(w/2-.14),yy/2,zz,.17,yy,.17);}
  bench(w/2-1.4,back+1.0,2.2);lumber(-w/2+.70,back+2,2.8);if(r()<.5)barrel(w/2-.75,front-1.2);
  if(r()<.5){const xx=w/2+1.0,zz=front-2.4;rainRoofs.push({minX:xx-1.05,maxX:xx+1.05,minZ:zz-1.6,maxZ:zz+1.6,y0:2.25+Math.tan(.22)*xx,yx:-Math.tan(.22),yz:0});b.box(roofMat,xx,2.15,zz,2.1,.12,3.2,0,0,-.22);for(const z1 of[zz-1.4,zz+1.4])block(M.dark,w/2+1.95,.99,z1,.12,1.98,.12);b.box(M.dark,xx,1.95,zz,2.05,.1,2.7);}
 }
 // Scars, repaired lower boards and irregular foot stones are seeded and sparse.
 if(!isBrick){for(let i=0;i<(v===1?8:14);i++){let zz=back+.2+r()*(d-.4),yy=.2+r()*Math.min(2,h-.3),side=r()<.5?-1:1;b.box(r()<.5?M.dark:wallMat,side*(w/2+.084),yy,zz,.018,.025+r()*.10,.25+r()*.3,0,0,0,.71+r()*.15);}}
 for(const xx of[-w/2+.18,w/2-.18])for(const zz of[back+.18,front-.18])b.add(stoneGeo,M.stone,xx,-.05,zz,.32,.16,.29,0,r()*6.28,0,.91);
 // Restrained construction history, all inside the existing roof/door bounds.
 // The independent detail seed preserves original variants, entrances, colliders,
 // resource pickups, optional props and porch/lean-to decisions exactly.
 for(const run of wallRuns){
  const length=run.end-run.start,mid=(run.start+run.end)/2;
  if(length<.20)continue;
  const inward=run.fixed-Math.sign(run.fixed)*(run.thickness/2+.04);
  if(!isBrick){
   if(run.axis==='z')b.box(M.dark,mid,.091,inward,length,.12,.072,0,0,0,.82);
   else b.box(M.dark,inward,.091,mid,.072,.12,length,0,0,0,.82);
  }
  // A shallow interrupted course grounds the existing raised timber floor.
  // Foundation is visual only; stones never project past the old roof footprint.
  const count=Math.max(1,Math.ceil(length/2.9)),unit=length/count;
  for(let i=0;i<count;i++){
   const at=run.start+(i+.5)*unit,gap=.025+detailRandom()*.036;
   const hh=.16+detailRandom()*.065,yy=.023-hh/2;
   const mat=M.stone,tone=.79+detailRandom()*.20;
   if(run.axis==='z')b.box(mat,at,yy,run.fixed,unit-gap,hh,run.thickness+.14,0,0,0,tone);
   else b.box(mat,run.fixed,yy,at,run.thickness+.14,hh,unit-gap,0,0,0,tone);
  }
 }
 if(v!==1){
  // A few iron repair straps on existing frame posts, with flat fastener heads.
  // Faces stay flush; there are no new freestanding objects or collision volumes.
  for(const side of[-1,1])for(const zz of[back+.45,Math.min(front-.45,back+3.45)]){
   if(v===5||v===7)continue;
   const xx=side*(w/2-.25),yy=Math.min(h-.38,2.65),face=zz+.104;
   b.box(M.metal,xx,yy,face,.13,.23,.018,0,0,0,.70);
   for(const dy of[-.066,.066])b.polygon(M.dark,[[xx-.013,yy+dy-.013,face+.011],[xx+.013,yy+dy-.013,face+.011],[xx+.013,yy+dy+.013,face+.011],[xx-.013,yy+dy+.013,face+.011]],.66);
  }
 }
 // Long-grain scuffs and two old repair patches live on the inside side walls.
 // They are surface planes: 24 triangles at most, merged with existing timber.
 if(!isBrick){
  for(const side of[-1,1]){
   const face=side*(w/2-.079),length=Math.min(1.25,d*.18);
   for(let i=0;i<3;i++){
    const zz=back+.7+(d-1.4)*(i+.27)/3,yy=.28+detailRandom()*.61;
    const low=yy-.013,high=yy+.014+detailRandom()*.018;
    b.polygon(M.dark,[[face,low,zz-length/2],[face,high,zz-length*.34],[face,high,zz+length/2],[face,low,zz+length*.42]],.73+detailRandom()*.14);
   }
   const zz=back+d*(side<0?.30:.66),yy=.44+detailRandom()*.18;
   b.box(M.wood,side*(w/2-.09),yy,zz,.032,.14,Math.min(.81,d*.24),0,0,0,.87);
  }
 }
 b.finish(group);group.position.set(f.cx,y+.035,f.cz);group.rotation.y=angle;group.scale.setScalar(s);group.name=`rural-${v}`;group.userData.ruralVariant=v;group.userData.rainRoofs=rainRoofs;
 const bounds=new T.Box3();for(const mesh of group.children)bounds.union(mesh.geometry.boundingBox);
 const nearZ=v===1?.05:Math.min(1.5,d*.15),nearX=v===0?-1.15:0,p=world(nearX,nearZ);
 pickups.push({id:f.key+':barn',x:p.x,z:p.z,y:y+.07});
 const footprint={x:f.cx,z:f.cz,angle,w:(bounds.max.x-bounds.min.x)*s,d:(bounds.max.z-bounds.min.z)*s,h:bounds.max.y*s,hx:Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))*s,hz:Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))*s,minX:bounds.min.x*s,maxX:bounds.max.x*s,minZ:bounds.min.z*s,maxZ:bounds.max.z*s};
 return{group,colliders,pickups,footprint};
}
