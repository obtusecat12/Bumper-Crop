# V141 F3: blueprints of the 8 SoHo corner side elevations (art-v135side, cropped like soho135_side_assets.py ->
# art-v141/s<lot>_side.png). Side wall = lot depth 17 m wide x lot H. Image LEFT = street edge for cs=+1 lots; for cs=-1
# lots (street on the viewer's right) the street-end part is rolled to the image's right end ("roll" px) so the wrap-around
# bay still meets the corner without mirroring any lettering. Writes art-v141/s<k>_bp.png + bc/scripts/facade141/s<k>.json.
#   python3 bc/scripts/facade141/sides141.py   (project root; numpy+pillow)
import json
from PIL import Image
D=17.0
LOTS={'a3':26.682,'a4':26.682,'b0':27.904,'b3':43.015,'c4':27.266,'c2':32.188,'d1':26.355,'d3':26.355}
def base(k,PW,PH,iron):
 return {"photo":f"art-v141/s{k}_bp.png","px":[PW,PH],"w":D,"H":LOTS[k],"iron":iron,"cols":[],"shape":"rect","hood":"none","sill":True,"mull":True,
  "floors":[],"hoodPx":{"gap":4,"h":18,"ext":12,"out":.14,"cap":6,"brk":0,"brkW":10,"pedH":30},"sillPx":{"h":12,"ext":10,"out":.1},
  "colonettes":[],"belts":[],"piers":[],"pierTop":100,"pierOut":.12,"pierPanels":[],"modil":{"x0":1,"x1":0,"step":40,"hw":7,"y0":60,"y1":90},
  "consoles":[],"consoleHW":12,"groundCols":[],"groundType":"flat","groundR":.2,"shop":[],"shopY":[PH-100,PH-10],"shopD":.3,"doors":[],"doorD":.5,
  "shopCornice":[PH-6,PH-4,.01],"plinthY":PH-4,"glassD":.22,"winD":.28,"boxes":[]}
def cornice(s,crown,modil,frieze,cons,cy,mod=None):
 s.update(crown=[0,crown,.7],crownSteps=[[int(crown*.7),crown,.55],[0,int(crown*.7),.7]],modillion=[crown,modil,.42],frieze=[modil,frieze,.1],
  consoles=cons,consoleY=cy,loCrownY=crown)
 if mod:s['modil']=mod
S={}
# a3 red brick + cast-iron wrap bay 0..320 (rolled to the right end, cs=-1)
s=base('a3',832,1225,[.42,.21,.16]);s['roll']=320;cornice(s,50,95,145,[37,184,331,496,650,803],[50,145])
s.update(hood='cornice',mull=False,cols=[[76,145],[229,290]],floors=[{"y":[208,208,349]},{"y":[441,441,588]},{"y":[680,680,833]}],
 shop=[[67,153],[190,284]],shopY=[943,1158],shopD=.35,doors=[[696,778,953,1207]],doorD=.8,groundCols=[18,172,306],groundY=[930,1215],plinthY=1215,
 boxes=[[0,320,845,930,0,.3]]+[[x-12,x+12,y-12,y+12,0,.06] for x in(380,570,784) for y in(404,895)])
S['a3']=s
# a4 green cast-iron wrap bay 0..213 + brick side with small segmental windows
s=base('a4',800,1216,[.45,.26,.2]);cornice(s,8,12,16,[],[8,16]);s['crown']=[0,8,.15];s['crownSteps']=[[0,8,.15]];s['modillion']=[8,12,.05];s['frieze']=[12,16,.02];s['loFriezeOut']=.05
s['floors']=[{"y":[103,152,255],"cols":[[85,161]],"shape":"arch","hood":"arch","sill":False},{"y":[341,389,517],"cols":[[85,161]],"shape":"arch","hood":"arch","sill":False},
 {"y":[602,651,803],"cols":[[85,161]],"shape":"arch","hood":"arch","sill":False},
 {"y":[110,110,195],"cols":[[462,523]]},{"y":[341,341,432],"cols":[[462,523]]},{"y":[614,614,700],"cols":[[462,523]]},{"y":[918,918,1004],"cols":[[462,523]]}]
s.update(piers=[[0,22],[190,213]],pierTop=45,pierBot=852,shop=[[55,176]],shopY=[930,1143],doors=[[614,748,943,1198]],doorD=.4,plinthY=1200,
 boxes=[[0,213,0,45,0,.45],[0,213,852,925,0,.3],[0,213,255,300,0,.16],[0,213,517,560,0,.16],[0,213,803,852,0,.16]])
