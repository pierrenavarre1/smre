/**
 * Keep preview deployments on their own Blob namespace. Preview and production
 * currently share a Vercel Blob token, so every MLS object path must pass here.
 * Production paths intentionally remain unchanged.
 */
export function mlsBlobPath(pathname: string) {
  const clean = pathname.replace(/^\/+/, '');
  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview/mls-incremental-sync-preview/' + clean;
  }
  return clean;
}
