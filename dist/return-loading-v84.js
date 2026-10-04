import {createBathLoading} from './bath-loading-v72.js';
export const albumPhotos=kind=>Array.from({length:10},(_,i)=>new URL(`./textures/transit-v84/${kind}-${String(i+1).padStart(2,'0')}.webp`,import.meta.url).href);
export function createRuralReturnLoading(){return createBathLoading(document.body,{slides:albumPhotos('rural'),title:'LEVEL 10 / THE FIELDS',opening:'正在穿过最后一片麦田',alt:'无人美国麦田、农场与湖泊的旧数码照片',returnText:'返回小径'});}
