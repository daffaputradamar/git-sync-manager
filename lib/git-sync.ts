import simpleGit, { SimpleGit, LogResult } from "simple-git"
import path from "path"
import fs from "fs/promises"
import { existsSync } from "fs"
import type { SyncDiff, SyncResult, SyncConflict } from "./types"

const TEMP_DIR = path.join(process.cwd(), ".git-sync-temp")

interface GitCredentials {
  username: string
  token: string
  url: string
}

interface SyncOptions {
  repositoryId: string
  name: string
  tfsUrl: string
  githubUrl: string
  tfsCredentials: GitCredentials
  githubCredentials: GitCredentials
  tfsBranch: string
  githubBranch: string
  syncDirection: "tfs-to-github" | "github-to-tfs" | "bidirectional"
  ignoreRules?: string[]
  conflictPolicy: "auto-resolve" | "manual" | "prefer-source" | "prefer-target"
}

export class GitSyncEngine {
  private git: SimpleGit | null = null
  private repoPath: string
  private initialized: boolean = false

  constructor(repoPath: string) {
    this.repoPath = repoPath
    // Don't initialize git yet - wait until directory exists
  }

  private async ensureGitInitialized(): Promise<void> {
    if (this.git === null) {
      this.git = simpleGit(this.repoPath)
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.ensureTempDir()
      this.initialized = true
    }
  }

  private buildAuthUrl(url: string, username: string, token: string): string {
    try {
      const urlObj = new URL(url)
      urlObj.username = encodeURIComponent(username)
      urlObj.password = encodeURIComponent(token)
      return urlObj.toString()
    } catch {
      // If URL parsing fails, try basic format
      return url.replace("https://", `https://${encodeURIComponent(username)}:${encodeURIComponent(token)}@`)
    }
  }

  private async ensureTempDir(): Promise<void> {
    if (!existsSync(TEMP_DIR)) {
      await fs.mkdir(TEMP_DIR, { recursive: true })
    }
  }

  private async cleanupRepo(): Promise<void> {
    try {
      if (existsSync(this.repoPath)) {
        await fs.rm(this.repoPath, { recursive: true, force: true })
      }
    } catch (error) {
      console.error("Cleanup error:", error)
    }
  }

  async cloneRepository(url: string, credentials: GitCredentials, branch: string): Promise<void> {
    await this.ensureInitialized()
    await this.cleanupRepo()

    const authUrl = this.buildAuthUrl(url, credentials.username, credentials.token)

    console.log(`[cloneRepository] Cloning repository:`)
    console.log(`[cloneRepository]   URL: ${url}`)
    console.log(`[cloneRepository]   Branch: ${branch}`)
    console.log(`[cloneRepository]   Target path: ${this.repoPath}`)

    // Use shallow clone with depth=1 for faster cloning, --single-branch to reduce data transfer
    await simpleGit().clone(authUrl, this.repoPath, ["--branch", branch, "--single-branch", "--depth", "1"])
    
    console.log(`[cloneRepository] Clone successful, initializing git object`)
    // Reinitialize git object after cloning
    this.git = simpleGit(this.repoPath)
    
    // Log the cloned repository state
    try {
      const status = await this.git.status()
      const branches = await this.git.branch(["-a"])
      console.log(`[cloneRepository] Repository state:`)
      console.log(`[cloneRepository]   Current branch: ${status.current}`)
      console.log(`[cloneRepository]   Is detached: ${status.detached}`)
      console.log(`[cloneRepository]   Available branches:`, branches.all)
    } catch (error) {
      console.error(`[cloneRepository] Error logging repository state:`, error)
    }
  }

  async fetchChanges(remoteName: string = "origin"): Promise<void> {
    await this.ensureGitInitialized()
    console.log(`[fetchChanges] Fetching from remote: ${remoteName}`)
    
    try {
      // Fetch all branches with all tags
      await this.git!.fetch(remoteName, { "--all": null, "--tags": null })
      console.log(`[fetchChanges] Successfully fetched from ${remoteName}`)
      
      // Log all available branches for debugging
      const branches = await this.git!.branch(["-a"])
      console.log(`[fetchChanges] Available branches after fetch:`, branches.all)
    } catch (error) {
      console.error(`[fetchChanges] Error fetching from ${remoteName}:`, error)
      throw error
    }
  }