S['a4']=s
# b0 cream cast iron, 5 arched bays x 4 floors + storefront (uniform; cs=-1 no roll)
s=base('b0',732,1350,[.85,.83,.78]);cornice(s,45,100,130,[18,150,285,445,580,712],[45,130],{"x0":30,"x1":720,"step":40,"hw":7,"y0":55,"y1":95})
s.update(shape='arch',hood='arch',sill=False,cols=[[65,126],[189,257],[324,412],[479,547],[614,675]],
 floors=[[189,221,281],[378,410,497],[587,619,722],[803,835,945]],belts=[[290,324,.2],[500,533,.2],[722,756,.2],[945,985,.25]],
 piers=[[0,40],[142,182],[270,308],[425,466],[560,600],[688,732]],pierTop=130,pierBot=992,pierOut=.15,
 shopCornice=[992,1046,.3],shop=[[54,148],[176,277],[466,560],[594,682]],shopY=[1053,1276],doors=[[310,418,1053,1280]],doorD=.9,
 groundCols=[24,162,290,446,580,709],groundY=[1046,1280],plinthY=1290)
S['b0']=s
# b3 limestone wrap bay 0..152 (8 floors, pedimented windows) + tan brick side with ghost sign
s=base('b3',593,1596,[.62,.52,.4]);cornice(s,35,70,96,[24,120,231,343,455,567],[35,96])
bay=[[136,215],[279,359],[431,519],[583,670],[742,846],[926,1037],[1149,1277],[1372,1524]]
s['floors']=[{"y":[a,a,b],"cols":[[56,96]],"hood":"cornice","ped":[0] if i in(1,3,5) else []} for i,(a,b) in enumerate(bay)]+\
 [{"y":[a,a,b],"cols":[[275,316]]} for a,b in [[428,511],[587,667],[753,843],[934,1025],[1205,1301]]]+[{"y":[1277,1277,1372],"cols":[[431,479]]}]
s.update(piers=[[0,16],[136,152]],pierTop=96,pierBot=1590,pierOut=.1,doors=[[156,204,1465,1588],[275,391,1444,1572]],doorD=.45,plinthY=1590)
S['b3']=s
# c4 yellow brick, stone lintels + sills, blind middle windows, dark painted base with storefront
s=base('c4',752,1210,[.72,.58,.38]);cornice(s,55,100,145,[15,248,484,720],[40,145])
s.update(hood='cornice',hoodPx={"gap":3,"h":22,"ext":12,"out":.14,"cap":6,"brk":0,"brkW":10,"pedH":30},cols=[[75,155],[581,663]],
 floors=[{"y":[188,188,317]},{"y":[400,400,551]},{"y":[663,663,847]}],shop=[[48,163]],shopY=[968,1150],doors=[[312,405,968,1192]],doorD=.6,
 groundCols=[18,181],groundY=[920,1195],plinthY=1195,
 boxes=[[0,206,890,920,0,.3],[300,422,155,184,0,.14],[310,412,317,332,0,.1],[300,422,363,393,0,.14],[310,412,551,566,0,.1],[300,422,630,660,0,.14],[310,412,847,862,0,.1]])
S['c4']=s
# c2 brown cast-iron wrap bay 0..398 (rolled right, cs=-1) + orange brick side, Bodega Luz sign, ATM
s=base('c2',738,1395,[.62,.33,.22]);s['roll']=398;cornice(s,56,84,125,[14,195,384,544,698],[40,125])
s['floors']=[{"y":[195,223,304],"cols":[[63,105],[119,160],[237,279],[293,335]],"shape":"arch","hood":"arch","sill":False},
 {"y":[398,446,527],"cols":[[63,160],[237,335]],"shape":"arch","hood":"arch","sill":False},
 {"y":[607,649,750],"cols":[[63,160],[237,335]],"shape":"arch","hood":"arch","sill":False},
 {"y":[830,872,993],"cols":[[63,160],[237,335]],"shape":"arch","hood":"arch","sill":False}]+\
 [{"y":[a,a,b],"cols":[[444,500],[604,664]],"mull":False} for a,b in [[174,304],[391,530],[614,753],[851,993]]]
s.update(piers=[[0,42],[181,209],[370,398]],pierTop=125,pierBot=1395,pierOut=.14,shop=[[49,174],[223,356]],shopY=[1075,1388],shopD=.25,
 doors=[[412,509,1207,1339],[593,663,1211,1374]],doorD=.35,plinthY=1390,sign=[402,712,1032,1071,.1],
 boxes=[[0,398,304,349,0,.2],[0,398,530,572,0,.2],[0,398,753,795,0,.2],[0,398,993,1060,0,.28]])
