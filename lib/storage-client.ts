// Client-side storage API wrapper
// Use this in client components instead of importing lib/storage.ts directly

import type { AppData, Project, Credential, Repository, SyncLog, ScheduledJob } from "./types"

// API wrapper functions for client components
export async function loadData(): Promise<AppData> {
  const response = await fetch("/api/data")
  if (!response.ok) {
    throw new Error("Failed to load data")
  }
  return response.json()
}

export async function createProject(name: string, description: string): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  })
  if (!response.ok) {
    throw new Error("Failed to create project")
  }
  return response.json()
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error("Failed to update project")
  }
  return response.json()
}

export async function deleteProject(id: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  })
  return response.ok
}

export async function createCredential(
  name: string,
  type: "tfs" | "github",
  username: string,
  token: string,
  url?: string,
): Promise<Credential> {
  const response = await fetch("/api/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, username, token, url }),
  })
  if (!response.ok) {
    throw new Error("Failed to create credential")
  }
  return response.json()
}

export async function updateCredential(id: string, updates: Partial<Credential>): Promise<Credential> {
  const response = await fetch("/api/credentials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!response.ok) {
    throw new Error("Failed to update credential")
  }
  return response.json()
}

export async function deleteCredential(id: string): Promise<boolean> {
  const response = await fetch(`/api/credentials?id=${id}`, {
    method: "DELETE",
  })
  return response.ok
}

export async function addRepository(
  projectId: string,
  repo: Omit<Repository, "id" | "createdAt">,
): Promise<Repository> {
  const response = await fetch(`/api/projects/${projectId}/repositories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(repo),
  })
  if (!response.ok) {
    throw new Error("Failed to add repository")
  }
  return response.json()
}

export async function updateRepository(
  projectId: string,
  repoId: string,
  updates: Partial<Repository>,
): Promise<Repository> {
  const response = await fetch(`/api/projects/${projectId}/repositories/${repoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error("Failed to update repository")
  }
  return response.json()
}

export async function deleteRepository(projectId: string, repoId: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/repositories/${repoId}`, {
    method: "DELETE",
  })
  return response.ok
}

export async function createSyncLog(
  repositoryId: string,
  status: "success" | "failed" | "in-progress",
  message: string,
  changes?: { added: number; modified: number; deleted: number },
): Promise<SyncLog> {
  // Sync logs are created automatically by the sync API
  // This is a placeholder for compatibility
  return {
    id: Date.now().toString(),
    repositoryId,
    status,
    startedAt: new Date().toISOString(),
    message,
    changes,
  }
}

export async function createScheduledJob(
  repositoryIds: string[],
  name: string,
  cronExpression: string,
): Promise<ScheduledJob> {
  const response = await fetch("/api/scheduler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repositoryIds, name, cronExpression }),
  })
  if (!response.ok) {
    throw new Error("Failed to create scheduled job")
  }
  return response.json()
}

export async function updateScheduledJob(id: string, updates: Partial<ScheduledJob>): Promise<ScheduledJob> {
  const response = await fetch("/api/scheduler", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!response.ok) {
    throw new Error("Failed to update scheduled job")
  }
  return response.json()
}

export async function deleteScheduledJob(id: string): Promise<boolean> {
  const response = await fetch(`/api/scheduler?id=${id}`, {
    method: "DELETE",
  })
  return response.ok
}
