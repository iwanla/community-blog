<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { currentLang, SUPPORTED_LANGS, t } from "../i18n/index";
import type { SupportedLang } from "../i18n/index";

const route = useRoute();
const isOpen = ref(false);

const isHome = computed(() => route.name === "home");
const lang = currentLang;

function localized(to: { path: string; hash?: string }): RouteLocationRaw {
  return { ...to, query: { ...route.query, lang: lang.value } };
}

function langTarget(nextLang: SupportedLang): RouteLocationRaw {
  return { path: route.path, hash: route.hash, query: { ...route.query, lang: nextLang } };
}

watch(() => route.fullPath, () => {
  isOpen.value = false;
});
</script>

<template>
  <nav class="site-top-nav">
    <div class="nav-inner">
      <RouterLink :to="localized({ path: '/' })" class="nav-brand">
        <div class="nav-brand-icon">
          <img src="/assets/img/logo.png" alt="" />
        </div>
        <span class="nav-brand-text">JelajahTaliabu</span>
      </RouterLink>

      <div class="nav-actions">
        <ul v-if="isHome" class="nav-links">
          <li><a href="#filter-pills">{{ t("submit.category") }}</a></li>
          <li><a href="#articles-grid">{{ t("nav.articles") }}</a></li>
        </ul>
        <RouterLink v-else :to="localized({ path: '/' })" class="nav-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>{{ t("nav.back") }}</span>
        </RouterLink>

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
        <button class="nav-toggle" type="button" :aria-expanded="String(isOpen)" :aria-label="t('nav.menu')" @click="isOpen = !isOpen">
          <span class="nav-toggle-lines" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-nav-overlay" :hidden="!isOpen" :class="{ 'is-open': isOpen }" @click="isOpen = false"></div>
  <aside class="mobile-nav-drawer" :class="{ 'is-open': isOpen }" :aria-hidden="String(!isOpen)">
    <div class="mobile-nav-head">
      <span class="nav-brand-text">JelajahTaliabu</span>
      <button class="mobile-nav-close" type="button" @click="isOpen = false">
        <span aria-hidden="true">&times;</span>
        <span>{{ t("nav.close") }}</span>
      </button>
    </div>
    <nav class="mobile-nav-menu" aria-label="Mobile navigation">
      <template v-if="isHome">
        <a href="#filter-pills">{{ t("submit.category") }}</a>
        <a href="#articles-grid">{{ t("nav.articles") }}</a>
      </template>
      <RouterLink v-else :to="localized({ path: '/' })">{{ t("nav.back") }}</RouterLink>
      <RouterLink :to="localized({ path: '/submit' })" class="btn-submit mobile-submit">{{ t("nav.submit") }}</RouterLink>
    </nav>
  </aside>
</template>
