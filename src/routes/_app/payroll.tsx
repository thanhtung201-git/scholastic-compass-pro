import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Plus, Receipt } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useDatabase } from "@/hooks/use-database";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const { user } = useAuth();
  const { attendanceLogs, teachers, saveAttendance, payrollSlips, addPayrollSlip, updatePayrollSlipStatus, addAuditLog, loading } = useDatabase();
  const canApprove = user?.role === "Accountant" || user?.role === "Admin";

  // Payslip generation state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [generating, setGenerating] = useState(false);

  const approve = async (log: any) => {
    try {
      await saveAttendance({ ...log, status: "Approved" });
      toast.success("Approved for payment");
    } catch (e: any) {
      toast.error(`Approval failed: ${e.message}`);
    }
  };

  const handleGeneratePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return toast.error("Select a teacher");
    
    // Calculate base salary from approved logs in this month
    const teacherLogs = attendanceLogs.filter(
      l => l.teacher_id === selectedTeacher && 
           l.status === "Approved" && 
           l.lesson_date.startsWith(selectedMonth)
    );
    
    const baseSalary = teacherLogs.reduce((acc, l) => acc + (Number(l.total_pay) || 0), 0);
    const totalBonus = Number(bonus) || 0;
    const totalDeductions = Number(deductions) || 0;
    const totalSalary = baseSalary + totalBonus - totalDeductions;

    setGenerating(true);
    try {
      await addPayrollSlip({
        teacher_id: selectedTeacher,
        period_month: selectedMonth,
        base_salary: baseSalary,
        bonus: totalBonus,
        deductions: totalDeductions,
        total_salary: totalSalary,
        status: "Draft",
        created_at: new Date().toISOString()
      });
      await addAuditLog(user?.name || "Unknown", `Generated payslip for ${teachers.find(t=>t.id===selectedTeacher)?.name} (${selectedMonth})`, `Total: ${formatVND(totalSalary)}`, "create");
      setIsGenerateOpen(false);
      toast.success("Payslip generated successfully");
    } catch (err: any) {
      toast.error(`Failed to generate: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (slip: any) => {
    try {
      await updatePayrollSlipStatus(slip.id, "Paid");
      await addAuditLog(user?.name || "Unknown", `Marked payslip as Paid for ${teachers.find(t=>t.id===slip.teacher_id)?.name} (${slip.period_month})`, `Total: ${formatVND(slip.total_salary)}`, "update");
      toast.success("Payslip marked as Paid");
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
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
      <PageHeader title="Payroll" description="Review lesson logs and manage teacher payslips." />
      
      <Tabs defaultValue="payslips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="payslips" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 size-4" /> Generate Payslip</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Payslip</DialogTitle>
                  <DialogDescription>Calculate salary from approved attendance logs.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGeneratePayslip} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Teacher *</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Period (Month) *</Label>
                    <Input type="month" required value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bonus (VND)</Label>
                    <Input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deductions (VND)</Label>
                    <Input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={generating}>
                      {generating && <Loader2 className="mr-2 size-4 animate-spin" />} Generate
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollSlips.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payslips generated.</TableCell></TableRow>
                ) : (
                  payrollSlips.map(slip => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{teachers.find(t => t.id === slip.teacher_id)?.name}</TableCell>
                      <TableCell>{slip.period_month}</TableCell>
                      <TableCell className="text-right">{formatVND(Number(slip.base_salary))}</TableCell>
                      <TableCell className="text-right text-success">{formatVND(Number(slip.bonus))}</TableCell>
                      <TableCell className="text-right text-destructive">{formatVND(Number(slip.deductions))}</TableCell>
                      <TableCell className="text-right font-bold">{formatVND(Number(slip.total_salary))}</TableCell>
                      <TableCell>
                        <Badge variant={slip.status === "Paid" ? "default" : "secondary"}>{slip.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {slip.status !== "Paid" && canApprove && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(slip)}>
                            <Receipt className="mr-2 size-3" /> Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}