# AGENTS.md — JelajahTaliabu

---

## Project Overview

**JelajahTaliabu** adalah platform blog komunitas untuk berbagi cerita, wisata, budaya, kuliner, dan aktivitas seputar Pulau Taliabu. Satu Cloudflare Worker menyajikan API Hono dan hasil build SPA Vue melalui static assets.

- Siapa saja bisa submit artikel + upload cover image
- Artikel hanya tampil di website **setelah disetujui admin**
- Admin dinotifikasi via Telegram setiap ada submission baru
- Fully serverless, semua infrastruktur di Cloudflare ecosystem

---

## Tech Stack

| Layer             | Service                  | Fungsi                                        |
| ----------------- | ------------------------ | --------------------------------------------- |
| Frontend App      | Vite, Vue 3, Vue Router  | SPA public pages, submit form, admin dashboard |
| Frontend Language | TypeScript               | Source frontend (`.ts` dan Vue SFC)           |
| Frontend Hosting  | Cloudflare Worker assets | Hosting static build output                   |
| Backend API       | Cloudflare Workers       | API submit, list artikel, approve/reject       |
| Backend Framework | Hono                     | Router ringan untuk Workers                   |
| Database          | Cloudflare D1            | Simpan artikel, kategori, admin, audit logs   |
| File Storage      | Cloudflare R2            | Simpan gambar cover artikel                   |
| Notifications     | Telegram Bot API         | Notifikasi admin saat ada submission baru     |
| Auth Admin        | Bearer Token             | Proteksi endpoint admin (MVP)                 |
| Deployment        | Wrangler CLI             | Deploy Workers, binding D1 & R2               |

> **Jangan tambahkan service eksternal** di luar ekosistem Cloudflare tanpa alasan kuat. Stack ini sengaja dijaga di satu ekosistem agar free tier maksimal.

---

## Project Structure

```
jelajah-blog/
├── wrangler.jsonc          # Production Worker, D1/R2, dan static assets
├── wrangler.dev.jsonc      # Konfigurasi Worker lokal
├── migrations/             # Migrasi D1 yang dipakai root Wrangler
│   ├── 0001_init.sql
│   └── 0002_reactions.sql
├── frontend/
│   ├── index.html          # Vite app shell
│   ├── package.json        # Vue/Vite scripts
│   ├── vite.config.ts
│   ├── tsconfig*.json
│   ├── public/             # Static assets copied as-is to dist
│   │   ├── assets/
│   │   └── vendor/quill/   # Quill vendor bundle for rich text editor
│   └── src/
│       ├── main.ts
│       ├── router.ts       # Vue Router routes + lazy feature views
│       ├── features/       # Feature views and feature-specific API modules
│       │   ├── admin/
│       │   └── posts/
│       ├── shared/         # Shared API client, components, i18n, types, utils
│       │   ├── api/client.ts
│       │   ├── components/
│       │   ├── i18n/
│       │   ├── types.ts
│       │   └── utils/
│       └── assets/
│
├── worker/
│   ├── src/
│   │   ├── index.ts        # Entry point Workers, router Hono
│   │   ├── routes/
│   │   │   ├── posts.ts    # Public routes: GET posts, POST submit
│   │   │   └── admin.ts    # Admin routes: approve, reject, delete
│   │   ├── services/
│   │   │   ├── post-service.ts     # Logic CRUD artikel ke D1
│   │   │   ├── r2-service.ts       # Logic upload/delete gambar R2
│   │   │   └── telegram-service.ts # Kirim notifikasi Telegram
│   │   └── utils/
│   │       ├── auth.ts       # Verifikasi Bearer token admin
│   │       ├── slug.ts       # Generate slug dari title
│   │       └── validation.ts # Validasi input request
│   │
│   └── package.json
│
└── docs/
```

---

## Database Schema (Cloudflare D1)

### Tabel `posts`

```sql
CREATE TABLE posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    excerpt         TEXT,
    content         TEXT NOT NULL,
    author_name     TEXT NOT NULL,
    author_email    TEXT,
    category_id     INTEGER,
    cover_image_key TEXT,          -- object key di R2
    status          TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT,
    approved_at     TEXT,
    approved_by     TEXT
);
```

Status yang valid: `pending` · `approved` · `rejected`

### Tabel `categories`

```sql
CREATE TABLE categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
```

### Tabel `audit_logs`

```sql
CREATE TABLE audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    action     TEXT NOT NULL,  -- approve, reject, edit, delete
    post_id    INTEGER,
    actor      TEXT,
    note       TEXT,
    created_at TEXT NOT NULL
);
```

---

## R2 Storage Structure

```
posts/{post_id}/cover-{timestamp}.jpg
posts/{post_id}/images/{filename}.jpg
```

Untuk MVP, satu artikel hanya menyimpan satu `cover_image_key` di tabel `posts`.

**Image upload rules:**
- Max file size: **2MB**
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Video upload: **dilarang** di MVP
- Kompres gambar di frontend sebelum upload jika memungkinkan

---

## API Reference

**Production Base URL:**
```
https://jelajah-blog-api.iwanlaudin01.workers.dev
```

Frontend memakai URL relatif `/api`; saat development Vite mem-proxy `/api` ke Worker lokal di `http://localhost:8787`. Semua request frontend melewati `frontend/src/shared/api/client.ts`.

### Public Endpoints

