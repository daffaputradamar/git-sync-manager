import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Credentials table
export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(), // "tfs" or "github"
  username: varchar("username", { length: 255 }).notNull(),
  token: text("token").notNull(),
  url: varchar("url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Repositories table
export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  tfsUrl: varchar("tfs_url", { length: 500 }).notNull(),
  githubUrl: varchar("github_url", { length: 500 }).notNull(),
  tfsCredentialId: uuid("tfs_credential_id").notNull(),
  githubCredentialId: uuid("github_credential_id").notNull(),
  syncDirection: varchar("sync_direction", { length: 50 }).notNull().default("bidirectional"), // "bidirectional", "tfs-to-github", "github-to-tfs"
  ignoreRules: text("ignore_rules"), // JSON string
  conflictPolicy: varchar("conflict_policy", { length: 50 }).notNull().default("skip"), // "skip", "overwrite", "prompt"
  branchPairs: jsonb("branch_pairs").notNull().default([]), // Array of { name: string }
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: varchar("last_sync_status", { length: 50 }), // "success", "failed", "pending"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Scheduled Jobs table
export const scheduledJobs = pgTable("scheduled_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  repositoryIds: jsonb("repository_ids").notNull(), // Array of repository IDs
  enabled: boolean("enabled").notNull().default(true),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: varchar("last_run_status", { length: 50 }), // "success", "failed", "pending"
  runCount: integer("run_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  repositories: many(repositories),
}))

export const credentialsRelations = relations(credentials, ({ one }) => ({}))

export const repositoriesRelations = relations(repositories, ({ one }) => ({
  project: one(projects, {
    fields: [repositories.projectId],
    references: [projects.id],
  }),
  tfsCredential: one(credentials, {
    fields: [repositories.tfsCredentialId],
    references: [credentials.id],
  }),
  githubCredential: one(credentials, {
    fields: [repositories.githubCredentialId],
    references: [credentials.id],
  }),
}))

export const scheduledJobsRelations = relations(scheduledJobs, ({ one }) => ({}))
