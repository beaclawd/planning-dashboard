# Planning Dashboard

A multi-agent workflow planning dashboard built with Next.js 15, React 19, and Tailwind CSS.

**Current Project Location:** `/home/bean/Development/planning/planning-dashboard`

**Note:** This project was previously located at `/home/bean/clawd-coding/planning-dashboard`.

## Features

- 📊 Project overview dashboard
- 📝 Task tracking with status filtering
- 🔄 Real-time sync to MongoDB
- 🔘 Manual refresh button
- 🔍 Search functionality
- 📱 Responsive design
- 💾 MongoDB as single source of truth (projects, tasks, outputs)

## Architecture

### MongoDB-Centric Data Flow

The dashboard uses MongoDB as the single source of truth for all planning data:

```
Local Planning Files → Sync Script → MongoDB → API Routes → UI
```

**Data Flow Steps:**

1. **Local Planning Files** (Markdown)
   - Projects: `/home/bean/Development/planning/project-*/00-OVERVIEW.md`
   - Tasks: `/home/bean/Development/planning/project-*/tasks/T-*.md`
   - Outputs: `/home/bean/Development/planning/project-*/outputs/T-*/`

2. **Sync Script** (`src/scripts/sync-to-vercel.ts`)
   - Runs manually or via cron job
   - Parses all markdown files
   - Writes to MongoDB collections

3. **MongoDB** (Atlas or local)
   - `projects` collection: All project data
   - `tasks` collection: All task data
   - `outputs` collection: All output data
   - Indexes on common query fields
   - Persistent, scalable storage

4. **API Routes** (`src/app/api/`)
   - `/api/projects` → Queries MongoDB projects collection
   - `/api/tasks` → Queries MongoDB tasks collection
   - `/api/outputs` → Queries MongoDB outputs collection
   - No caching layer needed (MongoDB is cache)

5. **UI** (Next.js frontend)
   - Fetches data from API routes
   - Displays projects, tasks, outputs
   - Manual refresh button to trigger sync

### Why MongoDB?

The switch from local files + cache to MongoDB provides:

- **Single source of truth**: All data in one place
- **Scalability**: No file system limitations
- **Deployment-ready**: Works on Vercel without local file access
- **Fast queries**: Indexed collections for efficient lookups
- **Consistency**: Atomic updates across documents
- **Simplified architecture**: No cache invalidation needed

### Sync Strategy

**Primary: Manual/Cron Sync Script**
- Parse markdown files from `/home/bean/Development/planning/`
- Write parsed data to MongoDB
- Can run manually: `npm run sync`
- Can run via cron for automatic updates

**Manual Refresh**
- UI button triggers sync script
- Useful for testing or immediate updates

## MongoDB Schema

### Projects Collection

```typescript
{
  slug: string;           // Unique identifier (e.g., "clawd")
  title: string;          // Display title
  objective: string;      // Project objective
  successMetrics: string[]; // Success criteria
  status: string;         // active, completed, on-hold
  priority: string;       // P1, P2, P3
  stakeholder?: string;   // Stakeholder name
  planner?: string;       // Planner name
  targetDate?: string;    // Target completion date
  lastUpdated: string;    // ISO timestamp
  path: string;          // Original file path
}
```

**Indexes:**
- `slug` (unique)
- `status`
- `priority`
- `lastUpdated` (descending)

### Tasks Collection

```typescript
{
  id: string;             // Unique ID (e.g., "001")
  project: string;        // Project slug
  title: string;          // Task title
  owner: string;          // Task owner
  status: string;         // todo, in_progress, review, done, blocked
  priority: string;       // P1, P2, P3
  dependsOn?: string;     // Task ID this depends on
  created: string;        // ISO timestamp
  updated: string;        // ISO timestamp
  goal?: string;          // Task goal
  acceptanceCriteria: string[]; // Definition of done
  outputs?: TaskOutput[]; // Related outputs
  path: string;           // Original file path
}
```

**Indexes:**
- `id` (unique)
- `project`
- `status`
- `owner`
- `updated` (descending)

### Outputs Collection

```typescript
{
  id: string;             // Unique identifier
  project: string;        // Project slug
  task?: string;          // Task ID (optional)
  title: string;          // Output title
  outputType?: string;    // Type of output
  content?: string;       // Output content
  path: string;           // Original file path
  lastModified: string;   // ISO timestamp
}
```

