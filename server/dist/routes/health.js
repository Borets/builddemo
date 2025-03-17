"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// @route   GET api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req, res) => {
    logger_1.logger.debug('Health check requested');
    // Return basic health information
    res.json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV
    });
});
exports.default = router;
