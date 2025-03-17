import express, { Request, Response } from 'express';
import { Build } from '../models/Build';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/comparisons
// @desc    Get build comparisons across providers
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all builds grouped by provider
    const comparisons = await Build.aggregate([]);
    res.json(comparisons);
  } catch (err) {
    logger.error('Error fetching comparisons:', err);
    res.status(500).send('Server Error');
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
router.get('/timeline', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Get builds within date range
    const builds = await Build.find({
      // In PostgreSQL, we'll handle the date filtering in the query
    }, { createdAt: 1 });
    
    // Group by day and provider
    const timeline = builds.reduce((acc: any, build: any) => {
      const date = new Date(build.createdAt).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {};
      }
      
      if (!acc[date][build.provider]) {
        acc[date][build.provider] = {
          builds: [],
          avgBuildTime: 0
        };
      }
      
      acc[date][build.provider].builds.push(build);
      
      // Recalculate average
      const providerBuilds = acc[date][build.provider].builds;
      const totalTime = providerBuilds.reduce((sum: number, b: any) => sum + b.buildTime, 0);
      acc[date][build.provider].avgBuildTime = totalTime / providerBuilds.length;
      
      return acc;
    }, {});
    
    // Convert to array format for easier consumption by charts
    const result = Object.keys(timeline).map(date => {
      const providers = Object.keys(timeline[date]).map(provider => ({
        provider,
        avgBuildTime: timeline[date][provider].avgBuildTime,
        buildCount: timeline[date][provider].builds.length
      }));
      
      return {
        date,
        providers
      };
    });
    
    res.json(result);
  } catch (err) {
    logger.error('Error fetching timeline:', err);
    res.status(500).send('Server Error');
  }
});

export default router; 