<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getApprovedPosts, getPostBySlug, reactToPost, trackPostView } from "../services/api";
import type { ReactionType } from "../services/api";
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
const currentVote = ref<"like" | "dislike" | null>(null);
const currentLikes = ref(0);
const currentDislikes = ref(0);

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
const viewCount = computed(() => post.value?.views || 0);
const reactionRatio = computed(() => calcRatio(currentLikes.value, currentDislikes.value));

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

function formatNum(value = 0) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}rb` : String(value);
}

function calcRatio(likes = 0, dislikes = 0) {
  const total = likes + dislikes;
  return total ? `${Math.round((likes / total) * 100)}% ${t("article.positive")}` : "-";
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
    imageAlt: value.title,
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
  currentVote.value = null;
  currentLikes.value = 0;
  currentDislikes.value = 0;
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
      currentLikes.value = post.value.likes || 0;
      currentDislikes.value = post.value.dislikes || 0;
      restoreVote(post.value.slug);
      renderArticleMeta(post.value);
      void trackView(post.value.slug);
    }
    loading.value = false;
  }
}

function restoreVote(slug: string) {
  const savedVote = localStorage.getItem(`vote_${slug}`);
  currentVote.value = savedVote === "like" || savedVote === "dislike" ? savedVote : null;
}

function persistVote(slug: string) {
  if (currentVote.value) {
    localStorage.setItem(`vote_${slug}`, currentVote.value);
  } else {
    localStorage.removeItem(`vote_${slug}`);
  }
}

async function trackView(slug: string) {
  try {
    const result = await trackPostView(slug);
    if (post.value?.slug === slug) {
      post.value = { ...post.value, views: result.views };
    }
  } catch {
    // Non-critical: article content should remain readable if tracking fails.
  }
}

async function handleVote(type: "like" | "dislike") {
  if (!post.value) {
    return;
  }

  const slug = post.value.slug;
  const previousVote = currentVote.value;
  const previousLikes = currentLikes.value;
  const previousDislikes = currentDislikes.value;
  let nextType: ReactionType = type;

  if (currentVote.value === type) {
    currentVote.value = null;
    nextType = "none";
    if (type === "like") {
      currentLikes.value = Math.max(0, currentLikes.value - 1);
    } else {
      currentDislikes.value = Math.max(0, currentDislikes.value - 1);
    }
  } else {
    if (currentVote.value === "like") {
      currentLikes.value = Math.max(0, currentLikes.value - 1);
    }
    if (currentVote.value === "dislike") {
      currentDislikes.value = Math.max(0, currentDislikes.value - 1);
    }

    currentVote.value = type;
    if (type === "like") {
      currentLikes.value += 1;
    } else {
      currentDislikes.value += 1;
    }
  }

  persistVote(slug);

  try {
    const result = await reactToPost(slug, nextType);
    currentLikes.value = result.likes;
    currentDislikes.value = result.dislikes;
    if (post.value?.slug === slug) {
      post.value = { ...post.value, likes: result.likes, dislikes: result.dislikes };
    }
  } catch {
    currentVote.value = previousVote;
    currentLikes.value = previousLikes;
    currentDislikes.value = previousDislikes;
    persistVote(slug);
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
        <div class="meta-item views-meta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {{ formatNum(viewCount) }} {{ t("article.visitors") }}
        </div>
      </div>

      <div class="article-body" v-html="contentToHtml(post.content)"></div>

      <div class="reaction-bar">
        <div class="reaction-group">
          <button class="react-btn" :class="{ 'like-active': currentVote === 'like' }" type="button" :aria-label="t('article.like')" @click="handleVote('like')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{{ formatNum(currentLikes) }}</span>
          </button>
          <button class="react-btn" :class="{ 'dislike-active': currentVote === 'dislike' }" type="button" :aria-label="t('article.dislike')" @click="handleVote('dislike')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
            </svg>
            <span>{{ formatNum(currentDislikes) }}</span>
          </button>
        </div>
        <div class="reaction-divider"></div>
        <span class="reaction-ratio">{{ reactionRatio }}</span>
        <div class="reaction-views">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {{ formatNum(viewCount) }} {{ t("article.views") }}
        </div>
      </div>

      <div class="share-bar">
        <span class="share-label">{{ t("article.share") }}</span>
        <a class="share-btn" :href="`https://wa.me/?text=${shareText}%20${shareUrl}`" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor" class="whatsapp-icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L0 24l6.302-1.51A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.37l-.36-.214-3.733.894.945-3.623-.234-.374A9.79 9.79 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z" /></svg>
          WhatsApp
        </a>
        <button class="share-btn" type="button" @click="copyLink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          {{ copied ? t("article.copied") : t("article.copy") }}
        </button>
      </div>
    </article>

    <aside class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-label">{{ t("article.stats") }}</div>
        <div class="stat-grid">
          <div class="stat-card stat-views">
            <small>{{ t("article.visitors") }}</small>
            <strong>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              {{ formatNum(viewCount) }}
            </strong>
          </div>
          <div class="stat-card stat-ratio">
            <small>{{ t("article.positive") }}</small>
            <strong>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              {{ reactionRatio }}
            </strong>
          </div>
          <div class="stat-card stat-likes">
            <small>{{ t("article.like") }}</small>
            <strong>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /></svg>
              {{ formatNum(currentLikes) }}
            </strong>
          </div>
          <div class="stat-card stat-dislikes">
            <small>{{ t("article.dislike") }}</small>
            <strong>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /></svg>
              {{ formatNum(currentDislikes) }}
            </strong>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">{{ t("article.info") }}</div>
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg></div>
            <div class="info-text"><small>{{ t("article.author") }}</small><span>{{ authorName }}</span></div>
          </div>
          <div class="info-sep"></div>
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg></div>
            <div class="info-text"><small>{{ t("article.location") }}</small><span>{{ post.location }}</span></div>
          </div>
          <div class="info-sep"></div>
          <div class="info-row">
            <div class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
            <div class="info-text"><small>{{ t("article.published") }}</small><span>{{ formatDate(post.created_at, { day: "numeric", month: "long", year: "numeric" }) }}</span></div>
          </div>
          <div class="info-sep"></div>
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
