import { NextResponse } from "next/server";
import { isValidShareToken, shareForbidden, toPublicItem } from "@/lib/share";
import { addShoppingItem, listShopping } from "@/lib/services/shopping";

type Ctx = { params: Promise<{ shareToken: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { shareToken } = await ctx.params;
  if (!isValidShareToken(shareToken)) return shareForbidden();
  const items = await listShopping();
  return NextResponse.json({ items: items.map(toPublicItem) });
}

export async function POST(req: Request, ctx: Ctx) {
  const { shareToken } = await ctx.params;
  if (!isValidShareToken(shareToken)) return shareForbidden();
  try {
    const item = await addShoppingItem(await req.json());
    return NextResponse.json({ item: toPublicItem(item) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
}
