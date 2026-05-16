# Architecture

JelajahTaliabu is a serverless community blog for stories, tourism, culture, food, local news, and citizen submissions from Taliabu Island.

## System Overview

```text
Browser
  |
  | static HTML/CSS/JS
  v
Cloudflare Pages
  |
  | fetch() from frontend/js/api.js
  v
Cloudflare Worker API (Hono)
  |
  +--> Cloudflare D1: posts, categories, audit_logs
  |
  +--> Cloudflare R2: cover images
  |
  +--> Telegram Bot API: admin submission notifications
```

The frontend is static. All API calls from the frontend must go through `frontend/js/api.js`.

## Frontend

The frontend lives in `frontend/` and is deployed to Cloudflare Pages.

Main pages:

- `index.html`: homepage, approved article list, search, category filters.
- `article.html`: article detail page loaded by `?slug=...`.
- `submit.html`: community submission form with cover upload.
- `admin.html`: moderation dashboard for pending submissions.

Main JavaScript modules:

- `js/api.js`: the only place where `fetch()` calls are made.
- `js/home.js`: homepage rendering and filters.
- `js/article.js`: article detail rendering, related posts, sharing metadata.
- `js/submit.js`: form validation and multipart submission.
- `js/admin.js`: pending post moderation actions.
- `js/i18n.js`: Indonesian and English copy, metadata helpers, language switching.
- `js/nav.js`: shared navigation and mobile drawer behavior.

The frontend currently uses client-side metadata updates for article details. Static metadata exists in the initial HTML, then `article.js` updates title, description, OpenGraph, Twitter, canonical, and JSON-LD after the API response.

## Worker API

The API lives in `worker/` and is deployed as a Cloudflare Worker.

Entry point:

- `worker/src/index.ts`

Routes:

- `GET /`: health check.
- `GET /assets/*`: serves R2 objects through the Worker with long-lived cache headers.
- `/api/posts`: public post routes.
- `/api/admin`: admin moderation routes.

Public endpoints:

- `GET /api/posts?page=1&limit=10&category=wisata`
- `GET /api/posts/:slug`
- `POST /api/posts`

Admin endpoints:

- `GET /api/admin/posts/pending`
- `PATCH /api/admin/posts/:id/approve`
- `PATCH /api/admin/posts/:id/reject`
- `DELETE /api/admin/posts/:id`

Admin endpoints require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

## Data Flow

### Public Reading

1. Browser loads static frontend from Cloudflare Pages.
2. Frontend calls `GET /api/posts` or `GET /api/posts/:slug`.
3. Worker queries D1 through the post service.
4. Public queries only return posts where `status = 'approved'`.
5. Cover image URLs are built from `ASSET_PUBLIC_BASE_URL` and `cover_image_key`.

### Article Submission

1. User fills `submit.html` and uploads a cover image.
2. `submit.js` validates required fields, content length, image type, and image size.
3. Frontend sends `multipart/form-data` to `POST /api/posts`.
4. Worker validates the request again.
5. Worker inserts a D1 row with `status = 'pending'`.
6. Worker uploads the cover image to R2 under `posts/{post_id}/cover-{timestamp}.{ext}`.
7. Worker updates `cover_image_key` in D1.
8. Worker sends a Telegram notification when Telegram secrets are configured.

### Moderation

1. Admin opens `admin.html` and enters `ADMIN_TOKEN`.
2. Frontend calls `GET /api/admin/posts/pending`.
3. Admin approves, rejects, or deletes a post.
4. Worker updates D1 status and writes an `audit_logs` row.
5. Approved posts become visible through public endpoints.

## Data Model

D1 tables are defined in `worker/migrations/0001_init.sql`.

Core tables:

- `posts`: article content, author info, location, category, cover key, status, moderation fields.
- `categories`: seeded categories and slugs.
- `audit_logs`: admin moderation history.

Valid public article state:

```text
status = 'approved'
```

Moderation states:

```text
pending
approved
rejected
deleted
```

## Storage

Cover images are stored in R2 through the `BUCKET` binding.

Current cover object format:

```text
posts/{post_id}/cover-{timestamp}.{jpg|png|webp}
```

Images are served through the Worker:

```text
/assets/{object_key}
```

The public image URL is generated only when `ASSET_PUBLIC_BASE_URL` is configured.

## Security Boundaries

- Secrets are Cloudflare Worker secrets, not frontend values.
- `ADMIN_TOKEN` protects all admin endpoints.
- Public D1 queries must filter by `status = 'approved'`.
- Server-side validation is required even when frontend validation exists.
- Cover upload accepts only JPEG, PNG, and WebP.
- Cover upload max size is 2 MB.
- Submit endpoint has simple Worker-side rate limiting.

## Deployment Units

- Frontend: Cloudflare Pages project `jelajah-taliabu`.
- API: Cloudflare Worker `jelajah-blog-api`.
- Database: Cloudflare D1 database `jelajah_blog`.
- Storage: Cloudflare R2 bucket `jelajah-blog-assets`.

See `docs/deployment.md` for commands and post-deploy checks.
