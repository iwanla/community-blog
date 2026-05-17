<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getApprovedPosts, getFeaturedPost } from "../services/api";
import { postsOrDummy } from "../utils/dummy-posts";
import { contentToPlainText } from "../utils/content";
import { absoluteUrl, categoryLabel, CATEGORIES, currentCanonicalUrl, defaultShareImage, formatDate, getLang, setJsonLd, t } from "../i18n/index";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";
import type { CategoryStyle, CategoryStyleMap, Post } from "../types";

const route = useRoute();
const posts = ref<Post[]>([]);
const apiFeaturedPost = ref<Post | null>(null);
const searchQuery = ref("");
const isLoading = ref(true);

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

const filteredPosts = computed(() => {
  const query = searchQuery.value.toLowerCase();
  const routeCategory = Array.isArray(route.query.category) ? route.query.category[0] : route.query.category;
  const activeCategory = routeCategory && CATEGORIES.includes(routeCategory) ? routeCategory : "semua";
  return posts.value.filter((post) => {
    const matchCat = activeCategory === "semua" || post.category === activeCategory;
    const searchable = [post.title, post.location, post.category, categoryLabel(post.category), contentToPlainText(post.content)]
      .join(" ")
      .toLowerCase();
    return matchCat && (!query || searchable.includes(query));
  });
});

const featuredPost = computed(() => {
  return apiFeaturedPost.value || [...posts.value].sort((a, b) => {
    const scoreDiff = featuredScore(b) - featuredScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return postTimestamp(b) - postTimestamp(a);
  })[0];
});

