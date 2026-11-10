'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ReviewText({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const check = () => { if (!expanded) setCanExpand(node.scrollHeight > node.clientHeight + 2); };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children, expanded]);

  return <div className="review-text-wrap">
    <div ref={contentRef} className={`review-expandable-text ${expanded ? 'is-expanded' : ''}`}>{children}</div>
    {canExpand && <button type="button" className="review-expand-toggle" onClick={() => setExpanded(value => !value)}>{expanded ? 'See less' : 'See more'}</button>}
  </div>;
}
