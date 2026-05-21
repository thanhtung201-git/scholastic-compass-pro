import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useDatabase } from "@/hooks/use-database";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const { user } = useAuth();
  const { attendanceLogs, teachers, saveAttendance, loading } = useDatabase();
  const canApprove = user?.role === "Accountant" || user?.role === "Admin";

  const approve = async (log: any) => {
    try {
      await saveAttendance({ ...log, status: "Approved" });
      toast.success("Approved for payment");
    } catch (e: any) {
      toast.error(`Approval failed: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDraft = attendanceLogs.filter((l) => l.status === "Draft").reduce((s, l) => s + l.total_pay, 0);
  const totalApproved = attendanceLogs.filter((l) => l.status === "Approved").reduce((s, l) => s + l.total_pay, 0);

  return (
    <div>
      <PageHeader title="Payroll" description="Review and approve teacher lesson logs." />
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending Approval</div><div className="text-xl font-semibold mt-1 text-warning-foreground">{formatVND(totalDraft)}</div></Card>
        <Card className="p-4 border-success/30 bg-success/5"><div className="text-xs text-muted-foreground">Approved</div><div className="text-xl font-semibold mt-1 text-success">{formatVND(totalApproved)}</div></Card>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Total Pay</TableHead>
              <TableHead>Status</TableHead>
              {canApprove && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceLogs.map((l) => {
              const t = teachers.find((tt) => tt.id === l.teacher_id);
              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{t?.name || "Unknown Teacher"}</TableCell>
                  <TableCell className="text-xs">{l.class_id.toUpperCase()}</TableCell>
                  <TableCell className="text-xs">{l.lesson_date}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.hours}h</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVND(l.hourly_rate)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatVND(l.total_pay)}</TableCell>
                  <TableCell><Badge variant={l.status === "Approved" ? "default" : "outline"}>{l.status}</Badge></TableCell>
                  {canApprove && (
                    <TableCell>
                      {l.status === "Draft" && (
                        <Button size="sm" onClick={() => approve(l)}><CheckCircle2 className="size-3" /> Approve</Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