  async getDiff(fromBranch: string, toBranch: string): Promise<SyncDiff> {
    await this.ensureGitInitialized()
    
    console.log(`[getDiff] Comparing: ${fromBranch} → ${toBranch}`)
    
    try {
      const branches = await this.git!.branch(["-a"])
      
      // Normalize branch names
      const fromRef = fromBranch.includes("/") ? fromBranch : `origin/${fromBranch}`
      const toRef = toBranch.includes("/") ? toBranch : `origin/${toBranch}`
      
      // Quick check if target branch exists
      if (!branches.all.includes(toRef)) {
        console.log(`[getDiff] Target branch doesn't exist yet (first sync)`)
        return { files: [], commits: [] }
      }
      
      // Try three-dot diff (preferred)
      try {
        const diffSummary = await this.git!.diffSummary([`${fromRef}...${toRef}`])
        const logResult: LogResult = await this.git!.log([`${fromRef}...${toRef}`])

        return {
          files: diffSummary.files.map((file) => ({
            path: file.file,
            status: this.getFileStatus(file.file, diffSummary.files),
            additions: "insertions" in file ? file.insertions : 0,
            deletions: "deletions" in file ? file.deletions : 0,
          })),
          commits: logResult.all.map((commit) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            date: commit.date,
          })),
        }
      } catch {
        // Fallback to two-dot if three-dot fails
        const diffSummary = await this.git!.diffSummary([`${fromRef}..${toRef}`])
        const logResult: LogResult = await this.git!.log([`${fromRef}..${toRef}`])

        return {
          files: diffSummary.files.map((file) => ({
            path: file.file,
            status: this.getFileStatus(file.file, diffSummary.files),
            additions: "insertions" in file ? file.insertions : 0,
            deletions: "deletions" in file ? file.deletions : 0,
          })),
          commits: logResult.all.map((commit) => ({
            hash: commit.hash,
            message: commit.message,
            author: commit.author_name,
            date: commit.date,
          })),
        }
      }
    } catch (error) {
      console.error(`[getDiff] Failed to generate diff:`, error)
      // Return empty diff on error - sync will still proceed
      return { files: [], commits: [] }
    }
  }

  private getFileStatus(filePath: string, files: any[]): "added" | "modified" | "deleted" | "renamed" {
    // Simple heuristic - can be enhanced
    const file = files.find((f) => f.file === filePath)
    if (!file) return "modified"
    if (file.insertions > 0 && file.deletions === 0) return "added"
    if (file.insertions === 0 && file.deletions > 0) return "deleted"
    return "modified"
  }

  async addRemote(name: string, url: string, credentials: GitCredentials): Promise<void> {
    await this.ensureGitInitialized()
    const authUrl = this.buildAuthUrl(url, credentials.username, credentials.token)

    console.log(`[addRemote] Adding remote:`)
    console.log(`[addRemote]   Name: ${name}`)
    console.log(`[addRemote]   URL: ${url}`)

    try {
      await this.git!.removeRemote(name)
      console.log(`[addRemote] Removed existing remote: ${name}`)
    } catch {
      // Remote doesn't exist, that's fine
      console.log(`[addRemote] Remote ${name} doesn't exist yet`)
    }

    await this.git!.addRemote(name, authUrl)
    console.log(`[addRemote] Successfully added remote: ${name}`)
  }

  async push(remoteName: string, branch: string, force: boolean = false): Promise<void> {
    await this.ensureGitInitialized()
    try {
      const options = force ? ["--force"] : ["-u"]  // -u sets upstream tracking
      await this.git!.push(remoteName, branch, options)
    } catch (error: any) {
      // If branch doesn't exist on remote with -u, try force without -u
      if (error.message?.includes("no matching refs") || error.message?.includes("no changes")) {
        await this.git!.push(remoteName, branch, force ? ["--force"] : [])
      } else {
        throw error
      }
    }
  }

  async pull(remoteName: string, branch: string): Promise<void> {
    await this.ensureGitInitialized()
    try {
      // First, ensure the branch exists locally
      // Try to checkout or create tracking branch
      try {
        await this.git!.checkout(branch)
      } catch {
        // Branch doesn't exist locally, try to create tracking branch
        try {
          await this.git!.checkout(["-b", branch, `${remoteName}/${branch}`])
        } catch {
          // If that fails too, just proceed with pull
          // It might be a tracking branch already
        }
      }
      
      await this.git!.pull(remoteName, branch, { "--rebase": "true" })
    } catch (error: any) {
      if (error.message?.includes("CONFLICT")) {
        throw new Error("CONFLICT_DETECTED")
      }
      throw error
    }
  }

  async getConflicts(): Promise<SyncConflict[]> {
    await this.ensureGitInitialized()
    const status = await this.git!.status()
    const conflicts: SyncConflict[] = []

    for (const file of status.conflicted) {
      conflicts.push({
        id: Date.now().toString() + Math.random(),
        repositoryId: "",
        file,
        type: "modify",
        sourceBranch: "",
        targetBranch: "",
        description: `Conflict in file: ${file}`,
        resolved: false,
        createdAt: new Date().toISOString(),
      })
    }

    return conflicts
  }

  async resolveConflict(file: string, strategy: "ours" | "theirs"): Promise<void> {
    await this.ensureGitInitialized()
    if (strategy === "ours") {
      await this.git!.raw(["checkout", "--ours", file])
    } else {
      await this.git!.raw(["checkout", "--theirs", file])
    }
    await this.git!.add(file)
  }

  async commit(message: string): Promise<void> {
    await this.ensureGitInitialized()
    await this.git!.commit(message)
  }

  async getCurrentBranch(): Promise<string> {
    await this.ensureGitInitialized()
    const status = await this.git!.status()
    return status.current || "main"
  }

  async checkoutBranch(branch: string, create: boolean = false): Promise<void> {
    await this.ensureGitInitialized()
    if (create) {
      await this.git!.checkoutLocalBranch(branch)
    } else {
      await this.git!.checkout(branch)
    }
  }

  async branchExists(branch: string, remote?: string): Promise<boolean> {
    await this.ensureGitInitialized()
    try {
      const branches = await this.git!.branch(["-a"])
      if (remote) {
        return branches.all.includes(`remotes/${remote}/${branch}`)
      }
      return branches.all.includes(branch) || branches.all.includes(`remotes/origin/${branch}`)
    } catch {
      return false
    }
  }
}

