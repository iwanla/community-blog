# AGENTS.md — JelajahTaliabu

---

## Project Overview

**JelajahTaliabu** adalah platform blog komunitas untuk berbagi cerita, wisata, budaya, kuliner, dan aktivitas seputar Pulau Taliabu.

- Siapa saja bisa submit artikel + upload cover image
- Artikel hanya tampil di website **setelah disetujui admin**
- Admin dinotifikasi via Telegram setiap ada submission baru
- Fully serverless, semua infrastruktur di Cloudflare ecosystem

---

## Tech Stack

| Layer             | Service                  | Fungsi                                        |
| ----------------- | ------------------------ | --------------------------------------------- |
| Frontend Hosting  | Cloudflare Pages         | Hosting static HTML/CSS/JS                    |
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
├── frontend/
│   ├── index.html          # Homepage — daftar artikel, search, filter
│   ├── submit.html         # Form submit artikel + upload cover image
│   ├── admin.html          # Admin dashboard
│   ├── assets/
│   ├── css/
│   └── js/
│       ├── api.js          # Semua fetch() ke Workers API — satu-satunya tempat
│       ├── home.js         # Logic homepage
│       ├── article.js      # Logic halaman artikel
│       └── submit.js       # Form handling, validasi, upload image
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
│   ├── migrations/
│   │   └── 0001_init.sql   # Schema awal D1
│   │
│   ├── wrangler.toml
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

**Base URL:**
```
https://api.jelajahtaliabu.workers.dev
```

Semua `fetch()` ke API **hanya boleh** ada di `frontend/js/api.js`.

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

Simpan di Cloudflare Secrets, **jangan hardcode** di source code.

| Key                  | Keterangan                         |
| -------------------- | ---------------------------------- |
| `ADMIN_TOKEN`        | Bearer token untuk admin endpoints |
| `TELEGRAM_BOT_TOKEN` | Token Telegram Bot                 |
| `TELEGRAM_CHAT_ID`   | Chat ID admin Telegram             |

**Cloudflare Bindings** di `wrangler.toml`:

```toml
name = "jelajah-blog-api"
main = "src/index.ts"
compatibility_date = "2026-05-15"

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

- Semua `fetch()` ke Workers API **hanya boleh** ada di `frontend/js/api.js`
- Route baru di Worker didaftarkan di `src/index.ts`, logic di `src/routes/`
- Gunakan service layer (`src/services/`) untuk semua operasi D1, R2, dan Telegram — jangan taruh logic di route langsung
- Halaman frontend baru mengikuti pola `index.html` / `submit.html` / `admin.html`

### Data & Logic

- Setiap query publik ke D1 **wajib** `WHERE status = 'approved'` — jangan pernah expose data pending/rejected
- Pagination wajib di semua endpoint list — default `limit=10`
- Slug dibuat otomatis dari title via `utils/slug.ts`, tidak boleh diinput manual oleh user
- Gunakan `audit_logs` untuk semua aksi admin (approve, reject, edit, delete)

### Security

- `ADMIN_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` disimpan sebagai Cloudflare Secret — tidak boleh ada di frontend
- Validasi semua input di Worker (`utils/validation.ts`) — jangan andalkan validasi frontend saja
- Batasi tipe file upload: `jpeg`, `png`, `webp` — tolak tipe lain di Worker
- Batasi ukuran file upload maksimal **2MB** di Worker
- Terapkan rate limiting sederhana di Worker untuk endpoint submit
- Admin token diverifikasi di setiap request via `utils/auth.ts`

### SEO

- Setiap halaman artikel wajib punya `<title>`, `<meta description>`, dan OpenGraph tags
- URL struktur: `/posts/:slug`
- Tambahkan `sitemap.xml` di fase growth

---

## Categories

```
Wisata · Budaya · Kuliner · Sejarah · Berita Lokal · Cerita Warga · UMKM
```

---

## File Conventions

- `plan.md` dan semua dokumen perencanaan disimpan di `.codex/plans/`