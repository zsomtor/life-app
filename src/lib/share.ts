import { NextResponse } from "next/server";
import { env } from "./env";
import { tokenEquals } from "./auth";
import type { ShoppingItem } from "./repos/types";

export function isValidShareToken(token: string): boolean {
  const expected = env("SHOPPING_SHARE_TOKEN");
  // Require a reasonably long token so a missing/weak env can't open the list.
  if (!expected || expected.length < 16) return false;
  return tokenEquals(token, expected);
}

export function shareForbidden(): NextResponse {
  return NextResponse.json({ error: "Invalid link" }, { status: 404 });
}

/** Public projection — only what the share page needs, no timestamps/internals. */
export function toPublicItem(item: ShoppingItem) {
  return { id: item.id, name: item.name, quantity: item.quantity, checked: item.checked };
}
