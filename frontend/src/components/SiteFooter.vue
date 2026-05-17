<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { categoryLabel, CATEGORIES, getLang, t } from "../i18n/index";

const route = useRoute();
const categoryOpen = ref(true);
const platformOpen = ref(false);

function localized(path: string, hash = ""): RouteLocationRaw {
  return { path, hash, query: { ...route.query, lang: getLang() } };
}
</script>

<template>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-brand-col">
        <div class="footer-brand-name">
          <div class="footer-brand-icon">
            <img src="/assets/img/logo.png" alt="" />
          </div>
          <span>JelajahTaliabu</span>
        </div>
        <p class="footer-tagline">{{ t("footer.tagline") }}</p>
        <RouterLink :to="localized('/submit')" class="footer-btn-submit">{{ t("nav.submit") }}</RouterLink>
      </div>

      <div class="footer-nav-col">
        <div class="footer-col-title">{{ t("submit.category") }}</div>
        <button class="footer-accordion-header" type="button" :aria-expanded="categoryOpen" aria-controls="footer-nav-kategori" @click="categoryOpen = !categoryOpen">
          <span class="footer-col-title">{{ t("submit.category") }}</span>
          <svg class="footer-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        <ul id="footer-nav-kategori" class="footer-nav-list" :hidden="!categoryOpen">
          <li v-for="category in CATEGORIES" :key="category">
            <RouterLink :to="localized('/', '#filter-pills')">{{ categoryLabel(category) }}</RouterLink>
          </li>
        </ul>
      </div>

      <div class="footer-nav-col">
        <div class="footer-col-title">{{ t("footer.platform") }}</div>
        <button class="footer-accordion-header" type="button" :aria-expanded="platformOpen" aria-controls="footer-nav-platform" @click="platformOpen = !platformOpen">
          <span class="footer-col-title">{{ t("footer.platform") }}</span>
          <svg class="footer-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        <ul id="footer-nav-platform" class="footer-nav-list" :hidden="!platformOpen">
          <li><a href="#">{{ t("footer.about") }}</a></li>
          <li><a href="#">{{ t("footer.writingGuide") }}</a></li>
          <li><a href="#">{{ t("footer.contentPolicy") }}</a></li>
          <li><a href="#">{{ t("footer.contact") }}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <div class="footer-copy">{{ t("footer.copy") }}</div>
        <div class="footer-region-pills">
          <span v-for="region in ['Taliabu Barat', 'Taliabu Barat Laut', 'Taliabu Utara', 'Taliabu Timur', 'Taliabu Timur Selatan', 'Taliabu Selatan', 'Tabona', 'Lede']" :key="region" class="footer-region-pill">{{ region }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
