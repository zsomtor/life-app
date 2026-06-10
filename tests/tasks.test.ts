import { describe, expect, it } from "vitest";
import { createMemoryRepos } from "@/lib/repos/memory";
import {
  createTask,
  deleteTask,
  listTasks,
  markTaskSentToTeam,
  todayTasks,
  updateTask,
} from "@/lib/services/tasks";
import { addIdea, convertIdeaToTask } from "@/lib/services/ideas";

describe("personal tasks", () => {
  it("creates, completes and uncompletes a task with timestamps", async () => {
    const repos = createMemoryRepos();
    const task = await createTask({ title: "  Write briefing  ", dueDate: "2026-06-10" }, repos);
    expect(task.title).toBe("Write briefing");
    expect(task.done).toBe(false);

    const done = await updateTask(task.id, { done: true }, repos);
    expect(done?.done).toBe(true);
    expect(done?.completedAt).toBeTruthy();

    const reopened = await updateTask(task.id, { done: false }, repos);
    expect(reopened?.done).toBe(false);
    expect(reopened?.completedAt).toBeNull();
  });

  it("rejects empty titles and bad dates", async () => {
    const repos = createMemoryRepos();
    await expect(createTask({ title: "   " }, repos)).rejects.toThrow();
    await expect(createTask({ title: "x", dueDate: "10/06/2026" }, repos)).rejects.toThrow();
  });

  it("buckets today's tasks into dueToday and overdue", async () => {
    const repos = createMemoryRepos();
    await createTask({ title: "today", dueDate: "2026-06-10" }, repos);
    await createTask({ title: "late", dueDate: "2026-06-01" }, repos);
    await createTask({ title: "future", dueDate: "2026-07-01" }, repos);
    const doneOne = await createTask({ title: "done today", dueDate: "2026-06-10" }, repos);
    await updateTask(doneOne.id, { done: true }, repos);

    const today = await todayTasks("2026-06-10", repos);
    expect(today.dueToday.map((t) => t.title)).toEqual(["today"]);
    expect(today.overdue.map((t) => t.title)).toEqual(["late"]);
    expect(today.openCount).toBe(3);
  });

  it("marks a task as sent to the team", async () => {
    const repos = createMemoryRepos();
    const task = await createTask({ title: "promote me" }, repos);
    const sent = await markTaskSentToTeam(task.id, "team-123", repos);
    expect(sent?.sentToTeamAt).toBeTruthy();
    expect(sent?.teamTaskId).toBe("team-123");
  });

  it("deletes tasks", async () => {
    const repos = createMemoryRepos();
    const task = await createTask({ title: "bye" }, repos);
    expect(await deleteTask(task.id, repos)).toBe(true);
    expect(await listTasks(undefined, repos)).toHaveLength(0);
  });

  it("converts an idea into a task (first line = title, rest = notes)", async () => {
    const repos = createMemoryRepos();
    const idea = await addIdea({ content: "Buy new mic\ncheck Rode vs Shure" }, repos);
    const converted = await convertIdeaToTask(idea.id, repos);
    expect(converted?.status).toBe("converted_task");

    const [task] = await listTasks(undefined, repos);
    expect(task.title).toBe("Buy new mic");
    expect(task.notes).toBe("check Rode vs Shure");
    expect(converted?.convertedToId).toBe(task.id);
  });
});
