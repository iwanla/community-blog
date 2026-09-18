import { Hono } from "hono";
import { toPublicPost } from "../../infrastructure/d1";
import type { Bindings, PostRow } from "../../shared/types";
import { parsePositiveInt } from "../../shared/validation";

export const listPosts = new Hono<{ Bindings: Bindings }>();

listPosts.get("/", async (c) => {
  const page = parsePositiveInt(c.req.query("page") || null, 1);
  const limit = parsePositiveInt(c.req.query("limit") || null, 10, 50);
  const category = c.req.query("category");
  const offset = (page - 1) * limit;
  const categoryFilter = category ? "AND c.slug = ?" : "";
  const params = category ? [category, limit, offset] : [limit, offset];
  const rows = await c.env.DB.prepare(
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

  return c.json({ data: rows.results.map((row) => toPublicPost(row)), page, limit });
});

listPosts.get("/featured", async (c) => {
  const row = await c.env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'approved'
    ORDER BY ((COALESCE(p.views, 0)) + (COALESCE(p.likes, 0) * 5)) DESC, p.approved_at DESC, p.created_at DESC
    LIMIT 1
    `,
  ).first<PostRow>();

  return c.json({ data: row ? toPublicPost(row) : null });
});
