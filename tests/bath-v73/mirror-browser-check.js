(()=>{
 const b=bathCheck,r=b.renderer,c=b.camera,m=b.bath.mirror;
 if(!b.state().ready)throw Error('Scene must finish loading before verification');
 c.fov=78;c.updateProjectionMatrix();
 const report={cameraFov:78,renderer:'Chrome / ANGLE SwiftShader software WebGL2; not hardware gameplay FPS',programsBefore:r.info.programs.length};
 c.position.set(-2.2,1.7,6.85);c.lookAt(.58,1.76,.232);c.updateMatrixWorld();r.shadowMap.needsUpdate=false;r.info.autoReset=false;r.info.reset();b.render();
 report.programsAfterDoorway=r.info.programs.length;report.newDoorwayPrograms=report.programsAfterDoorway-report.programsBefore;report.doorwayCalls=r.info.render.calls;report.doorwayTriangles=r.info.render.triangles;report.mirrorCalls=m.stats.lastCalls;report.mirrorTriangles=m.stats.lastTriangles;r.info.autoReset=true;
 const data=new Uint16Array(64*32*4);
 function hash(){r.readRenderTargetPixels(m.target,224,112,64,32,data);let h=2166136261;for(const n of data)h=Math.imul(h^n,16777619);return h>>>0;}
 c.position.set(.4,1.68,2.7);c.lookAt(.58,1.76,.232);c.updateMatrixWorld();const start=m.stats.captures;b.bath.update(10,{x:c.position.x,z:c.position.z});b.bath.beforeRender(r,c);const a={hash:hash(),matrix:m.camera.matrixWorld.elements.slice(),position:m.stats.lastCameraPosition.slice()};
 c.position.x+=.08;c.lookAt(.66,1.76,.232);c.updateMatrixWorld();b.bath.update(10.016,{x:c.position.x,z:c.position.z});b.bath.beforeRender(r,c);const z={hash:hash(),matrix:m.camera.matrixWorld.elements.slice(),position:m.stats.lastCameraPosition.slice()};
 report.sameFrame={captures:m.stats.captures-start,timeStepSeconds:.016,firstPosition:a.position,nextPosition:z.position,firstPixelHash:a.hash,nextPixelHash:z.hash,reflectionCameraChanged:a.matrix.some((n,i)=>Math.abs(n-z.matrix[i])>1e-7)};
 const before=m.stats.captures;c.lookAt(c.position.x,1.68,12);c.updateMatrixWorld();b.bath.beforeRender(r,c);report.offscreenCaptureDelta=m.stats.captures-before;report.globalClipPlanes=r.clippingPlanes.length;
 if(report.newDoorwayPrograms!==0)throw Error('Unexpected first-doorway shader compilation');
 if(report.sameFrame.captures!==2||a.hash===z.hash||!report.sameFrame.reflectionCameraChanged)throw Error('Mirror did not track two consecutive 16ms poses');
 if(report.offscreenCaptureDelta!==0||report.globalClipPlanes!==0)throw Error('Mirror capture/clip state regression');
 const g=r.getContext(),types=new Set([g.SAMPLER_2D,g.SAMPLER_CUBE,g.SAMPLER_3D,g.SAMPLER_2D_SHADOW,g.SAMPLER_2D_ARRAY,g.SAMPLER_2D_ARRAY_SHADOW]);let worst=0;
 for(const p of r.info.programs){let total=0;for(let i=0;i<g.getProgramParameter(p.program,g.ACTIVE_UNIFORMS);i++){const u=g.getActiveUniform(p.program,i);if(types.has(u.type))total+=u.size;}worst=Math.max(worst,total);}
 report.maxFragmentSamplers=worst;report.minimumWebGL2Budget=16;if(worst>16)throw Error('Fragment sampler budget exceeded');
 report.passed=true;return JSON.stringify(report);
})()
