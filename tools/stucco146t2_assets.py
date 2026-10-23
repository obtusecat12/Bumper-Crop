# V146 T2 textures (left terrace + area + street furniture). Run from the project root after stucco146_assets.py.
# Sources art-v146/m146_*.png, each generated large on its own; signs / plaques / lantern glass drawn large with PIL then reduced.
#  abrick146(-n,-r) warm sooty stock brick (rear annex)   flag146(-n,-r) York stone flags (area floor, steps treads)
#  awall146(-n,-r)  damp painted render (area retaining walls, basement front)   lamp146(-n,-r) chipped black cast iron (lamp posts)
#  boll146(-n,-r)   black/white bollard bands (unit V)    bike146(-n,-r) green enamel frame   rub146(-n,-r) tyre rubber
#  door2146(-n)     green six-panel door (left house)     sign146 street name plates (2 rows)  plaque146 blue number plates (4 cells)
#  lant146          lantern glass (emissive)              ../l11-v132t/car8_white.png, car5_white.png repaints (GGBotNet CC0)
import numpy as np, os, sys
sys.path.insert(0,'bc/tools')
from stucco146_assets import save,load,rs,blur,lum,normal,period,xfade,flatten,maps,OUT
from PIL import Image, ImageDraw, ImageFont
# ---- annex brick: course period, pull toward the photo's warm sooty brown
a=flatten(load('m146_abrick.png'),30);L=lum(a);py=period(blur(L,1).mean(1),8,80);px=period(blur(L,1)[int(py*.5)::py].mean(0),30,240)
H,W=a.shape[:2];ny=(H-py)//(2*py)*2;nx=(W-px)//px//2*2;c=a[:ny*py+py,:nx*px+px//2*2];c=xfade(c,px//2*2,py)
mean=c.reshape(-1,3).mean(0);c=(c-mean)*.62+np.array((104,78,60));mo=lum(c)>lum(c).mean()+30;c[mo]=c[mo]*.6+np.array((132,126,116))*.4
maps(np.round(c/3)*3,'abrick146',512,4.0,.92,-.8);print('abrick',py,px,c.shape)
for src,name,t,mix,hs,size,r0,rk in(('m146_flag.png','flag146',(112,114,112),.5,4,512,.8,-1.),('m146_areawall.png','awall146',(178,176,166),.5,3,512,.85,-1.),
  ('m146_lamp.png','lamp146',(24,23,23),.6,2.5,256,.4,-1.4),('m146_bike.png','bike146',(30,58,44),.7,1.5,128,.35,-1.),('m146_rubber.png','rub146',(30,30,31),.7,3,128,.9,-.6)):
    a=load(src)
    if name=='bike146':a=flatten(a,40)
    c=xfade(flatten(a,80) if name!='bike146' else a,a.shape[1]//8,a.shape[0]//8);mean=c.reshape(-1,3).mean(0);c=c+(np.array(t)-mean)*mix
    maps(c,name,size,hs,r0,rk)
# ---- bollard: keep the band layout (unit V = full height), wrap U seamless
a=load('m146_bollard.png');c=xfade(a,a.shape[1]//8,0);h=lum(c);hp=h-blur(h,3)
save(rs(c,128,256),'boll146');save(normal(rs(hp[...,None].repeat(3,2),128,256)[...,0]/255,3),'boll146-n')
r=np.clip(.45-hp/255,0,1)*255;save(rs(np.dstack([r,r,r]),128,256),'boll146-r')
# ---- door 2
a=load('m146_door2.png');H,W=a.shape[:2];d=a[int(H*.01):int(H*.99),int(W*.02):int(W*.98)];h=lum(d)
save(rs(d,160,320),'door2146');save(normal(rs((h-blur(h,5))[...,None].repeat(3,2),160,320)[...,0]/255,5),'door2146-n')
# ---- street name plates (fictional): two rows, 1000x300 each, drawn large then reduced to 256x154
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def plate(main,dist,boro):
    im=Image.new('RGB',(1000,300),(236,234,226));d=ImageDraw.Draw(im);d.rectangle([8,8,991,291],outline=(20,20,22),width=14);d.rectangle([30,30,969,269],outline=(20,20,22),width=4)
    d.text((500,58),boro,font=ImageFont.truetype(R,30),fill=(30,30,30),anchor='mt')
    f=ImageFont.truetype(B,70);w=d.textlength(main+' ',font=f)+d.textlength(dist,font=f);x=500-w/2
    d.text((x,185),main+' ',font=f,fill=(18,18,20),anchor='lm');d.text((x+d.textlength(main+' ',font=f),185),dist,font=f,fill=(176,30,32),anchor='lm')
    a=np.asarray(im,dtype=np.float32);g=np.random.default_rng(len(main)).normal(0,5,a.shape[:2])[...,None];a=a+g
    a[200:]=a[200:]*np.linspace(1,.86,100)[:,None,None];return a   # grime toward the bottom edge
s=np.concatenate([plate('WEXHAM PLACE','WC1','LONDON BOROUGH OF HOLMWOOD'),plate('CARDEW STREET','WC1','LONDON BOROUGH OF HOLMWOOD')],0)
save(rs(s,256,154),'sign146')
# ---- blue number plates + a small dark brass-edged notice: 4 cells of 200x200 -> 4 x 48
cells=[]
for n in('36','37','11','N'):
    im=Image.new('RGB',(200,200),(28,58,128));d=ImageDraw.Draw(im)
    if n=='N':im=Image.new('RGB',(200,200),(34,34,36));d=ImageDraw.Draw(im);d.rectangle([6,6,193,193],outline=(170,140,70),width=8);[d.line([30,60+i*28,170,60+i*28],fill=(150,150,140),width=6) for i in range(4)]
    else:d.rectangle([6,6,193,193],outline=(232,232,228),width=8);d.text((100,104),n,font=ImageFont.truetype(B,110),fill=(240,240,236),anchor='mm')
    cells.append(np.asarray(im,dtype=np.float32))
save(rs(np.concatenate(cells,1),192,48),'plaque146')
# ---- lantern glass: warm sodium-white core, leaded frame lines, top dirt
W,H=128,192;im=Image.new('RGB',(W,H),(214,196,150));d=ImageDraw.Draw(im)
for y in range(H):
    for x in range(W):
        k=1-((x-W/2)/(W/2))**2*.5-abs(y-H*.55)/H*.6;im.putpixel((x,y),tuple(int(v*k) for v in(242,222,170)))
d.rectangle([0,0,W-1,H-1],outline=(20,20,20),width=6);d.line([0,H*.22,W,H*.22],fill=(20,20,20),width=4)
a=np.asarray(im,dtype=np.float32);a[:30]*=.7;save(blur(a,1),'lant146')
# ---- white van / white saloon repaints (body pixels lifted to off-white)
P='bc/dist/assets/l11-v132t/'
for src,ref,out,thr in(('car8','car8_grey','car8_white',12),('car5_grey','car5','car5_white',22)):
    a=Image.open(P+src+'.png').convert('RGB');b=Image.open(P+ref+'.png').convert('RGB');pa,pb=a.load(),b.load();o=a.copy();po=o.load()
    for y in range(a.size[1]):
        for x in range(a.size[0]):
            r,g_,bl=pb[x,y];v=sum(pa[x,y])/3
            body=(r-bl>thr) if out=='car5_white' else (abs(sum(pa[x,y])/3-sum(pb[x,y])/3)>thr)
            if body:k=min(246,int(v*(1.45 if out=='car5_white' else .7)+(80 if out=='car5_white' else 118)));po[x,y]=(k,k,min(255,k+3))
    o.save(P+out+'.png')
print('ok')
