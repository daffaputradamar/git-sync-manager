// JSON file-based storage utilities

import fs from "node:fs"
import path from "node:path"
import type { AppData, Project, Credential, Repository, ScheduledJob } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "storage.json")

const defaultData: AppData = {
  projects: [],
  credentials: [],
  scheduledJobs: [],
}

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load data from JSON file
export function loadData(): AppData {
  try {
    ensureDataDir()

    if (!fs.existsSync(DATA_FILE)) {
      // Initialize with default data
      saveData(defaultData)
      return defaultData
    }

    const fileContent = fs.readFileSync(DATA_FILE, "utf-8")
    const data = JSON.parse(fileContent) as AppData
    
    // Migrate old scheduled jobs with repositoryId to repositoryIds
    // and schedule to cronExpression
    if (data.scheduledJobs) {
      let needsSave = false
      data.scheduledJobs = data.scheduledJobs.map((job: any) => {
        // Migrate repositoryId to repositoryIds
        if (job.repositoryId && !job.repositoryIds) {
          console.log(`[Migration] Converting job ${job.id} from repositoryId to repositoryIds`)
          needsSave = true
          job.repositoryIds = [job.repositoryId]
          delete job.repositoryId
        }
        
        // Ensure repositoryIds is always an array
        if (!job.repositoryIds) {
          job.repositoryIds = []
          needsSave = true
        }
        
        // Migrate schedule to cronExpression
        if (job.schedule && !job.cronExpression) {
          console.log(`[Migration] Converting job ${job.id} from schedule to cronExpression`)
          needsSave = true
          job.cronExpression = job.schedule
          delete job.schedule
        }
        
        // Ensure cronExpression has a default value
        if (!job.cronExpression) {
          console.log(`[Migration] Setting default cronExpression for job ${job.id}`)
          job.cronExpression = "0 0 * * *" // Default: daily at midnight
          needsSave = true
        }
        
        return job
      })
      
      if (needsSave) {
        console.log("[Migration] Saving migrated data")
        saveData(data)
      }
    }
    
    return data
  } catch (error) {
    console.error("Failed to load data:", error)
    return defaultData
  }
}

// Save data to JSON file
export function saveData(data: AppData): void {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (error) {
    console.error("Failed to save data:", error)
    throw error
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

// Scheduled job operations
export function createScheduledJob(projectId: string, repositoryIds: string[], name: string, cronExpression: string): ScheduledJob {
  const data = loadData()
  const job: ScheduledJob = {
    id: Date.now().toString(),
    projectId,
    repositoryIds,
    name,
    cronExpression,
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
