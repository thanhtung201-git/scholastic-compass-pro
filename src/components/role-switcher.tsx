import { useAuth } from "@/lib/auth-context";
import { ALL_ROLES, type Role } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1">
      <Badge variant="outline" className="gap-1 border-warning/40 bg-warning/10 text-warning-foreground">
        <UserCog className="size-3" /> Demo
      </Badge>
      <Select value={user.role} onValueChange={(v) => switchRole(v as Role)}>
        <SelectTrigger className="h-7 border-0 shadow-none w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
