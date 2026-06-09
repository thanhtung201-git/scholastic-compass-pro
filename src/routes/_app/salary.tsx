import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/salary")({ component: SalaryRoute });

function SalaryRoute() {
  const { user } = useAuth();
  if (!user || !["Finance Manager", "Accountant", "Admin", "Director"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  return <SalaryPage />;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PayrollRow {
  receipt_id:    string;
  employee_id:   string;
  full_name:     string;
  email:         string;
  period_month:  number;
  period_year:   number;
  gross_salary:  number;
  insurance:     number;
  tax:           number;
  net_salary:    number;
  payment_status: "Chờ chuyển" | "Đã chi" | "Tạm hoãn";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtVND = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";
const periodLabel = (month: number, year: number) => `${String(month).padStart(2, "0")}/${year}`;

// ── Data layer ────────────────────────────────────────────────────────────────
async function fetchReceipts(month: number, year: number): Promise<PayrollRow[]> {
  const { data, error } = await supabase
    .from("payroll_receipt")
    .select(`
      receipt_id, employee_id, period_month, period_year,
      gross_salary, insurance, tax, net_salary, payment_status,
      employee:employee_id (
        full_name, user_id,
        users:user_id ( email )
      )
    `)
    .eq("period_month", month)
    .eq("period_year", year)
    .order("created_at", { ascending: true });

  if (error) { console.error("fetchReceipts:", error); return []; }

  return (data ?? []).map((r: any) => ({
    receipt_id:    r.receipt_id,
    employee_id:   r.employee_id,
    full_name:     r.employee?.full_name ?? "—",
    email:         r.employee?.users?.email ?? "",
    period_month:  r.period_month,
    period_year:   r.period_year,
    gross_salary:  Number(r.gross_salary),
    insurance:     Number(r.insurance),
    tax:           Number(r.tax),
    net_salary:    Number(r.net_salary),
    payment_status: r.payment_status,
  }));
}

async function generateReceipts(month: number, year: number): Promise<number> {
  const { data: employees, error: empErr } = await supabase
    .from("employee").select("id").eq("status", "Active");
  if (empErr || !employees) return 0;

  const { data: existing } = await supabase
    .from("payroll_receipt").select("employee_id")
    .eq("period_month", month).eq("period_year", year);

  const existingIds = new Set((existing ?? []).map((r: any) => r.employee_id));
  const toInsert = employees
    .filter((e: any) => !existingIds.has(e.id))
    .map((e: any) => ({
      employee_id: e.id, period_month: month, period_year: year,
      gross_salary: 0, insurance: 0, tax: 0, net_salary: 0,
    }));

  if (toInsert.length === 0) return 0;
  const { error } = await supabase.from("payroll_receipt").insert(toInsert);
  if (error) { console.error("generateReceipts:", error); return 0; }
  return toInsert.length;
}

async function approveReceipt(receiptId: string): Promise<boolean> {
  const { error } = await supabase
    .from("payroll_receipt")
    .update({ payment_status: "Đã chi", approved_at: new Date().toISOString() })
    .eq("receipt_id", receiptId);
  return !error;
}

// ── Send payslip email via Edge Function ──────────────────────────────────────
async function sendPayslipEmail(row: PayrollRow): Promise<{ ok: boolean; message: string }> {
  if (!row.email) {
    return { ok: false, message: `Nhân viên ${row.full_name} chưa có email trong hệ thống.` };
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-payslip-smtp", {
      body: {
        to_email:     row.email,
        full_name:    row.full_name,
        employee_id:  row.employee_id,
        period_month: row.period_month,
        period_year:  row.period_year,
        gross_salary: row.gross_salary,
        insurance:    row.insurance,
        tax:          row.tax,
        net_salary:   row.net_salary,
      },
    });

    if (error) return { ok: false, message: `Gửi email thất bại: ${error.message}` };
    return { ok: true, message: `✅ Đã gửi phiếu lương tới ${row.email}` };
  } catch (err: any) {
    return { ok: false, message: `Lỗi: ${err.message}` };
  }
}

// ── Payslip Modal ─────────────────────────────────────────────────────────────
function PayslipModal({ row, onClose }: { row: PayrollRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Xem Phiếu Lương Trực Quan A4
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              In phiếu chi / PDF
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            >×</button>
          </div>
        </div>

        <div id="payslip-print" className="px-10 py-8">
          <div className="text-center mb-7">
            <p className="text-[15px] font-extrabold tracking-[0.18em] text-gray-900 uppercase">MCNA Technology School</p>
            <p className="text-[10px] tracking-[0.3em] text-blue-500 font-semibold mt-0.5 uppercase">Khoa học · Công nghệ · Kỹ thuật</p>
            <p className="text-[11px] text-gray-400 mt-1">Cầu Giấy, Hà Nội &bull; Hotline: 1900-xxxx</p>
            <div className="mt-3 mx-auto w-12 border-b-2 border-blue-400 rounded-full" />
          </div>

          <div className="text-center mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-gray-800">Phiếu Chi Lương &amp; Giờ Thỉnh Giảng</p>
            <p className="text-xs text-gray-400 mt-1">Chu kỳ thanh toán: Tháng {periodLabel(row.period_month, row.period_year)}</p>
          </div>

          <div className="flex justify-between text-[13px] mb-6 pb-3 border-b border-dashed border-gray-200">
            <span className="text-gray-500">Mã Cán bộ: <span className="font-bold text-gray-800">{row.employee_id.slice(0, 8).toUpperCase()}</span></span>
            <span className="text-gray-500">Họ tên: <span className="font-bold text-gray-800">{row.full_name}</span></span>
          </div>

          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Mục Thu Nhập</p>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600">Lương Gross (Cơ bản + Thưởng):</span>
              <span className="font-semibold text-gray-900">{fmtVND(row.gross_salary)}</span>
            </div>
          </div>

          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Các Khoản Khấu Trừ</p>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600">Bảo hiểm (BHXH 8% + BHYT 1.5% + BHTN 1%):</span>
              <span className="font-semibold text-red-500">{fmtVND(row.insurance)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600">Thuế TNCN (Tính lũy tiến):</span>
              <span className="font-semibold text-red-500">{fmtVND(row.tax)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-800 flex justify-between items-center">
            <span className="text-sm font-extrabold text-blue-700 uppercase tracking-wide">Thực Lĩnh Chuyển Khoản (NET):</span>
            <span className="text-base font-extrabold text-blue-700">{fmtVND(row.net_salary)}</span>
          </div>

          <p className="text-center text-[10px] text-gray-300 mt-7">
            Phiếu lương đã ký số tự động bởi MCNA School ERP. Xin cảm ơn nỗ lực của thầy cô!
          </p>
        </div>
      </div>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #payslip-print { display: block !important; position: fixed; inset: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PayrollRow["payment_status"] }) {
  const cfg = {
    "Đã chi":     "bg-green-100 text-green-700 border-green-200",
    "Tạm hoãn":   "bg-gray-100 text-gray-500 border-gray-200",
    "Chờ chuyển": "bg-amber-50 text-amber-600 border-amber-300",
  }[status];
  return <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${cfg}`}>{status}</span>;
}

// ── Period picker ─────────────────────────────────────────────────────────────
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const PAGE_SIZE = 10;

// ── Main Page ─────────────────────────────────────────────────────────────────
function SalaryPage() {
  const now = new Date();
  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [year, setYear]             = useState(now.getFullYear());
  const [rows, setRows]             = useState<PayrollRow[]>([]);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [page, setPage]             = useState(1);
  const [selectedRow, setSelectedRow] = useState<PayrollRow | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const data = await fetchReceipts(month, year);
    setRows(data);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    const count = await generateReceipts(month, year);
    await loadData();
    setGenerating(false);
    showToast(
      count > 0
        ? `✅ Đã tạo ${count} phiếu lương mới cho ${periodLabel(month, year)}`
        : `ℹ️ Tất cả nhân viên đã có phiếu kỳ ${periodLabel(month, year)}`,
      count > 0 ? "success" : "info"
    );
  };

  // Duyệt chi + tự động gửi email
  const handleApprove = async (row: PayrollRow) => {
    if (row.payment_status === "Đã chi") return;
    setApprovingId(row.receipt_id);

    // 1. Cập nhật trạng thái trong DB
    const ok = await approveReceipt(row.receipt_id);
    if (!ok) {
      showToast("❌ Duyệt chi thất bại. Vui lòng thử lại.", "error");
      setApprovingId(null);
      return;
    }

    // 2. Cập nhật UI ngay
    setRows((prev) =>
      prev.map((r) => r.receipt_id === row.receipt_id ? { ...r, payment_status: "Đã chi" } : r)
    );
    showToast(`✅ Đã duyệt chi cho ${row.full_name}. Đang gửi email...`, "success");

    // 3. Gửi email phiếu lương
    const updatedRow = { ...row, payment_status: "Đã chi" as const };
    const emailResult = await sendPayslipEmail(updatedRow);
    showToast(
      emailResult.ok
        ? `📧 Đã gửi phiếu lương tới ${row.email}`
        : `⚠️ Duyệt chi thành công nhưng gửi email thất bại: ${emailResult.message}`,
      emailResult.ok ? "success" : "error"
    );

    setApprovingId(null);
  };

  const totalFund  = rows.reduce((s, r) => s + r.net_salary, 0);
  const totalPhieu = rows.length;
  const pending    = rows.filter((r) => r.payment_status === "Chờ chuyển").length;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated  = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toastColor = {
    success: "border-green-200 text-green-800",
    error:   "border-red-200 text-red-800",
    info:    "border-blue-200 text-blue-800",
  }[toast?.type ?? "info"];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] bg-white border shadow-xl rounded-xl px-5 py-3 text-sm max-w-sm animate-[fadeSlide_0.25s_ease] ${toastColor}`}>
          {toast.msg}
        </div>
      )}

      {selectedRow && <PayslipModal row={selectedRow} onClose={() => setSelectedRow(null)} />}

      <div className="max-w-[1300px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bảng Lương Và Cam Kết Academy</h1>
            <p className="text-sm text-gray-500 mt-0.5">Bảng quyết toán học phí quy đổi giờ thỉnh giảng</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400">
              {MONTHS.map((m) => <option key={m} value={m}>Tháng {String(m).padStart(2, "0")}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold shadow transition-all">
              {generating ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              )}
              Chạy bảng tính toán tự động
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng Định Mức Quỹ Lương</p>
            <p className="text-lg font-extrabold text-gray-900">~{(totalFund / 1e9).toFixed(2)} tỷ đ</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quyết Toán Quỹ</p>
            <p className="text-sm font-bold text-blue-600">Đã lập hồ sơ</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kênh Giao Dịch</p>
            <p className="text-sm font-bold text-green-600">API VietQR liên ngân hàng</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng Số Phiếu Phát Sinh</p>
            <p className="text-sm font-bold text-purple-600">{totalPhieu} phiếu chi</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Đang tải dữ liệu lương...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Cán bộ / Giáo thọ", "Chu kỳ", "Lương Gross", "Bảo hiểm (10.5%)", "Thuế TNCN", "Lương thực lĩnh", "Trạng thái", "", "Chứng từ"].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i === 0 ? "text-left" : i >= 6 ? "text-center" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400 text-sm">
                    Chưa có phiếu lương nào kỳ {periodLabel(month, year)}. Nhấn "Chạy bảng tính toán" để tạo mới.
                  </td></tr>
                ) : paginated.map((row) => (
                  <tr key={row.receipt_id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-800">{row.full_name}</div>
                      {row.email && <div className="text-[11px] text-gray-400 mt-0.5">{row.email}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-right text-blue-500 font-medium">{periodLabel(row.period_month, row.period_year)}</td>
                    <td className="px-4 py-3.5 text-right text-gray-800">{fmtVND(row.gross_salary)}</td>
                    <td className="px-4 py-3.5 text-right text-red-500 font-medium">{fmtVND(row.insurance)}</td>
                    <td className="px-4 py-3.5 text-right text-red-500 font-medium">{fmtVND(row.tax)}</td>
                    <td className="px-4 py-3.5 text-right text-blue-600 font-bold">{fmtVND(row.net_salary)}</td>
                    <td className="px-4 py-3.5 text-center"><StatusBadge status={row.payment_status} /></td>
                    <td className="px-2 py-3.5 text-center">
                      {row.payment_status !== "Đã chi" && (
                        <button
                          onClick={() => handleApprove(row)}
                          disabled={approvingId === row.receipt_id}
                          className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                        >
                          {approvingId === row.receipt_id ? (
                            <svg className="animate-spin inline" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          ) : "Duyệt chi"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedRow(row)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 hover:border-blue-400 hover:text-blue-600 text-gray-500 text-xs font-medium transition-colors"
                      >
                        Phiếu chi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && rows.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Đang xem {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} trong tổng số {rows.length} bản ghi
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-30">Trước</button>
                <span className="text-xs font-bold text-gray-700">Trang {page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-30">Sau</button>
              </div>
            </div>
          )}
        </div>

        {pending > 0 && (
          <p className="mt-3 text-xs text-amber-600 font-medium">
            ⚠ Còn {pending} phiếu chờ duyệt chi trong kỳ {periodLabel(month, year)}.
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          body > * { display: none !important; }
          #payslip-print { display: block !important; position: fixed; inset: 0; padding: 48px; }
        }
      `}</style>
    </div>
  );
}