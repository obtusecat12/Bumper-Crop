// Functional instruments drawn from geometry. Intentionally rasterized below
// display resolution: broad shading and thin highlights, without grain maps.
export const INSTRUMENT_PALETTE=Object.freeze({ink:'#c8ba96',metal:'#756747',light:'#b1a17a',dark:'#28271e',face:'#302f24',stamina:'#8c9255',hydration:'#65818a',health:'#a16452',liquid:'#af9561'});
export const VITALS_SIZE={width:420,height:222};
export const COMPASS_SIZE={width:256,height:292,cx:128,cy:140,r:92};
const PI=Math.PI,clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
function line(c,color,width,fn){c.beginPath();fn();c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,color])=>g.addColorStop(p,color));return g;}
function ellipse(c,x,y,rx,ry,fill,stroke=null,w=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function screw(c,x,y,p){ellipse(c,x+1,y+2,5,5,p.dark);ellipse(c,x,y,4,4,p.metal,p.light,.8);line(c,p.dark,1,()=>{c.moveTo(x-2,y-1);c.lineTo(x+2,y+1);});}
function chassis(c){c.beginPath();c.moveTo(10,211);c.lineTo(10,202);c.arc(170,202,160,PI,PI*1.5);c.quadraticCurveTo(225,41,252,83);c.lineTo(372,83);c.quadraticCurveTo(398,83,405,116);c.lineTo(416,183);c.quadraticCurveTo(422,214,396,214);c.lineTo(17,214);c.closePath();}
export function drawVitalsCase(c,p=INSTRUMENT_PALETTE){
 c.clearRect(0,0,420,222);c.save();c.translate(1,3);chassis(c);c.fillStyle=p.dark;c.fill();c.restore();
 chassis(c);c.fillStyle=gradient(c,20,45,220,220,[[0,p.light],[.1,p.metal],[.52,p.dark],[.91,p.metal],[1,p.dark]]);c.fill();c.strokeStyle=p.dark;c.lineWidth=2;c.stroke();
 c.save();c.translate(170,202);c.scale(.969,.94);c.translate(-170,-202);chassis(c);c.fillStyle=gradient(c,0,46,0,218,[[0,'#424033'],[.45,p.face],[1,'#20221c']]);c.fill();c.strokeStyle=p.light;c.lineWidth=.8;c.stroke();c.restore();
 [141,113,85].forEach(r=>{
  line(c,'#171b17',22,()=>c.arc(170,202,r,PI,PI*1.5));
  line(c,p.metal,1.3,()=>c.arc(170,202,r+12,PI,PI*1.5));
  line(c,p.light,.7,()=>c.arc(170,202,r-12,PI,PI*1.5));
  for(let i=0;i<=10;i++){const a=PI+i*PI/20;line(c,'#aaa080',.8,()=>{c.moveTo(170+Math.cos(a)*(r+13),202+Math.sin(a)*(r+13));c.lineTo(170+Math.cos(a)*(r+16),202+Math.sin(a)*(r+16));});}
 });
 [74,102,130].forEach((y,i)=>line(c,p.metal,.8,()=>{c.moveTo(183,y);c.lineTo(230+i*52,y);}));
 line(c,p.metal,1,()=>{c.moveTo(181,158);c.lineTo(393,158);});
 // Cast wheat relief; few broad shapes in the same metal as the housing.
 c.save();c.translate(25,191);c.rotate(.27);line(c,p.metal,3,()=>{c.moveTo(0,0);c.quadraticCurveTo(-11,-67,9,-117);});
 for(let i=0;i<7;i++){const y=-16-i*13,x=i>3?(i-3)*2:0;for(const s of [-1,1]){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+s*17,y-4,x+s*10,y-16);c.quadraticCurveTo(x+s,y-14,x,y);c.fillStyle=i%2?p.metal:'#8d7c55';c.fill();}}
 c.restore();screw(c,22,202,p);screw(c,173,202,p);screw(c,402,199,p);
 c.fillStyle='#595b43';c.fillRect(354,175,13,24);c.fillRect(358,168,5,8);c.strokeStyle=p.light;c.lineWidth=1;c.strokeRect(354,175,13,24);c.fillStyle='#8e8060';c.fillRect(356,165,9,5);c.fillStyle='#b6b69a';c.fillRect(356,177,2,18);
}
export function drawGauges(c,values,p=INSTRUMENT_PALETTE){
 c.clearRect(0,0,420,222);
 [141,113,85].forEach((r,i)=>{
  const value=clamp(values[i]);if(!value)return;const end=PI+value/100*PI/2,color=[p.stamina,p.hydration,p.health][i];
  line(c,color,17,()=>c.arc(170,202,r,PI,end));
  line(c,'#e4d8a92b',3,()=>c.arc(170,202,r-5,PI,end));
  line(c,'#11181055',3,()=>c.arc(170,202,r+6,PI,end));
  for(let n=1;n<10&&n<value/10;n++){const a=PI+n*PI/20;line(c,'#151b182b',.65,()=>{c.moveTo(170+Math.cos(a)*(r-7),202+Math.sin(a)*(r-7));c.lineTo(170+Math.cos(a)*(r+7),202+Math.sin(a)*(r+7));});}
  const x=170+Math.cos(end)*r,y=202+Math.sin(end)*r;
  line(c,'#d5cba16b',1,()=>{c.moveTo(x-Math.cos(end)*8,y-Math.sin(end)*8);c.lineTo(x+Math.cos(end)*8,y+Math.sin(end)*8);});
 });
}
export function drawCompass(c,p=INSTRUMENT_PALETTE){
 c.clearRect(0,0,256,292);
 ellipse(c,128,18,24,14,null,p.dark,6);ellipse(c,128,16,24,14,null,p.metal,5);ellipse(c,128,15,24,14,null,p.light,1);
 c.fillStyle=p.metal;c.fillRect(120,27,16,16);c.fillStyle=p.light;c.fillRect(122,28,3,12);
 for(const [r,dy,color] of [[115,3,p.dark],[114,0,p.metal],[110,0,p.light],[108,0,p.dark],[105,0,p.metal],[103,0,'#4b4835'],[99,0,p.light],[97,0,p.dark]]){
  c.beginPath();c.arc(128,140+dy,r,0,PI*2);c.arc(128,140,92,0,PI*2,true);c.fillStyle=color;c.fill('evenodd');
 }
 line(c,'#c7b78c',1.5,()=>c.arc(128,140,112,PI*1.08,PI*1.71));line(c,'#1b211a',2,()=>c.arc(128,142,109,.12,PI*.9));
 for(let i=0;i<60;i++){const a=i*PI/30,r=i%5===0?93:96;line(c,i%5===0?p.light:'#887d60',i%5===0?1.4:.7,()=>{c.moveTo(128+Math.sin(a)*r,140-Math.cos(a)*r);c.lineTo(128+Math.sin(a)*101,140-Math.cos(a)*101);});}
 screw(c,48,220,p);screw(c,208,220,p);
 c.beginPath();c.moveTo(45,254);c.lineTo(211,254);c.lineTo(207,277);c.lineTo(48,277);c.closePath();c.fillStyle=gradient(c,0,254,0,278,[[0,p.metal],[.12,p.face],[1,p.dark]]);c.fill();c.strokeStyle=p.metal;c.lineWidth=1;c.stroke();
}
export function drawVial(c,value=100,slope=0,ripple=0,p=INSTRUMENT_PALETTE){
 c.clearRect(0,0,88,252);c.save();c.translate(44,240);c.rotate(-.105);c.translate(-44,-240);
 const outer=()=>{c.beginPath();c.moveTo(19,41);c.lineTo(19,211);c.bezierCurveTo(19,246,69,246,69,211);c.lineTo(69,41);c.closePath();};
 outer();c.fillStyle=gradient(c,19,0,69,0,[[0,'#d7debf70'],[.08,'#2e3c3280'],[.18,'#96ac9150'],[.34,'#d8e1c41a'],[.68,'#b9c9ae08'],[.86,'#1f332b6b'],[1,'#bbcbb980']]);c.fill();c.strokeStyle='#a7b49d90';c.lineWidth=1;c.stroke();ellipse(c,44,42,25,8,'#61726242','#a7b49d',1.3);
 c.save();c.beginPath();c.moveTo(25,50);c.lineTo(25,210);c.bezierCurveTo(25,235,63,235,63,210);c.lineTo(63,50);c.closePath();c.clip();
 const fill=clamp(value),y=222-fill*1.53,tilt=slope+.105,left=y-19*tilt,right=y+19*tilt;
 if(fill>0){c.beginPath();c.moveTo(23,left);c.bezierCurveTo(32,y-2-ripple*6,54,y+2+ripple*6,65,right);c.lineTo(65,237);c.lineTo(23,237);c.closePath();c.fillStyle=gradient(c,23,0,65,0,[[0,'#544c30e8'],[.2,p.liquid],[.44,'#c3b47cae'],[.75,'#9c8e54dc'],[1,'#554b31f2']]);c.fill();
  c.save();c.translate(44,y);c.rotate(Math.atan(tilt));ellipse(c,0,0,21,4,'#b6b7899e','#d7d9b089',.7);line(c,'#3a453265',1,()=>c.ellipse(0,0,20,4,0,0,PI));c.restore();ellipse(c,53,Math.min(217,y+35),1.1,1.5,null,'#e7dab950',.5);
 }c.restore();
 // Front wall and bottom lens remain separate from the fluid.
 outer();c.fillStyle=gradient(c,19,0,69,0,[[0,'#f2f5df05'],[.09,'#e3ebd94a'],[.15,'#eaf4e880'],[.21,'#c6d8c522'],[.4,'#ffffff00'],[.74,'#dce5c91c'],[.89,'#f0f4de5c'],[1,'#192a273b']]);c.fill();
 line(c,'#e5e7d680',1.4,()=>{c.moveTo(26,59);c.lineTo(26,199);});line(c,'#d6dfcb46',.8,()=>{c.moveTo(61,67);c.lineTo(61,211);});
 ellipse(c,44,222,19,9,'#b3c4a225','#d0d8bc79',1.2);line(c,'#d3ddc3b0',2,()=>c.ellipse(44,222,20,12,0,.16,PI-.2));
 ellipse(c,44,43,26,8,'#7b897042','#d5dbc09c',1.4);ellipse(c,44,43,20,5,null,'#304035aa',1.8);
 c.beginPath();c.moveTo(26,15);c.lineTo(28,43);c.bezierCurveTo(33,50,55,50,60,43);c.lineTo(62,15);c.closePath();c.fillStyle=gradient(c,26,0,62,0,[[0,'#514638'],[.22,'#918168'],[.48,'#a39270'],[.86,'#655b44'],[1,'#423d31']]);c.fill();ellipse(c,44,15,18,6,'#a39474','#c0af86',.7);
 c.fillStyle='#534b3650';[[32,25],[47,35],[54,22],[38,40],[45,19]].forEach(([x,y])=>c.fillRect(x,y,2,1));
 c.fillStyle=gradient(c,17,0,71,0,[[0,p.dark],[.2,p.metal],[.5,p.light],[.8,p.metal],[1,p.dark]]);c.fillRect(17,197,54,9);line(c,p.dark,1,()=>{c.moveTo(17,205);c.lineTo(71,205);});c.restore();
}
