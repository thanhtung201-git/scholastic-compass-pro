import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { format, parseISO } from "date-fns";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_name?: string;
  due_date: string;
  estimated_hours?: number;
};

type Project = {
  id: string;
  name: string;
  code: string;
  description: string;
  progress: number;
};

const KANBAN_COLUMNS = ["Todo", "In Progress", "Review", "Done"];

function ProjectDetailsPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const fetchProjectData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (pData) setProject(pData);

    const { data: tData } = await supabase
      .from("tasks")
      .select(`id, title, description, status, priority, due_date, estimated_hours, users!tasks_assigned_to_fkey(name)`)
      .eq("project_id", projectId);

    if (tData) {
      setTasks(tData.map((t: any) => ({
        ...t,
        assignee_name: t.users?.name || "Unassigned"
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
    
    // Update DB
    await supabase.from("tasks").update({ status: targetStatus }).eq("id", draggedTaskId);
    setDraggedTaskId(null);
  };

  const PRIORITY_STYLES: Record<string, string> = {
    Critical: "bg-red-100 text-red-800",
    High: "bg-red-50 text-red-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-green-50 text-green-700",
  };

  if (loading) return <div className="p-8 text-center">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-80px)]">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            {project.code}
          </span>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
      </div>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="flex-1 min-h-0 mt-4 overflow-hidden">
          <div className="grid grid-cols-4 gap-4 h-full">
            {KANBAN_COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col);
              return (
                <div 
                  key={col}
                  className="bg-muted/30 rounded-xl p-4 flex flex-col h-full border"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm">{col}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 custom-scrollbar">
                    {colTasks.map(task => (
                      <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLES[task.priority] || ""}`}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium leading-tight mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                              {task.assignee_name?.charAt(0)}
                            </div>
                            <span className="truncate max-w-[80px]">{task.assignee_name}</span>
                          </div>
                          {task.due_date && (
                            <span className="text-[10px]">{format(parseISO(task.due_date), "MMM d")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4 border rounded-xl p-8 text-center text-muted-foreground bg-card">
          <Calendar className="size-12 mx-auto mb-4 text-muted/50" />
          <h3 className="text-lg font-medium text-foreground">Calendar View</h3>
          <p>Calendar integration coming soon. This view will show task deadlines across the month.</p>
        </TabsContent>

        <TabsContent value="workload" className="mt-4 border rounded-xl p-8 text-center text-muted-foreground bg-card">
          <Clock className="size-12 mx-auto mb-4 text-muted/50" />
          <h3 className="text-lg font-medium text-foreground">Workload Management</h3>
          <p>This view will show employee workload based on estimated hours and assigned tasks.</p>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 border rounded-xl p-8 text-center text-muted-foreground bg-card">
          <div className="size-12 mx-auto mb-4 flex gap-1 items-end justify-center text-muted/50">
             <div className="w-2 h-4 bg-current rounded-t" />
             <div className="w-2 h-8 bg-current rounded-t" />
             <div className="w-2 h-6 bg-current rounded-t" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Analytics Dashboard</h3>
          <p>Charts and metrics for task completion and project health.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectDetailsPage,
});
