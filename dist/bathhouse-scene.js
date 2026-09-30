import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bathTextures} from './bath-textures.js?v=61';
import {BATH_POOL,SHOWER_HEADS} from './bathhouse-layout.js?v=61';
import {buildBathRefit} from './bath-v61-interior.js?v=61';
import {foldedTowel,propMesh,propRod} from './bathing-props.js?v=60';
export const BATH_LIGHTS=[{p:[0,2.50,-3.90],color:0xf1f3ec,power:19,range:10},{p:[0,2.65,2],color:0xffedce,power:8,range:6},{p:[-6.4,2.67,-3.6],color:0xe3efe9,power:11,range:8},{p:[-3.0,2.55,-1.2],color:0xe8e6dc,power:3.5,range:5}];
export function bathLabel(text,sub=''){const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');g.fillStyle='#d9dbcd';g.fillRect(0,0,c.width,c.height);g.fillStyle='#294a47';g.textAlign='center';g.font='bold 62px sans-serif';g.fillText(text,384,108,728);g.font='25px sans-serif';g.fillText(sub,384,178,710);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({name:text,map:t,roughness:.8});}
export function createBathhouse(){
 const scene=new T.Scene();scene.name='Level 11 / Baños interior';scene.background=new T.Color(0x080b0a);scene.userData.noAtmosphere=true;
 const root=new T.Group();root.name='Bathhouse architecture and furniture';scene.add(root);const tex=bathTextures(),white=new T.MeshStandardMaterial({name:'Ivory cast columns',color:0xe4e4d8,map:tex['granite-basin'],roughness:.88}),tile=new T.MeshStandardMaterial({name:'Generated 10cm white ceramic',map:tex['ceramic-tile'],roughness:.65}),blue=tile.clone();blue.name='Pale blue empty pool tiles';blue.color.set(0xa3d5d9);blue.roughness=.54;
 const floor=new T.MeshStandardMaterial({name:'Cream stone circulation floor',map:tex['ceramic-tile'],color:0xaaa899,roughness:.67}),wood=new T.MeshStandardMaterial({name:'Reception counter oak',map:tex.wood,color:0x988068,roughness:.75}),metal=new T.MeshStandardMaterial({name:'Chrome shower pipe',color:0xaab7b7,metalness:.58,roughness:.32,emissive:0x293b41,emissiveIntensity:.14}),dark=new T.MeshStandardMaterial({name:'Recesses and drains',color:0x303c3b,roughness:.85}),glass=new T.MeshStandardMaterial({name:'Glazed entrance door',color:0xc0e1d7,roughness:.16,metalness:.27,transparent:true,opacity:.24,side:T.DoubleSide}),lamp=new T.MeshBasicMaterial({color:0xfffbed}),mural=new T.MeshStandardMaterial({name:'Handpainted ocean mural',map:tex['ocean-wall'],roughness:1,color:0xe0e5df,emissiveMap:tex['ocean-wall'],emissive:0xffffff,emissiveIntensity:.045}),palm=mural.clone(),cloud=mural.clone();palm.map=palm.emissiveMap=tex['palm-wall'];cloud.map=cloud.emissiveMap=tex['cloud-ceiling'];cloud.color.set(0xe3e6de);
 function mesh(g,m,x=0,y=0,z=0,name=''){return propMesh(root,g,m,x,y,z,name);}
 function box(m,x,y,z,w,h,d,name=''){const g=new T.BoxGeometry(w,h,d);if([tile,blue,floor].includes(m)){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(f<2?d:w)/1.25,uv.getY(i)*(f===2||f===3?d:h)/1.25);}}return mesh(g,m,x,y,z,name);}
 function plane(m,x,y,z,w,h,ry=0,rx=0){const o=mesh(new T.PlaneGeometry(w,h),m,x,y,z);o.rotation.set(rx,ry,0);return o;}
 function tiledPlane(m,x,y,z,w,h,ry=0,rx=0){const o=plane(m,x,y,z,w,h,ry,rx),uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/1.25,uv.getY(i)*h/1.25);return o;}
 function shape(points){return new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1])));}
 function horizontalShape(points,y,m,holes=[]){const s=shape(points);for(const p of holes)s.holes.push(new T.Path(p.map(q=>new T.Vector2(q[0],-q[1]))));const g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.25,p.getZ(i)/1.25);return mesh(g,m,0,y,0);}
 // Physical empty pool: deck is one surface with a real opening, with no
 // water plane, blue floor at -0.99m and uninterrupted tiled retaining walls.
 horizontalShape([[-4.1,-7.05],[4.1,-7.05],[4.1,0],[-4.1,0]],0,floor,[BATH_POOL]);
 horizontalShape(BATH_POOL,-.99,blue).name='Dry pale blue pool bottom / no water';
 const edges=[];for(let i=0;i<BATH_POOL.length;i++){const a=BATH_POOL[i],b=BATH_POOL[(i+1)%BATH_POOL.length];if(i===0){edges.push([a,[-2.475,-1.58]],[[-1.525,-1.58],b]);}else edges.push([a,b]);}
 for(const [a,b] of edges){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx);const wall=box(tile,(a[0]+b[0])/2,-.51,(a[1]+b[1])/2,len,1.02,.07,'Continuous pool wall');wall.rotation.y=ang;const lip=box(white,(a[0]+b[0])/2,.026,(a[1]+b[1])/2,len+.025,.052,.20,'White pool coping');lip.rotation.y=ang;
  // Drain channels run outside the coping; discrete grilles rest in their beds.
  for(let t=.08;t<len;t+=.085){const x=a[0]+dx*t/len,z=a[1]+dz*t/len;const slot=box(dark,x-dz/len*.18,.008,z+dx/len*.18,.010,.008,.092);slot.rotation.y=ang;}}
 for(let i=0;i<6;i++){const top=-(i+1)*.165;box(tile,-2.0,(top-.99)/2,-1.58-(i+.5)*.22,.95,top+.99+.005,.22,'Dry pool entry step');}
 box(dark,1.62,-.984,-5.62,.17,.008,.17,'Empty pool floor drain');for(let i=0;i<5;i++)box(metal,1.55+i*.035,-.978,-5.62,.008,.009,.15);
 // Back / right walls and divided front; left passage remains genuinely open.
 box(white,0,1.53,-7.08,8.4,3.06,.16);box(white,4.18,1.53,-3.5,.16,3.06,7.2);
 box(white,-4.18,1.53,-4.66,.16,3.06,4.80);box(white,-4.18,1.53,-.31,.16,3.06,.62);box(white,-4.18,2.83,-1.30,.16,.47,1.94);
 for(const x of[-2.50,2.50])box(white,x,1.53,.08,3.36,3.06,.16);
 box(white,0,2.78,.08,1.68,.57,.16);
 plane(mural,0,1.64,-6.985,8.14,2.74);plane(mural,4.09,1.64,-3.5,6.98,2.74,-Math.PI/2);plane(palm,-4.09,1.64,-4.7,4.61,2.74,Math.PI/2);
 plane(cloud,0,3.07,-3.53,8.28,7.12,0,Math.PI/2).name='Painted cloud ceiling / not outdoor sky';
 // Continuous cornices are genuine trim in front of the painted walls.
 for(const [yy,hh,dd]of[[2.77,.09,.22],[2.90,.13,.30],[3.01,.07,.37]]){box(white,0,yy,-6.96,8.2,hh,dd);box(white,4.0,yy,-3.52,dd,hh,7.0);box(white,-4.0,yy,-4.69,dd,hh,4.61);}
 function column(x,z){const g=new T.CylinderGeometry(.18,.21,2.32,60,8),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),r=Math.hypot(p.getX(i),p.getZ(i))*(1-.085*(.5+.5*Math.cos(a*20)));p.setX(i,Math.cos(a)*r);p.setZ(i,Math.sin(a)*r);}g.computeVertexNormals();mesh(g,white,x,1.43,z,'Fluted classical column');
  for(const [r,h,y]of[[.28,.09,.06],[.245,.10,.145],[.214,.075,.232],[.205,.085,2.64],[.266,.11,2.73]])mesh(new T.CylinderGeometry(r,r,h,32),white,x,y,z);
  box(white,x,2.83,z,.61,.11,.52);for(const dx of[-.22,.22]){const o=mesh(new T.TorusGeometry(.066,.023,8,20),white,x+dx,2.70,z+.16);}
 }
 for(const [x,z]of[[-3.62,-2.30],[-3.62,-.48],[-3.64,-4.4],[-3.55,-6.65],[0,-6.74],[3.55,-6.65],[3.65,-3.30],[3.63,-.48]])column(x,z);
 function balustrade(a,b){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=-Math.atan2(b[1]-a[1],b[0]-a[0]);for(const [y,h,d]of[[.16,.17,.24],[.98,.12,.29]]){const o=box(white,(a[0]+b[0])/2,y,(a[1]+b[1])/2,len,h,d);o.rotation.y=ang;}
  const profile=[[.055,0],[.071,.06],[.046,.11],[.034,.23],[.076,.39],[.072,.46],[.036,.61],[.06,.65]].map(p=>new T.Vector2(...p));for(let d=.16;d<len-.10;d+=.27)mesh(new T.LatheGeometry(profile,12),white,a[0]+(b[0]-a[0])*d/len,.245,a[1]+(b[1]-a[1])*d/len,'White baluster');}
 balustrade([-3.62,-6.74],[3.62,-6.74]);balustrade([3.74,-6.64],[3.74,-.42]);balustrade([-3.79,-6.61],[-3.79,-2.51]);
 // Two sculpted urns, as in the reference's fake terrace. No live vegetation.
 for(const x of[-1.75,1.73]){box(white,x,.49,-6.73,.47,.73,.36);mesh(new T.LatheGeometry([[.13,0],[.18,.05],[.13,.12],[.21,.23],[.18,.33],[.20,.35]].map(p=>new T.Vector2(...p)),24),white,x,.92,-6.72,'White terrace urn');}
 const ceilingLamp=mesh(new T.CircleGeometry(.98,64),lamp,0,3.052,-3.9,'Large oval diffused ceiling light');ceilingLamp.rotation.x=Math.PI/2;// Circular diffuser foreshortens naturally from the camera.
 // Low ceiling and squat classical proportions from the two source views.
 for(const o of root.children){if(!o.isMesh)continue;o.updateMatrix();o.geometry.applyMatrix4(o.matrix);const pp=o.geometry.attributes.position;for(let i=0;i<pp.count;i++)if(pp.getY(i)>0)pp.setY(i,pp.getY(i)*.88);o.geometry.computeVertexNormals();o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);}
 const refit=buildBathRefit(scene,root,wood);const {clock,presets,streams}=refit;
 const lights=[];for(const l of BATH_LIGHTS){const o=new T.PointLight(l.color,l.power,l.range,2);o.position.fromArray(l.p);o.castShadow=true;o.shadow.mapSize.set(512,512);o.shadow.bias=-.0007;o.shadow.normalBias=.022;o.shadow.camera.near=.08;o.shadow.camera.far=l.range;scene.add(o);lights.push(o);}scene.add(new T.AmbientLight(0xc1ced0,.84));
 // Static material batching keeps the column flutes and balusters affordable.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;if(!groups.has(o.material))groups.set(o.material,[]);const count=o.isInstancedMesh?o.count:1;for(let i=0;i<count;i++){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),matrix=o.matrixWorld.clone();if(o.isInstancedMesh){const instance=new T.Matrix4();o.getMatrixAt(i,instance);matrix.multiply(instance);}g.applyMatrix4(matrix);groups.get(o.material).push(g);}o.geometry.dispose();});root.clear();for(const [m,parts]of groups){mesh(mergeGeometries(parts),m,0,0,0,m.name);parts.forEach(g=>g.dispose());}
 let active=false;
 function update(t){refit.update(t);lights[2].intensity=BATH_LIGHTS[2].power;}
 function focusDistance(camera,max){const d=new T.Vector3();camera.getWorldDirection(d);for(let t=.25;t<max;t+=.18){const x=camera.position.x+d.x*t,y=camera.position.y+d.y*t,z=camera.position.z+d.z*t;if(y<-.99||y>2.85||z< -7||x>4.1||x< -8.35||z>4.23)return t;}return max;}
 function dispose(){refit.dispose();const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());}
 return{scene,presets,streams,update,beforeRender:refit.beforeRender,focusDistance,dispose,get active(){return active;},set active(v){active=v;}};
}
