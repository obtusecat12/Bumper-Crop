# V144 B1 pallet pile (notes/spec-1022-capital-landmarks.md B, ref files/ref-1022-street-barricade.webp).
# Authoritative pallet construction + texture atlas. Every pallet in the pile is its own 320x256 tile of one atlas, and every
# board / stringer / block face in it is painted from its own crop of the generated wood sources (art-v144/b144pal_{pine,grey,
# brown,amber}.png: 5 boards per source, cropped at random offsets, flipped, tinted, nailed, stained), so no two boards repeat.
# Writes bc/dist/assets/l11-v144/b1_pal{,-n,-r}.webp (base / normal / roughness) and bc/dist/brick144-pallets-data.js
# (PAL144 = per tile: boxes in pallet-local metres + per-face pixel rects). Run from the project root (system python3 + PIL).
from PIL import Image,ImageFilter,ImageOps,ImageChops,ImageEnhance,ImageDraw,ImageFont
import math,os,random,json
SRC='art-v144/b144pal_';OUT='bc/dist/assets/l11-v144/';DATA='bc/dist/brick144-pallets-data.js';os.makedirs(OUT,exist_ok=True)
PX=100;DW,DH,SH=122,102,10;TW,TH=2*(DW+4)+8,DH+10*SH+6;COLS,ROWS=6,6;AW,AH=TW*COLS,TH*ROWS
WOODS={k:Image.open(SRC+k+'.png').convert('RGB') for k in('pine','grey','brown','amber')}
BANDS=[(int(i*153.6+14),int((i+1)*153.6-14)) for i in range(5)]
ROUGH={'pine':200,'grey':230,'brown':185,'amber':195}
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
atlas=Image.new('RGB',(AW,AH),(40,32,26));hmap=Image.new('L',(AW,AH),60);rmap=Image.new('L',(AW,AH),235)

def board_img(R,wood,w,h,along_x=True,tint=1.0,dirt=0.0):
    """crop one board's worth of grain from a source band, w x h px with grain along the long axis"""
    src=WOODS[wood];b0,b1=BANDS[R.randrange(5)];L=R.randint(900,1380);x0=R.randint(0,src.width-L)
    im=src.crop((x0,b0,x0+L,b1))
    if R.random()<.5:im=ImageOps.mirror(im)
    if R.random()<.5:im=ImageOps.flip(im)
    gw,gh=(w,h) if along_x else (h,w)
    im=im.resize((max(gw,1),max(gh,1)),Image.LANCZOS)
    im=ImageEnhance.Brightness(im).enhance(tint*R.uniform(.88,1.1));im=ImageEnhance.Color(im).enhance(R.uniform(.8,1.15))
    if dirt>0:  # mud/water rising from one end
        g=Image.linear_gradient('L').rotate(90 if R.random()<.5 else -90,expand=True).resize((gw,gh)).point(lambda v:int(v*dirt))
        im=Image.composite(ImageEnhance.Brightness(im).enhance(.55),im,g)
    if not along_x:im=im.rotate(90,expand=True)
    return im
