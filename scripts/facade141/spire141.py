# V141 F3b: blueprints of the SoHo focal spire's shaft base (shaftS = Gothic portal + revolving door, shaftW = granite base with
# four shopfronts + side door). Source = the same auto-crop spire135_assets.py makes of art-v135spire/spire_shaft<S|W>.png; the
# bottom CUT rows (below a string course) are upscaled x3 -> art-v141/sp<S|W>_bp.png + bc/scripts/facade141/sp<S|W>.json, built
# with the same build141.py/cook141.py pipeline. Runtime (soho135-spire.js) puts the baked low-poly under a flat upper quad that
# keeps the old atlas cell from v = CUTV upward.   python3 bc/scripts/facade141/spire141.py   (project root; numpy+pillow)
import json,numpy as np
from PIL import Image,ImageFilter
exec(open('bc/tools/spire135_assets.py').read().split('def q(c)')[0])   # crop()
HS=22.6378*2.9*1.1;FACEW={'S':22.6378,'W':23.9}
CUT={'S':543,'W':591}
out={}
def base(k,PW,PH,iron):
 return {"photo":f"art-v141/sp{k}_bp.png","px":[PW,PH],"w":FACEW[k],"iron":iron,"cols":[],"shape":"rect","hood":"none","sill":True,"mull":False,
  "floors":[],"hoodPx":{"gap":4,"h":14,"ext":10,"out":.12,"cap":5,"brk":0,"brkW":10,"pedH":30},"sillPx":{"h":10,"ext":8,"out":.1},
  "colonettes":[],"belts":[],"piers":[],"pierTop":30,"pierOut":.2,"pierPanels":[],"modil":{"x0":1,"x1":0,"step":40,"hw":7,"y0":10,"y1":12},
  "consoles":[],"consoleHW":12,"groundCols":[],"groundType":"flat","groundR":.2,"shop":[],"shopY":[PH-60,PH-10],"shopD":.3,"doors":[],"doorD":.6,
  "plinthY":PH-4,"glassD":.22,"winD":.28,"boxes":[]}
def top(s,c,o):s.update(crown=[0,c,o],crownSteps=[[0,c,o]],modillion=[c,c+2,.03],frieze=[c+2,c+4,.02],consoleY=[c,c+4],loCrownY=c,loFriezeOut=.03)
for k in 'SW':
 im=crop(Image.open(f'{SRC}/spire_shaft{k}.png')).convert('RGB');H0=im.height;c=CUT[k]
 bp=im.crop((0,c,im.width,H0)).resize((im.width*3,(H0-c)*3),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
 bp.save(f'art-v141/sp{k}_bp.png');PW,PH=bp.size;out[k]={'cutv':round((H0-c)/H0,5),'H':round((H0-c)/H0*HS,4),'px':[PW,PH]}
 s=base(k,PW,PH,[.84,.79,.68]);s['H']=out[k]['H']
 if k=='S':
  # o = bot-image y offset (bot crops start at crop row 534, x3) -> blueprint y = bot y - o
  o=(c-534)*3;Y=lambda y:y-o;top(s,Y(40),.12)
  win=[[72,112],[135,172],[597,635],[657,695]]
  s['floors']=[{"y":[Y(a),Y(a),Y(b)],"cols":win} for a,b in[(85,172),(240,337),(405,512)]]+\
   [{"y":[Y(118),Y(300),Y(415)],"cols":[[282,492]],"shape":"arch","hood":"arch","sill":False}]   # tracery window over the portal
  s.update(doors=[[278,492,Y(415),Y(612)]],doorD=.85,piers=[[0,20],[195,235],[535,575],[748,768]],pierTop=Y(48),pierBot=Y(612),pierOut=.28,
   shopCornice=[Y(526),Y(532),.1],plinthY=Y(530),
   boxes=[[60,185,Y(66),Y(80),0,.12],[585,710,Y(66),Y(80),0,.12],[255,510,Y(44),Y(84),0,.08],[72,172,Y(178),Y(236),0,.04],[597,695,Y(178),Y(236),0,.04],
          [72,172,Y(343),Y(400),0,.04],[597,695,Y(343),Y(400),0,.04],[232,538,Y(300),Y(318),0,.14]])
 else:
  o=(c-534)*3;Y=lambda y:y-o;top(s,Y(196),.2)
  s['floors']=[{"y":[Y(232),Y(232),Y(338)],"cols":[[42,188],[238,383],[430,575],[622,768],[852,940]],"hood":"cornice","mull":True}]
  s.update(belts=[[Y(340),Y(358),.16]],shop=[[40,196],[225,390],[420,586],[614,778]],shopY=[Y(482),Y(612)],shopD=.35,
   doors=[[846,944,Y(412),Y(615)]],doorD=.7,shopCornice=[Y(404),Y(410),.05],plinthY=Y(618),
   awn={'bays':[[40,196],[225,390],[420,586],[614,778]],'top':Y(410)},
   boxes=[[805,838,Y(508),Y(530),0,.03]])
  out[k]['awn']=s.pop('awn')
 json.dump(s,open(f'bc/scripts/facade141/sp{k}.json','w'))
print(json.dumps(out))
