# V145 M3 Maltose Market (麦芽糖市场): far buildings (right red, tall brown, tall dark, light grey, San Remo twin towers)
# + winter trees. Run from the project root (numpy + pillow). Sources art-v145/m145c_*.png, each generated large on its own.
# Shares the helper functions of maltose145_m2_assets.py (executed up to its first brick() call).
# Outputs -> bc/dist/assets/l11-v145/:
#  obrick145 / tbrick145 / dbrick145 (-n,-r): orange-red common brick (right near red), chestnut brick (tall brown right),
#            dark umber Flemish bond (tall dark left); prints the metre size of each tile -> TILE in maltose145-far.js
#  srlime145 (-n,-r): San Remo buff limestone ashlar (crop to whole block periods)   gstone145 (-n,-r): light grey stone
#  bark145 (-n,-r): street-tree bark     twig145: RGBA twig spray card (alpha cut from the chroma-keyed source)
import numpy as np
src=open('bc/tools/maltose145_m2_assets.py').read();exec(src[:src.index("brick('m145b_redbrick.png'")]);exec(src[src.index('def surf('):src.index("surf('m145b_lime.png'")])
def brick2(srcf,name,size,tint,mix,hs=4.0,ds=False,unit=(.205,.077),pyr=(8,80),pxr=(30,240)):
    a=load(srcf)
    if ds:a=destreak(a)
    a=flatten(a,30);L=lum(a);py=period(blur(L,1).mean(1),*pyr);px=period(blur(L,1)[int(py*.5)::py].mean(0),*pxr)
    H,W=a.shape[:2];ny=(H-py)//(2*py)*2;nx=(W-px)//px//2*2;c=a[:ny*py+py,:nx*px+px//2*2];c=xfade(c,px//2*2,py)
    mean=c.reshape(-1,3).mean(0);c=c+(np.array(tint)-mean)*mix;h=lum(c);hp=h-blur(h,3)
    save(np.round(rs(c,size,size)/3)*3,name);save(normal(rs(hp[...,None].repeat(3,2),size,size)[...,0]/255,hs),name+'-n')
    r=np.clip(.92-hp/255*.8,0,1);save(rs(np.dstack([r,r,r])*255,size,size),name+'-r')
    print(name,'TILE m',round(c.shape[1]/px*unit[0],2),round(c.shape[0]/py*unit[1],2),'(px',px,'py',py,')')
brick2('m145c_orangebrick.png','obrick145',512,(150,70,46),.25)
brick2('m145c_tanbrick.png','tbrick145',512,(128,86,58),.25)
brick2('m145c_darkbrick.png','dbrick145',512,(74,58,58),.3,pxr=(70,240),unit=(.3,.077))   # Flemish: header+stretcher period
brick2('m145c_limestone.png','srlime145',512,(196,184,160),.3,hs=2.5,unit=(1.2,.6),pyr=(80,220),pxr=(200,520))   # ashlar block ~1.2 x .6 m
surf('m145c_greystone.png','gstone145',256,(178,180,178),.35,2.5)
surf('m145c_bark.png','bark145',256,(92,86,78),.35,4,r0=.95,rk=-.6)
# twig card: alpha from the keyed source (aspect kept: 512 x 256), colour -> grey-brown (the green key fringe is dropped),
# slight dilation only (MaxFilter 3) so the finest twigs survive the downscale but stay hair-thin
im=Image.open(SRC+'m145c_twigs.png').convert('RGBA');a=np.asarray(im,dtype=np.float32);al=a[...,3]
ys,xs=np.where(al>40);c=a[ys.min():ys.max()+1,xs.min():xs.max()+1].copy();H,W=c.shape[:2]
A=Image.fromarray(c[...,3].astype(np.uint8)).filter(ImageFilter.MaxFilter(3));al2=np.asarray(A,dtype=np.float32)
L=np.minimum(c[...,0],c[...,2]);col=np.dstack([84+L*.1,76+L*.09,68+L*.08])
img=Image.fromarray(np.dstack([np.clip(col,0,255),al2]).astype(np.uint8));th=int(512*H/W)
canvas=Image.new('RGBA',(512,256),(84,76,68,0));canvas.paste(img.resize((512,min(256,th)),Image.LANCZOS),(0,256-min(256,th)))
o=np.asarray(canvas,dtype=np.float32);o[...,3]=np.where(o[...,3]>48,255,0);o[...,:3]=np.where(o[...,3:]>0,o[...,:3],(84,76,68))
Image.fromarray(o.astype(np.uint8)).save(OUT+'twig145.webp',quality=92,method=6);print('twig src',c.shape,'card h',min(256,th))
print('ok')
# storefronts (one texture per shop): deli (right near red), cleaners + cafe (light grey building)
for n,box,o in(('m145c_shop_deli.png',(260,110,1000,660),'shopd145'),('m145c_shop_grey.png',(170,180,664,670),'shopc145'),('m145c_shop_grey.png',(762,180,1258,670),'shopf145')):
    a=load(n)[box[1]:box[3],box[0]:box[2]];save(rs(a,320,288),o)
print('shops ok')
# cornices for RR (orange-brick) and TB / TL (chestnut, dark): two more crops of the sheet-metal source, own tints
for nm,cr,t in(('corn145o',(180,40,880,740),(96,84,74)),('corn145t',(520,60,1220,760),(66,56,50))):
    surf('m145b_cornice.png',nm,256,t,.6,3,crop=cr,r0=None)
# timber water tank staves (procedural, generated at 1024 then downscaled): vertical cedar boards, grain, weathering
S=1024;yy,xx=np.mgrid[0:S,0:S].astype(np.float32);bw=1024/12;bi=(xx//bw).astype(int);g=rng.normal(0,1,(12,))
grain=blur(rng.normal(0,1,(S,S))*30,2)[...,0] if False else blur(np.repeat(rng.normal(0,1,(1,S)),S,0)*0+rng.normal(0,1,(S,S))*30+128,3)-128
base=np.array((112,96,78))[None,None,:]+g[bi][...,None]*10+grain[...,None]*.5
seam=((xx%bw)<5)[...,None];tank=np.where(seam,base*.55,base);wet=np.clip((yy/S)**3,0,1)[...,None];tank=tank*(1-.25*wet)
save(rs(tank,256,256),'tank145');h=lum(tank);save(normal(rs((h-blur(h,3))[...,None].repeat(3,2),256,256)[...,0]/255,3),'tank145-n')
print('m3b ok')
