import * as T from './vendor/three.module.min.js';
import {addBox,addTube,addPlane,worldUV} from './bath-v61-materials.js?v=61';
import {receptionMaterials73} from './reception-materials-v73.js';
import {LOUNGE73,WALL_LAMPS73} from './reception-plan-v73.js';

function surface(root,mat,nu,nv,fn,name){const p=[],uv=[],index=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;index.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.attributes.uv.clone());g.setIndex(index);g.computeVertexNormals();const o=new T.Mesh(g,mat);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
function softBox(root,mat,x,y,z,w,h,d,r,name){const g=new T.BoxGeometry(w,h,d,10,6,8),p=g.attributes.position,half=[w/2,h/2,d/2];r=Math.min(r,...half.map(v=>v*.9));for(let i=0;i<p.count;i++){const a=[p.getX(i),p.getY(i),p.getZ(i)],c=a.map((v,k)=>Math.max(-half[k]+r,Math.min(half[k]-r,v))),n=a.map((v,k)=>v-c[k]),l=Math.hypot(...n);p.setXYZ(i,...c.map((v,k)=>v+n[k]/Math.max(.00001,l)*r));}g.computeVertexNormals();worldUV(g,.6);const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
function lathe(root,mat,profile,x,y,z,name,segments=24){const o=new T.Mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments),mat);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
function ball(root,mat,x,y,z,sx,sy,sz,name){const o=new T.Mesh(new T.SphereGeometry(1,16,10),mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
function sofa(root,m){
 const q=LOUNGE73.sofa,g=new T.Group();g.position.set(q.x,0,q.z);g.rotation.y=q.yaw;g.name='Deep button-tufted green Chesterfield';root.add(g);
 softBox(g,m.leather,0,.32,0,2.20,.31,.89,.085,'Continuous upholstered sofa base');
 softBox(g,m.leather,0,.77,-.405,2.06,.54,.10,.04,'Broad rounded upholstered back');
 for(const x of[-.89,.89])for(const z of[-.32,.30])lathe(g,m.walnut,[[.05,0],[.06,.025],[.04,.085],[.057,.12],[.057,.18]],x,0,z,'Turned walnut bun foot');
 for(const x of[-.423,.423]){softBox(g,m.leatherShine,x,.482,.065,.817,.15,.622,.062,'Crowned individual seat cushion');const points=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;points.push([x+.392*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.25),.495,.065+.292*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.25)]);}addTube(g,m.leather,points,.006,'Seat cushion stitched welt',48);}
 const buttons=[];for(let row=0;row<3;row++)for(let col=0;col<7;col++){const x=-.79+col*.262+(row%2)*.131;if(x<.84)buttons.push([x,.621+row*.161]);}
 const panel=surface(g,m.leather,78,30,(u,v)=>{const x=(u-.5)*1.76,y=.555+v*.48;let z=-.226+.019*Math.sin(v*Math.PI);for(const [bx,by]of buttons){const dx=(x-bx)/.13,dy=(y-by)/.08,r=dx*dx+dy*dy;z-=.061*Math.exp(-r*5.3);z-=.010*Math.exp(-Math.abs(dx*dx-dy*dy)*18)*Math.exp(-r*.65);}return[x,y,z];},'Continuous diamond pleats and deep button wells');panel.material.side=T.DoubleSide;
 for(const [x,y]of buttons)ball(g,m.leatherShine,x,y,-.286,.015,.015,.008,'Leather covered tuft button');
 for(const side of[-1,1]){
  softBox(g,m.leather,side*.978,.685,.015,.259,.61,.83,.114,'Rounded upholstered side and arm support');
  const arm=lathe(g,m.leatherShine,[[0,-.43],[.087,-.421],[.129,-.38],[.144,-.26],[.147,.25],[.137,.35],[.104,.403],[.037,.422],[0,.427]],side*.978,.936,0,'Continuous rolled arm with rounded end',32);arm.rotation.x=Math.PI/2;
  const seam=[];for(let k=0;k<=32;k++){const a=k/32*Math.PI*2;seam.push([side*.978+Math.cos(a)*.11,.936+Math.sin(a)*.11,.411]);}addTube(g,m.leather,seam,.005,'Rolled arm end piping',32);
  for(let i=0;i<10;i++)ball(g,m.brass,side*1.069,.395+i*.039,.396,.005,.005,.005,'Small aged brass upholstery tack');
 }
 const rail=lathe(g,m.leatherShine,[[0,-.90],[.078,-.88],[.105,-.79],[.105,.79],[.078,.88],[0,.90]],0,1.004,-.355,'Rolled back crest',28);rail.rotation.z=Math.PI/2;
 return g;
}
function rug(root,m){const q=LOUNGE73.rug,g=new T.Group();g.position.set(q.x,0,q.z);g.rotation.y=q.yaw;root.add(g);const cloth=surface(g,m.rug,68,44,(u,v)=>{const x=(u-.5)*q.width,z=(v-.5)*q.depth,edge=Math.pow(Math.abs(u-.5)*2,15)+Math.pow(Math.abs(v-.5)*2,18);return[x,.009+edge*.003+Math.sin(u*35)*Math.sin(v*25)*.0007,z];},'Complete worn Persian rug with normal-mapped weave');cloth.material.side=T.DoubleSide;cloth.castShadow=false;}
function curledPaper(root,mat,x,y,z,w,d,ry=0,uvRect=[0,0,1,1],curl=.013,name='Curled printed paper'){
 const group=new T.Group();group.position.set(x,y,z);group.rotation.y=ry;root.add(group);const o=surface(group,mat,14,18,(u,v)=>[(u-.5)*w,.002+curl*Math.pow(Math.max(0,(u-.74)/.26),2)*(.3+.7*Math.pow(v,4)),(v-.5)*d],name);const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uvRect[0]+uv.getX(i)*uvRect[2],uvRect[1]+uv.getY(i)*uvRect[3]);return group;
}
function coffeeTable(root,m,old){
 const q=LOUNGE73.table,g=new T.Group();g.name='Walnut lounge table with magazines and ashtray';g.position.set(q.x,0,q.z);g.rotation.y=q.yaw;root.add(g);
 addBox(g,m.walnut,0,.398,0,1.23,.07,.63,'Thick molded coffee table top',.028);addBox(g,m.walnut,0,.312,0,1.07,.14,.46,'Carved table apron',.025);
 for(const x of[-.49,.49])for(const z of[-.217,.217])lathe(g,m.walnut,[[.034,0],[.04,.025],[.026,.105],[.043,.18],[.035,.245],[.046,.35]],x,0,z,'Turned solid wood table leg',20);
 for(const [x,z,w,d,ry,art]of[[-.24,-.10,.242,.322,-.17,'magazine-weekend-away-1994'],[-.17,-.035,.252,.336,.21,'magazine-room-home-1997']]){const pages=addBox(g,old.plastic,x,.442,z,w,.013,d,'Uneven yellowed magazine page block',.004);pages.rotation.y=ry;curledPaper(g,m[art],x,.450,z,w,d,ry,[0,0,1,1],.019,'Generated 1990s magazine curled cover');}
 const bowl=lathe(g,m.glass,[[0,0],[.063,0],[.088,.009],[.10,.027],[.101,.041],[.085,.049],[.078,.037],[.071,.018],[0,.018]],.325,.436,.068,'Heavy pressed glass ashtray',36);
 addPlane(g,m['ashtray-contents'],.325,.455,.068,.181,.181,0,-Math.PI/2,'Generated ash and five cigarette butts');
 for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(g,m.glass,.325+Math.cos(a)*.095,.473,.068+Math.sin(a)*.095,.009,.010,.014,'Faceted ashtray scallop');}
}
function fern(root,m,old){const q=LOUNGE73.fern,g=new T.Group();g.position.set(q.x,0,q.z);g.name='Boston fern in Roman column planter';root.add(g);
 addBox(g,old.stone,0,.055,0,.46,.11,.46,'Roman urn square plinth',.025);lathe(g,old.stone,[[.19,0],[.205,.045],[.165,.10],[.132,.35],[.147,.40],[.186,.46]],0,.11,0,'Roman fluted pedestal',32);
 for(let i=0;i<16;i++){const a=i*Math.PI*2/16;addTube(g,old.stone,[[Math.cos(a)*.15,.23,Math.sin(a)*.15],[Math.cos(a)*.125,.46,Math.sin(a)*.125]],.008,'Pedestal flute edge',5);}
 lathe(g,old.stone,[[.155,0],[.19,.048],[.23,.17],[.282,.262],[.285,.30],[.25,.32],[.233,.288]],0,.56,0,'Thick rolled Roman planter bowl',32);
 const soil=new T.Mesh(new T.CircleGeometry(.239,24),old.dark);soil.rotation.x=-Math.PI/2;soil.position.y=.845;g.add(soil);
 // Each card bends forward; generated joined fronds share a soil-level origin.
 for(let k=0;k<5;k++){const card=surface(g,m.fern,6,10,(u,v)=>{const a=(u-.5)*1.02,up=v*.83,bend=.23*Math.sin(v*Math.PI);return[a,.843+up,bend];},'Generated drooping fern frond card');card.rotation.y=k*Math.PI*.4;card.castShadow=false;}
}
function pigeonholes(root,m){const q=LOUNGE73.cabinet,g=new T.Group();g.position.set(q.x,0,q.z);g.rotation.y=-Math.PI/2;g.name='Carved walnut pigeonhole wall cabinet';root.add(g);const box=(x,y,z,w,h,d,n,r=.009)=>addBox(g,m.walnut,x,y,z,w,h,d,n,r);
 box(0,.162,0,1.79,.324,.32,'Ground-supported walnut cabinet plinth',.018);box(0,1.38,-.145,1.83,2.12,.053,'Solid dark cabinet back');for(const x of[-.899,.899])box(x,1.38,0,.065,2.16,.35,'Carved thick cabinet side',.019);
 for(let row=0;row<=5;row++)box(0,.57+row*.335,.011,1.78,.027,.335,'Pigeonhole rounded shelf lip');
 for(let col=1;col<5;col++)box(-.9+col*.36,1.405,-.004,.023,1.68,.32,'Pigeonhole vertical divider');
 box(0,.397,0,1.91,.15,.39,'Raised cabinet bottom cornice',.025);box(0,2.41,0,1.94,.12,.405,'Carved top crown cornice',.026);box(0,2.485,-.022,1.99,.043,.43,'Overhanging ogee cap',.015);
 for(const side of[-1,1]){for(let k=0;k<10;k++){const y=.60+k*.175;ball(g,m.walnut,side*.896,y,.195,.027,.055,.017,'Carved side acanthus bead');}addTube(g,m.brass,[[side*.884,.45,.185],[side*.884,2.38,.185]],.004,'Old brass cabinet inlay',8);}
 // A few stored envelopes emphasize depth while most cubbies remain empty.
 const paper=m['guest-register-spread'];for(const [col,row]of[[0,1],[2,3],[4,0],[3,2]]){const x=-.72+col*.36,y=.598+row*.335;const p=addBox(g,paper,x,y,-.047,.244,.029,.17,'Small folded guest papers',.003);p.rotation.y=.045*(col-2);}
}
function wallLamp(root,m,p){const g=new T.Group();g.position.set(p.x,1.91,p.z);g.rotation.y=p.yaw;g.name='Aged brass double-arm European wall sconce';root.add(g);
 const plate=lathe(g,m.brass,[[0,0],[.061,0],[.097,.012],[.093,.028],[.042,.043],[0,.05]],0,0,-.19,'Sconce fluted backplate',24);plate.rotation.x=Math.PI/2;
 for(const side of[-1,1]){addTube(g,m.brass,[[0,-.02,-.17],[side*.12,-.09,-.03],[side*.22,-.04,.043],[side*.22,.075,.068]],.015,'Swept cast double candle arm',20);
  lathe(g,m.brass,[[.036,0],[.049,.012],[.044,.025],[.029,.042]],side*.22,.065,.068,'Scalloped brass glass cup',24);
  const diffuser=lathe(g,m.opal,[[.026,0],[.047,.024],[.069,.103],[.062,.18],[.031,.252],[.010,.287],[0,.300]],side*.22,.100,.068,'Thick frosted teardrop glass',28);diffuser.castShadow=false;
  for(const dz of[-.07,.07])addTube(g,m.brass,[[side*.22+dz,.159,.068],[side*.22+dz*.6,.304,.068]],.004,'Shade retaining prong',8);
 }
 for(let k=0;k<3;k++)ball(g,m.brass,0,-.115-k*.040,-.10,.026-k*.006,.036,.022,'Cast brass hanging finial');
}
function tiffany(root,m){const g=new T.Group();g.position.set(0,0,10);g.name='Dusty suspended Tiffany floral glass pendant';root.add(g);
 lathe(g,m.brass,[[0,0],[.14,0],[.126,.035],[.08,.078],[.04,.10]],0,2.96,0,'Ceiling canopy',28);
 for(let i=0;i<7;i++){const link=new T.Mesh(new T.TorusGeometry(.024,.005,6,12),m.brass);link.position.set(0,2.91-i*.034,0);link.scale.y=1.4;link.rotation.y=i%2*Math.PI/2;g.add(link);}
 const shade=surface(g,m.tiffany,80,22,(u,v)=>{const a=u*Math.PI*2,r=.16+.51*Math.sin(v*Math.PI*.52),y=2.70-.36*v;return[Math.cos(a)*r,y,Math.sin(a)*r];},'Continuous stained glass bell shade');const uv=shade.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*4);
 for(let j=0;j<16;j++){const pts=[];for(let k=0;k<=12;k++){const v=k/12,a=j*Math.PI/8,r=.16+.51*Math.sin(v*Math.PI*.52);pts.push([Math.cos(a)*r,2.70-.36*v,Math.sin(a)*r]);}addTube(g,m.brass,pts,.004,'Physical soldered shade meridian',12);}
 lathe(g,m.brass,[[.169,0],[.169,.008],[.145,.031],[.041,.045],[0,.045]],0,2.69,0,'Solid brass crown joining chain to stained glass shade',32);
 for(const [r,y]of[[.164,2.704],[.670,2.34]]){const trim=new T.Mesh(new T.TorusGeometry(r,.009,8,64),m.brass);trim.rotation.x=Math.PI/2;trim.position.y=y;g.add(trim);}
 const bulb=ball(g,m.opal,0,2.385,0,.071,.092,.071,'Warm frosted pendant bulb');bulb.castShadow=false;
 lathe(g,m.brass,[[.014,0],[.033,.026],[.022,.055],[0,.085]],0,2.22,0,'Pendant lower finial',20);
}
function banker(counter,m,old){
 const g=new T.Group();g.position.set(-.78,1.098,-.238);g.name='Green glass bankers desk lamp';counter.add(g);
 const base=lathe(g,m.brass,[[0,0],[.11,0],[.119,.021],[.107,.046],[.069,.06],[.034,.070]],0,0,0,'Heavy oval banker lamp base',32);base.scale.z=.70;
 addTube(g,m.brass,[[0,.068,0],[0,.235,-.026],[0,.308,.022]],.015,'Curved brass lamp neck',18);
 for(const x of[-.176,.176])addTube(g,m.brass,[[0,.252,-.024],[x,.268,-.024],[x,.319,.040]],.008,'Banker shade side pivot support',12);
 surface(g,m.bankGlass,24,18,(u,v)=>{const a=v*Math.PI;return[(u-.5)*.33,.311+Math.sin(a)*.080,.036+Math.cos(a)*.105];},'Continuous green half-cylinder glass shade');
 for(const x of[-.167,.167]){const cap=new T.Mesh(new T.CircleGeometry(.092,24,0,Math.PI),m.bankGlass);cap.rotation.y=Math.PI/2;cap.rotation.z=Math.PI/2;cap.scale.x=1.12;cap.position.set(x,.312,.036);g.add(cap);ball(g,m.brass,x,.314,.036,.012,.012,.012,'Lamp shade pivot screw');}
 const inner=surface(g,m.opal,22,16,(u,v)=>{const a=v*Math.PI;return[(u-.5)*.318,.309+Math.sin(a)*.073,.036+Math.cos(a)*.098];},'Ivory opal shade lining');inner.material.side=T.DoubleSide;inner.castShadow=false;
 addTube(g,old.dark,[[0,.02,-.068],[-.05,.011,-.155],[.20,.011,-.187],[.41,.010,-.187],[.44,-.30,-.18],[.44,-.88,-.18]],.005,'Banker lamp power lead along rear of counter',24);
 for(let i=0;i<10;i++)ball(g,m.brass,.13,.309-i*.010,.115,.0028,.0028,.0028,'Brass pull-chain bead');
 // The existing books are kept elsewhere on the same counter; this register is open.
 addBox(counter,m.walnut,-.50,1.112,.18,.468,.024,.296,'Visitor ledger worn cover',.008);
 for(const side of[-1,1]){const p=surface(counter,m['guest-register-spread'],20,20,(u,v)=>[-.50+side*(.004+u*.225),1.130+.009*Math.exp(-u*8)+.015*Math.pow(u,8)*Math.pow(v,5),.18+(v-.5)*.273],'Open curled guest-register pages');const uv=p.geometry.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i);uv.setX(i,side<0?.5-u*.5:.5+u*.5);}p.material.side=T.DoubleSide;}
 lathe(counter,m.brass,[[0,0],[.087,0],[.091,.013],[.068,.028],[.051,.040],[.036,.074],[0,.084]],-.057,1.098,.226,'Old brass service bell dome',32);
 lathe(counter,m.brass,[[.008,0],[.009,.022],[.023,.025],[.023,.035],[0,.04]],-.057,1.182,.226,'Mechanical bell push button',20);
 counter.updateMatrixWorld(true);return{position:counter.localToWorld(new T.Vector3(-.78,1.36,-.20)),target:counter.localToWorld(new T.Vector3(-.49,1.131,.17)),leadEnd:g.localToWorld(new T.Vector3(.44,-.88,-.18))};
}
export function buildReceptionFurniture73(root,counter,old){const m=receptionMaterials73();sofa(root,m);rug(root,m);coffeeTable(root,m,old);fern(root,m,old);pigeonholes(root,m);WALL_LAMPS73.forEach(p=>wallLamp(root,m,p));tiffany(root,m);const bank=banker(counter,m,old);addBox(root,old.plastic,4.666,.185,10.53,.075,.14,.095,'Banker lamp lower wall outlet');addBox(root,old.dark,4.617,.185,10.53,.031,.055,.044,'Banker lamp inserted mains plug');addTube(root,old.dark,[bank.leadEnd.toArray(),[3.22,.018,9.36],[4.09,.018,9.51],[4.54,.018,10.45],[4.59,.185,10.53]],.005,'Connected banker lead on service-aisle floor',26);return{materials:m,bank};}

