import { NextResponse } from 'next/server'; import { getListings } from '../../lib/listings';
export async function GET(){return NextResponse.json({value:await getListings(),count:(await getListings()).length});}
/* GO LIVE: This route is the only listing data endpoint the UI needs.
   1. Obtain IDX approval + RESO Web API credentials separately from Sunflower MLS and FHAR MLS.
   2. Add server-only env vars: SUNFLOWER_RESO_URL, SUNFLOWER_RESO_TOKEN, FHAR_RESO_URL, FHAR_RESO_TOKEN.
   3. Replace getListings() with Promise.all() calls to each board's OData/RESO Property endpoint, using server-side fetch only.
   4. Normalize both responses to RESOProperty, preserve source, merge/dedupe, and cache/revalidate appropriately.
   5. Existing Easy Agent Pro credentials do not automatically transfer. Never expose credentials via NEXT_PUBLIC_*.
*/
