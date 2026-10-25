// V148 E4 · Level 11 M map: every authored area / landmark as a 2009 Goggle Maps place (lettered red marker, label,
// info-window balloon, sidebar result), the REAL building footprints of the capital region (vectorised from a top-down
// raster of the actual 3D scene, tools/map148 → dist/map148-foot.js) and a fake satellite photo of the same region
// (assets/map148/sat148.webp, the 3D scene's own roofs/ground/trees shot straight down, shaded + shadows).
// Region = city x -448..336, z -336..784 (blocks ix -4..2, iz -3..6). Outside it the procedural map/satellite is unchanged.
// ?map148=0 → old map.
import {FOOT148} from './map148-foot.js?v=148a';
export const ON148=!/[?&]map148=0\b/.test(globalThis.location?.search||'');
export const REGION148={x0:-448,z0:-336,x1:336,z1:784};
export const in148=(x,z)=>ON148&&x>=REGION148.x0&&x<REGION148.x1&&z>=REGION148.z0&&z<REGION148.z1;
const FONT="Arial, Helvetica, 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Noto Sans CJK SC', SimHei, sans-serif";
// cat: bld (building), area (open area), street, water, transit
export const POI148=[
 {id:'hope',name:'Hope St',zh:'希望街',cat:'street',x:2.8,z:-14,addr:'Hope St & Main St',desc:'照片一的街景：裙楼、报刊亭与看门人。'},
 {id:'atm',name:'ATM Lobby',zh:'ATM 大厅',cat:'bld',x:-30,z:9,b:[[-38,9]],addr:'Hope St 台阶平台玻璃门',desc:'两层大理石中庭、亚克力鱼缸、藤编休息区。'},
 {id:'edge',name:'Commercial Edge',zh:'进城口 · 商业边缘区',cat:'area',x:10.5,z:-101,addr:'Exit Blvd 进城段',desc:'从 Level 10 麦田小径进城的落脚点。'},
 {id:'clinic',name:'Clinic & Bakery Court',zh:'诊所与糕点房',cat:'bld',x:24,z:-84,addr:'Main St 东侧',desc:'照片二机位：诊所庭院与糕点房。'},
 {id:'vend',name:'Waterfall Vending',zh:'瀑布售货机与候座',cat:'area',x:41.6,z:-139.5,addr:'棕榈广场北侧',desc:'瀑布墙前的售货机和候车座椅。'},
 {id:'plaza',name:'Palm Fountain Plaza',zh:'棕榈喷泉广场',cat:'area',x:46,z:-154,addr:'Main St & S 2nd St',desc:'棕榈树、喷泉与花钵围成的公共广场。'},
 {id:'echo',name:'ECHO Apparel Billboard',zh:'ECHO 服装广告',cat:'area',x:65.5,z:-176.8,addr:'广场东南',desc:'整面墙的 ECHO 服装户外广告。'},
 {id:'tiki',name:'Lantern Reef Tiki Bar & Grill',zh:'Lantern Reef 餐厅酒吧',cat:'bld',x:42.6,z:-190.3,b:[[38,-197]],addr:'深巷南端',desc:'竹木门后的 Tiki 酒吧和室内潮汐水景室。'},
 {id:'bath',name:'Deep Alley Bathhouse',zh:'深巷热水浴室 · Level 27 入口',cat:'bld',x:52.3,z:-192.6,b:[[58,-199]],addr:'深巷南端',desc:'更衣室、温泉池，通往 Level 27 岩体泉。'},
 {id:'malt',name:'Maltose Market',zh:'麦芽糖市场',cat:'area',x:192,z:-68,area:[172,-100,212,-36],addr:'S 1st St & 2nd Ave',desc:'露天篮球场上的跳蚤 / 古董市场，冬季周末。'},
 {id:'brick',name:'Brick Apartment Slab & Road Works',zh:'红砖公寓楼与道路施工',cat:'bld',x:-179,z:-24,b:[[-179,-24]],addr:'Exit Blvd 南侧 · W 2nd–1st Ave',desc:'6 层深灰砖公寓、公交候车亭和围起来的施工场地。'},
 {id:'barr',name:'Pallet Barricade Alley',zh:'托盘路障后巷',cat:'area',x:-281,z:-12,addr:'Exit Blvd 南侧后巷口 · W 3rd–2nd Ave',desc:'托盘、门板和油桶把整条后巷封死。'},
 {id:'stucco',name:'Wexham Place Stucco Terrace',zh:'灰泥联排楼',cat:'bld',x:-129,z:-144,b:[[-129,-144],[-140,-118]],addr:'W 1st Ave & S 1st St 街角',desc:'深褐砖墙配白色灰泥底层的街角联排，浓密树冠。'},
 {id:'soho',name:'SoHo Street Fair',zh:'SoHo 街市',cat:'area',x:-224,z:112,area:[-241,2,-207,222],addr:'W 2nd Ave（N 0–2 St）',desc:'铸铁立面老楼、消防梯、街心食品与杂货摊位、人群。'},
 {id:'spire',name:'Spire Tower',zh:'尖塔楼',cat:'bld',x:-201,z:312,b:[[-201,312]],addr:'W 2nd Ave · N 2nd–3rd St 后排',desc:'SoHo 街市尽头的哥特尖塔塔楼，带门廊与旋转门。'},
 {id:'mill',name:'Flour Mill Back Alley',zh:'面粉厂返程后巷',cat:'area',x:107,z:194,addr:'1st Ave 后巷',desc:'从面粉厂返程回到城市的后巷。'},
 {id:'hotel',name:'Hotel & Mid-rises',zh:'酒店与中层楼',cat:'bld',x:142,z:179,b:[[142,179]],addr:'1st Ave · N 1st–2nd St',desc:'照片三里的斜置酒店、中层楼与红砖排屋。'},
 {id:'nick',name:"Nick's Gaslight Lot",zh:"Nick's Gaslight 停车场",cat:'area',x:202,z:270,b:[[202,270]],addr:'1st–2nd Ave · N 2nd St',desc:'照片三机位：大片停车场与 Nick\'s Gaslight 小楼。'},
 {id:'gothic',name:'Gothic Hall Facade Site',zh:'哥特会堂立面保留工地',cat:'bld',x:250,z:56,b:[[250,56]],addr:'2nd Ave · Exit Blvd 北',desc:'保留哥特立面的工地与黄色塔楼。'},
 {id:'core',name:'Financial Canyon',zh:'金融街峡谷',cat:'street',x:112,z:478,addr:'1st Ave · N 4th St',desc:'高楼夹出的金融街峡谷。'},
 {id:'canal',name:'Canal & Footbridge',zh:'运河与人行桥',cat:'water',x:149,z:619.5,addr:'N 5th St 运河段',desc:'照片四的运河、船闸与带台阶的人行桥。'}
];
POI148.forEach((p,i)=>p.letter=String.fromCharCode(65+i));
// ---------- footprints ----------
let polys=null;
function getPolys(){if(polys)return polys;const{X0,Z0,RES}=FOOT148;polys=FOOT148.polys.map(([h,...rings])=>{const R=rings.map(r=>{const a=[];for(let i=0;i<r.length;i+=2)a.push([X0+r[i]*RES,Z0+r[i+1]*RES]);return a;});let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const[x,z]of R[0]){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}return{h,R,box:[x0,z0,x1,z1],poi:null};});
 const inside=(pt,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[a,b]=ring[i],[d,e]=ring[j];if((b>pt[1])!==(e>pt[1])&&pt[0]<(d-a)*(pt[1]-b)/(e-b)+a)c=!c;}return c;};
 for(const p of POI148){for(const pt of p.b||[]){let best=null,bd=1e9;for(const q of polys){if(inside(pt,q.R[0])){best=q;break;}const cx=(q.box[0]+q.box[2])/2,cz=(q.box[1]+q.box[3])/2,d=Math.hypot(cx-pt[0],cz-pt[1]);if(d<bd&&d<14){bd=d;best=q;}}if(best)best.poi=p;}
  if(p.id==='soho')for(const q of polys){const cx=(q.box[0]+q.box[2])/2,cz=(q.box[1]+q.box[3])/2;if(cz>0&&cz<224&&Math.abs(cx+224)<34&&Math.abs(cx+224)>8)q.poi=p;}}
 return polys;}
