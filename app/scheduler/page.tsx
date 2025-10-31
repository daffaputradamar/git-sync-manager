"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, deleteScheduledJob, updateScheduledJob } from "@/lib/storage-client"
import type { AppData } from "@/lib/types"
import { Trash2, Power, Clock, CheckCircle2, XCircle, Calendar, Play, Pencil } from "lucide-react"
import { CreateSchedulerDialog } from "@/components/create-scheduler-dialog"
import { EditSchedulerDialog } from "@/components/edit-scheduler-dialog"

export default function SchedulerPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null)
  const [runningJobId, setRunningJobId] = useState<string | null>(null)

  useEffect(() => {
    loadData().then(setData)
  }, [])

  const refreshData = async () => {
    const updatedData = await loadData()
    setData(updatedData)
  }

  const handleToggleJob = async (id: string, enabled: boolean) => {
    setTogglingJobId(id)
    try {
      await updateScheduledJob(id, { enabled: !enabled })
      const updatedData = await loadData()
      setData(updatedData)
    } catch (error) {
      alert("Failed to toggle job")
      console.error(error)
    } finally {
      setTogglingJobId(null)
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled job?")) {
      try {
        await deleteScheduledJob(id)
        const updatedData = await loadData()
        setData(updatedData)
      } catch (error) {
        alert("Failed to delete job")
        console.error(error)
      }
    }
  }

  const handleRunJobNow = async (job: any) => {
    setRunningJobId(job.id)
    try {
      // Find the project ID for this repository
      const project = data?.projects.find((p) => 
        p.repositories.some((r) => r.id === job.repositoryId)
      )
      
      if (!project) {
        throw new Error("Project not found")
      }

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId: project.id, 
          repositoryId: job.repositoryId 
        }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      await refreshData()
      alert("Manual sync completed successfully!")
    } catch (error) {
      console.error("Failed to run job:", error)
      alert("Failed to run job. Check the console for details.")
    } finally {
      setRunningJobId(null)
    }
  }

  if (!data) return null

  const allRepositories = data.projects.flatMap((p) => p.repositories)

  return (
    <div className="flex flex-col h-full">
      <Header title="Scheduler" description="Manage automated synchronization schedules" />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Create scheduled jobs from individual project pages for better organization.
            Or use the form below to create a job (you'll need to specify the project).
          </p>
        </div>

        <div className="mb-8">
          <CreateSchedulerDialog 
            repositories={allRepositories} 
            onSuccess={refreshData}
            projects={data.projects}
          />
        </div>

        <div className="space-y-4">
          {data.scheduledJobs.map((job) => {
            const repos = allRepositories.filter((r) => (job.repositoryIds || []).includes(r.id))
            const isToggling = togglingJobId === job.id
            
            return (
              <Card 
                key={job.id} 
                className={`p-6 transition-all ${
                  job.enabled 
                    ? "border-l-4 border-l-green-500" 
                    : "border-l-4 border-l-gray-500 bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Header with title and status badge */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-foreground">{job.name}</h3>
                          <div 
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              job.enabled 
                                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                            }`}
                          >
                            {job.enabled ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Repositories display */}
                        {repos.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">
                              {repos.length} repository(ies):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {repos.map((repo) => (
                                <span
                                  key={repo.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                                  {repo.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No repositories selected</p>
                        )}
                      </div>
                    </div>

                    {/* Schedule and timing info */}
                    <div className="grid gap-3">
                      {/* Schedule */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Schedule:</span>
                        <code className="px-2 py-0.5 bg-muted rounded text-foreground font-mono">
                          {job.cronExpression}
                        </code>
                      </div>

                      {/* Last run */}
                      {job.lastRunAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Last run:</span>
                          <span className="text-foreground">
                            {new Date(job.lastRunAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Next run */}
                      {job.enabled && job.nextRunAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Next run:</span>
                          <span className="text-foreground font-medium">
                            {new Date(job.nextRunAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Status message for disabled jobs */}
                      {!job.enabled && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                          <XCircle className="w-4 h-4" />
                          <span>This job is currently disabled and will not run</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 justify-start">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRunJobNow(job)}
                      disabled={runningJobId === job.id}
                      title="Run this job immediately"
                      className="w-full"
                    >
                      <Play className={`w-4 h-4 mr-2 ${runningJobId === job.id ? "animate-pulse" : ""}`} />
                      {runningJobId === job.id ? "Running..." : "Run Now"}
                    </Button>
                    <div className="flex gap-2">
                      <EditSchedulerDialog 
                        job={job} 
                        repositories={allRepositories} 
                        onSuccess={refreshData}
                        trigger={
                          <Button variant="outline" size="icon" title="Edit job" className="flex-1">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleJob(job.id, job.enabled)}
                        disabled={isToggling}
                        className={`flex-1 ${job.enabled ? "text-muted-foreground" : "text-green-600"}`}
                        title={job.enabled ? "Disable job" : "Enable job"}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteJob(job.id)}
                        className="flex-1 text-destructive hover:bg-destructive/10 hover:border-destructive"
                        title="Delete this scheduled job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
