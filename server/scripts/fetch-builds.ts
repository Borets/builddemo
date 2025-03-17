import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Build } from '../src/models/Build';
import { ProviderService } from '../src/services/ProviderService';
import { BuildService } from '../src/services/BuildService';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

/**
 * Main function to fetch builds from all enabled providers
 */
async function fetchBuildsFromAllProviders() {
  let pool: Pool | null = null;
  
  try {
    // Connect to the database
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Initialize models
    Build.initialize(pool);
    
    // Get all enabled providers
    const providers = await ProviderService.getAllProviders();
    logger.info(`Found ${providers.length} enabled providers`);
    
    // Fetch builds from each provider
    for (const provider of providers) {
      logger.info(`Fetching builds from ${provider.name}...`);
      const builds = await BuildService.fetchBuildsFromProvider(provider.name);
      
      if (builds.length === 0) {
        logger.info(`No builds found for ${provider.name}`);
        continue;
      }
      
      // Record each build in the database
      logger.info(`Found ${builds.length} builds for ${provider.name}`);
      for (const buildData of builds) {
        try {
          await BuildService.recordBuild(buildData);
        } catch (error) {
          logger.error(`Error recording build for ${provider.name}:`, error);
        }
      }
      
      logger.info(`Successfully recorded ${builds.length} builds for ${provider.name}`);
    }
    
    logger.info('Build fetch completed successfully');
  } catch (error) {
    logger.error('Error fetching builds:', error);
  } finally {
    // Close the database connection
    if (pool) {
      await pool.end();
    }
  }
}

// Run the script
fetchBuildsFromAllProviders()
  .then(() => {
    logger.info('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  }); 