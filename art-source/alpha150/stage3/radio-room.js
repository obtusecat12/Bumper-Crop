import {radioParts150,RADIO_FINISHES} from '../../../dist/alpha150-radio.js';
export {radioParts150,RADIO_FINISHES} from '../../../dist/alpha150-radio.js';
export function createRadioModel150(T,appendBox){
 const group=new T.Group(),materials={};for(const [k,c] of Object.entries(RADIO_FINISHES))materials[k]=new T.MeshStandardMaterial({color:c,roughness:.84,metalness:k==='rail'?.35:.03});
 for(const p of radioParts150()){let g;if(p.shape==='box'){const a={position:[],normal:[],uv:[]};appendBox(a,{...p,x:0,y:0,z:0},.006);g=new T.BufferGeometry();for(const [k,n]of [['position',3],['normal',3],['uv',2]])g.setAttribute(k,new T.Float32BufferAttribute(a[k],n));}else if(p.shape==='disc'){g=new T.CylinderGeometry(p.r,p.r,p.depth,12);g.rotateX(Math.PI/2);}else{const a=new T.Vector3(...p.a),b=new T.Vector3(...p.b);g=new T.CylinderGeometry(p.r,p.r,a.distanceTo(b),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());}
  const m=new T.Mesh(g,materials[p.mat]);if(p.shape!=='cable')m.position.set(p.x,p.y,p.z);m.rotation.z=p.rz||0;m.castShadow=m.receiveShadow=true;m.userData.finish=p.mat;group.add(m);
 }
 group.userData.dispose=()=>{group.traverse(o=>o.geometry?.dispose());Object.values(materials).forEach(m=>{m.map?.dispose();m.normalMap?.dispose();m.dispose();});};return group;
}
