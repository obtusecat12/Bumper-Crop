// V131-L27-cliff: show-cave look for Level 27 (reference: files/uploads/image-7e9a87dc2c5b.webp).
// Dark umber strata shell with baked spot light, cream flowstone curtains, stalactites /
// stalagmites, a rubble-masonry stair hard against the left cliff, dressed waterfall mouths.
// Water surface, its height and its shader are NOT touched here.
import * as T from './vendor/three.module.min.js';
import {STAIRS,stairCenter,stairBoundary,treadHeight,cliffX,wallPoint,roofPoint,roofHeight,ANNEX,inAnnex,poolFloor,radialLimit,TUNNEL_Y} from './level27-layout.js?v=131';
import {bakeAt,FLOWSTONES} from './level27-light131.js?v=131';
const tex={};
const NAMES=['strata','flow','slab','rubble','wetmoss'];
export async function initializeCliff131(){
 if(tex.strata)return tex;
 const loader=new T.TextureLoader();
 await Promise.all(NAMES.flatMap(n=>['','-normal','-rough'].map(async s=>{const t=await loader.loadAsync(new URL('./assets/l27-v131/'+n+s+'.webp',import.meta.url).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=s?T.NoColorSpace:T.SRGBColorSpace;t.anisotropy=4;t.name='l27-131-'+n+s;tex[n+s]=t;})));
 return tex;
}
export function cliffTextures131(){return tex;}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const sst=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};

