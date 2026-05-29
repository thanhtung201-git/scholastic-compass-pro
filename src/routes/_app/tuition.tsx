import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Receipt, CreditCard, Loader2, Eye, Printer, Download } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Đảm bảo import đúng đường dẫn supabase client của bạn

export const Route = createFileRoute("/_app/tuition")({ component: TuitionPage });

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function TuitionPage() {
  // Loại bỏ biến không dùng tuitionPayments để tránh lỗi compile
  const { tuitionInvoices, students, enrolments, classes, addAuditLog, loading } = useDatabase();
  const { user: currentUser } = useAuth();

  const [q, setQ] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [submitting, setSubmitting] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const getInvoiceStatus = (i: any) => {
    if (i.status === "Paid") return "Paid";
    if (i.due_date && new Date(i.due_date) < new Date() && Number(i.remaining_debt) > 0) return "Overdue";
    return i.status;
  };

  const filtered = tuitionInvoices.filter((i) => {
    const s = students.find((st) => st.id === i.student_id);
    return s?.name?.toLowerCase().includes(q.toLowerCase()) || i.id?.toLowerCase().includes(q.toLowerCase());
  });

  const totals = {
    due: tuitionInvoices.reduce((s, i) => s + Number(i.amount_due || 0), 0),
    paid: tuitionInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0),
    debt: tuitionInvoices.reduce((s, i) => s + Number(i.remaining_debt || 0), 0),
  };

  const paying = tuitionInvoices.find((i) => i.id === payingId);
  const detailInvoice = tuitionInvoices.find((i) => i.id === detailId);

  const exportCSV = () => {
    const headers = ["Invoice ID", "Student", "Amount Due", "Paid", "Remaining", "Due Date", "Status"];
    const rows = filtered.map(i => [
      i.id,
      students.find(s => s.id === i.student_id)?.name || "",
      i.amount_due,
      i.amount_paid,
      i.remaining_debt,
      i.due_date || "",
      getInvoiceStatus(i)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SỬA ĐỔI: Hàm ghi nhận thanh toán trực tiếp vào bảng 'tuition_invoices'
  const recordPayment = async () => {
    if (!paying) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    if (amt > Number(paying.remaining_debt)) return toast.error("Amount exceeds remaining debt.");
    
    setSubmitting(true);
    try {
      const newAmountPaid = Number(paying.amount_paid || 0) + amt;
      const newRemainingDebt = Number(paying.amount_due || 0) - newAmountPaid;
      const newStatus = newRemainingDebt <= 0 ? "Paid" : "Partially Paid";

      // Gọi trực tiếp bảng tuition_invoices chuẩn theo cấu trúc DB hiện tại của bạn
      const { error } = await supabase
        .from("tuition_invoices")
        .update({
          amount_paid: newAmountPaid,
          remaining_debt: newRemainingDebt,
          status: newStatus,
          payment_method: method,
          payment_note: `Paid ${formatVND(amt)} via ${method} on ${new Date().toLocaleDateString()}`
        })
        .eq("id", paying.id);

      if (error) throw error;

      if (currentUser) {
        const studentName = students.find((s) => s.id === paying.student_id)?.name || "Unknown";
        await addAuditLog(
          currentUser.name, 
          `Recorded tuition payment of ${formatVND(amt)}`, 
          `Student: ${studentName} (Invoice ${paying.id})`, 
          "update"
        );
      }
      
      toast.success("Payment recorded successfully!");
      setPayingId(null);
      setAmount("");
      
      // Reload lại trang sau 1 giây để Supabase cập nhật dữ liệu mới lên UI
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to record payment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && tuitionInvoices.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tuition Tracking" description="Invoices, payments, and outstanding debts." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total Billed</div><div className="text-xl font-semibold mt-1">{formatVND(totals.due)}</div></Card>
        <Card className="p-4 border-success/30 bg-success/5"><div className="text-xs text-muted-foreground">Collected</div><div className="text-xl font-semibold mt-1 text-success">{formatVND(totals.paid)}</div></Card>
        <Card className="p-4 border-destructive/30 bg-destructive/5"><div className="text-xs text-muted-foreground">Outstanding</div><div className="text-xl font-semibold mt-1 text-destructive">{formatVND(totals.debt)}</div></Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by student or invoice ID…" className="pl-8 h-9" />
          </div>
          <Badge variant="secondary">{filtered.length} invoices</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-center">Due Date</TableHead>
                <TableHead className="text-center">Payment Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => {
                const stu = students.find((s) => s.id === i.student_id);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.id}</TableCell>
                    <TableCell className="font-medium">{stu?.name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVND(Number(i.amount_due || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">{formatVND(Number(i.amount_paid || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">{formatVND(Number(i.remaining_debt || 0))}</TableCell>
                    <TableCell className="text-center">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-center text-xs max-w-[200px] truncate">{i.payment_note || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getInvoiceStatus(i) === "Paid" ? "default" : getInvoiceStatus(i) === "Overdue" ? "destructive" : getInvoiceStatus(i) === "Unpaid" ? "secondary" : "outline"}>
                        {getInvoiceStatus(i)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDetailId(i.id)}>
                          <Eye className="size-4" />
                        </Button>
                        {getInvoiceStatus(i) !== "Paid" && (
                          <Button size="sm" variant="outline" onClick={() => { setPayingId(i.id); setAmount(String(i.remaining_debt)); }}>
                            <CreditCard className="size-3" /> Record
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!payingId} onOpenChange={(o) => !o && setPayingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="size-5" /> Record Payment</DialogTitle>
            <DialogDescription>
              {paying && `Invoice ${paying.id} · Remaining ${formatVND(Number(paying.remaining_debt))}`}
            </DialogDescription>
          </DialogHeader>
          {paying && (
            <div className="grid gap-4 py-2">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{students.find((s) => s.id === paying.student_id)?.name}</span></div>
                <div className="flex justify-between mt-1"><span className="text-muted-foreground">Outstanding</span><span className="font-semibold text-destructive">{formatVND(Number(paying.remaining_debt))}</span></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount (VND)</Label>
                <Input id="pay-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>Cancel</Button>
            <Button onClick={recordPayment} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />} Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl print:max-w-none print:w-full print:border-none print:shadow-none">
          {detailInvoice && (() => {
            const stu = students.find((s) => s.id === detailInvoice.student_id);
            const enrol = enrolments.find(e => e.id === detailInvoice.enrolment_id);
            const cls = classes.find(c => c.id === enrol?.class_id);

            return (
              <>
                <DialogHeader className="print:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="flex items-center gap-2"><Receipt className="size-5" /> Invoice Details</DialogTitle>
                      <DialogDescription>Invoice ID: {detailInvoice.id}</DialogDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="mr-2 size-4" /> Print
                    </Button>
                  </div>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Header for print */}
                  <div className="hidden print:block text-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold">TUITION INVOICE</h1>
                    <p className="text-muted-foreground mt-1">Invoice ID: {detailInvoice.id}</p>
                    <p className="text-muted-foreground">Date: {new Date(detailInvoice.created_at || detailInvoice.issued_at || Date.now()).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="font-semibold text-sm mb-3">Student Information</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span>{stu?.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span> <span>{stu?.phone || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Parent:</span> <span>{stu?.parent_name || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Class:</span> <span>{cls?.name || "—"}</span></div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="font-semibold text-sm mb-3">Invoice Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> 
                          <Badge variant={getInvoiceStatus(detailInvoice) === "Paid" ? "default" : getInvoiceStatus(detailInvoice) === "Overdue" ? "destructive" : "secondary"}>
                            {getInvoiceStatus(detailInvoice)}
                          </Badge>
                        </div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Due Date:</span> <span>{detailInvoice.due_date ? new Date(detailInvoice.due_date).toLocaleDateString() : "—"}</span></div>
                        <div className="flex justify-between mt-2 pt-2 border-t"><span className="font-medium">Total Amount:</span> <span className="font-semibold">{formatVND(Number(detailInvoice.amount_due))}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid:</span> <span className="text-success">{formatVND(Number(detailInvoice.amount_paid))}</span></div>
                        <div className="flex justify-between font-semibold"><span className="text-destructive">Remaining:</span> <span className="text-destructive">{formatVND(Number(detailInvoice.remaining_debt))}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* SỬA ĐỔI: Hiển thị Payment Note thay thế lịch sử bảng phụ */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 border-b pb-2">Payment Details Note</h4>
                    {detailInvoice.payment_note ? (
                      <div className="p-3 bg-success/5 border border-success/20 rounded-lg text-sm text-success font-medium">
                        {detailInvoice.payment_note}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No payment details or notes recorded yet.</p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}