import { createApp } from './app.js';
import { env } from './config/env.js';
import { SchedulingEngine } from './engines/scheduling-engine.js';

const start = async () => {
  const app = createApp();

  // Initialize cron scheduling engine for automations
  await SchedulingEngine.init();

  const server = app.listen(env.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 CampusFlow AI Platform Engine Running`);
    console.log(`📡 Port: ${env.port}`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
    console.log(`🛠️ API Base: http://localhost:${env.port}/api`);
    console.log(`=======================================================`);
  });

  const shutdown = () => {
    console.log('\nStopping CampusFlow AI engine...');
    SchedulingEngine.stopAll();
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
 // reload
