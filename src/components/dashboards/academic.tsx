import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardList, Calendar, Plus, ArrowUpRight } from "lucide-react";
import { classes, enrolments, students, schedules, teachers } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";

export default function AcademicDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const todaySchedules = schedules.filter((s) => s.lesson_date === today);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Operations"
        description="Manage students, classes, and the master schedule."
        actions={<Button><Plus className="size-4" /> New Class</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Classes" value={classes.filter((c) => c.status === "Active").length} hint={`${classes.length} total`} icon={BookOpen} tone="info" />
        <StatCard label="Enrolled Students" value={students.length} hint="across all classes" icon={Users} tone="success" />
        <StatCard label="Teachers" value={teachers.length} hint="assigned" icon={ClipboardList} />
        <StatCard label="Today's Sessions" value={todaySchedules.length} hint="check schedule" icon={Calendar} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Class Overview</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/classes">View all <ArrowUpRight className="size-3" /></Link></Button>
          </div>
          <div className="space-y-3">
            {classes.slice(0, 5).map((cls) => {
              const enrolled = enrolments.filter((e) => e.class_id === cls.id && e.status === "Active").length;
              const fill = (enrolled / cls.max_capacity) * 100;
              return (
                <div key={cls.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition">
                  <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                    {cls.name.split("-")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{cls.name}</span>
                      <Badge variant={cls.status === "Active" ? "default" : "secondary"} className="text-[10px]">{cls.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{teachers.find((t) => t.id === cls.teacher_id)?.name}</div>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{enrolled}/{cls.max_capacity}</span><span>{Math.round(fill)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/students"><Users className="size-4" /> Manage Students</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/schedule"><Calendar className="size-4" /> Open Scheduler</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/homework"><ClipboardList className="size-4" /> Track Homework</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/payroll"><BookOpen className="size-4" /> Review Payroll</Link></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
