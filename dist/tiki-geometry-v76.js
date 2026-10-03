import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bevelBox,worldUV} from './bath-v61-materials.js';
export class TikiKit{
 constructor(mats){this.m=mats;this.root=new T.Group();this.groups=new Map();this.count=0;}
 add(g,key,x=0,y=0,z=0,rotation=null,scale=null){if(g.index){const q=g.toNonIndexed();g.dispose();g=q;}if(!g.attributes.uv)worldUV(g,1);for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);const mat=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(...(rotation||[0,0,0]))),new T.Vector3(...(scale||[1,1,1])));g.applyMatrix4(mat);if(!this.groups.has(key))this.groups.set(key,[]);this.groups.get(key).push(g);this.count++;return g;}
 box(key,x,y,z,w,h,d,r=.025,ry=0){return this.add(worldUV(bevelBox(w,h,d,Math.min(r,w/4,h/4,d/4)),1.15),key,x,y,z,[0,ry,0]);}
 plane(key,x,y,z,w,h,rotation=[0,0,0],uv=[0,0,1,1],segments=1){const g=new T.PlaneGeometry(w,h,segments,segments),a=g.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,uv[0]+a.getX(i)*uv[2],uv[1]+a.getY(i)*uv[3]);return this.add(g,key,x,y,z,rotation);}
 cyl(key,x,y,z,r1,r2,h,n=12){return this.add(new T.CylinderGeometry(r1,r2,h,n,1),key,x,y,z);}
 sphere(key,x,y,z,rx,ry=rx,rz=rx){return this.add(new T.SphereGeometry(1,16,10),key,x,y,z,null,[rx,ry,rz]);}
 beam(key,a,b,r=.055,n=10){const av=new T.Vector3(...a),bv=new T.Vector3(...b),g=new T.CylinderGeometry(r,r,av.distanceTo(bv),n),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),bv.clone().sub(av).normalize());g.applyQuaternion(q);return this.add(g,key,...av.add(bv).multiplyScalar(.5).toArray());}
 tube(key,pts,r=.016,n=24){return this.add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),n,r,6,false),key);}
 stone(x,y,z,w,h,d,seed=0){const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=1+.1*Math.sin(a*16+b*9+c*11+seed);p.setXYZ(i,a*w*.5*f,b*h*.5*f,c*d*.5*f);}g.computeVertexNormals();return this.add(worldUV(g,.8),'rock',x,y,z);}
 finish(name){let triangles=0;for(const [key,list]of this.groups){const g=mergeGeometries(list,false);for(const a of list)a.dispose();if(!g)throw Error('Tiki merge failed '+key);g.computeBoundingSphere();const o=new T.Mesh(g,this.m[key]);o.name=name+' / '+key;o.castShadow=!['fringe','bulb','redEye'].includes(key);o.receiveShadow=true;triangles+=g.attributes.position.count/3;this.root.add(o);}this.groups.clear();this.root.name=name;this.root.userData.cityStats={draws:this.root.children.filter(x=>x.isMesh).length,triangles};return this.root;}
}
// Sculpture is an actual carved radial mesh: negative eye/mouth volumes, crown,
// cheek planes and protruding brow. The eye holes are open topology, not black cards.
export function tikiIdol(k,x,z,scale=1){
 const g=new T.BufferGeometry(),p=[],uv=[],N=64,M=64,H=2.75;
 const sq=x=>x*x,pow4=x=>x*x*x*x,pow6=x=>x*x*x*x*x*x;
 const point=(i,j)=>{const a=i/N*Math.PI*2,y=j/M*H,front=Math.max(0,Math.cos(a)),xx=Math.sin(a);let radius=.32+.035*Math.sin(y*7)+.07*Math.pow(Math.abs(2*y/H-1),6);radius+=front**8*(.09*Math.exp(-sq((y-1.83)/.18))+.075*Math.exp(-sq((y-2.42)/.06)));const eye=Math.exp(-sq((Math.abs(xx)-.48)/.18)-sq((y-2.13)/.115)),mouth=Math.exp(-pow6(xx/.73)-pow4((y-1.39)/.23));radius-=front**12*(.18*eye+.19*mouth);radius+=front**16*(.15*Math.exp(-sq(xx/.24)-sq((y-1.94)/.20)));return[Math.sin(a)*radius,y,Math.cos(a)*radius];};
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=(i+.5)/N*Math.PI*2,y=(j+.5)/M*H;if(Math.cos(a)>.72&&Math.abs(Math.abs(Math.sin(a))-.48)<.12&&Math.abs(y-2.13)<.065)continue;for(const [u,v]of[[i,j],[i+1,j],[i,j+1],[i+1,j],[i+1,j+1],[i,j+1]]){p.push(...point(u,v));uv.push(u/N*2,v/M*2);}}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();k.add(g,'wood',x,0,z,null,[scale,scale,scale]);
 const b=(key,dx,y,dz,w,h,d,r=.02)=>k.box(key,x+dx*scale,y*scale,z+dz*scale,w*scale,h*scale,d*scale,r*scale);
 k.cyl('wood',x,.08*scale,z,.43*scale,.45*scale,.16*scale,16);k.cyl('wood',x,2.72*scale,z,.40*scale,.37*scale,.08*scale,16);
 for(const side of[-1,1]){b('dark',side*.16,2.13,.17,.14,.16,.10);k.sphere('redEye',x+side*.16*scale,2.13*scale,z+.20*scale,.047*scale,.028*scale,.025*scale);k.beam('wood',[x+side*.055*scale,2.31*scale,z+.35*scale],[x+side*.3*scale,2.24*scale,z+.29*scale],.065*scale);k.beam('wood',[x+side*.28*scale,1.2*scale,z+.18*scale],[x+side*.27*scale,.62*scale,z+.25*scale],.075*scale);}
 b('dark',0,1.40,.16,.36,.28,.09);for(let i=0;i<5;i++)b('wood',(i-2)*.07,1.49,.31,.052,.1,.05,.012);
 k.tube('wood',[[-.24,1.3,.30],[-.12,1.22,.37],[.12,1.22,.37],[.24,1.3,.30]].map(([a,y,b])=>[x+a*scale,y*scale,z+b*scale]),.045*scale,20);
 for(let i=0;i<5;i++)k.beam('wood',[x+(i-2)*.095*scale,2.52*scale,z+.3*scale],[x+(i-2)*.12*scale,2.73*scale,z+.23*scale],.023*scale);
}
export function coloredBulbs(k,points){const colors=[0xed9342,0x69b99b,0xd04935,0xe2cb72,0x609dc0];for(let i=0;i<5;i++){k.m['bulb'+i]=k.m.bulb.clone();k.m['bulb'+i].vertexColors=false;k.m['bulb'+i].color.setHex(colors[i]);k.m['bulb'+i].emissive.setHex(colors[i]);}k.tube('dark',points,.014,Math.max(30,points.length*3));for(let i=0;i<points.length;i++){const [x,y,z]=points[i];k.cyl('dark',x,y-.035,z,.035,.039,.065,8);k.sphere('bulb'+i%5,x,y-.13,z,.068,.094,.068);}}
export function disposeTiki(root,mats){root.traverse(o=>o.geometry?.dispose());for(const m of new Set(Object.values(mats)))m.dispose();root.removeFromParent();}