// ---- material: triplanar dry/wet maps, baked spot light emitted from albedo ----
// opts: dry,wet,top (texture keys), scale, wetRough, gain, caustic (pool shimmer), calc (blend to flowstone by attribute)
export function cliffMaterial131(name,opts,clock,extra={}){
 const m=new T.MeshStandardMaterial({name:'L27 131 / '+name,color:extra.color??0xffffff,roughness:.85,metalness:0,side:extra.side??T.DoubleSide,normalMap:tex[opts.dry+'-normal'],normalScale:new T.Vector2(1,1)});
 const dry=opts.dry,wet=opts.wet||opts.dry,top=opts.top||opts.dry,calc=opts.calc?'flow':opts.dry;
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{cTime:clock,cDry:{value:tex[dry]},cWet:{value:tex[wet]},cTop:{value:tex[top]},cCalc:{value:tex[calc]},cDryN:{value:tex[dry+'-normal']},cWetN:{value:tex[wet+'-normal']},cTopN:{value:tex[top+'-normal']},cCalcN:{value:tex[calc+'-normal']},cDryR:{value:tex[dry+'-rough']},cGain:{value:opts.gain??1.0},cScale:{value:opts.scale??.62},cWetRough:{value:opts.wetRough??.10}});
  s.vertexShader='attribute vec3 bake;attribute float caveWet;attribute float calc;varying vec3 vBake,vCP,vCN;varying float vCW,vCC;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvCP=(modelMatrix*vec4(transformed,1.)).xyz;vCN=normalize(mat3(modelMatrix)*objectNormal);vBake=bake;vCW=caveWet;vCC=calc;');
  s.fragmentShader=`varying vec3 vBake,vCP,vCN;varying float vCW,vCC;uniform sampler2D cDry,cWet,cTop,cCalc,cDryN,cWetN,cTopN,cCalcN,cDryR;uniform float cTime,cGain,cScale,cWetRough;
 vec3 tw(vec3 n){vec3 w=pow(abs(n),vec3(4.));return w/max(dot(w,vec3(1.)),.001);}
 vec3 tri(sampler2D t,sampler2D top,vec3 p,vec3 n){vec3 w=tw(n);return texture2D(t,p.zy).rgb*w.x+mix(texture2D(t,p.xz).rgb,texture2D(top,p.xz).rgb,step(0.,n.y))*w.y+texture2D(t,p.xy).rgb*w.z;}
 vec3 triN(sampler2D t,sampler2D top,vec3 p,vec3 n){vec3 w=tw(n);vec3 a=texture2D(t,p.zy).xyz*2.-1.,b=mix(texture2D(t,p.xz).xyz,texture2D(top,p.xz).xyz,step(0.,n.y))*2.-1.,c=texture2D(t,p.xy).xyz*2.-1.;return normalize(vec3(a.z*sign(n.x),a.y,a.x)*w.x+vec3(b.x,b.z*sign(n.y),b.y)*w.y+vec3(c.x,c.y,c.z*sign(n.z))*w.z);}
 `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 cp=vCP*cScale;vec3 alb=tri(cDry,cTop,cp,vCN);alb=mix(alb,tri(cWet,cWet,vCP*cScale*1.3,vCN),clamp(vCW*1.15-.15,0.,1.)*.85);alb=mix(alb,tri(cCalc,cCalc,vCP*vec3(.9,.45,.9),vCN)*vec3(.95,.92,.86),vCC);diffuseColor.rgb*=alb;`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 cn=triN(cDryN,cTopN,cp,vCN);cn=normalize(mix(cn,triN(cWetN,cWetN,vCP*cScale*1.3,vCN),vCW*.7));normal=normalize(mix(normal,mat3(viewMatrix)*cn*faceDirection,.7));`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`float roughnessFactor=mix(mix(.62+.35*tri(cDryR,cDryR,cp,vCN).r,.30,vCC*.7),cWetRough,clamp(vCW,0.,1.));`);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vBake*2.*cGain;`);
  if(opts.caustic)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=vec3(.03,.07,.05)*smoothstep(.6,.95,sin(vCP.x*7.+cTime*.9)*sin(vCP.z*6.3-cTime*.7))*(1.-smoothstep(-.2,.5,vCP.y));\n#include <opaque_fragment>`);
 };
 m.customProgramCacheKey=()=>'l27-131-'+dry+'-'+wet+'-'+top+'-'+calc+(opts.caustic?'-c':'');
 return m;
}
// Per-vertex runtime bake (no SDF shadow). Geometry must be in world space.
export function bakeGeometry131(g,{wet=0,calc=0,cavity=null,boost=1}={}){
 if(!g.attributes.normal)g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,count=p.count,b=new Float32Array(count*3),w=new Float32Array(count),c=new Float32Array(count);
 for(let i=0;i<count;i++){const q=[p.getX(i),p.getY(i),p.getZ(i)],nn=[n.getX(i),n.getY(i),n.getZ(i)],cav=cavity?cavity(q,nn,i):.15;const r=bakeAt(q,nn,cav);b[i*3]=r[0]*boost/2;b[i*3+1]=r[1]*boost/2;b[i*3+2]=r[2]*boost/2;w[i]=typeof wet==='function'?wet(q,nn):wet;c[i]=typeof calc==='function'?calc(q,nn):calc;}
 g.setAttribute('bake',new T.BufferAttribute(b,3));g.setAttribute('caveWet',new T.BufferAttribute(w,1));g.setAttribute('calc',new T.BufferAttribute(c,1));
 if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(count*2),2));
 return g;
}
// Shell: baked attribute from the mesher; wetness from falls / waterline; calcite on ledges and around flowstones.
export function prepareShell131(g,bakeBytes){
 const p=g.attributes.position,n=g.attributes.normal,count=p.count,b=new Float32Array(count*3),w=new Float32Array(count),c=new Float32Array(count);
 for(let i=0;i<count*3;i++)b[i]=bakeBytes[i]/255;
 for(let i=0;i<count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),ny=n.getY(i);
  const ad=(q)=>{let d=Math.abs(a-q)%(Math.PI*2);return d>Math.PI?Math.PI*2-d:d;};
  const fall=Math.exp(-Math.pow(ad(3.57)/.30,2))*(1-sst(2.15,2.7,y))+Math.exp(-Math.pow(ad(5.12)/.22,2))*sst(-.1,.2,y)*(1-sst(1.75,2.1,y))*.9;
  const shore=Math.max(0,Math.hypot(x,z)-radialLimit(x||1e-6,z||1e-6)),waterline=(1-sst(.04,.9,y))*(1-sst(.10,.85,shore));
  const seep=.35*sst(.55,.95,Math.sin(x*3.1+z*2.3)*Math.sin(y*1.7-x)*.5+.5);
  w[i]=clamp(Math.max(fall,waterline,seep*sst(.4,1.2,y)));
  let calc=0;for(const f of FLOWSTONES)if(f.a!==undefined)calc=Math.max(calc,Math.exp(-Math.pow(ad(f.a)/(f.half*1.45),2))*sst(f.y0-.6,f.y0,y)*(1-sst(f.y1+.1,f.y1+.5,y))*.75);
  calc=Math.max(calc,.55*sst(.55,.9,ny)*sst(.6,1.0,y)*(Math.hypot(x,z)<4.2?1:.5)); // calcite crust on ledge tops
  c[i]=clamp(calc);}
 g.setAttribute('bake',new T.BufferAttribute(b,3));g.setAttribute('caveWet',new T.BufferAttribute(w,1));g.setAttribute('calc',new T.BufferAttribute(c,1));return g;
}

