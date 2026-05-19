import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auditLogs } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/audit")({ component: AuditPage });

function AuditPage() {
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
