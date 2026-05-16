import { getCategories, submitArticle } from "./api.js";
import { sanitizeHtml } from "./markdown.js";
import {
  applyTranslations,
  categoryLabel,
  currentCanonicalUrl,
  defaultShareImage,
  getLocale,
  getOgLocale,
  setLink,
  setMeta,
  t,
} from "./i18n.js";

const MAX_COVER_BYTES = 2 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const form = document.querySelector("#submit-form");
const successScreen = document.querySelector("#success-screen");
const preview = document.querySelector("#img-preview");
const contentInput = document.getElementById("content");
const contentEditor = document.getElementById("content-editor");
const categorySelect = document.getElementById("categoryId");
let quill = null;

function renderPageMeta() {
  const title = t("meta.submitTitle");
  const description = t("meta.submitDescription");
  const url = currentCanonicalUrl();
  const image = defaultShareImage();

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', t("meta.submitOgDescription"));
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[property="og:image"]', image);
  setMeta('meta[property="og:locale"]', getOgLocale());
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', image);
  setLink('link[rel="canonical"]', url);
}

function setupCharCount(inputId, countId, max) {
  const input = document.getElementById(inputId);
  const counter = document.getElementById(countId);
  if (!input || !counter) {
    return;
  }

  const updateCounter = () => {
    const length = input.value.length;
    counter.textContent = `${length.toLocaleString(getLocale())} / ${max.toLocaleString(getLocale())}`;
    counter.className = "char-count";
    if (length > max * 0.9) {
      counter.classList.add("warn");
    }
    if (length >= max) {
      counter.classList.add("over");
    }
  };

  input.addEventListener("input", updateCounter);
  updateCounter();
  return updateCounter;
}

function setError(fieldId, show) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`err-${fieldId}`);
  if (!field || !error) {
    return;
  }

  field.classList.toggle("error", show);
  if (fieldId === "content") {
    contentEditor?.classList.toggle("error", show);
  }
  error.classList.toggle("show", show);
}

function clearErrorOnInput(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) {
    return;
  }

  field.addEventListener("input", () => setError(fieldId, false));
  field.addEventListener("change", () => setError(fieldId, false));
}

function selectedCover() {
  const input = document.getElementById("coverImage");
  return input?.files?.[0] || null;
}

function validateCover(file) {
  return file && ALLOWED_COVER_TYPES.has(file.type) && file.size <= MAX_COVER_BYTES;
}

function validate() {
  syncEditorContent();
  const requiredFields = ["authorName", "authorEmail", "title", "categoryId", "location"];
  let valid = true;

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    const isMissing = !field?.value?.trim();
    setError(fieldId, isMissing);
    valid = valid && !isMissing;
  });

  const contentText = getEditorText();
  if (contentText.length < 150 || contentText.length > 10000) {
    setError("content", true);
    valid = false;
  }

  if (!validateCover(selectedCover())) {
    setError("coverImage", true);
    valid = false;
  }

  return valid;
}

async function loadCategories() {
  try {
    const categories = await getCategories();
    const placeholder = categorySelect.querySelector("option[value='']");
    categorySelect.innerHTML = "";
    if (placeholder) {
      categorySelect.appendChild(placeholder);
    }

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = String(category.id);
      option.textContent = categoryLabel(category.name);
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
}

function buildPayload() {
  const content = syncEditorContent();
  const formData = new FormData();
  formData.set("title", document.getElementById("title").value.trim());
  formData.set("content", content);
  formData.set("excerpt", getEditorText().slice(0, 160));
  formData.set("authorName", document.getElementById("authorName").value.trim());
  formData.set("authorEmail", document.getElementById("authorEmail").value.trim());
  formData.set("categoryId", document.getElementById("categoryId").value);
  formData.set("location", document.getElementById("location").value.trim());
  formData.set("coverImage", selectedCover());
  return formData;
}

function setSubmitting(isSubmitting) {
  const button = document.getElementById("btn-submit");
  const spinner = document.getElementById("spinner");
  const icon = document.getElementById("btn-icon");
  const label = document.getElementById("btn-label");

  button.disabled = isSubmitting;
  spinner.style.display = isSubmitting ? "block" : "none";
  icon.style.display = isSubmitting ? "none" : "block";
  label.textContent = isSubmitting ? t("submit.sending") : t("submit.button");
}

function showSuccess() {
  form.style.display = "none";
  successScreen.classList.add("show");
  successScreen.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetForm() {
  form.reset();
  form.style.display = "block";
  successScreen.classList.remove("show");
  preview.classList.remove("show");
  preview.innerHTML = "";
  quill?.setText("");
  contentInput.value = "";
  setSubmitting(false);
  document.getElementById("count-title").textContent = `${(0).toLocaleString(getLocale())} / ${(120).toLocaleString(getLocale())}`;
  document.getElementById("count-content").textContent = `${(0).toLocaleString(getLocale())} / ${(10000).toLocaleString(getLocale())}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupEditor() {
  quill = new window.Quill(contentEditor, {
    theme: "snow",
    placeholder: t("submit.contentPlaceholder"),
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "link"],
        ["clean"],
      ],
    },
  });

  quill.on("text-change", () => {
    syncEditorContent();
    updateContentCounter();
    setError("content", false);
  });

  syncEditorContent();
  updateContentCounter();
}

function syncEditorContent() {
  const html = quill?.getSemanticHTML ? quill.getSemanticHTML() : quill?.root.innerHTML || "";
  const clean = sanitizeHtml(html).trim();
  contentInput.value = clean;
  return clean;
}

function getEditorText() {
  return (quill?.getText() || "").replace(/\s+/g, " ").trim();
}

function updateContentCounter() {
  const counter = document.getElementById("count-content");
  const length = getEditorText().length;
  counter.textContent = `${length.toLocaleString(getLocale())} / ${(10000).toLocaleString(getLocale())}`;
  counter.className = "char-count";
  if (length > 9000) {
    counter.classList.add("warn");
  }
  if (length >= 10000) {
    counter.classList.add("over");
  }
}

function setupCoverPreview() {
  const input = document.getElementById("coverImage");
  input.addEventListener("change", () => {
    const file = selectedCover();
    preview.innerHTML = "";

    if (!file) {
      preview.classList.remove("show");
      return;
    }

    if (!validateCover(file)) {
      setError("coverImage", true);
      preview.classList.remove("show");
      return;
    }

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = t("submit.previewAlt");
    image.onload = () => URL.revokeObjectURL(image.src);
    preview.appendChild(image);
    preview.classList.add("show");
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validate()) {
    document.querySelector(".error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  setSubmitting(true);

  try {
    await submitArticle(buildPayload());
    showSuccess();
  } catch (error) {
    setSubmitting(false);
    alert(error.message || t("api.requestFailed"));
  }
});

document.getElementById("reset-form").addEventListener("click", resetForm);

["authorName", "authorEmail", "title", "categoryId", "location", "coverImage"].forEach(clearErrorOnInput);
setupCharCount("title", "count-title", 120);
setupEditor();
setupCoverPreview();
applyTranslations();
loadCategories();
renderPageMeta();
