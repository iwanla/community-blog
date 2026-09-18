import type { Bindings, PostRow } from "../shared/types";

export async function notifyNewSubmission(env: Bindings, post: Pick<PostRow, "id" | "title" | "author_name">) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return;
  }

  const text = [
    "Submission baru JelajahTaliabu",
    `ID: ${post.id}`,
    `Judul: ${post.title}`,
    `Penulis: ${post.author_name}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
    }),
  });
}
