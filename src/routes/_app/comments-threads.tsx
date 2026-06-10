import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  AtSign,
  Bold,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Loader2,
  MessageSquareReply,
  MessagesSquare,
  Paperclip,
  Pin,
  Search,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserDepartment } from "@/hooks/use-current-user-department";
import { useAuth } from "@/lib/auth-context";
import { notifyTaskThreadActivity } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { matchesTaskSearch } from "@/lib/task-list-utils";
import {
  canViewAttachmentInBrowser,
  downloadAttachment,
  formatFileSize,
  isImageAttachment,
  uploadTaskAttachment,
  validateAttachmentFile,
  viewAttachment,
} from "@/lib/task-attachments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/comments-threads")({
  validateSearch: (search: Record<string, unknown>) => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
  component: CommentsThreadsPage,
});

type TaskSummary = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  department: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
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

type TaskAttachment = {
  id: string;
  task_id: string;
  comment_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  uploader_name: string;
};

type RawAttachment = Omit<TaskAttachment, "uploader_name"> & {
  users?: { name?: string | null } | null;
};

type PendingAttachment = {
  id: string;
  file: File;
};

const PRIORITY_RANK: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function getPriorityRank(priority: string | null) {
  return PRIORITY_RANK[priority ?? ""] ?? 0;
}

function sortThreadTasks(tasks: TaskSummary[], pinnedIds: Set<string>) {
  return [...tasks].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const aDue = parseDate(a.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = parseDate(b.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;

    return a.title.localeCompare(b.title);
  });
}

function usePinnedTasks(userId: string | undefined) {
  const storageKey = userId ? `comments-threads-pins:${userId}` : null;
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storageKey) {
      setPinnedIds(new Set());
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      setPinnedIds(raw ? new Set(JSON.parse(raw) as string[]) : new Set());
    } catch {
      setPinnedIds(new Set());
    }
  }, [storageKey]);

  const togglePin = (taskId: string) => {
    setPinnedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      }
      return next;
    });
  };

  return { pinnedIds, togglePin };
}

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
  if (priority === "Critical") return "bg-rose-100 text-rose-900 border-rose-300";
  if (priority === "High") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

const COMMENT_INLINE_RE =
  /(\*\*(.+?)\*\*|_(.+?)_|(@[\w.-]+)|\[([^\]]+)\]\(([^)]+)\))/g;

function CommentBody({ body }: { body: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of body.matchAll(COMMENT_INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(<span key={key++}>{body.slice(lastIndex, index)}</span>);
    }

    if (match[2]) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      nodes.push(
        <span key={key++} className="font-medium text-blue-600">
          {match[4]}
        </span>,
      );
    } else if (match[5] && match[6]) {
      nodes.push(
        <a
          key={key++}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline underline-offset-2"
        >
          {match[5]}
        </a>,
      );
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    nodes.push(<span key={key++}>{body.slice(lastIndex)}</span>);
  }

  return <>{nodes}</>;
}

function restoreTextareaSelection(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
) {
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start, end);
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  currentValue: string,
  insertText: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const next = currentValue.slice(0, start) + insertText + currentValue.slice(end);
  onChange(next);
  const cursor = start + insertText.length;
  restoreTextareaSelection(textarea, cursor, cursor);
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  currentValue: string,
  before: string,
  after: string,
  placeholder: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = currentValue.slice(start, end) || placeholder;
  const next =
    currentValue.slice(0, start) + before + selected + after + currentValue.slice(end);
  onChange(next);
  const selectionStart = start + before.length;
  const selectionEnd = selectionStart + selected.length;
  restoreTextareaSelection(textarea, selectionStart, selectionEnd);
}

function insertLink(
  textarea: HTMLTextAreaElement,
  currentValue: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = currentValue.slice(start, end);
  const linkText = selected || "link text";
  const url = "https://";
  const before = `[${linkText}](`;
  const after = ")";
  const next = currentValue.slice(0, start) + before + url + after + currentValue.slice(end);
  onChange(next);
  const urlStart = start + before.length;
  const urlEnd = urlStart + url.length;
  restoreTextareaSelection(textarea, urlStart, urlEnd);
}

