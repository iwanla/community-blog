import { submitArticle } from "./api.js";
import { applyTranslations, getLocale, setMeta, t } from "./i18n.js";

const MAX_COVER_BYTES = 2 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const form = document.querySelector("#submit-form");
const successScreen = document.querySelector("#success-screen");
const preview = document.querySelector("#img-preview");

function renderPageMeta() {
  document.title = t("meta.submitTitle");
  setMeta('meta[name="description"]', t("meta.submitDescription"));
  setMeta('meta[property="og:title"]', t("meta.submitTitle"));
  setMeta('meta[property="og:description"]', t("meta.submitOgDescription"));
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
}

function setError(fieldId, show) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`err-${fieldId}`);
  if (!field || !error) {
    return;
  }

  field.classList.toggle("error", show);
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
  const requiredFields = ["authorName", "authorEmail", "title", "categoryId", "location", "content"];
  let valid = true;

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    const isMissing = !field?.value?.trim();
    setError(fieldId, isMissing);
    valid = valid && !isMissing;
  });

  const content = document.getElementById("content").value.trim();
  if (content.length < 150) {
    setError("content", true);
    valid = false;
  }

  if (!validateCover(selectedCover())) {
    setError("coverImage", true);
    valid = false;
  }

  return valid;
}

function buildPayload() {
  const formData = new FormData();
  formData.set("title", document.getElementById("title").value.trim());
  formData.set("content", document.getElementById("content").value.trim());
  formData.set("excerpt", document.getElementById("content").value.trim().slice(0, 160));
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
  setSubmitting(false);
  document.getElementById("count-title").textContent = `${(0).toLocaleString(getLocale())} / ${(120).toLocaleString(getLocale())}`;
  document.getElementById("count-content").textContent = `${(0).toLocaleString(getLocale())} / ${(10000).toLocaleString(getLocale())}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
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

["authorName", "authorEmail", "title", "categoryId", "location", "coverImage", "content"].forEach(clearErrorOnInput);
setupCharCount("title", "count-title", 120);
setupCharCount("content", "count-content", 10000);
setupCoverPreview();
applyTranslations();
renderPageMeta();
