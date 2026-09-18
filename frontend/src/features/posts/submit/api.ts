import { request } from "../../../shared/api/client";
import type { ApiListResponse, Category } from "../../../shared/types";

export function submitArticle(formData: FormData): Promise<unknown> {
  return request("/api/posts", {
    method: "POST",
    body: formData,
  });
}

export async function getCategories(): Promise<Category[]> {
  const result = await request<ApiListResponse<Category>>("/api/categories");
  return Array.isArray(result.data) ? result.data : [];
}
