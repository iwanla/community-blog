# desain-spec.md — JelajahTaliabu

> Design specification untuk tema **Modern Pesisir**.
> File ini adalah sumber kebenaran tunggal untuk semua keputusan visual di platform JelajahTaliabu.

---

## Tema

**Modern Pesisir** — Bersih, minimalis, dan profesional dengan nuansa laut dan alam tropis Pulau Taliabu. Terasa lokal namun tidak kampungan; modern namun tidak dingin.

---

## Warna

### Palet Utama

| Token              | Hex       | Penggunaan                                  |
| ------------------ | --------- | ------------------------------------------- |
| `--blue-900`       | `#042C53` | Heading utama, text primary, nav brand      |
| `--blue-800`       | `#0C447C` | Hover state tombol, teks sekunder biru      |
| `--blue-600`       | `#185FA5` | Warna brand utama, tombol primary, link     |
| `--blue-400`       | `#378ADD` | Border focus, aksen dekoratif               |
| `--blue-200`       | `#B5D4F4` | Teks di atas background gelap (footer)      |
| `--blue-50`        | `#E6F1FB` | Background badge Wisata, hero, cover placeholder |

### Palet Aksen

| Token              | Hex       | Kategori     |
| ------------------ | --------- | ------------ |
| `--teal-600`       | `#0F6E56` | Kuliner       |
| `--teal-50`        | `#E1F5EE` | Background badge Kuliner, success icon |
| `--amber-600`      | `#854F0B` | Budaya        |
| `--amber-50`       | `#FAEEDA` | Background badge Budaya |
| `--coral-600`      | `#993C1D` | Sejarah       |
| `--coral-50`       | `#FAECE7` | Background badge Sejarah |
| `#534AB7`          | `#534AB7` | Berita        |
| `#EEEDFE`          | `#EEEDFE` | Background badge Berita |
| `#639922`          | `#639922` | UMKM          |
| `#EAF3DE`          | `#EAF3DE` | Background badge UMKM |

### Warna Netral

| Token              | Hex       | Penggunaan                             |
| ------------------ | --------- | -------------------------------------- |
| `--gray-50`        | `#F1EFE8` | Background halaman (bukan putih murni) |
| `--gray-200`       | `#B4B2A9` | Border, disabled state, placeholder    |
| `--gray-600`       | `#5F5E5A` | Teks sekunder, icon, metadata          |
| `--white`          | `#ffffff`  | Background card, form input            |

### Warna Status

| Token         | Hex       | Penggunaan              |
| ------------- | --------- | ----------------------- |
| `--red-600`   | `#A32D2D` | Error message, required |
| `--red-50`    | `#FCEBEB` | Background input error  |

### Semantic Tokens

```css
--text-primary:   #042C53   /* semua body text utama */
--text-secondary: #5F5E5A   /* teks pendukung, metadata */
--text-muted:     #B4B2A9   /* placeholder, hint, label */
--border:         rgba(4, 44, 83, 0.1)  /* semua border default */
--border-focus:   #378ADD   /* border saat input fokus */
```

---

## Tipografi

### Typeface

| Peran       | Font           | Import                        |
| ----------- | -------------- | ----------------------------- |
| Display     | `Lora`         | Google Fonts — serif          |
| Body / UI   | `DM Sans`      | Google Fonts — sans-serif     |

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
```

### Skala Tipografi

| Elemen              | Font       | Size                        | Weight | Line Height |
| ------------------- | ---------- | --------------------------- | ------ | ----------- |
| Hero title          | Lora       | `clamp(2rem, 5vw, 3.25rem)` | 600    | 1.2         |
| Article title       | Lora       | `clamp(1.6rem, 4vw, 2.4rem)`| 600    | 1.25        |
| Page title (submit) | Lora       | `clamp(1.6rem, 4vw, 2.2rem)`| 600    | 1.25        |
| Section heading     | Lora       | `18px`                      | 600    | —           |
| Card title          | Lora       | `15px`                      | 600    | 1.45        |
| Article body        | Lora       | `17px`                      | 400    | 1.85        |
| Body / UI           | DM Sans    | `15px`                      | 400    | 1.6         |
| Label               | DM Sans    | `13px`                      | 500    | —           |
| Caption / meta      | DM Sans    | `11–12px`                   | 400    | —           |
| Eyebrow / badge     | DM Sans    | `10–11px`                   | 500    | —           |

### Aturan Tipografi

- Judul dan body artikel menggunakan **Lora** (serif) — memberikan nuansa editorial
- Semua elemen UI (nav, tombol, form, badge) menggunakan **DM Sans** (sans-serif)
- Eyebrow text selalu `uppercase` dengan `letter-spacing: 0.08–0.1em`
- Jangan gunakan font weight selain yang didefinisikan di atas

---

## Spacing & Layout

### Breakpoints

| Nama    | Width      |
| ------- | ---------- |
| Mobile  | `≤ 640px`  |
| Tablet  | `641–768px`|
| Desktop | `≥ 769px`  |

### Container

```css
max-width: 1100px;
margin: 0 auto;
padding: 0 2rem;   /* desktop */
padding: 0 1.25rem; /* mobile */
```

### Grid Artikel

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;
```

### Layout Artikel Detail

```css
display: grid;
grid-template-columns: 1fr 300px; /* desktop */
gap: 3rem;
/* mobile: grid-template-columns: 1fr */
```

---

## Border Radius

