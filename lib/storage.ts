// JSON-based storage utilities

const STORAGE_KEY = "git-sync-manager-data"

const defaultData: AppData = {
  projects: [],
  credentials: [],
  syncLogs: [],
  scheduledJobs: [],
}

import type { AppData, Project, Credential, Repository, SyncLog, ScheduledJob } from "./types"

export function loadData(): AppData {
  if (typeof window === "undefined") return defaultData

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : defaultData
  } catch {
    return defaultData
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save data:", error)
  }
}

// Project operations
export function createProject(name: string, description: string): Project {
  const data = loadData()
  const project: Project = {
    id: Date.now().toString(),
    name,
    description,
    repositories: [],
    createdAt: new Date().toISOString(),
  }
  data.projects.push(project)
  saveData(data)
  return project
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const data = loadData()
  const project = data.projects.find((p) => p.id === id)
  if (!project) return null

  Object.assign(project, updates)
  saveData(data)
  return project
}

export function deleteProject(id: string): boolean {
  const data = loadData()
  const index = data.projects.findIndex((p) => p.id === id)
  if (index === -1) return false

  data.projects.splice(index, 1)
  saveData(data)
  return true
}

// Credential operations
export function createCredential(
  name: string,
  type: "tfs" | "github",
  username: string,
  token: string,
  url?: string,
): Credential {
  const data = loadData()
  const credential: Credential = {
    id: Date.now().toString(),
    name,
    type,
    username,
    token,
    url,
    createdAt: new Date().toISOString(),
  }
  data.credentials.push(credential)
  saveData(data)
  return credential
}

export function deleteCredential(id: string): boolean {
  const data = loadData()
  const index = data.credentials.findIndex((c) => c.id === id)
  if (index === -1) return false

  data.credentials.splice(index, 1)
  saveData(data)
  return true
}

// Repository operations
export function addRepository(projectId: string, repo: Omit<Repository, "id" | "createdAt">): Repository | null {
  const data = loadData()
  const project = data.projects.find((p) => p.id === projectId)
  if (!project) return null

  const repository: Repository = {
    ...repo,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  project.repositories.push(repository)
  saveData(data)
  return repository
}

export function updateRepository(projectId: string, repoId: string, updates: Partial<Repository>): Repository | null {
  const data = loadData()
  const project = data.projects.find((p) => p.id === projectId)
  if (!project) return null

  const repo = project.repositories.find((r) => r.id === repoId)
  if (!repo) return null

  Object.assign(repo, updates)
  saveData(data)
  return repo
}

export function deleteRepository(projectId: string, repoId: string): boolean {
  const data = loadData()
  const project = data.projects.find((p) => p.id === projectId)
  if (!project) return false

  const index = project.repositories.findIndex((r) => r.id === repoId)
  if (index === -1) return false

  project.repositories.splice(index, 1)
  saveData(data)
  return true
}

// Sync log operations
export function createSyncLog(
  repositoryId: string,
  status: "success" | "failed" | "in-progress",
  message: string,
  changes?: { added: number; modified: number; deleted: number },
): SyncLog {
  const data = loadData()
  const log: SyncLog = {
    id: Date.now().toString(),
    repositoryId,
    status,
    startedAt: new Date().toISOString(),
    message,
    changes,
  }
  data.syncLogs.push(log)
  saveData(data)
  return log
}

// Scheduled job operations
export function createScheduledJob(repositoryId: string, name: string, schedule: string): ScheduledJob {
  const data = loadData()
  const job: ScheduledJob = {
    id: Date.now().toString(),
    repositoryId,
    name,
    schedule,
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  data.scheduledJobs.push(job)
  saveData(data)
  return job
}

export function updateScheduledJob(id: string, updates: Partial<ScheduledJob>): ScheduledJob | null {
  const data = loadData()
  const job = data.scheduledJobs.find((j) => j.id === id)
  if (!job) return null

  Object.assign(job, updates)
  saveData(data)
  return job
}

export function deleteScheduledJob(id: string): boolean {
  const data = loadData()
  const index = data.scheduledJobs.findIndex((j) => j.id === id)
  if (index === -1) return false

  data.scheduledJobs.splice(index, 1)
  saveData(data)
  return true
}
