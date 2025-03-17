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

## License

MIT 