function excerpt(value: string, max = 100) {
  const text = contentToPlainText(value);
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

function categoryStyle(category: string): CategoryStyle {
  return catStyle[category] || { text: "cat-cerita", bg: "cat-bg-cerita" };
}

function featuredScore(post: Post) {
  const views = post.views_count ?? post.views ?? 0;
  const likes = post.likes_count ?? post.likes ?? 0;
  return views + (likes * 5);
}

function postTimestamp(post: Post) {
  const date = new Date(post.approved_at || post.created_at);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function renderMeta() {
  const title = t("meta.homeTitle");
  const description = t("meta.homeDescription");
  const url = currentCanonicalUrl();
  const image = defaultShareImage();

  setRobots("index, follow");
  resetArticleMeta();
  setBaseMeta({
    title,
    description,
    url,
    image,
    type: "website",
  });
  setJsonLd("structured-data", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JelajahTaliabu",
    url: absoluteUrl("/"),
    description,
    inLanguage: document.documentElement.lang,
  });
}

onMounted(async () => {
  renderMeta();
  const [postsResult, featuredResult] = await Promise.allSettled([
    getApprovedPosts(),
    getFeaturedPost(),
  ]);

  if (postsResult.status === "fulfilled") {
    posts.value = postsOrDummy(postsResult.value);
  } else {
    posts.value = postsOrDummy([]);
  }

  if (featuredResult.status === "fulfilled") {
    apiFeaturedPost.value = featuredResult.value;
  }

  isLoading.value = false;
});

watch(() => route.fullPath, renderMeta);
</script>

<template>
  <section class="hero">
    <div class="hero-eyebrow">
      <span class="hero-eyebrow-line"></span>
      <span>{{ t("hero.eyebrow") }}</span>
    </div>
    <h1 class="hero-title">
      <span>{{ t("hero.titlePrefix") }}</span><br><em>{{ t("hero.titleEm") }}</em> <span>{{ t("hero.titleSuffix") }}</span>
    </h1>
    <p class="hero-sub">{{ t("hero.subtitle") }}</p>
  </section>

  <div class="controls">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input v-model="searchQuery" class="search-input" type="text" :placeholder="t('home.searchPlaceholder')" />
    </div>
  </div>

  <section v-if="featuredPost" class="featured-section" aria-labelledby="featured-title">
    <div class="section-header">
      <h2 id="featured-title" class="section-heading">{{ t("home.featured") }}</h2>
    </div>
    <RouterLink class="featured-card" :to="{ name: 'article', params: { slug: featuredPost.slug }, query: { lang: getLang() } }">
      <div class="featured-img" :class="categoryStyle(featuredPost.category).bg">
        <img v-if="featuredPost.image_url" :src="featuredPost.image_url" :alt="featuredPost.title" loading="lazy" />
        <div v-else class="featured-img-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 16M6 8h.01M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
        </div>
      </div>
      <div class="featured-body">
        <div class="featured-label">{{ t("home.featuredLabel") }}</div>
        <span class="featured-badge" :class="[categoryStyle(featuredPost.category).bg, categoryStyle(featuredPost.category).text]">{{ categoryLabel(featuredPost.category) }}</span>
        <div class="featured-card-title">{{ featuredPost.title }}</div>
        <div class="featured-excerpt">{{ excerpt(featuredPost.content, 220) }}</div>
        <div class="featured-meta">
          <div class="featured-loc">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
            {{ featuredPost.location }}
          </div>
          <div class="featured-date">{{ formatDate(featuredPost.created_at) }}</div>
          <div class="featured-read">
            {{ t("home.readMore") }}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
        </div>
      </div>
    </RouterLink>
  </section>

  <div class="section-divider">
    <h2>{{ t("home.latest") }}</h2>
    <span>{{ isLoading ? t("home.loading") : t("home.count", { count: filteredPosts.length }) }}</span>
  </div>

  <main id="articles-grid" class="articles-grid">
    <template v-if="isLoading">
      <div v-for="index in 3" :key="index" class="card is-loading">
        <div class="skeleton skeleton-img"></div>
        <div class="card-body skeleton-card-body">
          <div class="skeleton skeleton-line-sm"></div>
          <div class="skeleton skeleton-line-lg"></div>
          <div class="skeleton skeleton-line-md"></div>
          <div class="skeleton skeleton-line-footer"></div>
        </div>
      </div>
    </template>

    <div v-else-if="filteredPosts.length === 0" class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      <p>{{ t("home.empty") }}</p>
    </div>

    <RouterLink v-for="(post, index) in filteredPosts" v-else :key="post.id || post.slug" class="card" :class="`delay-${Math.min(index, 6)}`" :to="{ name: 'article', params: { slug: post.slug }, query: { lang: getLang() } }">
      <div class="card-img" :class="categoryStyle(post.category).bg">
        <img v-if="post.image_url" :src="post.image_url" :alt="post.title" loading="lazy" />
        <div v-else class="card-img-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 16M6 8h.01M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
        </div>
      </div>
      <div class="card-body">
        <div class="card-cat" :class="categoryStyle(post.category).text">{{ categoryLabel(post.category) }}</div>
        <div class="card-title">{{ post.title }}</div>
        <div class="card-excerpt">{{ excerpt(post.content) }}</div>
        <div class="card-footer">
          <div class="card-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
            {{ post.location }}
          </div>
          <div class="card-meta">{{ formatDate(post.created_at) }}</div>
        </div>
      </div>
    </RouterLink>
  </main>

  <section class="cta-section" aria-labelledby="contribute-title">
    <div class="cta-banner">
      <div>
        <div class="cta-eyebrow">{{ t("home.ctaEyebrow") }}</div>
        <h2 id="contribute-title" class="cta-title">{{ t("home.ctaTitle") }}</h2>
        <p class="cta-sub">{{ t("home.ctaSubtitle") }}</p>
      </div>
      <div class="cta-action">
        <RouterLink :to="{ path: '/submit', query: { lang: getLang() } }" class="cta-btn">{{ t("home.ctaButton") }}</RouterLink>
        <div class="cta-hint">{{ t("home.ctaHint") }}</div>
      </div>
    </div>
  </section>
</template>
