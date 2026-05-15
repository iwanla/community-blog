import { t } from "./i18n.js";

const API_BASE_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

async function request(action, options = {}) {
  if (API_BASE_URL.includes("PASTE_GOOGLE_APPS_SCRIPT")) {
    throw new Error(t("api.notConfigured"));
  }

  const url = new URL(API_BASE_URL);
  url.searchParams.set("action", action);

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || t("api.requestFailed"));
  }

  return data;
}

export function getApprovedPosts() {
  return request("posts");
}

export function submitArticle(payload) {
  return request("submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
