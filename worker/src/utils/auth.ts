import type { Context, Next } from "hono";
import type { Bindings } from "../types";

export async function requireAdmin(c: Context<{ Bindings: Bindings }>, next: Next) {
  const header = c.req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}
