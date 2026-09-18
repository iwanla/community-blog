import { Hono } from "hono";
import { findApprovedPostIdBySlug } from "../../infrastructure/d1";
import type { Bindings } from "../../shared/types";
import { getFingerprint } from "../../shared/fingerprint";

export const viewPost = new Hono<{ Bindings: Bindings }>();

viewPost.post("/:slug/view", async (c) => {
  const postId = await findApprovedPostIdBySlug(c.env, c.req.param("slug"));
  if (!postId) {
    return c.json({ error: "Post not found" }, 404);
  }

  const fingerprint = await getFingerprint(c.req.raw);
  const inserted = await c.env.DB.prepare("INSERT OR IGNORE INTO view_logs (post_id, fingerprint) VALUES (?, ?)")
    .bind(postId, fingerprint)
    .run();

  if (inserted.meta.changes > 0) {
    await c.env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?")
      .bind(postId)
      .run();
  }

  const counters = await c.env.DB.prepare("SELECT views FROM posts WHERE id = ? LIMIT 1")
    .bind(postId)
    .first<{ views: number }>();

  return c.json({ counted: inserted.meta.changes > 0, views: counters?.views ?? 0 });
});
