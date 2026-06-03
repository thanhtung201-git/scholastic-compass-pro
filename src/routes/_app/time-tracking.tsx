import { createFileRoute } from "@tanstack/react-router";
import { Timer, Play, Pause, Trash2, BarChart3, Calendar, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export const Route = createFileRoute("/_app/time-tracking")({
  component: TimeTrackingPage,
});

// Các role được phép xem/assign task của người khác
const CAN_ASSIGN_ROLES = ["Director", "Finance Manager", "Academic Manager", "Admin", "HR Manager", "Marketing Manager"];
const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  "Finance Manager": "Finance",
  "Academic Manager": "Academic",
  "Admin": "IT",
  "HR Manager": "Human Resource",
  "Marketing Manager": "Marketing",
};

type TimeLog = {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  tasks?: { id: string; title: string };
  users?: { name: string };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  estimated_hours?: number;
  assigned_to?: string;
};

function TimeTrackingPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const userRole: string = (user as any)?.role ?? "";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");

  const [manualForm, setManualForm] = useState({
    task_id: "",
    start_time: "",
    end_time: "",
    description: "",
  });

  // Fetch tasks - dựa theo role giống task-assignment.tsx
  const fetchTasks = async () => {
    if (!userId) return;

    let query = supabase
      .from("tasks")
      .select("id, title, description, estimated_hours, assigned_to")
      .order("title");

    // Director xem tất cả tasks
    if (userRole === "Director") {
      // không filter gì thêm
    } else {
      // Manager xem tasks theo department của mình
      const deptName = ROLE_DEPARTMENT_MAP[userRole];
      if (deptName) {
        query = query.eq("department", deptName) as any;
      } else {
        // Nhân viên thường chỉ xem tasks được assign cho mình
        query = query.eq("assigned_to", userId) as any;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("fetchTasks error:", error);
    }

    setTasks((data as any) ?? []);
  };

  // Fetch time logs for current user
  const fetchTimeLogs = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("task_time_logs")
      .select(`
        *,
        tasks:task_id(id, title)
      `)
      .eq("user_id", userId)
      .order("start_time", { ascending: false });

    if (error) {
      console.error("fetchTimeLogs error:", error);
    }

    setTimeLogs((data as any) ?? []);

    const active = ((data as any) || []).find((l: any) => !l.end_time);
    if (active) {
      setActiveTimerId(active.id);
      setActiveTaskId(active.task_id);
    } else {
      setActiveTimerId(null);
      setActiveTaskId(null);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTimeLogs();
  }, [userId]);

  // Timer effect
  useEffect(() => {
    if (!activeTimerId) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerId]);

  // Start timer
  const handleStartTimer = async (taskId: string) => {
    if (!userId) return;
    setLoading(true);

    try {
      const now = new Date().toISOString();

      // Stop any existing active timer
      if (activeTimerId) {
        await supabase
          .from("task_time_logs")
          .update({ end_time: now })
          .eq("id", activeTimerId);
      }

      // Start new timer
      const { data, error } = await supabase
        .from("task_time_logs")
        .insert([{ task_id: taskId, user_id: userId, start_time: now }])
        .select()
        .single();

      if (!error && data) {
        setActiveTimerId(data.id);
        setActiveTaskId(taskId);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start timer");
    } finally {
      await fetchTimeLogs();
      setLoading(false);
    }
  };

  // Stop timer
  const handleStopTimer = async () => {
    if (!activeTimerId || !userId) return;
    setLoading(true);

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("task_time_logs")
        .update({ end_time: now })
        .eq("id", activeTimerId);

      if (!error) {
        setActiveTimerId(null);
        setActiveTaskId(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to stop timer");
    } finally {
      await fetchTimeLogs();
      setLoading(false);
    }
  };

  // Add manual time log
  const handleAddManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !manualForm.task_id) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("task_time_logs").insert([
        {
          task_id: manualForm.task_id,
          user_id: userId,
          start_time: manualForm.start_time,
          end_time: manualForm.end_time,
          description: manualForm.description || null,
        },
      ]);

      if (!error) {
        setIsManualLogOpen(false);
        setManualForm({ task_id: "", start_time: "", end_time: "", description: "" });
        await fetchTimeLogs();
      } else {
        alert("Failed to add time log");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding time log");
    } finally {
      setLoading(false);
    }
  };

  // Delete time log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Delete this time log?")) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("task_time_logs").delete().eq("id", logId);
      if (!error) {
        await fetchTimeLogs();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete time log");
    } finally {
      setLoading(false);
    }
  };

  // Filter time logs
  const getFilteredLogs = () => {
    const today = new Date();
    return timeLogs.filter((log) => {
      if (dateFilter === "all") return true;
      const logDate = new Date(log.start_time);
      if (dateFilter === "today") {
        return logDate >= startOfDay(today) && logDate <= endOfDay(today);
      }
      if (dateFilter === "week") {
        return logDate >= startOfWeek(today) && logDate <= endOfWeek(today);
      }
      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  // Calculate statistics
  const calculateStats = (logs: TimeLog[]) => {
    const totalMinutes = logs.reduce((sum, log) => {
      if (!log.start_time) return sum;
      const start = new Date(log.start_time);
      const end = log.end_time ? new Date(log.end_time) : new Date();
      return sum + (end.getTime() - start.getTime()) / 1000 / 60;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return { hours, minutes, totalMinutes };
  };

  const stats = calculateStats(filteredLogs);
  const todayStats = calculateStats(
    timeLogs.filter((log) => {
      const logDate = new Date(log.start_time);
      return logDate >= startOfDay(new Date()) && logDate <= endOfDay(new Date());
    })
  );

  // Format time display
  const formatElapsed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Time Tracking"
        description="Track time spent on tasks and monitor your work hours."
      />

      {/* Active Timer */}
      {activeTimerId && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Currently Tracking</p>
              <p className="text-2xl font-bold text-green-900">
                {formatElapsed(elapsedSeconds)}
              </p>
              <p className="text-sm text-green-700">
                {tasks.find((t) => t.id === activeTaskId)?.title || "Unknown Task"}
              </p>
            </div>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleStopTimer}
              disabled={loading}
              className="gap-2"
            >
              <Pause className="h-5 w-5" />
              Stop Timer
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today
          </p>
          <p className="text-2xl font-bold mt-2">
            {todayStats.hours}h {todayStats.minutes}m
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {dateFilter === "all"
              ? "All Time"
              : dateFilter === "today"
              ? "Today"
              : "This Week"}
          </p>
          <p className="text-2xl font-bold mt-2">
            {stats.hours}h {stats.minutes}m
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Task Count
          </p>
          <p className="text-2xl font-bold mt-2">{filteredLogs.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Quick Start Timer
        </h3>
        <div className="space-y-4">
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task to track time" />
            </SelectTrigger>
            <SelectContent>
              {tasks.length === 0 ? (
                <SelectItem value="none" disabled>
                  No tasks assigned
                </SelectItem>
              ) : (
                tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (selectedTask) handleStartTimer(selectedTask);
              }}
              disabled={!selectedTask || activeTimerId !== null || loading}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Timer
            </Button>

            <Dialog open={isManualLogOpen} onOpenChange={setIsManualLogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Manual Time Log</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddManualLog} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Task</label>
                    <Select
                      value={manualForm.task_id}
                      onValueChange={(value) =>
                        setManualForm({ ...manualForm, task_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <Input
                      type="datetime-local"
                      value={manualForm.start_time}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, start_time: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <Input
                      type="datetime-local"
                      value={manualForm.end_time}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, end_time: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (optional)
                    </label>
                    <Textarea
                      placeholder="What did you work on?"
                      value={manualForm.description}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Time Log"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={dateFilter === "today" ? "default" : "outline"}
          onClick={() => setDateFilter("today")}
        >
          Today
        </Button>
        <Button
          variant={dateFilter === "week" ? "default" : "outline"}
          onClick={() => setDateFilter("week")}
        >
          This Week
        </Button>
        <Button
          variant={dateFilter === "all" ? "default" : "outline"}
          onClick={() => setDateFilter("all")}
        >
          All Time
        </Button>
      </div>

      {/* Time Logs Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Time Logs</h3>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No time logs for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-3 px-4">Task</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Start Time</th>
                  <th className="text-left py-3 px-4">End Time</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const start = log.start_time ? new Date(log.start_time) : null;
                  const end = log.end_time ? new Date(log.end_time) : new Date();
                  const durationMs = start ? end.getTime() - start.getTime() : 0;
                  const durationMinutes = durationMs / 1000 / 60;
                  const hours = Math.floor(durationMinutes / 60);
                  const minutes = Math.round(durationMinutes % 60);

                  return (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {(log.tasks as any)?.title || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {start ? format(start, "MMM d, yyyy") : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {start ? format(start, "HH:mm") : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {log.end_time ? (
                          format(new Date(log.end_time), "HH:mm")
                        ) : (
                          <span className="text-green-600 font-medium">Running</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {hours > 0 ? `${hours}h ` : ""}{minutes}m
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {log.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}