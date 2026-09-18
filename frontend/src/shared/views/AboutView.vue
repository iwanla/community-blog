<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { currentCanonicalUrl, defaultShareImage, setJsonLd, t } from "../i18n/index";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";

const route = useRoute();

function renderMeta() {
  const title = t("about.metaTitle");
  const description = t("about.subtitle");

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
    "@type": "AboutPage",
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
        <span>{{ t("about.eyebrow") }}</span>
      </div>
      <h1 class="info-title">{{ t("about.title") }}</h1>
      <p class="info-subtitle">{{ t("about.subtitle") }}</p>
    </section>

    <section class="info-content" aria-label="About JelajahTaliabu">
      <p>{{ t("about.bodyOne") }}</p>
      <p>{{ t("about.bodyTwo") }}</p>
    </section>
  </main>
</template>
