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
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/leave-approve")({
  component: LeaveApprovePage,
});

const HR_ROLES = ["HR Manager", "HR Staff"];
const VIEW_ALL_ROLES = [...HR_ROLES, "Director"];

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  employee: { full_name: string; department: string | null } | null;
};

type DepartmentRow = {
  department: string | null;
};

type LeaveApproveRow = Omit<LeaveApproveRecord, "employee"> & {
  employee:
    | { full_name: string; department: string | null }
    | { full_name: string; department: string | null }[]
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
  isHR,
  onClose,
  onCreated,
}: {
  currentEmployee: CurrentEmployee;
  employees: EmployeeOption[];
  isHR: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(String(currentEmployee.id));
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = isHR
    ? employees.find((employee) => String(employee.id) === selectedEmployeeId)
    : currentEmployee;
  const requestEmployeeId = isHR ? selectedEmployeeId : currentEmployee.id;

  const canSubmit = Boolean(
    requestEmployeeId &&
    (!isHR || selectedEmployee) &&
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

    const { error: insertError } = await supabase.from("leave_approve").insert({
      employee_id: requestEmployeeId,
      reason: reason.trim(),
      start_date: startDate,
      end_date: endDate,
      status: "PENDING",
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
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
          {isHR ? (
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

          {isHR && selectedEmployee && (
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
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isHR = useMemo(
    () => Boolean(currentEmployee && HR_ROLES.includes(currentEmployee.role)),
    [currentEmployee],
  );
  const canViewAll = useMemo(
    () => Boolean(currentEmployee && VIEW_ALL_ROLES.includes(currentEmployee.role)),
    [currentEmployee],
  );

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

  async function fetchDepartments() {
    const { data } = await supabase.from("employee").select("department").order("department");

    const unique = [
      ...new Set(((data ?? []) as DepartmentRow[]).map((row) => row.department).filter(Boolean)),
    ];
    setDepartments(unique as string[]);
  }

  async function fetchEmployees() {
    const { data, error: employeesError } = await supabase
      .from("employee")
      .select("id, full_name, department, role, status")
      .order("full_name", { ascending: true });

    if (employeesError) throw employeesError;

    setEmployees((data ?? []) as EmployeeOption[]);
  }

  async function fetchLeaveRecords(employee: CurrentEmployee) {
    const employeeCanViewAll = VIEW_ALL_ROLES.includes(employee.role);

    if (!employeeCanViewAll) {
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
          },
        }),
      );

      setRecords(normalised);
      return;
    }

    const employeeSelect =
      departmentFilter !== "ALL"
        ? "employee:employee_id!inner ( full_name, department )"
        : "employee:employee_id ( full_name, department )";

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
          ${employeeSelect}
        `,
      )
      .order("start_date", { ascending: false });

    if (filterStatus !== "ALL") {
      query = query.eq("status", filterStatus);
    }

    if (departmentFilter !== "ALL") {
      query = query.eq("employee.department", departmentFilter);
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
      const employee = existingEmployee ?? (await fetchCurrentEmployee());
      setCurrentEmployee(employee);

      await Promise.all([
        fetchLeaveRecords(employee),
        VIEW_ALL_ROLES.includes(employee.role)
          ? Promise.all([
              fetchDepartments(),
              HR_ROLES.includes(employee.role) ? fetchEmployees() : Promise.resolve(),
            ])
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
    if (!currentEmployee || !isHR) return;

    setActionLoading(id);

    const { error: updateError } = await supabase
      .from("leave_approve")
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: currentEmployee.id,
      })
      .eq("id", id);

    if (updateError) {
      alert("Lỗi: " + updateError.message);
    } else {
      await refreshData(currentEmployee);
    }

    setActionLoading(null);
    setConfirm(null);
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Leave Approve"
          description={
            isHR
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
                {isHR && <TableHead className="font-semibold">Hành động quản lý</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
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
                  {isHR && (
                    <TableCell>
                      {record.status === "PENDING" ? (
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
                      ) : record.status === "APPROVED" ? (
                        <span className="text-sm italic text-gray-400">Đã chốt quyết định</span>
                      ) : (
                        <span className="text-sm italic text-gray-400">Đã từ chối</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
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
          isHR={isHR}
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
