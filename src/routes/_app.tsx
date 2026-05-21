import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RoleSwitcher } from "@/components/role-switcher";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Bell, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

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
              <div className="relative w-full">
                <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students, classes, invoices…" className="pl-8 h-9 bg-muted/40 border-0" />
              </div>
            </div>
            <div className="flex-1 md:hidden" />
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <Button variant="ghost" size="icon" className="size-9 relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
              </Button>
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
    </SidebarProvider>
  );
}
