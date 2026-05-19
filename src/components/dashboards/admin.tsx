import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Activity, AlertTriangle, Plus, UserCheck, UserX } from "lucide-react";
import { mockUsers, auditLogs } from "@/lib/mock-data";

export default function AdminDashboard() {
  const total = 400;
  const active = mockUsers.filter((u) => u.status === "Active").length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Console"
        description="System health, account governance, and audit trail."
        actions={<Button><Plus className="size-4" /> Invite User</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Users" value={active} hint="across 2 branches" icon={UserCheck} tone="success" />
        <StatCard label="Total Students" value={total} hint="+12 this month" icon={Users} tone="info" />
        <StatCard label="Blocked Accounts" value={3} hint="review pending" icon={UserX} tone="destructive" />
        <StatCard label="System Health" value="99.98%" hint="last 30 days" icon={Shield} tone="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Audit Log Timeline</h3>
            <Badge variant="secondary"><Activity className="size-3" /> Live</Badge>
          </div>
          <ol className="relative border-l border-border ml-3 space-y-5">
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

        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Alerts</h3>
          <div className="space-y-3">
            {[
              { t: "3 attendance logs pending approval", tone: "warning" as const },
              { t: "12 unpaid invoices over 7 days", tone: "destructive" as const },
              { t: "Backup completed successfully", tone: "success" as const },
            ].map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg p-3 text-sm bg-${a.tone}/10 text-${a.tone}-foreground border border-${a.tone}/20`}>
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <span>{a.t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
