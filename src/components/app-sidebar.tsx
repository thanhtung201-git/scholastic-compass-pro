import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAV_SECTIONS } from "@/lib/nav-config";
import { useDatabase } from "@/hooks/use-database";
import type { Role } from "@/lib/types";

export function AppSidebar({ role }: { role: Role }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { moduleAccess } = useDatabase();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  /** Decide if a nav item is visible to the current role */
  const isVisible = (item: { key?: string; roles: Role[]; alwaysVisible?: boolean }) => {
    if (item.alwaysVisible) return item.roles.includes(role);
    const key = item.key ?? "";
    // Use DB-stored access list if available; fall back to nav-config defaults
    const allowed: string[] = (key && moduleAccess && moduleAccess[key]) ? moduleAccess[key] : item.roles;
    return allowed.includes(role);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white">
            <img src={logo} alt="MCNA ERP" className="size-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">MCNA ERP</div>
              <div className="text-[10px] text-muted-foreground truncate">MCNA ERP Management System</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(isVisible);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label}>
              {!collapsed && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = path === item.url || path.startsWith(item.url + "/");
                    const isOpen = openMenus[item.title];

                    // Items with sub-nav use collapsible (Marketing section pattern)
                    const hasChildren = "children" in item && Array.isArray((item as any).children);
                    if (hasChildren && (item as any).children?.length > 0) {
                      const visibleChildren = ((item as any).children as any[]).filter(isVisible);
                      if (visibleChildren.length === 0) {
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
                        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleMenu(item.title)}>
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <item.icon className="size-4" />
                                  {!collapsed && <span>{item.title}</span>}
                                </div>
                                {!collapsed && (
                                  <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenu className="pl-8 gap-2">
                                {visibleChildren.map((child: any) => {
                                  const childActive = path === child.url;
                                  return (
                                    <SidebarMenuItem key={child.url}>
                                      <SidebarMenuButton asChild isActive={childActive}>
                                        <Link to={child.url} className="flex items-center gap-2">
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

                    // Regular flat item
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
