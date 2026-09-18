import { request } from "../../../shared/api/client";
import type { ApiItemResponse, Post } from "../../../shared/types";
import { normalizePost, type RawPost } from "../list/api";

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
