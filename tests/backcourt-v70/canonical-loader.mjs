// Diagnostic-only: browser cache-busting query strings must not instantiate
// distinct mutable texture registries under Node during offline export.
export async function resolve(specifier,context,nextResolve){
 const result=await nextResolve(specifier,context);
 if(result.url.startsWith('file:')){const url=new URL(result.url);url.search='';url.hash='';return {...result,url:url.href};}
 return result;
}
