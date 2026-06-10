import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { addShoppingItem, listShopping } from "@/lib/services/shopping";

export const GET = withApiAuth(async () => {
  return NextResponse.json({ items: await listShopping() });
});

export const POST = withApiAuth(async (req) => {
  const item = await addShoppingItem(await req.json());
  return NextResponse.json({ item }, { status: 201 });
});
