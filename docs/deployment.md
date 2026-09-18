# Deployment

JelajahTaliabu menggunakan satu deployment Cloudflare Worker untuk API Hono dan static assets hasil build Vue.

```text
repository root
  -> npm run build
  -> frontend/dist
  -> wrangler deploy
  -> Worker API + Static Assets
```

Konfigurasi deployment:

- Production: `wrangler.jsonc`
- Development: `wrangler.dev.jsonc`
- Worker entry point: `worker/src/index.ts`
- Static asset directory: `frontend/dist`
- D1 migrations: `migrations/`

## Prerequisites

- Node.js 22 atau lebih baru.
- npm.
- Akses Cloudflare account untuk Worker, D1, dan R2.
- Dependencies project ter-install dari root.

Install dependencies:

```bash
npm install
npm --prefix frontend install
npm --prefix worker install
```

Login ke Cloudflare jika diperlukan:

```bash
npx wrangler login
```

Pastikan versi Node aktif:

```bash
node -v
```

## Environment

### Worker Secrets

Set secrets dari root project. Jangan commit nilai secret.

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

`TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` opsional untuk operasi API dasar. Tanpa keduanya, notifikasi Telegram dilewati.

Untuk local development, salin `worker/.dev.vars.example` ke `worker/.dev.vars` dan isi nilai lokal. File tersebut di-ignore Git.

Frontend hanya membutuhkan public env:

```env
VITE_TURNSTILE_SITE_KEY=...
```

Jangan mengatur `VITE_API_BASE_URL`. Frontend memakai URL relatif `/api` karena API dan static assets menggunakan origin Worker yang sama.

## Local Development

Apply local D1 migrations:

```bash
npm run db:migrate:local
```

Build frontend dan jalankan Worker lokal:

```bash
npm run dev
```

`npm run dev` menggunakan `wrangler.dev.jsonc`. Vite development server dapat dijalankan terpisah jika diperlukan:

```bash
npm --prefix frontend run dev
```

Vite mem-proxy request `/api` ke `http://localhost:8787`.

Run checks:

```bash
npm run typecheck
npm run build
```

## D1 Migrations

Migration tersimpan di root `migrations/` dan diurutkan oleh Wrangler.

Migration saat ini:

- `0001_init.sql`: schema awal dan seed kategori.
- `0002_reactions.sql`: counter views/likes/dislikes, `reactions`, dan `view_logs`.

Apply ke local D1:

```bash
npm run db:migrate:local
```

Apply ke production D1:

```bash
npm run db:migrate:remote
```


## Production Deploy

1. Jalankan typecheck dan build:

```bash
npm run typecheck
npm run build
```

2. Set atau perbarui Worker secrets:

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

3. Apply remote D1 migrations:

```bash
npm run db:migrate:remote
```

4. Deploy Worker dan static assets:

```bash
npm run deploy
```

`npm run deploy` menjalankan build frontend kemudian `wrangler deploy` menggunakan `wrangler.jsonc`.

## Production Bindings

Bindings production didefinisikan di `wrangler.jsonc`:

- Worker: `jelajah-blog`
- Entry point: `worker/src/index.ts`
- D1 binding: `DB`
- D1 database: `jelajah_blog`
- R2 binding: `BUCKET`
- R2 bucket: `jelajah-blog-assets`
- Cover assets: same-origin `/assets/{object_key}` route

Phase 2 KV rate limiting belum aktif. Jangan menambahkan `RATE_LIMIT_KV` ke dokumentasi deployment aktif sebelum binding dan implementasinya benar-benar tersedia di konfigurasi serta source code.

## Routing

```text
/api/*      -> Hono Worker API
/assets/*   -> Worker R2 asset handler
/           -> frontend/dist/index.html
/posts/*    -> frontend/dist/index.html -> Vue Router
/submit     -> frontend/dist/index.html -> Vue Router
/admin/*    -> frontend/dist/index.html -> Vue Router
```

`run_worker_first` memprioritaskan Worker untuk `/api/*`. `not_found_handling: "single-page-application"` mengarahkan route Vue yang tidak berupa static file ke `index.html`.

## Verification

Gunakan URL Worker yang diberikan Cloudflare setelah deployment. Contoh:

```bash
BASE="https://jelajah-blog.<account>.workers.dev"

curl "$BASE/"
curl "$BASE/api/posts?page=1&limit=10"
curl "$BASE/api/categories"
```

Expected health response:

```json
{"ok":true,"service":"jelajah-blog-api"}
```

Verify article engagement:

```bash
SLUG="contoh-slug"

curl -X POST "$BASE/api/posts/$SLUG/view"

curl -X POST "$BASE/api/posts/$SLUG/react" \
  -H "Content-Type: application/json" \
  -d '{"type":"like"}'

curl "$BASE/api/posts/$SLUG"
```

Verify submission and moderation manually:

- `/submit` menerima artikel dengan cover JPEG, PNG, atau WebP maksimal 2 MB.
- Turnstile berhasil diverifikasi di Worker.
- `/admin` dapat memuat pending posts dengan `ADMIN_TOKEN` valid.
- Approve membuat post muncul di endpoint publik.
- Reject dan delete menulis `audit_logs`.
- Cover image dapat diakses melalui `/assets/*`.

## Post-Deploy Checklist

- `GET /` mengembalikan health response.
- `GET /api/posts` hanya mengembalikan post `approved`.
- Pagination endpoint list menggunakan default `limit=10`.
- Article detail menampilkan `views`, `likes`, dan `dislikes`.
- View duplicate dari fingerprint yang sama tidak menambah counter.
- Like, dislike, dan `none` memperbarui counter dengan benar.
- Submission memvalidasi Turnstile, input, ukuran, dan tipe cover.
- Admin actions menulis `audit_logs`.
- SPA routes `/`, `/posts/:slug`, `/submit`, dan `/admin` terlayani dari Worker.
