import express, { Request, Response } from 'express';
import { ProviderService } from '../services/ProviderService';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/providers
// @desc    Get all providers from config
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const providers = await ProviderService.getAllProviders();
    
    // Remove sensitive information before sending to client
    const sanitizedProviders = providers.map(provider => ({
      name: provider.name,
      description: provider.description,
      enabled: provider.enabled,
      // Don't include apiKey or other sensitive config details
    }));
    
    res.json(sanitizedProviders);
  } catch (err) {
    logger.error('Error fetching providers:', err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// @route   GET api/providers/:name
// @desc    Get provider by name
// @access  Public
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const provider = await ProviderService.getProviderByName(req.params.name);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Remove sensitive information before sending to client
    const sanitizedProvider = {
      name: provider.name,
      description: provider.description,
      enabled: provider.enabled,
      // Don't include apiKey or other sensitive config details
    };
    
    res.json(sanitizedProvider);
  } catch (err) {
    logger.error('Error fetching provider:', err);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// @route   GET api/providers/:name/validate
// @desc    Validate provider credentials
// @access  Public
router.get('/:name/validate', async (req: Request, res: Response) => {
  try {
    const isValid = await ProviderService.validateCredentials(req.params.name);
    
    res.json({ 
      name: req.params.name,
      valid: isValid,
      message: isValid ? 'Credentials are valid' : 'Invalid or missing credentials'
    });
  } catch (err) {
    logger.error('Error validating provider credentials:', err);
    res.status(500).json({ error: 'Failed to validate provider credentials' });
  }
});

// Note: POST, PUT, and DELETE endpoints are removed since providers are now configured via config file

export default router; 