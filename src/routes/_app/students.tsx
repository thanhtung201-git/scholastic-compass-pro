import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Mail, Phone } from "lucide-react";
import { students, classes, branches, enrolments } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/students")({ component: StudentsPage });

function StudentsPage() {
  const [q, setQ] = useState("");
  const filtered = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Students" description={`${students.length} learners across ${branches.length} branches`} actions={<Button><Plus className="size-4" /> Add Student</Button>} />
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
                    <TableCell><Badge variant="outline">{cls?.name}</Badge></TableCell>
                    <TableCell className="text-xs">{branch?.name.replace("MCNAEdu — ", "")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={enrol?.tuition_status === "Paid" ? "default" : enrol?.tuition_status === "Unpaid" ? "destructive" : "secondary"}
                      >
                        {enrol?.tuition_status}
                      </Badge>
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
