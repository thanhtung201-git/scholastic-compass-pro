import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, AlertTriangle, Plus } from "lucide-react";
import { schedules, classes, teachers, classrooms } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/schedule")({ component: SchedulePage });

function getWeekStart(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay() + 1); // Monday
  x.setHours(0, 0, 0, 0);
  return x;
}

function SchedulePage() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ class_id: classes[0].id, room_id: classrooms[0].id, teacher_id: teachers[0].id, date: "", start: "08:00", end: "10:00" });
  const [extra, setExtra] = useState<any[]>([]);

  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  }), [weekStart]);

  const all = [...schedules, ...extra];

  const conflicts = (newSch: { date: string; start: string; end: string; room_id: string; teacher_id: string }) => {
    return all.filter((s) =>
      s.lesson_date === newSch.date &&
      (s.classroom_id === newSch.room_id || s.teacher_id === newSch.teacher_id) &&
      !(newSch.end <= s.start_time || newSch.start >= s.end_time),
    );
  };

  const dryConflicts = draft.date ? conflicts({ date: draft.date, start: draft.start, end: draft.end, room_id: draft.room_id, teacher_id: draft.teacher_id }) : [];

  const submit = () => {
    if (!draft.date) return toast.error("Pick a date.");
    if (dryConflicts.length > 0) return toast.error(`Double-booking detected: ${dryConflicts.length} conflict(s).`);
    setExtra([...extra, {
      id: `new-${Date.now()}`,
      ...draft,
      lesson_date: draft.date,
      start_time: draft.start,
      end_time: draft.end,
      classroom_id: draft.room_id,
    }]);
    toast.success("Lesson added to schedule");
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Master Schedule"
        description="Weekly calendar with automatic double-booking detection."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}><ChevronRight className="size-4" /></Button>
            <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add Lesson</Button>
          </div>
        }
      />

      <Card className="p-2 overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[900px] gap-1">
          {days.map((d) => {
            const dayStr = d.toISOString().slice(0, 10);
            const daySchedules = all.filter((s) => s.lesson_date === dayStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = dayStr === new Date().toISOString().slice(0, 10);
            return (
              <div key={dayStr} className={`rounded-lg p-2 min-h-[420px] ${isToday ? "bg-primary/5 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                <div className="text-xs uppercase text-muted-foreground font-medium">{d.toLocaleDateString("en", { weekday: "short" })}</div>
                <div className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                <div className="mt-2 space-y-1.5">
                  {daySchedules.map((s) => {
                    const cls = classes.find((c) => c.id === s.class_id)!;
                    const teacher = teachers.find((t) => t.id === s.teacher_id);
                    const room = classrooms.find((r) => r.id === s.classroom_id);
                    const conflict = daySchedules.some((o) => o.id !== s.id && (o.classroom_id === s.classroom_id || o.teacher_id === s.teacher_id) && !(s.end_time <= o.start_time || s.start_time >= o.end_time));
                    return (
                      <div key={s.id} className={`rounded-md p-2 text-xs border ${conflict ? "bg-destructive/10 border-destructive/40" : "bg-card border-border"}`}>
                        <div className="font-semibold">{cls.name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.start_time}–{s.end_time}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{teacher?.name}</div>
                        <Badge variant="outline" className="mt-1 text-[9px]">{room?.name}</Badge>
                        {conflict && <Badge variant="destructive" className="ml-1 text-[9px]"><AlertTriangle className="size-2.5" /> Conflict</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Lesson to Schedule</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={draft.class_id} onValueChange={(v) => setDraft({ ...draft, class_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={draft.teacher_id} onValueChange={(v) => setDraft({ ...draft, teacher_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={draft.room_id} onValueChange={(v) => setDraft({ ...draft, room_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{classrooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
              </div>
            </div>
            {dryConflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Double-booking detected</AlertTitle>
                <AlertDescription>
                  This slot conflicts with {dryConflicts.length} existing lesson(s). Same teacher or room is already booked.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={dryConflicts.length > 0}>Add Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
