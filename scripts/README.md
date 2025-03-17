# Build Performance Analysis Tools

This directory contains tools for analyzing and comparing build performance between cached and uncached GitHub Actions workflows.

## Overview

The included tools help you:

1. **Download build artifacts** from GitHub Actions workflows
2. **Compare build times** between cached and uncached workflows
3. **Analyze the effectiveness** of your dependency caching strategy

## Prerequisites

- Node.js 14 or later
- npm or yarn
- GitHub Personal Access Token with `repo` scope (for downloading artifacts)

## Setup

1. Install dependencies:

```bash
cd scripts
npm install
```

2. Create a `.env` file with the following variables:

```
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPOSITORY=owner/repo
```

## Usage

### Running the Workflows

1. The main workflow (`ci.yml`) runs on push/pull request events.
2. The no-cache workflow (`ci-nocache.yml`) runs on a schedule or manual trigger.

To manually trigger the no-cache workflow:
- Go to your GitHub repository
- Click on "Actions"
- Select "CI (No Cache)" from the workflows list
- Click "Run workflow"

### Downloading Artifacts

After workflows have completed, download the timing artifacts:

```bash
node download-artifacts.js
```

Options:
- `--repo` or `-r`: GitHub repository (owner/repo)
- `--token` or `-t`: GitHub personal access token
- `--workflow` or `-w`: Workflow ID or filename (default: "ci.yml,ci-nocache.yml")
- `--output` or `-o`: Output directory (default: ".")
- `--latest` or `-l`: Only download artifacts from the latest run of each workflow

Example:
```bash
node download-artifacts.js --latest
```

### Comparing Build Performance

Once you have the artifacts downloaded, compare the performance:

```bash
node compare-build-stats.js
```

The script will:
1. Parse the timing statistics from both workflows
2. Generate comparison tables for test and build jobs
3. Calculate percentage differences in build times
4. Provide a summary of the cache effectiveness
5. Offer recommendations for optimization

## Understanding the Results

The comparison shows:

- **Installation time**: How much time is saved by caching dependencies
- **Build time**: Whether caching affects build performance
- **Total duration**: Overall time savings from caching
- **Cache hit information**: Which caches were used during the build

## Tips for Optimizing Caching

1. **Targeted caching**: Cache specific dependencies that take the longest to install
2. **Cache key strategy**: Use dependency lock files in cache keys to ensure cache invalidation when dependencies change
3. **Selective restore**: Use `restore-keys` to fallback to previous caches when exact matches aren't found
4. **Measure regularly**: Run the no-cache workflow periodically to benchmark your cache effectiveness

## Troubleshooting

If you encounter issues downloading artifacts:

1. Ensure your GitHub token has sufficient permissions
2. Check that your workflows have completed successfully
3. Verify artifacts exist by checking the workflow run details on GitHub
4. Increase verbosity with debugging options if available

## License

MIT 