import { getAllNavItems } from "@/lib/nav-config";

const ADMIN_ONLY_PATHS = ["/users", "/audit", "/system-setup"];

/** Longest-prefix match: pathname → menu module key */
export function getModuleKeyForPath(pathname: string): string | null {
  const items = getAllNavItems().sort((a, b) => b.url.length - a.url.length);
  for (const item of items) {
    if (pathname === item.url || pathname.startsWith(item.url + "/")) {
      return item.key;
    }
  }
  return null;
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function isModuleEnabled(
  moduleKey: string | null,
  enabledModules: string[],
  alwaysVisibleKeys: string[] = ["system-setup"]
): boolean {
  if (!moduleKey) return true;
  if (alwaysVisibleKeys.includes(moduleKey)) return true;
  if (enabledModules.length === 0) return true;
  return enabledModules.includes(moduleKey);
}
