import { Hono } from "hono";
import type { Bindings, CategoryRow } from "../../shared/types";

export const listCategories = new Hono<{ Bindings: Bindings }>();

listCategories.get("/", async (c) => {
  const rows = await c.env.DB.prepare(
    `
    SELECT id, name, slug
    FROM categories
    ORDER BY id ASC
    `,
  ).all<CategoryRow>();

  return c.json({ data: rows.results.map((row) => ({ id: row.id, name: row.name, slug: row.slug })) });
});
