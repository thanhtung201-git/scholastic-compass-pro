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

export const Route = createFileRoute("/_app/attendance-tracking")({
  component: AttendanceTrackingPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceTracking = {
  id: string | number;
  employee_id: string | number;
  date: string;
  check_in: string | null;   // matches DB column name
  check_out: string | null;  // matches DB column name
  status: string;
  notes: string | null;      // matches DB column name
  employee: { full_name: string } | null;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  PRESENT: {
    label: "PRESENT",
    classes: "bg-green-100 text-green-700 border border-green-300",
  },
  LATE: {
    label: "LATE",
    classes: "bg-orange-100 text-orange-600 border border-orange-300",
  },
  ABSENT: {
    label: "ABSENT",
    classes: "bg-red-100 text-red-700 border border-red-300",
  },
  LEAVE: {
    label: "LEAVE",
    classes: "bg-blue-100 text-blue-600 border border-blue-300",
  },
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase();
  const config = STATUS_MAP[key] ?? {
    label: status,
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

// ─── Format time ─────────────────────────────────────────────────────────────

function formatTime(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5); // "HH:MM:SS" → "HH:MM"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AttendanceTrackingPage() {
  const [records, setRecords] = useState<AttendanceTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(todayStr);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("attendance_tracking")
        .select(`
          id,
          employee_id,
          date,
          check_in,
          check_out,
          status,
          notes,
          employee:employee_id ( full_name )
        `)
        .eq("date", filterDate)
        .order("check_in", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      // Normalise joined employee (Supabase may return array or object)
      const normalised: AttendanceTracking[] = (data ?? []).map((row: any) => ({
        ...row,
        employee: Array.isArray(row.employee) ? row.employee[0] ?? null : row.employee,
      }));

      setRecords(normalised);
      setLoading(false);
    }

    fetchData();
  }, [filterDate]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4">
      {/* Header + date filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Attendance Tracking"
          description="Daily check-in / check-out records"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-4 text-center text-destructive">
          Failed to load attendance records: {error}
        </Card>
      ) : records.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          No attendance records found for {filterDate}.
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Giáo viên / Cán bộ</TableHead>
                <TableHead className="font-semibold">Ngày điểm danh</TableHead>
                <TableHead className="font-semibold">Nút check-in</TableHead>
                <TableHead className="font-semibold">Nút check-out</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-gray-800">
                    {r.employee?.full_name ?? `Unknown (ID: ${r.employee_id})`}
                  </TableCell>
                  <TableCell className="text-gray-600">{r.date}</TableCell>
                  <TableCell>
                    <span className="font-bold text-emerald-600">
                      {formatTime(r.check_in)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-blue-600">
                      {formatTime(r.check_out)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-gray-500 italic">
                    {r.notes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}