<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { currentCanonicalUrl, defaultShareImage, setJsonLd, t } from "../i18n/index";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";

const route = useRoute();

function renderMeta() {
  const title = t("guide.metaTitle");
  const description = t("guide.subtitle");

  setRobots("index, follow");
  resetArticleMeta();
  setBaseMeta({
    title,
    description,
    url: currentCanonicalUrl(),
    image: defaultShareImage(),
    type: "website",
  });
  setJsonLd("structured-data", {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    inLanguage: document.documentElement.lang,
  });
}

onMounted(renderMeta);
watch(() => route.fullPath, renderMeta);
</script>

<template>
  <main class="info-page">
    <section class="info-hero">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-line"></span>
        <span>{{ t("guide.eyebrow") }}</span>
      </div>
      <h1 class="info-title">{{ t("guide.title") }}</h1>
      <p class="info-subtitle">{{ t("guide.subtitle") }}</p>
    </section>

    <section class="info-content" aria-label="Writing guide">
      <ol class="guide-list">
        <li>{{ t("guide.pointOne") }}</li>
        <li>{{ t("guide.pointTwo") }}</li>
        <li>{{ t("guide.pointThree") }}</li>
        <li>{{ t("guide.pointFour") }}</li>
      </ol>
    </section>
  </main>
</template>