S['c2']=s
# d1 brown cast-iron wrap bay 0..372 (arched, 3 floors + storefront) + purple-brown brick with shuttered windows
s=base('d1',800,1283,[.28,.22,.24]);cornice(s,51,96,128,[51,212,404,590,783],[40,128])
s['floors']=[{"y":[192,231,340],"cols":[[103,177],[263,340]],"shape":"arch","hood":"arch","sill":False},{"y":[430,468,597],"cols":[[103,177],[263,340]],"shape":"arch","hood":"arch","sill":False},
 {"y":[677,718,857],"cols":[[103,177],[263,340]],"shape":"arch","hood":"arch","sill":False}]+[{"y":[a,a,b],"cols":[[674,744]]} for a,b in [[186,314],[423,571],[693,853]]]
s.update(piers=[[32,64],[199,231],[353,372]],pierTop=128,pierBot=900,pierOut=.14,shop=[[71,192],[237,353]],shopY=[975,1212],doors=[[667,751,975,1270]],doorD=.5,
 groundCols=[38,212,378],groundY=[962,1215],plinthY=1270,
 boxes=[[0,372,340,378,0,.2],[0,372,597,635,0,.2],[0,423,898,962,0,.3]]+[[x0,x1,a,b,0,.05] for x0,x1 in[(641,674),(751,785)] for a,b in[(186,314),(423,571),(693,853)]])
S['d1']=s
# d3 pink stucco café (cs=-1, no roll: the shopfront/sign part cannot be cut cleanly), pediment windows, shutters
s=base('d3',832,1250,[.82,.62,.58]);cornice(s,50,100,156,[25,188,344,500,656,812],[50,156],{"x0":20,"x1":820,"step":42,"hw":7,"y0":58,"y1":95})
L,R1,R2=[78,146],[540,609],[703,771]
s.update(hood='cornice',cols=[L,R1,R2],floors=[{"y":[200,200,338]},{"y":[450,450,600],"ped":[0]},{"y":[719,719,875],"ped":[0]}],
 shop=[[25,115],[200,325]],shopY=[1030,1225],doors=[[125,190,1030,1225],[536,609,1000,1219]],doorD=.45,plinthY=1240,
 boxes=[[10,340,995,1012,0,.2],[690,771,1069,1169,-.0,.04],[71,149,310,335,0,.2],[71,149,581,606,0,.2]]+[[x0,x1,a,b,0,.05] for x0,x1 in[(503,536),(613,646),(665,699),(775,811)] for a,b in[(200,338),(450,600),(719,881)]])
S['d3']=s
# bright sky/neighbour slivers left on the crop edges (px l, r): trimmed by stretching the rest back to full width
TRIM={'a3':(24,0),'a4':(18,1),'b0':(4,0),'c2':(0,24),'d1':(23,0)}
def remap(s,f):
 I=lambda a,b:list(f(a,b))
 for fl in s['floors']:
  if isinstance(fl,dict) and 'cols' in fl:fl['cols']=[I(*c) for c in fl['cols']]
 for k in('cols','piers','shop'):s[k]=[I(*c) for c in s[k]]
 s['doors']=[I(d[0],d[1])+d[2:] for d in s['doors']];s['boxes']=[I(b[0],b[1])+b[2:] for b in s['boxes']]
 if s.get('sign'):s['sign']=I(*s['sign'][:2])+s['sign'][2:]
 for k in('groundCols','consoles','colonettes'):s[k]=[f(c,c)[0] for c in s[k]]
for k,s in S.items():
 im=Image.open(f'art-v141/s{k}_side.png').convert('RGB');PW,PH=s['px'];assert im.size==(PW,PH),(k,im.size)
 r=s.pop('roll',0);tl,tr=TRIM.get(k,(0,0))
 if tl or tr:
  sc=PW/(PW-tl-tr);im=im.crop((tl,0,PW-tr,PH)).resize((PW,PH),Image.LANCZOS)
  T_=lambda x:max(0,min(PW,round((x-tl)*sc)))
  remap(s,lambda a,b:(T_(a),T_(b)));r=T_(r) if r else 0
  if s['modil']['x0']<s['modil']['x1']:s['modil']['x0'],s['modil']['x1']=T_(s['modil']['x0']),T_(s['modil']['x1'])
 if r:
  o=Image.new('RGB',(PW,PH));o.paste(im.crop((r,0,PW,PH)),(0,0));o.paste(im.crop((0,0,r,PH)),(PW-r,0));im=o
  remap(s,lambda a,b:(a-r,b-r) if a>=r else (a+PW-r,b+PW-r))
  s['_']=f'rolled {r}px: street-end part moved to the right end'
 im.save(f'art-v141/s{k}_bp.png');json.dump(s,open(f'bc/scripts/facade141/s{k}.json','w'))
 print(k,PW,PH,'roll',r,'trim',tl,tr)
