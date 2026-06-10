import { isValid, parseISO } from "date-fns";

export const TASK_PRIORITY_RANK: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function getTaskPriorityRank(priority: string | null | undefined) {
  return TASK_PRIORITY_RANK[priority ?? ""] ?? 0;
}

export function sortTasksByPriorityAndDueDate<
  T extends { priority?: string | null; due_date?: string | null; title: string },
>(tasks: T[]) {
  return [...tasks].sort((a, b) => {
    const priorityDiff = getTaskPriorityRank(b.priority) - getTaskPriorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const aDue = a.due_date && isValid(parseISO(a.due_date))
      ? parseISO(a.due_date).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bDue = b.due_date && isValid(parseISO(b.due_date))
      ? parseISO(b.due_date).getTime()
      : Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;

    return a.title.localeCompare(b.title);
  });
}

export function matchesTaskSearch(
  task: {
    title: string;
    description?: string | null;
    department?: string | null;
    assignee_name?: string | null;
    priority?: string | null;
    status?: string | null;
  },
  query: string,
) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  return [
    task.title,
    task.description,
    task.department,
    task.assignee_name,
    task.priority,
    task.status,
  ].some((value) => value?.toLowerCase().includes(trimmed));
}
