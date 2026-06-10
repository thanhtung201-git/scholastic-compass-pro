import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { notifyTaskAssigned } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { matchesTaskSearch, sortTasksByPriorityAndDueDate } from "@/lib/task-list-utils";
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
import { CalendarIcon, Plus, AlertCircle, Clock, CheckCircle2, Circle, List, LayoutGrid, GripHorizontal, Eye, Search, Pencil } from "lucide-react";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

type Department = { id: string; department_name: string };
type UserOption = { id: string; name: string };
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

const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Review", "Done"];

/** A user can assign tasks if their role level is not null and < some max assignable level.
 *  Any role with level < 3 (or whatever the deepest level is) can assign to roles one level below. */
function canAssignOthers(userLevel: number | null): boolean {
  return userLevel !== null && userLevel >= 1;
}

/** Build task query based on role level and department */
function buildTaskQuery(
  supabaseClient: any,
  userId: string,
  userLevel: number | null,
  userDeptName: string | null,
) {
  const base = supabaseClient.from("tasks").select(`
    id, title, description, department, assigned_to, assigned_by,
    priority, status, due_date, created_at,
    users!tasks_assigned_to_fkey(name)
  `).order("created_at", { ascending: false });

  // Level 1 (e.g. Director) sees everything
  if (userLevel === 1) return base;
  // Level 2 managers see tasks in their department
  if (userLevel === 2 && userDeptName) return base.eq("department", userDeptName);
  // Everyone else (level 3+) only sees their own tasks
  return base.eq("assigned_to", userId);
}

/** Fetch users in a department whose role level is exactly targetLevel */
async function fetchUsersForDepartmentAtLevel(
  departmentName: string,
  targetLevel: number,
): Promise<UserOption[]> {
  const { data: rolesData, error: rolesError } = await supabase
    .from("roles")
    .select("role_name")
    .eq("department_name", departmentName)
    .eq("level", targetLevel);

  if (rolesError || !rolesData?.length) return [];

  const roleList = rolesData.map((r: any) => r.role_name);
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name")
    .in("role", roleList);
  return (usersData as UserOption[]) ?? [];
}

