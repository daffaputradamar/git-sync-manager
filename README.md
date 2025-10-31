# Git Sync Manager 🔄

A comprehensive application for managing and synchronizing Git repositories between TFS (Team Foundation Server) and GitHub with automated scheduling, conflict resolution, and secure credential management.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/daffa-akbars-projects/v0-git-sync-manager)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

## ✨ Features

- 🔄 **Real Git Synchronization** - Actual Git operations between TFS and GitHub
- 📁 **Project Organization** - Group related repository pairs into projects
- 🔐 **Secure Credentials** - AES-256 encrypted credential storage
- ⏰ **Automated Scheduling** - Cron-based automatic synchronization
- 🎯 **Conflict Resolution** - Multiple strategies (manual, auto-resolve, prefer-source, prefer-target)
- 📊 **Detailed Logging** - Complete sync history with commit details
- 🚀 **Bi-directional Sync** - Support for one-way and two-way synchronization
- 🌿 **Branch Mapping** - Sync different branches between repos
- 📝 **Diff Preview** - See changes before syncing

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and set ENCRYPTION_KEY

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

👉 **See [QUICK_START.md](./QUICK_START.md) for step-by-step setup guide**

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete technical documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details and architecture

## 🛠️ Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Git Operations**: simple-git
- **Scheduling**: node-cron  
- **Encryption**: crypto-js (AES-256)
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Storage**: File-based JSON (data/storage.json)

## 🎯 Use Cases

- Sync enterprise TFS repositories to GitHub for CI/CD
- Mirror repositories between on-premise and cloud
- Automate repository backups and mirroring
- Maintain synchronized development environments
- Bridge legacy TFS with modern GitHub workflows

## 📖 API Documentation

### Endpoints

- `POST /api/credentials` - Create/manage credentials
- `POST /api/credentials/validate` - Validate Git credentials
- `POST /api/projects` - Create/manage projects
- `POST /api/projects/{id}/repositories` - Add repositories
- `POST /api/sync` - Trigger synchronization
- `POST /api/sync/preview` - Preview changes
- `POST /api/scheduler` - Create scheduled jobs
- `GET /api/logs` - View sync history

Full API docs in [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

## 🔐 Security

- AES-256 encryption for credentials
- Environment-based encryption keys
- No plaintext password storage
- Token-based Git authentication
- Secure temporary file handling

**⚠️ Important**: Change the default `ENCRYPTION_KEY` in production!

## 🎨 Screenshots

### Dashboard
View project overview, sync status, and quick actions

### Projects
Organize and manage repository pairs by project

### Credentials  
Secure credential management with validation

### Sync
Manual sync with real-time progress and detailed logs

### Scheduler
Automated synchronization with cron scheduling

## 🔧 Configuration

### Environment Variables

```env
ENCRYPTION_KEY=your-secure-random-key
PORT=3000
NODE_ENV=development
```

### Sync Direction Options

- **tfs-to-github** - One-way: TFS → GitHub
- **github-to-tfs** - One-way: GitHub → TFS
- **bidirectional** - Two-way sync

### Conflict Policies

- **manual** - Stop and alert on conflicts
- **auto-resolve** - Auto-resolve with source preference
- **prefer-source** - Force push from source
- **prefer-target** - Pull target changes first

## 🚧 Limitations & Future Plans

### Current Limitations
- File-based storage (single server instance)
- In-process scheduler
- Large repo performance
- No concurrent write handling

### Future Enhancements
- [ ] Database migration (PostgreSQL/MongoDB)
- [ ] OAuth for GitHub
- [ ] Webhook triggers
- [ ] Email/Slack notifications
- [ ] Advanced diff viewer
- [ ] Multi-user support
- [ ] Repository health checks
- [ ] Rollback functionality

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, TypeScript, and simple-git**