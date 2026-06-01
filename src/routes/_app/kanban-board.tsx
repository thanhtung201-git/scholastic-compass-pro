import { createFileRoute } from "@tanstack/react-router";
import { Kanban } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/kanban-board")({
  component: KanbanBoardPage,
});

function KanbanBoardPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Kanban Board"
        description="Track tasks across project workflow stages."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={Kanban}
          title="Kanban board is ready"
          description="Columns and task cards can be added here."
        />
      </div>
    </div>
  );
}