/** Legacy helper used by the edit dialog (fetches all users in a dept) */
async function fetchUsersForDepartment(departmentName: string) {
  const { data: rolesData, error: rolesError } = await supabase
    .from("roles")
    .select("role_name")
    .eq("department_name", departmentName);

  if (rolesError || !rolesData?.length) return [] as UserOption[];

  const roleList = rolesData.map((role: any) => role.role_name);
  const { data: usersData } = await supabase.from("users").select("id, name").in("role", roleList);
  return (usersData as UserOption[]) ?? [];
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
    "Todo": { cls: "bg-gray-100 text-gray-600 border-gray-200", icon: <Circle className="size-3" /> },
    "In Progress": { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock className="size-3" /> },
    "Review": { cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <AlertCircle className="size-3" /> },
    "Done": { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="size-3" /> },
  };
  const s = map[status] ?? map["Todo"];
  return <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${s.cls}`}>{s.icon} {status}</span>;
}

function TaskAssignmentPage() {
  const { user } = useAuth();
  const userRole: string = (user as any)?.role ?? "";

  // Dynamic role-level state (fetched from DB)
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [userDeptName, setUserDeptName] = useState<string | null>(null);
  const [levelLoading, setLevelLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editUsers, setEditUsers] = useState<UserOption[]>([]);
  const [editCalendarOpen, setEditCalendarOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    assigned_to: "",
    priority: "Medium" as Task["priority"],
    due_date: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalTaskId, setModalTaskId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    assigned_to: "",
    priority: "Medium",
    due_date: "",
    estimated_hours: 0,
  });

  const [sprints, setSprints] = useState<any[]>([]);

  // Fetch the current user's role level and department from the DB
  useEffect(() => {
    if (!userRole) return;
    setLevelLoading(true);
    supabase
      .from("roles")
      .select("level, department_name")
      .eq("role_name", userRole)
      .maybeSingle()
      .then(({ data }) => {
        setUserLevel(data?.level ?? null);
        setUserDeptName(data?.department_name ?? null);
        setLevelLoading(false);
      });
  }, [userRole]);

  useEffect(() => {
    supabase.from("department").select("id, department_name").then(({ data, error }) => {
      if (!error && data) setDepartments(data as Department[]);
    });
    
    // Fetch active sprints
    supabase.from("sprints")
      .select("id, name, status")
      .in("status", ["Planning", "Active"])
      .order("start_date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setSprints(data);
      });
  }, []);

  const fetchTasks = async () => {
    if (!user?.id) return;
    const { data, error } = await buildTaskQuery(supabase, user.id, userLevel, userDeptName);
    if (!error && data) {
      const shaped = (data as any[]).map((t) => ({
        ...t,
        assignee_name: t.users?.name ?? "—",
      }));
      setTasks(shaped);
    }
  };

  useEffect(() => {
    if (!levelLoading) fetchTasks();
  }, [user, userLevel, userDeptName, levelLoading]);

  // When a department is selected, only load users with level = userLevel + 1
  useEffect(() => {
    if (!selectedDept) { setUsers([]); return; }
    const deptObj = departments.find((d) => d.id === selectedDept);
    if (!deptObj) return;

    setForm((prev) => ({ ...prev, department: selectedDept, assigned_to: "" }));

    if (userLevel !== null) {
      const targetLevel = userLevel + 1;
      fetchUsersForDepartmentAtLevel(deptObj.department_name, targetLevel).then(setUsers);
    } else {
      setUsers([]);
    }
  }, [selectedDept, departments, userLevel]);

  useEffect(() => {
    if (user?.id) setForm((prev) => ({ ...prev, assigned_to: user.id }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.title.trim()) { setSubmitError("Title is required."); return; }
    if (!form.department) { setSubmitError("Please select a department."); return; }
    if (!form.assigned_to) { setSubmitError("Please select a user to assign this task to."); return; }

    const formattedDueDate = form.due_date && isValid(parseISO(form.due_date)) ? format(parseISO(form.due_date), "yyyy-MM-dd") : null;
    const deptObj = departments.find((d) => d.id === form.department);
    const departmentName = deptObj ? deptObj.department_name : null;

    // Ép cứng sprint_id thành null để task luôn nằm trong Backlog của Sprint Planning
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      department: departmentName,
      assigned_to: form.assigned_to,
      assigned_by: user?.id ?? null,
      priority: form.priority,
      status: "Todo",
      due_date: formattedDueDate,
      sprint_id: null, 
      estimated_hours: form.estimated_hours > 0 ? form.estimated_hours : null,
    };

    setIsSubmitting(true);
    const { data, error } = await supabase.from("tasks").insert([payload]).select().single();
    setIsSubmitting(false);

    if (!error) {
      if (data) {
        await notifyTaskAssigned({
          assigneeUserId: form.assigned_to,
          actorUserId: user?.id,
          actorName: user?.name ?? "Someone",
          taskId: data.id,
          taskTitle: data.title,
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

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
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.assigned_to === userId) return;

    await supabase.from("tasks").update({ assigned_to: userId }).eq("id", taskId);
    await notifyTaskAssigned({
      assigneeUserId: userId,
      actorUserId: user?.id,
      actorName: user?.name ?? "Someone",
      taskId,
      taskTitle: task.title,
      isReassignment: true,
    });
    await fetchTasks();
  };

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const statusOk = filterStatus === "All" || task.status === filterStatus;
      const deptOk = filterDept === "All" || task.department === filterDept;
      return statusOk && deptOk && matchesTaskSearch(task, searchQuery);
    });
    return sortTasksByPriorityAndDueDate(filtered);
  }, [tasks, filterStatus, filterDept, searchQuery]);

  // Departments the current user can assign tasks to:
  // - Level 1 (Director): all departments
  // - Level 2 (Manager): only their own department
  // - Others: none
  const allowedDepts = useMemo(() => {
    if (userLevel === 1) return departments;
    if (userLevel === 2 && userDeptName) {
      return departments.filter((d) => d.department_name === userDeptName);
    }
    return [];
  }, [departments, userLevel, userDeptName]);

  const uniqueDeptNames = [...new Set(tasks.map((t) => t.department).filter(Boolean))];
  const canEditTask = (task: Task) => Boolean(user?.id && task.assigned_by === user.id);
  const showActionsColumn =
    canAssignOthers(userLevel) || tasks.some((task) => canEditTask(task));

  const openEditDialog = async (task: Task) => {
    setEditingTask(task);
    setEditError(null);
    setEditForm({
      title: task.title,
      assigned_to: task.assigned_to,
      priority: task.priority,
      due_date:
        task.due_date && isValid(parseISO(task.due_date))
          ? format(parseISO(task.due_date), "yyyy-MM-dd")
          : "",
    });
    const departmentUsers = await fetchUsersForDepartment(task.department);
    setEditUsers(departmentUsers);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTask || !user?.id) return;

    if (!editForm.title.trim()) {
      setEditError("Title is required.");
      return;
    }
    if (!editForm.assigned_to) {
      setEditError("Please select an assignee.");
      return;
    }

    const formattedDueDate =
      editForm.due_date && isValid(parseISO(editForm.due_date))
        ? format(parseISO(editForm.due_date), "yyyy-MM-dd")
        : null;

    setEditSaving(true);
    setEditError(null);

    const { error } = await supabase
      .from("tasks")
      .update({
        title: editForm.title.trim(),
        assigned_to: editForm.assigned_to,
        priority: editForm.priority,
        due_date: formattedDueDate,
      })
      .eq("id", editingTask.id);

    if (error) {
      setEditError(error.message);
      setEditSaving(false);
      return;
    }

    if (editForm.assigned_to !== editingTask.assigned_to) {
      await notifyTaskAssigned({
        assigneeUserId: editForm.assigned_to,
        actorUserId: user.id,
        actorName: user.name ?? "Someone",
        taskId: editingTask.id,
        taskTitle: editForm.title.trim(),
        isReassignment: true,
      });
    }

    setEditSaving(false);
    setEditingTask(null);
    await fetchTasks();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage tasks and track progress</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${
                viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-4" /> Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${
                viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" /> Kanban
            </button>
          </div>

          {/* New Task */}
          {canAssignOthers(userLevel) && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitError(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="size-4 mr-2" /> New Task</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input name="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea name="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedDepts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assign To</label>
                    <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))} disabled={!selectedDept}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedDept ? "Select user" : "Select department first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
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
                          <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Open calendar">
                            <CalendarIcon className="size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end" side="bottom">
                          <Calendar
                            mode="single"
                            selected={
                              form.due_date && isValid(parse(form.due_date, "yyyy-MM-dd", new Date()))
                                ? parse(form.due_date, "yyyy-MM-dd", new Date())
                                : undefined
                            }
                            onSelect={(date) => {
                              setForm((p) => ({ ...p, due_date: date ? format(date, "yyyy-MM-dd") : "" }));
                              setCalendarOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {submitError && (
                      <p className="text-sm text-red-600 flex-1 flex items-center gap-1">
                        <AlertCircle className="size-4 shrink-0" />
                        {submitError}
                      </p>
                    )}
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); setSubmitError(null); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating…" : "Create Task"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks by title, assignee, department, priority..."
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
        <div className="flex rounded-md border overflow-hidden text-sm">
          {["All", "Todo", "In Progress", "Review", "Done"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 border-r last:border-r-0 transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {userLevel === 1 && uniqueDeptNames.length > 0 && (
          <div className="flex rounded-md border overflow-hidden text-sm">
            {["All", ...uniqueDeptNames].map((d) => (
              <button
                key={d}
                onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 border-r last:border-r-0 transition-colors ${
                  filterDept === d
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm border rounded-lg">
            No tasks found.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  {userLevel === 1 && (
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assignee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  {showActionsColumn && (
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, i) => (
                  <tr key={task.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</div>
                      )}
                    </td>
                    {userLevel === 1 && (
                      <td className="px-4 py-3 text-muted-foreground">{task.department}</td>
                    )}
                    <td className="px-4 py-3">{task.assignee_name}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">
                          {task.due_date ? format(parseISO(task.due_date), "dd MMM yyyy") : "—"}
                        </span>
                        <DueBadge due_date={task.due_date} status={task.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    {showActionsColumn && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canEditTask(task) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => openEditDialog(task)}
                            >
                              <Pencil className="mr-1 size-3" />
                              Edit
                            </Button>
                          )}
                          {canAssignOthers(userLevel) && task.status !== "Done" && (
                            <Select value={task.status} onValueChange={(v) => updateStatus(task.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Todo">Todo</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Review">Review</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
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
                  <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="flex-shrink-0 w-80 bg-muted rounded-lg p-4 min-h-[400px] flex flex-col">
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
                                <div className="flex items-center gap-2">
                                  <select className="text-xs bg-transparent border rounded px-2 py-1" value={task.assigned_to ?? ""} onChange={(e) => handleAssign(task.id, e.target.value)}>
                                    <option value="">Unassigned</option>
                                    {users.map((u) => (
                                      <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  {canEditTask(task) && (
                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                                      <Pencil className="size-3" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => setModalTaskId(task.id)}>
                                    <Eye className="size-3" />
                                  </Button>
                                </div>
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

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Assignee</label>
              <Select
                value={editForm.assigned_to}
                onValueChange={(value) => setEditForm((current) => ({ ...current, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {editUsers.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <Select
                value={editForm.priority}
                onValueChange={(value) =>
                  setEditForm((current) => ({ ...current, priority: value as Task["priority"] }))
                }
              >
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
              <label className="mb-1 block text-sm font-medium">Due Date</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="YYYY-MM-DD"
                  value={editForm.due_date}
                  onChange={(event) => setEditForm((current) => ({ ...current, due_date: event.target.value }))}
                  className="flex-1"
                />
                <Popover open={editCalendarOpen} onOpenChange={setEditCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Open calendar">
                      <CalendarIcon className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end" side="bottom">
                    <Calendar
                      mode="single"
                      selected={
                        editForm.due_date && isValid(parse(editForm.due_date, "yyyy-MM-dd", new Date()))
                          ? parse(editForm.due_date, "yyyy-MM-dd", new Date())
                          : undefined
                      }
                      onSelect={(date) => {
                        setEditForm((current) => ({
                          ...current,
                          due_date: date ? format(date, "yyyy-MM-dd") : "",
                        }));
                        setEditCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editError && (
                <p className="flex flex-1 items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-4 shrink-0" />
                  {editError}
                </p>
              )}
              <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {modalTaskId && (
        <TaskDetailModal taskId={modalTaskId} open={true} onOpenChange={(open) => { if (!open) setModalTaskId(null); }} userId={user?.id ?? ""} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/task-assignment")({
  component: TaskAssignmentPage,
});