import { Hono } from "hono";
import { audit } from "../../infrastructure/d1";
import type { Bindings } from "../../shared/types";

export const approvePost = new Hono<{ Bindings: Bindings }>();

approvePost.patch("/posts/:id/approve", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE posts SET status = 'approved', approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?",
  )
    .bind(now, "admin", now, id)
    .run();
  await audit(c.env, "approve", id, "admin");

  return c.json({ data: { id, status: "approved" } });
});
