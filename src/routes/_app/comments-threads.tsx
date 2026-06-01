import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_app/comments-threads")({
  component: CommentsThreadsPage,
});

function CommentsThreadsPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Comments & Threads"
        description="Centralize project discussion and task conversations."
      />
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={MessagesSquare}
          title="Comments and threads are ready"
          description="Project discussion threads can be added here."
        />
      </div>
    </div>
  );
}
