import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Shield, Activity, AlertTriangle, UserCheck, UserX,
  Loader2, CheckSquare, Clock, CheckCircle2, Circle, TrendingUp,
  Plus, FileText, GraduationCap, Building2, Banknote, Timer,
} from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatVND } from "@/lib/mock-data";

export default function AdminDashboard() {
  const {
    users, auditLogs, attendanceLogs, tuitionInvoices,
    teachers, branches, classes, students, expenses, loading,
  } = useDatabase();

  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tasks")
      .select("id, title, status, priority, department, created_at, assigned_to, users!tasks_assigned_to_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTasks(data ?? []);
        setTasksLoading(false);
      });
  }, []);

  if (loading || tasksLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Finance stats ──────────────────────────────────────────────────────────
  const totalRevenue   = tuitionInvoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
  const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const unpaidInv      = tuitionInvoices.filter((i) => i.status === "Unpaid").length;
  const teacherWages   = attendanceLogs
    .filter((l) => l.status === "Approved")
    .reduce((s, l) => s + Number(l.total_pay ?? 0), 0);

  // ── User stats ─────────────────────────────────────────────────────────────
  const activeUsers  = users.filter((u) => u.status === "Active").length;
  const blockedUsers = users.filter((u) => u.status === "Blocked").length;
  const pendingAtt   = attendanceLogs.filter((l) => l.status === "Draft").length;

  // ── Task stats ─────────────────────────────────────────────────────────────
  const taskTodo       = tasks.filter((t) => t.status === "Todo").length;
  const taskInProgress = tasks.filter((t) => t.status === "In Progress").length;
  const taskReview     = tasks.filter((t) => t.status === "Review").length;
  const taskDone       = tasks.filter((t) => t.status === "Done").length;

  // Task by department
  const deptMap: Record<string, { todo: number; inprog: number; done: number }> = {};
  tasks.forEach((t) => {
    const d = t.department || "Unknown";
    if (!deptMap[d]) deptMap[d] = { todo: 0, inprog: 0, done: 0 };
    if (t.status === "Todo") deptMap[d].todo++;
    else if (t.status === "In Progress" || t.status === "Review") deptMap[d].inprog++;
    else if (t.status === "Done") deptMap[d].done++;
  });

  // Role distribution
  const roleMap: Record<string, number> = {};
  users.forEach((u) => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });
  const topRoles = Object.entries(roleMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const PRIORITY_COLOR: Record<string, string> = {
    Critical: "bg-red-500", High: "bg-orange-500",
    Medium: "bg-amber-400", Low: "bg-green-500",
  };

  // Revenue by month from tuition invoices
  const monthRevMap: Record<string, number> = {};
  tuitionInvoices.forEach((inv) => {
    if (!inv.issued_at) return;
    const m = inv.issued_at.slice(0, 7); // "YYYY-MM"
    monthRevMap[m] = (monthRevMap[m] || 0) + Number(inv.amount_paid ?? 0);
  });
  const revenueMonths = Object.entries(monthRevMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
  const maxRev = Math.max(...revenueMonths.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview"
        description="Real-time metrics across the entire system."
        actions={
          <Button asChild>
            <Link to="/users"><Plus className="size-4 mr-1" /> Invite User</Link>
          </Button>
        }
      />

      {/* ── KPI Row 1: Finance ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Finance</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"   value={formatVND(totalRevenue)}  hint="all time collected"     icon={TrendingUp}  tone="success" />
          <StatCard label="Total Expenses"  value={formatVND(totalExpenses)} hint="all recorded expenses"  icon={Banknote}    tone="warning" />
          <StatCard label="Teacher Payout"  value={formatVND(teacherWages)}  hint="approved attendance"    icon={GraduationCap} tone="info" />
          <StatCard label="Unpaid Invoices" value={unpaidInv}                hint="need follow-up"         icon={AlertTriangle} tone="destructive" />
        </div>
      </div>

      {/* ── KPI Row 2: People & Ops ────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">People & Operations</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Users"    value={activeUsers}    hint={`of ${users.length} total`}  icon={UserCheck}   tone="success" />
          <StatCard label="Blocked Accounts" value={blockedUsers}  hint="review pending"              icon={UserX}       tone="destructive" />
          <StatCard label="Students"         value={students.length} hint="enrolled"                  icon={Users}       tone="info" />
          <StatCard label="Branches"         value={branches.length} hint="active locations"          icon={Building2} />
        </div>
      </div>

      {/* ── Task status pills ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project Tasks</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Todo",        count: taskTodo,       icon: Circle,        cls: "text-muted-foreground", bg: "bg-muted/40" },
            { label: "In Progress", count: taskInProgress, icon: Clock,         cls: "text-blue-600",         bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Review",      count: taskReview,     icon: AlertTriangle, cls: "text-purple-600",       bg: "bg-purple-50 dark:bg-purple-950/30" },
            { label: "Done",        count: taskDone,       icon: CheckCircle2,  cls: "text-green-600",        bg: "bg-green-50 dark:bg-green-950/30" },
          ].map(({ label, count, icon: Icon, cls, bg }) => (
            <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${bg}`}>
              <Icon className={`size-5 ${cls}`} />
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue chart + Audit log ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue bar chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months (VND collected)</p>
            </div>
          </div>
          {revenueMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revenue data yet.</p>
          ) : (
            <div className="flex items-end justify-between gap-3 h-48 px-2">
              {revenueMonths.map(([month, rev]) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-40 relative group">
                    <div
                      className="w-full rounded-t-md transition-all bg-primary/80 hover:bg-primary cursor-pointer"
                      style={{ height: `${(rev / maxRev) * 100}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {formatVND(rev)}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{month.slice(5)}/{month.slice(2, 4)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Audit log */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Audit Log</h3>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Activity className="size-3" /> Live
            </Badge>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs yet.</p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-4 flex-1">
              {auditLogs.slice(0, 5).map((log) => (
                <li key={log.id} className="ml-5">
                  <span className="absolute -left-[7px] flex size-3.5 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                  <div className="font-medium text-xs">{log.actor ?? log.actor_name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{log.action}</div>
                  <time className="text-[10px] text-muted-foreground">{log.time}</time>
                </li>
              ))}
            </ol>
          )}
          <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
            <Link to="/audit"><FileText className="size-4 mr-1" /> View all</Link>
          </Button>
        </Card>
      </div>

      {/* ── Class health + Users by role ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Class health by branch */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Class Health by Branch</h3>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches found.</p>
          ) : (
            <div className="space-y-3">
              {branches.map((b) => {
                const bc = classes.filter((c) => c.branch_id === b.id);
                const active = bc.filter((c) => c.status === "Active").length;
                const ended  = bc.filter((c) => c.status === "Ended").length;
                return (
                  <div key={b.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{b.name?.replace("MCNAEdu — ", "")}</span>
                      <Badge variant="secondary">{bc.length} classes</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded bg-green-50 dark:bg-green-950/30 p-1.5">
                        <div className="font-semibold text-green-600">{active}</div>
                        <div className="text-muted-foreground">Active</div>
                      </div>
                      <div className="rounded bg-muted p-1.5">
                        <div className="font-semibold">{ended}</div>
                        <div className="text-muted-foreground">Ended</div>
                      </div>
                      <div className="rounded bg-blue-50 dark:bg-blue-950/30 p-1.5">
                        <div className="font-semibold text-blue-600">{bc.length - active - ended}</div>
                        <div className="text-muted-foreground">Other</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Users by role + system alerts */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="size-4" /> Users by Role
            </h3>
            <div className="space-y-2">
              {topRoles.map(([role, count]) => (
                <div key={role} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-32 truncate">{role}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / users.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">System Alerts</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>{pendingAtt} attendance logs pending approval</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>{unpaidInv} unpaid invoices</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                <span>Database connection healthy</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Tasks by department ───────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Tasks by Department</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/task-assignment">View all tasks</Link>
          </Button>
        </div>
        {Object.keys(deptMap).length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(deptMap).map(([dept, counts]) => {
              const total = counts.todo + counts.inprog + counts.done;
              const pct = total > 0 ? Math.round((counts.done / total) * 100) : 0;
              return (
                <div key={dept} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{dept}</span>
                    <Badge variant="secondary">{total}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs">
                    <div className="rounded bg-muted/60 p-1.5"><div className="font-semibold">{counts.todo}</div><div className="text-muted-foreground">Todo</div></div>
                    <div className="rounded bg-blue-50 dark:bg-blue-950/30 p-1.5"><div className="font-semibold text-blue-600">{counts.inprog}</div><div className="text-muted-foreground">Active</div></div>
                    <div className="rounded bg-green-50 dark:bg-green-950/30 p-1.5"><div className="font-semibold text-green-600">{counts.done}</div><div className="text-muted-foreground">Done</div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Recent tasks ─────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Tasks</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/task-assignment">View all</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 8).map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5 hover:bg-muted/30 transition">
              <div className={`size-2 rounded-full shrink-0 ${PRIORITY_COLOR[task.priority] ?? "bg-gray-400"}`} />
              <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
              <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{task.department}</span>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${
                task.status === "Done"        ? "border-green-400 text-green-600"   :
                task.status === "In Progress" ? "border-blue-400 text-blue-600"    :
                task.status === "Review"      ? "border-purple-400 text-purple-600" : ""
              }`}>
                {task.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Teacher wages ────────────────────────────────────────────────── */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Teacher Wages</h3>
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teacher data.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teachers.map((t) => {
              const logs  = attendanceLogs.filter((l) => l.teacher_id === t.id && l.status === "Approved");
              const hours = logs.reduce((s, l) => s + Number(l.hours ?? 0), 0) || 0;
              const wage  = logs.reduce((s, l) => s + Number(l.total_pay ?? 0), 0) || Number(t.hourly_rate ?? 0) * 32;
              return (
                <div key={t.id} className="rounded-lg border p-4 hover:shadow-sm transition">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.subject}</div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-lg font-semibold">{formatVND(wage)}</div>
                    <span className="text-xs text-muted-foreground">{hours}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}