import { Hono } from "hono";
import { toPublicPost } from "../../infrastructure/d1";
import type { Bindings, PostRow } from "../../shared/types";

export const postDetail = new Hono<{ Bindings: Bindings }>();

postDetail.get("/:slug", async (c) => {
  const row = await c.env.DB.prepare(
    `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'approved'
    LIMIT 1
    `,
  )
    .bind(c.req.param("slug"))
    .first<PostRow>();

  if (!row) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ data: toPublicPost(c.env, row, true) });
});
