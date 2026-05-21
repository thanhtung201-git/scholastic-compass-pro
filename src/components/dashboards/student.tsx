import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Receipt, ClipboardList, ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { students, classes, enrolments, tuitionInvoices, schedules, homeworkAssignments, courses, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find the student matching the logged-in user's email, or fall back to the first student
  const me = students.find((s) => s.email === user?.email) || students[0];

  if (!me) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No student record found. Please enroll as a student.
      </div>
    );
  }

  const myEnrol = enrolments.find((e) => e.student_id === me.id);
  const myClass = myEnrol ? classes.find((c) => c.id === myEnrol.class_id) : null;
  const myInvoice = myEnrol ? tuitionInvoices.find((i) => i.enrolment_id === myEnrol.id) : null;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = myClass ? schedules.filter((s) => s.class_id === myClass.id && s.lesson_date >= today).slice(0, 4) : [];
  const myHomework = myClass ? homeworkAssignments.filter((h) => h.class_id === myClass.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={`Hi, ${me.name}`} description={myClass ? `Class ${myClass.name} · ${courses.find((c) => c.id === myClass.course_id)?.name}` : "Not currently enrolled in an active class"} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tuition Status" value={myInvoice?.status || "No Invoice"} hint={myInvoice ? formatVND(myInvoice.remaining_debt) + " due" : "No active dues"} icon={Receipt} tone={myInvoice?.status === "Paid" ? "success" : "warning"} />
        <StatCard label="Active Class" value={myClass?.name || "None"} hint={myClass?.start_date || "No start date"} icon={BookOpen} tone="info" />
        <StatCard label="Upcoming Lessons" value={upcoming.length} hint="next 2 weeks" icon={Calendar} />
        <StatCard label="Homework Due" value={myHomework.length} icon={ClipboardList} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Schedule</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/schedule">Open calendar <ArrowUpRight className="size-3" /></Link></Button>
          </div>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No upcoming lessons scheduled.</div>
            ) : upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px]">{new Date(s.lesson_date).toLocaleDateString("en", { month: "short" })}</span>
                  <span className="text-sm font-semibold leading-none">{new Date(s.lesson_date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{myClass?.name || "Class"}</div>
                  <div className="text-xs text-muted-foreground">{s.start_time}–{s.end_time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Tuition Summary</h3>
          {myInvoice ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Due</span><span className="font-medium">{formatVND(myInvoice.amount_due)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-success">{formatVND(myInvoice.amount_paid)}</span></div>
                <div className="flex justify-between pt-2 border-t"><span>Remaining</span><span className="font-semibold text-destructive">{formatVND(myInvoice.remaining_debt)}</span></div>
              </div>
              <Button className="w-full mt-4">Request Payment Help</Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-6">No tuition details available.</div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Available Classes — Submit Enrolment</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.filter((c) => c.status === "Active").map((c) => (
            <div key={c.id} className="rounded-lg border p-4 hover:shadow-md transition">
              <Badge variant="secondary" className="mb-2 text-[10px]">{c.name}</Badge>
              <div className="font-medium text-sm">{courses.find((co) => co.id === c.course_id)?.name}</div>
              <div className="text-xs text-muted-foreground mt-1">Starts {c.start_date}</div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm font-semibold">{formatVND(courses.find((co) => co.id === c.course_id)?.price ?? 0)}</div>
                <Button size="sm" variant="outline"><CheckCircle2 className="size-3" /> Enrol</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

