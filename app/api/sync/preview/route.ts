import { type NextRequest, NextResponse } from "next/server"
import { loadData } from "@/lib/storage"
import { previewSync } from "@/lib/git-sync"

export async function POST(request: NextRequest) {
  try {
    const { repositoryId, projectId } = await request.json()

    if (!repositoryId || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const data = loadData()

    // Find project and repository
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const repository = project.repositories.find((r) => r.id === repositoryId)
    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    // Get credentials
    const tfsCredential = data.credentials.find((c) => c.id === repository.tfsCredentialId)
    const githubCredential = data.credentials.find((c) => c.id === repository.githubCredentialId)

    if (!tfsCredential || !githubCredential) {
      return NextResponse.json({ error: "Credentials not found" }, { status: 404 })
    }

    // Preview sync for all branch pairs
    const branchPairs = repository.branchPairs || 
      (repository.tfsBranch ? [{ name: repository.tfsBranch }] : [])
    
    if (branchPairs.length === 0) {
      return NextResponse.json({ error: "No branch pairs configured" }, { status: 400 })
    }

    const diffs: any[] = []
    
    for (const branchPair of branchPairs) {
      const diff = await previewSync({
        repositoryId,
        name: repository.name,
        tfsUrl: repository.tfsUrl,
        githubUrl: repository.githubUrl,
        tfsCredentials: {
          username: tfsCredential.username,
          token: tfsCredential.token,
          url: tfsCredential.url || repository.tfsUrl,
        },
        githubCredentials: {
          username: githubCredential.username,
          token: githubCredential.token,
          url: repository.githubUrl,
        },
        tfsBranch: branchPair.name,
        githubBranch: branchPair.name,
        syncDirection: repository.syncDirection,
        ignoreRules: repository.ignoreRules,
        conflictPolicy: repository.conflictPolicy,
      })

      diffs.push({
        tfsBranch: branchPair.name,
        githubBranch: branchPair.name,
        ...diff,
      })
    }

    return NextResponse.json({ branchPairs: diffs })
  } catch (error: any) {
    console.error("Preview error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to preview sync",
      },
      { status: 500 },
    )
  }
}