let sel=null,hits=[];
export function paintFoot148(ctx,toS,scale,P,photo){
 if(!ON148)return;const pl=getPolys();
 if(!photo){for(const p of POI148)if(p.area){const[a,b,c,d]=p.area;ctx.beginPath();[[a,b],[c,b],[c,d],[a,d]].forEach((q,k)=>{const s=toS(q[0],q[1]);k?ctx.lineTo(...s):ctx.moveTo(...s);});ctx.closePath();ctx.fillStyle=p.id==='malt'?'#e6ddcc':'#f4ecd8';ctx.fill();ctx.strokeStyle='#d8c9a8';ctx.lineWidth=1;ctx.stroke();}}
 if(scale<=.45&&!photo)return;
 for(const q of pl){if(photo&&!(q.poi&&q.poi===sel))continue;ctx.beginPath();for(const r of q.R)r.forEach((pt,k)=>{const s=toS(pt[0],pt[1]);k?ctx.lineTo(...s):ctx.moveTo(...s);});
  if(photo){ctx.strokeStyle='#ffd34d';ctx.lineWidth=2;ctx.stroke();continue;}
  const poi=q.poi;ctx.fillStyle=poi?(poi===sel?'#f2d9a6':'#eadcc2'):q.h>24?P.bldTall:P.bld;ctx.fill('evenodd');if(scale>.6||poi){ctx.strokeStyle=poi?'#c4a77a':P.bldEdge;ctx.lineWidth=1;ctx.stroke();}}
}
// 2009 marker: red drop with black letter, skewed shadow
function marker(ctx,x,y,L,small){const k=small?.72:1;ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(13,-14);ctx.quadraticCurveTo(20,-21,13,-24);ctx.quadraticCurveTo(7,-25,5,-17);ctx.closePath();ctx.fill();
 const g=ctx.createLinearGradient(-10,-34,10,-10);g.addColorStop(0,'#ff8a7a');g.addColorStop(.5,'#f23d2b');g.addColorStop(1,'#b0180c');
 ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-2,-8,-10,-13,-10,-23);ctx.arc(0,-23,10,Math.PI,0);ctx.bezierCurveTo(10,-13,2,-8,0,0);ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#8e1308';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle='#000';ctx.font=`bold 11px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L,0,-23);ctx.restore();}
