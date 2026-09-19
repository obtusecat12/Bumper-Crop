/*
 * Small worker-only triangle BVH and one-bounce diffuse irradiance sampler.
 * Original implementation for Level 10. No third-party code is incorporated.
 * Algorithms: centroid BVH partitioning, Moller-Trumbore intersection,
 * low-order spherical-harmonic irradiance convolution. See ../docs/v15-lighting.md.
 * Inputs are LINEAR RGB, metres, and normalized ray directions.
 */
const PI = Math.PI;
const GOLDEN = PI * (3 - Math.sqrt(5));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export class TriangleBVH {
 constructor(positions, colors = null, {leafSize = 8,uvs=null,textureIds=null,alphaTextures=[],thin=null,ground=null} = {}) {
  if (!(positions instanceof Float32Array) || positions.length % 9) throw Error('Expected Float32Array of non-indexed triangle vertices');
  if (colors && (!(colors instanceof Float32Array) || colors.length !== positions.length / 3)) throw Error('Expected one linear RGB color per triangle');
  this.count = positions.length / 9;
  this.colors = colors;
  if(uvs&&uvs.length!==this.count*6)throw Error('Expected six UV values per triangle');
  if(textureIds&&textureIds.length!==this.count)throw Error('Expected one alpha texture index per triangle');
  if(thin&&thin.length!==this.count)throw Error('Expected one thin-surface flag per triangle');
  this.uvs=uvs;this.textureIds=textureIds;this.alphaTextures=alphaTextures;this.thin=thin;this.ground=ground;
  if(ground&&ground.length!==this.count)throw Error('Expected one ground flag per triangle');
  this.order = Uint32Array.from({length:this.count}, (_,i)=>i);
  // v0, edge1, edge2, geometric unit normal.
  this.triangles = new Float32Array(this.count * 12);
  const triBounds = new Float32Array(this.count * 6), centers = new Float32Array(this.count * 3);
  for (let i=0;i<this.count;i++) {
   const p=i*9,t=i*12,b=i*6,c=i*3;
   for(let a=0;a<3;a++) {
    const v0=positions[p+a],v1=positions[p+3+a],v2=positions[p+6+a];
    if(!Number.isFinite(v0+v1+v2)) throw Error('Nonfinite triangle coordinates');
    this.triangles[t+a]=v0;this.triangles[t+3+a]=v1-v0;this.triangles[t+6+a]=v2-v0;
    triBounds[b+a]=Math.min(v0,v1,v2);triBounds[b+3+a]=Math.max(v0,v1,v2);
    centers[c+a]=(triBounds[b+a]+triBounds[b+3+a])*.5;
   }
   const v=this.triangles,nx=v[t+4]*v[t+8]-v[t+5]*v[t+7],ny=v[t+5]*v[t+6]-v[t+3]*v[t+8],nz=v[t+3]*v[t+7]-v[t+4]*v[t+6],l=Math.hypot(nx,ny,nz)||1;
   v[t+9]=nx/l;v[t+10]=ny/l;v[t+11]=nz/l;
  }
  // Preorder nodes; left child follows parent; right is explicit. Escape index
  // permits entirely stackless, allocation-free traversal with early any-hit.
  const bounds=[], starts=[], counts=[], escapes=[];
  const build=(start,end,depth)=>{
   const node=starts.length;starts.push(start);counts.push(end-start);escapes.push(0);
   const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],cl=[Infinity,Infinity,Infinity],ch=[-Infinity,-Infinity,-Infinity];
   for(let k=start;k<end;k++) {const i=this.order[k],b=i*6,c=i*3;for(let a=0;a<3;a++) {lo[a]=Math.min(lo[a],triBounds[b+a]);hi[a]=Math.max(hi[a],triBounds[b+3+a]);cl[a]=Math.min(cl[a],centers[c+a]);ch[a]=Math.max(ch[a],centers[c+a]);}}
   // Tiny expansion makes zero thickness triangles/slab-axis boundary hits safe.
   bounds.push(lo[0]-1e-5,lo[1]-1e-5,lo[2]-1e-5,hi[0]+1e-5,hi[1]+1e-5,hi[2]+1e-5);
   let axis=0;if(ch[1]-cl[1]>ch[axis]-cl[axis])axis=1;if(ch[2]-cl[2]>ch[axis]-cl[axis])axis=2;
   if(end-start>leafSize && depth<40 && ch[axis]-cl[axis]>1e-6) {
    const split=(ch[axis]+cl[axis])*.5;let l=start,r=end-1;
    while(l<=r) {if(centers[this.order[l]*3+axis]<split)l++;else {const t=this.order[l];this.order[l]=this.order[r];this.order[r--]=t;}}
    if(l>start&&l<end) {counts[node]=0;build(start,l,depth+1);build(l,end,depth+1);}
   }
   escapes[node]=starts.length;return node;
  };
  if(this.count)build(0,this.count,0);
  this.bounds=new Float32Array(bounds);this.starts=new Uint32Array(starts);this.counts=new Uint32Array(counts);this.escapes=new Uint32Array(escapes);
  this.nodeCount=starts.length;
 }
 get byteLength(){return this.triangles.byteLength+this.bounds.byteLength+this.starts.byteLength+this.counts.byteLength+this.escapes.byteLength+this.order.byteLength+(this.colors?.byteLength||0)+(this.uvs?.byteLength||0)+(this.textureIds?.byteLength||0)+(this.thin?.byteLength||0)+(this.ground?.byteLength||0)+this.alphaTextures.reduce((n,t)=>n+t.data.byteLength,0)}
 acceptsAlpha(id,u,v){
  const texId=this.textureIds?.[id]??-1;if(texId<0||!this.uvs)return true;const tex=this.alphaTextures[texId];if(!tex)return true;
  const t=id*6,uv=this.uvs,w0=1-u-v,tx=uv[t]*w0+uv[t+2]*u+uv[t+4]*v,ty=uv[t+1]*w0+uv[t+3]*u+uv[t+5]*v;
  const x=tx*tex.width-.5,y=(tex.flipY===false?ty:1-ty)*tex.height-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const wrap=(i,n,mode)=>{if(mode==='repeat'||mode===1000)return((i%n)+n)%n;if(mode==='mirror'||mode===1002){const k=((i%(2*n))+2*n)%(2*n);return k<n?k:2*n-k-1}return Math.max(0,Math.min(n-1,i))};
  const x0=wrap(ix,tex.width,tex.wrapS),x1=wrap(ix+1,tex.width,tex.wrapS),y0=wrap(iy,tex.height,tex.wrapT),y1=wrap(iy+1,tex.height,tex.wrapT),a=tex.data;
  const alpha=(a[y0*tex.width+x0]*(1-fx)+a[y0*tex.width+x1]*fx)*(1-fy)+(a[y1*tex.width+x0]*(1-fx)+a[y1*tex.width+x1]*fx)*fy;
  return alpha>=(tex.threshold??.5)*255;
 }
 // out is overwritten only on a hit. An ignored triangle prevents self hits.
 firstHit(ox,oy,oz,dx,dy,dz,maxDistance=100,out={},minDistance=.001,ignore=-1,any=false) {
  const bounds=this.bounds,tri=this.triangles,order=this.order,starts=this.starts,counts=this.counts,escapes=this.escapes;
  let best=maxDistance,found=-1,bu=0,bv=0;
  const invX=Math.abs(dx)<1e-12?0:1/dx,invY=Math.abs(dy)<1e-12?0:1/dy,invZ=Math.abs(dz)<1e-12?0:1/dz;
  for(let node=0;node<this.nodeCount;) {
   const b=node*6;let near=minDistance,far=best,miss=false;
   if(invX===0){if(ox<bounds[b]||ox>bounds[b+3])miss=true}else{let a=(bounds[b]-ox)*invX,c=(bounds[b+3]-ox)*invX;if(a>c){const t=a;a=c;c=t}near=Math.max(near,a);far=Math.min(far,c)}
   if(invY===0){if(oy<bounds[b+1]||oy>bounds[b+4])miss=true}else{let a=(bounds[b+1]-oy)*invY,c=(bounds[b+4]-oy)*invY;if(a>c){const t=a;a=c;c=t}near=Math.max(near,a);far=Math.min(far,c)}
   if(invZ===0){if(oz<bounds[b+2]||oz>bounds[b+5])miss=true}else{let a=(bounds[b+2]-oz)*invZ,c=(bounds[b+5]-oz)*invZ;if(a>c){const t=a;a=c;c=t}near=Math.max(near,a);far=Math.min(far,c)}
   if(miss||near>far){node=escapes[node];continue}
   if(!counts[node]){node++;continue}
   const end=starts[node]+counts[node];
   for(let k=starts[node];k<end;k++) {
    const id=order[k];if(id===ignore)continue;const t=id*12;
    const px=dy*tri[t+8]-dz*tri[t+7],py=dz*tri[t+6]-dx*tri[t+8],pz=dx*tri[t+7]-dy*tri[t+6],det=tri[t+3]*px+tri[t+4]*py+tri[t+5]*pz;
    if(Math.abs(det)<1e-10)continue;const inv=1/det,tx=ox-tri[t],ty=oy-tri[t+1],tz=oz-tri[t+2],u=(tx*px+ty*py+tz*pz)*inv;
    if(u < -1e-7 || u > 1.0000001)continue;
    const qx=ty*tri[t+5]-tz*tri[t+4],qy=tz*tri[t+3]-tx*tri[t+5],qz=tx*tri[t+4]-ty*tri[t+3],v=(dx*qx+dy*qy+dz*qz)*inv;
    if(v < -1e-7 || u+v > 1.0000001)continue;const distance=(tri[t+6]*qx+tri[t+7]*qy+tri[t+8]*qz)*inv;
    if(distance>=minDistance && distance<best && this.acceptsAlpha(id,u,v)) {best=distance;found=id;bu=u;bv=v;if(any)return true}
   }
   node++;
  }
  if(found<0)return false;
  const t=found*12,face=tri[t+9]*dx+tri[t+10]*dy+tri[t+11]*dz>0?-1:1;
  out.t=best;out.triangle=found;out.u=bu;out.v=bv;out.nx=tri[t+9]*face;out.ny=tri[t+10]*face;out.nz=tri[t+11]*face;out.frontFace=face>0;out.thin=!!this.thin?.[found];out.ground=!!this.ground?.[found];out.entry=null;
  out.r=this.colors?this.colors[found*3]:null;out.g=this.colors?this.colors[found*3+1]:null;out.b=this.colors?this.colors[found*3+2]:null;
  return true;
 }
 occluded(ox,oy,oz,dx,dy,dz,maxDistance=100,minDistance=.001,ignore=-1){return this.firstHit(ox,oy,oz,dx,dy,dz,maxDistance,null,minDistance,ignore,true)}
}

