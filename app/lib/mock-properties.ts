export type MLSSource = 'Sunflower MLS' | 'FHAR MLS';
export type PropertyType = 'Residential' | 'Farm' | 'Land' | 'Commercial';
export interface RESOMedia { MediaKey: string; MediaURL: string; MediaCategory: 'Photo'; ShortDescription?: string; }
export interface RESOProperty { ListingId:string; StandardStatus:'Active'|'Pending'|'Closed'; ListPrice:number; BedroomsTotal:number; BathroomsTotalInteger:number; PropertyType:PropertyType; PropertySubType:string; StreetNumber:string; StreetName:string; City:string; StateOrProvince:string; PostalCode:string; LivingArea:number; LotSizeAcres:number; YearBuilt:number; PublicRemarks:string; Media:RESOMedia[]; ListingKey:string; ListAgentFullName:string; ListAgentMlsId:string; ListOfficeName:string; MlsSource:MLSSource; Latitude:number; Longitude:number; }
const photos = [
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1400&q=85'
];
const agents = [
 ['Joseph Kirby','J-1001'],['Thomas Kirby','T-1002'],['James Frazier','F-1003'],['Michael Kirby','M-1004']
] as const;
const cities = ['St. Marys','Wamego','Rossville','Silver Lake','Manhattan','Topeka'];
const streets = ['Maple','Oak','Elm','Prairie View','Meadow','Cottonwood','Walnut','Pine','Cedar','Ridge'];
export const mockProperties: RESOProperty[] = Array.from({length:28},(_,i)=>{
 const agent=agents[i%4], city=cities[i%cities.length], price=[289000,349900,425000,239900,515000,319500,675000][i%7];
 const type: PropertyType = i%9===0 ? 'Farm' : i%11===0 ? 'Land' : 'Residential';
 return { ListingId:`SMRE-${1001+i}`, ListingKey:`mock-${1001+i}`, StandardStatus:i%8===0?'Pending':'Active', ListPrice:price+(i%3)*5000, BedroomsTotal:type==='Land'?0:3+(i%3), BathroomsTotalInteger:type==='Land'?0:2+(i%2), PropertyType:type, PropertySubType:type==='Farm'?'Farm':type==='Land'?'Unimproved Land':'Single Family Residence', StreetNumber:String(100+i*7), StreetName:streets[i%streets.length], City:city, StateOrProvince:'KS', PostalCode:['66536','66547','66502','66514'][i%4], LivingArea:type==='Land'?0:1450+i*55, LotSizeAcres:type==='Land'?5+i%8:0.2+(i%5)*0.1, YearBuilt:type==='Land'?0:1975+(i%10)*5, PublicRemarks:`Well-maintained ${type.toLowerCase()} property in the ${city} area. The layout offers practical living space, strong natural light, and room to make it your own. Contact SMRE for current details, showing availability, and property-specific information.`, Media:photos.slice(0,3+(i%3)).map((url,j)=>({MediaKey:`${i}-${j}`,MediaURL:url,MediaCategory:'Photo'})), ListAgentFullName:agent[0], ListAgentMlsId:agent[1], ListOfficeName:'St. Mary’s Real Estate', MlsSource:i%2===0?'Sunflower MLS':'FHAR MLS', Latitude:39.1+i*0.01, Longitude:-96.4-i*0.01 };
});
export function getMockProperty(id:string){ return mockProperties.find(p=>p.ListingId===id || p.ListingKey===id); }

// LIVE RESO GO-LIVE NOTES:
// 1) Obtain IDX approval + RESO Web API credentials from BOTH Sunflower MLS and FHAR MLS. Existing Easy Agent Pro credentials do not automatically transfer.
// 2) Store credentials only in Vercel server environment variables (never NEXT_PUBLIC_*).
// 3) Implement two server-side RESO clients, normalize both Property feeds to RESOProperty, and merge/dedupe by ListingKey/ListingId.
// 4) Keep the public data contract below unchanged. Replace getMockProperty/mockProperties consumption in lib/listings.ts with the normalized backend response. Frontend code should not change.
