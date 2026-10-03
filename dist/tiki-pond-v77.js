import * as T from './vendor/three.module.min.js';
import {TIKI_DETAILS} from './tiki-plan-v77.js';
import {gridSurface,roughBox,lathe,torus,card,crossPlant,uvRect} from './tiki-mesh-v77.js';
function moai(k,q){const x=q.x,z=-5.90,N=64,M=72,p=[],uv=[],ix=[];
 // Reference silhouette: a single round-ended oblong monolith. The brow and
 // long nose emerge from the same surface; the square mouth is open topology.
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,y=.86+j/M*1.91,si=Math.sin(a),co=Math.cos(a),edge=1-.07*Math.pow(Math.abs((y-1.815)/.955),10),xx=Math.sign(si)*Math.pow(Math.abs(si),.77)*.48*edge;let zz=Math.sign(co)*Math.pow(Math.abs(co),.67)*.375*edge;
  if(co>0){const front=Math.pow(co,8),nose=Math.exp(-Math.pow(xx/.093,4))*T.MathUtils.smoothstep(y,1.27,1.43)*(1-T.MathUtils.smoothstep(y,2.25,2.36));zz+=front*(.19*nose+.045*Math.exp(-Math.pow((y-2.38)/.055,2))-.065*Math.exp(-Math.pow((Math.abs(xx)-.235)/.11,2)-Math.pow((y-2.255)/.13,2)));}const grain=.003*Math.sin(xx*39+y*51)*Math.cos(y*27+a*6);p.push(xx,y,zz+grain);uv.push(i/N*2.5,j/M*3.4);}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=(i+.5)/N*Math.PI*2,y=.86+(j+.5)/M*1.91;if(Math.cos(a)>.75&&Math.abs(Math.sin(a)*.48)<.255&&y>.98&&y<1.17)continue;const aa=j*(N+1)+i,bb=aa+1,cc=aa+N+1;ix.push(aa,bb,cc,bb,cc+1,cc);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();k.add(g,'moai',x,0,z);k.sphere('moai',x,2.755,z,.447,.075,.35);
 k.box('moai',x,.70,z,.77,.45,.72,.09);k.box('moai',x,.46,z,.95,.20,.84,.07);
 k.box('moai',x,.951,-5.40,.67,.13,.45,.039);k.box('moai',x,1.177,-5.48,.65,.083,.28,.025);for(const side of[-1,1])k.box('moai',x+side*.297,1.065,-5.49,.09,.21,.28,.025);k.box('dark',x,1.06,-5.78,.50,.18,.03,.01);
}
export function moaiPond(k){const q=TIKI_DETAILS.pond;
 k.box('masonry',q.x,.075,q.z,q.w,.15,q.d,.035);
 for(const side of[-1,1]){k.box('masonry',q.x+side*(q.w/2-.15),.275,q.z,.30,.40,q.d,.04);k.box('masonry',q.x,.275,q.z+side*(q.d/2-.15),q.w-.29,.40,.30,.04);}
 // Staggered actual blocks meet both existing room walls; map is also normal
 // mapped so close-up chips survive without hundreds of tiny pebble objects.
 for(let row=0;row<6;row++)for(let col=0;col<5;col++){const xx=-6.50+col*.64+(row%2)*.12;roughBox(k,'masonry',Math.min(xx+.30,-3.43),.73+row*.405,-6.39,.60,.384,.26,row*8+col,.008);}
 for(let row=0;row<5;row++)for(let col=0;col<4;col++)roughBox(k,'masonry',-6.50,.69+row*.40,-6.10+col*.57,.27,.38,.55,row+col,.007);
 moai(k,q);
 const surface=gridSurface((u,v)=>[(u-.5)*(q.w-.60),q.water,(v-.5)*(q.d-.60)],52,44);k.add(surface,'pondWater',q.x,0,q.z);
 // Double flowing sheet falls forward only 25cm, ending exactly at the pond
 // impact centre. Lengthwise flow is animated in the common optics shader.
 for(let layer=0;layer<2;layer++){const g=gridSurface((u,v)=>{const down=1-v,y=q.water+(q.lipY-q.water)*v,z=q.lipZ+(q.impactZ-q.lipZ)*Math.pow(down,.62);return[(u-.5)*(.38+down*.055),y,z+layer*.006+Math.sin(u*19+v*7)*.002];},28,44);k.add(g,'fallWater',q.x,0,0);}
 for(const [x,z,key]of[[-5.55,-5.12,'pondGreen'],[-4.25,-5.65,'pondGold']]){k.cyl('blackMetal',x,.162,z,.10,.10,.023,20);k.cyl(key,x,.178,z,.078,.078,.008,20);torus(k,'steel',x,.183,z,.088,.007);}
 // The UFO filter rests partly submerged, with a domed lid, concentric rings,
 // slotted intake and a hose which terminates behind the rear rim.
 lathe(k,'filterGray',-4.10,.317,-5.53,[[0,0],[.17,0],[.245,.016],[.246,.032],[.21,.056],[.12,.073],[0,.074]],{segments:32});k.sphere('bronze',-4.10,.398,-5.53,.071,.031,.071);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.cyl('dark',-4.10+Math.sin(a)*.17,.372,-5.53+Math.cos(a)*.17,.018,.018,.006,9);}torus(k,'filterGray',-4.10,.36,-5.53,.238,.005);k.tube('blackMetal',[[-4.1,.33,-5.65],[-3.87,.29,-5.79],[-3.76,.25,-5.94],[-3.77,.43,-6.16]],.015,25);
 k.plane('lily',-3.97,q.water+.012,-5.0,.33,.33,[-Math.PI/2,0,.4],[0,0,.5,1]);card(k,'lily',-3.97,q.water+.063,-5.0,.24,.22,.40,[0,0,.5,1],.025);
 // Plant bases live on rim planters; alpha cross cards carry fine wet fronds.
 for(const [x,z,key,w,h,yaw]of[[-6.25,-5.86,'palm',1.10,1.90,.30],[-3.62,-5.98,'palm',1.06,1.78,-.4],[-6.25,-4.85,'strelitzia',.83,1.40,.40],[-3.65,-5.27,'strelitzia',.78,1.34,-.60],[-5.85,-6.0,'fern',1.0,.92,.2],[-3.81,-6.07,'fern',1.0,.91,-.2],[-6.22,-4.14,'fern',.83,.70,0],[-3.67,-4.15,'fern',.77,.68,1.0]]){k.cyl('dark',x,.43,z,.13,.12,.24,10);crossPlant(k,key,x,.49,z,w,h,yaw);}
 for(const [x,h]of[[-6.12,1.47],[-3.80,1.60]]){card(k,'vine',x,2.99-h*.5,-6.08,h*.334,h,0);k.beam('rope',[x,3.31,-6.16],[x,3.0,-6.1],.01,6);}
}
export function pondSpray(scene){
 // 144 analytic ballistic instances on the GPU. No per-drop JS integration,
 // texture simulation, CPU allocations or full-frame particles.
 const n=144,g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,-.5,.5,0,.5,.5,0],3));g.setIndex([0,1,2,1,3,2]);const seeds=[];for(let i=0;i<n;i++)seeds.push(i/n,(i*.618033)%1,(i*.414213)%1);g.setAttribute('seed',new T.InstancedBufferAttribute(new Float32Array(seeds),3));g.instanceCount=n;
 const u={time:{value:0}};const m=new T.RawShaderMaterial({name:'Local GPU analytic Moai splash',glslVersion:T.GLSL3,uniforms:u,transparent:true,depthWrite:false,vertexShader:`precision highp float;uniform mat4 modelViewMatrix,projectionMatrix;uniform float time;in vec3 position,seed;out vec2 uv;out float fade;void main(){float age=fract(time*(1.1+seed.z*.4)+seed.x),a=seed.y*6.28318;vec3 p=vec3(-4.93,.351,-4.93)+vec3(cos(a)*.44*age,age*.72-age*age*.89,sin(a)*.36*age);fade=(1.-age)*step(.349,p.y);vec4 v=modelViewMatrix*vec4(p,1.);v.xy+=position.xy*vec2(.007,.015)*(1.-age*.5);uv=position.xy*2.;gl_Position=projectionMatrix*v;}`,fragmentShader:`precision highp float;in vec2 uv;in float fade;out vec4 fragColor;void main(){float a=(1.-smoothstep(.20,1.,dot(uv,uv)))*fade*.42;fragColor=vec4(.55,.70,.44,a);}`});const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=5;scene.add(o);return{update(t){u.time.value=t;},dispose(){g.dispose();m.dispose();o.removeFromParent();}};
}
