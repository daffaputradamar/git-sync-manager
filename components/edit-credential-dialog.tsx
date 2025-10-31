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
import { updateCredential } from "@/lib/storage-client"
import { Pencil } from "lucide-react"
import type { Credential } from "@/lib/types"

interface EditCredentialDialogProps {
  credential: Credential
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditCredentialDialog({ credential, onSuccess, trigger }: EditCredentialDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: credential.name,
    username: credential.username,
    token: credential.token,
    url: credential.url || "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: credential.name,
        username: credential.username,
        token: credential.token,
        url: credential.url || "",
      })
    }
  }, [open, credential])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim() || !form.token.trim()) return

    setIsUpdating(true)
    try {
      await updateCredential(credential.id, {
        name: form.name,
        username: form.username,
        token: form.token,
        url: form.url || undefined,
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update credential:", error)
      alert("Failed to update credential")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
            <DialogDescription>
              Update your {credential.type.toUpperCase()} credential information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-cred-name">Name *</Label>
              <Input
                id="edit-cred-name"
                placeholder="My Credential"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                placeholder="your-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-token">Personal Access Token *</Label>
              <Input
                id="edit-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx or pat_xxxxxxxxxxxx"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                required
              />
            </div>
            {credential.type === "tfs" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-url">TFS URL</Label>
                <Input
                  id="edit-url"
                  placeholder="https://tfs.company.com"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Credential"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
