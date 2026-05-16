# Deployment

This project deploys two separate targets:

- Frontend: static files in `frontend/` deployed to Cloudflare Pages.
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

## Frontend Deploy

The detected Cloudflare Pages project is:

```text
jelajah-taliabu
```

Deploy from the repository root:

```bash
cd /Users/iwanlaudin/Development/community-blog
./worker/node_modules/.bin/wrangler pages deploy frontend --project-name jelajah-taliabu
```

Alternative from `worker/`:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npx wrangler pages deploy ../frontend --project-name jelajah-taliabu
```

After deploy, verify the frontend:

```bash
curl -I https://jelajah-taliabu.pages.dev/
curl -I https://jelajah-taliabu.pages.dev/robots.txt
curl -I https://jelajah-taliabu.pages.dev/sitemap.xml
```

Before deploying frontend, make sure `frontend/robots.txt` and `frontend/sitemap.xml` use the final production domain.

## Worker API Deploy

Run a typecheck first:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run typecheck
```

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

## D1 Migrations

Apply local migrations:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run db:migrate:local
```

Apply remote migrations:

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npm run db:migrate:remote
```

Remote migrations affect the production D1 database configured in `worker/wrangler.toml`.

## Required Secrets

Set secrets with Wrangler. Do not commit these values.

```bash
cd /Users/iwanlaudin/Development/community-blog/worker
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are optional for basic API operation, but Telegram notifications will be skipped without them.

## Production Bindings

Configured in `worker/wrangler.toml`:

- Worker name: `jelajah-blog-api`
- D1 binding: `DB`
- D1 database: `jelajah_blog`
- R2 binding: `BUCKET`
- R2 bucket: `jelajah-blog-assets`
- Asset base URL: `ASSET_PUBLIC_BASE_URL`

The frontend reads the production API from `frontend/js/api.js`.

## Post-Deploy Checklist

- Homepage loads articles without console API errors.
- `submit.html` can submit a valid article with a JPG, PNG, or WebP cover under 2 MB.
- `admin.html` can load pending posts with a valid admin token.
- Approving a post makes it visible on the homepage.
- Article detail page loads by slug.
- Cover images load from the Worker `/assets/*` route.
- `robots.txt` and `sitemap.xml` point to the correct production frontend domain.
