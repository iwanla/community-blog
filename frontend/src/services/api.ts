import { t } from "../i18n/index";
import type { ApiItemResponse, ApiListResponse, Category, Post, PostStatus, ReviewedPostsResult } from "../types";

const DEFAULT_PRODUCTION_API = "https://jelajah-blog-api.iwanlaudin01.workers.dev";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocalApp = isLocalHost(window.location.hostname);

  if (!configuredUrl) {
    return isLocalApp ? "http://localhost:8787" : DEFAULT_PRODUCTION_API;
  }

  const configuredHost = new URL(configuredUrl).hostname;
  if (!isLocalApp && isLocalHost(configuredHost)) {
    return DEFAULT_PRODUCTION_API;
  }

  return configuredUrl;
}

const API_BASE_URL = resolveApiBaseUrl();

type SearchParamValue = string | number | boolean | null | undefined;
type RequestOptions = RequestInit & {
  searchParams?: Record<string, SearchParamValue>;
};

export type ReactionType = "like" | "dislike" | "none";

type TrackViewResponse = {
  counted: boolean;
  views: number;
};

type ReactResponse = {
  ok: boolean;
  likes: number;
  dislikes: number;
};

type RawPost = Partial<{
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  location: string;
  authorName: string;
  author_name: string;
  authorEmail: string;
  author_email: string;
  coverImageUrl: string;
  image_url: string;
  views: number;
  views_count: number;
  likes: number;
  likes_count: number;
  dislikes: number;
  isFeatured: boolean;
  is_featured: boolean;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  approvedAt: string;
  approved_at: string;
  status: PostStatus;
  rejectionReason: string;
  rejection_reason: string;
}>;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(t("api.notConfigured"));
  }

  const url = new URL(path, API_BASE_URL);
  const { searchParams, ...fetchOptions } = options;
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: fetchOptions.headers || {},
  });

  const data = await response.json().catch(() => ({})) as { error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error || t("api.requestFailed"));
  }

  return data as T;
}

function normalizePost(post: RawPost): Post {
  return {
    id: post.id || "",
    slug: post.slug || "",
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || post.excerpt || "",
    category: post.category,
    location: post.location || "",
    author_name: post.authorName || post.author_name || "",
    author_email: post.authorEmail || post.author_email || "",
    image_url: post.coverImageUrl || post.image_url || "",
    views: Number(post.views || 0),
    views_count: Number(post.views_count || post.views || 0),
    likes: Number(post.likes || 0),
    likes_count: Number(post.likes_count || post.likes || 0),
    dislikes: Number(post.dislikes || 0),
    is_featured: Boolean(post.isFeatured || post.is_featured),
    created_at: post.createdAt || post.created_at || "",
    updated_at: post.updatedAt || post.updated_at || "",
    approved_at: post.approvedAt || post.approved_at || "",
    status: post.status || "",
    rejection_reason: post.rejectionReason || post.rejection_reason || "",
  };
}

export async function getApprovedPosts({ page = 1, limit = 10, category }: { page?: number; limit?: number; category?: string } = {}): Promise<Post[]> {
  const result = await request<ApiListResponse<RawPost>>("/api/posts", {
    searchParams: { page, limit, category },
  });
  return Array.isArray(result.data) ? result.data.map(normalizePost) : [];
}

export async function getFeaturedPost(): Promise<Post | null> {
  const result = await request<ApiItemResponse<RawPost | null>>("/api/posts/featured");
  return result.data ? normalizePost(result.data) : null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await request<ApiItemResponse<RawPost>>(`/api/posts/${encodeURIComponent(slug)}`);
  return result.data ? normalizePost(result.data) : null;
}

export function trackPostView(slug: string): Promise<TrackViewResponse> {
  return request(`/api/posts/${encodeURIComponent(slug)}/view`, {
    method: "POST",
  });
}

export function reactToPost(slug: string, type: ReactionType): Promise<ReactResponse> {
  return request(`/api/posts/${encodeURIComponent(slug)}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
}

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

function adminHeaders(token: string, extra: HeadersInit = {}): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function getPendingPosts(token: string): Promise<Post[]> {
  const result = await request<ApiListResponse<RawPost>>("/api/admin/posts/pending", {
    headers: adminHeaders(token),
  });
  return Array.isArray(result.data) ? result.data.map(normalizePost) : [];
}

export async function getReviewedPosts(token: string, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}): Promise<ReviewedPostsResult> {
  const result = await request<ApiListResponse<RawPost>>("/api/admin/posts/reviewed", {
    searchParams: { page, limit },
    headers: adminHeaders(token),
  });

  return {
    data: Array.isArray(result.data) ? result.data.map(normalizePost) : [],
    page: result.page || page,
    limit: result.limit || limit,
  };
}

export function approvePost(token: string, id: Post["id"]): Promise<unknown> {
  return request(`/api/admin/posts/${id}/approve`, {
    method: "PATCH",
    headers: adminHeaders(token),
  });
}

export function rejectPost(token: string, id: Post["id"], reason: string): Promise<unknown> {
  return request(`/api/admin/posts/${id}/reject`, {
    method: "PATCH",
    headers: adminHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ reason }),
  });
}

export function deletePost(token: string, id: Post["id"]): Promise<unknown> {
  return request(`/api/admin/posts/${id}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
}
