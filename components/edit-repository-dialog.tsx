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
import { updateRepository } from "@/lib/storage-client"
import { Pencil } from "lucide-react"
import type { Repository, Credential } from "@/lib/types"

interface EditRepositoryDialogProps {
  projectId: string
  repository: Repository
  credentials: Credential[]
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditRepositoryDialog({
  projectId,
  repository,
  credentials,
  onSuccess,
  trigger,
}: EditRepositoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: repository.name,
    tfsUrl: repository.tfsUrl,
    githubUrl: repository.githubUrl,
    branchPairs: repository.branchPairs || (repository.tfsBranch ? [{ name: repository.tfsBranch }] : [{ name: "main" }]),
    tfsCredentialId: repository.tfsCredentialId,
    githubCredentialId: repository.githubCredentialId,
    syncDirection: repository.syncDirection,
    conflictPolicy: repository.conflictPolicy,
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: repository.name,
        tfsUrl: repository.tfsUrl,
        githubUrl: repository.githubUrl,
        branchPairs: repository.branchPairs || (repository.tfsBranch ? [{ name: repository.tfsBranch }] : [{ name: "main" }]),
        tfsCredentialId: repository.tfsCredentialId,
        githubCredentialId: repository.githubCredentialId,
        syncDirection: repository.syncDirection,
        conflictPolicy: repository.conflictPolicy,
      })
    }
  }, [open, repository])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.name.trim() ||
      !form.tfsUrl.trim() ||
      !form.githubUrl.trim() ||
      form.branchPairs.length === 0 ||
      form.branchPairs.some((pair) => !pair.name.trim())
    ) return

    setIsUpdating(true)
    try {
      await updateRepository(projectId, repository.id, form)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update repository:", error)
      alert("Failed to update repository")
    } finally {
      setIsUpdating(false)
    }
  }

  const tfsCredentials = credentials.filter((c) => c.type === "tfs")
  const githubCredentials = credentials.filter((c) => c.type === "github")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Repository</DialogTitle>
            <DialogDescription>Update repository configuration.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-repo-name">Repository Name *</Label>
              <Input
                id="edit-repo-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tfs-url">TFS URL *</Label>
                <Input
                  id="edit-tfs-url"
                  value={form.tfsUrl}
                  onChange={(e) => setForm({ ...form, tfsUrl: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-github-url">GitHub URL *</Label>
                <Input
                  id="edit-github-url"
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tfs-cred">TFS Credential *</Label>
                <select
                  id="edit-tfs-cred"
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
                <Label htmlFor="edit-github-cred">GitHub Credential *</Label>
                <select
                  id="edit-github-cred"
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
                      <Label htmlFor={`edit-branch-${index}`} className="text-xs">
                        Branch Name (TFS & GitHub)
                      </Label>
                      <Input
                        id={`edit-branch-${index}`}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tfs-cred">TFS Credential *</Label>
                <select
                  id="edit-tfs-cred"
                  value={form.tfsCredentialId}
                  onChange={(e) => setForm({ ...form, tfsCredentialId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Label htmlFor="edit-github-cred">GitHub Credential *</Label>
                <select
                  id="edit-github-cred"
                  value={form.githubCredentialId}
                  onChange={(e) => setForm({ ...form, githubCredentialId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sync-direction">Sync Direction *</Label>
                <select
                  id="edit-sync-direction"
                  value={form.syncDirection}
                  onChange={(e) => setForm({ ...form, syncDirection: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="bidirectional">Bidirectional</option>
                  <option value="tfs-to-github">TFS → GitHub</option>
                  <option value="github-to-tfs">GitHub → TFS</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-conflict-policy">Conflict Policy *</Label>
                <select
                  id="edit-conflict-policy"
                  value={form.conflictPolicy}
                  onChange={(e) => setForm({ ...form, conflictPolicy: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="auto-resolve">Auto Resolve</option>
                  <option value="prefer-source">Prefer Source</option>
                  <option value="prefer-target">Prefer Target</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
