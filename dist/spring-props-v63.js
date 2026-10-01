/* Sculpted cave props. Units: metres. No imports, loaders, random state or DOM.
 * Pass THREE and generated rock/copper/wood/towel/scale materials. Caller owns
 * placement. Lamp backplate is centred at origin; its front points along +Z.
 */
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function mat(T,m,key,color,roughness=.85,metalness=0){
 const src=m[key]||m.rock||m.stone;const out=src?.isMaterial?src.clone():new T.MeshStandardMaterial({color});
 out.name='V63 '+key;out.roughness=roughness;out.metalness=metalness;
 if(!src&&out.color)out.color.set(color);return out;
}
function mesh(T,g,name,geo,material,p){const q=new T.Mesh(geo,material);q.name=name;if(p)q.position.fromArray(p);q.castShadow=q.receiveShadow=true;g.add(q);return q;}
function lathe(T,p,n=48){return new T.LatheGeometry(p.map(v=>new T.Vector2(...v)),n);}
function tube(T,g,name,p,r,m,n=32,s=8){return mesh(T,g,name,new T.TubeGeometry(new T.CatmullRomCurve3(p.map(v=>new T.Vector3(...v))),n,r,s,false),m);}
function ring(T,g,name,r,t,y,z,m){const o=mesh(T,g,name,new T.TorusGeometry(r,t,8,48),m,[0,y,z]);o.rotation.x=Math.PI/2;return o;}
function bolt(T,g,name,p,m,r=.012){const q=mesh(T,g,name,new T.CylinderGeometry(r,r,.012,6),m,p);q.rotation.x=Math.PI/2;mesh(T,g,name+' rounded crown',new T.SphereGeometry(r*.84,12,8),m,[p[0],p[1],p[2]+.006]).scale.set(1,1,.35);}
function bevelPlate(T,w,h,d,r){const s=new T.Shape(),x=w/2,y=h/2;s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);const o=new T.ExtrudeGeometry(s,{depth:d-.004,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:3,steps:1,curveSegments:8});o.translate(0,0,-d/2+.002);return o;}
function bounds(T,g){g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g);return {min:b.min.toArray(),max:b.max.toArray()};}

