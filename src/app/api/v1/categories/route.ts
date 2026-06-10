import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { createCategory, listCategories } from "@/lib/services/categories";

export const GET = withApiAuth(async () => {
  return NextResponse.json({ categories: await listCategories() });
});

export const POST = withApiAuth(async (req) => {
  const category = await createCategory(await req.json());
  return NextResponse.json({ category }, { status: 201 });
});