function balloon(ctx,x,y,p,w){ctx.save();const tw=280,pad=10;ctx.font=`13px ${FONT}`;
 const words=p.desc,lines=[];let cur='';for(const ch of words){if(ctx.measureText(cur+ch).width>tw-2*pad){lines.push(cur);cur=ch;}else cur+=ch;}if(cur)lines.push(cur);
 const bh=82+lines.length*17;let bx=Math.max(6,Math.min(w-tw-6,x-40)),by=y-36-bh-20;if(by<6)by=6;
 ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=6;ctx.shadowOffsetX=4;ctx.shadowOffsetY=4;const r=8;
 ctx.beginPath();ctx.moveTo(bx+r,by);ctx.lineTo(bx+tw-r,by);ctx.arcTo(bx+tw,by,bx+tw,by+r,r);ctx.lineTo(bx+tw,by+bh-r);ctx.arcTo(bx+tw,by+bh,bx+tw-r,by+bh,r);const tx=Math.max(bx+20,Math.min(bx+tw-40,x));ctx.lineTo(tx+22,by+bh);ctx.lineTo(x,y-34);ctx.lineTo(tx,by+bh);ctx.lineTo(bx+r,by+bh);ctx.arcTo(bx,by+bh,bx,by+bh-r,r);ctx.lineTo(bx,by+r);ctx.arcTo(bx,by,bx+r,by,r);ctx.closePath();
 ctx.fillStyle='#fff';ctx.fill();ctx.shadowColor='transparent';ctx.strokeStyle='#ababab';ctx.lineWidth=1;ctx.stroke();
 ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#0000cc';ctx.font=`bold 14px ${FONT}`;ctx.fillText(p.name,bx+pad,by+8,tw-40);
 ctx.fillStyle='#000';ctx.font=`bold 12px ${FONT}`;ctx.fillText(p.zh,bx+pad,by+26,tw-2*pad);ctx.font=`13px ${FONT}`;lines.forEach((l,i)=>ctx.fillText(l,bx+pad,by+46+i*17));
 ctx.fillStyle='#008000';ctx.font=`12px ${FONT}`;ctx.fillText(p.addr,bx+pad,by+bh-34,tw-2*pad);
 ctx.fillStyle='#0000cc';ctx.font=`12px ${FONT}`;ctx.fillText('Directions - Search nearby - 点地面传送',bx+pad,by+bh-18,tw-2*pad);
 ctx.strokeStyle='#888';ctx.strokeRect(bx+tw-17.5,by+6.5,11,11);ctx.beginPath();ctx.moveTo(bx+tw-15,by+9);ctx.lineTo(bx+tw-9,by+15);ctx.moveTo(bx+tw-9,by+9);ctx.lineTo(bx+tw-15,by+15);ctx.stroke();
 hits.push({box:[bx,by,bx+tw,by+bh],p,balloon:true});ctx.restore();}
