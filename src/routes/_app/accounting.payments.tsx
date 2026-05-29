import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Download, Loader2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";

export const Route = createFileRoute("/_app/accounting/payments")({
  component: PaymentsPage,
});

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function PaymentsPage() {
  const { tuitionPayments, students, loading } = useDatabase();
  const [q, setQ] = useState("");

  const filtered = tuitionPayments.filter((p) => {
    const s = students.find((st) => st.id === p.student_id);
    return (
      s?.name?.toLowerCase().includes(q.toLowerCase()) || 
      p.invoice_id?.toLowerCase().includes(q.toLowerCase())
    );
  });

  const exportCSV = () => {
    const headers = ["Payment ID", "Invoice ID", "Student", "Amount", "Method", "Date"];
    const rows = filtered.map(p => [
      p.id,
      p.invoice_id,
      students.find(s => s.id === p.student_id)?.name || "Unknown",
      p.amount,
      p.payment_method,
      new Date(p.payment_date).toLocaleString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payments_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && tuitionPayments.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Payment History" description="View all individual tuition payment transactions." />
      
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search by student or invoice..." 
              className="pl-8 h-9" 
            />
          </div>
          <Badge variant="secondary">{filtered.length} payments</Badge>
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
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const stu = students.find((s) => s.id === p.student_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.payment_date).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{stu?.name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.invoice_id}</TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatVND(Number(p.amount || 0))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
