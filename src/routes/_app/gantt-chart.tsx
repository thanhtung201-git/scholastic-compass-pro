import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { ChartGantt, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUserDepartment } from "@/hooks/use-current-user-department";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/gantt-chart")({
  component: GanttChartPage,
});

type ZoomLevel = "week" | "month" | "quarter";

type TaskRow = {
  id: string;
  title: string;
  department: string | null;
  assigned_to: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
  assignee_name: string;
};

type RawTask = Omit<TaskRow, "assignee_name"> & {
  users?: { name?: string | null } | null;
};

const ZOOM_DAYS: Record<ZoomLevel, number> = {
  week: 7,
  month: 31,
  quarter: 92,
};

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  week: "Week",
  month: "Month",
  quarter: "Quarter",
};

const DAY_WIDTH_BY_ZOOM: Record<ZoomLevel, number> = {
  week: 96,
  month: 48,
  quarter: 24,
};

const DEPARTMENT_STYLES = [
  "bg-blue-500 border-blue-600",
  "bg-emerald-500 border-emerald-600",
  "bg-amber-500 border-amber-600",
  "bg-violet-500 border-violet-600",
  "bg-cyan-500 border-cyan-600",
  "bg-rose-500 border-rose-600",
  "bg-lime-600 border-lime-700",
  "bg-fuchsia-500 border-fuchsia-600",
];

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function formatDateTime(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? format(date, "dd MMM yyyy") : "No date";
}

function daysBetween(date: Date, start: Date) {
  return differenceInCalendarDays(startOfDay(date), startOfDay(start));
}

function getTaskBounds(task: Pick<TaskRow, "created_at" | "due_date">) {
  const start = parseDate(task.created_at);
  if (!start) return null;

  const due = parseDate(task.due_date);
  const end = due && !isBefore(due, start) ? due : start;

  return { start, end, due };
}

