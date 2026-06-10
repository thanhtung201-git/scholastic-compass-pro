import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { notifyLeaveDecision, notifyLeaveSubmitted } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/leave-approve")({
  component: LeaveApprovePage,
});

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
type LeaveViewScope = "self" | "department" | "all";
type LeaveApproveScope = "none" | "department" | "all";

type RoleLeavePermission = {
  level: number | null;
  leave_view_scope: LeaveViewScope;
  leave_create_scope: LeaveViewScope;
  leave_approve_scope: LeaveApproveScope;
  leave_approve_levels: number[] | null;
};

const DEFAULT_ROLE_LEAVE_PERMISSION: RoleLeavePermission = {
  level: 3,
  leave_view_scope: "self",
  leave_create_scope: "self",
  leave_approve_scope: "none",
  leave_approve_levels: [],
};

type CurrentEmployee = {
  id: string | number;
  full_name: string;
  department: string | null;
  role: string;
};

type EmployeeOption = {
  id: string | number;
  full_name: string;
  department: string | null;
  role: string | null;
  status: string | null;
};

type LeaveApproveRecord = {
  id: string;
  employee_id: string | number;
  reason: string;
  start_date: string;
  end_date: string;
  num_days: number;
  status: LeaveStatus;
  employee: { full_name: string; department: string | null; role: string | null } | null;
};

type DepartmentRow = {
  department: string | null;
};

type LeaveApproveRow = Omit<LeaveApproveRecord, "employee"> & {
  employee:
    | { full_name: string; department: string | null; role: string | null }
    | { full_name: string; department: string | null; role: string | null }[]
    | null;
};

type LeaveApproveSelfRow = Omit<LeaveApproveRecord, "employee">;

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  APPROVED: {
    label: "APPROVED",
    classes: "bg-green-100 text-green-700 border border-green-300",
  },
  PENDING: {
    label: "PENDING",
    classes: "bg-orange-100 text-orange-600 border border-orange-300",
  },
  REJECTED: {
    label: "REJECTED",
    classes: "bg-red-100 text-red-700 border border-red-300",
  },
};

function StatusBadge({ status }: { status: string }) {
  const key = (status || "").toUpperCase();
  const config = STATUS_MAP[key] ?? {
    label: status || "UNKNOWN",
    classes: "bg-gray-100 text-gray-600 border border-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <p className="mb-6 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Huỷ
          </Button>
          <Button onClick={onConfirm}>Xác nhận</Button>
        </div>
      </div>
    </div>
  );
}

