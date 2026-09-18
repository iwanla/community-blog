import { Hono } from "hono";
import { findApprovedPostIdBySlug } from "../../infrastructure/d1";
import type { Bindings } from "../../shared/types";
import { getFingerprint } from "../../shared/fingerprint";

type ReactionType = "like" | "dislike" | "none";

export const reactToPost = new Hono<{ Bindings: Bindings }>();

reactToPost.post("/:slug/react", async (c) => {
  let body: { type?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (body.type !== "like" && body.type !== "dislike" && body.type !== "none") {
    return c.json({ error: 'type must be "like", "dislike", or "none"' }, 400);
  }

  const postId = await findApprovedPostIdBySlug(c.env, c.req.param("slug"));
  if (!postId) {
    return c.json({ error: "Post not found" }, 404);
  }

  const fingerprint = await getFingerprint(c.req.raw);
  const type = body.type as ReactionType;
  if (type === "none") {
    await c.env.DB.prepare("DELETE FROM reactions WHERE post_id = ? AND fingerprint = ?")
      .bind(postId, fingerprint)
      .run();
  } else {
    await c.env.DB.prepare(
      `
      INSERT INTO reactions (post_id, fingerprint, type, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(post_id, fingerprint)
      DO UPDATE SET type = excluded.type, updated_at = excluded.updated_at
      `,
    )
      .bind(postId, fingerprint, type)
      .run();
  }

  await c.env.DB.prepare(
    `
    UPDATE posts
    SET
      likes = (SELECT COUNT(*) FROM reactions WHERE post_id = ? AND type = 'like'),
      dislikes = (SELECT COUNT(*) FROM reactions WHERE post_id = ? AND type = 'dislike')
    WHERE id = ?
    `,
  )
    .bind(postId, postId, postId)
    .run();

  const counters = await c.env.DB.prepare("SELECT likes, dislikes FROM posts WHERE id = ? LIMIT 1")
    .bind(postId)
    .first<{ likes: number; dislikes: number }>();

  return c.json({ ok: true, likes: counters?.likes ?? 0, dislikes: counters?.dislikes ?? 0 });
});