// Cache each immutable chunk BVH. Offsets are small numbers relative to the
// active probe-volume origin, updated without rebuilding geometry on rebases.
export class ChunkBVHScene {
 constructor(entries=[]){this.entries=entries;this.scratch={}}
 setEntries(entries){this.entries=entries}
 firstHit(ox,oy,oz,dx,dy,dz,maxDistance=100,out={},minDistance=.001,ignore=-1,any=false){
  let found=false,best=maxDistance;
  for(let i=0;i<this.entries.length;i++) {
   const e=this.entries[i],bvh=e.bvh,lx=ox-(e.x||0),ly=oy-(e.y||0),lz=oz-(e.z||0);
   const skip=ignore&&typeof ignore==='object'&&ignore.entry===e?ignore.triangle:-1;
   if(bvh.firstHit(lx,ly,lz,dx,dy,dz,best,this.scratch,minDistance,skip,any)) {
    if(any)return true;best=this.scratch.t;found=true;Object.assign(out,this.scratch);out.entry=e;
   }
  }return found;
 }
 occluded(ox,oy,oz,dx,dy,dz,maxDistance=100,minDistance=.001,ignore=-1){return this.firstHit(ox,oy,oz,dx,dy,dz,maxDistance,null,minDistance,ignore,true)}
}

