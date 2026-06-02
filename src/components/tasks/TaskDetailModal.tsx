import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Paperclip, Clock, Play, Square, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

type TaskDetailModalProps = {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

export function TaskDetailModal({ taskId, open, onOpenChange, userId }: TaskDetailModalProps) {
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  
  const [newComment, setNewComment] = useState("");
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  useEffect(() => {
    if (taskId && open) {
      fetchTaskData();
    }
  }, [taskId, open]);

  const fetchTaskData = async () => {
    // Fetch Task
    const { data: taskData } = await supabase.from("tasks").select("*, users!tasks_assigned_to_fkey(name)").eq("id", taskId).single();
    setTask(taskData);

    // Fetch Comments
    const { data: commentData } = await supabase.from("task_comments").select("*, users(name)").eq("task_id", taskId).order("created_at", { ascending: true });
    setComments(commentData || []);

    // Fetch Attachments
    const { data: attachmentData } = await supabase.from("task_attachments").select("*, users(name)").eq("task_id", taskId);
    setAttachments(attachmentData || []);

    // Fetch Time logs
    const { data: timeLogData } = await supabase.from("task_time_logs").select("*, users(name)").eq("task_id", taskId);
    setTimeLogs(timeLogData || []);
    
    // Check for active timer
    const active = (timeLogData || []).find((log: any) => log.end_time === null && log.user_id === userId);
    if (active) setActiveTimerId(active.id);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("task_comments").insert([{ task_id: taskId, user_id: userId, content: newComment.trim() }]);
    setNewComment("");
    fetchTaskData();
  };

  const handleToggleTimer = async () => {
    if (activeTimerId) {
      // Stop timer
      await supabase.from("task_time_logs").update({ end_time: new Date().toISOString() }).eq("id", activeTimerId);
      setActiveTimerId(null);
    } else {
      // Start timer
      const { data } = await supabase.from("task_time_logs").insert([{ task_id: taskId, user_id: userId, start_time: new Date().toISOString() }]).select().single();
      if (data) setActiveTimerId(data.id);
    }
    fetchTaskData();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
              {task.priority} Priority
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {task.status}
            </span>
          </div>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">Assigned to: {task.users?.name}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <div className="px-6 border-b">
              <TabsList className="h-10 bg-transparent p-0">
                <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">Details</TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 flex gap-2">
                  <MessageSquare className="size-4" /> Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="attachments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 flex gap-2">
                  <Paperclip className="size-4" /> Attachments ({attachments.length})
                </TabsTrigger>
                <TabsTrigger value="time" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 flex gap-2">
                  <Clock className="size-4" /> Time
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="details" className="mt-0 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <div className="text-sm bg-muted/30 p-4 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {task.description || "No description provided."}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Hours</p>
                    <p className="font-medium">{task.estimated_hours || 0}h</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                    <p className="font-medium">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "N/A"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-0 h-full flex flex-col">
                <div className="flex-1 space-y-4 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                        {comment.users?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 bg-muted/30 p-3 rounded-lg rounded-tl-none">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{comment.users?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No comments yet.</p>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <Textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type a comment... (use @ to mention)" 
                    className="min-h-[60px]"
                  />
                  <Button onClick={handleAddComment} className="shrink-0"><Send className="size-4" /></Button>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-0 space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 flex flex-col items-center justify-center">
                  <Paperclip className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">Drag and drop files here</p>
                  <p className="text-xs text-muted-foreground mb-4">Support for PDF, DOCX, XLSX, PNG, JPG</p>
                  <Button variant="outline" size="sm">Browse Files</Button>
                </div>

                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded text-primary">
                          <Paperclip className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">Uploaded by {file.users?.name}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="time" className="mt-0 space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg flex items-center justify-between border">
                  <div>
                    <h4 className="font-semibold mb-1">Time Tracker</h4>
                    <p className="text-sm text-muted-foreground">Track actual time spent on this task.</p>
                  </div>
                  <Button 
                    size="lg" 
                    variant={activeTimerId ? "destructive" : "default"}
                    onClick={handleToggleTimer}
                    className="w-32"
                  >
                    {activeTimerId ? (
                      <><Square className="size-4 mr-2" /> Stop</>
                    ) : (
                      <><Play className="size-4 mr-2" /> Start</>
                    )}
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Time Logs</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">User</th>
                          <th className="text-left py-2 px-4 font-medium">Start Time</th>
                          <th className="text-left py-2 px-4 font-medium">End Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0">
                            <td className="py-2 px-4">{log.users?.name}</td>
                            <td className="py-2 px-4">{format(new Date(log.start_time), "MMM d, h:mm a")}</td>
                            <td className="py-2 px-4">
                              {log.end_time ? format(new Date(log.end_time), "MMM d, h:mm a") : <span className="text-green-600 font-medium flex items-center gap-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span> Running</span>}
                            </td>
                          </tr>
                        ))}
                        {timeLogs.length === 0 && (
                          <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No time logged yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
