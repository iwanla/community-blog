import type { Bindings } from "../types";

export type ReactionType = "like" | "dislike" | "none";

type CounterRow = {
  views: number;
  likes: number;
  dislikes: number;
};

export async function findApprovedPostIdBySlug(env: Bindings, slug: string): Promise<number | null> {
  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'approved' LIMIT 1")
    .bind(slug)
    .first<{ id: number }>();

  return post?.id ?? null;
}

export async function trackView(env: Bindings, postId: number, fingerprint: string): Promise<{ counted: boolean; views: number }> {
  const inserted = await env.DB.prepare("INSERT OR IGNORE INTO view_logs (post_id, fingerprint) VALUES (?, ?)")
    .bind(postId, fingerprint)
    .run();

  if (inserted.meta.changes > 0) {
    await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?")
      .bind(postId)
      .run();
  }

  const counters = await getCounters(env, postId);
  return { counted: inserted.meta.changes > 0, views: counters.views };
}

export async function setReaction(env: Bindings, postId: number, fingerprint: string, type: ReactionType): Promise<{ likes: number; dislikes: number }> {
  if (type === "none") {
    await env.DB.prepare("DELETE FROM reactions WHERE post_id = ? AND fingerprint = ?")
      .bind(postId, fingerprint)
      .run();
  } else {
    await env.DB.prepare(
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

  await syncReactionCounters(env, postId);
  const counters = await getCounters(env, postId);
  return { likes: counters.likes, dislikes: counters.dislikes };
}

async function syncReactionCounters(env: Bindings, postId: number) {
  await env.DB.prepare(
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
}

async function getCounters(env: Bindings, postId: number): Promise<CounterRow> {
  const counters = await env.DB.prepare("SELECT views, likes, dislikes FROM posts WHERE id = ? LIMIT 1")
    .bind(postId)
    .first<CounterRow>();

  return {
    views: counters?.views ?? 0,
    likes: counters?.likes ?? 0,
    dislikes: counters?.dislikes ?? 0,
  };
}
