import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, credentials, scheduledJobs, repositories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// GET - Get all application data from PostgreSQL
export async function GET() {
  try {
    // Fetch all data from database
    const allProjects = await db.select().from(projects)
    const allCredentials = await db.select().from(credentials)
    const allScheduledJobs = await db.select().from(scheduledJobs)
    const allRepositories = await db.select().from(repositories)

    // Build hierarchical structure matching AppData interface
    const projectsWithRepos = await Promise.all(
      allProjects.map(async (project) => {
        const projectRepos = allRepositories.filter((r) => r.projectId === project.id)
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          repositories: projectRepos.map((repo) => ({
            id: repo.id,
            name: repo.name,
            tfsUrl: repo.tfsUrl,
            githubUrl: repo.githubUrl,
            tfsCredentialId: repo.tfsCredentialId,
            githubCredentialId: repo.githubCredentialId,
            syncDirection: repo.syncDirection,
            ignoreRules: typeof repo.ignoreRules === "string" ? JSON.parse(repo.ignoreRules) : (repo.ignoreRules || []),
            conflictPolicy: repo.conflictPolicy,
            branchPairs: Array.isArray(repo.branchPairs) ? repo.branchPairs : (typeof repo.branchPairs === "string" ? JSON.parse(repo.branchPairs) : []),
            lastSyncAt: repo.lastSyncAt?.toISOString(),
            lastSyncStatus: repo.lastSyncStatus,
            createdAt: repo.createdAt?.toISOString(),
          })),
          createdAt: project.createdAt?.toISOString(),
        }
      })
    )

    const data = {
      projects: projectsWithRepos,
      credentials: allCredentials.map((c) => ({
        id: c.id,
        name: c.username, // Using username as name for compatibility
        type: c.type,
        username: c.username,
        token: c.token,
        url: c.url,
        createdAt: c.createdAt?.toISOString(),
      })),
      scheduledJobs: allScheduledJobs.map((job) => ({
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
      })),
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("GET data error:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

// DELETE - Clear all application data from PostgreSQL
export async function DELETE() {
  try {
    // Delete all data from database (in correct order due to foreign keys)
    await db.delete(scheduledJobs)
    await db.delete(repositories)
    await db.delete(credentials)
    await db.delete(projects)

    return NextResponse.json({ message: "All data cleared successfully" })
  } catch (error) {
    console.error("DELETE data error:", error)
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 })
  }
}
