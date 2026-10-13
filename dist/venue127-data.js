// V127 · fabricated 2009 "Goggle Maps" local-search content for the four venues
// (BAÑOS bathhouse, Lantern Reef tiki bar, Indoor Tide Garden, Level 27).
// Every business, address, review and phone number is invented. Phone numbers use
// the fictional 555-01xx range. Photos live in assets/v127 (one generated image each).
const P=n=>'./assets/v127/'+n+'.webp';
export const VENUES127={
 bath:{
  query:'bathhouse spa',near:'BAÑOS, Palm Plaza, Level 11',total:38,map:'city',
  streets:{h:['Hope St','Calle Palma','N 2nd St'],v:['Main St','Callejón Palma','1st Ave'],park:'Palm Plaza'},
  ad:{title:'Hot Water Tonight? - No Waiting',url:'www.calientebath.meg',text:'Private showers, fresh towels, open 24 hrs. Level 11 locals get 2nd hour free.'},
  results:[
   {name:'BAÑOS Hot Water Baths',cat:'Public Baths, Spas',stars:4,reviews:23,addr:'Callejón Palma 3 (alley off Palm Plaza), Level 11',phone:'(213) 555-0142',web:'banos-palmplaza.meg',pin:[.47,.52],
    hours:[['Mon–Thu','6:00 am – 11:00 pm'],['Fri–Sat','6:00 am – 2:00 am'],['Sun','8:00 am – 10:00 pm']],
    details:[['Price','$ · Showers $3, towel $1'],['Payment','Cash only'],['Parking','Street (Palm Plaza)'],['Good for','Hot showers, steam, a long sit']],
    snippet:'"…turn any shower all the way up and close your eyes. Trust me." - 3 more »',
    photos:['bath_a1','bath_a2','bath_a3'],sv:'bath_asv',bars:[12,6,3,1,1],
    revs:[
     {who:'steamqueen77',src:'yelpp.com',stars:5,date:'Aug 14, 2009',text:'The front lobby still has that weird empty pool with the mountain painting, don\'t let it scare you. Left door to the changing room, showers straight ahead. Water pressure is unreal and the hot setting is REALLY hot.'},
     {who:'A Goggle User',src:'',stars:4,date:'Jun 2, 2009',text:'Clean enough, cheap, always open. Tiles are older than me. Bring your own soap. If you crank the shower to the top preset and shut your eyes you end up somewhere very relaxing… go figure.'},
     {who:'Marisol R.',src:'citysurch.com',stars:4,date:'Mar 21, 2009',text:'Baños de toda la vida. El vapor es bueno y el señor de la entrada es muy amable. No hay estacionamiento.'},
     {who:'nightshift_dave',src:'yelpp.com',stars:2,date:'Dec 30, 2008',text:'Glass door in the alley is hard to find at night. Mural pool area echoes like crazy. Showers great though.'}]},
   {name:'Casa del Vapor Spa & Sauna',cat:'Saunas, Day Spas',stars:3,reviews:9,addr:'212 Calle Palma, Level 11',phone:'(213) 555-0117',web:'casadelvapor.meg',pin:[.71,.31],
    hours:[['Daily','10:00 am – 9:00 pm']],details:[['Price','$$'],['Payment','Cash, Visa'],['Good for','Cedar sauna, massage']],
    snippet:'"Small cedar sauna, the rocks are always hot. Towels smell like a hotel." - 1 more »',
    photos:['bath_b1','bath_b2'],sv:'bath_bsv',bars:[2,3,2,1,1],
    revs:[{who:'Tomás G.',src:'yelpp.com',stars:4,date:'Jul 7, 2009',text:'Small cedar sauna, rocks are always hot. Lady at the desk remembers your name.'},{who:'A Goggle User',src:'',stars:2,date:'Feb 11, 2009',text:'Waited 40 min for the sauna. The flip-flop rack is a petri dish.'}]},
   {name:'Palm Plaza Health Club',cat:'Gyms, Swimming Pools',stars:3,reviews:14,addr:'1 Palm Plaza, 2nd floor, Level 11',phone:'(213) 555-0163',web:'palmplazahc.meg',pin:[.33,.36],
    hours:[['Mon–Fri','5:30 am – 10:00 pm'],['Sat–Sun','7:00 am – 6:00 pm']],details:[['Price','$$ · Day pass $8'],['Payment','Cash, Visa, MasterCard'],['Amenities','25 m pool, lockers, sauna']],
    snippet:'"Lap pool is never crowded. Lockers need a quarter." - 2 more »',
    photos:['bath_c1','bath_c2'],sv:'bath_csv',bars:[3,4,4,2,1],
    revs:[{who:'swim4life',src:'citysurch.com',stars:4,date:'May 19, 2009',text:'Lap pool is never crowded, lifeguard is asleep half the time. Lockers need a quarter.'},{who:'K. Lindqvist',src:'yelpp.com',stars:3,date:'Jan 3, 2009',text:'Fine for a swim. The windows look over the plaza palms, which is nice. Showers lukewarm.'}]},
   {name:'Golden Faucet Plumbing Supply',cat:'Plumbing Supplies',stars:0,reviews:0,addr:'90 N 2nd St, Level 11',phone:'(213) 555-0178',pin:[.82,.68],hours:[['Mon–Sat','7:00 am – 5:00 pm']],details:[['Category','Plumbing, Water Heaters']],snippet:'Shower heads, valves, water heaters - wholesale & retail',photos:[],sv:null,bars:[0,0,0,0,0],revs:[]},
   {name:'Lucky Coin Laundromat & Showers',cat:'Laundromats',stars:3,reviews:2,addr:'45 Callejón Palma, Level 11',phone:'(213) 555-0129',pin:[.58,.74],hours:[['Daily','24 hours']],details:[['Payment','Coins only']],snippet:'"Two coin showers in the back. Bring quarters." - 1 more »',photos:[],sv:null,bars:[0,1,1,0,0],revs:[{who:'A Goggle User',src:'',stars:3,date:'Apr 8, 2009',text:'Two coin showers in the back, 5 minutes per quarter. It works.'}]},
   {name:'Mercado Massage & Foot Spa',cat:'Massage',stars:4,reviews:5,addr:'318 Hope St, Level 11',phone:'(213) 555-0151',pin:[.21,.63],hours:[['Daily','11:00 am – 11:00 pm']],details:[['Price','$']],snippet:'"Foot soak + 30 min for $15. Hot towels." - 2 more »',photos:[],sv:null,bars:[2,2,1,0,0],revs:[{who:'jj_walks',src:'yelpp.com',stars:4,date:'Sep 1, 2009',text:'Foot soak plus 30 minutes for fifteen bucks. After walking the endless blocks out there, worth every cent.'}]}
  ]},
 tiki:{
  query:'tiki bar',near:'Lantern Reef, Hope St, Level 11',total:21,map:'city',
  streets:{h:['Hope St','N 3rd St','N 4th St'],v:['2nd Ave','Reef Ln','3rd Ave'],park:'Lantern Sq'},
  ad:{title:'Mai Tai Mondays $4',url:'www.lanternreef.meg',text:'Lantern Reef Tiki Bar & Grill. Flaming pupu platters, live steel guitar Fri.'},
  results:[
   {name:'Lantern Reef Tiki Bar & Grill',cat:'Tiki Bars, Polynesian Restaurants',stars:4,reviews:41,addr:'418 Hope St, Level 11',phone:'(213) 555-0184',web:'lanternreef.meg',pin:[.5,.5],
    hours:[['Mon–Thu','4:00 pm – 1:00 am'],['Fri–Sat','4:00 pm – 2:00 am'],['Sun','2:00 pm – 12:00 am']],
    details:[['Price','$$'],['Payment','Cash, Visa, MasterCard, Amex'],['Good for','Groups, late night, rum'],['Also','Indoor Tide Garden through the back door']],
    snippet:'"Pufferfish lanterns everywhere. The Navy Grog will fold you in half." - 6 more »',
    photos:['tiki_a1','tiki_a2','tiki_a3'],sv:'tiki_asv',bars:[22,11,4,2,2],
    revs:[
     {who:'grogdog',src:'yelpp.com',stars:5,date:'Sep 12, 2009',text:'Pufferfish lanterns, glass floats, rattan booths and a bartender who\'s been here since the Carter administration. The Navy Grog will fold you in half. Don\'t miss the garden room out back with the fountain.'},
     {who:'A Goggle User',src:'',stars:4,date:'Jul 25, 2009',text:'Good mai tai, not too sweet. Seats fill up fast after 9. You can sit at the bar and they bring the drink to you.'},
     {who:'小林',src:'citysurch.com',stars:4,date:'May 30, 2009',text:'灯很暗，用闪光灯拍照才看得清。鸡尾酒杯很可爱，后面的室内花园很安静。'},
     {who:'brunchbetty',src:'yelpp.com',stars:2,date:'Jan 17, 2009',text:'Food is an afterthought. Pupu platter was mostly egg rolls. Atmosphere: 10/10.'}]},
   {name:'The Velvet Outrigger',cat:'Cocktail Lounges',stars:4,reviews:12,addr:'77 Reef Ln, Level 11',phone:'(213) 555-0106',web:'velvetoutrigger.meg',pin:[.68,.27],
    hours:[['Tue–Sun','6:00 pm – 2:00 am'],['Mon','Closed']],details:[['Price','$$'],['Payment','Cash only'],['Good for','Date night']],
    snippet:'"Velvet paintings and a canoe on the ceiling. Order the scorpion bowl." - 2 more »',
    photos:['tiki_b1','tiki_b2'],sv:'tiki_bsv',bars:[5,4,2,1,0],
    revs:[{who:'ladylava',src:'yelpp.com',stars:5,date:'Aug 2, 2009',text:'Velvet paintings and an actual outrigger canoe hanging from the ceiling. Order the scorpion bowl and share it.'},{who:'A Goggle User',src:'',stars:3,date:'Mar 9, 2009',text:'No sign on the door, just a red light. Small, loud, strong drinks.'}]},
   {name:'Typhoon Terrace Lounge',cat:'Bars, Hawaiian',stars:3,reviews:8,addr:'500 Hope St, 2nd fl, Level 11',phone:'(213) 555-0193',web:'typhoonterrace.meg',pin:[.27,.4],
    hours:[['Daily','5:00 pm – 12:00 am']],details:[['Price','$$'],['Payment','Visa, MasterCard'],['Seating','Enclosed terrace']],
    snippet:'"Tiki torches upstairs, pupu platter with a real flame." - 1 more »',
    photos:['tiki_c1','tiki_c2'],sv:'tiki_csv',bars:[1,3,3,1,0],
    revs:[{who:'hulahank',src:'citysurch.com',stars:4,date:'Jun 20, 2009',text:'Upstairs terrace with gas torches and a view of Hope St. Pupu platter comes with a little flame you cook on.'},{who:'A Goggle User',src:'',stars:2,date:'Feb 28, 2009',text:'Drinks watered down. Nice room.'}]},
   {name:'Hope St Liquor & Deli',cat:'Liquor Stores',stars:3,reviews:3,addr:'402 Hope St, Level 11',phone:'(213) 555-0135',pin:[.42,.66],hours:[['Daily','7:00 am – 2:00 am']],details:[['Payment','Cash, Visa']],snippet:'"Has every rum the tiki bar uses, half price." - 1 more »',photos:[],sv:null,bars:[0,1,1,1,0],revs:[{who:'A Goggle User',src:'',stars:3,date:'Apr 4, 2009',text:'Every rum Lantern Reef pours, half the price.'}]},
   {name:'Coral Cove Karaoke',cat:'Karaoke',stars:2,reviews:4,addr:'61 N 3rd St, Level 11',phone:'(213) 555-0158',pin:[.8,.6],hours:[['Wed–Sun','8:00 pm – 3:00 am']],details:[['Price','$']],snippet:'"Song book stops at 1994." - 1 more »',photos:[],sv:null,bars:[0,0,1,2,1],revs:[]},
   {name:'Mahalo Pawn & Loan',cat:'Pawn Shops',stars:0,reviews:0,addr:'433 Hope St, Level 11',phone:'(213) 555-0122',pin:[.6,.82],hours:[['Mon–Sat','10:00 am – 7:00 pm']],details:[['Category','Pawn, Jewelry, Ukuleles']],snippet:'Gold, guitars, ukuleles, TVs',photos:[],sv:null,bars:[0,0,0,0,0],revs:[]}
  ]},
 garden:{
  query:'indoor garden',near:'Indoor Tide Garden, Lantern Reef, Level 11',total:17,map:'city',
  streets:{h:['Hope St','N 3rd St','N 4th St'],v:['2nd Ave','Reef Ln','3rd Ave'],park:'Lantern Sq'},
  ad:{title:'Fountains & Koi Ponds Installed',url:'www.tidewaterscapes.meg',text:'Indoor water gardens for lobbies, bars and homes. Free estimate.'},
  results:[
   {name:'Lantern Reef · Indoor Tide Garden',cat:'Gardens, Lounges',stars:5,reviews:17,addr:'418 Hope St (rear, through Lantern Reef), Level 11',phone:'(213) 555-0185',web:'lanternreef.meg/garden',pin:[.5,.48],
    hours:[['Daily','4:00 pm – 12:00 am'],['','Bar hours apply']],
    details:[['Price','Free with a drink'],['Payment','Cash, Visa, MasterCard'],['Features','Stone fountain, skylight, koi, drinks machine'],['Good for','Quiet, humid, reading']],
    snippet:'"A tiered stone fountain under a skylight, hidden behind a tiki bar." - 4 more »',
    photos:['garden_a1','garden_a2','garden_a3'],sv:'garden_asv',bars:[13,3,1,0,0],
    revs:[
     {who:'fernfanatic',src:'yelpp.com',stars:5,date:'Sep 5, 2009',text:'Walk through the tiki bar and out the back: a tiered stone fountain under a skylight, monstera everywhere, and it smells like rain. The drinks machine in the corner gives out random sodas.'},
     {who:'A Goggle User',src:'',stars:5,date:'Jul 1, 2009',text:'Best place on Hope St to sit and do nothing. Wicker chairs by the koi pond. Humid, so no laptops.'},
     {who:'Ana P.',src:'citysurch.com',stars:4,date:'Apr 14, 2009',text:'Muy bonito y tranquilo. La fuente suena todo el tiempo. A veces la máquina se traga las monedas.'}]},
   {name:'Conservatory Arcade Atrium',cat:'Shopping Centers',stars:3,reviews:10,addr:'600 Hope St, Level 11',phone:'(213) 555-0111',web:'conservatoryarcade.meg',pin:[.25,.3],
    hours:[['Mon–Sat','9:00 am – 9:00 pm'],['Sun','11:00 am – 6:00 pm']],details:[['Parking','Garage on 2nd Ave'],['Features','Glass roof, ficus trees']],
    snippet:'"Half the shops are closed but the glass roof and the ficus trees are great." - 2 more »',
    photos:['garden_b1','garden_b2'],sv:'garden_bsv',bars:[2,3,3,1,1],
    revs:[{who:'mallrat86',src:'yelpp.com',stars:3,date:'Aug 22, 2009',text:'Half the shops are closed but the glass roof and the big ficus trees make it a nice walk out of the sun.'},{who:'A Goggle User',src:'',stars:3,date:'Jan 9, 2009',text:'The fountain has been dry for years. Escalator works sometimes.'}]},
   {name:'Greenleaf Nursery & Koi',cat:'Nurseries, Pet Stores',stars:4,reviews:6,addr:'14 N 4th St, Level 11',phone:'(213) 555-0147',web:'greenleafkoi.meg',pin:[.74,.66],
    hours:[['Tue–Sun','8:00 am – 6:00 pm'],['Mon','Closed']],details:[['Payment','Cash, Visa'],['Sells','Houseplants, koi, pond pumps']],
    snippet:'"Huge koi tank, cheap pothos. The owner knows his fish." - 1 more »',
    photos:['garden_c1','garden_c2'],sv:'garden_csv',bars:[3,2,1,0,0],
    revs:[{who:'pondguy',src:'citysurch.com',stars:5,date:'Jun 13, 2009',text:'Huge koi tank, cheap pothos, the owner knows his fish. Got my fountain pump here.'},{who:'A Goggle User',src:'',stars:3,date:'Mar 2, 2009',text:'Small greenhouse, a little overpriced on palms.'}]},
   {name:'Plaza Hydroponics Supply',cat:'Garden Supplies',stars:2,reviews:2,addr:'88 Reef Ln, Level 11',phone:'(213) 555-0170',pin:[.62,.2],hours:[['Mon–Fri','10:00 am – 6:00 pm']],details:[['Payment','Cash']],snippet:'"Grow lights and nutrient bottles." - 1 more »',photos:[],sv:null,bars:[0,0,1,1,0],revs:[]},
   {name:'Fernwood Florist',cat:'Florists',stars:4,reviews:3,addr:'420 Hope St, Level 11',phone:'(213) 555-0138',pin:[.4,.62],hours:[['Mon–Sat','8:00 am – 5:00 pm']],details:[['Delivery','Level 11 only']],snippet:'"Next door to Lantern Reef. Orchids and leis." - 1 more »',photos:[],sv:null,bars:[1,2,0,0,0],revs:[{who:'A Goggle User',src:'',stars:4,date:'May 5, 2009',text:'Right next to the tiki bar. Fresh leis on Fridays.'}]},
   {name:'Aquarium World Pet Shop',cat:'Pet Stores',stars:3,reviews:4,addr:'203 3rd Ave, Level 11',phone:'(213) 555-0165',pin:[.86,.4],hours:[['Daily','10:00 am – 8:00 pm']],details:[['Sells','Tropical fish, tanks']],snippet:'"Wall of glowing tanks." - 2 more »',photos:[],sv:null,bars:[1,1,1,1,0],revs:[]}
  ]},
 l27:{
  query:'hot springs',near:'Level 27, The Bunker Springs',total:6,map:'cave',
  ad:{title:'Visiting Level 27? Read This First',url:'www.meg-level11.meg/springs',text:'Max ~30 bathers. Leave after bathing. Don\'t climb the other waterfall tunnel.'},
  results:[
   {name:'Bunker Springs (Level 27)',cat:'Hot Springs, Natural Pools',stars:5,reviews:58,addr:'Level 27 · enter via any shower at its hottest setting, eyes closed (Level 11 most popular)',phone:'No phone · M.E.G. Level 11 desk (213) 555-0127',web:'backrooms-wiki.wikidot.com/level-27',pin:[.5,.55],
    hours:[['Daily','Always open'],['Note','Max ~30 bathers; 1–2 hr soak recommended']],
    details:[['Price','Free'],['Water','~32.2 °C (90 °F), mineral-rich, potable'],['Size','~18.6 m² (200 sq ft) pool'],['Exit','M.E.G. stairway by the waterfall → stream tunnel']],
    snippet:'"Clear water, two little waterfalls, zero entities. Leave when you\'re done." - 9 more »',
    photos:['l27_a1','l27_a2','l27_a3'],sv:'l27_asv',bars:[44,9,3,1,1],
    revs:[
     {who:'level11_commuter',src:'yelpp.com',stars:5,date:'Sep 18, 2009',text:'Hour soak after my shift and I\'m a new person. Two little waterfalls, warm clear water, you can drink it. Stairs by the waterfall take you back up the stream tunnel to wherever you came from.'},
     {who:'A Goggle User',src:'',stars:5,date:'Aug 3, 2009',text:'Peaceful, no entities, no bugs, not even moss. Kind of eerie when you think about it, so don\'t.'},
     {who:'C. Goswell',src:'',stars:1,date:'Jun 9, 2009',text:'Do NOT climb the other waterfall tunnel. It leads to nowhere. I will not be coming back.'},
     {who:'温泉控',src:'citysurch.com',stars:5,date:'May 27, 2009',text:'水温刚好，矿物质很多，喝起来有点甜。人多的时候（超过三十个）就别下去了。'}]},
   {name:'Limestone Grotto Soaking Pool',cat:'Natural Pools',stars:4,reviews:11,addr:'Level 27 · alcove left of the main pool',phone:'No phone',pin:[.3,.4],
    hours:[['Daily','Always open']],details:[['Depth','Knee-deep'],['Walls','Limestone flowstone']],
    snippet:'"Little alcove pool off to the side. Flowstone walls." - 2 more »',
    photos:['l27_b1','l27_b2'],sv:'l27_bsv',bars:[5,4,1,1,0],
    revs:[{who:'quietsoaker',src:'yelpp.com',stars:5,date:'Jul 30, 2009',text:'Knee-deep alcove off to the side, nobody goes there. The walls look like melted candle wax.'},{who:'A Goggle User',src:'',stars:3,date:'Apr 2, 2009',text:'Too shallow to really soak.'}]},
   {name:'Stairwell Falls Picnic Ledge',cat:'Picnic Areas',stars:4,reviews:7,addr:'Level 27 · rock shelf beside the M.E.G. stairway',phone:'No phone',pin:[.68,.32],
    hours:[['Daily','Always open']],details:[['Bring','Towels, snacks; take trash back up']],
    snippet:'"Flat rock by the stairs, good for towels and a thermos." - 1 more »',
    photos:['l27_c1','l27_c2'],sv:'l27_csv',bars:[3,3,1,0,0],
    revs:[{who:'thermos_tina',src:'citysurch.com',stars:4,date:'Aug 16, 2009',text:'Flat rock right by the stairs. Towels, thermos, done. Please take your trash back up the tunnel.'},{who:'A Goggle User',src:'',stars:4,date:'Feb 6, 2009',text:'Someone left two plastic chairs. Legends.'}]},
   {name:'M.E.G. Ranger Desk (Level 11)',cat:'Government Offices',stars:3,reviews:5,addr:'Hope St District, Level 11',phone:'(213) 555-0127',pin:[.88,.82],hours:[['Mon–Fri','8:00 am – 6:00 pm']],details:[['Services','Level 27 notices, expedition permits']],snippet:'"They close the springs for surveys sometimes." - 1 more »',photos:[],sv:null,bars:[0,2,2,1,0],revs:[]},
   {name:'Second Waterfall Tunnel - CLOSED',cat:'Caves',stars:1,reviews:3,addr:'Level 27 · opening high on the smooth cave wall',phone:'No phone',pin:[.2,.2],hours:[['','Permanently closed']],details:[['Warning','Leads to nowhere. Do not climb.']],snippet:'"Don\'t." - 2 more »',photos:[],sv:null,bars:[0,0,0,0,3],revs:[{who:'A Goggle User',src:'',stars:1,date:'Jul 11, 2009',text:'Don\'t.'}]},
   {name:'Stormstone Keep B&B',cat:'Bed & Breakfasts',stars:4,reviews:2,addr:'Level 28',phone:'No phone',pin:[.14,.86],hours:[['','Unknown']],details:[['Note','Guests report waking up in an armchair with coffee']],snippet:'"Woke up in an armchair. Coffee was good." - 1 more »',photos:[],sv:null,bars:[1,1,0,0,0],revs:[]}
  ]}
};
export const venuePhoto127=P;
