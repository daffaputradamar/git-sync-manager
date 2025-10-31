import cron, { ScheduledTask } from "node-cron"
import { CronExpressionParser } from "cron-parser"
import { loadData, saveData } from "./storage"
import type { ScheduledJob } from "./types"

// Store active cron tasks
const activeTasks = new Map<string, ScheduledTask>()

let isSchedulerInitialized = false

export function startScheduler() {
  if (isSchedulerInitialized) {
    console.log("Scheduler already running")
    return
  }

  console.log("Starting scheduler...")

  // Load all scheduled jobs and start them
  const data = loadData()
  for (const job of data.scheduledJobs) {
    if (job.enabled) {
      startJob(job)
    }
  }

  isSchedulerInitialized = true
  console.log(`Scheduler started with ${data.scheduledJobs.filter((j) => j.enabled).length} active jobs`)
}

export function stopScheduler() {
  console.log("Stopping scheduler...")

  // Stop all active tasks
  for (const [jobId, task] of activeTasks.entries()) {
    task.stop()
    activeTasks.delete(jobId)
  }
}

export function startJob(job: ScheduledJob) {
  // Validate cron expression
  if (!cron.validate(job.cronExpression)) {
    console.error(`Invalid cron expression for job ${job.id}: ${job.cronExpression}`)
    return false
  }

  // Stop existing task if any
  if (activeTasks.has(job.id)) {
    activeTasks.get(job.id)?.stop()
  }

  // Create and start new task
  const task = cron.schedule(job.cronExpression, async () => {
    console.log(`Running scheduled job: ${job.name} (${job.id})`)
    console.log(`[scheduler] Syncing ${job.repositoryIds.length} repository(ies)`)

    try {
      // Sync all repositories in this job
      const syncResults = []
      for (const repositoryId of job.repositoryIds) {
        try {
          console.log(`[scheduler] Syncing repository: ${repositoryId}`)
          
          // Call the sync API for this repository
          const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              repositoryId: repositoryId,
              projectId: getProjectIdForRepository(repositoryId),
            }),
          })

          const result = await response.json()
          syncResults.push({
            repositoryId,
            success: result.success,
            error: result.error,
          })
          
          console.log(`[scheduler] Repository ${repositoryId} sync:`, result.success ? "Success" : "Failed")
        } catch (error) {
          console.error(`[scheduler] Failed to sync repository ${repositoryId}:`, error)
          syncResults.push({
            repositoryId,
            success: false,
            error: String(error),
          })
        }
      }

      // Update job with last run time
      const data = loadData()
      const jobData = data.scheduledJobs.find((j) => j.id === job.id)
      if (jobData) {
        jobData.lastRunAt = new Date().toISOString()
        jobData.nextRunAt = getNextRunTime(job.cronExpression)
        saveData(data) // Save updated data
      }

      const allSuccess = syncResults.every((r) => r.success)
      console.log(`[scheduler] Job ${job.name} completed:`, {
        total: syncResults.length,
        success: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
        status: allSuccess ? "All Success" : "Some Failed",
      })
    } catch (error) {
      console.error(`[scheduler] Job ${job.name} failed:`, error)
    }
  })

  task.start()
  activeTasks.set(job.id, task)

  // Update job with next run time
  const data = loadData()
  const jobData = data.scheduledJobs.find((j) => j.id === job.id)
  if (jobData) {
    jobData.nextRunAt = getNextRunTime(job.cronExpression)
    saveData(data)
  }

  console.log(`[scheduler] Started job: ${job.name} (${job.id}) with schedule: ${job.cronExpression}`)
  console.log(`[scheduler] Configured to sync ${job.repositoryIds.length} repository(ies)`)
  return true
}

export function stopJob(jobId: string) {
  const task = activeTasks.get(jobId)
  if (task) {
    task.stop()
    activeTasks.delete(jobId)
    console.log(`Stopped job: ${jobId}`)
    return true
  }
  return false
}

export function restartJob(job: ScheduledJob) {
  stopJob(job.id)
  return startJob(job)
}

export function getNextRunTime(cronExpression: string): string {
  try {
    // Parse cron expression and calculate actual next run time
    const interval = CronExpressionParser.parse(cronExpression)
    const next = interval.next().toDate()
    return next.toISOString()
  } catch (error) {
    console.error("Failed to parse cron expression:", error)
    return new Date(Date.now() + 3600000).toISOString() // Default to 1 hour from now
  }
}

function getProjectIdForRepository(repositoryId: string): string | undefined {
  const data = loadData()
  const project = data.projects.find((p) => p.repositories.some((r) => r.id === repositoryId))
  return project?.id
}

export function isValidCronExpression(expression: string): boolean {
  return cron.validate(expression)
}

// Common cron expressions for reference
export const CRON_PRESETS = {
  EVERY_MINUTE: "* * * * *",
  EVERY_5_MINUTES: "*/5 * * * *",
  EVERY_15_MINUTES: "*/15 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_2_HOURS: "0 */2 * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  EVERY_12_HOURS: "0 */12 * * *",
  DAILY_AT_MIDNIGHT: "0 0 * * *",
  DAILY_AT_NOON: "0 12 * * *",
  WEEKLY_MONDAY: "0 0 * * 1",
  WEEKLY_FRIDAY: "0 0 * * 5",
  MONTHLY: "0 0 1 * *",
}
