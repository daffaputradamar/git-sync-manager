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
import { updateProject } from "@/lib/storage-client"
import { Pencil } from "lucide-react"
import type { Project } from "@/lib/types"

interface EditProjectDialogProps {
  project: Project
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditProjectDialog({ project, onSuccess, trigger }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        name: project.name,
        description: project.description || "",
      })
    }
  }, [open, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsUpdating(true)
    try {
      await updateProject(project.id, { name: form.name, description: form.description })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update project:", error)
      alert("Failed to update project")
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
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                placeholder="My Project"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Brief description of your project"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !form.name.trim()}>
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
