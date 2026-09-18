import { Hono } from "hono";
import { audit } from "../../infrastructure/d1";
import type { Bindings } from "../../shared/types";

export const deletePost = new Hono<{ Bindings: Bindings }>();

deletePost.delete("/posts/:id", async (c) => {
  const id = Number.parseInt(c.req.param("id"), 10);
  await c.env.DB.prepare("UPDATE posts SET status = 'deleted', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
  await audit(c.env, "delete", id, "admin");

  return c.json({ data: { id, status: "deleted" } });
});
