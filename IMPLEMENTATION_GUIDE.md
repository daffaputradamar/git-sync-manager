# Git Sync Manager

A comprehensive application for managing and synchronizing Git repositories between TFS (Team Foundation Server) and GitHub. The app provides both manual and automated synchronization options, with logging, conflict detection, and secure credential management.

## 🚀 Features

### ✅ Implemented Core Features

1. **Project & Repository Management**
   - Create projects to organize repository pairs
   - Configure multiple TFS ↔ GitHub repository pairs per project
   - Branch mapping (e.g., main ↔ master)
   - Sync direction: one-way (TFS → GitHub / GitHub → TFS) or bi-directional
   - Conflict resolution policies (auto-resolve, manual, prefer-source, prefer-target)

2. **Synchronization Engine**
   - Real Git synchronization using `simple-git`
   - Manual sync with diff preview
   - Automated conflict detection and resolution
   - Detailed sync logging with commit history
   - Change tracking (added, modified, deleted files)

3. **Scheduler Management**
   - Create, edit, and delete scheduled sync jobs
   - Cron-based scheduling (hourly, daily, weekly, custom)
   - Enable/disable schedules
   - Track last run and next run times

4. **Credential Management**
   - Secure credential storage with AES encryption
   - Support for Personal Access Tokens
   - Separate credentials for TFS and GitHub
   - Credential validation via Git API
   - Multiple account management

5. **Dashboard & Monitoring**
   - Overview of projects, repositories, and sync states
   - Recent sync history with status summaries
   - Quick actions for common tasks

## 📋 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Git Operations**: simple-git
- **Scheduling**: node-cron
- **Security**: crypto-js (AES encryption)
- **Storage**: File-based JSON (data/storage.json)
- **UI Components**: Radix UI, shadcn/ui

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Git installed on the system

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd git-sync-manager
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set environment variables (optional)**
   Create a `.env.local` file:
   ```env
   ENCRYPTION_KEY=your-secure-encryption-key-change-this
   PORT=3000
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
git-sync-manager/
├── app/
│   ├── api/                    # API routes
│   │   ├── credentials/        # Credential management
│   │   ├── projects/           # Project CRUD operations
│   │   ├── scheduler/          # Scheduler management
│   │   ├── sync/               # Synchronization endpoints
│   │   └── logs/               # Sync logs
│   ├── credentials/            # Credentials UI
│   ├── projects/               # Projects UI
│   ├── scheduler/              # Scheduler UI
│   ├── sync/                   # Sync management UI
│   └── page.tsx                # Dashboard
├── lib/
│   ├── git-sync.ts             # Git sync engine
│   ├── scheduler.ts            # Cron scheduler
│   ├── encryption.ts           # Encryption utilities
│   ├── storage.ts              # Data persistence
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── components/
    ├── ui/                     # UI components (shadcn)
    ├── header.tsx              # App header
    └── sidebar.tsx             # Navigation sidebar
```

## 🔐 API Documentation

### Credentials API

#### `POST /api/credentials`
Create a new credential
```json
{
  "name": "GitHub Personal",
  "type": "github",
  "username": "your-username",
  "token": "ghp_xxxxxxxxxxxxx",
  "url": "https://github.com" // optional for GitHub
}
```

#### `POST /api/credentials/validate`
Validate credentials
```json
{
  "type": "github",
  "username": "your-username",
  "token": "ghp_xxxxxxxxxxxxx",
  "url": "https://github.com"
}
```

#### `GET /api/credentials`
Get all credentials (tokens encrypted)

#### `DELETE /api/credentials?id={id}`
Delete a credential

### Projects API

#### `POST /api/projects`
Create a new project
```json
{
  "name": "Web Apps",
  "description": "All web application repositories"
}
```

#### `GET /api/projects`
Get all projects with repositories

#### `GET /api/projects/{id}`
Get a specific project

#### `PUT /api/projects/{id}`
Update a project

#### `DELETE /api/projects/{id}`
Delete a project (and associated jobs)

### Repository API

#### `POST /api/projects/{id}/repositories`
Add repository to project
```json
{
  "name": "My App",
  "tfsUrl": "https://tfs.company.com/tfs/DefaultCollection/_git/MyApp",
  "githubUrl": "https://github.com/username/my-app.git",
  "tfsCredentialId": "credential-id-1",
  "githubCredentialId": "credential-id-2",
  "tfsBranch": "main",
  "githubBranch": "main",
  "syncDirection": "bidirectional",
  "conflictPolicy": "auto-resolve",
  "ignoreRules": ["*.log", "node_modules/"]
}
```

#### `GET /api/projects/{id}/repositories`
Get all repositories in a project

#### `PUT /api/projects/{id}/repositories/{repoId}`
Update repository configuration

#### `DELETE /api/projects/{id}/repositories/{repoId}`
Delete a repository

### Sync API

#### `POST /api/sync`
Trigger synchronization
```json
{
  "repositoryId": "repo-id",
  "projectId": "project-id"
}
```

#### `POST /api/sync/preview`
Preview sync changes (diff)
```json
{
  "repositoryId": "repo-id",
  "projectId": "project-id"
}
```

