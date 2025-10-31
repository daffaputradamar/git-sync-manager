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

export interface BranchPair {
  name: string // Single branch name for both TFS and GitHub
}

export interface Repository {
  id: string
  name: string
  tfsUrl: string
  githubUrl: string
  tfsCredentialId: string
  githubCredentialId: string
  // Legacy single branch support (for backward compatibility)
  tfsBranch?: string
  githubBranch?: string
  // New multiple branch support
  branchPairs?: BranchPair[]
  syncDirection: "tfs-to-github" | "github-to-tfs" | "bidirectional"
  ignoreRules?: string[] // gitignore-style patterns
  conflictPolicy: "auto-resolve" | "manual" | "prefer-source" | "prefer-target"
  lastSyncAt?: string
  lastSyncStatus?: "success" | "failed" | "in-progress"
  createdAt: string
}

export interface SyncConflict {
  id: string
  repositoryId: string
  file: string
  type: "modify" | "delete" | "add"
  sourceBranch: string
  targetBranch: string
  description: string
  resolved: boolean
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
  error?: string
  changes?: {
    added: number
    modified: number
    deleted: number
  }
  commits?: Array<{
    hash: string
    message: string
    author: string
    date: string
  }>
  conflicts?: SyncConflict[]
}

export interface ScheduledJob {
  id: string
  name: string
  description?: string
  cronExpression: string // cron format
  repositoryIds: string[]  // Changed: now supports multiple repositories
  enabled: boolean
  lastRunAt?: string
  nextRunAt?: string
  lastRunStatus?: "success" | "failed" | "in-progress"
  runCount?: number
  createdAt: string
}

export interface AppData {
  projects: Project[]
  credentials: Credential[]
  scheduledJobs: ScheduledJob[]
}

export interface SyncDiff {
  files: Array<{
    path: string
    status: "added" | "modified" | "deleted" | "renamed"
    additions?: number
    deletions?: number
  }>
  commits: Array<{
    hash: string
    message: string
    author: string
    date: string
  }>
}

export interface SyncResult {
  success: boolean
  repositoryId: string
  syncDirection: string
  changes?: {
    added: number
    modified: number
    deleted: number
  }
  commits?: Array<{
    hash: string
    message: string
    author: string
    date: string
  }>
  conflicts?: SyncConflict[]
  error?: string
  timestamp: string
}
