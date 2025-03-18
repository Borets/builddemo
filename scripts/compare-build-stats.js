#!/usr/bin/env node

/**
 * Build Performance Comparison Tool
 * 
 * This script compares the build performance between cached and uncached workflows.
 * It reads the timing artifacts from GitHub Actions workflows and generates a comparison report.
 */

const fs = require('fs');
const path = require('path');
const { table } = require('table');
const chalk = require('chalk');

// Default paths to timing stats files (relative to repository root)
const DEFAULT_CACHED_STATS = './timing-stats.txt';
const DEFAULT_UNCACHED_STATS = './timing-stats-nocache.txt';
const DEFAULT_CACHED_BUILD_STATS = './build-timing-stats.txt';
const DEFAULT_UNCACHED_BUILD_STATS = './build-timing-stats-nocache.txt';
const DEFAULT_RENDER_LIKE_STATS = './render-like-build-times.txt';
const DEFAULT_RENDER_LIKE_NOCACHE_STATS = './render-like-build-times-nocache.txt';
const DEFAULT_RENDER_LIKE_FULL_CACHE_STATS = './render-like-build-times-full-cache.txt';

/**
 * Parse timing stats file
 * @param {string} filePath - Path to the timing stats file
 * @returns {Object} - Object containing parsed stats
 */
function parseTimingStatsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stats = {};

  lines.forEach(line => {
    if (!line.trim()) return;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      // Extract numbers for time values
      if (value.includes('seconds')) {
        const number = parseInt(value.split(' ')[0], 10);
        stats[key] = isNaN(number) ? value : number;
      } else {
        stats[key] = value;
      }
    }
  });

  return stats;
}

/**
 * Calculate the percentage difference between two values
 * @param {number} cached - Value with cache
 * @param {number} uncached - Value without cache
 * @returns {string} - Formatted percentage difference
 */
function calculateDifference(cached, uncached) {
  if (typeof cached !== 'number' || typeof uncached !== 'number') {
    return 'N/A';
  }

  const diff = uncached - cached;
  const percentDiff = (diff / uncached) * 100;
  
  if (diff > 0) {
    return chalk.green(`${percentDiff.toFixed(2)}% faster with cache`);
  } else if (diff < 0) {
    return chalk.red(`${Math.abs(percentDiff).toFixed(2)}% slower with cache`);
  } else {
    return chalk.yellow('No difference');
  }
}

/**
 * Generate comparison table
 * @param {Object} cachedStats - Stats from cached workflow
 * @param {Object} uncachedStats - Stats from uncached workflow 
 * @returns {string} - Formatted table
 */
