import * as T from './vendor/three.module.min.js';
export const CAMP_IDS98=['toilet','clerk','diner','sleeper','fireElder','fireYoung','fireWorker'];
const cache=new Map();let pending;
export function initializeCampLife98(){if(pending)return pending;pending=(async()=>{const names=CAMP_IDS98.flatMap(id=>['face','face-closed','shirt','fabric','skin','hair'].map(n=>id+'/'+n)).concat(['radio-front','cigarettes-turquoise','cigarettes-red','can-vanilla','can-budlight','can-modelo','cooler-panel','weathered-boards','rusty-tin','dirty-concrete','peas']);let index=0;const loader=new T.TextureLoader();await Promise.all(Array.from({length:4},async()=>{while(index<names.length){const key=names[index++],t=await loader.loadAsync(new URL('./textures/camp-v98/'+key+'.webp',import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.anisotropy=1;cache.set(key,t);}}));})();return pending;}
export function campTexture98(key){const t=cache.get(key);if(!t)throw Error('Camp texture missing: '+key);return t;}
export function campSurface98(key,extra={}){const map=campTexture98(key);return new T.MeshStandardMaterial({name:'Generated V98 '+key,map,roughness:.86,bumpMap:map,bumpScale:.004,...extra});}
export function warmCampTextures98(renderer){for(const t of cache.values())renderer.initTexture(t);}
