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
 const marble=new T.MeshStandardMaterial({name:'Carved pale mineral stone wash basin',map:tex['granite-basin'],bumpMap:tex['granite-basin'],bumpScale:.002,color:0xe2e4de,roughness:.43});
 const base=propMesh(root,new T.LatheGeometry([[0,0],[.34,0],[.36,.06],[.30,.12],[.16,.17],[.14,.60],[.23,.67],[.46,.72],[.61,.87],[.62,.96],[.58,.99],[.54,.91],[.40,.80],[.20,.75],[0,.75]].map(p=>new T.Vector2(...p)),48),marble,x,y,z,'Waist-high carved stone bowl on pedestal');
 // A shallow, bounded water surface stays below the carved inner lip.
 const water=new T.MeshStandardMaterial({name:'Rinse water in bowl',color:0x5d857c,roughness:.14,metalness:.25,transparent:true,opacity:.66});const surface=propMesh(root,new T.CircleGeometry(.465,48),water,x,y+.856,z);surface.rotation.x=-Math.PI/2;
 const wood=new T.MeshStandardMaterial({map:tex.wood,color:0xc7ab7c,roughness:.77});
 const spoon=propMesh(root,new T.LatheGeometry([[0,0],[.078,.017],[.085,.07],[.073,.07],[.065,.024],[0,.015]].map(p=>new T.Vector2(...p)),24),wood,x-.19,y+.945,z+.08,'Rinsing ladle cup');
 propRod(root,wood,[x-.17,y+.97,z+.10],[x+.48,y+1.0,z+.26],.017);
 woodenBucket(root,tex.wood,mats.metal,x+.27,y,z-.98,.86);
 const stool=propMesh(root,new T.BoxGeometry(.56,.065,.40),wood,x+.13,y+.36,z-.59,'Small towel stool');
 for(const dx of[-.21,.21])for(const dz of[-.145,.145])propRod(root,wood,[x+.13+dx,y,z-.59+dz],[x+.13+dx*.88,y+.35,z-.59+dz*.85],.025);
 foldedTowel(root,tex['towel-ivory'],x+.14,y+.40,z-.60,.42,.31,-.07);foldedTowel(root,tex['towel-turquoise'],x+.13,y+.447,z-.57,.39,.28,.03);
 return base;
}
