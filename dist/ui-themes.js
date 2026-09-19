// UI-only level themes. No world, renderer, filter, or map-cache mutation.
export const FIELD_THEME=Object.freeze({
 ink:'#c8ba96',muted:'#a3987b',accent:'#d2c291',line:'#756747',
 shell:'#403d2e',shellTop:'#756747',shellBottom:'#28271e',bevelLight:'#b1a17a',bevelDark:'#191d17',screen:'#302f24',screenDeep:'#171c17',
 screenInk:'#bdb494',glass:'#bfc8aa',button:'#373b2e',buttonActive:'#e0d2a6',buttonInk:'#c8ba96',activeInk:'#e0d2a6',shadow:'#10160f',
 vialLiquid:'#af9561',vialShadow:'#544c30',vialLight:'#c3b47c',vialSurface:'#d7d9b0',
 mapBackground:'#27302a',mapGrid:'#364037',mapPlayer:'#e2d9b3',mapOutline:'#121b18',mapCursor:'#fff2c1',
 radius:'0px',bezel:'0px',font:"Georgia, HarvestSerif, 'Times New Roman', 'Songti SC', SimSun, serif",
 // Compatibility tokens retained for registered themes; default instruments
 // use geometry and palette tokens rather than whole-widget image skins.
 vitalsSkin:'none',compassSkin:'none',keySkin:'none',vialSkin:'none'
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
      const property=key.endsWith('Skin')?'background-image':key==='font'?'font-family':key==='radius'?'border-radius':key==='bezel'?'border-width':'color';
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
