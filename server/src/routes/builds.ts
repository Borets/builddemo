import express from 'express';
import { Build } from '../models/Build';
import { logger } from '../utils/logger';

const router = express.Router();

// @route   GET api/builds
// @desc    Get all builds
// @access  Public
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const builds = await Build.find({}, { createdAt: -1 }, limit);
    res.json(builds);
  } catch (err) {
    logger.error('Error fetching builds:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/builds/:id
// @desc    Get build by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    
    if (!build) {
      return res.status(404).json({ msg: 'Build not found' });
    }
    
    res.json(build);
  } catch (err) {
    logger.error('Error fetching build:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/builds
// @desc    Create a build record
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      provider,
      buildTime,
      startTime,
      endTime,
      success,
      logs,
      metadata
    } = req.body;
    
    const newBuild = await Build.create({
      provider,
      buildTime,
      startTime,
      endTime,
      success,
      logs,
      metadata
    });
    
    res.json(newBuild);
  } catch (err) {
    logger.error('Error creating build:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/builds/:id
// @desc    Delete a build
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const success = await Build.deleteById(req.params.id);
    
    if (!success) {
      return res.status(404).json({ msg: 'Build not found' });
    }
    
    res.json({ msg: 'Build removed' });
  } catch (err) {
    logger.error('Error deleting build:', err);
    res.status(500).send('Server Error');
  }
});

export default router; 