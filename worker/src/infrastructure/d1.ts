import { publicImageUrl } from "./r2";
import type { Bindings, PostRow } from "../shared/types";

export async function getPostById(env: Bindings, postId: number) {
  return env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
    LIMIT 1
    `,
  )
    .bind(postId)
    .first<PostRow>();
}

export async function findApprovedPostIdBySlug(env: Bindings, slug: string): Promise<number | null> {
  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'approved' LIMIT 1")
    .bind(slug)
    .first<{ id: number }>();

  return post?.id ?? null;
}

export async function audit(env: Bindings, action: string, postId: number, actor: string, note = "") {
  await env.DB.prepare("INSERT INTO audit_logs (action, post_id, actor, note, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(action, postId, actor, note, new Date().toISOString())
    .run();
}

export function toPublicPost(env: Bindings, row: PostRow, includeContent = false) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: includeContent ? row.content : undefined,
    authorName: row.author_name,
    category: row.category_name,
    categorySlug: row.category_slug,
    location: row.location,
    coverImageUrl: publicImageUrl(env, row.cover_image_key),
    views: row.views || 0,
    likes: row.likes || 0,
    dislikes: row.dislikes || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  };
}

export function toAdminPost(env: Bindings, row: PostRow) {
  return {
    ...toPublicPost(env, row, true),
    status: row.status,
    authorEmail: row.author_email,
    rejectionReason: row.rejection_reason,
  };
}
