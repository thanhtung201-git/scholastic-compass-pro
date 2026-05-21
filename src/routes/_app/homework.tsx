import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/homework")({ component: HomeworkPage });

function HomeworkPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const { loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Homework & Grading" description={isStudent ? "Track assignments and submit your work." : "Manage assignments and grade submissions."} />
      <Tabs defaultValue={isStudent ? "submit" : "grade"}>
        <TabsList>
          {!isStudent && <TabsTrigger value="grade">Grading Grid</TabsTrigger>}
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          {isStudent && <TabsTrigger value="submit">Submit Work</TabsTrigger>}
        </TabsList>

        {!isStudent && <TabsContent value="grade" className="mt-4"><GradingGrid /></TabsContent>}

        <TabsContent value="assignments" className="mt-4">
          <AssignmentsList />
        </TabsContent>

        {isStudent && <TabsContent value="submit" className="mt-4"><StudentSubmissions /></TabsContent>}
      </Tabs>
    </div>
  );
}

function GradingGrid() {
  const { submissions, students, homeworkAssignments, submitGrade, addAuditLog } = useDatabase();
  const { user: currentUser } = useAuth();

  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (submissions.length > 0) {
      setScores(Object.fromEntries(submissions.map((s) => [s.id, s.score])));
      setFeedbacks(Object.fromEntries(submissions.map((s) => [s.id, s.teacher_feedback ?? ""])));
    }
  }, [submissions]);

  const saveGrade = async (id: string) => {
    const score = scores[id];
    const feedback = feedbacks[id] || "";
    if (score === undefined || score === null) return toast.error("Please enter a valid score.");
    if (score < 0 || score > 10) return toast.error("Score must be between 0 and 10.");

    setSubmitting((prev) => ({ ...prev, [id]: true }));
    try {
      await submitGrade(id, score, feedback);
      
      if (currentUser) {
        const sub = submissions.find((s) => s.id === id);
        const stuName = students.find((st) => st.id === sub?.student_id)?.name || "Student";
        await addAuditLog(currentUser.name, `Graded homework for ${stuName}`, `Score: ${score}/10`, "update");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Score /10</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead className="w-28">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((s) => {
            const stu = students.find((st) => st.id === s.student_id);
            const a = homeworkAssignments.find((h) => h.id === s.assignment_id);
            return (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{stu?.name || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px]"><div className="truncate">{a?.title || "—"}</div></TableCell>
                <TableCell>
                  <Badge variant={s.submission_status === "Graded" ? "default" : s.submission_status === "Pending" ? "outline" : s.submission_status === "Late" ? "destructive" : "secondary"}>
                    {s.submission_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number" min={0} max={10} step={0.5}
                    value={scores[s.id] ?? ""}
                    onChange={(e) => setScores({ ...scores, [s.id]: e.target.value ? Number(e.target.value) : null })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input value={feedbacks[s.id] ?? ""} onChange={(e) => setFeedbacks({ ...feedbacks, [s.id]: e.target.value })} placeholder="Comments…" className="h-8" />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => saveGrade(s.id)} disabled={submitting[s.id]}>
                    {submitting[s.id] ? <Loader2 className="size-3 animate-spin mr-1" /> : <CheckCircle2 className="size-3 mr-1" />} Save
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function AssignmentsList() {
  const { homeworkAssignments, classes, submissions, addHomework, addAuditLog } = useDatabase();
  const { user: currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [classId, setClassId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !classId || !dueDate) return;

    setSubmitting(true);
    try {
      const assignmentId = crypto.randomUUID();
      await addHomework({
        id: assignmentId,
        class_id: classId,
        title,
        description: description || "—",
        due_date: dueDate
      });

      if (currentUser) {
        const clsName = classes.find((c) => c.id === classId)?.name || "Class";
        await addAuditLog(currentUser.name, `Assigned homework for ${clsName}`, title, "create");
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setClassId("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {homeworkAssignments.map((a) => {
        const cls = classes.find((c) => c.id === a.class_id);
        const subs = submissions.filter((s) => s.assignment_id === a.id);
        return (
          <Card key={a.id} className="p-5">
            <Badge variant="outline" className="mb-2 text-[10px]">{cls?.name || "—"}</Badge>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Due {a.due_date}</span>
              <span className="font-medium">{subs.length} submitted</span>
            </div>
          </Card>
        );
      })}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Card className="p-5 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 cursor-pointer transition min-h-[140px]">
            <Plus className="size-6 mb-2" />
            <span className="text-sm font-medium">New Assignment</span>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Homework Assignment</DialogTitle>
            <DialogDescription>
              Assign new homework to a class. Enter title, instructions, and due date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Essay: Technology in Education" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Instructions / Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write a 250-word essay arguing your view." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId} required>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />} Assign Homework
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentSubmissions() {
  const { homeworkAssignments } = useDatabase();
  const [text, setText] = useState("");
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {homeworkAssignments.slice(0, 3).map((a) => (
        <Card key={a.id} className="p-5">
          <h3 className="font-semibold">{a.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
          <div className="text-xs text-muted-foreground mt-2">Due {a.due_date}</div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your answer or paste a link…" className="mt-3 min-h-[100px]" />
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => toast.success("Submission sent!")}><Upload className="size-3 mr-1" /> Submit</Button>
            <Button size="sm" variant="outline">Save Draft</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
