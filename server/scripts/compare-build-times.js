const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;
const NUM_BUILDS_TO_FETCH = 10; // Number of recent builds to analyze

async function fetchRenderBuilds() {
  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
    console.error('Error: RENDER_API_KEY and RENDER_SERVICE_ID environment variables must be set');
    process.exit(1);
  }

  try {
    const response = await axios.get(
      `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys`,
      {
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data.slice(0, NUM_BUILDS_TO_FETCH);
  } catch (error) {
    console.error(`Error fetching Render.com builds: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
    process.exit(1);
  }
}

function calculateRenderBuildTimes(builds) {
  return builds.map(build => {
    const startTime = new Date(build.createdAt);
    const endTime = new Date(build.finishedAt || build.updatedAt);
    const durationMs = endTime - startTime;
    const durationSec = Math.floor(durationMs / 1000);
    
    return {
      id: build.id,
      commitId: build.commit?.id?.substring(0, 7) || 'N/A',
      status: build.status,
      startedAt: startTime.toISOString(),
      duration: durationSec,
      formattedDuration: formatDuration(durationSec)
    };
  });
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function generateBuildTimeReport(renderBuilds) {
  let report = '# Build Time Comparison Report\n\n';
  
  report += '## Render.com Build Times\n\n';
  report += '| Build ID | Commit | Status | Started At | Duration |\n';
  report += '|----------|--------|--------|------------|----------|\n';
  
  renderBuilds.forEach(build => {
    report += `| ${build.id} | ${build.commitId} | ${build.status} | ${build.startedAt} | ${build.formattedDuration} |\n`;
  });
  
  // Calculate averages
  const successfulBuilds = renderBuilds.filter(build => build.status === 'live');
  let avgDuration = 'N/A';
  
  if (successfulBuilds.length > 0) {
    const totalDuration = successfulBuilds.reduce((sum, build) => sum + build.duration, 0);
    const avgDurationSec = Math.floor(totalDuration / successfulBuilds.length);
    avgDuration = formatDuration(avgDurationSec);
  }
  
  report += `\n**Average Render.com build time:** ${avgDuration} (based on ${successfulBuilds.length} successful builds)\n`;
  
  return report;
}

async function main() {
  console.log('Fetching Render.com build times...');
  const renderBuilds = await fetchRenderBuilds();
  const buildTimes = calculateRenderBuildTimes(renderBuilds);
  
  const report = generateBuildTimeReport(buildTimes);
  
  // Save the report
  const reportPath = path.join(__dirname, '..', 'build-time-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`Build time report generated at ${reportPath}`);
  console.log('\nSummary:');
  
  // Calculate averages for quick display
  const successfulBuilds = buildTimes.filter(build => build.status === 'live');
  if (successfulBuilds.length > 0) {
    const totalDuration = successfulBuilds.reduce((sum, build) => sum + build.duration, 0);
    const avgDurationSec = Math.floor(totalDuration / successfulBuilds.length);
    console.log(`Average Render.com build time: ${formatDuration(avgDurationSec)}`);
  } else {
    console.log('No successful Render.com builds found to calculate average time.');
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 