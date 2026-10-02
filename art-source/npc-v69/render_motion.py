from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from build_npcs import Model,render
P=Path(__file__).resolve().parent;out=P/'final';frames=out/'motion-frames';frames.mkdir(exist_ok=True)
models={k:Model(k) for k in ['a','b']};paths={k:[P/'runtime'/f'body-{k}.png',P/'runtime'/f'face-{k}.png',P/'runtime'/'towel.png'] for k in models}
anims={k:models[k].animation() for k in models}
# Open and closed eye evidence uses identical camera, pose and texture; only
# the authored nonzero eyelid morph changes. Both show exported geometry.
b=models['b'];cam=dict(size=(420,460),yaw=-.08,target=b.head_pivot+np.array([0,.130,.02]),scale=4.2)
ims=[]
for label,weight in [('open',0),('closed',1)]:
 im=render(b,paths['b'],out/f'b-eyes-{label}.png',pose=anims['b'][3][48],morph_weights=[weight,.2,.3],**cam);d=ImageDraw.Draw(im);d.text((12,12),f'B / {label} / actual fitted eyelids',fill=(236,231,218));ims.append(im)
sheet=Image.new('RGB',(840,460));sheet.paste(ims[0],(0,0));sheet.paste(ims[1],(420,0));sheet.save(out/'b-eyes-open-closed.png')
for frame in range(240):
 canvas=Image.new('RGB',(960,570),(29,35,38));d=ImageDraw.Draw(canvas)
 for k,x in [('a',0),('b',288)]:
  m=models[k];pose=anims[k][3][frame];mw=anims[k][2][frame]
  im=render(m,paths[k],frames/f'tmp-{k}.png',size=(288,512),yaw=-.35 if k=='a' else -.22,pose=pose,morph_weights=mw)
  canvas.paste(im,(x,35));d.text((x+12,12),('A / elder resting' if k=='a' else 'B / younger standing'),fill=(236,231,218))
 pose=anims['b'][3][frame];mw=anims['b'][2][frame]
 im=render(b,paths['b'],frames/'tmp-head.png',size=(384,320),yaw=-.08,target=b.head_pivot+np.array([0,.13,.02]),scale=5.2,pose=pose,morph_weights=mw);canvas.paste(im,(576,35));d.text((588,12),'B / head turn + real blink',fill=(236,231,218))
 im=render(b,paths['b'],frames/'tmp-hands.png',size=(384,192),yaw=-.1,target=[-.035,.78,.13],scale=4.2,pose=pose,morph_weights=mw);canvas.paste(im,(576,355));d.text((588,358),'B / fixed basin palm + finger curl',fill=(236,231,218))
 d.text((12,551),f'Actual textured mesh animation / 20 Hz STEP / natural amplitude / {frame/20:05.2f} s',fill=(200,213,217));canvas.save(frames/f'{frame:04d}.png')
 if frame%40==0:print(f'rendered {frame}/240',flush=True)
for p in frames.glob('tmp-*.png'):p.unlink()
print('All 240 frames rendered.',flush=True)
