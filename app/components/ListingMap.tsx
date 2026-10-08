'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RESOProperty } from '../lib/mock-properties';

const TILE=256, MIN_ZOOM=6, MAX_ZOOM=14;
const DEFAULT={lat:39.22,lon:-96.02,zoom:9};
const SERVICE_AREA_DEFAULT={lat:39.1947,lon:-96.0715,zoom:12};
function project(lat:number,lon:number,zoom:number){const scale=TILE*Math.pow(2,zoom),safe=Math.max(-85.0511,Math.min(85.0511,lat)),sin=Math.sin(safe*Math.PI/180);return{x:((lon+180)/360)*scale,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale};}
function unproject(x:number,y:number,zoom:number){const scale=TILE*Math.pow(2,zoom),lon=x/scale*360-180,merc=.5-y/scale,lat=180/Math.PI*(2*Math.atan(Math.exp(merc*2*Math.PI))-Math.PI/2);return{lat,lon};}
function fitView(listings:RESOProperty[],width:number,height:number){const valid=listings.filter(p=>Number.isFinite(p.Latitude)&&Number.isFinite(p.Longitude)&&p.Latitude!==0&&p.Longitude!==0);if(!valid.length)return DEFAULT;const minLat=Math.min(...valid.map(p=>p.Latitude)),maxLat=Math.max(...valid.map(p=>p.Latitude)),minLon=Math.min(...valid.map(p=>p.Longitude)),maxLon=Math.max(...valid.map(p=>p.Longitude)),lat=(minLat+maxLat)/2,lon=(minLon+maxLon)/2;const paddingX=Math.max(72,width*.1),paddingY=Math.max(96,height*.14);for(let zoom=MAX_ZOOM;zoom>=MIN_ZOOM;zoom--){const a=project(minLat,minLon,zoom),b=project(maxLat,maxLon,zoom);const spanX=Math.abs(b.x-a.x),spanY=Math.abs(b.y-a.y);if(spanX<=Math.max(80,width-paddingX*2)&&spanY<=Math.max(80,height-paddingY*2))return{lat,lon,zoom};}return{lat,lon,zoom:MIN_ZOOM};}

