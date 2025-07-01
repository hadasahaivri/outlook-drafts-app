import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import emailRoutes from './routes/emailRoutes.js';
import { getTempDir } from './utils/emailUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    tempDir: getTempDir()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email Draft Server is running on http://localhost:${PORT}`);
  console.log(`📁 Temporary files directory: ${getTempDir()}`);
  console.log(`💻 Platform: ${process.platform}`);
  console.log('📧 Ready to create email drafts!');
});

export default app;
