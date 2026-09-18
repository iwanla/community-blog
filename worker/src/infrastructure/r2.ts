import type { Bindings } from "../shared/types";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadCoverImage(env: Bindings, postId: number, image: File): Promise<string> {
  const extension = EXTENSIONS[image.type] || "jpg";
  const key = `posts/${postId}/cover-${Date.now()}.${extension}`;

  await env.BUCKET.put(key, image.stream(), {
    httpMetadata: {
      contentType: image.type,
    },
  });

  return key;
}

export async function deleteObject(env: Bindings, key: string | null) {
  if (key) {
    await env.BUCKET.delete(key);
  }
}

export function publicImageUrl(key: string | null): string | null {
  return key ? `/assets/${key}` : null;
}
