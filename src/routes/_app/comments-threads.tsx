import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  AtSign,
  Bold,
  Italic,
  Link as LinkIcon,
  Loader2,
  MessageSquareReply,
  MessagesSquare,
  Paperclip,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/comments-threads")({
  component: CommentsThreadsPage,
});

type TaskSummary = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  due_date: string | null;
  assignee_name: string;
};

type RawTask = Omit<TaskSummary, "assignee_name"> & {
  users?: { name?: string | null } | null;
};

type TaskComment = {
  id: string;
  task_id: string;
  user_id: string | null;
  parent_id: string | null;
  body: string;
  created_at: string;
  user_name: string;
};

type RawComment = Omit<TaskComment, "user_name"> & {
  users?: { name?: string | null } | null;
};

type ActivityEvent = {
  id: string;
  label: string;
  timestamp: string | null;
  detail: string;
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function formatDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? format(date, "dd MMM yyyy") : "No due date";
}

function formatTimestamp(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? format(date, "dd MMM yyyy, HH:mm") : "Unknown time";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NA";
}

function getStatusClass(status: string | null) {
  if (status === "Done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Review") return "bg-violet-50 text-violet-700 border-violet-200";
  if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function getPriorityClass(priority: string | null) {
  if (priority === "High") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function MentionText({ body }: { body: string }) {
  const parts = body.split(/(@[\w.-]+)/g);

  return (
    <>
      {parts.map((part, index) =>
        /^@[\w.-]+$/.test(part) ? (
          <span key={`${part}-${index}`} className="font-medium text-blue-600">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: TaskComment;
  replies: TaskComment[];
  onReply: (comment: TaskComment) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="text-xs">{getInitials(comment.user_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 rounded-lg border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{comment.user_name}</div>
            <div className="text-xs text-muted-foreground">
              {formatTimestamp(comment.created_at)}
            </div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            <MentionText body={comment.body} />
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => onReply(comment)}
          >
            <MessageSquareReply className="mr-1 size-3.5" />
            Reply
          </Button>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-8 space-y-3 border-l pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsThreadPanel({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [task, setTask] = useState<TaskSummary | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<TaskComment | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: "end" }));
  };

  const fetchThread = async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);

    const [taskResult, commentsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select(`
          id, title, status, priority, assigned_to, due_date,
          users!tasks_assigned_to_fkey(name)
        `)
        .eq("id", taskId)
        .single(),
      supabase
        .from("task_comments")
        .select("id, task_id, user_id, parent_id, body, created_at, users(name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),
    ]);

    if (taskResult.error) {
      setError(taskResult.error.message);
      setTask(null);
    } else {
      const row = taskResult.data as RawTask;
      setTask({ ...row, assignee_name: row.users?.name ?? "Unassigned" });
    }

    if (commentsResult.error) {
      setError(commentsResult.error.message);
      setComments([]);
    } else {
      setComments(
        ((commentsResult.data ?? []) as RawComment[]).map((comment) => ({
          ...comment,
          user_name: comment.users?.name ?? "Unknown user",
        })),
      );
    }

    setLoading(false);
    scrollToBottom();
  };

  useEffect(() => {
    if (!open || !taskId) return;
    fetchThread();

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => fetchThread(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, taskId]);

  const groupedComments = useMemo(() => {
    const topLevel = comments.filter((comment) => !comment.parent_id);
    const repliesByParent = new Map<string, TaskComment[]>();

    comments
      .filter((comment) => comment.parent_id)
      .forEach((comment) => {
        repliesByParent.set(comment.parent_id!, [
          ...(repliesByParent.get(comment.parent_id!) ?? []),
          comment,
        ]);
      });

    return { topLevel, repliesByParent };
  }, [comments]);

  const activityEvents = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    if (task) {
      events.push({
        id: `${task.id}-status`,
        label: "Status",
        timestamp: null,
        detail: `Current status is ${task.status ?? "Unknown"}`,
      });
    }

    comments.forEach((comment) => {
      events.push({
        id: comment.id,
        label: comment.parent_id ? "Reply added" : "Comment added",
        timestamp: comment.created_at,
        detail: `${comment.user_name}: ${comment.body.slice(0, 80)}`,
      });
    });

    return events.sort((a, b) => {
      if (!a.timestamp) return -1;
      if (!b.timestamp) return 1;
      return a.timestamp.localeCompare(b.timestamp);
    });
  }, [comments, task]);

  const applyToolbar = (before: string, after = "") => {
    setBody((current) => `${current}${current ? " " : ""}${before}${after}`);
  };

  const handleSend = async () => {
    if (!taskId || !user?.id || !body.trim()) return;
    setSending(true);
    setError(null);

    const { error: insertError } = await supabase.from("task_comments").insert([
      {
        task_id: taskId,
        user_id: user.id,
        parent_id: replyTo?.id ?? null,
        body: body.trim(),
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setBody("");
      setReplyTo(null);
      await fetchThread();
    }

    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-5xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Comments & Threads</SheetTitle>
          <SheetDescription>Discuss task work, replies, and mentions.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading thread...
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-0 flex-col">
              {task && (
                <div className="border-b bg-muted/30 px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-auto min-w-[220px] font-semibold">{task.title}</div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        getStatusClass(task.status),
                      )}
                    >
                      {task.status ?? "Unknown"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        getPriorityClass(task.priority),
                      )}
                    >
                      {task.priority ?? "No priority"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Assigned to {task.assignee_name} · Due {formatDate(task.due_date)}
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-6 mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {groupedComments.topLevel.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <MessagesSquare className="mb-3 size-10 opacity-40" />
                    <div className="font-medium text-foreground">No comments yet</div>
                    <div className="text-sm">Start the thread below.</div>
                  </div>
                ) : (
                  groupedComments.topLevel.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      replies={groupedComments.repliesByParent.get(comment.id) ?? []}
                      onReply={(selected) => {
                        setReplyTo(selected);
                        setBody((current) => current || `@${selected.user_name.split(" ")[0]} `);
                      }}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t bg-background p-4">
                {replyTo && (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                    <span>
                      Replying to <span className="font-medium">{replyTo.user_name}</span>
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Add a comment... use @ to mention someone"
                  className="min-h-24 resize-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyToolbar("**bold**")}>
                      <Bold className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyToolbar("_italic_")}>
                      <Italic className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyToolbar("https://")}>
                      <LinkIcon className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon">
                      <Paperclip className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyToolbar("@")}>
                      <AtSign className="size-4" />
                    </Button>
                  </div>
                  <Button type="button" onClick={handleSend} disabled={sending || !body.trim() || !user}>
                    {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto border-l bg-muted/20 p-4">
              <div className="mb-4 text-sm font-semibold">Activity log</div>
              <div className="space-y-3">
                {activityEvents.map((event) => (
                  <div key={event.id} className="rounded-md border bg-background p-3">
                    <div className="text-xs font-medium">{event.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.timestamp ? formatTimestamp(event.timestamp) : "Task metadata"}
                    </div>
                    <div className="mt-2 text-xs leading-5">{event.detail}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CommentsThreadsPage() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchTasks() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select(`
          id, title, status, priority, assigned_to, due_date,
          users!tasks_assigned_to_fkey(name)
        `)
        .order("created_at", { ascending: false });

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
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Comments & Threads"
        description="Open a task thread to review discussion, replies, mentions, and activity."
      />

      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-lg border bg-card text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading tasks...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load tasks: {error}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTaskId(task.id)}
              className="rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{task.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Assigned to {task.assignee_name} · Due {formatDate(task.due_date)}
                  </div>
                </div>
                <MessagesSquare className="size-5 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    getStatusClass(task.status),
                  )}
                >
                  {task.status ?? "Unknown"}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    getPriorityClass(task.priority),
                  )}
                >
                  {task.priority ?? "No priority"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CommentsThreadPanel
        taskId={selectedTaskId}
        open={Boolean(selectedTaskId)}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </div>
  );
}
