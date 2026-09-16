import { NextResponse } from 'next/server';

export async function GET(){
  const key=process.env.GOOGLE_PLACES_API_KEY;
  const placeId=process.env.GOOGLE_PLACE_ID || 'ChIJ4Uo61nlgvocR5W-xo_H_xJk';
  if(!key) return NextResponse.json({reviews:[]});

  try{
    const response=await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,{
      headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'reviews,rating,userRatingCount'},
      next:{revalidate:3600},
    });
    if(!response.ok) return NextResponse.json({reviews:[]},{status:200});
    const data=await response.json();
    const reviews=(data.reviews||[]).filter((r:any)=>r.rating>=4).map((r:any)=>({
      author:r.authorAttribution?.displayName || 'Google reviewer',
      rating:r.rating || 5,
      text:r.text?.text || '',
      relativeTime:r.relativePublishTimeDescription || '',
    })).filter((r:any)=>r.text);
    return NextResponse.json({rating:data.rating||5,userRatingCount:data.userRatingCount||0,reviews});
  }catch{
    return NextResponse.json({reviews:[]},{status:200});
  }
}
