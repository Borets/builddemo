# Build Performance Evaluation System

A system for evaluating build performance of applications across different cloud providers, with a focus on Render.com.

## What This Is

This is an application designed to evaluate build performance across different environments. It serves as a benchmark tool to compare build times, caching strategies, and resource utilization across various deployment platforms.

## What Gets Deployed

- **React/Node.js Application**: A full-stack application that simulates real-world complexity
- **Build Performance Instrumentation**: Tools to measure and record timing metrics
- **GitHub Actions Workflows**: CI/CD pipelines to test build performance in different scenarios

## Key Commands & Workflows

### Local Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Test build process locally
npm run test-build
```

### GitHub Workflows

The repository includes several GitHub Actions workflows:

1. **M1 Apple Silicon Build**: Tests build performance on Apple Silicon (M1/ARM64) architecture
2. **Build Performance Comparison**: Compares build times across different runner types (Ubuntu, macOS)
3. **Render-like Build**: Simulates the build process used by Render.com

### Analysis Commands

```bash
# Download build artifacts
node scripts/download-artifacts.js

# Compare build performance 
node scripts/compare-build-stats.js

# Run all analysis tasks
./scripts/run-all-workflows.sh
```

## Deployment

The application can be deployed to Render.com using the included `render.yaml` Blueprint configuration:

```bash
# Preview your deployment
render preview

# Deploy to Render
render deploy
```

## Main Technologies

- **Frontend**: React
- **Backend**: Node.js/Express
- **Build Tools**: npm, webpack
- **CI/CD**: GitHub Actions
- **Deployment**: Render.com

The build performance tools measure various aspects of the build process, including dependency installation time, compilation time, and overall build duration across different environments and architectures. 