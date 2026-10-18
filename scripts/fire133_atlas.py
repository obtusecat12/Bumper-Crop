# V133-L10-fire: PS1 Fire (Limphands, CC0) 132x256² frames -> loop-crossfaded 120-frame atlas, cropped x 64..224
from PIL import Image
im=Image.open('Fire Spritesheet.png').convert('RGBA')
F=[im.crop((c*256+64,r*256,c*256+224,r*256+256)) for r in range(11) for c in range(12)]
N=132;K=12;L=N-K
G=[]
for p in range(L):
    if p<K:
        w=p/K  # p=0 -> F[L] (continues F[L-1]), p=K -> F[K]
        G.append(Image.blend(F[p+L],F[p],w))
    else: G.append(F[p])
A=Image.new('RGBA',(12*160,10*256))
for i,g in enumerate(G): A.paste(g,((i%12)*160,(i//12)*256))
A.save('ps1-fire-v133.png',optimize=True)
print(A.size)
