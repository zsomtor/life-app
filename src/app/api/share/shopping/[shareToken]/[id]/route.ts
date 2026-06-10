import { NextResponse } from "next/server";
import { isValidShareToken, shareForbidden, toPublicItem } from "@/lib/share";
import { deleteShoppingItem, updateShoppingItem } from "@/lib/services/shopping";

type Ctx = { params: Promise<{ shareToken: string; id: string }> };

/** PATCH body: { checked?: boolean, name?, quantity? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const { shareToken, id } = await ctx.params;
  if (!isValidShareToken(shareToken)) return shareForbidden();
  try {
    const item = await updateShoppingItem(id, await req.json());
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item: toPublicItem(item) });
  } catch {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { shareToken, id } = await ctx.params;
  if (!isValidShareToken(shareToken)) return shareForbidden();
  const ok = await deleteShoppingItem(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
