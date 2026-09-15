# SMRE

Production-oriented Next.js App Router real estate site for St. Mary’s Real Estate. The current listing layer uses typed mock RESO-shaped data so the UI can be developed before MLS credentials are approved.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel

Import the GitHub repository into Vercel or connect it through the Vercel dashboard. The project uses standard Next.js build detection. Add server-only environment variables before enabling live integrations.

Recommended variables:

- `SUNFLOWER_RESO_URL`
- `SUNFLOWER_RESO_TOKEN`
- `FHAR_RESO_URL`
- `FHAR_RESO_TOKEN`
- `FUB_API_KEY`
- `FUB_API_URL` (optional; defaults to the documented FUB API base in the route comment)

Never prefix MLS or FUB credentials with `NEXT_PUBLIC_`.

## MLS go-live sequence

1. Obtain IDX approval and RESO Web API credentials from **Sunflower MLS** and **FHAR MLS**. Existing Easy Agent Pro credentials do not automatically transfer.
2. Store credentials as Vercel environment variables.
3. Add small server-only RESO clients for each board. Fetch the `Property` resource, normalize fields to `RESOProperty`, preserve the `MlsSource`, and merge/dedupe the feeds.
4. Replace the implementation of `getListings()` in `app/lib/listings.ts` while keeping the same return type. The frontend should not need to change.
5. Review each board's current IDX rules, required logos/attribution, permitted fields, photo rules, refresh requirements, and display language with the MLS before production launch.

## Compliance

Listing detail pages include a reusable MLS disclosure/attribution block. FHAR Section 1.20 is addressed by keeping MLS photos as standalone media and never compositing an agent, office, logo, headshot, or other branding over MLS imagery. Any FHAR watermark already present in an image is preserved. Sunflower MLS display/social-sharing requirements must be confirmed against the current board rules before launch.

## FUB leads

`POST /api/leads` accepts contact, valuation, and chat leads. The route is intentionally server-side and includes the exact insertion point for the Follow Up Boss API call. Valuation requests are treated as manual CMA leads rather than automated valuation estimates.

## Scope intentionally deferred

No buyer accounts, saved searches, alerts, automated AVM, blog, community guides, buyer/seller guides, or staging content are included in this core build.
