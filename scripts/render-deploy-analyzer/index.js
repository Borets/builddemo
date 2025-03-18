#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { Command } from 'commander';
import { table } from 'table';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Set up command line options
const program = new Command();
program
  .name('render-deploy-analyzer')
  .description('Analyzes the last 10 deploys for a service on Render.com')
  .version('1.0.0')
  .option('-s, --service-id <id>', 'Render service ID', process.env.DEFAULT_SERVICE_ID)
  .option('-n, --number <count>', 'Number of deployments to analyze', '10')
  .option('-o, --output <file>', 'Output JSON file path')
  .option('-d, --debug', 'Show debug information for troubleshooting')
  .option('-l, --logs', 'Fetch and analyze build logs to extract build-only time', false)
  .parse(process.argv);

const options = program.opts();

// Validate options
if (!options.serviceId) {
  console.error(chalk.red('Error: Service ID is required. Provide it via command line or .env file.'));
  process.exit(1);
}

if (!process.env.RENDER_API_KEY) {
  console.error(chalk.red('Error: RENDER_API_KEY is required in .env file.'));
  process.exit(1);
}

// Configure axios for Render API
const renderApi = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.RENDER_API_KEY}`
  }
});

/**
 * Safely parse a date string
 * @param {string|null} dateString - Date string to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
const safeParseDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.log(chalk.yellow(`Warning: Invalid date format: "${dateString}"`));
      return null;
    }
    return date;
  } catch (error) {
    console.log(chalk.yellow(`Warning: Error parsing date: "${dateString}"`));
    return null;
  }
};

/**
 * Fetch build logs for a deployment
 * @param {string} serviceId - Render service ID
 * @param {string} deployId - Deployment ID
 * @returns {Promise<string>} - Build logs as string
 */
const fetchBuildLogs = async (serviceId, deployId) => {
  try {
    if (options.debug) {
      console.log(chalk.gray(`Debug: Fetching build logs for deployment ${deployId}...`));
    }
    
    const response = await renderApi.get(`/services/${serviceId}/deploys/${deployId}/logs`);
    
    if (options.debug) {
      console.log(chalk.gray(`Debug: API Response Status: ${response.status}`));
      console.log(chalk.gray(`Debug: Response headers: ${JSON.stringify(response.headers || {})}`));
      console.log(chalk.gray(`Debug: Response data type: ${typeof response.data}`));
      if (typeof response.data === 'string') {
        console.log(chalk.gray(`Debug: Log data length: ${response.data.length} characters`));
      } else {
        console.log(chalk.gray(`Debug: Log data: ${JSON.stringify(response.data || {}).substring(0, 200)}...`));
      }
    }
    
    if (!response.data) {
      console.log(chalk.yellow(`Warning: No log data received for deployment ${deployId.substring(0, 8)}`));
      return null;
    }
    
    if (typeof response.data !== 'string') {
      // Try to handle case where the API returns an object with a 'logs' field
      if (response.data.logs && typeof response.data.logs === 'string') {
        return response.data.logs;
      }
      
      console.log(chalk.yellow(`Warning: Invalid logs response for deployment ${deployId.substring(0, 8)} (expected string, got ${typeof response.data})`));
      return null;
    }
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(chalk.yellow(`Warning: Logs not found for deployment ${deployId.substring(0, 8)} (404 error)`));
    } else if (error.response) {
      console.log(chalk.yellow(`Warning: Failed to fetch logs for deployment ${deployId.substring(0, 8)}: HTTP ${error.response.status}`));
      if (options.debug && error.response.data) {
        console.log(chalk.gray(`Debug: Error response: ${JSON.stringify(error.response.data)}`));
      }
    } else {
      console.log(chalk.yellow(`Warning: Failed to fetch logs for deployment ${deployId.substring(0, 8)}: ${error.message}`));
    }
    return null;
  }
};

/**
 * Extract build-only time from build logs
 * @param {string} logs - Build logs as string
 * @returns {number|null} - Build-only time in minutes or null if can't determine
 */
const extractBuildOnlyTime = (logs) => {
  if (!logs) return null;
  
  try {
    if (options.debug) {
      console.log(chalk.gray(`Debug: Analyzing log data (${logs.length} characters)`));
      console.log(chalk.gray(`Debug: First 100 characters: ${logs.substring(0, 100)}`));
    }
    
    // Find the start time (when build command begins)
    const buildStartRegex = /==> Running build command/;
    const buildStartMatch = logs.match(buildStartRegex);
    
    if (!buildStartMatch && options.debug) {
      console.log(chalk.gray(`Debug: Could not find "Running build command" marker in logs`));
    }
    
    // Find the end time (when build is successful)
    const buildEndRegex = /==> Build successful 🎉/;
    const buildEndMatch = logs.match(buildEndRegex);
    
    if (!buildEndMatch && options.debug) {
      console.log(chalk.gray(`Debug: Could not find "Build successful" marker in logs`));
    }
    
    if (!buildStartMatch || !buildEndMatch) {
      return null;
    }
    
    // Extract timestamps by finding the log timestamp format near our markers
    // Log format is typically: [YYYY-MM-DD HH:MM:SS] Some message
    const extractTimestamp = (position) => {
      // Look for timestamp within 200 characters before our marker
      const before = logs.substring(Math.max(0, position - 200), position);
      const timestampMatch = before.match(/\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
      
      if (!timestampMatch && options.debug) {
        console.log(chalk.gray(`Debug: Could not extract timestamp near position ${position}`));
        console.log(chalk.gray(`Debug: Text around position: ${before.substring(Math.max(0, before.length - 50))}`));
      }
      
      return timestampMatch ? timestampMatch[1] : null;
    };
    
    const startPosition = buildStartMatch.index;
    const endPosition = buildEndMatch.index;
    
    const startTimestamp = extractTimestamp(startPosition);
    const endTimestamp = extractTimestamp(endPosition);
    
    if (!startTimestamp || !endTimestamp) {
      return null;
    }
    
    if (options.debug) {
      console.log(chalk.gray(`Debug: Found start timestamp: ${startTimestamp}`));
      console.log(chalk.gray(`Debug: Found end timestamp: ${endTimestamp}`));
    }
    
    const startTime = new Date(startTimestamp);
    const endTime = new Date(endTimestamp);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      if (options.debug) {
        console.log(chalk.gray(`Debug: Invalid date parsing: start=${startTime}, end=${endTime}`));
      }
      return null;
    }
    
    // Calculate duration in minutes
    const buildTimeMs = endTime - startTime;
    const buildTimeMinutes = buildTimeMs / 1000 / 60;
    
    if (options.debug) {
      console.log(chalk.gray(`Debug: Calculated build-only time: ${buildTimeMinutes.toFixed(2)} minutes`));
    }
    
    return buildTimeMinutes;
  } catch (error) {
    console.log(chalk.yellow(`Warning: Error extracting build time from logs: ${error.message}`));
    if (options.debug) {
      console.log(chalk.gray(`Debug: Error stack: ${error.stack}`));
    }
    return null;
  }
};

/**
 * Format time in minutes to a human-readable minutes and seconds format
 * @param {number|string} minutes - Time in minutes (can be a number or string with number)
 * @returns {string} - Formatted time string (e.g. "5 min 30 sec")
 */
const formatTimeMinSec = (minutes) => {
  if (minutes === 'N/A' || minutes === null || minutes === undefined) {
    return 'N/A';
  }
  
  // Convert to number if it's a string
  const mins = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  
  if (isNaN(mins)) {
    return 'N/A';
  }
  
  // Calculate minutes and seconds
  const wholeMins = Math.floor(mins);
  const secs = Math.round((mins - wholeMins) * 60);
  
  // Handle case where seconds round up to 60
  if (secs === 60) {
    return `${wholeMins + 1} min 0 sec`;
  }
  
  return `${wholeMins} min ${secs} sec`;
};

/**
 * Calculate build time from deployment data
 * @param {Object} deploy - Deployment object from Render API
 * @returns {Object} - Object containing build time info
 */
const calculateBuildTime = (deploy) => {
  // Render deployment states: created → build_in_progress → update_in_progress → live
  // We're interested in the time from 'created' to 'live'
  
  const createdAt = safeParseDate(deploy.createdAt);
  const finishedAt = safeParseDate(deploy.finishedAt);
  
  // If we can't parse the created date, we can't calculate build time
  if (!createdAt) {
    return {
      buildTimeMinutes: 'N/A',
      buildTimeFormatted: 'N/A',
      isComplete: !!finishedAt,
      status: deploy.status,
      startTime: deploy.createdAt || 'Unknown',
      endTime: finishedAt ? finishedAt.toISOString() : 'In progress'
    };
  }
  
  // If deployment is not finished, use current time for in-progress duration
  const endTime = finishedAt || new Date();
  
  // Calculate total minutes
  const buildTimeMs = endTime - createdAt;
  const buildTimeMinutes = buildTimeMs / 1000 / 60;
  
  return {
    buildTimeMinutes: buildTimeMinutes.toFixed(2),
    buildTimeFormatted: formatTimeMinSec(buildTimeMinutes),
    isComplete: !!finishedAt,
    status: deploy.status,
    startTime: createdAt.toISOString(),
    endTime: finishedAt ? finishedAt.toISOString() : 'In progress'
  };
};

/**
 * Fetch deploys for a service
 * @param {string} serviceId - Render service ID
 * @param {number} limit - Number of deploys to fetch
 * @returns {Promise<Array>} - Array of deploy objects
 */
const fetchDeploys = async (serviceId, limit) => {
  try {
    console.log(chalk.blue(`Fetching the last ${limit} deployments for service ${serviceId}...`));
    
    const response = await renderApi.get(`/services/${serviceId}/deploys?limit=${limit}`);
    
    if (options.debug) {
      console.log(chalk.gray('Debug: API Response Headers:'));
      console.log(chalk.gray(JSON.stringify(response.headers, null, 2)));
      console.log(chalk.gray('Debug: First deployment sample:'));
      console.log(chalk.gray(JSON.stringify(response.data?.[0] || {}, null, 2)));
    }
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response from Render API');
    }
    
    // Extract the actual deploy objects from the response
    // The API returns an array of objects with 'deploy' and 'cursor' fields
    const deployments = response.data.map(item => item.deploy || item);
    
    if (options.debug) {
      console.log(chalk.gray('Debug: Processed first deployment:'));
      console.log(chalk.gray(JSON.stringify(deployments[0] || {}, null, 2)));
    }
    
    return deployments;
  } catch (error) {
    if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status} - ${error.response.data.message || JSON.stringify(error.response.data)}`));
      if (options.debug) {
        console.log(chalk.gray('Debug: Full error response:'));
        console.log(chalk.gray(JSON.stringify(error.response.data, null, 2)));
      }
    } else if (error.request) {
      console.error(chalk.red('No response received from Render API. Check your network connection.'));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
};

