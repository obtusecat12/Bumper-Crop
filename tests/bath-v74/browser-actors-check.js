window.npcRun74={running:true};
(async()=>{
 const T=await import('/vendor/three.module.min.js'),{createRetroActor74,RETRO_ROLES74}=await import('/retro-cast-v74.js');
 const b=bathCheck,r=b.renderer,shared=b.bath.occupants.textures;
 const find=k=>shared.find(t=>(t.image?.src||'').endsWith('/'+k+'.png'));
 const sets=Object.fromEntries(RETRO_ROLES74.map(role=>[role,{face:find(role+'/face'),faceBlink:find(role+'/face-blink'),body:find(role+'/body'),newspaper:find('reader-newspaper-128')}]));
 const scene=new T.Scene();scene.background=new T.Color(0x4b504b);scene.add(new T.HemisphereLight(0xffffff,0x6b6459,2));const key=new T.DirectionalLight(0xffedce,2);key.position.set(2,6,5);scene.add(key);
 const camera=new T.PerspectiveCamera(48,1,.05,30);camera.position.set(1.5,2.7,6.7);camera.lookAt(1.5,.7,0);
 const target=new T.WebGLRenderTarget(256,256);const actors=RETRO_ROLES74.map((role,i)=>{const a=createRetroActor74(T,role,sets[role],{seed:7401+i});a.group.position.set((i%3)*1.4,0,-Math.floor(i/3)*1.6);scene.add(a.group);return a;});
 const draw=()=>{const old=r.getRenderTarget();r.setRenderTarget(target);r.render(scene,camera);r.setRenderTarget(old);};draw();draw();
 const before={...r.info.memory,programs:r.info.programs.length},versions=shared.map(t=>t.version),start=performance.now();let frames=0,dtMax=0,last=start,updateMax=0;
 await new Promise(resolve=>{function tick(now){const dt=(now-last)/1000;last=now;dtMax=Math.max(dtMax,dt);const stamp=performance.now();actors.forEach(a=>a.update((now-start)/1000,dt));updateMax=Math.max(updateMax,performance.now()-stamp);draw();frames++;if(now-start>=30000)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 const after={...r.info.memory,programs:r.info.programs.length};const report={renderer:'Chrome ANGLE SwiftShader software WebGL2; not hardware FPS',durationMs:performance.now()-start,frames,updateMaxMs:updateMax,longestRenderIntervalSeconds:dtMax,before,after,actors:actors.map(a=>({...a.diagnostics})),noAnimationTextureUploads:versions.every((v,i)=>v===shared[i].version),samplersAtMost16:true};
 const gl=r.getContext(),types=new Set([gl.SAMPLER_2D,gl.SAMPLER_CUBE,gl.SAMPLER_3D,gl.SAMPLER_2D_SHADOW,gl.SAMPLER_2D_ARRAY,gl.SAMPLER_2D_ARRAY_SHADOW]);report.maxSamplers=0;
 for(const p of r.info.programs){let count=0;for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);if(types.has(u.type))count+=u.size;}report.maxSamplers=Math.max(report.maxSamplers,count);}
 report.samplersAtMost16=report.maxSamplers<=16;report.noResourceGrowth=before.geometries===after.geometries&&before.textures===after.textures&&before.programs===after.programs;
 actors.forEach(a=>{a.update(3600,3569);a.dispose();a.dispose();});target.dispose();report.afterDispose={...r.info.memory};
 if(!report.noResourceGrowth||!report.noAnimationTextureUploads||!report.samplersAtMost16)throw Error(JSON.stringify(report));
 report.passed=true;b.render();return JSON.stringify(report);
})().then(result=>{window.npcRun74={running:false,result:JSON.parse(result)};}).catch(error=>{window.npcRun74={running:false,error:String(error)};});
"started";
