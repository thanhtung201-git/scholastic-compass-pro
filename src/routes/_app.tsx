import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Search, Loader2, KeyRound } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

// ─── Change Password Dialog ───────────────────────────────────────────────────
function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);
  const { user } = useAuth();

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Xác thực mật khẩu hiện tại bằng cách đăng nhập lại
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });

      if (signInErr) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      // Đổi mật khẩu mới
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        setTimeout(() => handleClose(), 1500);
      }
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Change Password
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-green-600 text-2xl">✓</div>
            <p className="text-sm font-medium text-green-700">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────
function AppLayout() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [changePwOpen, setChangePwOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading system...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar role={user.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-3 md:px-6">
            <SidebarTrigger />
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <GlobalSearch />
            </div>
            <div className="flex-1 md:hidden" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted transition">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-medium leading-tight">{user.name}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{user.role}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setChangePwOpen(true)}>
                    <KeyRound className="size-4" /> Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { signOut(); navigate({ to: "/auth" }); }}>
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Change Password Dialog — nằm ngoài header để không bị z-index che */}
      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </SidebarProvider>
  );
}