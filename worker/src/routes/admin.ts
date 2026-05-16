import { Hono } from "hono";
import { approvePost, listPendingPosts, listReviewedPosts, rejectPost, softDeletePost } from "../services/post-service";
import type { Bindings } from "../types";
import { requireAdmin } from "../utils/auth";
import { parsePositiveInt } from "../utils/validation";

export const adminRoutes = new Hono<{ Bindings: Bindings }>();

adminRoutes.use("*", requireAdmin);

adminRoutes.get("/posts/pending", async (c) => {
  return c.json({ data: await listPendingPosts(c.env) });
});

adminRoutes.get("/posts/reviewed", async (c) => {
  const page = parsePositiveInt(c.req.query("page") || null, 1);
  const limit = parsePositiveInt(c.req.query("limit") || null, 10, 50);
  const data = await listReviewedPosts(c.env, page, limit);

  return c.json({ data, page, limit });
});

adminRoutes.patch("/posts/:id/approve", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  await approvePost(c.env, id, "admin");
  return c.json({ data: { id, status: "approved" } });
});

adminRoutes.patch("/posts/:id/reject", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  const body: { reason?: string } = await c.req.json<{ reason?: string }>().catch(() => ({}));
  const reason = body.reason?.trim();

  if (!reason) {
    return c.json({ error: "reason is required" }, 400);
  }

  await rejectPost(c.env, id, reason, "admin");
  return c.json({ data: { id, status: "rejected" } });
});

adminRoutes.delete("/posts/:id", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  await softDeletePost(c.env, id, "admin");
  return c.json({ data: { id, status: "deleted" } });
});
