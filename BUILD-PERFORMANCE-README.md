# Build Performance Optimization with Apple Silicon (M1)

This project includes GitHub Actions workflows designed to compare build performance across different architecture types. This document explains the benefits, setup, and how to interpret the performance results.

## Workflows Overview

### 1. M1 Build Workflow (`.github/workflows/m1-build.yml`)

This workflow runs builds on GitHub-hosted macOS runners with Apple Silicon (M1/ARM64) architecture. It includes:

- Detailed timing of each build phase
- System information reporting
- Performance metrics collection

### 2. Build Performance Comparison (`.github/workflows/build-performance-comparison.yml`)

This workflow runs three parallel builds on different runners:
- Standard x86 (Ubuntu-latest)
- Upgraded x86 (Ubuntu-latest-4-cores)
- Apple Silicon (M1) macOS runners (macos-latest-xlarge)

It then generates a comprehensive comparison of build performance metrics, including:
- Total build time
- Dependency installation time
- Actual build-only time (after dependencies are installed)
- Percentage improvements between architectures

## Benefits of a Multi-Architecture Build Comparison

### 1. Informed Infrastructure Decisions

By comparing build performance across different architecture types:
- Make data-driven decisions about which runner types to use
- Understand the cost vs. performance tradeoffs between standard, upgraded, and M1 runners
- Identify which parts of your build process benefit most from which architecture

### 2. Detailed Performance Metrics

The workflows produce detailed performance data:
- Granular timings for each phase of the build process
- Clear comparison between different architectural platforms
- Markdown performance summaries for easy reporting and sharing

### 3. Scheduled Benchmark Runs

The comparison workflow can be scheduled to run on a regular basis (e.g., weekly), providing:
- Ongoing performance tracking as your codebase evolves
- Early detection of build performance regressions
- Data to support infrastructure decisions over time

### 4. Cross-Architecture Testing

Building and testing on multiple architectures helps:
- Catch architecture-specific bugs early
- Ensure your application works correctly on different platforms
- Prepare for deployment to various cloud services and environments

## Architecture Types Compared

### 1. Standard Runner (Ubuntu-latest)

- The default GitHub Actions runner
- Provides standard x86-64 architecture
- Baseline for comparison

### 2. Upgraded x86 Runner (Ubuntu-latest-4-cores)

- Enhanced x86-64 architecture
- More CPU cores and memory
- Higher performance than standard runner but potentially higher cost

### 3. Apple Silicon (M1) Runner (macos-latest-xlarge)

- ARM64 architecture
- Generally offers:
  - Native ARM64 code execution
  - Higher performance per watt
  - More efficient memory architecture
  - Better thermal performance for sustained workloads

## Setup and Usage

### Prerequisites

- Access to GitHub Actions with all runner types
- A Node.js project with build scripts (client, server, or both)

### Running the Workflows

The workflows will run automatically on:
- Push to the main branch
- Pull requests to the main branch
- Manual trigger via GitHub Actions UI
- Scheduled runs (for the comparison workflow)

### Interpreting Results

After a build completes:
1. Check the workflow summary in GitHub Actions
2. Review the performance metrics in the workflow logs
3. Download the performance artifacts for detailed analysis
4. For comparison builds, examine the markdown summary showing side-by-side metrics for all three architecture types

### Optimizing Further

Based on the performance data, you can:
1. Select the most appropriate runner type for your specific workload
2. Identify bottlenecks in your build process
3. Make architecture-specific optimizations if needed
4. Tune your CI/CD pipeline for optimal performance/cost ratio

## Notes on GitHub-hosted Runners

- The `macos-latest-xlarge` runner type provides Apple Silicon (M1) hardware
- The `ubuntu-latest-4-cores` runner provides enhanced x86 performance
- Different runner types may have different cost structures and availability
- For maximum reliability, test all three architectures in your CI/CD pipeline

## Contributing

If you enhance these workflows or have suggestions for improving build performance:
1. Submit a pull request with your changes
2. Include before/after performance metrics
3. Document any architecture-specific considerations

---

*These workflows are provided as a starting point for optimizing your build process and may require adjustments for your specific project needs and GitHub Actions setup.* 