import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, GraduationCap,
  Receipt, ClipboardCheck, Banknote, Shield, DoorOpen, FileText, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/types";

interface NavItem { title: string; url: string; icon: LucideIcon; roles: Role[] }

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["Admin","Academic Staff","Accountant","Director","Teacher","Receptionist"] },
  { title: "Students", url: "/students", icon: Users, roles: ["Admin","Academic Staff","Director"] },
  { title: "Classes", url: "/classes", icon: BookOpen, roles: ["Admin","Academic Staff","Director"] },
  { title: "Schedule", url: "/schedule", icon: Calendar, roles: ["Admin","Academic Staff","Director","Teacher"] },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["Teacher","Academic Staff","Admin"] },
  { title: "Homework", url: "/homework", icon: ClipboardList, roles: ["Teacher","Academic Staff"] },
  { title: "Tuition", url: "/tuition", icon: Receipt, roles: ["Accountant","Admin","Director"] },
  { title: "Payroll", url: "/payroll", icon: Banknote, roles: ["Accountant","Academic Staff","Director","Teacher","Admin"] },
  { title: "Rooms & Guests", url: "/rooms", icon: DoorOpen, roles: ["Receptionist","Admin"] },
  { title: "User Management", url: "/users", icon: Shield, roles: ["Admin"] },
  { title: "Audit Logs", url: "/audit", icon: FileText, roles: ["Admin"] },
];

export function AppSidebar({ role }: { role: Role }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = navItems.filter((i) => i.roles.includes(role));

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
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
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
      </SidebarContent>
    </Sidebar>
  );
}
