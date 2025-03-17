#!/usr/bin/env node

/**
 * Script to compare build times across different providers
 * 
 * Usage:
 *   node compare-providers.js --providers=render,vercel,netlify
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Table = require('cli-table3');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

// Default providers to compare
const providersToCompare = args.providers ? args.providers.split(',') : ['render', 'vercel', 'netlify'];

// Number of builds to run per provider
const numBuilds = args.builds ? parseInt(args.builds, 10) : 3;

/**
 * Run multiple builds for a provider and calculate average
 */
async function runBuildsForProvider(provider, count) {
  console.log(`Running ${count} builds for ${provider}...`);
  
  const results = [];
  
  for (let i = 0; i < count; i++) {
    console.log(`\nBuild ${i + 1}/${count} for ${provider}`);
    
    try {
      // Run the measure-build.js script for this provider
      execSync(`node ${path.join(__dirname, 'measure-build.js')} --provider=${provider}`, {
        stdio: 'inherit'
      });
      
      // Read the most recent build data file for this provider
      const dataDir = path.join(__dirname, '../data');
      const files = fs.readdirSync(dataDir)
        .filter(file => file.startsWith(`${provider}-`) && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        const buildData = JSON.parse(fs.readFileSync(path.join(dataDir, files[0]), 'utf8'));
        results.push(buildData);
      }
    } catch (error) {
      console.error(`Error running build for ${provider}:`, error.message);
    }
  }
  
  // Calculate average build time
  const successfulBuilds = results.filter(build => build.success);
  const avgBuildTime = successfulBuilds.length > 0
    ? successfulBuilds.reduce((sum, build) => sum + build.buildTime, 0) / successfulBuilds.length
    : 0;
  
  return {
    provider,
    builds: results,
    avgBuildTime,
    successRate: (successfulBuilds.length / results.length) * 100
  };
}

/**
 * Compare build times across providers
 */
async function compareProviders(providers, buildsPerProvider) {
  console.log(`Comparing build times across providers: ${providers.join(', ')}`);
  console.log(`Running ${buildsPerProvider} builds per provider\n`);
  
  const results = [];
  
  for (const provider of providers) {
    const result = await runBuildsForProvider(provider, buildsPerProvider);
    results.push(result);
  }
  
  // Sort results by average build time (fastest first)
  results.sort((a, b) => a.avgBuildTime - b.avgBuildTime);
  
  // Display results in a table
  const table = new Table({
    head: ['Provider', 'Avg Build Time (s)', 'Success Rate (%)', 'Builds'],
    colWidths: [15, 20, 20, 10]
  });
  
  results.forEach(result => {
    table.push([
      result.provider,
      result.avgBuildTime.toFixed(2),
      result.successRate.toFixed(2),
      result.builds.length
    ]);
  });
  
  console.log('\nResults:');
  console.log(table.toString());
  
  // Calculate performance comparison
  if (results.length > 1) {
    const fastest = results[0];
    
    console.log('\nPerformance Comparison:');
    
    results.slice(1).forEach(result => {
      const difference = result.avgBuildTime - fastest.avgBuildTime;
      const percentSlower = (difference / fastest.avgBuildTime) * 100;
      
      console.log(`${result.provider} is ${percentSlower.toFixed(2)}% slower than ${fastest.provider}`);
    });
  }
  
  // Save comparison results
  const comparisonData = {
    date: new Date(),
    providers: results
  };
  
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filename = `comparison-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(comparisonData, null, 2));
  
  console.log(`\nComparison data saved to ${filename}`);
}

// Execute comparison
compareProviders(providersToCompare, numBuilds)
  .then(() => {
    console.log('Comparison complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Comparison failed:', error);
    process.exit(1);
  }); 