// ---- rubble masonry stair against the left cliff ----
function stoneBox(parts,x0,x1,y0,y1,z0,z1,seed,{chip=.018,topTilt=.0}={}){
 const g=new T.BoxGeometry(x1-x0,y1-y0,z1-z0,2,2,2),p=g.attributes.position,hx=(x1-x0)/2,hy=(y1-y0)/2,hz=(z1-z0)/2;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const ex=Math.abs(Math.abs(x)-hx)<1e-5,ey=Math.abs(Math.abs(y)-hy)<1e-5,ez=Math.abs(Math.abs(z)-hz)<1e-5,corner=(ex?1:0)+(ey?1:0)+(ez?1:0);
  const k=hash(seed*31+Math.round(x*97)+Math.round(y*89)*7+Math.round(z*83)*13);
  if(corner>=2){const s=chip*(.5+k);x-=Math.sign(x)*s*(ex?1:.3);z-=Math.sign(z)*s*(ez?1:.3);if(y>0)y-=s*.7*(corner===3?1:.5);else y+=s*.2;}
  if(!(y>0&&ey))y+=(k-.5)*.012*(y<0?1:.4);else y+=topTilt*(x/hx)+(k-.5)*.004;
  if(!ey){x+=(hash(seed+i*.37)-.5)*.010*(ex?1:0);z+=(hash(seed*3+i*.53)-.5)*.010*(ez?1:0);}
  p.setXYZ(i,x+(x0+x1)/2,y+(y0+y1)/2,z+(z0+z1)/2);}
 g.computeVertexNormals();parts.push(g.toNonIndexed());
}
export function buildStair131(mat){
 const parts=[],W=STAIRS.width,gap=.006;
 for(let k=0;k<STAIRS.count;k++){
  const y=treadHeight(k),c=stairCenter(STAIRS.start+(k+.5)*STAIRS.tread),zin=stairBoundary(k,c),zout=stairBoundary(k+1,c),inner=cliffX(zin)+.07;
  const outer=c-W/2-.03-.07*hash(k*3.1),n=3+(hash(k*7.7)>.5?1:0);let cuts=[outer];for(let i=1;i<n;i++)cuts.push(outer+(inner-outer)*(i/n+(hash(k*5+i)-.5)*.18));cuts.push(inner);
  for(let i=0;i<n;i++){const nose=k<STAIRS.count-1?.025+.035*hash(k*11+i):.02;stoneBox(parts,cuts[i]+gap,cuts[i+1]-gap,y-.30,y,zin-.012+gap,zout+nose-gap,k*13+i,{chip:.03,topTilt:(hash(k*17+i)-.5)*.006});}
 }
 // Outer retaining wall in irregular courses, stepped under the treads.
 const z0=STAIRS.start,z1=STAIRS.start+STAIRS.count*STAIRS.tread;let course=0;
 for(let yb=.10;yb<TUNNEL_Y-.25;course++){const hgt=.12+.08*hash(course*2.3);let z=z0-.02-.18*hash(course*5.1);
  while(z<z1){const len=.18+.20*hash(course*13+z*7),za=Math.max(z0,z),zb=Math.min(z1+.03,z+len);const kk=Math.min(STAIRS.count-1,Math.max(0,Math.floor((zb-.001-z0)/STAIRS.tread))),top=treadHeight(kk)-.28;const yt=Math.min(yb+hgt,top);
   if(yt-yb>.05&&zb-za>.08){const zc=(za+zb)/2,c=stairCenter(zc),out=c-W/2-.02-.05*hash(course*3+z*11),inn=cliffX(zc)+.05;stoneBox(parts,out,inn,yb+gap,yt-gap,za+gap,zb-gap,course*101+Math.round(z*50),{chip:.026});}
   z+=len;}
  yb+=hgt;}
 // Low dry-stone parapet on the open (platform) side.
 for(let k=2;k<STAIRS.count-1;k++){const y=treadHeight(k),zin=stairBoundary(k,4),zout=stairBoundary(k+1,4),pieces=2+(hash(k*9.1)>.5?1:0);
  for(let i=0;i<pieces;i++){const za=zin+(zout-zin)*i/pieces,zb=zin+(zout-zin)*(i+1)/pieces,c=stairCenter((za+zb)/2),out=c-W/2-.05-.03*hash(k+i),h=.15+.09*hash(k*4+i*3);stoneBox(parts,out,out+.21,y-.02,y+h,za+.006,zb+.03,k*57+i,{chip:.03});}}
 return parts;
}