export function ListingMap({listings,onSearchArea}:{listings:RESOProperty[];onSearchArea?: (bounds:{minLat:number;maxLat:number;minLon:number;maxLon:number})=>void}){
 const mapRef=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;cx:number;cy:number}|null>(null),pointers=useRef<Map<number,{x:number;y:number}>>(new Map()),pinch=useRef<{distance:number;zoom:number;cx:number;cy:number;worldX:number;worldY:number}|null>(null),wheelLock=useRef(false);
 const [size,setSize]=useState({width:1100,height:560}),[view,setView]=useState(()=>listings.length>1?SERVICE_AREA_DEFAULT:fitView(listings,1100,560)),[selected,setSelected]=useState<string|null>(null),[satellite,setSatellite]=useState(false),[moved,setMoved]=useState(false);
 const valid=listings.filter(p=>Number.isFinite(p.Latitude)&&Number.isFinite(p.Longitude)&&p.Latitude!==0&&p.Longitude!==0);
 useEffect(()=>{const el=mapRef.current;if(!el)return;const resize=()=>setSize({width:el.clientWidth,height:el.clientHeight});resize();const ro=new ResizeObserver(resize);ro.observe(el);return()=>ro.disconnect();},[]);
 const listingKey=useMemo(()=>valid.map(p=>p.ListingId).sort().join('|'),[valid]);
 useEffect(()=>{if(valid.length)setView(listings.length>1?SERVICE_AREA_DEFAULT:fitView(valid,size.width,size.height));},[listingKey,size.width,size.height,listings.length]);
 useEffect(()=>{const el=mapRef.current;if(!el)return;const onWheel=(e:WheelEvent)=>{e.preventDefault();e.stopPropagation();if(wheelLock.current)return;wheelLock.current=true;zoomBy(e.deltaY<0?1:-1,e.clientX,e.clientY);window.setTimeout(()=>{wheelLock.current=false},260);};el.addEventListener('wheel',onWheel,{passive:false});return()=>el.removeEventListener('wheel',onWheel);},[view,size.width,size.height]);
 const centerPoint=useMemo(()=>project(view.lat,view.lon,view.zoom),[view]);
 const tiles=useMemo(()=>{const tileZoom=view.zoom,ox=Math.floor(centerPoint.x/TILE),oy=Math.floor(centerPoint.y/TILE),dx=centerPoint.x-ox*TILE,dy=centerPoint.y-oy*TILE,max=Math.pow(2,tileZoom),left=Math.floor((centerPoint.x-size.width/2)/TILE)-1,right=Math.floor((centerPoint.x+size.width/2)/TILE)+1,top=Math.floor((centerPoint.y-size.height/2)/TILE)-1,bottom=Math.floor((centerPoint.y+size.height/2)/TILE)+1,out=[] as {key:string;x:number;y:number;tx:number;ty:number}[];for(let ty=top;ty<=bottom;ty++)for(let tx=left;tx<=right;tx++){if(ty>=0&&ty<max)out.push({key:String(tx)+'-'+String(ty),x:(tx-ox)*TILE-dx+size.width/2,y:(ty-oy)*TILE-dy+size.height/2,tx:((tx%max)+max)%max,ty});}return out;},[centerPoint,view.zoom,size.width,size.height]);
 const markerPositions=useMemo(()=>{const raw=valid.map(p=>{const point=project(p.Latitude,p.Longitude,view.zoom);return{left:point.x-centerPoint.x+size.width/2,top:point.y-centerPoint.y+size.height/2};});const out=[...raw];for(let i=0;i<raw.length;i++){const cluster=raw.map((p,j)=>({p,j})).filter(({p,j})=>j!==i&&Math.hypot(raw[i].left-p.left,raw[i].top-p.top)<46);const members=[i,...cluster.map(x=>x.j)].sort((a,b)=>a-b);if(members.length>1){const pos=members.indexOf(i),step=42,total=(members.length-1)*step;out[i].left+=(pos*step-total/2);}}return out;},[valid,view.zoom,centerPoint,size.width,size.height]);
 const tileUrl=satellite?'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile':'https://tile.openstreetmap.org';
 function zoomBy(delta:number,clientX?:number,clientY?:number){const next=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,view.zoom+delta));if(next===view.zoom)return;const rect=mapRef.current?.getBoundingClientRect(),px=clientX!==undefined&&rect?clientX-rect.left:size.width/2,py=clientY!==undefined&&rect?clientY-rect.top:size.height/2,world={x:centerPoint.x+px-size.width/2,y:centerPoint.y+py-size.height/2},ratio=Math.pow(2,next-view.zoom);const target={x:world.x*ratio-(px-size.width/2),y:world.y*ratio-(py-size.height/2)};setView(v=>({...v,...unproject(target.x,target.y,next),zoom:next}));setMoved(true);}
 function startDrag(e:React.PointerEvent<HTMLDivElement>){
  if((e.target as HTMLElement).closest('button,a'))return;
  e.preventDefault();
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  e.currentTarget.setPointerCapture(e.pointerId);
  if(pointers.current.size===2){
    drag.current=null;
    const pts=[...pointers.current.values()];
    const cx=(pts[0].x+pts[1].x)/2,cy=(pts[0].y+pts[1].y)/2;
    const distance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
    const rect=mapRef.current?.getBoundingClientRect();
    const fx=rect?cx-rect.left:size.width/2,fy=rect?cy-rect.top:size.height/2;
    pinch.current={distance,zoom:view.zoom,cx:fx,cy:fy,worldX:centerPoint.x+fx-size.width/2,worldY:centerPoint.y+fy-size.height/2};
  } else {
    drag.current={x:e.clientX,y:e.clientY,cx:centerPoint.x,cy:centerPoint.y};
  }
}
 function moveDrag(e:React.PointerEvent<HTMLDivElement>){
  if(!pointers.current.has(e.pointerId))return;
  e.preventDefault();
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.current.size>=2&&pinch.current){
    const pts=[...pointers.current.values()].slice(0,2);
    const distance=Math.max(1,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y));
    const rawZoom=pinch.current.zoom+Math.log2(distance/pinch.current.distance);
    // Raster tiles exist at integer zoom levels. Keep the map zoom integer so pinch gestures never request invalid fractional tile URLs.
    const nextZoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Math.round(rawZoom)));
    const ratio=Math.pow(2,nextZoom-pinch.current.zoom);
    const targetCenterX=pinch.current.worldX*ratio-(pinch.current.cx-size.width/2);
    const targetCenterY=pinch.current.worldY*ratio-(pinch.current.cy-size.height/2);
    const centerLatLon=unproject(targetCenterX,targetCenterY,nextZoom);
    setView(v=>({...v,...centerLatLon,zoom:nextZoom}));
    setMoved(true);
    return;
  }
  if(!drag.current)return;
  const x=drag.current.cx-(e.clientX-drag.current.x),y=drag.current.cy-(e.clientY-drag.current.y);
  setView(v=>({...v,...unproject(x,y,v.zoom)}));
  setMoved(true);
}
 function endDrag(e?:React.PointerEvent<HTMLDivElement>){
  if(e){
    pointers.current.delete(e.pointerId);
    if(mapRef.current?.hasPointerCapture(e.pointerId))mapRef.current.releasePointerCapture(e.pointerId);
  }
  if(pointers.current.size<2)pinch.current=null;
  if(pointers.current.size===1){
    const remaining=[...pointers.current.values()][0];
    drag.current={x:remaining.x,y:remaining.y,cx:centerPoint.x,cy:centerPoint.y};
  } else if(pointers.current.size===0)drag.current=null;
}
 function getBounds(){const topLeft=unproject(centerPoint.x-size.width/2,centerPoint.y-size.height/2,view.zoom),bottomRight=unproject(centerPoint.x+size.width/2,centerPoint.y+size.height/2,view.zoom);return{minLat:bottomRight.lat,maxLat:topLeft.lat,minLon:topLeft.lon,maxLon:bottomRight.lon};}\n function reset(){setView(listings.length>1?SERVICE_AREA_DEFAULT:fitView(valid,size.width,size.height));setSelected(null);setMoved(false);}
 return <section className="listing-map-wrap">
  <div className="listing-map-heading"><div><p className="eyebrow">{listings.length === 1 ? 'PROPERTY LOCATION' : 'ACTIVE LISTINGS'}</p><h3>{listings.length === 1 ? 'Property location.' : 'Explore homes on the map.'}</h3></div><p>{valid.length} {valid.length===1?'listing':'listings'} shown. Drag, zoom, or switch to satellite.</p></div>
  <div className="listing-map-shell"><div className="listing-map" ref={mapRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
   <div className="listing-map-tiles">{tiles.map(t=><img key={t.key} src={satellite?`${tileUrl}/${view.zoom}/${t.ty}/${t.tx}`:`${tileUrl}/${view.zoom}/${t.tx}/${t.ty}.png`} alt="" draggable={false} style={{left:t.x,top:t.y}} />)}</div>
   {satellite&&<div className="listing-map-labels" aria-hidden="true">{tiles.map(t=><img key={`label-${t.key}`} src={`https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${view.zoom}/${t.ty}/${t.tx}`} alt="" draggable={false} style={{left:t.x,top:t.y}} />)}</div>}
   <div className="listing-map-markers">{valid.map((p,i)=>{const {left,top}=markerPositions[i],active=selected===p.ListingId;return <button key={p.ListingId} type="button" className={`listing-marker${active?' is-selected':''}`} style={{left,top}} onPointerDown={e=>e.stopPropagation()} onClick={()=>setSelected(active?null:p.ListingId)} aria-label={`View ${p.StreetNumber} ${p.StreetName}`}><span>{Math.round(p.ListPrice/1000)}K</span></button>})}</div>
   <div className="listing-map-topbar"><div className="listing-map-mode"><button className={!satellite?'is-active':''} onClick={()=>setSatellite(false)}>Map</button><button className={satellite?'is-active':''} onClick={()=>setSatellite(true)}>Satellite</button></div><button className="listing-map-reset" onClick={reset}>Reset view</button></div>
   <div className="listing-map-controls"><button onClick={()=>zoomBy(1)} aria-label="Zoom in">+</button><button onClick={()=>zoomBy(-1)} aria-label="Zoom out">−</button></div>
   {moved&&<div className="listing-map-action-buttons"><button className="listing-map-search-area" onClick={()=>{onSearchArea?.(getBounds());setMoved(false);}}>Search this area</button><button className="listing-map-recenter" onClick={reset}>⌖ Recenter</button></div>}
   {selected&&(()=>{const p=valid.find(x=>x.ListingId===selected);if(!p)return null;return <div className="listing-map-card"><button className="listing-map-card-close" onClick={()=>setSelected(null)} aria-label="Close">×</button><Link href={`/listings/${p.ListingId}`} className="listing-map-card-link"><div className="listing-map-card-image">{p.Media[0]?.MediaURL ? <img src={`/api/mls-image?url=${encodeURIComponent(p.Media[0].MediaURL)}`} alt="" /> : <div className="listing-map-card-image-empty" />}</div><div className="listing-map-card-body"><p className="eyebrow">FOR SALE</p><strong>{p.ListPrice.toLocaleString()}</strong><span>{p.StreetNumber} {p.StreetName}, {p.City}</span><span>{p.BedroomsTotal} beds · {p.BathroomsTotalInteger} baths · {p.LivingArea.toLocaleString()} sq ft</span><span className="listing-map-card-cta">View property →</span></div></Link></div>})()}
   <div className="listing-map-attribution">{satellite?'© Esri, Maxar, Earthstar Geographics, and the GIS User Community':'© OpenStreetMap contributors'}</div>
  </div></div>
  <style>{`.listing-map-wrap{margin-top:0}.listing-map-heading{display:flex;align-items:end;justify-content:space-between;gap:30px;margin:0 8px 22px;padding:0}.listing-map-heading h3{font-family:var(--serif);font-size:36px;line-height:1.05;font-weight:400;letter-spacing:-.03em;margin:0}.listing-map-heading>p{max-width:420px;margin:0;color:var(--muted);font-size:13px;text-align:right;line-height:1.5}.listing-map-shell{border:1px solid rgba(15,20,71,.13);border-radius:8px;box-shadow:0 10px 28px rgba(15,20,71,.08);overflow:hidden;background:#e8ebef}.listing-map{height:580px;position:relative;overflow:hidden;touch-action:none;overscroll-behavior:contain;cursor:grab;background:#e8ebef;user-select:none}.listing-map:active{cursor:grabbing}.listing-map-tiles,.listing-map-labels{position:absolute;inset:0;overflow:hidden}.listing-map-tiles img,.listing-map-labels img{position:absolute;width:${TILE}px;height:${TILE}px;max-width:none;user-select:none;pointer-events:none}.listing-map-labels{z-index:2}.listing-map-markers{position:absolute;inset:0;z-index:4;pointer-events:none}.listing-marker{position:absolute;transform:translate(-50%,-50%)!important;pointer-events:auto;border:0!important;background:#e4002b!important;color:#fff;border-radius:9px!important;padding:0 5px!important;min-width:42px!important;width:42px!important;height:18px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;box-shadow:0 1px 2px rgba(0,0,0,.14)!important;font-family:Arial,sans-serif;font-size:10px;font-weight:700;line-height:18px;letter-spacing:0;cursor:pointer;white-space:nowrap;writing-mode:horizontal-tb!important;rotate:0deg!important;transition:background .12s,box-shadow .12s}.listing-marker span{display:block!important;width:100%;line-height:18px!important;text-align:center!important;white-space:nowrap!important;transform:none!important;rotate:0deg!important}.listing-marker:hover,.listing-marker.is-selected{transform:translate(-50%,-50%)!important;background:#c90025!important;box-shadow:0 2px 4px rgba(0,0,0,.18)!important;z-index:10}.listing-map-topbar{position:absolute;left:18px;right:18px;top:18px;display:flex;justify-content:space-between;align-items:center;z-index:7;pointer-events:none}.listing-map-mode,.listing-map-reset{pointer-events:auto;background:#fff;border:1px solid rgba(15,20,71,.14);box-shadow:0 3px 10px rgba(15,20,71,.12)}.listing-map-mode{display:flex;padding:3px}.listing-map-mode button{border:0;background:transparent;color:var(--navy);padding:9px 14px;font-size:11px;font-weight:800;cursor:pointer}.listing-map-mode button.is-active{background:var(--navy);color:#fff}.listing-map-reset{border:0;color:var(--navy);padding:10px 14px;font-size:11px;font-weight:800;cursor:pointer}.listing-map-controls{position:absolute;right:18px;top:78px;z-index:7;display:flex;flex-direction:column;box-shadow:0 3px 10px rgba(15,20,71,.12)}.listing-map-controls button{width:42px;height:42px;border:0;border-bottom:1px solid rgba(15,20,71,.1);background:#fff;color:var(--navy);font-size:21px;cursor:pointer}.listing-map-action-buttons{position:absolute;right:18px;bottom:38px;z-index:7;display:flex;gap:8px;align-items:center}.listing-map-search-area,.listing-map-recenter{border:0;background:#fff;color:var(--navy);padding:10px 13px;box-shadow:0 3px 10px rgba(15,20,71,.12);font-size:11px;font-weight:800;cursor:pointer}.listing-map-recenter{position:static;z-index:7;border:0;background:#fff;color:var(--navy);padding:10px 13px;box-shadow:0 3px 10px rgba(15,20,71,.12);font-size:11px;font-weight:800;cursor:pointer}.listing-map-card{position:absolute;left:18px;bottom:18px;width:min(350px,calc(100% - 36px));background:#fff;z-index:8;box-shadow:0 14px 38px rgba(15,20,71,.22);border:1px solid rgba(15,20,71,.14)}.listing-map-card-link{display:block;color:inherit;text-decoration:none}.listing-map-card-link:hover .listing-map-card-cta{text-decoration:underline}.listing-map-card-image{height:145px;background:#eee;overflow:hidden}.listing-map-card-image img{width:100%;height:100%;object-fit:cover;display:block}.listing-map-card-body{padding:15px 17px 17px;display:flex;flex-direction:column;gap:3px}.listing-map-card-body .eyebrow{margin:0 0 3px;font-size:8px}.listing-map-card-body strong{font-family:var(--serif);font-size:25px;font-weight:400}.listing-map-card-body span{font-size:12px;color:var(--muted)}.listing-map-card-cta{margin-top:9px;color:var(--navy)!important;font-size:11px!important;font-weight:800}.listing-map-card-close{position:absolute;right:8px;top:8px;z-index:2;width:30px;height:30px;border:0;background:#fff;color:var(--navy);font-size:20px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}.listing-map-attribution{position:absolute;right:6px;bottom:5px;z-index:6;background:rgba(255,255,255,.84);padding:2px 5px;color:#344054;font-size:9px;pointer-events:none}@media(max-width:700px){.listing-map-heading{display:block;margin:0 2px 16px}.listing-map-heading>p{text-align:left;margin-top:8px}.listing-map-heading h3{font-size:30px}.listing-map{height:460px}.listing-map-topbar{left:10px;right:10px;top:10px}.listing-map-controls{right:10px;top:65px}.listing-map-action-buttons{right:10px;bottom:28px}.listing-map-action-buttons .listing-map-search-area,.listing-map-action-buttons .listing-map-recenter{padding:9px 10px}.listing-map-card{left:10px;bottom:10px;width:min(330px,calc(100% - 20px))}.listing-map-card-image{height:115px}}`}</style>
 </section>;
}