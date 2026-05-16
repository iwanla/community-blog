export const SUPPORTED_LANGS = ["id", "en"];

export const CATEGORIES = ["Wisata", "Budaya", "Kuliner", "Sejarah", "Berita Lokal", "Cerita Warga", "UMKM", "Politik"];

const CATEGORY_LABELS = {
  id: {
    Wisata: "Wisata",
    Budaya: "Budaya",
    Kuliner: "Kuliner",
    Sejarah: "Sejarah",
    "Berita Lokal": "Berita Lokal",
    "Cerita Warga": "Cerita Warga",
    UMKM: "UMKM",
    Politik: "Politik",
  },
  en: {
    Wisata: "Tourism",
    Budaya: "Culture",
    Kuliner: "Food",
    Sejarah: "History",
    "Berita Lokal": "Local News",
    "Cerita Warga": "Community Stories",
    UMKM: "Local Business",
    Politik: "Politics",
  },
};

const DICTIONARY = {
  id: {
    "meta.homeTitle": "JelajahTaliabu - Cerita dari Pulau Taliabu",
    "meta.homeDescription": "Platform komunitas untuk berbagi cerita, wisata, budaya, dan kuliner seputar Pulau Taliabu.",
    "meta.homeOgDescription": "Cerita dari Pulau Taliabu",
    "meta.articleTitle": "Artikel - JelajahTaliabu",
    "meta.submitTitle": "Kirim Artikel | JelajahTaliabu",
    "meta.submitDescription": "Kirim artikel warga untuk JelajahTaliabu.",
    "meta.submitOgDescription": "Bagikan cerita, wisata, budaya, kuliner, atau kabar dari Pulau Taliabu.",
    "nav.articles": "Artikel",
    "nav.submit": "+ Tulis Artikel",
    "nav.submitShort": "Kirim Artikel",
    "nav.back": "Kembali",
    "nav.menu": "Menu",
    "nav.close": "Tutup",
    "nav.language": "Bahasa",
    "hero.eyebrow": "Pulau Taliabu, Maluku Utara",
    "hero.titlePrefix": "Jelajahi cerita &",
    "hero.titleEm": "keajaiban",
    "hero.titleSuffix": "Taliabu",
    "hero.subtitle": "Platform komunitas untuk berbagi wisata, budaya, kuliner, dan cerita warga dari seluruh penjuru Pulau Taliabu.",
    "home.searchPlaceholder": "Cari artikel...",
    "home.all": "Semua",
    "home.latest": "Artikel Terbaru",
    "home.loading": "memuat...",
    "home.count": "{count} artikel",
    "home.empty": "Tidak ada artikel yang cocok.",
    "home.loadFailed": "gagal memuat",
    "category.wisata": "Wisata",
    "category.budaya": "Budaya",
    "category.kuliner": "Kuliner",
    "category.sejarah": "Sejarah",
    "category.beritaLokal": "Berita Lokal",
    "category.ceritaWarga": "Cerita Warga",
    "category.umkm": "UMKM",
    "category.politik": "Politik",
    "footer.subtitle": "Ditulis oleh warga, untuk semua orang.",
    "footer.tagline": "Platform komunitas untuk berbagi cerita, wisata, budaya, dan kuliner dari Pulau Taliabu.",
    "footer.platform": "Platform",
    "footer.about": "Tentang Kami",
    "footer.writingGuide": "Panduan Menulis",
    "footer.contentPolicy": "Kebijakan Konten",
    "footer.contact": "Hubungi Kami",
    "footer.copy": "\u00a9 2026 JelajahTaliabu. Ditulis oleh warga, untuk semua orang.",
    "article.notFoundTitle": "Artikel tidak ditemukan",
    "article.notFoundBody": "Artikel yang kamu cari mungkin sudah dihapus atau belum dipublikasikan.",
    "article.backHome": "Kembali ke Beranda",
    "article.share": "Bagikan:",
    "article.copy": "Salin Tautan",
    "article.copied": "Tersalin!",
    "article.info": "Informasi Artikel",
    "article.author": "Penulis",
    "article.location": "Lokasi",
    "article.published": "Dipublikasikan",
    "article.category": "Kategori",
    "article.related": "Artikel Terkait",
    "article.noRelated": "Belum ada artikel terkait.",
    "article.anonymous": "Anonim",
    "submit.eyebrow": "Kontribusi warga",
    "submit.heading": "Tulis & bagikan ceritamu dari Taliabu",
    "submit.subtitle": "Artikel yang kamu kirim akan ditinjau oleh admin sebelum ditampilkan di website. Proses verifikasi biasanya memakan waktu 1-2 hari.",
    "submit.authorSection": "Informasi Penulis",
    "submit.authorName": "Nama",
    "submit.authorNamePlaceholder": "Nama lengkap kamu",
    "submit.authorNameError": "Nama wajib diisi.",
    "submit.authorEmail": "Email",
    "submit.authorEmailHint": "untuk konfirmasi admin",
    "submit.authorEmailPlaceholder": "nama@email.com",
    "submit.authorEmailError": "Email wajib diisi.",
    "submit.detailSection": "Detail Artikel",
    "submit.title": "Judul Artikel",
    "submit.titlePlaceholder": "Tulis judul yang menarik...",
    "submit.titleError": "Judul wajib diisi.",
    "submit.category": "Kategori",
    "submit.categoryPlaceholder": "Pilih kategori...",
    "submit.categoryError": "Pilih salah satu kategori.",
    "submit.location": "Lokasi",
    "submit.locationLabel": "Lokasi / Wilayah",
    "submit.locationPlaceholder": "Nama desa atau wilayah",
    "submit.locationError": "Lokasi wajib diisi.",
    "submit.coverSection": "Cover Image",
    "submit.coverImage": "Cover image",
    "submit.coverUpload": "Upload Cover",
    "submit.coverHint": "JPG, PNG, atau WebP maksimal 2MB",
    "submit.previewAlt": "Preview cover",
    "submit.contentSection": "Isi Artikel",
    "submit.guidelinesTitle": "Panduan penulisan",
    "submit.guidelineClear": "Tulis dengan bahasa yang jelas dan mudah dipahami",
    "submit.guidelineLength": "Minimal 150 karakter, maksimal 10.000 karakter",
    "submit.guidelineSafe": "Hindari konten yang mengandung SARA atau hoaks",
    "submit.guidelineParagraphs": "Gunakan baris kosong untuk memisahkan paragraf",
    "submit.content": "Konten",
    "submit.contentPlaceholder": "Tulis ceritamu di sini...",
    "submit.button": "Kirim Artikel",
    "submit.note": "Dengan mengirim artikel, kamu menyetujui bahwa konten ini adalah karya asli dan sesuai dengan panduan komunitas JelajahTaliabu.",
    "submit.required": "Semua field wajib diisi.",
    "submit.invalidFile": "Cover wajib berupa JPG, PNG, atau WebP maksimal 2MB.",
    "submit.contentMin": "Isi artikel minimal 150 karakter.",
    "submit.sending": "Mengirim...",
    "submit.successTitle": "Artikel berhasil dikirim!",
    "submit.success": "Terima kasih sudah berkontribusi. Artikel kamu sedang dalam proses peninjauan oleh admin dan akan segera ditampilkan di website.",
    "submit.backHome": "Kembali ke Beranda",
    "submit.reset": "Tulis Artikel Lain",
    "api.notConfigured": "API URL belum dikonfigurasi di js/api.js.",
    "api.requestFailed": "Permintaan gagal diproses.",
  },
  en: {
    "meta.homeTitle": "JelajahTaliabu - Stories from Taliabu Island",
    "meta.homeDescription": "A community platform for sharing stories, travel, culture, and food around Taliabu Island.",
    "meta.homeOgDescription": "Stories from Taliabu Island",
    "meta.articleTitle": "Article - JelajahTaliabu",
    "meta.submitTitle": "Submit Article | JelajahTaliabu",
    "meta.submitDescription": "Submit a community article for JelajahTaliabu.",
    "meta.submitOgDescription": "Share stories, travel, culture, food, or local news from Taliabu Island.",
    "nav.articles": "Articles",
    "nav.submit": "+ Write Article",
    "nav.submitShort": "Submit Article",
    "nav.back": "Back",
    "nav.menu": "Menu",
    "nav.close": "Close",
    "nav.language": "Language",
    "hero.eyebrow": "Taliabu Island, North Maluku",
    "hero.titlePrefix": "Explore the stories &",
    "hero.titleEm": "wonders",
    "hero.titleSuffix": "of Taliabu",
    "hero.subtitle": "A community platform for sharing travel, culture, food, and local stories from across Taliabu Island.",
    "home.searchPlaceholder": "Search articles...",
    "home.all": "All",
    "home.latest": "Latest Articles",
    "home.loading": "loading...",
    "home.count": "{count} articles",
    "home.empty": "No matching articles.",
    "home.loadFailed": "failed to load",
    "category.wisata": "Tourism",
    "category.budaya": "Culture",
    "category.kuliner": "Food",
    "category.sejarah": "History",
    "category.beritaLokal": "Local News",
    "category.ceritaWarga": "Community Stories",
    "category.umkm": "Local Business",
    "category.politik": "Politics",
    "footer.subtitle": "Written by locals, for everyone.",
    "footer.tagline": "A community platform for sharing stories, travel, culture, and food from Taliabu Island.",
    "footer.platform": "Platform",
    "footer.about": "About Us",
    "footer.writingGuide": "Writing Guide",
    "footer.contentPolicy": "Content Policy",
    "footer.contact": "Contact Us",
    "footer.copy": "\u00a9 2026 JelajahTaliabu. Written by locals, for everyone.",
    "article.notFoundTitle": "Article not found",
    "article.notFoundBody": "The article you are looking for may have been removed or is not published yet.",
    "article.backHome": "Back to Home",
    "article.share": "Share:",
    "article.copy": "Copy Link",
    "article.copied": "Copied!",
    "article.info": "Article Information",
    "article.author": "Author",
    "article.location": "Location",
    "article.published": "Published",
    "article.category": "Category",
    "article.related": "Related Articles",
    "article.noRelated": "No related articles yet.",
    "article.anonymous": "Anonymous",
    "submit.eyebrow": "Community contribution",
    "submit.heading": "Write & share your story from Taliabu",
    "submit.subtitle": "Your article will be reviewed by an admin before it appears on the website. Verification usually takes 1-2 days.",
    "submit.authorSection": "Author Information",
    "submit.authorName": "Name",
    "submit.authorNamePlaceholder": "Your full name",
    "submit.authorNameError": "Name is required.",
    "submit.authorEmail": "Email",
    "submit.authorEmailHint": "for admin confirmation",
    "submit.authorEmailPlaceholder": "name@email.com",
    "submit.authorEmailError": "Email is required.",
    "submit.detailSection": "Article Details",
    "submit.title": "Article Title",
    "submit.titlePlaceholder": "Write a compelling title...",
    "submit.titleError": "Title is required.",
    "submit.category": "Category",
    "submit.categoryPlaceholder": "Choose category...",
    "submit.categoryError": "Choose one category.",
    "submit.location": "Location",
    "submit.locationLabel": "Location / Area",
    "submit.locationPlaceholder": "Village or area name",
    "submit.locationError": "Location is required.",
    "submit.coverSection": "Cover Image",
    "submit.coverImage": "Cover image",
    "submit.coverUpload": "Upload Cover",
    "submit.coverHint": "JPG, PNG, or WebP up to 2MB",
    "submit.previewAlt": "Cover preview",
    "submit.contentSection": "Article Content",
    "submit.guidelinesTitle": "Writing guidelines",
    "submit.guidelineClear": "Write clearly and make it easy to understand",
    "submit.guidelineLength": "Minimum 150 characters, maximum 10,000 characters",
    "submit.guidelineSafe": "Avoid hateful, discriminatory, or misleading content",
    "submit.guidelineParagraphs": "Use blank lines to separate paragraphs",
    "submit.content": "Content",
    "submit.contentPlaceholder": "Write your story here...",
    "submit.button": "Submit Article",
    "submit.note": "By submitting an article, you agree that this content is original and follows the JelajahTaliabu community guidelines.",
    "submit.required": "All fields are required.",
    "submit.invalidFile": "Cover must be a JPG, PNG, or WebP up to 2MB.",
    "submit.contentMin": "Article content must be at least 150 characters.",
    "submit.sending": "Submitting...",
    "submit.successTitle": "Article submitted successfully!",
    "submit.success": "Thank you for contributing. Your article is being reviewed by an admin and will appear on the website soon.",
    "submit.backHome": "Back to Home",
    "submit.reset": "Write Another Article",
    "api.notConfigured": "API URL is not configured in js/api.js.",
    "api.requestFailed": "The request could not be processed.",
  },
};

