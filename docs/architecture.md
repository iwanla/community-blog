# Architecture

JelajahTaliabu is a serverless community blog for stories, tourism, culture, food, local news, and citizen submissions from Taliabu Island.

## System Overview

```text
Browser
  |
  | static Vite/Vue/TypeScript bundle
  v
Cloudflare Pages
  |
  | fetch() from frontend/src/services/api.ts
  v
Cloudflare Worker API (Hono)
  |
  +--> Cloudflare D1: posts, categories, audit_logs, reactions, view_logs
  |
  +--> Cloudflare R2: cover images
  |
  +--> Cloudflare Turnstile: submission anti-abuse verification
  |
  +--> Telegram Bot API: admin submission notifications
```

The frontend is static. All API calls from the frontend must go through `frontend/src/services/api.ts`.

## Frontend

The frontend lives in `frontend/` and is deployed to Cloudflare Pages as a static Vue SPA.

Runtime stack:

- Vite
- Vue 3
- Vue Router
- TypeScript
- Quill loaded from `frontend/public/vendor/quill/` for the rich-text submit editor.

Routes:

- `/`: homepage, featured article, approved article list, search, and category filters.
- `/posts/:slug`: article detail route with view tracking and reactions.
- `/submit`: community submission form with cover upload, rich-text content, and Turnstile verification.
- `/admin`: moderation dashboard for pending and reviewed submissions.

Main frontend modules:

- `frontend/src/services/api.ts`: the only place where `fetch()` calls are made.
- `frontend/src/router.ts`: Vue Router route definitions and language query synchronization.
- `frontend/src/i18n/index.ts`: translation helpers, category labels, locale state, metadata helpers.
- `frontend/src/i18n/locales/*.json`: Indonesian and English UI text and category labels.
- `frontend/src/views/*.vue`: page-level route views.
- `frontend/src/components/*.vue`: shared header and footer.
- `frontend/src/utils/*.ts`: content sanitizing, dummy fallback posts, and metadata helpers.

The frontend uses client-side metadata updates. Static metadata exists in `frontend/index.html`, then route views update title, description, OpenGraph, Twitter, canonical, and JSON-LD after route data is available.

Frontend build-time environment:

```env
VITE_API_BASE_URL=https://jelajah-blog-api.iwanlaudin01.workers.dev
```

`VITE_API_BASE_URL` is public and embedded into the browser bundle by Vite. It must only contain the public Worker API base URL. Admin and Telegram tokens must never be stored in frontend env variables.

## Worker API

The API lives in `worker/` and is deployed as a Cloudflare Worker.

Entry point:

- `worker/src/index.ts`

Routes:

- `GET /`: health check.
- `GET /assets/*`: serves R2 objects through the Worker with long-lived cache headers.
- `/api/posts`: public post routes.
- `/api/categories`: public category routes.
- `/api/admin`: admin moderation routes.

Public endpoints:

- `GET /api/posts?page=1&limit=10&category=wisata`
- `GET /api/posts/featured`
- `GET /api/posts/:slug`
- `POST /api/posts/:slug/view`
- `POST /api/posts/:slug/react`
- `GET /api/categories`
- `POST /api/posts`

Admin endpoints:

- `GET /api/admin/posts/pending`
- `GET /api/admin/posts/reviewed?page=1&limit=10`
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

### Featured Article

1. Homepage calls `GET /api/posts/featured`.
2. Worker selects one approved post using:

```sql
ORDER BY (COALESCE(views, 0) + COALESCE(likes, 0) * 5) DESC,
         approved_at DESC,
         created_at DESC
LIMIT 1
```

3. The frontend renders the returned post in the featured article section.

### Article Engagement

1. Article detail calls `POST /api/posts/:slug/view` after loading an approved post.
2. Worker fingerprints the request and records one view per `(post_id, fingerprint)` in `view_logs`.
3. Worker increments the denormalized `posts.views` counter only for newly inserted view logs.
4. Reader reactions call `POST /api/posts/:slug/react` with `type` set to `like`, `dislike`, or `none`.
5. Worker stores one reaction per `(post_id, fingerprint)` in `reactions`, then recalculates `posts.likes` and `posts.dislikes`.

```text
ArticleView.vue
  |
  | POST /api/posts/:slug/view
  v
Worker reaction-service
  |
  | fingerprint request
  v
D1 view_logs
  |
  | insert only if (post_id, fingerprint) is new
  v
posts.views + 1


ArticleView.vue
  |
  | POST /api/posts/:slug/react
  | body: { type: "like" | "dislike" | "none" }
  v
Worker reaction-service
  |
  | fingerprint request
  v
D1 reactions
  |
  | upsert like/dislike or delete when type = none
  v
Recalculate posts.likes / posts.dislikes
```

`view_logs` and `reactions` are used for duplicate protection and per-reader state. The denormalized counters on `posts` are used for fast reads in article detail, public lists, and featured article scoring.

### Article Submission

1. User opens `/submit`, fills the Vue form, writes content in Quill, and uploads a cover image.
2. `SubmitView.vue` validates required fields, content length, image type, and image size.
3. User must complete Cloudflare Turnstile.
4. Frontend sends `multipart/form-data` to `POST /api/posts`, including the Turnstile response token.
5. Worker verifies the Turnstile token with Cloudflare.
6. Worker validates the request again.
7. Worker inserts a D1 row with `status = 'pending'`.
8. Worker uploads the cover image to R2 under `posts/{post_id}/cover-{timestamp}.{ext}`.
9. Worker updates `cover_image_key` in D1.
10. Worker sends a Telegram notification when Telegram secrets are configured.

### Moderation

1. Admin opens `/admin` and enters `ADMIN_TOKEN`.
2. Frontend calls `GET /api/admin/posts/pending`.
3. Admin approves, rejects, or deletes a post.
4. Worker updates D1 status and writes an `audit_logs` row.
5. Approved posts become visible through public endpoints.

## Data Model

D1 tables are defined in `worker/migrations/`.

Core tables:

- `posts`: article content, author info, location, category, cover key, status, moderation fields, and denormalized engagement counters.
- `categories`: seeded categories and slugs.
- `audit_logs`: admin moderation history.
- `reactions`: one like/dislike reaction per post fingerprint.
- `view_logs`: one counted view per post fingerprint.

`posts` engagement columns:

```text
views
likes
dislikes
```

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
- Frontend `VITE_*` values are public browser bundle values.
- `ADMIN_TOKEN` protects all admin endpoints.
- `TURNSTILE_SECRET_KEY` is required for public article submission.
- The admin token is entered manually in `/admin`, stored in `sessionStorage`, and sent as `Authorization: Bearer <ADMIN_TOKEN>`.
- Public D1 queries must filter by `status = 'approved'`.
- Server-side validation is required even when frontend validation exists.
- Cover upload accepts only JPEG, PNG, and WebP.
- Cover upload max size is 2 MB.
- Submit endpoint has simple Worker-side rate limiting.
- View and reaction endpoints use request fingerprints for basic duplicate protection.

## Deployment Units

- Frontend: Cloudflare Pages project `jelajah-taliabu`.
- API: Cloudflare Worker `jelajah-blog-api`.
- Database: Cloudflare D1 database `jelajah_blog`.
- Storage: Cloudflare R2 bucket `jelajah-blog-assets`.

See `docs/deployment.md` for commands and post-deploy checks.
