import { ref } from "vue";
import enLocale from "./locales/en.json";
import idLocale from "./locales/id.json";

const DEFAULT_LANG = "id";
const locales = {
  id: idLocale,
  en: enLocale,
};

export type SupportedLang = keyof typeof locales;
type ReplacementValue = string | number | boolean;
type JsonLdSchema = Record<string, unknown>;

export const SUPPORTED_LANGS = Object.keys(locales) as SupportedLang[];

export const CATEGORIES = ["Wisata", "Budaya", "Kuliner", "Sejarah", "Berita Lokal", "Cerita Warga", "UMKM", "Politik"];

function isSupportedLang(value?: string | null): value is SupportedLang {
  return Boolean(value && Object.hasOwn(locales, value));
}

export function resolveLang(value?: string | string[] | null, useWindow = true): SupportedLang {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (isSupportedLang(candidate)) {
    return candidate;
  }

  if (useWindow && typeof window !== "undefined") {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (isSupportedLang(urlLang)) {
      return urlLang;
    }
  }

  return DEFAULT_LANG;
}

export const currentLang = ref(resolveLang());

export function setLang(value?: string | string[] | null) {
  currentLang.value = resolveLang(value, false);
}

export function getLang() {
  return currentLang.value;
}

export function getLocale() {
  return getLang() === "en" ? "en-US" : "id-ID";
}

export function getOgLocale() {
  return getLang() === "en" ? "en_US" : "id_ID";
}

export function t(key: string, replacements: Record<string, ReplacementValue> = {}) {
  const activeMessages = locales[getLang()]?.messages || {};
  const fallbackMessages = locales[DEFAULT_LANG].messages;
  const value = activeMessages[key] || fallbackMessages[key] || key;

  return Object.entries(replacements).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
    value,
  );
}

export function categoryLabel(category: string) {
  const activeCategories = locales[getLang()]?.categories || {};
  const fallbackCategories = locales[DEFAULT_LANG].categories;
  return activeCategories[category] || fallbackCategories[category] || category;
}

export function formatDate(value?: string | number | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(getLocale(), options);
}

export function setMeta(selector: string, content?: string) {
  let tag = document.querySelector(selector);
  if (!tag) {
    const match = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
    if (match) {
      tag = document.createElement("meta");
      tag.setAttribute(match[1], match[2]);
      document.head.appendChild(tag);
    }
  }

  if (tag) {
    tag.setAttribute("content", content || "");
  }
}

export function absoluteUrl(path = "") {
  return new URL(path, window.location.origin).toString();
}

export function currentCanonicalUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
}

export function defaultShareImage() {
  return absoluteUrl("/assets/img/logo.png");
}

export function setLink(selector: string, href?: string) {
  const tag = document.querySelector(selector);
  if (tag) {
    tag.setAttribute("href", href || "");
  }
}

export function setJsonLd(id: string, schema: JsonLdSchema) {
  const tag = document.getElementById(id);
  if (tag) {
    tag.textContent = JSON.stringify(schema);
  }
}
