import { Hono } from "hono";
import { audit } from "../../infrastructure/d1";
import type { Bindings } from "../../shared/types";

export const rejectPost = new Hono<{ Bindings: Bindings }>();

rejectPost.patch("/posts/:id/reject", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const body: { reason?: string } = await c.req.json<{ reason?: string }>().catch(() => ({}));
  const reason = body.reason?.trim();

  if (!reason) {
    return c.json({ error: "reason is required" }, 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare("UPDATE posts SET status = 'rejected', rejection_reason = ?, updated_at = ? WHERE id = ?")
    .bind(reason, now, id)
    .run();
  await audit(c.env, "reject", id, "admin", reason);

  return c.json({ data: { id, status: "rejected" } });
});
