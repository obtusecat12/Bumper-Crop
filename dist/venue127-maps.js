// V127 · F inside BAÑOS / Lantern Reef / Indoor Tide Garden / Level 27 opens a
// fabricated 2009 "Goggle Maps" page: local "search nearby" results, then a
// Place Page per business. Pure DOM + 2D canvas; no world/renderer access.
// Mounted as a normal .modal (#venue-map) so main.js openModal/closeModal and
// Escape handling apply unchanged.
import {VENUES127,venuePhoto127 as P} from './venue127-data.js?v=127';
import {gmCtlHTML} from './gm-ctl132.js?v=132';

const LOGO='<span class="vm-wordmark" aria-label="Goggle"><i style="color:#1c4fd6">G</i><i style="color:#d8291d">o</i><i style="color:#f1b51c">g</i><i style="color:#1c4fd6">g</i><i style="color:#16943a">l</i><i style="color:#d8291d">e</i></span>';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LET='ABCDEFGHIJ';
function stars(n,size=''){if(!n)return '<span class="vm-norev">No reviews</span>';let h='';for(let i=0;i<5;i++)h+=`<i class="vm-st${i<n?' on':''}"></i>`;return `<span class="vm-stars ${size}" title="${n} stars">${h}</span>`;}

// ---------- map painters (2009 classic tile palette) ----------
function hash(i){let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function paintCity(c,w,h,v,sel,seed){
 c.fillStyle='#f2efe9';c.fillRect(0,0,w,h);
 const ang=-.06+seed*.02;c.save();c.translate(w/2,h/2);c.rotate(ang);c.translate(-w/2,-h/2);
 // park block
 c.fillStyle='#c8deb5';c.strokeStyle='#b5d29f';c.fillRect(w*.3,h*.42,w*.16,h*.2);c.strokeRect(w*.3+.5,h*.42+.5,w*.16,h*.2);
 // building footprints
 c.fillStyle='#e8e4dc';c.strokeStyle='#d3ccbf';
 for(let gx=0;gx<9;gx++)for(let gy=0;gy<7;gy++){const x0=gx*w/8-w*.04,y0=gy*h/6-h*.03;for(let k=0;k<3;k++){const r=hash(gx*31+gy*7+k+seed*99);if(r<.35)continue;const bx=x0+12+r*w*.05,by=y0+12+hash(k+gx+seed)*h*.06,bw=10+hash(gy+k*3)*w*.04,bh=8+hash(gx*2+k)*h*.05;c.fillRect(bx,by,bw,bh);c.strokeRect(bx+.5,by+.5,bw,bh);}}
 const road=(x1,y1,x2,y2,cls)=>{c.lineCap='butt';c.strokeStyle=cls?'#e3b24a':'#c9c2b3';c.lineWidth=cls?9:7;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=cls?'#ffe168':'#fff';c.lineWidth=cls?7:5;c.stroke();};
 const xs=[],ys=[];for(let i=0;i<=8;i++)xs.push(i*w/8-w*.04);for(let j=0;j<=6;j++)ys.push(j*h/6-h*.03);
 xs.forEach((x,i)=>road(x,-20,x,h+20,i===4));ys.forEach((y,j)=>road(-20,y,w+20,y,j===3));
 // labels
 c.font='bold 11px Arial';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 const lab=(t,x,y,r=0)=>{c.save();c.translate(x,y);c.rotate(r);c.strokeStyle='#fff';c.lineWidth=3;c.strokeText(t,0,0);c.fillStyle='#333';c.fillText(t,0,0);c.restore();};
 if(v.streets){lab(v.streets.h[0],w*.62,ys[3]);lab(v.streets.h[1],w*.2,ys[2]);lab(v.streets.h[2],w*.75,ys[5]);lab(v.streets.v[0],xs[4],h*.2,-Math.PI/2);lab(v.streets.v[1],xs[6],h*.75,-Math.PI/2);lab(v.streets.v[2],xs[2],h*.82,-Math.PI/2);
  c.font='italic 11px Arial';c.fillStyle='#4f7a3a';c.strokeStyle='#fff';c.strokeText(v.streets.park,w*.38,h*.52);c.fillText(v.streets.park,w*.38,h*.52);}
 c.restore();
}
function paintCave(c,w,h,v,sel,seed){
 // "Terrain" tab look: shaded relief, contour lines, blue water, grey cave outline.
 const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#e9e3cf');g.addColorStop(1,'#d9d1b6');c.fillStyle=g;c.fillRect(0,0,w,h);
 for(let k=0;k<14;k++){c.strokeStyle=k%5===0?'rgba(150,120,80,.45)':'rgba(150,120,80,.22)';c.lineWidth=k%5===0?1.2:.7;c.beginPath();for(let a=0;a<=64;a++){const t=a/64*Math.PI*2,r=(40+k*22)*(1+.18*Math.sin(t*3+k*.7)+.08*Math.sin(t*7+k));const x=w*.5+Math.cos(t)*r*1.5,y=h*.55+Math.sin(t)*r;a?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();}
 // cave floor
 c.fillStyle='rgba(120,115,105,.28)';c.strokeStyle='#8a8478';c.lineWidth=1.5;c.beginPath();for(let a=0;a<=48;a++){const t=a/48*Math.PI*2,r=1+.12*Math.sin(t*5)+.06*Math.sin(t*11);const x=w*.5+Math.cos(t)*w*.3*r,y=h*.52+Math.sin(t)*h*.3*r;a?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.stroke();
 // pool
 c.fillStyle='#a5bfdd';c.strokeStyle='#7d9fc6';c.beginPath();c.ellipse(w*.5,h*.56,w*.12,h*.1,.2,0,Math.PI*2);c.fill();c.stroke();
 // stream tunnel
 c.strokeStyle='#7d9fc6';c.lineWidth=5;c.beginPath();c.moveTo(w*.6,h*.5);c.bezierCurveTo(w*.7,h*.35,w*.8,h*.25,w*.98,h*.2);c.stroke();c.strokeStyle='#a5bfdd';c.lineWidth=3;c.stroke();
 c.strokeStyle='#7d9fc6';c.lineWidth=3;c.beginPath();c.moveTo(w*.42,h*.5);c.bezierCurveTo(w*.35,h*.35,w*.28,h*.28,w*.2,h*.2);c.stroke();
 // dashed trail (stairway)
 c.setLineDash([4,3]);c.strokeStyle='#b5651d';c.lineWidth=2;c.beginPath();c.moveTo(w*.58,h*.47);c.lineTo(w*.67,h*.33);c.lineTo(w*.8,h*.27);c.stroke();c.setLineDash([]);
 c.font='bold 11px Arial';c.textAlign='center';c.lineJoin='round';
 const lab=(t,x,y,col='#333')=>{c.strokeStyle='#fff';c.lineWidth=3;c.strokeText(t,x,y);c.fillStyle=col;c.fillText(t,x,y);};
 lab('Level 27',w*.5,h*.9);c.font='italic 11px Arial';lab('Bunker Springs',w*.5,h*.69,'#2f5f99');lab('Stream tunnel → exit',w*.83,h*.17,'#2f5f99');lab('2nd waterfall (closed)',w*.2,h*.15,'#a33');
}
function pin(c,x,y,letter,active){
 c.save();c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(x+7,y-2,8,3,-.5,0,Math.PI*2);c.fill();c.translate(x,y);
 const g=c.createLinearGradient(-9,-30,9,-10);g.addColorStop(0,active?'#ffe28a':'#ff8a7a');g.addColorStop(.5,active?'#f5b914':'#f23d2b');g.addColorStop(1,active?'#b9860a':'#b0180c');
 c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-3,-8,-9,-12,-9,-20);c.arc(0,-20,9,Math.PI,0);c.bezierCurveTo(9,-12,3,-8,0,0);c.closePath();c.fillStyle=g;c.fill();c.strokeStyle=active?'#7a5a06':'#8e1308';c.lineWidth=1;c.stroke();
 c.fillStyle=active?'#3a2a00':'#fff';c.font='bold 11px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(letter,0,-20);c.restore();
}
// V132-venuemap: list map has a view {z,cx,cy}: zoom step z (x1.25 each) around normalized centre.
const ZSTEP=1.25,ZMAX=6;
function viewXf(w,h,view){const s=ZSTEP**(view?.z||0),W=w*s,H=h*s;const hx=.5/s,hy=.5/s;const cx=Math.max(hx,Math.min(1-hx,view?.cx??.5)),cy=Math.max(hy,Math.min(1-hy,view?.cy??.5));if(view){view.cx=cx;view.cy=cy;}return {W,H,tx:w/2-cx*W,ty:h/2-cy*H};}
function paintMap(canvas,v,sel,single=-1,view=null){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.max(50,Math.round(r.width)),h=Math.max(50,Math.round(r.height));
 if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const seed=v===VENUES127.tiki?1:v===VENUES127.garden?2:0;
 const paint=v.map==='cave'?paintCave:paintCity,list=single>=0?[single]:v.results.map((_,i)=>i);
 // single-pin small map: paint a 2x area and pan so that pin sits near the centre
 let {W,H,tx,ty}=viewXf(w,h,view);
 if(single>=0){const q=v.results[single].pin;W=w*2;H=h*2;tx=Math.max(w-W,Math.min(0,w/2-q[0]*W));ty=Math.max(h-H,Math.min(0,h*.58-q[1]*H));}
 c.save();c.translate(tx,ty);paint(c,W,H,v,sel,seed);c.restore();
 for(const i of list.filter(i=>i!==sel).concat(list.includes(sel)?[sel]:[])){const q=v.results[i];pin(c,tx+q.pin[0]*W,ty+q.pin[1]*H+10,LET[i],i===sel);}
 // copyright strip
 c.fillStyle='rgba(255,255,255,.7)';c.fillRect(w-250,h-14,250,14);c.fillStyle='#444';c.font='10px Arial';c.textAlign='right';c.textBaseline='middle';c.fillText(v.map==='cave'?'Map data ©2009 M.E.G. Survey, Terrain - Terms of Use':'Map data ©2009 Tele Atlas, M.E.G. - Terms of Use',w-4,h-7);
}

export function createVenueMaps({host=document.body,onClose=()=>{}}={}){
 const root=document.createElement('div');root.className='modal vm-modal';root.id='venue-map';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Goggle Maps');
 root.innerHTML='<div class="vm-page"></div>';host.appendChild(root);
 const page=root.querySelector('.vm-page');let key='bath',v=VENUES127.bath,view='list',sel=0,saved=new Set(),photo=0,directions=false;
 const head=q=>`<div class="vm-top"><nav><a>Web</a><a>Images</a><a>Videos</a><b>Maps</b><a>News</a><a>Shopping</a><a>Gmail</a><a>more ▾</a></nav><div><a>iGoggle</a> | <a>Search settings</a> | <a class="vm-close" href="#" role="button">Close map (M)</a></div></div>
 <div class="vm-head"><div class="vm-brand">${LOGO}<span class="vm-maps">maps</span></div><div class="vm-search"><div class="vm-row"><input type="text" value="${esc(q)}" readonly aria-label="Search Maps"><button type="button" class="vm-btn" data-act="list">Search Maps</button><a class="vm-small">Show search options</a></div><small>e.g., "${esc(v.query)} near ${esc(v.near.split(',')[0])}"</small></div></div>`;
 function list(){
  const rs=v.results;
  page.innerHTML=head(`${v.query} near ${v.near}`)+`<div class="vm-bar"><div class="vm-bar-l"><a>Get Directions</a><a>My Maps</a></div><div class="vm-bar-r"><a><i class="vm-ico p"></i>Print</a><a><i class="vm-ico s"></i>Send</a><a><i class="vm-ico l"></i>Link</a></div></div>
  <div class="vm-body"><aside class="vm-side"><div class="vm-count">Results <b>1 - ${rs.length}</b> of about <b>${v.total}</b> for <b>${esc(v.query)}</b> near <b>${esc(v.near)}</b></div>
  <div class="vm-ad"><span>Sponsored Link</span><a>${esc(v.ad.title)}</a><div class="vm-green">${esc(v.ad.url)}</div><div>${esc(v.ad.text)}</div></div>
  ${rs.map((r,i)=>`<div class="vm-res${i===sel?' sel':''}" data-i="${i}"><span class="vm-pin${i===sel?' sel':''}">${LET[i]}</span><div><a class="vm-title" data-open="${i}">${esc(r.name)}</a>${r.photos.length?`<img class="vm-thumb" src="${P(r.photos[0])}" alt="">`:''}<div class="vm-rate">${stars(r.stars)}${r.reviews?` <a data-open="${i}" data-tab="rev">${r.reviews} reviews</a>`:''}</div><div class="vm-addr">${esc(r.addr)}</div><div class="vm-phone">${esc(r.phone)}</div><div class="vm-snip">${esc(r.snippet)}</div><div class="vm-links"><a data-open="${i}" data-dir="1">Directions</a> - <a data-open="${i}">more info »</a></div></div></div>`).join('')}
  <div class="vm-pager">Result Page: <b>1</b> <a>2</a> <a>3</a> <a>4</a> <a>Next</a></div><p class="vm-put">Put <a>your business on Goggle Maps</a></p></aside>
  <div class="vm-mapwrap"><canvas class="vm-map"></canvas>${gmCtlHTML()}<div class="gm-types vm-types"><button class="${v.map==='cave'?'':'on'}">Map</button><button>Satellite</button><button class="${v.map==='cave'?'on':''}">${v.map==='cave'?'Terrain':'Hybrid'}</button></div><div class="vm-iw" hidden></div></div></div>
  <div class="vm-foot">©2009 Goggle - <a>Terms of Use</a> - <a>Privacy Policy</a> - <a>Help</a> · Map data ©2009 ${v.map==='cave'?'M.E.G. Survey':'Tele Atlas, M.E.G.'}</div>`;
  const cv=page.querySelector('.vm-map');requestAnimationFrame(()=>{paintMap(cv,v,sel,-1,mv);balloon();ctlSync();});
  wireCtl(cv);
  cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),X=viewXf(r.width,r.height,mv);let best=-1,bd=24;v.results.forEach((q,i)=>{const d=Math.hypot(e.clientX-r.left-(X.tx+q.pin[0]*X.W),e.clientY-r.top-(X.ty+q.pin[1]*X.H-10));if(d<bd){bd=d;best=i;}});if(best>=0){sel=best;list();}});
  page.querySelectorAll('.vm-res').forEach(el=>el.addEventListener('mouseenter',()=>{const i=+el.dataset.i;if(i===sel)return;sel=i;page.querySelectorAll('.vm-res').forEach(x=>{x.classList.toggle('sel',+x.dataset.i===sel);x.querySelector('.vm-pin').classList.toggle('sel',+x.dataset.i===sel);});paintMap(cv,v,sel,-1,mv);balloon();}));
 }
 function balloon(){
  const iw=page.querySelector('.vm-iw'),cv=page.querySelector('.vm-map');if(!iw||!cv)return;const r=v.results[sel],w=cv.clientWidth,h=cv.clientHeight,X=viewXf(w,h,mv),px=(X.tx+r.pin[0]*X.W)/w,py=(X.ty+r.pin[1]*X.H)/h;
  if(px<0||px>1||py<0||py>1){iw.hidden=true;return;}
  iw.hidden=false;iw.innerHTML=`<span class="vm-iw-x">×</span><a class="vm-title" data-open="${sel}">${esc(r.name)}</a><div class="vm-rate">${stars(r.stars)} ${r.reviews?`<a data-open="${sel}">${r.reviews} reviews</a>`:''}</div>${r.photos.length?`<img src="${P(r.photos[0])}" alt="">`:''}<div class="vm-addr">${esc(r.addr)}</div><div>${esc(r.phone)}</div><div class="vm-links"><a data-open="${sel}" data-dir="1">Directions</a> - <a data-open="${sel}">Search nearby</a> - <a data-open="${sel}">more info »</a></div><i class="vm-iw-tail"></i>`;
  const bw=iw.offsetWidth,bh=iw.offsetHeight;let x=px*w-34,y=py*h-30-bh-14;x=Math.max(6,Math.min(w-bw-6,x));if(y<6)y=py*h+18;iw.style.left=x+'px';iw.style.top=y+'px';
  iw.querySelector('.vm-iw-tail').style.left=Math.max(14,Math.min(bw-30,px*w-x-6))+'px';iw.classList.toggle('below',y>py*h);
 }
 const mv={z:0,cx:.5,cy:.5};
 function redraw(){const cv=page.querySelector('.vm-map');if(!cv)return;paintMap(cv,v,sel,-1,mv);balloon();ctlSync();}
 function ctlSync(){const t=page.querySelector('.gm-thumb');if(t)t.style.top=`${(1-mv.z/ZMAX)*100}%`;}
 function zoomTo(z){mv.z=Math.max(0,Math.min(ZMAX,z));redraw();}
 function wireCtl(cv){
  const q=s=>page.querySelector(s),step=()=>.22/ZSTEP**mv.z;
  q('.gm-ticks').innerHTML='<i></i>'.repeat(ZMAX+1);
  const D={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
  page.querySelectorAll('.gm-ctl [data-pan]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const d=D[b.dataset.pan];mv.cx+=d[0]*step();mv.cy+=d[1]*step();redraw();}));
  q('.gm-ctl [data-gm="center"]').addEventListener('click',e=>{e.preventDefault();const p=v.results[sel].pin;mv.cx=p[0];mv.cy=p[1];redraw();});
  q('.gm-ctl [data-gm="in"]').addEventListener('click',e=>{e.preventDefault();zoomTo(mv.z+1);});
  q('.gm-ctl [data-gm="out"]').addEventListener('click',e=>{e.preventDefault();zoomTo(mv.z-1);});
  const tr=q('.gm-track');tr.addEventListener('click',e=>{const r=tr.getBoundingClientRect();zoomTo(Math.round((1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)))*ZMAX));});
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomTo(mv.z+(e.deltaY<0?1:-1));},{passive:false});
  page.querySelectorAll('.vm-types button').forEach(b=>b.addEventListener('click',()=>{page.querySelectorAll('.vm-types button').forEach(x=>x.classList.toggle('on',x===b));}));
 }
 function place(){
  const r=v.results[sel];photo=Math.min(photo,Math.max(0,r.photos.length-1));
  const total=r.bars.reduce((a,b)=>a+b,0)||1;
  page.innerHTML=head(`${v.query} near ${v.near}`)+`<div class="vm-bar"><div class="vm-bar-l"><a data-act="list">« Back to search results</a></div><div class="vm-bar-r"><a><i class="vm-ico p"></i>Print</a><a><i class="vm-ico s"></i>Send</a><a><i class="vm-ico l"></i>Link</a></div></div>
  <div class="vm-place"><div class="vm-pmain">
   <div class="vm-ptitle"><span class="vm-pin sel">${LET[sel]}</span><div><h1>${esc(r.name)}</h1><div class="vm-addr">${esc(r.addr)}</div><div class="vm-phone">${esc(r.phone)}</div>${r.web?`<div class="vm-green">${esc(r.web)}</div>`:''}
    <div class="vm-plinks"><a data-act="dir">Directions</a> <a data-act="list">Search nearby</a> <a data-act="save">${saved.has(key+sel)?'✓ Saved to My Maps':'Save to My Maps'}</a> <a>more ▾</a></div></div></div>
   ${directions?`<div class="vm-dir"><b>Get directions:</b><div><span class="vm-ab">A</span><input readonly value="My location (${esc(v.near.split(',')[0])})"></div><div><span class="vm-ab b">B</span><input readonly value="${esc(r.name)}"></div><div class="vm-dirnote">${v.map==='cave'?'Walking only. Follow the stream tunnel; the M.E.G. stairway descends to the pool.':'Walking directions are in beta. Use caution - this route may be missing sidewalks or pedestrian paths.'}</div></div>`:''}
   <div class="vm-rating">${stars(r.stars,'big')} ${r.reviews?`<a href="#vm-rev">${r.reviews} reviews</a>`:'<span class="vm-norev">Be the first to <a>write a review</a></span>'}<span class="vm-cat">Category: <a>${esc(r.cat)}</a></span></div>
   <div class="vm-pd"><div><h2>Photos</h2>${r.photos.length?`<div class="vm-photo"><img src="${P(r.photos[photo])}" alt=""><div class="vm-cap">Photo ${photo+1} of ${r.photos.length} · uploaded by a Goggle user · <a>Report</a></div></div><div class="vm-strip">${r.photos.map((p,i)=>`<img data-ph="${i}" class="${i===photo?'on':''}" src="${P(p)}" alt="">`).join('')}<a class="vm-more">See all ${r.photos.length} photos »</a></div>`:'<div class="vm-nophoto">No photos yet. <a>Add a photo</a></div>'}
   </div><div><h2>Details</h2><table class="vm-det"><tr><th>Hours:</th><td>${r.hours.map(h=>`${h[0]?esc(h[0])+': ':''}${esc(h[1])}`).join('<br>')}</td></tr>${r.details.map(d=>`<tr><th>${esc(d[0])}:</th><td>${esc(d[1])}</td></tr>`).join('')}</table><div class="vm-edit"><a>Edit this place</a> · <a>Report a problem</a></div></div></div>
   <h2 id="vm-rev">Reviews</h2>${r.reviews?`<div class="vm-sum"><div class="vm-bars">${r.bars.map((b,i)=>`<div><span>${5-i} stars</span><i><b style="width:${Math.round(b/total*100)}%"></b></i><em>${b}</em></div>`).join('')}</div><div class="vm-sumr">${stars(r.stars,'big')}<div>${r.reviews} reviews</div><a>Write a review</a></div></div>`:''}
   ${r.revs.map(x=>`<div class="vm-rev">${stars(x.stars)} <b>${esc(x.who)}</b> - ${esc(x.date)}<p>${esc(x.text)}</p>${x.src?`<div class="vm-green">${esc(x.src)} - <a>More reviews »</a></div>`:'<div class="vm-help">Was this review helpful? <a>Yes</a> <a>No</a></div>'}</div>`).join('')||'<div class="vm-norev">No reviews yet.</div>'}
   <h2>More about this place</h2><div class="vm-moreabout"><a>${esc(r.web||'Related web pages')}</a> - <a>Related maps</a> - <a>Nearby: ${esc(v.query)}</a></div>
  </div><aside class="vm-pside"><canvas class="vm-mini"></canvas><div class="vm-mapcap"><a data-act="list">View larger map</a></div>
   ${r.sv?`<div class="vm-sv"><img src="${P(r.sv)}" alt=""><span class="vm-peg"></span><div><a>Street View »</a></div></div>`:'<div class="vm-sv none">Street View not available</div>'}
   <div class="vm-pbox"><b>Nearby</b>${v.results.map((q,i)=>i===sel?'':`<div><span class="vm-pin s">${LET[i]}</span><a data-open="${i}">${esc(q.name)}</a></div>`).join('')}</div></aside></div>
  <div class="vm-foot">©2009 Goggle - <a>Terms of Use</a> - <a>Privacy Policy</a> - <a>Help</a> · Place information may be inaccurate.</div>`;
  requestAnimationFrame(()=>paintMap(page.querySelector('.vm-mini'),v,sel,sel));
  page.querySelectorAll('[data-ph]').forEach(im=>im.addEventListener('click',()=>{photo=+im.dataset.ph;place();}));
 }
 function render(){root.dataset.view=view;root.dataset.venue=key;view==='place'?place():list();page.scrollTop=0;}
 root.addEventListener('click',e=>{
  const a=e.target.closest('a,button,[data-open]');if(!a||!root.contains(a))return;
  if(a.classList.contains('vm-close')){e.preventDefault();onClose();return;}
  if(a.dataset.open!==undefined){e.preventDefault();sel=+a.dataset.open;photo=0;directions=!!a.dataset.dir;view='place';render();if(a.dataset.tab==='rev')page.querySelector('#vm-rev')?.scrollIntoView();return;}
  const act=a.dataset.act;if(!act)return;e.preventDefault();
  if(act==='list'){view='list';directions=false;render();}
  else if(act==='dir'){directions=!directions;place();}
  else if(act==='save'){const k=key+sel;saved.has(k)?saved.delete(k):saved.add(k);place();}
 });
 window.addEventListener('resize',()=>{if(!root.hidden)render();});
 return {root,
  open(k){key=VENUES127[k]?k:'bath';v=VENUES127[key];view='list';sel=0;photo=0;directions=false;mv.z=0;mv.cx=mv.cy=.5;render();},
  showPlace(i){sel=i;photo=0;view='place';render();},
  get venue(){return key;},get view(){return view;}};
}
