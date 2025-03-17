import express from 'express';
import { Provider } from '../models/Provider';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/providers
// @desc    Get all providers
// @access  Public
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
// @desc    Create a provider
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      apiKey,
      apiEndpoint,
      config
    } = req.body;
    
    const newProvider = await Provider.create({
      name,
      description,
      apiKey,
      apiEndpoint,
      config
    });
    
    res.json(newProvider);
  } catch (err) {
    logger.error('Error creating provider:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/providers/:id
// @desc    Update a provider
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      apiKey,
      apiEndpoint,
      config
    } = req.body;
    
    // Build provider object
    const providerFields: Partial<any> = {};
    if (name) providerFields.name = name;
    if (description) providerFields.description = description;
    if (apiKey) providerFields.apiKey = apiKey;
    if (apiEndpoint) providerFields.apiEndpoint = apiEndpoint;
    if (config) providerFields.config = config;
    
    const provider = await Provider.findByIdAndUpdate(req.params.id, providerFields);
    
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
router.delete('/:id', async (req, res) => {
  try {
    const success = await Provider.deleteById(req.params.id);
    
    if (!success) {
      return res.status(404).json({ msg: 'Provider not found' });
    }
    
    res.json({ msg: 'Provider removed' });
  } catch (err) {
    logger.error('Error deleting provider:', err);
    res.status(500).send('Server Error');
  }
});

export default router; 