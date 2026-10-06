export type GuideSource={label:string;url:string};
export type Guide={slug:string;title:string;category:string;description:string;intro:string;updated:string;sections:{heading:string;body:string}[];sources?:GuideSource[];draft?:boolean};

const countySources:GuideSource[]=[
  {label:'Pottawatomie County Unified Development Regulations',url:'https://www.pottcounty.org/DocumentCenter/View/10064/Updated-Complete-UDR-2023-Digital'},
  {label:'Pottawatomie County Regulations',url:'https://www.pottcounty.org/537/Regulations'},
  {label:'Pottawatomie County Planning & Zoning',url:'https://www.pottcounty.org/161/Planning-Zoning-Office'}
];

const homebuyingSources:GuideSource[]=[
  {label:'Consumer Financial Protection Bureau: Ready to Buy a Home?',url:'https://www.consumerfinance.gov/consumer-tools/mortgages/ready-to-buy-a-home/'},
  {label:'Consumer Financial Protection Bureau: Preapproval',url:'https://www.consumerfinance.gov/owning-a-home/explore/get-a-preapproval-letter/'},
  {label:'Consumer Financial Protection Bureau: Home Inspection',url:'https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/'}
];

export const guides:Guide[]=[
{
 slug:'pottawatomie-county-building-permits-zoning',
 title:'Pottawatomie County Building Permits, Zoning & Building Codes',
 category:'COUNTY REGULATIONS',
 description:'What buyers and landowners should know about permits, zoning, building codes and rural construction in Pottawatomie County.',
 updated:'Reviewed October 2026',
 intro:'One of the easiest mistakes to make with rural property is assuming that “buildable” simply means the parcel is large enough. Pottawatomie County separates zoning, permitting, sanitation, floodplain and building-code issues, and the rules can differ depending on where the property is located.',
 sections:[
  {heading:'A building permit is generally required',body:'The County says building permits are required for site-built dwellings, accessory structures, manufactured homes, moved-in homes and additions. Small storage sheds 120 square feet or less, fences, playhouses and play equipment are listed as exceptions. Agricultural structures still require a permit for floodplain and setback review, although the County says there is no fee for an agricultural structure on 40 acres or more.'},
  {heading:'Acreage does not automatically make a homesite buildable',body:'For A1 agricultural property, the County generally describes 3 acres as the minimum when rural or city water is available with private septic and 5 acres when an individual well and private septic are used. The final determination depends on water availability and sanitary disposal. A parcel can therefore meet a headline acreage threshold and still have a problem with its proposed homesite.'},
  {heading:'Building codes are location-specific',body:'Pottawatomie County’s current FAQ states that, outside the Blue Township Sewer District, the County has not adopted general building codes other than ADA requirements for commercial buildings. The Blue Township/Green Valley area is subject to building codes and inspections. This is different from zoning and permit requirements, which still apply more broadly.'},
  {heading:'Zoning and private restrictions are separate questions',body:'A property can satisfy County zoning requirements and still be subject to private restrictive covenants. The County notes that covenants can impose requirements such as minimum house size, architectural controls or livestock restrictions. Those restrictions are generally enforced privately rather than by the County.'},
  {heading:'Check access, water, wastewater and floodplain before you buy',body:'For a proposed home, verify road access and any required county-road entrance, water service, septic or sewer feasibility, floodplain status, setbacks and easements before treating the land as a homesite. These are separate questions and solving one does not automatically solve the others.'},
  {heading:'The safest approach before buying',body:'Give Planning and Zoning the parcel information and proposed use and ask what approvals apply. Then verify water service with the applicable district and sanitary feasibility through the County’s environmental health process. If the purchase depends on a future home, make the contract and due-diligence period long enough to actually complete those checks.'}
 ],
 sources:countySources
},
{
 slug:'buying-land-pottawatomie-county',
 title:'Buying Land in Pottawatomie County',
 category:'LAND & ACREAGE',
 description:'A practical due-diligence checklist for buying acreage, a homesite or development land in Pottawatomie County.',
 updated:'Reviewed October 2026',
 intro:'Buying land is different from buying a finished home. In Pottawatomie County, zoning, water, sanitation, road access, floodplain status and subdivision rules can all affect whether a parcel is usable for your plans.',
 sections:[
  {heading:'Start with the end use',body:'Decide what you want the property to do before you decide what it is worth. Building a home, adding a shop, keeping livestock, splitting the property, hunting or holding land for future development can create very different requirements.'},
  {heading:'Verify the zoning and dwelling rules',body:'Do not rely on an MLS description such as “buildable acreage.” Confirm the current zoning district, permitted uses, minimum tract requirements and whether the property is affected by subdivision rules. In A1, the County generally allows two non-farm dwellings per quarter-quarter section, while additional residential development can trigger subdivision requirements and current County review.'},
  {heading:'Verify water and wastewater',body:'For A1 property, the County generally uses 3 acres with rural water and private septic or 5 acres with an individual well and private septic as the starting point for residential tract size. That does not guarantee a building permit. Confirm actual water availability and whether the proposed homesite can support an approved wastewater system.'},
  {heading:'Verify road access',body:'Legal access is not necessarily construction-ready access. Check road frontage, recorded easements, driveway location, county-road entrance requirements, road standards and emergency access. If the property is being created through a split or subdivision, access requirements can become more significant.'},
  {heading:'Check the land itself',body:'Walk the property and look at topography, drainage, floodplain, timber, ponds, utility corridors, old structures, fence condition and likely building areas. A 20-acre tract can have less practical usable ground than a smaller, better-shaped parcel.'},
  {heading:'Price the work, not just the dirt',body:'Compare the purchase price plus driveway, utility extensions, water connection, septic work, fencing, clearing, grading and outbuilding costs. Two parcels with the same price per acre can have very different total costs to make them useful.'}
 ],
 sources:countySources
},
{
 slug:'rural-water-vs-private-well',
 title:'Rural Water vs. Private Well in Pottawatomie County',
 category:'LAND & ACREAGE',
 description:'What buyers should investigate when rural property has rural water or a private well.',
 updated:'Reviewed October 2026',
 intro:'Water is one of the first things to investigate when buying rural property. The choice between a rural-water connection and a private well affects construction, maintenance, water quality and long-term costs.',
 sections:[
  {heading:'Rural water',body:'Rural water can eliminate private-well equipment and maintenance, but the buyer still needs to verify that service is actually available to the parcel. Ask the district about the benefit unit or connection requirement, meter, tap and construction costs, and who is responsible for bringing service to the homesite.'},
  {heading:'Private wells',body:'For an existing well, investigate age, depth, production, pump equipment, pressure system and water-quality history. For vacant land, do not assume a well can be drilled simply because neighboring properties have wells. The proposed homesite still has to satisfy the County’s zoning and sanitary requirements.'},
  {heading:'Water availability can affect acreage requirements',body:'Pottawatomie County’s A1 rules generally use 3 acres where rural water is available and 5 acres where an individual well is used, subject to the County’s water and sanitary determinations. That makes water availability part of the land-use analysis, not just a utility question.'},
  {heading:'Ask for the numbers before closing',body:'A water line visible from the road is not the same thing as a paid connection to the property. Get written or direct confirmation of service availability and estimated connection costs before relying on it in your purchase decision.'}
 ],
 sources:countySources
},
{
 slug:'septic-systems-rural-kansas',
 title:'What to Know About Septic Systems in Rural Kansas',
 category:'LAND & ACREAGE',
 description:'The septic, soil and site questions to ask before buying rural property in Northeast Kansas.',
 updated:'Reviewed October 2026',
 intro:'A rural property without public sewer needs an approved wastewater solution. The important question is not simply whether a property has septic, but whether the existing or proposed system is appropriate for the site and intended use.',
 sections:[
  {heading:'Existing systems',body:'For an existing home, locate the tank and lateral field if possible and ask about installation, pumping and repairs. A septic inspection can identify conditions that a normal home inspection may not evaluate in detail.'},
  {heading:'Vacant land',body:'For vacant land, establish septic feasibility before treating the parcel as a buildable homesite. Pottawatomie County uses soil/profile and sanitary review processes, and subdivision review can require soils, drainage and sanitary information. The exact process depends on the property and proposed use.'},
  {heading:'Do not confuse a soil test with approval',body:'A favorable soil or profile result is useful, but it is not the same as receiving every approval needed to build. Water source, setbacks, site layout, road access and zoning still matter.'},
  {heading:'Make the due-diligence period useful',body:'If septic feasibility is a major reason for buying the property, use the contract period to complete the actual investigation. Waiting until after closing turns a land-use question into an expensive problem.'}
 ],
 sources:countySources
},
{
 slug:'buying-acreage-near-st-marys',
 title:'Buying Acreage Near St. Marys, Kansas',
 category:'LOCAL BUYING',
 description:'A practical checklist for buyers considering homes, farms and acreage around St. Marys.',
 updated:'Reviewed October 2026',
 intro:'Acreage around St. Marys can offer more space, outbuildings and privacy, but rural property comes with a different set of questions than an in-town home.',
 sections:[
  {heading:'Decide what you actually need',body:'Start with the reason you want acreage. A buyer looking for room for a shop has different priorities than someone looking for pasture, hunting ground or a future homesite. That should drive the search instead of starting with an arbitrary number of acres.'},
  {heading:'Evaluate the homesite, not just the parcel',body:'Look at drainage, topography, driveway access, utility locations, trees, outbuildings and the practical location of a future or existing home. Check floodplain maps and required setbacks before assuming every part of the property is equally usable.'},
  {heading:'Investigate rural utilities early',body:'Confirm rural water or well options, electric service, septic feasibility and internet availability. Rural infrastructure can be close by without being inexpensive to connect.'},
  {heading:'Budget for the property after closing',body:'Acreage can mean additional mowing, fencing, driveway maintenance, equipment and outbuilding upkeep. Include those costs when comparing rural property with homes on smaller lots.'}
 ],
 sources:countySources
},
{
 slug:'st-marys-housing-market',
 title:'St. Marys, KS Housing Market',
 category:'LOCAL MARKET',
 description:'A current, data-backed look at the St. Marys residential market, with context for what the numbers do and do not tell you.',
 updated:'Market snapshot: August 2026',
 intro:'St. Marys is a small residential market, so a handful of sales can move the statistics dramatically. The best way to read the market is to combine recent closed sales, current competition, days on market and the condition of the individual property.',
 sections:[
  {heading:'The latest public snapshot',body:'Redfin reported a median sale price of $337,227 for St. Marys over the three months ending August 2026, up 31.7% from the same period a year earlier. The same report showed 4 homes sold in August and a median 39 days on market. Because the number of monthly sales is very small, the 31.7% change should not be treated as evidence that every St. Marys home gained 31.7% in value.'},
  {heading:'The county-wide picture is steadier',body:'Pottawatomie County’s 2026 annual market study says residential property across the county showed a 3% to 7% increase range for the 2026 assessment year, based on the market as of January 1, 2026. County assessment trends are not the same thing as a listing CMA, but they provide useful context for the broader market.'},
  {heading:'Why a St. Marys average can be misleading',body:'A ranch on a finished basement, a small bungalow needing work, a newer home and acreage with outbuildings can all sell in the same small market. Mix those properties together and the median becomes a poor substitute for valuing a specific house.'},
  {heading:'What actually matters when pricing a home',body:'A useful pricing analysis should look first at the most comparable closed sales, then current competition and properties that went under contract. Adjustments should consider location, size, condition, updates, basement finish, garage, lot, outbuildings and other features that buyers in this market actually pay for.'},
  {heading:'If you are thinking about selling',body:'A good first step is a no-pressure home evaluation. We can look at the property, identify the most relevant comparable sales, review the competition and discuss what is worth doing before listing versus what is better left alone. That gives you a realistic price range and a plan instead of a generic online estimate.'}
 ],
 sources:[
  {label:'Redfin St. Marys market data',url:'https://www.redfin.com/city/16028/KS/St-Marys/housing-market'},
  {label:'Pottawatomie County 2026 market study',url:'https://www.pottcounty.org/598/Annual-Market-Study-Results'}
 ]
},
{
 slug:'wamego-housing-market',
 title:'Wamego, KS Housing Market',
 category:'LOCAL MARKET',
 description:'A current public-data snapshot of the Wamego housing market and what local buyers and sellers should take from it.',
 updated:'Market snapshot: August 2026',
 intro:'Wamego has enough sales to produce more useful statistics than some smaller nearby markets, but different data providers measure different things. The important part is understanding what each number actually represents.',
 sections:[
  {heading:'Recent sale data',body:'Redfin reported a median sale price of $249,835 for Wamego over the three months ending August 2026, down 1.0% year over year. It reported 19 homes sold in August and a median 19 days on market. Those figures describe recent closed sales, not the value of every home currently for sale.'},
  {heading:'Another useful public benchmark',body:'Zillow reported a typical Wamego home value of $302,421 as of August 31, 2026, up 5.0% year over year. Zillow also showed 29 homes for sale and a median list price of $337,483 at the end of August. Zillow’s home-value index is different from Redfin’s closed-sale median, so the numbers should not be mixed together as though they measure the same thing.'},
  {heading:'Why the numbers differ',body:'Closed-sale medians depend on what actually sold during a particular period. Automated home-value indexes model property values across a broader set of homes. Asking prices measure seller expectations. None of those numbers is a substitute for a property-specific CMA.'},
  {heading:'What sellers should watch',body:'For a Wamego seller, the most useful comparison is usually a small set of genuinely similar closed sales plus the homes buyers can choose from today. New construction, neighborhood, lot size, basement finish, garage and condition can create meaningful differences in value.'},
  {heading:'Thinking about selling?',body:'A home evaluation with an agent can turn the broad market numbers into something useful for your property. We can review the house, identify the best comparable sales, look at current competition and discuss a realistic pricing range and preparation plan.'}
 ],
 sources:[
  {label:'Redfin Wamego market data',url:'https://www.redfin.com/city/19096/KS/Wamego/housing-market'},
  {label:'Zillow Wamego market data',url:'https://www.zillow.com/home-values/41551/wamego-ks/'}
 ]
},
{
 slug:'buying-home-between-topeka-and-manhattan',
 title:'Buying a Home Between Topeka and Manhattan',
 category:'LOCAL BUYING',
 description:'How to approach a home search across St. Marys, Wamego, Topeka, Manhattan and the communities between them.',
 updated:'Reviewed October 2026',
 intro:'The Topeka-Manhattan corridor gives buyers more options than a single-city search, but commute time, services and community differences can quickly change what makes a property a good fit.',
 sections:[
  {heading:'Start with your actual weekly driving',body:'Map the places you regularly need to reach rather than choosing a town based only on its distance from Topeka or Manhattan. Work schedules, school routes and road access can make a meaningful difference.'},
  {heading:'Compare communities, not just houses',body:'Consider schools, shopping, healthcare, recreation, internet availability and the type of housing available in each community. A slightly different location may give you a better overall fit even if the house itself is similar.'},
  {heading:'Acreage changes the analysis',body:'Outside city limits, add zoning, water, septic, road access, floodplain and easement questions to the normal home-buying checklist. A house on five acres should not be evaluated like a house on a serviced city lot.'},
  {heading:'Use a focused search',body:'Start with the areas that work for your daily life, then compare homes within those areas. A local agent can also help you understand which properties are actually comparable rather than simply nearby on a map.'}
 ]
},
{
 slug:'selling-home-st-marys',
 title:'Selling a Home in St. Marys',
 category:'LOCAL SELLING',
 description:'A practical guide to evaluating, preparing, pricing and marketing a home for sale in St. Marys.',
 updated:'Reviewed October 2026',
 intro:'Selling a home in a smaller local market is not about copying a national checklist. The goal is to understand what buyers are choosing between, price the property appropriately and spend your preparation budget where it is most likely to help.',
 sections:[
  {heading:'Start with a home evaluation, not a list price',body:'Before deciding what to list for, have an agent walk through the property. A useful evaluation should consider condition, updates, layout, lot, basement, garage, outbuildings and any features that are unusual for the local market. The agent should then compare the property with recent closed sales and current competition.'},
  {heading:'A CMA should answer more than “what is my house worth?”',body:'You should come away with a realistic range, the strongest comparable sales, the current competing listings, the properties that failed to sell or took longer, and an explanation of how the agent adjusted for differences. If the value depends on repairs or updates, those should be discussed separately from the market value of the house as-is.'},
  {heading:'Do the repairs that matter',body:'Not every improvement produces a return. Prioritize safety issues, water intrusion, major deferred maintenance, obvious condition problems and inexpensive improvements that materially improve first impressions. An agent can help you distinguish between work that is likely to help and work that is simply spending money before a sale.'},
  {heading:'Price for the buyers you actually need',body:'The right price is not necessarily the highest number someone can imagine. Overpricing can reduce early activity and force a later price reduction. Underpricing can leave money on the table. The goal is a price supported by the evidence and appropriate for the property’s likely buyer pool.'},
  {heading:'Presentation and marketing matter',body:'Accurate photography, a clean presentation, useful property details and exposure to the right buyers all matter. Acreage, shops, unusual layouts and older homes often need more explanation than a standard subdivision house because buyers need to understand both the advantages and the tradeoffs.'},
  {heading:'Build a net-proceeds estimate',body:'The sale price is not the amount you take home. Before listing, estimate commissions or other compensation, title and closing costs, taxes and prorations, loan payoff, negotiated concessions and any agreed repair costs. A net sheet lets you compare different pricing strategies using the number that actually matters to you.'},
  {heading:'A good first step is simple',body:'If you are considering selling, schedule a home evaluation before you decide whether to list. We can look at the property, review the relevant sales and competition, identify what is worth addressing and give you a realistic range without requiring you to commit to putting the house on the market.'}
 ],
 sources:[
  {label:'NAR 2025 Profile of Home Buyers and Sellers',url:'https://www.nar.realtor/news/real-estate-news/nar-2025-profile-of-home-buyers-sellers-reveals-market-extremes'},
  {label:'Kansas real estate licensee duties, 2026 statutes',url:'https://www.kslegislature.gov/b2025_26/laws/058_000_0000_chapter/058_030_0000_article/058_030_0106_section/058_030_0106_k'}
 ]
},
{
 slug:'first-time-home-buyer-northeast-kansas',
 title:'Buying Your First Home in Northeast Kansas',
 category:'LOCAL BUYING',
 description:'A practical starting point for first-time buyers shopping in St. Marys, Wamego, Topeka, Manhattan and nearby communities.',
 updated:'Reviewed October 2026',
 intro:'Buying your first home gets easier when you separate the decisions. First establish a comfortable budget, then get financing lined up, then choose the areas and property types that fit your life.',
 sections:[
  {heading:'Set a comfortable payment, not just a maximum approval',body:'A lender’s preapproval tells you what you may be able to borrow. It does not tell you what monthly payment will feel comfortable after taxes, insurance, utilities, maintenance and other obligations. Build your own budget before choosing a price range.'},
  {heading:'Get preapproved and compare lenders',body:'A preapproval can help you shop realistically and show sellers that you are prepared to buy. The CFPB recommends comparing loan offers, not just choosing a lender based on the preapproval letter. Ask about the interest rate, lender fees, points, mortgage insurance and estimated cash to close.'},
  {heading:'Look at the whole property',body:'The purchase price is only part of the decision. Consider condition, taxes, insurance, utilities, future maintenance and the cost of improvements. A cheaper older home can require more cash after closing than a higher-priced house in better condition.'},
  {heading:'Do the inspection and understand the appraisal',body:'An inspection is for evaluating the physical condition of the property. An appraisal is a valuation used by the lender. They are different processes, and a problem found during an inspection does not automatically mean the appraised value will change.'},
  {heading:'Look into Kansas assistance programs',body:'The Kansas Housing Resources Corporation currently offers a First Time Homebuyer program for eligible buyers through participating lenders. The program can provide down-payment and closing-cost assistance, subject to income, location, purchase and program requirements. Check the current program rules rather than relying on an old grant amount or social-media post.'},
  {heading:'Use your agent for the local part',body:'A lender handles financing, but an agent can help you compare neighborhoods, properties, condition, taxes, rural utility questions, contract terms and the local resale market. Especially in smaller communities, that local context can matter as much as the online search results.'}
 ],
 sources:[...homebuyingSources,{label:'Kansas Housing Resources Corporation First Time Homebuyer',url:'https://kshousingcorp.org/homeownership/first-time-homebuyer/'}]
},
{
 slug:'buying-land-northeast-kansas',
 title:'Buying Land in Northeast Kansas',
 category:'LAND & ACREAGE',
 description:'Questions to answer before buying acreage, a homesite or investment land in Northeast Kansas.',
 updated:'Reviewed October 2026',
 intro:'Land can look simple on a listing sheet, but the details that determine its usefulness are often less obvious. Investigate the intended use, zoning, water, sanitation, access, floodplain, restrictions and future development path before making an offer.',
 sections:[
  {heading:'Confirm what you can do with it',body:'Check zoning, minimum tract sizes, subdivision rules, building restrictions and recorded covenants that could affect your plans. In Pottawatomie County A1 zoning, two non-farm dwellings are generally allowed per quarter-quarter, while additional residential development can trigger subdivision requirements, subject to the specific exceptions and current County review.'},
  {heading:'Investigate utilities',body:'Determine whether the property has public or rural water, electricity, sewer or septic options. Get actual service information rather than assuming nearby infrastructure can be extended at a reasonable cost.'},
  {heading:'Separate current use from future potential',body:'A parcel can be valuable for farming, recreation or a homesite without being a good development parcel. If the price depends on future division or additional homes, verify the development path with the applicable local authority before paying for that assumption.'},
  {heading:'Understand the market for land',body:'Land value can vary dramatically with tillable ground, pasture, timber, water, improvements, road frontage, views, building sites and development potential. Price per acre is a useful comparison tool, but it is not a valuation method by itself.'}
 ],
 sources:countySources
},
{
 slug:'five-acres-pottawatomie-county',
 title:'What Does 5 Acres Actually Get You in Pottawatomie County?',
 category:'LAND & ACREAGE',
 description:'Five acres can mean very different things depending on zoning, utilities, access and the property itself.',
 updated:'Reviewed October 2026',
 intro:'Five acres sounds straightforward, but acreage alone does not tell you whether a property is a good homesite, how many structures may be possible or what development work will be required.',
 sections:[
  {heading:'Acreage is only the starting point',body:'The usable portion of a parcel may be reduced by slopes, drainage, easements, setbacks, ponds, roads or required utility areas. Pottawatomie County subdivision regulations also include a 100-foot building setback from the thread of a stream, while individual zoning districts can impose additional setbacks.'},
  {heading:'Five acres is not a universal building guarantee',body:'In A1 agricultural zoning, the County generally uses 3 acres where rural water is available and 5 acres where an individual well is used, subject to water and sanitary requirements. That means a five-acre tract may satisfy an acreage threshold while still needing separate verification of water, septic, access, floodplain and setbacks.'},
  {heading:'How many homes?',body:'In A1, two non-farm dwellings are generally allowed per quarter-quarter section. Residential development beyond that can require subdivision and platting. If the property is being marketed as having development potential, verify the specific quarter-quarter, current dwelling count and County requirements rather than assuming the acreage tells the whole story.'},
  {heading:'Plan the entire site',body:'Before buying, sketch the likely home, driveway, septic area, outbuildings and other improvements. A parcel that looks large from the road may have fewer practical building options than expected.'}
 ],
 sources:countySources
}
];

export function getGuide(slug:string){return guides.find(g=>g.slug===slug);}
export {countySources};
