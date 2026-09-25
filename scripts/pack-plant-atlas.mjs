// Mechanical asset compilation: isolate four generated connected silhouettes,
// retain their RGBA pixels, and place them in exact UV cells with gutters.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const [source,kind,destination]=process.argv.slice(2),image=await loadImage(source),w=image.width,h=image.height;
const src=createCanvas(w,h),ctx=src.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,w,h),a=pixels.data,labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];let id=0;
for(let p=0;p<labels.length;p++)if(!labels[p]&&a[p*4+3]>32){let read=0,count=0,minX=w,maxX=0,minY=h,maxY=0;labels[p]=++id;queue[count++]=p;
 while(read<count){const q=queue[read++],x=q%w,y=Math.floor(q/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const n=yy*w+xx;if(!labels[n]&&a[n*4+3]>32){labels[n]=id;queue[count++]=n;}}
 }components.push({id,count,minX,maxX,minY,maxY});
}
const plants=components.sort((a,b)=>b.count-a.count).slice(0,4);
plants.sort(kind==='verge'?(a,b)=>Math.floor(a.minY/(h*.65))-Math.floor(b.minY/(h*.65))||a.minX-b.minX:(a,b)=>a.minX-b.minX);
const output=createCanvas(1024,1024),o=output.getContext('2d'),columns=kind==='verge'?2:4,rows=kind==='verge'?2:1,cw=1024/columns,ch=1024/rows;
for(let k=0;k<4;k++){const p=plants[k],left=Math.max(0,p.minX-4),top=Math.max(0,p.minY-4),pw=Math.min(w-left,p.maxX-p.minX+9),ph=Math.min(h-top,p.maxY-p.minY+9),piece=createCanvas(pw,ph),pc=piece.getContext('2d'),pd=pc.createImageData(pw,ph);
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const i=(top+y)*w+left+x;let belongs=labels[i]===p.id;
  if(!belongs&&a[i*4+3]<100)for(let dy=-2;dy<=2&&!belongs;dy++)for(let dx=-2;dx<=2;dx++){const n=i+dy*w+dx;if(n>=0&&n<labels.length&&labels[n]===p.id){belongs=true;break;}}
  if(belongs)pd.data.set(a.subarray(i*4,i*4+4),(y*pw+x)*4);
 }
 pc.putImageData(pd,0,0);const dw=cw-24,dh=kind==='verge'?ch-24:ph*(ch-24)/h;
 o.drawImage(piece,0,0,pw,ph,(k%columns)*cw+12,Math.floor(k/columns)*ch+ch-12-dh,dw,dh);
}
fs.writeFileSync(destination,output.toBuffer('image/png'));console.log({destination,forms:plants.map(p=>({pixels:p.count,bounds:[p.minX,p.minY,p.maxX,p.maxY]}))});
