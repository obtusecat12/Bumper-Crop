import * as T from './vendor/three.module.min.js';
import {height,surfaceHeight,roadSample,roadDistance,laneOffset,pondDistance,buildingSize,periodOrigin,random} from './world.js';
const dummy=new T.Object3D(),shared=new Set();
const terrainDecl=`varying vec3 vTerrain;
uniform vec4 uLanes[4];
uniform vec4 uDrive;
uniform float uHasDrive;
uniform vec4 uPond;
uniform vec4 uShore;
uniform vec4 uBuilding;
uniform vec2 uSize;
uniform vec2 uWorldOffset;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
float laneD(vec2 p){float d=10000.;for(int i=0;i<4;i++){vec4 l=uLanes[i];if(l.w<.5)continue;float t=i<2?p.y:p.x;float c=l.x+l.y*sin(t*.0490873852)+l.z*sin(t*.0981747704);d=min(d,abs((i<2?p.x:p.y)-c));}if(uHasDrive>.5){vec2 a=p-uDrive.xy,v=uDrive.zw-uDrive.xy;d=min(d,length(a-v*clamp(dot(a,v)/dot(v,v),0.,1.)));}return d;}
float pondD(vec2 p){vec2 d=p-uPond.xy;float c=cos(uShore.x),s=sin(uShore.x);vec2 uv=vec2(c*d.x-s*d.y,s*d.x+c*d.y)/uPond.zw;float a=atan(uv.y,uv.x),ph=uShore.y;float r=1.+uShore.z*(.60*sin(3.*a+ph)+.28*sin(5.*a-ph*.7)+.12*sin(9.*a+ph*1.7));return length(uv)/r;}
`;
function groundMaterial(f){const m=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 m.onBeforeCompile=s=>{
  s.uniforms.uLanes={value:f.roads.map(l=>new T.Vector4(l.edge,l.amplitude,l.harmonic,l.enabled?1:0))};
  const d=f.driveway;s.uniforms.uDrive={value:d?new T.Vector4(d.x1,d.z1,d.x2,d.z2):new T.Vector4(0,0,1,1)};s.uniforms.uHasDrive={value:d?1:0};
  s.uniforms.uPond={value:new T.Vector4(f.cx,f.cz,f.rx,f.rz)};
  s.uniforms.uShore={value:new T.Vector4(f.angle,f.shorePhase,f.shoreAmplitude,f.type==='pond'?1:0)};
  s.uniforms.uBuilding={value:new T.Vector4(f.cx,f.cz,f.buildingAngle||0,f.type==='building'?1:0)};
  const [w,depth]=buildingSize(f);s.uniforms.uSize={value:new T.Vector2(w/2,depth/2)};
  s.uniforms.uWorldOffset={value:new T.Vector2(periodOrigin(f.x),periodOrigin(f.z))};
  s.vertexShader='varying vec3 vTerrain;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');
  s.fragmentShader=terrainDecl+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=vTerrain.xz,g=p+uWorldOffset;float n=noise2(g*2.5)*.4+noise2(g*18.)*.28+noise2(g*.23)*.32;
   float rd=laneD(p),ragged=(noise2(g*8.)-.5)*.065;
   float rut=1.-smoothstep(.19,.32,abs(rd-.77)+ragged);
   vec3 field=mix(vec3(.255,.204,.105),vec3(.39,.32,.17),n);
   vec3 grass=mix(vec3(.088,.123,.050),vec3(.19,.218,.108),n);
   vec3 dirt=mix(vec3(.115,.097,.066),vec3(.255,.223,.154),n);
   vec3 base=mix(grass,field,smoothstep(1.5,2.35,rd));
   float tread=smoothstep(.34,.49,fract(g.y*5.5+abs(g.x*3.1)))*(1.-smoothstep(.55,.66,fract(g.y*5.5+abs(g.x*3.1))));
   base=mix(base,dirt*(.88+.12*tread),rut);
   if(uBuilding.w>.5){vec2 b=p-uBuilding.xy;float c=cos(uBuilding.z),s=sin(uBuilding.z);vec2 q=abs(vec2(c*b.x-s*b.y,s*b.x+c*b.y));float e=max(q.x-uSize.x,q.y-uSize.y);base=mix(dirt,base,smoothstep(1.3,3.5,e));}
   if(uShore.w>.5){vec3 outside=base;float pd=pondD(p);vec3 silt=mix(vec3(.105,.099,.077),vec3(.205,.199,.157),n);vec3 loam=mix(vec3(.34,.313,.228),vec3(.47,.433,.321),n);vec3 drygrass=mix(vec3(.12,.141,.067),vec3(.245,.252,.134),n);base=mix(silt,loam,smoothstep(.994,1.018,pd));base=mix(base,drygrass,smoothstep(1.032,1.075,pd));base=mix(base,outside,smoothstep(1.31,1.44,pd));}
   diffuseColor.rgb=base*(.90+n*.22);
  `);
 };
 m.customProgramCacheKey=()=> 'rural-ground-v4';return m;
}
function samples(step,edges){const values=new Set([0,64]);for(let n=step;n<64;n+=step)values.add(n);for(const edge of edges){if(!edge.enabled)continue;for(let n=0;n<=18;n++){values.add(edge.edge===0?n*.18:64-n*.18)}}return [...values].sort((a,b)=>a-b)}
export function makeGround(f,level){
 const step=f.type==='pond'?(level===2?1:.65):f.type==='building'?1.5:2;
 const xs=samples(step,f.roads.slice(0,2)),zs=samples(step,f.roads.slice(2)),p=[],uv=[],idx=[],nx=xs.length;
 // The grooves are displaced vertices, not a flat painted road.
 for(const z of zs)for(const x of xs){p.push(x,surfaceHeight(x,z,f),z);uv.push(x/64,z/64)}
 for(let z=0;z<zs.length-1;z++)for(let x=0;x<nx-1;x++){const a=z*nx+x,b=a+1,c=a+nx,d=c+1;idx.push(a,c,b,b,c,d)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,groundMaterial(f));mesh.name='sculpted-ground-and-wheel-ruts';mesh.receiveShadow=true;return mesh;
}
function bladeGeometry(){const p=[],colors=[],r=random(0x417faf),tone=new T.Color();
 for(let i=0;i<7;i++){const a=r()*6.283,x=Math.cos(a)*r()*.10,z=Math.sin(a)*r()*.10,h=.17+r()*.22,bend=.05+r()*.13,w=.012+r()*.012;const side=new T.Vector3(Math.cos(a),0,Math.sin(a));tone.setHSL(.17+r()*.03,.28,.24+r()*.16);
  for(let k=0;k<3;k++){const t=k/3,u=(k+1)/3,at=q=>[x+Math.cos(a)*bend*q*q,h*q,z+Math.sin(a)*bend*q*q],v1=at(t),v2=at(u),verts=[];for(const [v,s,q]of [[v1,-1,t],[v1,1,t],[v2,1,u],[v1,-1,t],[v2,1,u],[v2,-1,u]])verts.push(v[0]+side.z*w*s*(1-q),v[1],v[2]-side.x*w*s*(1-q));p.push(...verts);for(let n=0;n<6;n++)colors.push(tone.r,tone.g,tone.b)}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
const vergeGeo=bladeGeometry(),vergeMat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,side:T.DoubleSide});shared.add(vergeGeo);shared.add(vergeMat);
const stoneGeo=new T.IcosahedronGeometry(1,0),stoneMat=new T.MeshStandardMaterial({color:'#746c58',roughness:1});shared.add(stoneGeo);shared.add(stoneMat);
export function makeVerge(f,level){const group=new T.Group(),r=random(f.seed^0x11bad),points=[],stones=[];
 for(const l of f.roads){if(!l.enabled)continue;for(let t=.4;t<63.8;t+=level===2?1.1:.58){const offset=laneOffset(l,t);for(const s of [0,-1.48,1.48]){const q=l.edge+offset+s+(r()-.5)*.25,x=l.axis==='x'?q:t,z=l.axis==='x'?t:q;if(x<.15||z<.15||x>63.85||z>63.85)continue;points.push({x,z,scale:s===0?.40+r()*.35:.7+r()*.8})}}}
 for(let i=0;i<1400;i++){const x=r()*64,z=r()*64,d=roadDistance(x,z,f);if(d>1.85&&d<2.6&&r()<.65)points.push({x,z,scale:.55+r()*.6});if(Math.abs(d-.77)<.30&&r()<.55)stones.push({x,z,s:.017+r()*.033})}
 const grasses=new T.InstancedMesh(vergeGeo,vergeMat,points.length);points.forEach((p,i)=>{dummy.position.set(p.x,surfaceHeight(p.x,p.z,f)-.012,p.z);dummy.rotation.set(0,r()*6.283,0);dummy.scale.set(p.scale,p.scale,p.scale);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix)});grasses.computeBoundingSphere();grasses.name='raised-grassy-median-and-verges';group.add(grasses);
 const gravel=new T.InstancedMesh(stoneGeo,stoneMat,stones.length);stones.forEach((p,i)=>{dummy.position.set(p.x,surfaceHeight(p.x,p.z,f)+p.s*.25,p.z);dummy.rotation.set(r(),r()*6.28,r());dummy.scale.set(p.s*1.5,p.s*.6,p.s);dummy.updateMatrix();gravel.setMatrixAt(i,dummy.matrix)});gravel.computeBoundingSphere();group.add(gravel);return group;
}
export const isSharedGroundResource=r=>shared.has(r);
