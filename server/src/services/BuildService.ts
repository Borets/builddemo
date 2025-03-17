import axios from 'axios';
import { Build } from '../models/Build';
import { ProviderService } from './ProviderService';
import { logger } from '../utils/logger';

export class BuildService {
  /**
   * Record a new build
   */
  static async recordBuild(buildData: any): Promise<any> {
    try {
      const build = await Build.create(buildData);
      return build;
    } catch (error) {
      logger.error('Error recording build:', error);
      throw error;
    }
  }

  /**
   * Fetch builds from a provider
   */
  static async fetchBuildsFromProvider(providerName: string): Promise<any[]> {
    try {
      const provider = await ProviderService.getProviderByName(providerName);
      
      if (!provider) {
        logger.error(`Provider ${providerName} not found`);
        return [];
      }
      
      if (!provider.apiKey) {
        logger.error(`Provider ${providerName} has no API key configured`);
        return [];
      }
      
      // Different providers have different APIs, so we need to handle each one differently
      switch (providerName) {
        case 'Render':
          return await this.fetchRenderBuilds(provider);
        case 'Vercel':
          return await this.fetchVercelBuilds(provider);
        case 'Netlify':
          return await this.fetchNetlifyBuilds(provider);
        case 'AWS Amplify':
          return await this.fetchAmplifyBuilds(provider);
        case 'GitHub Pages':
          return await this.fetchGitHubBuilds(provider);
        default:
          logger.error(`Unsupported provider: ${providerName}`);
          return [];
      }
    } catch (error) {
      logger.error(`Error fetching builds from provider ${providerName}:`, error);
      return [];
    }
  }

  /**
   * Fetch builds from Render
   */
  private static async fetchRenderBuilds(provider: any): Promise<any[]> {
    try {
      const response = await axios.get(`${provider.apiEndpoint}/services`, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`
        }
      });
      
      // Get the first service for demo purposes
      // In a real app, you might want to specify which service to track
      if (response.data && response.data.length > 0) {
        const serviceId = response.data[0].id;
        
        const buildsResponse = await axios.get(`${provider.apiEndpoint}/services/${serviceId}/deploys`, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        });
        
        // Transform the data to match our build model
        return buildsResponse.data.map((deploy: any) => ({
          provider_id: provider.id,
          build_time: (new Date(deploy.finishedAt).getTime() - new Date(deploy.startedAt).getTime()) / 1000,
          start_time: new Date(deploy.startedAt),
          end_time: new Date(deploy.finishedAt),
          status: deploy.status === 'live' ? 'success' : 'failure',
          logs: deploy.logUrl || '',
          metadata: {
            deployId: deploy.id,
            commitId: deploy.commit?.id,
            commitMessage: deploy.commit?.message
          }
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error fetching Render builds:', error);
      return [];
    }
  }

  /**
   * Fetch builds from Vercel
   */
  private static async fetchVercelBuilds(provider: any): Promise<any[]> {
    try {
      // Implementation for Vercel API
      // This is a placeholder - you would need to implement the actual API calls
      logger.info('Fetching Vercel builds - not implemented yet');
      return [];
    } catch (error) {
      logger.error('Error fetching Vercel builds:', error);
      return [];
    }
  }

  /**
   * Fetch builds from Netlify
   */
  private static async fetchNetlifyBuilds(provider: any): Promise<any[]> {
    try {
      // Implementation for Netlify API
      // This is a placeholder - you would need to implement the actual API calls
      logger.info('Fetching Netlify builds - not implemented yet');
      return [];
    } catch (error) {
      logger.error('Error fetching Netlify builds:', error);
      return [];
    }
  }

  /**
   * Fetch builds from AWS Amplify
   */
  private static async fetchAmplifyBuilds(provider: any): Promise<any[]> {
    try {
      // Implementation for AWS Amplify API
      // This is a placeholder - you would need to implement the actual API calls
      logger.info('Fetching AWS Amplify builds - not implemented yet');
      return [];
    } catch (error) {
      logger.error('Error fetching AWS Amplify builds:', error);
      return [];
    }
  }

  /**
   * Fetch builds from GitHub
   */
  private static async fetchGitHubBuilds(provider: any): Promise<any[]> {
    try {
      // Implementation for GitHub API
      // This is a placeholder - you would need to implement the actual API calls
      logger.info('Fetching GitHub builds - not implemented yet');
      return [];
    } catch (error) {
      logger.error('Error fetching GitHub builds:', error);
      return [];
    }
  }
} 