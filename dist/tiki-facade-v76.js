import * as T from './vendor/three.module.min.js';
import {createSpaBloom} from './spa-bloom-v65.js';
import {tikiMaterials} from './tiki-materials-v76.js';
import {TikiKit,tikiIdol,coloredBulbs,disposeTiki} from './tiki-geometry-v76.js';
import {TIKI_FACADE as F,TIKI_WAYPOINT,tikiPoint} from './tiki-plan-v76.js';
export function createTikiFacade(){
 const m=tikiMaterials(),k=new TikiKit(m),D=F.doorX;
 // Only the frontage skin is replaced; the original structural building persists.
 k.box('bamboo',0,2.15,.095,F.width,3.94,.17);k.box('rock',0,.5,.21,F.width,1,.38,.04);
 for(let x=-12;x<12.1;x+=.52)for(let row=0;row<3;row++){if(Math.abs(x-D)<1.03)continue;k.stone(x+(row%2)*.16,.16+row*.32,.41,.58,.37,.28,row*19+x);}
 for(let x=-12.1;x<12.2;x+=.27){if(Math.abs(x-D)<.97)continue;k.cyl('bamboo',x,2.5,.265,.043,.052,2.84,8);for(const y of[1.18,2.01,2.90,3.73])k.cyl('wood',x,y,.265,.055,.055,.048,8);}
 // Paired shutter windows sit in substantial timber surrounds, with amber panes.
 for(const x of[-9.2,-5.5,-1.8,9.5]){k.box('wood',x,2.21,.36,2.8,1.63,.20,.035);k.plane('glass',x,2.21,.471,2.5,1.33);for(let i=-5;i<=5;i++){k.box('wood',x+i*.222,2.21,.53,.052,1.35,.15,.01,.28);}k.box('wood',x,1.38,.49,2.95,.14,.46);k.box('wood',x,3.04,.48,2.93,.17,.34);}
 // Continuous small eaves have physical support brackets and alpha-cut dry straw.
 for(let x=-12;x<12;x+=2){if(Math.abs(x-D)<3)continue;k.beam('wood',[x,3.55,.22],[x,3.9,1.0],.065);k.plane('thatch',x,3.98,.65,2.05,1.12,[-Math.PI/2+.18,0,0],[0,0,1,1],8);k.plane('fringe',x,3.74,1.13,2.08,.40,[0,0,0],[0,0,2,1]);}
 // Door is a complete framed leaf, not a black void painted onto the building.
 k.box('wood',D,1.26,.41,1.91,2.51,.28,.04);k.box('dark',D,1.25,.572,1.68,2.36,.075,.02);
 for(const side of[-1,1]){k.box('wood',D+side*.70,1.25,.62,.12,2.32,.11);k.box('wood',D+side*.39,.49,.64,.62,.68,.08);}
 k.plane('glass',D,1.62,.625,1.3,1.35);for(const y of[.88,2.35])k.box('wood',D,y,.68,1.49,.09,.10);k.box('wood',D,1.62,.675,.065,1.41,.1);
 k.tube('rope',[[D+.47,1.02,.73],[D+.47,1.05,.83],[D+.47,1.35,.83],[D+.47,1.38,.73]],.025,16);k.box('rock',D,.025,.68,1.97,.05,1.27,.015);
 // Triangulated steep porch, bolted to the wall and carried by two actual posts.
 const peak=5.62,eave=2.30,half=2.38,roofDepth=2.1,angle=Math.atan2(peak-eave,half),slope=Math.hypot(peak-eave,half);
 for(const zz of[.22,2.13]){k.beam('wood',[D-half,eave,zz],[D,peak,zz],.115,12);k.beam('wood',[D,peak,zz],[D+half,eave,zz],.115,12);k.beam('wood',[D-half,eave,zz],[D+half,eave,zz],.095,12);}
 k.beam('wood',[D,peak,.11],[D,peak,2.30],.15,12);
 for(const side of[-1,1]){k.beam('wood',[D+side*1.39,.03,1.82],[D+side*1.39,3.73,1.82],.105,12);k.beam('wood',[D+side*1.39,2.37,1.82],[D+side*.6,3.29,1.82],.073,10);
  // Six overlapping layers, each with a subdivided displaced backing and fringe.
  for(let layer=0;layer<6;layer++){const t=(layer+.5)/6,x=D+side*half*t,y=peak-(peak-eave)*t+.05+layer*.013;const rot=[-Math.PI/2,0,-side*angle,'ZXY'];k.plane('thatch',x,y,1.16,slope/6+.23,roofDepth,rot,[0,layer*.31,1.4,.78],8);k.plane('fringe',x+side*.18,y-.17,2.225,slope/6+.28,.58,[0,0,-side*angle],[0,0,1,1]);}
 }
 k.box('wood',D,2.96,2.20,3.02,1.035,.18,.035);k.plane('sign',D,2.96,2.298,2.94,.98);
 // A quieter, full-width fascia balances the exaggerated entrance.
 k.box('wood',-4.1,3.61,.46,9.85,.79,.2,.04);k.plane('sign',-4.1,3.61,.566,2.31,.77);for(const x of[-7.8,-.4])k.beam('bamboo',[x-.6,3.61,.59],[x+.6,3.61,.59],.045);
 tikiIdol(k,D-1.52,.77,.96);tikiIdol(k,D+1.52,.77,.96);
 const embers=[];for(const side of[-1,1]){const l=new T.PointLight(0xff542b,1.4,2.8,2);l.position.set(D+side*1.52,2.06,1.12);k.root.add(l);embers.push(l);}
 const bulbs=[];for(let i=0;i<33;i++){const x=-12.1+i*24.2/32;bulbs.push([x,3.38-.22*Math.sin((i%8)/8*Math.PI),.80]);}coloredBulbs(k,bulbs);
 k.box('wood',D+2.62,1.52,.4,.79,.93,.12);k.plane('sign',D+2.62,1.52,.468,.72,.24);k.box('dark',D+2.63,.48,.32,.14,.20,.08,.009);k.tube('dark',[[D+2.63,.45,.37],[D+2.76,.25,.38],[D+2.84,.14,.38],[D+2.89,2.85,.37],[D+2.70,3.2,.42]],.012,32);
 const root=k.finish('Lantern Reef / replacement shopfront only');root.position.set(F.origin.x,F.y,F.origin.z);root.rotation.y=F.angle;
 const bloom=createSpaBloom(T,{cameraMinX:-Infinity,strength:.11,radius:.18,threshold:1.65,knee:.22}),view=new T.Vector3();
 const colliders=[-1,1].map(s=>{const p=tikiPoint(D+s*1.52,.77);return{kind:'circle',x:p.x,z:p.z,r:.44};});
 return{object:root,colliders,waypoint:TIKI_WAYPOINT,compose(renderer,color,depth,camera,w,h){view.copy(camera.position);root.worldToLocal(view);if(Math.hypot(view.x-D,view.z)>27)return color;return bloom.compose(renderer,color,depth,camera,w,h,0);},update(t){for(let i=0;i<embers.length;i++)embers[i].intensity=1.25+.16*Math.sin(t*2.3+i*3)+.06*Math.sin(t*6.73+i);},dispose(){bloom.dispose();disposeTiki(root,m);}};
}
