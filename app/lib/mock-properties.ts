export type MLSSource = 'Sunflower MLS' | 'FHAR MLS';
export type PropertyType = 'Residential' | 'Farm' | 'Land' | 'Commercial';
export interface RESOMedia { MediaKey:string; MediaURL:string; MediaCategory:'Photo'; ShortDescription?:string; }
export interface RESOProperty { ListingId:string; StandardStatus:'Active'|'Pending'|'Closed'; ListPrice:number; BedroomsTotal:number; BathroomsTotalInteger:number; PropertyType:PropertyType; PropertySubType:string; StreetNumber:string; StreetName:string; City:string; StateOrProvince:string; PostalCode:string; LivingArea:number; LotSizeAcres:number; YearBuilt:number; PublicRemarks:string; Media:RESOMedia[]; ListingKey:string; ListAgentFullName:string; ListAgentMlsId:string; ListOfficeName:string; MlsSource:MLSSource; Latitude:number; Longitude:number; }
const photos=[
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85'
];
export const mockProperties:RESOProperty[]=[
 {ListingId:'245430',ListingKey:'245430',StandardStatus:'Active',ListPrice:475000,BedroomsTotal:6,BathroomsTotalInteger:4,PropertyType:'Residential',PropertySubType:'Single Family Residence',StreetNumber:'17320',StreetName:'C Rd',City:'Delia',StateOrProvince:'KS',PostalCode:'66418',LivingArea:2372,LotSizeAcres:8.95,YearBuilt:2012,PublicRemarks:'Expansive walk-out ranch on approximately 9 scenic acres with 6 bedrooms, 3.5 bathrooms, a finished basement, wrap-around deck and a detached outbuilding. Listed by Joseph Kirby.',Media:photos.map((url,j)=>({MediaKey:`245430-${j}`,MediaURL:url,MediaCategory:'Photo'})),ListAgentFullName:'Joseph Kirby',ListAgentMlsId:'J-1001',ListOfficeName:'St. Mary’s Real Estate',MlsSource:'FHAR MLS',Latitude:39.35,Longitude:-95.91},
 {ListingId:'244039',ListingKey:'244039',StandardStatus:'Active',ListPrice:290000,BedroomsTotal:3,BathroomsTotalInteger:3,PropertyType:'Residential',PropertySubType:'Single Family Residence',StreetNumber:'802',StreetName:'W Bertrand',City:'St. Marys',StateOrProvince:'KS',PostalCode:'66536',LivingArea:2382,LotSizeAcres:.30,YearBuilt:1920,PublicRemarks:'Versatile 3-bedroom home with a detached studio ADU, updated kitchen, hardwood floors, basement storm shelter and a layout that can work for extended family, a home office or rental income. Listed by Thomas Kirby.',Media:photos.map((url,j)=>({MediaKey:`244039-${j}`,MediaURL:url,MediaCategory:'Photo'})),ListAgentFullName:'Thomas Kirby',ListAgentMlsId:'T-1002',ListOfficeName:'St. Mary’s Real Estate',MlsSource:'Sunflower MLS',Latitude:39.1917,Longitude:-96.0660},
 {ListingId:'246333',ListingKey:'246333',StandardStatus:'Active',ListPrice:299000,BedroomsTotal:3,BathroomsTotalInteger:3,PropertyType:'Residential',PropertySubType:'Single Family Residence',StreetNumber:'701',StreetName:'Durink',City:'St. Marys',StateOrProvince:'KS',PostalCode:'66536',LivingArea:1456,LotSizeAcres:.16,YearBuilt:2022,PublicRemarks:'2022-built 3-bedroom, 2.5-bath home with modern construction and a convenient St. Marys location. MLS listing reported August 29, 2026.',Media:photos.map((url,j)=>({MediaKey:`246333-${j}`,MediaURL:url,MediaCategory:'Photo'})),ListAgentFullName:'Thomas Kirby',ListAgentMlsId:'T-1002',ListOfficeName:'St. Mary’s Real Estate',MlsSource:'Sunflower MLS',Latitude:39.194,Longitude:-96.063}
];
export function getMockProperty(id:string){return mockProperties.find(p=>p.ListingId===id||p.ListingKey===id);}
// LIVE RESO GO-LIVE NOTES:
// These three records are current public listing snapshots used until the authorized Sunflower/FHAR RESO feeds are connected.
// 1) Obtain IDX approval + RESO Web API credentials from BOTH Sunflower MLS and FHAR MLS.
// 2) Store credentials only in Vercel server environment variables (never NEXT_PUBLIC_*).
// 3) Implement two server-side RESO clients, normalize both feeds to RESOProperty, and merge/dedupe by ListingKey/ListingId.
// 4) Replace this file's mock data source with the normalized backend response; frontend contracts do not need to change.
