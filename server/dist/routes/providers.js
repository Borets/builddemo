"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Provider_1 = require("../models/Provider");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// @route   GET api/providers
// @desc    Get all providers
// @access  Public
router.get('/', async (req, res) => {
    try {
        const providers = await Provider_1.Provider.find();
        res.json(providers);
    }
    catch (err) {
        logger_1.logger.error('Error fetching providers:', err);
        res.status(500).send('Server Error');
    }
});
// @route   GET api/providers/:id
// @desc    Get provider by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const provider = await Provider_1.Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ msg: 'Provider not found' });
        }
        res.json(provider);
    }
    catch (err) {
        logger_1.logger.error('Error fetching provider:', err);
        res.status(500).send('Server Error');
    }
});
// @route   POST api/providers
// @desc    Create a new provider
// @access  Public
router.post('/', async (req, res) => {
    try {
        const providerData = req.body;
        const provider = await Provider_1.Provider.create(providerData);
        res.status(201).json(provider);
    }
    catch (err) {
        logger_1.logger.error('Error creating provider:', err);
        res.status(500).send('Server Error');
    }
});
// @route   PUT api/providers/:id
// @desc    Update a provider
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const updateData = req.body;
        const provider = await Provider_1.Provider.findByIdAndUpdate(req.params.id, updateData);
        if (!provider) {
            return res.status(404).json({ msg: 'Provider not found' });
        }
        res.json(provider);
    }
    catch (err) {
        logger_1.logger.error('Error updating provider:', err);
        res.status(500).send('Server Error');
    }
});
// @route   DELETE api/providers/:id
// @desc    Delete a provider
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const success = await Provider_1.Provider.deleteById(req.params.id);
        if (!success) {
            return res.status(404).json({ msg: 'Provider not found' });
        }
        res.json({ msg: 'Provider deleted' });
    }
    catch (err) {
        logger_1.logger.error('Error deleting provider:', err);
        res.status(500).send('Server Error');
    }
});
exports.default = router;
