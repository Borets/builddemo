import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req: Request, res: Response) => {
  logger.debug('Health check requested');
  
  // Return basic health information
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

export default router; 