import { t } from "../i18n/index";

type SearchParamValue = string | number | boolean | null | undefined;
export type RequestOptions = RequestInit & {
  searchParams?: Record<string, SearchParamValue>;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  const { searchParams, ...fetchOptions } = options;
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(`${url.pathname}${url.search}`, {
    ...fetchOptions,
    headers: fetchOptions.headers || {},
  });

  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || t("api.requestFailed"));
  }

  return data as T;
}
