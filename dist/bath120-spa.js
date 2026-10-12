// V121-bath: BAÑOS right-hand spa restyle after files/uploads/image-44.webp.
// Light-blue tile deck, pale aqua mosaic shell with a cobalt mosaic band at the
// waterline, churning whirlpool foam with jet boils, a dry-stacked grotto pier,
// a chrome pool ladder and Venice-canal tile murals inside stone arches.
// Collision (spa-layout-v66.js) is unchanged: every new solid sits outside the
// walkable area or is a thin rail/tread the player passes like the old handrails.
import * as T from './vendor/three.module.min.js';
import {SPA} from './spa-layout-v66.js';

const ROOT=new URL('./assets/bath-v120/',import.meta.url);
const NAMES=['deck-tile','deck-tile-normal','deck-tile-roughness','mosaic-band','mosaic-band-normal','pool-tile','pool-tile-normal','mural-a','mural-a-normal','mural-b','mural-b-normal','mural-c','mural-c-normal','whirl-foam','grotto-stone','grotto-stone-normal'];
const tex={};let loading=null;
export function preloadSpa121(){
 if(loading)return loading;const loader=new T.TextureLoader();
 loading=Promise.all(NAMES.map(async n=>{const t=await loader.loadAsync(new URL(n+'.webp',ROOT).href);t.name='V121 bath / '+n;t.colorSpace=/normal|roughness|foam/.test(n)?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=n.startsWith('mural')?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=4;tex[n]=t;})).catch(e=>{loading=null;throw e;});
 return loading;
}
const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function setRepeat(m,keys,r){for(const k of keys){const t=m[k];if(t){t.repeat.set(r,r);t.needsUpdate=true;}}}

