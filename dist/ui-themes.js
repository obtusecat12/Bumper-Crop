// UI-only level themes. No world, renderer, filter, or map-cache mutation.
export const FIELD_THEME=Object.freeze({
  ink:'#e5d4ac',muted:'#c0ac83',accent:'#e4c77c',line:'#a78548',
  shell:'#46321d',shellTop:'#987341',shellBottom:'#211a10',
  bevelLight:'#c8a970',bevelDark:'#1b140b',screen:'#2a2013',screenDeep:'#161109',
  screenInk:'#d8c49a',glass:'#dec69c',button:'#c7a971',buttonActive:'#efd394',
  buttonInk:'#342516',activeInk:'#211a10',shadow:'#100c07',
  vialLiquid:'#c5a853',vialShadow:'#57410e',vialLight:'#e6ce79',vialSurface:'#f3dda0',
  mapBackground:'#27302a',mapGrid:'#364037',mapPlayer:'#fff3c4',mapOutline:'#121b18',mapCursor:'#fff2c1',
  radius:'0px',bezel:'0px',font:"Georgia, HarvestSerif, 'Times New Roman', 'Songti SC', SimSun, serif",
  vitalsSkin:'url("./assets/ui/harvest-vitals.png")',compassSkin:'url("./assets/ui/harvest-compass.svg")',keySkin:'url("./assets/ui/harvest-key.svg")',vialSkin:'url("./assets/ui/sanity-vial.png")'
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
