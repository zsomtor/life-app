import { NextResponse } from "next/server";
import { badRequest, notFound, withApiAuth } from "@/lib/api-auth";
import {
  archiveIdea,
  convertIdeaToShopping,
  convertIdeaToTask,
  deleteIdea,
  restoreIdea,
} from "@/lib/services/ideas";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH body: { action: "archive" | "restore" | "convert_task" | "convert_shopping" } */
export const PATCH = withApiAuth<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const { action } = await req.json();
  const idea =
    action === "archive"
      ? await archiveIdea(id)
      : action === "restore"
        ? await restoreIdea(id)
        : action === "convert_task"
          ? await convertIdeaToTask(id)
          : action === "convert_shopping"
            ? await convertIdeaToShopping(id)
            : undefined;
  if (idea === undefined) return badRequest("Unknown action");
  return idea ? NextResponse.json({ idea }) : notFound();
});

export const DELETE = withApiAuth<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  return (await deleteIdea(id)) ? NextResponse.json({ ok: true }) : notFound();
});
