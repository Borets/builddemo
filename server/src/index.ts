import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './db';
import { Build } from './models/Build';
import { Provider } from './models/Provider';
import buildRoutes from './routes/builds';
import providerRoutes from './routes/providers';
import comparisonRoutes from './routes/comparisons';
import healthRoutes from './routes/health';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/builds', buildRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/health', healthRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../client/build')));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const pool = await connectDB();
    
    // Initialize models with the database pool
    if (pool) {
      Build.initialize(pool);
      Provider.initialize(pool);
      logger.info('Models initialized with database pool');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 