def paint(t,rect,im,rough,bevel=2,hgain=1.0):
    """paste a board face image into tile t at rect (tile px), with its height (grain + bevel) and roughness"""
    ox,oy=(t%COLS)*TW,(t//COLS)*TH;x0,y0,x1,y1=rect;w,h=x1-x0,y1-y0
    if w<=0 or h<=0:return
    im=im.resize((w,h),Image.LANCZOS) if im.size!=(w,h) else im
    atlas.paste(im,(ox+x0,oy+y0))
    g=im.convert('L');hp=ImageChops.subtract(g,g.filter(ImageFilter.GaussianBlur(3)),1,128)
    hp=hp.point(lambda v:max(0,min(255,int(128+(v-128)*hgain))))
    if bevel:  # rounded arrises: height falls off over the last px of the face
        m=Image.new('L',(w,h),0);d=ImageDraw.Draw(m)
        for i in range(bevel):d.rectangle((i,i,w-1-i,h-1-i),outline=int(255*(i+1)/(bevel+1)))
        d.rectangle((bevel,bevel,w-1-bevel,h-1-bevel),fill=255);hp=ImageChops.multiply(hp,m)
    hmap.paste(hp,(ox+x0,oy+y0))
    r=ImageChops.add(ImageOps.invert(g).point(lambda v:int(v*40/255)),Image.new('L',(w,h),rough-25))
    rmap.paste(r,(ox+x0,oy+y0))

def spray(t,text,box,col,ang,R,size=40,blur=1.4):
    """spray-paint text into tile t (tile px box), rotated, soft edged with overspray"""
    ox,oy=(t%COLS)*TW,(t//COLS)*TH;x0,y0,x1,y1=box;W,H=(x1-x0)*4,(y1-y0)*4
    m=Image.new('L',(W,H),0);d=ImageDraw.Draw(m);f=ImageFont.truetype(FONT,size*4)
    lines=text.split('\n');y=H*.08
    for ln in lines:
        bb=d.textbbox((0,0),ln,font=f);d.text(((W-(bb[2]-bb[0]))/2,y),ln,font=f,fill=255,stroke_width=1);y+=(bb[3]-bb[1])*1.25
    m=m.rotate(ang,resample=Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur*4))
    m=m.point(lambda v:min(255,int(v*1.6)))
    px=m.load()
    for _ in range(W*H//300):  # overspray specks
        x,y=R.randrange(W),R.randrange(H)
        if px[x,y]>40:
            for k in range(3):
                xx,yy=x+R.randint(-40,40),y+R.randint(-40,40)
                if 0<=xx<W and 0<=yy<H:px[xx,yy]=max(px[xx,yy],R.randint(60,200))
    m=m.resize((x1-x0,y1-y0),Image.LANCZOS)
    reg=atlas.crop((ox+x0,oy+y0,ox+x1,oy+y1));paintc=Image.new('RGB',reg.size,col)
    # paint soaks the grain: keep a little of the wood's light/dark
    lum=reg.convert('L').point(lambda v:int(150+v*.4));paintc=ImageChops.multiply(paintc,Image.merge('RGB',(lum,lum,lum)))
    atlas.paste(Image.composite(paintc,reg,m),(ox+x0,oy+y0))
    rr=rmap.crop((ox+x0,oy+y0,ox+x1,oy+y1));rmap.paste(Image.composite(Image.new('L',reg.size,150),rr,m),(ox+x0,oy+y0))

def nail(t,x,y,R):
    ox,oy=(t%COLS)*TW,(t//COLS)*TH;d=ImageDraw.Draw(atlas);x+=ox;y+=oy
    if R.random()<.6:d.ellipse((x-2,y-2,x+2,y+2),fill=(92,60,38))  # rust halo
    d.rectangle((x-1,y-1,x,y),fill=(46,44,44));hd=ImageDraw.Draw(hmap);hd.rectangle((x-1,y-1,x,y),fill=150)

class Tile:
    def __init__(s,t,seed):
        s.t=t;s.R=random.Random(seed);s.boxes=[];s.strip=0;s.endc=0
    def strip_rect(s,frac=1.0):
        i=s.strip;s.strip+=1
        if i>=20:raise SystemExit('tile %d: out of strips'%s.t)
        c,r=i//10,i%10;x0=c*(DW+4);y0=DH+3+r*SH;return [x0,y0,x0+max(4,int(DW*frac)),y0+SH]
    def end_rect(s):
        i=s.endc;s.endc+=1;y=(i*5)%(TH-5);return [2*(DW+4),y,2*(DW+4)+7,y+5]
    def tile_uv(s,r):  # tile px rect -> atlas uv [u0,v0,u1,v1] (v up)
        ox,oy=(s.t%COLS)*TW,(s.t//COLS)*TH
        return [round((ox+r[0])/AW,6),round(1-(oy+r[3])/AH,6),round((ox+r[2])/AW,6),round(1-(oy+r[1])/AH,6)]

def deck_rect(region,L,W,bx0,bx1,bz0,bz1):
    """footprint of a board inside the deck image (region 0 = top face of the top deck, 1 = underside of the bottom deck)"""
    ox=0 if region==0 else DW+4
    return [ox+int(round((bx0+L/2)*PX)),int(round((bz0+W/2)*PX)),ox+int(round((bx1+L/2)*PX)),int(round((bz1+W/2)*PX))]

def build(t,spec):
    """spec: kind gma|eur|ply, L, W, wood (or list for a per-board mix), seed, miss (top board indices), stain"""
    T=Tile(t,spec['seed']);R=T.R;L,W=spec['L'],spec['W'];kind=spec['kind']
    woods=spec['wood'] if isinstance(spec['wood'],list) else [spec['wood']];pick=lambda:R.choice(woods)
    dirt=spec.get('dirt',.35);tint=spec.get('tint',1.0)
    def face_strip(wood,rough,frac=1.0,img=None):
        r=T.strip_rect(frac);im=img or board_img(R,wood,r[2]-r[0],r[3]-r[1],True,tint,dirt*R.random());paint(t,r,im,rough);return r,im
    def add_board(b,wood,top=None,bot=None,long_axis='x'):
        """box b=[x0,x1,y0,y1,z0,z1]; faces +z,-z,+x,-x,+y,-y; top/bot = deck-image rects or None for a strip"""
        rough=ROUGH[wood];x0,x1,y0,y1,z0,z1=b
        if top is None:rt,_=face_strip(wood,rough)
        else:
            rt=top;im=board_img(R,wood,rt[2]-rt[0],rt[3]-rt[1],long_axis=='x',tint,dirt*R.random());paint(t,rt,im,rough)
        if bot is None:rb,_=face_strip(wood,rough)
        else:
            rb=bot;im=board_img(R,wood,rb[2]-rb[0],rb[3]-rb[1],long_axis=='x',tint*.9,min(1,dirt*1.6)*R.random());paint(t,rb,im,rough)
        # long side faces = slices along the top face's edges (the arris grain continues), ends = end-grain cells
        def slice_(r,which):
            if r is top and top is not None and long_axis=='z':  # top face grain runs along v: take a 2-px column, rotated later by the auto-orient rule
                return [r[0],r[1],r[0]+2,r[3]] if which==0 else [r[2]-2,r[1],r[2],r[3]]
            return [r[0],r[1],r[2],r[1]+2] if which==0 else [r[0],r[3]-2,r[2],r[3]]
        e1,e2=T.end_rect(),T.end_rect()
        for e in(e1,e2):
            im=board_img(R,wood,e[2]-e[0],e[3]-e[1],True,tint*.62,0).filter(ImageFilter.GaussianBlur(.6));paint(t,e,im,rough,0)
        if long_axis=='x':faces=[slice_(rt,1),slice_(rt,0),e1,e2,rt,rb]
        else:faces=[e1,e2,slice_(rt,1),slice_(rt,0),rt,rb]
        T.boxes.append({'b':[round(v,4) for v in b],'f':[T.tile_uv(f) for f in faces],'p':[0,0,0,0,1 if top is not None else 0,1 if bot is not None else 0]})
        return rt
    def add_side_board(b,wood,long_axis='x',label=None):
        """a board whose big faces are its sides (stringer / cross board on edge): two strips for the sides"""
        rough=ROUGH[wood];r1,_=face_strip(wood,rough);r2,_=face_strip(wood,rough,.98)
        if label:label(r1)
        e1,e2=T.end_rect(),T.end_rect()
        for e in(e1,e2):paint(t,e,board_img(R,wood,7,6,True,tint*.6,0),rough,0)
        top=[r1[0],r1[1],r1[2],r1[1]+3];bot=[r2[0],r2[3]-3,r2[2],r2[3]]
        if long_axis=='x':faces=[r1,r2,e1,e2,top,bot]
        else:faces=[e1,e2,r1,r2,top,bot]
        T.boxes.append({'b':[round(v,4) for v in b],'f':[T.tile_uv(f) for f in faces],'p':[0]*6});return r1,r2
    def notched_stringer(L,y0,y1,z0,z1,wood):
        # 38 x 89 stringer with two forklift notches (lower 38 mm cut away over 0.23 m): five boxes sharing two side strips
        rough=ROUGH[wood];r1,_=face_strip(wood,rough);r2,_=face_strip(wood,rough);e1,e2=T.end_rect(),T.end_rect()
        for e in(e1,e2):paint(t,e,board_img(R,wood,7,6,True,tint*.6,0),rough,0)
        k=L/1.22;cuts=[-L/2,-.38*k,-.15*k,.15*k,.38*k,L/2];nd=.038
        for i in range(5):
            a,b=cuts[i],cuts[i+1];notch=i in(1,3);ya=y0+nd if notch else y0
            fa,fb=(a+L/2)/L,(b+L/2)/L;fy=(y1-ya)/(y1-y0)
            def sub(r,mir=False):
                u0,u1=(1-fb,1-fa) if mir else (fa,fb)
                return [r[0]+int(round(u0*(r[2]-r[0]))),r[1],max(r[0]+int(round(u1*(r[2]-r[0]))),r[0]+int(round(u0*(r[2]-r[0])))+1),r[1]+max(2,int(round(SH*fy)))]
            s1,s2=sub(r1),sub(r2,True)
            ends=[e1 if i==0 else [s1[0],s1[3]-2,s1[0]+2,s1[3]],e2 if i==4 else [s2[0],s2[3]-2,s2[0]+2,s2[3]]]
            T.boxes.append({'b':[round(a,4),round(b,4),round(ya,4),round(y1,4),round(z0,4),round(z1,4)],'f':[T.tile_uv(f) for f in[s1,s2,ends[1],ends[0],[s1[0],s1[1],s1[2],s1[1]+2],[s2[0],s2[3]-2,s2[2],s2[3]]]],'p':[0]*6})
    nails=[]
    if kind in('gma','ply'):
        tb,bt,sh=.016,.016,.089;ys=[0,bt,bt+sh,bt+sh+tb]   # bottom boards, stringers, top deck
        sx=[-L/2+.02,-.019,L/2-.058]   # stringer x0 positions (38 mm)
        nb=5;bw=.09
        # top deck: boards along z (across the stringers), spaced over L
        n=7 if kind=='gma' else 0;miss=set(spec.get('miss',[]))
        xs=[-L/2+bw/2+i*(L-bw)/(n-1) for i in range(n)] if n else []
        if kind=='ply':  # one dark sheet (glued boards) as the top
            rt=deck_rect(0,L,W,-L/2,L/2,-W/2,W/2);sheet=Image.new('RGB',(rt[2]-rt[0],rt[3]-rt[1]));y=0
            while y<sheet.height:
                im=board_img(R,'brown',sheet.width,20,True,tint,0);sheet.paste(im,(0,y));y+=19
            sheet=sheet.filter(ImageFilter.GaussianBlur(.5));paint(t,rt,sheet,ROUGH['brown'],2,.8)
            rb,_=face_strip('brown',ROUGH['brown'])
            e=[T.end_rect() for _ in range(4)]
            for q in e:paint(t,q,board_img(R,'brown',7,6,True,.6,0),180,0)
            T.boxes.append({'b':[-L/2,L/2,ys[2],ys[2]+.012,-W/2,W/2],'f':[T.tile_uv(f) for f in[[rb[0],rb[1],rb[2],rb[1]+2],[rb[0],rb[3]-2,rb[2],rb[3]],e[0],e[1],rt,rb]],'p':[0,0,0,0,1,0]})
            if spec.get('text'):spray(t,spec['text'],rt,(214,56,52),spec.get('tang',-28),R,spec.get('tsize',24))
        for i,x in enumerate(xs):
            if i in miss:continue
            z0,z1=-W/2,W/2
            if i in spec.get('short',{}):z1=W/2-spec['short'][i]
            wood=pick();b=[x-bw/2,x+bw/2,ys[2],ys[3],z0,z1]
            add_board(b,wood,top=deck_rect(0,L,W,b[0],b[1],z0,z1),long_axis='z')
            for xx in sx:nails.append((0,x,xx+.019,z0+.04)),nails.append((0,x,xx+.019,z1-.04))
        # stringers along x with two forklift notches (bottom 38 mm cut away over 0.23 m)
        for k,x0 in enumerate(sx):
            wood=spec.get('stringer',pick());z=-W/2+.02 if k==0 else(-.019 if k==1 else W/2-.058)
            z0,z1=z,z+.038;y0,y1=ys[1],ys[2];notched_stringer(L,y0,y1,z0,z1,wood)
        # bottom deck boards along z under the stringers: three (ends + middle) wide + two narrow
        bxs=[-L/2+.07,-L/4,0,L/4,L/2-.07]
        for i,x in enumerate(bxs):
            if i in spec.get('missb',[]):continue
            w=.14 if i in(0,2,4) else .09;wood=pick();b=[x-w/2,x+w/2,0,bt,-W/2,W/2]
            add_board(b,wood,bot=deck_rect(1,L,W,b[0],b[1],-W/2,W/2),long_axis='z')
    elif kind=='eur':
        bt,bh,ct,tt=.022,.078,.022,.022;ys=[0,bt,bt+bh,bt+bh+ct,bt+bh+ct+tt]
        # bottom boards along x (3), blocks (9), cross boards along z (3), top boards along x (5)
        zs3=[-W/2+.05,0,W/2-.05];ws3=[.1,.145,.1]
        for i,(z,w) in enumerate(zip(zs3,ws3)):
            wood=pick();b=[-L/2,L/2,0,bt,z-w/2,z+w/2];rb=deck_rect(1,L,W,-L/2,L/2,z-w/2,z+w/2)
            add_board(b,wood,bot=rb,long_axis='x')
            if i==1 and spec.get('stamp'):
                # "312" sprayed on the middle bottom board's underside (the face the pile shows)
                spray(t,spec['stamp'],[rb[0]+30,rb[1]-2,rb[0]+92,rb[3]+2],(24,22,22),0,R,14,.5)
        xs3=[-L/2+.0725,0,L/2-.0725];
        chunks=[]
        for r in[T.strip_rect() for _ in range(5)]:
            for j in range(8):chunks.append([r[0]+j*15,r[1],r[0]+j*15+15,r[1]+8])
        ci=0
        for x in xs3:
            for z in zs3:
                wood=spec.get('blockwood',pick());fs=chunks[ci:ci+4];ci+=4
                for q in fs:paint(t,q,board_img(R,wood,15,8,True,tint*.95,dirt*R.random()),ROUGH[wood],1)
                if spec.get('blockstamp') and ci<=4:spray(t,spec['blockstamp'],fs[0],(30,26,24),0,R,5,.3)
                b=[x-.0725,x+.0725,ys[1],ys[2],z-.05,z+.05]
                T.boxes.append({'b':[round(v,4) for v in b],'f':[T.tile_uv(f) for f in[fs[0],fs[1],fs[2],fs[3],[fs[0][0],fs[0][1],fs[0][2],fs[0][1]+2],[fs[1][0],fs[1][3]-2,fs[1][2],fs[1][3]]]],'p':[0]*6})
        for x in xs3:
            w=.145;wood=pick();b=[x-w/2,x+w/2,ys[2],ys[3],-W/2,W/2];add_board(b,wood,long_axis='z')
        n=5;miss=set(spec.get('miss',[]));tw=[.1,.145,.1,.145,.1]
        zs=[-W/2+.05,-W/4,0,W/4,W/2-.05]
        for i,(z,w) in enumerate(zip(zs,tw)):
            if i in miss:continue
            wood=pick();b=[-L/2,L/2,ys[3],ys[4],z-w/2,z+w/2]
            add_board(b,wood,top=deck_rect(0,L,W,-L/2,L/2,z-w/2,z+w/2),long_axis='x')
            for x in xs3:nails.append((0,x,z-.03,0)),nails.append((0,x,z+.03,0))
    for reg,a,b2,c in nails:
        if kind=='eur':px,py=int((a+L/2)*PX),int((b2+W/2)*PX)
        else:px,py=int((a+L/2)*PX),int((c+W/2)*PX)
        if 0<px<DW and 0<py<DH:nail(t,px,py,R)
    return {'kind':kind,'L':L,'W':W,'boxes':T.boxes}

# ---- the pile's pallets, one tile each (names match the placements in brick144-barricade.js)
P=[
 dict(n='p312',kind='eur',L=1.2,W=1.0,wood='pine',seed=312,stamp='312',dirt=.55,tint=.98,blockwood='pine',blockstamp='EPAL'),
 dict(n='under',kind='gma',L=1.22,W=1.02,wood=['brown','brown','grey'],stringer='amber',seed=21,dirt=.5),
 dict(n='grey1',kind='gma',L=1.22,W=1.02,wood='grey',seed=31,dirt=.3,tint=.9),
 dict(n='grey2',kind='gma',L=1.22,W=1.02,wood=['grey','grey','brown'],seed=32,dirt=.4,tint=.82),
 dict(n='goply',kind='ply',L=1.22,W=1.02,wood='brown',seed=41,text='GO\n ACE',tang=-6,tsize=30,dirt=.2,tint=.75),
 dict(n='grey3',kind='gma',L=1.22,W=1.02,wood='grey',seed=51,miss=[2],dirt=.3,tint=1.05),
 dict(n='pale',kind='gma',L=1.22,W=1.02,wood='pine',seed=61,dirt=.25,tint=1.04),
 dict(n='topgy',kind='gma',L=1.22,W=1.02,wood=['grey','pine','grey'],seed=71,dirt=.3,tint=.95),
 dict(n='sup1',kind='gma',L=1.22,W=1.02,wood=['pine','amber'],seed=81),
 dict(n='sup2',kind='gma',L=1.22,W=1.02,wood=['grey','pine'],seed=82),
 dict(n='sup3',kind='eur',L=1.2,W=1.0,wood=['amber','pine'],seed=83),
 dict(n='sup4',kind='gma',L=1.22,W=1.02,wood=['brown','grey'],seed=84),
 dict(n='amber',kind='gma',L=1.22,W=1.02,wood='amber',seed=91,dirt=.15,tint=1.02,stringer='amber'),
 dict(n='lean1',kind='gma',L=1.22,W=1.02,wood=['grey','brown'],seed=101,dirt=.3,tint=.8),
 dict(n='lean2',kind='gma',L=1.22,W=1.02,wood=['grey','grey','amber'],seed=102,dirt=.3,tint=.85,miss=[4]),
 dict(n='redbr',kind='gma',L=1.22,W=1.02,wood=['brown','amber'],seed=111,dirt=.2,tint=.8),
 dict(n='backL',kind='gma',L=1.22,W=1.02,wood=['pine','grey'],seed=121,dirt=.35,tint=.95),
 dict(n='flatL',kind='eur',L=1.2,W=1.0,wood=['amber','brown'],seed=131,dirt=.5),
 dict(n='left',kind='eur',L=1.2,W=1.0,wood=['grey','pine'],seed=141,dirt=.5,tint=.9),
 dict(n='farL',kind='gma',L=1.22,W=1.02,wood='brown',seed=151,dirt=.3,tint=.85),
 dict(n='back1',kind='gma',L=1.22,W=1.02,wood=['grey','brown'],seed=161,tint=.85),
 dict(n='back2',kind='gma',L=1.22,W=1.02,wood=['pine','grey'],seed=162,tint=.92,miss=[3]),
 dict(n='back3',kind='eur',L=1.2,W=1.0,wood=['brown','grey'],seed=163,tint=.85),
 dict(n='back4',kind='gma',L=1.22,W=1.02,wood=['amber','grey'],seed=164,tint=.9),
 dict(n='sup5',kind='gma',L=1.22,W=1.02,wood=['grey','amber'],seed=85),
 dict(n='sup6',kind='eur',L=1.2,W=1.0,wood=['pine','grey'],seed=86,tint=.95),
 dict(n='topgy2',kind='gma',L=1.22,W=1.02,wood=['pine','pine','grey'],seed=72,dirt=.2,tint=1.0,miss=[5]),
 dict(n='back5',kind='gma',L=1.22,W=1.02,wood=['brown','grey'],seed=165,tint=.8),
 dict(n='back6',kind='gma',L=1.22,W=1.02,wood=['grey'],seed=166,tint=.78),
 dict(n='base1',kind='gma',L=1.22,W=1.02,wood=['amber','brown'],seed=171),
 dict(n='base2',kind='eur',L=1.2,W=1.0,wood=['grey','brown'],seed=172),
 dict(n='base3',kind='gma',L=1.22,W=1.02,wood=['pine','brown'],seed=173),
 dict(n='hiA',kind='gma',L=1.22,W=1.02,wood=['grey','pine'],seed=181,tint=.9,miss=[1]),
 dict(n='hiB',kind='eur',L=1.2,W=1.0,wood=['brown','grey'],seed=182,tint=.85),
 dict(n='mid1',kind='gma',L=1.22,W=1.02,wood=['amber','pine'],seed=191,dirt=.45),
 dict(n='mid2',kind='gma',L=1.22,W=1.02,wood=['grey','brown'],seed=192,tint=.8),
]
out={}
for t,spec in enumerate(P):out[spec['n']]={'t':t,**build(t,spec)}
# PS1-ish low-fi pass on the colour: slight blur + 6-bit quantize
atlas=atlas.filter(ImageFilter.GaussianBlur(.35)).point(lambda v:(v>>2)<<2)
atlas.save(OUT+'b1_pal.webp',quality=88,method=6)
def normal(h,s=2.2):
    W,H=h.size;p=h.load();o=Image.new('RGB',(W,H));q=o.load()
    for y in range(H):
        for x in range(W):
            dx=(p[min(W-1,x+1),y]-p[max(0,x-1),y])/255*s;dy=(p[x,min(H-1,y+1)]-p[x,max(0,y-1)])/255*s;l=math.sqrt(dx*dx+dy*dy+1)
            q[x,y]=(int((-dx/l*.5+.5)*255),int((dy/l*.5+.5)*255),int((1/l*.5+.5)*255))
    return o
normal(hmap).save(OUT+'b1_pal-n.webp',quality=92,method=6)
Image.merge('RGB',(rmap,rmap,rmap)).save(OUT+'b1_pal-r.webp',quality=86,method=6)
atlas.resize((AW//2,AH//2)).save('/workspace/work/v144/b1/atlas_prev.png')
with open(DATA,'w') as f:
    f.write('// V144 B1 pallet construction, generated by bc/tools/brick144b1_assets.py (do not edit). Per pallet: tile, kind, L x W and\n// boxes {b:[x0,x1,y0,y1,z0,z1] metres, f: six atlas uv rects (+z,-z,+x,-x,+y,-y), p: 1 = planar footprint face}.\n')
    f.write('export const PAL144_ATLAS=[%d,%d];\n'%(AW,AH));f.write('export const PAL144='+json.dumps(out,separators=(',',':'))+';\n')
print('tiles',len(P),'boxes',sum(len(v['boxes']) for v in out.values()))
