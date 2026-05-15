import type { Context, Next } from "hono";
import type { Bindings } from "../types";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function submitRateLimit(c: Context<{ Bindings: Bindings }>, next: Next) {
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const current = buckets.get(ip);

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    return c.json({ error: "Too many submissions. Please try again later." }, 429);
  }

  current.count += 1;
  await next();
}
