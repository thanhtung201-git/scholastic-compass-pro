import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "task_assigned"
  | "task_reassigned"
  | "task_comment"
  | "leave_submitted"
  | "leave_approved"
  | "leave_rejected";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationInput = {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  entity_type?: string;
  entity_id?: string;
};

type LeaveApproveScope = "none" | "department" | "all";

type RoleLeavePermission = {
  level: number;
  leave_approve_scope: LeaveApproveScope;
  leave_approve_levels: number[] | null;
};

export async function createNotifications(inputs: NotificationInput[]) {
  const rows = inputs.filter((input) => Boolean(input.user_id));
  if (!rows.length) return { error: null };

  const { error } = await supabase.from("notifications").insert(
    rows.map((input) => ({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
    })),
  );

  return { error };
}

export async function notifyUsers(
  userIds: string[],
  notification: Omit<NotificationInput, "user_id">,
  excludeUserId?: string | null,
) {
  const uniqueIds = [...new Set(userIds)].filter(
    (userId) => userId && userId !== excludeUserId,
  );
  if (!uniqueIds.length) return;

  await createNotifications(
    uniqueIds.map((user_id) => ({
      user_id,
      ...notification,
    })),
  );
}

export async function notifyTaskAssigned({
  assigneeUserId,
  actorUserId,
  actorName,
  taskId,
  taskTitle,
  isReassignment = false,
}: {
  assigneeUserId: string | null | undefined;
  actorUserId: string | null | undefined;
  actorName: string;
  taskId: string;
  taskTitle: string;
  isReassignment?: boolean;
}) {
  if (!assigneeUserId || assigneeUserId === actorUserId) return;

  await createNotifications([
    {
      user_id: assigneeUserId,
      type: isReassignment ? "task_reassigned" : "task_assigned",
      title: isReassignment ? "Task reassigned to you" : "New task assigned",
      message: `${actorName} assigned "${taskTitle}" to you`,
      link: "/task-assignment",
      entity_type: "task",
      entity_id: taskId,
    },
  ]);
}

export async function notifyTaskThreadActivity({
  taskId,
  taskTitle,
  actorUserId,
  actorName,
  assigneeUserId,
  assignedByUserId,
  participantUserIds,
}: {
  taskId: string;
  taskTitle: string;
  actorUserId: string;
  actorName: string;
  assigneeUserId?: string | null;
  assignedByUserId?: string | null;
  participantUserIds: string[];
}) {
  const recipients = new Set<string>();

  if (assigneeUserId && assigneeUserId !== actorUserId) {
    recipients.add(assigneeUserId);
  }
  if (assignedByUserId && assignedByUserId !== actorUserId) {
    recipients.add(assignedByUserId);
  }
  participantUserIds.forEach((userId) => {
    if (userId && userId !== actorUserId) {
      recipients.add(userId);
    }
  });

  await notifyUsers(
    [...recipients],
    {
      type: "task_comment",
      title: "New thread comment",
      message: `${actorName} commented on "${taskTitle}"`,
      link: `/comments-threads?taskId=${taskId}`,
      entity_type: "task",
      entity_id: taskId,
    },
    actorUserId,
  );
}

async function getRoleLeavePermissions() {
  const { data, error } = await supabase
    .from("roles")
    .select("role_name, level, leave_approve_scope, leave_approve_levels");
  if (error) throw error;

  const map: Record<string, RoleLeavePermission> = {};
  for (const role of data ?? []) {
    map[role.role_name] = {
      level: role.level ?? 3,
      leave_approve_scope: role.leave_approve_scope ?? "none",
      leave_approve_levels: role.leave_approve_levels ?? null,
    };
  }
  return map;
}

function sameDepartment(left?: string | null, right?: string | null) {
  return Boolean(left?.trim()) && left?.trim().toLowerCase() === right?.trim().toLowerCase();
}

export async function notifyLeaveSubmitted({
  leaveId,
  requestEmployeeId,
  requesterName,
  actorUserId,
}: {
  leaveId: string;
  requestEmployeeId: string | number;
  requesterName: string;
  actorUserId?: string | null;
}) {
  const rolePermissions = await getRoleLeavePermissions();

  const { data: requester, error: requesterError } = await supabase
    .from("employee")
    .select("id, full_name, department, role, user_id")
    .eq("id", requestEmployeeId)
    .maybeSingle();

  if (requesterError || !requester) return;

  const requesterLevel = rolePermissions[requester.role]?.level ?? 3;

  const { data: employees, error: employeesError } = await supabase
    .from("employee")
    .select("user_id, role, department, status")
    .not("user_id", "is", null);

  if (employeesError) return;

  const approverUserIds: string[] = [];

  for (const employee of employees ?? []) {
    if (
      !employee.user_id ||
      employee.status === "Inactive" ||
      employee.user_id === requester.user_id
    ) continue;

    const permission = rolePermissions[employee.role];
    if (!permission || permission.leave_approve_scope === "none") continue;

    const inScope =
      permission.leave_approve_scope === "all" ||
      (
        permission.leave_approve_scope === "department" &&
        sameDepartment(employee.department, requester.department)
      );
    if (!inScope) continue;

    if (
      permission.leave_approve_levels === null ||
      permission.leave_approve_levels.includes(requesterLevel)
    ) {
      approverUserIds.push(employee.user_id);
    }
  }

  await notifyUsers(
    approverUserIds,
    {
      type: "leave_submitted",
      title: "New leave request",
      message: `${requesterName} submitted a leave request`,
      link: "/leave-approve",
      entity_type: "leave",
      entity_id: String(leaveId),
    },
    actorUserId,
  );
}

export async function notifyLeaveDecision({
  leaveId,
  employeeId,
  status,
  actorName,
}: {
  leaveId: string;
  employeeId: string | number;
  status: "APPROVED" | "REJECTED";
  actorName: string;
}) {
  const { data: employee, error } = await supabase
    .from("employee")
    .select("user_id, full_name")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !employee?.user_id) return;

  const approved = status === "APPROVED";

  await createNotifications([
    {
      user_id: employee.user_id,
      type: approved ? "leave_approved" : "leave_rejected",
      title: approved ? "Leave approved" : "Leave rejected",
      message: `${actorName} ${approved ? "approved" : "rejected"} your leave request`,
      link: "/leave-approve",
      entity_type: "leave",
      entity_id: String(leaveId),
    },
  ]);
}

export async function markNotificationRead(notificationId: string) {
  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