export function createMineLamp(T,m={}){
 const group=new T.Group();group.name='Corroded copper mine lantern';
 const copper=mat(T,m,'copper',0x785039,.74,.74),edges=copper.clone();edges.name='Worn copper edges';edges.roughness=.51;edges.metalness=.85;
 const blackened=copper.clone();blackened.name='Blackened copper socket';blackened.color.multiplyScalar(.28);blackened.roughness=.86;
 const mount=mesh(T,group,'Thick rounded wall anchor plate',bevelPlate(T,.15,.34,.024,.045),copper,[0,.025,0]);
 // Corroded brackets intersect their mounting sockets and the hood neck.
 tube(T,group,'Forged curved upper suspension',[[0,.103,.014],[0,.152,.051],[0,.206,.14],[0,.212,.23],[0,.186,.27]],.015,copper,40,10);
 tube(T,group,'Lower wall brace',[[0,-.082,.013],[0,-.127,.052],[0,-.195,.12],[0,-.207,.27]],.010,copper,32,8);
 for(const y of [-.09,.139])bolt(T,group,'Wall anchor bolt '+y,[0,y,.023],edges,.013);
 for(const y of [-.08,.10]){const collar=mesh(T,group,'Bracket anchor collar',new T.CylinderGeometry(.027,.030,.025,16),copper,[0,y,.025]);collar.rotation.x=Math.PI/2;}
 mesh(T,group,'Solid domed rain hood',lathe(T,[[0,.179],[.028,.178],[.052,.17],[.078,.153],[.106,.129],[.132,.111],[.148,.105],[.148,.095],[.133,.091],[.112,.099],[.085,.119],[.057,.14],[.027,.158],[0,.158]],64),copper,[0,0,.27]);
 ring(T,group,'Rolled thick hood rim',.145,.006,.099,.27,edges);
 mesh(T,group,'Hood suspension neck',lathe(T,[[0,.171],[.021,.171],[.022,.195],[.018,.207],[0,.207]],28),copper,[0,0,.27]);
 const glass=new T.MeshPhysicalMaterial({name:'Frosted thick amber glass, Fresnel edge',color:0xf4e6ce,roughness:.40,metalness:0,transmission:.56,thickness:.015,ior:1.47,transparent:true,opacity:.88,attenuationColor:new T.Color(0xd8b481),attenuationDistance:.42,emissive:0xf4aa53,emissiveIntensity:.36,clearcoat:.17,clearcoatRoughness:.32,depthWrite:false});
 // Keep the supplied grain normal map at very low strength to break the lens sheen.
 if(m.glass?.normalMap||m.scale?.normalMap){glass.normalMap=m.glass?.normalMap||m.scale.normalMap;glass.normalScale=new T.Vector2(.055,.055);}
 glass.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat lampFr=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),5.0);\ntotalEmissiveRadiance *= mix(1.0,0.34,lampFr);');};
 glass.customProgramCacheKey=()=> 'v63-frosted-lantern-Fresnel-v1';
 const lens=mesh(T,group,'Closed thick frosted lantern glass',lathe(T,[[0,-.192],[.048,-.191],[.082,-.179],[.105,-.149],[.112,-.106],[.112,.058],[.105,.09],[.095,.093],[.095,.075],[.100,.054],[.100,-.104],[.093,-.143],[.074,-.166],[.044,-.179],[0,-.179]],56),glass,[0,0,.27]);lens.castShadow=false; lens.renderOrder=3;
 const glow=new T.MeshStandardMaterial({name:'Warm luminous inner lamp globe',color:0xffdfad,roughness:.63,emissive:0xffb65a,emissiveIntensity:2.5});
 mesh(T,group,'Physical warm inner globe',new T.SphereGeometry(.05,24,20),glow,[0,-.015,.27]).scale.set(.84,1.56,.84);
 mesh(T,group,'Internal bulb ceramic socket',lathe(T,[[0,.065],[.033,.065],[.033,.101],[0,.101]],20),blackened,[0,0,.27]);
 for(let i=0;i<7;i++){const a=i/7*TAU,c=Math.cos(a),s=Math.sin(a);tube(T,group,'Protective curved cage rib '+i,[[.111*c,.095,.27+.111*s],[.12*c,.051,.27+.12*s],[.121*c,-.113,.27+.121*s],[.105*c,-.173,.27+.105*s],[.076*c,-.198,.27+.076*s]],.0055,copper,30,8);}
 ring(T,group,'Cage lower rolled ring',.087,.010,-.190,.27,edges);
 ring(T,group,'Cage upper retaining ring',.117,.008,.071,.27,copper);
 mesh(T,group,'Closed lower metal cup',lathe(T,[[0,-.218],[.036,-.217],[.068,-.207],[.087,-.191],[.084,-.185],[.066,-.198],[.030,-.207],[0,-.207]],40),copper,[0,0,.27]);
 for(let i=0;i<3;i++){const a=i/3*TAU;const screw=mesh(T,group,'Cage retaining screw '+i,new T.SphereGeometry(.009,12,8),edges,[.089*Math.cos(a),-.19,.27+.089*Math.sin(a)]);screw.scale.set(1,.7,1);}
 const light=new T.PointLight(0xffc780,5.5,2.8,2);light.name='Warm mine lantern practical';light.position.set(0,-.032,.286);group.add(light);
 group.userData.prop={units:'metres',front:'+Z',anchorPlaneZ:-.012,lampCenterZ:.27,contact:'Backplate penetrates anchor plane by 12 mm. Suspension joins hood; lower brace joins metal cup.'};
 return {group,lights:[light],light,glass:lens,glassMaterial:glass,emitter:group.getObjectByName('Physical warm inner globe'),bounds:bounds(T,group),contactNotes:group.userData.prop.contact};
}

