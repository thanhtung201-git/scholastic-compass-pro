import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import AdminDashboard from "@/components/dashboards/admin";
import AcademicDashboard from "@/components/dashboards/academic";
import AccountantDashboard from "@/components/dashboards/accountant";
import DirectorDashboard from "@/components/dashboards/director";
import TeacherDashboard from "@/components/dashboards/teacher";
import StudentDashboard from "@/components/dashboards/student";
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
    case "Teacher": return <TeacherDashboard />;
    case "Student": return <StudentDashboard />;
    case "Receptionist": return <ReceptionistDashboard />;
  }
}
