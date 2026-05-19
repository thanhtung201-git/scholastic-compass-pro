import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceLogs, classes, teachers, formatVND } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Clock, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const [selected, setSelected] = useState(attendanceLogs[0].id);
  const log = attendanceLogs.find((l) => l.id === selected)!;
  const [roster, setRoster] = useState(log.student_attendance);
  const cls = classes.find((c) => c.id === log.class_id)!;
  const teacher = teachers.find((t) => t.id === log.teacher_id)!;

  const setStatus = (sid: string, status: string) => {
    setRoster((r) => r.map((s) => s.student_id === sid ? { ...s, status } : s));
  };

  const counts = {
    present: roster.filter((s) => s.status === "Present").length,
    absent: roster.filter((s) => s.status === "Absent").length,
    late: roster.filter((s) => s.status === "Late").length,
  };

  return (
    <div>
      <PageHeader title="Attendance & Lesson Logs" description="Take attendance and submit your hourly log for payroll." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Lesson Sessions</h3>
          <Select value={selected} onValueChange={(v) => { setSelected(v); setRoster(attendanceLogs.find((l) => l.id === v)!.student_attendance); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {attendanceLogs.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.class_id.toUpperCase()} · {l.lesson_date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span className="font-medium">{cls.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Teacher</span><span className="font-medium">{teacher.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Hours</span><span className="font-medium">{log.hours}h</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">{formatVND(log.hourly_rate)}/h</span></div>
            <div className="flex justify-between pt-2 border-t"><span>Total Pay</span><span className="font-semibold text-primary">{formatVND(log.total_pay)}</span></div>
            <div className="pt-2"><Badge variant={log.status === "Approved" ? "default" : "outline"}>{log.status}</Badge></div>
          </div>
          <Button className="w-full mt-4" onClick={() => toast.success("Lesson log submitted for approval")}><Save className="size-4" /> Submit Log</Button>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Student Roster</h3>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="bg-success/10 border-success/30 text-success">{counts.present} Present</Badge>
              <Badge variant="outline" className="bg-warning/10 border-warning/30 text-warning-foreground">{counts.late} Late</Badge>
              <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">{counts.absent} Absent</Badge>
            </div>
          </div>
          <div className="space-y-2">
            {roster.map((s) => (
              <div key={s.student_id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                  {s.student_name.split(" ").slice(-2).map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 font-medium text-sm">{s.student_name}</div>
                <div className="flex gap-1">
                  <Button size="sm" variant={s.status === "Present" ? "default" : "outline"} onClick={() => setStatus(s.student_id, "Present")}><CheckCircle2 className="size-3" /></Button>
                  <Button size="sm" variant={s.status === "Late" ? "default" : "outline"} onClick={() => setStatus(s.student_id, "Late")}><Clock className="size-3" /></Button>
                  <Button size="sm" variant={s.status === "Absent" ? "destructive" : "outline"} onClick={() => setStatus(s.student_id, "Absent")}><XCircle className="size-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
