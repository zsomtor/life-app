import { z } from "zod";
import { getRepos } from "../repos";
import type { Repos, ShoppingItem } from "../repos/types";

export const shoppingCreateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  quantity: z.string().trim().max(100).nullish(),
});

export const shoppingUpdateSchema = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  quantity: z.string().trim().max(100).nullable().optional(),
  checked: z.boolean().optional(),
});

export async function listShopping(repos: Repos = getRepos()): Promise<ShoppingItem[]> {
  return repos.shopping.list();
}

export async function addShoppingItem(
  input: z.infer<typeof shoppingCreateSchema>,
  repos: Repos = getRepos()
): Promise<ShoppingItem> {
  const data = shoppingCreateSchema.parse(input);
  return repos.shopping.create(data);
}

export async function updateShoppingItem(
  id: string,
  input: z.infer<typeof shoppingUpdateSchema>,
  repos: Repos = getRepos()
): Promise<ShoppingItem | null> {
  const patch = shoppingUpdateSchema.parse(input);
  const existing = await repos.shopping.get(id);
  if (!existing) return null;
  const checkedAt =
    patch.checked === undefined || patch.checked === existing.checked
      ? undefined
      : patch.checked
        ? new Date().toISOString()
        : null;
  return repos.shopping.update(id, { ...patch, checkedAt });
}

export async function deleteShoppingItem(id: string, repos: Repos = getRepos()): Promise<boolean> {
  return repos.shopping.delete(id);
}
