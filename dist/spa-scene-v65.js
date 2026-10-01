import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bevelBox,worldUV} from './bath-v61-materials.js?v=61';
import {spaMaterials,spaTextures} from './spa-materials-v65.js';
import {SPA,SPA_ENTRY} from './spa-layout-v65.js';
import {springTextures} from './level27-materials.js?v=63';
import {createSpaWater} from './spa-water-v65.js';
import {createSpaBloom} from './spa-bloom-v65.js';
import {createSpaStatues} from './spa-statues-v65.js';
export const SPA_LIGHTS=[{p:[7.65,2.93,-3.0],color:0xbde8ef,power:13,range:9},{p:[10.7,2.93,-5.45],color:0xb7ebf1,power:9,range:8}];

function ringGeometry(inner,outer,y0,y1,segments=144){
 const p=[],uv=[],idx=[];
 for(let j=0;j<4;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=j<2?inner:outer,y=j%2?y1:y0;p.push(SPA.cx+Math.cos(a)*r,y,SPA.cz+Math.sin(a)*r);uv.push(a*r*3.2,(y+Math.abs(r-inner))*3.2);}
 for(const [l,k]of[[0,1],[1,3],[3,2],[2,0]])for(let i=0;i<segments;i++){const a=l*(segments+1)+i,b=k*(segments+1)+i;idx.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function roundedCoping(){const p=[],uv=[],idx=[],n=144,cross=[[2.30,-.075],[2.30,.003],[2.32,.035],[2.48,.035],[2.52,.005],[2.52,-.05]];for(let j=0;j<cross.length;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,[r,y]=cross[j];p.push(SPA.cx+Math.cos(a)*r,y,SPA.cz+Math.sin(a)*r);uv.push(a*r*3.2,j*.064);}for(let j=0;j<cross.length-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}

export function createSpa(scene){
 const architecture=new T.Group();architecture.name='Right-hand Venetian spa / physical connected room';scene.add(architecture);const m=spaMaterials(),textures=spaTextures();
 const add=(g,mat,name)=>{const o=new T.Mesh(g,mat);o.name=name;o.castShadow=o.receiveShadow=true;architecture.add(o);return o;};
 const box=(mat,x,y,z,w,h,d,name,r=.018)=>{const g=bevelBox(w,h,d,r);worldUV(g,mat===m.mosaic?1/3.2:1);const o=add(g,mat,name);o.position.set(x,y,z);return o;};
 const wallPlane=(mat,x,y,z,w,h,ry=0,name='Normal-mapped wall face')=>{const g=new T.PlaneGeometry(w,h);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w,uv.getY(i)*h);const o=add(g,mat,name);o.position.set(x,y,z);o.rotation.y=ry;return o;};
 // Deck is a single triangulated surface with a circular aperture for the
 // pool AND drain bed. No land or floating plane crosses the water surface.
 const shape=new T.Shape();shape.moveTo(SPA.x0,-SPA.z0);shape.lineTo(SPA.x1,-SPA.z0);shape.lineTo(SPA.x1,-SPA.z1);shape.lineTo(SPA.x0,-SPA.z1);shape.closePath();const aperture=new T.Path();aperture.absarc(SPA.cx,-SPA.cz,2.76,0,Math.PI*2,true);shape.holes.push(aperture);const deck=new T.ShapeGeometry(shape,144);deck.rotateX(-Math.PI/2);worldUV(deck,1);add(deck,m.wall,'One-piece spa deck around true recessed pool');
 const base=new T.CircleGeometry(2.321,144);base.rotateX(-Math.PI/2);base.translate(SPA.cx,SPA.bottomY,SPA.cz);worldUV(base,1/3.2);add(base,m.mosaic,'Sunken blue mosaic pool bottom');
 const bowl=new T.LatheGeometry([[2.25,-.99],[2.28,-.985],[2.303,-.965],[2.317,-.940],[2.32,-.91],[2.32,.002]].map(q=>new T.Vector2(...q)),144);const bi=bowl.index;for(let i=0;i<bi.count;i+=3){const b=bi.getX(i+1);bi.setX(i+1,bi.getX(i+2));bi.setX(i+2,b);}bowl.computeVertexNormals();const bu=bowl.attributes.uv,bp=bowl.attributes.position;for(let i=0;i<bu.count;i++)bu.setXY(i,bu.getX(i)*Math.PI*2*2.32*3.2,(bp.getY(i)+.99)*3.2);bowl.translate(SPA.cx,0,SPA.cz);add(bowl,m.mosaic,'Coved continuous blue mosaic retaining shell');add(roundedCoping(),m.mosaic,'Rolled blue mosaic pool coping');
 add(ringGeometry(2.51,2.76,-.065,-.051),m.dark,'Recessed drainage channel in deck aperture');
 for(let i=0;i<252;i++){const a=i/252*Math.PI*2,r=2.64;const bar=box(m.marble,SPA.cx+Math.cos(a)*r,.004,SPA.cz+Math.sin(a)*r,.014,.021,.21,'Grounded radial drain grille',.004);bar.rotation.y=-a+Math.PI/2;}
 for(const z of[-2.60,-.70])box(m.sandstone,4.25,1.13,z,.25,2.26,.075,'Beveled physical doorway reveal');box(m.sandstone,4.25,2.275,-1.65,.25,.095,1.975,'Rounded physical doorway header');
 // Six radial inset steps share the same projection and heights as collision.
 const c=Math.cos(SPA_ENTRY.angle),s=Math.sin(SPA_ENTRY.angle);for(let i=0;i<6;i++){const r=SPA_ENTRY.start-(i+.5)*SPA_ENTRY.tread,top=-(i+1)*SPA_ENTRY.rise,step=box(m.mosaic,SPA.cx+c*r,(top+SPA.bottomY)/2,SPA.cz+s*r,SPA_ENTRY.tread+.006,top-SPA.bottomY+.012,SPA_ENTRY.width,'Submerged curved-entry mosaic step '+(i+1),.014);step.rotation.y=-SPA_ENTRY.angle;}
 // Chrome tubes include curved grip, under-water return, flanged deck anchors
 // and bolt heads; all ends terminate in the coping or a physical stair.
 for(const across of[-.57,.57]){const pts=[[2.68,.015],[2.68,.68],[2.57,.92],[2.37,1.01],[2.11,.88],[1.56,.38],[1.19,-.94]].map(([r,y])=>new T.Vector3(SPA.cx+c*r-s*across,y,SPA.cz+s*r+c*across));const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.028,12,false);add(tube,m.chrome,'Polished curved chrome pool handrail');for(const [r,y]of[[2.68,.019],[1.19,-.978]]){const x=SPA.cx+c*r-s*across,z=SPA.cz+s*r+c*across,o=add(new T.CylinderGeometry(.075,.075,.025,32),m.chrome,'Seated steel handrail flange');o.position.set(x,y,z);for(let j=0;j<4;j++){const a=j*Math.PI/2,bolt=add(new T.CylinderGeometry(.008,.009,.012,6),m.chrome,'Physical anchor bolt');bolt.position.set(x+Math.cos(a)*.054,y+.019,z+Math.sin(a)*.054);}}}
 // Plain tiled wall replaces the reference mirror; top belt is actual ceramic.
 box(m.wall,12.33,1.60,-3.65,.16,3.20,8.60,'Plain ivory east wall replacing mirror');box(m.wall,8.19,1.60,.73,8.30,3.20,.16,'Ivory front wall');
 box(m.stone,8.19,1.60,-8.03,8.30,3.20,.16,'Brown stone rear wall');
 // The west wall is the old pool-room wall. Only its new doorway is open.
 for(const [z,d]of[[-5.275,5.35],[-.025,1.35]])box(m.wall,4.295,1.60,z,.06,3.20,d,'Spa side of shared wall beside portal');box(m.wall,4.295,2.755,-1.65,.06,.89,1.9,'Continuous portal lintel');
 for(const [x,z,w,d]of[[12.22,-3.65,.055,8.54],[8.2,.595,8.04,.055],[8.20,-7.895,8.04,.055]]){box(m.navy,x,2.79,z,w,.24,d,'Navy ceramic upper wall belt',.008);box(m.marble,x,2.925,z,w+.018,.026,d+.018,'Rounded upper belt fillet',.006);}
 for(const [z,d]of[[-5.275,5.35],[-.025,1.35]])box(m.marble,4.28,.057,z,.065,.11,d,'Coved portal wall skirting');box(m.marble,12.20,.06,-3.65,.11,.12,8.57,'Coved ivory wall skirting');
 // Closed ceiling, recessed coffers and cyan lamps. The lamps illuminate the
 // room, with no disconnected luminous cards in front of a wall.
 box(m.ceiling,8.20,3.28,-3.65,8.36,.16,8.77,'Closed spa ceiling slab');for(const [x,z,w,d]of[[7.20,-2.30,3.7,2.25],[10.62,-5.47,2.00,3.2]]){for(const [xx,zz,ww,dd]of[[x-w/2,z,.13,d],[x+w/2,z,.13,d],[x,z-d/2,w,.13],[x,z+d/2,w,.13]])box(m.marble,xx,3.08,zz,ww,.18,dd,'Coffered ceiling rim',.028);box(m.ceiling,x,3.184,z,w-.15,.028,d-.15,'Physical recessed coffer ceiling inset',.006);for(const [xx,zz,ww,dd]of[[x-w/2+.15,z,.033,d-.28],[x+w/2-.15,z,.033,d-.28],[x,z-d/2+.15,w-.28,.033],[x,z+d/2-.15,w-.28,.033]])box(m.glow,xx,3.143,zz,ww,.025,dd,'Hidden cyan lighting inside coffer groove',.006);}
 // Sculpted artificial limestone terrace: one grounded core, covered with
 // individually irregular blocks, seated tightly into the wall and each other.
 const rockMat=m.sandstone.clone();rockMat.name='Spa / wet rough sculpted limestone';rockMat.vertexColors=true;rockMat.roughness=.59;
 function sculptRock(x,y,z,rx,ry,rz,seed,name){const g=new T.SphereGeometry(1,36,24),p=g.attributes.position,colors=[];for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),q=p.getZ(i),n=1+.08*Math.sin(a*13+b*4+seed)*Math.cos(q*10-b*9)+.028*Math.sin(q*27+a*11+seed);p.setXYZ(i,a*rx*n,b*ry*n,q*rz*n);const wet=.10+.05*(.5+.5*Math.sin(seed+q*3));colors.push(1-wet,1-wet*.83,1-wet*.66);}g.computeVertexNormals();worldUV(g,.75);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const o=add(g,rockMat,name);o.position.set(x,y,z);return o;}
 sculptRock(6.45,.49,-6.15,1.49,.60,1.06,2,'Ground-rooted continuous artificial rock terrace');
 for(let i=0;i<19;i++){const a=i*2.399,rx=.28+.14*(.5+.5*Math.sin(i*3.3)),rz=.32+.16*(.5+.5*Math.cos(i*2.7)),x=6.39+Math.cos(a)*(i<11?1.1:.71),z=-6.07+Math.sin(a)*(i<11?.84:.59),y=i<11?.42:.86;sculptRock(x,y,z,rx,.37,rz,i+3,'Rough interlocked sandstone ledge block');}
 // Two flattened geological seats physically support the sculptures.
 const seats=[[6.29,1.075,-5.42,.45,.16,.48],[7.29,1.075,-5.87,.45,.16,.45]];for(const [x,y,z,rx,ry,rz]of seats)sculptRock(x,y,z,rx,ry,rz,20+x,'Sculpture support carved into rock terrace');
 sculptRock(7.07,.85,-5.01,.60,.26,.30,33,'Embedded limestone spillway supporting acrylic lip');
 box(m.acrylic,7.10,1.065,-4.90,1.10,.048,.36,'Translucent cyan acrylic waterfall lip',.015);for(const x of[6.53,7.67])box(m.acrylic,x,1.10,-4.91,.035,.095,.36,'Physical acrylic outlet cheek',.007);box(m.dark,7.1,1.041,-4.91,1.06,.018,.29,'Wet dark spillway bed');
 // Roman arch is built from beveled physical voussoirs and substantial jambs.
 const ax=9.45,az=-7.31,inner=1.38,outer=1.67,spring=1.29;
 for(const x of[ax-inner-.145,ax+inner+.145]){for(let i=0;i<5;i++)box(m.sandstone,x,(i+.5)*.245,az,.29,.236,.40,'Chamfered sandstone arch pier block',.018);box(m.sandstone,x,.054,az,.44,.106,.52,'Roman pier plinth');box(m.sandstone,x,1.245,az,.48,.15,.48,'Moulded arch impost',.019);}
 for(let i=0;i<19;i++){const a=i/19*Math.PI+.004,b=(i+1)/19*Math.PI-.004,sh=new T.Shape();sh.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);for(let j=1;j<=5;j++){const q=a+(b-a)*j/5;sh.lineTo(Math.cos(q)*inner,Math.sin(q)*inner);}sh.lineTo(Math.cos(b)*outer,Math.sin(b)*outer);for(let j=1;j<=5;j++){const q=b-(b-a)*j/5;sh.lineTo(Math.cos(q)*outer,Math.sin(q)*outer);}sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:.37,steps:1,bevelEnabled:true,bevelThickness:.014,bevelSize:.012,bevelSegments:2,curveSegments:4});worldUV(g,.73);const o=add(g,m.sandstone,'Individual Roman arch voussoir '+(i+1));o.position.set(ax,spring,az-.18);}
 // Architectural backing fills the rectangle outside the aperture. The mural
 // is an arch-shaped, seamless flat print; no rendered mirror or fake cutout.
 const surround=new T.Shape();surround.moveTo(-2.1,0);surround.lineTo(2.1,0);surround.lineTo(2.1,3.12);surround.lineTo(-2.1,3.12);surround.closePath();const hole=new T.Path();hole.moveTo(-inner,0);hole.lineTo(-inner,spring);for(let i=0;i<=64;i++){const a=Math.PI-Math.PI*i/64;hole.lineTo(Math.cos(a)*inner,spring+Math.sin(a)*inner);}hole.lineTo(inner,0);hole.closePath();surround.holes.push(hole);const sg=new T.ExtrudeGeometry(surround,{depth:.14,bevelEnabled:false});worldUV(sg,.82);const backing=add(sg,m.stone,'Stone arch wall with physical open aperture');backing.position.set(ax,0,az+.012);
 const painting=new T.Shape();painting.moveTo(-inner-.015,0);painting.lineTo(-inner-.015,spring);for(let i=0;i<=96;i++){const a=Math.PI-Math.PI*i/96;painting.lineTo(Math.cos(a)*(inner+.015),spring+Math.sin(a)*(inner+.015));}painting.lineTo(inner+.015,0);painting.closePath();const mg=new T.ShapeGeometry(painting,96),mp=mg.attributes.position,mu=mg.attributes.uv;for(let i=0;i<mp.count;i++)mu.setXY(i,(mp.getX(i)+inner)/(2*inner),mp.getY(i)/(spring+inner));const mural=add(mg,m.mural,'Generated Venice perspective mural inside Roman arch');mural.position.set(ax,0,az-.17);mural.castShadow=false;
 // Soft carved pilaster outside the arch mimics the reference right support.
 box(m.sandstone,11.25,1.25,-7.16,.34,2.5,.35,'Solid classical side pilaster',.022);for(const y of[.06,1.31,2.55])box(m.sandstone,11.25,y,-7.16,.50,.10,.48,'Pilaster moulding',.022);
 const statues=createSpaStatues(T,{textures:{marble:textures['spa-marble'],marbleNormal:textures['spa-marble-normal'],marbleRoughness:textures['spa-marble-roughness']}});statues.group.position.set(6.29,1.18,-5.42);scene.add(statues.group);
 const water=createSpaWater(T,{textures:springTextures(),poolCenter:[SPA.cx,SPA.cz],radius:SPA.radius,waterY:SPA.waterY,bottomY:SPA.bottomY,outlet:[7.1,1.06,-4.85],outletWidth:1.02,impact:[7.5,-.14,-4.10]});scene.add(water.group);water.group.traverse(o=>o.layers.set(3));
 const bloom=createSpaBloom(T,{strength:.28,threshold:1.05});
 const lights=SPA_LIGHTS.map((l,i)=>{const o=new T.PointLight(l.color,l.power,l.range,2);o.position.fromArray(l.p);o.castShadow=i===0;o.shadow.mapSize.set(512,512);o.shadow.bias=-.0008;o.shadow.normalBias=.02;scene.add(o);return o;});
 const portalBounds=new T.Box3(new T.Vector3(3.99,0,-2.60),new T.Vector3(4.40,2.28,-.70)),viewFrustum=new T.Frustum(),viewMatrix=new T.Matrix4();
 // Merge only local static material batches, keeping old bath and this room
 // independently cullable. No hundreds of individual stone/drain draw calls.
 architecture.updateMatrixWorld(true);const batches=new Map();for(const o of [...architecture.children]){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);o.geometry.dispose();}architecture.clear();for(const [mat,parts]of batches){add(mergeGeometries(parts),mat,mat.name+' / static spa batch');parts.forEach(g=>g.dispose());}
 let time=0,last=0,visible=false,environment=null,environmentReady=false;const stats={visible:false,staticDraws:batches.size,water:water.stats};
 function update(t){const dt=Math.min(.05,Math.max(0,t-last));last=t;time=t;if(visible)water.update(t,dt);}
 function prepare(renderer,camera){const next=camera.position.x>3.15;if(next!==visible)renderer.shadowMap.needsUpdate=true;visible=next;stats.visible=visible;architecture.visible=visible;const old=scene.getObjectByName('Bathhouse architecture and furniture');if(old){viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));old.visible=camera.position.x<4.55||viewFrustum.intersectsBox(portalBounds);}statues.group.visible=visible;water.group.visible=visible;if(visible)water.prepare(renderer);if(visible&&!environmentReady){environmentReady=true;environment=new T.WebGLCubeRenderTarget(128,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});const cube=new T.CubeCamera(.08,16,environment);cube.position.set(8.9,1.2,-3.05);const saved=renderer.getRenderTarget(),oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate;try{renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;cube.update(renderer,scene);for(const mat of[m.chrome,m.acrylic,...Object.values(statues.materials)]){mat.envMap=environment.texture;mat.envMapIntensity=.95;mat.needsUpdate=true;}}finally{renderer.setRenderTarget(saved);renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;}}}
 function compose(renderer,color,depth,camera,w,h){return visible?bloom.compose(renderer,color,depth,camera,w,h,time):color;}
 function dispose(){environment?.dispose();water.dispose();bloom.dispose();statues.group.traverse(o=>o.geometry?.dispose());architecture.traverse(o=>o.geometry?.dispose());for(const material of new Set([...Object.values(m),rockMat,...Object.values(statues.materials||{})]))material.dispose();}
 return {group:architecture,statues,water,bloom,lights,stats,update,prepare,compose,dispose};
}
