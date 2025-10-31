"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, deleteRepository } from "@/lib/storage-client"
import type { AppData, Project } from "@/lib/types"
import { Trash2, ArrowLeft, RefreshCw, Pencil, Eye, Search, X } from "lucide-react"
import Link from "next/link"
import { CreateRepositoryDialog } from "@/components/create-repository-dialog"
import { EditRepositoryDialog } from "@/components/edit-repository-dialog"
import { PreviewSyncDialog } from "@/components/preview-sync-dialog"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [data, setData] = useState<AppData | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
      .then((loadedData) => {
        setData(loadedData)
        const foundProject = loadedData.projects.find((p) => p.id === projectId)
        setProject(foundProject || null)
      })
      .catch(console.error)
  }, [projectId])

  const refreshData = async () => {
    const updatedData = await loadData()
    setData(updatedData)
    const updatedProject = updatedData.projects.find((p) => p.id === projectId)
    setProject(updatedProject || null)
  }

  const handleDeleteRepository = async (repoId: string) => {
    if (confirm("Are you sure you want to delete this repository?")) {
      try {
        await deleteRepository(projectId, repoId)
        const updatedData = await loadData()
        setData(updatedData)
        const updatedProject = updatedData.projects.find((p) => p.id === projectId)
        setProject(updatedProject || null)
      } catch (error) {
        console.error("Failed to delete repository:", error)
        alert("Failed to delete repository")
      }
    }
  }

  const handleSyncRepository = async (repoId: string) => {
    setSyncingRepoId(repoId)
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repositoryId: repoId }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      await refreshData()
      alert("Sync completed successfully!")
    } catch (error) {
      console.error("Failed to sync repository:", error)
      alert("Failed to sync repository. Check the console for details.")
    } finally {
      setSyncingRepoId(null)
    }
  }

  if (!project || !data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title={project.name} description={project.description || "Manage repositories in this project"} />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="outline" className="gap-2 bg-transparent mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <CreateRepositoryDialog projectId={projectId} credentials={data.credentials} onSuccess={refreshData} />
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Repositories Grid */}
        {(() => {
          const filteredRepos = project.repositories.filter((repo) =>
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.tfsUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.githubUrl.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (project.repositories.length === 0) {
            return (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No repositories yet. Add one to get started!</p>
              </Card>
            )
          }

          if (filteredRepos.length === 0) {
            return (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No repositories found matching "{searchQuery}"</p>
              </Card>
            )
          }
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRepos.map((repo) => {
                const isSyncing = syncingRepoId === repo.id
            return (
              <Card key={repo.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{repo.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      repo.syncDirection === "bidirectional"
                        ? "bg-purple-500/20 text-purple-600 border border-purple-500/30"
                        : repo.syncDirection === "tfs-to-github"
                          ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                          : "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                    }`}>
                      {repo.syncDirection === "bidirectional" ? "↔ Bidirectional" : repo.syncDirection === "tfs-to-github" ? "→ TFS to GitHub" : "← GitHub to TFS"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <EditRepositoryDialog
                      projectId={projectId}
                      repository={repo}
                      credentials={data.credentials}
                      onSuccess={refreshData}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteRepository(repo.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">TFS URL</p>
                    <p className="text-foreground text-xs break-all">{repo.tfsUrl}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GitHub URL</p>
                    <p className="text-foreground text-xs break-all">{repo.githubUrl}</p>
                  </div>
                  
                  {/* Branch pairs display */}
                  {(() => {
                    const branches = repo.branchPairs && repo.branchPairs.length > 0 
                      ? repo.branchPairs 
                      : repo.tfsBranch 
                        ? [{ name: repo.tfsBranch }]
                        : []
                    
                    return branches.length > 0 ? (
                      <div className="pt-2 border-t border-border">
                        <p className="text-muted-foreground font-medium mb-2">Synced Branches:</p>
                        <div className="flex flex-wrap gap-2">
                          {branches.map((pair, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-mono border border-blue-500/20">
                              {pair.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}
                  
                  {repo.lastSyncAt && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground">Last sync: {new Date(repo.lastSyncAt).toLocaleString()}</p>
                      <p
                        className={`text-sm font-medium ${
                          repo.lastSyncStatus === "success"
                            ? "text-green-400"
                            : repo.lastSyncStatus === "failed"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        Status: {repo.lastSyncStatus}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <PreviewSyncDialog 
                      repository={repo}
                      projectId={projectId}
                      credentials={data.credentials}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      }
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSyncRepository(repo.id)}
                      disabled={isSyncing}
                      className="flex-1"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
