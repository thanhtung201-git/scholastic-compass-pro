import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/workload-view")({
  component: WorkloadViewPage,
});

function WorkloadViewPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Workload View"
        description="Monitor team assignments and capacity."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={UsersRound}
          title="Workload view is ready"
          description="Team capacity and allocation details can be added here."
        />
      </div>
    </div>
  );
}
