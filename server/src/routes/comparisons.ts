import express, { Request, Response } from 'express';
import { Build, IBuild } from '../models/Build';
import { Provider, IProvider } from '../models/Provider';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/comparisons
// @desc    Get build comparisons across providers
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const providers: IProvider[] = await Provider.findAll();
    const builds: IBuild[] = await Build.findAll();
    
    const comparisons = providers.map((provider: IProvider) => {
      const providerBuilds = builds.filter((build: IBuild) => build.provider_id === provider.id);
      const totalBuilds = providerBuilds.length;
      
      if (totalBuilds === 0) {
        return {
          provider: provider.name,
          avgBuildTime: 0,
          minBuildTime: 0,
          maxBuildTime: 0,
          totalBuilds: 0,
          successRate: 0
        };
      }
      
      const buildTimes = providerBuilds.map((build: IBuild) => build.build_time);
      const successfulBuilds = providerBuilds.filter((build: IBuild) => build.status === 'success').length;
      
      return {
        provider: provider.name,
        avgBuildTime: buildTimes.reduce((a: number, b: number) => a + b, 0) / totalBuilds,
        minBuildTime: Math.min(...buildTimes),
        maxBuildTime: Math.max(...buildTimes),
        totalBuilds,
        successRate: (successfulBuilds / totalBuilds) * 100
      };
    });
    
    res.json(comparisons);
  } catch (error) {
    logger.error('Error fetching comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch comparisons' });
  }
});

// @route   GET api/comparisons/performance
// @desc    Get performance comparison between providers
// @access  Public
router.get('/performance', async (req: Request, res: Response) => {
  try {
    // Get performance metrics for each provider
    const performance = await Build.aggregate([]);
    res.json(performance);
  } catch (err) {
    logger.error('Error fetching performance data:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/comparisons/timeline
// @desc    Get build time trends over time
// @access  Public
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Format dates for SQL query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Get all builds within the date range
    const builds: IBuild[] = await Build.findByDateRange(formattedStartDate, formattedEndDate);
    
    // Get all providers
    const providers: IProvider[] = await Provider.findAll();
    
    // Generate a list of dates for the timeline
    const dateList: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create the timeline data structure
    const timelineData = dateList.map(date => {
      const dayBuilds = builds.filter(build => {
        const buildDate = new Date(build.created_at as Date).toISOString().split('T')[0];
        return buildDate === date;
      });
      
      const providerData = providers.map(provider => {
        const providerBuilds = dayBuilds.filter(build => build.provider_id === provider.id);
        const totalBuilds = providerBuilds.length;
        
        if (totalBuilds === 0) {
          return {
            provider: provider.name,
            avgBuildTime: null,
            totalBuilds: 0
          };
        }
        
        const buildTimes = providerBuilds.map(build => build.build_time);
        
        return {
          provider: provider.name,
          avgBuildTime: buildTimes.reduce((a: number, b: number) => a + b, 0) / totalBuilds,
          totalBuilds
        };
      }).filter(provider => provider.totalBuilds > 0); // Only include providers with builds on this day
      
      return {
        date,
        providers: providerData
      };
    }).filter(day => day.providers.length > 0); // Only include days with data
    
    res.json(timelineData);
  } catch (error) {
    logger.error('Error fetching timeline data:', error);
    res.status(500).json({ error: 'Failed to fetch timeline data' });
  }
});

export default router; 