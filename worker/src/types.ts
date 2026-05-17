export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_TOKEN: string;
  TURNSTILE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ASSET_PUBLIC_BASE_URL?: string;
};

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

export type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author_name: string;
  author_email: string | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  location: string | null;
  cover_image_key: string | null;
  views: number;
  likes: number;
  dislikes: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
};
