import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/sprint-planning")({
  component: SprintPlanningPage,
});

function SprintPlanningPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Sprint Planning"
        description="Plan sprint goals, scope, and upcoming work."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={CalendarClock}
          title="Sprint planning is ready"
          description="Backlog selection and sprint capacity can be added here."
        />
      </div>
    </div>
  );
}
