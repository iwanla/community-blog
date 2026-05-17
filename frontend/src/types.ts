export type PostStatus = "pending" | "approved" | "rejected" | "deleted" | "";

export interface Post {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  location: string;
  author_name: string;
  author_email: string;
  image_url: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  views_count?: number;
  likes_count?: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  approved_at: string;
  status: PostStatus;
  rejection_reason: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ApiListResponse<T> {
  data?: T[];
  page?: number;
  limit?: number;
  error?: string;
}

export interface ApiItemResponse<T> {
  data?: T;
  error?: string;
}

export interface ReviewedPostsResult {
  data: Post[];
  page: number;
  limit: number;
}

export interface CategoryStyle {
  text: string;
  bg: string;
}

export type CategoryStyleMap = Record<string, CategoryStyle>;
