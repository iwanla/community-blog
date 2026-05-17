import { Hono } from "hono";
import { categoryExists } from "../services/category-service";
import { attachCoverImage, createPendingPost, getApprovedPostBySlug, getPostById, listApprovedPosts } from "../services/post-service";
import { findApprovedPostIdBySlug, setReaction, trackView } from "../services/reaction-service";
import { uploadCoverImage } from "../services/r2-service";
import { notifyNewSubmission } from "../services/telegram-service";
import type { Bindings } from "../types";
import { getFingerprint } from "../utils/fingerprint";
import { submitRateLimit } from "../utils/rate-limit";
import { parsePositiveInt, validateSubmitForm } from "../utils/validation";

export const postRoutes = new Hono<{ Bindings: Bindings }>();

postRoutes.get("/", async (c) => {
  const page = parsePositiveInt(c.req.query("page") || null, 1);
  const limit = parsePositiveInt(c.req.query("limit") || null, 10, 50);
  const category = c.req.query("category");
  const data = await listApprovedPosts(c.env, page, limit, category);

  return c.json({ data, page, limit });
});

postRoutes.get("/:slug", async (c) => {
  const post = await getApprovedPostBySlug(c.env, c.req.param("slug"));

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  return c.json({ data: post });
});

postRoutes.post("/:slug/view", async (c) => {
  const postId = await findApprovedPostIdBySlug(c.env, c.req.param("slug"));

  if (!postId) {
    return c.json({ error: "Post not found" }, 404);
  }

  const fingerprint = await getFingerprint(c.req.raw);
  const result = await trackView(c.env, postId, fingerprint);

  return c.json(result);
});

postRoutes.post("/:slug/react", async (c) => {
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
  const counters = await setReaction(c.env, postId, fingerprint, body.type);

  return c.json({ ok: true, ...counters });
});

postRoutes.post("/", submitRateLimit, async (c) => {
  const form = await c.req.formData();
  const validation = validateSubmitForm(form);

  if (!validation.data) {
    return c.json({ error: validation.error || "Invalid request" }, 400);
  }

  if (!(await categoryExists(c.env, validation.data.categoryId))) {
    return c.json({ error: "categoryId is invalid" }, 400);
  }

  const postId = await createPendingPost(c.env, validation.data);
  const coverKey = await uploadCoverImage(c.env, postId, validation.data.coverImage);
  await attachCoverImage(c.env, postId, coverKey);

  const post = await getPostById(c.env, postId);
  if (post) {
    await notifyNewSubmission(c.env, post);
  }

  return c.json({ data: { id: postId, status: "pending" } }, 201);
});
