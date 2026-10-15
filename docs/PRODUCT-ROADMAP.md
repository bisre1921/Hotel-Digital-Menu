# Menu platform: delivery plan

Audience: Ethiopian cafes, restaurants and hotels. Product name remains provisional.
The guest experience stays simple: scan, see categories and prices, choose a dish.
Advanced modules are optional. No feature below is considered delivered merely because a competitor advertises it.

## First implementation: foundations and reviewed imports

Implemented in this change:

- No hardcoded JWT signing fallback; missing/short secrets prevent signing.
- Destination category ownership checked when updating dishes.
- Media signatures checked; SVG uploads rejected; safe extensions derived from MIME types.
- Weekly analytics aggregate all qualifying events rather than an initial 200.
- Photo/PDF extraction adapter using configurable server-side credentials and structured output.
- Text import works without an AI provider. Explicit headings and delimited prices are recommended.
- Original file previews, editable categories/names/descriptions/prices, missing-price indicators.
- Per-item review, final approval, atomic creation as an unpublished menu.
- Session-scoped recovery of extracted rows; original files are not retained on the server.
- Idempotent commit: retries with the same import ID do not create duplicate menus.
- Five files / 10 MB total / 200 items per import; 20 photo/PDF extraction attempts per business per rolling day.
- New QR exports use `/q/{menuId}`. The resolver checks publication on every request and redirects without caching.
- Business subdomain root routing and a published-menu selector using the existing business slug.

External setup still needed: real domain + wildcard DNS/HTTPS; extraction key and model.
Live AI extraction requires evaluation on real Amharic/English menus before commercial rollout.
Legacy printed slug-based codes cannot be made rename-proof retroactively. Reissue permanent codes.

## Release 1: launch-quality menus

Remaining:

- Broaden hotel-specific onboarding, profile forms and homepage copy to all business types.
- Additional templates remain future work. The default guest menu now implements the supplied index2.html: dark phone-width page, cream compact photo cards, orange category pills and bottom-sheet item details.
- Persist item sizes/variants and localized name/description fields; editable manual translations.
- Guest language switch, search, fasting/dietary filters; never infer allergens from a dish name.
- Subdomain claim/rename validation, reserved names, preview of the public address.
- Default menu selection and scheduled breakfast/lunch/dinner menus.
- Durable cloud media adapter and media ownership records; remove silent cloud-to-local fallback in production.
- Role permissions, auth rate limits, import source/review audit records, monitoring, tested backups.
- Stable QR usage across all creation paths, printable table artwork and legacy migration guidance.
- Move tracked local secrets out of version control through a reviewed repository cleanup; rotate exposed credentials.

Acceptance: a new owner can create a business, import a real menu, correct prices, preview,
publish and download a permanent QR. A second business cannot access or modify its data.
The guest menu is readable on a low-end phone and useful before photos finish loading.

## Release 2: differentiation

- Compare revised menu imports with existing items: additions, price changes, proposed removals.
  Never delete an item based only on absence in a partial upload. Approve a change set atomically.
- Budget meal builder using available items, explicit charges and owner-approved combinations.
  Owner-entered portion guidance; no invented suitability or portion counts.
- Telegram merchant linking with short-lived verification, scoped permissions and confirm-before-write.
- Guest cafe subscriptions, unsubscribe controls, offer scheduling and staff-confirmed redemption.
- Voice editing only after testing transcription quality and confirming every proposed mutation.

Acceptance: owner can compare and approve a revised menu without duplicate items. Guests receive
valid combinations within their budget. Owners can trace edits and offer redemptions.

## Release 3: ordering and payments

- Table codes, carts, modifiers, order lifecycle and waiter confirmation.
- Kitchen/bar/barista routing, role-specific dashboards, reconnection and duplicate prevention.
- Provider-backed local payments with verified webhooks and idempotent reconciliation.
- Bill splitting, receipts, refunds/cancellations and printer integration where supported.
- Multi-branch operational permissions and reporting.

Acceptance: simulated network retries do not duplicate orders or charges. A client screenshot or
browser redirect never marks an order paid. Failed payments and unavailable items have recoverable flows.
Requires merchant credentials, provider support checks and staffed pilots before rollout.

## Release 4: growth and platform operations

- Loyalty, private feedback, permission-based campaigns, actual sales/return-visit reporting.
- Subscription billing, plan entitlements, customer support tools and custom-domain verification.
- Shared discovery only after sufficient local venue density and verified current menu data.

## Pilot and commercial gates

Start with five businesses in one area; include a cafe, restaurant and multi-menu hotel.
Measure onboarding completion, time to correct imports, guest usability, support burden and willingness to pay.
Measure actual sales only where orders/redemptions are captured; views are not sales.
The prior $20–$35/month estimate covers a lean menu service, not AI, messaging, payment processing,
high availability, customer support or the full operations platform. Recalculate before each release.
