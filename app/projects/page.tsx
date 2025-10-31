"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loadData, deleteProject } from "@/lib/storage-client"
import type { AppData } from "@/lib/types"
import Link from "next/link"
import { Trash2, GitBranch, Search, Pencil, FileText, Calendar, Activity } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { EditProjectDialog } from "@/components/edit-project-dialog"

export default function ProjectsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date" | "repos">("date")

  useEffect(() => {
    loadData().then(setData).catch(console.error)
  }, [])

  const refreshData = async () => {
    const updatedData = await loadData()
    setData(updatedData)
  }

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    if (!data) return []

    let projects = data.projects.filter((project) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        project.name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      )
    })

    // Sort projects
    projects.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "repos":
          return b.repositories.length - a.repositories.length
        case "date":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return projects
  }, [data, searchQuery, sortBy])

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id)
        const updatedData = await loadData()
        setData(updatedData)
      } catch (error) {
        console.error("Failed to delete project:", error)
        alert("Failed to delete project")
      }
    }
  }

  if (!data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title="Projects" description="Manage your Git synchronization projects" />

      <div className="flex-1 overflow-auto p-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date" | "repos")}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="date">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="repos">Most Repos</option>
            </select>
            <CreateProjectDialog onSuccess={refreshData} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            // Calculate sync statistics
            const totalRepos = project.repositories.length
            const successfulSyncs = project.repositories.filter(
              (r) => r.lastSyncStatus === "success"
            ).length
            const failedSyncs = project.repositories.filter(
              (r) => r.lastSyncStatus === "failed"
            ).length
            const recentSync = project.repositories
              .filter((r) => r.lastSyncAt)
              .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())
            [0]?.lastSyncAt

            return (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group border hover:border-primary/50"
              >
                {/* Header Section */}
                <div className="p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="py-3 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Created
                          </span>
                          <span className="font-medium text-foreground">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {recentSync && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" />
                              Last Sync
                            </span>
                            <span className="font-medium text-foreground">
                              {new Date(recentSync).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="px-6 py-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Repositories */}
                    <div className="text-center p-2 bg-background rounded-lg border border-border/50">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <GitBranch className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{totalRepos}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalRepos === 1 ? "Repo" : "Repos"}
                      </p>
                    </div>

                    {/* Success */}
                    <div className="text-center p-2 bg-background rounded-lg border border-green-500/20">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Activity className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-green-500">{successfulSyncs}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>

                    {/* Failed */}
                    <div className="text-center p-2 bg-background rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Activity className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-red-500">{failedSyncs}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 pt-3 flex gap-2 border-t border-border bg-muted/20">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </Link>
                  <EditProjectDialog
                    project={project}
                    onSuccess={refreshData}
                    trigger={
                      <Button
                        variant="outline"
                        size="icon"
                        title="Edit project"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteProject(project.id)
                    }}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredProjects.length === 0 && data.projects.length > 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No projects match your search.</p>
          </Card>
        )}

        {data.projects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet. Create one to get started!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
