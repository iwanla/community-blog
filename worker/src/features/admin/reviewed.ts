import { Hono } from "hono";
import { toAdminPost } from "../../infrastructure/d1";
import type { Bindings, PostRow } from "../../shared/types";
import { parsePositiveInt } from "../../shared/validation";

export const reviewedPosts = new Hono<{ Bindings: Bindings }>();

reviewedPosts.get("/posts/reviewed", async (c) => {
  const page = parsePositiveInt(c.req.query("page") || null, 1);
  const limit = parsePositiveInt(c.req.query("limit") || null, 10, 50);
  const offset = (page - 1) * limit;
  const rows = await c.env.DB.prepare(
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

  return c.json({ data: rows.results.map((row) => toAdminPost(c.env, row)), page, limit });
});
