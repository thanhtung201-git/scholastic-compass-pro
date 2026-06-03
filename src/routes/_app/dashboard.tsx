import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/dashboards/admin";
import AcademicDashboard from "@/components/dashboards/academic";
import AccountantDashboard from "@/components/dashboards/accountant";
import DirectorDashboard from "@/components/dashboards/director";
import ReceptionistDashboard from "@/components/dashboards/receptionist";
import EnterpriseOverview from "@/components/dashboards/enterprise-overview";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "Admin") {
    return (
      <Tabs defaultValue="role" className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="role">Admin Console</TabsTrigger>
            <TabsTrigger value="overview">Enterprise Overview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="role" className="mt-0"><AdminDashboard /></TabsContent>
        <TabsContent value="overview" className="mt-0"><EnterpriseOverview /></TabsContent>
      </Tabs>
    );
  }

  if (user.role === "Director") {
    return (
      <Tabs defaultValue="role" className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="role">Executive Overview</TabsTrigger>
            <TabsTrigger value="overview">Enterprise Overview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="role" className="mt-0"><DirectorDashboard /></TabsContent>
        <TabsContent value="overview" className="mt-0"><EnterpriseOverview /></TabsContent>
      </Tabs>
    );
  }

  switch (user.role) {
    case "Academic Staff": return <AcademicDashboard />;
    case "Accountant": return <AccountantDashboard />;
    case "Receptionist": return <ReceptionistDashboard />;
    case "Teacher":
    case "Student": 
      return <div className="p-8 text-center text-muted-foreground">This portal is for management staff only.</div>;
    default:
      return null;
  }
}
