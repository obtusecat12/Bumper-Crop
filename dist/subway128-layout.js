// V128 L11 subway layout (EN wiki Level 11: "Subways expand infinitely, following the same layout of the roads above and
// intertwining in intersections and junctions."). Pure + hashed per city block, like the street grid above it.
// Every road line carries a tunnel. Block (ix,iz) owns the WEST line segment (local x = 0, along z 5..107), the SOUTH line
// segment (local z = 0, along x 5..107) and the junction chamber at its south-west corner (0,0).
import {urbanHash} from './urban-batch.js?v=69';
import {canalRow,canalOpen,canalBlock} from './canal128-layout.js?v=128';
// heights relative to street level: trackbed, platform, tunnel ceiling, culvert
export const SUB={bed:-10,plat:-9,ceil:-4.5,half:5,stHalf:11,st0:16,st1:96,stairX0:8.2,stairX1:10.8,stair0:18,rise:.18,run:.3,
 culWater:-4.4,culBed:-5.2,culCeil:-0.9,walk:-3.6,cz0:39,cz1:75,chan:-10.6};
SUB.stairLen=Math.ceil((.15-SUB.plat)/SUB.rise)*SUB.run;   // 51 steps -> 15.3 m
const authored=(ix,iz)=>(ix===1&&iz===2)||((ix===-1||ix===0)&&iz>=-3&&iz<4);
export function subwayBlock(ix,iz){
 if(authored(ix,iz))return null;
 const west=!(canalBlock(ix,iz)?.noRoadW),south=true;
 const lm=ix===0&&iz===4,stW=!lm&&west&&(urbanHash(ix*13+5,iz*7+1,0x5b01)>>>9)%100<16,stS=!lm&&(urbanHash(ix*5+3,iz*11+2,0x5b02)>>>9)%100<10&&!stW;
 return{west,south,stW,stS,
  canalW:canalRow(iz),                      // west line crosses this row's canal (z 40..70)
  canalOpenHere:canalOpen(ix,iz),canalOpenW:canalOpen(ix-1,iz),
  buried:canalRow(iz)&&!canalOpen(ix,iz),buriedW:canalRow(iz)&&!canalOpen(ix-1,iz)&&!authored(ix-1,iz),
  sewer:urbanHash(ix,iz,0x5b03)%3,name:urbanHash(ix,iz,0x5b04)%16};
}
// street openings of the station stairs, block-local rects {x0,x1,z0,z1,axis} (axis 'z': descends toward +z)
export function subwayStairs(ix,iz){const s=subwayBlock(ix,iz);if(!s)return[];const o=[];
 if(s.stW)o.push({x0:SUB.stairX0,x1:SUB.stairX1,z0:SUB.stair0,z1:SUB.stair0+SUB.stairLen,axis:'z'});
 if(s.stS)o.push({z0:SUB.stairX0,z1:SUB.stairX1,x0:SUB.stair0,x1:SUB.stair0+SUB.stairLen,axis:'x'});
 return o;}
