# Render Deploy Analyzer

A simple standalone script that analyzes deployment times for services on Render.com.

## Features

- Fetches the last N deployments for a specified Render service
- Calculates build time statistics (average, min, max)
- Displays a table with deployment details
- Can export results to a JSON file for further analysis
- Works independently from your main application

## Prerequisites

- Node.js (v16 or later)
- A Render.com API key

## Setup

1. Clone or download this script
2. Install dependencies:
   ```bash
   cd render-deploy-analyzer
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` to add your Render API key and default service ID (optional)

## Usage

Basic usage:
```bash
node index.js --service-id srv-your-service-id
```

### Command Line Options

- `-s, --service-id <id>`: The Render service ID to analyze (required if not in .env)
- `-n, --number <count>`: Number of deployments to analyze (default: 10)
- `-o, --output <file>`: Save the report to a JSON file
- `-d, --debug`: Show debug information to help troubleshoot API issues

### Examples

Analyze the last 10 deployments:
```bash
node index.js --service-id srv-abc123xyz
```

Analyze the last 20 deployments:
```bash
node index.js --service-id srv-abc123xyz --number 20
```

Export results to a file:
```bash
node index.js --service-id srv-abc123xyz --output deploy-report.json
```

Debug API issues:
```bash
node index.js --service-id srv-abc123xyz --debug
```

## Getting Your Render API Key

1. Go to your Render Dashboard
2. Navigate to Account Settings
3. Select API Keys
4. Create a new API key
5. Add this key to your `.env` file

## Getting Your Service ID

The service ID is visible in the URL when you view a service in the Render dashboard:
```
https://dashboard.render.com/web/srv-abc123xyz
                                  ^^^^^^^^^^^^
                                  This is your service ID
```

## Troubleshooting

### "Invalid time value" error

If you encounter an "Invalid time value" error, it means there was an issue parsing date values returned by the Render API. The script includes robust error handling to deal with this, but if you continue to encounter issues:

1. Try running with the `--debug` flag to see the actual API response:
   ```bash
   node index.js --service-id srv-your-service-id --debug
   ```

2. Check if your Render API key has the necessary permissions to access deployment data.

3. Verify that the service ID is correct and the service has deployments.

### API rate limiting

Render API has rate limits. If you receive a 429 error, wait a few minutes before trying again.

## Example Output

```
Fetching details for service srv-abc123xyz...
Service: my-awesome-app (web)
Fetching the last 10 deployments for service srv-abc123xyz...
Retrieved 10 deployments
┌─────────┬────────────────────────────────┬────────────────┬─────────────────────────┬─────────────────────────┬─────────────────┬──────────────┐
│ ID      │ Commit                         │ Status         │ Started At              │ Finished At             │ Build Time (min) │ Author       │
├─────────┼────────────────────────────────┼────────────────┼─────────────────────────┼─────────────────────────┼─────────────────┼──────────────┤
│ dep-xyz │ Fix TypeScript errors          │ live           │ 3/17/2025, 2:35:15 PM   │ 3/17/2025, 2:38:45 PM   │ 3.50            │ John Doe     │
├─────────┼────────────────────────────────┼────────────────┼─────────────────────────┼─────────────────────────┼─────────────────┼──────────────┤
│ dep-abc │ Update dependencies            │ live           │ 3/17/2025, 1:12:30 PM   │ 3/17/2025, 1:15:20 PM   │ 2.83            │ Jane Smith   │
└─────────┴────────────────────────────────┴────────────────┴─────────────────────────┴─────────────────────────┴─────────────────┴──────────────┘

Deployment Statistics:
Total Deployments: 10
Completed Deployments: 10
Successful Deployments: 8
Failed Deployments: 2
Average Build Time: 3.15 minutes
Max Build Time: 4.28 minutes
Min Build Time: 2.67 minutes
``` 