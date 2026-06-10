import { NextResponse } from "next/server";
import { notFound, withApiAuth } from "@/lib/api-auth";
import { deleteShoppingItem, updateShoppingItem } from "@/lib/services/shopping";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApiAuth<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const item = await updateShoppingItem(id, await req.json());
  return item ? NextResponse.json({ item }) : notFound();
});

export const DELETE = withApiAuth<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  return (await deleteShoppingItem(id)) ? NextResponse.json({ ok: true }) : notFound();
});
