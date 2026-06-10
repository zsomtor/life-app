import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { createTask, listTasks } from "@/lib/services/tasks";

export const GET = withApiAuth(async (req) => {
  const url = new URL(req.url);
  const doneParam = url.searchParams.get("done");
  const tasks = await listTasks({
    done: doneParam === null ? undefined : doneParam === "true",
    dueOnOrBefore: url.searchParams.get("dueOnOrBefore") ?? undefined,
  });
  return NextResponse.json({ tasks });
});

export const POST = withApiAuth(async (req) => {
  const task = await createTask(await req.json());
  return NextResponse.json({ task }, { status: 201 });
});