export function restyleSpa121(spa,scene){
 if(!tex['deck-tile'])throw new Error('preloadSpa121() must finish before restyleSpa121()');
 const m=spa.materials,added=[],group=new T.Group();group.name='V121 spa restyle (image-44)';scene.add(group);
 const add=(g,mat,name,cast=true)=>{const o=new T.Mesh(g,mat);o.name=name;o.castShadow=cast;o.receiveShadow=true;group.add(o);added.push(o);return o;};
 // 1. Deck: pale blue 15 cm glazed tiles (the deck UVs are metres).
 const deckT=tex['deck-tile'].clone(),deckN=tex['deck-tile-normal'].clone(),deckR=tex['deck-tile-roughness'].clone();
 for(const t of[deckT,deckN,deckR]){t.repeat.set(1.11,1.11);t.needsUpdate=true;}
 m.floor.map=deckT;m.floor.normalMap=deckN;m.floor.roughnessMap=deckR;m.floor.aoMap=null;m.floor.normalScale.set(.55,.55);m.floor.color.set(0xf2f8fa);m.floor.roughness=1;m.floor.needsUpdate=true;
 // 2. Shell / bottom / steps / benches: pale aqua 2.5 cm mosaic (old UV scale 3.2 per metre).
 const poolT=tex['pool-tile'].clone(),poolN=tex['pool-tile-normal'].clone();for(const t of[poolT,poolN]){t.repeat.set(.24,.24);t.needsUpdate=true;}
 m.mosaic.map=poolT;m.mosaic.normalMap=poolN;m.mosaic.roughnessMap=null;m.mosaic.aoMap=null;m.mosaic.normalScale.set(.45,.45);m.mosaic.roughness=.16;m.mosaic.color.set(0xffffff);m.mosaic.needsUpdate=true;
 // 3. Cobalt mosaic band: a waterline frieze 28 cm tall, inside the shell, plus the band on the coping face.
 const bandMat=new T.MeshStandardMaterial({name:'V121 cobalt glass mosaic band',map:tex['mosaic-band'],normalMap:tex['mosaic-band-normal'],normalScale:new T.Vector2(.55,.55),roughness:.12,metalness:0,side:T.BackSide,envMap:m.chrome.envMap||null,envMapIntensity:.5});
 const R=SPA.radius-.004,seg=160,bandG=new T.CylinderGeometry(R,R,.26,seg,1,true);
 {const uv=bandG.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.PI*2*R/.80,uv.getY(i)*.26/.80);}
 const band=add(bandG,bandMat,'Cobalt mosaic waterline band',false);band.position.set(SPA.cx,-.10,SPA.cz);
 // 4. Whirlpool: texture-driven churning foam swirled around two jets + jet boils.
 const water=spa.water.water.material,u=water.uniforms;u.whirlFoam={value:tex['whirl-foam']};
 water.fragmentShader=water.fragmentShader.replace('uniform sampler2D sceneColor,sceneDepth,normalA,normalB,ripple,caustics;','uniform sampler2D sceneColor,sceneDepth,normalA,normalB,ripple,caustics,whirlFoam;');
 water.fragmentShader=water.fragmentShader.replace('float foam=jacuzzi(p-(poolCenter+vec2(.02,.23)),.84,0.);',`float foam=jacuzzi(p-(poolCenter+vec2(.02,.23)),.84,0.);
 // V121: churning aeration = foam photo advected along a swirl around both jets.
 {vec2 ja=p-(poolCenter+vec2(.02,.23)),jb=p-(poolCenter+vec2(-.23,-.32));
  float ra=length(ja),rb=length(jb),aa=atan(ja.y,ja.x),ab=atan(jb.y,jb.x);
  vec2 sa=vec2(aa*.95/6.2832*5.+time*.055,ra*.55-time*.21),sb=vec2(-ab*.95/6.2832*4.+time*.07,rb*.62-time*.25);
  float wa=texture(whirlFoam,sa+micro*.6).r,wb=texture(whirlFoam,sb*1.3+.37-micro*.5).r;
  float w2=texture(whirlFoam,p*.42+vec2(time*.031,-time*.044)).r;
  float bodyA=1.-smoothstep(.25,1.55,ra),bodyB=1.-smoothstep(.2,1.15,rb);
  float churn=max(wa*bodyA,wb*bodyB*.95);churn=max(churn,w2*.55*(1.-smoothstep(.6,2.3,min(ra,rb))));
  float boil=(1.-smoothstep(.0,.30,ra+(w2-.5)*.18))*.95+(1.-smoothstep(.0,.24,rb+(wa-.5)*.16))*.85;
  float pulse=.85+.15*sin(time*5.3+ra*9.);
  foam=max(foam*.55,clamp(churn*1.25*pulse+boil,0.,.97));}`);
 water.needsUpdate=true;
 // 5. Grotto pier: the fractured cliff under the statues becomes dry-stacked beige sandstone.
 m.rock.map=tex['grotto-stone'];m.rock.normalMap=tex['grotto-stone-normal'];m.rock.roughnessMap=null;m.rock.aoMap=null;m.rock.color.set(0xf4ead8);m.rock.vertexColors=false;m.rock.normalScale.set(1,1);m.rock.needsUpdate=true;
 const stoneT=tex['grotto-stone'],stoneN=tex['grotto-stone-normal'];
 const stoneMat=new T.MeshStandardMaterial({name:'V121 dry-stacked grotto sandstone',map:stoneT,normalMap:stoneN,normalScale:new T.Vector2(.9,.9),roughness:.86,color:0xd9d1c2});
 stoneMat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 gW,gN;').replace('#include <begin_vertex>','#include <begin_vertex>\ngW=(modelMatrix*vec4(position,1.)).xyz;gN=normalize(mat3(modelMatrix)*normal);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 gW,gN;').replace('#include <map_fragment>',`vec3 gw=pow(abs(gN),vec3(4.));gw/=gw.x+gw.y+gw.z;vec3 gp=gW*.62;
   vec4 gc=texture2D(map,gp.zy)*gw.x+texture2D(map,gp.xz)*gw.y+texture2D(map,gp.xy)*gw.z;diffuseColor*=gc;float gWet=1.-smoothstep(.05,.55,gW.y);diffuseColor.rgb*=1.-gWet*.28;`)
  .replace('#include <normal_fragment_maps>',`vec3 n1=texture2D(normalMap,gp.zy).xyz*2.-1.,n2=texture2D(normalMap,gp.xz).xyz*2.-1.,n3=texture2D(normalMap,gp.xy).xyz*2.-1.;
   normal=normalize(normal+mat3(viewMatrix)*(vec3(0.,n1.x,n1.y)*gw.x+vec3(n2.x,0.,n2.y)*gw.y+vec3(n3.x,n3.y,0.)*gw.z)*.8);`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.25,gWet);');};
 stoneMat.customProgramCacheKey=()=> 'v121-grotto-triplanar';
 const rand=rng(121),slabs=[];
 const pier=PIER121;
 for(let row=0;row<pier.rows;row++){
  const y0=row*pier.course,h=pier.course*(.82+rand()*.3);let a=pier.a0+(row%2?pier.step*.5:0)*(rand()*.6+.2);
  while(a<pier.a1){const w=pier.step*(.55+rand()*.75),am=a+w/2,r=pier.r+(rand()-.5)*.05+row*pier.lean,d=.26+rand()*.14;
   const g=new T.BoxGeometry(w*r*.96,h,d,2,1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){p.setXYZ(i,p.getX(i)*(1+(rand()-.5)*.08),p.getY(i)+(rand()-.5)*.025,p.getZ(i)*(1+(rand()-.5)*.18));}g.computeVertexNormals();
   const o=add(g,stoneMat,'Dry-stacked grotto slab');o.position.set(SPA.cx+Math.cos(am)*r,y0+h/2,SPA.cz+Math.sin(am)*r);o.rotation.set((rand()-.5)*.05,-am+Math.PI/2+(rand()-.5)*.08,(rand()-.5)*.06);slabs.push(o);a+=w+.004;}
 }
 // 6. Chrome pool ladder: two bent tubes over the coping + three treads.
 const L=LADDER121,chrome=m.chrome;
 const polar=(r,y,across,a=L.a)=>new T.Vector3(SPA.cx+Math.cos(a)*r-Math.sin(a)*across,y,SPA.cz+Math.sin(a)*r+Math.cos(a)*across);
 for(const s of[-1,1]){const across=s*L.half;
  const pts=[[2.66,.01],[2.66,.48],[2.63,.64],[2.53,.73],[2.40,.71],[2.30,.58],[2.255,.38],[2.25,-.20],[2.245,-.78],[2.30,-.86]].map(([r,y])=>polar(r,y,across));
  add(new T.TubeGeometry(new T.CatmullRomCurve3(pts,false,'catmullrom',.25),72,.021,12,false),chrome,'Chrome pool ladder rail');
  const f=add(new T.CylinderGeometry(.045,.05,.02,20),chrome,'Ladder deck flange');f.position.copy(polar(2.66,.01,across));
  const w=add(new T.CylinderGeometry(.03,.03,.03,16),chrome,'Ladder wall bumper');w.position.copy(polar(2.305,-.86,across));w.rotation.z=Math.PI/2;w.rotation.y=-L.a;}
 for(const y of[-.22,-.50,-.78]){const g=new T.BoxGeometry(.075,.022,L.half*2+.02);const o=add(g,chrome,'Chrome ladder tread');o.position.copy(polar(2.22,y,0));o.rotation.y=-L.a;}
 // 7. Venice canal tile murals: the existing lightbox arch gets canal art; two new
 // sandstone arches carry the other murals on the lounge walls.
 const mural=(key)=>{const mat=new T.MeshStandardMaterial({name:'V121 hand-painted Venice tile mural '+key,map:tex['mural-'+key],normalMap:tex['mural-'+key+'-normal'],normalScale:new T.Vector2(.35,.35),roughness:.2,metalness:0,emissiveMap:tex['mural-'+key],emissive:0xffffff,emissiveIntensity:.08});return mat;};
 {const t=tex['mural-a'].clone();t.repeat.set(.60,1);t.offset.set(.20,0);t.needsUpdate=true;const n=tex['mural-a-normal'].clone();n.repeat.copy(t.repeat);n.offset.copy(t.offset);n.needsUpdate=true;
  m.mural.map=t;m.mural.emissiveMap=t;m.mural.normalMap=n;m.mural.normalScale=new T.Vector2(.35,.35);m.mural.roughness=.22;m.mural.emissiveIntensity=.16;m.mural.color.set(0xffffff);m.mural.needsUpdate=true;}
 for(const A of ARCHES121){
  const mat=mural(A.key),inner=A.w/2,spring=A.spring,sh=new T.Shape();sh.moveTo(-inner,0);sh.lineTo(-inner,spring);for(let i=0;i<=48;i++){const q=Math.PI-Math.PI*i/48;sh.lineTo(Math.cos(q)*inner,spring+Math.sin(q)*inner);}sh.lineTo(inner,0);sh.closePath();
  const g=new T.ShapeGeometry(sh,48),p=g.attributes.position,uv=g.attributes.uv,H=spring+inner;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+inner)/(2*inner),p.getY(i)/H);
  const o=add(g,mat,'Venice canal tile mural in stone arch',false);o.position.set(...A.p);o.rotation.y=A.ry;
  // Sandstone surround: two rounded jambs, an extruded arch ring and a sill.
  const ring=new T.Shape();const out=inner+.13;ring.moveTo(-out,spring);for(let i=0;i<=48;i++){const q=Math.PI-Math.PI*i/48;ring.lineTo(Math.cos(q)*out,spring+Math.sin(q)*out);}for(let i=0;i<=48;i++){const q=Math.PI*i/48;ring.lineTo(Math.cos(q)*inner,spring+Math.sin(q)*inner);}ring.closePath();
  const rg=new T.ExtrudeGeometry(ring,{depth:.09,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:24});const r=add(rg,stoneMat,'Sandstone mural arch ring');r.position.set(...A.p);r.rotation.y=A.ry;r.translateZ(-.02);
  for(const s of[-1,1]){const j=add(new T.BoxGeometry(.15,spring,.13,1,4,1),stoneMat,'Rounded sandstone mural jamb');j.position.set(...A.p);j.rotation.y=A.ry;j.translateX(s*(inner+.065));j.translateY(spring/2);j.translateZ(.045);}
  const sill=add(new T.BoxGeometry(2*inner+.36,.08,.18),stoneMat,'Sandstone mural sill');sill.position.set(...A.p);sill.rotation.y=A.ry;sill.translateY(-.04);sill.translateZ(.06);
 }
 // 8. Glass-sheet waterfall (image-44): the lip throws a laminar sheet forward
 // (0.75 m/s) so it arcs out over the pool on a true parabola; the upper two
 // thirds stay glassy (rolled bright edges, stretched refraction bands, a lip
 // highlight), the lower third breaks up into aerated white ribbons.
 {const W=spa.water,out=[7.57,1.065,-4.21],dir=[.649,.761],v0=1.0,width=1.0,land=.84,drop=out[1]-(-.14),ft=Math.sqrt(2*drop/9.81),reach=v0*ft;
  const imp=[out[0]+dir[0]*reach,-.14,out[2]+dir[1]*reach];
  const p=[],uv=[],idx=[],rows=64,cols=28;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const fr=j/rows,u=i/cols,age=fr*ft,lw=width+(land-width)*fr*fr,d=v0*age,x=(u-.5)*lw;
   p.push(out[0]+dir[0]*d-dir[1]*x,out[1]-4.905*age*age,out[2]+dir[1]*d+dir[0]*x);uv.push(u,fr);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  W.fall.children.forEach((o,k)=>{if(!o.isMesh)return;o.geometry.dispose();o.geometry=k?g.clone():g;const mt=o.material;mt.uniforms.flightTime.value=ft;
   const head=mt.fragmentShader.slice(0,mt.fragmentShader.indexOf('void main(){'));
   mt.fragmentShader=head+GLASS_FALL121;mt.needsUpdate=true;added.push(o);});
  W.uniforms.impact.value.set(...imp);if(W.foam)W.foam.position.set(imp[0],W.foam.position.y,imp[2]);
 }
 // The two mural niches lose their sun-face plaques (they covered the murals);
 // the cyan acrylic spillway gives way to a natural sandstone lip slab.
 {// Spa geometry is already merged per material, so cut triangles by region.
  const boxes=[...ARCHES121.map(A=>new T.Box3(new T.Vector3(12.76,1.18,A.p[2]-.42),new T.Vector3(12.838,2.00,A.p[2]+.42))),new T.Box3(new T.Vector3(6.95,1.00,-4.62),new T.Vector3(8.20,1.14,-4.18))];
  const c=new T.Vector3(),A_=new T.Vector3(),B_=new T.Vector3(),C_=new T.Vector3();
  const victims=[];scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&/batched/.test(o.name)&&!/limestone|stone-wall|soffit/.test(o.name))victims.push(o);});
  for(const o of victims){o.updateMatrixWorld();let g=o.geometry;if(g.index)g=g.toNonIndexed();const p=g.attributes.position,n=p.count/3,keep=[];let cut=0;
   for(let t=0;t<n;t++){A_.fromBufferAttribute(p,t*3).applyMatrix4(o.matrixWorld);B_.fromBufferAttribute(p,t*3+1).applyMatrix4(o.matrixWorld);C_.fromBufferAttribute(p,t*3+2).applyMatrix4(o.matrixWorld);c.copy(A_).add(B_).add(C_).multiplyScalar(1/3);if(boxes.some(b=>b.containsPoint(c)))cut++;else keep.push(t);}
   if(!cut){if(g!==o.geometry)g.dispose();continue;}
   if(!keep.length){o.removeFromParent();continue;}
   const ng=new T.BufferGeometry();for(const [k,at] of Object.entries(g.attributes)){const sz=at.itemSize,arr=new at.array.constructor(keep.length*3*sz);keep.forEach((t,i)=>arr.set(at.array.subarray(t*3*sz,t*3*sz+3*sz),i*3*sz));ng.setAttribute(k,new T.BufferAttribute(arr,sz,at.normalized));}
   if(g!==o.geometry)g.dispose();o.geometry.dispose();o.geometry=ng;}
  const lip=new T.BoxGeometry(1.24,.07,.48,6,1,3),lp=lip.attributes.position,lr=rng(77);for(let i=0;i<lp.count;i++){lp.setY(i,lp.getY(i)+(lr()-.5)*.018);lp.setX(i,lp.getX(i)*(1+(lr()-.5)*.05));}lip.computeVertexNormals();
  const slab=add(lip,stoneMat,'Sandstone waterfall lip slab');slab.position.set(7.57,1.03,-4.40);slab.rotation.y=-Math.atan2(.761,.649)+Math.PI/2;
  const bed=add(new T.BoxGeometry(1.02,.01,.30),new T.MeshStandardMaterial({name:'V121 wet lip film',color:0x6f8a8c,roughness:.08,metalness:0}),'Wet slab top under the sheet',false);bed.position.set(7.57,1.069,-4.36);bed.rotation.y=slab.rotation.y;}
 // 9. Grotto rock lift: the limestone read too dark against the pale tile;
 // a faint self-lit term from its own albedo brings it to the ref's beige.
 m.rock.emissive=new T.Color(0xfff2dc);m.rock.emissiveMap=tex['grotto-stone'];m.rock.emissiveIntensity=.22;m.rock.color.set(0xfff6e6);m.rock.needsUpdate=true;
 const materials=[bandMat,stoneMat,...added.map(o=>o.material)];
 return{group,meshes:added,materials:[...new Set(materials)],dispose(){added.forEach(o=>o.geometry.dispose());new Set(materials).forEach(x=>x.dispose());group.removeFromParent();}};
}
// Placement constants (metres, bath frame). Tuned in /workspace/work/bathspa preview.
export const PIER121={a0:3.95,a1:4.75,r:2.92,rows:0,course:.27,step:.42,lean:-.012};
export const LADDER121={a:1.25,half:.24};
// Murals b and c sit in the backs of the two pool-side wall niches (east wall).
export const ARCHES121=[{key:'b',p:[12.852,.56,-4.05],ry:-Math.PI/2,w:1.40,spring:.88},{key:'c',p:[12.852,.56,-1.50],ry:-Math.PI/2,w:1.40,spring:.88}];
const GLASS_FALL121=`void main(){
 float age=vUv.y*flightTime,fr=vUv.y;
 float n=fbm(vec2(vUv.x*18.+layer*7.,age*14.-time*11.));
 float fine=fbm(vec2(vUv.x*58.-layer*3.,age*30.-time*21.));
 // laminar -> broken transition, a little ragged across the width
 float brk=smoothstep(.64,.98,fr+(n-.5)*.18);
 float ragged=(n-.5)*.02*(.3+brk)+(fine-.5)*.012*brk;
 float ex=min(vUv.x,1.-vUv.x);
 float edge=smoothstep(0.,.025+.03*brk,ex+ragged);
 float holes=smoothstep(.62,.80,fine)*brk*.85;
 float coverage=edge*(1.-holes);if(coverage<.02)discard;
 vec2 q1=vec2(vUv.x*2.2,age*3.2-time*2.6),q2=vec2(vUv.x*4.5+1.7,age*6.-time*4.4);
 vec3 a=texture(normalA,q1).xyz*2.-1.,b=texture(normalB,q2).xyz*2.-1.;
 vec3 tangent=normalize(cross(vec3(0.,1.,0.),worldNormal)),bitangent=normalize(cross(worldNormal,tangent));
 // laminar: smooth, gently corrugated horizontal bands; broken: busy normals
 float band=sin(age*95.-time*30.+n*3.)*.5+.5;
 vec3 N=normalize(worldNormal+tangent*(a.x*(.04+.22*brk))+bitangent*((band-.5)*.10*(1.-brk)+a.y*.16*brk+b.y*.08));
 // rolled edges bend strongly sideways, like a thick glass rim
 float rim=1.-smoothstep(.0,.06,ex);N=normalize(N+tangent*sign(vUv.x-.5)*rim*.9);
 vec3 V=normalize(eye-worldPosition);if(dot(N,V)<0.)N=-N;
 float f=fresnelWater(dot(N,V));vec2 screen=gl_FragCoord.xy/resolution;
 float gap=linearDepth(texture(sceneDepth,screen).r,nearFar)+viewPosition.z;if(ready>.5&&gap<-.012)discard;
 vec2 refUV=refractUV(screen,normalize(mat3(viewMatrix)*N),-viewPosition.z,.016+rim*.02);
 vec3 behind=texture(sceneColor,refUV).rgb;
 vec3 transmitted=behind*vec3(.90,.97,.98);
 vec3 R=reflect(-V,N);
 vec3 env=vec3(.30,.42,.44)+vec3(1.,.97,.9)*pow(max(0.,R.y),24.)*.9;
 vec3 water=mix(transmitted,env,clamp(f*1.15+rim*.35,0.,.85));
 // lip highlight (sheet leaving the ledge) and specular streaks running down
 water+=vec3(1.)*smoothstep(.05,.0,fr)*.55;
 float streak=pow(noise(vec2(vUv.x*90.+n,age*3.-time*1.2)),12.)*(1.-brk)*.35;
 water+=vec3(.85,.95,1.)*(streak+rim*.18);
 // aeration in the broken part
 float aer=brk*smoothstep(.35,.75,fine*.7+n*.5);
 water=mix(water,vec3(.88,.95,.96),aer*.85);
 water=mix(vec3(.11,.27,.31),water,ready);
 float alpha=coverage*mix(layer>.5?.18:.55,layer>.5?.55:.9,aer)+rim*.2*coverage;
 fragColor=vec4(water,clamp(alpha,0.,1.));
}`;
