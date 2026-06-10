import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, isPast, parseISO, parse, isValid } from "date-fns";
import { CalendarIcon, Plus, AlertCircle, Clock, CheckCircle2, Circle, List, LayoutGrid, GripHorizontal, Eye } from "lucide-react";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";
type Department = { id: string; department_name: string };
type UserOption = { id: string; name: string; email?: string };
type Task = {
  id: string;
  title: string;
  description: string;
  department: string;
  assigned_to: string;
  assigned_by: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: TaskStatus;
  due_date: string;
  created_at: string;
  users?: { name?: string };
  assignee_name?: string;
};

const CAN_ASSIGN_ROLES = ["Director", "Finance Manager", "Academic Manager", "Admin", "HR Manager", "Marketing Manager"];
const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  "Finance Manager": "Finance",
  "Academic Manager": "Academic",
  "Admin": "IT",
  "HR Manager": "Human Resource",
  "Marketing Manager": "Marketing",
};
const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Review", "Done"];

function canAssignOthers(role: string) { return CAN_ASSIGN_ROLES.includes(role); }

function buildTaskQuery(supabaseClient: any, userId: string, userRole: string) {
  const base = supabaseClient.from("tasks").select(`
    id, title, description, department, assigned_to, assigned_by,
    priority, status, due_date, created_at,
    users!tasks_assigned_to_fkey(name)
  `).order("created_at", { ascending: false });
  if (userRole === "Director") return base;
  const deptName = ROLE_DEPARTMENT_MAP[userRole];
  if (deptName) return base.eq("department", deptName);
  return base.eq("assigned_to", userId);
}

function getAllowedDeptIds(departments: Department[], userRole: string): Department[] {
  if (userRole === "Director") return departments;
  const allowed = ROLE_DEPARTMENT_MAP[userRole];
  if (allowed) return departments.filter((d) => d.department_name === allowed);
  return [];
}

