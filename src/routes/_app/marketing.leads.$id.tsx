import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMarketing } from "@/hooks/use-marketing";
import { useDatabase } from "@/hooks/use-database";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Plus, 
  Loader2, 
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/marketing/leads/$id")({
  component: LeadDetailPage,
});

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Interested: "bg-blue-100 text-blue-800",
  "Trial Scheduled": "bg-yellow-100 text-yellow-800",
  Registered: "bg-green-100 text-green-800",
  Paid: "bg-green-100 text-green-800",
  Lost: "bg-red-100 text-red-800",
};

const ACTIVITY_TYPES = ["Call", "Email", "SMS", "Trial Class", "Status Update", "Note"];

function LeadDetailPage() {
  const { id } = Route.useParams();
  const { leads, leadActivities, leadNotes, followUps, addActivity, addNote, addFollowUp, updateFollowUpStatus } = useMarketing();
  const { users } = useDatabase();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity form state
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: "Call",
    description: "",
  });
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Notes form state
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: "" });
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Tasks form state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    deadline: new Date().toISOString().slice(0, 16),
    priority: "Medium",
    followup_type: "Task",
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  useEffect(() => {
    const foundLead = leads.find((l) => l.id === id);
    if (foundLead) {
      setLead(foundLead);
    }
    setLoading(false);
  }, [id, leads]);

  useEffect(() => {
    const leadActivitiesList = leadActivities.filter((a) => a.lead_id === id);
    setActivities(leadActivitiesList);
  }, [leadActivities, id]);

  useEffect(() => {
    const leadNotesList = leadNotes.filter((n) => n.lead_id === id);
    setNotes(leadNotesList);
  }, [leadNotes, id]);

  useEffect(() => {
    const leadTasks = followUps.filter((f) => f.lead_id === id);
    setTasks(leadTasks);
  }, [followUps, id]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingActivity(true);
    try {
      await addActivity({
        lead_id: id,
        ...activityForm,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString(),
      });
      setActivityForm({ activity_type: "Call", description: "" });
      setIsAddActivityOpen(false);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNote(true);
    try {
      await addNote({
        lead_id: id,
        content: noteForm.content,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString(),
      });
      setNoteForm({ content: "" });
      setIsAddNoteOpen(false);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTask(true);
    try {
      await addFollowUp({
        lead_id: id,
        ...taskForm,
        deadline: new Date(taskForm.deadline).toISOString(),
        assigned_staff_id: lead.assigned_staff_id,
        status: "Pending",
        created_at: new Date().toISOString(),
      });
      setTaskForm({
        title: "",
        deadline: new Date().toISOString().slice(0, 16),
        priority: "Medium",
        followup_type: "Task",
      });
      setIsAddTaskOpen(false);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Lead Not Found" description="The lead you're looking for doesn't exist" />
        <Button asChild>
          <Link to="/marketing/leads">
            <ArrowLeft className="mr-2 size-4" />
            Back to Leads
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link to="/marketing/leads">
            <ArrowLeft className="mr-2 size-4" />
          </Link>
        </Button>
        <PageHeader title={lead.full_name} description={lead.source?.name || "Lead"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assigned Staff</p>
              <p className="font-semibold mt-1 truncate">
                {users.find(u => u.id === lead.assigned_staff_id)?.name || "Unassigned"}
              </p>
            </div>
            <User className="size-4 text-muted-foreground" />
          </div>
        </Card>

        {lead.lead_type === 'B2B' && (
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-semibold mt-1 truncate">{lead.company_name || "-"}</p>
                {lead.job_title && <p className="text-xs text-muted-foreground mt-1">{lead.job_title}</p>}
              </div>
              <Badge variant="outline" className="text-[10px]">B2B</Badge>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold mt-1">{lead.phone || "-"}</p>
            </div>
            <Phone className="size-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold mt-1 truncate">{lead.email || "-"}</p>
            </div>
            <Mail className="size-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`${LEAD_STATUS_COLORS[lead.status]} mt-1`}>
                {lead.status}
              </Badge>
            </div>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold text-sm mt-1">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
            <Calendar className="size-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Timeline */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Activity Timeline</h3>
            <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 size-4" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Activity</DialogTitle>
                  <DialogDescription>
                    Record an interaction with this lead
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddActivity} className="space-y-4">
                  <div>
                    <Label htmlFor="activity_type">Activity Type *</Label>
                    <Select
                      value={activityForm.activity_type}
                      onValueChange={(value) =>
                        setActivityForm({ ...activityForm, activity_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={activityForm.description}
                      onChange={(e) =>
                        setActivityForm({ ...activityForm, description: e.target.value })
                      }
                      placeholder="What happened during this interaction?"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmittingActivity}
                      className="w-full"
                    >
                      {isSubmittingActivity ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Activity"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities recorded yet
              </p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="size-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{activity.activity_type}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}{" "}
                        {new Date(activity.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Notes Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Internal Notes</h3>
            <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 size-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                  <DialogDescription>
                    Add internal notes for your team
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <Label htmlFor="content">Note Content *</Label>
                    <Textarea
                      id="content"
                      required
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm({ content: e.target.value })
                      }
                      placeholder="Write internal notes here..."
                      rows={5}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="w-full"
                    >
                      {isSubmittingNote ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Add Note"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notes yet
              </p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Follow-up Tasks Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Follow-up Tasks</h3>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 size-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Task</DialogTitle>
                  <DialogDescription>
                    Schedule a follow-up task
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <Label htmlFor="task_title">Title *</Label>
                    <Input
                      id="task_title"
                      required
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                      placeholder="e.g. Call to confirm schedule"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task_deadline">Deadline *</Label>
                    <Input
                      id="task_deadline"
                      type="datetime-local"
                      required
                      value={taskForm.deadline}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, deadline: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="task_priority">Priority</Label>
                    <Select
                      value={taskForm.priority}
                      onValueChange={(value) =>
                        setTaskForm({ ...taskForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmittingTask}
                      className="w-full"
                    >
                      {isSubmittingTask ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Add Task"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks scheduled
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                  <div className="mt-0.5">
                    <Checkbox 
                      checked={task.status === "Completed"}
                      onCheckedChange={(checked) => {
                        updateFollowUpStatus(task.id, checked ? "Completed" : "Pending");
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
