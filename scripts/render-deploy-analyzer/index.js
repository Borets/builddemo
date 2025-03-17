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
    ['ID', 'Commit', 'Status', 'Started At', 'Finished At', 'Build Time (min)', 'Author']
  ];
  
  const rows = deploys.map(deploy => {
    // Skip if deploy is not valid
    if (!deploy || typeof deploy !== 'object') {
      if (options.debug) {
        console.log(chalk.yellow(`Warning: Invalid deploy object: ${JSON.stringify(deploy)}`));
      }
      return ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
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
    
    return [
      typeof deployId === 'string' ? deployId.substring(0, 8) : deployId,
      typeof commitMessage === 'string' && commitMessage !== 'N/A' ? 
        commitMessage.substring(0, 30) + (commitMessage.length > 30 ? '...' : '') : 
        commitMessage,
      buildInfo.status || 'Unknown',
      startDateStr,
      endDateStr,
      buildInfo.buildTimeMinutes,
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
      buildTimeFormatted: buildInfo.buildTimeMinutes === 'N/A' ? 
        'N/A' : buildInfo.buildTimeMinutes + ' min',
      isComplete: buildInfo.isComplete
    };
  }).filter(Boolean); // Remove any null entries
  
  // Calculate statistics for completed deployments with valid build times
  const completedDeploys = deploysWithBuildTimes.filter(d => d.isComplete && d.buildTimeMinutes !== null);
  const buildTimes = completedDeploys.map(d => d.buildTimeMinutes).filter(t => t !== null);
  
  const avgBuildTime = buildTimes.length ? 
    (buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length).toFixed(2) : 
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
      max: maxBuildTime,
      min: minBuildTime,
      unit: 'minutes'
    },
    deploys: deploysWithBuildTimes.map(d => ({
      id: d.id || null,
      createdAt: d.createdAt || null,
      finishedAt: d.finishedAt || null,
      buildTimeMinutes: d.buildTimeMinutes,
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
      console.log(`Average Build Time: ${report.buildTimeStats.average} minutes`);
      console.log(`Max Build Time: ${report.buildTimeStats.max} minutes`);
      console.log(`Min Build Time: ${report.buildTimeStats.min} minutes`);
      
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