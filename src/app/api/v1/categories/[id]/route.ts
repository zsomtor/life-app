import { NextResponse } from "next/server";
import { notFound, withApiAuth } from "@/lib/api-auth";
import { deleteCategory, renameCategory } from "@/lib/services/categories";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApiAuth<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const category = await renameCategory(id, await req.json());
  return category ? NextResponse.json({ category }) : notFound();
});

export const DELETE = withApiAuth<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  return (await deleteCategory(id)) ? NextResponse.json({ ok: true }) : notFound();
});
