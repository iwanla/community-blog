import { getApprovedPosts } from "./api.js";
import { postsOrDummy } from "./dummy-posts.js";
import { applyTranslations, categoryLabel, formatDate, setMeta, t, withLang } from "./i18n.js";

const catStyle = {
  Wisata: { text: "cat-wisata", bg: "cat-bg-wisata" },
  Kuliner: { text: "cat-kuliner", bg: "cat-bg-kuliner" },
  Budaya: { text: "cat-budaya", bg: "cat-bg-budaya" },
  Sejarah: { text: "cat-sejarah", bg: "cat-bg-sejarah" },
  Berita: { text: "cat-berita", bg: "cat-bg-berita" },
  "Cerita Warga": { text: "cat-cerita", bg: "cat-bg-cerita" },
  UMKM: { text: "cat-umkm", bg: "cat-bg-umkm" },
};

let allPosts = [];
let activeCategory = "semua";
let searchQuery = "";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function excerpt(value, max = 100) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

function placeholderIcon(category) {
  const icons = {
    Wisata:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21c-4.418 0-8-3.582-8-8 0-5.523 8-13 8-13s8 7.477 8 13c0 4.418-3.582 8-8 8z"/><circle cx="12" cy="13" r="2.5"/></svg>',
    Kuliner:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M6 8c0-2.5 1.5-5 3-5M18 8c0-2.5-1.5-5-3-5M5 8h14M5 8c0 4 1 8 7 9M19 8c0 4-1 8-7 9"/></svg>',
    Budaya:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>',
    Sejarah:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"/></svg>',
    Berita:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="17 21 17 13 7 13 7 21"/><polyline stroke-linecap="round" stroke-linejoin="round" points="7 3 7 8 15 8"/></svg>',
    "Cerita Warga":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    UMKM:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/></svg>',
  };

  return icons[category] || icons.Berita;
}

function renderCard(post, index) {
  const style = catStyle[post.category] || { text: "cat-cerita", bg: "cat-bg-cerita" };
  const delayClass = `delay-${Math.min(index, 6)}`;
  const slug = encodeURIComponent(post.slug || "");
  const title = escapeHtml(post.title);
  const category = escapeHtml(categoryLabel(post.category));
  const location = escapeHtml(post.location);
  const imageUrl = escapeHtml(post.image_url);

  return `
    <a class="card ${delayClass}" href="${withLang(`article.html?slug=${slug}`)}">
      <div class="card-img ${style.bg}">
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${title}" loading="lazy" />`
            : `<div class="card-img-placeholder">${placeholderIcon(post.category)}</div>`
        }
      </div>
      <div class="card-body">
        <div class="card-cat ${style.text}">${category}</div>
        <div class="card-title">${title}</div>
        <div class="card-excerpt">${escapeHtml(excerpt(post.content))}</div>
        <div class="card-footer">
          <div class="card-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            ${location}
          </div>
          <div class="card-meta">${escapeHtml(formatDate(post.created_at))}</div>
        </div>
      </div>
    </a>
  `;
}

function filterPosts() {
  return allPosts.filter((post) => {
    const matchCat = activeCategory === "semua" || post.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const searchable = [post.title, post.location, post.category, categoryLabel(post.category), post.content].join(" ").toLowerCase();
    return matchCat && (!query || searchable.includes(query));
  });
}

function renderGrid() {
  const grid = document.getElementById("articles-grid");
  const count = document.getElementById("article-count");
  const filtered = filterPosts();

  count.textContent = t("home.count", { count: filtered.length });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>${escapeHtml(t("home.empty"))}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((post, index) => renderCard(post, index)).join("");
}

function renderError(message) {
  const grid = document.getElementById("articles-grid");
  const count = document.getElementById("article-count");

  count.textContent = t("home.loadFailed");
  grid.innerHTML = `
    <div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

function renderCategoryLabels() {
  document.querySelectorAll("#filter-pills .pill").forEach((button) => {
    const category = button.dataset.cat;
    button.textContent = category === "semua" ? t("home.all") : categoryLabel(category);
  });
}

function renderPageMeta() {
  document.title = t("meta.homeTitle");
  setMeta('meta[name="description"]', t("meta.homeDescription"));
  setMeta('meta[property="og:description"]', t("meta.homeOgDescription"));
}

async function init() {
  applyTranslations();
  renderPageMeta();
  renderCategoryLabels();

  document.getElementById("filter-pills").addEventListener("click", (event) => {
    const button = event.target.closest(".pill");
    if (!button) {
      return;
    }

    document.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.cat;
    renderGrid();
  });

  let searchTimer;
  document.getElementById("search-input").addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = event.target.value;
      renderGrid();
    }, 250);
  });

  try {
    allPosts = postsOrDummy(await getApprovedPosts());
    renderGrid();
  } catch {
    allPosts = postsOrDummy([]);
    renderGrid();
  }
}

init();
