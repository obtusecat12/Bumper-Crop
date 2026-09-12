// UI-only level themes. No world, renderer, filter, or map-cache mutation.
export const FIELD_THEME=Object.freeze({
  ink:'#e1decc',muted:'#a8a899',accent:'#e2d594',line:'#747769',
  shell:'#363c2e',shellTop:'#535a46',shellBottom:'#20271d',
  bevelLight:'#929780',bevelDark:'#080e07',screen:'#171b15',screenDeep:'#0b1109',
  screenInk:'#c7ccaf',glass:'#bec6a7',button:'#414730',buttonActive:'#e2d594',
  buttonInk:'#e1decc',activeInk:'#171b15',shadow:'#060b06',
  mapBackground:'#27302a',mapGrid:'#364037',mapPlayer:'#fff3c4',mapOutline:'#121b18',mapCursor:'#fff2c1',
  radius:'5px',bezel:'3px',font:"Level10Pixel, 'Courier New', monospace"
});
const cssName=k=>'--ui-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
const idValue=(id,label)=>{if(typeof id!=='string'||!id.trim()||id.length>80)throw new TypeError('Invalid '+label);return id;};
export function createUIThemes({root=document.documentElement,host=document}={}){
  const themes=new Map([['field-recorder',FIELD_THEME]]),levels=new Map();
  let current=null;
  function registerTheme(id,{extends:parent='field-recorder',tokens={}}={}){
    idValue(id,'theme ID');if(themes.has(id))throw new Error('Theme already registered: '+id);
    if(!themes.has(parent))throw new Error('Unknown parent theme: '+parent);
    const next={...themes.get(parent)};
    for(const [key,value] of Object.entries(tokens)){
      if(!Object.hasOwn(FIELD_THEME,key)||typeof value!=='string'||!value.trim())throw new TypeError('Invalid theme token: '+key);
      const property=key==='font'?'font-family':key==='radius'?'border-radius':key==='bezel'?'border-width':'color';
      if(globalThis.CSS?.supports&&!CSS.supports(property,value))throw new TypeError('Invalid value for '+key);
      next[key]=value;
    }
    themes.set(id,Object.freeze(next));return id;
  }
  function registerLevel(id,{theme='field-recorder',code,name,subtitle,number}={}){
    idValue(id,'level ID');if(levels.has(id))throw new Error('Level already registered: '+id);
    if(!themes.has(theme))throw new Error('Unknown theme: '+theme);
    const copy={code,name,subtitle,number};for(const [key,value] of Object.entries(copy))idValue(value,key);
    levels.set(id,Object.freeze({theme,...copy}));return id;
  }
  function apply(levelId,themeId){
    const level=levels.get(levelId),tokens=themes.get(themeId);
    if(!level)throw new Error('Unknown UI level: '+levelId);
    if(!tokens)throw new Error('Unknown UI theme: '+themeId);
    if(current?.level===levelId&&current.theme===themeId)return current;
    for(const [key,value] of Object.entries(tokens))root.style.setProperty(cssName(key),value);
    root.dataset.uiTheme=themeId;root.dataset.uiLevel=levelId;
    host.querySelectorAll('[data-ui-copy]').forEach(node=>{const value=level[node.dataset.uiCopy];if(value!==undefined)node.textContent=value;});
    current=Object.freeze({level:levelId,theme:themeId,copy:level,tokens});
    root.dispatchEvent(new CustomEvent('ui-themechange',{detail:current}));return current;
  }
  registerLevel('10',{theme:'field-recorder',code:'LEVEL 10',name:'丰裕',subtitle:'ABUNDANCE',number:'010'});
  return Object.freeze({registerTheme,registerLevel,
    applyLevel:id=>apply(id,levels.get(id)?.theme),
    applyTheme:id=>apply(current?.level||'10',id),getState:()=>current});
}
