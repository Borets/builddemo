"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const Build_1 = require("./models/Build");
const Provider_1 = require("./models/Provider");
const builds_1 = __importDefault(require("./routes/builds"));
const providers_1 = __importDefault(require("./routes/providers"));
const comparisons_1 = __importDefault(require("./routes/comparisons"));
const health_1 = __importDefault(require("./routes/health"));
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/builds', builds_1.default);
app.use('/api/providers', providers_1.default);
app.use('/api/comparisons', comparisons_1.default);
app.use('/api/health', health_1.default);
// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.resolve(__dirname, '../../client/build', 'index.html'));
    });
}
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error(`Error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
});
// Start server
const startServer = async () => {
    try {
        // Connect to database
        const pool = await (0, db_1.connectDB)();
        // Initialize models with the database pool
        if (pool) {
            Build_1.Build.initialize(pool);
            Provider_1.Provider.initialize(pool);
            logger_1.logger.info('Models initialized with database pool');
        }
        app.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
