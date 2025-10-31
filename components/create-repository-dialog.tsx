"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addRepository } from "@/lib/storage-client"
import { Plus } from "lucide-react"
import type { Credential } from "@/lib/types"

interface CreateRepositoryDialogProps {
  projectId: string
  credentials: Credential[]
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CreateRepositoryDialog({
  projectId,
  credentials,
  onSuccess,
  trigger,
}: CreateRepositoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    tfsUrl: "",
    githubUrl: "",
    tfsCredentialId: "",
    githubCredentialId: "",
    branchPairs: [{ name: "main" }],
    syncDirection: "bidirectional" as "tfs-to-github" | "github-to-tfs" | "bidirectional",
    conflictPolicy: "auto-resolve" as "auto-resolve" | "manual" | "prefer-source" | "prefer-target",
  })
  const [isCreating, setIsCreating] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        tfsUrl: "",
        githubUrl: "",
        tfsCredentialId: "",
        githubCredentialId: "",
        branchPairs: [{ name: "main" }],
        syncDirection: "bidirectional",
        conflictPolicy: "auto-resolve",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.name.trim() ||
      !form.tfsUrl.trim() ||
      !form.githubUrl.trim() ||
      !form.tfsCredentialId ||
      !form.githubCredentialId ||
      form.branchPairs.length === 0 ||
      form.branchPairs.some((pair) => !pair.name.trim())
    ) {
      return
    }

    setIsCreating(true)
    try {
      await addRepository(projectId, {
        name: form.name,
        tfsUrl: form.tfsUrl,
        githubUrl: form.githubUrl,
        tfsCredentialId: form.tfsCredentialId,
        githubCredentialId: form.githubCredentialId,
        branchPairs: form.branchPairs,
        syncDirection: form.syncDirection,
        conflictPolicy: form.conflictPolicy,
      })
      setForm({
        name: "",
        tfsUrl: "",
        githubUrl: "",
        tfsCredentialId: "",
        githubCredentialId: "",
        branchPairs: [{ name: "main" }],
        syncDirection: "bidirectional",
        conflictPolicy: "auto-resolve",
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to add repository:", error)
      alert("Failed to add repository")
    } finally {
      setIsCreating(false)
    }
  }

  const tfsCredentials = credentials.filter((c) => c.type === "tfs")
  const githubCredentials = credentials.filter((c) => c.type === "github")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Repository
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Repository</DialogTitle>
            <DialogDescription>Configure a repository pair for synchronization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="repo-name">Repository Name *</Label>
              <Input
                id="repo-name"
                placeholder="My Repository"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tfs-url">TFS Repository URL *</Label>
              <Input
                id="tfs-url"
                placeholder="https://tfs.example.com/project/_git/repo"
                value={form.tfsUrl}
                onChange={(e) => setForm({ ...form, tfsUrl: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="github-url">GitHub Repository URL *</Label>
              <Input
                id="github-url"
                placeholder="https://github.com/username/repo"
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tfs-cred">TFS Credential *</Label>
                <select
                  id="tfs-cred"
                  value={form.tfsCredentialId}
                  onChange={(e) => setForm({ ...form, tfsCredentialId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select credential</option>
                  {tfsCredentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="github-cred">GitHub Credential *</Label>
                <select
                  id="github-cred"
                  value={form.githubCredentialId}
                  onChange={(e) => setForm({ ...form, githubCredentialId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select credential</option>
                  {githubCredentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Branches to Sync</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm({
                      ...form,
                      branchPairs: [...form.branchPairs, { name: "" }],
                    })
                  }}
                >
                  + Add Branch
                </Button>
              </div>
              
              <div className="space-y-3">
                {form.branchPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-end border rounded-lg p-3 bg-muted/30">
                    <div className="flex-1">
                      <Label htmlFor={`branch-${index}`} className="text-xs">
                        Branch Name (TFS & GitHub)
                      </Label>
                      <Input
                        id={`branch-${index}`}
                        placeholder="main"
                        value={pair.name}
                        onChange={(e) => {
                          const newPairs = [...form.branchPairs]
                          newPairs[index].name = e.target.value
                          setForm({ ...form, branchPairs: newPairs })
                        }}
                      />
                    </div>
                    {form.branchPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPairs = form.branchPairs.filter((_, i) => i !== index)
                          setForm({ ...form, branchPairs: newPairs })
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sync-direction">Sync Direction</Label>
              <select
                id="sync-direction"
                value={form.syncDirection}
                onChange={(e) =>
                  setForm({
                    ...form,
                    syncDirection: e.target.value as "tfs-to-github" | "github-to-tfs" | "bidirectional",
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="bidirectional">Bidirectional (Two-way sync)</option>
                <option value="tfs-to-github">TFS → GitHub (One-way)</option>
                <option value="github-to-tfs">GitHub → TFS (One-way)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conflict-policy">Conflict Resolution Policy</Label>
              <select
                id="conflict-policy"
                value={form.conflictPolicy}
                onChange={(e) =>
                  setForm({
                    ...form,
                    conflictPolicy: e.target.value as "auto-resolve" | "manual" | "prefer-source" | "prefer-target",
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="auto-resolve">Auto Resolve</option>
                <option value="prefer-source">Prefer Source</option>
                <option value="prefer-target">Prefer Target</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isCreating ||
                !form.name.trim() ||
                !form.tfsUrl.trim() ||
                !form.githubUrl.trim() ||
                !form.tfsCredentialId ||
                !form.githubCredentialId
              }
            >
              {isCreating ? "Adding..." : "Add Repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