**Indexes:**
- `id` (unique)
- `project`
- `task`
- `lastModified` (descending)

## Project Store (MongoDB)

The project store (`src/lib/project-store.ts`) provides a clean API for MongoDB operations.

### Core Functions

#### Connection Management
- `connect()` - Initialize MongoDB connection (singleton)
- `disconnect()` - Close MongoDB connection
- `healthCheck()` - Check connection health

#### Projects
- `storeProject(project)` - Store/update a single project
- `getProject(slug)` - Get a specific project
- `getProjects(filter?)` - Get all projects with optional filtering
- `deleteProject(slug)` - Delete a project
- `storeProjects(projects)` - Batch store multiple projects

#### Tasks
- `storeTask(task)` - Store/update a single task
- `getTask(id)` - Get a specific task
- `getTasks(filter?)` - Get all tasks with optional filtering
- `deleteTask(id)` - Delete a task
- `storeTasks(tasks)` - Batch store multiple tasks

#### Outputs
- `storeOutput(output)` - Store/update a single output
- `getOutput(id)` - Get a specific output
- `getOutputs(filter?)` - Get all outputs with optional filtering
- `deleteOutput(id)` - Delete an output
- `storeOutputs(outputs)` - Batch store multiple outputs

#### Sync All
- `syncAll({ projects, tasks, outputs })` - Sync all data to MongoDB

#### Statistics
- `getProjectStats()` - Get project statistics by status/priority
- `getAllStats()` - Get total counts for all collections

### Usage Example

```typescript
import {
  connect,
  getProjects,
  getTasks,
  getOutputs,
  syncAll,
  disconnect
} from '@/lib/project-store';

// Connect to MongoDB
await connect();

// Fetch all active projects
const projects = await getProjects({ status: 'active' });

// Fetch tasks for a specific project
const tasks = await getTasks({ project: 'clawd', status: 'in_progress' });

// Fetch outputs for a task
const outputs = await getOutputs({ project: 'clawd', task: '001' });

// Sync all data
await syncAll({ projects, tasks, outputs });

// Disconnect
await disconnect();
```

### MongoDB Connection Pattern

The project store follows best practices:

1. **Singleton client**: Single MongoDB client reused across requests
2. **Lazy connection**: Connection established on first use
3. **Graceful errors**: Proper error handling and logging
4. **Automatic indexes**: Indexes created on connection for common queries
5. **Environment-based config**: Connection string from `MONGO_URL` env var
6. **Bulk operations**: Efficient batch writes with `bulkWrite()`

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Planning data directory at `/home/bean/Development/planning`
- MongoDB (Atlas or local)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment example:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - `MONGO_URL`: MongoDB connection string (required)
   - `PLANNING_DIR`: Path to planning directory (optional, defaults to `/home/bean/Development/planning`)

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

#### MongoDB Setup

**Option 1: MongoDB Atlas (Recommended)**

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier)
3. Create a database user
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=planning
   ```
5. Add to `.env`:
   ```
   MONGO_URL="mongodb+srv://your-username:your-password@cluster.mongodb.net/?appName=planning"
   ```

**Option 2: Local MongoDB**

1. Install MongoDB locally:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb

   # macOS
   brew install mongodb-community

   # Start MongoDB
   sudo systemctl start mongodb  # Linux
   brew services start mongodb-community  # macOS
   ```
2. Add to `.env`:
   ```
   MONGO_URL="mongodb://localhost:27017"
   ```

**Test Connection:**

Run the sync script to test MongoDB connectivity:
```bash
npm run sync
```

You should see:
```
🔍 Starting sync to MongoDB... [Local (MongoDB)]
🏥 Checking MongoDB connection...
✅ MongoDB connected: MongoDB connection healthy
📂 Parsing markdown files...
✅ Found X projects, Y tasks, Z outputs
📤 Syncing data to MongoDB...
✅ All data synced to MongoDB
...
```

### Running Sync Script

To manually sync data from local files to MongoDB:
```bash
npm run sync
```

This:
1. Scans the planning directory
2. Parses all projects, tasks, outputs
3. Writes all data to MongoDB
4. Displays statistics