/**
 * Get service details
 * @param {string} serviceId - Render service ID
 * @returns {Promise<Object>} - Service details
 */
const getServiceDetails = async (serviceId) => {
  try {
    console.log(chalk.blue(`Fetching details for service ${serviceId}...`));
    
    const response = await renderApi.get(`/services/${serviceId}`);
    
    if (!response.data) {
      throw new Error('Invalid response from Render API');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status} - ${error.response.data.message || JSON.stringify(error.response.data)}`));
    } else if (error.request) {
      console.error(chalk.red('No response received from Render API. Check your network connection.'));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
};

/**
 * Format deploy data for display
 * @param {Array} deploys - Array of deploy objects with calculated build times
 * @param {Object} serviceDetails - Service details object
 * @returns {Array} - Formatted table data
 */
const formatTableData = (deploys, serviceDetails) => {
  const header = [
    ['ID', 'Commit', 'Status', 'Started At', 'Finished At', 'Total Time', 'Build-Only', 'Author']
  ];
  
  const rows = deploys.map(deploy => {
    // Skip if deploy is not valid
    if (!deploy || typeof deploy !== 'object') {
      if (options.debug) {
        console.log(chalk.yellow(`Warning: Invalid deploy object: ${JSON.stringify(deploy)}`));
      }
      return ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
    }
    
    const buildInfo = calculateBuildTime(deploy);
    
    // Format dates for display
    const startDateStr = buildInfo.startTime === 'Unknown' ? 'Unknown' : 
      (buildInfo.startTime === 'In progress' ? 'In progress' : 
        safeParseDate(buildInfo.startTime)?.toLocaleString() || 'Invalid date');
    
    const endDateStr = buildInfo.endTime === 'In progress' ? 'In progress' : 
      safeParseDate(buildInfo.endTime)?.toLocaleString() || 'Invalid date';
    
    // Safe access to properties with fallbacks
    const deployId = deploy.id || 'N/A';
    const commitMessage = deploy.commit?.message || 'N/A';
    const commitAuthor = deploy.commit?.author || (deploy.commit ? 'Unknown author' : 'N/A');
    
    // Get build-only time if available and format it
    const buildOnlyTimeFormatted = deploy.buildOnlyTime ? 
      formatTimeMinSec(deploy.buildOnlyTime) : 'N/A';
    
    return [
      typeof deployId === 'string' ? deployId.substring(0, 8) : deployId,
      typeof commitMessage === 'string' && commitMessage !== 'N/A' ? 
        commitMessage.substring(0, 30) + (commitMessage.length > 30 ? '...' : '') : 
        commitMessage,
      buildInfo.status || 'Unknown',
      startDateStr,
      endDateStr,
      buildInfo.buildTimeFormatted,
      buildOnlyTimeFormatted,
      commitAuthor
    ];
  });
  
  return [...header, ...rows];
};

/**
 * Generate deploy report
 * @param {Array} deploys - Array of deploy objects
 * @param {Object} serviceDetails - Service details object
 * @returns {Object} - Report object with statistics
 */
const generateReport = (deploys, serviceDetails) => {
  const deploysWithBuildTimes = deploys.map(deploy => {
    // Skip if deploy is not valid
    if (!deploy || typeof deploy !== 'object') {
      if (options.debug) {
        console.log(chalk.yellow(`Warning: Invalid deploy object skipped in report generation`));
      }
      return null;
    }
    
    const buildInfo = calculateBuildTime(deploy);
    return {
      ...deploy,
      buildTimeMinutes: buildInfo.buildTimeMinutes === 'N/A' ? 
        null : parseFloat(buildInfo.buildTimeMinutes),
      buildTimeFormatted: buildInfo.buildTimeFormatted || 'N/A',
      buildOnlyTimeFormatted: deploy.buildOnlyTime ? 
        formatTimeMinSec(deploy.buildOnlyTime) : 'N/A',
      isComplete: buildInfo.isComplete
    };
  }).filter(Boolean); // Remove any null entries
  
  // Calculate statistics for completed deployments with valid build times
  const completedDeploys = deploysWithBuildTimes.filter(d => d.isComplete && d.buildTimeMinutes !== null);
  const buildTimes = completedDeploys.map(d => d.buildTimeMinutes).filter(t => t !== null);
  
  // Calculate statistics for build-only times
  const buildOnlyTimes = completedDeploys
    .map(d => d.buildOnlyTime)
    .filter(t => t !== null && t !== undefined);
  
  const avgBuildTime = buildTimes.length ? 
    (buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length).toFixed(2) : 
    'N/A';
  
  const avgBuildOnlyTime = buildOnlyTimes.length ? 
    (buildOnlyTimes.reduce((a, b) => a + b, 0) / buildOnlyTimes.length).toFixed(2) : 
    'N/A';
  
  const maxBuildTime = buildTimes.length ? 
    Math.max(...buildTimes).toFixed(2) : 
    'N/A';
  
  const minBuildTime = buildTimes.length ? 
    Math.min(...buildTimes).toFixed(2) : 
    'N/A';
  
  return {
    serviceId: serviceDetails.id,
    serviceName: serviceDetails.name,
    serviceType: serviceDetails.type,
    serviceUrl: serviceDetails.url,
    totalDeploys: deploysWithBuildTimes.length,
    completedDeploys: completedDeploys.length,
    inProgressDeploys: deploysWithBuildTimes.filter(d => !d.isComplete).length,
    successfulDeploys: deploysWithBuildTimes.filter(d => d.status === 'live').length,
    failedDeploys: deploysWithBuildTimes.filter(d => d.status === 'failed').length,
    buildTimeStats: {
      average: avgBuildTime,
      averageBuildOnly: avgBuildOnlyTime,
      averageFormatted: formatTimeMinSec(avgBuildTime),
      averageBuildOnlyFormatted: formatTimeMinSec(avgBuildOnlyTime),
      max: maxBuildTime,
      maxFormatted: formatTimeMinSec(maxBuildTime),
      min: minBuildTime,
      minFormatted: formatTimeMinSec(minBuildTime),
      unit: 'minutes'
    },
    deploys: deploysWithBuildTimes.map(d => ({
      id: d.id || null,
      createdAt: d.createdAt || null,
      finishedAt: d.finishedAt || null,
      buildTimeMinutes: d.buildTimeMinutes,
      buildTimeFormatted: d.buildTimeFormatted,
      buildOnlyTime: d.buildOnlyTime || null,
      buildOnlyTimeFormatted: d.buildOnlyTimeFormatted,
      status: d.status || 'Unknown',
      commitId: d.commit?.id || null,
      commitMessage: d.commit?.message || null,
      commitAuthor: d.commit?.author || null
    }))
  };
};

/**
 * Save report to file
 * @param {Object} report - Report object
 * @param {string} filePath - Path to save file
 */
const saveReportToFile = (report, filePath) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`Report saved to ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving report: ${error.message}`));
  }
};

/**
 * Main function
 */
const main = async () => {
  try {
    const serviceId = options.serviceId;
    const limit = parseInt(options.number, 10);
    
    // Get service details
    const serviceDetails = await getServiceDetails(serviceId);
    console.log(chalk.green(`Service: ${serviceDetails.name} (${serviceDetails.type})`));
    
    // Fetch deploys
    const deploys = await fetchDeploys(serviceId, limit);
    
    if (!deploys || deploys.length === 0) {
      console.log(chalk.yellow('No deployments found for this service.'));
      return;
    }
    
    console.log(chalk.green(`Retrieved ${deploys.length} deployments`));
    
    // Fetch build logs and extract build-only time if requested
    if (options.logs) {
      console.log(chalk.blue('Fetching build logs to extract build-only times...'));
      
      for (let i = 0; i < deploys.length; i++) {
        const deploy = deploys[i];
        if (deploy.status === 'live' || deploy.status === 'failed') {
          console.log(chalk.blue(`  Fetching logs for deployment ${i+1}/${deploys.length} (${deploy.id.substring(0, 8)})...`));
          const logs = await fetchBuildLogs(serviceId, deploy.id);
          if (logs) {
            const buildOnlyTime = extractBuildOnlyTime(logs);
            deploys[i].buildOnlyTime = buildOnlyTime;
            deploys[i].logs = logs;
          }
        }
      }
    }
    
    // Generate report
    try {
      const report = generateReport(deploys, serviceDetails);
      
      // Display table
      const tableData = formatTableData(deploys, serviceDetails);
      console.log(table(tableData));
      
      // Display statistics
      console.log(chalk.yellow('Deployment Statistics:'));
      console.log(`Total Deployments: ${report.totalDeploys}`);
      console.log(`Completed Deployments: ${report.completedDeploys}`);
      console.log(`Successful Deployments: ${report.successfulDeploys}`);
      console.log(`Failed Deployments: ${report.failedDeploys}`);
      console.log(`Average Total Build Time: ${report.buildTimeStats.averageFormatted} (${report.buildTimeStats.average} minutes)`);
      if (report.buildTimeStats.averageBuildOnly !== 'N/A') {
        console.log(`Average Build-Only Time: ${report.buildTimeStats.averageBuildOnlyFormatted} (${report.buildTimeStats.averageBuildOnly} minutes)`);
        
        const overheadMins = parseFloat(report.buildTimeStats.average) - parseFloat(report.buildTimeStats.averageBuildOnly);
        console.log(`Average Deployment Overhead: ${formatTimeMinSec(overheadMins)} (${overheadMins.toFixed(2)} minutes)`);
      }
      console.log(`Max Build Time: ${report.buildTimeStats.maxFormatted} (${report.buildTimeStats.max} minutes)`);
      console.log(`Min Build Time: ${report.buildTimeStats.minFormatted} (${report.buildTimeStats.min} minutes)`);
      
      // Save report to file if specified
      if (options.output) {
        saveReportToFile(report, options.output);
      }
    } catch (reportError) {
      console.error(chalk.red(`Error generating report: ${reportError.message}`));
      if (options.debug) {
        console.error(chalk.gray('Debug: Error stack trace:'));
        console.error(chalk.gray(reportError.stack));
        console.error(chalk.gray('Debug: First deployment object:'));
        console.error(chalk.gray(JSON.stringify(deploys[0] || {}, null, 2)));
      }
    }
    
  } catch (error) {
    if (error.message === 'Invalid time value') {
      console.error(chalk.red('Error: The Render API returned date values that could not be parsed.'));
      console.error(chalk.yellow('This issue has been fixed in the updated script. Please try running it again.'));
    } else if (error.message === 'Cannot read properties of undefined') {
      console.error(chalk.red('Error: The Render API response structure is different than expected.'));
      console.error(chalk.yellow('Try running with the --debug flag to see the actual API response.'));
    } else if (error.response) {
      console.error(chalk.red(`API Error: ${error.response.status} - ${error.response.data?.error || JSON.stringify(error.response.data)}`));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.stack && options.debug) {
        console.error(chalk.gray(error.stack.split('\n').slice(1).join('\n')));
      }
    }
    process.exit(1);
  }
};

// Run the main function
main(); 