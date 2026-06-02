import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { supabase } from "@/lib/supabase";
import { AlertTriangle, FileSpreadsheet, Loader2, Printer, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/accounting/balance-sheet")({
  component: BalanceSheetPage,
});

type PeriodMode = "month" | "quarter" | "year";
type Side = "asset" | "source";
type ReportLine = {
  code: string;
  label: string;
  current: number;
  previous: number;
  level?: 0 | 1 | 2;
  kind?: "group" | "total" | "normal";
};

type PeriodRange = {
  label: string;
  start: string;
  end: string;
  year: number;
  startMonth: number;
  endMonth: number;
};

type PeriodReport = {
  label: string;
  assets: ReportLine[];
  sources: ReportLine[];
  totalAssets: number;
  totalSources: number;
  difference: number;
  footer: {
    headcount: Record<string, number>;
    outstandingPayrollCount: number;
    activeCampaignRemaining: number;
    pendingPayroll: number;
  };
  raw: {
    journalEntries: any[];
    payroll: any[];
    expenses: any[];
  };
};

const formatVND = (value: number) => {
  const absolute = Math.abs(Math.round(value || 0));
  const formatted = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(absolute);
  return value < 0 ? `(${formatted}) đ` : `${formatted} đ`;
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const endOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

function makeRange(mode: PeriodMode, year: number, selectedMonth: number, selectedQuarter: number): PeriodRange {
  const startMonth = mode === "month" ? selectedMonth : mode === "quarter" ? (selectedQuarter - 1) * 3 + 1 : 1;
  const endMonth = mode === "month" ? selectedMonth : mode === "quarter" ? selectedQuarter * 3 : 12;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const end = `${year}-${String(endMonth).padStart(2, "0")}-${String(endOfMonth(year, endMonth)).padStart(2, "0")}`;
  const label = mode === "month" ? `Tháng ${selectedMonth}/${year}` : mode === "quarter" ? `Quý ${selectedQuarter}/${year}` : `Năm ${year}`;
  return { label, start, end, year, startMonth, endMonth };
}

function previousRange(mode: PeriodMode, year: number, selectedMonth: number, selectedQuarter: number): PeriodRange {
  if (mode === "month") {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? year - 1 : year;
    return makeRange("month", prevYear, prevMonth, selectedQuarter);
  }
  if (mode === "quarter") {
    const prevQuarter = selectedQuarter === 1 ? 4 : selectedQuarter - 1;
    const prevYear = selectedQuarter === 1 ? year - 1 : year;
    return makeRange("quarter", prevYear, selectedMonth, prevQuarter);
  }
  return makeRange("year", year - 1, selectedMonth, selectedQuarter);
}

function accountBalance(entries: any[], codes: string[]) {
  return entries
    .filter((entry) => codes.includes(String(entry.account_code || "")))
    .reduce((sum, entry) => sum + Number(entry.debit_amount || 0) - Number(entry.credit_amount || 0), 0);
}

function accountCredit(entries: any[], codes: string[]) {
  return entries
    .filter((entry) => codes.includes(String(entry.account_code || "")))
    .reduce((sum, entry) => sum + Number(entry.credit_amount || 0), 0);
}

function accountDebit(entries: any[], codePrefix: string) {
  return entries
    .filter((entry) => String(entry.account_code || "").startsWith(codePrefix))
    .reduce((sum, entry) => sum + Number(entry.debit_amount || 0), 0);
}

function sumBy(rows: any[], getter: (row: any) => number) {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}

function inDateRange(value: string | null | undefined, range: PeriodRange) {
  if (!value) return false;
  return value >= range.start && value <= range.end;
}

function inPayrollPeriod(row: any, range: PeriodRange) {
  const year = Number(row.period_year);
  const month = Number(row.period_month);
  return year === range.year && month >= range.startMonth && month <= range.endMonth;
}

function line(code: string, label: string, current: number, previous: number, level: 0 | 1 | 2 = 1, kind: ReportLine["kind"] = "normal"): ReportLine {
  return { code, label, current, previous, level, kind };
}

function group(code: string, label: string): ReportLine {
  return { code, label, current: 0, previous: 0, level: 0, kind: "group" };
}

function buildLines(current: PeriodReport, previous: PeriodReport): { assets: ReportLine[]; sources: ReportLine[] } {
  const merge = (side: Side) => {
    const currentLines = side === "asset" ? current.assets : current.sources;
    const previousLines = side === "asset" ? previous.assets : previous.sources;
    return currentLines.map((item, index) => ({
      ...item,
      previous: previousLines[index]?.current || 0,
    }));
  };
  return { assets: merge("asset"), sources: merge("source") };
}

async function fetchPeriodReport(range: PeriodRange): Promise<PeriodReport> {
  const [journalRes, expensesRes, vouchersRes, payrollRes, campaignsRes, employeeRes] = await Promise.all([
    supabase.from("journal_entries").select("*").gte("entry_date", range.start).lte("entry_date", range.end),
    supabase.from("expenses").select("*").gte("expense_date", range.start).lte("expense_date", range.end),
    supabase.from("cash_vouchers").select("id, ref_expense_id, status").eq("status", "Posted"),
    supabase.from("payroll_receipt").select("*"),
    supabase.from("marketing_campaigns").select("*"),
    supabase.from("employee").select("id, department"),
  ]);

  if (journalRes.error) throw journalRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (vouchersRes.error) throw vouchersRes.error;
  if (payrollRes.error) throw payrollRes.error;
  if (campaignsRes.error) throw campaignsRes.error;
  if (employeeRes.error) throw employeeRes.error;

  const journalEntries = journalRes.data || [];
  const expenses = expensesRes.data || [];
  const postedExpenseIds = new Set((vouchersRes.data || []).map((voucher: any) => voucher.ref_expense_id).filter(Boolean));
  const payroll = (payrollRes.data || []).filter((row: any) => inPayrollPeriod(row, range));
  const campaigns = (campaignsRes.data || []).filter((row: any) => {
    const status = String(row.status || "");
    if (status === "Cancelled" || status === "Completed") return false;
    return !row.start_date || row.start_date <= range.end;
  });

  const pendingPayrollRows = payroll.filter((row: any) => row.payment_status === "Chờ chuyển");
  const pendingPayroll = sumBy(pendingPayrollRows, (row) => Number(row.net_salary || 0));
  const payrollTax = sumBy(payroll, (row) => Number(row.tax || 0));
  const unvoucheredExpenses = sumBy(expenses.filter((expense: any) => !postedExpenseIds.has(expense.id)), (row) => Number(row.amount || 0));
  const prepaidFallback = sumBy(expenses.filter((expense: any) => expense.category === "Prepaid"), (row) => Number(row.amount || 0));
  const marketingRemaining = sumBy(
    campaigns.filter((campaign: any) => campaign.status === "Active"),
    (row) => Math.max(Number(row.budget || 0) - Number(row.spent || 0), 0),
  );

  const cash = accountBalance(journalEntries, ["111", "112"]);
  const receivables = accountBalance(journalEntries, ["131"]);
  const prepaidAccount = accountBalance(journalEntries, ["142"]);
  const prepaid = prepaidAccount || prepaidFallback;
  const otherCurrentAssets = accountBalance(journalEntries, ["133", "141"]);
  const fixedAssets = accountBalance(journalEntries, ["211"]);
  const depreciation = Math.abs(accountBalance(journalEntries, ["214"]));
  const netFixedAssets = fixedAssets - depreciation;
  const totalCurrentAssets = cash + receivables + prepaid + otherCurrentAssets;
  const totalAssets = totalCurrentAssets + netFixedAssets;

  const supplierPayable = accountBalance(journalEntries, ["331"]) + unvoucheredExpenses;
  const salaryPayable = accountBalance(journalEntries, ["334"]) + pendingPayroll;
  const taxPayable = accountBalance(journalEntries, ["333"]) + payrollTax;
  const currentLiabilities = supplierPayable + salaryPayable + taxPayable + marketingRemaining;
  const longTermDebt = accountBalance(journalEntries, ["341"]);

  const directEquity = accountBalance(journalEntries, ["411"]);
  const directRetainedEarnings = accountBalance(journalEntries, ["421"]);
  const revenue = accountCredit(journalEntries, ["511", "131"]);
  const expenses6xx = accountDebit(journalEntries, "6");
  const computedRetainedEarnings = revenue - expenses6xx - taxPayable;
  const retainedEarnings = directRetainedEarnings || computedRetainedEarnings;
  const totalEquity = directEquity + retainedEarnings;
  const totalSources = currentLiabilities + longTermDebt + totalEquity;

  const assets = [
    group("A", "TÀI SẢN NGẮN HẠN"),
    line("110", "I. Tiền và tương đương tiền", cash, 0),
    line("130", "II. Phải thu ngắn hạn", receivables, 0),
    line("132", "Tham chiếu: phải trả lương chờ chuyển", pendingPayroll, 0, 2),
    line("150", "III. Chi phí trả trước", prepaid, 0),
    line("160", "IV. Tài sản ngắn hạn khác", otherCurrentAssets, 0),
    line("100", "Tổng tài sản ngắn hạn", totalCurrentAssets, 0, 1, "total"),
    group("B", "TÀI SẢN DÀI HẠN"),
    line("211", "I. Tài sản cố định hữu hình", fixedAssets, 0),
    line("214", "II. Hao mòn luỹ kế", -depreciation, 0),
    line("220", "III. Tài sản cố định thuần", netFixedAssets, 0, 1, "total"),
    line("270", "TỔNG CỘNG TÀI SẢN", totalAssets, 0, 0, "total"),
  ];

  const sources = [
    group("C", "NỢ PHẢI TRẢ"),
    line("310", "I. Nợ ngắn hạn", currentLiabilities, 0, 1, "total"),
    line("311", "Phải trả nhà cung cấp", supplierPayable, 0, 2),
    line("314", "Phải trả người lao động", salaryPayable, 0, 2),
    line("315", "Thuế phải nộp", taxPayable, 0, 2),
    line("319", "Chi phí marketing phải trả", marketingRemaining, 0, 2),
    line("330", "II. Nợ dài hạn", longTermDebt, 0),
    group("D", "VỐN CHỦ SỞ HỮU"),
    line("411", "I. Vốn đầu tư chủ sở hữu", directEquity, 0),
    line("421", "II. Lợi nhuận chưa phân phối", retainedEarnings, 0),
    line("440", "TỔNG CỘNG NGUỒN VỐN", totalSources, 0, 0, "total"),
  ];

  const headcount = (employeeRes.data || []).reduce((acc: Record<string, number>, employee: any) => {
    const department = employee.department || "Chưa phân phòng";
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {});

  return {
    label: range.label,
    assets,
    sources,
    totalAssets,
    totalSources,
    difference: totalAssets - totalSources,
    footer: {
      headcount,
      outstandingPayrollCount: pendingPayrollRows.length,
      activeCampaignRemaining: marketingRemaining,
      pendingPayroll,
    },
    raw: { journalEntries, payroll, expenses },
  };
}

function BalanceSheetPage() {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [currentReport, setCurrentReport] = useState<PeriodReport | null>(null);
  const [previousReport, setPreviousReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);

  const currentRange = useMemo(() => makeRange(mode, year, month, quarter), [mode, year, month, quarter]);
  const prevRange = useMemo(() => previousRange(mode, year, month, quarter), [mode, year, month, quarter]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [current, previous] = await Promise.all([fetchPeriodReport(currentRange), fetchPeriodReport(prevRange)]);
      setCurrentReport(current);
      setPreviousReport(previous);
    } catch (error: any) {
      toast.error(`Không tải được bảng cân đối: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [currentRange.start, currentRange.end, prevRange.start, prevRange.end]);

  const reportLines = useMemo(() => {
    if (!currentReport || !previousReport) return null;
    return buildLines(currentReport, previousReport);
  }, [currentReport, previousReport]);

  const exportExcel = async () => {
    if (!currentReport || !reportLines) return;
    const xlsx = await import("xlsx");
    const workbook = xlsx.utils.book_new();
    const maxRows = Math.max(reportLines.assets.length, reportLines.sources.length);
    const sheetRows = [
      ["TÀI SẢN", "", "", "", "NGUỒN VỐN", "", "", ""],
      ["Mã số", "Chỉ tiêu", "Kỳ này", "Kỳ trước", "Mã số", "Chỉ tiêu", "Kỳ này", "Kỳ trước"],
      ...Array.from({ length: maxRows }, (_, index) => {
        const asset = reportLines.assets[index];
        const source = reportLines.sources[index];
        return [
          asset?.code || "",
          asset?.label || "",
          asset?.current || 0,
          asset?.previous || 0,
          source?.code || "",
          source?.label || "",
          source?.current || 0,
          source?.previous || 0,
        ];
      }),
    ];
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(sheetRows), "Bảng CĐKT");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(currentReport.raw.journalEntries), "Bút toán");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(currentReport.raw.payroll), "Chi tiết lương");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(currentReport.raw.expenses), "Chi phí");
    xlsx.writeFile(workbook, `BCĐKT_${currentReport.label.replace(/[ /]/g, "_")}_${toDateString(new Date())}.xlsx`);
  };

  const printReport = () => window.print();

  const difference = currentReport?.difference || 0;
  const balanced = Math.abs(difference) < 1;

  return (
    <div className="space-y-6 p-6 print:p-2">
      <PageHeader
        title="Bảng cân đối kế toán"
        description="Báo cáo tự động tổng hợp từ bút toán, chi phí, lương, marketing và nhân sự."
        actions={
          <>
            <Button variant="outline" onClick={loadReport} disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              Làm mới
            </Button>
            <Button variant="outline" onClick={exportExcel} disabled={!currentReport}>
              <FileSpreadsheet className="mr-2 size-4" /> Xuất Excel
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="mr-2 size-4" /> In báo cáo
            </Button>
          </>
        }
      />

      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <Label>Loại kỳ</Label>
            <Tabs value={mode} onValueChange={(value) => setMode(value as PeriodMode)}>
              <TabsList>
                <TabsTrigger value="month">Tháng</TabsTrigger>
                <TabsTrigger value="quarter">Quý</TabsTrigger>
                <TabsTrigger value="year">Năm</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid gap-2">
            <Label>Năm</Label>
            <Input className="w-28" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </div>
          {mode === "month" && (
            <div className="grid gap-2">
              <Label>Tháng</Label>
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <SelectItem key={item} value={String(item)}>Tháng {item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === "quarter" && (
            <div className="grid gap-2">
              <Label>Quý</Label>
              <Select value={String(quarter)} onValueChange={(value) => setQuarter(Number(value))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((item) => <SelectItem key={item} value={String(item)}>Quý {item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Badge variant="secondary" className="mb-2">Kỳ này: {currentRange.label}</Badge>
          <Badge variant="outline" className="mb-2">Kỳ trước: {prevRange.label}</Badge>
        </div>
      </Card>

      {!balanced && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <div className="font-medium">Bảng cân đối chưa cân - kiểm tra lại bút toán</div>
            <div className="text-sm">Chênh lệch: {formatVND(difference)}</div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden print:shadow-none">
        <div className="border-b p-4 text-center">
          <div className="text-lg font-semibold uppercase">Bảng cân đối kế toán</div>
          <div className="text-sm text-muted-foreground">{currentRange.label} so với {prevRange.label}</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={4} className="text-center">TÀI SẢN</TableHead>
              <TableHead colSpan={4} className="text-center">NGUỒN VỐN</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="w-16">Mã số</TableHead>
              <TableHead>Chỉ tiêu</TableHead>
              <TableHead className="text-right">Kỳ này</TableHead>
              <TableHead className="text-right">Kỳ trước</TableHead>
              <TableHead className="w-16">Mã số</TableHead>
              <TableHead>Chỉ tiêu</TableHead>
              <TableHead className="text-right">Kỳ này</TableHead>
              <TableHead className="text-right">Kỳ trước</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !reportLines ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 size-6 animate-spin" /> Đang tải báo cáo...
                </TableCell>
              </TableRow>
            ) : (
              Array.from({ length: Math.max(reportLines?.assets.length || 0, reportLines?.sources.length || 0) }, (_, index) => (
                <BalanceRow key={index} asset={reportLines?.assets[index]} source={reportLines?.sources[index]} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {currentReport && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm font-medium">Headcount theo phòng ban</div>
            <div className="mt-3 space-y-2 text-sm">
              {Object.entries(currentReport.footer.headcount).map(([department, count]) => (
                <div key={department} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{department}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium">Lương chờ chuyển</div>
            <div className="mt-2 text-2xl font-semibold">{currentReport.footer.outstandingPayrollCount}</div>
            <div className="text-sm text-muted-foreground">{formatVND(currentReport.footer.pendingPayroll)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium">Marketing còn cam kết</div>
            <div className="mt-2 text-2xl font-semibold">{formatVND(currentReport.footer.activeCampaignRemaining)}</div>
            <div className="text-sm text-muted-foreground">Active campaigns budget remaining</div>
          </Card>
        </div>
      )}
    </div>
  );
}

function BalanceRow({ asset, source }: { asset?: ReportLine; source?: ReportLine }) {
  const renderCells = (item?: ReportLine) => {
    if (!item) return [0, 1, 2, 3].map((key) => <TableCell key={key} />);
    const groupClass = item.kind === "group" ? "bg-muted font-semibold uppercase" : item.kind === "total" ? "font-semibold bg-muted/50" : "";
    const indent = item.level === 2 ? "pl-8" : item.level === 1 ? "pl-4" : "";
    return (
      <>
        <TableCell className={groupClass}>{item.code}</TableCell>
        <TableCell className={`${groupClass} ${indent}`}>{item.label}</TableCell>
        <TableCell className={`${groupClass} text-right tabular-nums`}>{item.kind === "group" ? "" : formatVND(item.current)}</TableCell>
        <TableCell className={`${groupClass} text-right tabular-nums`}>{item.kind === "group" ? "" : formatVND(item.previous)}</TableCell>
      </>
    );
  };

  return (
    <TableRow>
      {renderCells(asset)}
      {renderCells(source)}
    </TableRow>
  );
}
