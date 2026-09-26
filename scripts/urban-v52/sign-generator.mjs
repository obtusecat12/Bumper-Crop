/**
 * Seventy-two original, bilingual commercial sign textures, ca. 1970–1990.
 * Usage: node generator.mjs [output-directory]
 * Requires @napi-rs/canvas; resolves from CODEX_PRIMARY_RUNTIME_NODE_MODULES.
 * All artwork is generated here from typography and vector primitives.
 * Fonts are free system URW base35 fonts with an ordinary sans-serif fallback.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let canvasModule;
try { canvasModule = require('@napi-rs/canvas'); }
catch { canvasModule = require(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules', '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasModule;
const output = resolve(process.argv[2] || dirname(fileURLToPath(import.meta.url)));
mkdirSync(output, { recursive: true });
const fonts = {
  sans: ['NimbusSans-Bold.otf', 'Sign Sans'], regular: ['NimbusSans-Regular.otf', 'Sign Regular'],
  narrow: ['NimbusSansNarrow-Bold.otf', 'Sign Narrow'], serif: ['NimbusRoman-Bold.otf', 'Sign Serif'],
  book: ['URWBookman-Demi.otf', 'Sign Book'], italic: ['URWBookman-DemiItalic.otf', 'Sign Italic'],
  script: ['Z003-MediumItalic.otf', 'Sign Script'], mono: ['NimbusMonoPS-Bold.otf', 'Sign Mono'],
  geometric: ['URWGothic-Demi.otf', 'Sign Geometric'],
};
for (const [file, family] of Object.values(fonts)) {
  const p = '/usr/share/fonts/opentype/urw-base35/' + file;
  if (existsSync(p)) GlobalFonts.registerFromPath(p, family);
}
const F = Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, `"${v[1]}", sans-serif`]));
const C = { cream:'#f2e9ce', ivory:'#fff7df', red:'#b73529', navy:'#173446', teal:'#187571', orange:'#da712b', gold:'#d7ac48', brown:'#513c2b', green:'#38654a', blue:'#326e9b', black:'#252b2b' };
let ctx, W, H, S;
function rect(x,y,w,h,c) { ctx.fillStyle=c;ctx.fillRect(x*W,y*H,w*W,h*H); }
function line(x1,y1,x2,y2,c,width=0.007) {ctx.strokeStyle=c;ctx.lineWidth=width*Math.min(W,H);ctx.beginPath();ctx.moveTo(x1*W,y1*H);ctx.lineTo(x2*W,y2*H);ctx.stroke();}
function circle(x,y,r,c,stroke=null,lw=.006) {ctx.beginPath();ctx.arc(x*W,y*H,r*Math.min(W,H),0,Math.PI*2);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*Math.min(W,H);ctx.stroke();}}
function poly(points,c,stroke=null,width=.01) {ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*W,y*H):ctx.moveTo(x*W,y*H));ctx.closePath();ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width*Math.min(W,H);ctx.stroke();}}
function box(x,y,w,h,c,r=.03,stroke=null,lw=.012) {ctx.beginPath();ctx.roundRect(x*W,y*H,w*W,h*H,Math.min(W,H)*r);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*Math.min(W,H);ctx.stroke();}}
function text(str,x,y,size,color,font='sans',max=.9,align='center',opts={}) {
  if(typeof align==='object'){opts=align;align='center';}
  ctx.save();ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${size*H}px ${F[font] || F.sans}`;
  const mw=max*W, measured=ctx.measureText(str).width;
  if (measured>mw) ctx.font=`${size*H*mw/measured}px ${F[font] || F.sans}`;
  if(opts.shadow){ctx.shadowColor=opts.shadow;ctx.shadowOffsetX=H*.008;ctx.shadowOffsetY=H*.01;}
  if(opts.stroke){ctx.strokeStyle=opts.stroke;ctx.lineWidth=(opts.lineWidth||.009)*H;ctx.lineJoin='round';ctx.strokeText(str,x*W,y*H);}
  ctx.fillStyle=color;ctx.fillText(str,x*W,y*H);ctx.restore();
}
function border(c,inset=.025,width=.012) {ctx.strokeStyle=c;ctx.lineWidth=width*Math.min(W,H);ctx.strokeRect(inset*W,inset*H,(1-2*inset)*W,(1-2*inset)*H);}
function star(x,y,r,color,points=8){const a=[];for(let i=0;i<points*2;i++){const t=-Math.PI/2+i*Math.PI/points,d=i%2?r*.45:r;a.push([x+Math.cos(t)*d*H/W,y+Math.sin(t)*d]);}poly(a,color);}
function rays(cx,cy,colors,start=0,end=Math.PI*2,n=18){for(let i=0;i<n;i++){const a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n;poly([[cx,cy],[cx+Math.cos(a)*2,cy+Math.sin(a)*2],[cx+Math.cos(b)*2,cy+Math.sin(b)*2]],colors[i%colors.length]);}}
function stripes(y,h,colors){colors.forEach((c,i)=>rect(0,y+h*i/colors.length,1,h/colors.length,c));}
function icon(type,x,y,size,color,back=null){
  ctx.save();ctx.translate(x*W,y*H);const u=size*Math.min(W,H);ctx.scale(u,u);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=.07;ctx.lineCap='round';ctx.lineJoin='round';
  const path=(p,fill=false)=>{ctx.beginPath();p.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));fill?ctx.fill():ctx.stroke();};
  const cir=(a,b,r,fill=false)=>{ctx.beginPath();ctx.arc(a,b,r,0,Math.PI*2);fill?ctx.fill():ctx.stroke();};
  if(back){ctx.fillStyle=back;cir(0,0,.59,true);ctx.fillStyle=color;}
  switch(type){
    case 'cross':ctx.fillRect(-.14,-.47,.28,.94);ctx.fillRect(-.47,-.14,.94,.28);break;
    case 'tooth':ctx.beginPath();ctx.moveTo(-.4,-.4);ctx.bezierCurveTo(-.12,-.62,-.03,-.33,0,-.35);ctx.bezierCurveTo(.38,-.62,.55,-.33,.39,.08);ctx.bezierCurveTo(.28,.75,.15,.53,.08,.19);ctx.bezierCurveTo(-.08,-.02,-.13,.59,-.27,.51);ctx.bezierCurveTo(-.34,.41,-.55,-.07,-.4,-.4);ctx.closePath();ctx.fill();break;
    case 'camera':ctx.strokeRect(-.48,-.28,.96,.64);ctx.fillRect(-.26,-.44,.33,.16);cir(.02,.04,.22);ctx.fillRect(.29,-.19,.1,.08);break;
    case 'washer':ctx.strokeRect(-.39,-.5,.78,1);cir(0,.09,.28);ctx.fillRect(-.25,-.38,.23,.06);cir(.23,-.34,.04,true);break;
    case 'wrench':path([[-.3,.43],[.25,-.19]]);ctx.lineWidth=.18;path([[-.3,.43],[.16,-.07]]);ctx.lineWidth=.07;path([[.13,-.08],[-.01,-.29],[.1,-.48],[.18,-.28],[.35,-.2],[.49,-.37],[.49,-.16],[.34,-.04],[.13,-.08]]);break;
    case 'plane':polyLocal([[0,-.52],[.1,-.13],[.49,.16],[.46,.29],[.08,.13],[.06,.37],[.22,.46],[.2,.54],[0,.47],[-.2,.54],[-.22,.46],[-.06,.37],[-.08,.13],[-.46,.29],[-.49,.16],[-.1,-.13]],color);break;
    case 'bread':ctx.beginPath();ctx.ellipse(0,0,.5,.28,-.35,0,Math.PI*2);ctx.fill();ctx.strokeStyle=back||C.cream;path([[-.3,.0],[-.18,-.2]]);path([[-.05,.05],[.06,-.18]]);path([[.19,.04],[.3,-.13]]);break;
    case 'cup':ctx.strokeRect(-.32,-.2,.53,.48);ctx.beginPath();ctx.arc(.26,.0,.16,-Math.PI/2,Math.PI/2);ctx.stroke();path([[-.45,.39],[.4,.39]]);path([[-.1,-.35],[-.16,-.48],[-.06,-.6]]);break;
    case 'bank':polyLocal([[-.5,-.26],[0,-.52],[.5,-.26]],color);[-.3,0,.3].forEach(a=>ctx.fillRect(a-.07,-.17,.14,.52));ctx.fillRect(-.48,.39,.96,.1);break;
    case 'sun':cir(0,0,.26,true);for(let i=0;i<12;i++){let a=i*Math.PI/6;path([[Math.cos(a)*.35,Math.sin(a)*.35],[Math.cos(a)*.5,Math.sin(a)*.5]]);}break;
    case 'leaf':ctx.beginPath();ctx.ellipse(0,0,.23,.47,.75,0,Math.PI*2);ctx.fill();break;
    case 'tyre':cir(0,0,.47);cir(0,0,.27);for(let i=0;i<10;i++){let a=i*Math.PI/5;path([[Math.cos(a)*.34,Math.sin(a)*.34],[Math.cos(a+.16)*.46,Math.sin(a+.16)*.46]]);}break;
    case 'key':cir(-.2,-.2,.21);path([[-.06,-.06],[.37,.36],[.47,.26],[.37,.16]]);break;
    case 'diamond':polyLocal([[0,-.52],[.42,-.14],[0,.5],[-.42,-.14]],color);ctx.strokeStyle=back||C.cream;path([[-.42,-.14],[.42,-.14]]);path([[0,-.52],[-.13,-.14],[0,.5],[.13,-.14],[0,-.52]]);break;
    case 'glasses':cir(-.25,.02,.21);cir(.25,.02,.21);path([[-.04,0],[.04,0]]);path([[-.45,0],[-.53,-.12]]);path([[.45,0],[.53,-.12]]);break;
    case 'book':path([[0,-.27],[-.43,-.4],[-.43,.31],[0,.46],[.43,.31],[.43,-.4],[0,-.27],[0,.46]]);break;
    case 'scissors':cir(-.24,.3,.15);cir(.18,.3,.15);path([[-.13,.2],[.32,-.47]]);path([[.08,.2],[-.29,-.47]]);break;
    case 'phone':polyLocal([[-.42,-.37],[-.22,-.5],[-.03,-.23],[-.12,-.08],[.03,.12],[.19,.18],[.34,.08],[.5,.27],[.38,.45],[.15,.5],[-.17,.34],[-.38,.05],[-.5,-.20]],color);break;
    case 'radio':ctx.strokeRect(-.48,-.3,.96,.65);cir(-.19,.03,.2);ctx.fillRect(.1,-.15,.25,.08);ctx.fillRect(.1,.03,.25,.04);path([[-.18,-.32],[.3,-.64]]);break;
    case 'chair':path([[-.3,-.46],[-.3,.13],[.32,.13],[.32,.42]]);path([[-.3,.13],[-.3,.45]]);ctx.fillRect(-.24,-.42,.5,.33);break;
    case 'flask':path([[-.16,-.5],[.16,-.5],[.16,-.11],[.47,.41],[.37,.51],[-.37,.51],[-.47,.41],[-.16,-.11],[-.16,-.5]]);path([[-.28,.2],[.28,.2]]);break;
    case 'house':path([[-.5,-.02],[0,-.47],[.5,-.02]]);path([[-.34,-.14],[-.34,.47],[.34,.47],[.34,-.14]]);ctx.strokeRect(-.11,.15,.22,.32);break;
    case 'fish':ctx.beginPath();ctx.ellipse(-.1,0,.37,.21,0,0,Math.PI*2);ctx.fill();polyLocal([[.17,0],[.49,-.27],[.49,.27]],color);ctx.fillStyle=back||C.cream;cir(-.3,-.05,.04,true);break;
    case 'record':cir(0,0,.48,true);ctx.fillStyle=back||C.cream;cir(0,0,.15,true);break;
  }
  ctx.restore();
}
function polyLocal(points,c){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=c;ctx.fill();}
function screws(c='#7c7669'){for(const [x,y] of [[.024,.055],[.976,.055],[.024,.945],[.976,.945]]){circle(x,y,.008,c);line(x-.002,y,x+.002,y,'#cbc7bc',.002);}}
function weather(index){ // Low-contrast edge wear only; no noise across type.
  let state=(index+1)*9301;const rand=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
  ctx.save();for(let i=0;i<55;i++){const x=rand()*W,y=(i%2?rand()*.017:1-rand()*.018)*H;ctx.fillStyle=i%3?'rgba(64,52,30,.10)':'rgba(255,249,220,.15)';ctx.fillRect(x,y,2+rand()*W*.022,1+rand()*H*.005);}ctx.restore();
}
const records=[];
function add(id,name,kind,category,w,h,style,palette,main,sub,extra='',iconType='') {records.push({id,displayName:name,kind,category,pixelWidth:w,pixelHeight:h,style,palette,main,sub,extra,icon:iconType});}
// Forty shop fascias. Each has a distinct period identity and custom arrangement.
add('s01','Clínica Santa Elena','fascia','clinic',960,320,'medical-modern',[C.ivory,C.teal,C.red],'CLÍNICA SANTA ELENA','FAMILY CLINIC · MEDICINA GENERAL','CONSULTAS • 8–8','cross');
add('s02','Laboratorio Central','fascia','laboratory',960,360,'laboratory-grid',['#e8ece0','#24566f','#d1a53e'],'LABORATORIO CENTRAL','CLINICAL LAB · ANÁLISIS CLÍNICOS','DESDE 1974','flask');
add('s03','La Estrella Pastelería','fascia','bakery',960,400,'bakery-script',[C.cream,'#773836',C.gold],'La Estrella','PASTELERÍA · BAKERY','PAN FRESCO • FRESH BREAD','bread');
add('s04','Photo 1 Hour','fascia','photo',1024,384,'photo-spectrum',['#faf4d9','#232e45','#bd2932'],'PHOTO 1 HOUR','FOTO EN 1 HORA','COLOR • FILM • PRINTS','camera');
add('s05','La Burbuja Laundromat','fascia','laundromat',960,320,'laundry-bubbles',['#d7ece4','#216574','#f8f4d4'],'LA BURBUJA','LAUNDROMAT · LAVANDERÍA','SELF SERVICE • AUTOSERVICIO','washer');
add('s06','Corner Mart','fascia','grocery',960,320,'corner-ribbon',['#f1e5c6','#a82e24','#285743'],'Corner Mart','ABARROTES · GROCERIES','OPEN DAILY • ABIERTO DIARIO');
add('s07','Ramírez Auto Parts','fascia','auto-parts',960,320,'industrial-chevrons',['#edc544','#232d32','#ad3023'],'RAMÍREZ AUTO PARTS','REFACCIONES · PARTS & ACCESSORIES','MOTOR • FRENOS • FILTROS','wrench');
add('s08','Family Dental','fascia','dentist',960,384,'dental-minimal',['#f4eee1','#324d63','#8baaaf'],'FAMILY DENTAL','ODONTOLOGÍA FAMILIAR','DR. RIVERA & ASSOCIATES','tooth');
add('s09','Viajes Horizonte','fascia','travel',960,360,'travel-horizon',['#e3e8d7','#1d6486','#e89537'],'VIAJES HORIZONTE','TRAVEL SERVICE · AGENCIA DE VIAJES','AIR • SEA • LAND','plane');
add('s10','Hardware Supply','fascia','hardware',960,320,'stencil-hardware',['#e9ddbb','#283732','#bd6631'],'HARDWARE SUPPLY','FERRETERÍA · HERRAMIENTAS','NUTS • BOLTS • PAINT','wrench');
add('s11','Banco Continental','fascia','bank',1024,384,'bank-geometric',['#ece5cb','#236457','#d9ac42'],'BANCO CONTINENTAL','SAVINGS & LOANS · AHORRO Y CRÉDITO','SU BANCO DE CONFIANZA','bank');
add('s12','Hotel Imperial','fascia','hotel',960,400,'hotel-artdeco',['#283632','#e8c778','#eee4c5'],'HOTEL IMPERIAL','ROOMS · HABITACIONES','BAÑO PRIVADO • PRIVATE BATH');
add('s13','Café Avenida','fascia','cafe',960,384,'cafe-neon',['#213334','#efd096','#d77450'],'Café Avenida','COFFEE · DESAYUNOS','OPEN 24 HOURS • ABIERTO 24 H','cup');
add('s14','Farmacia del Pueblo','fascia','pharmacy',960,320,'pharmacy-cross',['#f0ead4','#317953','#b33c33'],'FARMACIA DEL PUEBLO','PHARMACY · RECETAS','MEDICINAS • FIRST AID','cross');
add('s15','Supermercado Sol','fascia','supermarket',960,360,'sun-market',['#e8ba4d','#aa3e2a','#faf1d2'],'SUPERMERCADO SOL','FRESH FOOD · PRODUCTOS FRESCOS','BUEN PRECIO TODOS LOS DÍAS','sun');
add('s16','Radio y Televisión Atlas','fascia','electronics',960,320,'electronics-signal',['#e9dfc7','#395578','#ba422d'],'ATLAS RADIO & TV','VENTA Y REPARACIÓN · SALES & SERVICE','STEREO • COLOR TV • HI-FI','radio');
add('s17','Casa Mendoza Muebles','fascia','furniture',960,400,'furniture-seventies',['#cf793a','#f4dfaa','#553b2d'],'Casa Mendoza','MUEBLES · FURNITURE','CALIDAD PARA SU HOGAR','chair');
add('s18','Librería Universal','fascia','bookshop',960,360,'bookshop-classic',['#ece2bc','#4e4e30','#984335'],'LIBRERÍA UNIVERSAL','BOOKS · REVISTAS · PAPELERÍA','LECTURA PARA TODOS','book');
add('s19','Óptica Moderna','fascia','optician',960,320,'optical-eyes',['#edeadf','#25495c','#d29835'],'ÓPTICA MODERNA','OPTICAL · LENTES Y EXÁMENES','SEE BETTER • VEA MEJOR','glasses');
add('s20','Rosas Florist','fascia','florist',960,384,'florist-organic',['#e2e8ca','#597149','#964656'],'Rosas','FLORIST · FLORERÍA','FLOWERS FOR EVERY OCCASION','leaf');
add('s21','El Camino Restaurant','fascia','restaurant',960,360,'restaurant-tile',['#f0dbac','#24757b','#b94b30'],'EL CAMINO','RESTAURANT · COMIDA CASERA','BREAKFAST • LUNCH • DINNER');
add('s22','Central Barber Shop','fascia','barber',960,320,'barber-poles',['#f0eddb','#ae3631','#284d76'],'CENTRAL BARBER SHOP','PELUQUERÍA · CORTES PARA TODOS','HAIRCUTS • SHAVES','scissors');
add('s23','Joyería Diamante','fascia','jeweler',960,384,'jewel-black-gold',['#282c30','#d6b55c','#efe4bc'],'JOYERÍA DIAMANTE','JEWELERS · RELOJERÍA','GOLD • SILVER • REPAIRS','diamond');
add('s24','Mercado San José','fascia','produce',960,320,'produce-handpainted',['#dcd6a5','#415b31','#b63c29'],'MERCADO SAN JOSÉ','FRUITS & VEGETABLES · FRUTAS Y VERDURAS','DEL CAMPO A SU MESA','leaf');
add('s25','El Vaquero Boots','fascia','shoe-shop',960,360,'western-boots',['#e5cda0','#6a3c29','#b56835'],'EL VAQUERO','BOOTS & SHOES · BOTAS Y ZAPATOS','REPARACIÓN • REPAIRS');
add('s26','Fashion House','fascia','clothing',960,400,'fashion-oval',['#e4d3c2','#513a51','#b0767a'],'Fashion House','MODAS · DAMAS Y CABALLEROS','STYLE FOR EVERY DAY');
add('s27','Carnicería La Favorita','fascia','butcher',960,320,'butcher-checker',['#ece6c8','#aa342e','#2d453e'],'LA FAVORITA','CARNICERÍA · QUALITY MEATS','RES • CERDO • POLLO');
add('s28','Pescadería Costa Azul','fascia','fishmonger',960,384,'fish-waves',['#e5eadb','#256584','#4ba5a3'],'COSTA AZUL','PESCADERÍA · FRESH SEAFOOD','FRESCO TODOS LOS DÍAS','fish');
add('s29','Discos Mundo','fascia','record-shop',960,320,'record-pop',['#e8a037','#422f42','#ebe0bd'],'DISCOS MUNDO','RECORDS · CASSETTES · MÚSICA','NUEVOS ÉXITOS CADA SEMANA','record');
add('s30','Tintorería Express','fascia','dry-cleaner',960,360,'cleaner-speed',['#dde8dd','#2d657e','#b34137'],'TINTORERÍA EXPRESS','DRY CLEANING · LAVADO EN SECO','SAME DAY SERVICE');
add('s31','Panadería El Trigal','fascia','bakery',960,320,'bakery-wheat',['#e0bb6d','#6d4027','#f7edc8'],'PANADERÍA EL TRIGAL','BAKERY · PAN CALIENTE','HORNEADO CADA MAÑANA','bread');
add('s32','American Tires','fascia','tires',960,384,'tire-racing',['#ece0bd','#28303a','#bd4a29'],'AMERICAN TIRES','LLANTAS · ALINEACIÓN · BALANCEO','NEW & USED • NUEVAS Y USADAS','tyre');
add('s33','Centro de Copias','fascia','copy-shop',960,320,'copy-registration',['#e9e6d7','#263c54','#b74431'],'CENTRO DE COPIAS','COPIES · IMPRESIÓN · ENCUADERNADO','COPIAS CLARAS • FAST SERVICE');
add('s34','Eléctrica Norte','fascia','electrical',960,360,'electric-lightning',['#ecc749','#293b56','#e9ead8'],'ELÉCTRICA NORTE','ELECTRICAL SUPPLIES · MATERIAL ELÉCTRICO','CABLE • FOCOS • INTERRUPTORES');
add('s35','Hogar Realty','fascia','real-estate',960,320,'realty-roof',['#e7e4ca','#426655','#be5d39'],'HOGAR REALTY','BIENES RAÍCES · SALES & RENTALS','COMPRE • VENDA • RENTE','house');
add('s36','Seguros La Unión','fascia','insurance',960,360,'insurance-shield',['#e7e3cf','#3b5876','#b49348'],'SEGUROS LA UNIÓN','INSURANCE · AUTO • VIDA • HOGAR','PROTECCIÓN DESDE 1972');
add('s37','Taquería El Güero','fascia','taqueria',960,320,'taqueria-scallop',['#efd18a','#a5422c','#436a45'],'TAQUERÍA EL GÜERO','TACOS · TORTAS · MEXICAN FOOD','HECHO AL MOMENTO');
add('s38','Palacio Cinema','fascia','cinema',960,400,'cinema-marquee',['#f1dfa9','#973c32','#292d35'],'PALACIO CINEMA','CINE · DOUBLE FEATURE','CONTINUOUS SHOWS • FUNCIÓN CORRIDA');
add('s39','Bazar América','fascia','variety',960,320,'bazar-rainbow',['#e9ddbd','#893d35','#1e6c76'],'BAZAR AMÉRICA','VARIETY STORE · TODO PARA EL HOGAR','REGALOS • JUGUETES • NOVEDADES');
add('s40','Cerrajería City Lock','fascia','locksmith',960,384,'locksmith-keyhole',['#d7d5bf','#3b4d51','#b88234'],'CITY LOCK','CERRAJERÍA · KEYS CUT HERE','LLAVES • CANDADOS • REPARACIONES','key');
// Twelve vertical projecting banners, columns, and blade signs.
add('s41','Hotel Plaza Vertical','vertical','hotel',320,960,'vertical-hotel',['#852f2d','#f6ddb0','#bd933e'],'HOTEL','PLAZA','ROOMS · CUARTOS');
add('s42','Farmacia Vertical','vertical','pharmacy',320,896,'vertical-pharmacy',['#f0ead4','#24704f','#bb3b30'],'FARMACIA','PHARMACY','ABIERTO','cross');
add('s43','Fotos Rápidas Vertical','vertical','photo',320,800,'vertical-photo',['#232f3c','#f2e6c4','#bd3739'],'FOTOS','1 HORA','1 HOUR PHOTO','camera');
add('s44','Óptica Vision Vertical','vertical','optician',352,896,'vertical-optic',['#e6e0c7','#344c69','#a57f41'],'ÓPTICA','VISION','EYE EXAMS','glasses');
add('s45','Discos Stereo Vertical','vertical','record-shop',320,768,'vertical-records',['#bd6b31','#f2da9d','#442d45'],'DISCOS','STEREO','RECORDS','record');
add('s46','Lavandería Vertical','vertical','laundromat',320,960,'vertical-laundry',['#d6e5d8','#2f6d78','#f8efcd'],'LAVAR','LAVANDERÍA','LAUNDRY','washer');
add('s47','Barbería Vertical','vertical','barber',320,896,'vertical-barber',['#ede7cd','#9d342d','#314d73'],'BARBER','CORTES','PELUQUERÍA','scissors');
add('s48','Banco Ahorro Vertical','vertical','bank',352,960,'vertical-bank',['#305349','#ebd599','#b18c3d'],'BANCO','AHORRO','SAVINGS','bank');
add('s49','Travel Viajes Vertical','vertical','travel',352,896,'vertical-travel',['#2c6581','#e8dda5','#dc8e3a'],'VIAJES','TRAVEL','BOLETOS','plane');
add('s50','Motel Luna Vertical','vertical','motel',320,960,'vertical-motel',['#283745','#e8bc62','#d56e4c'],'MOTEL','LUNA','VACANCY · LIBRE');
add('s51','Dentista Vertical','vertical','dentist',352,896,'vertical-dental',['#ebebe0','#3d6f73','#829f99'],'DENTAL','DENTISTA','FAMILY CARE','tooth');
add('s52','Estacionamiento Vertical','vertical','parking',320,832,'vertical-parking',['#e9d37e','#2c4254','#be4b33'],'PARKING','PÚBLICO','PARKING');
// Twelve small projecting plaques / window decals.
add('s53','Clínica Consultation Plaque','plaque','clinic',512,384,'plaque-medical',['#d4c3a2','#3d463d','#92805f'],'DR. S. MORALES','MEDICINA GENERAL','FAMILY PHYSICIAN','cross');
add('s54','Laboratory Specimen Plaque','plaque','laboratory',512,512,'plaque-lab',['#f0e9d1','#285b6e','#b59551'],'LAB','ANÁLISIS CLÍNICOS','CLINICAL TESTING','flask');
add('s55','Pastries Hanging Oval','plaque','bakery',640,384,'plaque-bakery',['#e6d3a8','#793c36','#c6a34b'],'Dulce Hogar','PASTELERÍA','CAKES & PASTRIES','bread');
add('s56','Open Bilingual Window','decal','open',512,384,'decal-open',['#213f44','#eedfba','#c1513a'],'OPEN','ABIERTO','WELCOME • BIENVENIDOS');
add('s57','Bank Exchange Window','decal','bank',512,512,'decal-exchange',['#e9e4ca','#3c6254','#c29338'],'CAMBIO','CURRENCY EXCHANGE','DÓLARES • PESOS');
add('s58','Travel Agents Plaque','plaque','travel',640,384,'plaque-travel',['#274d6d','#e7dbb4','#c5914a'],'VIAJES DEL SUR','TRAVEL AGENTS','AIR • RAIL • CRUISES','plane');
add('s59','Vacancy Motel Window','decal','motel',512,320,'decal-vacancy',['#28382f','#e19a50','#ead5a4'],'VACANCY','HABITACIONES LIBRES','MOTEL • BAÑO PRIVADO');
add('s60','Shoe Repair Hanging Plaque','plaque','shoe-repair',512,512,'plaque-cobbler',['#cfac74','#4e3826','#a65e36'],'SHOE','REPAIR','REPARACIÓN DE CALZADO');
add('s61','Telephone Window Sign','decal','telephone',384,512,'decal-phone',['#dedac0','#2d4c6b','#c07c38'],'TELÉFONO','PUBLIC PHONE','LOCAL • LARGA DISTANCIA','phone');
add('s62','Dental Office Enamel','plaque','dentist',640,384,'plaque-dental',['#e9ece0','#446f75','#afbead'],'DENTAL OFFICE','CONSULTORIO DENTAL','ENTRANCE • ENTRADA','tooth');
add('s63','Barber Scissors Projector','plaque','barber',512,512,'plaque-barber',['#ede5ca','#923d30','#37546a'],'CORTES','BARBER SHOP','CABALLEROS • NIÑOS','scissors');
add('s64','Fresh Coffee Window','decal','cafe',512,512,'decal-coffee',['#673f2c','#f0d7a4','#b96b35'],'CAFÉ','FRESH COFFEE','PAN DULCE • HOT COFFEE','cup');
// Eight giant billboard / rooftop advertisement designs.
add('s65','Refrescos Tropical Billboard','billboard','beverage',1024,384,'billboard-tropical',['#e9b44b','#a6382f','#eee8c9'],'TROPICAL','REFRESH YOUR DAY · REFRESCA TU DÍA','REFRESCOS • FRUIT SODA','sun');
add('s66','Hotel Continental Roof Sign','roofsign','hotel',1024,384,'roof-hotel',['#1b3942','#e8d19a','#b96e43'],'HOTEL CONTINENTAL','DOWNTOWN · EN EL CENTRO','ROOMS • RESTAURANT • PARKING');
add('s67','Se Renta Office Billboard','billboard','leasing',1024,400,'billboard-leasing',['#e6e4d8','#2b5372','#b43e30'],'OFFICE SPACE','SE RENTAN OFICINAS','555–0198 • INFORMES / LEASING');
add('s68','Banco Futuro Roof Advertisement','roofsign','bank',1024,384,'roof-bank',['#21564d','#e7d99d','#c89134'],'BANCO FUTURO','YOUR FUTURE STARTS HERE','SU FUTURO EMPIEZA AQUÍ','bank');
add('s69','Atlas Tires Painted Wall Ad','billboard','tires',1024,448,'ghost-tires',['#b9a889','#5d5041','#906346'],'ATLAS TIRES','LLANTAS ATLAS · BUILT TO LAST','VENTA Y SERVICIO DESDE 1971','tyre');
add('s70','Pan Sol Painted Wall Ad','billboard','bakery',1024,400,'ghost-bread',['#c5b493','#8f6446','#68614b'],'PAN SOL','FRESH EVERY MORNING','FRESCO CADA MAÑANA','bread');
add('s71','Viajes Aeromar Billboard','billboard','travel',1024,384,'billboard-travel',['#d9e0cf','#2e6c8a','#d98b3a'],'AEROMAR','YOUR NEXT HORIZON · SU PRÓXIMO DESTINO','VIAJES • VACACIONES • TRAVEL','plane');
add('s72','La Nacional Department Store Roof','roofsign','department-store',1024,400,'roof-department',['#ab3b32','#eee1b6','#e3b84a'],'LA NACIONAL','DEPARTMENT STORE · ALMACENES','TODO PARA USTED Y SU HOGAR');

function fascia(s){const [a,b,c]=s.palette;rect(0,0,1,1,a);
  switch(s.style){
    case 'medical-modern':rect(0,0,.17,1,b);icon('cross',.085,.44,.5,a);rect(.17,.75,.83,.25,b);text(s.main,.575,.34,.21,b,'sans',.77);text(s.sub,.575,.59,.105,b,'regular',.77);text(s.extra,.575,.872,.10,a,'sans',.74);break;
    case 'laboratory-grid':for(let x=.02;x<1;x+=.04)line(x,0,x,1,'#dae0d4',.002);for(let y=.06;y<1;y+=.12)line(0,y,1,y,'#dae0d4',.002);rect(.025,.075,.2,.85,b);icon('flask',.125,.39,.5,a);text('LAB',.125,.77,.16,a,'narrow',.17);text(s.main,.615,.32,.2,b,'narrow',.7);line(.27,.5,.965,.5,c,.016);text(s.sub,.615,.64,.105,b,'mono',.68);text(s.extra,.615,.84,.085,b,'regular',.5);border(b,.02,.012);break;
    case 'bakery-script':border(b,.025,.015);border(c,.053,.009);for(const x of [.1,.9]){icon('bread',x,.46,.3,b);star(x,.77,.046,c,6);}text(s.main,.5,.34,.33,b,'script',.65);text(s.sub,.5,.635,.13,b,'book',.69);text(s.extra,.5,.82,.077,b,'sans',.74);break;
    case 'photo-spectrum':stripes(0,.12,['#dcaf3b','#c74d2e','#a62938','#495d93','#38817d']);rect(.015,.18,.21,.64,b);icon('camera',.12,.48,.38,a);text('COLOR',.12,.73,.075,a,'sans',.18);text('PHOTO',.43,.405,.25,b,'sans',.36);text('1',.717,.4,.51,c,'narrow',.16);text('HOUR',.89,.40,.18,b,'narrow',.19);rect(.24,.64,.74,.15,c);text(s.sub,.61,.715,.125,a,'sans',.7);text(s.extra,.61,.9,.07,b,'mono',.7);break;
    case 'laundry-bubbles':for(let i=0;i<7;i++)circle(.065+i*.14,.22+(i%2)*.54,.12+i*.008,'#e8f0df',b,.004);box(.15,.14,.82,.69,c,.1);icon('washer',.075,.51,.45,b);text(s.main,.56,.35,.22,b,'geometric',.74);text(s.sub,.56,.61,.11,b,'sans',.74);rect(.15,.85,.82,.1,b);text(s.extra,.56,.905,.065,c,'regular',.72);break;
    case 'corner-ribbon':rect(0,0,.065,1,b);rect(.935,0,.065,1,b);for(let i=0;i<6;i++)rect(.065+i*.145,0,.072,.1,c);text(s.main,.5,.32,.32,b,'italic',.79);poly([[.13,.57],[.87,.57],[.83,.72],[.87,.82],[.13,.82],[.17,.7]],c);text(s.sub,.5,.7,.125,a,'sans',.71);text(s.extra,.5,.93,.065,b,'regular',.76);break;
    case 'industrial-chevrons':rect(0,.73,1,.27,b);for(let i=-2;i<8;i++)poly([[i*.15,0],[i*.15+.05,0],[i*.15+.15,.16],[i*.15+.1,.16]],b);icon('wrench',.09,.44,.36,b);text(s.main,.57,.385,.205,b,'narrow',.79);text(s.sub,.57,.61,.095,b,'mono',.76);text(s.extra,.5,.864,.106,a,'sans',.85);break;
    case 'dental-minimal':icon('tooth',.1,.46,.5,b);line(.19,.18,.19,.8,c,.006);text(s.main,.57,.33,.23,b,'regular',.74);text(s.sub,.57,.58,.123,b,'narrow',.72);line(.26,.72,.92,.72,c,.006);text(s.extra,.57,.86,.078,b,'serif',.75);break;
    case 'travel-horizon':rays(.07,.66,[a,'#edf0db'],-Math.PI,0,16);rect(0,.76,1,.24,b);circle(.11,.66,.25,c);icon('plane',.11,.38,.48,b);text(s.main,.594,.29,.20,b,'narrow',.74);text(s.sub,.594,.53,.102,b,'sans',.73);text(s.extra,.61,.876,.105,a,'geometric',.65);break;
    case 'stencil-hardware':border(b,.025,.017);rect(.04,.68,.92,.26,b);for(let x=.035;x<1;x+=.1)rect(x,.056,.045,.055,c);text(s.main,.5,.335,.25,b,'mono',.88);text(s.sub,.5,.56,.102,b,'narrow',.83);text(s.extra,.5,.815,.126,a,'mono',.82);screws();break;
    case 'bank-geometric':rect(0,0,.22,1,b);for(let i=0;i<3;i++)poly([[.045+i*.045,.67],[.067+i*.045,.27],[.09+i*.045,.67]],a);text(s.main,.615,.34,.205,b,'geometric',.72);rect(.265,.515,.67,.022,c);text(s.sub,.615,.665,.108,b,'sans',.72);text(s.extra,.615,.87,.07,b,'regular',.69);break;
    case 'hotel-artdeco':for(let i=0;i<3;i++){border(b,.022+i*.023,.004);}for(let x of [.1,.9]){line(x,.13,x,.82,b,.006);poly([[x-.022,.21],[x,.13],[x+.022,.21],[x,.29]],b);}text(s.main,.5,.34,.22,b,'serif',.76);line(.21,.57,.79,.57,b,.006);text(s.sub,.5,.695,.108,c,'geometric',.73);text(s.extra,.5,.856,.073,b,'regular',.67);break;
    case 'cafe-neon':box(.035,.06,.93,.87,a,.09,b,.008);box(.055,.095,.89,.8,a,.06,c,.008);icon('cup',.12,.45,.34,c);text(s.main,.56,.335,.28,b,'script',.73,{stroke:c});text(s.sub,.56,.59,.114,b,'geometric',.72);text(s.extra,.5,.83,.07,c,'mono',.83);break;
    case 'pharmacy-cross':rect(.025,.08,.17,.82,b);icon('cross',.11,.41,.39,a);text('Rx',.11,.77,.17,a,'serif',.12);text(s.main,.59,.31,.205,b,'narrow',.74);line(.235,.485,.955,.485,c,.022);text(s.sub,.59,.64,.126,b,'sans',.67);text(s.extra,.59,.86,.093,b,'regular',.72);border(b,.013,.005);break;
    case 'sun-market':rays(.085,.47,[a,'#e9c86e'],0,Math.PI*2,24);circle(.09,.43,.31,c);icon('sun',.09,.43,.47,b);rect(.19,.09,.785,.79,c);text(s.main,.58,.3,.21,b,'book',.73);text(s.sub,.58,.55,.105,b,'sans',.71);line(.29,.69,.87,.69,b,.005);text(s.extra,.58,.79,.077,b,'regular',.71);break;
    case 'electronics-signal':rect(0,.8,1,.2,b);icon('radio',.098,.43,.42,b);for(let i=0;i<4;i++)line(.2+i*.02,.18,.2+i*.02,.63,c,.008);text(s.main,.635,.31,.24,b,'narrow',.65);text(s.sub,.635,.62,.11,b,'sans',.63);text(s.extra,.5,.908,.107,a,'mono',.9);break;
    case 'furniture-seventies':for(let i=0;i<4;i++)box(.025+i*.026,.07+i*.036,.95-i*.052,.86-i*.072,i%2?a:b,.22);box(.19,.21,.69,.57,a,.1);icon('chair',.115,.49,.32,c);text(s.main,.545,.4,.26,c,'book',.61);text(s.sub,.55,.65,.117,c,'sans',.61);rect(.22,.845,.66,.10,a);text(s.extra,.55,.9,.075,c,'regular',.64);break;
    case 'bookshop-classic':border(b,.025,.013);rect(.042,.068,.045,.864,b);rect(.913,.068,.045,.864,b);text(s.main,.5,.28,.185,b,'serif',.79);icon('book',.15,.66,.24,b);text(s.sub,.565,.57,.111,b,'serif',.64);text(s.extra,.565,.795,.082,c,'regular',.62);break;
    case 'optical-eyes':icon('glasses',.5,.28,.75,b);text(s.main,.5,.565,.21,b,'geometric',.87);rect(.04,.748,.92,.19,b);text(s.sub,.5,.835,.114,a,'sans',.85);text(s.extra,.86,.18,.066,b,'regular',.22);break;
    case 'florist-organic':for(let i=0;i<5;i++){icon('leaf',.07+(i%2)*.045,.19+i*.15,.18,b);icon('leaf',.93-(i%2)*.045,.19+i*.15,.18,b);}text(s.main,.5,.285,.4,c,'script',.62);text(s.sub,.5,.62,.148,b,'serif',.67);text(s.extra,.5,.84,.074,b,'regular',.7);break;
    case 'restaurant-tile':for(let i=0;i<20;i++)for(let j of [0,1])poly([[i*.05,j?.90:0],[i*.05+.025,j?.95:.05],[i*.05+.05,j?.90:0],[i*.05+.025,j?.85:-.05]],i%2?b:c);border(b,.025,.012);text(s.main,.5,.31,.285,c,'book',.86,{shadow:b});text(s.sub,.5,.61,.13,b,'serif',.86);text(s.extra,.5,.8,.085,c,'sans',.8);break;
    case 'barber-poles':for(let x of [.045,.905]){box(x,.09,.05,.81,a,.03,b,.008);for(let y=.1;y<.88;y+=.12)poly([[x,y],[x+.05,y+.06],[x+.05,y+.12],[x,y+.06]],Math.round(y*100)%3?b:c);}text(s.main,.5,.32,.205,c,'narrow',.77);text(s.sub,.5,.59,.105,b,'sans',.76);text(s.extra,.5,.82,.094,c,'serif',.68);break;
    case 'jewel-black-gold':border(b,.024,.009);icon('diamond',.105,.42,.38,b);line(.19,.11,.19,.88,b,.006);text(s.main,.585,.345,.207,b,'serif',.71);text(s.sub,.585,.60,.118,c,'serif',.69);text(s.extra,.585,.82,.078,b,'regular',.68);break;
    case 'produce-handpainted':rect(0,.08,1,.78,'#e8dfb2');border(b,.029,.012);text(s.main,.5,.315,.247,b,'italic',.89);text(s.sub,.5,.58,.106,b,'narrow',.87);rect(.15,.76,.7,.16,c);text(s.extra,.5,.84,.09,a,'sans',.64);break;
    case 'western-boots':border(b,.025,.017);for(let x of [.085,.915])star(x,.4,.082,b,5);text(s.main,.5,.3,.28,b,'serif',.75,{shadow:c});text(s.sub,.5,.585,.115,b,'book',.8);poly([[.25,.77],[.75,.77],[.71,.9],[.29,.9]],b);text(s.extra,.5,.84,.091,a,'mono',.43);break;
    case 'fashion-oval':ctx.beginPath();ctx.ellipse(.5*W,.46*H,.43*W,.39*H,0,0,Math.PI*2);ctx.fillStyle=b;ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=.018*H;ctx.stroke();text(s.main,.5,.37,.28,a,'script',.75);text(s.sub,.5,.6,.118,a,'serif',.69);text(s.extra,.5,.923,.068,b,'regular',.71);break;
    case 'butcher-checker':for(let y of [0,.88])for(let i=0;i<24;i++)rect(i/24,y,1/24,.12,i%2?b:a);text(s.main,.5,.33,.27,b,'book',.88);text(s.sub,.5,.60,.12,c,'sans',.86);text(s.extra,.5,.795,.087,b,'regular',.8);break;
    case 'fish-waves':for(let i=0;i<18;i++)circle(i*.062,.99,.115,i%2?b:c);icon('fish',.105,.4,.42,b);text(s.main,.59,.29,.27,b,'geometric',.69);text(s.sub,.59,.56,.122,b,'serif',.72);text(s.extra,.59,.77,.079,b,'regular',.7);break;
    case 'record-pop':circle(.11,.5,.37,b);circle(.11,.5,.11,a);for(let i=0;i<3;i++)circle(.11,.5,.17+i*.07,'rgba(0,0,0,0)',c,.003);text(s.main,.61,.35,.26,b,'geometric',.73);rect(.24,.56,.71,.20,b);text(s.sub,.595,.66,.126,a,'narrow',.66);text(s.extra,.61,.87,.071,b,'mono',.72);break;
    case 'cleaner-speed':for(let i=0;i<4;i++)poly([[0,.15+i*.17],[.22,.15+i*.17],[.16,.21+i*.17],[0,.21+i*.17]],b);text(s.main,.58,.33,.234,b,'narrow',.76);text(s.sub,.58,.62,.115,b,'sans',.74);rect(.29,.81,.64,.13,c);text(s.extra,.61,.878,.091,a,'sans',.61);break;
    case 'bakery-wheat':for(let x of [.08,.92]){line(x,.2,x,.79,b,.015);for(let i=0;i<4;i++){line(x,.28+i*.11,x-.025,.2+i*.11,b,.035);line(x,.28+i*.11,x+.025,.2+i*.11,b,.035);}}text(s.main,.5,.31,.224,b,'book',.72);text(s.sub,.5,.58,.14,b,'serif',.74);text(s.extra,.5,.82,.084,b,'regular',.74);border(b,.025,.008);break;
    case 'tire-racing':rect(.0,0,.19,1,b);icon('tyre',.095,.43,.53,a);for(let j=0;j<2;j++)for(let i=0;i<24;i++)rect(.2+i*.034,.8+j*.1,.034,.1,(i+j)%2?b:a);text(s.main,.6,.28,.255,c,'narrow',.75);text(s.sub,.6,.53,.108,b,'sans',.74);text(s.extra,.6,.685,.075,b,'mono',.72);break;
    case 'copy-registration':for(let i=0;i<3;i++)rect(.025+i*.03,.15+i*.1,.13,.49,[c,'#d3a131',b][i]);text(s.main,.62,.29,.238,b,'narrow',.71);text(s.sub,.62,.56,.116,b,'sans',.70);line(.27,.73,.96,.73,c,.014);text(s.extra,.62,.86,.089,b,'mono',.68);break;
    case 'electric-lightning':poly([[.105,.08],[.025,.5],[.11,.48],[.07,.9],[.21,.36],[.12,.4]],b);text(s.main,.60,.325,.247,b,'narrow',.72);rect(.25,.54,.70,.23,b);text(s.sub,.60,.653,.105,c,'sans',.66);text(s.extra,.60,.9,.08,b,'mono',.69);break;
    case 'realty-roof':poly([[.02,.49],[.13,.17],[.24,.49],[.21,.49],[.21,.9],[.06,.9],[.06,.49]],b);icon('house',.135,.58,.29,a);text(s.main,.625,.33,.265,b,'serif',.69);text(s.sub,.625,.61,.115,b,'sans',.68);rect(.29,.82,.66,.10,c);text(s.extra,.62,.874,.081,a,'regular',.62);break;
    case 'insurance-shield':poly([[.03,.17],[.19,.17],[.19,.55],[.11,.79],[.03,.55]],b);text('U',.11,.39,.28,a,'serif',.14);text(s.main,.60,.325,.228,b,'serif',.73);text(s.sub,.60,.605,.114,b,'sans',.73);text(s.extra,.60,.84,.092,b,'regular',.71);border(c,.025,.007);break;
    case 'taqueria-scallop':for(let i=0;i<17;i++)circle(i/16,.015,.12,i%2?b:c);text(s.main,.5,.38,.25,b,'book',.90);text(s.sub,.5,.65,.131,c,'sans',.89);line(.17,.82,.83,.82,b,.009);text(s.extra,.5,.921,.08,b,'regular',.85);break;
    case 'cinema-marquee':rect(.0,.0,1,.54,b);text(s.main,.5,.29,.245,a,'narrow',.87,{shadow:c});box(.06,.57,.88,.34,a,.015,c,.009);text(s.sub,.5,.681,.125,c,'mono',.83);text(s.extra,.5,.83,.076,c,'mono',.83);for(let x=.02;x<1;x+=.04){circle(x,.07,.019,a);circle(x,.97,.018,b);}break;
    case 'bazar-rainbow':for(let i=0;i<4;i++)rect(0,.025+i*.033,1,.027,[b,'#c16936','#d1a945',c][i]);text(s.main,.5,.41,.30,b,'geometric',.91);text(s.sub,.5,.69,.127,c,'sans',.86);text(s.extra,.5,.91,.087,b,'regular',.83);break;
    case 'locksmith-keyhole':box(.025,.075,.19,.85,b,.08);icon('key',.12,.39,.39,a);text('KEYS',.12,.755,.097,a,'sans',.15);text(s.main,.60,.28,.27,b,'geometric',.69);text(s.sub,.60,.58,.116,b,'sans',.69);line(.28,.75,.94,.75,c,.017);text(s.extra,.60,.88,.079,b,'mono',.67);break;
  }
}
function letters(str,x,y,step,size,col,font='narrow',max=.65){[...str].forEach((v,i)=>text(v,x,y+i*step,size,col,font,max));}
function vertical(s){const[a,b,c]=s.palette;rect(0,0,1,1,a);
  switch(s.style){
    case 'vertical-hotel':border(c,.035,.022);border(b,.063,.01);text(s.sub,.5,.113,.045,b,'serif',.79);letters(s.main,.5,.259,.124,.129,b);rect(.09,.883,.82,.058,c);text(s.extra,.5,.913,.025,a,'sans',.74);break;
    case 'vertical-pharmacy':rect(.05,.02,.9,.14,b);icon('cross',.5,.09,.27,a);letters(s.main,.5,.232,.073,.068,b);rect(.07,.84,.86,.08,b);text(s.sub,.5,.881,.036,a,'narrow',.80);text(s.extra,.5,.973,.023,c,'sans',.8);border(b,.015,.012);break;
    case 'vertical-photo':stripes(.01,.13,['#dcac39','#c65d2e','#ae2a36','#596598','#2d8f81']);text(s.main,.5,.23,.075,b,'narrow',.87);text('1',.5,.48,.35,b,'narrow',.87);rect(.08,.67,.84,.11,c);text('HORA',.5,.73,.08,b,'narrow',.79);text('PHOTO',.5,.85,.046,b,'sans',.85);text('1 HOUR',.5,.926,.044,b,'sans',.8);break;
    case 'vertical-optic':border(b,.04,.015);icon('glasses',.5,.12,.7,b);letters('ÓPTICA',.5,.295,.094,.09,b,'geometric');rect(.11,.841,.78,.065,b);text(s.sub,.5,.875,.039,a,'sans',.72);text(s.extra,.5,.936,.022,b,'regular',.8);break;
    case 'vertical-records':circle(.5,.22,.42,c);circle(.5,.22,.12,a);text(s.main,.5,.48,.085,c,'geometric',.89);rect(.08,.60,.84,.032,b);text(s.sub,.5,.72,.059,c,'narrow',.82);text(s.extra,.5,.87,.039,c,'sans',.85);border(b,.025,.03);break;
    case 'vertical-laundry':for(let i=0;i<8;i++)circle(i%2?.9:.1,.06+i*.12,.16,'#eaf0dd',b,.003);icon('washer',.5,.14,.64,b);letters(s.main,.5,.34,.095,.085,b);box(.08,.796,.84,.151,c,.04);text(s.sub,.5,.83,.031,b,'narrow',.77);text(s.extra,.5,.909,.038,b,'sans',.79);break;
    case 'vertical-barber':for(let x of [0,.84])for(let i=0;i<12;i++)poly([[x,i*.083],[x+.16,i*.083+.045],[x+.16,i*.083+.083],[x,i*.083+.04]],i%2?b:c);letters(s.main,.5,.14,.119,.114,c);text(s.sub,.5,.837,.05,b,'narrow',.64);text(s.extra,.5,.934,.029,c,'narrow',.65);break;
    case 'vertical-bank':for(let x of [.06,.91])rect(x,.025,.025,.95,c);icon('bank',.5,.135,.66,b);letters(s.main,.5,.33,.107,.102,b,'geometric');line(.17,.846,.83,.846,b,.012);text(s.sub,.5,.90,.044,b,'sans',.8);text(s.extra,.5,.959,.025,b,'regular',.8);break;
    case 'vertical-travel':for(let i=0;i<6;i++)rect(0,.045+i*.03,1,.017,i%2?c:b);icon('plane',.5,.34,.75,b);text(s.main,.5,.54,.08,b,'narrow',.9);text(s.sub,.5,.677,.057,b,'sans',.87);rect(.1,.79,.8,.106,c);text(s.extra,.5,.847,.044,a,'sans',.73);break;
    case 'vertical-motel':box(.045,.025,.91,.95,a,.085,c,.025);circle(.5,.1,.15,b);circle(.565,.077,.13,a);letters(s.main,.5,.26,.111,.115,b,'narrow');text(s.sub,.5,.80,.067,c,'serif',.80);box(.1,.899,.8,.061,c,.03);text(s.extra,.5,.932,.024,a,'sans',.74);break;
    case 'vertical-dental':icon('tooth',.5,.15,.58,b);line(.14,.29,.86,.29,c,.009);letters(s.main,.5,.367,.078,.075,b,'regular');text(s.sub,.5,.86,.036,b,'narrow',.86);text(s.extra,.5,.954,.028,b,'regular',.82);border(c,.025,.018);break;
    case 'vertical-parking':rect(.07,.035,.86,.335,b);text('P',.5,.23,.285,a,'sans',.80);text('PARKING',.5,.461,.053,b,'narrow',.90);text('PÚBLICO',.5,.59,.049,b,'sans',.9);poly([[.2,.745],[.5,.745],[.5,.69],[.84,.817],[.5,.945],[.5,.888],[.2,.888]],c);break;
  }
}
function plaque(s){const[a,b,c]=s.palette;rect(0,0,1,1,a);
  switch(s.style){
    case 'plaque-medical':{const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#e2d5bb');g.addColorStop(.5,a);g.addColorStop(1,'#ac987b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);border(c,.035,.018);icon('cross',.5,.20,.18,b);text(s.main,.5,.43,.115,b,'serif',.85,{shadow:'#e8dbc1'});text(s.sub,.5,.63,.088,b,'serif',.84);text(s.extra,.5,.82,.07,b,'regular',.83);screws();break;}
    case 'plaque-lab':border(b,.028,.025);border(c,.067,.01);icon('flask',.25,.30,.34,b);text(s.main,.64,.32,.19,b,'narrow',.45);line(.13,.55,.87,.55,c,.014);text(s.sub,.5,.70,.073,b,'sans',.81);text(s.extra,.5,.85,.054,b,'mono',.80);break;
    case 'plaque-bakery':ctx.beginPath();ctx.ellipse(W*.5,H*.5,W*.47,H*.45,0,0,Math.PI*2);ctx.fillStyle=b;ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=H*.022;ctx.stroke();text(s.main,.5,.32,.22,a,'script',.75);text(s.sub,.5,.61,.12,a,'serif',.75);text(s.extra,.5,.81,.078,a,'regular',.69);break;
    case 'decal-open':box(.055,.075,.89,.85,a,.09,b,.015);text(s.main,.5,.33,.32,b,'narrow',.82,{stroke:c,lineWidth:.003});text(s.sub,.5,.64,.17,c,'sans',.83);line(.17,.79,.83,.79,b,.009);text(s.extra,.5,.884,.069,b,'regular',.8);break;
    case 'decal-exchange':border(b,.033,.018);text('$',.22,.27,.22,c,'serif',.30);text('↔',.58,.27,.21,b,'sans',.45);text(s.main,.5,.53,.138,b,'geometric',.87);text(s.sub,.5,.724,.066,b,'sans',.87);rect(.075,.83,.85,.1,b);text(s.extra,.5,.883,.056,a,'sans',.80);break;
    case 'plaque-travel':icon('plane',.15,.35,.33,b);text(s.main,.60,.28,.145,b,'narrow',.69);text(s.sub,.60,.51,.105,b,'serif',.67);rect(.06,.72,.88,.20,c);text(s.extra,.5,.83,.09,a,'sans',.83);border(b,.025,.014);break;
    case 'decal-vacancy':box(.04,.09,.92,.80,a,.09,b,.018);text(s.main,.5,.35,.24,b,'narrow',.86,{stroke:'#663e29',lineWidth:.006});text(s.sub,.5,.62,.108,c,'narrow',.83);text(s.extra,.5,.80,.066,c,'regular',.80);break;
    case 'plaque-cobbler':border(b,.04,.014);for(let y of [.085,.91])for(let x=.09;x<.93;x+=.075)circle(x,y,.008,b);text(s.main,.5,.25,.19,b,'serif',.79);text(s.sub,.5,.49,.16,b,'serif',.81);line(.13,.65,.87,.65,b,.012);text('REPARACIÓN',.5,.765,.08,b,'narrow',.84);text('DE CALZADO',.5,.866,.068,b,'sans',.81);break;
    case 'decal-phone':border(b,.04,.02);icon('phone',.5,.24,.51,b);text(s.main,.5,.55,.073,b,'narrow',.85);text(s.sub,.5,.70,.055,b,'sans',.85);rect(.08,.822,.84,.11,b);text('LOCAL • LARGA DISTANCIA',.5,.88,.032,a,'narrow',.77);break;
    case 'plaque-dental':border(b,.03,.014);icon('tooth',.115,.385,.29,b);text(s.main,.595,.30,.135,b,'serif',.68);text(s.sub,.595,.54,.1,b,'regular',.68);rect(.09,.77,.81,.13,b);text(s.extra+'  →',.5,.837,.09,a,'sans',.78);screws();break;
    case 'plaque-barber':for(let i=0;i<12;i++)rect(i/12,0,1/12,.1,i%2?b:c);icon('scissors',.5,.32,.4,c);text(s.main,.5,.61,.145,b,'serif',.87);text(s.sub,.5,.79,.093,c,'sans',.86);text(s.extra,.5,.943,.047,b,'narrow',.84);break;
    case 'decal-coffee':border(b,.04,.018);icon('cup',.5,.24,.32,b);text(s.main,.5,.52,.23,b,'book',.84);text(s.sub,.5,.76,.091,b,'serif',.84);text(s.extra,.5,.915,.050,b,'narrow',.83);break;
  }
}
function billboard(s){const[a,b,c]=s.palette;rect(0,0,1,1,a);
  switch(s.style){
    case 'billboard-tropical':rays(.11,.53,[a,'#edc15a'],0,Math.PI*2,26);icon('sun',.12,.45,.54,b);text(s.main,.62,.32,.32,b,'book',.70,{shadow:c});text(s.sub,.62,.64,.128,b,'sans',.71);rect(.27,.84,.67,.10,b);text(s.extra,.605,.895,.075,c,'sans',.63);break;
    case 'roof-hotel':border(b,.022,.006);for(let x of [.06,.94]){line(x,.11,x,.87,c,.013);star(x,.48,.075,b,4);}text('HOTEL',.5,.205,.128,b,'geometric',.66);text('CONTINENTAL',.5,.456,.294,b,'narrow',.82,{shadow:'#9a572f'});text(s.sub,.5,.717,.096,b,'sans',.82);text(s.extra,.5,.898,.076,c,'mono',.84);break;
    case 'billboard-leasing':rect(0,0,.052,1,c);rect(.052,0,.948,.14,b);text('CENTRO COMERCIAL • DOWNTOWN',.52,.075,.08,a,'sans',.83);text(s.main,.52,.35,.235,b,'sans',.85);text(s.sub,.52,.62,.167,b,'narrow',.83);rect(.09,.81,.85,.135,c);text(s.extra,.52,.88,.098,a,'sans',.81);break;
    case 'roof-bank':rect(.025,.07,.2,.86,b);icon('bank',.125,.47,.57,a);text(s.main,.62,.305,.259,b,'geometric',.69);line(.28,.505,.96,.505,c,.015);text(s.sub,.62,.667,.124,b,'sans',.68);text(s.extra,.62,.869,.101,b,'regular',.68);break;
    case 'ghost-tires':border(b,.025,.014);icon('tyre',.125,.41,.49,b);text(s.main,.615,.315,.258,b,'narrow',.70);text(s.sub,.615,.585,.129,b,'serif',.70);text(s.extra,.54,.832,.09,b,'mono',.86);for(let i=0;i<5;i++)line(.04,.065+i*.187,.96,.065+i*.187,'rgba(79,66,47,.06)',.004);break;
    case 'ghost-bread':for(let y=.025;y<1;y+=.115)line(0,y,1,y,'rgba(87,73,50,.08)',.006);text(s.main,.40,.323,.34,b,'serif',.65);icon('bread',.86,.35,.52,b);text(s.sub,.5,.653,.138,c,'book',.85);text(s.extra,.5,.866,.097,c,'regular',.86);border(b,.02,.009);break;
    case 'billboard-travel':rect(0,.74,1,.26,b);circle(.86,.44,.33,c);icon('plane',.86,.27,.53,b);for(let i=0;i<4;i++)poly([[0,.03+i*.045],[.24,.03+i*.045],[.21,.061+i*.045],[0,.061+i*.045]],c);text(s.main,.4,.31,.33,b,'narrow',.69);text(s.sub,.4,.585,.104,b,'sans',.70);text(s.extra,.5,.88,.108,a,'sans',.90);break;
    case 'roof-department':for(let x of [.028,.966])rect(x,.03,.006,.94,b);text(s.main,.5,.36,.326,b,'narrow',.89,{shadow:'#72362b'});rect(.055,.622,.89,.17,b);text(s.sub,.5,.709,.118,a,'sans',.83);text(s.extra,.5,.915,.079,b,'regular',.83);for(let x=.08;x<.97;x+=.055)circle(x,.06,.013,c);break;
  }
}

const canvases=[];
for(const [index,s] of records.entries()){
  W=s.pixelWidth;H=s.pixelHeight;S=s;const canvas=createCanvas(W,H);ctx=canvas.getContext('2d');
  if(s.kind==='fascia')fascia(s);else if(s.kind==='vertical')vertical(s);else if(s.kind==='plaque'||s.kind==='decal')plaque(s);else billboard(s);
  weather(index);
  const filename=`${s.id}-${s.style}.png`;writeFileSync(join(output,filename),canvas.toBuffer('image/png'));canvases.push(canvas);
  Object.assign(s,{index,aspect:Number((W/H).toFixed(5)),pngPath:join(output,filename),filename,text:[s.main,s.sub,s.extra].filter(Boolean),era:'1970–1990',language:['English','Spanish'],source:'original procedural vector and typography',materialHint:s.style.startsWith('ghost')?'faded painted masonry':s.kind==='decal'?'printed window placard':s.style==='plaque-medical'?'brushed bronze':s.style.includes('neon')?'painted neon-outline enamel':'painted enamel / printed fascia'});
}
writeFileSync(join(output,'sign-catalog.json'),JSON.stringify(records,null,2)+'\n');

// Contact sheets preserve each texture's actual proportion.
function sheet(name,ids,cols,tw,th){const rows=Math.ceil(ids.length/cols),can=createCanvas(cols*tw,rows*th),g=can.getContext('2d');g.fillStyle='#d2d4d0';g.fillRect(0,0,can.width,can.height);ids.forEach((idx,i)=>{const s=records[idx],x=(i%cols)*tw,y=Math.floor(i/cols)*th,scale=Math.min((tw-18)/s.pixelWidth,(th-35)/s.pixelHeight),dw=s.pixelWidth*scale,dh=s.pixelHeight*scale;g.drawImage(canvases[idx],x+(tw-dw)/2,y+9+(th-35-dh)/2,dw,dh);g.fillStyle='#25312f';g.font=`14px ${F.regular}`;g.textAlign='center';g.fillText(`${s.id} · ${s.displayName}`,x+tw/2,y+th-9,tw-12);});writeFileSync(join(output,name),can.toBuffer('image/jpeg',90));}
sheet('contact-sheet.jpg',records.map((_,i)=>i),6,320,190);
sheet('contact-fascias.jpg',records.map((_,i)=>i).slice(0,40),4,480,200);
sheet('contact-verticals.jpg',records.map((_,i)=>i).slice(40,52),6,300,660);
sheet('contact-plaques.jpg',records.map((_,i)=>i).slice(52,64),4,400,410);
sheet('contact-billboards.jpg',records.map((_,i)=>i).slice(64),2,768,340);

// Deterministic native-resolution shelf packing suggestion, with 8 px gutters.
const atlasSize=4096,gutter=8,atlases=[];
for(const s of [...records].sort((a,b)=>b.pixelHeight-a.pixelHeight||b.pixelWidth-a.pixelWidth||a.index-b.index)){
  const rw=s.pixelWidth+gutter*2,rh=s.pixelHeight+gutter*2;let placed=false;
  for(let ai=0;ai<=atlases.length&&!placed;ai++){
    if(ai===atlases.length)atlases.push({size:atlasSize,shelves:[],entries:[]});
    const atlas=atlases[ai];let shelf=atlas.shelves.find(sh=>rh<=sh.h&&sh.x+rw<=atlasSize);
    if(!shelf){const y=atlas.shelves.reduce((n,sh)=>n+sh.h,0);if(y+rh<=atlasSize){shelf={x:0,y,h:rh};atlas.shelves.push(shelf);}}
    if(shelf){const x=shelf.x+gutter,y=shelf.y+gutter;atlas.entries.push({id:s.id,index:s.index,x,y,width:s.pixelWidth,height:s.pixelHeight,uv:[x/atlasSize,1-(y+s.pixelHeight)/atlasSize,(x+s.pixelWidth)/atlasSize,1-y/atlasSize]});shelf.x+=rw;placed=true;}
  }
}
writeFileSync(join(output,'atlas-packing-plan.json'),JSON.stringify({atlasSize,gutter,method:'height-sorted first-fit shelves; repeat nearest edge pixels into gutters; PNG coordinates top-left; UV bottom-left',colorSpace:'sRGB',alpha:false,textureFiltering:'LinearMipMapLinearFilter / LinearFilter',stableSelection:'Use catalog index or hash(buildingId + frontageId) modulo eligible-sign count. Match kind and category, then fit quad to native aspect without stretching.',atlases:atlases.map((a,i)=>({index:i,size:a.size,entries:a.entries}))},null,2)+'\n');
writeFileSync(join(output,'README.md'),`# Original bilingual urban sign textures\n\n72 original code-designed signs: 40 shop fascias, 12 vertical banners/blades, 7 small projecting/office plaques, 5 window decals, 5 giant billboards and 3 rooftop signs. English and Spanish appear throughout. Native pixel dimensions vary, with no edge larger than 1024 px.\n\nRun \`node generator.mjs [output-directory]\`. The generator resolves \`@napi-rs/canvas\` from \`CODEX_PRIMARY_RUNTIME_NODE_MODULES\` if it is not installed beside the script. It uses standard free URW system fonts and includes all drawing logic and exact wording.\n\nUse \`sign-catalog.json\` for stable indices, category matching, aspect-correct geometry, exact wording, palettes, and absolute PNG paths. Use the filename field when copying the collection. \`atlas-packing-plan.json\` suggests ${atlases.length} native-resolution 4096×4096 atlases, with 8 px extruded gutters. Extrude each texture's nearest edge pixel into the gutter before generating mipmaps. UVs are given in Three.js bottom-left convention. Retain native aspect; do not stretch a 3:1 fascia over a vertical blade.\n\nThe contact sheets are JPEGs, leaving exactly 72 individual sign PNGs. Every design is original procedural artwork; no stock photography or scraped brand art is used. Edge fading is deliberately subtle so shop names remain readable.\n`);
console.log(JSON.stringify({output,count:records.length,counts:records.reduce((a,s)=>(a[s.kind]=(a[s.kind]||0)+1,a),{}),atlasCount:atlases.length,totalNativePixels:records.reduce((n,s)=>n+s.pixelWidth*s.pixelHeight,0)},null,2));
