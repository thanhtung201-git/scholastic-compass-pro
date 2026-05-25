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
import { Search, Receipt, CreditCard, Loader2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tuition")({ component: TuitionPage });

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function TuitionPage() {
  const { tuitionInvoices, students, updateTuitionPayment, addAuditLog, loading } = useDatabase();
  const { user: currentUser } = useAuth();

  const [q, setQ] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [submitting, setSubmitting] = useState(false);

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

  const recordPayment = async () => {
    if (!paying) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    if (amt > Number(paying.remaining_debt)) return toast.error("Amount exceeds remaining debt.");
    
    setSubmitting(true);
    try {
      await updateTuitionPayment(paying.id, amt, method);
      
      if (currentUser) {
        const studentName = students.find((s) => s.id === paying.student_id)?.name || "Unknown";
        await addAuditLog(
          currentUser.name, 
          `Recorded tuition payment of ${formatVND(amt)}`, 
          `Student: ${studentName} (Invoice ${paying.id})`, 
          "update"
        );
      }
      
      setPayingId(null);
      setAmount("");
    } catch (err: any) {
      console.error(err);
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
                    <TableCell className="text-center">{i.payment_note || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={i.status === "Paid" ? "default" : i.status === "Unpaid" ? "destructive" : "secondary"}>{i.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {i.status !== "Paid" && (
                        <Button size="sm" variant="outline" onClick={() => { setPayingId(i.id); setAmount(String(i.remaining_debt)); }}>
                          <CreditCard className="size-3" /> Record
                        </Button>
                      )}
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
    </div>
  );
}
