import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bathTextures} from './bath-textures.js?v=60';
import {BATH_POOL,SHOWER_HEADS} from './bathhouse-layout.js?v=60';
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
 // Small reception lobby with an open central passage to the empty pool.
 box(floor,0,-.09,2.1,5.2,.18,4.2);for(const x of[-2.6,2.6])box(white,x,1.48,2.1,.16,2.96,4.2);box(white,0,2.97,2.1,5.35,.14,4.4);
 for(const x of[-1.7,1.7])box(white,x,1.48,4.23,1.72,2.96,.16);box(white,0,2.66,4.23,1.68,.60,.16);
 for(const x of[-.81,.81])box(metal,x,1.2,4.15,.048,2.40,.065);box(metal,0,2.41,4.15,1.66,.06,.07);plane(glass,0,1.22,4.15,1.57,2.36,Math.PI);propRod(root,metal,[.57,.92,4.09],[.57,1.40,4.09],.015);
 box(wood,1.22,.48,1.20,1.95,.96,.69,'Reception counter');box(white,1.22,1.0,1.20,2.04,.065,.79);box(dark,1.5,1.07,1.18,.27,.08,.21,'Desk telephone');propRod(root,dark,[1.39,1.13,1.18],[1.64,1.13,1.18],.034);
 plane(bathLabel('BAÑOS','RECEPCIÓN  /  24 HORAS'),2.502,1.95,1.2,1.5,.50,-Math.PI/2);
 for(let i=0;i<12;i++){box(wood,2.48,1.27+(i%3)*.22,.14+Math.floor(i/3)*.21,.04,.16,.17,'Key cabinet');}
 box(white,-1.94,.51,2.72,.53,1.02,.49,'Water dispenser');box(dark,-1.94,.77,2.458,.32,.27,.025);for(const x of[-2.04,-1.85])mesh(new T.CylinderGeometry(.022,.022,.10,12),metal,x,.78,2.41);const jugmat=new T.MeshStandardMaterial({color:0x83bac9,roughness:.22,transparent:true,opacity:.55,metalness:.1});mesh(new T.LatheGeometry([[.08,0],[.09,.1],[.22,.18],[.23,.44],[.18,.55],[0,.57]].map(p=>new T.Vector2(...p)),32),jugmat,-1.94,1.02,2.72,'Translucent water jug');
 for(const z of[.55,1.30]){box(wood,-2.08,.47,z,.61,.075,.56);box(wood,-2.35,.82,z,.065,.66,.56);for(const xx of[-2.30,-1.86])for(const zz of[z-.22,z+.22])propRod(root,metal,[xx,0,zz],[xx,.44,zz],.023);}
 foldedTowel(root,tex['towel-ivory'],.63,1.04,1.18,.45,.32);plane(bathLabel('DUCHAS','←  SHOWERS'),-1.74,1.67,-.012,1.15,.38);
 box(lamp,0,2.88,2.0,1.25,.045,.24);
 // Left passage and a real four-stall shower room. All wet equipment is
 // anchored to walls / floor; the aisle stays over 1.2m wide.
 box(floor,-6.24,-.09,-3.74,4.28,.18,6.30);box(tile,-8.38,1.48,-3.74,.16,2.96,6.30);box(tile,-6.24,1.48,-6.89,4.3,2.96,.16);box(tile,-6.24,1.48,-.59,4.3,2.96,.16);box(white,-6.24,2.98,-3.74,4.4,.16,6.5);box(floor,-4.10,-.09,-1.38,.40,.18,1.58);
 plane(bathLabel('AGUA CALIENTE','I  WARM   /   II  MAX HOT'),-4.277,1.83,-3.38,1.43,.50,-Math.PI/2);
 const streams=[];const clock={value:0};const waterMat=new T.ShaderMaterial({name:'Individual refractive shower strands',transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock,flow:{value:tex['impact-spray']}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'precision highp float;varying vec2 vUv;uniform float clock;uniform sampler2D flow;void main(){float wave=.5+.5*sin(vUv.y*110.-clock*29.+vUv.x*9.);float glint=pow(wave,12.);float line=.26+.46*glint;gl_FragColor=vec4(mix(vec3(.39,.59,.61),vec3(.92,.98,.96),glint),line);}' });
 const splashMat=new T.MeshBasicMaterial({map:tex['foam-ripple'],transparent:true,opacity:.24,depthWrite:false});
 const porcelain=new T.MeshStandardMaterial({name:'Ivory perforated shower face',map:tex['ceramic-tile'],color:0xdddcd0,roughness:.55});
 const puddleMat=new T.ShaderMaterial({name:'Thin spreading shower puddles / ripples and ceiling highlights',transparent:true,depthWrite:false,uniforms:{clock,ripple:{value:tex['foam-ripple']}},vertexShader:'varying vec2 vUv;varying vec3 wp;void main(){vUv=uv;wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}',fragmentShader:`precision highp float;varying vec2 vUv;varying vec3 wp;uniform float clock;void main(){vec2 p=vUv-.5;float r=length(p*vec2(1.,1.16));float edge=1.-smoothstep(.34+.025*sin(atan(p.y,p.x)*7.),.49,r);float rings=pow(.5+.5*sin(r*100.-clock*10.),12.)*exp(-r*5.);float reflection=pow(max(0.,1.-abs(p.x*2.+.10*sin(p.y*40.-clock*3.))),14.);gl_FragColor=vec4(vec3(.29,.36,.36)+rings*.30+reflection*.20,edge*(.13+reflection*.27+rings*.10));}`});
 SHOWER_HEADS.forEach((p,i)=>{
  // Handheld bell-shaped chrome head held in a wall bracket, angled down into the stall.
  const head=new T.Group();head.position.set(-8.03,2.16,p.z);const axis=new T.Vector3(.57,-.82,0);head.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);root.add(head);
  propMesh(head,new T.LatheGeometry([[.031,-.19],[.040,-.12],[.066,-.04],[.107,.025],[.112,.058],[.103,.071]].map(q=>new T.Vector2(...q)),32),metal,0,0,0,'Chrome bell showerhead');
  const face=propMesh(head,new T.CircleGeometry(.097,32),porcelain,0,.073,0,'White perforated shower disc');face.rotation.x=-Math.PI/2;
  for(let k=0;k<61;k++){const a=k*2.399,r=.088*Math.sqrt(k/61);const hole=propMesh(head,new T.CircleGeometry(.0031,5),dark,Math.cos(a)*r,.074,Math.sin(a)*r);hole.rotation.x=-Math.PI/2;}
  propRod(root,metal,[-8.27,2.20,p.z],[-8.11,2.20,p.z],.036);box(metal,-8.27,2.20,p.z,.05,.14,.13,'Wall bracket backplate');
  const hoseCurve=new T.CatmullRomCurve3([new T.Vector3(-8.16,2.29,p.z),new T.Vector3(-8.05,1.93,p.z+.17),new T.Vector3(-8.00,.71,p.z+.27),new T.Vector3(-8.23,.61,p.z+.18),new T.Vector3(-8.25,1.02,p.z)]);
  const hg=new T.TubeGeometry(hoseCurve,100,.018,7,false),hp=hg.attributes.position;for(let j=0;j<=100;j++){const center=hoseCurve.getPointAt(j/100),r=(j%2?1:.82);for(let k=0;k<=7;k++){const n=j*8+k;hp.setXYZ(n,center.x+(hp.getX(n)-center.x)*r,center.y+(hp.getY(n)-center.y)*r,center.z+(hp.getZ(n)-center.z)*r);}}hg.computeVertexNormals();mesh(hg,metal,0,0,0,'Flexible corrugated metal hose');
  mesh(new T.CylinderGeometry(.063,.063,.07,16),metal,-8.20,1.05,p.z).rotation.z=Math.PI/2;propRod(root,metal,[-8.14,1.05,p.z-.09],[-8.14,1.05,p.z+.09],.014);
  box(dark,p.x,.009,p.z,.20,.016,.20,'Shower floor drain');for(let k=0;k<6;k++)box(metal,p.x-.087+k*.035,.020,p.z,.012,.008,.195);
  box(floor,-8.10,1.18,p.z+.43,.42,.07,.39,'Wall-supported corner soap shelf');
  for(const [dz,color,height]of[[.34,0x305b59,.20],[.49,0x789dad,.25]]){const bottleMat=new T.MeshStandardMaterial({map:tex['towel-ivory'],color,roughness:.64});mesh(new T.CylinderGeometry(.039,.044,height,10),bottleMat,-8.03,1.215+height/2,p.z+dz);box(dark,-8.03,1.22+height,p.z+dz,.045,.035,.045);}
  if(i<3)box(tile,-7.47,.84,p.z-.725,1.66,1.68,.08,'Wall-attached shower stall divider');
  const jets=new T.Group();jets.name='Angled flowing shower '+(i+1);scene.add(jets);const pieces=[];
  for(let k=0;k<61;k++){const a=k*2.399,r=.091*Math.sqrt(k/61),start=new T.Vector3(-7.988+Math.cos(a)*r*.82,2.098+Math.cos(a)*r*.57,p.z+Math.sin(a)*r),end=new T.Vector3(p.x+Math.cos(a)*r*3.0,.028,p.z+Math.sin(a)*r*3.0);const mid=start.clone().lerp(end,.5);mid.y+=.20;const path=new T.QuadraticBezierCurve3(start,mid,end);pieces.push(new T.TubeGeometry(path,16,.0020+(k%4)*.00042,3,false));}
  const j=new T.Mesh(mergeGeometries(pieces),waterMat);pieces.forEach(p=>p.dispose());jets.add(j);
  const spl=new T.Mesh(new T.PlaneGeometry(.69,.65),splashMat);spl.rotation.x=-Math.PI/2;spl.position.set(p.x,.025,p.z);jets.add(spl);
  const puddle=new T.Mesh(new T.PlaneGeometry(1.38,1.23,1,1),puddleMat);puddle.rotation.x=-Math.PI/2;puddle.position.set(p.x+.12,.013,p.z);jets.add(puddle);
  jets.visible=false;streams.push(jets);
 });
 for(const z of[-2.0,-5.2]){box(lamp,-6.25,2.85,z,1.2,.05,.18);propRod(root,metal,[-4.40,1.7,z],[-4.60,1.7,z],.014);}
 foldedTowel(root,tex['towel-turquoise'],-4.69,.07,-6.44,.53,.37,.12);
 const lights=[];for(const l of BATH_LIGHTS){const o=new T.PointLight(l.color,l.power,l.range,2);o.position.fromArray(l.p);o.castShadow=true;o.shadow.mapSize.set(512,512);o.shadow.bias=-.0007;o.shadow.normalBias=.022;o.shadow.camera.near=.08;o.shadow.camera.far=l.range;scene.add(o);lights.push(o);}scene.add(new T.AmbientLight(0xc1ced0,.84));
 // Static material batching keeps the column flutes and balusters affordable.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);o.geometry.dispose();});root.clear();for(const [m,parts]of groups){mesh(mergeGeometries(parts),m,0,0,0,m.name);parts.forEach(g=>g.dispose());}
 const ray=new T.Raycaster();const presets=[0,0,0,0];let active=false;
 function update(t){clock.value=t;streams.forEach((s,i)=>s.visible=presets[i]>0);lights[2].intensity=BATH_LIGHTS[2].power;}
 function focusDistance(camera,max){const d=new T.Vector3();camera.getWorldDirection(d);for(let t=.25;t<max;t+=.18){const x=camera.position.x+d.x*t,y=camera.position.y+d.y*t,z=camera.position.z+d.z*t;if(y<-.99||y>2.85||z< -7||x>4.1||x< -8.35||z>4.23)return t;}return max;}
 function dispose(){const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());}
 return{scene,presets,streams,update,focusDistance,dispose,get active(){return active;},set active(v){active=v;}};
}
