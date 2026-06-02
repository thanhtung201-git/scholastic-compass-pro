import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Upload,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_app/accounting/expenses")({
  component: CashVoucherPage,
});

type VoucherType = "Thu" | "Chi";
type VoucherStatus = "Draft" | "Posted" | "Cancelled";
type SourceType = "manual" | "expense" | "payroll" | "marketing";

type CashVoucher = {
  id: string;
  voucher_number: string;
  voucher_type: VoucherType;
  voucher_date: string;
  payer_payee_name: string;
  address: string | null;
  reason: string;
  amount: number;
  amount_in_words: string | null;
  debit_account: string;
  credit_account: string;
  department: string | null;
  created_by: string | null;
  ref_expense_id: string | null;
  ref_payroll_id: string | null;
  ref_campaign_id: string | null;
  file_url: string | null;
  status: VoucherStatus;
  created_at: string;
};

type VoucherForm = {
  voucher_number: string;
  voucher_type: VoucherType;
  voucher_date: string;
  source_type: SourceType;
  source_id: string;
  payer_payee_name: string;
  address: string;
  reason: string;
  amount: string;
  amount_in_words: string;
  debit_account: string;
  credit_account: string;
  department: string;
  file_url: string;
  ref_expense_id: string | null;
  ref_payroll_id: string | null;
  ref_campaign_id: string | null;
};

type ImportRow = {
  rowNumber: number;
  voucher_type: string;
  voucher_date: string;
  payer_payee_name: string;
  reason: string;
  amount: number;
  debit_account: string;
  credit_account: string;
  department: string;
  errors: string[];
};

const today = () => new Date().toISOString().slice(0, 10);

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

const formatPlainVND = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value || 0);

const parseMoney = (value: string | number) => Number(String(value || "0").replace(/[^\d]/g, ""));

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string | null) => Boolean(value && uuidPattern.test(value));

const statusTone: Record<VoucherStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-muted-foreground/20",
  Posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const typeTone: Record<VoucherType, string> = {
  Thu: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Chi: "bg-red-50 text-red-700 border-red-200",
};

const commonAccounts: Record<VoucherType, { debit: string[]; credit: string[] }> = {
  Thu: { debit: ["111", "112"], credit: ["131", "511"] },
  Chi: { debit: ["331", "641", "642"], credit: ["111", "112"] },
};

function numberToVietnameseWords(input: number) {
  if (!input) return "Không đồng";

  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const units = ["", "nghìn", "triệu", "tỷ"];

  const readTriple = (num: number, full = false) => {
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const one = num % 10;
    const words: string[] = [];

    if (hundred > 0 || full) words.push(`${digits[hundred]} trăm`);
    if (ten > 1) {
      words.push(`${digits[ten]} mươi`);
      if (one === 1) words.push("mốt");
      else if (one === 5) words.push("lăm");
      else if (one > 0) words.push(digits[one]);
    } else if (ten === 1) {
      words.push("mười");
      if (one === 5) words.push("lăm");
      else if (one > 0) words.push(digits[one]);
    } else if (one > 0) {
      if (hundred > 0 || full) words.push("lẻ");
      words.push(one === 5 && (hundred > 0 || full) ? "năm" : digits[one]);
    }

    return words.join(" ");
  };

  const groups: number[] = [];
  let remaining = Math.floor(input);
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const group = groups[i];
    if (group === 0) continue;
    words.push(readTriple(group, i < groups.length - 1 && group < 100));
    if (units[i]) words.push(units[i]);
  }

  const text = words.join(" ").replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
}

function emptyForm(type: VoucherType, voucherNumber = ""): VoucherForm {
  return {
    voucher_number: voucherNumber,
    voucher_type: type,
    voucher_date: today(),
    source_type: "manual",
    source_id: "",
    payer_payee_name: "",
    address: "",
    reason: "",
    amount: "",
    amount_in_words: "",
    debit_account: type === "Thu" ? "111" : "642",
    credit_account: type === "Thu" ? "511" : "111",
    department: "",
    file_url: "",
    ref_expense_id: null,
    ref_payroll_id: null,
    ref_campaign_id: null,
  };
}

function CashVoucherPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payrollRows, setPayrollRows] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [typeFilter, setTypeFilter] = useState<"All" | VoucherType>("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | VoucherStatus>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<CashVoucher | null>(null);
  const [form, setForm] = useState<VoucherForm>(emptyForm("Thu"));
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importResult, setImportResult] = useState("");

  const [detailVoucher, setDetailVoucher] = useState<CashVoucher | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [voucherRes, expenseRes, payrollRes, campaignRes, departmentRes] = await Promise.all([
        supabase.from("cash_vouchers").select("*").order("voucher_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(200),
        supabase
          .from("payroll_receipt")
          .select("*, employee:employee_id(full_name, department)")
          .eq("payment_status", "Chờ chuyển")
          .limit(200),
        supabase.from("marketing_campaigns").select("*").limit(200),
        supabase.from("department").select("department_name").limit(200),
      ]);

      if (voucherRes.error) throw voucherRes.error;
      setVouchers((voucherRes.data || []) as CashVoucher[]);
      setExpenses(expenseRes.data || []);
      setPayrollRows(payrollRes.data || []);
      setCampaigns(campaignRes.data || []);
      setDepartments((departmentRes.data || []).map((d: any) => d.department_name).filter(Boolean));
    } catch (error: any) {
      toast.error(`Không tải được dữ liệu phiếu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      if (typeFilter !== "All" && voucher.voucher_type !== typeFilter) return false;
      if (departmentFilter !== "All" && voucher.department !== departmentFilter) return false;
      if (statusFilter !== "All" && voucher.status !== statusFilter) return false;
      if (dateFrom && voucher.voucher_date < dateFrom) return false;
      if (dateTo && voucher.voucher_date > dateTo) return false;
      return true;
    });
  }, [dateFrom, dateTo, departmentFilter, statusFilter, typeFilter, vouchers]);

  const generateVoucherNumber = (type: VoucherType, dateValue = today(), offset = 0) => {
    const year = new Date(dateValue).getFullYear();
    const prefix = type === "Thu" ? "PT" : "PC";
    const sameYear = vouchers.filter((voucher) => {
      return voucher.voucher_type === type && new Date(voucher.voucher_date).getFullYear() === year;
    });
    return `${prefix}-${year}-${String(sameYear.length + 1 + offset).padStart(3, "0")}`;
  };

  const updateForm = (patch: Partial<VoucherForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      const amount = parseMoney(next.amount);
      next.amount = amount ? formatPlainVND(amount) : "";
      next.amount_in_words = amount ? numberToVietnameseWords(amount) : "";
      return next;
    });
  };

  const openCreate = (type: VoucherType) => {
    setEditingVoucher(null);
    setUploadFile(null);
    setSourceSearch("");
    setForm(emptyForm(type, generateVoucherNumber(type)));
    setFormOpen(true);
  };

  const openEdit = (voucher: CashVoucher) => {
    setEditingVoucher(voucher);
    setUploadFile(null);
    setForm({
      voucher_number: voucher.voucher_number,
      voucher_type: voucher.voucher_type,
      voucher_date: voucher.voucher_date,
      source_type: voucher.ref_expense_id ? "expense" : voucher.ref_payroll_id ? "payroll" : voucher.ref_campaign_id ? "marketing" : "manual",
      source_id: voucher.ref_expense_id || voucher.ref_payroll_id || voucher.ref_campaign_id || "",
      payer_payee_name: voucher.payer_payee_name || "",
      address: voucher.address || "",
      reason: voucher.reason || "",
      amount: formatPlainVND(Number(voucher.amount || 0)),
      amount_in_words: voucher.amount_in_words || numberToVietnameseWords(Number(voucher.amount || 0)),
      debit_account: voucher.debit_account || "",
      credit_account: voucher.credit_account || "",
      department: voucher.department || "",
      file_url: voucher.file_url || "",
      ref_expense_id: voucher.ref_expense_id,
      ref_payroll_id: voucher.ref_payroll_id,
      ref_campaign_id: voucher.ref_campaign_id,
    });
    setFormOpen(true);
  };

  const sourceOptions = useMemo(() => {
    const query = sourceSearch.toLowerCase();
    if (form.source_type === "expense") {
      return expenses
        .filter((row) => `${row.description || ""} ${row.amount || ""} ${row.expense_date || ""}`.toLowerCase().includes(query))
        .slice(0, 40);
    }
    if (form.source_type === "payroll") {
      return payrollRows
        .filter((row) => `${row.employee?.full_name || ""} ${row.period_month || ""}/${row.period_year || ""}`.toLowerCase().includes(query))
        .slice(0, 40);
    }
    if (form.source_type === "marketing") {
      return campaigns.filter((row) => `${row.name || ""} ${row.status || ""}`.toLowerCase().includes(query)).slice(0, 40);
    }
    return [];
  }, [campaigns, expenses, form.source_type, payrollRows, sourceSearch]);

  const selectSource = (id: string) => {
    if (form.source_type === "expense") {
      const row = expenses.find((item) => item.id === id);
      if (!row) return;
      updateForm({
        source_id: id,
        amount: String(row.amount || ""),
        reason: row.description || row.category || "",
        ref_expense_id: id,
        ref_payroll_id: null,
        ref_campaign_id: null,
      });
    }
    if (form.source_type === "payroll") {
      const row = payrollRows.find((item) => item.receipt_id === id);
      if (!row) return;
      const fullName = row.employee?.full_name || "Nhân viên";
      updateForm({
        source_id: id,
        amount: String(row.net_salary || ""),
        payer_payee_name: fullName,
        department: row.employee?.department || form.department,
        reason: `Lương tháng ${row.period_month}/${row.period_year} - ${fullName}`,
        ref_expense_id: null,
        ref_payroll_id: id,
        ref_campaign_id: null,
      });
    }
    if (form.source_type === "marketing") {
      const row = campaigns.find((item) => item.id === id);
      if (!row) return;
      updateForm({
        source_id: id,
        amount: String(row.spent || row.budget || ""),
        reason: row.name || "",
        ref_expense_id: null,
        ref_payroll_id: null,
        ref_campaign_id: id,
      });
    }
  };

  const uploadAttachment = async (voucherNumber: string) => {
    if (!uploadFile) return form.file_url || null;
    const path = `${voucherNumber}/${Date.now()}-${uploadFile.name}`;
    const { error } = await supabase.storage.from("vouchers").upload(path, uploadFile, {
      contentType: uploadFile.type,
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("vouchers").getPublicUrl(path);
    return data.publicUrl;
  };

  const getCreatedById = async () => {
    if (isUuid(user?.id)) return user!.id;
    const { data } = await supabase.auth.getUser();
    return isUuid(data.user?.id) ? data.user.id : null;
  };

  const postVoucher = async (voucher: CashVoucher) => {
    let journalInserted = false;
    try {
      const entries = [
        {
          voucher_id: voucher.id,
          entry_date: voucher.voucher_date,
          account_code: voucher.debit_account,
          account_name: voucher.debit_account,
          debit_amount: Number(voucher.amount),
          credit_amount: 0,
          description: voucher.reason,
        },
        {
          voucher_id: voucher.id,
          entry_date: voucher.voucher_date,
          account_code: voucher.credit_account,
          account_name: voucher.credit_account,
          debit_amount: 0,
          credit_amount: Number(voucher.amount),
          description: voucher.reason,
        },
      ];
      const journalRes = await supabase.from("journal_entries").insert(entries);
      if (journalRes.error) throw journalRes.error;
      journalInserted = true;

      if (voucher.ref_payroll_id) {
        const { error } = await supabase.from("payroll_receipt").update({ payment_status: "Đã chi" }).eq("receipt_id", voucher.ref_payroll_id);
        if (error) throw error;
      }
      if (voucher.ref_campaign_id) {
        const current = campaigns.find((campaign) => campaign.id === voucher.ref_campaign_id);
        const nextSpent = Number(current?.spent || 0) + Number(voucher.amount || 0);
        const { error } = await supabase.from("marketing_campaigns").update({ spent: nextSpent }).eq("id", voucher.ref_campaign_id);
        if (error) throw error;
      }

      const { data, error } = await supabase.from("cash_vouchers").update({ status: "Posted" }).eq("id", voucher.id).select("*").single();
      if (error) throw error;
      setVouchers((prev) => prev.map((row) => (row.id === voucher.id ? (data as CashVoucher) : row)));
      toast.success("Đã duyệt phiếu và ghi bút toán.");
    } catch (error: any) {
      if (journalInserted) await supabase.from("journal_entries").delete().eq("voucher_id", voucher.id);
      await supabase.from("cash_vouchers").update({ status: "Draft" }).eq("id", voucher.id);
      toast.error(`Duyệt phiếu thất bại: ${error.message}`);
      throw error;
    }
  };

  const saveVoucher = async (postAfterSave: boolean) => {
    const amount = parseMoney(form.amount);
    if (!form.reason.trim()) return toast.error("Vui lòng nhập lý do thu/chi.");
    if (!amount) return toast.error("Vui lòng nhập số tiền hợp lệ.");
    if (!form.debit_account || !form.credit_account) return toast.error("Vui lòng nhập tài khoản Nợ/Có.");

    setSubmitting(true);
    try {
      const createdById = await getCreatedById();
      const fileUrl = await uploadAttachment(form.voucher_number);
      const payload = {
        voucher_number: form.voucher_number,
        voucher_type: form.voucher_type,
        voucher_date: form.voucher_date,
        payer_payee_name: form.payer_payee_name,
        address: form.address,
        reason: form.reason,
        amount,
        amount_in_words: form.amount_in_words,
        debit_account: form.debit_account,
        credit_account: form.credit_account,
        department: form.department || null,
        created_by: createdById,
        ref_expense_id: form.ref_expense_id,
        ref_payroll_id: form.ref_payroll_id,
        ref_campaign_id: form.ref_campaign_id,
        file_url: fileUrl,
        status: "Draft" as VoucherStatus,
      };

      const query = editingVoucher
        ? supabase.from("cash_vouchers").update(payload).eq("id", editingVoucher.id).select("*").single()
        : supabase.from("cash_vouchers").insert([payload]).select("*").single();

      const { data, error } = await query;
      if (error) throw error;

      const saved = data as CashVoucher;
      setVouchers((prev) => (editingVoucher ? prev.map((row) => (row.id === saved.id ? saved : row)) : [saved, ...prev]));
      if (postAfterSave) await postVoucher(saved);
      else toast.success("Đã lưu nháp phiếu.");
      setFormOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(`Không lưu được phiếu: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelVoucher = async (voucher: CashVoucher) => {
    if (!confirm(`Huỷ ${voucher.voucher_number}?`)) return;
    const { data, error } = await supabase.from("cash_vouchers").update({ status: "Cancelled" }).eq("id", voucher.id).select("*").single();
    if (error) return toast.error(`Không huỷ được phiếu: ${error.message}`);
    setVouchers((prev) => prev.map((row) => (row.id === voucher.id ? (data as CashVoucher) : row)));
    toast.success("Đã huỷ phiếu.");
  };

  const exportCSV = () => {
    const headers = ["Số phiếu", "Ngày", "Loại", "Lý do", "Người nộp/nhận", "Số tiền", "Tài khoản Nợ", "Tài khoản Có", "Trạng thái"];
    const rows = filteredVouchers.map((voucher) => [
      voucher.voucher_number,
      voucher.voucher_date,
      voucher.voucher_type,
      voucher.reason,
      voucher.payer_payee_name,
      voucher.amount,
      voucher.debit_account,
      voucher.credit_account,
      voucher.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(csv)}`;
    link.download = "cash-vouchers.csv";
    link.click();
  };

  const parseExcelDate = (value: any, xlsx: typeof import("xlsx")) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      const parsed = xlsx.SSF.parse_date_code(value);
      if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportResult("");
    const xlsx = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    const parsed = rawRows.map((row, index) => {
      const date = parseExcelDate(row.voucher_date, xlsx);
      const amount = Number(row.amount);
      const errors = [
        row.voucher_type === "Thu" || row.voucher_type === "Chi" ? "" : "voucher_type phải là Thu hoặc Chi",
        date ? "" : "voucher_date không hợp lệ",
        amount > 0 ? "" : "amount phải lớn hơn 0",
      ].filter(Boolean);
      return {
        rowNumber: index + 2,
        voucher_type: row.voucher_type,
        voucher_date: date,
        payer_payee_name: row.payer_payee_name,
        reason: row.reason,
        amount,
        debit_account: row.debit_account,
        credit_account: row.credit_account,
        department: row.department,
        errors,
      };
    });
    setImportRows(parsed);
  };

  const confirmImport = async () => {
    const validRows = importRows.filter((row) => row.errors.length === 0);
    if (!validRows.length) return toast.error("Không có dòng hợp lệ để import.");
    const counters: Record<string, number> = {};
    const createdById = await getCreatedById();
    const payload = validRows.map((row) => {
      const key = `${row.voucher_type}-${new Date(row.voucher_date).getFullYear()}`;
      counters[key] = (counters[key] || 0) + 1;
      return {
        voucher_number: generateVoucherNumber(row.voucher_type as VoucherType, row.voucher_date, counters[key] - 1),
        voucher_type: row.voucher_type,
        voucher_date: row.voucher_date,
        payer_payee_name: row.payer_payee_name,
        reason: row.reason,
        amount: row.amount,
        amount_in_words: numberToVietnameseWords(row.amount),
        debit_account: row.debit_account,
        credit_account: row.credit_account,
        department: row.department || null,
        created_by: createdById,
        status: "Draft",
      };
    });
    const { error } = await supabase.from("cash_vouchers").insert(payload);
    if (error) return toast.error(`Import thất bại: ${error.message}`);
    const invalidCount = importRows.length - validRows.length;
    setImportResult(`Đã import ${validRows.length} dòng. ${invalidCount} dòng lỗi.`);
    toast.success("Import Excel hoàn tất.");
    await loadData();
  };

  const downloadPdf = async () => {
    if (!printRef.current || !detailVoucher) return;
    const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const image = canvas.toDataURL("image/png");
    const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(image, "PNG", 0, 0, width, Math.min(height, pdf.internal.pageSize.getHeight()));
    pdf.save(`${detailVoucher.voucher_number}.pdf`);
  };

  const printVoucher = () => {
    if (!printRef.current) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(`<html><head><title>In phiếu</title><style>body{font-family:Arial,sans-serif;padding:24px}.voucher{width:148mm;margin:auto}.grid{display:grid}.signature{height:80px}</style></head><body>${printRef.current.innerHTML}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  if (loading && !vouchers.length) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Phiếu thu chi"
        description="Quản lý phiếu thu, phiếu chi, liên kết nguồn và bút toán kế toán."
        actions={
          <>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openCreate("Thu")}>
              <Plus className="mr-2 size-4" /> Tạo phiếu thu
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => openCreate("Chi")}>
              <Plus className="mr-2 size-4" /> Tạo phiếu chi
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as "All" | VoucherType)}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Thu">Phiếu Thu</TabsTrigger>
              <TabsTrigger value="Chi">Phiếu Chi</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả phòng ban</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>{department}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | VoucherStatus)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả trạng thái</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Posted">Posted</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-[160px]" />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-[160px]" />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="mr-2 size-4" /> Import Excel
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 size-4" /> Export CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số phiếu</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Người nộp/nhận</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Tài khoản Nợ/Có</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[170px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Chưa có phiếu phù hợp.</TableCell>
              </TableRow>
            ) : (
              filteredVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                  <TableCell>{voucher.voucher_date}</TableCell>
                  <TableCell><Badge className={typeTone[voucher.voucher_type]} variant="outline">{voucher.voucher_type}</Badge></TableCell>
                  <TableCell className="max-w-[260px] truncate">{voucher.reason}</TableCell>
                  <TableCell>{voucher.payer_payee_name}</TableCell>
                  <TableCell className="text-right font-medium">{formatVND(Number(voucher.amount))}</TableCell>
                  <TableCell>{voucher.debit_account} / {voucher.credit_account}</TableCell>
                  <TableCell><Badge className={statusTone[voucher.status]} variant="outline">{voucher.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setDetailVoucher(voucher)}><Eye className="size-4" /></Button>
                      {voucher.status === "Draft" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(voucher)}><Pencil className="size-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => postVoucher(voucher)}><CheckCircle2 className="size-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => cancelVoucher(voucher)}><XCircle className="size-4" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? "Sửa phiếu" : form.voucher_type === "Thu" ? "Tạo phiếu thu" : "Tạo phiếu chi"}</DialogTitle>
            <DialogDescription>Nhập thông tin phiếu và chọn nguồn liên kết nếu có.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Số phiếu</Label>
                  <Input value={form.voucher_number} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>Ngày lập phiếu</Label>
                  <Input type="date" value={form.voucher_date} onChange={(event) => updateForm({ voucher_date: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nguồn gốc</Label>
                  <Select value={form.source_type} onValueChange={(value) => updateForm({ source_type: value as SourceType, source_id: "", ref_expense_id: null, ref_payroll_id: null, ref_campaign_id: null })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Thủ công</SelectItem>
                      <SelectItem value="expense">Từ chi phí (expenses)</SelectItem>
                      <SelectItem value="payroll">Từ lương (payroll)</SelectItem>
                      <SelectItem value="marketing">Từ marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.source_type !== "manual" && (
                  <div className="grid gap-2">
                    <Label>Chọn nguồn</Label>
                    <Input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} placeholder="Tìm theo tên, ngày hoặc số tiền..." className="mb-2" />
                    <Select value={form.source_id} onValueChange={selectSource}>
                      <SelectTrigger><SelectValue placeholder="Chọn bản ghi" /></SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((row) => {
                          const id = form.source_type === "payroll" ? row.receipt_id : row.id;
                          const label =
                            form.source_type === "expense"
                              ? `${row.expense_date} - ${formatVND(Number(row.amount || 0))} - ${row.description || row.category || ""}`
                              : form.source_type === "payroll"
                                ? `${row.employee?.full_name || "Nhân viên"} - ${row.period_month}/${row.period_year} - ${formatVND(Number(row.net_salary || 0))}`
                                : `${row.name} - ${formatVND(Number(row.spent || row.budget || 0))}`;
                          return <SelectItem key={id} value={id}>{label}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{form.voucher_type === "Thu" ? "Người nộp" : "Người nhận"}</Label>
                  <Input value={form.payer_payee_name} onChange={(event) => updateForm({ payer_payee_name: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Địa chỉ</Label>
                  <Input value={form.address} onChange={(event) => updateForm({ address: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Lý do thu/chi *</Label>
                <Textarea value={form.reason} onChange={(event) => updateForm({ reason: event.target.value })} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Số tiền *</Label>
                  <Input inputMode="numeric" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Phòng ban</Label>
                  <Select value={form.department || "none"} onValueChange={(value) => updateForm({ department: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      {departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Số tiền bằng chữ</Label>
                <Input value={form.amount_in_words} readOnly />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AccountInput label="Tài khoản Nợ" value={form.debit_account} options={commonAccounts[form.voucher_type].debit} onChange={(value) => updateForm({ debit_account: value })} />
                <AccountInput label="Tài khoản Có" value={form.credit_account} options={commonAccounts[form.voucher_type].credit} onChange={(value) => updateForm({ credit_account: value })} />
              </div>
            </div>

            <Card className="space-y-4 p-4">
              <div className="grid gap-2">
                <Label>Đính kèm file</Label>
                <Input accept="image/*,application/pdf" type="file" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
                {uploadFile?.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(uploadFile)} alt="Voucher attachment preview" className="h-40 w-full rounded-md border object-cover" />
                )}
                {!uploadFile && form.file_url && (
                  <a className="text-sm text-primary underline" href={form.file_url} target="_blank" rel="noreferrer">Xem file hiện tại</a>
                )}
              </div>
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Gợi ý tài khoản</div>
                <div className="mt-2">Phiếu Thu: Nợ 111/112, Có 131/511</div>
                <div>Phiếu Chi: Nợ 331/641/642, Có 111/112</div>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Huỷ</Button>
            <Button variant="secondary" disabled={submitting} onClick={() => saveVoucher(false)}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Lưu nháp
            </Button>
            <Button disabled={submitting} onClick={() => saveVoucher(true)}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Lưu và duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Excel</DialogTitle>
            <DialogDescription>File .xlsx cần có các cột: voucher_type, voucher_date, payer_payee_name, reason, amount, debit_account, credit_account, department.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
            <Input type="file" accept=".xlsx" onChange={(event) => handleImportFile(event.target.files?.[0])} />
          </div>
          {importRows.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dòng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRows.map((row) => (
                    <TableRow key={row.rowNumber} className={row.errors.length ? "bg-red-50" : ""}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.voucher_type}</TableCell>
                      <TableCell>{row.voucher_date}</TableCell>
                      <TableCell>{row.reason}</TableCell>
                      <TableCell>{formatVND(row.amount)}</TableCell>
                      <TableCell className="text-red-700">{row.errors.join("; ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {importResult && <div className="text-sm text-muted-foreground">{importResult}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Đóng</Button>
            <Button onClick={confirmImport} disabled={!importRows.length}>Xác nhận import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailVoucher)} onOpenChange={(open) => !open && setDetailVoucher(null)}>
        <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu</DialogTitle>
          </DialogHeader>
          {detailVoucher && (
            <div ref={printRef} className="voucher mx-auto w-full max-w-[148mm] bg-white p-6 text-black">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="text-sm font-semibold uppercase">School ERP</div>
                  <div className="text-xs">Phiếu kế toán nội bộ</div>
                </div>
                <div className="text-right text-sm">
                  <div>Số phiếu: <strong>{detailVoucher.voucher_number}</strong></div>
                  <div>Ngày lập: {detailVoucher.voucher_date}</div>
                </div>
              </div>
              <h2 className="my-6 text-center text-2xl font-bold">{detailVoucher.voucher_type === "Thu" ? "PHIẾU THU" : "PHIẾU CHI"}</h2>
              <div className="divide-y rounded-md border text-sm">
                {[
                  ["Người nộp/nhận tiền", detailVoucher.payer_payee_name],
                  ["Địa chỉ", detailVoucher.address || ""],
                  ["Lý do thu/chi", detailVoucher.reason],
                  ["Số tiền", `${formatPlainVND(Number(detailVoucher.amount))} đồng`],
                  ["Bằng chữ", detailVoucher.amount_in_words || numberToVietnameseWords(Number(detailVoucher.amount))],
                  ["Tài khoản Nợ", detailVoucher.debit_account],
                  ["Tài khoản Có", detailVoucher.credit_account],
                  ["Kèm theo", detailVoucher.file_url ? "Có file đính kèm" : "Không"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[150px_1fr]">
                    <div className="border-r bg-gray-50 p-2 font-medium">{label}</div>
                    <div className="p-2">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-10 grid grid-cols-4 gap-3 text-center text-sm">
                {["Người lập phiếu", "Kế toán trưởng", "Thủ quỹ", "Người nộp/nhận"].map((label) => (
                  <div key={label}>
                    <div className="font-semibold">{label}</div>
                    <div className="signature h-20" />
                    <div className="text-xs italic">(Ký, họ tên)</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailVoucher(null)}>Đóng</Button>
            <Button variant="outline" onClick={printVoucher}><Printer className="mr-2 size-4" /> In phiếu</Button>
            <Button onClick={downloadPdf}><FileDown className="mr-2 size-4" /> Tải PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
        <Select value={value || "custom"} onValueChange={onChange}>
          <SelectTrigger className="w-[96px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Mã</SelectItem>
            {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
