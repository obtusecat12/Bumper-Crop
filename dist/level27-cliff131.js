// V131-L27-cliff: show-cave look for Level 27 (reference: files/uploads/image-7e9a87dc2c5b.webp).
// Dark umber strata shell with baked spot light, cream flowstone curtains, stalactites /
// stalagmites, a rubble-masonry stair hard against the left cliff, dressed waterfall mouths.
// V132-L27-redo: stair = rock treads cut from the curved cliff (same rock material + bake);
// flowstone now grows out of the shell itself (calc from flowMain/flowAnnex); curtains/spikes dropped.
// Water surface, its height and its shader are NOT touched here.
import * as T from './vendor/three.module.min.js';
import {STAIRS,stairTB,stairWallR,treadHeight,wallPoint,roofPoint,roofHeight,ANNEX,inAnnex,poolFloor,radialLimit,TUNNEL_Y} from './level27-layout.js?v=133';
import {bakeAt,FLOWSTONES,flowMain,flowAnnex} from './level27-light131.js?v=133';
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
  // V133: water caustics thrown onto the pool walls (projected from the surface, fade with height, only round the pool)
  if(opts.caustic133){s.uniforms.cCaus={value:opts.caustic133};s.fragmentShader='uniform sampler2D cCaus;\n'+s.fragmentShader.replace('#include <opaque_fragment>',`{float rr=length(vCP.xz-vec2(.05,.05));float near=1.-smoothstep(2.35,3.05,rr);float hgt=smoothstep(-.05,.10,vCP.y)*(1.-smoothstep(.3,2.3,vCP.y));float face=clamp(dot(vCN,-normalize(vec3(vCP.x,0.,vCP.z)))*1.4+.25,0.,1.);vec2 q=vCP.xz*.62+vec2(0.,vCP.y*.45);float a=texture2D(cCaus,q+vec2(cTime*.021,-cTime*.017)).r,b=texture2D(cCaus,q*1.13+vec2(-cTime*.019,cTime*.023)).r;outgoingLight+=vec3(.10,.24,.21)*pow(min(a,b)*1.35,2.2)*near*hgt*face;}\n#include <opaque_fragment>`);}
  if(opts.caustic)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=vec3(.03,.07,.05)*smoothstep(.6,.95,sin(vCP.x*7.+cTime*.9)*sin(vCP.z*6.3-cTime*.7))*(1.-smoothstep(-.2,.5,vCP.y));\n#include <opaque_fragment>`);
 };
 m.customProgramCacheKey=()=>'l27-131-'+dry+'-'+wet+'-'+top+'-'+calc+(opts.caustic?'-c':'')+(opts.caustic133?'-c133':'');
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
  // flowstone = shell vertices the mesher grew by flowMain (room walls) / flowAnnex (platform wall)
  const wp=wallPoint(a,y),wr=Math.hypot(wp[0],wp[2]),rr=Math.hypot(x,z);let calc=0;
  if(rr>wr-.55&&rr<wr+.25)calc=Math.pow(sst(0,.17,flowMain(a,y)),.8);
  {const ar=Math.hypot((x-ANNEX.x)/ANNEX.rx,(z-ANNEX.z)/ANNEX.rz);if(ar>.80&&ar<1.12)calc=Math.max(calc,Math.pow(sst(0,.17,flowAnnex(Math.atan2((z-ANNEX.z)/ANNEX.rz,(x-ANNEX.x)/ANNEX.rx),y)),.8));}
  calc*=.95;
  calc=Math.max(calc,.55*sst(.55,.9,ny)*sst(.6,1.0,y)*(Math.hypot(x,z)<4.2?1:.5)); // calcite crust on ledge tops
  c[i]=clamp(calc);}
 g.setAttribute('bake',new T.BufferAttribute(b,3));g.setAttribute('caveWet',new T.BufferAttribute(w,1));g.setAttribute('calc',new T.BufferAttribute(c,1));return g;
}

