// V133-L27-fix: dressing for the upward-growing roof + platform light pass.
// - light shaft falling from the main chimney (additive soft cone, slow dust) + the bright opening at its top
// - folded white towel on a flat rock at the platform's pool edge (PS1 low-poly box stack, low-res terry texture)
// Static rock goes into rockRoot (batched with the cave), baked with bakeAt (same spots as the offline bake).
import * as T from './vendor/three.module.min.js';
import {CHIMNEYS133,TOWEL133,bakeAt} from './level27-light131.js?v=133';
import {poolFloor} from './level27-layout.js?v=133';
import {bakeGeometry131} from './level27-cliff131.js?v=133';

// chimney centre line (must match build-spring-shell-v133.mjs chimneys())
export function chimneyCentre133(c,y){return [c.x+c.m*Math.sin(y*1.7+c.x),c.z+c.m*Math.cos(y*1.3+c.z)];}

function canvasTex(w,h,draw,out=64){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 // PS1: draw large, then downscale and quantise, nearest sampling
 const s=document.createElement('canvas');s.width=out;s.height=Math.round(out*h/w);const sx=s.getContext('2d');sx.imageSmoothingEnabled=true;sx.drawImage(c,0,0,s.width,s.height);
 const d=sx.getImageData(0,0,s.width,s.height);for(let i=0;i<d.data.length;i+=4)for(let k=0;k<3;k++)d.data[i+k]=Math.round(d.data[i+k]/8)*8;sx.putImageData(d,0,0);
 const t=new T.CanvasTexture(s);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.generateMipmaps=false;return t;
}
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function terry(g,w,h,base){g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<w*h/10;i++){const x=rnd()*w,y=rnd()*h,v=rnd();g.fillStyle=v<.5?`rgba(150,145,132,${.10+.15*rnd()})`:`rgba(255,255,250,${.12+.2*rnd()})`;g.beginPath();g.arc(x,y,1+rnd()*1.6,0,Math.PI*2);g.fill();}}
// top: terry pile + a woven dobby band near one end
const towelTop=()=>canvasTex(256,192,(g,w,h)=>{terry(g,w,h,'#f6f4ee');for(const [y0,c] of [[22,'rgba(120,140,160,.55)'],[34,'rgba(120,140,160,.35)']]){g.fillStyle=c;g.fillRect(0,y0,w,6);}g.strokeStyle='rgba(110,105,95,.35)';g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);});
// fold side: three stacked rounded layers
const towelFold=()=>canvasTex(256,64,(g,w,h)=>{g.fillStyle='#d8d4ca';g.fillRect(0,0,w,h);for(let k=0;k<3;k++){const y=k*h/3,gr=g.createLinearGradient(0,y,0,y+h/3);gr.addColorStop(0,'#f4f2ec');gr.addColorStop(.55,'#ddd9cf');gr.addColorStop(1,'#9e998e');g.fillStyle=gr;g.fillRect(0,y+1,w,h/3-2);}terry(g,w,h,'rgba(0,0,0,0)');});
// open side: layer edges with a hem line
const towelEdge=()=>canvasTex(256,64,(g,w,h)=>{g.fillStyle='#e4e0d6';g.fillRect(0,0,w,h);for(let k=0;k<6;k++){g.fillStyle=k%2?'#b9b4a9':'#f0ede6';g.fillRect(0,k*h/6,w,h/12);}g.fillStyle='rgba(120,140,160,.5)';g.fillRect(18,0,6,h);g.fillRect(30,0,4,h);terry(g,w,h,'rgba(0,0,0,0)');});
const towelUnder=()=>canvasTex(128,96,(g,w,h)=>{terry(g,w,h,'#bdb9ae');g.fillStyle='rgba(60,55,45,.35)';g.fillRect(0,0,w,h);},32);

