"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Build_1 = require("../models/Build");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// @route   GET api/builds
// @desc    Get all builds
// @access  Public
router.get('/', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const builds = await Build_1.Build.find({}, { createdAt: -1 }, limit);
        res.json(builds);
    }
    catch (err) {
        logger_1.logger.error('Error fetching builds:', err);
        res.status(500).send('Server Error');
    }
});
// @route   GET api/builds/:id
// @desc    Get build by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const build = await Build_1.Build.findById(req.params.id);
        if (!build) {
            return res.status(404).json({ msg: 'Build not found' });
        }
        res.json(build);
    }
    catch (err) {
        logger_1.logger.error('Error fetching build:', err);
        res.status(500).send('Server Error');
    }
});
// @route   POST api/builds
// @desc    Create a new build
// @access  Public
router.post('/', async (req, res) => {
    try {
        const buildData = req.body;
        const build = await Build_1.Build.create(buildData);
        res.status(201).json(build);
    }
    catch (err) {
        logger_1.logger.error('Error creating build:', err);
        res.status(500).send('Server Error');
    }
});
// @route   DELETE api/builds/:id
// @desc    Delete a build
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const success = await Build_1.Build.deleteById(req.params.id);
        if (!success) {
            return res.status(404).json({ msg: 'Build not found' });
        }
        res.json({ msg: 'Build deleted' });
    }
    catch (err) {
        logger_1.logger.error('Error deleting build:', err);
        res.status(500).send('Server Error');
    }
});
exports.default = router;
