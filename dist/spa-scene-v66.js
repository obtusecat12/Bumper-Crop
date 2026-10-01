import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bevelBox,worldUV} from './bath-v61-materials.js?v=61';
import {spaMaterials,spaTextures} from './spa-materials-v66.js';
import {SPA,SPA_ENTRY,SPA_NICHES,SPA_SPILL,inSpaWater} from './spa-layout-v66.js';
import {springTextures} from './level27-materials.js?v=63';
import {createSpaWater} from './spa-water-v66.js';
import {createSpaBloom} from './spa-bloom-v65.js';
import {createSpringVolume} from './spring-volume-v65.js';
import {createSpaStatues} from './spa-statues-v65.js';
import {createSpaRock} from './spa-rock-v66.js';
import {createSpaFurniture} from './spa-furniture-v66.js';
import {createSpaAudio} from './spa-audio-v66.js';
import {createSpaReflections} from './spa-reflections-v66.js';
// Warm changing room, concealed cool ceiling bounce, and real submerged lamps.
export const SPA_LIGHTS=[
 {p:[7.8,2.5,-3.72],color:0xb7e5ec,power:5.4,range:6.4,shadow:true},
 {p:[10.95,2.52,-1.15],color:0x79bace,power:3.2,range:5.2},
 {p:[11.85,2.33,4.35],color:0xffb875,power:6.0,range:4.0},
 {p:[8.55,-.36,-2.80],color:0x22c5ed,power:3.4,range:5.8},
 {p:[9.0,2.52,2.05],color:0xb3cbd0,power:2.0,range:3.9}
];
function ringGeometry(inner,outer,y0,y1,segments=144){
 const p=[],uv=[],idx=[];
 for(let j=0;j<4;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=j<2?inner:outer,y=j%2?y1:y0;p.push(SPA.cx+Math.cos(a)*r,y,SPA.cz+Math.sin(a)*r);uv.push(a*r*3.2,(y+Math.abs(r-inner))*3.2);}
 for(const [l,k]of[[0,1],[1,3],[3,2],[2,0]])for(let i=0;i<segments;i++){const a=l*(segments+1)+i,b=k*(segments+1)+i;idx.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function roundedCoping(){const p=[],uv=[],idx=[],n=144,cross=[[2.30,-.075],[2.30,.003],[2.32,.035],[2.48,.035],[2.52,.005],[2.52,-.05]];for(let j=0;j<cross.length;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,[r,y]=cross[j];p.push(SPA.cx+Math.cos(a)*r,y,SPA.cz+Math.sin(a)*r);uv.push(a*r*3.2,j*.064);}for(let j=0;j<cross.length-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}


function roundedRect(x0,z0,x1,z1,r=.22){const s=new T.Shape(),y0=-z1,y1=-z0;s.moveTo(x0+r,y0);s.lineTo(x1-r,y0);s.quadraticCurveTo(x1,y0,x1,y0+r);s.lineTo(x1,y1-r);s.quadraticCurveTo(x1,y1,x1-r,y1);s.lineTo(x0+r,y1);s.quadraticCurveTo(x0,y1,x0,y1-r);s.lineTo(x0,y0+r);s.quadraticCurveTo(x0,y0,x0+r,y0);return s;}
function archShape(r,spring,height,halfWidth){const s=new T.Shape();s.moveTo(-halfWidth,0);s.lineTo(-r,0);s.lineTo(-r,spring);for(let i=0;i<=40;i++){const a=Math.PI-Math.PI*i/40;s.lineTo(Math.cos(a)*r,spring+Math.sin(a)*r);}s.lineTo(r,0);s.lineTo(halfWidth,0);s.lineTo(halfWidth,height);s.lineTo(-halfWidth,height);s.closePath();return s;}
export function createSpa(scene){
 const architecture=new T.Group();architecture.name='V66 continuous spa nook, vestibule and lounge';scene.add(architecture);const m=spaMaterials(),textures=spaTextures();
 const inventory=[];
 const add=(g,mat,name)=>{const o=new T.Mesh(g,mat);o.name=name;o.castShadow=o.receiveShadow=true;architecture.add(o);inventory.push({name,vertices:g.attributes.position.count});return o;};
 const box=(mat,x,y,z,w,h,d,name,r=.023)=>{const g=bevelBox(w,h,d,r);worldUV(g,mat===m.mosaic?1/3.2:1);const o=add(g,mat,name);o.position.set(x,y,z);return o;};
 const extrude=(shape,depth,mat,name,bevel=.018)=>{const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:bevel,bevelSize:bevel,curveSegments:28});worldUV(g,mat===m.mosaic?1/3.2:1);return add(g,mat,name);};
 const flat=(shape,y,depth,mat,name,bevel=.025)=>{const o=extrude(shape,depth,mat,name,bevel);o.rotation.x=-Math.PI/2;o.position.y=y;return o;};
 // Deck is a single triangulated surface with a circular aperture for the
 // pool AND drain bed. No land or floating plane crosses the water surface.
 const shape=new T.Shape();shape.moveTo(SPA.x0,-SPA.z0);shape.lineTo(SPA.x1,-SPA.z0);shape.lineTo(SPA.x1,-SPA.z1);shape.lineTo(SPA.x0,-SPA.z1);shape.closePath();const aperture=new T.Path();aperture.absarc(SPA.cx,-SPA.cz,2.76,0,Math.PI*2,true);shape.holes.push(aperture);const deck=new T.ShapeGeometry(shape,144);deck.rotateX(-Math.PI/2);worldUV(deck,1);add(deck,m.floor,'One-piece spa deck around true recessed pool');
 const base=new T.CircleGeometry(2.321,144);base.rotateX(-Math.PI/2);base.translate(SPA.cx,SPA.bottomY,SPA.cz);worldUV(base,1/3.2);add(base,m.mosaic,'Sunken blue mosaic pool bottom');
 const bowl=new T.LatheGeometry([[2.25,-.99],[2.28,-.985],[2.303,-.965],[2.317,-.940],[2.32,-.91],[2.32,.002]].map(q=>new T.Vector2(...q)),144);const bi=bowl.index;for(let i=0;i<bi.count;i+=3){const b=bi.getX(i+1);bi.setX(i+1,bi.getX(i+2));bi.setX(i+2,b);}bowl.computeVertexNormals();const bu=bowl.attributes.uv,bp=bowl.attributes.position;for(let i=0;i<bu.count;i++)bu.setXY(i,bu.getX(i)*Math.PI*2*2.32*3.2,(bp.getY(i)+.99)*3.2);bowl.translate(SPA.cx,0,SPA.cz);add(bowl,m.mosaic,'Coved continuous blue mosaic retaining shell');add(roundedCoping(),m.mosaic,'Rolled blue mosaic pool coping');
 add(ringGeometry(2.51,2.76,-.065,-.051),m.dark,'Recessed drainage channel in deck aperture');
 for(let i=0;i<252;i++){const a=i/252*Math.PI*2,r=2.64;const bar=box(m.marble,SPA.cx+Math.cos(a)*r,.004,SPA.cz+Math.sin(a)*r,.014,.021,.21,'Grounded radial drain grille',.004);bar.rotation.y=-a+Math.PI/2;}
 for(const z of[-2.60,-.70])box(m.sandstone,4.25,1.13,z,.25,2.26,.075,'Beveled physical doorway reveal');box(m.sandstone,4.25,2.275,-1.65,.25,.095,1.975,'Rounded physical doorway header');
 // Six radial inset steps share the same projection and heights as collision.
 const c=Math.cos(SPA_ENTRY.angle),s=Math.sin(SPA_ENTRY.angle);for(let i=0;i<6;i++){const r=SPA_ENTRY.start-(i+.5)*SPA_ENTRY.tread,top=-(i+1)*SPA_ENTRY.rise,step=box(m.mosaic,SPA.cx+c*r,(top+SPA.bottomY)/2,SPA.cz+s*r,SPA_ENTRY.tread+.006,top-SPA.bottomY+.012,SPA_ENTRY.width,'Submerged curved-entry mosaic step '+(i+1),.014);step.rotation.y=-SPA_ENTRY.angle;}
 // Chrome tubes include curved grip, under-water return, flanged deck anchors
 // and bolt heads; all ends terminate in the coping or a physical stair.
 for(const across of[-.57,.57]){const pts=[[2.68,.015],[2.68,.68],[2.57,.92],[2.37,1.01],[2.11,.88],[1.56,.38],[1.19,-.94]].map(([r,y])=>new T.Vector3(SPA.cx+c*r-s*across,y,SPA.cz+s*r+c*across));const tube=new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.028,12,false);add(tube,m.chrome,'Polished curved chrome pool handrail');for(const [r,y]of[[2.68,.019],[1.19,-.978]]){const x=SPA.cx+c*r-s*across,z=SPA.cz+s*r+c*across,o=add(new T.CylinderGeometry(.075,.075,.025,32),m.chrome,'Seated steel handrail flange');o.position.set(x,y,z);for(let j=0;j<4;j++){const a=j*Math.PI/2,bolt=add(new T.CylinderGeometry(.008,.009,.012,6),m.chrome,'Physical anchor bolt');bolt.position.set(x+Math.cos(a)*.054,y+.019,z+Math.sin(a)*.054);}}}
 // Short low vestibule gives an uninterrupted, partially concealed threshold.
 for(const [z,d]of[[-4.20,3.2],[-.22,.96]])box(m.wall,4.295,1.60,z,.065,3.20,d,'Shared old-pool wall, tiled spa face');
 box(m.wall,4.295,2.75,-1.65,.065,.94,1.90,'Continuous old-pool doorway lintel');
 box(m.wall,5.21,1.33,-.27,2.11,2.66,.26,'Vestibule return / hides service volume');
 box(m.ceiling,5.30,2.76,-1.54,2.20,.20,2.20,'Low ceiling joined to old doorway');
 box(m.navy,5.30,.11,-.415,2.13,.22,.035,'Coved vestibule plinth');
 box(m.wall,6.17,1.38,2.29,.20,2.76,5.05,'Solid lounge west return');
 box(m.wall,8.02,1.39,4.02,3.82,2.78,.22,'Lounge rear return / turn towards changing room');
 box(m.stone,8.53,1.60,-5.77,8.83,3.20,.22,'Continuous rear wall bonded behind cliff and lightbox');
 box(m.wall,12.96,1.60,-.26,.15,3.20,10.13,'Recess backs / solid building envelope');
 box(m.wood,11.37,1.38,4.89,3.24,2.76,.18,'Cedar changing-room back wall');
 box(m.wall,9.74,1.36,4.29,.20,2.72,1.25,'Changing-room dogleg return');
 box(m.navy,8.07,.105,3.875,3.68,.21,.08,'Rounded lounge skirting');
 // Three actual openings through the right wall, with curved mosaic seats.
 for(const z of SPA_NICHES){
  const opening=extrude(archShape(.94,1.30,2.90,1.285),.31,m.wall,'Shallow arched niche / solid cut-out wall');opening.position.set(12.43,0,z);opening.rotation.y=-Math.PI/2;
  const back=extrude(archShape(.88,1.30,2.57,1.02),.09,m.navy,'Recessed blue ceramic arch reveal',.02);back.position.set(12.84,0,z);back.rotation.y=-Math.PI/2;
  box(m.wall,12.91,1.27,z,.10,2.54,1.88,'Inset niche back wall');
  const seat=new T.Shape();seat.moveTo(12.84,-z-.91);seat.lineTo(12.84,-z+.91);
  for(let i=0;i<=36;i++){const q=.91-i/36*1.82;seat.lineTo(12.02+.20*(q/.91)**2,-z+q);}seat.closePath();flat(seat,.03,.405,m.mosaic,'Coved curved warm-mosaic bench',.045);
  // Deep framed sun relief: generated art, displaced physical surface, brass reveal.
  for(const [yy,zz,w,h]of[[1.59,z-.322,.048,.686],[1.59,z+.322,.048,.686],[1.268,z,.69,.05],[1.912,z,.69,.05]])box(m.navy,12.816,yy,zz,.046,h,w,'Sun picture navy inset border',.008);
  for(const [yy,zz,w,h]of[[1.59,z-.294,.019,.607],[1.59,z+.294,.019,.607],[1.296,z,.607,.019],[1.884,z,.607,.019]])box(m.brass,12.795,yy,zz,.032,h,w,'Fine brass picture-frame bead',.006);
  const reliefMat=m.sun.clone();reliefMat.displacementMap=textures['golden-sun-art'];reliefMat.displacementScale=.019;reliefMat.displacementBias=-.007;
  const relief=add(new T.PlaneGeometry(.57,.57,40,40),reliefMat,'Generated sun-face relief / actual displaced surface');relief.position.set(12.791,1.59,z);relief.rotation.y=-Math.PI/2;
  // Narrow waterproof downlight is set into the niche soffit, never floating.
  const trim=add(new T.TorusGeometry(.055,.010,8,24),m.brass,'Recessed waterproof downlight trim');trim.position.set(12.42,2.355,z);trim.rotation.x=Math.PI/2;
  const lens=add(new T.CircleGeometry(.043,24),m.warm,'Warm deeply recessed downlight lens');lens.rotation.x=Math.PI/2;lens.position.set(12.42,2.386,z);lens.castShadow=false;
  const spot=new T.SpotLight(0xffcb8c,1.05,1.94,.34,.58,2);spot.name='Narrow warm niche downlight';spot.position.set(12.41,2.38,z);spot.target.position.set(12.36,.38,z);scene.add(spot,spot.target);
 }
 // Dark turquoise dado and a cream cove make the architectural rhythm legible.
 for(const [x,z,w,d]of[[12.12,-2.57,.075,6.45],[6.32,2.23,.075,3.64],[8.02,3.88,3.71,.075]])box(m.navy,x,.11,z,w,.22,d,'Continuous glazed dado with rounded nose',.018);
 // Enclosing low arcade between wet alcove and quieter lounge. Broad elliptical
 // arch is structural: its ends enter floor piers and its crown meets the roof.
 for(const x of[6.42,12.12]){box(m.wall,x,1.275,.53,.43,2.55,.50,'Rounded structural arcade pier',.055);box(m.navy,x,.11,.53,.49,.22,.55,'Blue tiled arcade plinth',.025);box(m.marble,x,2.03,.53,.55,.17,.62,'Arcade impost moulding',.025);}
 const arcade=new T.Shape();arcade.moveTo(-2.63,0);for(let i=0;i<=64;i++){const a=Math.PI-i/64*Math.PI;arcade.lineTo(Math.cos(a)*2.63,Math.sin(a)*.72);}arcade.lineTo(2.95,0);arcade.lineTo(2.95,1.18);arcade.lineTo(-2.95,1.18);arcade.lineTo(-2.95,0);arcade.closePath();const archway=extrude(arcade,.49,m.wall,'Soft elliptical arcade / pool nook threshold',.036);archway.position.set(9.27,2.03,.28);
 // Continuous stepped ceiling: broad perimeter soffit, rounded inner opening,
 // hidden emitter shelf and full higher receiver ceiling above it.
 box(m.ceiling,9.55,3.25,-2.55,7.0,.19,6.35,'Continuous upper spa ceiling');
 const ring=roundedRect(6.14,-5.66,12.93,.85,.22),hole=roundedRect(6.82,-4.95,11.80,-.02,.37);ring.holes.push(new T.Path(hole.getPoints(56)));flat(ring,2.77,.28,m.ceiling,'Rounded recessed soffit integrated into all walls',.034);
 const shelf=roundedRect(6.56,-5.28,12.11,.33,.30),inside=roundedRect(6.84,-4.97,11.82,-.01,.37);shelf.holes.push(new T.Path(inside.getPoints(56)));flat(shelf,2.945,.032,m.glow,'Concealed cyan perimeter cove emitter',.008);
 box(m.ceiling,9.54,2.90,2.61,6.99,.25,4.52,'Lower lounge and changing-room ceiling');
 for(const z of[1.03,3.62]){box(m.navy,9.60,2.70,z,6.92,.14,.17,'Shallow lounge ceiling cross-rib',.025);box(m.glow,9.60,2.795,z+.15,6.82,.021,.026,'Hidden dim blue lounge cove',.005);}
 // Curved drainage, small underwater niches and massage jets are physically seated.
 for(const a of[.10,2.2,3.7,4.9]){const x=SPA.cx+Math.cos(a)*2.29,z=SPA.cz+Math.sin(a)*2.29;const lamp=add(new T.CircleGeometry(.085,24),m.glow,'Underwater recessed blue opal fixture');lamp.position.set(x,-.43,z);lamp.lookAt(SPA.cx,-.43,SPA.cz);const flange=add(new T.TorusGeometry(.092,.010,8,24),m.chrome,'Waterproof lamp retaining ring');flange.position.copy(lamp.position);flange.quaternion.copy(lamp.quaternion);}
 for(const a of[.4,1.8,3.5,5.1]){const x=SPA.cx+Math.cos(a)*1.8,z=SPA.cz+Math.sin(a)*1.8;const jet=add(new T.CylinderGeometry(.034,.040,.03,18),m.chrome,'Grounded underwater massage nozzle');jet.position.set(x,SPA.bottomY+.014,z);}
 const rock=add(createSpaRock(T),m.rock,'One continuous fractured limestone wall / structural terrace');
 rock.userData.hero=true;
 // Lip grows from the continuous limestone bracket, both films fall vertically.
 box(m.acrylic,7.57,1.036,-4.40,1.14,.052,.40,'Embedded cyan acrylic spillway / visible cantilever',.013);
 box(m.dark,7.57,1.053,-4.44,1.05,.012,.275,'Wet dark spillway bed',.003);
 for(const x of[7.005,8.135])box(m.acrylic,x,1.083,-4.40,.034,.099,.40,'Polished acrylic spillway cheek',.008);
 // Thick rubble mosaic arch wall, tightly adjoining limestone to its left.
 const ax=9.72,az=-5.39,inner=1.22,outer=1.49,spring=1.30;
 const surround=extrude(archShape(inner,spring,3.16,1.70),.30,m.stone,'Thick pebble-mosaic Roman lightbox surround',.025);surround.position.set(ax,0,az-.14);
 for(const x of[ax-inner-.132,ax+inner+.132]){for(let i=0;i<5;i++)box(m.sandstone,x,(i+.5)*.25,az+.046,.27,.243,.43,'Weathered beveled Roman pier block',.020);box(m.sandstone,x,.06,az+.046,.42,.12,.52,'Grounded Roman pier plinth',.026);box(m.sandstone,x,1.275,az+.046,.45,.12,.52,'Rounded classical impost',.022);}
 for(let i=0;i<21;i++){const a=i/21*Math.PI+.004,b=(i+1)/21*Math.PI-.004,sh=new T.Shape();sh.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);for(let j=1;j<=5;j++){const q=a+(b-a)*j/5;sh.lineTo(Math.cos(q)*inner,Math.sin(q)*inner);}sh.lineTo(Math.cos(b)*outer,Math.sin(b)*outer);for(let j=1;j<=5;j++){const q=b-(b-a)*j/5;sh.lineTo(Math.cos(q)*outer,Math.sin(q)*outer);}sh.closePath();const o=extrude(sh,.36,m.sandstone,'Chamfered Roman arch voussoir '+i,.016);o.position.set(ax,spring,az-.12);}
 const painting=new T.Shape();painting.moveTo(-inner,0.16);painting.lineTo(-inner,spring);for(let i=0;i<=72;i++){const a=Math.PI-Math.PI*i/72;painting.lineTo(Math.cos(a)*inner,spring+Math.sin(a)*inner);}painting.lineTo(inner,.16);painting.closePath();
 const mg=new T.ShapeGeometry(painting,72),mp=mg.attributes.position,mu=mg.attributes.uv;for(let i=0;i<mp.count;i++)mu.setXY(i,(mp.getX(i)+inner)/(inner*2),(mp.getY(i)-.16)/(spring+inner-.16));
 const mural=add(mg,m.mural,'Backlit Venice perspective window / generated artwork');mural.position.set(ax,0,az-.12);mural.castShadow=false;
 box(m.navy,ax,.11,az+.12,2.39,.22,.42,'Deep blue lightbox sill',.022);
 const hood=box(m.brass,ax,2.84,az+.08,3.07,.065,.47,'Down-tilted lightbox glare hood',.017);hood.rotation.x=-.14;
 box(m.stone,8.19,1.6,-5.45,.30,3.2,.46,'Rock-to-mosaic structural bond / buried return');
 // The glass-block screen is an actual staggered grid with mortar webs. Behind
 // it, cedar benches and a dogleg door leave the destination partly concealed.
 const gx0=10.98,gz=3.40,step=.198,rows=12,cols=10;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const block=box(m.glass,gx0+step*(col+.5),.145+step*(row+.5),gz,.189,.189,.115,'Pressed wavy glass block '+row+'/'+col,.015);
  // Preserve 0..1 face UVs for individual pressed blocks rather than tiny repeats.
  const p=block.geometry.attributes.position,n=block.geometry.attributes.normal,uv=block.geometry.attributes.uv;for(let i=0;i<p.count;i++)if(Math.abs(n.getZ(i))>.6)uv.setXY(i,p.getX(i)/.189+.5,p.getY(i)/.189+.5);
 }
 for(let i=0;i<=cols;i++)box(m.ceramic,gx0+step*i,1.334,gz,.011,2.386,.123,'Glass-block vertical mortar joint',.003);
 for(let i=0;i<=rows;i++)box(m.ceramic,gx0+.99,.145+step*i,gz,2.00,.012,.123,'Glass-block horizontal mortar joint',.003);
 box(m.marble,gx0+.99,2.752,gz,2.08,.225,.22,'Solid glass-screen transom bonded to soffit',.022);box(m.marble,gx0-.014,1.32,gz,.10,2.64,.16,'Grounded glass-screen end post',.018);
 box(m.marble,gx0+.99,.073,gz,2.08,.146,.21,'Grounded glass-block sill',.022);box(m.marble,gx0+.99,2.59,gz,2.08,.14,.20,'Glass-block header connected to ceiling',.022);
 box(m.wood,11.59,.41,4.51,2.22,.12,.61,'Warm cedar changing bench');for(const x of[10.65,12.50])box(m.wood,x,.175,4.51,.075,.35,.43,'Cedar bench grounded support');
 for(let j=0;j<9;j++)box(m.wood,11.48,1.43+j*.134,4.774,2.93,.111,.039,'Cedar room wall plank',.008);
 for(const z of[3.82,4.13,4.44])box(m.wood,12.79,1.09,z,.068,2.15,.045,'Cedar vertical wall batten');
 for(const x of[10.51,11.51,12.43]){const hook=add(new T.TorusGeometry(.032,.009,7,16,Math.PI*1.3),m.brass,'Changing-room brass hook');hook.position.set(x,1.73,4.735);}
 const furniture=createSpaFurniture(T,m);furniture.traverse(o=>{if(o.isGroup&&o.name.includes('wall hook and hanging cloth'))o.position.x=-.188;});architecture.add(furniture);
 const statues=createSpaStatues(T,{textures:{marble:textures['spa-marble'],marbleNormal:textures['spa-marble-normal'],marbleRoughness:textures['spa-marble-roughness']}});statues.group.position.set(6.88,1.18,-4.73);scene.add(statues.group);
 const water=createSpaWater(T,{textures:springTextures(),poolCenter:[SPA.cx,SPA.cz],radius:SPA.radius,waterY:SPA.waterY,bottomY:SPA.bottomY,outlet:SPA_SPILL.outlet,outletWidth:SPA_SPILL.width,landingWidth:.84,impact:SPA_SPILL.impact});scene.add(water.group);water.group.traverse(o=>o.layers.set(3));
 const steam=createSpringVolume(T,{waterY:SPA.waterY,poolPlan:Array.from({length:80},(_,i)=>[SPA.cx+Math.cos(i*Math.PI/40)*2.315,SPA.cz+Math.sin(i*Math.PI/40)*2.315]),lights:SPA_LIGHTS.slice(0,4),density:.55,extinction:1.65,performanceProfile:{scale:.25,raySteps:20,reflectionRaySteps:16,simulationHz:20,lightingHz:8}});
 const sound=createSpaAudio();
 const reflections=createSpaReflections(T,{wetTexture:m.wetTexture,marks:m.marks,clock:m.clock});
 const bloom=createSpaBloom(T,{strength:.19,threshold:1.10,cameraMinX:-100});
 const lights=SPA_LIGHTS.map(l=>{const o=new T.PointLight(l.color,l.power,l.range,2);o.position.fromArray(l.p);o.castShadow=!!l.shadow;o.shadow.mapSize.set(512,512);o.shadow.bias=-.0008;o.shadow.normalBias=.02;scene.add(o);return o;});
 const portalBounds=new T.Box3(new T.Vector3(3.94,0,-2.62),new T.Vector3(4.47,2.34,-.68)),viewFrustum=new T.Frustum(),viewMatrix=new T.Matrix4();
 // Compatible static meshes share a material batch. Transparency and shadow
 // flags stay separate; instancing and cloth/leaf attributes are retained.
 architecture.updateMatrixWorld(true);const batches=new Map(),sourceMeshes=[];architecture.traverse(o=>{if(o.isMesh)sourceMeshes.push(o);});
 for(const o of sourceMeshes){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const sig=o.material.uuid+'|'+Object.keys(g.attributes).sort().join(',')+'|'+o.castShadow+'|'+o.receiveShadow;let b=batches.get(sig);if(!b){b={mat:o.material,parts:[],cast:o.castShadow,receive:o.receiveShadow,names:[]};batches.set(sig,b);}b.parts.push(g);b.names.push(o.name);o.geometry.dispose();}
 architecture.clear();for(const b of batches.values()){const merged=mergeGeometries(b.parts);if(!merged)throw new Error('Incompatible V66 architecture batch');const o=add(merged,b.mat,b.mat.name+' / batched geometry');o.castShadow=b.cast;o.receiveShadow=b.receive;o.userData.sourceNames=b.names;b.parts.forEach(g=>g.dispose());}
 let time=0,last=0,visible=true,environment=null,environmentReady=false,footIndex=0,wetUntil=0,lastFoot=new T.Vector2(-100,-100);const stats={visible:true,staticDraws:batches.size,water:water.stats,steam:steam.diagnostics,inventory,furniture:furniture.userData};
 function setView(camera){camera.updateMatrixWorld();viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));visible=camera.position.x>4.0||viewFrustum.intersectsBox(portalBounds);stats.visible=visible;
  // Opaque architecture always exists across the doorway. GPU frustum culling
  // handles its batches; only costly water/post passes use the portal test.
  architecture.visible=true;statues.group.visible=true;water.group.visible=visible;const old=scene.getObjectByName('Bathhouse architecture and furniture');if(old)old.visible=camera.position.x<4.45||viewFrustum.intersectsBox(portalBounds);return visible;
 }
 function update(t,player){const dt=Math.min(.05,Math.max(0,t-last));last=t;time=t;m.clock.value=t;if(visible)water.update(t,dt);
  if(player&&player.x>4.1){if(inSpaWater(player.x,player.z))wetUntil=t+32;const r=Math.hypot(player.x-SPA.cx,player.z-SPA.cz);if(t<wetUntil&&r>2.40&&lastFoot.distanceTo(new T.Vector2(player.x,player.z))>.36){const side=footIndex%2?1:-1,a=player.yaw||0; m.marks.value[footIndex%12].set(player.x+Math.cos(a)*.075*side,player.z-Math.sin(a)*.075*side,t,-a);lastFoot.set(player.x,player.z);footIndex++;}}
 }
 function prepare(renderer,camera){setView(camera);if(visible)water.prepare(renderer);
  if(visible&&!environmentReady&&typeof renderer.getActiveCubeFace==='function'){environmentReady=true;environment=new T.WebGLCubeRenderTarget(128,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});const cube=new T.CubeCamera(.08,15,environment);cube.position.set(9.0,1.25,-2.30);const saved=renderer.getRenderTarget(),oldAuto=renderer.shadowMap.autoUpdate,oldNeeds=renderer.shadowMap.needsUpdate;try{renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;cube.update(renderer,scene);for(const mat of[m.chrome,m.acrylic,m.glass,m.floor,m.ceramic,m.brass,...Object.values(statues.materials)]){mat.envMap=environment.texture;mat.envMapIntensity=.68;mat.needsUpdate=true;}}finally{renderer.setRenderTarget(saved);renderer.shadowMap.autoUpdate=oldAuto;renderer.shadowMap.needsUpdate=oldNeeds;}}
 }
 function compose(renderer,color,depth,camera,w,h){if(!visible)return color;let c=steam.compose(renderer,color,depth,camera,w,h,time);c=reflections.compose(renderer,c,depth,camera,w,h);return bloom.compose(renderer,c,depth,camera,w,h,time);}
 function dispose(){sound.dispose();environment?.dispose();water.dispose();steam.dispose();reflections.dispose();bloom.dispose();statues.group.traverse(o=>o.geometry?.dispose());architecture.traverse(o=>o.geometry?.dispose());for(const mat of new Set([...Object.values(m),...Object.values(statues.materials)]))if(mat?.isMaterial)mat.dispose();}
 return{group:architecture,statues,water,bloom,steam,reflections,lights,stats,materials:m,audio:sound.update,muteAudio:sound.mute,setView,update,prepare,compose,dispose};
}
