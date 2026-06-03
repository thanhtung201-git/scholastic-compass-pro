import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import SharedDashboard from "@/components/dashboards/admin";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Admin và Director dùng chung dashboard đầy đủ
  if (user.role === "Admin" || user.role === "Director") {
    return <SharedDashboard />;
  }

  return (
    <div className="p-8 text-center text-muted-foreground">
      This portal is for management staff only.
    </div>
  );
}