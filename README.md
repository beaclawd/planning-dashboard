# Planning Dashboard

A multi-agent workflow planning dashboard built with Next.js 15, React 19, and Tailwind CSS.

## Features

- 📊 Project overview dashboard
- 📝 Task tracking with status filtering
- 🔄 Real-time sync via webhook
- ⏰ Polling fallback (every 5 min)
- 🔘 Manual refresh button
- 🔍 Search functionality
- 📱 Responsive design

## Architecture

### Sync Strategy

The dashboard uses a hybrid sync strategy to keep data up-to-date:

1. **Primary: Webhook Sync**
   - Local script scans planning folder and posts data to webhook
   - Updates in-memory cache instantly
   - Lowest latency for updates

2. **Fallback: Cron Polling**
   - Vercel Cron Job runs every 5 minutes
   - Checks if cache is stale and refreshes if needed
   - Ensures data freshness even if webhook fails

3. **Manual Refresh**
   - UI button to force a cache refresh
   - Useful for testing or immediate updates

### Data Flow

```
Local Planning Files → Sync Script → Webhook (/api/webhook/sync) → Cache → UI
                    ↓
                  Cron Job (every 5 min) → Check & Refresh → Cache
                    ↓
               Manual Refresh (/api/refresh) → Cache
```

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Planning data directory at `/home/bean/Development/planning`

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment example:
```bash
cp .env.example .env
```

3. Update `.env` with your local planning directory path

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Running Sync Script

To manually sync data from local files:
```bash
npm run sync
```

This scans the planning directory and posts the data to the webhook endpoint.

## Deployment to Vercel

### Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Git repository (GitHub, GitLab, or Bitbucket)

### Step 1: Prepare Repository

1. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to your git repository (GitHub, GitLab, or Bitbucket)

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./` (or your project root)
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables:
   - `CRON_SECRET` (generate a random string)
   - `PLANNING_DIR` (optional, for local sync testing)
6. Click "Deploy"

### Step 3: Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://your-project-name.vercel.app/api/webhook/sync
```

### Step 4: Set Up Local Sync

1. Update your local `.env` file:
```bash
VERCEL_WEBHOOK_URL=https://your-project-name.vercel.app/api/webhook/sync
```

2. Test the sync:
```bash
npm run sync
```

3. Set up a cron job to sync automatically (optional):
```bash
# Edit crontab
crontab -e

# Add this line to sync every 2 minutes
*/2 * * * * cd /home/bean/clawd-coding/planning-dashboard && npm run sync >> /tmp/planning-dashboard-sync.log 2>&1
```

## API Endpoints

### `/api/projects`
- **GET**: Fetch all projects
- Query params: none
- Returns: Array of projects

### `/api/tasks`
- **GET**: Fetch tasks with optional filtering
- Query params:
  - `project`: Filter by project slug
  - `status`: Filter by status (todo, in_progress, review, done, blocked)
  - `owner`: Filter by owner name (partial match)
- Returns: Array of tasks

### `/api/outputs`
- **GET**: Fetch outputs with optional filtering
- Query params:
  - `project`: Filter by project slug
  - `task`: Filter by task ID
- Returns: Array of outputs

### `/api/webhook/sync`
- **POST**: Receive sync data from local script
- Body: `{ projects, tasks, outputs, lastSync }`
- Returns: Sync confirmation with stats
- **GET**: Check webhook status and cache age
- Returns: Cache status information

### `/api/refresh`
- **POST**: Force cache refresh (manual trigger)
- Body: none
- Returns: Refresh confirmation

### `/api/cron/sync`
- **GET**: Cron job endpoint for polling fallback
- Headers: `Authorization: Bearer CRON_SECRET`
- Returns: Sync status

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `CRON_SECRET` | Secret for cron job authentication | No | None |
| `PLANNING_DIR` | Path to planning directory (local only) | No | `/home/bean/Development/planning` |
| `VERCEL_WEBHOOK_URL` | URL of deployed webhook (for local sync) | No | `http://localhost:3000/api/webhook/sync` |

## Monitoring

### Logs

Check Vercel logs for:
- Function execution errors
- Webhook requests
- Cron job runs

### Cache Status

Monitor cache freshness by calling:
```bash
curl https://your-app.vercel.app/api/webhook/sync
```

Returns:
```json
{
  "status": "active",
  "age": 45,
  "isValid": true,
  "timestamp": "2024-01-30T14:30:00.000Z"
}
```

## Troubleshooting

### Dashboard shows outdated data

1. Click the "Refresh" button in the UI
2. Check webhook logs in Vercel
3. Run manual sync: `npm run sync`

### Sync fails

1. Verify webhook URL is correct
2. Check network connectivity
3. Review sync script logs
4. Ensure webhook endpoint is accessible

### Cron job not running

1. Check Vercel Cron Jobs configuration
2. Verify `CRON_SECRET` is set correctly
3. Check function logs for errors

## License

MIT
