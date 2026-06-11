import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from "@/lib/auth-context"
import { useDatabase } from "@/hooks/use-database"
import { NAV_SECTIONS, type NavItem } from "@/lib/nav-config"
import type { Role } from "@/lib/types"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const { user } = useAuth()
  const { moduleAccess } = useDatabase()
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const role = user?.role as Role

  const isVisible = (item: NavItem) => {
    if (!role) return false
    if (item.alwaysVisible) return item.roles.includes(role)
    const key = item.key ?? ""
    const allowed: string[] = (key && moduleAccess && moduleAccess[key]) ? moduleAccess[key] : item.roles
    return allowed.includes(role)
  }

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div className="relative w-full">
        <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <button
          onClick={() => setOpen(true)}
          className="pl-8 h-9 w-full rounded-md bg-muted/40 border-0 text-sm text-muted-foreground text-left flex items-center justify-between pr-2 hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span>Search menus...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(isVisible)
            if (visibleItems.length === 0) return null

            return (
              <CommandGroup key={section.label} heading={section.label}>
                {visibleItems.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={item.title}
                    onSelect={() => {
                      runCommand(() => navigate({ to: item.url }))
                    }}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