export async function performSync(options: SyncOptions): Promise<SyncResult> {
  const repoPath = path.join(TEMP_DIR, `${options.repositoryId}-${Date.now()}`)
  const engine = new GitSyncEngine(repoPath)

  console.log(`[performSync] Starting sync for repository: ${options.name}`)
  console.log(`[performSync] Repository ID: ${options.repositoryId}`)
  console.log(`[performSync] Sync direction: ${options.syncDirection}`)
  console.log(`[performSync] Conflict policy: ${options.conflictPolicy}`)

  try {
    const result: SyncResult = {
      success: false,
      repositoryId: options.repositoryId,
      syncDirection: options.syncDirection,
      timestamp: new Date().toISOString(),
    }

    // Determine source and target based on sync direction
    let sourceUrl: string
    let targetUrl: string
    let sourceCreds: GitCredentials
    let targetCreds: GitCredentials
    let sourceBranch: string
    let targetBranch: string

    if (options.syncDirection === "tfs-to-github") {
      sourceUrl = options.tfsUrl
      targetUrl = options.githubUrl
      sourceCreds = options.tfsCredentials
      targetCreds = options.githubCredentials
      sourceBranch = options.tfsBranch
      targetBranch = options.githubBranch
    } else {
      sourceUrl = options.githubUrl
      targetUrl = options.tfsUrl
      sourceCreds = options.githubCredentials
      targetCreds = options.tfsCredentials
      sourceBranch = options.githubBranch
      targetBranch = options.tfsBranch
    }

    console.log(`[performSync] Configuration:`)
    console.log(`[performSync]   Source: ${sourceUrl} (branch: ${sourceBranch})`)
    console.log(`[performSync]   Target: ${targetUrl} (branch: ${targetBranch})`)

    // Clone source repository
    console.log(`[performSync] Step 1: Cloning source repository`)
    await engine.cloneRepository(sourceUrl, sourceCreds, sourceBranch)

    // Add target as remote
    console.log(`[performSync] Step 2: Adding target remote`)
    await engine.addRemote("target", targetUrl, targetCreds)

    // Fetch target
    console.log(`[performSync] Step 3: Fetching from target`)
    await engine.fetchChanges("target")

    // Get diff before sync
    console.log(`[performSync] Step 4: Checking if target branch exists`)
    const targetBranchExists = await engine.branchExists(targetBranch, "target")
    console.log(`[performSync] Target branch "${targetBranch}" exists on remote: ${targetBranchExists}`)

    console.log(`[performSync] Step 5: Generating diff before sync`)
    try {
      const diff = await engine.getDiff(sourceBranch, `target/${targetBranch}`)
      result.commits = diff.commits
      result.changes = {
        added: diff.files.filter((f) => f.status === "added").length,
        modified: diff.files.filter((f) => f.status === "modified").length,
        deleted: diff.files.filter((f) => f.status === "deleted").length,
      }
      console.log(`[performSync] Diff generated: ${result.changes?.added} added, ${result.changes?.modified} modified, ${result.changes?.deleted} deleted`)
    } catch (error) {
      // If branches are too different, we might not get a clean diff
      console.log("[performSync] Could not generate diff:", error)
    }

    // Perform sync based on conflict policy
    console.log(`[performSync] Step 6: Performing sync with policy: ${options.conflictPolicy}`)
    if (options.conflictPolicy === "prefer-source") {
      // Force push from source to target (works even if branch doesn't exist)
      console.log(`[performSync] Using prefer-source: force pushing to target/${targetBranch}`)
      await engine.push("target", targetBranch, true)
      console.log(`[performSync] Force push completed`)
    } else if (options.conflictPolicy === "prefer-target") {
      // Pull from target and push back (only if target branch exists)
      if (targetBranchExists) {
        console.log(`[performSync] Using prefer-target: pulling from target/${targetBranch}`)
        try {
          await engine.pull("target", targetBranch)
          await engine.push("target", targetBranch)
          console.log(`[performSync] Pull and push completed`)
        } catch (error: any) {
          if (error.message === "CONFLICT_DETECTED") {
            const conflicts = await engine.getConflicts()
            result.conflicts = conflicts
            result.success = false
            result.error = "Conflicts detected. Please resolve manually."
            return result
          }
          throw error
        }
      } else {
        console.log(`[performSync] Target branch doesn't exist yet, creating and pushing`)
        await engine.push("target", targetBranch, false)
      }
    } else if (options.conflictPolicy === "auto-resolve") {
      // Try to pull and auto-resolve with ours (if target exists)
      if (targetBranchExists) {
        console.log(`[performSync] Using auto-resolve: pulling from target/${targetBranch}`)
        try {
          await engine.pull("target", targetBranch)
        } catch (error: any) {
          if (error.message === "CONFLICT_DETECTED") {
            const conflicts = await engine.getConflicts()
            console.log(`[performSync] Conflicts detected, auto-resolving with ours`)
            // Auto-resolve with ours (source)
            for (const conflict of conflicts) {
              await engine.resolveConflict(conflict.file, "ours")
            }
            await engine.commit(`Auto-resolved conflicts: ${conflicts.length} files`)
          } else {
            throw error
          }
        }
        await engine.push("target", targetBranch)
        console.log(`[performSync] Auto-resolve and push completed`)
      } else {
        console.log(`[performSync] Target branch doesn't exist yet, creating and pushing`)
        await engine.push("target", targetBranch, false)
      }
    } else {
      // Manual policy - don't auto-resolve (only if target branch exists)
      if (targetBranchExists) {
        console.log(`[performSync] Using manual policy: pulling from target/${targetBranch}`)
        try {
          await engine.pull("target", targetBranch)
          await engine.push("target", targetBranch)
          console.log(`[performSync] Manual pull and push completed`)
        } catch (error: any) {
          if (error.message === "CONFLICT_DETECTED") {
            const conflicts = await engine.getConflicts()
            result.conflicts = conflicts
            result.success = false
            result.error = "Conflicts detected. Manual resolution required."
            return result
          }
          throw error
        }
      } else {
        console.log(`[performSync] Target branch doesn't exist yet, creating and pushing`)
        await engine.push("target", targetBranch, false)
      }
    }

    // Handle bidirectional sync
    if (options.syncDirection === "bidirectional") {
      // Push changes back to source if target had changes
      await engine.addRemote("source", sourceUrl, sourceCreds)
      try {
        await engine.push("source", sourceBranch)
      } catch (error) {
        console.log("No changes to push back to source")
      }
    }

    console.log(`[performSync] Sync completed successfully`)
    result.success = true
    return result
  } catch (error: any) {
    console.error("[performSync] Sync failed:", error)
    return {
      success: false,
      repositoryId: options.repositoryId,
      syncDirection: options.syncDirection,
      error: error.message || "Unknown sync error",
      timestamp: new Date().toISOString(),
    }
  } finally {
    // Cleanup asynchronously without waiting
    console.log(`[performSync] Cleaning up temporary repository`)
    engine["cleanupRepo"]().catch((error) => {
      console.error("[performSync] Cleanup error:", error)
    })
  }
}