export function getLang() {
  const lang = new URLSearchParams(window.location.search).get("lang");
  return SUPPORTED_LANGS.includes(lang) ? lang : "id";
}

export function getLocale() {
  return getLang() === "en" ? "en-US" : "id-ID";
}

export function getOgLocale() {
  return getLang() === "en" ? "en_US" : "id_ID";
}

export function t(key, replacements = {}) {
  const value = DICTIONARY[getLang()][key] || DICTIONARY.id[key] || key;
  return Object.entries(replacements).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement),
    value,
  );
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[getLang()][category] || CATEGORY_LABELS.id[category] || category;
}

export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(getLocale(), options);
}

export function withLang(url) {
  const lang = getLang();
  const parsedUrl = new URL(url, window.location.href);
  parsedUrl.searchParams.set("lang", lang);
  return `${parsedUrl.pathname.split("/").pop()}${parsedUrl.search}${parsedUrl.hash}`;
}

export function setMeta(selector, content) {
  const tag = document.querySelector(selector);
  if (tag) {
    tag.setAttribute("content", content || "");
  }
}

export function absoluteUrl(path = "") {
  return new URL(path, window.location.origin).toString();
}

export function currentCanonicalUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
}

export function defaultShareImage() {
  return absoluteUrl("assets/img/logo.png");
}

export function setLink(selector, href) {
  const tag = document.querySelector(selector);
  if (tag) {
    tag.setAttribute("href", href || "");
  }
}

export function setJsonLd(id, schema) {
  const tag = document.getElementById(id);
  if (tag) {
    tag.textContent = JSON.stringify(schema);
  }
}

export function applyTranslations() {
  document.documentElement.lang = getLang();

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  document.querySelectorAll("[data-preserve-lang]").forEach((element) => {
    const href = element.getAttribute("href");
    if (href) {
      element.setAttribute("href", withLang(href));
    }
  });

  renderLanguageSwitchers();
}

export function renderLanguageSwitchers() {
  document.querySelectorAll("[data-lang-switcher]").forEach((container) => {
    const activeLang = getLang();
    container.innerHTML = SUPPORTED_LANGS.map((lang) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("lang", lang);
      const active = lang === activeLang ? ' aria-current="true"' : "";
      return `<a href="${nextUrl.pathname.split("/").pop()}${nextUrl.search}${nextUrl.hash}"${active}>${lang.toUpperCase()}</a>`;
    }).join("");
  });
}
