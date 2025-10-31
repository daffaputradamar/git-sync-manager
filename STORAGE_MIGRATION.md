# Storage System Migration to File-Based Storage

## Changes Made

The storage system has been migrated from browser localStorage to a **server-side JSON file** to support the scheduler and ensure data persistence.

## Key Changes

### 1. Storage Location
- **Before**: Browser localStorage (client-side)
- **After**: `data/storage.json` (server-side file)

### 2. Updated Files

#### `lib/storage.ts`
- Changed from localStorage to Node.js `fs` module
- Data is now stored in `data/storage.json`
- Automatic directory creation on first use
- **Server-side only** (no browser dependency)
- Used only in API routes and scheduler

#### `lib/storage-client.ts` (NEW)
- **Client-side API wrapper** for storage operations
- Uses `fetch()` to call API endpoints
- Mirrors all `storage.ts` functions but async
- Used in all client components (pages)
- Example: `loadData()` → `GET /api/data`

#### `lib/scheduler.ts`
- Now saves data after updating job run times
- Imports both `loadData` and `saveData`
- Scheduler state persists across restarts

#### `lib/init.ts` (NEW)
- Auto-initializes scheduler on server start
- Ensures scheduler runs when app starts
- Single initialization guard

#### Client Components Updated
All pages updated to use `storage-client.ts`:
- ✅ `app/page.tsx` - Dashboard
- ✅ `app/projects/page.tsx` - Projects
- ✅ `app/projects/[id]/page.tsx` - Repositories
- ✅ `app/credentials/page.tsx` - Credentials
- ✅ `app/sync/page.tsx` - Sync interface
- ✅ `app/scheduler/page.tsx` - Scheduled jobs
- ✅ `app/settings/page.tsx` - Settings

#### API Routes
New/updated endpoints:
- `app/api/data/route.ts` - GET (load all), DELETE (clear all)
- `app/api/export/route.ts` - GET (export with metadata)

#### `.gitignore`
- Excludes `data/*.json` files
- Keeps `data/.gitkeep` for directory tracking

### 3. Data Structure

The `data/storage.json` file contains:

```json
{
  "projects": [],
  "credentials": [],
  "syncLogs": [],
  "scheduledJobs": [],
  "conflicts": []
}
```

## Benefits

### ✅ Scheduler Support
- Scheduler can now run on the server without browser context
- Cron jobs execute even when no browser is open
- Data persists across server restarts

### ✅ True Persistence
- Data survives server restarts
- No dependency on browser storage limits
- Can be backed up easily

### ✅ Server-Side Operations
- All API routes can read/write data
- No client-side storage access needed
- Better for production environments

### ✅ Easy Backup & Migration
- Single JSON file to backup
- Easy to export/import data
- Can be version controlled (if desired)

## File Location

```
project-root/
├── data/
│   ├── .gitkeep          # Keeps directory in git
│   └── storage.json      # Auto-created on first use (ignored by git)
```

## How It Works

### Initialization
1. When the server starts, `lib/init.ts` is imported
2. Scheduler is automatically initialized
3. All enabled cron jobs are started
4. Data directory is created if it doesn't exist

### Data Access

#### Server-Side (API Routes)
```typescript
import { loadData, saveData } from "@/lib/storage"

// Load data
const data = loadData()

// Modify data
data.projects.push(newProject)

// Save data
saveData(data)
```

#### Client-Side (React Components)
```typescript
import { loadData, createProject } from "@/lib/storage-client"

// All operations are async
const data = await loadData()

// Create operations return promises
await createProject("My Project")

// Update state after async operations
const handleCreate = async () => {
  try {
    await createProject(name)
    const updatedData = await loadData()
    setData(updatedData)
  } catch (error) {
    alert("Failed to create project")
    console.error(error)
  }
}

// In useEffect
useEffect(() => {
  loadData().then(setData)
}, [])
```

### Architecture Pattern

```
Client Component (Browser)
  ↓ import storage-client.ts
  ↓ fetch() call
  ↓
API Route (Server)
  ↓ import storage.ts
  ↓ fs.readFile/writeFile
  ↓
data/storage.json
```

This separation ensures:
- ✅ Client components never import Node.js modules
- ✅ Server-side code has direct file access
- ✅ Clean API boundary
- ✅ Easy to migrate to database later

### Scheduler Auto-Start
The scheduler automatically starts when:
- The server starts up
- Any scheduler API route is called
- Only initializes once (protected by flag)

## Migration Notes

### From localStorage (old) to File (new)

If you have existing data in localStorage, you'll need to:

1. Export data from browser console:
```javascript
const data = localStorage.getItem('git-sync-manager-data')
console.log(data)
```

2. Copy the JSON output

3. Create `data/storage.json` and paste the data

### Data Format

The JSON structure remains the same, so migration is straightforward. No schema changes were made.

## Production Considerations

### Backup Strategy
```bash
# Backup data file
cp data/storage.json data/storage.backup.json

# Automated backup (cron)
0 0 * * * cp /path/to/app/data/storage.json /path/to/backups/storage-$(date +\%Y\%m\%d).json
```

### Scaling Considerations

For high-load production:
- Consider database migration (PostgreSQL, MongoDB)
- Implement file locking for concurrent writes
- Use a proper job queue (Bull, BullMQ)

Current file-based storage is suitable for:
- ✅ Single server instances
- ✅ Low to medium traffic
- ✅ Personal/team use
- ✅ Development/testing

## Security

### File Permissions
Ensure proper file permissions:
```bash
chmod 600 data/storage.json  # Owner read/write only
```

### Encryption
Credentials are still encrypted with AES-256 before being saved to the file.

### Backup Encryption
For backups, consider encrypting the entire JSON file:
```bash
gpg --symmetric --cipher-algo AES256 data/storage.json
```

## Troubleshooting

### Storage file not created
- Ensure write permissions on the data directory
- Check server logs for errors
- Verify the app has started successfully

### Scheduler not running
- Check that `lib/init.ts` is being imported
- Verify cron expressions are valid
- Check server console for initialization logs

### Data not persisting
- Ensure `saveData()` is called after modifications
- Check file permissions
- Verify disk space is available

### Cannot read/write file
- Check directory permissions: `ls -la data/`
- Ensure the server process has write access
- Check for disk space: `df -h`

## Testing

### Verify Storage Works
1. Start the server: `pnpm dev`
2. Create a credential via API or UI
3. Check `data/storage.json` exists and contains data
4. Restart server
5. Verify data persists

### Verify Scheduler Works
1. Create a scheduled job
2. Restart server
3. Check logs for "Scheduler started with X active jobs"
4. Verify job executes at scheduled time

## Summary

The storage system is now fully server-side and supports:
- ✅ Persistent data across restarts
- ✅ Scheduler execution without browser
- ✅ Cron jobs running automatically
- ✅ Easy backup and migration
- ✅ Production-ready for single-server deployments

The migration is complete and backward compatible with the existing API structure!