// ---- flowstone curtains, stalactites, stalagmites ----
function curtainSurface(f){
 const cols=Math.max(24,Math.round(f.half*120)),rows=34,p=[],uv=[],idx=[];
 const base=(u0,y)=>{const u=.5+(u0-.5)*(.55+.45*Math.min(1,(f.y1-y)/((f.y1-f.y0)*.45)));if(f.a!==undefined){const a=f.a+(u-.5)*2*f.half,q=wallPoint(a,y),r=Math.hypot(q[0],q[2]);return {x:q[0],y,z:q[2],nx:-q[0]/r,nz:-q[2]/r};}
  const e=f.e+(u-.5)*2*f.half,x=ANNEX.x+ANNEX.rx*1.01*Math.cos(e),z=ANNEX.z+ANNEX.rz*1.01*Math.sin(e),nx=-Math.cos(e)/ANNEX.rx,nz=-Math.sin(e)/ANNEX.rz,l=Math.hypot(nx,nz);return {x,y,z,nx:nx/l,nz:nz/l};};
 const fringe=u=>.10+.32*Math.pow(Math.abs(Math.sin(u*f.folds*Math.PI*1.5+f.seed)),.35)*(.6+.4*hash(Math.floor(u*f.folds*3)+f.seed*9));
 for(let j=0;j<=rows+1;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=Math.min(1,j/rows);
  const sw=Math.sin(u*Math.PI),yt=f.y1-(f.y1-f.y0)*.38*(1-Math.pow(sw,.8))+.12*Math.sin(u*7.3+f.seed)*sw;
  const yb=f.y0+fringe(u)*(1-Math.pow(sw,.4)*.5)+(f.y1-f.y0)*.22*(1-Math.pow(sw,.5)),y=yt+(yb-yt)*v,b=base(u,y);
  const edge=Math.pow(Math.sin(Math.PI*u),.55),fold=Math.pow(Math.abs(Math.sin(u*f.folds*Math.PI+.35*Math.sin(v*5+f.seed))),.45);
  const lobe=.78+.22*Math.sin(v*9.5+u*f.folds*1.7+f.seed)+.10*Math.sin(v*21-u*13);
  let t=f.depth*1.35*edge*(.22+.78*Math.pow(v,.6))*(.30+.70*fold)*lobe;
  if(j>rows)t=0; // closing underside back to the wall
  const lift=j>rows?.03:0;p.push(b.x+b.nx*t,y+lift,b.z+b.nz*t);uv.push(u*f.half*2.5,y*.6);}
 for(let j=0;j<=rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g.toNonIndexed();
}
function spike(parts,x,y,z,len,rad,down,seed){
 const seg=5,g=new T.CylinderGeometry(down?rad*.12:rad,down?rad:rad*.18,len,6,seg,false),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const yy=p.getY(i)/len+.5,s=1+.25*Math.sin(yy*9+seed)+.12*Math.sin(i*1.7+seed);p.setXYZ(i,p.getX(i)*s+.02*Math.sin(yy*3+seed)*yy,p.getY(i),p.getZ(i)*s);}
 g.translate(x,down?y-len/2+.02:y+len/2-.02,z);g.computeVertexNormals();parts.push(g.toNonIndexed());
}
export function buildFlowstone131(){
 const curtains=[],parts=[];for(const f of FLOWSTONES)curtains.push(curtainSurface(f));
 // Stalactites: fringes under each curtain + scattered along the roof rim and eaves.
 for(const f of FLOWSTONES){const n=Math.round(f.half*26);for(let i=0;i<n;i++){const u=(i+.5)/n,h=hash(f.seed*40+i);if(h<.35)continue;
   let x,z,nx,nz;if(f.a!==undefined){const a=f.a+(u-.5)*2*f.half,q=wallPoint(a,f.y0+.25),r=Math.hypot(q[0],q[2]);x=q[0];z=q[2];nx=-x/r;nz=-z/r;}else{const e=f.e+(u-.5)*2*f.half;x=ANNEX.x+ANNEX.rx*Math.cos(e);z=ANNEX.z+ANNEX.rz*Math.sin(e);nx=-Math.cos(e);nz=-Math.sin(e);}
   const off=f.depth*.45*Math.pow(Math.sin(Math.PI*u),.6);spike(parts,x+nx*off,f.y0+.38+.2*h,z+nz*off,.12+.32*h,.025+.03*h,true,i+f.seed);}}
 for(let i=0;i<64;i++){const a=hash(i*3.7)*Math.PI*2,r=.70+.24*hash(i*5.3),q=roofPoint(a,r);if(Math.abs(((a-3.57+Math.PI*3)%(Math.PI*2))-Math.PI)<.25)continue;const len=.07+.34*Math.pow(hash(i*9.1),1.6);spike(parts,q[0],q[1]+.03,q[2],len,.018+.03*hash(i*2.2),true,i);}
 for(let i=0;i<22;i++){const e=hash(i*6.1)*Math.PI*2,rr=.62+.3*hash(i*4.4),x=ANNEX.x+ANNEX.rx*rr*Math.cos(e),z=ANNEX.z+ANNEX.rz*rr*Math.sin(e);if(!inAnnex(x,z))continue;if(x>3.7&&z<.2)continue;const y=3.62+.30*Math.sin(x*1.1+z*.7)-.06;spike(parts,x,y,z,.08+.3*hash(i*8.8),.02+.03*hash(i),true,i+70);}
 // Stalagmites hug the platform wall (outside the walkable band) and a few rocks above the pool rim.
 const mites=[];for(let i=0;i<60&&mites.length<11;i++){const e=hash(i*2.9+.3)*Math.PI*2,rr=.90+.07*hash(i*7.7),x=ANNEX.x+ANNEX.rx*rr*Math.cos(e),z=ANNEX.z+ANNEX.rz*rr*Math.sin(e);if(!inAnnex(x,z,.04)||inAnnex(x,z,.30)||Math.hypot(x,z)<radialLimit(x,z)+.2||(z<.3&&x>3.6))continue;mites.push([x,z]);}
 mites.forEach(([x,z],i)=>{const h=hash(i*7.3),fy=poolFloor(x,z);spike(parts,x,fy,z,.18+.42*h,.05+.05*h,false,i+90);if(h>.4)spike(parts,x+.09,fy,z+.07,.10+.18*h,.035,false,i+120);});
 return {curtains,spikes:parts};
}

