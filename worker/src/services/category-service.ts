import type { Bindings, CategoryRow } from "../types";

export async function listCategories(env: Bindings) {
  const rows = await env.DB.prepare(
    `
    SELECT id, name, slug
    FROM categories
    ORDER BY id ASC
    `,
  ).all<CategoryRow>();

  return rows.results.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
  }));
}

export async function categoryExists(env: Bindings, categoryId: number) {
  const row = await env.DB.prepare("SELECT id FROM categories WHERE id = ? LIMIT 1").bind(categoryId).first<{ id: number }>();
  return Boolean(row);
}
