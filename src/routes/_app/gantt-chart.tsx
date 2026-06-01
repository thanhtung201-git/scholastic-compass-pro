import { createFileRoute } from "@tanstack/react-router";
import { ChartGantt } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/gantt-chart")({
  component: GanttChartPage,
});

function GanttChartPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Gantt Chart"
        description="Review project timelines, milestones, and dependencies."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={ChartGantt}
          title="Gantt chart is ready"
          description="Timeline planning can be added here."
        />
      </div>
    </div>
  );
}
