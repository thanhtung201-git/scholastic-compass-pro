import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import AdminDashboard from "@/components/dashboards/admin";
import AcademicDashboard from "@/components/dashboards/academic";
import AccountantDashboard from "@/components/dashboards/accountant";
import DirectorDashboard from "@/components/dashboards/director";
import ReceptionistDashboard from "@/components/dashboards/receptionist";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case "Admin": return <AdminDashboard />;
    case "Academic Staff": return <AcademicDashboard />;
    case "Accountant": return <AccountantDashboard />;
    case "Director": return <DirectorDashboard />;
    case "Receptionist": return <ReceptionistDashboard />;
    case "Teacher":
      return <div className="p-8 text-center text-muted-foreground">This portal is for management staff only.</div>;
  }
}
