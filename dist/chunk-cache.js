// Best-effort local cache of deterministic CPU products. Never cache materials,
// GPU handles or worker resource IDs. A new release gets an isolated database.
const DB='level10-cpu-v43',STORE='tiles',LIMIT=64;let connection;
async function database(){
 if(typeof indexedDB==='undefined')return null;
 if(!connection)connection=new Promise(resolve=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'key'}).createIndex('time','time');request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);});
 return connection;
}
export async function readChunkCache(key){
 try{const db=await database();if(!db)return null;return await new Promise(resolve=>{const request=db.transaction(STORE).objectStore(STORE).get(key);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);});}catch{return null;}
}
export async function writeChunkCache(entry){
 try{const db=await database();if(!db)return;await new Promise(resolve=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);store.put({...entry,time:Date.now()});
  const request=store.count();request.onsuccess=()=>{let excess=request.result-LIMIT;if(excess<=0)return;const cursor=store.index('time').openKeyCursor();cursor.onsuccess=()=>{const row=cursor.result;if(row&&excess-->0){store.delete(row.primaryKey);row.continue();}};};
  tx.oncomplete=tx.onerror=tx.onabort=()=>resolve();
 });}catch{/* Storage denial/eviction must never block entering the game. */}
}
