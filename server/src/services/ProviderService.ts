import { getEnabledProviders, getProviderByName, ProviderConfig } from '../config/providers';
import { logger } from '../utils/logger';

export class ProviderService {
  /**
   * Get all enabled providers from the configuration
   */
  static async getAllProviders(): Promise<ProviderConfig[]> {
    try {
      return getEnabledProviders();
    } catch (error) {
      logger.error('Error getting providers:', error);
      throw error;
    }
  }

  /**
   * Get a provider by name
   */
  static async getProviderByName(name: string): Promise<ProviderConfig | null> {
    try {
      const provider = getProviderByName(name);
      return provider || null;
    } catch (error) {
      logger.error(`Error getting provider by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Validate provider credentials
   */
  static async validateCredentials(providerName: string): Promise<boolean> {
    try {
      const provider = getProviderByName(providerName);
      
      if (!provider) {
        return false;
      }
      
      // For security, we don't want to expose the actual API key in logs
      const hasApiKey = !!provider.apiKey;
      logger.info(`Validating credentials for provider ${providerName}: API Key ${hasApiKey ? 'present' : 'missing'}`);
      
      // In a real implementation, you might want to make a test API call here
      // to verify the credentials work
      
      return hasApiKey;
    } catch (error) {
      logger.error(`Error validating credentials for provider ${providerName}:`, error);
      return false;
    }
  }
} 