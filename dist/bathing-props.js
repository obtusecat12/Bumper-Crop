import * as T from './vendor/three.module.min.js';
const up=new T.Vector3(0,1,0);
export function propMesh(root,g,m,x=0,y=0,z=0,name=''){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
export function propRod(root,m,a,b,r=.018){const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),o=propMesh(root,new T.CylinderGeometry(r,r,d.length(),10),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(up,d.normalize());return o;}
export function foldedTowel(root,texture,x,y,z,w=.42,d=.32,angle=0){const m=new T.MeshStandardMaterial({name:'Generated cotton terrycloth',map:texture,roughness:1,side:T.DoubleSide});const group=new T.Group();group.position.set(x,y,z);group.rotation.y=angle;root.add(group);
 const g=new T.PlaneGeometry(w,d,22,16),p=g.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getY(i);p.setXYZ(i,xx,.048+.006*Math.sin(xx*39+zz*7)+.004*Math.cos(zz*48),zz);}g.computeVertexNormals();propMesh(group,g,m);
 for(let j=0;j<3;j++)propMesh(group,new T.BoxGeometry(w,.011,d*.98),m,0,.013+j*.010,0,'Soft folded towel edge');return group;}
export function woodenBucket(root,tex,metal,x,y,z,scale=1){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);root.add(g);const wood=new T.MeshStandardMaterial({name:'Wooden bucket staves',map:tex,roughness:.85});
 const profile=[[.0,0],[.17,0],[.215,.31],[.198,.325],[.179,.043],[.0,.043]].map(p=>new T.Vector2(...p));propMesh(g,new T.LatheGeometry(profile,24),wood);
 for(const yy of[.07,.255]){const r=.17+yy*.145;const ring=propMesh(g,new T.TorusGeometry(r,.011,5,28),metal,0,yy,0);ring.rotation.x=Math.PI/2;}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;propRod(g,metal,[Math.cos(a)*.174,.027,Math.sin(a)*.174],[Math.cos(a)*.212,.305,Math.sin(a)*.212],.0019);}
 const handle=propMesh(g,new T.TorusGeometry(.212,.009,5,24,Math.PI),metal,0,.285,0);handle.rotation.z=0;return g;}
export function addWashStation(root,mats,tex,{x,y,z}){
 const marble=new T.MeshStandardMaterial({name:'PS2 carved marble / pale veins',map:tex['granite-basin'],bumpMap:tex['granite-basin'],bumpScale:.0018,color:0xd4d2c8,roughness:.76});
 // Reference 5: 1.38m wide, 1.02m tall, open shallow bowl, fluted foot, square plinth.
 propMesh(root,new T.BoxGeometry(.65,.12,.65),marble,x,y+.06,z,'Square marble plinth, grounded on dry rock');
 const profile=[[0,.12],[.30,.12],[.31,.17],[.265,.21],[.23,.25],[.17,.34],[.155,.45],[.19,.51],[.26,.55],[.27,.58],[.24,.61],[.34,.63],[.48,.68],[.61,.77],[.675,.86],[.69,.94],[.684,.98],[.65,1.01],[.62,.975],[.62,.925],[.56,.83],[.42,.75],[.24,.705],[0,.705]].map(p=>new T.Vector2(...p));
 const geo=new T.LatheGeometry(profile,96),pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){const yy=pos.getY(i),a=Math.atan2(pos.getZ(i),pos.getX(i)),r=Math.hypot(pos.getX(i),pos.getZ(i));let flute=0;if(yy>.25&&yy<.50)flute=.012*(.5+.5*Math.cos(a*24));if(yy>.64&&yy<.87)flute=.014*(.5+.5*Math.cos(a*32))*Math.sin((yy-.64)/.23*Math.PI);pos.setX(i,Math.cos(a)*(r-flute));pos.setZ(i,Math.sin(a)*(r-flute));}geo.computeVertexNormals();
 const base=propMesh(root,geo,marble,x,y,z,'Broad shallow gadrooned basin / fluted pedestal');
 for(const [r,yy]of[[.685,.947],[.256,.582]])for(let i=0;i<(r>.5?48:24);i++){const a=i/(r>.5?48:24)*Math.PI*2;const bead=propMesh(root,new T.SphereGeometry(r>.5?.025:.019,6,5),marble,x+Math.cos(a)*r,y+yy,z+Math.sin(a)*r);bead.scale.y=1.12;}
 const water=new T.MeshStandardMaterial({name:'Thin rinse water below carved interior rim',color:0x738982,roughness:.22,metalness:.1,transparent:true,opacity:.35});const surface=propMesh(root,new T.CircleGeometry(.44,48),water,x,y+.773,z);surface.rotation.x=-Math.PI/2;
 const wood=new T.MeshStandardMaterial({name:'Used wooden ladle and towel stool',map:tex.wood,color:0xa99981,roughness:.92});
 const cup=propMesh(root,new T.LatheGeometry([[0,0],[.071,.015],[.079,.058],[.068,.068],[.061,.022],[0,.015]].map(p=>new T.Vector2(...p)),20),wood,x-.18,y+.94,z+.1,'Wooden washing ladle');
 propRod(root,wood,[x-.16,y+.983,z+.1],[x+.40,y+1.01,z+.20],.014);
 woodenBucket(root,tex.wood,mats.metal,4.75,y,-1.05,1.06);
 const sx=3.45,sz=1.95;propMesh(root,new T.BoxGeometry(.65,.07,.43),wood,sx,y+.43,sz,'Worn stool on dry floor');
 for(const dx of[-.24,.24])for(const dz of[-.15,.15])propRod(root,wood,[sx+dx,y,sz+dz],[sx+dx*.92,y+.40,sz+dz*.9],.032);
 foldedTowel(root,tex['towel-ivory'],sx-.04,y+.47,sz,.48,.35,-.07);foldedTowel(root,tex['towel-turquoise'],sx+.02,y+.518,sz+.01,.43,.30,.04);
 // One casually draped towel hangs over a grounded stool edge.
 const cloth=new T.MeshStandardMaterial({map:tex['towel-ivory'],color:0xd1c7b3,roughness:1,side:T.DoubleSide}),g=new T.PlaneGeometry(.26,.42,12,18),pp=g.attributes.position;
 for(let i=0;i<pp.count;i++){const xx=pp.getX(i),v=(pp.getY(i)+.21)/.42;pp.setXYZ(i,xx,y+.46-v*.35,sz+.21+.015*Math.sin(v*12+xx*30));}g.computeVertexNormals();propMesh(root,g,cloth,sx-.14,0,0,'Soft towel over stool edge');
 return base;
}
