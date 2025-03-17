import express, { Request, Response } from 'express';
import { Provider } from '../models/Provider';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/providers
// @desc    Get all providers
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (err) {
    logger.error('Error fetching providers:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/providers/:id
// @desc    Get provider by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ msg: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (err) {
    logger.error('Error fetching provider:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/providers
// @desc    Create a new provider
// @access  Public
router.post('/', async (req: Request, res: Response) => {
  try {
    const providerData = req.body;
    const provider = await Provider.create(providerData);
    res.status(201).json(provider);
  } catch (err) {
    logger.error('Error creating provider:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/providers/:id
// @desc    Update a provider
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    const provider = await Provider.findByIdAndUpdate(req.params.id, updateData);
    
    if (!provider) {
      return res.status(404).json({ msg: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (err) {
    logger.error('Error updating provider:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/providers/:id
// @desc    Delete a provider
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await Provider.deleteById(req.params.id);
    
    if (!success) {
      return res.status(404).json({ msg: 'Provider not found' });
    }
    
    res.json({ msg: 'Provider deleted' });
  } catch (err) {
    logger.error('Error deleting provider:', err);
    res.status(500).send('Server Error');
  }
});

export default router; 