function DueBadge({ due_date, status }: { due_date: string; status: string }) {
  if (!due_date || status === "Done") return null;
  const date = parseISO(due_date);
  const diff = differenceInDays(date, new Date());
  if (isPast(date)) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><AlertCircle className="size-3" /> Overdue</span>;
  if (diff <= 2) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><Clock className="size-3" /> Due soon</span>;
  return null;
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-green-50 text-green-700 border-green-200",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${PRIORITY_STYLES[priority] ?? ""}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    "Todo":        { cls: "bg-gray-100 text-gray-600 border-gray-200",   icon: <Circle className="size-3" /> },
    "In Progress": { cls: "bg-blue-50 text-blue-700 border-blue-200",    icon: <Clock className="size-3" /> },
    "Review":      { cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <AlertCircle className="size-3" /> },
    "Done":        { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="size-3" /> },
  };
  const s = map[status] ?? map["Todo"];
  return <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${s.cls}`}>{s.icon} {status}</span>;
}

// ── Gửi email thông báo task mới ──────────────────────────────────────────────
async function sendTaskNotification(params: {
  to_email:         string;
  assignee_name:    string;
  assigned_by:      string;
  task_title:       string;
  task_description?: string;
  department:       string;
  priority:         string;
  due_date?:        string;
}) {
  try {
    await supabase.functions.invoke("send-task-notification", { body: params });
  } catch (err) {
    console.error("sendTaskNotification error:", err);
  }
}

function TaskAssignmentPage() {
  const { user } = useAuth();
  const userRole: string = (user as any)?.role ?? "";

  const [open, setOpen]                 = useState(false);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [users, setUsers]               = useState<UserOption[]>([]);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept]     = useState("All");
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode]         = useState<"table" | "kanban">("table");
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [modalTaskId, setModalTaskId]   = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", department: "", assigned_to: "",
    priority: "Medium", due_date: "", estimated_hours: 0,
  });

  useEffect(() => {
    supabase.from("department").select("id, department_name").then(({ data, error }) => {
      if (!error && data) setDepartments(data as Department[]);
    });
  }, []);

  const fetchTasks = async () => {
    if (!user?.id) return;
    const { data, error } = await buildTaskQuery(supabase, user.id, userRole);
    if (!error && data) {
      setTasks((data as any[]).map((t) => ({ ...t, assignee_name: t.users?.name ?? "—" })));
    }
  };

  useEffect(() => { fetchTasks(); }, [user, userRole]);

  useEffect(() => {
    if (!selectedDept) { setUsers([]); return; }
    const deptObj = departments.find((d) => d.id === selectedDept);
    if (!deptObj) return;
    supabase.from("roles").select("role_name").eq("department_name", deptObj.department_name)
      .then(async ({ data: rolesData, error: rolesError }) => {
        if (rolesError || !rolesData?.length) { setUsers([]); return; }
        const roleList = rolesData.map((r: any) => r.role_name);
        // Lấy thêm email để gửi thông báo
        const { data: usersData } = await supabase
          .from("users").select("id, name, email").in("role", roleList);
        setUsers((usersData as UserOption[]) ?? []);
      });
    setForm((prev) => ({ ...prev, department: selectedDept, assigned_to: "" }));
  }, [selectedDept, departments]);

  useEffect(() => {
    if (user?.id) setForm((prev) => ({ ...prev, assigned_to: user.id }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.title.trim())    { setSubmitError("Title is required."); return; }
    if (!form.department)      { setSubmitError("Please select a department."); return; }
    if (!form.assigned_to)     { setSubmitError("Please select a user to assign this task to."); return; }

    const formattedDueDate = form.due_date && isValid(parseISO(form.due_date))
      ? format(parseISO(form.due_date), "yyyy-MM-dd") : null;
    const deptObj = departments.find((d) => d.id === form.department);
    const departmentName = deptObj ? deptObj.department_name : null;

    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim() || null,
      department:      departmentName,
      assigned_to:     form.assigned_to,
      assigned_by:     user?.id ?? null,
      priority:        form.priority,
      status:          "Todo",
      due_date:        formattedDueDate,
      sprint_id:       null,
      estimated_hours: form.estimated_hours > 0 ? form.estimated_hours : null,
    };

    setIsSubmitting(true);
    const { error } = await supabase.from("tasks").insert([payload]).select().single();
    setIsSubmitting(false);

    if (!error) {
      // Gửi email thông báo cho người được assign
      const assignedUser = users.find((u) => u.id === form.assigned_to);
      if (assignedUser?.email && assignedUser.id !== user?.id) {
        sendTaskNotification({
          to_email:         assignedUser.email,
          assignee_name:    assignedUser.name,
          assigned_by:      user?.name ?? "Manager",
          task_title:       form.title.trim(),
          task_description: form.description.trim() || undefined,
          department:       departmentName ?? "",
          priority:         form.priority,
          due_date:         formattedDueDate ?? undefined,
        });
      }

      setForm({ title: "", description: "", department: "", assigned_to: user?.id ?? "", priority: "Medium", due_date: "", estimated_hours: 0 });
      setSelectedDept("");
      setCalendarOpen(false);
      setSubmitError(null);
      setOpen(false);
      fetchTasks();
    } else {
      setSubmitError(error.message ?? "Something went wrong. Please try again.");
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", taskId);
    fetchTasks();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggingId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggingId || isUpdating) return;
    const t = tasks.find((t) => t.id === draggingId);
    if (!t || t.status === newStatus) { setDraggingId(null); return; }
    setIsUpdating(true);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", draggingId);
    await fetchTasks();
    setIsUpdating(false);
    setDraggingId(null);
  };

  const handleAssign = async (taskId: string, userId: string) => {
    await supabase.from("tasks").update({ assigned_to: userId }).eq("id", taskId);
    await fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    const statusOk = filterStatus === "All" || t.status === filterStatus;
    const deptOk   = filterDept === "All"   || t.department === filterDept;
    return statusOk && deptOk;
  });

  const allowedDepts   = getAllowedDeptIds(departments, userRole);
  const uniqueDeptNames = [...new Set(tasks.map((t) => t.department).filter(Boolean))];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage tasks and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50">
            <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="size-4" /> Table
            </button>
            <button onClick={() => setViewMode("kanban")} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="size-4" /> Kanban
            </button>
          </div>

          {canAssignOthers(userRole) && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitError(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="size-4 mr-2" /> New Task</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {allowedDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign To</label>
                    <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))} disabled={!selectedDept}>
                      <SelectTrigger><SelectValue placeholder={selectedDept ? "Select user" : "Select department first"} /></SelectTrigger>
                      <SelectContent>
                        {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <div className="flex gap-2 items-center">
                      <Input placeholder="YYYY-MM-DD" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="flex-1" />
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="icon" className="shrink-0"><CalendarIcon className="size-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end" side="bottom">
                          <Calendar
                            mode="single"
                            selected={form.due_date && isValid(parse(form.due_date, "yyyy-MM-dd", new Date())) ? parse(form.due_date, "yyyy-MM-dd", new Date()) : undefined}
                            onSelect={(date) => { setForm((p) => ({ ...p, due_date: date ? format(date, "yyyy-MM-dd") : "" })); setCalendarOpen(false); }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {submitError && (
                      <p className="text-sm text-red-600 flex-1 flex items-center gap-1">
                        <AlertCircle className="size-4 shrink-0" />{submitError}
                      </p>
                    )}
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); setSubmitError(null); }}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Task"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex rounded-md border overflow-hidden text-sm">
          {["All", "Todo", "In Progress", "Review", "Done"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 border-r last:border-r-0 transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        {userRole === "Director" && uniqueDeptNames.length > 0 && (
          <div className="flex rounded-md border overflow-hidden text-sm">
            {["All", ...uniqueDeptNames].map((d) => (
              <button key={d} onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 border-r last:border-r-0 transition-colors ${filterDept === d ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}>
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm border rounded-lg">No tasks found.</div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  {userRole === "Director" && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>}
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assignee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  {canAssignOthers(userRole) && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, i) => (
                  <tr key={task.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      {task.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</div>}
                    </td>
                    {userRole === "Director" && <td className="px-4 py-3 text-muted-foreground">{task.department}</td>}
                    <td className="px-4 py-3">{task.assignee_name}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">{task.due_date ? format(parseISO(task.due_date), "dd MMM yyyy") : "—"}</span>
                        <DueBadge due_date={task.due_date} status={task.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    {canAssignOthers(userRole) && (
                      <td className="px-4 py-3">
                        {task.status !== "Done" && (
                          <Select value={task.status} onValueChange={(v) => updateStatus(task.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Todo">Todo</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Review">Review</SelectItem>
                              <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max p-4">
              {STATUSES.map((status) => {
                const statusTasks = filteredTasks.filter((t) => t.status === status);
                return (
                  <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}
                    className="flex-shrink-0 w-80 bg-muted rounded-lg p-4 min-h-[400px] flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{status}</h3>
                        <p className="text-xs text-muted-foreground">{statusTasks.length} task{statusTasks.length !== 1 ? "s" : ""}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{status}</Badge>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {statusTasks.map((task) => (
                        <Card key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="p-3 cursor-move hover:shadow-md transition-shadow">
                          <div className="flex gap-2">
                            <GripHorizontal className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{task.title}</p>
                              <p className="text-xs text-muted-foreground truncate mt-1">Assignee: {task.assignee_name || "-"}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <select className="text-xs bg-transparent border rounded px-2 py-1" value={task.assigned_to ?? ""} onChange={(e) => handleAssign(task.id, e.target.value)}>
                                  <option value="">Unassigned</option>
                                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => setModalTaskId(task.id)}>
                                  <Eye className="size-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modalTaskId && (
        <TaskDetailModal taskId={modalTaskId} open={true} onOpenChange={(open) => { if (!open) setModalTaskId(null); }} userId={user?.id ?? ""} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/task-assignment")({
  component: TaskAssignmentPage,
});