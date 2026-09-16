'use client';

import { useEffect, useRef, useState } from 'react';

type Review = { author:string; rating:number; text:string; relativeTime?:string };

type ReviewResponse = { rating?:number; userRatingCount?:number; reviews?:Review[] };

export function ReviewsCarousel(){
  const [data,setData]=useState<ReviewResponse>({});
  const [index,setIndex]=useState(0);
  const [visible,setVisible]=useState(false);
  const ref=useRef<HTMLElement|null>(null);

  useEffect(()=>{
    fetch('/api/reviews').then(r=>r.ok?r.json():null).then((result:ReviewResponse|null)=>{
      if(result) setData(result);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    const node=ref.current;
    if(!node) return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.35});
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);

  const reviews=data.reviews || [];

  useEffect(()=>{
    if(!visible || reviews.length<2) return;
    const timer=window.setInterval(()=>setIndex(i=>(i+1)%reviews.length),5500);
    return()=>window.clearInterval(timer);
  },[visible,reviews.length]);

  const review=reviews[index%Math.max(reviews.length,1)];
  const rating=data.rating || 0;

  return <section ref={ref} className="reviews-section section container" aria-label="Google client reviews">
    <div className="reviews-head">
      <div><p className="eyebrow">CLIENT REVIEWS</p><h2>What clients have said.</h2></div>
      <div className="reviews-rating"><strong>{rating ? rating.toFixed(1) : '—'}</strong><span>★ ★ ★ ★ ★</span><small>{data.userRatingCount ? `${data.userRatingCount} Google reviews` : 'Google reviews'}</small></div>
    </div>
    {review ? <>
      <div className="review-stage">
        <button className="review-arrow" aria-label="Previous review" onClick={()=>setIndex(i=>(i-1+reviews.length)%reviews.length)}>←</button>
        <blockquote key={index} className="review-quote"><div className="stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0,Math.round(review.rating)))}</div><p>“{review.text}”</p><footer>{review.author}{review.relativeTime?` · ${review.relativeTime}`:''}</footer></blockquote>
        <button className="review-arrow" aria-label="Next review" onClick={()=>setIndex(i=>(i+1)%reviews.length)}>→</button>
      </div>
      <div className="review-dots" aria-hidden="true">{reviews.map((_,i)=><span key={i} className={i===index?'active':''}/>)}</div>
      <div className="reviews-source"><a href="https://www.google.com/maps/place/?q=place_id:ChIJ4Uo61nlgvocR5W-xo_H_xJk" target="_blank" rel="noreferrer">Read all reviews on Google</a></div>
    </> : <div className="review-loading">Loading Google reviews…</div>}
  </section>;
}
