# Reviewed imports and business domains

## Try an import

Sign in, open **Menus → Import existing menu**. The paste-text option works without API credentials:

```text
# Breakfast
ፉል / Ful | With bread | 180
Egg sandwich | 220
# Drinks
Coffee | 80
```

The parser accepts explicit `Name | Description | Price` or `Name | Price` rows.
Unknown prices remain empty. Check every item and approve the review to save an unpublished menu.
The editor provides preview and publishing separately. Sizes can be named as separate rows for now;
native variants, paired translation fields and revised-menu diffing are planned, not implemented.

Extracted review data is stored in sessionStorage for this business, on this browser tab.
Original files use temporary object URLs and must be reattached after a refresh. Closing the tab loses
the unsaved review. Saving an import creates all categories/items in one database transaction.

## Photo and PDF extraction

Configure server environment variables, then restart the app:

```env
OPENAI_API_KEY="your-server-only-key"
OPENAI_MENU_MODEL="your-enabled-vision-and-structured-output-model"
```

Choose a model supporting Responses API image/PDF input and strict JSON schema output.
The adapter uses `POST https://api.openai.com/v1/responses` and `store: false`.
No original is saved in the application's media library. Uploaded content is sent to OpenAI;
provider retention policies still apply. No external API call is needed for text imports.
Extraction attempts, including provider failures, count toward the daily allowance.
The deployment proxy must also enforce a request body limit (about 11 MB); Content-Length alone
does not protect against oversized chunked uploads. Configure runtime timeouts for 90 seconds.

References:
- https://developers.openai.com/api/docs/guides/file-inputs
- https://developers.openai.com/api/docs/guides/structured-outputs

## Business addresses

Set these consistently at build and runtime:

```env
NEXT_PUBLIC_APP_URL="https://yourbrand.com"
NEXT_PUBLIC_ROOT_DOMAIN="yourbrand.com"
```

Configure wildcard DNS and HTTPS for `*.yourbrand.com`, pointing to this same deployment.
`{business.slug}.yourbrand.com` shows that business's published menus. The root domain and
reserved labels (app, admin, www, api, etc.) retain the main app. Unknown businesses return 404.
Direct `/business/{slug}` links also work. Subdomain ownership is currently based on the existing
business slug; a self-service address picker and custom customer domains are future work.

For local verification set the root to `localhost` and request the app with a business Host header.
There is no DNS provider automation in this implementation.

## Permanent QR codes

New codes encode the canonical app URL plus `/q/{menuId}`. This endpoint looks up the current
published slug, sends a temporary no-store redirect and attaches `source=qr` for analytics.
Unpublished or deleted menus return 404. Existing printed `/menu/{slug}` codes still depend on
their original slug: download and reprint permanent codes before renaming an old menu.

## Verification

```bash
npm run prisma:generate
npx tsx --test tests/critical-workflows.test.ts tests/menu-import.test.ts
npm run build
```

For opt-in HTTP integration tests, run a separate app server and test process with the same isolated
`DATABASE_URL` and `JWT_SECRET`. Configure the app's root domain as localhost for the host-routing test:

```bash
RUN_HTTP_TESTS=1 TEST_APP_URL=http://localhost:3107 npx tsx --test tests/http-workflows.test.ts
```

The HTTP suite creates two uniquely named test businesses and deletes only its own fixtures.
The older database suite still requires the demo seed. Do not run a seed against a real customer database.


If a development server is already running from this checkout, isolate verification artifacts:

```bash
NEXT_DIST_DIR=.next-qa NEXT_PUBLIC_ROOT_DOMAIN=localhost NEXT_PUBLIC_APP_URL=http://localhost:3107 npm run build
NEXT_DIST_DIR=.next-qa NEXT_PUBLIC_ROOT_DOMAIN=localhost npm run start -- --port 3107
```

Both commands must also receive the same isolated database URL and signing secret when testing.
Keep your existing development database environment unchanged. Next may add its generated QA
Typescript directory to tsconfig during a build; it is not needed for ordinary development.