function finishGeo(T,p,uv,ix,colors){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',new T.Float32BufferAttribute(uv,2));if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();return g;}
function stoneBasin(T){
 // Continuous outside, broad rounded lip and deep concavity belong to ONE shell.
 // The bottom is 430 mm thick; the lip is 95–135 mm thick, never a paper disc.
 const profile=[[0,0],[.28,0],[.42,.006],[.49,.035],[.525,.11],[.537,.20],[.558,.30],[.575,.40],[.584,.51],[.592,.60],[.584,.67],[.561,.71],[.524,.735],[.483,.737],[.445,.716],[.425,.682],[.407,.638],[.377,.582],[.336,.532],[.283,.487],[.21,.454],[.122,.436],[.052,.430],[0,.430]];
 const p=[],uv=[],ix=[],colors=[],N=96;
 for(let j=0;j<profile.length;j++){const[r,y]=profile[j];for(let i=0;i<=N;i++){const a=i/N*TAU,ir=1+.047*Math.sin(a*3+.6)+.026*Math.cos(a*5-1)+.013*Math.sin(a*11+.5);const exterior=j<12,noise=(exterior?.006:.0025)*Math.sin(a*19+y*19)*Math.sin(a*9-y*21);const rr=r*ir+noise*Math.min(r/.2,1),yy=y+Math.min(y/.08,1)*r/.59*(.006*Math.sin(a*3+.7)+.006*Math.cos(a*7)+.003*Math.sin(a*17+y*13));p.push(rr*Math.cos(a),yy,rr*Math.sin(a));uv.push(i/N*2.7,j/(profile.length-1)*2.3);const shade=.94+.035*Math.sin(a*9+y*5)+.027*Math.cos(a*17-y*23);colors.push(shade,shade,shade*.984);}}
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;ix.push(a,c,b,b,c,d);}
 const g=finishGeo(T,p,uv,ix,colors);
 for(let j=0;j<profile.length-1;j++)g.addGroup(j*N*6,N*6,j<12?0:j<15?1:2);
 return g;
}
const benchTop=(x,z)=>.405-.025*Math.pow(Math.abs(x)/.44,6)-.014*Math.pow(Math.abs(z)/.28,6)+.003*Math.sin(x*17+z*9)+.002*Math.cos(x*25-z*19);
function benchGeo(T){
 const N=80,p=[],uv=[],ix=[],profiles=[[0,0],[.60,0],[.83,.035],[.98,.12],[1,.24],[.97,.34],[.87,.39],[.67,.40],[.35,.404],[0,.405]];
 for(let j=0;j<profiles.length;j++)for(let i=0;i<=N;i++){const a=i/N*TAU,[r,y]=profiles[j],shape=1+.023*Math.sin(a*5+.8)+.009*Math.cos(a*13),x=.44*r*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.66)*shape,z=.28*r*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.7)*shape;let h=j>=6?benchTop(x,z)-(j===6?.01:0):y+(y>0?.008*Math.sin(a*7+y*11):0);p.push(x,h,z);uv.push(i/N*2.2,j/(profiles.length-1)*1.4);}
 for(let j=0;j<profiles.length-1;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;ix.push(a,c,b,b,c,d);}return finishGeo(T,p,uv,ix);
}
function towelCloth(T){
 // Static relaxation at construction: structural/shear links, gravity and
 // stone collision. The solved vertices are retained, with no per-frame solve.
 const nx=24,ny=42,w=.46,len=.78,n=(nx+1)*(ny+1),pos=new Float64Array(n*3),old=new Float64Array(n*3),fixed=new Uint8Array(n),links=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i,s=j/ny*len,u=i/nx,x=(u-.5)*w+.015;let y,z;
  if(s<.44){z=-.20+s;y=benchTop(x,z)+.008;}
  else if(s<.492){const a=(s-.44)/.052*Math.PI/2;z=.24+.033*Math.sin(a);y=.377+.033*Math.cos(a);}
  else {z=.276+(s-.492)*.12;y=.377-(s-.492);}
  const fold=Math.sin(u*TAU*3.2+s*7)+.33*Math.sin(u*TAU*6.1-s*11);y+=.003*fold;z+=Math.max(0,s-.39)*.033*fold;
  pos.set([x,y,z],k*3);fixed[k]=j<2?1:0;
 }
 old.set(pos);
 const add=(a,b,rest,strength)=>links.push([a,b,rest,strength]);
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i;if(i<nx)add(k,k+1,w/nx,1);if(j<ny)add(k,k+nx+1,len/ny,1);if(i<nx&&j<ny){add(k,k+nx+2,Math.hypot(w/nx,len/ny),.7);add(k+1,k+nx+1,Math.hypot(w/nx,len/ny),.7);}if(i<nx-1)add(k,k+2,w/nx*2,.19);if(j<ny-1)add(k,k+2*(nx+1),len/ny*2,.19);}
 function collide(k){const o=k*3,x=pos[o],y=pos[o+1],z=pos[o+2],top=benchTop(x,clamp(z,-.24,.24));
  if(Math.abs(x)<.40&&z>-.24&&z<.242&&y<top+.005)pos[o+1]=top+.005;
  if(Math.abs(x)<.397&&z>=.242&&z<.31&&y>.342&&y<.414){const cy=.372,cz=.242,r=.037,dy=pos[o+1]-cy,dz=z-cz,rr=Math.hypot(dy,dz);if(rr<r){pos[o+1]=cy+dy/(rr||1)*r;pos[o+2]=cz+dz/(rr||1)*r;}}
  if(Math.abs(x)<.4&&pos[o+1]<.372&&pos[o+1]>.035&&pos[o+2]>.20&&pos[o+2]<.292)pos[o+2]=.292+.002*Math.sin(x*19+pos[o+1]*7);
  if(pos[o+1]<.006)pos[o+1]=.006;
 }
 for(let step=0;step<68;step++){
  for(let k=0;k<n;k++)if(!fixed[k]){const o=k*3;for(let a=0;a<3;a++){const q=pos[o+a];pos[o+a]+=(q-old[o+a])*.68;old[o+a]=q;}pos[o+1]-=.00034;}
  for(let pass=0;pass<5;pass++){for(const[a,b,r,stiff]of links){const ai=a*3,bi=b*3,dx=pos[bi]-pos[ai],dy=pos[bi+1]-pos[ai+1],dz=pos[bi+2]-pos[ai+2],d=Math.hypot(dx,dy,dz)||1,weight=(d-r)/d*stiff/((fixed[a]?0:1)+(fixed[b]?0:1)||1);if(!fixed[a]){pos[ai]+=dx*weight;pos[ai+1]+=dy*weight;pos[ai+2]+=dz*weight;}if(!fixed[b]){pos[bi]-=dx*weight;pos[bi+1]-=dy*weight;pos[bi+2]-=dz*weight;}}for(let k=0;k<n;k++)if(!fixed[k])collide(k);}
 }
 const p=Array.from(pos),uv=[],ix=[],colors=[],damp=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i,u=i/nx,v=j/ny,y=p[k*3+1],z=p[k*3+2],contact=clamp(1-Math.abs(y-benchTop(p[k*3],z))/.018),wet=clamp(contact*.35+clamp((v-.74)*4)*(.65+.12*Math.sin(u*13))+.12*Math.sin(u*9+v*14));uv.push(u,v);damp.push(wet);colors.push(1-wet*.28,1-wet*.24,1-wet*.22);if(j<ny&&i<nx){const a=k,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}}
 const first=finishGeo(T,p,uv,ix,colors),norm=first.getAttribute('normal'),front=p.slice(),back=p.slice();
 for(let k=0;k<n;k++)for(let a=0;a<3;a++){front[k*3+a]+=norm.array[k*3+a]*.0014;back[k*3+a]-=norm.array[k*3+a]*.0014;}
 const solid=front.concat(back),uv2=uv.concat(uv),cols=colors.concat(colors),idx=ix.slice();for(let t=0;t<ix.length;t+=3)idx.push(ix[t]+n,ix[t+2]+n,ix[t+1]+n);
 const border=[];for(let i=0;i<=nx;i++)border.push(i);for(let j=1;j<=ny;j++)border.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)border.push(ny*(nx+1)+i);for(let j=ny-1;j>0;j--)border.push(j*(nx+1));
 for(let a=0;a<border.length;a++){const b=border[a],c=border[(a+1)%border.length];idx.push(b,c,b+n,c,c+n,b+n);}
 first.dispose();const g=finishGeo(T,solid,uv2,idx,cols);g.setAttribute('damp',new T.Float32BufferAttribute(damp.concat(damp),1));
 return {geometry:g,hem: Array.from({length:nx+1},(_,i)=>front.slice((ny*(nx+1)+i)*3,(ny*(nx+1)+i)*3+3)),stats:{particles:n,steps:68,links:links.length,thickness:.0028}};
}

