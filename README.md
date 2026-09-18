# JelajahTaliabu

 <p align="center">
    <img src="frontend/public/assets/img/readme-banner.png" alt="JelajahTaliabu" height="300" />
</p>

JelajahTaliabu is a community blog for sharing stories, travel guides, culture, food, local news, and citizen experiences from Taliabu Island.

The platform is designed as a serverless application on the Cloudflare ecosystem:

- Visitors can browse approved articles.
- Visitors can see a backend-selected featured article.
- Visitors can add article views and like/dislike reactions.
- Community members can submit articles with a cover image.
- Submitted articles stay pending until an admin approves them.
- Admins can approve, reject, or soft-delete submissions.
- Telegram notifications can be sent when a new submission arrives.

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Vite, Vue 3, Vue Router | Public pages, article submission, admin dashboard |
| Hosting | Cloudflare Pages | Static frontend hosting |
| API | Cloudflare Workers | Serverless backend API |
| Router | Hono | Lightweight Worker routing |
| Database | Cloudflare D1 | Posts, categories, audit logs |
| Storage | Cloudflare R2 | Cover image storage |
| Anti-abuse | Cloudflare Turnstile | Submission verification |
| Notifications | Telegram Bot API | Admin notification for new submissions |
| Deployment | Wrangler | Worker, D1, and R2 management |

## Repository Structure

```text
.
├── frontend/
│   ├── index.html          # Vite app shell
│   ├── package.json        # Vue/Vite frontend scripts
│   ├── public/             # Static assets copied as-is to dist
│   └── src/
│       ├── views/          # Home, article, submit, admin routes
│       ├── components/     # Shared layout components
│       ├── services/api.ts # All frontend API calls
│       ├── i18n/           # ID/EN translation utilities
│       └── utils/          # Content sanitizer and helpers
│
├── worker/
│   ├── src/
│   │   ├── index.ts        # Worker entry point
│   │   ├── routes/         # Public and admin API routes
│   │   ├── services/       # D1, R2, and Telegram service logic
│   │   └── utils/          # Auth, validation, slug, rate limit helpers
│   ├── migrations/         # D1 schema, categories, reactions, view logs
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml
│
└── README.md
```

## Features

- Public article listing with category filtering.
- Backend-selected featured article using `views + likes * 5`.
- Public article detail page.
- Article view tracking and like/dislike reactions.
- Community article submission with cover image upload and Turnstile verification.
- Server-side validation for required fields, content length, image type, and image size.
- Pending moderation workflow.
- Admin approval, rejection, and soft delete.
- Audit logs for admin actions.
- Optional Telegram notification for new submissions.
- Indonesian and English frontend i18n support.

## Requirements

- Node.js 20 or newer.
- npm.
- Cloudflare account.
- Wrangler CLI, installed through the Worker package dependencies.

Install Worker dependencies:

```bash
cd worker
npm install
```

## Local Development

### 1. Configure Local Worker Variables

Create `worker/.dev.vars`:

```env
ADMIN_TOKEN=local-admin-token
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Optional: only needed when testing real Telegram notifications.
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
```

This file is intentionally ignored by Git.

You can start from the example file:

```bash
cd worker
cp .dev.vars.example .dev.vars
```

### 2. Apply Local D1 Migrations

```bash
cd worker
npm run db:migrate:local
```

This creates the local D1 schema and inserts the default categories:

```text
Wisata, Budaya, Kuliner, Sejarah, Berita Lokal, Cerita Warga, UMKM, Politik
```

### 3. Start the Worker API

```bash
cd worker
npm run dev -- --port 8787
```

The local API should be available at:

```text
http://localhost:8787
```

Health check:

```bash
curl http://localhost:8787/
```

Expected response:

```json
{"ok":true,"service":"jelajah-blog-api"}
```

### 4. Install and Start the Frontend

