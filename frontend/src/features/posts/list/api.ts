import { request } from "../../../shared/api/client";
import type { ApiItemResponse, ApiListResponse, Post, PostStatus } from "../../../shared/types";

export type RawPost = Partial<{
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

export function normalizePost(post: RawPost): Post {
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
