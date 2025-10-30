"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, addRepository, deleteRepository } from "@/lib/storage"
import type { AppData, Project } from "@/lib/types"
import { Trash2, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [data, setData] = useState<AppData | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    tfsUrl: "",
    githubUrl: "",
    tfsCredentialId: "",
    githubCredentialId: "",
    syncDirection: "bidirectional" as "tfs-to-github" | "github-to-tfs" | "bidirectional",
  })

  useEffect(() => {
    const loadedData = loadData()
    setData(loadedData)
    const foundProject = loadedData.projects.find((p) => p.id === projectId)
    setProject(foundProject || null)
  }, [projectId])

  const handleAddRepository = () => {
    if (
      project &&
      form.name.trim() &&
      form.tfsUrl.trim() &&
      form.githubUrl.trim() &&
      form.tfsCredentialId &&
      form.githubCredentialId
    ) {
      addRepository(projectId, {
        name: form.name,
        tfsUrl: form.tfsUrl,
        githubUrl: form.githubUrl,
        tfsCredentialId: form.tfsCredentialId,
        githubCredentialId: form.githubCredentialId,
        syncDirection: form.syncDirection,
      })
      setForm({
        name: "",
        tfsUrl: "",
        githubUrl: "",
        tfsCredentialId: "",
        githubCredentialId: "",
        syncDirection: "bidirectional",
      })
      setShowForm(false)
      const updatedData = loadData()
      setData(updatedData)
      const updatedProject = updatedData.projects.find((p) => p.id === projectId)
      setProject(updatedProject || null)
    }
  }

  const handleDeleteRepository = (repoId: string) => {
    if (confirm("Are you sure you want to delete this repository?")) {
      deleteRepository(projectId, repoId)
      const updatedData = loadData()
      setData(updatedData)
      const updatedProject = updatedData.projects.find((p) => p.id === projectId)
      setProject(updatedProject || null)
    }
  }

  if (!project || !data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title={project.name} description={project.description || "Manage repositories in this project"} />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="outline" className="gap-2 bg-transparent mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          ) : (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Add New Repository</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Repository name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="TFS Repository URL"
                  value={form.tfsUrl}
                  onChange={(e) => setForm({ ...form, tfsUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="GitHub Repository URL"
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">TFS Credential</label>
                    <select
                      value={form.tfsCredentialId}
                      onChange={(e) => setForm({ ...form, tfsCredentialId: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select credential</option>
                      {data.credentials
                        .filter((c) => c.type === "tfs")
                        .map((cred) => (
                          <option key={cred.id} value={cred.id}>
                            {cred.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">GitHub Credential</label>
                    <select
                      value={form.githubCredentialId}
                      onChange={(e) => setForm({ ...form, githubCredentialId: e.target.value })}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select credential</option>
                      {data.credentials
                        .filter((c) => c.type === "github")
                        .map((cred) => (
                          <option key={cred.id} value={cred.id}>
                            {cred.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Sync Direction</label>
                  <select
                    value={form.syncDirection}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        syncDirection: e.target.value as "tfs-to-github" | "github-to-tfs" | "bidirectional",
                      })
                    }
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="bidirectional">Bidirectional</option>
                    <option value="tfs-to-github">TFS to GitHub</option>
                    <option value="github-to-tfs">GitHub to TFS</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddRepository} className="flex-1">
                    Add Repository
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {project.repositories.map((repo) => (
            <Card key={repo.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{repo.syncDirection}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteRepository(repo.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">TFS URL</p>
                  <p className="text-foreground text-xs break-all">{repo.tfsUrl}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">GitHub URL</p>
                  <p className="text-foreground text-xs break-all">{repo.githubUrl}</p>
                </div>
                {repo.lastSyncAt && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground">Last sync: {new Date(repo.lastSyncAt).toLocaleString()}</p>
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
              </div>
            </Card>
          ))}
        </div>

        {project.repositories.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No repositories yet. Add one to get started!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
