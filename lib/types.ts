// Data models for Git Sync Manager

export interface Credential {
  id: string
  name: string
  type: "tfs" | "github"
  username: string
  token: string
  url?: string
  createdAt: string
}

export interface Repository {
  id: string
  name: string
  tfsUrl: string
  githubUrl: string
  tfsCredentialId: string
  githubCredentialId: string
  syncDirection: "tfs-to-github" | "github-to-tfs" | "bidirectional"
  lastSyncAt?: string
  lastSyncStatus?: "success" | "failed" | "in-progress"
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  repositories: Repository[]
  createdAt: string
}

export interface SyncLog {
  id: string
  repositoryId: string
  status: "success" | "failed" | "in-progress"
  startedAt: string
  completedAt?: string
  message: string
  changes?: {
    added: number
    modified: number
    deleted: number
  }
}

export interface ScheduledJob {
  id: string
  repositoryId: string
  name: string
  schedule: string // cron format
  enabled: boolean
  lastRunAt?: string
  nextRunAt?: string
  createdAt: string
}

export interface AppData {
  projects: Project[]
  credentials: Credential[]
  syncLogs: SyncLog[]
  scheduledJobs: ScheduledJob[]
}