export function addLevel27V133({scene,rockRoot,rockMaterial,shellMesh,clock}){
 const out={};
 // ---- folded towel on a flat rock ----
 {const {x,z,yaw}=TOWEL133,f=poolFloor(x,z);
  const rg=new T.SphereGeometry(1,10,6),p=rg.attributes.position;
  for(let i=0;i<p.count;i++){let px=p.getX(i),py=p.getY(i),pz=p.getZ(i);const r=1+.10*Math.sin(px*5+pz*3)+.05*Math.sin(pz*9-px*7);py=py>0?py*.55:py;p.setXYZ(i,px*r*.36,py*.15,pz*r*.30);}
  const rock=new T.Mesh(rg,rockMaterial);rock.position.set(x,f+.05,z);rock.rotation.y=yaw+.3;rock.updateMatrix();
  rg.applyMatrix4(rock.matrix);rock.position.set(0,0,0);rock.rotation.set(0,0,0);rock.updateMatrix();rg.computeVertexNormals();
  bakeGeometry131(rg,{wet:.15,cavity:(q,n)=>n[1]<0?.5:.1,boost:1.1});rock.name='V133 flat bank rock under the towel';rock.castShadow=rock.receiveShadow=true;rockRoot.add(rock);
  let top=f+.05+.15*.55;{const hit=new T.Raycaster(new T.Vector3(x,f+1,z),new T.Vector3(0,-1,0)).intersectObject(rock)[0];if(hit)top=hit.point.y;}
  const c=bakeAt([x,top+.05,z],[0,1,0],0),em=new T.Color(Math.min(1,.40+c[0]*.22),Math.min(1,.39+c[1]*.22),Math.min(1,.37+c[2]*.22)); // white cotton reads white even in the dim bank light
  const mk=map=>new T.MeshLambertMaterial({map,emissive:em,emissiveMap:map,name:'V133 folded white towel'});
  const top_=towelTop(),fold=towelFold(),edge=towelEdge(),under=towelUnder();
  const mats=[mk(fold),mk(edge),mk(top_),mk(under),mk(edge),mk(edge)];
  const g=new T.Group();g.name='V133 folded white towel';
  // three stacked folded layers, each slightly offset (hand-folded), the top one a touch smaller
  const L=[[.34,.030,.25,0,0],[.335,.028,.245,.006,-.004],[.325,.027,.24,-.004,.005]];let y=top-.004;
  for(const [w,hh,d,ox,oz] of L){const b=new T.Mesh(new T.BoxGeometry(w,hh,d),mats);b.position.set(ox,y+hh/2,oz);b.rotation.y=(rnd()-.5)*.05;b.castShadow=b.receiveShadow=true;g.add(b);y+=hh-.002;}
  // rounded fold roll along the +x edge
  const roll=new T.Mesh(new T.CylinderGeometry(.042,.042,.245,8,1,false,0,Math.PI),mats[0]);roll.rotation.set(Math.PI/2,0,0);roll.position.set(.168,top+.040,0);roll.castShadow=true;g.add(roll);
  g.position.set(x,0,z);g.rotation.y=yaw;scene.add(g);out.towel=g;}
 // ---- light shaft + opening at the top of the main chimney ----
 {const c=CHIMNEYS133.find(c=>c.open),yt=c.y1-.18,[tx,tz]=chimneyCentre133(c,yt),yb=.02,[bx,bz]=[c.x+.02,c.z+.06];
  const H=yt-yb,geo=new T.CylinderGeometry(.24,.78,H,20,12,true);geo.translate(0,H/2,0);
  const mat=new T.ShaderMaterial({name:'V133 chimney light shaft',transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{time:clock,H:{value:H}},
   vertexShader:'varying vec3 vN,vW;varying float vh;uniform float H;void main(){vh=position.y/H;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float time;varying vec3 vN,vW;varying float vh;
    float n3(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}
    void main(){vec3 V=normalize(cameraPosition-vW);float side=pow(abs(dot(normalize(vN),V)),1.6);
     float fall=smoothstep(0.,.18,vh)*(.45+.55*vh)*(1.-smoothstep(.93,1.,vh));
     float dust=.75+.25*sin(vW.y*7.+time*.35+sin(vW.x*9.+time*.2)*2.)*sin(vW.z*8.-time*.27);
     float mote=step(.985,n3(vec3(vW.x*40.,vW.y*40.-time*1.5,vW.z*40.)))*.8;
     gl_FragColor=vec4(vec3(.62,.70,.78)*(.055*side*fall*dust+mote*.05*fall),1.);}`});
  const shaft=new T.Mesh(geo,mat);shaft.position.set(bx,yb,bz);
  // align cylinder axis (local +y) from bottom point to the top point
  shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(tx-bx,H,tz-bz).normalize());
  shaft.name='V133 chimney light shaft';shaft.renderOrder=5;shaft.frustumCulled=false;scene.add(shaft);out.shaft=shaft;
  const glow=new T.Mesh(new T.CircleGeometry(.30,12),new T.MeshBasicMaterial({color:0xdfe9f2,name:'V133 chimney opening glow',side:T.DoubleSide}));
  const [gx,gz]=chimneyCentre133(c,c.y1-.08);glow.position.set(gx,c.y1-.08,gz);glow.rotation.x=Math.PI/2;glow.name='V133 chimney opening';scene.add(glow);
  const halo=new T.Mesh(new T.CircleGeometry(.55,16),new T.MeshBasicMaterial({color:0x6c7a86,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));halo.position.set(gx,c.y1-.22,gz);halo.rotation.x=Math.PI/2;scene.add(halo);out.glow=glow;}
 return out;
}
