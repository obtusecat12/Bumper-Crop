import sys,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[2];P=pathlib.Path(sys.argv[1]);sys.path.insert(0,str(ROOT/'tests/water-v28/native'))
s=(ROOT/'tests/visibility-cloud-v43/render.py').read_text()
exec(s[:s.index('for label,t,pitch,steps,rain')])
exec(s[s.index('y,x=np.mgrid'):s.index('optics(2.478,2.58,0);')])
new=programs['fused'];old=programs['fusedBefore'];report={}
for label,f,focus in [('wide',2.478,2.58),('tele',11.15,1.2),('macro',2.478,.45),('near',2.478,4.5)]:
 images=[];times=[]
 for pr in [old,new]:
  programs['fused']=pr;Finish();start=time.perf_counter();optics(f,focus);Finish();times.append((time.perf_counter()-start)*1000)
  a=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,a.ctypes.data);images.append(a)
 delta=abs(images[0][:,:,:3].astype(float)-images[1][:,:,:3]);assert delta.max()<=1,(label,delta.max())
 # Warm median of identical postprocess fixtures, not hardware GPU timing.
 t=[]
 for pr in [old,new]:
  programs['fused']=pr;seq=[]
  for i in range(4):
   Finish();start=time.perf_counter();optics(f,focus);Finish();seq.append((time.perf_counter()-start)*1000)
  t.append(float(np.median(seq)))
 report[label]={'max_channel_error_255':float(delta.max()),'mean_channel_error_255':float(delta.mean()),'software_chain_ms_before_after':t}
 print(label,report[label],flush=True)
json.dump({'renderer':GetString(0x1F01).decode(),'hardware_fps_test':False,'cases':report},open(P/'optics-comparison.json','w'),indent=2)
