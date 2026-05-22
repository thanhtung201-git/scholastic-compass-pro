import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Calendar, Users, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/classes")({ component: ClassesPage });

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function ClassesPage() {
  const { classes, courses, teachers, classrooms, enrolments, branches, createClass, updateClass, deleteClass, addAuditLog, loading } = useDatabase();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxCapacity, setMaxCapacity] = useState("18");
  const [submitting, setSubmitting] = useState(false);

  // Alert Dialog State for delete validation
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !courseId || !teacherId || !roomId || !branchId) return;

    setSubmitting(true);
    try {
      const classId = crypto.randomUUID();
      await createClass({
        id: classId,
        course_id: courseId,
        name,
        start_date: startDate,
        status: "Active",
        max_capacity: Number(maxCapacity),
        teacher_id: teacherId,
        room_id: roomId,
        branch_id: branchId
      });

      if (currentUser) {
        await addAuditLog(currentUser.name, `Created class ${name}`, `Class ID: ${classId}`, "create");
      }

      // Reset
      setName("");
      setCourseId("");
      setTeacherId("");
      setRoomId("");
      setBranchId("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setMaxCapacity("18");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (classData: any) => {
    const enrolled = enrolments.filter((e) => e.class_id === classData.id && e.status === "Active").length;
    
    if (enrolled > 0) {
      setClassToDelete({ ...classData, enrolled });
      setDeleteAlertOpen(true);
    } else {
      // No students, delete directly
      if (confirm(`Are you sure you want to delete ${classData.name}?`)) {
        deleteClass(classData.id);
        addAuditLog(currentUser?.name || "System", `Deleted class ${classData.name}`, `Class ID: ${classData.id}`, "security");
      }
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Classes" 
        description="Manage class offerings and teacher assignments." 
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Create Class</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new class. Select a course, teacher, room, and branch.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Class Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="IELTS-A03" />
                </div>
                <div className="space-y-1">
                  <Label>Course Offering</Label>
                  <Select value={courseId} onValueChange={setCourseId} required>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({formatVND(c.price)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Teacher</Label>
                  <Select value={teacherId} onValueChange={setTeacherId} required>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.subject})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Classroom</Label>
                    <Select value={roomId} onValueChange={setRoomId} required>
                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent>
                        {classrooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Branch</Label>
                    <Select value={branchId} onValueChange={setBranchId} required>
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name.replace("MCNAEdu — ", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxCapacity">Max Capacity</Label>
                    <Input id="maxCapacity" type="number" required min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin mr-1" />} Create Class
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } 
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => {
          const course = courses.find((co) => co.id === c.course_id);
          const teacher = teachers.find((t) => t.id === c.teacher_id);
          const room = classrooms.find((r) => r.id === c.room_id);
          const enrolled = enrolments.filter((e) => e.class_id === c.id && e.status === "Active").length;
          const fill = c.max_capacity > 0 ? (enrolled / c.max_capacity) * 100 : 0;
          return (
            <Card key={c.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={c.status === "Active" ? "default" : "secondary"} className="mb-2 text-[10px]">{c.status}</Badge>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{course?.name || "—"}</p>
                </div>
                <div className="text-right flex items-start gap-2">
                  <div>
                    <div className="text-sm font-semibold">{course ? formatVND(course.price) : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">per term</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 -mr-2"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4 mr-2" /> Edit Class
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit Class</DialogTitle>
                            <DialogDescription>Update class details.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            await updateClass(c.id, {
                              name: fd.get("name"),
                              course_id: fd.get("courseId"),
                              teacher_id: fd.get("teacherId"),
                              room_id: fd.get("roomId"),
                              branch_id: fd.get("branchId"),
                              start_date: fd.get("startDate"),
                              max_capacity: Number(fd.get("maxCapacity")),
                              status: fd.get("status")
                            });
                            if (currentUser) {
                              await addAuditLog(currentUser.name, `Updated class ${c.name}`, `Class ID: ${c.id}`, "update");
                            }
                            // To close the dialog automatically, we'd need controlled state, but for MVP re-fetching or clicking out works.
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                          }} className="space-y-4 pt-4">
                            <div className="space-y-1">
                              <Label htmlFor={`name-${c.id}`}>Class Name</Label>
                              <Input id={`name-${c.id}`} name="name" required defaultValue={c.name} />
                            </div>
                            <div className="space-y-1">
                              <Label>Course Offering</Label>
                              <Select name="courseId" defaultValue={c.course_id} required>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {courses.map((co) => <SelectItem key={co.id} value={co.id}>{co.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Teacher</Label>
                              <Select name="teacherId" defaultValue={c.teacher_id} required>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label>Classroom</Label>
                                <Select name="roomId" defaultValue={c.room_id} required>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {classrooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label>Branch</Label>
                                <Select name="branchId" defaultValue={c.branch_id} required>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name.replace("MCNAEdu — ", "")}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`start-${c.id}`}>Start Date</Label>
                                <Input id={`start-${c.id}`} name="startDate" type="date" required defaultValue={c.start_date} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`cap-${c.id}`}>Capacity</Label>
                                <Input id={`cap-${c.id}`} name="maxCapacity" type="number" required min="1" defaultValue={c.max_capacity} />
                              </div>
                              <div className="space-y-1">
                                <Label>Status</Label>
                                <Select name="status" defaultValue={c.status} required>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Ended">Ended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter className="pt-4">
                              <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => {
                        handleDeleteClick(c);
                      }}>
                        <Trash2 className="size-4 mr-2" /> Delete Class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Users className="size-3" /> {teacher?.name || "No teacher"}</div>
                <div className="flex items-center gap-1.5"><Calendar className="size-3" /> Starts {c.start_date} · {room?.name || "No room"}</div>
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

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ⚠️ Không thể xóa lớp học này!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="space-y-3">
            <p>
              Lớp học hiện đang có <strong>{classToDelete?.enrolled} học sinh</strong> đang theo học (Xem hình bạn chụp: lớp <strong>{classToDelete?.name}</strong> có <strong>{classToDelete?.enrolled}/{classToDelete?.max_capacity}</strong> Enrolment). 
            </p>
            <p>
              Bạn không thể xóa lớp học khi còn học sinh bên trong.
            </p>
            <p className="text-sm font-semibold">
              Để xóa lớp này, vui lòng chuyển học sinh sang lớp khác hoặc xóa lịch sử đăng ký của học sinh trước.
            </p>
          </AlertDialogDescription>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate({ to: "/students" })}
              className="bg-primary hover:bg-primary/90"
            >
              Đi tới danh sách học sinh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
