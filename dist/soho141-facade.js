// V141 F1 (notes/spec-1021-street-facade-geo.md): SoHo cast-iron facade as real geometry instead of a flat photo quad.
// Offline: bc/scripts/facade141/build141.py (Blender: photo blueprint -> high-poly relief -> Cycles Selected-to-Active bake of
// albedo/AO/roughness/normal onto a low-poly that keeps the window, shop and door recesses + cornice boxes) -> cook141.py.
// Runtime here: that low-poly (baked maps, MeshStandardMaterial normalMap + roughnessMap) + SEPARATE real geometry for the
// fire escape (cylinder rails/balusters, grating platforms + treads, stair stringers, brackets, drop ladder) and the
// storefront awnings (sloped canvas, valance, side panels, iron arms + front bar), all placed on the photo's own px grid.
// Built into the block's UrbanBatch by soho135-street.js. Off: ?fac141=0 (old flat photo quad).
import * as T from './vendor/three.module.min.js';








const A=new URL('./assets/l11-v141/',import.meta.url).href;
// per facade: baked low-poly + blueprint px grid (photo 750 x 1358 px) for the separate fire escape / awnings
export const SOHO141={
 a0:{geo:null,g:'A0',px:[750,1358],fe:{x0:74,x1:298,levels:[990,742,525,328]},awn:{bays:[[70,170],[198,300],[456,556],[585,690]],top:1095}},
 // V141 F2: no awnings in these photos; fire escapes where the old flat version had one, on the photo's floor lines
 a1:{geo:null,g:'A1',px:[876,1172]},
 a2:{geo:null,g:'A2',px:[750,1314],fe:{x0:175,x1:375,levels:[1050,845,650,460,290]}},
 a3:{geo:null,g:'A3',px:[750,1358],fe:{x0:190,x1:420,levels:[920,650,397]}},
 a4:{geo:null,g:'A4',px:[828,1237],fe:{x0:185,x1:462,levels:[840,560,305]}},
 // V141 F2b block -2,1 (b2 had no fire escape in the flat version)
 b0:{geo:null,g:'B0',px:[906,1117],fe:{x0:60,x1:355,levels:[800,600,407,228]}},
 b1:{geo:null,g:'B1',px:[828,1247],fe:{x0:50,x1:390,levels:[928,702,492,290]}},
 b2:{geo:null,g:'B2',px:[828,1205]},
 b3:{geo:null,g:'B3',px:[750,1333],fe:{x0:190,x1:420,levels:[1046,862,712,545,355]}},
 // V141 F2c block -3,0 (east face; lots are rotated, not mirrored, so the local frame reads like the west side; c2 had no fire escape)
 c0:{geo:null,g:'C0',px:[750,1358],fe:{x0:175,x1:520,levels:[925,645,378]}},
 c1:{geo:null,g:'C1',px:[750,1336],fe:{x0:189,x1:534,levels:[920,650,390]}},
 c2:{geo:null,g:'C2',px:[750,1358]},
 c3:{geo:null,g:'C3',px:[828,1239],fe:{x0:316,x1:556,levels:[958,775,605,435,277]}},
 c4:{geo:null,g:'C4',px:[750,1358],fe:{x0:227,x1:572,levels:[1000,735,470]}},
 // V141 F2d block -3,1 (east face; d3 had no fire escape in the flat version, but its café photo has three striped awnings)
 d0:{geo:null,g:'D0',px:[828,1222],fe:{x0:120,x1:454,levels:[852,598,352]}},
 d1:{geo:null,g:'D1',px:[750,1358],fe:{x0:117,x1:462,levels:[918,640,372]}},
 d2:{geo:null,g:'D2',px:[828,1247],fe:{x0:167,x1:455,levels:[922,724,532,340]}},
 d3:{geo:null,g:'D3',px:[828,1247],awn:{bays:[[15,325],[350,488],[512,822]],top:975}},
 d4:{geo:null,g:'D4',px:[750,1339],fe:{x0:170,x1:480,levels:[928,675,465,288]}}};
