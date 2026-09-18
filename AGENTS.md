# AGENTS.md — JelajahTaliabu

## Project Overview

JelajahTaliabu adalah platform blog komunitas untuk berbagi cerita, wisata, budaya, kuliner, dan aktivitas seputar Pulau Taliabu.

- Siapa saja bisa submit artikel dan upload cover image.
- Artikel hanya tampil setelah disetujui admin.
- Admin dapat menerima notifikasi submission melalui Telegram.
- Semua infrastruktur berada di ekosistem Cloudflare.
- Detail arsitektur ada di `docs/ARCHITECTURE.md`.

## Development Guidelines

### Frontend

- Source frontend menggunakan TypeScript dan Vue SFC dengan `<script setup lang="ts">`.
- Route frontend baru dibuat di `frontend/src/router.ts` dan view ditempatkan di feature yang sesuai.
- Request API frontend memakai `frontend/src/shared/api/client.ts`.
- API spesifik endpoint ditempatkan di `frontend/src/features/**/api.ts`.
- Gunakan URL relatif `/api`; jangan menambahkan API hostname atau `VITE_API_BASE_URL`.
- Copy UI dan label kategori dikelola di `frontend/src/shared/i18n/locales/*.json`.
- Gunakan lazy-loaded route untuk feature views yang tidak diperlukan saat initial load.

### Worker

- Feature Worker baru dibuat di `worker/src/features/` dan didaftarkan di `worker/src/index.ts`.
- Infrastruktur lintas feature berada di `worker/src/infrastructure/`.
- Utilitas dan tipe lintas feature berada di `worker/src/shared/`.
- Hindari abstraction baru jika hanya dipakai satu feature.
- Migrasi D1 berada di root `migrations/` agar ditemukan konfigurasi Wrangler root.
- Root `wrangler.jsonc` adalah konfigurasi deployment production; `wrangler.dev.jsonc` untuk development.

## Data and Logic

- Setiap query publik ke D1 wajib memakai `WHERE status = 'approved'`.
- Semua endpoint list wajib memiliki pagination dengan default `limit=10`.
- Slug dibuat otomatis dari title, bukan diinput manual user.
- Semua aksi admin approve, reject, edit, dan delete harus menulis `audit_logs`.

## Security

- `ADMIN_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan `TURNSTILE_SECRET_KEY` hanya disimpan sebagai Worker secrets.
- Frontend hanya memakai env publik seperti `VITE_TURNSTILE_SITE_KEY`.
- Validasi input wajib dilakukan di Worker, bukan hanya di frontend.
- Upload hanya menerima `image/jpeg`, `image/png`, dan `image/webp`.
- Ukuran upload cover maksimal 2 MB.
- Submit memakai rate limiting sederhana di Worker.
- Admin token diverifikasi pada setiap request admin.

## SEO

- Setiap halaman artikel wajib memiliki title, meta description, OpenGraph tags, canonical URL, dan JSON-LD.
- URL artikel menggunakan `/posts/:slug`.
- `robots.txt` dan `sitemap.xml` berada di `frontend/public/`.

## Environment

Frontend:

```env
VITE_TURNSTILE_SITE_KEY=...
```

Worker local secrets berada di `worker/.dev.vars`; gunakan `worker/.dev.vars.example` sebagai template. Jangan commit secret.

## Verification

Gunakan perintah dari root project:

```bash
npm run typecheck
npm run build
npm run db:migrate:local
```

## File Conventions

- Dokumen perencanaan disimpan di `docs/plans/`.
- Dokumentasi arsitektur utama disimpan di `docs/ARCHITECTURE.md`.
