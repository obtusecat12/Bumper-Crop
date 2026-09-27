// Metre-scale elevation ownership. Shared by openings and attached fixtures.
export class FacadeLayout{
 constructor(width,height){this.width=width;this.height=height;this.regions=[];}
 reserve(kind,x,y,w,h,pad=.07){const q={kind,x,y,w,h,pad};this.regions.push(q);return q;}
 conflicts(x,y,w,h,pad=.07){return this.regions.filter(q=>Math.abs(q.x-x)<(q.w+w)/2+q.pad+pad&&Math.abs(q.y-y)<(q.h+h)/2+q.pad+pad);}
 fits(x,y,w,h,pad=.07){return x-w/2>=-this.width/2+.10&&x+w/2<=this.width/2-.10&&y-h/2>=.08&&y+h/2<=this.height&&!this.conflicts(x,y,w,h,pad).length;}
 claim(kind,x,y,w,h,pad=.07){return this.fits(x,y,w,h,pad)?this.reserve(kind,x,y,w,h,pad):null;}
 find(kind,positions,w,h,pad=.07){for(const[x,y]of positions){const q=this.claim(kind,x,y,w,h,pad);if(q)return q;}return null;}
}