// V141 F3: the 8 corner side elevations (bc/scripts/facade141/sides141.py blueprints, same build141/cook141 pipeline). Low-poly
// frame: x along the side wall (17 m = lot depth, image left = street end for cs=+1; cs=-1 blueprints are rolled so their
// street-end part sits at the image's right = street end once the wall is turned to face -x), y up, z out of the wall.
export const SIDE141={a3:{geo:null,g:'SA3'},a4:{geo:null,g:'SA4'},b0:{geo:null,g:'SB0'},b3:{geo:null,g:'SB3'},c4:{geo:null,g:'SC4'},c2:{geo:null,g:'SC2'},d1:{geo:null,g:'SD1'},d3:{geo:null,g:'SD3'}};
// d3's café side has a striped awning over its shopfront (photo px of its 832 x 1250 blueprint)
const SIDE141AWN={d3:{px:[832,1250],awn:{bays:[[18,332]],top:940}}};
export function soho141Side(b,spec,lod,fkey,cs){const w=spec.w,d=spec.d,H=spec.soho135.H,key='s'+fkey,G=SIDE141[fkey].geo;
 addSoho141Materials(b.mats,key);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(G.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(G.uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(G.nrm,3));
 b.add(g,'soho141'+key,cs*w/2,0,0,1,1,1,cs*Math.PI/2);g.dispose();
 const A=SIDE141AWN[fkey];if(lod||!A)return;const[PW,PH]=A.px;b.push(cs*w/2,0,0,cs*Math.PI/2);awnings141(b,A.awn,p=>p/PW*d-d/2,p=>(PH-p)/PH*H,0);b.pop();
}
// V141 F3b: the focal spire's shaft base (bc/scripts/facade141/spire141.py blueprints): S = Gothic portal + revolving door, W = granite
// base with four shopfronts (real awnings) + side door. w/H = blueprint metres; cutv = where the flat upper atlas quad takes over.
export const SPIRE141={S:{geo:null,g:'SPS',w:22.6378,H:19.3675,cutv:.26819,px:[768,597]},
 W:{geo:null,g:'SPW',w:23.9,H:14.7734,cutv:.20458,px:[1002,456],awn:{bays:[[40,196],[225,390],[420,586],[614,778]],top:239}}};
// batch frame = face plane (x along the face, z out); fw = face width, yc = cut height (geometry scaled to fit)
export function soho141Spire(b,f,lod,fw,yc){const F=SPIRE141[f],key='sp'+f;addSoho141Materials(b.mats,key);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(F.geo.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(F.geo.uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(F.geo.nrm,3));
 b.add(g,'soho141'+key,0,0,0,fw/F.w,yc/F.H,1);g.dispose();
 if(lod||!F.awn)return;const[PW,PH]=F.px;awnings141(b,F.awn,p=>p/PW*fw-fw/2,p=>(PH-p)/PH*yc,0);
}
// V141 F4 streaming: geometry tables load on demand; exit-scene holds SoHo blocks in its queue until soho141Ready()
let loadP=null,ready=false,failed=false;
export function soho141Ready(){return ready||!soho141On();}
export function soho141Load(){return loadP??=import('./soho141-geo.js?v=141h').then(({GEO141:G})=>{for(const t of[SOHO141,SIDE141,SPIRE141])for(const e of Object.values(t))e.geo=G[e.g];ready=true;}).catch(err=>{console.warn('[soho141] facade tables failed, old flat facades',err);failed=true;});}
export function soho141On(){return !failed&&!/[?&]fac141=0\b/.test(globalThis.location?.search||'');}
function tex(name,srgb=true,rep=false){const t=new T.TextureLoader().load(A+name+'.webp?v=141b');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function addSoho141Materials(m,key){
 if(!m['soho141'+key])m['soho141'+key]=new T.MeshStandardMaterial({map:tex(key+'-alb'),normalMap:tex(key+'-nrm',false),roughnessMap:tex(key+'-orm',false),roughness:1,metalness:0,vertexColors:true});
 if(m.soho141Iron)return m;
 m.soho141Iron=new T.MeshStandardMaterial({map:tex('iron-alb',true,true),normalMap:tex('iron-nrm',false,true),roughnessMap:tex('iron-orm',false,true),metalnessMap:tex('iron-orm',false,true),roughness:1,metalness:1,vertexColors:true});
 m.soho141Grate=new T.MeshStandardMaterial({map:tex('grate-alb',true,true),normalMap:tex('grate-nrm',false,true),alphaTest:.5,side:T.DoubleSide,roughness:.7,metalness:.3,vertexColors:true});
 m.soho141Awning=new T.MeshStandardMaterial({map:tex('awning-alb',true,true),normalMap:tex('awning-nrm',false,true),normalScale:new T.Vector2(.6,.6),side:T.DoubleSide,roughness:.92,metalness:0,vertexColors:true});
 return m;
}
// raw triangle soup -> BufferGeometry (positions, uvs, flat normals from the triangle winding)
function soup(pos,uv){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
function quadGeo(p,uv){return soup([...p[0],...p[1],...p[2],...p[0],...p[2],...p[3]],[...uv[0],...uv[1],...uv[2],...uv[0],...uv[2],...uv[3]]);}
// horizontal grating plate (uv in metres -> 1 m texture tile)
function plate(b,x0,x1,y,z0,z1){const g=quadGeo([[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0]],[[x0,z1],[x1,z1],[x1,z0],[x0,z0]]);b.add(g,'soho141Grate',0,0,0);g.dispose();}
const rail=(b,a,c,r=.022)=>b.rod('soho141Iron',a,c,r);
function fireEscape141(b,F,X,Y,zf){const x0=X(F.x0),x1=X(F.x1),zb=zf+.22,zo=zf+1.35,lv=F.levels.map(p=>Y(p)-.1);
 for(let k=0;k<lv.length;k++){const y=lv[k];
  plate(b,x0,x1,y,zb,zo);
  for(const[a,c]of[[[x0,y,zo],[x1,y,zo]],[[x0,y,zb],[x0,y,zo]],[[x1,y,zb],[x1,y,zo]]])rail(b,a,c,.035);          // angle-iron frame
  for(const yy of[1.0,.52]){rail(b,[x0,y+yy,zo],[x1,y+yy,zo],yy>.9?.024:.016);rail(b,[x0,y+yy,zb],[x0,y+yy,zo],.018);rail(b,[x1,y+yy,zb],[x1,y+yy,zo],.018);}
  const n=Math.max(2,Math.round((x1-x0)/.45));for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;rail(b,[x,y,zo],[x,y+1.0,zo],.011);}
  for(let i=1;i<3;i++){const z=zb+(zo-zb)*i/3;rail(b,[x0,y,z],[x0,y+1.0,z],.011);rail(b,[x1,y,z],[x1,y+1.0,z],.011);}
  for(const x of[x0+.12,x1-.12,(x0+x1)/2])rail(b,[x,y-.95,zf+.21],[x,y-.02,zo-.08],.028);                        // brackets
  if(k<lv.length-1){const yt=lv[k+1],h=yt-y,run=Math.min(x1-x0-.5,h*1.05),left=k%2===0,xs=left?x0+.2:x1-.2,xe=left?xs+run:xs-run,za=zo-.68,zc=zo-.08;
   rail(b,[xs,y,za],[xe,yt,za],.03);rail(b,[xs,y,zc],[xe,yt,zc],.03);                                            // stringers
   rail(b,[xs,y+.9,zc],[xe,yt+.9,zc],.018);rail(b,[xs,y+.06,zc],[xs,y+.9,zc],.016);                              // handrail + post
   const nt=Math.max(3,Math.round(h/.21));for(let t=1;t<nt;t++){const f=t/nt,x=xs+(xe-xs)*f,yy=y+h*f,dx=(xe-xs)/nt*.45;plate(b,Math.min(x-dx,x+dx),Math.max(x-dx,x+dx),yy,za,zc);}}
 }
 // counterweighted drop ladder hanging from the lowest platform (kept above the awnings)
 const y0=lv[0],lx=x1-.45,zl=zo-.12,bot=y0-1.55;for(const sx of[lx-.2,lx+.2])rail(b,[sx,bot,zl],[sx,y0+.9,zl],.02);
 for(let y=bot+.12;y<y0+.85;y+=.3)rail(b,[lx-.2,y,zl],[lx+.2,y,zl],.012);
}
function awnings141(b,W,X,Y,zf){const yt=Y(W.top)-.04,D=1.35,yf=yt-1.0,vh=.32,z0=zf+.03,z1=zf+D;
 for(const[a,c]of W.bays){const xa=X(a)-.05,xb=X(c)+.05,ru=(xb-xa)/1.2;
  let g=quadGeo([[xa,yt,z0],[xb,yt,z0],[xb,yf,z1],[xa,yf,z1]],[[0,1],[ru,1],[ru,.25],[0,.25]]);b.add(g,'soho141Awning',0,0,0);g.dispose();   // slope
  g=quadGeo([[xa,yf-vh,z1],[xb,yf-vh,z1],[xb,yf,z1],[xa,yf,z1]],[[0,0],[ru,0],[ru,.25],[0,.25]]);b.add(g,'soho141Awning',0,0,0);g.dispose(); // valance
  for(const x of[xa,xb]){g=soup([x,yt,z0,x,yf,z1,x,yf-vh,z1],[0,1,.9,.25,.9,0]);b.add(g,'soho141Awning',0,0,0);g.dispose();}         // side panels
  rail(b,[xa,yf,z1],[xb,yf,z1],.025);for(const x of[xa+.08,xb-.08])rail(b,[x,yt-1.25,zf+.02],[x,yf+.02,z1-.04],.02);                  // front bar + arms
  rail(b,[xa,yt,z0+.02],[xb,yt,z0+.02],.03);}                                                                                         // roller bar at the wall
}
// spec: the soho135 lot (batch pushed to the lot centre at sidewalk level, +z = street); zf = front plane; lod 0 adds the props
export function soho141Build(b,spec,lod,fkey){const F=SOHO141[fkey],w=spec.w,H=spec.soho135.H,zf=spec.d/2,[PW,PH]=F.px;
 addSoho141Materials(b.mats,fkey);const X=p=>p/PW*w-w/2,Y=p=>(PH-p)/PH*H;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(F.geo.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(F.geo.uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(F.geo.nrm,3));
 b.add(g,'soho141'+fkey,0,0,zf);g.dispose();
 if(lod)return;if(F.fe)fireEscape141(b,F.fe,X,Y,zf);if(F.awn)awnings141(b,F.awn,X,Y,zf);
}