function preventToolbarFocusLoss(event: React.MouseEvent) {
  event.preventDefault();
}

function AttachmentPreview({
  attachment,
  compact = false,
}: {
  attachment: TaskAttachment;
  compact?: boolean;
}) {
  const isImage = isImageAttachment(attachment.file_type, attachment.file_name);

  if (isImage) {
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block overflow-hidden rounded-md border bg-muted/20", compact ? "max-w-[220px]" : "max-w-full")}
      >
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className={cn("w-full object-cover", compact ? "max-h-36" : "max-h-56")}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm transition hover:bg-muted/40"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate font-medium">{attachment.file_name}</div>
        <div className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</div>
      </div>
      <Download className="ml-auto size-4 shrink-0 text-muted-foreground" />
    </a>
  );
}

function CommentAttachments({ attachments }: { attachments: TaskAttachment[] }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <AttachmentPreview key={attachment.id} attachment={attachment} compact />
      ))}
    </div>
  );
}

function ThreadFileRow({ attachment }: { attachment: TaskAttachment }) {
  const isImage = isImageAttachment(attachment.file_type, attachment.file_name);
  const canView = canViewAttachmentInBrowser(attachment.file_type, attachment.file_name);

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
      <button
        type="button"
        onClick={() => viewAttachment(attachment.file_url)}
        className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/30 transition hover:bg-muted/50"
        title={canView ? "View file" : "Open file"}
      >
        {isImage ? (
          <img
            src={attachment.file_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <FileText className="size-3.5 text-muted-foreground" />
        )}
      </button>

      <button
        type="button"
        onClick={() => viewAttachment(attachment.file_url)}
        className="min-w-0 flex-1 text-left"
        title={attachment.file_name}
      >
        <div className="truncate text-xs font-medium leading-4">{attachment.file_name}</div>
        <div className="truncate text-[10px] leading-4 text-muted-foreground">
          {formatFileSize(attachment.file_size)} · {attachment.uploader_name}
        </div>
      </button>

      <div className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          title={canView ? "View" : "Open"}
          onClick={() => viewAttachment(attachment.file_url)}
        >
          {canView ? <Eye className="size-3.5" /> : <ExternalLink className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          title="Download"
          onClick={() => downloadAttachment(attachment)}
        >
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ThreadFilesPane({ attachments }: { attachments: TaskAttachment[] }) {
  if (!attachments.length) {
    return (
      <div className="rounded-md border border-dashed bg-background px-3 py-6 text-center text-muted-foreground">
        <Paperclip className="mx-auto mb-2 size-6 opacity-40" />
        <div className="text-xs font-medium text-foreground">No files yet</div>
        <div className="mt-0.5 text-[10px]">Sent files will appear here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {attachments.map((attachment) => (
        <ThreadFileRow key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

function PendingAttachmentList({
  items,
  onRemove,
}: {
  items: PendingAttachment[];
  onRemove: (id: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex max-w-full items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
        >
          {item.file.type.startsWith("image/") ? (
            <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{item.file.name}</div>
            <div className="text-muted-foreground">{formatFileSize(item.file.size)}</div>
          </div>
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  attachments,
  attachmentsByComment,
  onReply,
}: {
  comment: TaskComment;
  replies: TaskComment[];
  attachments: TaskAttachment[];
  attachmentsByComment: Map<string, TaskAttachment[]>;
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
          {comment.body.trim() && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              <CommentBody body={comment.body} />
            </p>
          )}
          <CommentAttachments attachments={attachments} />
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
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              attachments={attachmentsByComment.get(reply.id) ?? []}
              attachmentsByComment={attachmentsByComment}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskThreadCard({
  task,
  isPinned,
  isSelected,
  onOpen,
  onTogglePin,
}: {
  task: TaskSummary;
  isPinned: boolean;
  isSelected: boolean;
  onOpen: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-lg border bg-background p-2.5 transition",
        isSelected && "border-primary ring-1 ring-primary/30",
        "hover:border-primary/50 hover:bg-muted/20",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-7 shrink-0", isPinned && "text-primary")}
        title={isPinned ? "Unpin task" : "Pin to top"}
        onClick={(event) => {
          event.stopPropagation();
          onTogglePin(task.id);
        }}
      >
        <Pin className={cn("size-3.5", isPinned && "fill-current")} />
      </Button>

      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-5">{task.title}</div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {task.assignee_name} · Due {formatDate(task.due_date)}
            </div>
          </div>
          <MessagesSquare className="size-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              getStatusClass(task.status),
            )}
          >
            {task.status ?? "Unknown"}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              getPriorityClass(task.priority),
            )}
          >
            {task.priority ?? "No priority"}
          </span>
          {isPinned && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Pinned
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

function TaskThreadPane({
  title,
  description,
  tasks,
  pinnedIds,
  selectedTaskId,
  onOpenTask,
  onTogglePin,
  emptyMessage,
}: {
  title: string;
  description: string;
  tasks: TaskSummary[];
  pinnedIds: Set<string>;
  selectedTaskId: string | null;
  onOpenTask: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
  emptyMessage: string;
}) {
  const sortedTasks = useMemo(
    () => sortThreadTasks(tasks, pinnedIds),
    [tasks, pinnedIds],
  );

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Badge variant="secondary" className="text-[10px]">
            {sortedTasks.length}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {sortedTasks.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground">
            <MessagesSquare className="mb-2 size-8 opacity-30" />
            {emptyMessage}
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskThreadCard
              key={task.id}
              task={task}
              isPinned={pinnedIds.has(task.id)}
              isSelected={selectedTaskId === task.id}
              onOpen={onOpenTask}
              onTogglePin={onTogglePin}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentsThreadPanel({
  taskId,
  currentDepartment,
  canViewAllDepartments,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  currentDepartment: string | null;
  canViewAllDepartments: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [task, setTask] = useState<TaskSummary | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<TaskComment | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: "end" }));
  };

  const fetchThread = async () => {
    if (!taskId) return;
    if (!canViewAllDepartments && !currentDepartment) {
      setTask(null);
      setComments([]);
      setError("Your role is not assigned to a department.");
      return;
    }

    setLoading(true);
    setError(null);

    let taskQuery = supabase
      .from("tasks")
      .select(`
        id, title, status, priority, department, assigned_to, assigned_by, due_date,
        users!tasks_assigned_to_fkey(name)
      `)
      .eq("id", taskId);

    if (!canViewAllDepartments && currentDepartment) {
      taskQuery = taskQuery.eq("department", currentDepartment);
    }

    const taskResult = await taskQuery.single();

    if (taskResult.error) {
      setError(taskResult.error.message);
      setTask(null);
      setComments([]);
      setLoading(false);
      return;
    } else {
      const row = taskResult.data as RawTask;
      setTask({ ...row, assignee_name: row.users?.name ?? "Unassigned" });
    }

    const commentsResult = await supabase
      .from("task_comments")
      .select("id, task_id, user_id, parent_id, body, created_at, users(name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    const attachmentsResult = await supabase
      .from("task_attachments")
      .select(
        "id, task_id, comment_id, file_name, file_url, file_type, file_size, uploaded_by, created_at, users(name)",
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

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

    if (attachmentsResult.error) {
      setError(attachmentsResult.error.message);
      setAttachments([]);
    } else {
      setAttachments(
        ((attachmentsResult.data ?? []) as RawAttachment[]).map((attachment) => ({
          ...attachment,
          uploader_name: attachment.users?.name ?? "Unknown user",
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
      .channel(`task-thread-${taskId}`)
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_attachments",
          filter: `task_id=eq.${taskId}`,
        },
        () => fetchThread(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewAllDepartments, currentDepartment, open, taskId]);

  useEffect(() => {
    if (!open) {
      setPendingAttachments([]);
      setBody("");
      setReplyTo(null);
    }
  }, [open]);

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

  const attachmentsByComment = useMemo(() => {
    const grouped = new Map<string, TaskAttachment[]>();
    attachments.forEach((attachment) => {
      if (!attachment.comment_id) return;
      grouped.set(attachment.comment_id, [
        ...(grouped.get(attachment.comment_id) ?? []),
        attachment,
      ]);
    });
    return grouped;
  }, [attachments]);

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
        detail: `${comment.user_name}: ${comment.body.trim() || "(attachment)"}`.slice(0, 80),
      });
    });

    attachments.forEach((attachment) => {
      events.push({
        id: attachment.id,
        label: "File uploaded",
        timestamp: attachment.created_at,
        detail: `${attachment.uploader_name} sent ${attachment.file_name}`,
      });
    });

    return events.sort((a, b) => {
      if (!a.timestamp) return -1;
      if (!b.timestamp) return 1;
      return a.timestamp.localeCompare(b.timestamp);
    });
  }, [attachments, comments, task]);

  const handleFormat = (
    before: string,
    after: string,
    placeholder: string,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    wrapSelection(textarea, body, before, after, placeholder, setBody);
  };

  const handleInsertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    insertAtCursor(textarea, body, text, setBody);
  };

  const handleInsertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    insertLink(textarea, body, setBody);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const nextPending: PendingAttachment[] = [];
    for (const file of files) {
      const validationError = validateAttachmentFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }
      nextPending.push({ id: crypto.randomUUID(), file });
    }

    if (nextPending.length) {
      setPendingAttachments((current) => [...current, ...nextPending]);
    }

    event.target.value = "";
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((current) => current.filter((item) => item.id !== id));
  };

  const canSend = Boolean(body.trim() || pendingAttachments.length);

  const handleSend = async () => {
    if (!taskId || !task || !user?.id || !canSend) return;
    setSending(true);
    setError(null);

    try {
      const { data: commentRow, error: insertError } = await supabase
        .from("task_comments")
        .insert([
          {
            task_id: taskId,
            user_id: user.id,
            parent_id: replyTo?.id ?? null,
            body: body.trim() || " ",
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      for (const pending of pendingAttachments) {
        const { fileUrl } = await uploadTaskAttachment(taskId, pending.file);
        const { error: attachmentError } = await supabase.from("task_attachments").insert([
          {
            task_id: taskId,
            comment_id: commentRow.id,
            file_name: pending.file.name,
            file_url: fileUrl,
            file_type: pending.file.type || null,
            file_size: pending.file.size,
            uploaded_by: user.id,
          },
        ]);

        if (attachmentError) throw attachmentError;
      }

      setBody("");
      setReplyTo(null);
      setPendingAttachments([]);
      await fetchThread();

      await notifyTaskThreadActivity({
        taskId,
        taskTitle: task.title,
        actorUserId: user.id,
        actorName: user.name ?? "Someone",
        assigneeUserId: task.assigned_to,
        assignedByUserId: task.assigned_by,
        participantUserIds: comments
          .map((comment) => comment.user_id)
          .filter((commentUserId): commentUserId is string => Boolean(commentUserId)),
      });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Failed to send comment.";
      setError(message);
      toast.error(message);
    }

    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-6xl">
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
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]">
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
                      attachments={attachmentsByComment.get(comment.id) ?? []}
                      attachmentsByComment={attachmentsByComment}
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
                <PendingAttachmentList
                  items={pendingAttachments}
                  onRemove={handleRemovePendingAttachment}
                />
                <Textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Add a comment... use @ to mention someone"
                  className="min-h-24 resize-none"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Bold"
                      onMouseDown={preventToolbarFocusLoss}
                      onClick={() => handleFormat("**", "**", "bold text")}
                    >
                      <Bold className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Italic"
                      onMouseDown={preventToolbarFocusLoss}
                      onClick={() => handleFormat("_", "_", "italic text")}
                    >
                      <Italic className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Insert link"
                      onMouseDown={preventToolbarFocusLoss}
                      onClick={handleInsertLink}
                    >
                      <LinkIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Attach files (max 50 MB each)"
                      onMouseDown={preventToolbarFocusLoss}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Mention someone"
                      onMouseDown={preventToolbarFocusLoss}
                      onClick={() => handleInsertAtCursor("@")}
                    >
                      <AtSign className="size-4" />
                    </Button>
                  </div>
                  <Button type="button" onClick={handleSend} disabled={sending || !canSend || !user}>
                    {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                    Send
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Attach images, documents, and other files up to 50 MB each.
                </p>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col border-l bg-muted/20 p-4">
              <Tabs defaultValue="files" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="files">
                    Files ({attachments.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="files" className="mt-4 min-h-0 flex-1 overflow-y-auto">
                  <ThreadFilesPane attachments={attachments} />
                </TabsContent>
                <TabsContent value="activity" className="mt-4 min-h-0 flex-1 overflow-y-auto">
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
                </TabsContent>
              </Tabs>
            </aside>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CommentsThreadsPage() {
  const { taskId: taskIdFromSearch } = Route.useSearch();
  const { user } = useAuth();
  const {
    department: currentUserDepartment,
    canViewAllDepartments,
    loading: departmentLoading,
    error: departmentError,
  } = useCurrentUserDepartment();
  const { pinnedIds, togglePin } = usePinnedTasks(user?.id);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskIdFromSearch ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (taskIdFromSearch) {
      setSelectedTaskId(taskIdFromSearch);
    }
  }, [taskIdFromSearch]);

  useEffect(() => {
    let active = true;

    async function fetchTasks() {
      if (departmentLoading) return;
      if (!canViewAllDepartments && !currentUserDepartment) {
        setTasks([]);
        setError(departmentError ?? "Your role is not assigned to a department.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let query = supabase
        .from("tasks")
        .select(`
          id, title, status, priority, department, assigned_to, due_date,
          users!tasks_assigned_to_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (!canViewAllDepartments) {
        query = query.eq("department", currentUserDepartment);
      }

      const { data, error: fetchError } = await query;

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
  }, [canViewAllDepartments, currentUserDepartment, departmentError, departmentLoading]);

  const { myTasks, otherTasks } = useMemo(() => {
    const visibleTasks = tasks.filter((task) => matchesTaskSearch(task, searchQuery));

    if (!user?.id) {
      return { myTasks: [], otherTasks: visibleTasks };
    }

    return {
      myTasks: visibleTasks.filter((task) => task.assigned_to === user.id),
      otherTasks: visibleTasks.filter((task) => task.assigned_to !== user.id),
    };
  }, [tasks, user?.id, searchQuery]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Comments & Threads"
        description="My tasks and other team tasks, sorted by priority. Pin important threads to keep them on top."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks by title, assignee, department, priority..."
          className="pl-9"
        />
      </div>

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
        <div className="grid gap-4 xl:grid-cols-2">
          <TaskThreadPane
            title="My Tasks"
            description="Tasks assigned to you. Pinned tasks stay at the top."
            tasks={myTasks}
            pinnedIds={pinnedIds}
            selectedTaskId={selectedTaskId}
            onOpenTask={setSelectedTaskId}
            onTogglePin={togglePin}
            emptyMessage="No tasks are assigned to you yet."
          />
          <TaskThreadPane
            title="Other Tasks"
            description="Other tasks in your scope. Sorted by priority with pins first."
            tasks={otherTasks}
            pinnedIds={pinnedIds}
            selectedTaskId={selectedTaskId}
            onOpenTask={setSelectedTaskId}
            onTogglePin={togglePin}
            emptyMessage="No other tasks available in your department."
          />
        </div>
      )}

      <CommentsThreadPanel
        taskId={selectedTaskId}
        currentDepartment={currentUserDepartment}
        canViewAllDepartments={canViewAllDepartments}
        open={Boolean(selectedTaskId)}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </div>
  );
}