function basinWater(T,m){
 const material=new T.MeshPhysicalMaterial({name:'Clear mineral wash water IOR 1.3335',color:0xc2d8ca,roughness:.095,metalness:0,transmission:.92,thickness:.20,ior:1.3335,transparent:true,opacity:.79,depthWrite:false,attenuationColor:new T.Color(0x81a597),attenuationDistance:2.2,clearcoat:.7,clearcoatRoughness:.08});
 if(m.water?.normalMap){material.normalMap=m.water.normalMap;material.normalScale=new T.Vector2(.025,.025);}
 const timeUniform={value:0};
 material.onBeforeCompile=s=>{s.uniforms.v63Time=timeUniform;s.vertexShader='uniform float v63Time;\nvarying vec2 v63WaterXZ;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nv63WaterXZ=position.xz;\ntransformed.y+=.0012*sin(position.x*27.0+v63Time*.8)*sin(position.z*23.0-v63Time*.63);');s.fragmentShader='uniform float v63Time;\nvarying vec2 v63WaterXZ;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(.018*cos(v63WaterXZ.x*27.0+v63Time*.8),.018*sin(v63WaterXZ.y*23.0-v63Time*.63),0.));');};material.customProgramCacheKey=()=> 'v63-basin-water-wave-v1';
 const N=96,p=[0,.650,0],uv=[.5,.5],ix=[];for(let i=0;i<=N;i++){const a=i/N*TAU,r=.410*(1+.046*Math.sin(a*3+.6)+.026*Math.cos(a*5-1));p.push(r*Math.cos(a),.650,r*Math.sin(a));uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);if(i<N)ix.push(0,i+2,i+1);}return {geometry:finishGeo(T,p,uv,ix),material,timeUniform};
}

