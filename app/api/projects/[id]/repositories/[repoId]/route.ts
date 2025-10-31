import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { repositories, projects, scheduledJobs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface RouteParams {
  params: Promise<{
    id: string
    repoId: string
  }>
}

// GET - Get single repository
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, repoId } = await params
    
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const repo = await db.select().from(repositories).where(eq(repositories.id, repoId)).limit(1)
    if (!repo || repo.length === 0) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: repo[0].id,
      name: repo[0].name,
      tfsUrl: repo[0].tfsUrl,
      githubUrl: repo[0].githubUrl,
      tfsCredentialId: repo[0].tfsCredentialId,
      githubCredentialId: repo[0].githubCredentialId,
      syncDirection: repo[0].syncDirection,
      ignoreRules: typeof repo[0].ignoreRules === "string" ? JSON.parse(repo[0].ignoreRules) : (repo[0].ignoreRules || []),
      conflictPolicy: repo[0].conflictPolicy,
      branchPairs: Array.isArray(repo[0].branchPairs) ? repo[0].branchPairs : (typeof repo[0].branchPairs === "string" ? JSON.parse(repo[0].branchPairs) : []),
      lastSyncAt: repo[0].lastSyncAt?.toISOString(),
      lastSyncStatus: repo[0].lastSyncStatus,
      createdAt: repo[0].createdAt?.toISOString(),
    })
  } catch (error) {
    console.error("GET repository error:", error)
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 })
  }
}

// PUT - Update repository
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, repoId } = await params
    const updates = await request.json()

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Build update object, handling JSON fields
    const updateData: Record<string, any> = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.tfsUrl !== undefined) updateData.tfsUrl = updates.tfsUrl
    if (updates.githubUrl !== undefined) updateData.githubUrl = updates.githubUrl
    if (updates.tfsCredentialId !== undefined) updateData.tfsCredentialId = updates.tfsCredentialId
    if (updates.githubCredentialId !== undefined) updateData.githubCredentialId = updates.githubCredentialId
    if (updates.syncDirection !== undefined) updateData.syncDirection = updates.syncDirection
    if (updates.conflictPolicy !== undefined) updateData.conflictPolicy = updates.conflictPolicy
    if (updates.ignoreRules !== undefined) updateData.ignoreRules = updates.ignoreRules ? JSON.stringify(updates.ignoreRules) : "[]"
    if (updates.branchPairs !== undefined) updateData.branchPairs = updates.branchPairs as any
    if (updates.lastSyncAt !== undefined) updateData.lastSyncAt = updates.lastSyncAt ? new Date(updates.lastSyncAt) : null
    if (updates.lastSyncStatus !== undefined) updateData.lastSyncStatus = updates.lastSyncStatus

    const updated = await db
      .update(repositories)
      .set(updateData)
      .where(eq(repositories.id, repoId))
      .returning()

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: updated[0].id,
      name: updated[0].name,
      tfsUrl: updated[0].tfsUrl,
      githubUrl: updated[0].githubUrl,
      tfsCredentialId: updated[0].tfsCredentialId,
      githubCredentialId: updated[0].githubCredentialId,
      syncDirection: updated[0].syncDirection,
      ignoreRules: typeof updated[0].ignoreRules === "string" ? JSON.parse(updated[0].ignoreRules) : (updated[0].ignoreRules || []),
      conflictPolicy: updated[0].conflictPolicy,
      branchPairs: Array.isArray(updated[0].branchPairs) ? updated[0].branchPairs : (typeof updated[0].branchPairs === "string" ? JSON.parse(updated[0].branchPairs) : []),
      lastSyncAt: updated[0].lastSyncAt?.toISOString(),
      lastSyncStatus: updated[0].lastSyncStatus,
      createdAt: updated[0].createdAt?.toISOString(),
    })
  } catch (error) {
    console.error("PUT repository error:", error)
    return NextResponse.json({ error: "Failed to update repository" }, { status: 500 })
  }
}

// DELETE - Delete repository (cascades to jobs)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, repoId } = await params
    
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete associated scheduled jobs that reference this repository
    await db.delete(scheduledJobs).where(eq(scheduledJobs.projectId, id))
    
    const deleted = await db.delete(repositories).where(eq(repositories.id, repoId)).returning()

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE repository error:", error)
    return NextResponse.json({ error: "Failed to delete repository" }, { status: 500 })
  }
}