export async function previewSync(options: SyncOptions): Promise<SyncDiff> {
  const repoPath = path.join(TEMP_DIR, `preview-${options.repositoryId}-${Date.now()}`)
  const engine = new GitSyncEngine(repoPath)

  console.log(`[previewSync] Starting preview sync for repository: ${options.name}`)
  console.log(`[previewSync] Repository ID: ${options.repositoryId}`)
  console.log(`[previewSync] Sync direction: ${options.syncDirection}`)

  try {
    let sourceUrl: string
    let sourceCreds: GitCredentials
    let targetUrl: string
    let targetCreds: GitCredentials
    let sourceBranch: string
    let targetBranch: string

    if (options.syncDirection === "tfs-to-github" || options.syncDirection === "bidirectional") {
      sourceUrl = options.tfsUrl
      targetUrl = options.githubUrl
      sourceCreds = options.tfsCredentials
      targetCreds = options.githubCredentials
      sourceBranch = options.tfsBranch
      targetBranch = options.githubBranch
    } else {
      sourceUrl = options.githubUrl
      targetUrl = options.tfsUrl
      sourceCreds = options.githubCredentials
      targetCreds = options.tfsCredentials
      sourceBranch = options.githubBranch
      targetBranch = options.tfsBranch
    }

    console.log(`[previewSync] Configuration:`)
    console.log(`[previewSync]   Source: ${sourceUrl} (branch: ${sourceBranch})`)
    console.log(`[previewSync]   Target: ${targetUrl} (branch: ${targetBranch})`)

    // Clone source
    console.log(`[previewSync] Step 1: Cloning source repository`)
    await engine.cloneRepository(sourceUrl, sourceCreds, sourceBranch)

    // Add target
    console.log(`[previewSync] Step 2: Adding target remote`)
    await engine.addRemote("target", targetUrl, targetCreds)
    
    console.log(`[previewSync] Step 3: Fetching from target remote`)
    await engine.fetchChanges("target")

    // Get diff
    console.log(`[previewSync] Step 4: Generating diff`)
    const diff = await engine.getDiff(sourceBranch, `target/${targetBranch}`)

    console.log(`[previewSync] Preview sync completed successfully:`)
    console.log(`[previewSync]   Files changed: ${diff.files.length}`)
    console.log(`[previewSync]   Commits: ${diff.commits.length}`)

    return diff
  } catch (error) {
    console.error(`[previewSync] Preview sync failed:`, error)
    throw error
  } finally {
    setTimeout(async () => {
      try {
        await engine["cleanupRepo"]()
        console.log(`[previewSync] Cleanup completed`)
      } catch (error) {
        console.error("[previewSync] Cleanup error:", error)
      }
    }, 5000)
  }
}

