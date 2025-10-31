"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData } from "@/lib/storage-client"
import type { AppData } from "@/lib/types"
import { Play, RotateCw } from "lucide-react"

export default function SyncPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData().then(setData).catch(console.error)
  }, [])

  const handleSync = async (projectId: string, repoId: string) => {
    setSyncing({ ...syncing, [repoId]: true })

    try {
      // Call the actual sync API
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId, projectId }),
      })

      const result = await response.json()

      if (result.success) {
        alert("Sync completed successfully!")
      } else {
        alert(`Sync failed: ${result.error || "Unknown error"}`)
      }

      // Reload data
      const updatedData = await loadData()
      setData(updatedData)
    } catch (error) {
      console.error("Sync error:", error)
      alert("Sync failed")
    } finally {
      setSyncing({ ...syncing, [repoId]: false })
    }
  }

  if (!data) return null

  const allRepositories = data.projects.flatMap((p) =>
    p.repositories.map((repo) => ({ ...repo, projectId: p.id })),
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Synchronization" description="Manage and monitor repository synchronization" />

      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-4">
          {allRepositories.map((repo) => (
            <Card key={repo.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{repo.syncDirection}</p>
                </div>
                <Button
                  onClick={() => handleSync(repo.projectId, repo.id)}
                  disabled={syncing[repo.id]}
                  className="gap-2"
                >
                  {syncing[repo.id] ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">TFS URL</p>
                  <p className="text-foreground text-xs break-all">{repo.tfsUrl}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">GitHub URL</p>
                  <p className="text-foreground text-xs break-all">{repo.githubUrl}</p>
                </div>
              </div>

              {repo.lastSyncAt && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(repo.lastSyncAt).toLocaleString()}
                  </p>
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
            </Card>
          ))}
        </div>

        {allRepositories.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No repositories yet. Create a project and add repositories to start synchronizing!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