export function createPrimitiveWashStation(T,m={}){
 const group=new T.Group();group.name='Primitive carved stone spring wash station';
 const rock=mat(T,m,'rock',0x88806b,.93),rim=mat(T,m,'wetRock',0x817c64,.75),mineral=mat(T,m,'scale',0xb4af90,.63);for(const q of [rock,rim,mineral])q.vertexColors=true;
 const basin=mesh(T,group,'Single hand-hewn stone block with carved basin',stoneBasin(T),[rock,rim,mineral]);
 const waterInfo=basinWater(T,m),water=mesh(T,group,'Clear water inside deep stone bowl',waterInfo.geometry,waterInfo.material);water.castShadow=false;water.renderOrder=4;
 // The hand-carved ladle has distinct inner/outer wood skins and a real lip.
 const wood=mat(T,m,'wood',0x805237,.78),dipper=new T.Group();dipper.name='Wooden dipper partly immersed in basin';dipper.position.set(-.06,.560,.08);dipper.rotation.set(.045,0,.105);group.add(dipper);
 const cup=mesh(T,dipper,'Concave wooden ladle cup with 10 mm wall',lathe(T,[[0,0],[.025,.001],[.052,.007],[.077,.025],[.096,.052],[.108,.083],[.110,.101],[.106,.111],[.099,.111],[.096,.102],[.097,.084],[.086,.060],[.068,.042],[.046,.031],[.021,.026],[0,.026]],56),wood);
 tube(T,dipper,'Long carved dipper handle',[[.101,.097,0],[.14,.103,.002],[.23,.107,.002],[.36,.109,0],[.47,.114,-.002],[.55,.118,-.002]],.012,wood,48,10);
 mesh(T,dipper,'Rounded handle end',new T.SphereGeometry(.012,14,10),wood,[.55,.118,-.002]);
 const endGrain=wood.clone();endGrain.name='Pale worn wood at handle end';endGrain.color.multiplyScalar(1.13);mesh(T,dipper,'Worn wooden end grain',new T.SphereGeometry(.0118,14,10),endGrain,[.552,.118,-.002]).scale.set(.25,.92,.92);
 const bench=new T.Group();bench.name='Low natural rock towel bench';bench.position.set(-.9,0,.65);group.add(bench);
 const benchMat=mat(T,m,'rock',0x726d5b,.92);mesh(T,bench,'Single irregular thick stone bench',benchGeo(T),benchMat);
 const cloth=mat(T,m,'towel',0xb8b2a0,.97);cloth.vertexColors=true;cloth.side=T.FrontSide;cloth.name='Damp woven towel with contact darkening';
 cloth.onBeforeCompile=s=>{s.vertexShader='attribute float damp; varying float v63Damp;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nv63Damp=damp;');s.fragmentShader='varying float v63Damp;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.72,v63Damp*.55);');};cloth.customProgramCacheKey=()=> 'v63-damp-solved-towel-v1';
 const solved=towelCloth(T),towel=mesh(T,bench,'Gravity-relaxed thick towel draped over stone',solved.geometry,cloth);towel.userData.cloth=solved.stats;
 const hemMat=cloth.clone();hemMat.vertexColors=false;hemMat.onBeforeCompile=()=>{};hemMat.customProgramCacheKey=()=> 'v63-towel-hem-v1';tube(T,bench,'Rolled sewn towel hem',solved.hem,.0021,hemMat,48,6);
 group.userData.prop={units:'metres',groundY:0,basinRimY:.737,waterY:.650,basinRadius:.634,benchCenter:[-.9,0,.65],contact:'Stone base and bench bottom lie on y=0. Ladle cup enters water; handle rests on near right stone rim. Towel is gravity-relaxed against bench and has real 2.8 mm thickness.',cloth:solved.stats};
 return {group,basin,bench,dipper,towel,water,glass:water,lights:[],timeUniform:waterInfo.timeUniform,bounds:bounds(T,group),contactNotes:group.userData.prop.contact};
}
