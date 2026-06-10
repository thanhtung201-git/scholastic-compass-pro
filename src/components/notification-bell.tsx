import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Loader2,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/lib/auth-context";
import type { AppNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

function NotificationIcon({ type }: { type: string }) {
  if (type === "task_comment") return <MessageSquare className="size-4" />;
  if (type.startsWith("leave_")) return <ClipboardList className="size-4" />;
  return <UserPlus className="size-4" />;
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
}) {
  const isUnread = !notification.read_at;
  const createdAt = notification.created_at
    ? formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })
    : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-muted/60",
        isUnread && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <NotificationIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("text-sm leading-5", isUnread && "font-medium")}>
            {notification.title}
          </div>
          {isUnread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{createdAt}</div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id);

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markRead(notification.id);
    }

    if (!notification.link) return;

    if (notification.link.startsWith("/comments-threads")) {
      const url = new URL(notification.link, window.location.origin);
      navigate({
        to: "/comments-threads",
        search: { taskId: url.searchParams.get("taskId") ?? undefined },
      });
      return;
    }

    navigate({ to: notification.link as "/task-assignment" | "/leave-approve" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={markAllRead}>
              <CheckCheck className="mr-1.5 size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={handleOpenNotification}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
