/**
 * Repository interfaces — the only seam between business logic and storage.
 * Implementations: postgres (production), memory (dev fallback + tests).
 * PHASE 2: a `file` driver (plain JSON files in a workspace folder) can be
 * added here for the home-server setup without touching services or routes.
 */

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null; // YYYY-MM-DD
  done: boolean;
  createdAt: string; // ISO
  completedAt: string | null;
  sentToTeamAt: string | null;
  teamTaskId: string | null;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  checked: boolean;
  createdAt: string;
  checkedAt: string | null;
};

export type IdeaStatus = "inbox" | "archived" | "converted_task" | "converted_shopping";

export type Idea = {
  id: string;
  content: string;
  status: IdeaStatus;
  createdAt: string;
  resolvedAt: string | null;
  convertedToId: string | null;
};

export interface TaskRepo {
  list(filter?: { done?: boolean; dueOnOrBefore?: string }): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(data: { title: string; notes?: string | null; dueDate?: string | null }): Promise<Task>;
  update(id: string, patch: Partial<Omit<Task, "id" | "createdAt">>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}

export interface ShoppingRepo {
  list(): Promise<ShoppingItem[]>;
  get(id: string): Promise<ShoppingItem | null>;
  create(data: { name: string; quantity?: string | null }): Promise<ShoppingItem>;
  update(id: string, patch: Partial<Omit<ShoppingItem, "id" | "createdAt">>): Promise<ShoppingItem | null>;
  delete(id: string): Promise<boolean>;
}

export interface IdeaRepo {
  list(filter?: { status?: IdeaStatus }): Promise<Idea[]>;
  get(id: string): Promise<Idea | null>;
  create(data: { content: string }): Promise<Idea>;
  update(id: string, patch: Partial<Omit<Idea, "id" | "createdAt">>): Promise<Idea | null>;
  delete(id: string): Promise<boolean>;
  countInbox(): Promise<number>;
}

export interface Repos {
  tasks: TaskRepo;
  shopping: ShoppingRepo;
  ideas: IdeaRepo;
}
