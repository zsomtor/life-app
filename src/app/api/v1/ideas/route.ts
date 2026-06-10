import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { addIdea, listIdeas } from "@/lib/services/ideas";
import type { IdeaStatus } from "@/lib/repos/types";

const STATUSES: IdeaStatus[] = ["inbox", "archived", "converted_task", "converted_shopping"];

export const GET = withApiAuth(async (req) => {
  const status = new URL(req.url).searchParams.get("status");
  const ideas = await listIdeas(
    status && STATUSES.includes(status as IdeaStatus) ? { status: status as IdeaStatus } : undefined
  );
  return NextResponse.json({ ideas });
});

export const POST = withApiAuth(async (req) => {
  const idea = await addIdea(await req.json());
  return NextResponse.json({ idea }, { status: 201 });
});
