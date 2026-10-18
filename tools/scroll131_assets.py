#!/usr/bin/env python3
"""V131-scrollbars: pixel-drawn scrollbar slices, one PNG per part/state (no atlases).
w7  = 2009 Win7/Vista Aero light-grey (Goggle Maps L11/L27 + venue pages), 17px
aq  = Mac OS X Leopard Aqua (L1 / L10 skeuomorphic), 15px
Horizontal parts are transposes of the vertical ones.  Run: python3 bc/tools/scroll131_assets.py"""
from PIL import Image
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'dist', 'assets', 'ui-v131sb')

def hx(c, a=255):
    c = c.lstrip('#'); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)
def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(4))
def save(img, theme, name):
    d = os.path.join(OUT, theme); os.makedirs(d, exist_ok=True)
    img.save(os.path.join(d, name + '-v.png'))
    img.transpose(Image.TRANSPOSE).save(os.path.join(d, name + '-h.png'))

# ---------------- w7 ----------------
W = 17
W7 = {
 'n': dict(edge='#8f8f8f', hi='#fdfdfd', a='#f4f4f4', b='#e9e9e9', c='#dcdcdc', d='#d0d0d0', grip='#6e6e6e', glow='#fbfbfb'),
 'h': dict(edge='#3c7fb1', hi='#f3fbfe', a='#e3f4fc', b='#d6eef9', c='#b7e1f6', d='#a3d7f3', grip='#2b5f85', glow='#effaff'),
 'a': dict(edge='#18598a', hi='#d9effa', a='#cde8f7', b='#b0dcf3', c='#7fc6ec', d='#64b8e8', grip='#173d5b', glow='#dff3fc'),
}
def w7_col(p, x):  # horizontal profile of the bevelled fill, x in 2..14
    a, b, c, d = hx(p['a']), hx(p['b']), hx(p['c']), hx(p['d'])
    t = (x - 2) / 12
    return lerp(a, b, t / .5) if t < .5 else lerp(c, d, (t - .5) / .5)

def w7_frame(p, h, cap_top=True, cap_bot=True, inset=1):
    """Fill rows 0..h-1 of a 17-wide bevelled slab (thumb or button)."""
    im = Image.new('RGBA', (W, h), (0, 0, 0, 0)); px = im.load()
    e, hi = hx(p['edge']), hx(p['hi'])
    L, R = inset, W - 1 - inset
    for y in range(h):
        top = cap_top and y == 0; bot = cap_bot and y == h - 1
        for x in range(L, R + 1):
            if top or bot:
                if x in (L, R): px[x, y] = hx(p['edge'], 90)  # rounded corner
                else: px[x, y] = e
            elif x in (L, R): px[x, y] = e
            elif x == L + 1 or (cap_top and y == 1): px[x, y] = hi
            elif x == R - 1 or (cap_bot and y == h - 2): px[x, y] = lerp(w7_col(p, x), hx(p['edge']), .18)
            else: px[x, y] = w7_col(p, x)
    return im

def w7():
    # track: light grey with fine vertical stripes + dot dither, darker 1px rails
    t = Image.new('RGBA', (W, 2)); px = t.load()
    for x in range(W):
        for y in range(2):
            base = hx('#eeeeee') if 2 <= x <= 14 else hx('#e2e2e2')
            if x in (0, 16): base = hx('#d9d9d9')
            if 2 <= x <= 14 and x % 2 == 0: base = lerp(base, hx('#dadada'), .55)
            if 2 <= x <= 14 and (x + y) % 2 == 1 and x % 4 == 1: base = hx('#f8f8f8')
            px[x, y] = base
    save(t, 'w7', 'track')
    tp = Image.new('RGBA', (W, 2)); px = tp.load()  # pressed track (page-scroll)
    for x in range(W):
        for y in range(2): px[x, y] = lerp(t.getpixel((x, y)), hx('#9a9a9a'), .35)
    save(tp, 'w7', 'track-a')
    for s, p in W7.items():
        save(w7_frame(p, 3, True, False), 'w7', 'thumb-top-' + s)
        save(w7_frame(p, 1, False, False), 'w7', 'thumb-body-' + s)
        save(w7_frame(p, 3, False, True), 'w7', 'thumb-bot-' + s)
        g = Image.new('RGBA', (8, 7), (0, 0, 0, 0)); gp = g.load()
        for i in range(3):
            for x in range(8):
                gp[x, i * 2] = hx(p['grip'], 255 if 0 < x < 7 else 150)
                gp[x, i * 2 + 1] = hx(p['glow'], 255 if 0 < x < 7 else 150)
        save(g, 'w7', 'grip-' + s)
        for d in ('up', 'down'):
            b = w7_frame(p, W, True, True, inset=0); bp = b.load()
            off = 1 if s == 'a' else 0
            arrow = hx('#000000') if s != 'n' else hx('#262626')
            for r in range(4):  # 7-wide black triangle
                y = (6 + r if d == 'up' else 10 - r) + off
                for x in range(8 - r + off, 9 + r + off): bp[x, y] = arrow
            save(b, 'w7', 'btn-%s-%s' % (d, s))
    c = Image.new('RGBA', (W, W), hx('#ececec')); save(c, 'w7', 'corner')

