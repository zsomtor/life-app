import { describe, expect, it } from "vitest";
import { createMemoryRepos } from "@/lib/repos/memory";
import {
  addShoppingItem,
  deleteShoppingItem,
  listShopping,
  updateShoppingItem,
} from "@/lib/services/shopping";
import { addIdea, convertIdeaToShopping, inboxCount } from "@/lib/services/ideas";

describe("shopping list", () => {
  it("adds, checks, unchecks and deletes items", async () => {
    const repos = createMemoryRepos();
    const item = await addShoppingItem({ name: "Tej", quantity: "2l" }, repos);
    expect(item.checked).toBe(false);
    expect(item.quantity).toBe("2l");

    const checked = await updateShoppingItem(item.id, { checked: true }, repos);
    expect(checked?.checked).toBe(true);
    expect(checked?.checkedAt).toBeTruthy();

    const unchecked = await updateShoppingItem(item.id, { checked: false }, repos);
    expect(unchecked?.checkedAt).toBeNull();

    expect(await deleteShoppingItem(item.id, repos)).toBe(true);
    expect(await listShopping(repos)).toHaveLength(0);
  });

  it("rejects empty names", async () => {
    const repos = createMemoryRepos();
    await expect(addShoppingItem({ name: "" }, repos)).rejects.toThrow();
  });

  it("returns null for unknown ids instead of throwing", async () => {
    const repos = createMemoryRepos();
    expect(await updateShoppingItem("00000000-0000-0000-0000-000000000000", { checked: true }, repos)).toBeNull();
  });

  it("converts an idea into a shopping item and decrements the inbox", async () => {
    const repos = createMemoryRepos();
    const idea = await addIdea({ content: "Papírzacskó" }, repos);
    expect(await inboxCount(repos)).toBe(1);

    const converted = await convertIdeaToShopping(idea.id, repos);
    expect(converted?.status).toBe("converted_shopping");
    expect(await inboxCount(repos)).toBe(0);

    const [item] = await listShopping(repos);
    expect(item.name).toBe("Papírzacskó");
  });
});
