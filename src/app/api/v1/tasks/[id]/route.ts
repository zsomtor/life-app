import { NextResponse } from "next/server";
import { notFound, withApiAuth } from "@/lib/api-auth";
import { deleteTask, updateTask } from "@/lib/services/tasks";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApiAuth<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const task = await updateTask(id, await req.json());
  return task ? NextResponse.json({ task }) : notFound();
});

export const DELETE = withApiAuth<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  return (await deleteTask(id)) ? NextResponse.json({ ok: true }) : notFound();
});
