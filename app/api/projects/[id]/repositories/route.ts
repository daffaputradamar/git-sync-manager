import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, repositories, credentials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Get all repositories for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verify project exists
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const repos = await db.select().from(repositories).where(eq(repositories.projectId, id))
    
    return NextResponse.json(
      repos.map((repo) => ({
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
      }))
    )
  } catch (error) {
    console.error("GET repositories error:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}

// POST - Add repository to project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const {
      name,
      tfsUrl,
      githubUrl,
      tfsCredentialId,
      githubCredentialId,
      tfsBranch,
      githubBranch,
      branchPairs,
      syncDirection,
      ignoreRules,
      conflictPolicy,
    } = await request.json()

    // Validate required fields
    if (!name || !tfsUrl || !githubUrl || !tfsCredentialId || !githubCredentialId || !syncDirection || !conflictPolicy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify project exists
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!project || project.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Validate credentials exist
    const tfsCredExists = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, tfsCredentialId))
      .limit(1)
    
    const githubCredExists = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, githubCredentialId))
      .limit(1)

    if (!tfsCredExists || tfsCredExists.length === 0 || !githubCredExists || githubCredExists.length === 0) {
      return NextResponse.json({ error: "Invalid credential IDs" }, { status: 400 })
    }

    // Build branch pairs - use provided ones or create from tfsBranch/githubBranch
    let branchPairsToStore = branchPairs || []
    if (!branchPairs || branchPairs.length === 0) {
      if (tfsBranch && githubBranch) {
        branchPairsToStore = [
          {
            name: `${tfsBranch}-to-${githubBranch}`,
          },
        ]
      }
    }

    const newRepo = await db
      .insert(repositories)
      .values({
        projectId: id,
        name,
        tfsUrl,
        githubUrl,
        tfsCredentialId,
        githubCredentialId,
        syncDirection,
        ignoreRules: ignoreRules ? JSON.stringify(ignoreRules) : "[]",
        conflictPolicy,
        branchPairs: branchPairsToStore as any,
      })
      .returning()

    return NextResponse.json(
      {
        id: newRepo[0].id,
        name: newRepo[0].name,
        tfsUrl: newRepo[0].tfsUrl,
        githubUrl: newRepo[0].githubUrl,
        tfsCredentialId: newRepo[0].tfsCredentialId,
        githubCredentialId: newRepo[0].githubCredentialId,
        syncDirection: newRepo[0].syncDirection,
        ignoreRules: typeof newRepo[0].ignoreRules === "string" ? JSON.parse(newRepo[0].ignoreRules) : (newRepo[0].ignoreRules || []),
        conflictPolicy: newRepo[0].conflictPolicy,
        branchPairs: Array.isArray(newRepo[0].branchPairs) ? newRepo[0].branchPairs : (typeof newRepo[0].branchPairs === "string" ? JSON.parse(newRepo[0].branchPairs) : []),
        lastSyncAt: newRepo[0].lastSyncAt?.toISOString(),
        lastSyncStatus: newRepo[0].lastSyncStatus,
        createdAt: newRepo[0].createdAt?.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST repository error:", error)
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 })
  }
}
