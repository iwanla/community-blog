import { Hono } from "hono";
import { cors } from "hono/cors";
import { approvePost } from "./features/admin/approve";
import { deletePost } from "./features/admin/delete";
import { pendingPosts } from "./features/admin/pending";
import { rejectPost } from "./features/admin/reject";
import { reviewedPosts } from "./features/admin/reviewed";
import { listCategories } from "./features/categories/list";
import { postDetail } from "./features/posts/detail";
import { listPosts } from "./features/posts/list";
import { reactToPost } from "./features/posts/react";
import { submitPost } from "./features/posts/submit";
import { viewPost } from "./features/posts/view";
import { requireAdmin } from "./shared/auth";
import type { Bindings } from "./shared/types";

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

app.route("/api/posts", listPosts);
app.route("/api/posts", postDetail);
app.route("/api/posts", submitPost);
app.route("/api/posts", viewPost);
app.route("/api/posts", reactToPost);
app.route("/api/categories", listCategories);

app.use("/api/admin/*", requireAdmin);
app.route("/api/admin", pendingPosts);
app.route("/api/admin", reviewedPosts);
app.route("/api/admin", approvePost);
app.route("/api/admin", rejectPost);
app.route("/api/admin", deletePost);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
