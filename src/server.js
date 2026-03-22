require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

let server;

// ── Error guards ─────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// ── Graceful shutdown ───────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }
});

// ── Start server ────────────────────────
async function start() {
  try {
    console.log("Starting Server.....");
    await connectDB();
    console.log("DataBase Connected..")

    server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
      console.log(`server is running on ${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();