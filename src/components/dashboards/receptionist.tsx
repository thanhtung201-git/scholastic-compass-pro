import { useState } from "react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Users, UserPlus, Search } from "lucide-react";
import { classrooms, schedules, classes } from "@/lib/mock-data";
import { toast } from "sonner";

export default function ReceptionistDashboard() {
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState([
    { id: "g1", name: "Mr. Tran Van Hoang", purpose: "Parent meeting", time: "09:15" },
    { id: "g2", name: "Ms. Lan Pham", purpose: "Course inquiry", time: "10:30" },
  ]);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = classrooms.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  const roomBusy = (roomId: string) => schedules.some((s) => s.classroom_id === roomId && s.lesson_date === today);

  const checkIn = () => {
    const name = prompt("Guest name?");
    if (!name) return;
    const purpose = prompt("Purpose of visit?") ?? "Visitor";
    setGuests([{ id: `g${Date.now()}`, name, purpose, time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) }, ...guests]);
    toast.success(`${name} checked in`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reception Desk"
        description="Manage classroom availability and front-desk visitors."
        actions={<Button onClick={checkIn}><UserPlus className="size-4" /> Check-in Guest</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Rooms Available" value={classrooms.filter((r) => !roomBusy(r.id)).length} hint={`/ ${classrooms.length} total`} icon={DoorOpen} tone="success" />
        <StatCard label="Today's Visitors" value={guests.length} icon={Users} tone="info" />
        <StatCard label="Sessions Today" value={schedules.filter((s) => s.lesson_date === today).length} icon={DoorOpen} tone="warning" />
        <StatCard label="Branches" value={2} hint="District 1 + Thu Duc" icon={Users} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="font-semibold">Room Availability</h3>
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rooms…" className="pl-8 h-9 w-56" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((r) => {
              const busy = roomBusy(r.id);
              const sch = schedules.find((s) => s.classroom_id === r.id && s.lesson_date === today);
              const cls = sch ? classes.find((c) => c.id === sch.class_id) : null;
              return (
                <div key={r.id} className={`rounded-lg border p-4 ${busy ? "bg-warning/5 border-warning/30" : "bg-success/5 border-success/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.name}</div>
                    <Badge variant="outline" className={busy ? "text-warning-foreground border-warning/40" : "text-success border-success/40"}>{busy ? "In use" : "Free"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Capacity {r.capacity}</div>
                  {busy && cls && <div className="text-xs mt-2">{cls.name} · {sch?.start_time}–{sch?.end_time}</div>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Today's Check-ins</h3>
          <div className="divide-y">
            {guests.map((g) => (
              <div key={g.id} className="py-3">
                <div className="text-sm font-medium">{g.name}</div>
                <div className="text-xs text-muted-foreground">{g.purpose} · {g.time}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
