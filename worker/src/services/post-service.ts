import type { Bindings, PostRow } from "../types";
import { publicImageUrl } from "./r2-service";
import { uniqueSlug } from "../utils/slug";
import type { SubmitPostInput } from "../utils/validation";

export async function listApprovedPosts(env: Bindings, page: number, limit: number, category?: string) {
  const offset = (page - 1) * limit;
  const categoryFilter = category ? "AND c.slug = ?" : "";
  const params = category ? [category, limit, offset] : [limit, offset];
  const rows = await env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'approved' ${categoryFilter}
    ORDER BY p.approved_at DESC, p.created_at DESC
    LIMIT ? OFFSET ?
    `,
  )
    .bind(...params)
    .all<PostRow>();

  return rows.results.map((row) => toPublicPost(env, row));
}

export async function getApprovedPostBySlug(env: Bindings, slug: string) {
  const row = await env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'approved'
    LIMIT 1
    `,
  )
    .bind(slug)
    .first<PostRow>();

  return row ? toPublicPost(env, row, true) : null;
}

export async function createPendingPost(env: Bindings, input: SubmitPostInput) {
  const now = new Date().toISOString();
  const slug = uniqueSlug(input.title);
  const result = await env.DB.prepare(
    `
    INSERT INTO posts (
      title, slug, excerpt, content, author_name, author_email, category_id, location, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
  )
    .bind(
      input.title,
      slug,
      input.excerpt || input.content.slice(0, 160),
      input.content,
      input.authorName,
      input.authorEmail || null,
      input.categoryId,
      input.location,
      now,
    )
    .run();

  return Number(result.meta.last_row_id);
}

export async function attachCoverImage(env: Bindings, postId: number, key: string) {
  await env.DB.prepare("UPDATE posts SET cover_image_key = ?, updated_at = ? WHERE id = ?")
    .bind(key, new Date().toISOString(), postId)
    .run();
}

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

export async function listPendingPosts(env: Bindings) {
  const rows = await env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'pending'
    ORDER BY p.created_at ASC
    LIMIT 100
    `,
  ).all<PostRow>();

  return rows.results.map((row) => toAdminPost(env, row));
}

export async function listReviewedPosts(env: Bindings, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const rows = await env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status IN ('approved', 'rejected')
    ORDER BY COALESCE(p.updated_at, p.approved_at, p.created_at) DESC
    LIMIT ? OFFSET ?
    `,
  )
    .bind(limit, offset)
    .all<PostRow>();

  return rows.results.map((row) => toAdminPost(env, row));
}

export async function approvePost(env: Bindings, postId: number, actor: string) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET status = 'approved', approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?",
  )
    .bind(now, actor, now, postId)
    .run();
  await audit(env, "approve", postId, actor);
}

export async function rejectPost(env: Bindings, postId: number, reason: string, actor: string) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET status = 'rejected', rejection_reason = ?, updated_at = ? WHERE id = ?",
  )
    .bind(reason, now, postId)
    .run();
  await audit(env, "reject", postId, actor, reason);
}

export async function softDeletePost(env: Bindings, postId: number, actor: string) {
  await env.DB.prepare("UPDATE posts SET status = 'deleted', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), postId)
    .run();
  await audit(env, "delete", postId, actor);
}

async function audit(env: Bindings, action: string, postId: number, actor: string, note = "") {
  await env.DB.prepare("INSERT INTO audit_logs (action, post_id, actor, note, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(action, postId, actor, note, new Date().toISOString())
    .run();
}

function toPublicPost(env: Bindings, row: PostRow, includeContent = false) {
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

function toAdminPost(env: Bindings, row: PostRow) {
  return {
    ...toPublicPost(env, row, true),
    status: row.status,
    authorEmail: row.author_email,
    rejectionReason: row.rejection_reason,
  };
}
