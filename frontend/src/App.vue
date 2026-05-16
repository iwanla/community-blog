<script setup lang="ts">
import { watchEffect } from "vue";
import { useRoute } from "vue-router";
import SiteFooter from "./components/SiteFooter.vue";
import SiteHeader from "./components/SiteHeader.vue";
import { currentLang } from "./i18n/index";

const route = useRoute();

watchEffect(() => {
  route.fullPath;
  document.documentElement.lang = currentLang.value;
});
</script>

<template>
  <SiteHeader />
  <RouterView />
  <SiteFooter v-if="route.name !== 'admin'" />
</template>
