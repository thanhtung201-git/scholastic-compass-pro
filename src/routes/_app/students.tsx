import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Mail, Phone, Loader2, Trash2, Edit2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/students")({ component: StudentsPage });

function StudentsPage() {
  const [q, setQ] = useState("");
  const { students, classes, branches, enrolments, tuitionInvoices, addStudent, updateStudent, addAuditLog, deleteStudent, loading } = useDatabase();
  const { user: currentUser } = useAuth();
  
  // Form State for Add
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parentName, setParentName] = useState("");
  const [enrolledClass, setEnrolledClass] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State for Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editEnrolledClass, setEditEnrolledClass] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const filtered = students.filter((s) => 
    s.name?.toLowerCase().includes(q.toLowerCase()) || 
    s.email?.toLowerCase().includes(q.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !enrolledClass || !branchId) return;

    setSubmitting(true);
    try {
      const studentId = crypto.randomUUID();
      await addStudent({
        id: studentId,
        name,
        email,
        phone: phone || "—",
        parent_name: parentName || "—",
        enrolled_class: enrolledClass,
        branch_id: branchId
      });

      await addAuditLog(currentUser?.name || "System", `Added student ${name}`, email, "create");

      // Reset
      setName("");
      setEmail("");
      setPhone("");
      setParentName("");
      setEnrolledClass("");
      setBranchId("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editEmail || !editEnrolledClass || !editBranchId || !editingStudent) return;

    setEditSubmitting(true);
    try {
      await updateStudent(editingStudent.id, {
        name: editName,
        email: editEmail,
        phone: editPhone || "—",
        parent_name: editParentName || "—",
        enrolled_class: editEnrolledClass,
        branch_id: editBranchId
      });

      await addAuditLog(currentUser?.name || "System", `Updated student ${editName}`, editEmail, "update");

      setIsEditOpen(false);
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openEditDialog = (student: any) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPhone(student.phone);
    setEditParentName(student.parent_name);
    setEditEnrolledClass(student.enrolled_class);
    setEditBranchId(student.branch_id);
    setIsEditOpen(true);
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Students" 
        description={`${students.length} learners across ${branches.length} branches`} 
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter student details. Adding a student automatically creates their enrolment and tuition invoice.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@mcnaedu.vn" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="parentName">Parent's Name</Label>
                    <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Nguyen Van B" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Enrolled Class</Label>
                  <Select value={enrolledClass} onValueChange={setEnrolledClass} required>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin mr-1" />} Save Student
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } 
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="editName">Full Name</Label>
              <Input id="editName" required value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nguyen Van A" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editEmail">Email</Label>
              <Input id="editEmail" type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="student@mcnaedu.vn" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editPhone">Phone</Label>
                <Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="0901234567" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editParentName">Parent's Name</Label>
                <Input id="editParentName" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} placeholder="Nguyen Van B" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Enrolled Class</Label>
              <Select value={editEnrolledClass} onValueChange={setEditEnrolledClass} required>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Branch</Label>
              <Select value={editBranchId} onValueChange={setEditBranchId} required>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name.replace("MCNAEdu — ", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting && <Loader2 className="size-4 animate-spin mr-1" />} Update Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="pl-8 h-9" />
          </div>
          <Badge variant="secondary">{filtered.length} results</Badge>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Tuition</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const cls = classes.find((c) => c.id === s.enrolled_class);
                const enrol = enrolments.find((e) => e.student_id === s.id);
                const branch = branches.find((b) => b.id === s.branch_id);
                const invoice = tuitionInvoices.find((inv) => inv.student_id === s.id);
                
                // Map status values for display
                const statusDisplay: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
                  "Active": { label: "Đang học", variant: "default" },
                  "Dropped": { label: "Bỏ học", variant: "destructive" },
                  "Completed": { label: "Đã hoàn thành", variant: "secondary" },
                  "Expelled": { label: "Đuổi học", variant: "destructive" },
                  "Preserved": { label: "Tạm dừng", variant: "outline" }
                };
                const statusInfo = statusDisplay[enrol?.status as keyof typeof statusDisplay] || { label: enrol?.status || "—", variant: "outline" as const };
                
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">Parent: {s.parent_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1"><Mail className="size-3" /> {s.email}</div>
                      <div className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="size-3" /> {s.phone}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{cls?.name || "—"}</Badge></TableCell>
                    <TableCell className="text-xs">{branch?.name.replace("MCNAEdu — ", "") || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {invoice?.issued_at ? new Date(invoice.issued_at).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={enrol?.tuition_status === "Paid" ? "default" : enrol?.tuition_status === "Unpaid" ? "destructive" : "secondary"}
                      >
                        {enrol?.tuition_status || "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(s)} title="Edit">
                        <Edit2 className="size-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        if (confirm("Are you sure you want to delete this student?")) {
                          await deleteStudent(s.id);
                          await addAuditLog(currentUser?.name || "System", `Deleted student ${s.name}`, s.email, "security");
                        }
                      }} title="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