function generateComparisonTable(cachedStats, uncachedStats) {
  const headers = ['Metric', 'With Cache', 'Without Cache', 'Difference'];
  
  const rows = [
    headers,
    ['Total Duration', 
      `${cachedStats['Total duration']} seconds`, 
      `${uncachedStats['Total duration']} seconds`,
      calculateDifference(cachedStats['Total duration'], uncachedStats['Total duration'])
    ],
    ['Installation', 
      `${cachedStats['Installation']} seconds`, 
      `${uncachedStats['Installation']} seconds`,
      calculateDifference(cachedStats['Installation'], uncachedStats['Installation'])
    ],
    ['Build', 
      `${cachedStats['Build']} seconds`, 
      `${uncachedStats['Build']} seconds`,
      calculateDifference(cachedStats['Build'], uncachedStats['Build'])
    ]
  ];
  
  return table(rows);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue('=== Build Performance Comparison Tool ==='));
    
    // Test job stats
    console.log(chalk.yellow('\nTest Job Statistics:'));
    const cachedTestStats = parseTimingStatsFile(DEFAULT_CACHED_STATS);
    const uncachedTestStats = parseTimingStatsFile(DEFAULT_UNCACHED_STATS);
    
    if (cachedTestStats && uncachedTestStats) {
      console.log(generateComparisonTable(cachedTestStats, uncachedTestStats));
      
      // Cache hit information
      if (cachedTestStats['Cache hit root']) {
        console.log(chalk.blue('Cache Status in Cached Build:'));
        console.log(`  Root Dependencies: ${cachedTestStats['Cache hit root']}`);
        console.log(`  Client Dependencies: ${cachedTestStats['Cache hit client']}`);
        console.log(`  Server Dependencies: ${cachedTestStats['Cache hit server']}`);
      }
    } else {
      console.log(chalk.yellow('Could not generate test job comparison. Make sure both workflows have completed.'));
    }
    
    // Build job stats
    console.log(chalk.yellow('\nBuild Job Statistics:'));
    const cachedBuildStats = parseTimingStatsFile(DEFAULT_CACHED_BUILD_STATS);
    const uncachedBuildStats = parseTimingStatsFile(DEFAULT_UNCACHED_BUILD_STATS);
    
    if (cachedBuildStats && uncachedBuildStats) {
      console.log(generateComparisonTable(cachedBuildStats, uncachedBuildStats));
      
      // Cache hit information for build job
      if (cachedBuildStats['Cache hit root']) {
        console.log(chalk.blue('Cache Status in Cached Build:'));
        console.log(`  Root Dependencies: ${cachedBuildStats['Cache hit root']}`);
        console.log(`  Client Dependencies: ${cachedBuildStats['Cache hit client']}`);
        console.log(`  Server Dependencies: ${cachedBuildStats['Cache hit server']}`);
      }
    } else {
      console.log(chalk.yellow('Could not generate build job comparison. Make sure both workflows have completed.'));
    }
    
    // Render-like build stats
    console.log(chalk.yellow('\nRender-like Build Statistics:'));
    const renderLikeStats = parseTimingStatsFile(DEFAULT_RENDER_LIKE_STATS);
    const renderLikeNoCacheStats = parseTimingStatsFile(DEFAULT_RENDER_LIKE_NOCACHE_STATS);
    
    if (renderLikeStats && renderLikeNoCacheStats) {
      // Map fields to match our comparison table format
      const cachedRenderStats = {
        'Total duration': renderLikeStats['Total Build Time'] ? parseInt(renderLikeStats['Total Build Time']) : 0,
        'Installation': renderLikeStats['Dependency Installation'] ? parseInt(renderLikeStats['Dependency Installation']) : 0,
        'Build': renderLikeStats['Build Only'] ? parseInt(renderLikeStats['Build Only']) : 0
      };
      
      const uncachedRenderStats = {
        'Total duration': renderLikeNoCacheStats['Total Build Time'] ? parseInt(renderLikeNoCacheStats['Total Build Time']) : 0,
        'Installation': renderLikeNoCacheStats['Dependency Installation'] ? parseInt(renderLikeNoCacheStats['Dependency Installation']) : 0,
        'Build': renderLikeNoCacheStats['Build Only'] ? parseInt(renderLikeNoCacheStats['Build Only']) : 0
      };
      
      console.log(generateComparisonTable(cachedRenderStats, uncachedRenderStats));
      
      // Cache status info
      console.log(chalk.blue('Cache Status:'));
      console.log(`  Cached Build: ${renderLikeStats['Cache'] || 'Unknown'}`);
      console.log(`  Uncached Build: ${renderLikeNoCacheStats['Cache'] || 'None (uncached build)'}`);
    } else {
      console.log(chalk.yellow('Could not generate Render-like build comparison. Make sure both workflows have completed.'));
    }
    
    // Render-like build with full cache details
    console.log(chalk.yellow('\nRender-like Build with Full Cache Details:'));
    const renderLikeFullCacheStats = parseTimingStatsFile(DEFAULT_RENDER_LIKE_FULL_CACHE_STATS);
    
    if (renderLikeFullCacheStats) {
      // Display detailed cache stats
      console.log(chalk.blue('Detailed Caching Statistics:'));
      
      // Extract relevant times
      const totalBuildTime = renderLikeFullCacheStats['Total Build Time'] ? 
        parseInt(renderLikeFullCacheStats['Total Build Time']) : 0;
      const cacheResolutionTime = renderLikeFullCacheStats['Cache Resolution Time'] ? 
        parseInt(renderLikeFullCacheStats['Cache Resolution Time']) : 0;
      const installTime = renderLikeFullCacheStats['Dependency Installation Time'] ? 
        parseInt(renderLikeFullCacheStats['Dependency Installation Time']) : 0;
      const clientBuildTime = renderLikeFullCacheStats['Client Build Time'] ? 
        parseInt(renderLikeFullCacheStats['Client Build Time']) : 0;
      const serverBuildTime = renderLikeFullCacheStats['Server Build Time'] ? 
        parseInt(renderLikeFullCacheStats['Server Build Time']) : 0;
      const totalInstallTime = renderLikeFullCacheStats['Total Installation Time (Cache + Install)'] ? 
        parseInt(renderLikeFullCacheStats['Total Installation Time (Cache + Install)']) : 0;
      const totalBuildOnlyTime = renderLikeFullCacheStats['Total Build-Only Time'] ? 
        parseInt(renderLikeFullCacheStats['Total Build-Only Time']) : 0;
      
      // Create detailed table
      const detailedHeaders = ['Metric', 'Time (seconds)', 'Percentage of Total'];
      
      const detailedRows = [
        detailedHeaders,
        ['Total Build Time', `${totalBuildTime}`, '100%'],
        ['Cache Resolution Time', `${cacheResolutionTime}`, `${((cacheResolutionTime / totalBuildTime) * 100).toFixed(2)}%`],
        ['Dependency Installation Time', `${installTime}`, `${((installTime / totalBuildTime) * 100).toFixed(2)}%`],
        ['Client Build Time', `${clientBuildTime}`, `${((clientBuildTime / totalBuildTime) * 100).toFixed(2)}%`],
        ['Server Build Time', `${serverBuildTime}`, `${((serverBuildTime / totalBuildTime) * 100).toFixed(2)}%`],
        ['Total Installation Time', `${totalInstallTime}`, `${((totalInstallTime / totalBuildTime) * 100).toFixed(2)}%`],
        ['Total Build-Only Time', `${totalBuildOnlyTime}`, `${((totalBuildOnlyTime / totalBuildTime) * 100).toFixed(2)}%`]
      ];
      
      console.log(table(detailedRows));
      
      // Display cache hit information
      console.log(chalk.blue('Cache Hit Information:'));
      console.log(`  Root Dependencies: ${renderLikeFullCacheStats['Cache Hit - Root'] || 'Unknown'}`);
      console.log(`  Client Dependencies: ${renderLikeFullCacheStats['Cache Hit - Client'] || 'Unknown'}`);
      console.log(`  Server Dependencies: ${renderLikeFullCacheStats['Cache Hit - Server'] || 'Unknown'}`);
      
      // Calculate and display savings
      console.log(chalk.green('\nCache Efficiency Analysis:'));
      console.log(`  Installation time is ${((installTime / totalInstallTime) * 100).toFixed(2)}% of total installation time`);
      console.log(`  Cache resolution time is ${((cacheResolutionTime / totalInstallTime) * 100).toFixed(2)}% of total installation time`);
      
      if (installTime < totalInstallTime) {
        const savedTime = totalInstallTime - installTime;
        console.log(chalk.green(`  Caching saved approximately ${savedTime} seconds during installation`));
      } else {
        console.log(chalk.yellow(`  Caching did not save time during installation`));
      }
      
      // Display advanced caching metrics if available
      if (renderLikeFullCacheStats && 
          (renderLikeFullCacheStats['Cache Hit - Client Build'] || 
           renderLikeFullCacheStats['Cache Hit - Server Build'] || 
           renderLikeFullCacheStats['Cache Hit - Webpack'] || 
           renderLikeFullCacheStats['Cache Hit - Repo Assets'])) {
        
        console.log(chalk.yellow('\nAdvanced Caching Metrics:'));
        console.log(chalk.blue('Repository and Build Caching:'));
        
        // Display cache hit status for each type of cache
        const cacheTypes = [
          { name: 'Client Build Cache', key: 'Cache Hit - Client Build' },
          { name: 'Server Build Cache', key: 'Cache Hit - Server Build' },
          { name: 'Webpack Cache', key: 'Cache Hit - Webpack' },
          { name: 'Repository Assets', key: 'Cache Hit - Repo Assets' }
        ];
        
        let activeAdvancedCaches = 0;
        
        cacheTypes.forEach(cacheType => {
          const status = renderLikeFullCacheStats[cacheType.key] === 'Yes' ? 
            chalk.green('✓ Hit') : chalk.red('✗ Miss');
          console.log(`  ${cacheType.name}: ${status}`);
          
          if (renderLikeFullCacheStats[cacheType.key] === 'Yes') {
            activeAdvancedCaches++;
          }
        });
        
        // Show build time impact analysis
        console.log(chalk.blue('\nBuild Time Analysis:'));
        console.log(`  Client Build: ${clientBuildTime} seconds (${((clientBuildTime / totalBuildTime) * 100).toFixed(2)}% of total)`);
        console.log(`  Server Build: ${serverBuildTime} seconds (${((serverBuildTime / totalBuildTime) * 100).toFixed(2)}% of total)`);
        
        if (activeAdvancedCaches > 0) {
          console.log(chalk.green(`\n${activeAdvancedCaches} active advanced caches helping with build performance`));
          
          if (renderLikeFullCacheStats['Build Cache Effectiveness']) {
            console.log(chalk.green(`  ${renderLikeFullCacheStats['Build Cache Effectiveness']}`));
          }
        } else {
          console.log(chalk.yellow('\nNo advanced caches were used in this build. Consider enabling them for better performance.'));
        }
      }
    } else {
      console.log(chalk.yellow('Could not find Render-like build with full cache details. Make sure the workflow has completed.'));
    }
    
    // Summary
    console.log(chalk.green('\nSummary:'));
    if (cachedTestStats && uncachedTestStats) {
      const installDiff = cachedTestStats['Installation'] - uncachedTestStats['Installation'];
      const buildDiff = cachedTestStats['Build'] - uncachedTestStats['Build'];
      const totalDiff = cachedTestStats['Total duration'] - uncachedTestStats['Total duration'];
      
      if (totalDiff < 0) {
        console.log(chalk.red(`The cached workflow was ${Math.abs(totalDiff)} seconds SLOWER overall.`));
        console.log(chalk.yellow('This could happen if the cache is outdated or if there were other factors affecting performance.'));
      } else {
        console.log(chalk.green(`The cached workflow was ${totalDiff} seconds FASTER overall.`));
        console.log(`Installation: ${Math.abs(installDiff)} seconds ${installDiff >= 0 ? 'saved' : 'added'}`);
        console.log(`Build: ${Math.abs(buildDiff)} seconds ${buildDiff >= 0 ? 'saved' : 'added'}`);
      }
    }
    
    console.log(chalk.blue('\nRecommendations:'));
    console.log('1. If cache savings are minimal, consider optimizing your caching strategy');
    console.log('2. Look at the installation time differences to see the impact of dependency caching');
    console.log('3. Consider running this comparison regularly to track performance changes over time');
    console.log('4. Enable build and repository caching for even faster builds');
    console.log('5. Use incremental builds for TypeScript/Webpack when possible');
    
  } catch (error) {
    console.error(chalk.red('Error generating build comparison:'));
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(chalk.red('Unhandled error:'));
  console.error(error);
  process.exit(1);
}); 