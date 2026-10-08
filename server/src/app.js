import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  // Basic security and parsing
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());

  // Mount API
  app.use('/api', routes);

  // API 404 handler (ensures non-existent /api routes return JSON 404)
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  });

  // Serve static client assets if built (full-stack production deployment)
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    // 404 handler for API-only deployment
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
      });
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
