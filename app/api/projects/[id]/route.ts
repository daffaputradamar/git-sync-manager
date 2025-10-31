import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, repositories, scheduledJobs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)

    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const projectRepos = await db.select().from(repositories).where(eq(repositories.projectId, id))

    return NextResponse.json({
      id: project[0].id,
      name: project[0].name,
      description: project[0].description,
      repositories: projectRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        tfsUrl: repo.tfsUrl,
        githubUrl: repo.githubUrl,
        tfsCredentialId: repo.tfsCredentialId,
        githubCredentialId: repo.githubCredentialId,
        syncDirection: repo.syncDirection,
        ignoreRules: typeof repo.ignoreRules === "string" ? JSON.parse(repo.ignoreRules) : [],
        conflictPolicy: repo.conflictPolicy,
        branchPairs: typeof repo.branchPairs === "string" ? JSON.parse(repo.branchPairs) : [],
        lastSyncAt: repo.lastSyncAt?.toISOString(),
        lastSyncStatus: repo.lastSyncStatus,
        createdAt: repo.createdAt?.toISOString(),
      })),
      createdAt: project[0].createdAt?.toISOString(),
    })
  } catch (error) {
    console.error("GET project error:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

// PUT - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const updated = await db
      .update(projects)
      .set({
        name,
        description: description || "",
      })
      .where(eq(projects.id, id))
      .returning()

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const projectRepos = await db.select().from(repositories).where(eq(repositories.projectId, id))

    return NextResponse.json({
      id: updated[0].id,
      name: updated[0].name,
      description: updated[0].description,
      repositories: projectRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        tfsUrl: repo.tfsUrl,
        githubUrl: repo.githubUrl,
        tfsCredentialId: repo.tfsCredentialId,
        githubCredentialId: repo.githubCredentialId,
        syncDirection: repo.syncDirection,
        ignoreRules: typeof repo.ignoreRules === "string" ? JSON.parse(repo.ignoreRules) : [],
        conflictPolicy: repo.conflictPolicy,
        branchPairs: typeof repo.branchPairs === "string" ? JSON.parse(repo.branchPairs) : [],
        lastSyncAt: repo.lastSyncAt?.toISOString(),
        lastSyncStatus: repo.lastSyncStatus,
        createdAt: repo.createdAt?.toISOString(),
      })),
      createdAt: updated[0].createdAt?.toISOString(),
    })
  } catch (error) {
    console.error("PUT project error:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

// DELETE - Delete project (cascades to repositories and jobs)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Delete associated scheduled jobs, repositories (cascade handled by DB)
    await db.delete(scheduledJobs).where(eq(scheduledJobs.projectId, id))
    await db.delete(repositories).where(eq(repositories.projectId, id))
    
    const deleted = await db.delete(projects).where(eq(projects.id, id)).returning()

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE project error:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