// ---- V132-L27-redo: rock treads cut from the curved cliff ----
// One solid rock piece per tread, an annular sector about the stair centre: the inner (void) edge is
// ragged and chipped, the outer end runs .14 m into the cliff so wall and step read as one rock.
function treadPiece(k){
 const S=STAIRS,ta=stairTB(k),tb=stairTB(k+1),nose=k<S.count-1?.030/S.R:0,top=treadHeight(k),bot=top-.26;
 const NU=9,NV=7,P=[],idx=[],hk=n=>hash(k*37.1+n);
 const rin=u=>S.R-S.width/2-.015-.045*hk(Math.round(u*NU)*1.7)-.03*Math.sin(u*9+k*2.3);
 const rout=u=>stairWallR(ta+(tb-ta)*u)+.14;
 // top grid (u along the tread, v from void edge to cliff), then walls down to bot
 const pt=(u,v,y)=>{const t=ta+(tb+nose-ta)*u,r=rin(u)+(rout(u)-rin(u))*v;return [S.cx+r*Math.cos(t),y,S.cz+r*Math.sin(t)];};
 const grid=[];for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const u=i/NU,v=j/NV;
  const edge=Math.min(u,1-u)*S.R*(tb-ta),inner=v*(S.width+.1);
  let y=top+.004*Math.sin(u*7+k)*Math.sin(v*5)+(hk(i*3+j*11)-.5)*.006;
  y-=.028*(1-sst(0,.05,1-u))*(k<S.count-1?1:0)+.022*(1-sst(0,.06,inner))+.012*(1-sst(0,.04,u));
  grid.push(pt(u,v,y));}
 const G=(i,j)=>grid[j*(NU+1)+i];
 const quad=(a,b,c,d)=>{P.push(...a,...b,...c,...a,...c,...d);};
 for(let j=0;j<NV;j++)for(let i=0;i<NU;i++)quad(G(i,j),G(i,j+1),G(i+1,j+1),G(i+1,j));
 const down=(p,dy,dx=0,dz=0)=>[p[0]+dx,p[1]-dy,p[2]+dz];
 // riser (u=1), back (u=0), void edge (v=0); cliff end is buried
 const drop=j=>bot,chipFace=(p,s)=>{const t=Math.atan2(p[2]-S.cz,p[0]-S.cx);return [p[0]-Math.sin(t)*s*0,p[1],p[2]];};
 for(let j=0;j<NV;j++){const a=G(NU,j),b=G(NU,j+1),r1=.01+.012*hk(j*5),r2=.01+.012*hk(j*5+5);
  const na=[a[0],bot,a[2]],nb=[b[0],bot,b[2]],ma=[a[0],a[1]-.09,a[2]],mb=[b[0],b[1]-.09,b[2]];
  const t=ta+(tb+nose-ta),tx=-Math.sin(t),tz=Math.cos(t);ma[0]-=tx*r1;ma[2]-=tz*r1;mb[0]-=tx*r2;mb[2]-=tz*r2;
  quad(a,ma,mb,b);quad(ma,na,nb,mb);
  const c=G(0,j),d=G(0,j+1);quad(d,[d[0],bot,d[2]],[c[0],bot,c[2]],c);}
 for(let i=0;i<NU;i++){const a=G(i,0),b=G(i+1,0),t1=Math.atan2(a[2]-S.cz,a[0]-S.cx),t2=Math.atan2(b[2]-S.cz,b[0]-S.cx);
  const ia=.02+.03*hk(i*7+1),ib=.02+.03*hk(i*7+8);
  const ma=[a[0]+Math.cos(t1)*ia,a[1]-.10-.04*hk(i),a[2]+Math.sin(t1)*ia],mb=[b[0]+Math.cos(t2)*ib,b[1]-.10-.04*hk(i+1),b[2]+Math.sin(t2)*ib];
  const na=[a[0]+Math.cos(t1)*.07,bot,a[2]+Math.sin(t1)*.07],nb=[b[0]+Math.cos(t2)*.07,bot,b[2]+Math.sin(t2)*.07];
  quad(a,b,mb,ma);quad(ma,mb,nb,na);}
 // underside
 for(let i=0;i<NU;i++){const a=G(i,0),b=G(i+1,0),c=G(i+1,NV),d=G(i,NV),t1=Math.atan2(a[2]-S.cz,a[0]-S.cx),t2=Math.atan2(b[2]-S.cz,b[0]-S.cx);quad([a[0]+Math.cos(t1)*.07,bot,a[2]+Math.sin(t1)*.07],[d[0],bot,d[2]],[c[0],bot,c[2]],[b[0]+Math.cos(t2)*.07,bot,b[2]+Math.sin(t2)*.07]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));
 // orient every triangle outward from the tread's centroid
 const p=g.attributes.position.array;let cx=0,cy=0,cz=0;const n=p.length/3;for(let i=0;i<p.length;i+=3){cx+=p[i];cy+=p[i+1];cz+=p[i+2];}cx/=n;cy/=n;cz/=n;
 for(let i=0;i<p.length;i+=9){const ax=p[i],ay=p[i+1],az=p[i+2],ux=p[i+3]-ax,uy=p[i+4]-ay,uz=p[i+5]-az,vx=p[i+6]-ax,vy=p[i+7]-ay,vz=p[i+8]-az,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,mx=(ax+p[i+3]+p[i+6])/3-cx,my=(ay+p[i+4]+p[i+7])/3-cy,mz=(az+p[i+5]+p[i+8])/3-cz;
  if(nx*mx+ny*my+nz*mz<0)for(let q=0;q<3;q++){const t=p[i+3+q];p[i+3+q]=p[i+6+q];p[i+6+q]=t;}}
 g.computeVertexNormals();return g;
}
export function buildStair131(){const parts=[];for(let k=0;k<STAIRS.count;k++)parts.push(treadPiece(k));return parts;}

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
