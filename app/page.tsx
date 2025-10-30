"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData } from "@/lib/storage"
import type { AppData } from "@/lib/types"
import { GitBranch, Clock, Key } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    setData(loadData())
  }, [])

  if (!data) return null

  const stats = [
    { label: "Projects", value: data.projects.length, icon: GitBranch, href: "/projects" },
    {
      label: "Repositories",
      value: data.projects.reduce((sum, p) => sum + p.repositories.length, 0),
      icon: GitBranch,
      href: "/projects",
    },
    { label: "Scheduled Jobs", value: data.scheduledJobs.length, icon: Clock, href: "/scheduler" },
    { label: "Credentials", value: data.credentials.length, icon: Key, href: "/credentials" },
  ]

  const recentSyncs = data.syncLogs.slice(-5).reverse()

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" description="Overview of your Git synchronization setup" />

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href}>
              <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Recent Synchronizations</h2>
              {recentSyncs.length === 0 ? (
                <p className="text-muted-foreground">No synchronizations yet</p>
              ) : (
                <div className="space-y-3">
                  {recentSyncs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{log.message}</p>
                        <p className="text-sm text-muted-foreground">{new Date(log.startedAt).toLocaleString()}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          log.status === "success"
                            ? "bg-green-500/20 text-green-400"
                            : log.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {log.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/projects/new">
                  <Button className="w-full">New Project</Button>
                </Link>
                <Link href="/credentials/new">
                  <Button variant="outline" className="w-full bg-transparent">
                    Add Credential
                  </Button>
                </Link>
                <Link href="/scheduler">
                  <Button variant="outline" className="w-full bg-transparent">
                    Manage Scheduler
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
