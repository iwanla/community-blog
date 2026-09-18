import { Hono } from "hono";
import { getPostById } from "../../infrastructure/d1";
import { uploadCoverImage } from "../../infrastructure/r2";
import { notifyNewSubmission } from "../../infrastructure/telegram";
import { verifyTurnstileToken } from "../../infrastructure/turnstile";
import type { Bindings } from "../../shared/types";
import { uniqueSlug } from "../../shared/slug";
import { submitRateLimit } from "../../shared/rate-limit";
import { validateSubmitForm } from "../../shared/validation";

export const submitPost = new Hono<{ Bindings: Bindings }>();

submitPost.post("/", submitRateLimit, async (c) => {
  const form = await c.req.formData();
  const turnstileToken = form.get("cf-turnstile-response");

  if (typeof turnstileToken !== "string" || !(await verifyTurnstileToken(c.env, turnstileToken, c.req.header("CF-Connecting-IP")))) {
    return c.json({ error: "Verification failed. Please try again." }, 400);
  }

  const validation = validateSubmitForm(form);
  if (!validation.data) {
    return c.json({ error: validation.error || "Invalid request" }, 400);
  }

  const category = await c.env.DB.prepare("SELECT id FROM categories WHERE id = ? LIMIT 1")
    .bind(validation.data.categoryId)
    .first<{ id: number }>();
  if (!category) {
    return c.json({ error: "categoryId is invalid" }, 400);
  }

  const input = validation.data;
  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `
    INSERT INTO posts (
      title, slug, excerpt, content, author_name, author_email, category_id, location, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
  )
    .bind(
      input.title,
      uniqueSlug(input.title),
      input.excerpt || input.content.slice(0, 160),
      input.content,
      input.authorName,
      input.authorEmail || null,
      input.categoryId,
      input.location,
      now,
    )
    .run();

  const postId = Number(result.meta.last_row_id);
  const coverKey = await uploadCoverImage(c.env, postId, input.coverImage);
  await c.env.DB.prepare("UPDATE posts SET cover_image_key = ?, updated_at = ? WHERE id = ?")
    .bind(coverKey, new Date().toISOString(), postId)
    .run();

  const post = await getPostById(c.env, postId);
  if (post) {
    await notifyNewSubmission(c.env, post);
  }

  return c.json({ data: { id: postId, status: "pending" } }, 201);
});
