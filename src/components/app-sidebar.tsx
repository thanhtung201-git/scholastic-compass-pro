import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, GraduationCap,
  Receipt, ClipboardCheck, Banknote, Shield, DoorOpen, FileText, CheckSquare, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/types";

interface NavItem { 
  title: string; 
  url: string; 
  icon: LucideIcon; 
  roles: Role[]; 
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Navigation sections organized by category
const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["Admin","Academic Staff","Accountant","Director","Teacher","Student","Receptionist"] },
    ]
  },
  {
    label: "Academic",
    items: [
      { title: "Students", url: "/students", icon: Users, roles: ["Admin","Academic Staff","Director"] },
      { title: "Classes", url: "/classes", icon: BookOpen, roles: ["Admin","Academic Staff","Director","Student"] },
      { title: "Schedule", url: "/schedule", icon: Calendar, roles: ["Admin","Academic Staff","Director","Teacher","Student"] },
      { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["Teacher","Academic Staff","Admin"] },
      { title: "Homework", url: "/homework", icon: ClipboardList, roles: ["Teacher","Student","Academic Staff"] },
    ]
  },
  {
    label: "Finance & Accounting",
    items: [
      { title: "Tuition", url: "/tuition", icon: Receipt, roles: ["Accountant","Admin","Director","Student"] },
      { title: "Payroll", url: "/payroll", icon: Banknote, roles: ["Accountant","Academic Staff","Director","Teacher","Admin"] },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Rooms & Guests", url: "/rooms", icon: DoorOpen, roles: ["Receptionist","Admin"] },
    ]
  },
  {
    label: "Project Management",
    items: [
      { title: "Task Assignment", url: "/task-assignment", icon: CheckSquare, roles: ["Director","Finance Manager","Academic Manager","Admin","Accountant","Academic Staff"] },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "User Management", url: "/users", icon: Shield, roles: ["Admin"] },
      { title: "Audit Logs", url: "/audit", icon: FileText, roles: ["Admin"] },
    ]
  }
];

export function AppSidebar({ role }: { role: Role }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <GraduationCap className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">MCNAEdu CRM</div>
              <div className="text-[10px] text-muted-foreground truncate">Academic ERP</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          
          return (
            <SidebarGroup key={section.label}>
              {!collapsed && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = path === item.url;
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={item.url} className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}