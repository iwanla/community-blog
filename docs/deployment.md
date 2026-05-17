# Deployment

This project deploys two separate targets:

- Frontend: Vite/Vue app in `frontend/` built to `frontend/dist` and deployed to Cloudflare Pages.
- API: Cloudflare Worker in `worker/` deployed with Wrangler.

## Prerequisites

- Node.js 22 or newer.
- npm.
- Cloudflare account access for the Pages project and Worker.
- Wrangler dependencies installed in `worker/`.

Install dependencies if needed:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm install
```

Confirm the active Node version:

```bash
node -v
```

If Wrangler asks for login:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npx wrangler login
```

## Recommended Deploy Order

Deploy in this order so the frontend build points to a verified API URL:

1. Configure Worker secrets.
2. Apply remote D1 migrations.
3. Deploy and verify the Worker API.
4. Configure the Cloudflare Pages `VITE_API_BASE_URL`.
5. Build and deploy the frontend.

## Worker API Deploy

Run a typecheck first:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run typecheck
```

Set required Worker secrets. Do not commit these values.

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

`TURNSTILE_SECRET_KEY` must be the production secret key for the Turnstile widget configured for `jelajahtaliabu.web.id`. `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are optional for basic API operation, but Telegram notifications will be skipped without them.

Apply remote D1 migrations:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run db:migrate:remote
```

Remote migrations affect the production D1 database configured in `worker/wrangler.toml`.

Deploy the Worker:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run deploy
```

Verify the deployed API:

```bash
curl https://jelajah-blog-api.iwanlaudin01.workers.dev/
curl "https://jelajah-blog-api.iwanlaudin01.workers.dev/api/posts?page=1&limit=10"
```

Expected health response:

```json
{"ok":true,"service":"jelajah-blog-api"}
```

## Frontend Build And Deploy

The detected Cloudflare Pages project is:

```text
jelajah-taliabu
```

Cloudflare Pages settings:

```text
Build command: npm run build
Build output directory: dist
Root directory: frontend
```

Set the Pages build-time API URL before deploying the frontend:

```bash
cd /Users/iwanlaudin/Development/community-blog/frontend
npx wrangler pages secret put VITE_API_BASE_URL --project-name jelajah-taliabu
```

When prompted for the value, enter the deployed Worker URL:

```text
https://jelajah-blog-api.iwanlaudin01.workers.dev
```

Set the production Turnstile site key for the frontend:

```bash
cd /Users/iwanlaudin/Development/community-blog/frontend
npx wrangler pages secret put VITE_TURNSTILE_SITE_KEY --project-name jelajah-taliabu
```

When prompted, enter the production Turnstile site key for `jelajahtaliabu.web.id`. Do not use Cloudflare's test key `1x00000000000000000000AA` in production.

Although Wrangler stores this as a Pages secret, `VITE_API_BASE_URL` is still embedded in the browser bundle by Vite. Only use it for public values such as the API base URL. Never put `ADMIN_TOKEN` or Telegram tokens in frontend env variables.

For manual deploy, build first:

```bash
cd /Users/iwanlaudin/Development/community-blog/frontend
npm install
npm run build
```

Deploy from the frontend directory so Wrangler can detect both `dist/` and `functions/`:

```bash
cd /Users/iwanlaudin/Development/community-blog/frontend
../worker/node_modules/.bin/wrangler pages deploy dist --project-name jelajah-taliabu
```

Or with `npx` from the same `frontend/` directory:

```bash
cd /Users/iwanlaudin/Development/community-blog/frontend
npx wrangler pages deploy dist --project-name jelajah-taliabu
```

`frontend/functions/posts/[slug].js` injects per-article OpenGraph/Twitter metadata for `/posts/:slug`. Running deploy from `frontend/` keeps the Pages Functions directory in the expected location.

Alternative from the repository root:

```bash
cd /Users/iwanlaudin/Development/community-blog
./worker/node_modules/.bin/wrangler pages deploy frontend/dist --project-name jelajah-taliabu
```

Use the alternative only for static-only deploys; it can miss Pages Functions depending on Wrangler/project configuration.

After deploy, verify the frontend:

```bash
curl -I https://jelajahtaliabu.web.id/
curl -I https://jelajahtaliabu.web.id/robots.txt
curl -I https://jelajahtaliabu.web.id/sitemap.xml
```

Before deploying frontend, make sure `frontend/public/robots.txt` and `frontend/public/sitemap.xml` use the final production domain.

## D1 Migrations

Apply local migrations:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run db:migrate:local
```

For production, apply remote migrations from the Worker deploy section before deploying the Worker.

## Production Bindings

Configured in `worker/wrangler.toml`:

- Worker name: `jelajah-blog-api`
- D1 binding: `DB`
- D1 database: `jelajah_blog`
- R2 binding: `BUCKET`
- R2 bucket: `jelajah-blog-assets`
- Asset base URL: `ASSET_PUBLIC_BASE_URL`

The frontend reads the production API from `frontend/src/services/api.ts`. Set `VITE_API_BASE_URL` in Cloudflare Pages environment variables when the Worker URL changes.

## Post-Deploy Checklist

- Homepage loads articles without console API errors.
- `/submit` can submit a valid article with a JPG, PNG, or WebP cover under 2 MB.
- `/admin` can load pending posts with a valid admin token.
- Approving a post makes it visible on the homepage.
- Article detail page loads by slug.
- Cover images load from the Worker `/assets/*` route.
- `robots.txt` and `sitemap.xml` point to the correct production frontend domain.