const DEFAULT_LIGHTING={
 rays:96,maxDistance:64,seed:0,
 skyTop:[.28,.36,.44],skyBottom:[.11,.115,.10],
 sunDirection:[-.483,.805,.342],sunRadiance:[2.65,2.40,2.10],
 bounceAlbedo:[.28,.25,.19],bounceSkyRays:2
};

// Stratified next-event samples through a real opening. Geometry remains opaque.
function portalBasis(p){const m=p.roofSlope;if(m===undefined)return{ny:0,nz:1,vy:1,vz:0};const l=Math.hypot(1,m);return{ny:1/l,nz:-m/l,vy:m/l,vz:1/l};}
function throughSkyPortal(x,y,z,dx,dy,dz,portals){
 for(const p of portals){const b=portalBasis(p),side=(y-p.y)*b.ny+(z-p.z)*b.nz,dot=dy*b.ny+dz*b.nz;if(side>=0||dot<=0)continue;const t=-side/dot,qy=y+dy*t-p.y,qz=z+dz*t-p.z;if(Math.abs(x+dx*t-p.x)<p.width*.5&&Math.abs(qy*b.vy+qz*b.vz)<p.height*.5)return true;}return false;
}
function portalSamples(bvh,x,y,z,portals,n,far,ignore,accept){
 let rays=0;for(const p of portals){const b=portalBasis(p);if((y-p.y)*b.ny+(z-p.z)*b.nz>=0)continue;for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const v=((j+.5)/n-.5)*p.height;let dx=p.x+((i+.5)/n-.5)*p.width-x,dy=p.y+b.vy*v-y,dz=p.z+b.vz*v-z;const d2=dx*dx+dy*dy+dz*dz,d=Math.sqrt(d2);if(d<.015)continue;dx/=d;dy/=d;dz/=d;
  const cosine=dy*b.ny+dz*b.nz;if(cosine<=0)continue;rays++;if(!bvh.occluded(x,y,z,dx,dy,dz,far,.002,ignore))accept(dx,dy,dz,p.width*p.height*cosine/(d2*n*n));
 }}return rays;
}
// Optional sky visibility rays at each first hit account for eaves/enclosure.
// One diffuse bounce + direct next-event sun visibility, not full path tracing.
// No per-frame time: cache is stable under camera motion and world rebasing.
export function traceIrradianceProbe(bvh,x,y,z,options={}) {
 const o={...DEFAULT_LIGHTING,...options},sh=new Float32Array(12),moments=new Float32Array(12),momentWeights=new Float32Array(6),hit={},rays=clamp(Math.floor(o.rays),16,512),far=o.maxDistance;
 const sun=o.sunDirection,sl=Math.hypot(...sun)||1,sx=sun[0]/sl,sy=sun[1]/sl,sz=sun[2]/sl;
 const portals=o.skyPortals||[];
 const rotation=(o.seed>>>0)*.00000161803398875,skyRayCount=clamp(Math.floor(o.bounceSkyRays),0,4);
 let skyCount=0,sumDistance=0,sumDistance2=0,backfaceCount=0,rayCount=0,closestBackface=Infinity,closestObstacle=Infinity,relocation=[0,0,0];
 for(let i=0;i<rays;i++) {
  const dy=1-2*(i+.5)/rays,r=Math.sqrt(1-dy*dy),angle=i*GOLDEN+rotation,dx=r*Math.cos(angle),dz=r*Math.sin(angle);
  let red,green,blue,distance=far;
  rayCount++;
  if(!bvh.firstHit(x,y,z,dx,dy,dz,far,hit)) {
   const t=clamp(dy*.5+.5,0,1);red=o.skyBottom[0]+(o.skyTop[0]-o.skyBottom[0])*t;green=o.skyBottom[1]+(o.skyTop[1]-o.skyBottom[1])*t;blue=o.skyBottom[2]+(o.skyTop[2]-o.skyBottom[2])*t;skyCount++;if(throughSkyPortal(x,y,z,dx,dy,dz,portals))red=green=blue=0;
  } else {
   distance=hit.t;
   if(!hit.ground)closestObstacle=Math.min(closestObstacle,distance);
   const id=hit.triangle,nx=hit.nx,ny=hit.ny,nz=hit.nz,p=x+dx*distance+nx*.006,q=y+dy*distance+ny*.006,s=z+dz*distance+nz*.006;
   // Records probes embedded in closed surfaces for root to reject/relocate.
   if(!hit.frontFace&&!hit.thin){backfaceCount++;if(distance<closestBackface){closestBackface=distance;relocation=[dx*(distance+.08),dy*(distance+.08),dz*(distance+.08)]}}
   if(!hit.frontFace&&!hit.thin){
    red=green=blue=0;distance*=.2;
   }else{
   let sunAmount=Math.max(0,nx*sx+ny*sy+nz*sz);
   const ignore=hit.entry?hit:id;
   if(sunAmount>0){rayCount++;if(bvh.occluded(p,q,s,sx,sy,sz,far,.002,ignore))sunAmount=0}
   let skyVisibility=1;
   if(skyRayCount) {
    // Deterministic cosine hemisphere samples in an orthonormal frame.
    const ax=Math.abs(ny)>.9?1:0,ay=Math.abs(ny)>.9?0:1;
    let tx=ay*nz,ty=-ax*nz,tz=ax*ny-ay*nx;const tl=Math.hypot(tx,ty,tz)||1;tx/=tl;ty/=tl;tz/=tl;
    const bx=ny*tz-nz*ty,by=nz*tx-nx*tz,bz=nx*ty-ny*tx;let visible=0;
    for(let j=0;j<skyRayCount;j++) {const rr=Math.sqrt((j+.5)/skyRayCount),a=(j+i*.61803398875)*GOLDEN+rotation,u=rr*Math.cos(a),v=rr*Math.sin(a),w=Math.sqrt(1-rr*rr);rayCount++;if(!bvh.occluded(p,q,s,tx*u+bx*v+nx*w,ty*u+by*v+ny*w,tz*u+bz*v+nz*w,far,.002,ignore)&&!throughSkyPortal(p,q,s,tx*u+bx*v+nx*w,ty*u+by*v+ny*w,tz*u+bz*v+nz*w,portals))visible++}
    skyVisibility=visible/skyRayCount;
   }
   const skyT=clamp(ny/3+.5,0,1);
   // E_sky / PI is the cosine-filtered linear-gradient environment. E_sun
   // is directional irradiance; divide by PI for Lambertian outgoing radiance.
   const bounce=[0,0,0];if(portals.length)rayCount+=portalSamples(bvh,p,q,s,portals,2,far,ignore,(dx,dy,dz,omega)=>{const w=Math.max(0,nx*dx+ny*dy+nz*dz)*omega/PI,t=clamp(dy*.5+.5,0,1);for(let c=0;c<3;c++)bounce[c]+=(o.skyBottom[c]+(o.skyTop[c]-o.skyBottom[c])*t)*w;});
   const sr=bounce[0]+(o.skyBottom[0]+(o.skyTop[0]-o.skyBottom[0])*skyT)*skyVisibility+o.sunRadiance[0]*sunAmount/PI;
   const sg=bounce[1]+(o.skyBottom[1]+(o.skyTop[1]-o.skyBottom[1])*skyT)*skyVisibility+o.sunRadiance[1]*sunAmount/PI;
   const sb=bounce[2]+(o.skyBottom[2]+(o.skyTop[2]-o.skyBottom[2])*skyT)*skyVisibility+o.sunRadiance[2]*sunAmount/PI;
   red=clamp(hit.r??o.bounceAlbedo[0],0,.96)*sr;green=clamp(hit.g??o.bounceAlbedo[1],0,.96)*sg;blue=clamp(hit.b??o.bounceAlbedo[2],0,.96)*sb;
   }
  }
  sumDistance+=distance;sumDistance2+=distance*distance;
  // Six directional visibility lobes, +X,-X,+Y,-Y,+Z,-Z. Cosine^4
  // weighting avoids hard sector seams while retaining wall separation.
  for(let axis=0;axis<3;axis++) {const d=axis===0?dx:axis===1?dy:dz,lobe=axis*2+(d<0?1:0),weight=d*d*d*d;momentWeights[lobe]+=weight;moments[lobe*2]+=distance*weight;moments[lobe*2+1]+=distance*distance*weight}
  sh[0]+=red;sh[1]+=green;sh[2]+=blue;
  sh[3]+=2*red*dx;sh[4]+=2*green*dx;sh[5]+=2*blue*dx;
  sh[6]+=2*red*dy;sh[7]+=2*green*dy;sh[8]+=2*blue*dy;
  sh[9]+=2*red*dz;sh[10]+=2*green*dz;sh[11]+=2*blue*dz;
 }
 for(let i=0;i<12;i++)sh[i]/=rays;
 if(portals.length)rayCount+=portalSamples(bvh,x,y,z,portals,4,far,-1,(dx,dy,dz,omega)=>{const t=clamp(dy*.5+.5,0,1),w=omega/(4*PI);for(let c=0;c<3;c++){const v=(o.skyBottom[c]+(o.skyTop[c]-o.skyBottom[c])*t)*w;sh[c]+=v;sh[3+c]+=2*v*dx;sh[6+c]+=2*v*dy;sh[9+c]+=2*v*dz;}});
 for(let i=0;i<6;i++){moments[i*2]=momentWeights[i]>1e-6?moments[i*2]/momentWeights[i]:far;moments[i*2+1]=momentWeights[i]>1e-6?moments[i*2+1]/momentWeights[i]:far*far}
 const backfaceRatio=backfaceCount/rays;
 return {sh,moments,visibility:skyCount/rays,meanDistance:sumDistance/rays,meanDistance2:sumDistance2/rays,backfaceRatio,valid:backfaceRatio<=.25,relocation:new Float32Array(relocation),closestBackface,closestObstacle,rayCount};
}