### Scheduler API

#### `POST /api/scheduler`
Create scheduled job
```json
{
  "repositoryId": "repo-id",
  "name": "Daily Sync",
  "schedule": "0 0 * * *"
}
```

#### `GET /api/scheduler`
Get all scheduled jobs

#### `PUT /api/scheduler`
Update scheduled job

#### `DELETE /api/scheduler?id={id}`
Delete scheduled job

#### `POST /api/scheduler/trigger`
Manually trigger a scheduled job
```json
{
  "jobId": "job-id"
}
```

### Logs API

#### `GET /api/logs?repositoryId={id}&limit=50`
Get sync logs (optionally filtered by repository)

## 🗓️ Cron Expression Examples

- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 12 * * *` - Daily at noon
- `0 0 * * 1` - Weekly on Monday
- `0 0 1 * *` - Monthly on the 1st

## 🔒 Security

### Credential Encryption
All sensitive credential data (usernames, tokens, URLs) are encrypted using AES-256 encryption before being stored. The encryption key should be set via the `ENCRYPTION_KEY` environment variable.

**⚠️ Important**: Change the default encryption key in production!

### Git Authentication
The app uses authenticated Git operations with tokens:
- **GitHub**: Personal Access Token (PAT) with `repo` scope
- **TFS**: Personal Access Token with Code (Read & Write) permissions

## 🎯 Usage Guide

### 1. Add Credentials

1. Navigate to **Credentials** page
2. Click **Add Credential**
3. Fill in:
   - Name (e.g., "GitHub Personal")
   - Type (GitHub or TFS)
   - Username
   - Token/Password
   - URL (required for TFS)
4. Click **Test Credential** to validate
5. Save

### 2. Create a Project

1. Go to **Projects** page
2. Create a new project with name and description
3. Click on the project to open it

### 3. Add Repository Pair

1. Inside a project, click **Add Repository**
2. Configure:
   - Repository name
   - TFS URL (e.g., `https://tfs.company.com/DefaultCollection/_git/repo`)
   - GitHub URL (e.g., `https://github.com/user/repo.git`)
   - Select TFS and GitHub credentials
   - Choose branches to sync
   - Set sync direction
   - Set conflict policy
3. Save the repository

### 4. Manual Sync

1. Go to **Sync** page
2. Find your repository
3. Click **Sync Now**
4. View real-time progress and results

### 5. Schedule Automatic Sync

1. Navigate to **Scheduler** page
2. Click **Create Job**
3. Select repository
4. Set schedule using cron expression or presets
5. Enable the job

## 🧪 Conflict Resolution Policies

- **manual**: Stop sync on conflicts, require manual resolution
- **auto-resolve**: Automatically resolve using source (ours) strategy
- **prefer-source**: Force push from source, overwrite target
- **prefer-target**: Pull from target first, then attempt merge

## 📊 Dashboard Features

The dashboard provides:
- Total counts: Projects, Repositories, Scheduled Jobs, Credentials
- Recent synchronization history (last 5 syncs)
- Status indicators (success, failed, in-progress)
- Quick action buttons

## 🚧 Known Limitations

1. **Storage**: Uses file-based JSON storage. For high-traffic production, migrate to a database (PostgreSQL, MongoDB, etc.)
2. **Scheduler**: Runs in-process. For scalability, use a dedicated job queue (Bull, BullMQ)
3. **Temp Files**: Git operations create temporary files in `.git-sync-temp/`. Ensure adequate disk space
4. **Large Repositories**: May be slow for very large repos. Consider implementing shallow clones
5. **Authentication**: Only supports token-based auth. OAuth flow can be added
6. **Concurrency**: File-based storage doesn't handle concurrent writes. For multi-instance deployments, use a database

## 🔄 Future Enhancements

- [ ] Database integration (SQLite/PostgreSQL)
- [ ] OAuth support for GitHub
- [ ] Webhook triggers for automatic sync
- [ ] Email/Slack notifications
- [ ] Repository health checks
- [ ] Advanced diff viewer
- [ ] Rollback functionality
- [ ] Multi-user support with authentication
- [ ] Export sync reports (CSV, PDF)
- [ ] Repository clone depth configuration
- [ ] Custom merge strategies
- [ ] Sync pause/resume
- [ ] Branch protection rules

## 🐛 Troubleshooting

### Sync Fails with "Authentication Failed"
- Verify credentials are correct and haven't expired
- For GitHub, ensure PAT has `repo` scope
- For TFS, ensure PAT has Code (Read & Write) permissions

### Scheduler Not Running
- Check that the scheduled job is enabled
- Verify cron expression is valid
- Ensure the app is running (scheduler stops when app stops)

### Conflicts Not Resolving
- Check conflict policy setting
- For manual policy, conflicts must be resolved manually
- Consider using "prefer-source" or "prefer-target" for simpler cases

### Slow Sync Performance
- Large repositories take longer to clone and sync
- Consider using ignore rules to exclude unnecessary files
- Ensure stable network connection

## 📝 Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Linting
```bash
pnpm lint
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using Next.js, React, and TypeScript**
