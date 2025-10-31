import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { repositories, projects, credentials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { performSync } from "@/lib/git-sync"

export async function POST(request: NextRequest) {
  try {
    const { repositoryId, projectId } = await request.json()

    if (!repositoryId || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch from database
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const repository = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).limit(1)
    if (!repository || repository.length === 0) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    const repo = repository[0]

    // Get credentials from database
    const tfsCredResult = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, repo.tfsCredentialId!))
      .limit(1)
    
    const githubCredResult = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, repo.githubCredentialId!))
      .limit(1)

    if (!tfsCredResult || tfsCredResult.length === 0 || !githubCredResult || githubCredResult.length === 0) {
      return NextResponse.json({ error: "Credentials not found" }, { status: 404 })
    }

    const tfsCredential = tfsCredResult[0]
    const githubCredential = githubCredResult[0]

    // Support both new branchPairs format and legacy data
    let branchPairs: any[] = []
    if (repo.branchPairs) {
      branchPairs = typeof repo.branchPairs === "string" ? JSON.parse(repo.branchPairs) : (repo.branchPairs as any)
    }
    
    if (!Array.isArray(branchPairs) || branchPairs.length === 0) {
      return NextResponse.json({ error: "No branch pairs configured" }, { status: 400 })
    }

    // Sync all branch pairs
    let overallSuccess = true
    let allChanges = { added: 0, modified: 0, deleted: 0 }
    let allCommits: any[] = []
    let allConflicts: any[] = []
    let lastError = ""

    for (const branchPair of branchPairs) {
      const result = await performSync({
        repositoryId,
        name: repo.name,
        tfsUrl: repo.tfsUrl,
        githubUrl: repo.githubUrl,
        tfsCredentials: {
          username: tfsCredential.username,
          token: tfsCredential.token,
          url: tfsCredential.url || repo.tfsUrl,
        },
        githubCredentials: {
          username: githubCredential.username,
          token: githubCredential.token,
          url: repo.githubUrl,
        },
        tfsBranch: branchPair.name,
        githubBranch: branchPair.name,
        syncDirection: repo.syncDirection as any,
        ignoreRules: typeof repo.ignoreRules === "string" ? JSON.parse(repo.ignoreRules) : [],
        conflictPolicy: repo.conflictPolicy as any,
      })

      if (!result.success) {
        overallSuccess = false
        lastError = result.error || "Unknown error"
      } else {
        if (result.changes) {
          allChanges.added += result.changes.added || 0
          allChanges.modified += result.changes.modified || 0
          allChanges.deleted += result.changes.deleted || 0
        }
        if (result.commits) {
          allCommits = [...allCommits, ...result.commits]
        }
        if (result.conflicts) {
          allConflicts = [...allConflicts, ...result.conflicts]
        }
      }
    }

    // Update repository status in database
    await db
      .update(repositories)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: overallSuccess ? "success" : "failed",
      })
      .where(eq(repositories.id, repositoryId))

    return NextResponse.json({
      success: overallSuccess,
      repositoryId,
      syncDirection: repo.syncDirection,
      changes: allChanges,
      commits: allCommits,
      conflicts: allConflicts,
      error: lastError || undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Sync error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Sync failed",
      },
      { status: 500 },
    )
  }
}

