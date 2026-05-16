import { t } from "./i18n.js";

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8787"
  : "https://jelajah-blog-api.iwanlaudin01.workers.dev";

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(t("api.notConfigured"));
  }

  const url = new URL(path, API_BASE_URL);
  const { searchParams, ...fetchOptions } = options;
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: fetchOptions.headers || {},
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new Error(data.error || t("api.requestFailed"));
  }

  return data;
}

function normalizePost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content || post.excerpt || "",
    category: post.category,
    location: post.location || "",
    author_name: post.authorName || "",
    author_email: post.authorEmail || "",
    image_url: post.coverImageUrl || "",
    created_at: post.createdAt,
    updated_at: post.updatedAt,
    approved_at: post.approvedAt,
    status: post.status || "",
    rejection_reason: post.rejectionReason || "",
  };
}

export async function getApprovedPosts({ page = 1, limit = 10, category } = {}) {
  const result = await request("/api/posts", {
    searchParams: { page, limit, category },
  });
  return Array.isArray(result.data) ? result.data.map(normalizePost) : [];
}

export async function getPostBySlug(slug) {
  const result = await request(`/api/posts/${encodeURIComponent(slug)}`);
  return result.data ? normalizePost(result.data) : null;
}

export function submitArticle(formData) {
  return request("/api/posts", {
    method: "POST",
    body: formData,
  });
}

function adminHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function getPendingPosts(token) {
  const result = await request("/api/admin/posts/pending", {
    headers: adminHeaders(token),
  });
  return Array.isArray(result.data) ? result.data.map(normalizePost) : [];
}

export async function getReviewedPosts(token, { page = 1, limit = 10 } = {}) {
  const result = await request("/api/admin/posts/reviewed", {
    searchParams: { page, limit },
    headers: adminHeaders(token),
  });

  return {
    data: Array.isArray(result.data) ? result.data.map(normalizePost) : [],
    page: result.page || page,
    limit: result.limit || limit,
  };
}

export function approvePost(token, id) {
  return request(`/api/admin/posts/${id}/approve`, {
    method: "PATCH",
    headers: adminHeaders(token),
  });
}

export function rejectPost(token, id, reason) {
  return request(`/api/admin/posts/${id}/reject`, {
    method: "PATCH",
    headers: adminHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ reason }),
  });
}

export function deletePost(token, id) {
  return request(`/api/admin/posts/${id}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
}
