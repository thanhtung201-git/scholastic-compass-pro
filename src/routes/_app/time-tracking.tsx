import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/time-tracking")({
  component: TimeTrackingPage,
});

function TimeTrackingPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Time Tracking"
        description="Track time spent across tasks and project work."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={Timer}
          title="Time tracking is ready"
          description="Timesheets and task timers can be added here."
        />
      </div>
    </div>
  );
}
