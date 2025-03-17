#!/usr/bin/env node

/**
 * GitHub Actions Artifact Downloader
 * 
 * This script downloads timing artifacts from GitHub Actions workflows
 * for use with the build performance comparison tool.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { Command } = require('commander');

// Load environment variables
require('dotenv').config();

// Setup command line options
const program = new Command();
program
  .name('download-artifacts')
  .description('Download timing artifacts from GitHub Actions workflows')
  .version('1.0.0')
  .option('-r, --repo <repository>', 'GitHub repository in format owner/repo', process.env.GITHUB_REPOSITORY)
  .option('-t, --token <token>', 'GitHub personal access token', process.env.GITHUB_TOKEN)
  .option('-w, --workflow <id>', 'Workflow ID or filename to download artifacts from', 'ci.yml,ci-nocache.yml')
  .option('-o, --output <directory>', 'Output directory for downloaded artifacts', '.')
  .option('-l, --latest', 'Only download artifacts from the latest run of each workflow', false)
  .parse(process.argv);

const options = program.opts();

// Validate options
if (!options.repo) {
  console.error(chalk.red('Error: GitHub repository is required via --repo option or GITHUB_REPOSITORY env variable'));
  process.exit(1);
}

if (!options.token) {
  console.error(chalk.red('Error: GitHub token is required via --token option or GITHUB_TOKEN env variable'));
  process.exit(1);
}

// Make the request to the GitHub API
async function makeGithubRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const [owner, repo] = options.repo.split('/');
    
    const requestOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/${endpoint}`,
      method: 'GET',
      headers: {
        'User-Agent': 'BuildPerfTool/1.0',
        'Authorization': `token ${options.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
          }
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Download a file from a URL
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    const request = https.get(url, {
      headers: {
        'User-Agent': 'BuildPerfTool/1.0',
        'Authorization': `token ${options.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirects
        file.close();
        fs.unlinkSync(outputPath); // Remove the file
        
        // Simple solution - use curl for the redirect
        try {
          execSync(`curl -L -o "${outputPath}" "${response.headers.location}"`, { 
            stdio: ['ignore', 'ignore', 'inherit'] 
          });
          resolve();
        } catch (error) {
          reject(new Error(`Failed to download file: ${error.message}`));
        }
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (error) => {
      fs.unlink(outputPath, () => {}); // Delete the file if error
      reject(error);
    });
    
    file.on('error', (error) => {
      fs.unlink(outputPath, () => {}); // Delete the file if error
      reject(error);
    });
  });
}

// Get workflow runs
async function getWorkflowRuns(workflowId) {
  try {
    return await makeGithubRequest(`actions/workflows/${workflowId}/runs`);
  } catch (error) {
    console.error(chalk.red(`Error getting workflow runs for ${workflowId}: ${error.message}`));
    return { workflow_runs: [] };
  }
}

// Get artifacts for a workflow run
async function getRunArtifacts(runId) {
  try {
    return await makeGithubRequest(`actions/runs/${runId}/artifacts`);
  } catch (error) {
    console.error(chalk.red(`Error getting artifacts for run ${runId}: ${error.message}`));
    return { artifacts: [] };
  }
}

// Main function
async function main() {
  try {
    console.log(chalk.blue('=== GitHub Actions Artifact Downloader ==='));
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }
    
    // Process each workflow
    const workflows = options.workflow.split(',');
    
    for (const workflow of workflows) {
      console.log(chalk.yellow(`Processing workflow: ${workflow}`));
      
      // Get workflow runs
      const runsResponse = await getWorkflowRuns(workflow);
      
      if (!runsResponse.workflow_runs || runsResponse.workflow_runs.length === 0) {
        console.log(chalk.yellow(`No workflow runs found for ${workflow}`));
        continue;
      }
      
      // Get the latest successful workflow run
      const successfulRuns = runsResponse.workflow_runs.filter(run => run.conclusion === 'success');
      
      if (successfulRuns.length === 0) {
        console.log(chalk.yellow(`No successful runs found for workflow ${workflow}`));
        continue;
      }
      
      // If --latest flag is set, only process the most recent run
      const runsToProcess = options.latest ? [successfulRuns[0]] : successfulRuns;
      
      for (const run of runsToProcess) {
        console.log(chalk.green(`Processing run #${run.run_number} (${new Date(run.created_at).toLocaleString()})`));
        
        // Get artifacts for this run
        const artifactsResponse = await getRunArtifacts(run.id);
        
        if (!artifactsResponse.artifacts || artifactsResponse.artifacts.length === 0) {
          console.log(chalk.yellow(`No artifacts found for run #${run.run_number}`));
          continue;
        }
        
        // Download each timing artifact
        for (const artifact of artifactsResponse.artifacts) {
          if (artifact.name.includes('timing') || artifact.name.includes('stats')) {
            const outputPath = path.join(options.output, `${artifact.name}.zip`);
            const extractPath = path.join(options.output, artifact.name);
            
            console.log(`Downloading ${artifact.name}...`);
            
            try {
              // Download the artifact
              await downloadFile(artifact.archive_download_url, outputPath);
              
              // Extract the zip file
              console.log(`Extracting ${artifact.name}...`);
              fs.mkdirSync(extractPath, { recursive: true });
              
              // Use unzip command to extract the file
              execSync(`unzip -o "${outputPath}" -d "${extractPath}"`, { 
                stdio: ['ignore', 'ignore', 'inherit'] 
              });
              
              // Move the timing stats file to the output directory
              const files = fs.readdirSync(extractPath);
              for (const file of files) {
                if (file.endsWith('.txt')) {
                  const sourcePath = path.join(extractPath, file);
                  const destPath = path.join(options.output, file);
                  fs.copyFileSync(sourcePath, destPath);
                  console.log(chalk.green(`Extracted ${file} to ${destPath}`));
                }
              }
              
              // Clean up
              fs.unlinkSync(outputPath);
              fs.rmSync(extractPath, { recursive: true, force: true });
              
            } catch (error) {
              console.error(chalk.red(`Error processing artifact ${artifact.name}: ${error.message}`));
            }
          }
        }
      }
    }
    
    console.log(chalk.green('\nArtifacts downloaded successfully!'));
    console.log(chalk.blue('You can now run the comparison script:'));
    console.log('  node compare-build-stats.js');
    
  } catch (error) {
    console.error(chalk.red('Error downloading artifacts:'));
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