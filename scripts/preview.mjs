import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]},root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.woff':'font/woff'};
// Local inspection routes are served only here, never from the published dist.
async function visualCheck(url){
 const panel=url.searchParams.get('panel')||'menu';
 if(panel==='atlas')return `<!doctype html><html><head><meta charset="utf-8"><title>Wheat texture inspection</title><style>body{background:#263327;margin:20px}canvas{display:block;max-width:100%;height:auto}</style></head><body><script type="module">import {buildDenseWheat} from './dense-wheat.js';import {field} from './world.js';import {Vector3} from './vendor/three.module.min.js';const wind={time:{value:0},player:{value:new Vector3()},strength:{value:0}};const group=buildDenseWheat(field(1n,1n,10),0,'balanced',wind).mesh;document.body.append(group.children[0].material.map.image);</script></body></html>`;
 const source=await readFile(resolve(root,'main.js'),'utf8');
 let markup=source.match(/game\.innerHTML=`([\s\S]*?)`;/)[1];
 markup=markup.replace('id="loading"','id="loading" hidden');
 if(panel==='menu')markup=markup.replace('id="start" disabled','id="start"').replace('正在进入麦田','进入麦田');
 else{markup=markup.replace('id="menu"','id="menu" hidden');markup=markup.replace(new RegExp('(id="'+panel+'"[^>]*?) hidden'), '$1');}
 return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interface inspection</title><link rel="stylesheet" href="./style.css"></head><body><div id="game">'+markup+'</div></body></html>';
}
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://terminal.local');
  if(url.pathname==='/__tiki-v78.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/tiki-v78/preview.html')));return;}
  if(url.pathname==='/__game-v78.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'index.html'),'utf8')).replace('./boot.js?v=78','/__boot-v78.js'));return;}
  if(url.pathname==='/__boot-v78.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'boot.js'),'utf8')).replace('./main.js?v=78','/__main-v78.js'));return;}
  if(url.pathname==='/__main-v78.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'main.js'),'utf8'))+'\nwindow.v78QA={state,enterCity,enterBath,enterTiki,leaveTiki,teleportCity,teleportFromMap,use,setPlay,resetCameraRig,camera,renderer,exitScene,tikiTransition,get tiki(){return tikiRoom},get tikiActive(){return tikiActive},get bath(){return bathhouse},get loading(){return bathLoading},get ready(){return ready}};');return;}
  if(url.pathname==='/__tiki-v77.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/tiki-v77/preview.html')));return;}
  if(url.pathname==='/__game-v77.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'index.html'),'utf8')).replace('./boot.js?v=77','/__boot-v77.js'));return;}
  if(url.pathname==='/__boot-v77.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'boot.js'),'utf8')).replace('./main.js?v=77','/__main-v77.js'));return;}
  if(url.pathname==='/__main-v77.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'main.js'),'utf8'))+'\nwindow.v77QA={state,enterCity,enterBath,enterTiki,leaveTiki,teleportCity,teleportFromMap,use,setPlay,resetCameraRig,camera,renderer,exitScene,tikiTransition,get tiki(){return tikiRoom},get tikiActive(){return tikiActive},get bath(){return bathhouse},get loading(){return bathLoading},get ready(){return ready}};');return;}
  if(url.pathname==='/__tiki-v76.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/tiki-v76/preview.html')));return;}
  if(url.pathname==='/__game-v76.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'index.html'),'utf8')).replace('./boot.js?v=76','/__boot-v76.js'));return;}
  if(url.pathname==='/__boot-v76.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'boot.js'),'utf8')).replace('./main.js?v=76','/__main-v76.js'));return;}
  if(url.pathname==='/__main-v76.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'main.js'),'utf8'))+'\nwindow.v76QA={state,enterCity,enterBath,enterTiki,leaveTiki,teleportCity,teleportFromMap,use,setPlay,resetCameraRig,camera,renderer,exitScene,tikiTransition,get tiki(){return tikiRoom},get tikiActive(){return tikiActive},get bath(){return bathhouse},get loading(){return bathLoading},get ready(){return ready}};');return;}
  if(url.pathname==='/__game-v75.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'index.html'),'utf8')).replace('./boot.js?v=75','/__boot-v75.js'));return;}
  if(url.pathname==='/__boot-v75.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'boot.js'),'utf8')).replace('./main.js?v=75','/__main-v75.js'));return;}
  if(url.pathname==='/__main-v75.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});res.end((await readFile(resolve(root,'main.js'),'utf8'))+'\nwindow.v75QA={state,enterCity,enterBath,enterSpring,leaveSpring,setPlay,camera,renderer,get bath(){return bathhouse},get spring(){return spring},get loading(){return bathLoading},get ready(){return ready}};');return;}
  if(url.pathname==='/__alley-v75.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v75/alley.html')));return;}
  if(url.pathname==='/__bath-v75.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v75/preview.html')));return;}
  if(url.pathname==='/__npc-v75.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v75/studio.html')));return;}
  if(url.pathname==='/__alley-v74.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v74/alley.html')));return;}
  if(url.pathname==='/__bath-v74.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v74/preview.html')));return;}
  if(url.pathname==='/__bath-v73.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v73/preview.html')));return;}
  if(url.pathname==='/__bath-v72.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/bath-v72/preview.html')));return;}
  if(url.pathname==='/__visual-check.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await visualCheck(url));return;}
  if(url.pathname==='/__rural-v37.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/rural-v37/map-preview.html')));return;}
  if(url.pathname==='/__compounds-v36.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/compounds-v36/map-preview.html')));return;}
  if(url.pathname==='/__roads-v35.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/roads-v35/map-preview.html')));return;}
  if(url.pathname==='/__repair-v34.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/repair-v34/map-preview.html')));return;}
  if(url.pathname==='/__crops-v33.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/patchwork-v33/crop-preview.html')));return;}
  if(url.pathname==='/__patchwork-v33.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/patchwork-v33/map-preview.html')));return;}
  if(url.pathname==='/__shore-v32.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'});res.end(await readFile(resolve('tests/shore-v32/map-preview.html')));return;}
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(Number(option('--port','4173')),option('--host','0.0.0.0'),()=>console.log('Level 10 preview ready'));
