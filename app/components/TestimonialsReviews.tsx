'use client';
import {useEffect,useState} from 'react';
type Review={author:string;rating:number;text:string;relativeTime?:string};
type Data={rating?:number;userRatingCount?:number;reviews?:Review[]};
export function TestimonialsReviews(){
 const [data,setData]=useState<Data>({}); const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/reviews',{cache:'no-store'}).then(r=>r.json()).then(setData).catch(()=>setData({reviews:[]})).finally(()=>setLoading(false));},[]);
 const reviews=data.reviews||[];
 if(loading)return <div className="review-loading">Loading reviews…</div>;
 if(!reviews.length)return <div className="review-loading">Google reviews are temporarily unavailable. <a href="https://www.google.com/maps/place/?q=place_id:ChIJ4Uo61nlgvocR5W-xo_H_xJk" target="_blank" rel="noreferrer">Read all reviews on Google.</a></div>;
 return <><div className="testimonials-summary">{data.rating ? <><strong>{data.rating.toFixed(1)}</strong><span>★ ★ ★ ★ ★</span></> : null}{data.userRatingCount ? <small>{data.userRatingCount} Google reviews</small> : null}</div><div className="about-review-grid">{reviews.map((review,i)=><blockquote key={review.author+'-'+i}><div className="stars">{'★'.repeat(Math.max(0,Math.round(review.rating)))}</div><span className="review-quote-text">{review.text ? `“${review.text}”` : '5-star Google review'}</span><cite>— {review.author}{review.relativeTime ? ` · ${review.relativeTime}` : ''}</cite></blockquote>)}</div><div className="testimonials-google-link"><a href="https://www.google.com/maps/place/?q=place_id:ChIJ4Uo61nlgvocR5W-xo_H_xJk" target="_blank" rel="noreferrer">Read all reviews on Google</a></div></>;
}
