const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type SubmitPostInput = {
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  authorEmail: string;
  categoryId: number;
  location: string;
  coverImage: File;
};

export function parsePositiveInt(value: string | null, fallback: number, max = 100): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function validateSubmitForm(form: FormData): { data?: SubmitPostInput; error?: string } {
  const title = stringField(form, "title");
  const content = stringField(form, "content");
  const excerpt = stringField(form, "excerpt");
  const authorName = stringField(form, "authorName");
  const authorEmail = stringField(form, "authorEmail");
  const categoryId = Number.parseInt(stringField(form, "categoryId"), 10);
  const location = stringField(form, "location");
  const coverImage = form.get("coverImage");

  if (!title || !content || !authorName || !categoryId || !location) {
    return { error: "Title, content, authorName, categoryId, and location are required" };
  }

  if (title.length > 120) {
    return { error: "Title must be 120 characters or fewer" };
  }

  const contentText = stripHtml(content);
  if (contentText.length < 150 || contentText.length > 10000) {
    return { error: "Content must be between 150 and 10000 characters" };
  }

  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return { error: "authorEmail is invalid" };
  }

  if (!isFile(coverImage)) {
    return { error: "coverImage is required" };
  }

  if (!ALLOWED_IMAGE_TYPES.has(coverImage.type)) {
    return { error: "coverImage must be jpeg, png, or webp" };
  }

  if (coverImage.size > MAX_IMAGE_BYTES) {
    return { error: "coverImage must be 2MB or smaller" };
  }

  return {
    data: {
      title,
      content,
      excerpt,
      authorName,
      authorEmail,
      categoryId,
      location,
      coverImage,
    },
  };
}

function stringField(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isFile(value: unknown): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "size" in value &&
      "type" in value &&
      "stream" in value,
  );
}