// Relocate only a probe embedded near a solid surface, never jump through a
// building. The returned position is the actual sampling position and MUST be
// used for visibility queries. Invalid unresolved probes get zero blend weight.
export function traceRelocatedProbe(bvh,x,y,z,options={}) {
 let p=[x,y,z],probe=traceIrradianceProbe(bvh,...p,options),totalRays=probe.rayCount;
 const maxMove=options.maxRelocation??.75;
 if(!probe.valid&&Math.hypot(...probe.relocation)<=maxMove){p=p.map((v,i)=>v+probe.relocation[i]);probe=traceIrradianceProbe(bvh,...p,options);totalRays+=probe.rayCount}
 probe.position=new Float32Array(p);probe.rayCount=totalRays;return probe;
}

// CPU reference for the shader's visibility-aware trilinear interpolation.
// Surface normal bias and view bias belong at the calling shading point.
export function probeVisibilityWeight(moments,dx,dy,dz,bias=.18) {
 const distance=Math.hypot(dx,dy,dz);if(distance<1e-5)return 1;const d=[dx/distance,dy/distance,dz/distance];let mean=0,mean2=0,ws=0;
 for(let a=0;a<3;a++){const k=a*2+(d[a]<0?1:0),w=d[a]**4;mean+=w*moments[k*2];mean2+=w*moments[k*2+1];ws+=w}
 mean/=ws;mean2/=ws;const delta=Math.max(0,distance-bias-mean);if(!delta)return 1;const variance=Math.max(.0025,mean2-mean*mean),p=variance/(variance+delta*delta);return p*p*p;
}

export function evaluateProbe(sh,nx,ny,nz,out=new Float32Array(3)) {
 for(let c=0;c<3;c++)out[c]=Math.max(0,sh[c]+nx*sh[3+c]+ny*sh[6+c]+nz*sh[9+c]);return out;
}

// Exact affine transform of geometry; this convenience is intended for workers.
// Pass a chunk-local matrix and keep the chunk world origin separately in JS
// Float64 values (or BigInt grid keys) so long travel never reduces precision.
export function expandTriangles(position,index=null,matrix=null) {
 const length=index?index.length:position.length/3,result=new Float32Array(length*3);
 if(length%3)throw Error('Triangle index length must be a multiple of 3');
 for(let i=0;i<length;i++) {const j=(index?index[i]:i)*3,x=position[j],y=position[j+1],z=position[j+2],d=i*3;
  if(matrix){result[d]=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];result[d+1]=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];result[d+2]=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]}
  else {result[d]=x;result[d+1]=y;result[d+2]=z}
 }return result;
}
