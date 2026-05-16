import { Hono } from "hono";
import { cors } from "hono/cors";
import { adminRoutes } from "./routes/admin";
import { categoryRoutes } from "./routes/categories";
import { postRoutes } from "./routes/posts";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/", (c) => c.json({ ok: true, service: "jelajah-blog-api" }));

app.get("/assets/*", async (c) => {
  const key = c.req.path.replace(/^\/assets\//, "");
  if (!key) {
    return c.json({ error: "Asset key is required" }, 400);
  }

  const object = await c.env.BUCKET.get(key);
  if (!object) {
    return c.json({ error: "Asset not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

app.route("/api/posts", postRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/admin", adminRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
