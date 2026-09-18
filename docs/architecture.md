# Architecture

JelajahTaliabu adalah blog komunitas serverless untuk cerita, wisata, budaya, kuliner, berita lokal, dan submission warga Pulau Taliabu.

## Overview

- Vue 3, Vite, dan Vue Router untuk frontend.
- Cloudflare Worker dan Hono untuk backend API.
- Cloudflare D1 untuk data artikel, kategori, moderasi, dan engagement.
- Cloudflare R2 untuk cover image.
- Satu deployment Worker menyajikan API dan hasil build SPA.
- Backend menggunakan vertical slice berdasarkan use case.

```text
Browser
  |
  | same-origin /api/* dan route SPA
  v
Cloudflare Worker
  |-- Hono API (/api/*)
  |     |-- D1
  |     |-- R2
  |     |-- Turnstile
  |     `-- Telegram Bot API
  `-- Static Assets (frontend/dist)
```

Frontend dan backend tetap dipisahkan secara source code, tetapi di-host sebagai satu aplikasi Cloudflare Worker. Frontend memakai URL relatif seperti `fetch("/api/posts")`; saat development Vite mem-proxy `/api` ke Worker lokal pada `http://localhost:8787`.

## Project Structure

```text
jelajah-blog/
├── wrangler.jsonc
├── wrangler.dev.jsonc
├── package.json
├── migrations/
│   ├── 0001_init.sql
│   └── 0002_reactions.sql
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── public/
│   │   ├── assets/
│   │   └── vendor/quill/
│   └── src/
│       ├── main.ts
│       ├── router.ts
│       ├── features/
│       │   ├── admin/
│       │   └── posts/
│       │       ├── list/
│       │       ├── detail/
│       │       └── submit/
│       ├── shared/
│       │   ├── api/client.ts
│       │   ├── components/
│       │   ├── i18n/
│       │   ├── types.ts
│       │   └── utils/
│       └── assets/
├── worker/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── features/
│       │   ├── admin/
│       │   ├── categories/
│       │   └── posts/
│       ├── infrastructure/
│       └── shared/
└── docs/
```

## Frontend Organization

Frontend menggunakan feature-based organization.

- `features/posts/list/`: homepage, list API, dan fallback posts.
- `features/posts/detail/`: article detail dan detail API.
- `features/posts/submit/`: submission form dan submit API.
- `features/admin/`: moderation dashboard dan admin API.
- `shared/api/client.ts`: HTTP client umum untuk error handling dan JSON response.
- `shared/components/`: header dan footer.
- `shared/i18n/`: translation helpers dan locale files.
- `shared/utils/`: content sanitizing dan metadata helpers.
- `router.ts`: route definitions dan lazy-loaded feature views.

API spesifik tetap dekat dengan feature yang menggunakannya. Tidak ada production API hostname di frontend.

## Worker Organization

Backend menggunakan vertical slices. Setiap feature menangani satu use case atau kelompok endpoint yang terkait.

- `features/posts/`: list, detail, submit, view, dan react.
- `features/admin/`: pending, reviewed, approve, reject, dan delete.
- `features/categories/`: public category list.
- `infrastructure/`: adapter untuk D1, R2, Telegram, dan Turnstile.
- `shared/`: auth, validation, rate limiting, fingerprint, slug, dan shared types.
- `index.ts`: composition root, middleware, route registration, static asset entry, dan error handling.

Feature-specific logic tetap di feature. Code dipindahkan ke `shared/` atau `infrastructure/` hanya jika dipakai lintas feature.

## Deployment

`wrangler.jsonc` berada di root karena merepresentasikan seluruh deployment aplikasi.

```jsonc
{
  "name": "jelajah-blog",
  "main": "worker/src/index.ts",
  "assets": {
    "directory": "frontend/dist",
  },
  "d1_databases": [{ "binding": "DB" }],
  "r2_buckets": [{ "binding": "BUCKET" }]
}
```

Routing utama:

```text
/api/*      -> Worker Hono
/assets/*   -> Worker R2 asset handler
/           -> frontend/dist/index.html
/posts/*    -> frontend/dist/index.html -> Vue Router
/admin/*    -> frontend/dist/index.html -> Vue Router
/submit     -> frontend/dist/index.html -> Vue Router
```

`run_worker_first` memastikan `/api/*` diproses Worker sebelum static asset fallback. `not_found_handling: "single-page-application"` memastikan route Vue tetap mengarah ke `index.html`.

Deployment dijalankan dari root:

```bash
npm run deploy
```

Flow deployment:

```text
npm run deploy
  -> build frontend
  -> frontend/dist
  -> wrangler deploy
  -> Worker + Static Assets
```

## API Surface

Public endpoints:

- `GET /api/posts?page=1&limit=10&category=wisata`
- `GET /api/posts/featured`
- `GET /api/posts/:slug`
- `POST /api/posts/:slug/view`
- `POST /api/posts/:slug/react`
- `GET /api/categories`
- `POST /api/posts`

Response tambahan untuk `GET /api/posts` dan `GET /api/posts/:slug`:

```json
{
  "views": 12,
  "likes": 8,
  "dislikes": 1
}
```

`POST /api/posts/:slug/view` mengembalikan `{ "counted": boolean, "views": number }`.
`POST /api/posts/:slug/react` menerima body `{ "type": "like" | "dislike" | "none" }` dan mengembalikan `{ "ok": true, "likes": number, "dislikes": number }`.

Admin endpoints:

- `GET /api/admin/posts/pending`
- `GET /api/admin/posts/reviewed?page=1&limit=10`
- `PATCH /api/admin/posts/:id/approve`
- `PATCH /api/admin/posts/:id/reject`
- `DELETE /api/admin/posts/:id`

Admin endpoints memerlukan:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

Semua query publik hanya mengembalikan post dengan `status = 'approved'`. Endpoint list menggunakan pagination dengan default `limit=10`.

## Data Flow

### Public Reading

1. Browser memuat SPA dari static assets Worker.
2. Frontend memanggil `/api/posts` atau `/api/posts/:slug` pada origin yang sama.
3. Worker membaca D1 dan hanya mengembalikan post approved.
4. Cover image dilayani melalui `/assets/{object_key}` dari R2.

### Article Engagement

1. Article detail mengirim `POST /api/posts/:slug/view` setelah post approved dimuat.
2. Worker membuat fingerprint anonim dari IP request dan User-Agent menggunakan SHA-256, tanpa menyimpan IP mentah.
3. Worker mencatat satu view per kombinasi post dan fingerprint di `view_logs`.
4. Reaction dikirim ke `POST /api/posts/:slug/react` dengan `like`, `dislike`, atau `none`.
5. Worker menyimpan atau menghapus reaction unik di D1 dan menghitung ulang counter `posts.likes` serta `posts.dislikes`.

View dan reaction tidak memerlukan authentication. Fingerprint hanya digunakan untuk deduplikasi anonim pada skala MVP. `none` menghapus reaction aktif; view tidak dapat dibatalkan.

### Article Submission

1. User mengisi form `/submit`, konten rich text, cover image, dan Turnstile.
2. Frontend mengirim `multipart/form-data` ke `POST /api/posts`.
3. Worker memverifikasi Turnstile dan memvalidasi ulang input.
4. Worker membuat post `pending`, mengunggah cover ke R2, lalu menyimpan object key di D1.
5. Worker mengirim notifikasi Telegram jika secret Telegram tersedia.

### Moderation

1. Admin membuka `/admin` dan memasukkan `ADMIN_TOKEN`.
2. Frontend memuat pending atau reviewed submissions.
3. Worker memproses approve, reject, atau delete dan menulis `audit_logs`.
4. Post approved menjadi terlihat melalui endpoint publik.

## Data Model

Migrasi D1 berada di root `migrations/` dan digunakan oleh konfigurasi Wrangler root.

- `posts`: artikel, author, kategori, cover key, status moderasi, dan engagement counters.
- `categories`: nama dan slug kategori.
- `audit_logs`: riwayat aksi admin.
- `reactions`: satu like/dislike per post dan fingerprint.
- `view_logs`: satu view tercatat per post dan fingerprint.

Migration `0002_reactions.sql` menambahkan kolom `views`, `likes`, dan `dislikes` ke `posts`, lalu membuat tabel `reactions` dan `view_logs` beserta unique constraint dan index lookup.

Status post:

```text
pending -> approved
pending -> rejected
pending/approved/rejected -> deleted
```

## Environment and Security

Worker secrets tidak boleh disimpan di source code atau frontend:

- `ADMIN_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TURNSTILE_SECRET_KEY`

Public frontend env:

- `VITE_TURNSTILE_SITE_KEY`

Frontend env tidak menyimpan API base URL karena API dan asset menggunakan same-origin deployment.

Validasi dan batas keamanan:

- Admin token diverifikasi pada setiap admin request.
- Submit divalidasi di frontend dan Worker.
- Cover hanya menerima JPEG, PNG, dan WebP.
- Ukuran cover maksimal 2 MB.
- Submit memiliki rate limiting sederhana di Worker.
- View dan reaction saat ini mengandalkan deduplikasi D1; belum menggunakan binding rate limiter atau KV.
- Query publik wajib memfilter `status = 'approved'`.

## Planned Phase 2: KV Rate Limiting

`docs/backend-reactions-phase-2-implementation-plan.md` mendefinisikan peningkatan rate limiting yang belum diaktifkan pada konfigurasi saat ini.

Rencana tersebut akan:

- Menambahkan binding KV `RATE_LIMIT_KV` di `wrangler.jsonc` dan `wrangler.dev.jsonc`.
- Mengganti `Map` in-memory pada submit limiter dengan fixed-window KV limiter.
- Menggunakan key `rl:{scope}:{ip}` dengan fallback IP `unknown`.
- Mempertahankan deduplikasi view/reaction di D1 sebagai source of truth.
- Mengembalikan HTTP `429` dengan body `{ "error": "Too many requests. Please try again later." }` saat limit terlampaui.

Limit yang direncanakan:

| Endpoint | Limit | Window |
| --- | ---: | --- |
| `POST /api/posts` | 5 request | 60 detik |
| `POST /api/posts/:slug/view` | 30 request | 60 detik |
| `POST /api/posts/:slug/react` | 10 request | 60 detik |

Binding KV tidak boleh didokumentasikan sebagai aktif sampai konfigurasi Wrangler, `Bindings`, limiter, dan test lokal sudah diperbarui bersama.

## Storage

Cover image disimpan di R2 dengan format:

```text
posts/{post_id}/cover-{timestamp}.{jpg|png|webp}
```

Worker melayani object melalui:

```text
/assets/{object_key}
```

## SEO

Route artikel `/posts/:slug` memperbarui title, meta description, OpenGraph, canonical URL, dan JSON-LD melalui shared metadata helper setelah data artikel tersedia.