| Konteks         | Value  |
| --------------- | ------ |
| Card utama      | `12px` |
| Form card       | `14px` |
| Tombol          | `6–8px`|
| Badge / pill    | `20px` |
| Input           | `8px`  |
| Icon container  | `6px`  |
| Info card       | `10px` |
| Related thumb   | `6px`  |

---

## Komponen

### Navbar

- `position: sticky; top: 0`
- Background: `rgba(241, 239, 232, 0.92)` + `backdrop-filter: blur(12px)`
- Height: `60px`
- Border bottom: `1px solid var(--border)`
- Brand: logo icon biru + teks Lora 16px

### Tombol Primary

```css
background: var(--blue-600);
color: white;
border-radius: 6–8px;
padding: 8–11px 16–24px;
font: 500 13–14px DM Sans;
transition: background 0.2s;

:hover  → background: var(--blue-800)
:active → transform: scale(0.98)
:disabled → background: var(--gray-200)
```

### Card Artikel

- Background: `white`, border: `1px solid var(--border)`, radius: `12px`
- Cover image: `height: 160px`, `object-fit: cover`
- Cover placeholder: background sesuai warna kategori
- Hover: `translateY(-3px)` + `box-shadow: 0 8px 24px rgba(4,44,83,0.09)`
- Animasi masuk: `fadeUp` dengan stagger delay per card

### Badge Kategori

```
padding: 4–6px 12–14px
border-radius: 20px
font: 500 10–11px, uppercase, letter-spacing: 0.07em
warna: sesuai tabel kategori di atas
```

### Filter Pill

```
padding: 6px 14px
border-radius: 20px
border: 1px solid var(--border)
background: white

.active → background: var(--blue-600), border: var(--blue-600), color: white
:hover  → border: var(--blue-400), color: var(--blue-600)
```

### Form Input

```css
padding: 9px 12px;
border: 1px solid var(--border);
border-radius: 8px;
background: var(--gray-50);
font: 400 14px DM Sans;

:focus   → border: var(--border-focus), background: white
.error   → border: var(--red-600), background: var(--red-50)
```

### Cover Image (Article Detail)

```css
height: clamp(220px, 40vw, 420px);
object-fit: cover;
```

---

## Animasi

| Nama      | Keyframe                                     | Penggunaan               |
| --------- | -------------------------------------------- | ------------------------ |
| `fadeUp`  | `opacity 0→1`, `translateY(14–16px → 0)`     | Card, halaman, sidebar   |
| `fadeIn`  | `opacity 0→1`                                | Cover image              |
| `shimmer` | gradient slide kanan–kiri                    | Skeleton loading         |
| `spin`    | `rotate 360deg`                              | Loading spinner tombol   |
| `popIn`   | `scale(0.6) → scale(1)` + opacity            | Success icon             |

### Durasi & Easing

```css
transition: 0.2s ease       /* hover state */
animation: fadeUp 0.4–0.5s ease both
stagger delay card: min(index * 0.05s, 0.3s)
```

---

## Ikon

Semua ikon menggunakan **inline SVG** dengan:

```css
fill: none;
stroke: currentColor;
stroke-width: 1.5–2;
stroke-linecap: round;
stroke-linejoin: round;
```

Tidak menggunakan icon library eksternal — semua ikon diambil dari set SVG standar (Heroicons / Feather style).

---

## Skeleton Loading

```css
background: linear-gradient(90deg, #e8e6df 25%, #f1efe8 50%, #e8e6df 75%);
background-size: 200% 100%;
animation: shimmer 1.4s infinite;
border-radius: 6px;
```

Digunakan pada card saat data belum dimuat dari API.

---

## Halaman & Struktur

### index.html — Homepage

```
Navbar
Hero (eyebrow + title + subtitle)
Controls (search + filter pills)
Section header (judul + jumlah artikel)
Article grid (cards)
Footer
```

### article.html — Detail Artikel

```
Navbar
Cover image (full width)
Layout 2 kolom:
  ← Artikel (badge + judul + meta + body + share bar)
  → Sidebar (info card + artikel terkait)
Footer
```

### submit.html — Form Submit

```
Navbar
Page header (eyebrow + judul + subtitle)
Form card:
  - Seksi: Info Penulis (nama, kontak)
  - Seksi: Detail Artikel (judul, kategori, lokasi)
  - Seksi: Cover Image (URL + preview)
  - Seksi: Isi Artikel (guidelines + textarea)
  - Submit area (catatan + tombol)
Success screen (icon + pesan + aksi)
Footer
```

---

## Footer

```css
background: var(--blue-900);
color: var(--blue-200);
padding: 2.5rem 2rem;
text-align: center;

brand text: Lora 18px, color: white
subtext: DM Sans 12px, opacity: 0.7
```

---

## Do & Don't

| ✅ Do                                                      | ❌ Don't                                          |
| ---------------------------------------------------------- | ------------------------------------------------- |
| Gunakan `--gray-50` (`#F1EFE8`) sebagai background halaman | Jangan gunakan `#ffffff` murni sebagai background |
| Gunakan Lora untuk semua judul dan body artikel            | Jangan campur font display lain                   |
| Gunakan warna kategori dari tabel yang sudah ditentukan    | Jangan buat warna kategori baru di luar tabel     |
| Pertahankan `border: 1px solid var(--border)` pada card    | Jangan gunakan shadow berat tanpa hover state     |
| Gunakan `clamp()` untuk ukuran font responsif              | Jangan hardcode ukuran font heading               |
| Inline SVG untuk semua ikon                                | Jangan tambahkan icon library eksternal           |