export function paintPoi148(ctx,toS,scale,w,h,photo){
 if(!ON148)return;hits=[];const small=scale<.6;
 ctx.save();ctx.font=`bold 12px ${FONT}`;ctx.textBaseline='middle';ctx.lineJoin='round';
 const vis=[];for(const p of POI148){const[x,y]=toS(p.x,p.z);if(x<-40||y<-10||x>w+40||y>h+50)continue;vis.push([p,x,y]);}
 vis.sort((a,b)=>a[2]-b[2]);const lbs=[];
 for(const[p,x,y]of vis){marker(ctx,x,y,p.letter,small);hits.push({box:[x-11,y-36,x+11,y],p});
  if(scale>.35||p===sel){const t=p.zh,tw=ctx.measureText(t).width,lb=[x+10,y-31,x+14+tw,y-15];if(p!==sel&&lbs.some(q=>q[0]<lb[2]&&lb[0]<q[2]&&q[1]<lb[3]&&lb[1]<q[3]))continue;lbs.push(lb);ctx.textAlign='left';ctx.strokeStyle=photo?'#000':'#fff';ctx.lineWidth=3;ctx.strokeText(t,x+11,y-23);ctx.fillStyle=photo?'#fff':(p.cat==='water'?'#2a5aa0':'#333');ctx.fillText(t,x+11,y-23);}}
 ctx.restore();
 if(sel){const[x,y]=toS(sel.x,sel.z);if(x>-50&&y>-50&&x<w+50&&y<h+50)balloon(ctx,x,y,sel,w);}
}
// click handling from map-ui: returns true when the click hit a marker / balloon (no teleport)
export function click148(sx,sy){if(!ON148)return false;for(let i=hits.length-1;i>=0;i--){const q=hits[i],[a,b,c,d]=q.box;if(sx>=a&&sx<=c&&sy>=b&&sy<=d){if(q.balloon){if(sx>c-20&&sy<b+20)sel=null;return true;}sel=q.p===sel?null:q.p;onSel(sel);return true;}}if(sel){sel=null;onSel(null);return 'closed';}return false;}
export function hover148(sx,sy){for(const q of hits){const[a,b,c,d]=q.box;if(sx>=a&&sx<=c&&sy>=b&&sy<=d)return q.p;}return null;}
let focusCb=null,onSel=()=>{};
export function setFocus148(fn){focusCb=fn;}
export function select148(id){const p=POI148.find(q=>q.id===id)||null;sel=p;onSel(p);if(p&&focusCb)focusCb(p.x,p.z);}
export function onSelect148(fn){onSel=fn;}
// sidebar results (2009 search-result list)
export function sideHTML148(){if(!ON148)return '';return `<div class="gm148-head">Level 11 首都 · <b>${POI148.length}</b> 处地点</div>`+POI148.map(p=>`<div class="gm-result gm148-r" data-poi="${p.id}"><span class="gm-pin-a">${p.letter}</span><div><a class="gm-res-title">${p.name}</a><div class="gm148-zh">${p.zh}</div><div class="gm-addr">${p.addr}</div><div class="gm148-desc">${p.desc}</div><div class="gm-links"><a>Directions</a> - <a>Search nearby</a> - <a>more ▾</a></div></div></div>`).join('');}
// ---------- fake satellite photo of the region ----------
let satImg=null,satReady=false,satCb=null;
export function sat148(onReady){if(!ON148)return null;if(!satImg){satImg=new Image();satImg.decoding='async';satImg.onload=()=>{satReady=true;satCb?.();};satImg.src=new URL('./assets/map148/sat148.webp?v=148a',import.meta.url).href;}if(onReady)satCb=onReady;return satReady?satImg:null;}
export function satDraw148(g){const im=sat148();if(!im)return;const R=REGION148;g.imageSmoothingEnabled=true;g.drawImage(im,R.x0,R.z0,R.x1-R.x0,R.z1-R.z0);}
