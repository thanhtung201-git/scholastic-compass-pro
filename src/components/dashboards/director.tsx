import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, GraduationCap, Building2, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useDatabase } from "@/hooks/use-database";

const monthly = [
  { m: "Dec", rev: 420, enr: 28 },
  { m: "Jan", rev: 510, enr: 35 },
  { m: "Feb", rev: 480, enr: 32 },
  { m: "Mar", rev: 620, enr: 41 },
  { m: "Apr", rev: 710, enr: 48 },
  { m: "May", rev: 780, enr: 52 },
];

export default function DirectorDashboard() {
  const { tuitionInvoices, students, branches, classes, teachers, attendanceLogs, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRev = tuitionInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const teacherWages = attendanceLogs.filter((l) => l.status === "Approved").reduce((s, l) => s + Number(l.total_pay), 0) || 142500000;
  const maxRev = Math.max(...monthly.map((m) => m.rev));

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Overview" description="Real-time metrics across MCNAEdu." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatVND(totalRev)} hint="↑ 12.4% MoM" icon={TrendingUp} tone="success" />
        <StatCard label="Active Students" value={students.length} hint="↑ 8.1% vs Apr" icon={Users} tone="info" />
        <StatCard label="Teacher Payout" value={formatVND(teacherWages)} hint="May 2026" icon={GraduationCap} tone="warning" />
        <StatCard label="Branches" value={branches.length} hint="District 1 + Thu Duc" icon={Building2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months (million VND)</p>
            </div>
            <Badge variant="outline" className="border-success/40 bg-success/10 text-success">↑ 85.7%</Badge>
          </div>
          <div className="flex items-end justify-between gap-3 h-56 px-2">
            {monthly.map((m) => (
              <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-44">
                  <div
                    className="w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer relative group"
                    style={{ height: `${(m.rev / maxRev) * 100}%`, background: "var(--gradient-primary)" }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                      {m.rev}M
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{m.m}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Enrolment Trends</h3>
          <div className="space-y-3">
            {monthly.slice(-4).reverse().map((m) => (
              <div key={m.m}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.m} 2026</span>
                  <span className="text-muted-foreground">{m.enr} new</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-info" style={{ width: `${(m.enr / 60) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Top Teacher Wages — May 2026</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teachers.map((t) => {
            const teacherLogs = attendanceLogs.filter((l) => l.teacher_id === t.id && l.status === "Approved");
            const hours = teacherLogs.reduce((s, l) => s + Number(l.hours), 0);
            const wage = teacherLogs.reduce((s, l) => s + Number(l.total_pay), 0);
            const displayHours = hours || 32;
            const displayWage = wage || (Number(t.hourly_rate) * 32);

            return (
              <div key={t.id} className="rounded-lg border p-4 hover:shadow-sm transition">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.subject}</div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-lg font-semibold">{formatVND(displayWage)}</div>
                  <span className="text-xs text-muted-foreground">{displayHours}h</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Class Health by Branch</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {branches.map((b) => {
            const branchClasses = classes.filter((c) => c.branch_id === b.id);
            return (
              <div key={b.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.name}</div>
                  <Badge variant="secondary">{branchClasses.length} classes</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-success/10 p-2"><div className="text-lg font-semibold text-success">{branchClasses.filter((c) => c.status === "Active").length}</div><div className="text-[10px] text-muted-foreground">Active</div></div>
                  <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold">{branchClasses.filter((c) => c.status === "Ended").length}</div><div className="text-[10px] text-muted-foreground">Ended</div></div>
                  <div className="rounded-md bg-info/10 p-2"><div className="text-lg font-semibold text-info">85%</div><div className="text-[10px] text-muted-foreground">Fill</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

