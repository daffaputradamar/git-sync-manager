"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, AlertCircle, CheckCircle, GitCommit } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Repository, Credential } from "@/lib/types"

interface PreviewSyncDialogProps {
  repository: Repository
  projectId: string
  credentials: Credential[]
  trigger?: React.ReactNode
}

interface SyncPreview {
  files: Array<{
    path: string
    status: "added" | "modified" | "deleted"
    additions: number
    deletions: number
  }>
  commits: Array<{
    hash: string
    message: string
    author: string
    date: string
  }>
}

interface BranchPairPreview extends SyncPreview {
  tfsBranch: string
  githubBranch: string
}

export function PreviewSyncDialog({
  repository,
  projectId,
  credentials,
  trigger,
}: PreviewSyncDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<BranchPairPreview[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const tfsCredential = credentials.find((c) => c.id === repository.tfsCredentialId)
      const githubCredential = credentials.find((c) => c.id === repository.githubCredentialId)

      if (!tfsCredential || !githubCredential) {
        throw new Error("Credentials not found")
      }

      const response = await fetch("/api/sync/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: repository.id,
          projectId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to preview sync")
      }

      const data = await response.json()
      // Handle both old single preview and new multi-branch format
      if (data.branchPairs) {
        setPreview(data.branchPairs)
      } else if (Array.isArray(data)) {
        setPreview(data)
      } else {
        setPreview([data])
      }
    } catch (err: any) {
      setError(err.message || "Failed to preview sync")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Preview</DialogTitle>
          <DialogDescription>
            Preview what will change when syncing {repository.name}
          </DialogDescription>
        </DialogHeader>

        {!preview && !error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">Click the button below to preview sync changes</p>
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? "Loading preview..." : "Generate Preview"}
            </Button>
          </div>
        )}

        {error && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {preview && (
          <div className="space-y-6">
            {/* Display each branch pair preview */}
            {preview.map((branchPreview, idx) => {
              const totalFiles = branchPreview.files?.length || 0
              const totalAdditions = branchPreview.files?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0
              const totalDeletions = branchPreview.files?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0

              return (
                <div key={idx} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  {/* Branch Pair Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-600 font-mono text-sm mr-2">
                        {branchPreview.tfsBranch || branchPreview.githubBranch}
                      </span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-600 font-mono text-sm ml-2">
                        {branchPreview.githubBranch || branchPreview.tfsBranch}
                      </span>
                    </h3>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-500">{totalFiles}</p>
                      <p className="text-xs text-muted-foreground">Files Changed</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-500">{totalAdditions}</p>
                      <p className="text-xs text-muted-foreground">Additions</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold text-red-500">{totalDeletions}</p>
                      <p className="text-xs text-muted-foreground">Deletions</p>
                    </Card>
                  </div>

                  {/* Commits */}
                  {branchPreview.commits && branchPreview.commits.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <GitCommit className="w-4 h-4" />
                        Incoming Commits ({branchPreview.commits.length})
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {branchPreview.commits.slice(0, 5).map((commit) => (
                          <Card key={commit.hash} className="p-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-muted-foreground mb-1">{commit.hash.slice(0, 7)}</p>
                                <p className="line-clamp-1">{commit.message}</p>
                                <p className="text-muted-foreground mt-0.5">by {commit.author}</p>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                                {new Date(commit.date).toLocaleDateString()}
                              </span>
                            </div>
                          </Card>
                        ))}
                        {branchPreview.commits.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{branchPreview.commits.length - 5} more commits
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* File Changes */}
                  {branchPreview.files && branchPreview.files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">File Changes ({branchPreview.files.length})</h4>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {branchPreview.files.slice(0, 10).map((file, fidx) => (
                          <Card key={fidx} className="p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {file.status === "added" && (
                                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                                {file.status === "modified" && (
                                  <AlertCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                )}
                                {file.status === "deleted" && (
                                  <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                )}
                                <span className="truncate text-muted-foreground">{file.path}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs whitespace-nowrap flex-shrink-0">
                                {file.additions > 0 && (
                                  <span className="text-green-500">+{file.additions}</span>
                                )}
                                {file.deletions > 0 && (
                                  <span className="text-red-500">-{file.deletions}</span>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                        {branchPreview.files.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{branchPreview.files.length - 10} more files
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No changes message */}
                  {(!branchPreview.files || branchPreview.files.length === 0) && 
                   (!branchPreview.commits || branchPreview.commits.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No changes to sync for this branch pair
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {preview && !error && (
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Preview"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
