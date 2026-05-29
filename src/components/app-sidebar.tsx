import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, GraduationCap,
  Receipt, ClipboardCheck, Banknote, Shield, DoorOpen, FileText, CheckSquare, Target, ChevronDown, Tag, CreditCard, Wallet, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Role } from "@/lib/types";

interface NavItem { 
  title: string; 
  url: string; 
  icon: LucideIcon; 
  roles: Role[]; 
}

interface NavSection {
  label: string;
  items: (NavItem | NavItemWithChildren)[];
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[];
}

// Navigation sections organized by category
const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Director"] },
    ]
  },
  {
    label: "Academic",
    items: [
      { title: "Students", url: "/students", icon: Users, roles: ["Admin", "Director", "Academic Manager", "Academic Staff"] },
      { title: "Classes", url: "/classes", icon: BookOpen, roles: ["Admin", "Director", "Academic Manager", "Academic Staff"] },
      { title: "Schedule", url: "/schedule", icon: Calendar, roles: ["Admin", "Director", "Academic Manager", "Academic Staff"] },
      { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["Admin", "Director", "Academic Manager", "Academic Staff"] },
      { title: "Homework", url: "/homework", icon: ClipboardList, roles: ["Admin", "Director", "Academic Manager", "Academic Staff"] },
    ]
  },
  {
    label: "Finance & Accounting",
    items: [
      { title: "Tuition Invoices", url: "/tuition", icon: Receipt, roles: ["Accountant","Admin","Director","Student"] },
      { title: "Payments", url: "/accounting/payments", icon: CreditCard, roles: ["Accountant","Admin","Director"] },
      { title: "Expenses", url: "/accounting/expenses", icon: Wallet, roles: ["Accountant","Admin","Director"] },
      { title: "Payroll", url: "/payroll", icon: Banknote, roles: ["Accountant","Academic Staff","Director","Teacher","Admin"] },
      { title: "Rooms & Guests", url: "/rooms", icon: DoorOpen, roles: ["Admin", "Director", "Finance Manager", "Accountant"] },
    ]
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Marketing",
        url: "/marketing",
        icon: Target,
        roles: ["Admin", "Director", "Academic Staff"],
        children: [
          { title: "Leads", url: "/marketing/leads", icon: Users, roles: ["Admin", "Director", "Academic Staff"] },
          { title: "Campaigns", url: "/marketing/campaigns", icon: CheckSquare, roles: ["Admin", "Director", "Academic Staff"] },
          { title: "Sources", url: "/marketing/sources", icon: BookOpen, roles: ["Admin", "Director"] },
          { title: "Follow-up", url: "/marketing/follow-up", icon: ClipboardList, roles: ["Admin", "Director", "Academic Staff"] },
          { title: "Promotions", url: "/marketing/promotions", icon: Tag, roles: ["Admin", "Director"] },
        ],
      },
    ]
  },
  {
    label: "Human Resources",
    items: [
      { title: "Teachers", url: "/teachers", icon: Users, roles: ["Admin", "Director", "HR Manager", "HR Staff"] },
      { title: "Employees", url: "/employees", icon: Users, roles: ["Admin", "Director", "HR Manager", "HR Staff"] },
      { title: "Attendance Tracking", url: "/attendance-tracking", icon: ClipboardCheck, roles: ["Admin", "Director", "HR Manager", "HR Staff"] },
      { title: "Leave Approve", url: "/leave-approve", icon: ClipboardList, roles: ["Admin", "Director", "HR Manager", "HR Staff"] },
    ]
  },
  {
    label: "Project Management",
    items: [
      { title: "Task Assignment", url: "/task-assignment", icon: CheckSquare, roles: ["Admin", "Director", "HR Manager", "HR Staff", "Academic Manager", "Academic Staff", "Finance Manager", "Accountant", "Marketing Manager", "Marketing Staff"] },
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
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

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
                    const hasChildren = "children" in item && item.children;
                    const isOpen = openMenus[item.title];
                    const active = path === item.url;
                    
                    if (hasChildren && item.children) {
                      const visibleChildren = item.children.filter((child) =>
                        child.roles.includes(role)
                      );

                      if (visibleChildren.length === 0) {
                        // If no visible children, render as regular item
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
                      }

                      return (
                        <Collapsible
                          key={item.title}
                          open={isOpen}
                          onOpenChange={() => toggleMenu(item.title)}
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <item.icon className="size-4" />
                                  {!collapsed && <span>{item.title}</span>}
                                </div>
                                {!collapsed && (
                                  <ChevronDown
                                    className={`size-4 transition-transform ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenu className="pl-8 gap-2">
                                {visibleChildren.map((child) => {
                                  const childActive = path === child.url;
                                  return (
                                    <SidebarMenuItem key={child.url}>
                                      <SidebarMenuButton asChild isActive={childActive}>
                                        <Link
                                          to={child.url}
                                          className="flex items-center gap-2"
                                        >
                                          <child.icon className="size-4" />
                                          {!collapsed && <span>{child.title}</span>}
                                        </Link>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  );
                                })}
                              </SidebarMenu>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    // Regular item without children
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