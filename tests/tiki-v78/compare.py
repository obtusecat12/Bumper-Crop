from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
base=Path(__file__).resolve().parent
upload=base.parents[2]/'upload'
results=base/'results'
rows=[
('01  Cocktail counter / separate rear worktop','image(20261003-121618).png','game-cocktail.png','Original photograph'),
('02  Red lantern / dense cabinet','image(20261003-121806).png','game-corner.png','Previous game screenshot'),
('03  Idol, bottle shelves and small props','44a1ab9f4f5921d96b1b48faded3b0f3.png','game-corner.png','Original photograph'),
('04  One pond / side view','4ae734c080fc269d02fa7b4e8ae35572.png','game-pond-side.png','Original photograph'),
('05  Same pond / front view','a78ba32e55e2f8099ce3ade9e69eeb95.png','game-pond.png','Original photograph'),
('06  Dining room and exit visibility','image(20261003-122131).png','game-dining.png','Previous game screenshot'),
('07  Recessed canoe trays, ice and fruit','5c99c390beeedfbd80bbee053c687267.png','game-canoe.png','Original photograph'),
]
W=1800;rh=665
out=Image.new('RGB',(W,170+rh*len(rows)),(19,22,23));d=ImageDraw.Draw(out)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f=ImageFont.truetype(font,24);title=ImageFont.truetype(font,36);small=ImageFont.truetype(font,18)
d.text((32,24),'TIKI V78  |  Original references and actual game captures',font=title,fill='white')
d.text((32,85),'Right: real browser gameplay with the existing VHS filter. Camera angles differ; this is not pixel-identical.',font=f,fill=(190,200,203))
d.text((32,120),'Image-model enlargements were reviewed separately; originals remain the evidence. No screenshot exposure edits.',font=small,fill=(170,183,185))
for n,(name,src,dst,kind) in enumerate(rows):
 y=170+n*rh;d.rectangle((20,y,W-20,y+rh-16),fill=(29,34,35));d.text((34,y+12),name,font=f,fill=(239,204,132))
 for side,p in enumerate((upload/src,results/dst)):
  im=Image.open(p).convert('RGB');old=im.size
  im=ImageOps.contain(im,(850,550),Image.Resampling.LANCZOS);x=35+side*890
  out.paste(im,(x+(850-im.width)//2,y+66+(550-im.height)//2))
  lab=(kind if side==0 else 'V78 actual game / 1280 x 900')+('  /  '+str(old[0])+' x '+str(old[1]) if side==0 else '')
  d.text((x,y+620),lab,font=small,fill=(199,210,210))
out.save(results/'reference-comparison.jpg',quality=93,subsampling=0)
print(results/'reference-comparison.jpg')
