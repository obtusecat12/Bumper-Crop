import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {JUKEBOX80 as P} from './tiki-plan-v80.js';
import {jukeboxMaterials80} from './tiki-additions-materials-v80.js';

// Separate cabinet, recessed title carriage, real title strips and angled glass.
// Front is local +Z. A single merged mesh per finish keeps the 60 cards inexpensive.
export function createJukebox80(){
 const m=jukeboxMaterials80(),k=new TikiKit(m);
 m.jGlow.onBeforeCompile=s=>{s.vertexShader='varying float jHeight;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\njHeight=position.y;');s.fragmentShader='varying float jHeight;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.18+.82*smoothstep(.16,.85,jHeight);');};m.jGlow.customProgramCacheKey=()=> 'v80-amber-speaker-falloff';
 k.box('jBlack',0,.09,0,1.03,.18,.64,.045);k.box('jWood',0,.52,-.015,1.01,.77,.60,.028);
 k.box('jWood',0,1.28,-.278,1.02,.89,.07,.018);
 for(const side of[-1,1]){k.box('jWood',side*.492,1.27,0,.075,.9,.59,.025);k.box('jChrome',side*.509,.88,.298,.035,1.58,.052,.012);k.box('jBlack',side*.46,.07,0,.13,.13,.49,.02);}
 k.box('jBlack',0,1.711,0,1.055,.037,.61,.014);
 k.box('jRed',-.055,1.584,.282,.88,.203,.038,.018);
 for(const x of[-.509,.393,.511])k.box('jChrome',x,1.586,.31,.03,.213,.035,.008);
 for(const y of[1.477,1.70])k.box('jChrome',0,y,.313,1.048,.024,.028,.007);
 k.box('jBlack',.446,1.59,.301,.092,.11,.029,.009);
 k.box('jChrome',.447,1.594,.32,.041,.054,.011,.004);k.box('jBlack',.447,1.606,.327,.009,.031,.008,.002);
 // Lower speaker grille is recessed inside a continuous chrome surround.
 k.box('jBlack',0,.535,.301,.978,.726,.042,.018);
 k.plane('jGlow',0,.546,.327,.896,.608);
 k.plane('jGrille',0,.546,.342,.896,.608,[0,0,0],[0,0,1.8,1.25]);
 for(const s of[-1,1])k.box('jChrome',s*.465,.55,.35,.028,.695,.039,.009);
 for(const y of[.205,.895])k.box('jChrome',0,y,.35,.944,.035,.039,.01);
 k.box('jBlack',0,.245,.358,.59,.037,.021,.005);k.plane('jBand',0,.245,.370,.55,.027);
 // Title carriage is a slanted physical insert with small retaining rails.
 k.box('jBlack',-.053,1.238,.13,.875,.49,.17,.008);
 const slope=-.18;
 for(let c=0;c<5;c++)for(let r=0;r<12;r++){
  const x=-.390+c*.146,y=1.065+r*.0319,z=.292-(y-1.25)*.18;
  k.box('jIvory',x,y,z,.137,.029,.007,.002);
  const index=(c*7+r)%16,u=(index%4)/4,v=1-Math.floor(index/4)/4-.25;
  k.plane('jPaper',x,y,z+.0045,.131,.025,[slope,0,0],[u+.008,v+.025,.234,.20]);
 }
 for(let c=0;c<=5;c++)k.box('jChrome',-.465+c*.146,1.24,.316,.006,.43,.008,.002);
 for(const y of[1.031,1.456])k.box('jChrome',-.098,y,.295-(y-1.25)*.18,.78,.014,.018,.003);
 k.plane('jBand',-.052,.998,.342,.886,.070);
 // Independent coin service column at the right of the title window.
 k.box('jChrome',.439,1.243,.287,.110,.47,.069,.012);
 k.box('jBlack',.442,1.285,.328,.057,.272,.01,.005);
 for(const y of[1.22,1.35])k.box('jChrome',.442,y,.338,.027,.066,.01,.004);
 k.box('jBlack',.443,1.371,.344,.017,.004,.01,.001);
 k.cyl('jBlack',.432,1.037,.347,.021,.021,.017,12);
 // Window and its bright retaining edges remain separate from all paper cards.
 k.plane('jGlass',-.067,1.245,.338,.840,.441,[slope,0,0]);
 k.box('jWarm',-.058,1.465,.23,.836,.012,.013,.004);
 k.box('jBlack',0,.943,.314,.971,.103,.102,.018);
 for(let i=0;i<20;i++){
  const x=-.405+i*.0418;k.box('jChrome',x,.943,.378,.032,.026,.019,.006);
  k.box(i===10?'jWarm':'jIvory',x,.947,.39,.023,.012,.004,.002);
 }
 k.box('jChrome',0,.901,.375,.99,.018,.037,.004);
 // Vented rear casing, attached power inlet, cable and wall plug.
 for(let i=0;i<7;i++)k.box('jBlack',.525,.40+i*.045,-.045,.013,.014,.31,.003);
 k.box('jBlack',.27,.17,-.323,.059,.084,.030,.009);
 k.tube('jBlack',[[.27,.17,-.34],[.37,.025,-.365],[.59,.016,-.355],[.67,.016,-.29],[.69,.29,-.335]],.007,30);
 k.box('jIvory',.69,.30,-.336,.077,.117,.019,.006);k.box('jBlack',.69,.278,-.309,.037,.041,.038,.005);
 const root=k.finish('V80 / reference red-panel jukebox');root.position.set(P.x,0,P.z);root.rotation.y=P.yaw;
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;if(o.material===m.jGlass)o.renderOrder=7;}});
 // A bounded practical glow; no flicker, live shadow or extra refraction capture.
 const light=new T.PointLight(0xffc073,.26,2.2,2);light.position.set(0,.86,.305);root.add(light);
 root.userData.reference='image(20261004-072510).png';root.userData.titleCards=60;
 return{object:root,mats:m,dispose(){root.traverse(o=>o.geometry?.dispose());for(const mat of Object.values(m))mat.dispose();root.removeFromParent();}};
}