# ---------------- aqua (Leopard) ----------------
A = 15
AQ = {
 'n': ('#3f7fd6', '#a9cdf5', '#5f9ce8', '#2c6fd0', '#7fb6f2'),
 'h': ('#3574cc', '#bcd9f8', '#6ea8ee', '#2f78dd', '#8cc1f6'),
 'a': ('#24569c', '#8ab7ea', '#3f84dc', '#1d5cb8', '#5d9ce6'),
}
def aq_col(pal, x, w):
    edge, gloss, mid, deep, rim = [hx(c) for c in pal]
    t = x / (w - 1)
    if t < .5: return lerp(gloss, mid, t / .5)       # glossy left half
    return lerp(deep, rim, (t - .5) / .5)            # deep right half w/ bounce light

def aq():
    t = Image.new('RGBA', (A, 1)); px = t.load()
    for x in range(A):  # inset groove: shadow on left, light on right
        g = [0xb5, 0xc9, 0xd8, 0xe3, 0xeb, 0xf0, 0xf3, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfb, 0xfd, 0xe8][x]
        px[x, 0] = (g, g, g, 255)
    save(t, 'aq', 'track')
    for s, pal in AQ.items():
        edge = hx(pal[0]); r = 6
        for part, h in (('top', r + 1), ('body', 1), ('bot', r + 1)):
            im = Image.new('RGBA', (A, h), (0, 0, 0, 0)); p = im.load()
            for y in range(h):
                for x in range(1, A - 1):
                    if part == 'body': inside, dist = True, 1e9
                    else:
                        cy = r if part == 'top' else 0
                        dy = cy - y if part == 'top' else y - cy
                        dx = x - 7
                        if dy <= 0: inside, dist = abs(dx) <= 6, 6 - abs(dx)
                        else:
                            d = (dx * dx + dy * dy) ** .5; inside, dist = d <= 6.4, 6.4 - d
                    if not inside: continue
                    col = aq_col(pal, x - 1, A - 2)
                    if part == 'top' and y in (1, 2) and 3 <= x <= 7: col = lerp(col, hx('#ffffff'), .55)
                    if dist < 1 or x in (1, A - 2): col = edge if dist >= .4 or part == 'body' else hx(pal[0], 140)
                    p[x, y] = col
            save(im, 'aq', 'thumb-%s-%s' % (part, s))
        for d in ('up', 'down'):
            b = Image.new('RGBA', (A, A)); bp = b.load()
            for y in range(A):
                for x in range(A):
                    g = 0xf6 - (y * 3 if s == 'n' else y * 5) - (12 if s == 'a' else 0)
                    bp[x, y] = (g, g, g, 255)
                    if x == 0 or (d == 'up' and y == A - 1) or (d == 'down' and y == 0): bp[x, y] = hx('#a8a8a8')
            arrow = hx('#5a5a5a' if s == 'n' else '#262626')
            for rr in range(4):
                y = (5 + rr if d == 'up' else 9 - rr) + (1 if s == 'a' else 0)
                for x in range(7 - rr, 8 + rr): bp[x, y] = arrow
            save(b, 'aq', 'btn-%s-%s' % (d, s))
    save(Image.new('RGBA', (A, A), hx('#f2f2f2')), 'aq', 'corner')

if __name__ == '__main__':
    w7(); aq(); print('ok', OUT)
