import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, Receipt, TrendingUp, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useDatabase } from "@/hooks/use-database";
import { Link } from "@tanstack/react-router";

export default function AccountantDashboard() {
  const { tuitionInvoices, students, attendanceLogs, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDue = tuitionInvoices.reduce((s, i) => s + Number(i.amount_due), 0);
  const totalPaid = tuitionInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const totalDebt = tuitionInvoices.reduce((s, i) => s + Number(i.remaining_debt), 0);
  const unpaid = tuitionInvoices.filter((i) => i.status !== "Paid");
  const pendingPayroll = attendanceLogs.filter((l) => l.status === "Draft");

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Center" description="Tuition, debts, and payroll approval." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue Collected" value={formatVND(totalPaid)} hint="this term" icon={TrendingUp} tone="success" />
        <StatCard label="Outstanding Debt" value={formatVND(totalDebt)} hint={`${unpaid.length} invoices`} icon={AlertCircle} tone="destructive" />
        <StatCard label="Total Billed" value={formatVND(totalDue)} icon={Receipt} tone="info" />
        <StatCard label="Payroll Pending" value={pendingPayroll.length} hint="logs to approve" icon={Banknote} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Overdue Invoices</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/tuition">Open Tuition <ArrowUpRight className="size-3" /></Link></Button>
          </div>
          <div className="divide-y">
            {unpaid.slice(0, 6).map((inv) => {
              const stu = students.find((s) => s.id === inv.student_id);
              return (
                <div key={inv.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{stu?.name || "Unknown Student"}</div>
                    <div className="text-xs text-muted-foreground">{inv.id} · {inv.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-destructive">{formatVND(inv.remaining_debt)}</div>
                    <div className="text-[10px] text-muted-foreground">outstanding</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Payroll Queue</h3>
          <div className="space-y-3">
            {pendingPayroll.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{log.class_id.toUpperCase()}</span>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{log.lesson_date} · {log.hours}h</span>
                  <span className="font-semibold text-foreground">{formatVND(log.total_pay)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

