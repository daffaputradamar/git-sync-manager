"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, deleteProject, createProject } from "@/lib/storage"
import type { AppData } from "@/lib/types"
import Link from "next/link"
import { Trash2, Plus } from "lucide-react"

export default function ProjectsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")

  useEffect(() => {
    setData(loadData())
  }, [])

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName, newProjectDesc)
      setNewProjectName("")
      setNewProjectDesc("")
      setData(loadData())
    }
  }

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id)
      setData(loadData())
    }
  }

  if (!data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title="Projects" description="Manage your Git synchronization projects" />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Create New Project</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Project description"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <Button onClick={handleCreateProject} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.projects.map((project) => (
            <Card key={project.id} className="p-6 hover:bg-accent transition-colors">
              <Link href={`/projects/${project.id}`}>
                <h3 className="text-lg font-bold text-foreground mb-2 cursor-pointer hover:text-primary">
                  {project.name}
                </h3>
              </Link>
              <p className="text-muted-foreground text-sm mb-4">{project.description}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{project.repositories.length} repositories</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/projects/${project.id}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    View
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {data.projects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet. Create one to get started!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
