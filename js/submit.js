import { submitArticle } from "./api.js";
import { applyTranslations, categoryLabel, setMeta, t } from "./i18n.js";

const form = document.querySelector("#submitForm");
const formMessage = document.querySelector("#formMessage");

function renderPageMeta() {
  document.title = t("meta.submitTitle");
  setMeta('meta[name="description"]', t("meta.submitDescription"));
  setMeta('meta[property="og:title"]', t("meta.submitTitle"));
  setMeta('meta[property="og:description"]', t("meta.submitOgDescription"));
}

function renderCategoryOptions() {
  form.querySelectorAll("select[name='category'] option").forEach((option) => {
    if (!option.value) {
      option.textContent = t("submit.categoryPlaceholder");
      return;
    }

    option.textContent = categoryLabel(option.value);
  });
}

function getPayload() {
  const formData = new FormData(form);
  return Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value).trim()]));
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(payload) {
  const requiredFields = ["title", "author_name", "author_contact", "category", "location", "image_url", "content"];
  const missingField = requiredFields.find((field) => !payload[field]);

  if (missingField) {
    return t("submit.required");
  }

  if (!isValidUrl(payload.image_url)) {
    return t("submit.invalidUrl");
  }

  if (payload.content.length < 300) {
    return t("submit.contentMin");
  }

  return "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const payload = getPayload();
  const error = validate(payload);

  formMessage.classList.toggle("error", Boolean(error));
  formMessage.textContent = error;

  if (error) {
    return;
  }

  submitButton.disabled = true;
  formMessage.textContent = t("submit.sending");

  try {
    await submitArticle(payload);
    form.reset();
    renderCategoryOptions();
    formMessage.classList.remove("error");
    formMessage.textContent = t("submit.success");
  } catch (requestError) {
    formMessage.classList.add("error");
    formMessage.textContent = requestError.message;
  } finally {
    submitButton.disabled = false;
  }
});

applyTranslations();
renderPageMeta();
renderCategoryOptions();
