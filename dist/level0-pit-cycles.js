import {cyclesMaterial} from './level0-cycles-material.js';
import {PIT_ATLAS} from './level0-pit-cycles-data.js';
export function createPitCycles(T,mats,circuit){
 let resolve;const ready=new Promise(r=>resolve=r),atlas=new T.TextureLoader().load('./assets/level0-pit-cycles/irradiance.webp',resolve,undefined,resolve);atlas.colorSpace=T.NoColorSpace;atlas.minFilter=atlas.magFilter=T.LinearFilter;atlas.generateMipmaps=false;
 const uniforms={pitAtlas:{value:atlas},cutCount:circuit.cutCount,cuts:circuit.cuts};
 const cut='uniform int cutCount;uniform vec4 cuts[12];float pitCircuit(vec3 p){float a=1.;for(int i=0;i<12;i++){if(i>=cutCount)break;float d=distance(p.xz,cuts[i].xy);a*=mix(1.,.038,(1.-smoothstep(cuts[i].z*.82,cuts[i].z,d))*cuts[i].w);}return a;}';
 const source=new T.MeshStandardMaterial({color:0xb7a77d,roughness:.98,normalMap:mats.wall[0].normalMap,normalScale:new T.Vector2(.045,.045),fog:false});
 const bottom=new T.MeshBasicMaterial({color:0x000000,fog:false});
 const wall=cyclesMaterial(source,{id:'pit-wall',uniforms,glsl:'uniform sampler2D pitAtlas;'+cut,sample:'vec4(pow(texture2D(pitAtlas,cyclesUv).rgb,vec3(2.))*1.8*exp(-max(0.,-cyclesWorld.y-.12)*.65)*pitCircuit(cyclesWorld),1.)'});
 const planes=PIT_ATLAS.variants.map(v=>v.walls.map(({rect:[x,y,w,h]})=>{const g=new T.PlaneGeometry(1,1),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*w)/1024,(y+uv.getY(i)*h)/1024);return g;}));
 const deep=planes.map(gs=>gs.map(g=>{const c=g.clone(),u=c.attributes.uv;for(let i=0;i<u.count;i++)u.setY(i,Math.min(u.getY(0),u.getY(2)));return c;}));
 const floors=PIT_ATLAS.variants.map((v,i)=>{const[x,y,w,h]=v.floor;return cyclesMaterial(mats.carpet,{id:'pit-floor'+i,uniforms:{pitAtlas:uniforms.pitAtlas},glsl:`uniform sampler2D pitAtlas;float circuitAt(vec3 p);vec4 pitFloor(){vec2 local=mod(cyclesWorld.xz,3.6)-1.8;vec2 q=clamp((local+1.8)/3.6,0.,1.);vec3 E=texture2D(pitAtlas,(vec2(${x}.,${y}.)+q*vec2(${w}.,${h}.))/1024.).rgb;float weight=1.-smoothstep(1.19,1.79,max(abs(local.x),abs(local.y)));return vec4(E*E*4.*circuitAt(cyclesWorld),weight);}`,sample:'pitFloor()'});});
 const variant=(h,lights)=>{let d=100;for(const l of lights)if(l.on)d=Math.min(d,Math.hypot(l.x-h.x,l.z-h.z));return d<1.7?0:d<3.3?1:d<5.8?2:3;};
 function addHole(h,lights,add,floorPlane){const v=variant(h,lights);for(const [side,x,z,width,rot]of[[0,h.x,h.z-h.d/2,h.w,0],[1,h.x,h.z+h.d/2,h.w,Math.PI],[2,h.x-h.w/2,h.z,h.d,Math.PI/2],[3,h.x+h.w/2,h.z,h.d,-Math.PI/2]]){
   add(planes[v][side],wall,x,-4,z,width,8,1,rot,false);add(deep[v][side],wall,x,-34,z,width,52,1,rot,false);
  }add(floorPlane,bottom,h.x,-60,h.z,h.w,1,h.d,0,false,false);
 }
 function floorMaterial(f,c,normal){const cx=Math.floor(f.x/3.6)*3.6+1.8,cz=Math.floor(f.z/3.6)*3.6+1.8,h=c.holes.find(h=>Math.abs(h.x-cx)<.1&&Math.abs(h.z-cz)<.1);return h?floors[variant(h,c.lights)]:normal;}
 return{ready,addHole,floorMaterial};
}
