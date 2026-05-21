import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/hooks/use-database";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/audit")({ component: AuditPage });

function AuditPage() {
  const { auditLogs, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every action across the system, fully traceable." />
      <Card className="p-6">
        <ol className="relative border-l border-border ml-3 space-y-6">
          {auditLogs.map((log) => (
            <li key={log.id} className="ml-6">
              <span className="absolute -left-[7px] flex size-3.5 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-sm">{log.actor}</span>
                <span className="text-sm text-muted-foreground">{log.action}</span>
                <Badge variant="outline" className="text-[10px]">{log.type}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{log.target}</div>
              <time className="text-[11px] text-muted-foreground">{log.time}</time>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

