import { createFileRoute } from "@tanstack/react-router";
import { Kanban, GripHorizontal, Eye, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notifyTaskAssigned } from "@/lib/notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

export const Route = createFileRoute("/_app/kanban-board")({
  component: KanbanBoardPage,
});

type Task = {
  id: string;
  title: string;
  status: string;
  assigned_to?: string;
  users?: { name?: string };
  department?: string;
  priority?: string;
};

const STATUSES = ["Todo", "In Progress", "Review", "Done"];
const CAN_ASSIGN_ROLES = ["Director", "Finance Manager", "Academic Manager", "Admin", "HR Manager", "Marketing Manager"];
const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  "Finance Manager": "Finance",
  "Academic Manager": "Academic",
  "Admin": "IT",
  "HR Manager": "Human Resource",
  "Marketing Manager": "Marketing",
};

function canAssignOthers(role: string) {
  return CAN_ASSIGN_ROLES.includes(role);
}

function buildTaskQuery(supabaseClient: any, userId: string, userRole: string) {
  const base = supabaseClient.from("tasks").select(`
    id, title, description, department, assigned_to, assigned_by,
    priority, status, due_date, created_at,
    users!tasks_assigned_to_fkey(name)
  `);
  if (userRole === "Director") return base;
  const deptName = ROLE_DEPARTMENT_MAP[userRole];
  if (deptName) return base.eq("department", deptName);
  return base.eq("assigned_to", userId);
}

function KanbanBoardPage() {
  const { user } = useAuth();
  const userRole: string = (user as any)?.role ?? "";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalTaskId, setModalTaskId] = useState<string | null>(null);

  // Form state for new task
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", department: "", assigned_to: "", priority: "Medium", due_date: "" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    if (!user?.id) return;
    const { data } = await buildTaskQuery(supabase, user.id, userRole);
    setTasks((data as any) ?? []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("id, name");
    setUsers((data as any) ?? []);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from("department").select("id, department_name");
    setDepartments((data as any) ?? []);
  };

  useEffect(() => { fetchTasks(); fetchUsers(); fetchDepartments(); }, [user]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e && e.preventDefault();
    setSubmitError(null);
    if (!form.title.trim()) { setSubmitError("Title is required."); return; }
    if (!form.department) { setSubmitError("Please select a department."); return; }
    if (!form.assigned_to) { setSubmitError("Please select a user to assign this task to."); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      department: departments.find(d => d.id === form.department)?.department_name || null,
      assigned_to: form.assigned_to,
      assigned_by: user?.id ?? null,
      priority: form.priority,
      status: "Todo",
      due_date: form.due_date || null,
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
      setForm({ title: "", description: "", department: "", assigned_to: "", priority: "Medium", due_date: "" });
      setOpen(false);
      fetchTasks();
    } else {
      setSubmitError(error.message ?? "Something went wrong.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Kanban Board" description="Track tasks across project workflow stages." />

      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <Badge variant="outline">Project Management</Badge>
        </div>
        {canAssignOthers(userRole) && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); setSubmitError(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2" /> New Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Select value={form.department} onValueChange={(v) => setForm(p => ({ ...p, department: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <Select value={form.assigned_to} onValueChange={(v) => setForm(p => ({ ...p, assigned_to: v }))} disabled={!form.department}>
                    <SelectTrigger><SelectValue placeholder={form.department ? "Select user" : "Select department first"} /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max p-4">
            {STATUSES.map((status) => {
              const statusTasks = tasks.filter((t) => t.status === status);
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
                            <p className="text-xs text-muted-foreground truncate mt-1">Assignee: {task.users?.name || (task.assigned_to ? task.assigned_to : "-")}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <select className="text-xs bg-transparent border rounded px-2 py-1" value={task.assigned_to ?? ""} onChange={(e) => handleAssign(task.id, e.target.value)}>
                                  <option value="">Unassigned</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
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

      {modalTaskId && (
        <TaskDetailModal taskId={modalTaskId} open={true} onOpenChange={(open) => { if (!open) setModalTaskId(null); }} userId={user?.id} />
      )}
    </div>
  );
}
