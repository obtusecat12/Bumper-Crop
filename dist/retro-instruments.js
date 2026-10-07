// Small reusable material / object parts. Never a screenshot of a whole widget.
export const PART_NAMES=['leather_panel','brass_panel','wheat_sprig','rivet','almond_water_bottle','housing_ring','glass_lid','loop_crown','caption_tag','cork','back_glass','front_glass','holder_single_band_optional'];
export const PART_URL=name=>new URL('./assets/ui-v20/'+name+'.png',import.meta.url).href;
export async function loadInstrumentParts(){return Object.fromEntries(await Promise.all(PART_NAMES.map(async name=>{const im=new Image();im.crossOrigin='anonymous';im.src=PART_URL(name);await im.decode();return[name,im];})));}
export const GAUGES=[{rx:218,ry:196,t:34,label:'体力',y:101,colors:['#6e844d','#bcb067','#a55d48']},{rx:167,ry:147,t:30,label:'水分',y:150,colors:['#578b7d','#588090','#546991']},{rx:120,ry:102,t:24,label:'血量',y:195,colors:['#834e45','#ad7865','#b69876']}];
const f=n=>Number(n.toFixed(3));
export function gaugePath(index,value=100){const{rx,ry,t}=GAUGES[index],v=Math.max(0,Math.min(100,Number(value)||0));if(!v)return'';
 const a=Math.PI+v/100*Math.PI/2,c=Math.cos(a),s=Math.sin(a),cx=284,cy=289;
 return`M${cx-rx} ${cy} A${rx} ${ry} 0 0 1 ${f(cx+rx*c)} ${f(cy+ry*s)} L${f(cx+(rx-t)*c)} ${f(cy+(ry-t)*s)} A${rx-t} ${ry-t} 0 0 0 ${cx-rx+t} ${cy} Z`;
}
export const CASE_PATH='M28 301 L28 271 C28 123 116 24 244 24 C329 20 397 73 434 122 L543 122 Q599 122 615 158 Q638 213 628 289 Q626 309 603 310 L48 310 Q31 310 28 301 Z';
const FONT="Georgia, HarvestSerif, 'Songti SC', SimSun, serif";
function image(c,parts,name,x,y,w,h,alpha=1){c.save();c.globalAlpha*=alpha;c.drawImage(parts[name],x,y,w,h);c.restore();}
function shape(c,d,fill,stroke,width=1){if(!d)return;const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
export function liquidPath(value,slope=0,ripple=0){if(value<=0)return'';const y=704-Math.max(0,Math.min(100,value))/100*569,tilt=slope*107;
 return`M67 ${f(y-tilt)} Q120 ${f(y-ripple*15)} 174 ${f(y+tilt)} L174 648 Q174 703 121 704 Q67 703 67 648 Z`;}
export function paintVial(c,parts,value,slope=0,ripple=0,tokens={}){
 c.save();c.translate(205,-181);c.rotate(-.095);c.scale(.29,.29);
 image(c,parts,'back_glass',0,0,256,780);
 const clip=new Path2D('M67 111 L174 111 L174 648 Q174 703 121 704 Q67 703 67 648 Z');c.save();c.clip(clip);
 const g=c.createLinearGradient(67,0,174,0);g.addColorStop(0,tokens.vialShadow||'#655d3d');g.addColorStop(.32,tokens.vialLiquid||'#af9561');g.addColorStop(.7,tokens.vialLight||'#c3b47c');g.addColorStop(1,tokens.vialShadow||'#655d3d');
 const path=liquidPath(value,slope,ripple);shape(c,path,g);const y=704-value/100*569;c.strokeStyle=tokens.vialSurface||'#d7d9b0';c.lineWidth=5;c.beginPath();c.moveTo(67,y-slope*107);c.quadraticCurveTo(120,y-ripple*15,174,y+slope*107);if(value>0)c.stroke();c.restore();
 image(c,parts,'front_glass',0,0,256,780,.68);image(c,parts,'cork',25,-104,206,154);image(c,parts,'holder_single_band_optional',-8,579,272,120,.9);
 c.restore();
}
export function paintVitals(c,parts,values,bottles,tokens={}){
 const ink=tokens.ink||'#c8ba96',leather=c.createPattern(parts.leather_panel,'repeat'),brass=c.createPattern(parts.brass_panel,'repeat');
 // Reusable material swatches clipped to the reference silhouette.
 c.save();c.translate(1,4);shape(c,CASE_PATH,'#11150ee0','#11150e',7);c.restore();
 shape(c,CASE_PATH,brass,'#302a1b',5);c.save();c.translate(10,9);c.scale(.966,.95);shape(c,CASE_PATH,leather,'#bb9e64',2);c.restore();
 // The case has a single open fan, with independent narrow brass separators.
 const arch='M45 290 C45 143 126 42 250 40 C322 38 380 73 417 122';shape(c,arch,null,'#262317',9);shape(c,arch,null,'#a98f5d',3);
 for(let i=0;i<3;i++){
  const d=gaugePath(i,100);shape(c,d,'#171b14','#ab915d',5);shape(c,gaugePath(i,values[i]),gaugeGradient(c,i));shape(c,d,null,'#5a4930',1.5);
  const y=GAUGES[i].y,tag=`M300 ${y-23} L${i===0?442:573} ${y-23} Q598 ${y-22} 603 ${y+23} L300 ${y+23} Z`;
  c.save();c.clip(new Path2D(CASE_PATH));shape(c,tag,leather,'#907344',3);c.fillStyle=ink;c.font=`${tokens.pixelMode?40:30}px ${FONT}`;c.fillText(GAUGES[i].label,322,y+(tokens.pixelMode?14:11));c.restore();
 }
 const supply='M298 227 L603 227 L612 286 Q612 298 596 298 L289 298 Z';shape(c,supply,'#25261bd9','#917747',3);
 c.fillStyle=ink;c.font=`${tokens.pixelMode?36:30}px ${FONT}`;c.fillText('杏仁水',324,274);c.font=`32px ${FONT}`;c.fillText(String(bottles).padStart(2,'0'),555,276);
 image(c,parts,'almond_water_bottle',504,238,25,58);
 shape(c,CASE_PATH,null,'#51412a',3);
 // Fine-grained ornament parts are prepared at native old-console texture sizes.
 c.save();c.translate(48,295);c.rotate(-.25);image(c,parts,'wheat_sprig',-16,-229,240,245);c.restore();
 for(const[x,y]of [[82,286],[135,289],[279,292],[612,290]])image(c,parts,'rivet',x-10,y-10,20,20);
}
export function gaugeGradient(c,i){const{ry,colors}=GAUGES[i],g=c.createLinearGradient(0,289,0,289-ry);g.addColorStop(0,colors[0]);g.addColorStop(.58,colors[1]);g.addColorStop(1,colors[2]);return g;}
export function paintCompass(c,parts,map,yaw,bearing,tokens={}){
 c.save();c.fillStyle=tokens.mapBackground||'#777756';c.beginPath();c.arc(128,142,95,0,Math.PI*2);c.fill();c.clip();
 c.translate(128,142);c.rotate(yaw);c.drawImage(map,-155,-155,310,310);c.restore();
 image(c,parts,'caption_tag',32,231,196,65);image(c,parts,'loop_crown',103,0,51,46);image(c,parts,'housing_ring',7,21,242,242);image(c,parts,'glass_lid',25,39,206,206,.5);
 c.fillStyle=tokens.mapPlayer||'#e2d9b3';c.strokeStyle='#403d2c';c.lineWidth=2;c.beginPath();c.moveTo(128,132);c.lineTo(134,151);c.lineTo(128,148);c.lineTo(122,151);c.closePath();c.fill();c.stroke();
 for(let i=0;i<4;i++){const a=yaw+i*Math.PI/2,x=128+Math.sin(a)*96,y=142-Math.cos(a)*96;c.fillStyle='#302b1f';c.fillRect(x-10,y-12,20,24);c.strokeStyle='#a68b56';c.lineWidth=1;c.strokeRect(x-10,y-12,20,24);c.fillStyle=tokens.ink||'#c8ba96';c.font=`21px ${FONT}`;c.textAlign='center';c.fillText('NESW'[i],x,y+7);}
 c.fillStyle='#3c3322';c.font=`${tokens.pixelMode?23:17}px ${FONT}`;c.textAlign='left';c.fillText(bearing,46,270);c.textAlign='right';c.fillText('F 地图',208,270);c.textAlign='left';
}
