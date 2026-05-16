<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getCategories, submitArticle } from "../services/api";
import { categoryLabel, currentCanonicalUrl, currentLang, defaultShareImage, getLocale, t } from "../i18n/index";
import { sanitizeHtml } from "../utils/content";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";
import type { Category } from "../types";

const MAX_COVER_BYTES = 2 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const route = useRoute();
const form = reactive({
  authorName: "",
  authorEmail: "",
  title: "",
  categoryId: "",
  location: "",
  content: "",
});
type FormField = keyof typeof form;
type ErrorField = FormField | "coverImage";

const categories = ref<Category[]>([]);
const coverFile = ref<File | null>(null);
const previewUrl = ref("");
const errors = reactive<Record<ErrorField, boolean>>({
  authorName: false,
  authorEmail: false,
  title: false,
  categoryId: false,
  location: false,
  content: false,
  coverImage: false,
});
const submitting = ref(false);
const submitted = ref(false);
const editorEl = ref<HTMLElement | null>(null);
const contentText = ref("");
let quill: QuillInstance | null = null;

const titleCount = computed(() => `${form.title.length.toLocaleString(getLocale())} / ${(120).toLocaleString(getLocale())}`);
const contentCount = computed(() => `${contentText.value.length.toLocaleString(getLocale())} / ${(10000).toLocaleString(getLocale())}`);

function renderMeta() {
  const title = t("meta.submitTitle");
  const description = t("meta.submitDescription");
  setRobots("index, follow");
  resetArticleMeta();
  setBaseMeta({
    title,
    description,
    url: currentCanonicalUrl(),
    image: defaultShareImage(),
    type: "website",
  });
}

