"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, createSyncLog, updateRepository } from "@/lib/storage"
import type { AppData } from "@/lib/types"
import { Play, RotateCw, ChevronDown, ChevronUp } from "lucide-react"

export default function SyncPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [expandedRepos, setExpandedRepos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setData(loadData())
  }, [])

  const handleSync = async (projectId: string, repoId: string) => {
    setSyncing({ ...syncing, [repoId]: true })

    // Simulate sync operation
    createSyncLog(repoId, "in-progress", "Synchronization started...")

    setTimeout(() => {
      const success = Math.random() > 0.2 // 80% success rate
      createSyncLog(
        repoId,
        success ? "success" : "failed",
        success ? "Synchronization completed successfully" : "Synchronization failed",
        success
          ? {
              added: Math.floor(Math.random() * 10),
              modified: Math.floor(Math.random() * 5),
              deleted: Math.floor(Math.random() * 3),
            }
          : undefined,
      )
      updateRepository(projectId, repoId, {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: success ? "success" : "failed",
      })
      setSyncing({ ...syncing, [repoId]: false })
      setData(loadData())
    }, 2000)
  }

  const toggleExpanded = (repoId: string) => {
    setExpandedRepos({ ...expandedRepos, [repoId]: !expandedRepos[repoId] })
  }

  if (!data) return null

  const allRepositories = data.projects.flatMap((p) => ({ ...p.repositories, projectId: p.id }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Synchronization" description="Manage and monitor repository synchronization" />

      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-4">
          {allRepositories.map((repo) => {
            const logs = data.syncLogs.filter((l) => l.repositoryId === repo.id).slice(-5)
            const isExpanded = expandedRepos[repo.id]
            return (
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

                {logs.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpanded(repo.id)}
                      className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-2"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Sync History ({logs.length})
                    </button>
                    {isExpanded && (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div key={log.id} className="text-xs p-3 bg-muted rounded border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-muted-foreground">{new Date(log.startedAt).toLocaleString()}</p>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.status === "success"
                                    ? "bg-green-500/20 text-green-400"
                                    : log.status === "failed"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <p className="text-foreground">{log.message}</p>
                            {log.changes && (
                              <p className="text-muted-foreground mt-1">
                                Changes: +{log.changes.added} ~{log.changes.modified} -{log.changes.deleted}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
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
