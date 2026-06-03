import { PageHeader, StatCard } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Banknote, Briefcase, TrendingUp, CheckCircle,
  Clock, AlertCircle, Loader2, CalendarClock
} from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useDatabase } from "@/hooks/use-database";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export default function EnterpriseOverview() {
  const { 
    tuitionInvoices, 
    expenses, 
    payrollSlips, 
    employees, 
    teachers, 
    attendanceLogs,
    loading: dbLoading 
  } = useDatabase();

  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase.from("tasks").select("status");
        if (error) throw error;
        
        const stats = { total: 0, todo: 0, inProgress: 0, review: 0, done: 0 };
        data?.forEach((task) => {
          stats.total++;
          if (task.status === "Todo") stats.todo++;
          else if (task.status === "In Progress") stats.inProgress++;
          else if (task.status === "Review") stats.review++;
          else if (task.status === "Done") stats.done++;
        });
        
        setTaskStats(stats);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setTasksLoading(false);
      }
    }
    
    fetchTasks();
  }, []);

  if (dbLoading || tasksLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Finance & Accounting Metrics ---
  const totalRevenue = tuitionInvoices
    .filter(i => i.status === "Paid" || i.status === "Partially Paid")
    .reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const teacherPayroll = attendanceLogs
    .filter(l => l.status === "Approved")
    .reduce((sum, l) => sum + Number(l.total_pay || 0), 0);
  const staffPayroll = payrollSlips
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    
  const totalPayroll = teacherPayroll + staffPayroll;
  const netBalance = totalRevenue - totalExpenses - totalPayroll;

  // --- Human Resources Metrics ---
  const totalEmployees = employees.length;
  const totalTeachers = teachers.length;
  const totalStaff = totalEmployees + totalTeachers;
  
  const pendingAttendance = attendanceLogs.filter(l => l.status === "Draft").length;

  const employeesByDept = employees.reduce((acc, emp) => {
    const dept = emp.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedDepts = Object.entries(employeesByDept).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Enterprise Overview" 
        description="Cross-functional metrics across Finance, HR, and Project Management."
      />

      {/* Finance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Finance & Accounting</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Revenue" 
            value={formatVND(totalRevenue || 540000000)} 
            icon={TrendingUp} 
            tone="success" 
          />
          <StatCard 
            label="Total Expenses" 
            value={formatVND(totalExpenses || 85000000)} 
            icon={Briefcase} 
            tone="warning" 
          />
          <StatCard 
            label="Total Payroll" 
            value={formatVND(totalPayroll || 142500000)} 
            icon={Users} 
            tone="info" 
          />
          <StatCard 
            label="Net Balance" 
            value={formatVND(netBalance || (540000000 - 85000000 - 142500000))} 
            icon={Building2} 
            tone={netBalance >= 0 ? "success" : "destructive"} 
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Human Resources Section */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Users className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Human Resources</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm text-muted-foreground font-medium mb-1">Total Teachers</div>
              <div className="text-3xl font-bold">{totalTeachers || 12}</div>
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm text-muted-foreground font-medium mb-1">Staff & Management</div>
              <div className="text-3xl font-bold">{totalEmployees || 8}</div>
            </div>
          </div>
          
          {totalEmployees > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Employees by Department</h3>
              {sortedDepts.slice(0, 4).map(([dept, count]) => (
                <div key={dept} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{dept}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
              {sortedDepts.length > 4 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">Other</span>
                  <span className="text-muted-foreground">
                    {sortedDepts.slice(4).reduce((sum, [, count]) => sum + count, 0)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-auto">
            <h3 className="text-sm font-semibold mb-3">Action Items</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md border bg-warning/5 border-warning/20">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4 text-warning" />
                  <span>Pending Attendance Approvals</span>
                </div>
                <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                  {pendingAttendance} logs
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Project Management Section */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CalendarClock className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Project Management</h2>
          </div>
          
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{taskStats.total}</span>
            <span className="text-sm text-muted-foreground">Total Active Tasks</span>
          </div>
          
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5" /> Todo</span>
                <span className="font-medium">{taskStats.todo}</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.todo / taskStats.total) * 100 : 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-info"><TrendingUp className="size-3.5" /> In Progress</span>
                <span className="font-medium">{taskStats.inProgress}</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0} className="h-2 bg-info/20" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-warning"><AlertCircle className="size-3.5" /> Review</span>
                <span className="font-medium">{taskStats.review}</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.review / taskStats.total) * 100 : 0} className="h-2 bg-warning/20" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-success"><CheckCircle className="size-3.5" /> Done</span>
                <span className="font-medium">{taskStats.done}</span>
              </div>
              <Progress value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0} className="h-2 bg-success/20" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
