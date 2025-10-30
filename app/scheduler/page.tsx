"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, createScheduledJob, deleteScheduledJob, updateScheduledJob } from "@/lib/storage"
import type { AppData } from "@/lib/types"
import { Trash2, Plus, Power } from "lucide-react"

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9 AM", value: "0 9 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every weekday at 9 AM", value: "0 9 * * 1-5" },
  { label: "First day of month at 9 AM", value: "0 9 1 * *" },
]

export default function SchedulerPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    repositoryId: "",
    name: "",
    schedule: "0 0 * * *", // daily at midnight
  })

  useEffect(() => {
    setData(loadData())
  }, [])

  const handleCreateJob = () => {
    if (form.repositoryId && form.name.trim() && form.schedule.trim()) {
      createScheduledJob(form.repositoryId, form.name, form.schedule)
      setForm({ repositoryId: "", name: "", schedule: "0 0 * * *" })
      setShowForm(false)
      setData(loadData())
    }
  }

  const handleToggleJob = (id: string, enabled: boolean) => {
    updateScheduledJob(id, { enabled: !enabled })
    setData(loadData())
  }

  const handleDeleteJob = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled job?")) {
      deleteScheduledJob(id)
      setData(loadData())
    }
  }

  if (!data) return null

  const allRepositories = data.projects.flatMap((p) => p.repositories)

  return (
    <div className="flex flex-col h-full">
      <Header title="Scheduler" description="Manage automated synchronization schedules" />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Scheduled Job
            </Button>
          ) : (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Create Scheduled Job</h2>
              <div className="space-y-4">
                <select
                  value={form.repositoryId}
                  onChange={(e) => setForm({ ...form, repositoryId: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a repository</option>
                  {allRepositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Job name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Cron Schedule</label>
                  <input
                    type="text"
                    placeholder="0 0 * * * (daily at midnight)"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Format: minute hour day month weekday</p>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Quick presets:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CRON_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setForm({ ...form, schedule: preset.value })}
                          className="text-xs px-3 py-1 bg-muted hover:bg-accent rounded border border-border text-foreground transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateJob} className="flex-1">
                    Create Job
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {data.scheduledJobs.map((job) => {
            const repo = allRepositories.find((r) => r.id === job.repositoryId)
            return (
              <Card key={job.id} className={`p-6 ${!job.enabled ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{job.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{repo?.name || "Unknown repository"}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Schedule: <span className="text-foreground font-mono">{job.schedule}</span>
                      </p>
                      {job.lastRunAt && (
                        <p className="text-muted-foreground">Last run: {new Date(job.lastRunAt).toLocaleString()}</p>
                      )}
                      {job.nextRunAt && (
                        <p className="text-muted-foreground">Next run: {new Date(job.nextRunAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleJob(job.id, job.enabled)}
                      className={job.enabled ? "text-green-400" : "text-muted-foreground"}
                      title={job.enabled ? "Disable job" : "Enable job"}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {data.scheduledJobs.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No scheduled jobs yet. Create one to automate synchronization!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
