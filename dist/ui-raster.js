// The DOM owns layout, focus, input and accessibility. This retained painter
// draws that same layout into one transparent texture BEFORE any display filter.
// No DOM screenshots, per-frame image decoding, or second sharp UI overlay.
const roots='.hud,.screen,.touch-ui,.map-mini,.modal';
const split=s=>{const out=[];let level=0,start=0;for(let i=0;i<s.length;i++){if(s[i]==='(')level++;if(s[i]===')')level--;if(s[i]===','&&!level){out.push(s.slice(start,i).trim());start=i+1;}}out.push(s.slice(start).trim());return out;};
function gradient(c,value,r){if(!value.startsWith('linear-gradient('))return null;const stops=split(value.slice(16,-1));let angle=Math.PI/2;
 if(stops[0].endsWith('deg'))angle=parseFloat(stops.shift())*Math.PI/180;else if(stops[0].startsWith('to ')){const v=stops.shift();angle=v.includes('right')?Math.PI/2:v.includes('left')?-Math.PI/2:v.includes('top')?0:Math.PI;}
 const dx=Math.sin(angle)*r.width/2,dy=-Math.cos(angle)*r.height/2,g=c.createLinearGradient(r.left+r.width/2-dx,r.top+r.height/2-dy,r.left+r.width/2+dx,r.top+r.height/2+dy);
 stops.forEach((s,i)=>{const m=s.match(/^(.*?)(?:\s+([\d.]+)%)?$/);try{g.addColorStop(m[2]?parseFloat(m[2])/100:i/Math.max(1,stops.length-1),m[1]);}catch{}});return g;
}
function rounded(c,r,radius){c.beginPath();c.roundRect(r.left,r.top,r.width,r.height,Math.min(radius,r.width/2,r.height/2));}
function retrofitSelects(host,invalidate){const records=[];
 for(const select of host.querySelectorAll('select')){
  const wrap=document.createElement('div');wrap.className='retro-select';select.after(wrap);wrap.append(select);select.hidden=true;
  const button=document.createElement('button');button.type='button';button.className='retro-select-value';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  const list=document.createElement('div');list.className='retro-options';list.role='listbox';list.id=select.id+'-options';list.hidden=true;button.setAttribute('aria-controls',list.id);
  button.setAttribute('aria-label',select.closest('label')?.querySelector('span')?.firstChild?.textContent||select.id);wrap.append(button,list);
  const options=[...select.options].map(option=>{const b=document.createElement('button');b.type='button';b.role='option';b.dataset.value=option.value;b.textContent=option.textContent;b.onclick=e=>{e.preventDefault();select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));close();button.focus();};list.append(b);return b;});
  function sync(){button.textContent=select.selectedOptions[0]?.textContent+'  ▾';options.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.value===select.value)));}
  function close(){list.hidden=true;button.setAttribute('aria-expanded','false');invalidate();}
  button.onclick=e=>{e.preventDefault();const open=list.hidden;for(const r of records)r.close();list.hidden=!open;button.setAttribute('aria-expanded',String(open));if(open)options.find(b=>b.dataset.value===select.value)?.focus();invalidate();};
  wrap.addEventListener('keydown',e=>{if(e.key==='Escape'&&!list.hidden){e.preventDefault();e.stopPropagation();close();button.focus();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();list.hidden=false;button.setAttribute('aria-expanded','true');let i=options.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1)));options[i]?.focus();invalidate();}});
  wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close();});select.addEventListener('change',sync);sync();records.push({select,button,sync,close,value:select.value});
 }
 return records;
}
export function createUIRaster(host,{survival,navigation}){
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d',{alpha:true});let dirty=true,layoutDirty=true,commands=[],frame=null,lastRevision='',disposed=false,active=true;
 const custom=new Map([[survival.root,survival],[navigation.root,navigation]]);
 const invalidate=()=>{dirty=layoutDirty=true;};const selects=retrofitSelects(host,invalidate);
 const observer=new MutationObserver(records=>{if(!active)return;for(const m of records){if(m.type==='attributes'&&(m.attributeName.startsWith('aria-')||m.attributeName==='d'))continue;
  const target=m.target.nodeType===1?m.target:m.target.parentElement;if(target?.closest('.stats,.map-mini')){dirty=true;if(m.target===navigation.root&&m.attributeName==='hidden')layoutDirty=true;continue;}
  if(target?.closest('canvas.scene'))continue;if(target?.closest('[hidden]')&&!(m.type==='attributes'&&m.attributeName==='hidden'))continue;invalidate();break;}});
 observer.observe(host,{subtree:true,attributes:true,childList:true,characterData:true});
 const onEvent=()=>invalidate();for(const name of ['input','change','focusin','focusout','pointerover','pointerout','scroll'])host.addEventListener(name,onEvent,true);
 document.documentElement.addEventListener('ui-themechange',invalidate);
 const resize=new ResizeObserver(invalidate);resize.observe(host);document.fonts?.ready.then(invalidate);
 const rootEls=()=>host.querySelectorAll(':scope > '+roots.split(',').join(',:scope > '));
 // VHS mode paints the DOM UI into the filtered frame; every other mode shows the DOM UI directly.
 function setActive(next){next=!!next;if(next===active)return;active=next;for(const el of rootEls())el.classList.toggle('raster-source',active);if(active)invalidate();}
 for(const el of rootEls())el.classList.add('raster-source');
 function textRuns(node,style){const content=node.textContent;if(!content?.trim())return[];const range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()].filter(r=>r.width&&r.height);if(!rects.length)return[];
  if(rects.length===1)return[{text:content.replace(/[ \t\r\n\f]+/g,' '),r:rects[0]}];
  const runs=[];for(let i=0;i<content.length;i++){range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;const last=runs.at(-1);if(last&&Math.abs(last.r.top-r.top)<1&&Math.abs(last.right-r.left)<2){last.text+=content[i];last.right=r.right;}else runs.push({text:content[i],r,right:r.right});}return runs;
 }
 function visit(el,root=false){if(el.nodeType!==1||(!root&&el.classList.contains('retro-options')))return;const s=getComputedStyle(el);if(el.hidden||s.display==='none'||s.visibility==='hidden')return;
  const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
  if(custom.has(el)){const painter=custom.get(el);commands.push(()=>painter.paint(c,r));return;}
  const opacity=root?1:Number(s.opacity);if(opacity<=0)return;
  const borders=['Top','Right','Bottom','Left'].map(side=>({w:parseFloat(s['border'+side+'Width'])||0,color:s['border'+side+'Color']}));const bg=s.backgroundColor,bw=Math.max(...borders.map(b=>b.w)),rad=parseFloat(s.borderRadius)||0,clip=['auto','scroll','hidden','clip'].includes(s.overflowY)||['hidden','clip'].includes(s.overflowX);
  const gr=gradient(c,s.backgroundImage,r),font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,fontSize=parseFloat(s.fontSize),color=s.color;
  commands.push(()=>{c.save();c.globalAlpha*=opacity;if(bg!=='rgba(0, 0, 0, 0)'||gr||bw){rounded(c,r,rad);c.fillStyle=gr||bg;c.fill();if(bw){if(borders.every(b=>b.w===bw&&b.color===borders[0].color)){c.strokeStyle=borders[0].color;c.lineWidth=bw;c.stroke();}else{const edges=[[r.left,r.top,r.right,r.top],[r.right,r.top,r.right,r.bottom],[r.right,r.bottom,r.left,r.bottom],[r.left,r.bottom,r.left,r.top]];borders.forEach((b,i)=>{if(!b.w)return;c.strokeStyle=b.color;c.lineWidth=b.w;c.beginPath();c.moveTo(edges[i][0],edges[i][1]);c.lineTo(edges[i][2],edges[i][3]);c.stroke();});}}}if(clip){rounded(c,r,rad);c.clip();}
   if(el===document.activeElement&&el.matches('button,input,a,[tabindex]')){c.strokeStyle='#c9b781';c.lineWidth=1;c.strokeRect(r.left-2,r.top-2,r.width+4,r.height+4);}
   if(el.classList.contains('menu-button')&&(el.classList.contains('selected')||el===document.activeElement)){c.font='22px Georgia';c.fillStyle='#c7b57f';c.fillText('›',r.left+2,r.top+r.height*.67);}
   if(el.classList.contains('crosshair')){c.strokeStyle='#d6c596';c.lineWidth=1;c.beginPath();c.moveTo(r.left-4,r.top);c.lineTo(r.left+5,r.top);c.moveTo(r.left,r.top-4);c.lineTo(r.left,r.top+5);c.stroke();}
  });
  if(el.tagName==='CANVAS')commands.push(()=>c.drawImage(el,r.left,r.top,r.width,r.height));
  else if(el.tagName==='IMG')commands.push(()=>{if(el.complete&&el.naturalWidth)c.drawImage(el,r.left,r.top,r.width,r.height);});
  else if(el.tagName==='INPUT')commands.push(()=>{if(el.type==='checkbox'){c.fillStyle='#302f23';c.fillRect(r.left,r.top,r.width,r.height);c.strokeStyle='#ac9868';c.strokeRect(r.left,r.top,r.width,r.height);if(el.checked){c.strokeStyle='#ddc992';c.lineWidth=2;c.beginPath();c.moveTo(r.left+4,r.top+r.height*.5);c.lineTo(r.left+r.width*.44,r.bottom-4);c.lineTo(r.right-3,r.top+4);c.stroke();}}
   else if(el.type==='range'){const ratio=(Number(el.value)-Number(el.min))/(Number(el.max)-Number(el.min));c.fillStyle='#776b49';c.fillRect(r.left,r.top+r.height/2-2,r.width,3);const x=r.left+ratio*r.width;c.fillStyle='#b19b6e';c.fillRect(x-5,r.top+r.height/2-8,10,16);c.fillStyle='#ded0a5';c.fillRect(x-5,r.top+r.height/2-8,10,1);}});
  else{
   for(const node of el.childNodes){if(node.nodeType===3){const runs=textRuns(node,s);if(runs.length)commands.push(()=>{c.font=font;c.fillStyle=color;c.textBaseline='alphabetic';c.textAlign='left';c.letterSpacing=s.letterSpacing==='normal'?'0px':s.letterSpacing;
     const metrics=c.measureText('Mg'),ascent=metrics.fontBoundingBoxAscent||fontSize*.82,descent=metrics.fontBoundingBoxDescent||fontSize*.2;
     for(const run of runs){const y=run.r.top+(run.r.height-ascent-descent)/2+ascent;c.fillText(run.text,run.r.left,y);}c.letterSpacing='0px';});}
    else if(node.nodeType===1)visit(node);}
  }
  commands.push(()=>c.restore());
 }
 function rebuild(){commands=[];const list=[...host.children].filter(el=>el.matches(roots));list.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0));for(const root of list)visit(root,true);for(const listbox of host.querySelectorAll('.retro-options'))if(!listbox.closest('.modal')?.hidden)visit(listbox,true);layoutDirty=false;}
 function paint(width,height){if(disposed)return false;
  const rect=host.querySelector('canvas.scene').getBoundingClientRect();
  const h=Math.min(720,height),w=Math.round(h*width/height);
  if(canvas.width!==w||canvas.height!==h||!frame||rect.left!==frame.left||rect.top!==frame.top||rect.width!==frame.width||rect.height!==frame.height){canvas.width=w;canvas.height=h;frame=rect;invalidate();}
  for(const r of selects)if(r.value!==r.select.value){r.value=r.select.value;r.sync();invalidate();}
  const revision=survival.revision+'|'+navigation.revision;if(revision!==lastRevision){dirty=true;lastRevision=revision;}
  if(!dirty)return false;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(w/rect.width,0,0,h/rect.height,-rect.left*w/rect.width,-rect.top*h/rect.height);c.imageSmoothingEnabled=true;if(layoutDirty)rebuild();
  for(const command of commands)command();dirty=false;return true;
 }
 function dispose(){disposed=true;document.documentElement.removeEventListener('ui-themechange',invalidate);observer.disconnect();resize.disconnect();for(const name of ['input','change','focusin','focusout','pointerover','pointerout','scroll'])host.removeEventListener(name,onEvent,true);for(const el of host.querySelectorAll('.raster-source'))el.classList.remove('raster-source');}
 return{canvas,paint,invalidate,dispose,setActive};
}
