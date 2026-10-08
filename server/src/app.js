import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

export const createApp = () => {
  const app = express();

  // Basic security and parsing
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());

  // Mount API
  app.use('/api', routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.url}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