Vite serves the Vue SPA locally.

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:5173/
http://localhost:5173/submit
http://localhost:5173/admin
```

### 5. Local API URL

For local end-to-end testing, the frontend automatically uses the local Worker when hosted on `localhost`:

```text
http://localhost:8787
```

Override it with `VITE_API_BASE_URL` when needed.

Create `frontend/.env.local` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

## Development Workflow

Recommended local test flow:

1. Start the Worker API.
2. Start the frontend static server.
3. Open `/submit`.
4. Submit an article with a valid cover image.
5. Open `/admin`.
6. Use the local admin token:

```text
local-admin-token
```

7. Confirm the article appears in the pending list.
8. Approve the article.
9. Open `/` and confirm the article appears publicly.
10. Confirm the featured article section renders.
11. Open the article detail page.
12. Confirm view tracking and reactions update counters.

Additional cases to test:

- Empty required fields.
- Content shorter than 150 characters.
- Invalid image type.
- Image larger than 2 MB.
- Language switcher with `?lang=id` and `?lang=en`.
- Mobile navigation drawer.
- Featured article ordering when views and likes change.
- Admin reject and delete actions.

## API Overview

Base URL:

```text
Local:      http://localhost:8787
Production: https://api.jelajahtaliabu.workers.dev
```

### Public Endpoints

```http
GET /api/posts?page=1&limit=10&category=wisata
```

Returns approved posts only.

```http
GET /api/posts/featured
```

Returns one approved post ordered by:

```text
views + (likes * 5), then approved_at/created_at newest first
```

```http
GET /api/posts/:slug
```

Returns one approved post by slug.

```http
POST /api/posts/:slug/view
```

Tracks one view per request fingerprint.

```http
POST /api/posts/:slug/react
Content-Type: application/json
```

Body:

```json
{
  "type": "like"
}
```

`type` can be `like`, `dislike`, or `none`.

```http
GET /api/categories
```

Returns the category list.

```http
POST /api/posts
Content-Type: multipart/form-data
```

Fields:

```text
title
content
excerpt
authorName
authorEmail
categoryId
location
coverImage
cf-turnstile-response
```

### Admin Endpoints

Admin requests require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

```http
GET /api/admin/posts/pending
GET /api/admin/posts/reviewed?page=1&limit=10
PATCH /api/admin/posts/:id/approve
PATCH /api/admin/posts/:id/reject
DELETE /api/admin/posts/:id
```

Reject body:

```json
{
  "reason": "Content is incomplete"
}
```

## Database

The D1 schema is defined in:

```text
worker/migrations/
```

Tables:

- `posts`
- `categories`
- `audit_logs`
- `reactions`
- `view_logs`

`posts` stores denormalized engagement counters:

```text
views
likes
dislikes
```

`view_logs` and `reactions` provide basic duplicate protection by request fingerprint. The counters on `posts` are used for fast public reads and featured article scoring.

Public queries must only expose posts with:

```sql
status = 'approved'
```

Valid moderation statuses:

```text
pending
approved
rejected
deleted
```

## Image Upload Rules

Cover image uploads are validated in the Worker.

- Maximum file size: 2 MB.
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- Video upload is not supported.

R2 object keys follow this pattern:

```text
posts/{post_id}/cover-{timestamp}.{extension}
```

## Environment Variables

### Local

Use `worker/.dev.vars`:

```env
ADMIN_TOKEN=local-admin-token
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Optional:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Use `frontend/.env.local` for the frontend:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

Do not put `ADMIN_TOKEN`, `TURNSTILE_SECRET_KEY`, Telegram tokens, or other private values in `frontend/.env.local`. Vite exposes `VITE_*` values to the browser bundle, so the frontend may only use public values such as `VITE_API_BASE_URL` and `VITE_TURNSTILE_SITE_KEY`.

### Production

Use Cloudflare secrets for sensitive values:

```bash
cd worker
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

For Cloudflare Pages, configure the frontend environment variable:

```env
VITE_API_BASE_URL=https://jelajah-blog-api.iwanlaudin01.workers.dev
VITE_TURNSTILE_SITE_KEY=<public-turnstile-site-key>
```

## Deployment

### Worker Deployment Checklist

Before deploying the Worker:

1. Create a Cloudflare D1 database.
2. Replace the placeholder in `worker/wrangler.toml`:

```toml
database_id = "YOUR_D1_DATABASE_ID"
```

3. Create or configure the R2 bucket:

```toml
bucket_name = "jelajah-blog-assets"
```

4. Configure production secrets.
5. Apply remote migrations:

```bash
cd worker
npm run db:migrate:remote
```

7. Deploy:

```bash
npm run deploy
```

### Frontend Deployment Checklist

Before deploying the frontend to Cloudflare Pages:

1. Set `VITE_API_BASE_URL` and `VITE_TURNSTILE_SITE_KEY` in Cloudflare Pages environment variables.
2. Confirm the Worker CORS configuration allows the frontend origin.
3. Deploy the `frontend/` directory as a static site.
4. Test the full submit and moderation flow in production.

## Quality Checks

Worker type check:

```bash
cd worker
npm run typecheck
```

Frontend type check and build:

```bash
cd frontend
npm run typecheck
npm run build
```

Ensure all frontend `fetch()` calls stay centralized in `frontend/src/services/api.ts`:

```bash
rg -n "fetch\\(" frontend
```

Expected result:

```text
frontend/src/services/api.ts
```

## Security Notes

- Never hardcode production secrets in frontend or source files.
- Keep admin endpoints protected with `Authorization: Bearer <ADMIN_TOKEN>`.
- Do not expose pending, rejected, or deleted posts through public endpoints.
- Validate all submit inputs on the Worker, not only in the browser.
- Verify Turnstile tokens on the Worker before accepting public submissions.
- Treat view/reaction fingerprints as duplicate-prevention signals, not authentication.
- Keep `worker/.dev.vars` out of Git.
- Use audit logs for admin moderation actions.

## Current Deployment Readiness Notes

The project is close to deployment, but verify these items before production:

- `VITE_API_BASE_URL` must point to the deployed Worker API in production.
- `worker/wrangler.toml` must use the real Cloudflare D1 `database_id`.
- Production Cloudflare secrets must be set.
- `VITE_TURNSTILE_SITE_KEY` must be configured in Cloudflare Pages.
- Remote D1 migrations must be applied.

## License

No license has been declared yet.