#### GET Posts
```http
GET /api/posts?page=1&limit=10&category=wisata
```
Hanya mengembalikan artikel dengan `status = 'approved'`.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Pantai Indah di Taliabu",
      "slug": "pantai-indah-di-taliabu",
      "excerpt": "...",
      "coverImageUrl": "https://cdn.../cover.jpg",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10
}
```

#### GET Post Detail
```http
GET /api/posts/:slug
```
Hanya mengembalikan artikel dengan `status = 'approved'`.

#### POST Submit Article
```http
POST /api/posts
Content-Type: multipart/form-data
```

Fields:
```
title, content, excerpt, authorName, authorEmail, categoryId, coverImage
```

Proses di Worker:
1. Validasi semua input
2. Upload `coverImage` ke R2 → simpan object key
3. Insert artikel ke D1 dengan `status = 'pending'`
4. Kirim notifikasi Telegram ke admin

### Admin Endpoints

Semua admin endpoint wajib menyertakan header:
```http
Authorization: Bearer <ADMIN_TOKEN>
```

#### GET Pending Posts
```http
GET /api/admin/posts/pending
```

#### Approve Post
```http
PATCH /api/admin/posts/:id/approve
```
Set: `status = 'approved'`, `approved_at`, `approved_by`

#### Reject Post
```http
PATCH /api/admin/posts/:id/reject
Body: { "reason": "Konten belum lengkap" }
```
Set: `status = 'rejected'`, `rejection_reason`

#### Delete Post
```http
DELETE /api/admin/posts/:id
```
MVP: soft delete dengan `status = 'deleted'`

---

## Moderation Flow

```
User submit artikel + cover image
        ↓
Worker: validasi → upload R2 → insert D1 (pending) → notif Telegram
        ↓
Admin buka dashboard → review artikel pending
        ↓
Approve → status = approved → artikel tampil di publik
Reject  → status = rejected → artikel tidak tampil
```

---

## Environment Variables & Secrets

Simpan secrets di Cloudflare Worker Secrets, **jangan hardcode** di source code.

| Key                  | Keterangan                         |
| -------------------- | ---------------------------------- |
| `ADMIN_TOKEN`        | Bearer token untuk admin endpoints |
| `TELEGRAM_BOT_TOKEN` | Token Telegram Bot                 |
| `TELEGRAM_CHAT_ID`   | Chat ID admin Telegram             |

Frontend build-time env:

| Key                 | Keterangan                           |
| ------------------- | ------------------------------------ |
| `VITE_TURNSTILE_SITE_KEY` | Public Turnstile site key |

Jangan pernah menyimpan `ADMIN_TOKEN`, token Telegram, atau secret lain di env frontend. API dan static assets disajikan oleh Worker yang sama.

**Cloudflare Bindings** di `wrangler.jsonc`:

```toml
name = "jelajah-blog"
main = "worker/src/index.ts"
compatibility_date = "2026-09-18"

[[d1_databases]]
binding = "DB"
database_name = "jelajah_blog"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "jelajah-blog-assets"
```

---

## Development Guidelines

### Struktur & Organisasi

- Semua request API frontend memakai `frontend/src/shared/api/client.ts`; gunakan feature API module di `frontend/src/features/**/api.ts` untuk endpoint-specific logic.
- Frontend source memakai TypeScript. File `.vue` gunakan `<script setup lang="ts">`.
- Route frontend baru dibuat sebagai Vue route di `frontend/src/router.ts`, dengan view di feature yang sesuai, bukan file HTML terpisah.
- Copy UI dan label kategori dikelola di `frontend/src/shared/i18n/locales/*.json`.
- Feature Worker baru dibuat di `worker/src/features/` dan didaftarkan di `worker/src/index.ts`.
- Infrastruktur Worker bersama berada di `worker/src/infrastructure/`; utilitas dan tipe bersama berada di `worker/src/shared/`.
- Migrasi D1 berada di root `migrations/` agar ditemukan oleh konfigurasi Wrangler root.

### Data & Logic

- Setiap query publik ke D1 **wajib** `WHERE status = 'approved'` — jangan pernah expose data pending/rejected
- Pagination wajib di semua endpoint list — default `limit=10`
- Slug dibuat otomatis dari title via `utils/slug.ts`, tidak boleh diinput manual oleh user
- Gunakan `audit_logs` untuk semua aksi admin (approve, reject, edit, delete)

### Security

- `ADMIN_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` disimpan sebagai Cloudflare Worker Secret — tidak boleh ada di frontend
- Frontend hanya boleh memakai env publik berprefix `VITE_*`, seperti `VITE_TURNSTILE_SITE_KEY`.
- Validasi semua input di Worker (`utils/validation.ts`) — jangan andalkan validasi frontend saja
- Batasi tipe file upload: `jpeg`, `png`, `webp` — tolak tipe lain di Worker
- Batasi ukuran file upload maksimal **2MB** di Worker
- Terapkan rate limiting sederhana di Worker untuk endpoint submit
- Admin token diverifikasi di setiap request via `utils/auth.ts`

### SEO

- Setiap halaman artikel wajib punya `<title>`, `<meta description>`, OpenGraph tags, canonical URL, dan JSON-LD. Metadata di-update lewat helper frontend route/view.
- URL struktur: `/posts/:slug`
- `robots.txt` dan `sitemap.xml` berada di `frontend/public/`.

---

## Categories

```
Wisata · Budaya · Kuliner · Sejarah · Berita Lokal · Cerita Warga · UMKM · Politik
```

---

## File Conventions

- `plan.md` dan semua dokumen perencanaan disimpan di `.codex/plans/`
