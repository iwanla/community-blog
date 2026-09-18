import { Hono } from "hono";
import { toAdminPost } from "../../infrastructure/d1";
import type { Bindings, PostRow } from "../../shared/types";

export const pendingPosts = new Hono<{ Bindings: Bindings }>();

pendingPosts.get("/posts/pending", async (c) => {
  const rows = await c.env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'pending'
    ORDER BY p.created_at ASC
    LIMIT 100
    `,
  ).all<PostRow>();

  return c.json({ data: rows.results.map((row) => toAdminPost(c.env, row)) });
});
