import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/leave-approve")({
  component: LeaveApprovePage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveApproveRecord = {
  id: string;
  employee_id: string | number;
  reason: string;
  start_date: string;
  end_date: string;
  num_days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee: { full_name: string } | null;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

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
          <button
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LeaveApprovePage() {
  const [records, setRecords]     = useState<LeaveApproveRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState<string>("ALL");

  // Confirm dialog: tracks which record + which action is pending confirmation
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "APPROVED" | "REJECTED";
    name: string;
  } | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchData() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("leave_approve")
      .select(`
        id,
        employee_id,
        reason,
        start_date,
        end_date,
        num_days,
        status,
        employee:employee_id ( full_name )
      `)
      .order("start_date", { ascending: false });

    if (filterStatus !== "ALL") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const normalised: LeaveApproveRecord[] = (data ?? []).map((row: any) => ({
      ...row,
      employee: Array.isArray(row.employee) ? row.employee[0] ?? null : row.employee,
    }));

    setRecords(normalised);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  // ── Action ───────────────────────────────────────────────────────────────

  async function handleAction(id: string, newStatus: "APPROVED" | "REJECTED") {
    setActionLoading(id);

    const { error } = await supabase
      .from("leave_approve")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      await fetchData(); // re-fetch to reflect updated state
    }

    setActionLoading(null);
    setConfirm(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* Header + filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Leave Approve"
          description="Manage and approve employee leave requests"
        />
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
        <Card className="p-4 text-center text-muted-foreground">
          No leave records found.
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nhân sự</TableHead>
                <TableHead className="font-semibold">Lý do</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Số ngày</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Hành động quản lý</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  {/* Employee name */}
                  <TableCell className="font-semibold text-gray-800 whitespace-nowrap">
                    {r.employee?.full_name ?? `Unknown (ID: ${r.employee_id})`}
                  </TableCell>

                  {/* Reason */}
                  <TableCell
                    className="text-gray-600 max-w-xs truncate"
                    title={r.reason}
                  >
                    {r.reason}
                  </TableCell>

                  {/* Date range merged into one column */}
                  <TableCell className="whitespace-nowrap text-gray-600">
                    {r.start_date}
                    <span className="mx-1 text-gray-400">→</span>
                    {r.end_date}
                  </TableCell>

                  {/* Num days */}
                  <TableCell className="font-bold text-gray-800 whitespace-nowrap">
                    {r.num_days} {r.num_days === 1 ? "ngày" : "ngày"}
                  </TableCell>

                  {/* Status badge */}
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>

                  {/* Action buttons — only for PENDING rows */}
                  <TableCell>
                    {r.status === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() =>
                            setConfirm({
                              id: r.id,
                              action: "APPROVED",
                              name: r.employee?.full_name ?? "",
                            })
                          }
                          className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            "Duyệt"
                          )}
                        </button>
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() =>
                            setConfirm({
                              id: r.id,
                              action: "REJECTED",
                              name: r.employee?.full_name ?? "",
                            })
                          }
                          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : r.status === "APPROVED" ? (
                      <span className="text-sm italic text-gray-400">
                        Đã chốt quyết định
                      </span>
                    ) : (
                      <span className="text-sm italic text-gray-400">
                        Đã từ chối
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Confirmation dialog */}
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
    </div>
  );
}