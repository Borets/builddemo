# Build Performance Evaluation System

A system for evaluating build performance of applications across different cloud providers, with a focus on Render.com.

## Overview

This project provides tools to:
1. Deploy a sample application across different cloud providers
2. Measure and record build times
3. Analyze and compare performance metrics
4. Easily deploy to Render using Blueprints

## Components

- **Sample Application**: A React/Node.js application with typical dependencies and build processes
- **Measurement Framework**: Scripts to measure build times and resource usage
- **Analytics Dashboard**: Web interface to visualize performance data
- **Render Blueprint**: Configuration for easy deployment on Render
- **Build Performance Tools**: Scripts to compare cached vs. uncached builds

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for local testing)
- Accounts on cloud providers you want to test (Render, etc.)

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure provider credentials in `.env` file (see `.env.example`)

### Running Tests

```
npm run test-build
```

### Deploying to Render

This project includes a Render Blueprint for easy deployment:

1. Fork this repository
2. In your Render dashboard, create a new Blueprint
3. Connect to your forked repository
4. Deploy the Blueprint

## Architecture

The system consists of:
1. A sample application that mimics real-world complexity
2. Build instrumentation that records timing data
3. A results database that stores performance metrics
4. An analytics dashboard for visualization

## Build Performance Analysis

This project includes tools for comparing build performance with and without caching:

### GitHub Workflows

1. **Main CI Workflow** (`ci.yml`):
   - Runs on every push and pull request
   - Uses GitHub's dependency caching
   - Records build times and saves them as artifacts

2. **No-Cache Workflow** (`ci-nocache.yml`):
   - Runs on schedule (weekly) or manual trigger
   - Builds without any dependency caching
   - Records build times for comparison

3. **Render-like Build Workflow** (`render-like-build.yml`):
   - Mimics the build process used by Render.com
   - Follows the same build command sequence as specified in render.yaml
   - Uses npm caching to simulate cached builds on Render
   - Measures total build time, dependency installation time, and build-only time
   - Useful for local comparison to Render deployment performance

4. **Render-like No-Cache Build Workflow** (`render-like-build-nocache.yml`):
   - Same as the Render-like workflow but with caching explicitly disabled
   - Runs on a weekly schedule to provide consistent benchmarks
   - Explicitly clears npm cache and sets npm_config_cache to 'none'
   - Useful for comparing to fresh deployments on Render

### Analysis Tools

Located in the `scripts/` directory:

1. **Download Artifacts**:
   ```bash
   cd scripts
   npm install
   node download-artifacts.js
   ```

2. **Compare Build Performance**:
   ```bash
   node compare-build-stats.js
   ```

3. **All-in-one Analysis**:
   ```bash
   ./analyze-build-performance.sh
   ```

These tools help you:
- Measure the effectiveness of your caching strategy
- Identify bottlenecks in your build process
- Track performance improvements over time

See the [scripts/README.md](scripts/README.md) for detailed documentation.

## License

MIT

## GitHub Actions Setup

### Database Setup with GitHub Actions

For GitHub Actions to work with your database, you need a managed PostgreSQL instance that's accessible from GitHub's runners.

#### Option 1: Use Render PostgreSQL

1. Create a PostgreSQL database on Render
2. Add your Render PostgreSQL connection string as a GitHub secret named `DATABASE_URL`
3. Format: `postgres://username:password@host:port/database_name?ssl=true`

#### Option 2: Use Supabase

1. Create a Supabase project
2. Get your PostgreSQL connection string from the Supabase dashboard
3. Add it as a GitHub secret named `DATABASE_URL`

#### Option 3: Use AWS RDS

1. Create an RDS PostgreSQL instance with public access
2. Configure security groups to allow access from GitHub Actions IP ranges
3. Add the connection string as a GitHub secret

### Setting Up GitHub Actions Secrets

To run the GitHub Actions workflows, you need to set up the following secrets in your repository:

1. `DATABASE_URL`: Your PostgreSQL connection string
2. `RENDER_API_KEY`: Your Render API key
3. `RENDER_ENABLED`: Set to "true" to enable Render provider
4. `VERCEL_API_KEY`, `NETLIFY_API_KEY`, etc.: API keys for each provider you want to use

## Running Locally

[Add your existing instructions here] 