export async function validateGitCredentials(
  url: string,
  username: string,
  token: string,
  type: "github" | "tfs",
): Promise<{ valid: boolean; message: string }> {
  const tempPath = path.join(TEMP_DIR, `validate-${Date.now()}`)

  try {
    // Ensure temp dir exists
    if (!existsSync(TEMP_DIR)) {
      await fs.mkdir(TEMP_DIR, { recursive: true })
    }

    // Build authenticated URL
    let authUrl: string
    try {
      const urlObj = new URL(url)
      urlObj.username = encodeURIComponent(username)
      urlObj.password = encodeURIComponent(token)
      authUrl = urlObj.toString()
    } catch {
      authUrl = url.replace("https://", `https://${encodeURIComponent(username)}:${encodeURIComponent(token)}@`)
    }

    // Try to ls-remote to validate credentials without cloning
    await simpleGit().listRemote([authUrl])

    return {
      valid: true,
      message: "Credentials are valid",
    }
  } catch (error: any) {
    return {
      valid: false,
      message: error.message || "Invalid credentials",
    }
  } finally {
    // Cleanup temp path if created
    setTimeout(async () => {
      try {
        if (existsSync(tempPath)) {
          await fs.rm(tempPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.error("Cleanup error:", error)
      }
    }, 2000)
  }
}