export function createReceptionAtmosphere73(scene,bank){
 const lights=[];
 for(const [index,p] of WALL_LAMPS73.entries()){const light=new T.PointLight(0xff9d42,7.0,4.6,2);light.position.set(p.x+Math.sin(p.yaw)*.12,2.12,p.z+Math.cos(p.yaw)*.12);light.castShadow=index===0;light.shadow.mapSize.set(384,384);light.shadow.camera.near=.55;light.shadow.radius=2.5;light.shadow.camera.far=4.6;light.shadow.bias=-.0003;light.shadow.normalBias=.014;light.name='2450K wall sconce practical';scene.add(light);lights.push(light);}
 const area=new T.RectAreaLight(0xffe0b2,9.0,1.35,1.35);area.position.set(0,2.30,10);area.lookAt(0,0,10);area.name='Extended Tiffany diffuser';scene.add(area);
 const spot=new T.SpotLight(0xffdfaa,.75,1.1,.38,.78,2);spot.position.copy(bank.position);spot.target.position.copy(bank.target);spot.castShadow=true;spot.shadow.mapSize.set(256,256);spot.shadow.bias=-.0001;spot.shadow.normalBias=.004;spot.shadow.camera.near=.04;spot.shadow.camera.far=1.1;spot.name='Banker lamp narrow register pool';scene.add(spot,spot.target);lights.push(spot);
 const geo=new T.BufferGeometry(),p=[],seed=[];for(let i=0;i<124;i++){const rand=k=>{const f=Math.sin(i*127.1+k*311.7)*43758.5453;return f-Math.floor(f);};p.push((rand(0)-.5)*2.35,.3+rand(1)*1.92,9.0+rand(2)*2.0);seed.push(rand(3));}geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('aSeed',new T.Float32BufferAttribute(seed,1));const time={value:0};
 const mat=new T.ShaderMaterial({name:'Slow practical-lit dust motes',uniforms:{time},transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'attribute float aSeed;uniform float time;varying float alpha;void main(){vec3 p=position;p.x+=sin(time*.11+aSeed*29.)*.075;p.y+=sin(time*.07+aSeed*17.)*.12;p.z+=cos(time*.09+aSeed*34.)*.045;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(5./max(1.,-v.z),.8,1.8);alpha=.08+.10*aSeed;}',fragmentShader:'varying float alpha;void main(){float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(.12,.50,d))*alpha;gl_FragColor=vec4(.72,.52,.29,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const dust=new T.Points(geo,mat);dust.name='124 fine floating dust motes in pendant light';dust.frustumCulled=false;scene.add(dust);
 return{lights,area,dust,update(t,player){time.value=t;dust.visible=player.z>6.1;},dispose(){geo.dispose();mat.dispose();}};
}
