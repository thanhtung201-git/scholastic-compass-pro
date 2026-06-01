import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, isBefore, isValid, parseISO, startOfDay } from "date-fns";
import { AlertTriangle, Loader2, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/workload-view")({
  component: WorkloadViewPage,
});

const MAX_TASKS_PER_PERSON = 8;
const ACTIVE_STATUSES = new Set(["Todo", "In Progress", "Review"]);

type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string | null;
  user_name: string;
  user_role: string;
};

type RawTask = Omit<TaskRow, "user_name" | "user_role"> & {
  users?: { name?: string | null; role?: string | null } | null;
};

type RoleDepartment = {
  role_name: string;
  department_name: string;
};

type WorkloadUser = {
  id: string;
  name: string;
  role: string;
  department: string;
  tasks: TaskRow[];
  active_count: number;
  done_count: number;
  overdue_count: number;
  capacity_pct: number;
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function formatDueDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? format(date, "dd MMM yyyy") : "No due date";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NA";
}

function getCapacityTone(capacity: number) {
  if (capacity < 50) return "bg-emerald-500";
  if (capacity < 75) return "bg-blue-500";
  if (capacity < 90) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusClass(status: string | null) {
  if (status === "Done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Review") return "bg-violet-50 text-violet-700 border-violet-200";
  if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function WorkloadViewPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [roleDepartments, setRoleDepartments] = useState<RoleDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedUser, setSelectedUser] = useState<WorkloadUser | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchWorkload() {
      setLoading(true);
      setError(null);

      const [tasksResult, rolesResult] = await Promise.all([
        supabase
          .from("tasks")
          .select(`
            id, title, assigned_to, status, priority, due_date, created_at,
            users!tasks_assigned_to_fkey(name, role)
          `)
          .order("created_at", { ascending: true }),
        supabase.from("roles").select("role_name, department_name"),
      ]);

      if (!active) return;

      if (tasksResult.error) {
        setError(tasksResult.error.message);
        setTasks([]);
      } else if (rolesResult.error) {
        setError(rolesResult.error.message);
        setTasks([]);
      } else {
        setRoleDepartments((rolesResult.data ?? []) as RoleDepartment[]);
        setTasks(
          ((tasksResult.data ?? []) as RawTask[]).map((task) => ({
            ...task,
            user_name: task.users?.name ?? "Unassigned",
            user_role: task.users?.role ?? "Unassigned",
          })),
        );
      }

      setLoading(false);
    }

    fetchWorkload();

    return () => {
      active = false;
    };
  }, []);

  const departmentByRole = useMemo(() => {
    return new Map(roleDepartments.map((role) => [role.role_name, role.department_name]));
  }, [roleDepartments]);

  const users = useMemo(() => {
    const today = startOfDay(new Date());
    const grouped = new Map<string, TaskRow[]>();

    tasks.forEach((task) => {
      const key = task.assigned_to ?? "__unassigned__";
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    });

    return Array.from(grouped.entries())
      .map(([id, userTasks]) => {
        const firstTask = userTasks[0];
        const role = firstTask.user_role;
        const department = departmentByRole.get(role) ?? "Unassigned";
        const active_count = userTasks.filter((task) =>
          ACTIVE_STATUSES.has(task.status ?? ""),
        ).length;
        const done_count = userTasks.filter((task) => task.status === "Done").length;
        const overdue_count = userTasks.filter((task) => {
          const due = parseDate(task.due_date);
          return Boolean(
            due && isBefore(startOfDay(due), today) && task.status !== "Done",
          );
        }).length;

        return {
          id,
          name: firstTask.user_name,
          role,
          department,
          tasks: userTasks,
          active_count,
          done_count,
          overdue_count,
          capacity_pct: Math.round((active_count / MAX_TASKS_PER_PERSON) * 100),
        };
      })
      .sort((a, b) => b.capacity_pct - a.capacity_pct || a.name.localeCompare(b.name));
  }, [departmentByRole, tasks]);

  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(users.map((user) => user.department)))];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (selectedDepartment === "All") return users;
    return users.filter((user) => user.department === selectedDepartment);
  }, [selectedDepartment, users]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Workload View"
        description={`Monitor task capacity by assignee. Max ${MAX_TASKS_PER_PERSON} active tasks per person.`}
      />

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {departments.map((department) => (
            <button
              key={department}
              type="button"
              onClick={() => setSelectedDepartment(department)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedDepartment === department
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {department}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-80 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading workload...
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load workload: {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-center text-muted-foreground">
            <UsersRound className="mb-3 size-10 opacity-40" />
            <div className="font-medium text-foreground">No assigned tasks found</div>
            <div className="text-sm">Try another department filter.</div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredUsers.map((user) => {
              const extraTaskCount = Math.max(0, user.tasks.length - 3);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className="rounded-lg border bg-background p-4 text-left shadow-sm transition hover:border-primary/50 hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {user.role} · {user.department}
                        </div>
                      </div>
                    </div>
                    <Badge variant={user.capacity_pct >= 90 ? "destructive" : "secondary"}>
                      {user.capacity_pct}%
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      Active {user.active_count}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Done {user.done_count}
                    </span>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                      Overdue {user.overdue_count}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Capacity</span>
                      <span>
                        {user.active_count}/{MAX_TASKS_PER_PERSON} active tasks
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getCapacityTone(user.capacity_pct),
                        )}
                        style={{ width: `${Math.min(user.capacity_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {user.capacity_pct >= 90 && (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      <AlertTriangle className="size-4 shrink-0" />
                      Consider redistributing {Math.max(1, user.active_count - MAX_TASKS_PER_PERSON + 1)} tasks
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.tasks.slice(0, 3).map((task) => (
                      <span
                        key={task.id}
                        className="max-w-[180px] truncate rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {task.title}
                      </span>
                    ))}
                    {extraTaskCount > 0 && (
                      <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                        +{extraTaskCount} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUser.name}</SheetTitle>
                <SheetDescription>
                  {selectedUser.role} · {selectedUser.department} · {selectedUser.tasks.length} tasks
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                {selectedUser.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{task.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Due {formatDueDate(task.due_date)}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                          getStatusClass(task.status),
                        )}
                      >
                        {task.status ?? "Unknown"}
                      </span>
                    </div>
                    {task.priority && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Priority: {task.priority}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
