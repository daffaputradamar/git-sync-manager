import { db, schema } from "./index"
import { eq } from "drizzle-orm"
import type { AppData, Project, Credential, Repository, ScheduledJob } from "@/lib/types"

export async function getAllData(): Promise<AppData> {
  const [projectsList, credentialsList, jobsList] = await Promise.all([
    db.query.projects.findMany({
      with: {
        repositories: true,
        scheduledJobs: true,
      },
    }),
    db.query.credentials.findMany(),
    db.query.scheduledJobs.findMany(),
  ])

  return {
    projects: projectsList as any[],
    credentials: credentialsList as any[],
    scheduledJobs: jobsList as any[],
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
    with: {
      repositories: true,
      scheduledJobs: true,
    },
  })
  return project as any
}

export async function createProject(project: Omit<Project, "id" | "repositories" | "createdAt">) {
  const [newProject] = await db
    .insert(schema.projects)
    .values({
      name: project.name,
      description: project.description,
    })
    .returning()
  return newProject
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const [updated] = await db
    .update(schema.projects)
    .set({
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId))
    .returning()
  return updated
}

export async function deleteProject(projectId: string) {
  // Delete all related data
  await db.delete(schema.scheduledJobs).where(eq(schema.scheduledJobs.projectId, projectId))
  await db.delete(schema.repositories).where(eq(schema.repositories.projectId, projectId))
  // Don't delete credentials - they're global and may be used by other projects
  await db.delete(schema.projects).where(eq(schema.projects.id, projectId))
}

export async function createRepository(projectId: string, repo: Omit<Repository, "id" | "createdAt">) {
  const [newRepo] = await db
    .insert(schema.repositories)
    .values({
      projectId,
      name: repo.name,
      tfsUrl: repo.tfsUrl,
      githubUrl: repo.githubUrl,
      tfsCredentialId: repo.tfsCredentialId,
      githubCredentialId: repo.githubCredentialId,
      syncDirection: repo.syncDirection,
      ignoreRules: repo.ignoreRules ? JSON.stringify(repo.ignoreRules) : null,
      conflictPolicy: repo.conflictPolicy,
      branchPairs: repo.branchPairs || [],
    })
    .returning()
  return newRepo
}

export async function updateRepository(projectId: string, repoId: string, updates: Partial<Repository>) {
  const values: any = {}

  if (updates.name !== undefined) values.name = updates.name
  if (updates.tfsUrl !== undefined) values.tfsUrl = updates.tfsUrl
  if (updates.githubUrl !== undefined) values.githubUrl = updates.githubUrl
  if (updates.tfsCredentialId !== undefined) values.tfsCredentialId = updates.tfsCredentialId
  if (updates.githubCredentialId !== undefined) values.githubCredentialId = updates.githubCredentialId
  if (updates.syncDirection !== undefined) values.syncDirection = updates.syncDirection
  if (updates.ignoreRules !== undefined) values.ignoreRules = updates.ignoreRules ? JSON.stringify(updates.ignoreRules) : null
  if (updates.conflictPolicy !== undefined) values.conflictPolicy = updates.conflictPolicy
  if (updates.branchPairs !== undefined) values.branchPairs = updates.branchPairs
  if (updates.lastSyncAt !== undefined) values.lastSyncAt = updates.lastSyncAt ? new Date(updates.lastSyncAt) : null
  if (updates.lastSyncStatus !== undefined) values.lastSyncStatus = updates.lastSyncStatus

  values.updatedAt = new Date()

  const [updated] = await db
    .update(schema.repositories)
    .set(values)
    .where(eq(schema.repositories.id, repoId))
    .returning()
  return updated
}

export async function deleteRepository(projectId: string, repoId: string) {
  await db.delete(schema.repositories).where(eq(schema.repositories.id, repoId))
}

export async function createCredential(credential: Omit<Credential, "id" | "createdAt">) {
  const [newCred] = await db
    .insert(schema.credentials)
    .values({
      type: credential.type,
      username: credential.username,
      token: credential.token,
      url: credential.url,
    })
    .returning()
  return newCred
}

export async function updateCredential(credentialId: string, updates: Partial<Credential>) {
  const [updated] = await db
    .update(schema.credentials)
    .set({
      ...(updates.username && { username: updates.username }),
      ...(updates.token && { token: updates.token }),
      ...(updates.url !== undefined && { url: updates.url }),
      updatedAt: new Date(),
    })
    .where(eq(schema.credentials.id, credentialId))
    .returning()
  return updated
}

export async function deleteCredential(credentialId: string) {
  await db.delete(schema.credentials).where(eq(schema.credentials.id, credentialId))
}

export async function createScheduledJob(projectId: string, job: Omit<ScheduledJob, "id" | "createdAt">) {
  const [newJob] = await db
    .insert(schema.scheduledJobs)
    .values({
      projectId,
      name: job.name,
      description: job.description,
      cronExpression: job.cronExpression,
      repositoryIds: job.repositoryIds,
      enabled: job.enabled,
      nextRunAt: job.nextRunAt ? new Date(job.nextRunAt) : null,
    })
    .returning()
  return newJob
}

export async function updateScheduledJob(jobId: string, updates: Partial<ScheduledJob>) {
  const values: any = {}

  if (updates.name !== undefined) values.name = updates.name
  if (updates.description !== undefined) values.description = updates.description
  if (updates.cronExpression !== undefined) values.cronExpression = updates.cronExpression
  if (updates.repositoryIds !== undefined) values.repositoryIds = updates.repositoryIds
  if (updates.enabled !== undefined) values.enabled = updates.enabled
  if (updates.nextRunAt !== undefined) values.nextRunAt = updates.nextRunAt ? new Date(updates.nextRunAt) : null
  if (updates.lastRunAt !== undefined) values.lastRunAt = updates.lastRunAt ? new Date(updates.lastRunAt) : null
  if (updates.lastRunStatus !== undefined) values.lastRunStatus = updates.lastRunStatus
  if (updates.runCount !== undefined) values.runCount = updates.runCount

  values.updatedAt = new Date()

  const [updated] = await db
    .update(schema.scheduledJobs)
    .set(values)
    .where(eq(schema.scheduledJobs.id, jobId))
    .returning()
  return updated
}

export async function deleteScheduledJob(jobId: string) {
  await db.delete(schema.scheduledJobs).where(eq(schema.scheduledJobs.id, jobId))
}