function loadQuillScript(): Promise<void> {
  if (window.Quill) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-quill="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "/vendor/quill/quill.js";
    script.dataset.quill = "true";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function syncEditorContent() {
  const html = quill?.getSemanticHTML ? quill.getSemanticHTML() : quill?.root.innerHTML || "";
  form.content = sanitizeHtml(html).trim();
  contentText.value = (quill?.getText() || "").replace(/\s+/g, " ").trim();
  return form.content;
}

function updateEditorPlaceholder() {
  quill?.root.setAttribute("data-placeholder", t("submit.contentPlaceholder"));
}

function validateCover(file: File | null) {
  return file && ALLOWED_COVER_TYPES.has(file.type) && file.size <= MAX_COVER_BYTES;
}

function setError(field: ErrorField, condition: boolean) {
  errors[field] = condition;
}

function validate() {
  syncEditorContent();
  let valid = true;
  (["authorName", "authorEmail", "title", "categoryId", "location"] as FormField[]).forEach((field) => {
    const missing = !String(form[field] || "").trim();
    setError(field, missing);
    valid = valid && !missing;
  });

  const badContent = contentText.value.length < 150 || contentText.value.length > 10000;
  setError("content", badContent);
  valid = valid && !badContent;

  const badCover = !validateCover(coverFile.value);
  setError("coverImage", badCover);
  valid = valid && !badCover;
  return valid;
}

function onCoverChange(event: Event) {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  const input = event.target as HTMLInputElement;
  coverFile.value = input.files?.[0] || null;
  previewUrl.value = coverFile.value && validateCover(coverFile.value) ? URL.createObjectURL(coverFile.value) : "";
  setError("coverImage", coverFile.value ? !validateCover(coverFile.value) : false);
}

function buildPayload() {
  const data = new FormData();
  data.set("title", form.title.trim());
  data.set("content", syncEditorContent());
  data.set("excerpt", contentText.value.slice(0, 160));
  data.set("authorName", form.authorName.trim());
  data.set("authorEmail", form.authorEmail.trim());
  data.set("categoryId", form.categoryId);
  data.set("location", form.location.trim());
  if (coverFile.value) {
    data.set("coverImage", coverFile.value);
  }
  return data;
}

async function handleSubmit() {
  if (!validate()) {
    await nextTick();
    document.querySelector(".error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  submitting.value = true;
  try {
    await submitArticle(buildPayload());
    submitted.value = true;
  } catch (error) {
    alert(error instanceof Error ? error.message : t("api.requestFailed"));
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  Object.assign(form, { authorName: "", authorEmail: "", title: "", categoryId: "", location: "", content: "" });
  coverFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = "";
  }
  Object.keys(errors).forEach((key) => {
    errors[key] = false;
  });
  quill?.setText("");
  contentText.value = "";
  submitted.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  renderMeta();
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error(error);
  }
  await loadQuillScript();
  if (!window.Quill || !editorEl.value) {
    return;
  }
  quill = new window.Quill(editorEl.value, {
    theme: "snow",
    placeholder: t("submit.contentPlaceholder"),
    modules: {
      toolbar: [[{ header: [2, 3, false] }], ["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "link"], ["clean"]],
    },
  });
  quill.on("text-change", () => {
    syncEditorContent();
    setError("content", false);
  });
  syncEditorContent();
});

watch(() => route.fullPath, renderMeta);

watch(currentLang, () => {
  renderMeta();
  updateEditorPlaceholder();
});

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <main class="submit-page">
    <header class="submit-header">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-line"></span>
        <span>{{ t("submit.eyebrow") }}</span>
      </div>
      <h1 class="submit-title">{{ t("submit.heading") }}</h1>
      <p class="submit-subtitle">{{ t("submit.subtitle") }}</p>
    </header>

    <section class="submit-card">
      <form v-if="!submitted" class="submit-form" novalidate @submit.prevent="handleSubmit">
        <div class="submit-section">
          <div class="submit-section-title">{{ t("submit.authorSection") }}</div>
          <div class="submit-row">
            <div class="submit-field">
              <label for="authorName"><span>{{ t("submit.authorName") }}</span> <span class="required">*</span></label>
              <input id="authorName" v-model="form.authorName" :class="{ error: errors.authorName }" type="text" maxlength="80" :placeholder="t('submit.authorNamePlaceholder')" @input="setError('authorName', false)" />
              <div class="field-error" :class="{ show: errors.authorName }">{{ t("submit.authorNameError") }}</div>
            </div>
            <div class="submit-field">
              <label for="authorEmail"><span>{{ t("submit.authorEmail") }}</span> <span class="required">*</span> <span class="hint">{{ t("submit.authorEmailHint") }}</span></label>
              <input id="authorEmail" v-model="form.authorEmail" :class="{ error: errors.authorEmail }" type="email" maxlength="120" :placeholder="t('submit.authorEmailPlaceholder')" @input="setError('authorEmail', false)" />
              <div class="field-error" :class="{ show: errors.authorEmail }">{{ t("submit.authorEmailError") }}</div>
            </div>
          </div>
        </div>

        <div class="submit-section">
          <div class="submit-section-title">{{ t("submit.detailSection") }}</div>
          <div class="submit-field">
            <label for="title"><span>{{ t("submit.title") }}</span> <span class="required">*</span></label>
            <input id="title" v-model="form.title" :class="{ error: errors.title }" type="text" maxlength="120" :placeholder="t('submit.titlePlaceholder')" @input="setError('title', false)" />
            <div class="char-count" :class="{ warn: form.title.length > 108, over: form.title.length >= 120 }">{{ titleCount }}</div>
            <div class="field-error" :class="{ show: errors.title }">{{ t("submit.titleError") }}</div>
          </div>

          <div class="submit-row">
            <div class="submit-field">
              <label for="categoryId"><span>{{ t("submit.category") }}</span> <span class="required">*</span></label>
              <select id="categoryId" v-model="form.categoryId" :class="{ error: errors.categoryId }" @change="setError('categoryId', false)">
                <option value="" disabled>{{ t("submit.categoryPlaceholder") }}</option>
                <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ categoryLabel(category.name) }}</option>
              </select>
              <div class="field-error" :class="{ show: errors.categoryId }">{{ t("submit.categoryError") }}</div>
            </div>
            <div class="submit-field">
              <label for="location"><span>{{ t("submit.locationLabel") }}</span> <span class="required">*</span></label>
              <input id="location" v-model="form.location" :class="{ error: errors.location }" type="text" maxlength="80" :placeholder="t('submit.locationPlaceholder')" @input="setError('location', false)" />
              <div class="field-error" :class="{ show: errors.location }">{{ t("submit.locationError") }}</div>
            </div>
          </div>
        </div>

        <div class="submit-section">
          <div class="submit-section-title">{{ t("submit.coverSection") }}</div>
          <div class="submit-field">
            <label for="coverImage"><span>{{ t("submit.coverUpload") }}</span> <span class="required">*</span> <span class="hint">{{ t("submit.coverHint") }}</span></label>
            <input id="coverImage" :class="{ error: errors.coverImage }" type="file" accept="image/jpeg,image/png,image/webp" @change="onCoverChange" />
            <div class="field-error" :class="{ show: errors.coverImage }">{{ t("submit.invalidFile") }}</div>
            <div class="img-preview" :class="{ show: previewUrl }"><img v-if="previewUrl" :src="previewUrl" :alt="t('submit.previewAlt')" /></div>
          </div>
        </div>

        <div class="submit-section">
          <div class="submit-section-title">{{ t("submit.contentSection") }}</div>
          <div class="submit-guidelines">
            <div class="submit-guidelines-title">{{ t("submit.guidelinesTitle") }}</div>
            <ul>
              <li>{{ t("submit.guidelineClear") }}</li>
              <li>{{ t("submit.guidelineLength") }}</li>
              <li>{{ t("submit.guidelineSafe") }}</li>
              <li>{{ t("submit.guidelineParagraphs") }}</li>
            </ul>
          </div>
          <div class="submit-field">
            <label for="content">{{ t("submit.content") }} <span class="required">*</span></label>
            <div ref="editorEl" class="rich-editor" :class="{ error: errors.content }"></div>
            <textarea id="content" v-model="form.content" maxlength="10000" hidden></textarea>
            <div class="char-count" :class="{ warn: contentText.length > 9000, over: contentText.length >= 10000 }">{{ contentCount }}</div>
            <div class="field-error" :class="{ show: errors.content }">{{ t("submit.contentMin") }}</div>
          </div>
        </div>

        <div class="submit-actions">
          <p class="submit-note">{{ t("submit.note") }}</p>
          <button type="submit" class="submit-primary" :disabled="submitting">
            <div class="spinner" :style="{ display: submitting ? 'block' : 'none' }"></div>
            <svg v-if="!submitting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>{{ submitting ? t("submit.sending") : t("submit.button") }}</span>
          </button>
        </div>
      </form>

      <div v-else class="submit-success show">
        <div class="submit-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div class="submit-success-title">{{ t("submit.successTitle") }}</div>
        <p class="submit-success-sub">{{ t("submit.success") }}</p>
        <RouterLink :to="{ path: '/', query: { lang: route.query.lang } }" class="submit-outline">{{ t("submit.backHome") }}</RouterLink>
        <button class="submit-outline" type="button" @click="resetForm">{{ t("submit.reset") }}</button>
      </div>
    </section>
  </main>
</template>
