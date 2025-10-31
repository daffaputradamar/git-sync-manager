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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCredential } from "@/lib/storage-client"
import { Plus } from "lucide-react"

interface CreateCredentialDialogProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CreateCredentialDialog({ onSuccess, trigger }: CreateCredentialDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "github" as "tfs" | "github",
    username: "",
    token: "",
    url: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.username.trim()) newErrors.username = "Username is required"
    if (!form.token.trim()) newErrors.token = "Token is required"
    if (form.type === "tfs" && !form.url.trim()) newErrors.url = "TFS URL is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsCreating(true)
    try {
      await createCredential(form.name, form.type, form.username, form.token, form.url || undefined)
      setForm({ name: "", type: "github", username: "", token: "", url: "" })
      setErrors({})
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create credential:", error)
      alert("Failed to create credential")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
            <DialogDescription>Add TFS or GitHub credentials for repository synchronization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cred-name">Credential Name *</Label>
              <Input
                id="cred-name"
                placeholder="My GitHub Account"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-type">Type *</Label>
              <select
                id="cred-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "tfs" | "github" })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="github">GitHub</option>
                <option value="tfs">TFS</option>
              </select>
            </div>
            {form.type === "tfs" && (
              <div className="grid gap-2">
                <Label htmlFor="cred-url">TFS URL *</Label>
                <Input
                  id="cred-url"
                  placeholder="https://tfs.example.com"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required={form.type === "tfs"}
                />
                {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="cred-username">Username *</Label>
              <Input
                id="cred-username"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-token">Personal Access Token *</Label>
              <Input
                id="cred-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                required
              />
              {errors.token && <p className="text-xs text-destructive">{errors.token}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Adding..." : "Add Credential"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
