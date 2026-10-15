# Item details, ratings and pagination

The guest item dialog is a bottom-anchored sheet at all viewport sizes, with spring opening,
animated closing, a grab handle, drag-down dismissal, tap/drag-up expansion, scrollable content,
Escape/backdrop dismissal, native focus containment/return and reduced-motion support.
Drag starts from the handle so normal content scrolling and video controls remain usable.
The close button and keyboard controls provide alternatives to gestures.

Menus show five dishes per page; changing category/search/dietary filters resets the page.
Each published active dish accepts a public name, whole-star rating (1–5) and review text (5–1500 characters).
Review lists show five entries per page with deterministic ordering and an average across all reviews.
There is no purchase verification: these are guest reviews, not verified-purchase reviews.

A random HTTP-only browser cookie is hashed on the server. One stored vote per dish/browser can be
updated after a 30-second cooldown; this is not proof of a person's identity. Private visitor/client
hashes never appear in public API responses. The proxy must overwrite x-forwarded-for for the
per-source allowance (10 recent reviews/hour) to be meaningful. Cookie clearing can bypass browser
identity. Review moderation, abuse reporting and authenticated purchases remain future work.
Text is rendered as escaped React text, not HTML. No IP address is stored, only a keyed source hash.

## Database deployment

`ItemReview` is an additive Prisma model. Generate the client and apply the schema to your chosen database
before deploying this code:

```bash
npm run prisma:generate
npm run prisma:push
```

This change was applied only to the isolated local demo database. Existing customer databases were not altered.
Production migration history should be baselined before switching this repository's db-push workflow to migrate deploy.

## Verification

Unit validation covers rating ranges, text limits and page bounds. The opt-in HTTP suite verifies
review persistence, aggregates, pagination without overlap, duplicate/update behavior, source checks,
private-field exclusion and publication guards. Browser QA submits a clearly labeled demo review.
