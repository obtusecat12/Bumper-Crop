import { STATUE133 } from './statue133-data.js';

// V133-statue: two ready-made museum scans replace the V65 procedural attendants on the grotto pier.
//  - Venus de Milo, scan of plaster cast KAS434/1, SMK – National Gallery of Denmark, CC0.
//  - Lely Venus (crouching Aphrodite, British Museum), scan by cesarinozollo, CC-BY 4.0.
// Both decimated to ~2.6k triangles; per-vertex shade carries the scan's dirt/cavity tone (credits: licenses/statues133-credits.txt).
export function createSpaStatues(T,{textures={}}={}) {
  const group=new T.Group();group.name='Pair of classical marble statues (museum scans, V133)';
  const decode=(v,C)=>{const s=atob(v),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return new C(b.buffer);};
  const material=new T.MeshStandardMaterial({name:'V133 statue marble',color:0xece5d6,roughness:.55,metalness:0,vertexColors:true});
  if(textures.marble)material.map=textures.marble;
  if(textures.marbleNormal){material.normalMap=textures.marbleNormal;material.normalScale=new T.Vector2(.18,.18);}
  if(textures.marbleRoughness)material.roughnessMap=textures.marbleRoughness;
  const make=(key,name)=>{
    const d=STATUE133[key],q=decode(d.positions,Uint16Array),pos=new Float32Array(q.length);
    for(let i=0;i<q.length;i++)pos[i]=d.min[i%3]+q[i]/65535*d.scale[i%3];
    const sh=decode(d.shade,Uint8Array),col=new Float32Array(sh.length*3),uv=new Float32Array(sh.length*2);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(new T.BufferAttribute(decode(d.indices,Uint16Array),1));g.computeVertexNormals();
    const n=g.attributes.normal.array;
    for(let i=0;i<sh.length;i++){
      // greyed scan tone, kept close to white so the marble map stays readable
      const t=.72+.28*Math.min(1.25,sh[i]/200);col[i*3]=t;col[i*3+1]=t*.985;col[i*3+2]=t*.96;
      const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2],ax=Math.abs(n[i*3]),az=Math.abs(n[i*3+2]),ay=Math.abs(n[i*3+1]);
      // box projection, 1 texture repeat per ~0.6 m
      const u=ay>ax&&ay>az?x:ax>az?z:x,v=ay>ax&&ay>az?z:y;uv[i*2]=u*1.6+.5;uv[i*2+1]=v*1.6;
    }
    g.setAttribute('color',new T.BufferAttribute(col,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();g.computeBoundingBox();
    const mesh=new T.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={triangleCount:d.tris};
    const holder=new T.Group();holder.name=name+' placement';holder.add(mesh);group.add(holder);return holder;
  };
  const crouching=make('lely','Lely Venus (crouching Aphrodite) scan');
  const standing=make('milo','Venus de Milo cast scan');
  // the pier's top runs from the group origin towards +x/-z; both face the pool (centre 8.9,-2.65)
  crouching.position.set(.05,0,.05);crouching.rotation.y=CROUCH_YAW;
  standing.position.set(1,0,-.45);standing.rotation.y=STAND_YAW;
  const report={assetVersion:133,triangles:STATUE133.milo.tris+STATUE133.lely.tris,sources:['SMK KAS434/1 Venus de Milo (CC0)','Lely Venus by cesarinozollo (CC-BY 4.0)']};
  group.userData={assetVersion:133,geometryReport:report};
  return {group,statues:{seated:crouching,kneeling:standing,crouching,standing},materials:{marble:material},report};
}
const CROUCH_YAW=.77,STAND_YAW=.38;