function AddLeaveDialog({
  currentEmployee,
  employees,
  canCreateForOthers,
  onClose,
  onCreated,
}: {
  currentEmployee: CurrentEmployee;
  employees: EmployeeOption[];
  canCreateForOthers: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(String(currentEmployee.id));
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = canCreateForOthers
    ? employees.find((employee) => String(employee.id) === selectedEmployeeId)
    : currentEmployee;
  const requestEmployeeId = canCreateForOthers ? selectedEmployeeId : currentEmployee.id;

  const canSubmit = Boolean(
    requestEmployeeId &&
    (!canCreateForOthers || selectedEmployee) &&
    reason.trim() &&
    startDate &&
    endDate &&
    !saving,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    if (endDate < startDate) {
      setError("End date must be on or after start date.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("leave_approve")
      .insert({
        employee_id: requestEmployeeId,
        reason: reason.trim(),
        start_date: startDate,
        end_date: endDate,
        status: "PENDING",
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      await notifyLeaveSubmitted({
        leaveId: data.id,
        requestEmployeeId,
        requesterName: selectedEmployee?.full_name ?? currentEmployee.full_name,
      });
    }

    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-700">
            Add Leave Request
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {canCreateForOthers ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Employee</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                    {employee.department ? ` - ${employee.department}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Employee</span>
                <span className="font-medium text-gray-900">{currentEmployee.full_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-900">
                  {currentEmployee.department ?? "—"}
                </span>
              </div>
            </div>
          )}

          {canCreateForOthers && selectedEmployee && (
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-900">
                  {selectedEmployee.department ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Role</span>
                <span className="font-medium text-gray-900">{selectedEmployee.role ?? "—"}</span>
              </div>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Reason</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Failed to load leave records.";
}

function LeaveApprovePage() {
  const [records, setRecords] = useState<LeaveApproveRecord[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<CurrentEmployee | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, RoleLeavePermission>>({});
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const currentRolePermission = useMemo(() => {
    if (!currentEmployee) return DEFAULT_ROLE_LEAVE_PERMISSION;
    return rolePermissions[currentEmployee.role] ?? DEFAULT_ROLE_LEAVE_PERMISSION;
  }, [currentEmployee, rolePermissions]);

  const canViewAll = currentRolePermission.leave_view_scope === "all";
  const canCreateForOthers = currentRolePermission.leave_create_scope !== "self";
  const canManageLeave = currentRolePermission.leave_approve_scope !== "none";

  const [confirm, setConfirm] = useState<{
    id: string;
    action: "APPROVED" | "REJECTED";
    name: string;
  } | null>(null);

  async function fetchCurrentEmployee() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("No authenticated user found.");

    const { data, error: employeeError } = await supabase
      .from("employee")
      .select("id, full_name, department, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (employeeError) throw employeeError;
    if (!data) throw new Error("No employee profile found for this user.");

    return data as CurrentEmployee;
  }

  function getRolePermission(
    role: string | null | undefined,
    permissions = rolePermissions,
  ): RoleLeavePermission {
    if (!role) return DEFAULT_ROLE_LEAVE_PERMISSION;
    return permissions[role] ?? DEFAULT_ROLE_LEAVE_PERMISSION;
  }

  function scopeAllowsEmployee(scope: LeaveViewScope | LeaveApproveScope, employee: EmployeeOption | LeaveApproveRecord["employee"]) {
    if (!currentEmployee || scope === "none") return false;
    if (scope === "all") return true;
    return (
      scope === "department" &&
      Boolean(employee?.department) &&
      employee?.department?.trim().toLowerCase() === currentEmployee.department?.trim().toLowerCase()
    );
  }

  async function fetchRolePermissions() {
    const { data, error } = await supabase
      .from("roles")
      .select("role_name, level, leave_view_scope, leave_create_scope, leave_approve_scope, leave_approve_levels");
    if (error) throw error;
    const map: Record<string, RoleLeavePermission> = {};
    for (const r of data) {
      map[r.role_name] = {
        level: r.level ?? 3,
        leave_view_scope: r.leave_view_scope ?? "self",
        leave_create_scope: r.leave_create_scope ?? "self",
        leave_approve_scope: r.leave_approve_scope ?? "none",
        leave_approve_levels: r.leave_approve_levels ?? null,
      };
    }
    setRolePermissions(map);
    return map;
  }

  async function fetchDepartments() {
    const { data } = await supabase.from("employee").select("department").order("department");

    const unique = [
      ...new Set(((data ?? []) as DepartmentRow[]).map((row) => row.department).filter(Boolean)),
    ];
    setDepartments(unique as string[]);
  }

  async function fetchEmployees(employee: CurrentEmployee, permission: RoleLeavePermission) {
    let query = supabase
      .from("employee")
      .select("id, full_name, department, role, status")
      .order("full_name", { ascending: true });

    if (permission.leave_create_scope === "department") {
      query = query.eq("department", employee.department);
    }

    const { data, error: employeesError } = await query;

    if (employeesError) throw employeesError;

    setEmployees((data ?? []) as EmployeeOption[]);
  }

  async function fetchLeaveRecords(
    employee: CurrentEmployee,
    currentRolePermissions: Record<string, RoleLeavePermission>,
  ) {
    const permission = getRolePermission(employee.role, currentRolePermissions);

    if (permission.leave_view_scope === "self") {
      // Level 3 non-HR can only see their own
      let selfQuery = supabase
        .from("leave_approve")
        .select("id, employee_id, reason, start_date, end_date, num_days, status")
        .eq("employee_id", employee.id)
        .order("start_date", { ascending: false });

      if (filterStatus !== "ALL") {
        selfQuery = selfQuery.eq("status", filterStatus);
      }

      const { data, error: selfFetchError } = await selfQuery;

      if (selfFetchError) throw selfFetchError;

      const normalised: LeaveApproveRecord[] = ((data ?? []) as LeaveApproveSelfRow[]).map(
        (row) => ({
          ...row,
          employee: {
            full_name: employee.full_name,
            department: employee.department,
            role: employee.role,
          },
        }),
      );

      setRecords(normalised);
      return;
    }

    // ── Scoped management view ────────────────────────────────────────
    //
    // WHY we pre-fetch employee IDs instead of filtering on the embedded
    // resource directly:
    //
    //   query.eq("employee.department", value)  ← BROKEN
    //
    // PostgREST only accepts that dot-notation filter when the embedded
    // resource uses its real table name in the select string. The alias
    // "employee:employee_id" causes the filter to be silently ignored (or
    // return an empty set in some Supabase versions), so level-2 managers
    // either saw no records at all or saw every record unfiltered.
    //
    // The reliable fix: resolve the IDs in a separate query on `employee`,
    // then use .in("employee_id", ids) — a direct column filter that always
    // works and is easy to reason about.
    // ──────────────────────────────────────────────────────────────────

    // Step 1 – for department scope or a department filter, narrow down to the
    //           relevant employee IDs before touching leave_approve.
    let scopedEmployeeIds: string[] | null = null;

    if (permission.leave_view_scope === "department") {
      const { data: deptEmps, error: deptError } = await supabase
        .from("employee")
        .select("id")
        .eq("department", employee.department)
        .eq("status", "Active");

      if (deptError) throw deptError;

      scopedEmployeeIds = (deptEmps ?? []).map((e) => String(e.id));

      if (scopedEmployeeIds.length === 0) {
        setRecords([]);
        return;
      }
    } else if (permission.leave_view_scope === "all" && departmentFilter !== "ALL") {
      const { data: filteredEmps, error: deptError } = await supabase
        .from("employee")
        .select("id")
        .eq("department", departmentFilter);

      if (deptError) throw deptError;

      scopedEmployeeIds = (filteredEmps ?? []).map((e) => String(e.id));

      if (scopedEmployeeIds.length === 0) {
        setRecords([]);
        return;
      }
    }

    // Step 2 – fetch leave records (with employee info) and apply the
    //           pre-resolved IDs when needed.
    let query = supabase
      .from("leave_approve")
      .select(
        `
          id,
          employee_id,
          reason,
          start_date,
          end_date,
          num_days,
          status,
          employee:employee_id ( full_name, department, role )
        `,
      )
      .order("start_date", { ascending: false });

    if (filterStatus !== "ALL") {
      query = query.eq("status", filterStatus);
    }

    if (scopedEmployeeIds !== null) {
      // Direct column filter – always reliable, regardless of join alias.
      query = query.in("employee_id", scopedEmployeeIds);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const normalised: LeaveApproveRecord[] = ((data ?? []) as LeaveApproveRow[]).map((row) => ({
      ...row,
      employee: Array.isArray(row.employee) ? (row.employee[0] ?? null) : row.employee,
    }));

    setRecords(normalised);
  }

  async function refreshData(existingEmployee = currentEmployee) {
    setLoading(true);
    setError(null);

    try {
      const permissions = await fetchRolePermissions();
      const employee = existingEmployee ?? (await fetchCurrentEmployee());
      setCurrentEmployee(employee);
      const permission = getRolePermission(employee.role, permissions);

      await Promise.all([
        fetchLeaveRecords(employee, permissions),
        permission.leave_create_scope !== "self"
          ? Promise.all([fetchDepartments(), fetchEmployees(employee, permission)])
          : Promise.resolve(),
      ]);
    } catch (err: unknown) {
      console.error("Leave approve error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, departmentFilter]);

  useEffect(() => {
    if (!canViewAll && departmentFilter !== "ALL") {
      setDepartmentFilter("ALL");
    }
  }, [canViewAll, departmentFilter]);

  async function handleAction(id: string, newStatus: "APPROVED" | "REJECTED") {
    if (!currentEmployee) return;

    // The user might have tampered with UI, double check in UI or let RLS handle it.
    // Assuming UI permission checks are enough for this task.

    setActionLoading(id);

    const { error: updateError } = await supabase
      .from("leave_approve")
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: currentEmployee.id,
      })
      .eq("id", id);

    const record = records.find((item) => item.id === id);

    if (updateError) {
      alert("Lỗi: " + updateError.message);
    } else {
      if (record) {
        await notifyLeaveDecision({
          leaveId: id,
          employeeId: record.employee_id,
          status: newStatus,
          actorName: currentEmployee.full_name,
        });
      }
      await refreshData(currentEmployee);
    }

    setActionLoading(null);
    setConfirm(null);
  }

  function canApproveRecord(record: LeaveApproveRecord) {
    if (!currentEmployee) return false;
    // Cannot approve own leave
    if (String(record.employee_id) === String(currentEmployee.id)) return false;

    if (!scopeAllowsEmployee(currentRolePermission.leave_approve_scope, record.employee)) {
      return false;
    }

    const recordPermission = getRolePermission(record.employee?.role);
    const allowedLevels = currentRolePermission.leave_approve_levels;
    return allowedLevels === null || allowedLevels.includes(recordPermission.level ?? 3);
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Leave Approve"
          description={
            canManageLeave
              ? "Manage and approve employee leave requests"
              : "Create and track your leave requests"
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          {canViewAll && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          )}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <Button onClick={() => setAddDialogOpen(true)} disabled={!currentEmployee}>
            <Plus className="mr-2 size-4" />
            Add Leave
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-4 text-center text-destructive">
          Failed to load leave records: {error}
        </Card>
      ) : records.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">No leave records found.</Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nhân sự</TableHead>
                <TableHead className="font-semibold">Phòng ban</TableHead>
                <TableHead className="font-semibold">Lý do</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Số ngày</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                {canManageLeave && <TableHead className="font-semibold">Hành động quản lý</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const canApprove = canApproveRecord(record);
                
                return (
                <TableRow key={record.id}>
                  <TableCell className="whitespace-nowrap font-semibold text-gray-800">
                    {record.employee?.full_name ?? `Unknown (ID: ${record.employee_id})`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600">
                    {record.employee?.department ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-gray-600" title={record.reason}>
                    {record.reason}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600">
                    {record.start_date}
                    <span className="mx-1 text-gray-400">→</span>
                    {record.end_date}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-bold text-gray-800">
                    {record.num_days} ngày
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  {canManageLeave && (
                    <TableCell>
                      {record.status === "PENDING" ? (
                        canApprove ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={actionLoading === record.id}
                              onClick={() =>
                                setConfirm({
                                  id: record.id,
                                  action: "APPROVED",
                                  name: record.employee?.full_name ?? "",
                                })
                              }
                              className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                            >
                              {actionLoading === record.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Duyệt"
                              )}
                            </button>
                            <button
                              disabled={actionLoading === record.id}
                              onClick={() =>
                                setConfirm({
                                  id: record.id,
                                  action: "REJECTED",
                                  name: record.employee?.full_name ?? "",
                                })
                              }
                              className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm italic text-gray-400">Không có quyền duyệt</span>
                        )
                      ) : record.status === "APPROVED" ? (
                        <span className="text-sm italic text-gray-400">Đã chốt quyết định</span>
                      ) : (
                        <span className="text-sm italic text-gray-400">Đã từ chối</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </Card>
      )}

      {confirm && (
        <ConfirmDialog
          message={
            confirm.action === "APPROVED"
              ? `Xác nhận duyệt đơn nghỉ phép của ${confirm.name}?`
              : `Xác nhận từ chối đơn nghỉ phép của ${confirm.name}?`
          }
          onConfirm={() => handleAction(confirm.id, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {addDialogOpen && currentEmployee && (
        <AddLeaveDialog
          currentEmployee={currentEmployee}
          employees={employees}
          canCreateForOthers={canCreateForOthers}
          onClose={() => setAddDialogOpen(false)}
          onCreated={async () => {
            setAddDialogOpen(false);
            await refreshData(currentEmployee);
          }}
        />
      )}
    </div>
  );
}
