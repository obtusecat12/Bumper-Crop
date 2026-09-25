import json,numpy as np
from PIL import Image,ImageDraw
from pathlib import Path
out=Path('docs/shore-v32');out.mkdir(exist_ok=True)
records=json.load(open('/tmp/shore-v32/plans.json'));panels=[]
for r in records:
 a=np.fromfile('/tmp/shore-v32/'+r['file'],np.float32).reshape(r['h'],r['w'],5);d,h,rock,beach,wet=[a[:,:,i] for i in range(5)]
 rgb=np.zeros((r['h'],r['w'],3))+[167,149,93];rgb=np.where((wet>.1)[:,:,None],[93,112,72],rgb);rgb=np.where((beach>.12)[:,:,None],[139,124,94],rgb)
 rgb=np.where(((rock>.45)&(abs(d)<15))[:,:,None],[95,95,81],rgb);t=np.clip(-h/5.5,0,1)[:,:,None];water=np.array([107,161,164])*(1-t)+np.array([45,93,105])*t;rgb=np.where((d<0)[:,:,None],water,rgb)
 gy,gx=np.gradient(h);lighting=np.clip(1-gx*.5-gy*.7,.6,1.25);rgb*=lighting[:,:,None]
 im=Image.fromarray(np.uint8(np.clip(rgb,0,255))).resize((600,480));frame=Image.new('RGB',(620,520),(22,29,29));frame.paste(im,(10,30));dr=ImageDraw.Draw(frame);dr.text((12,10),f"LAKE {r['j']+1} | shared generated field | 240 m",fill=(218,220,202));dr.line((30,494,155,494),fill='white',width=2);dr.text((32,500),'50 m',fill='white');panels.append(frame)
canvas=Image.new('RGB',(1240,1040));
for i,im in enumerate(panels):canvas.paste(im,((i%2)*620,(i//2)*520))
canvas.save(out/'shoreline-plans.png')
