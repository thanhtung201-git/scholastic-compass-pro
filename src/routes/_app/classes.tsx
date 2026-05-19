import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users } from "lucide-react";
import { classes, courses, teachers, classrooms, enrolments, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/classes")({ component: ClassesPage });

function ClassesPage() {
  return (
    <div>
      <PageHeader title="Classes" description="Manage class offerings and teacher assignments." actions={<Button><Plus className="size-4" /> Create Class</Button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => {
          const course = courses.find((co) => co.id === c.course_id)!;
          const teacher = teachers.find((t) => t.id === c.teacher_id);
          const room = classrooms.find((r) => r.id === c.room_id);
          const enrolled = enrolments.filter((e) => e.class_id === c.id && e.status === "Active").length;
          const fill = (enrolled / c.max_capacity) * 100;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={c.status === "Active" ? "default" : "secondary"} className="mb-2 text-[10px]">{c.status}</Badge>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{course.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatVND(course.price)}</div>
                  <div className="text-[10px] text-muted-foreground">per term</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Users className="size-3" /> {teacher?.name}</div>
                <div className="flex items-center gap-1.5"><Calendar className="size-3" /> Starts {c.start_date} · {room?.name}</div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Enrolment</span>
                  <span className="font-medium">{enrolled}/{c.max_capacity}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${fill}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
