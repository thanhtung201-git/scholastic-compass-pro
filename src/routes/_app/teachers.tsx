import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const { teachers = [], branches = [], loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Teachers" description="List of teachers in the system" />
        <Card className="p-4 text-center text-muted-foreground">No teachers found.</Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Teachers" description="List of teachers" />
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Hourly Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((t) => {
              const branch = branches.find((b) => b.id === t.branch_id);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{branch?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVND(t.hourly_rate)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
