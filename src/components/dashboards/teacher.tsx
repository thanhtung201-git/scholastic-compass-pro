import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ClipboardList, Banknote, Calendar, ArrowUpRight } from "lucide-react";
import { teachers, attendanceLogs, schedules, classes, formatVND, homeworkAssignments } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const me = teachers.find((t) => t.name === user?.name) ?? teachers[0];
  const myLogs = attendanceLogs.filter((l) => l.teacher_id === me.id);
  const totalEarned = myLogs.filter((l) => l.status === "Approved").reduce((s, l) => s + l.total_pay, 0);
  const pendingPay = myLogs.filter((l) => l.status === "Draft").reduce((s, l) => s + l.total_pay, 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = schedules.filter((s) => s.teacher_id === me.id && s.lesson_date >= today).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${me.name}`} description={`${me.subject} · Hourly rate ${formatVND(me.hourly_rate)}`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Earned (Approved)" value={formatVND(totalEarned)} icon={Banknote} tone="success" />
        <StatCard label="Pending Approval" value={formatVND(pendingPay)} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Upcoming Lessons" value={upcoming.length} hint="next 14 days" icon={Calendar} tone="info" />
        <StatCard label="Active Assignments" value={homeworkAssignments.length} icon={ClipboardList} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Schedule</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/schedule">Full calendar <ArrowUpRight className="size-3" /></Link></Button>
          </div>
          <div className="divide-y">
            {upcoming.map((s) => {
              const cls = classes.find((c) => c.id === s.class_id)!;
              return (
                <div key={s.id} className="py-3 flex items-center gap-4">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-[10px] uppercase text-muted-foreground">{new Date(s.lesson_date).toLocaleDateString("en", { weekday: "short" })}</div>
                    <div className="text-xl font-semibold">{new Date(s.lesson_date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{cls.name}</div>
                    <div className="text-xs text-muted-foreground">{s.start_time}–{s.end_time}</div>
                  </div>
                  <Button asChild size="sm" variant="outline"><Link to="/attendance">Take attendance</Link></Button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">My Payroll Logs</h3>
          <div className="space-y-3">
            {myLogs.slice(0, 5).map((l) => (
              <div key={l.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{l.lesson_date}</span>
                  <Badge variant={l.status === "Approved" ? "default" : "outline"}>{l.status}</Badge>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{l.hours}h · {l.class_id}</span>
                  <span className="font-semibold text-foreground">{formatVND(l.total_pay)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
