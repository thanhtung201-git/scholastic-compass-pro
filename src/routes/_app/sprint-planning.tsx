import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { Plus, Trash2, Calendar, Target, Users, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

// Role mapping giống task-assignment.tsx
const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  "Finance Manager": "Finance",
  "Academic Manager": "Academic",
  "Admin": "IT",
  "HR Manager": "Human Resource",
  "Marketing Manager": "Marketing",
};

type Sprint = {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: "Planning" | "Active" | "Completed" | "Cancelled";
  goal?: string;
  capacity?: number;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  sprint_id?: string | null;
  project_id?: string;
  assigned_to?: string;
  estimated_hours?: number;
};

function SprintPlanningPage() {
  const { user } = useAuth();
  const userRole: string = (user as any)?.role ?? "";

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sprintForm, setSprintForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    goal: "",
    capacity: 0,
  });

  const [taskForm, setTaskForm] = useState({
    task_id: "",
    sprint_id: "",
  });

  // Fetch sprints
  const fetchSprints = async (updatedSprintId?: string) => {
    try {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching sprints:", error);
        return;
      }

      if (data) {
        setSprints(data);
        const currentSprintId = updatedSprintId || selectedSprint?.id;
        if (currentSprintId) {
          const freshSprint = data.find((s) => s.id === currentSprintId);
          setSelectedSprint(freshSprint || data[0] || null);
        } else if (data.length > 0) {
          setSelectedSprint(data[0]);
        }
      }
    } catch (err) {
      console.error("Sprints fetch error:", err);
    }
  };

  // Fetch tasks — dùng cùng logic filter theo role như task-assignment.tsx
  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      // Build query giống buildTaskQuery trong task-assignment
      let query = supabase
        .from("tasks")
        .select("id, title, description, status, priority, sprint_id, assigned_to, estimated_hours, department")
        .order("created_at", { ascending: false });

      // Áp dụng filter theo role — giống hệt task-assignment.tsx
      if (userRole !== "Director") {
        const deptName = ROLE_DEPARTMENT_MAP[userRole];
        if (deptName) {
          query = query.eq("department", deptName);
        } else {
          query = query.eq("assigned_to", user.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }

      if (data) {
        setTasks(data);
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    }
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  // Fetch tasks sau khi có user (giống task-assignment dùng [user, userRole])
  useEffect(() => {
    fetchTasks();
  }, [user, userRole]);

  // Set sprint_id khi dialog mở, tránh race condition với onClick
  useEffect(() => {
    if (isTaskDialogOpen && selectedSprint) {
      setTaskForm({ task_id: "", sprint_id: selectedSprint.id });
    }
  }, [isTaskDialogOpen, selectedSprint?.id]);

  // Create sprint
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: sprintForm.name.trim(),
      description: sprintForm.description.trim() || null,
      start_date: sprintForm.start_date,
      end_date: sprintForm.end_date,
      goal: sprintForm.goal.trim() || null,
      capacity: sprintForm.capacity || 0,
      status: "Planning",
    };

    const { data, error } = await supabase.from("sprints").insert([payload]).select();
    setIsSubmitting(false);

    if (!error) {
      setIsSprintDialogOpen(false);
      setSprintForm({ name: "", description: "", start_date: "", end_date: "", goal: "", capacity: 0 });
      fetchSprints(data?.[0]?.id);
    } else {
      console.error(error);
      alert("Failed to create sprint");
    }
  };

  // Assign task to sprint
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.task_id || !taskForm.sprint_id) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("tasks")
      .update({ sprint_id: taskForm.sprint_id })
      .eq("id", taskForm.task_id);

    setIsSubmitting(false);

    if (!error) {
      setIsTaskDialogOpen(false);
      const targetSprintId = taskForm.sprint_id;
      setTaskForm({ task_id: "", sprint_id: "" });
      await fetchTasks();
      await fetchSprints(targetSprintId);
    } else {
      console.error(error);
      alert("Failed to assign task");
    }
  };

  // Delete sprint
  const handleDeleteSprint = async (id: string) => {
    if (confirm("Are you sure? This will unassign all tasks from this sprint.")) {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (!error) {
        if (selectedSprint?.id === id) setSelectedSprint(null);
        fetchSprints();
        fetchTasks();
      } else {
        alert("Failed to delete sprint");
      }
    }
  };

  // Remove task from sprint
  const handleRemoveTaskFromSprint = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ sprint_id: null })
      .eq("id", taskId);

    if (!error) {
      fetchTasks();
      if (selectedSprint) fetchSprints(selectedSprint.id);
    }
  };

  const sprintTasks = selectedSprint
    ? tasks.filter((t) => t.sprint_id === selectedSprint.id)
    : [];

  const backlogTasks = tasks.filter((t) => !t.sprint_id);

  const totalEstimatedHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const capacityRemaining = (selectedSprint?.capacity || 0) - totalEstimatedHours;

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "MMM d, yyyy");
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Sprint Planning"
        description="Plan sprints, assign tasks, and manage capacity."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sprint List */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sprints</h3>
            <Dialog open={isSprintDialogOpen} onOpenChange={setIsSprintDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  New Sprint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Sprint</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSprint} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sprint Name</label>
                    <Input
                      placeholder="Sprint 1"
                      value={sprintForm.name}
                      onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      placeholder="Sprint description..."
                      value={sprintForm.description}
                      onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sprint Goal</label>
                    <Textarea
                      placeholder="What should be completed in this sprint?"
                      value={sprintForm.goal}
                      onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={sprintForm.start_date}
                        onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <Input
                        type="date"
                        value={sprintForm.end_date}
                        onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Capacity (hours)</label>
                    <Input
                      type="number"
                      placeholder="160"
                      value={sprintForm.capacity || ""}
                      onChange={(e) => setSprintForm({ ...sprintForm, capacity: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Creating..." : "Create Sprint"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {sprints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sprints created yet.</p>
            ) : (
              sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  onClick={() => setSelectedSprint(sprint)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedSprint?.id === sprint.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sprint.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatLocalDate(sprint.start_date)} - {formatLocalDate(sprint.end_date)}
                      </p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        {tasks.filter((t) => t.sprint_id === sprint.id).length} tasks
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSprint(sprint.id);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sprint Details & Tasks */}
        <div className="space-y-4 lg:col-span-2">
          {selectedSprint ? (
            <>
              {/* Sprint Overview */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedSprint.name}</h3>
                  {selectedSprint.goal && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedSprint.goal}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Duration
                    </p>
                    <p className="text-xs font-semibold">
                      {formatLocalDate(selectedSprint.start_date)} - {formatLocalDate(selectedSprint.end_date)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Capacity
                    </p>
                    <p className="text-sm font-semibold">{selectedSprint.capacity}h</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Used
                    </p>
                    <p className="text-sm font-semibold">{totalEstimatedHours}h</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Remaining
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        capacityRemaining < 0 ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {capacityRemaining}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Sprint Tasks */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Tasks in Sprint ({sprintTasks.length})</h4>
                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Assign Task to Sprint</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAssignTask} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Select Task</label>
                          <Select
                            value={taskForm.task_id}
                            onValueChange={(value) => setTaskForm({ ...taskForm, task_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a task" />
                            </SelectTrigger>
                            <SelectContent>
                              {backlogTasks.length === 0 ? (
                                <div className="py-4 px-2 text-sm text-muted-foreground text-center">
                                  No tasks available. Create tasks in Task Assignment first.
                                </div>
                              ) : (
                                backlogTasks.map((task) => (
                                  <SelectItem key={task.id} value={task.id}>
                                    {task.title} ({task.estimated_hours || 0}h)
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !taskForm.task_id}
                          className="w-full"
                        >
                          {isSubmitting ? "Adding..." : "Add to Sprint"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {sprintTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No tasks in this sprint yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sprintTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {task.status}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              {task.priority}
                            </span>
                            {task.estimated_hours && (
                              <span className="text-xs text-muted-foreground">{task.estimated_hours}h</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTaskFromSprint(task.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center flex flex-col items-center justify-center">
              <Target className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Select a sprint to view details and manage tasks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Backlog */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h4 className="font-semibold">Backlog ({backlogTasks.length} tasks)</h4>
        {backlogTasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No tasks available to assign.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {backlogTasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-3 bg-muted/30 hover:bg-muted/70 transition-colors flex flex-col justify-between">
                <p className="font-medium text-sm truncate mb-2">{task.title}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {task.status}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      {task.priority}
                    </span>
                  </div>
                  {task.estimated_hours && (
                    <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                      {task.estimated_hours}h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/sprint-planning")({
  component: SprintPlanningPage,
});