import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ROLES, type Role } from "@/lib/types";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

function UsersPage() {
  const { users, branches, toggleUserStatus, updateUserRole, addAuditLog, deleteUser, loading } = useDatabase();
  const { user: currentUser } = useAuth();

  const toggle = async (id: string, currentStatus: string, email: string) => {
    await toggleUserStatus(id, currentStatus);
    if (currentUser) {
      const action = currentStatus === "Active" ? "Blocked user account" : "Activated user account";
      await addAuditLog(currentUser.name, action, email, "security");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="User Management" description="Toggle account status and review roles." actions={<Button>Invite User</Button>} />
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {currentUser?.role === "Admin" ? (
                    <Select
                      value={u.role}
                      onValueChange={async (newRole) => {
                        await updateUserRole(u.id, newRole as Role);
                        await addAuditLog(currentUser.name, `Changed role of user ${u.name} to ${newRole}`, u.email, "security");
                      }}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{u.role}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">{branches.find((b) => b.id === u.branch_id)?.name.replace("MCNAEdu — ", "") || "—"}</TableCell>
                <TableCell><Badge variant={u.status === "Active" ? "default" : "destructive"}>{u.status}</Badge></TableCell>
                <TableCell>
                  <Switch 
                    checked={u.status === "Active"} 
                    onCheckedChange={() => toggle(u.id, u.status, u.email)} 
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    if (confirm("Are you sure you want to delete this user?")) {
                      await deleteUser(u.id);
                      if (currentUser) {
                        await addAuditLog(currentUser.name, `Deleted user ${u.name}`, u.email, "security");
                      }
                    }
                  }}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
