<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getApprovedPosts, getPostBySlug } from "../services/api";
import { categoryLabel, currentCanonicalUrl, defaultShareImage, formatDate, getLang, setJsonLd, setMeta, t } from "../i18n/index";
import { postsOrDummy } from "../utils/dummy-posts";
import { contentToHtml, contentToPlainText } from "../utils/content";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";
import type { CategoryStyle, CategoryStyleMap, Post } from "../types";

const route = useRoute();
const post = ref<Post | null>(null);
const related = ref<Post[]>([]);
const loading = ref(true);
const copied = ref(false);

const catStyle: CategoryStyleMap = {
  Wisata: { text: "cat-wisata", bg: "cat-bg-wisata" },
  Kuliner: { text: "cat-kuliner", bg: "cat-bg-kuliner" },
  Budaya: { text: "cat-budaya", bg: "cat-bg-budaya" },
  Sejarah: { text: "cat-sejarah", bg: "cat-bg-sejarah" },
  "Berita Lokal": { text: "cat-berita", bg: "cat-bg-berita" },
  "Cerita Warga": { text: "cat-cerita", bg: "cat-bg-cerita" },
  UMKM: { text: "cat-umkm", bg: "cat-bg-umkm" },
  Politik: { text: "cat-berita", bg: "cat-bg-berita" },
};

const authorName = computed(() => post.value?.author_name || t("article.anonymous"));
const shareUrl = computed(() => encodeURIComponent(window.location.href));
const shareText = computed(() => encodeURIComponent(post.value?.title || ""));

function categoryStyle(category: string): CategoryStyle {
  return catStyle[category] || { text: "cat-cerita", bg: "cat-bg-cerita" };
}

function initials(name: string) {
  return String(name || t("article.anonymous"))
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function textExcerpt(value: string, max = 160) {
  const text = contentToPlainText(value);
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

function shareImageUrl(value: string) {
  return value ? new URL(value, window.location.origin).toString() : defaultShareImage();
}

function renderDefaultMeta() {
  setRobots("index, follow");
  resetArticleMeta();
  setBaseMeta({
    title: t("meta.articleTitle"),
    description: "Baca cerita, wisata, budaya, kuliner, dan kabar warga dari Pulau Taliabu.",
    url: currentCanonicalUrl(),
    image: defaultShareImage(),
    type: "article",
  });
}

function renderArticleMeta(value: Post) {
  const description = textExcerpt(value.excerpt || value.content, 160);
  const pageTitle = `${value.title} - JelajahTaliabu`;
  const canonicalUrl = currentCanonicalUrl();
  const imageUrl = shareImageUrl(value.image_url);

  setRobots("index, follow");
  setBaseMeta({
    title: pageTitle,
    description,
    url: canonicalUrl,
    image: imageUrl,
    type: "article",
  });
  setMeta('meta[property="article:published_time"]', value.created_at);
  setMeta('meta[property="article:modified_time"]', value.approved_at || value.created_at);
  setMeta('meta[property="article:author"]', authorName.value);
  setMeta('meta[property="article:section"]', categoryLabel(value.category));
  setJsonLd("structured-data", {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: value.title,
    description,
    image: imageUrl,
    datePublished: value.created_at,
    dateModified: value.approved_at || value.created_at,
    author: { "@type": "Person", name: authorName.value },
    publisher: {
      "@type": "Organization",
      name: "JelajahTaliabu",
      logo: { "@type": "ImageObject", url: new URL("/assets/img/logo.png", window.location.origin).toString() },
    },
    mainEntityOfPage: canonicalUrl,
    articleSection: categoryLabel(value.category),
    inLanguage: document.documentElement.lang,
  });
}

async function loadArticle() {
  const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
  loading.value = true;
  copied.value = false;
  renderDefaultMeta();

  if (!slug) {
    post.value = null;
    loading.value = false;
    return;
  }

  try {
    const result = await getPostBySlug(slug);
    post.value = result;
    related.value = result
      ? (await getApprovedPosts({ limit: 6 })).filter((item) => item.slug !== slug && item.category === result.category).slice(0, 3)
      : [];
  } catch {
    const fallback = postsOrDummy([]);
    post.value = fallback.find((item) => item.slug === slug) || null;
    related.value = post.value ? fallback.filter((item) => item.slug !== slug && item.category === post.value.category).slice(0, 3) : [];
  } finally {
    if (post.value) {
      renderArticleMeta(post.value);
    }
    loading.value = false;
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onMounted(loadArticle);
watch(() => route.fullPath, loadArticle);
</script>

<template>
  <div v-if="post" id="cover-wrap" class="cover-wrap">
    <img v-if="post.image_url" :src="post.image_url" :alt="post.title" />
    <div v-else class="cover-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 16M6 8h.01M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
    </div>
  </div>

  <main v-if="loading" class="not-found">
    <p>{{ t("home.loading") }}</p>
  </main>

  <main v-else-if="!post" class="not-found">
    <svg class="icon-muted" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <h2>{{ t("article.notFoundTitle") }}</h2>
    <p>{{ t("article.notFoundBody") }}</p>
    <RouterLink :to="{ path: '/', query: { lang: getLang() } }" class="btn-back">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      {{ t("article.backHome") }}
    </RouterLink>
  </main>

  <div v-else class="page-layout">
    <article class="article-wrap">
      <div class="article-cat" :class="categoryStyle(post.category).bg">{{ categoryLabel(post.category) }}</div>
      <h1 class="article-title">{{ post.title }}</h1>

      <div class="article-meta">
        <div class="meta-author">
          <div class="author-avatar">{{ initials(authorName) }}</div>
          <span class="meta-author-name">{{ authorName }}</span>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          {{ formatDate(post.created_at, { day: "numeric", month: "long", year: "numeric" }) }}
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
          {{ post.location }}
        </div>
      </div>

      <div class="article-body" v-html="contentToHtml(post.content)"></div>

      <div class="share-bar">
        <span class="share-label">{{ t("article.share") }}</span>
        <a class="share-btn" :href="`https://wa.me/?text=${shareText}%20${shareUrl}`" target="_blank" rel="noopener">
          WhatsApp
        </a>
        <button class="share-btn" type="button" @click="copyLink">{{ copied ? t("article.copied") : t("article.copy") }}</button>
      </div>
    </article>

    <aside class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t("article.info") }}</div>
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg></div>
            <div class="info-text"><small>{{ t("article.author") }}</small><span>{{ authorName }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg></div>
            <div class="info-text"><small>{{ t("article.location") }}</small><span>{{ post.location }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
            <div class="info-text"><small>{{ t("article.published") }}</small><span>{{ formatDate(post.created_at, { day: "numeric", month: "long", year: "numeric" }) }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /></svg></div>
            <div class="info-text"><small>{{ t("article.category") }}</small><span>{{ categoryLabel(post.category) }}</span></div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">{{ t("article.related") }}</div>
        <p v-if="related.length === 0" class="u-muted-note">{{ t("article.noRelated") }}</p>
        <RouterLink v-for="item in related" :key="item.id || item.slug" class="related-card" :to="{ name: 'article', params: { slug: item.slug }, query: { lang: getLang() } }">
          <div class="related-thumb" :class="categoryStyle(item.category).bg">
            <img v-if="item.image_url" :src="item.image_url" :alt="item.title" loading="lazy" />
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 16M6 8h.01M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
          </div>
          <div class="related-info">
            <div class="related-cat" :class="categoryStyle(item.category).text">{{ categoryLabel(item.category) }}</div>
            <div class="related-title">{{ item.title }}</div>
          </div>
        </RouterLink>
      </div>
    </aside>
  </div>
</template>
