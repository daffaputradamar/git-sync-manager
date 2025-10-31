# Quick Start Guide - Git Sync Manager

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Setup

Create `.env.local` file:
```env
ENCRYPTION_KEY=change-this-to-a-secure-random-key
PORT=3000
```

### Step 2: Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 3: Add Your First Credential

1. Go to **Credentials** page
2. Click **Add Credential**
3. For GitHub:
   - Name: "My GitHub"
   - Type: GitHub
   - Username: your-github-username
   - Token: [Create token at https://github.com/settings/tokens]
   - Permissions needed: `repo` scope
4. Click **Test Credential** to verify
5. Save

### Step 4: Create a Project

1. Go to **Projects** page
2. Create a new project:
   - Name: "Test Project"
   - Description: "Testing Git Sync"
3. Click on your project to open it

### Step 5: Add a Repository Pair

1. Inside your project, click **Add Repository**
2. Fill in:
   - Name: "My First Sync"
   - TFS URL: `https://tfs.company.com/DefaultCollection/_git/MyRepo`
   - GitHub URL: `https://github.com/username/my-repo.git`
   - TFS Credential: Select your TFS credential
   - GitHub Credential: Select your GitHub credential
   - TFS Branch: `main` (or your branch name)
   - GitHub Branch: `main` (or your branch name)
   - Sync Direction: `bidirectional`
   - Conflict Policy: `auto-resolve` (for beginners)
3. Save

### Step 6: Test Manual Sync

1. Go to **Sync** page
2. Find your repository
3. Click **Sync Now**
4. Watch the sync happen in real-time!
5. View results (success/failure, files changed, commits)

### Step 7: Schedule Automatic Sync (Optional)

1. Go to **Scheduler** page
2. Click **Create Job**
3. Select your repository
4. Choose schedule:
   - Use presets like "Every hour" or "Daily at midnight"
   - Or custom cron: `0 9 * * *` (daily at 9 AM)
5. Enable and save

## 📝 Creating GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name: "Git Sync Manager"
4. Select scopes:
   - ✅ `repo` (all repo permissions)
5. Click **Generate token**
6. **Copy the token immediately** (you won't see it again!)

## 📝 Creating TFS Personal Access Token

1. Go to your TFS URL: `https://tfs.yourcompany.com`
2. Click your profile → Security
3. Click **Personal access tokens**
4. Click **Add**
5. Name: "Git Sync Manager"
6. Select: **Code (Read & Write)**
7. Click **Create**
8. **Copy the token immediately**

## 🎯 Sync Direction Options

- **TFS to GitHub**: One-way sync from TFS → GitHub only
- **GitHub to TFS**: One-way sync from GitHub → TFS only  
- **Bidirectional**: Two-way sync (recommended for active development)

## 🛡️ Conflict Resolution Policies

- **manual**: Stop and alert on conflicts (safest)
- **auto-resolve**: Auto-resolve with source preference
- **prefer-source**: Always take source changes (force push)
- **prefer-target**: Pull target changes first

## 💡 Tips

### For Testing
- Start with a small test repository
- Use "prefer-source" policy for simple one-way syncs
- Monitor the first few syncs manually

### For Production
1. Change the `ENCRYPTION_KEY` to a strong random string
2. Use "manual" conflict policy for important repos
3. Test sync direction thoroughly before scheduling
4. Monitor sync logs regularly
5. Keep credentials secure and rotated

### Common Issues

**"Authentication failed"**
- Verify your token hasn't expired
- Check token permissions (repo scope for GitHub)
- Test credential from Credentials page

**"Conflicts detected"**
- If using "manual" policy, conflicts require manual resolution
- Try "auto-resolve" or "prefer-source" for simpler cases
- Check sync logs for details

**"Repository not found"**
- Verify URL format is correct
- For TFS: `https://tfs.company.com/Collection/_git/RepoName`
- For GitHub: `https://github.com/username/repo.git`

## 📚 Next Steps

- Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for full documentation
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- View sync logs in **Sync** page for detailed history
- Set up scheduled jobs for automation

## 🎉 You're Ready!

Your Git Sync Manager is now configured and ready to synchronize repositories between TFS and GitHub automatically!
