"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GitBranch, Settings, Clock, Key, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/projects", label: "Projects", icon: GitBranch },
    { href: "/sync", label: "Synchronization", icon: GitBranch },
    { href: "/scheduler", label: "Scheduler", icon: Clock },
    { href: "/credentials", label: "Credentials", icon: Key },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <GitBranch className="w-6 h-6 text-sidebar-primary" />
          <h1 className="text-xl font-bold text-sidebar-foreground">Git Sync</h1>
        </div>

        <nav className="space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                pathname === href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
