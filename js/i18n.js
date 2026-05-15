export const SUPPORTED_LANGS = ["id", "en"];

export const CATEGORIES = ["Wisata", "Budaya", "Kuliner", "Sejarah", "Berita", "Cerita Warga", "UMKM"];

const CATEGORY_LABELS = {
  id: {
    Wisata: "Wisata",
    Budaya: "Budaya",
    Kuliner: "Kuliner",
    Sejarah: "Sejarah",
    Berita: "Berita",
    "Cerita Warga": "Cerita Warga",
    UMKM: "UMKM",
  },
  en: {
    Wisata: "Tourism",
    Budaya: "Culture",
    Kuliner: "Food",
    Sejarah: "History",
    Berita: "News",
    "Cerita Warga": "Community Stories",
    UMKM: "Local Business",
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
    "footer.subtitle": "Ditulis oleh warga, untuk semua orang.",
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
    "submit.heading": "Kirim artikel untuk ditinjau admin.",
    "submit.title": "Judul",
    "submit.authorName": "Nama penulis",
    "submit.authorContact": "Kontak penulis",
    "submit.category": "Kategori",
    "submit.categoryPlaceholder": "Pilih kategori",
    "submit.location": "Lokasi",
    "submit.imageUrl": "URL gambar",
    "submit.content": "Isi artikel",
    "submit.button": "Kirim untuk Review",
    "submit.required": "Semua field wajib diisi.",
    "submit.invalidUrl": "URL gambar harus diawali http:// atau https://.",
    "submit.contentMin": "Isi artikel minimal 300 karakter.",
    "submit.sending": "Mengirim artikel...",
    "submit.success": "Artikel terkirim dan menunggu review admin.",
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
    "footer.subtitle": "Written by locals, for everyone.",
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
    "submit.heading": "Submit an article for admin review.",
    "submit.title": "Title",
    "submit.authorName": "Author name",
    "submit.authorContact": "Author contact",
    "submit.category": "Category",
    "submit.categoryPlaceholder": "Choose category",
    "submit.location": "Location",
    "submit.imageUrl": "Image URL",
    "submit.content": "Article content",
    "submit.button": "Submit for Review",
    "submit.required": "All fields are required.",
    "submit.invalidUrl": "Image URL must start with http:// or https://.",
    "submit.contentMin": "Article content must be at least 300 characters.",
    "submit.sending": "Submitting article...",
    "submit.success": "Article submitted and waiting for admin review.",
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
