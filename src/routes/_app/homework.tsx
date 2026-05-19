import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, CheckCircle2 } from "lucide-react";
import { homeworkAssignments, submissions, students, classes } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/homework")({ component: HomeworkPage });

function HomeworkPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "Student";

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
  const [scores, setScores] = useState<Record<string, number | null>>(Object.fromEntries(submissions.map((s) => [s.id, s.score])));
  const [feedback, setFeedback] = useState<Record<string, string>>(Object.fromEntries(submissions.map((s) => [s.id, s.teacher_feedback ?? ""])));

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
                <TableCell className="font-medium">{stu?.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px]"><div className="truncate">{a?.title}</div></TableCell>
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
                  <Input value={feedback[s.id]} onChange={(e) => setFeedback({ ...feedback, [s.id]: e.target.value })} placeholder="Comments…" className="h-8" />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => toast.success(`Saved grade for ${stu?.name}`)}>
                    <CheckCircle2 className="size-3" /> Save
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
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {homeworkAssignments.map((a) => {
        const cls = classes.find((c) => c.id === a.class_id);
        const subs = submissions.filter((s) => s.assignment_id === a.id);
        return (
          <Card key={a.id} className="p-5">
            <Badge variant="outline" className="mb-2 text-[10px]">{cls?.name}</Badge>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Due {a.due_date}</span>
              <span className="font-medium">{subs.length} submitted</span>
            </div>
          </Card>
        );
      })}
      <Card className="p-5 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 cursor-pointer transition">
        <Plus className="size-6 mb-2" />
        <span className="text-sm font-medium">New Assignment</span>
      </Card>
    </div>
  );
}

function StudentSubmissions() {
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
            <Button size="sm" onClick={() => toast.success("Submission sent!")}><Upload className="size-3" /> Submit</Button>
            <Button size="sm" variant="outline">Save Draft</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
