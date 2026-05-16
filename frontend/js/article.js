import { getApprovedPosts, getPostBySlug } from "./api.js";
import { contentToHtml, contentToPlainText, escapeHtml } from "./markdown.js";
import { postsOrDummy } from "./dummy-posts.js";
import {
  absoluteUrl,
  applyTranslations,
  categoryLabel,
  currentCanonicalUrl,
  defaultShareImage,
  formatDate,
  getOgLocale,
  setJsonLd,
  setLink,
  setMeta,
  t,
  withLang,
} from "./i18n.js";

const catStyle = {
  Wisata: { text: "cat-wisata", bg: "cat-bg-wisata" },
  Kuliner: { text: "cat-kuliner", bg: "cat-bg-kuliner" },
  Budaya: { text: "cat-budaya", bg: "cat-bg-budaya" },
  Sejarah: { text: "cat-sejarah", bg: "cat-bg-sejarah" },
  "Berita Lokal": { text: "cat-berita", bg: "cat-bg-berita" },
  "Cerita Warga": { text: "cat-cerita", bg: "cat-bg-cerita" },
  UMKM: { text: "cat-umkm", bg: "cat-bg-umkm" },
  Politik: { text: "cat-berita", bg: "cat-bg-berita" },
};

function initials(name) {
  return String(name || t("article.anonymous"))
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getSlug() {
  return new URLSearchParams(window.location.search).get("slug") || "";
}

function textExcerpt(value, max = 160) {
  const text = contentToPlainText(value);
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

function shareImageUrl(value) {
  return value ? new URL(value, window.location.origin).toString() : defaultShareImage();
}

function renderPlaceholderIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 16M6 8h.01M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
}

function renderNotFound() {
  document.getElementById("page-content").innerHTML = `
    <div class="not-found">
      <svg class="icon-muted" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <h2>${escapeHtml(t("article.notFoundTitle"))}</h2>
      <p>${escapeHtml(t("article.notFoundBody"))}</p>
      <a href="${withLang("index.html")}" class="btn-back">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        ${escapeHtml(t("article.backHome"))}
      </a>
    </div>`;
}

function renderCover(post) {
  const coverWrap = document.getElementById("cover-wrap");
  const imageUrl = escapeHtml(post.image_url);

  coverWrap.classList.remove("is-hidden");
  coverWrap.innerHTML = imageUrl
    ? `<img src="${imageUrl}" alt="${escapeHtml(post.title)}" />`
    : `<div class="cover-placeholder">${renderPlaceholderIcon()}</div>`;
}

function renderRelated(related) {
  if (related.length === 0) {
    return `<p class="u-muted-note">${escapeHtml(t("article.noRelated"))}</p>`;
  }

  return related
    .map((post) => {
      const style = catStyle[post.category] || { text: "cat-cerita", bg: "cat-bg-cerita" };
      const title = escapeHtml(post.title);
      const imageUrl = escapeHtml(post.image_url);

      return `
        <a class="related-card" href="${withLang(`article.html?slug=${encodeURIComponent(post.slug || "")}`)}">
          <div class="related-thumb ${style.bg}">
            ${imageUrl ? `<img src="${imageUrl}" alt="${title}" loading="lazy"/>` : renderPlaceholderIcon()}
          </div>
          <div class="related-info">
            <div class="related-cat ${style.text}">${escapeHtml(categoryLabel(post.category))}</div>
            <div class="related-title">${title}</div>
          </div>
        </a>`;
    })
    .join("");
}

function renderArticle(post, related) {
  const style = catStyle[post.category] || { text: "cat-cerita", bg: "cat-bg-cerita" };
  const description = textExcerpt(post.excerpt || post.content, 160);
  const authorName = post.author_name || t("article.anonymous");
  const pageTitle = `${post.title} - JelajahTaliabu`;
  const canonicalUrl = currentCanonicalUrl();
  const imageUrl = shareImageUrl(post.image_url);
  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(post.title || "");

  document.title = pageTitle;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', post.title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[property="og:image"]', imageUrl);
  setMeta('meta[property="og:locale"]', getOgLocale());
  setMeta('meta[property="article:published_time"]', post.created_at);
  setMeta('meta[property="article:modified_time"]', post.approved_at || post.created_at);
  setMeta('meta[property="article:author"]', authorName);
  setMeta('meta[property="article:section"]', categoryLabel(post.category));
  setMeta('meta[name="twitter:title"]', pageTitle);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', imageUrl);
  setLink('link[rel="canonical"]', canonicalUrl);
  setJsonLd("structured-data", {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    image: imageUrl,
    datePublished: post.created_at,
    dateModified: post.approved_at || post.created_at,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "JelajahTaliabu",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("assets/img/logo.png"),
      },
    },
    mainEntityOfPage: canonicalUrl,
    articleSection: categoryLabel(post.category),
    inLanguage: document.documentElement.lang,
  });

  renderCover(post);

  document.getElementById("page-content").innerHTML = `
    <div class="page-layout">
      <article class="article-wrap">
        <div class="article-cat ${style.bg}">${escapeHtml(categoryLabel(post.category))}</div>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>

        <div class="article-meta">
          <div class="meta-author">
            <div class="author-avatar">${escapeHtml(initials(authorName))}</div>
            <span class="meta-author-name">${escapeHtml(authorName)}</span>
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${escapeHtml(formatDate(post.created_at, { day: "numeric", month: "long", year: "numeric" }))}
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            ${escapeHtml(post.location)}
          </div>
        </div>

        <div class="article-body">${contentToHtml(post.content)}</div>

        <div class="share-bar">
          <span class="share-label">${escapeHtml(t("article.share"))}</span>
          <a class="share-btn" href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L0 24l6.302-1.51A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.37l-.36-.214-3.733.894.945-3.623-.234-.374A9.79 9.79 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/></svg>
            WhatsApp
          </a>
          <button class="share-btn" id="copy-link" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span id="copy-label">${escapeHtml(t("article.copy"))}</span>
          </button>
        </div>
      </article>

      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">${escapeHtml(t("article.info"))}</div>
          <div class="info-card">
            <div class="info-row">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="info-text">
                <small>${escapeHtml(t("article.author"))}</small>
                <span>${escapeHtml(authorName)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              </div>
              <div class="info-text">
                <small>${escapeHtml(t("article.location"))}</small>
                <span>${escapeHtml(post.location)}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="info-text">
                <small>${escapeHtml(t("article.published"))}</small>
                <span>${escapeHtml(formatDate(post.created_at, { day: "numeric", month: "long", year: "numeric" }))}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div class="info-text">
                <small>${escapeHtml(t("article.category"))}</small>
                <span>${escapeHtml(categoryLabel(post.category))}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-label">${escapeHtml(t("article.related"))}</div>
          ${renderRelated(related)}
        </div>
      </aside>
    </div>`;

  document.getElementById("copy-link").addEventListener("click", copyLink);
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const label = document.getElementById("copy-label");
    if (!label) {
      return;
    }

    label.textContent = t("article.copied");
    setTimeout(() => {
      label.textContent = t("article.copy");
    }, 2000);
  });
}

async function init() {
  applyTranslations();
  document.title = t("meta.articleTitle");
  setMeta('meta[property="og:url"]', currentCanonicalUrl());
  setMeta('meta[property="og:image"]', defaultShareImage());
  setMeta('meta[property="og:locale"]', getOgLocale());
  setMeta('meta[name="twitter:image"]', defaultShareImage());
  setLink('link[rel="canonical"]', currentCanonicalUrl());

  const slug = getSlug();
  if (!slug) {
    renderNotFound();
    return;
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      renderNotFound();
      return;
    }

    const related = (await getApprovedPosts({ limit: 6 }))
      .filter((item) => item.slug !== slug && item.category === post.category)
      .slice(0, 3);

    renderArticle(post, related);
  } catch {
    const posts = postsOrDummy([]);
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      renderNotFound();
      return;
    }

    const related = posts
      .filter((item) => item.slug !== slug && item.category === post.category)
      .slice(0, 3);

    renderArticle(post, related);
  }
}

init();
