export const MLS_OFFICE = 'St. Mary’s Real Estate';
export const MLS_PHONE = '(785) 465-2543';

export function mlsSourceLabel(source: string){ return source || 'Applicable MLS'; }

export const MLSDisclosure = ({ source, asOf }: { source?: string; asOf?: string }) => <div className="mls-disclosure">
  <div className="mls-grid-source"><strong>Listings courtesy of {mlsSourceLabel(source || 'the applicable MLS')} as distributed by MLS GRID.</strong><span className="mls-grid-wordmark" aria-label="MLS GRID">MLS GRID</span></div>
  <p>Based on information submitted to the MLS GRID as of {asOf || 'the date and time the MLS GRID data was obtained'}. All data is obtained from various sources and may not have been verified by broker or MLS GRID. Supplied Open House Information is subject to change without notice. All information should be independently reviewed and verified for accuracy. Properties may or may not be listed by the office/agent presenting the information.</p>
  <p>IDX information is provided exclusively for consumers’ personal, noncommercial use and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing. The data is deemed reliable but is not guaranteed by MLS GRID.</p>
  <p>MLS GRID and applicable MLS trademarks, logos, and attribution remain the property of their respective owners.</p>
</div>;

export const SourceBadge=({source}:{source:string})=><span className="source-badge">{source}</span>;

export const IDXUseNotice = () => <div className="idx-use-notice">
  <strong>MLS GRID IDX listings</strong>
  <span>Listings courtesy of the applicable MLS as distributed by MLS GRID. Information is provided for consumers’ personal, noncommercial use.</span>
</div>;
