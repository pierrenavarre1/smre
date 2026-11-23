'use client';
import {useEffect} from 'react';
import {track} from '@vercel/analytics';

export function ListingViewTracker({listingId,city,propertyType}:{listingId:string;city:string;propertyType:string}){
 useEffect(()=>{track('Listing View',{listingId,propertyType});},[listingId,city,propertyType]);
 return null;
}
