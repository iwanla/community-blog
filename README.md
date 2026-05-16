# JelajahTaliabu

JelajahTaliabu is a community blog for sharing stories, travel guides, culture, food, local news, and citizen experiences from Taliabu Island.

The platform is designed as a serverless application on the Cloudflare ecosystem:

- Visitors can browse approved articles.
- Community members can submit articles with a cover image.
- Submitted articles stay pending until an admin approves them.
- Admins can approve, reject, or soft-delete submissions.
- Telegram notifications can be sent when a new submission arrives.

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Static HTML, CSS, JavaScript | Public pages, article submission, admin dashboard |
| Hosting | Cloudflare Pages | Static frontend hosting |
| API | Cloudflare Workers | Serverless backend API |
| Router | Hono | Lightweight Worker routing |
| Database | Cloudflare D1 | Posts, categories, audit logs |
| Storage | Cloudflare R2 | Cover image storage |
| Notifications | Telegram Bot API | Admin notification for new submissions |
| Deployment | Wrangler | Worker, D1, and R2 management |

## Repository Structure

```text
.
├── frontend/
│   ├── index.html          # Homepage: article list, search, category filter
│   ├── article.html        # Article detail page
│   ├── submit.html         # Community article submission form
│   ├── admin.html          # Admin moderation dashboard
│   ├── css/
│   │   └── style.css       # Shared frontend stylesheet
│   └── js/
│       ├── api.js          # All frontend API calls
│       ├── i18n.js         # ID/EN translation utilities
│       ├── nav.js          # Shared nav and mobile drawer behavior
│       ├── home.js         # Homepage behavior
│       ├── article.js      # Article detail behavior
│       ├── submit.js       # Submit form validation and upload flow
│       └── admin.js        # Admin dashboard behavior
│
├── worker/
│   ├── src/
│   │   ├── index.ts        # Worker entry point
│   │   ├── routes/         # Public and admin API routes
│   │   ├── services/       # D1, R2, and Telegram service logic
│   │   └── utils/          # Auth, validation, slug, rate limit helpers
│   ├── migrations/
│   │   └── 0001_init.sql   # Initial D1 schema and category seed data
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml
│
└── README.md
```

## Features

- Public article listing with category filtering.
- Public article detail page.
- Community article submission with cover image upload.
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
ASSET_PUBLIC_BASE_URL=http://localhost:8787/assets

# Optional: only needed when testing real Telegram notifications.
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
```

This file is intentionally ignored by Git.

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

### 4. Start the Frontend

Use a static server instead of opening files through `file://`.

```bash
cd frontend
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173/index.html
http://localhost:5173/submit.html
http://localhost:5173/admin.html
```

### 5. Local API URL

For local end-to-end testing, `frontend/js/api.js` must point to the local Worker:

```js
const API_BASE_URL = "http://localhost:8787";
```

Before production deployment, this must point to the deployed Worker URL or be changed to environment-aware logic.

## Development Workflow

Recommended local test flow:

1. Start the Worker API.
2. Start the frontend static server.
3. Open `submit.html`.
4. Submit an article with a valid cover image.
5. Open `admin.html`.
6. Use the local admin token:

```text
local-admin-token
```

7. Confirm the article appears in the pending list.
8. Approve the article.
9. Open `index.html` and confirm the article appears publicly.
10. Open the article detail page.

Additional cases to test:

- Empty required fields.
- Content shorter than 150 characters.
- Invalid image type.
- Image larger than 2 MB.
- Language switcher with `?lang=id` and `?lang=en`.
- Mobile navigation drawer.
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
GET /api/posts/:slug
```

Returns one approved post by slug.

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
```

### Admin Endpoints

Admin requests require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

```http
GET /api/admin/posts/pending
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
worker/migrations/0001_init.sql
```

Tables:

- `posts`
- `categories`
- `audit_logs`

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
ASSET_PUBLIC_BASE_URL=http://localhost:8787/assets
```

Optional:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Production

Use Cloudflare secrets for sensitive values:

```bash
cd worker
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Non-secret values such as `ASSET_PUBLIC_BASE_URL` can be configured in `wrangler.toml` under `[vars]`.

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
5. Configure `ASSET_PUBLIC_BASE_URL`.
6. Apply remote migrations:

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

1. Ensure `frontend/js/api.js` points to the deployed Worker API.
2. Confirm the Worker CORS configuration allows the frontend origin.
3. Deploy the `frontend/` directory as a static site.
4. Test the full submit and moderation flow in production.

## Quality Checks

Worker type check:

```bash
cd worker
npm run typecheck
```

Frontend JavaScript syntax checks:

```bash
node --check frontend/js/api.js
node --check frontend/js/nav.js
node --check frontend/js/home.js
node --check frontend/js/article.js
node --check frontend/js/submit.js
node --check frontend/js/admin.js
node --check frontend/js/i18n.js
```

Ensure all frontend `fetch()` calls stay centralized in `frontend/js/api.js`:

```bash
rg -n "fetch\\(" frontend
```

Expected result:

```text
frontend/js/api.js
```

## Security Notes

- Never hardcode production secrets in frontend or source files.
- Keep admin endpoints protected with `Authorization: Bearer <ADMIN_TOKEN>`.
- Do not expose pending, rejected, or deleted posts through public endpoints.
- Validate all submit inputs on the Worker, not only in the browser.
- Keep `worker/.dev.vars` out of Git.
- Use audit logs for admin moderation actions.

## Current Deployment Readiness Notes

The project is close to deployment, but verify these items before production:

- `frontend/js/api.js` must not point to `http://localhost:8787` in production.
- `worker/wrangler.toml` must use the real Cloudflare D1 `database_id`.
- `ASSET_PUBLIC_BASE_URL` must be configured for production image URLs.
- Production Cloudflare secrets must be set.
- Remote D1 migrations must be applied.

## License

No license has been declared yet.