function GanttChartPage() {
  const {
    department: currentUserDepartment,
    canViewAllDepartments,
    loading: departmentLoading,
    error: departmentError,
  } = useCurrentUserDepartment();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  useEffect(() => {
    let active = true;

    async function fetchTasks() {
      if (departmentLoading) return;
      if (!canViewAllDepartments && !currentUserDepartment) {
        setTasks([]);
        setError(departmentError ?? "Your role is not assigned to a department.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let query = supabase
        .from("tasks")
        .select(`
          id, title, department, assigned_to, priority, status, due_date, created_at,
          users!tasks_assigned_to_fkey(name)
        `)
        .order("created_at", { ascending: true });

      if (!canViewAllDepartments) {
        query = query.eq("department", currentUserDepartment);
      }

      const { data, error: fetchError } = await query;

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setTasks([]);
      } else {
        setTasks(
          ((data ?? []) as RawTask[]).map((task) => ({
            ...task,
            assignee_name: task.users?.name ?? "Unassigned",
          })),
        );
      }

      setLoading(false);
    }

    fetchTasks();

    return () => {
      active = false;
    };
  }, [canViewAllDepartments, currentUserDepartment, departmentError, departmentLoading]);

  const departments = useMemo(() => {
    const values = tasks
      .map((task) => task.department?.trim() || "Unassigned")
      .filter(Boolean);
    return ["All", ...Array.from(new Set(values))];
  }, [tasks]);

  const departmentClassMap = useMemo(() => {
    const map = new Map<string, string>();
    departments
      .filter((department) => department !== "All")
      .forEach((department, index) => {
        map.set(department, DEPARTMENT_STYLES[index % DEPARTMENT_STYLES.length]);
      });
    return map;
  }, [departments]);

  const filteredTasks = useMemo(() => {
    if (selectedDepartment === "All") return tasks;
    return tasks.filter(
      (task) => (task.department?.trim() || "Unassigned") === selectedDepartment,
    );
  }, [selectedDepartment, tasks]);

  const timeline = useMemo(() => {
    const today = startOfDay(new Date());
    const taskDates = filteredTasks.flatMap((task) => {
      const bounds = getTaskBounds(task);
      return bounds ? [bounds.start, bounds.end] : [];
    });

    const minTaskDate = taskDates.reduce<Date | null>(
      (min, date) => (!min || isBefore(date, min) ? date : min),
      null,
    );
    const maxTaskDate = taskDates.reduce<Date | null>(
      (max, date) => (!max || isAfter(date, max) ? date : max),
      null,
    );

    const visibleDays = ZOOM_DAYS[zoom];
    const baseStart = minTaskDate ? startOfDay(minTaskDate) : today;
    const baseEnd = addDays(baseStart, visibleDays);
    const latestRequiredDate =
      maxTaskDate && isAfter(maxTaskDate, baseEnd) ? startOfDay(maxTaskDate) : baseEnd;
    const visibleStart = subDays(baseStart, 1);
    const visibleEnd = addDays(latestRequiredDate, 1);
    const totalDays = Math.max(
      1,
      differenceInCalendarDays(startOfDay(visibleEnd), startOfDay(visibleStart)),
    );
    const ticks = eachDayOfInterval({
      start: visibleStart,
      end: visibleEnd,
    }).filter((date, index) => {
      if (zoom === "week") return true;
      if (zoom === "month") return index % 3 === 0;
      return index % 7 === 0;
    });

    return { today, visibleStart, visibleEnd, totalDays, ticks };
  }, [filteredTasks, zoom]);

  const dayWidth = DAY_WIDTH_BY_ZOOM[zoom];
  const timelineWidth = Math.max(720, timeline.totalDays * dayWidth);
  const chartWidth = 200 + timelineWidth;
  const todayLeftPx = daysBetween(timeline.today, timeline.visibleStart) * dayWidth;
  const todayVisible = todayLeftPx >= 0 && todayLeftPx <= timelineWidth;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6 p-6">
        <PageHeader
          title="Gantt Chart"
          description="Review task timelines by department, assignee, status, and priority."
        />

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ZOOM_LABELS) as ZoomLevel[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={zoom === value ? "default" : "outline"}
                  onClick={() => setZoom(value)}
                >
                  {ZOOM_LABELS[value]}
                </Button>
              ))}
            </div>

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
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading tasks...
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load Gantt chart: {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center text-center text-muted-foreground">
              <ChartGantt className="mb-3 size-10 opacity-40" />
              <div className="font-medium text-foreground">No tasks found</div>
              <div className="text-sm">Try another department filter.</div>
            </div>
          ) : (
            <div className="overflow-auto rounded-md border">
              <div style={{ width: chartWidth }}>
                <div
                  className="grid border-b bg-muted/40"
                  style={{ gridTemplateColumns: `200px ${timelineWidth}px` }}
                >
                  <div className="border-r px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Task
                  </div>
                  <div className="relative h-14" style={{ width: timelineWidth }}>
                    {timeline.ticks.map((tick) => {
                      const left = daysBetween(tick, timeline.visibleStart) * dayWidth;
                      return (
                        <div
                          key={tick.toISOString()}
                          className="absolute top-0 h-full border-l border-border/70 px-1 pt-2"
                          style={{ left }}
                        >
                          <div className="whitespace-nowrap text-[11px] font-medium text-foreground">
                            {format(tick, zoom === "quarter" ? "dd MMM" : "dd")}
                          </div>
                          <div className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {format(tick, zoom === "week" ? "EEE" : "MMM")}
                          </div>
                        </div>
                      );
                    })}
                    {todayVisible && (
                      <div
                        className="absolute bottom-0 top-0 z-10 border-l-2 border-red-500"
                        style={{ left: todayLeftPx }}
                      >
                        <span className="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Today
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {filteredTasks.map((task) => {
                  const bounds = getTaskBounds(task);
                  const start = bounds?.start ?? timeline.visibleStart;
                  const end = bounds?.end ?? endOfDay(start);
                  const due = bounds?.due ?? null;
                  const normalizedStart = isBefore(start, timeline.visibleStart)
                    ? timeline.visibleStart
                    : start;
                  const normalizedEnd = isAfter(end, timeline.visibleEnd)
                    ? timeline.visibleEnd
                    : end;
                  const rawLeft = daysBetween(normalizedStart, timeline.visibleStart) * dayWidth;
                  const left = Math.max(0, Math.min(timelineWidth - 12, rawLeft));
                  const barWidth = Math.max(
                    12,
                    Math.max(1, daysBetween(normalizedEnd, normalizedStart) + 1) * dayWidth,
                  );
                  const width = Math.max(12, Math.min(barWidth, timelineWidth - left));
                  const department = task.department?.trim() || "Unassigned";
                  const overdue =
                    due &&
                    isBefore(startOfDay(due), timeline.today) &&
                    task.status !== "Done";

                  return (
                    <div
                      key={task.id}
                      className="grid min-h-16 border-b last:border-b-0"
                      style={{ gridTemplateColumns: `200px ${timelineWidth}px` }}
                    >
                      <div className="flex min-w-0 items-center border-r px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{task.title}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                departmentClassMap.get(department)?.split(" ")[0] ?? "bg-slate-500",
                              )}
                            />
                            <span className="truncate text-xs text-muted-foreground">
                              {department}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative min-h-16 bg-background" style={{ width: timelineWidth }}>
                        {timeline.ticks.map((tick) => (
                          <div
                            key={tick.toISOString()}
                            className="absolute bottom-0 top-0 border-l border-border/40"
                            style={{
                              left: daysBetween(tick, timeline.visibleStart) * dayWidth,
                            }}
                          />
                        ))}
                        {todayVisible && (
                          <div
                            className="absolute bottom-0 top-0 z-10 border-l-2 border-red-500/80"
                            style={{ left: todayLeftPx }}
                          />
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-1/2 z-20 h-7 -translate-y-1/2 cursor-default rounded-md border shadow-sm",
                                overdue
                                  ? "border-red-400 bg-red-200"
                                  : departmentClassMap.get(department) ?? "bg-slate-500 border-slate-600",
                              )}
                              style={{
                                left,
                                width,
                                backgroundImage: overdue
                                  ? "repeating-linear-gradient(45deg, rgba(239,68,68,0.35) 0, rgba(239,68,68,0.35) 6px, rgba(254,202,202,0.95) 6px, rgba(254,202,202,0.95) 12px)"
                                  : undefined,
                              }}
                            >
                              <div className="flex h-full items-center truncate px-2 text-xs font-medium text-white">
                                {task.title}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground shadow-lg">
                            <div className="space-y-2">
                              <div className="font-semibold">{task.title}</div>
                              <div className="grid grid-cols-[76px_1fr] gap-x-2 gap-y-1 text-[11px]">
                                <span className="text-muted-foreground">Assignee</span>
                                <span>{task.assignee_name}</span>
                                <span className="text-muted-foreground">Created</span>
                                <span>{formatDateTime(task.created_at)}</span>
                                <span className="text-muted-foreground">Due</span>
                                <span>{formatDateTime(task.due_date)}</span>
                                <span className="text-muted-foreground">Status</span>
                                <span>{task.status ?? "Unknown"}</span>
                                <span className="text-muted-foreground">Priority</span>
                                <span>{task.priority ?? "None"}</span>
                              </div>
                              {overdue && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
