// V99: re-lays the F2 developer panel as a console "service mode" menu:
// tabs per level, numbered single-line entries, and a readout column, without
// changing any button, id, or listener the game already wires up.
const GROUPS=[
 {id:'weather',label:'天气',code:'WX'},
 {id:'l0',label:'LEVEL 0',code:'L0',test:k=>k.startsWith('level0-')},
 {id:'l1',label:'LEVEL 1',code:'L1',test:k=>k.startsWith('level1-')},
 {id:'l10',label:'LEVEL 10',code:'L10',test:k=>['outhouse','outpost','pond','building','grove','farm-a','farm-b','barn','barn-photo','city-exit','start'].includes(k)},
 {id:'l11',label:'LEVEL 11',code:'L11',test:()=>true}
];
export function enhanceDeveloperPanel(root){
 const panel=root.querySelector('.developer-panel');if(!panel||panel.dataset.svc)return;panel.dataset.svc='1';
 const header=panel.querySelector('.panel-header');
 const sections=[...panel.querySelectorAll('.developer-actions')];
 const weather=sections.find(s=>s.querySelector('[data-weather]')),teleports=sections.find(s=>s.querySelector('[data-teleport]'));
 const weatherStatus=panel.querySelector('#weather-status'),status=panel.querySelector('#developer-status'),coords=panel.querySelector('.developer-coordinates'),perf=panel.querySelector('#developer-performance'),note=panel.querySelector('.panel-note');
 header.querySelector('h2').innerHTML='<span class="svc-kicker">SERVICE MODE</span>开发者模式';
 const tabs=document.createElement('div');tabs.className='svc-tabs';tabs.setAttribute('role','tablist');
 const lists=document.createElement('div');lists.className='svc-lists';
 const pages={};
 for(const g of GROUPS){
  const t=document.createElement('button');t.type='button';t.className='svc-tab';t.dataset.tab=g.id;t.setAttribute('role','tab');t.innerHTML=`<b>${g.code}</b>${g.label}`;tabs.append(t);
  const page=document.createElement('ol');page.className='svc-list';page.dataset.page=g.id;page.hidden=true;lists.append(page);pages[g.id]=page;
 }
 for(const b of weather?[...weather.children]:[])pages.weather.append(b);
 for(const b of teleports?[...teleports.children]:[]){const k=b.dataset.teleport||'';pages[GROUPS.slice(1).find(g=>g.test(k)).id].append(b);}
 for(const page of Object.values(pages))[...page.children].forEach((b,i)=>{const li=document.createElement('li');b.insertAdjacentHTML('afterbegin',`<i>${String(i+1).padStart(2,'0')}</i>`);li.append(b);page.append(li);});
 const side=document.createElement('aside');side.className='svc-readout';
 side.innerHTML='<h3>READOUT</h3>';
 const row=(label,node)=>{const d=document.createElement('div');d.className='svc-row';d.innerHTML=`<span>${label}</span>`;d.append(node);side.append(d);};
 if(coords){for(const pair of [...coords.children]){const dd=pair.querySelector('dd'),dt=pair.querySelector('dt');if(dd)row(dt?.textContent||'',dd);}coords.remove();}
 if(weatherStatus)row('天气',weatherStatus);
 if(status)row('状态',status);
 if(perf)row('性能',perf);
 if(note)side.append(note);
 const body=document.createElement('div');body.className='svc-body';
 const main=document.createElement('div');main.className='svc-main';main.append(tabs,lists);
 body.append(main,side);
 for(const n of [...panel.children])if(n!==header)n.remove();
 panel.append(body);
 const foot=document.createElement('div');foot.className='svc-foot';foot.innerHTML='<span><kbd>←</kbd><kbd>→</kbd> 切换</span><span><kbd>ENTER</kbd> 执行</span><span><kbd>F2</kbd> 关闭</span>';panel.append(foot);
 let current=localStorage.getItem('bc.devtab')||'l10';
 const show=id=>{current=pages[id]?id:'l10';for(const [k,p] of Object.entries(pages))p.hidden=k!==current;for(const t of tabs.children){const on=t.dataset.tab===current;t.classList.toggle('on',on);t.setAttribute('aria-selected',on);}try{localStorage.setItem('bc.devtab',current)}catch{}};
 tabs.addEventListener('click',e=>{const t=e.target.closest('.svc-tab');if(t)show(t.dataset.tab);});
 root.addEventListener('keydown',e=>{if(root.hidden)return;if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const ids=GROUPS.map(g=>g.id),i=ids.indexOf(current);show(ids[(i+(e.key==='ArrowRight'?1:ids.length-1))%ids.length]);e.preventDefault();e.stopPropagation();});
 show(current);
}
