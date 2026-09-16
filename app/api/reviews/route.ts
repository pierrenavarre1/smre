import { NextResponse } from 'next/server';

type Review = { author:string; rating:number; text:string; relativeTime?:string; id?:string };

async function getAccessToken(){
  const refreshToken=process.env.GOOGLE_BUSINESS_REFRESH_TOKEN;
  const clientId=process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret=process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
  if(!refreshToken || !clientId || !clientSecret) return null;
  const response=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:'refresh_token'}),
    cache:'no-store',
  });
  if(!response.ok) return null;
  const data=await response.json();
  return data.access_token as string || null;
}

async function getAllBusinessProfileReviews():Promise<Review[]|null>{
  const accountId=process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId=process.env.GOOGLE_BUSINESS_LOCATION_ID;
  const token=await getAccessToken();
  if(!accountId || !locationId || !token) return null;

  const reviews:Review[]=[];
  let pageToken='';
  for(let page=0;page<20;page++){
    const params=new URLSearchParams({pageSize:'50',orderBy:'updateTime desc'});
    if(pageToken) params.set('pageToken',pageToken);
    const response=await fetch(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?${params.toString()}`,{
      headers:{Authorization:`Bearer ${token}`},
      cache:'no-store',
    });
    if(!response.ok) return null;
    const data=await response.json();
    const ratingMap:any={STAR_RATING_UNSPECIFIED:0,ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5};
    for(const r of data.reviews || []){
      const rating=typeof r.starRating==='number'?r.starRating:(ratingMap[r.starRating] || 5);
      const createTime=r.createTime ? new Date(r.createTime) : null;
      reviews.push({
        id:r.name,
        author:r.reviewer?.displayName || 'Google reviewer',
        rating,
        text:r.comment || '',
        relativeTime:createTime ? createTime.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '',
      });
    }
    pageToken=data.nextPageToken || '';
    if(!pageToken) break;
  }
  return reviews;
}

async function getPlacesFallback(){
  const key=process.env.GOOGLE_PLACES_API_KEY;
  const placeId=process.env.GOOGLE_PLACE_ID || 'ChIJ4Uo61nlgvocR5W-xo_H_xJk';
  if(!key) return null;
  try{
    const response=await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,{
      headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'reviews,rating,userRatingCount,googleMapsUri'},
      next:{revalidate:3600},
    });
    if(!response.ok) return null;
    const data=await response.json();
    const reviews=(data.reviews||[]).map((r:any)=>({
      id:r.name,
      author:r.authorAttribution?.displayName || 'Google reviewer',
      rating:r.rating || 5,
      text:r.text?.text || '',
      relativeTime:r.relativePublishTimeDescription || '',
    }));
    return {rating:data.rating||0,userRatingCount:data.userRatingCount||0,googleMapsUri:data.googleMapsUri||'',reviews};
  }catch{return null;}
}

export async function GET(){
  try{
    const allReviews=await getAllBusinessProfileReviews();
    if(allReviews){
      const average=allReviews.length ? allReviews.reduce((sum,r)=>sum+r.rating,0)/allReviews.length : 0;
      return NextResponse.json({rating:Number(average.toFixed(1)),userRatingCount:allReviews.length,googleMapsUri:'https://www.google.com/maps/place/?q=place_id:ChIJ4Uo61nlgvocR5W-xo_H_xJk',reviews:allReviews,live:true});
    }
    const fallback=await getPlacesFallback();
    if(fallback) return NextResponse.json({...fallback,live:false});
    return NextResponse.json({reviews:[],error:'Google Business Profile review access is not configured.'},{status:200});
  }catch(error){
    console.error('Google review fetch failed',error);
    return NextResponse.json({reviews:[],error:'Unable to load Google reviews.'},{status:200});
  }
}
