import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scheduledJobs, repositories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { startJob, stopJob, isValidCronExpression, getNextRunTime } from "@/lib/scheduler"
import "@/lib/init" // Initialize scheduler on server start

// GET - Get all scheduled jobs
export async function GET() {
  try {
    const jobs = await db.select().from(scheduledJobs)
    return NextResponse.json(
      jobs.map((job) => ({
        id: job.id,
        name: job.name,
        description: job.description,
        cronExpression: job.cronExpression,
        repositoryIds: Array.isArray(job.repositoryIds) ? job.repositoryIds : (typeof job.repositoryIds === "string" ? JSON.parse(job.repositoryIds) : []),
        enabled: job.enabled,
        nextRunAt: job.nextRunAt?.toISOString(),
        lastRunAt: job.lastRunAt?.toISOString(),
        lastRunStatus: job.lastRunStatus,
        runCount: job.runCount,
        createdAt: job.createdAt?.toISOString(),
      }))
    )
  } catch (error) {
    console.error("GET scheduled jobs error:", error)
    return NextResponse.json({ error: "Failed to fetch scheduled jobs" }, { status: 500 })
  }
}

// POST - Create new scheduled job
export async function POST(request: NextRequest) {
  try {
    const { repositoryIds, name, cronExpression, description } = await request.json()

    if (!repositoryIds || !Array.isArray(repositoryIds) || repositoryIds.length === 0 || !name || !cronExpression) {
      return NextResponse.json({ error: "Missing required fields (repositoryIds, name, and cronExpression are required)" }, { status: 400 })
    }

    // Validate cron expression
    if (!isValidCronExpression(cronExpression)) {
      return NextResponse.json({ error: "Invalid cron expression" }, { status: 400 })
    }

    // Verify all repositories exist
    for (const repositoryId of repositoryIds) {
      const repoExists = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1)
      if (!repoExists || repoExists.length === 0) {
        return NextResponse.json({ error: `Repository ${repositoryId} not found` }, { status: 404 })
      }
    }

    const job = await db
      .insert(scheduledJobs)
      .values({
        name,
        description: description || "",
        cronExpression,
        repositoryIds: repositoryIds as any,
        enabled: true,
        nextRunAt: new Date(getNextRunTime(cronExpression) || new Date()),
      })
      .returning()

    const createdJob = {
      id: job[0].id,
      name: job[0].name,
      description: job[0].description,
      cronExpression: job[0].cronExpression,
      repositoryIds: Array.isArray(job[0].repositoryIds) ? job[0].repositoryIds : (typeof job[0].repositoryIds === "string" ? JSON.parse(job[0].repositoryIds) : []),
      enabled: job[0].enabled,
      nextRunAt: job[0].nextRunAt?.toISOString(),
      lastRunAt: job[0].lastRunAt?.toISOString(),
      lastRunStatus: job[0].lastRunStatus,
      runCount: job[0].runCount,
      createdAt: job[0].createdAt?.toISOString(),
    }

    // Start the job
    startJob(createdJob as any)

    return NextResponse.json(createdJob, { status: 201 })
  } catch (error) {
    console.error("POST scheduled job error:", error)
    return NextResponse.json({ error: "Failed to create scheduled job" }, { status: 500 })
  }
}

// PUT - Update scheduled job
export async function PUT(request: NextRequest) {
  try {
    const { id, name, cronExpression, enabled, repositoryIds, description } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = await db.select().from(scheduledJobs).where(eq(scheduledJobs.id, id)).limit(1)

    if (!job || job.length === 0) {
      return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 })
    }

    // Validate cron expression if provided
    if (cronExpression && !isValidCronExpression(cronExpression)) {
      return NextResponse.json({ error: "Invalid cron expression" }, { status: 400 })
    }

    // Validate repositories if provided
    if (repositoryIds) {
      if (!Array.isArray(repositoryIds) || repositoryIds.length === 0) {
        return NextResponse.json({ error: "repositoryIds must be non-empty array" }, { status: 400 })
      }
      for (const repositoryId of repositoryIds) {
        const repoExists = await db
          .select()
          .from(repositories)
          .where(eq(repositories.id, repositoryId))
          .limit(1)
        if (!repoExists || repoExists.length === 0) {
          return NextResponse.json({ error: `Repository ${repositoryId} not found` }, { status: 404 })
        }
      }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (cronExpression !== undefined) {
      updateData.cronExpression = cronExpression
      updateData.nextRunAt = getNextRunTime(cronExpression)
    }
    if (enabled !== undefined) updateData.enabled = enabled
    if (repositoryIds !== undefined) updateData.repositoryIds = repositoryIds as any
    if (description !== undefined) updateData.description = description

    const updated = await db
      .update(scheduledJobs)
      .set(updateData)
      .where(eq(scheduledJobs.id, id))
      .returning()

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 })
    }

    const updatedJob = {
      id: updated[0].id,
      name: updated[0].name,
      description: updated[0].description,
      cronExpression: updated[0].cronExpression,
      repositoryIds: Array.isArray(updated[0].repositoryIds) ? updated[0].repositoryIds : (typeof updated[0].repositoryIds === "string" ? JSON.parse(updated[0].repositoryIds) : []),
      enabled: updated[0].enabled,
      nextRunAt: updated[0].nextRunAt?.toISOString(),
      lastRunAt: updated[0].lastRunAt?.toISOString(),
      lastRunStatus: updated[0].lastRunStatus,
      runCount: updated[0].runCount,
      createdAt: updated[0].createdAt?.toISOString(),
    }

    // Restart job with new configuration
    if (updatedJob.enabled) {
      stopJob(updatedJob.id)
      startJob(updatedJob as any)
    } else {
      stopJob(updatedJob.id)
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("PUT scheduled job error:", error)
    return NextResponse.json({ error: "Failed to update scheduled job" }, { status: 500 })
  }
}

// DELETE - Delete scheduled job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Stop the job
    stopJob(id)

    const deleted = await db.delete(scheduledJobs).where(eq(scheduledJobs.id, id)).returning()

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE scheduled job error:", error)
    return NextResponse.json({ error: "Failed to delete scheduled job" }, { status: 500 })
  }
}
