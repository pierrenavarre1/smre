'use client';

import { useEffect, useRef, useState } from 'react';

type Review = { author:string; rating:number; text:string; relativeTime?:string };

const fallback: Review[] = [
  {author:'Google review',rating:5,text:'Amazing experience, great customer service!'},
  {author:'Google review',rating:5,text:'Joseph was our realtor that sold our home.'},
  {author:'Google review',rating:5,text:'Highly suggest this company if you are looking for an honest realtor team!!!'},
];

export function ReviewsCarousel(){
  const [reviews,setReviews]=useState<Review[]>(fallback);
  const [index,setIndex]=useState(0);
  const [visible,setVisible]=useState(false);
  const ref=useRef<HTMLElement|null>(null);

  useEffect(()=>{
    fetch('/api/reviews').then(r=>r.ok?r.json():null).then(data=>{
      if(data?.reviews?.length) setReviews(data.reviews);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    const node=ref.current;
    if(!node) return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.35});
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(!visible || reviews.length<2) return;
    const timer=window.setInterval(()=>setIndex(i=>(i+1)%reviews.length),5500);
    return()=>window.clearInterval(timer);
  },[visible,reviews.length]);

  const review=reviews[index%reviews.length];
  return <section ref={ref} className="reviews-section section container" aria-label="Client reviews">
    <div className="reviews-head"><div><p className="eyebrow">CLIENT REVIEWS</p><h2>What clients have said.</h2></div><div className="reviews-rating"><strong>5.0</strong><span>★ ★ ★ ★ ★</span><small>Google reviews</small></div></div>
    <div className="review-stage">
      <button className="review-arrow" aria-label="Previous review" onClick={()=>setIndex(i=>(i-1+reviews.length)%reviews.length)}>←</button>
      <blockquote key={index} className="review-quote"><div className="stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}</div><p>“{review.text}”</p><footer>{review.author}{review.relativeTime?` · ${review.relativeTime}`:''}</footer></blockquote>
      <button className="review-arrow" aria-label="Next review" onClick={()=>setIndex(i=>(i+1)%reviews.length)}>→</button>
    </div>
    <div className="review-dots" aria-hidden="true">{reviews.slice(0,8).map((_,i)=><span key={i} className={i===index%Math.min(reviews.length,8)?'active':''}/>)}</div>
  </section>;
}
