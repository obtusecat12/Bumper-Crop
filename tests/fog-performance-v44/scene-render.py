import pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[2];SKY=pathlib.Path(sys.argv[2])
# V43 harness loads actual exported terrain/plant/prop geometry and production
# sky/optics. Extend its composition stage; do not substitute a painted scene.
s=(ROOT/'tests/visibility-cloud-v43/scene-render.py').read_text()
s=s.replace("fixture['cameras']=fixture['cameras'][:1]",(ROOT/'tests/fog-performance-v44/fog-setup.py').read_text())
s=s.replace('def renderPost(cam):','def renderPost(cam):\n picture=renderFog(cam,fogAge)')
s=s.replace("('picture',opaque[1])","('picture',picture)").replace("('sharp',opaque[1])","('sharp',picture)")
s=s.replace("s=s[:a]+'renderPost(cam)'+s[b:]", "s=s[:a]+'''\n  for fogAge in [0,30,55,72,90]:\n   renderPost(cam)\n   out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);assert GetError()==0\n   im=Image.fromarray(out[::-1,:,:3]);im.save(SKY/f'fog-{fogAge:02}.png')\n   print('fog scene',fogAge,flush=True)\n  '''+s[b:]")
s=s.replace('V43 / SOFTWARE GLES','V44 / SOFTWARE GLES')
exec(compile(s,str(ROOT/'tests/visibility-cloud-v43/scene-render.py'),'exec'))
