import {
  LayoutDashboard, Users, ClipboardList, GraduationCap,
  Receipt, ClipboardCheck, Banknote, Shield, FileText, CheckSquare, CreditCard, Wallet,
  Kanban, ChartGantt, CalendarClock, UsersRound, MessagesSquare, Timer,
  BookOpen, Calendar, Home, FolderKanban, Megaphone, Target, Tag, Gift, PhoneCall, BarChart3,
  Settings, type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  roles: Role[];
  /** Admin-only items that bypass enabled_modules filtering */
  alwaysVisible?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ALL_ROLES_LIST: Role[] = [
  "Admin", "Director", "HR Manager", "HR Staff",
  "Academic Manager", "Academic Staff",
  "Finance Manager", "Accountant",
  "Marketing Manager", "Marketing Staff",
];

export const FINANCE_ROLES: Role[] = ["Director", "Admin", "Finance Manager", "Accountant"];
export const HR_ROLES: Role[] = ["Director", "Admin", "HR Manager", "HR Staff"];
export const ACADEMIC_ROLES: Role[] = ["Director", "Admin", "Academic Manager", "Academic Staff"];
export const MARKETING_ROLES: Role[] = ["Director", "Admin", "Marketing Manager", "Marketing Staff"];

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Core",
    items: [
      { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES_LIST },
    ],
  },
  {
    label: "Finance & Accounting",
    items: [
      { key: "tuition", title: "Tuition Invoices", url: "/tuition", icon: Receipt, roles: FINANCE_ROLES },
      { key: "accounting.payments", title: "Payments", url: "/accounting/payments", icon: CreditCard, roles: FINANCE_ROLES },
      { key: "accounting.expenses", title: "Expenses", url: "/accounting/expenses", icon: Wallet, roles: FINANCE_ROLES },
      { key: "accounting.balance-sheet", title: "Balance Sheet", url: "/accounting/balance-sheet", icon: FileText, roles: FINANCE_ROLES },
      { key: "payroll", title: "Payroll", url: "/payroll", icon: Banknote, roles: FINANCE_ROLES },
      { key: "salary", title: "Salary", url: "/salary", icon: Banknote, roles: FINANCE_ROLES },
    ],
  },
  {
    label: "Human Resources",
    items: [
      { key: "teachers", title: "Teachers", url: "/teachers", icon: Users, roles: HR_ROLES },
      { key: "employees", title: "Employees", url: "/employees", icon: Users, roles: HR_ROLES },
      { key: "attendance-tracking", title: "Attendance Tracking", url: "/attendance-tracking", icon: ClipboardCheck, roles: HR_ROLES },
      { key: "leave-approve", title: "Leave Approve", url: "/leave-approve", icon: ClipboardList, roles: HR_ROLES },
    ],
  },
  {
    label: "Academic",
    items: [
      { key: "students", title: "Students", url: "/students", icon: GraduationCap, roles: ACADEMIC_ROLES },
      { key: "classes", title: "Classes", url: "/classes", icon: BookOpen, roles: ACADEMIC_ROLES },
      { key: "schedule", title: "Schedule", url: "/schedule", icon: Calendar, roles: ACADEMIC_ROLES },
      { key: "homework", title: "Homework", url: "/homework", icon: ClipboardList, roles: ACADEMIC_ROLES },
      { key: "attendance", title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ACADEMIC_ROLES },
      { key: "rooms", title: "Rooms", url: "/rooms", icon: Home, roles: ACADEMIC_ROLES },
    ],
  },
  {
    label: "Project Management",
    items: [
      { key: "projects", title: "Projects", url: "/projects", icon: FolderKanban, roles: ALL_ROLES_LIST },
      { key: "task-assignment", title: "Task Assignment", url: "/task-assignment", icon: CheckSquare, roles: ALL_ROLES_LIST },
      { key: "kanban-board", title: "Kanban Board", url: "/kanban-board", icon: Kanban, roles: ALL_ROLES_LIST },
      { key: "gantt-chart", title: "Gantt Chart", url: "/gantt-chart", icon: ChartGantt, roles: ALL_ROLES_LIST },
      { key: "sprint-planning", title: "Sprint Planning", url: "/sprint-planning", icon: CalendarClock, roles: ALL_ROLES_LIST },
      { key: "workload-view", title: "Workload View", url: "/workload-view", icon: UsersRound, roles: ALL_ROLES_LIST },
      { key: "comments-threads", title: "Comments & Threads", url: "/comments-threads", icon: MessagesSquare, roles: ALL_ROLES_LIST },
      { key: "time-tracking", title: "Time Tracking", url: "/time-tracking", icon: Timer, roles: ALL_ROLES_LIST },
    ],
  },
  {
    label: "Marketing",
    items: [
      { key: "marketing.leads", title: "Leads", url: "/marketing/leads", icon: Target, roles: MARKETING_ROLES },
      { key: "marketing.campaigns", title: "Campaigns", url: "/marketing/campaigns", icon: Megaphone, roles: MARKETING_ROLES },
      { key: "marketing.sources", title: "Sources", url: "/marketing/sources", icon: Tag, roles: MARKETING_ROLES },
      { key: "marketing.promotions", title: "Promotions", url: "/marketing/promotions", icon: Gift, roles: MARKETING_ROLES },
      { key: "marketing.follow-up", title: "Follow-up", url: "/marketing/follow-up", icon: PhoneCall, roles: MARKETING_ROLES },
      { key: "marketing.reports", title: "Reports", url: "/marketing/reports", icon: BarChart3, roles: MARKETING_ROLES },
    ],
  },
  {
    label: "Administration",
    items: [
      { key: "users", title: "User Management", url: "/users", icon: Shield, roles: ["Admin"] },
      { key: "audit", title: "Audit Logs", url: "/audit", icon: FileText, roles: ["Admin"] },
      { key: "system-setup", title: "System Setup", url: "/system-setup", icon: Settings, roles: ["Admin"], alwaysVisible: true },
    ],
  },
];

/** All toggleable module keys (excludes always-visible admin utilities). */
export const TOGGLEABLE_MODULE_KEYS: string[] = NAV_SECTIONS.flatMap((s) =>
  s.items.filter((i) => !i.alwaysVisible).map((i) => i.key)
);

export const DEFAULT_ENABLED_MODULES: string[] = [...TOGGLEABLE_MODULE_KEYS];

export function getAllNavItems(): NavItem[] {
  return NAV_SECTIONS.flatMap((s) => s.items);
}

export function getModuleLabel(key: string): string {
  return getAllNavItems().find((i) => i.key === key)?.title ?? key;
}
