#!/usr/bin/env node

/**
 * Script to measure build times across different providers
 * 
 * Usage:
 *   node measure-build.js --provider=render
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

// Default provider is render
const provider = args.provider || 'render';

// API endpoint for recording build data
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:5000/api/builds';

// Provider configurations
const providers = {
  render: {
    buildCommand: 'npm run build',
    // Add Render-specific configuration here
  },
  vercel: {
    buildCommand: 'npm run build',
    // Add Vercel-specific configuration here
  },
  netlify: {
    buildCommand: 'npm run build',
    // Add Netlify-specific configuration here
  },
  // Add more providers as needed
};

/**
 * Measure build time for a specific provider
 */
async function measureBuild(providerName) {
  console.log(`Measuring build time for ${providerName}...`);
  
  const providerConfig = providers[providerName];
  
  if (!providerConfig) {
    console.error(`Provider "${providerName}" not found in configuration`);
    process.exit(1);
  }
  
  const buildCommand = providerConfig.buildCommand;
  const startTime = new Date();
  let success = false;
  let logs = '';
  
  try {
    // Execute build command and capture output
    console.log(`Executing: ${buildCommand}`);
    logs = execSync(buildCommand, { encoding: 'utf8' });
    success = true;
  } catch (error) {
    logs = error.stdout || error.message;
    console.error(`Build failed: ${error.message}`);
  }
  
  const endTime = new Date();
  const buildTime = (endTime - startTime) / 1000; // in seconds
  
  console.log(`Build ${success ? 'succeeded' : 'failed'} in ${buildTime} seconds`);
  
  // Collect system information
  const metadata = {
    os: process.platform,
    nodeVersion: process.version,
    cpuCores: require('os').cpus().length,
    memory: Math.round(require('os').totalmem() / (1024 * 1024 * 1024)), // in GB
    // Add more system info as needed
  };
  
  // Record build data
  const buildData = {
    provider: providerName,
    buildTime,
    startTime,
    endTime,
    success,
    logs,
    metadata
  };
  
  // Save build data locally
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filename = `${providerName}-${startTime.toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(buildData, null, 2));
  
  // Send build data to API if available
  if (process.env.API_ENDPOINT) {
    try {
      await axios.post(API_ENDPOINT, buildData);
      console.log('Build data recorded to API');
    } catch (error) {
      console.error('Failed to record build data to API:', error.message);
    }
  }
  
  return buildData;
}

// Execute measurement
measureBuild(provider)
  .then(data => {
    console.log('Measurement complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Measurement failed:', error);
    process.exit(1);
  }); 