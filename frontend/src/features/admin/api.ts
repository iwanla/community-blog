import { request } from "../../shared/api/client";
import type { ApiListResponse, Post, ReviewedPostsResult } from "../../shared/types";
import { normalizePost, type RawPost } from "../posts/list/api";

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
