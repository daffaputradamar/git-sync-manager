# PostgreSQL + Drizzle ORM Integration Guide

## Overview
This document guides you through setting up the Git Sync Manager application with PostgreSQL and Drizzle ORM, replacing the JSON-based storage system.

## Installation Complete ✅

The following packages have been installed:
- `drizzle-orm` - ORM for type-safe database operations
- `drizzle-kit` - Migrations and schema management
- `postgres` - PostgreSQL driver
- `@neondatabase/serverless` - Neon serverless PostgreSQL support
- `dotenv` - Environment variable management

## Setup Instructions

### 1. Create a Neon PostgreSQL Database

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in to your account
3. Create a new project
4. Copy your connection string (format: `postgres://user:password@host/database?sslmode=require`)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgres://your_user:your_password@your_host.neon.tech/your_database?sslmode=require
```

### 3. Generate and Run Migrations

```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Push migrations to database
pnpm drizzle-kit push
```

### 4. File Structure

The database integration includes:

```
lib/
  db/
    index.ts           - Database client initialization
    schema.ts          - Drizzle schema definitions
    service.ts         - Database service layer functions
    migrations/        - Auto-generated migrations
```

### 5. Database Schema

The following tables are created:

- **credentials** - Stores TFS and GitHub credentials
- **projects** - Project metadata
- **repositories** - Repository configurations with branch pairs
- **scheduled_jobs** - Scheduler job configurations

### 6. Key Changes from JSON Storage

#### Removed Features:
- `syncLogs` - No longer tracked (can be added later if needed)
- `conflicts` - Removed from main AppData

#### Changed Types:
- `ScheduledJob.schedule` → `ScheduledJob.cronExpression`
- `ScheduledJob.projectId` - Now required (added)
- `BranchPair` - Simplified to single `name` field

#### Migration Notes:
- Old repositories with `tfsBranch`/`githubBranch` still work
- Auto-conversion to new `branchPairs` format on load
- No data loss during migration

### 7. Storage Layer

**Current State:** Application still uses JSON file storage via `lib/storage.ts` and `lib/storage-client.ts`

**Next Steps to Complete Migration:**

1. Update `lib/storage-client.ts` to use `lib/db/service.ts` functions
2. Create migration script to populate PostgreSQL from JSON
3. Replace all `loadData()`/`saveData()` calls with database queries
4. Update API routes to use database operations

### 8. Service Functions Available

The following functions are available in `lib/db/service.ts`:

**Projects:**
- `getProject(projectId)` - Fetch project with relations
- `createProject(project)` - Create new project
- `updateProject(projectId, updates)` - Update project
- `deleteProject(projectId)` - Delete project and cascade

**Repositories:**
- `createRepository(projectId, repo)` - Create repository
- `updateRepository(projectId, repoId, updates)` - Update repository
- `deleteRepository(projectId, repoId)` - Delete repository

**Credentials:**
- `createCredential(projectId, credential)` - Create credential
- `updateCredential(credentialId, updates)` - Update credential
- `deleteCredential(credentialId)` - Delete credential

**Scheduled Jobs:**
- `createScheduledJob(projectId, job)` - Create scheduled job
- `updateScheduledJob(jobId, updates)` - Update scheduled job
- `deleteScheduledJob(jobId)` - Delete scheduled job

### 9. Database Relations

The schema includes proper foreign key relationships:

```
projects (1) ──→ (many) credentials
projects (1) ──→ (many) repositories
projects (1) ──→ (many) scheduledJobs
repositories (many) ──→ (1) credentials (TFS)
repositories (many) ──→ (1) credentials (GitHub)
```

### 10. Query Example

```typescript
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"

// Fetch project with all relations
const project = await db.query.projects.findFirst({
  where: eq(schema.projects.id, projectId),
  with: {
    repositories: true,
    credentials: true,
    scheduledJobs: true,
  },
})
```

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is correct and database is accessible
- Ensure IP whitelist in Neon console includes your IP
- Check SSL connection string (should end with `?sslmode=require`)

### Migration Errors
- Run `pnpm drizzle-kit generate` to create migrations
- Check migration files in `lib/db/migrations`
- Verify schema matches database state

### Type Errors
- Ensure TypeScript is updated: `pnpm add -D typescript@latest`
- Rebuild project: `pnpm build`

## Next: Update Storage Client

To complete the migration:

1. Backup current `data/storage.json`
2. Update `lib/storage-client.ts` to use database
3. Create migration script to populate PostgreSQL
4. Update API routes to use database operations
5. Remove JSON storage dependency

## Support

For more information:
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
