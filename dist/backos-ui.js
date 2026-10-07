// V101 backOS: tiny title/pause tray clock + boot-state line. One 20s interval, no animation frames.
export function initBackOS(root){
  if(!root)return;
  const clock=root.querySelector('#bos-clock'),state=root.querySelector('#bos-state'),mode=root.querySelector('#rx-mode'),start=root.querySelector('#start');
  const tick=()=>{if(root.hidden||!clock)return;const d=new Date();clock.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};
  const sync=()=>{if(!state)return;const paused=mode&&mode.textContent.trim()==='PAUSE';const ready=start&&!start.disabled;
    root.dataset.bos=paused?'paused':ready?'ready':'boot';
    state.textContent=paused?'会话已挂起 · SUSPENDED':ready?'系统就绪 · READY':'正 在 开 机 . . .';};
  tick();sync();setInterval(tick,20000);
  if(mode)new MutationObserver(sync).observe(mode,{childList:true,characterData:true,subtree:true});
  if(start)new MutationObserver(sync).observe(start,{attributes:true,attributeFilter:['disabled']});
}
