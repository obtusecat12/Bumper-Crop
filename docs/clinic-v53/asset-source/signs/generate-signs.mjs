/**
 * V53: seven exact reference fascia identities.
 * Deterministic native canvas lettering and original vector icon paths.
 * No generated photographic artwork, no imagegen, no extracted reference pixels.
 * Usage: node generate-signs.mjs [output-directory]
 * Dependencies: @napi-rs/canvas and sharp in CODEX_PRIMARY_RUNTIME_NODE_MODULES.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const dep=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,GlobalFonts}=require(join(dep,'@napi-rs/canvas'));
const sharp=require(join(dep,'sharp'));
const out=resolve(process.argv[2]||dirname(fileURLToPath(import.meta.url)));
mkdirSync(out,{recursive:true});
const W=1536,H=384;
const fontDefs={
 sans:['NimbusSans-Regular.otf','V53 Sans'], bold:['NimbusSans-Bold.otf','V53 Bold'],
 narrow:['NimbusSansNarrow-Regular.otf','V53 Narrow'], narrowBold:['NimbusSansNarrow-Bold.otf','V53 Narrow Bold'],
 serifBold:['NimbusRoman-Bold.otf','V53 Serif Bold'], serifItalic:['NimbusRoman-Italic.otf','V53 Serif Italic'],
 script:['Z003-MediumItalic.otf','V53 Script']
};
for(const [file,family] of Object.values(fontDefs)){
 const path='/usr/share/fonts/opentype/urw-base35/'+file;
 if(!existsSync(path))throw Error('Required font missing: '+path);
 GlobalFonts.registerFromPath(path,family);
}
const C={paper:'#f5f4ed',blue:'#21598d',navy:'#203f6c',bright:'#2385c7',paleBlue:'#74acd0',red:'#b94949',pink:'#b85379',pinkDark:'#8b3e62',gold:'#d7a456',ink:'#30363c'};
let ctx;
function path(commands,fill,stroke=null,width=1){ctx.beginPath();for(const [op,...a] of commands)ctx[op](...a);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function strokeLine(x1,y1,x2,y2,c,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()}
function txt(s,x,y,size,color,font='sans',max=Infinity,tracking=0,align='left'){
 ctx.save();ctx.font=`${size}px "${fontDefs[font][1]}"`;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 const chars=Array.from(s);let length=ctx.measureText(s).width+tracking*(chars.length-1);
 const scale=Math.min(1,max/length);ctx.translate(x,y);ctx.scale(scale,1);let cursor=align==='center'?-length/2:align==='right'?-length:0;
 ctx.fillStyle=color;if(!tracking)ctx.fillText(s,cursor,0);else for(const ch of chars){ctx.fillText(ch,cursor,0);cursor+=ctx.measureText(ch).width+tracking}ctx.restore();return length*scale;
}
function substrate(seed){
 // Smooth off-white sign substrate with extremely restrained paper/coating grain.
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f9f8f2');bg.addColorStop(.48,C.paper);bg.addColorStop(1,'#eeeee8');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 let r=seed>>>0;const rand=()=>{r=(r*1664525+1013904223)>>>0;return r/4294967296};
 for(let i=0;i<7200;i++){const v=rand();ctx.fillStyle=v>.48?'rgba(102,104,91,0.025)':'rgba(255,255,255,0.08)';ctx.fillRect(Math.floor(rand()*W),Math.floor(rand()*H),1+Math.floor(rand()*2),1)}
 ctx.strokeStyle='#aab3b8';ctx.lineWidth=2;ctx.strokeRect(7,7,W-14,H-14);
 ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.strokeRect(10,10,W-20,H-20);
 // A shallow perimeter seam: parent geometry supplies the projecting fascia frame.
 ctx.fillStyle='rgba(96,106,112,.11)';ctx.fillRect(8,H-12,W-16,4);
 for(const [x,y] of [[21,21],[W-21,21],[21,H-21],[W-21,H-21]]){ellipse(x,y,2.7,2.7,'#9ca6aa');strokeLine(x-1.5,y,x+1.5,y,'#d7dbd9',.8)}
 ctx.lineCap='round';ctx.lineJoin='round';
}
function eye(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 path([['moveTo',-124,-27],['bezierCurveTo',-85,-95,-29,-111,7,-107],['bezierCurveTo',54,-104,91,-76,122,-29]],null,C.blue,13);
 path([['moveTo',-111,31],['bezierCurveTo',-57,97,52,105,109,38],['bezierCurveTo',66,87,-60,85,-111,31]],C.paleBlue);
 ellipse(0,-3,63,82,C.blue);ellipse(0,-3,39,56,'#dbe7ea');ellipse(0,-3,25,39,C.blue);ellipse(-11,-28,11,17,'#f4f5f0');
 path([['moveTo',-52,87],['bezierCurveTo',-20,110,22,113,59,94]],null,C.blue,6);ctx.restore();}
function cross(x,y,size){ctx.save();ctx.translate(x,y);const a=size*.32,b=size*.5;ctx.fillStyle=C.blue;ctx.fillRect(-a/2,-b,a,size);ctx.fillRect(-b,-a/2,size,a);ctx.restore()}
function drop(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 path([['moveTo',0,-97],['bezierCurveTo',-21,-47,-66,-9,-65,31],['bezierCurveTo',-63,109,62,112,64,32],['bezierCurveTo',66,-9,18,-54,0,-97],['closePath']],C.blue);
 path([['moveTo',-1,-54],['bezierCurveTo',-17,-21,-42,7,-42,31],['bezierCurveTo',-41,78,38,81,40,34],['bezierCurveTo',40,8,12,-22,-1,-54]],'#339ac1');
 path([['moveTo',-24,8],['bezierCurveTo',-45,49,-20,73,3,63]],null,'#b9e3e6',10);
 path([['moveTo',-43,111],['bezierCurveTo',-10,122,24,121,51,106]],null,'#6fb6ca',5);ctx.restore()}
function woman(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 // Native vector profile, flowing hair, and shoulder. Purpose-built salon mark.
 path([['moveTo',99,-149],['bezierCurveTo',144,-142,162,-104,151,-67],['bezierCurveTo',148,-51,156,-39,173,-28],['bezierCurveTo',183,-20,176,-13,160,-9],['bezierCurveTo',163,-2,169,3,165,8],['bezierCurveTo',158,13,165,23,154,31],['bezierCurveTo',146,40,132,47,120,45],['bezierCurveTo',115,70,129,86,151,101],['bezierCurveTo',172,113,193,134,208,164],['lineTo',-39,164],['bezierCurveTo',-20,111,17,76,40,46],['bezierCurveTo',18,-27,10,-106,60,-139],['bezierCurveTo',71,-148,86,-153,99,-149],['closePath']],C.pink);
 path([['moveTo',106,-148],['bezierCurveTo',27,-168,-3,-88,28,-23],['bezierCurveTo',48,24,35,82,-7,125],['bezierCurveTo',61,96,77,39,66,-13],['bezierCurveTo',62,-46,91,-62,107,-104],['bezierCurveTo',105,-75,135,-61,151,-66],['bezierCurveTo',168,-124,139,-147,106,-148],['closePath']],C.pinkDark);
 path([['moveTo',65,-127],['bezierCurveTo',17,-59,83,-4,47,71]],null,'#ead0d8',6);
 path([['moveTo',90,-131],['bezierCurveTo',38,-77,66,-39,42,-7]],null,'#d99ab0',5);
 path([['moveTo',102,46],['bezierCurveTo',87,85,99,105,143,124]],null,'#f1dce2',5);
 path([['moveTo',99,-112],['bezierCurveTo',114,-77,139,-61,151,-67]],null,'#d99ab0',4);
 path([['moveTo',150,99],['bezierCurveTo',163,127,173,147,180,164]],null,'#f1dce2',5);
 ellipse(139,-38,4,2.6,C.pinkDark);ctx.restore()}
function book(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const B=C.navy;
 path([['moveTo',0,-78],['bezierCurveTo',-32,-111,-80,-111,-113,-94],['lineTo',-113,76],['bezierCurveTo',-79,62,-34,65,0,92],['bezierCurveTo',33,64,79,62,113,76],['lineTo',113,-94],['bezierCurveTo',80,-111,32,-111,0,-78],['lineTo',0,92]],null,B,9);
 path([['moveTo',-125,-83],['lineTo',-132,-83],['lineTo',-132,96],['bezierCurveTo',-87,80,-42,85,0,111],['bezierCurveTo',43,86,88,81,132,96],['lineTo',132,-83],['lineTo',125,-83]],null,B,6);
 path([['moveTo',-89,-79],['bezierCurveTo',-63,-83,-43,-76,-23,-65]],null,'#7991ae',4);
 path([['moveTo',23,-65],['bezierCurveTo',43,-76,63,-83,89,-79]],null,'#7991ae',4);
 ctx.restore();}
function phone(x,y,s){ctx.save();ctx.translate(x,y);ctx.rotate(.16);ctx.scale(s,s);
 ctx.beginPath();ctx.roundRect(-64,-112,128,224,16);ctx.fillStyle=C.navy;ctx.fill();
 ctx.beginPath();ctx.roundRect(-51,-79,102,151,4);ctx.fillStyle=C.bright;ctx.fill();
 path([['moveTo',-41,59],['lineTo',23,-68],['lineTo',45,-68],['lineTo',-18,59],['closePath']],'#53a9d7');
 ellipse(0,91,9,9,'#e9eef0');strokeLine(-18,-95,18,-95,'#a9bfd1',5);
 ctx.restore();}
function palm(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 // Bent blue trunk and six tapered fronds.
 path([['moveTo',2,-5],['bezierCurveTo',14,51,34,100,7,145],['lineTo',25,145],['bezierCurveTo',51,94,24,44,11,-7],['closePath']],C.blue);
 const fronds=[
 [['moveTo',9,-5],['bezierCurveTo',-13,-66,-64,-77,-82,-58],['bezierCurveTo',-34,-57,-7,-21,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',-55,-40,-103,-17,-103,13],['bezierCurveTo',-65,-10,-19,-7,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',-61,-7,-79,50,-67,65],['bezierCurveTo',-55,35,-21,11,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',2,-68,22,-99,41,-96],['bezierCurveTo',23,-66,23,-24,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',53,-74,106,-56,111,-34],['bezierCurveTo',64,-42,38,-19,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',75,-32,119,14,111,45],['bezierCurveTo',81,11,45,1,9,-5]],
 [['moveTo',9,-5],['bezierCurveTo',65,18,82,65,67,84],['bezierCurveTo',50,42,25,17,9,-5]]
 ];for(const p of fronds)path(p,C.blue);ctx.restore();}
const specs=[
 {id:'optica-vision-total',name:'Óptica Visión Total',reference:'image(20260926-115016).png',position:'upper1',text:['ÓPTICA','Visión Total','EXAMEN DE LA VISTA · LENTES DE CONTACTO'],icon:'blue eye',draw(){eye(246,165,1.05);txt('ÓPTICA',522,135,105,C.blue,'sans',850,8);txt('Visión Total',522,252,116,C.ink,'narrowBold',865);txt('EXAMEN DE LA VISTA · LENTES DE CONTACTO',768,336,47,'#607f95','narrow',1370,1.6,'center')}},
 {id:'farmacia-san-jose',name:'Farmacia San José',reference:'image(20260926-115016).png',position:'upper2',text:['Farmacia','San José','Salud para tu familia'],icon:'blue medical cross',draw(){txt('Farmacia',120,135,118,C.blue,'serifBold',925);txt('San José',120,262,130,C.red,'serifBold',985);cross(1282,163,222);txt('Salud para tu familia',763,337,57,'#6687a5','serifItalic',1080,0,'center');strokeLine(138,321,402,321,'#7293ae',3);strokeLine(1114,321,1398,321,'#7293ae',3)}},
 {id:'lavanderia',name:'Lavandería',reference:'image(20260926-115016).png',position:'lower1',text:['LAVANDERÍA','Lava · Seca · Dobla'],icon:'two blue droplets',draw(){drop(186,173,1.07);drop(1350,173,1.07);txt('LAVANDERÍA',768,190,134,C.ink,'narrowBold',990,1.3,'center');txt('Lava · Seca · Dobla',768,285,72,'#6a6670','narrow',930,.5,'center')}},
 {id:'estetica-belleza-estilo',name:'Estética Belleza & Estilo',reference:'image(20260926-115016).png',position:'lower2',text:['Estética','Belleza & Estilo'],icon:'native vector feminine hair silhouette',draw(){
 path([['moveTo',17,15],['lineTo',216,15],['bezierCurveTo',298,146,255,264,157,369],['lineTo',18,369],['closePath']],'#bd557c');
 path([['moveTo',84,15],['bezierCurveTo',213,141,226,253,108,369]],null,'#f2d8e1',17);
 path([['moveTo',174,16],['bezierCurveTo',271,162,234,266,166,367]],null,'#7e526a',6);
 txt('Estética',714,219,183,'#514350','script',820,0,'center');txt('Belleza & Estilo',714,301,63,'#925271','narrow',760,.4,'center');woman(1237,188,.98)
 }},
 {id:'libreria-el-estudiante',name:'Librería El Estudiante',reference:'image(20260926-115756).png',position:'left',text:['Librería','El Estudiante','PAPELERÍA · ÚTILES · COPIAS'],icon:'open book',draw(){book(242,181,.89);txt('Librería',442,144,99,C.navy,'narrowBold',970);txt('El Estudiante',442,260,126,C.navy,'narrowBold',972);txt('PAPELERÍA · ÚTILES · COPIAS',782,340,46,'#526d96','narrow',1320,2.3,'center')}},
 {id:'tecnomovil',name:'TecnoMóvil',reference:'image(20260926-115756).png',position:'center',text:['TecnoMóvil','VENTA · REPARACIÓN · ACCESORIOS'],icon:'blue smartphone',draw(){phone(241,190,1.1);const x=398,y=218,size=132;const a=txt('Tecno',x,y,size,C.navy,'narrowBold');txt('Móvil',x+a,y,size,C.bright,'narrowBold');txt('VENTA · REPARACIÓN · ACCESORIOS',399,302,45,'#4f6791','narrow',1030,1.25);}},
 {id:'viajes-sol-y-mundo',name:'Viajes Sol y Mundo',reference:'image(20260926-115756).png',position:'right',text:['Viajes','Sol y Mundo','TUS DESTINOS MÁS CERCA'],icon:'blue palm and golden sun',draw(){ellipse(1190,114,79,79,C.gold);palm(1309,118,.94);txt('Viajes',270,126,89,C.navy,'narrowBold',850);let x=269;x+=txt('Sol',x,258,132,'#bb7d3e','narrowBold');x+=txt(' y Mundo',x,258,132,C.blue,'narrowBold',900);txt('TUS DESTINOS MÁS CERCA',274,329,44,'#676a88','narrow',1120,3.0);}}
];
const records=[];const thumb=createCanvas(W,7*H);const tctx=thumb.getContext('2d');
for(let i=0;i<specs.length;i++){
 const s=specs[i];const canvas=createCanvas(W,H);ctx=canvas.getContext('2d');substrate(53001+i*7919);s.draw();
 const png=canvas.toBuffer('image/png');const pngPath=join(out,s.id+'.png');const webpPath=join(out,s.id+'.webp');writeFileSync(pngPath,png);
 await sharp(png).webp({quality:94,effort:6,smartSubsample:true}).toFile(webpPath);
 tctx.drawImage(canvas,0,i*H);
 records.push({id:s.id,displayName:s.name,pixelWidth:W,pixelHeight:H,png:s.id+'.png',webp:s.id+'.webp',pngPath,webpPath,exactText:s.text,icon:s.icon,reference:s.reference,referencePosition:s.position,sha256:{png:createHash('sha256').update(png).digest('hex'),webp:createHash('sha256').update(readFileSync(webpPath)).digest('hex')},bytes:{png:png.length,webp:readFileSync(webpPath).length}})
}
writeFileSync(join(out,'contact-sheet.png'),thumb.toBuffer('image/png'));
const manifest={schemaVersion:1,collection:'v53-exact-shop-fascias',createdDate:'2026-09-26',method:'Deterministic native @napi-rs/canvas text and original vector paths, optimized with sharp; no imagegen and no photographic pixels.',source:'generate-signs.mjs',provenance:'provenance.md',width:W,height:H,webpQuality:94,signs:records};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({count:records.length,manifest:join(out,'manifest.json'),contactSheet:join(out,'contact-sheet.png'),totalWebpBytes:records.reduce((a,s)=>a+s.bytes.webp,0)}));
