import { NextResponse } from 'next/server';

type Review = { author:string; rating:number; text:string; relativeTime?:string; id?:string };

async function getPlacesReviews(){
  const key=process.env.GOOGLE_PLACES_API_KEY;
  const placeId=process.env.GOOGLE_PLACE_ID || 'ChIJ4Uo61nlgvocR5W-xo_H_xJk';
  if(!key) return null;

  try{
    const response=await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
      {
        headers:{
          'X-Goog-Api-Key':key,
          'X-Goog-FieldMask':'reviews,rating,userRatingCount,googleMapsUri',
        },
        next:{revalidate:3600},
      }
    );

    if(!response.ok){
      console.error('Google Places request failed',response.status,await response.text());
      return null;
    }

    const data=await response.json();
    const reviews=(data.reviews||[]).map((r:any)=>({
      id:r.name,
      author:r.authorAttribution?.displayName || 'Google reviewer',
      rating:r.rating || 5,
      text:r.text?.text || '',
      relativeTime:r.relativePublishTimeDescription || '',
    }));

    return {
      rating:data.rating||0,
      userRatingCount:data.userRatingCount||0,
      googleMapsUri:data.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      reviews,
    };
  }catch(error){
    console.error('Google Places review fetch failed',error);
    return null;
  }
}

export async function GET(){
  try{
    const reviews=await getPlacesReviews();

    if(reviews){
      return NextResponse.json({...reviews,live:true});
    }

    return NextResponse.json(
      {reviews:[],error:'Google Places review access is not configured.'},
      {status:200}
    );
  }catch(error){
    console.error('Google review fetch failed',error);
    return NextResponse.json(
      {reviews:[],error:'Unable to load Google reviews.'},
      {status:200}
    );
  }
}
