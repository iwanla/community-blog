import { Hono } from "hono";
import { listCategories } from "../services/category-service";
import type { Bindings } from "../types";

export const categoryRoutes = new Hono<{ Bindings: Bindings }>();

categoryRoutes.get("/", async (c) => {
  return c.json({ data: await listCategories(c.env) });
});
