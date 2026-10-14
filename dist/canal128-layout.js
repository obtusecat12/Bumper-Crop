// V128 L11 canal layout (EN wiki Level 11: "Canals do the same [follow the roads], ... go underground for several periods of time").
// Pure + hashed: canal rows run along city x through the MIDDLE of every 8th block row; each block of such a row is either open
// (water in a sunk channel between two promenades) or buried (the canal runs on underground below a normal block).
import {urbanHash} from './urban-batch.js?v=69';
// block-local z: south promenade p0..z0, water z0..z1, north promenade z1..p1; water surface W below street level
export const CANAL={period:8,row:5,z0:40,z1:70,p0:34,p1:76,water:-1.3,top:.15,mid:55};
const authored=(ix,iz)=>(ix===1&&iz===2)||((ix===-1||ix===0)&&iz>=-3&&iz<4);
export function canalRow(iz){const p=CANAL.period;return(((iz-CANAL.row)%p)+p)%p===0;}
export function canalOpen(ix,iz){
 if(!canalRow(iz)||authored(ix,iz))return false;
 if(iz===CANAL.row){if(ix>=0&&ix<=3)return true;if(ix===4)return false;}   // wiki-photo reach (11canal.png) + its tunnel portal
 return urbanHash(ix,iz,0x128c)%100<62;
}
// hero super-block = blocks (1,5)+(2,5) with no N-S road between them (the photo shows one unbroken run of towers)
export const CANAL_HERO={a:1,b:2,row:5};
export function canalBlock(ix,iz){
 if(!canalOpen(ix,iz))return null;const r=iz===CANAL_HERO.row,hero=r&&(ix===CANAL_HERO.a||ix===CANAL_HERO.b);
 return{hero,noRoadE:r&&ix===CANAL_HERO.a,noRoadW:r&&ix===CANAL_HERO.b,portalW:!canalOpen(ix-1,iz),portalE:!canalOpen(ix+1,iz)};
}
// buried canal stretch (used by the underground network): row blocks that are not open
export function canalBuried(ix,iz){return canalRow(iz)&&!canalOpen(ix,iz);}
