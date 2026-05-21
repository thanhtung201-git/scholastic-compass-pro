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
import { Search, Plus, Mail, Phone, Loader2, Trash2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/students")({ component: StudentsPage });

function StudentsPage() {
  const [q, setQ] = useState("");
  const { students, classes, branches, enrolments, addStudent, addAuditLog, deleteStudent, loading } = useDatabase();
  const { user: currentUser } = useAuth();
  
  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parentName, setParentName] = useState("");
  const [enrolledClass, setEnrolledClass] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      if (currentUser) {
        await addAuditLog(currentUser.name, `Added student ${name}`, email, "create");
      }

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
                <TableHead>Tuition</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const cls = classes.find((c) => c.id === s.enrolled_class);
                const enrol = enrolments.find((e) => e.student_id === s.id);
                const branch = branches.find((b) => b.id === s.branch_id);
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
                      <Badge
                        variant={enrol?.tuition_status === "Paid" ? "default" : enrol?.tuition_status === "Unpaid" ? "destructive" : "secondary"}
                      >
                        {enrol?.tuition_status || "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        if (confirm("Are you sure you want to delete this student?")) {
                          await deleteStudent(s.id);
                          if (currentUser) {
                            await addAuditLog(currentUser.name, `Deleted student ${s.name}`, s.email, "security");
                          }
                        }
                      }}>
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
