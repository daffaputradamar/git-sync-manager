import { type NextRequest, NextResponse } from "next/server"
import { loadData } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const data = loadData()
    const job = data.scheduledJobs.find((j) => j.id === jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Sync all repositories in this job
    const syncResults = []
    for (const repositoryId of job.repositoryIds) {
      // Find the project for this repository
      const project = data.projects.find((p) => p.repositories.some((r) => r.id === repositoryId))

      if (!project) {
        syncResults.push({
          repositoryId,
          error: "Project not found",
        })
        continue
      }

      // Trigger sync via API
      const syncResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryId: repositoryId,
          projectId: project.id,
        }),
      })

      const syncResult = await syncResponse.json()
      syncResults.push({
        repositoryId,
        success: syncResult.success,
        result: syncResult,
      })
    }

    return NextResponse.json({
      message: "Job triggered successfully",
      syncResults,
    })
  } catch (error: any) {
    console.error("Scheduler trigger error:", error)
    return NextResponse.json({ error: error.message || "Failed to trigger job" }, { status: 500 })
  }
}