// ---- dressed waterfall mouths: lip rocks, moss pads, mist ----
function blob(parts,cx,cy,cz,sx,sy,sz,seed){const g=new T.SphereGeometry(1,12,8),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.13*Math.sin(x*5+y*3+seed)*Math.cos(z*6-y*2+seed)+.05*Math.sin(z*13+x*11);p.setXYZ(i,cx+x*r*sx,cy+y*r*sy,cz+z*r*sz);}g.computeVertexNormals();parts.push(g.toNonIndexed());}
export function buildFallDress131(lipCreek){
 const rocks=[],moss=[];
 // West cascade mouth: bore at wallPoint(3.57,2.10). Rocks frame it left/right/top, never in the jet.
 const port=wallPoint(3.57,2.10),r=Math.hypot(port[0],port[2]),nx=-port[0]/r,nz=-port[2]/r,tx=-nz,tz=nx;
 const frame=[[-.30,-.06,.13,.11,.10],[.31,-.03,.12,.10,.11],[-.22,.20,.14,.08,.09],[.20,.23,.12,.09,.08],[0,.30,.18,.07,.09],[-.38,-.30,.10,.12,.09],[.40,-.34,.11,.13,.09]];
 frame.forEach(([u,v,sx,sy,sz],i)=>blob(rocks,port[0]+tx*u+nx*.05,port[1]+v,port[2]+tz*u+nz*.05,sx,sy,sz,i));
 [[-.27,.06],[.26,.10],[-.12,.30],[.14,.33],[-.33,-.18],[.36,-.20],[0,-.12]].forEach(([u,v],i)=>blob(moss,port[0]+tx*u+nx*.10,port[1]+v,port[2]+tz*u+nz*.10,.09,.045,.08,i+20));
 // creek lip (tunnel stream pouring into the pool): rocks either side of the lip.
 if(lipCreek){const [lx,ly,lz,ox,oz]=lipCreek,sx=-oz,sz=ox;
  [[-.34,-.03,.12,.09,.12],[.34,-.02,.13,.09,.12],[-.40,-.22,.10,.12,.10],[.42,-.25,.11,.13,.10],[-.30,-.48,.09,.10,.08],[.33,-.52,.10,.10,.08]].forEach(([u,v,a,b,c],i)=>blob(rocks,lx+sx*u-ox*.02,ly+v,lz+sz*u-oz*.02,a,b,c,i+40));
  [[-.30,.05],[.31,.06],[-.38,-.12],[.40,-.14],[-.26,-.36],[.28,-.40]].forEach(([u,v],i)=>blob(moss,lx+sx*u-ox*.0,ly+v+.02,lz+sz*u,.08,.04,.07,i+60));}
 return {rocks,moss};
}
function mistTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function createMist131(points){
 const group=new T.Group();group.name='V131 waterfall mist';const map=mistTexture(),list=[];
 points.forEach(([x,y,z,s,warm],i)=>{for(let k=0;k<3;k++){const m=new T.SpriteMaterial({map,color:warm?0xffe2bd:0xd8e6ea,transparent:true,opacity:.20,depthWrite:false,blending:T.AdditiveBlending});const sp=new T.Sprite(m);sp.scale.setScalar(s*(.8+.25*k));sp.position.set(x,y+k*.08,z);sp.renderOrder=6;sp.layers.set(3);group.add(sp);list.push({sp,base:[x,y+k*.08,z],ph:i*1.7+k*2.1,s:s*(.8+.25*k)});}});
 return {group,update(t){for(const o of list){const q=.5+.5*Math.sin(t*.7+o.ph);o.sp.position.set(o.base[0]+.04*Math.sin(t*.5+o.ph),o.base[1]+.06*q,o.base[2]+.04*Math.cos(t*.6+o.ph));o.sp.material.opacity=.10+.12*q;o.sp.scale.setScalar(o.s*(.9+.2*q));}},dispose(){map.dispose();list.forEach(o=>o.sp.material.dispose());}};
}
