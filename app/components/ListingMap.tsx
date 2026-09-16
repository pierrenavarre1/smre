'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { RESOProperty } from '../lib/mock-properties';

const TILE=256;
const FALLBACK={lat:39.22,lon:-96.02,zoom:9};
function project(lat:number,lon:number,zoom:number){
  const scale=TILE*Math.pow(2,zoom);
  const safe=Math.max(-85,Math.min(85,lat));
  const sin=Math.sin(safe*Math.PI/180);
  return {x:((lon+180)/360)*scale,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale};
}
function fitView(listings:RESOProperty[],width:number,height:number){
  const valid=listings.filter(p=>Number.isFinite(p.Latitude)&&Number.isFinite(p.Longitude)&&p.Latitude!==0&&p.Longitude!==0);
  if(!valid.length)return FALLBACK;
  const minLat=Math.min(...valid.map(p=>p.Latitude)),maxLat=Math.max(...valid.map(p=>p.Latitude));
  const minLon=Math.min(...valid.map(p=>p.Longitude)),maxLon=Math.max(...valid.map(p=>p.Longitude));
  const latPad=Math.max((maxLat-minLat)*.18,.025),lonPad=Math.max((maxLon-minLon)*.18,.035);
  const lat=(minLat+maxLat)/2,lon=(minLon+maxLon)/2;
  for(let zoom=13;zoom>=7;zoom--){
    const a=project(minLat-latPad,minLon-lonPad,zoom),b=project(maxLat+latPad,maxLon+lonPad,zoom);
    if(Math.abs(b.x-a.x)<=width*.82&&Math.abs(b.y-a.y)<=height*.72)return {lat,lon,zoom};
  }
  return {lat,lon,zoom:7};
}

export function ListingMap({listings}:{listings:RESOProperty[]}){
  const [size,setSize]=useState({width:1100,height:560});
  const [view,setView]=useState(()=>fitView(listings,1100,560));
  const [selected,setSelected]=useState<string|null>(null);
  const drag=useRef<{x:number;y:number;cx:number;cy:number}|null>(null);
  const centerPoint=useMemo(()=>project(view.lat,view.lon,view.zoom),[view]);
  const tiles=useMemo(()=>{
    const originX=Math.floor(centerPoint.x/TILE),originY=Math.floor(centerPoint.y/TILE);
    const offsetX=centerPoint.x-originX*TILE,offsetY=centerPoint.y-originY*TILE;
    const out=[] as {key:string;x:number;y:number;tx:number;ty:number}[];
    const range=4,max=Math.pow(2,view.zoom);
    for(let y=-range;y<=range;y++)for(let x=-range;x<=range;x++){
      const tx=originX+x,ty=originY+y;
      if(ty<0||ty>=max)continue;
      out.push({key:`${tx}-${ty}`,x:x*TILE-offsetX+size.width/2,y:y*TILE-offsetY+size.height/2,tx:((tx%max)+max)%max,ty});
    }
    return out;
  },[centerPoint,view.zoom,size.width,size.height]);

  function startDrag(e:React.PointerEvent<HTMLDivElement>){
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current={x:e.clientX,y:e.clientY,cx:centerPoint.x,cy:centerPoint.y};
  }
  function moveDrag(e:React.PointerEvent<HTMLDivElement>){
    if(!drag.current)return;
    const scale=TILE*Math.pow(2,view.zoom);
    const nextX=drag.current.cx-(e.clientX-drag.current.x),nextY=drag.current.cy-(e.clientY-drag.current.y);
    const lon=nextX/scale*360-180,merc=.5-nextY/scale;
    const lat=180/Math.PI*(2*Math.atan(Math.exp(merc*2*Math.PI))-Math.PI/2);
    setView(v=>({...v,lat:Math.max(-85,Math.min(85,lat)),lon:((lon+540)%360)-180}));
  }
  function zoomBy(delta:number){
    setView(v=>({...v,zoom:Math.max(7,Math.min(13,v.zoom+delta))}));
  }
  function reset(){setView(fitView(listings,size.width,size.height));setSelected(null)}

  const valid=listings.filter(p=>Number.isFinite(p.Latitude)&&Number.isFinite(p.Longitude)&&p.Latitude!==0&&p.Longitude!==0);
  return <section className="listing-map-wrap">
    <div className="listing-map-toolbar">
      <div><p className="eyebrow">ACTIVE LISTINGS</p><h3>Find a home on the map.</h3><span>{valid.length} active {valid.length===1?'listing':'listings'} shown</span></div>
      <div className="listing-map-controls"><button type="button" onClick={()=>zoomBy(1)} aria-label="Zoom in">+</button><button type="button" onClick={()=>zoomBy(-1)} aria-label="Zoom out">−</button><button type="button" className="map-reset" onClick={reset}>Reset</button></div>
    </div>
    <div className="listing-map" ref={el=>{if(el){const rect=el.getBoundingClientRect();if(rect.width&&Math.abs(rect.width-size.width)>2)setSize({width:rect.width,height:Math.max(460,Math.min(620,window.innerWidth<700?460:560))})}}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
      <div className="listing-map-tiles">{tiles.map(t=><img key={t.key} src={`https://tile.openstreetmap.org/${view.zoom}/${t.tx}/${t.ty}.png`} alt="" draggable={false} style={{left:t.x,top:t.y}} />)}</div>
      <div className="listing-map-markers">{valid.map(p=>{const point=project(p.Latitude,p.Longitude,view.zoom),left=point.x-centerPoint.x+size.width/2,top=point.y-centerPoint.y+size.height/2,active=selected===p.ListingId;return <button key={p.ListingId} type="button" className={`listing-marker${active?' is-selected':''}`} style={{left,top}} onPointerDown={e=>e.stopPropagation()} onClick={()=>setSelected(active?null:p.ListingId)} aria-label={`Show ${p.StreetNumber} ${p.StreetName}`}><span>$</span></button>})}</div>
      {selected&&(()=>{const p=valid.find(x=>x.ListingId===selected);if(!p)return null;return <div className="listing-map-card"><button type="button" className="listing-map-card-close" onClick={()=>setSelected(null)} aria-label="Close">×</button><p className="eyebrow">FOR SALE</p><strong>${p.ListPrice.toLocaleString()}</strong><span>{p.StreetNumber} {p.StreetName}, {p.City}</span><span>{p.BedroomsTotal} beds · {p.BathroomsTotalInteger} baths · {p.LivingArea.toLocaleString()} sq ft</span><Link href={`/listings/${p.ListingId}`}>View listing →</Link></div>})()}
      <div className="listing-map-hint">Drag to explore · Scroll to zoom</div><div className="listing-map-attribution">© OpenStreetMap contributors</div>
    </div>
  </section>;
}
