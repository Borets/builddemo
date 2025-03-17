import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ProviderConfig {
  name: string;
  description: string;
  apiKey: string;
  apiEndpoint: string;
  config?: Record<string, any>;
  enabled: boolean;
}

// Helper function to get environment variables with fallbacks
const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Define providers configuration
const providersConfig: ProviderConfig[] = [
  {
    name: 'Render',
    description: 'Render.com cloud platform',
    apiKey: getEnv('RENDER_API_KEY'),
    apiEndpoint: getEnv('RENDER_API_ENDPOINT', 'https://api.render.com/v1'),
    config: {
      region: getEnv('RENDER_REGION', 'oregon'),
      serviceType: 'web_service'
    },
    enabled: getEnv('RENDER_ENABLED', 'true') === 'true'
  },
  {
    name: 'Vercel',
    description: 'Vercel deployment platform',
    apiKey: getEnv('VERCEL_API_KEY'),
    apiEndpoint: getEnv('VERCEL_API_ENDPOINT', 'https://api.vercel.com'),
    config: {
      teamId: getEnv('VERCEL_TEAM_ID'),
      projectId: getEnv('VERCEL_PROJECT_ID')
    },
    enabled: getEnv('VERCEL_ENABLED', 'false') === 'true'
  },
  {
    name: 'Netlify',
    description: 'Netlify hosting platform',
    apiKey: getEnv('NETLIFY_API_KEY'),
    apiEndpoint: getEnv('NETLIFY_API_ENDPOINT', 'https://api.netlify.com/api/v1'),
    config: {
      siteId: getEnv('NETLIFY_SITE_ID')
    },
    enabled: getEnv('NETLIFY_ENABLED', 'false') === 'true'
  },
  {
    name: 'AWS Amplify',
    description: 'AWS Amplify hosting service',
    apiKey: getEnv('AWS_ACCESS_KEY_ID'),
    apiEndpoint: getEnv('AWS_AMPLIFY_ENDPOINT', 'https://amplify.us-east-1.amazonaws.com'),
    config: {
      secretKey: getEnv('AWS_SECRET_ACCESS_KEY'),
      region: getEnv('AWS_REGION', 'us-east-1'),
      appId: getEnv('AWS_AMPLIFY_APP_ID')
    },
    enabled: getEnv('AWS_AMPLIFY_ENABLED', 'false') === 'true'
  },
  {
    name: 'GitHub Pages',
    description: 'GitHub Pages static site hosting',
    apiKey: getEnv('GITHUB_TOKEN'),
    apiEndpoint: getEnv('GITHUB_API_ENDPOINT', 'https://api.github.com'),
    config: {
      owner: getEnv('GITHUB_OWNER'),
      repo: getEnv('GITHUB_REPO'),
      branch: getEnv('GITHUB_BRANCH', 'gh-pages')
    },
    enabled: getEnv('GITHUB_PAGES_ENABLED', 'false') === 'true'
  }
];

// Only export enabled providers
export const getEnabledProviders = (): ProviderConfig[] => {
  return providersConfig.filter(provider => provider.enabled);
};

// Get a specific provider by name
export const getProviderByName = (name: string): ProviderConfig | undefined => {
  return providersConfig.find(provider => provider.name === name && provider.enabled);
};

// Export all providers for admin purposes
export const getAllProviders = (): ProviderConfig[] => {
  return providersConfig;
};

export default providersConfig; 