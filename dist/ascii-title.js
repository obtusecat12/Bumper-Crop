// V99: CLI-banner title. Each level code is the FIGlet "ANSI Shadow" banner
// (█ faces, double-line ╔═╗ shadow), drawn cell by cell on a small canvas so it
// stays crisp in any font, then slanted row by row like a terminal splash.
export const ASCII_TITLES={"LEVEL 10": ["██╗     ███████╗██╗   ██╗███████╗██╗          ██╗ ██████╗", "██║     ██╔════╝██║   ██║██╔════╝██║         ███║██╔═████╗", "██║     █████╗  ██║   ██║█████╗  ██║         ╚██║██║██╔██║", "██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║          ██║████╔╝██║", "███████╗███████╗ ╚████╔╝ ███████╗███████╗     ██║╚██████╔╝", "╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝     ╚═╝ ╚═════╝"], "LEVEL 11": ["██╗     ███████╗██╗   ██╗███████╗██╗          ██╗ ██╗", "██║     ██╔════╝██║   ██║██╔════╝██║         ███║███║", "██║     █████╗  ██║   ██║█████╗  ██║         ╚██║╚██║", "██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║          ██║ ██║", "███████╗███████╗ ╚████╔╝ ███████╗███████╗     ██║ ██║", "╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝     ╚═╝ ╚═╝"], "LEVEL 27": ["██╗     ███████╗██╗   ██╗███████╗██╗         ██████╗ ███████╗", "██║     ██╔════╝██║   ██║██╔════╝██║         ╚════██╗╚════██║", "██║     █████╗  ██║   ██║█████╗  ██║          █████╔╝    ██╔╝", "██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║         ██╔═══╝    ██╔╝", "███████╗███████╗ ╚████╔╝ ███████╗███████╗    ███████╗   ██║", "╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝    ╚══════╝   ╚═╝"], "LEVEL 0": ["██╗     ███████╗██╗   ██╗███████╗██╗          ██████╗", "██║     ██╔════╝██║   ██║██╔════╝██║         ██╔═████╗", "██║     █████╗  ██║   ██║█████╗  ██║         ██║██╔██║", "██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║         ████╔╝██║", "███████╗███████╗ ╚████╔╝ ███████╗███████╗    ╚██████╔╝", "╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚══════╝     ╚═════╝"]};
const CW=5,CH=10,SLANT=2,FACE=['#f6dc7a','#f0c855','#e6b03c','#d8902e','#c86e28','#b04f22'],LINE='#b08a3e';
const X1=1,X2=3,Y1=3,Y2=6;
export function drawAsciiTitle(canvas,code){
 const rows=ASCII_TITLES[code];if(!rows){canvas.hidden=true;return false;}
 const cols=Math.max(...rows.map(r=>[...r].length)),w=cols*CW+SLANT*rows.length+2,h=rows.length*CH+2;
 canvas.width=w;canvas.height=h;canvas.style.width=w*2+'px';canvas.style.height=h*2+'px';canvas.hidden=false;
 const g=canvas.getContext('2d');g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
 const H=(x,y,a,b)=>g.fillRect(x+a,y,b-a,1),V=(x,y,a,b)=>g.fillRect(x,y+a,1,b-a);
 rows.forEach((row,r)=>{const ox=(rows.length-1-r)*SLANT,oy=r*CH;
  [...row].forEach((c,i)=>{const x=ox+i*CW,y=oy;
   if(c==='█'){g.fillStyle=FACE[r%FACE.length];g.fillRect(x,y,CW,CH);return;}
   g.fillStyle=LINE;
   if(c==='═'){H(x,y+Y1,0,CW);H(x,y+Y2,0,CW);}
   else if(c==='║'){V(x+X1,y,0,CH);V(x+X2,y,0,CH);}
   else if(c==='╗'){H(x,y+Y1,0,X2+1);V(x+X2,y,Y1,CH);H(x,y+Y2,0,X1+1);V(x+X1,y,Y2,CH);}
   else if(c==='╔'){H(x,y+Y1,X1,CW);V(x+X1,y,Y1,CH);H(x,y+Y2,X2,CW);V(x+X2,y,Y2,CH);}
   else if(c==='╝'){H(x,y+Y2,0,X2+1);V(x+X2,y,0,Y2+1);H(x,y+Y1,0,X1+1);V(x+X1,y,0,Y1+1);}
   else if(c==='╚'){H(x,y+Y2,X1,CW);V(x+X1,y,0,Y2+1);H(x,y+Y1,X2,CW);V(x+X2,y,0,Y1+1);}
  });});
 return true;
}
