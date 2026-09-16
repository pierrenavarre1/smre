import { NextResponse } from 'next/server';

type Review = { author:string; rating:number; text:string; relativeTime?:string };

const googleFallback:Review[]=[
  {author:'Google reviewer',rating:5,text:'Amazing experience, great customer service!'},
  {author:'Google reviewer',rating:5,text:'Highly suggest this company if you are looking for an honest realtor team!!!'},
  {author:'Google reviewer',rating:5,text:'Joseph was our realtor that sold our home.'},
];

export async function GET(){
  const key=process.env.GOOGLE_PLACES_API_KEY;
  const placeId=process.env.GOOGLE_PLACE_ID || 'ChIJ4Uo61nlgvocR5W-xo_H_xJk';

  if(!key){
    return NextResponse.json({rating:5,userRatingCount:26,reviews:googleFallback,googleMapsUri:`https://www.google.com/maps/place/?q=place_id:${placeId}`,live:false});
  }

  try{
    const response=await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,{
      headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'reviews,rating,userRatingCount,googleMapsUri'},
      next:{revalidate:3600},
    });
    if(response.ok){
      const data=await response.json();
      const reviews=(data.reviews||[]).map((r:any)=>({
        author:r.authorAttribution?.displayName || 'Google reviewer',
        rating:r.rating || 5,
        text:r.text?.text || '',
        relativeTime:r.relativePublishTimeDescription || '',
      })).filter((r:Review)=>r.text);
      if(reviews.length){
        return NextResponse.json({rating:data.rating||0,userRatingCount:data.userRatingCount||0,googleMapsUri:data.googleMapsUri||`https://www.google.com/maps/place/?q=place_id:${placeId}`,reviews,live:true});
      }
    }
  }catch{}

  return NextResponse.json({rating:5,userRatingCount:26,reviews:googleFallback,googleMapsUri:`https://www.google.com/maps/place/?q=place_id:${placeId}`,live:false});
}
