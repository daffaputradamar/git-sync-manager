"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData } from "@/lib/storage-client"
import type { AppData } from "@/lib/types"
import { GitBranch, Clock, Key, FolderKanban } from "lucide-react"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { CreateCredentialDialog } from "@/components/create-credential-dialog"
import { CreateSchedulerDialog } from "@/components/create-scheduler-dialog"

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    loadData().then(setData).catch(console.error)
  }, [])

  const refreshData = async () => {
    const updatedData = await loadData()
    setData(updatedData)
  }

  if (!data) return null

  const allRepositories = data.projects.flatMap((p) => p.repositories)

  const stats = [
    { label: "Projects", value: data.projects.length, icon: FolderKanban, href: "/projects" },
    {
      label: "Repositories",
      value: data.projects.reduce((sum, p) => sum + p.repositories.length, 0),
      icon: GitBranch,
      href: "/projects",
    },
    { label: "Scheduled Jobs", value: data.scheduledJobs.length, icon: Clock, href: "/scheduler" },
    { label: "Credentials", value: data.credentials.length, icon: Key, href: "/credentials" },
  ]

  const upcomingJobs = data.scheduledJobs
    .filter((job) => job.enabled && job.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt || 0).getTime() - new Date(b.nextRunAt || 0).getTime())
    .slice(0, 5)

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
              <h2 className="text-xl font-bold text-foreground mb-4">Upcoming Scheduled Jobs</h2>
              {upcomingJobs.length === 0 ? (
                <p className="text-muted-foreground">No scheduled jobs upcoming</p>
              ) : (
                <div className="space-y-3">
                  {upcomingJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{job.name}</p>
                        <p className="text-sm text-muted-foreground">{job.cronExpression}</p>
                        {job.nextRunAt && (
                          <p className="text-xs text-muted-foreground">Next run: {new Date(job.nextRunAt).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="px-3 py-1 rounded text-sm font-medium bg-blue-500/20 text-blue-400">
                        Scheduled
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
                <CreateProjectDialog
                  onSuccess={refreshData}
                  trigger={<Button className="w-full">New Project</Button>}
                />
                <CreateCredentialDialog
                  onSuccess={refreshData}
                  trigger={
                    <Button variant="outline" className="w-full bg-transparent">
                      Add Credential
                    </Button>
                  }
                />
                <CreateSchedulerDialog
                  repositories={allRepositories}
                  onSuccess={refreshData}
                  projects={data?.projects}
                  trigger={
                    <Button variant="outline" className="w-full bg-transparent">
                      Schedule Sync Job
                    </Button>
                  }
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