### Setting Up Automatic Sync

To run the sync automatically (e.g., every 2 minutes):

```bash
# Edit crontab
crontab -e

# Add this line to sync every 2 minutes
*/2 * * * * cd /home/bean/Development/planning/planning-dashboard && npm run sync >> /tmp/planning-dashboard-sync.log 2>&1
```

## Deployment to Vercel

### Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- MongoDB Atlas database (free tier is fine)

### Step 1: Prepare Repository

1. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Switch to MongoDB architecture"
```

2. Push to your git repository

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variable:
   - `MONGO_URL` - Your MongoDB Atlas connection string
6. Click "Deploy"

### Step 3: Configure MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allows all IPs) OR
3. Add specific Vercel IPs (see [Vercel IP Ranges](https://vercel.com/docs/articles/security))

### Step 4: Test Deployment

Visit your deployed URL:
```
https://your-project-name.vercel.app
```

The dashboard should load data from MongoDB automatically.

### Step 5: Set Up Sync for Production

**Option A: Run sync locally with cron**

Add to your local crontab:
```bash
*/5 * * * * cd /home/bean/Development/planning/planning-dashboard && npm run sync >> /tmp/planning-dashboard-sync.log 2>&1
```

**Option B: Deploy sync as a Vercel Cron Job (advanced)**

1. Create `/api/cron/sync` endpoint that:
   - Validates `CRON_SECRET` header
   - Runs sync logic (requires file system access)
   - Returns sync status

2. Configure Vercel Cron Job in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "*/5 * * * *"
  }]
}
```

3. Add `CRON_SECRET` to Vercel environment variables

**Note:** Option A is simpler and recommended since sync needs local file access.

## API Endpoints

### `/api/projects`
- **GET**: Fetch all projects
- Query params:
  - `status`: Filter by status
  - `priority`: Filter by priority
  - `stakeholder`: Filter by stakeholder
  - `planner`: Filter by planner
- Returns: Array of projects

### `/api/tasks`
- **GET**: Fetch tasks with optional filtering
- Query params:
  - `project`: Filter by project slug
  - `status`: Filter by status (todo, in_progress, review, done, blocked)
  - `owner`: Filter by owner name
  - `priority`: Filter by priority
- Returns: Array of tasks

### `/api/outputs`
- **GET**: Fetch outputs with optional filtering
- Query params:
  - `project`: Filter by project slug
  - `task`: Filter by task ID
- Returns: Array of outputs

### `/api/sync` (Webhook - Deprecated)
- **Note**: This endpoint is deprecated. MongoDB is now the single source of truth.
- The sync script writes directly to MongoDB instead of using webhooks.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URL` | MongoDB connection string (Atlas or local) | Yes | None |
| `PLANNING_DIR` | Path to planning directory (local sync only) | No | `/home/bean/Development/planning` |
| `NODE_ENV` | Environment (development/production) | No | `development` |

## Monitoring

### MongoDB Dashboard

Monitor your MongoDB instance via:
- Atlas Dashboard (if using Atlas)
- Connection metrics
- Query performance
- Storage usage

### Sync Logs

Check sync logs:
```bash
tail -f /tmp/planning-dashboard-sync.log
```

### Health Check

Test MongoDB connection:
```typescript
import { healthCheck } from '@/lib/project-store';

const health = await healthCheck();
console.log(health);
// { connected: true, message: 'MongoDB connection healthy' }
```

## Troubleshooting

### Dashboard shows no data

1. Run sync script: `npm run sync`
2. Check MongoDB connection: Verify `MONGO_URL` is correct
3. Check sync logs for errors
4. Verify MongoDB Atlas network access allows Vercel IPs

### Sync fails

1. Verify `MONGO_URL` is correct and accessible
2. Check MongoDB Atlas network access settings
3. Review sync script logs
4. Test MongoDB connection locally: `npm run test:mongodb`

### "MongoDB connection failed" error

1. Check `MONGO_URL` environment variable is set
2. Verify MongoDB is running (local) or accessible (Atlas)
3. Check network/firewall settings
4. Review MongoDB Atlas IP whitelist

### Data not updating after sync

1. Verify sync completed successfully
2. Check MongoDB collections have data
3. Refresh browser to clear cached API responses
4. Check API route logs for errors

## License

MIT
