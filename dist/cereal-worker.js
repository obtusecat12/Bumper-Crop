import {generateCerealCell} from './cereal-layout.js?v=49';
self.onmessage=({data})=>{
 try{const cell=generateCerealCell(data.cx,data.cz,data.seed);self.postMessage({id:data.id,cell},[cell.matrices.buffer,cell.colors.buffer,cell.kinds.buffer,cell.baked.roots.buffer,cell.baked.ids.buffer,cell.baked.metadata.selection.buffer]);}
 catch(error){self.postMessage({id:data.id,error:String(error?.stack||error)});}
};
