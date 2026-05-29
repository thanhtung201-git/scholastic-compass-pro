import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Eye, GripHorizontal } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  phone?: string;
  status: string;
  source?: { name: string };
  assigned_staff_id?: string;
  last_contact_at?: string;
}

interface LeadKanbanViewProps {
  leads: Lead[];
  users: any[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Interested: "bg-blue-100 text-blue-800",
  "Trial Scheduled": "bg-yellow-100 text-yellow-800",
  Registered: "bg-green-100 text-green-800",
  Paid: "bg-green-100 text-green-800",
  Lost: "bg-red-100 text-red-800",
};

const STATUSES = ["New", "Interested", "Trial Scheduled", "Registered", "Paid", "Lost"];

export function LeadKanbanView({ leads, users, onStatusChange }: LeadKanbanViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggingId || isUpdating) return;

    const lead = leads.find((l) => l.id === draggingId);
    if (lead && lead.status !== newStatus) {
      setIsUpdating(true);
      try {
        await onStatusChange(draggingId, newStatus);
      } finally {
        setIsUpdating(false);
        setDraggingId(null);
      }
    }
    setDraggingId(null);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STATUSES.map((status) => {
          const statusLeads = leads.filter((l) => l.status === status);
          return (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="flex-shrink-0 w-80 bg-muted rounded-lg p-4 min-h-[600px] flex flex-col"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-sm">{status}</h3>
                <p className="text-xs text-muted-foreground">
                  {statusLeads.length} lead{statusLeads.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {statusLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="p-3 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-2">
                      <GripHorizontal className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{lead.full_name}</p>
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.phone}
                          </p>
                        )}
                        {lead.source && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.source.name}
                          </p>
                        )}
                        {lead.assigned_staff_id && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            Staff: {users.find(u => u.id === lead.assigned_staff_id)?.name || "-"}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-6 w-6 p-0"
                          >
                            <Link to={`/marketing/leads/${lead.id}`}>
                              <Eye className="size-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
