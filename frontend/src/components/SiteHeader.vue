<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { categoryLabel, CATEGORIES, currentLang, SUPPORTED_LANGS, t } from "../i18n/index";
import type { SupportedLang } from "../i18n/index";

const route = useRoute();
const isOpen = ref(false);
const catBar = ref<HTMLElement | null>(null);
const hasCategoryOverflow = ref(false);
const isCategoryScrollEnd = ref(false);

const isHome = computed(() => route.name === "home");
const lang = currentLang;
const activeCategory = computed(() => {
  const category = Array.isArray(route.query.category) ? route.query.category[0] : route.query.category;
  return category && CATEGORIES.includes(category) ? category : "semua";
});

function localized(to: { path: string; hash?: string }): RouteLocationRaw {
  return { ...to, query: { ...route.query, lang: lang.value } };
}

function navTarget(path: string): RouteLocationRaw {
  return { path, query: { lang: lang.value } };
}

function langTarget(nextLang: SupportedLang): RouteLocationRaw {
  return { path: route.path, hash: route.hash, query: { ...route.query, lang: nextLang } };
}

function categoryTarget(category: string): RouteLocationRaw {
  const query: Record<string, string> = { lang: lang.value };
  if (category !== "semua") {
    query.category = category;
  }
  return { path: "/", query };
}

function updateCategoryCue() {
  const el = catBar.value;
  if (!el) {
    hasCategoryOverflow.value = false;
    isCategoryScrollEnd.value = false;
    return;
  }

  hasCategoryOverflow.value = el.scrollWidth > el.clientWidth + 1;
  isCategoryScrollEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
}

watch(() => route.fullPath, () => {
  isOpen.value = false;
  nextTick(updateCategoryCue);
});

onMounted(() => {
  nextTick(updateCategoryCue);
  window.addEventListener("resize", updateCategoryCue);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateCategoryCue);
});
</script>

<template>
  <header class="site-top-nav">
    <nav class="nav-top" aria-label="Primary navigation">
      <div class="nav-inner">
        <RouterLink :to="localized({ path: '/' })" class="nav-brand">
          <div class="nav-brand-icon">
            <img src="/assets/img/logo.png" alt="" />
          </div>
          <span class="nav-brand-text">JelajahTaliabu</span>
        </RouterLink>

        <div class="nav-actions">
          <ul class="nav-links">
            <li><RouterLink :to="navTarget('/about')">{{ t("nav.about") }}</RouterLink></li>
            <li><RouterLink :to="navTarget('/guide')">{{ t("nav.guide") }}</RouterLink></li>
          </ul>

          <div class="lang-switcher" aria-label="Language">
            <RouterLink v-for="code in SUPPORTED_LANGS" :key="code" :to="langTarget(code)" :aria-current="code === lang ? 'true' : null">
              {{ code.toUpperCase() }}
            </RouterLink>
          </div>
          <RouterLink :to="localized({ path: '/submit' })" class="btn-submit">{{ t("nav.submit") }}</RouterLink>
        </div>

        <div class="mobile-nav-controls">
          <div class="lang-switcher" aria-label="Language">
            <RouterLink v-for="code in SUPPORTED_LANGS" :key="code" :to="langTarget(code)" :aria-current="code === lang ? 'true' : null">
              {{ code.toUpperCase() }}
            </RouterLink>
          </div>
          <button class="nav-toggle" type="button" :aria-expanded="isOpen" :aria-label="t('nav.menu')" @click="isOpen = !isOpen">
            <span class="nav-toggle-lines" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </nav>

    <div v-if="isHome" class="cat-bar">
      <div class="cat-bar-inner" ref="catBar" id="category-bar" @scroll="updateCategoryCue">
        <RouterLink class="cat-pill" :class="{ active: activeCategory === 'semua' }" :to="categoryTarget('semua')">{{ t("home.all") }}</RouterLink>
        <RouterLink v-for="category in CATEGORIES" :key="category" class="cat-pill" :class="{ active: activeCategory === category }" :to="categoryTarget(category)">
          {{ categoryLabel(category) }}
        </RouterLink>
      </div>
      <div v-if="hasCategoryOverflow" class="cat-bar-cue" :class="{ 'is-muted': isCategoryScrollEnd }" aria-hidden="true">›</div>
    </div>
  </header>

  <div class="mobile-nav-overlay" :hidden="!isOpen" :class="{ 'is-open': isOpen }" @click="isOpen = false"></div>
  <aside class="mobile-nav-drawer" :class="{ 'is-open': isOpen }" :aria-hidden="!isOpen">
    <div class="mobile-nav-head">
      <span class="nav-brand-text">JelajahTaliabu</span>
      <button class="mobile-nav-close" type="button" @click="isOpen = false">
        <span aria-hidden="true">&times;</span>
        <span>{{ t("nav.close") }}</span>
      </button>
    </div>
    <nav class="mobile-nav-menu" aria-label="Mobile navigation">
      <RouterLink :to="navTarget('/about')">{{ t("nav.about") }}</RouterLink>
      <RouterLink :to="navTarget('/guide')">{{ t("nav.guide") }}</RouterLink>
      <RouterLink :to="localized({ path: '/submit' })" class="btn-submit mobile-submit">{{ t("nav.submit") }}</RouterLink>
    </nav>
  </aside>
</template>
