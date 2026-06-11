import { createFileRoute } from "@tanstack/react-router";
import { GuideButton } from "@/components/guide-button";
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
import { Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/employees")({
  component: EmployeesPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Employee = {
  id: string | number;
  full_name: string;
  role: string;
  department: string;
  phone_number: string;
  start_date: string;
  base_salary: number | null;
  bonus_salary: number | null;
};

type EmployeeDetail = {
  full_name: string;
  phone_number: string;
  email: string;
  department: string;
  role: string;
  contract_type: string;
  base_salary: number | string;
  bonus_salary: number | string;
  start_date: string;
  status: string;
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  employeeId,
  onClose,
}: {
  employeeId: string | number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);

      const { data: emp, error: empErr } = await supabase
        .from("employee")
        .select(
          "full_name, phone_number, department, role, contract_type, base_salary, bonus_salary, start_date, status, user_id"
        )
        .eq("id", employeeId)
        .single();

      if (empErr || !emp) {
        setError(empErr?.message ?? "Employee not found");
        setLoading(false);
        return;
      }

      let email = "—";
      if (emp.user_id) {
        const { data: user } = await supabase
          .from("users")
          .select("email")
          .eq("id", emp.user_id)
          .single();
        if (user?.email) email = user.email;
      }

      setDetail({
        full_name: emp.full_name ?? "—",
        phone_number: emp.phone_number ?? "—",
        email,
        department: emp.department ?? "—",
        role: emp.role ?? "—",
        contract_type: emp.contract_type ?? "—",
        base_salary: emp.base_salary != null ? emp.base_salary : "—",
        bonus_salary: emp.bonus_salary != null ? emp.bonus_salary : "—",
        start_date: emp.start_date ?? "—",
        status: emp.status ?? "—",
      });

      setLoading(false);
    }

    fetchDetail();
  }, [employeeId]);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-700">
            Hồ Sơ Nhân Viên
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : detail ? (
            <dl className="divide-y divide-gray-100">
              {(
                [
                  ["Họ và Tên", detail.full_name, true],
                  ["Email liên lạc", detail.email, false],
                  ["Số Điện thoại", detail.phone_number, false],
                  ["Bộ phận", detail.department, true],
                  ["Chức vụ", detail.role, false],
                  ["Loại hợp đồng", detail.contract_type, false],
                  [
                    "Lương cơ bản",
                    typeof detail.base_salary === "number"
                      ? detail.base_salary.toLocaleString("vi-VN") + " ₫"
                      : detail.base_salary,
                    false,
                  ],
                  ["Lương thưởng", typeof detail.bonus_salary === "number" ? detail.bonus_salary.toLocaleString("vi-VN") + " ₫" : detail.bonus_salary, false],
                  ["Trạng thái", detail.status, false],
                ] as [string, string, boolean][]
              ).map(([label, value, highlight]) => (
                <div key={label} className="flex items-center gap-4 py-3">
                  <dt className="w-44 shrink-0 text-sm text-gray-500">{label}:</dt>
                  <dd className={`text-sm font-medium ${highlight ? "text-gray-900" : "text-gray-700"}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  totalCount,
  filteredCount,
  avgSalary,
}: {
  totalCount: number;
  filteredCount: number;
  avgSalary: number | null;
}) {
  const avgFormatted =
    avgSalary != null
      ? `~${(avgSalary / 1_000_000).toFixed(1)}M ₫`
      : "—";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 rounded-lg border border-gray-200 bg-white px-2 py-3">
      {/* Total */}
      <div className="px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Total Employees
        </p>
        <p className="mt-1 text-base font-bold text-gray-900">
          {totalCount} employees
        </p>
      </div>

      {/* Filtered */}
      <div className="px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Currently Shown
        </p>
        <p className="mt-1 text-base font-bold text-blue-500">
          {filteredCount} employees
        </p>
      </div>

      {/* Avg salary */}
      <div className="px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Avg. Monthly Salary
        </p>
        <p className="mt-1 text-base font-bold text-emerald-600">{avgFormatted}</p>
      </div>

      {/* Insurance note */}
      <div className="px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Insurance & Income Tax
        </p>
        <p className="mt-1 text-base font-bold text-purple-600">Auto deducted</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function EmployeesPage() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  // Pagination
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  // Search & filter
  const [search, setSearch]           = useState("");
  const [deptFilter, setDeptFilter]   = useState("ALL");
  const [departments, setDepartments] = useState<string[]>([]);

  // Stats
  const [totalCount, setTotalCount]   = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [avgSalary, setAvgSalary]     = useState<number | null>(null);

  // ── Fetch departments once ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDepts() {
      const { data } = await supabase
        .from("employee")
        .select("department")
        .order("department");
      if (data) {
        const unique = [...new Set(data.map((r: any) => r.department).filter(Boolean))];
        setDepartments(unique as string[]);
      }
    }
    fetchDepts();
  }, []);

  // ── Fetch total count (unfiltered) once ─────────────────────────────────
  useEffect(() => {
    async function fetchTotalCount() {
      const { count } = await supabase
        .from("employee")
        .select("*", { count: "exact", head: true });
      setTotalCount(count ?? 0);
    }
    fetchTotalCount();
  }, []);

  // ── Fetch employees (paginated + filtered) ────────────────────────────────
  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to   = from + pageSize - 1;

      let query = supabase
        .from("employee")
        .select("id, full_name, role, department, phone_number, start_date, base_salary, bonus_salary", { count: "exact" })
        .order("full_name", { ascending: true })
        .range(from, to);

      if (search.trim()) {
        query = query.or(
          `full_name.ilike.%${search.trim()}%,phone_number.ilike.%${search.trim()}%`
        );
      }
      if (deptFilter !== "ALL") {
        query = query.eq("department", deptFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setEmployees(data ?? []);
      setFilteredCount(count ?? 0);
      setTotalPages(Math.ceil((count ?? 0) / pageSize) || 1);

      // ── Avg salary for current filter (no pagination range) ──────────────
      let salaryQuery = supabase
        .from("employee")
        .select("base_salary, bonus_salary");
      if (search.trim()) {
        salaryQuery = salaryQuery.or(
          `full_name.ilike.%${search.trim()}%,phone_number.ilike.%${search.trim()}%`
        );
      }
      if (deptFilter !== "ALL") {
        salaryQuery = salaryQuery.eq("department", deptFilter);
      }
      const { data: salaryData } = await salaryQuery;
      if (salaryData && salaryData.length > 0) {
        const vals = salaryData
          .map((r: any) => Number(r.base_salary) + Number(r.bonus_salary))
          .filter((v: number) => !isNaN(v) && v > 0);
        setAvgSalary(vals.length > 0
          ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length
          : null
        );
      } else {
        setAvgSalary(null);
      }

      setLoading(false);
    }

    fetchEmployees();
  }, [page, search, deptFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, deptFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4">

      {/* ── Top header row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-bold uppercase tracking-wide text-gray-800">
          Employee Profiles
        </h1>
        <GuideButton />
      </div>

      {/* ── Search + Department filter ── */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* ── Stats bar ── */}
      <StatsBar
        totalCount={totalCount}
        filteredCount={filteredCount}
        avgSalary={avgSalary}
      />

      {/* ── Table ── */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="p-4 text-center text-destructive">
          Failed to load employees: {error}
        </Card>
      ) : employees.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          No employees found.
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Salary</TableHead>
                <TableHead className="text-center">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.full_name}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>{e.phone_number}</TableCell>
                  <TableCell className="font-medium" title="Total Salary">{e.base_salary != null && e.bonus_salary != null ? (Number(e.base_salary) + Number(e.bonus_salary)).toLocaleString("vi-VN") + " ₫" : "—"}</TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      Detail
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Detail modal */}
      {selectedId !== null && (
        <DetailModal
          employeeId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}