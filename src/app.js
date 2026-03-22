const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes    = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const creditRoutes  = require('./routes/creditRoutes');
const sellerRoutes  = require('./routes/sellerRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const contactRoutes = require('./routes/Contactroutes');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError }    = require('./utils/response');
const logger           = require('./utils/logger');

const app = express();

// ── Security headers ──────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || '*',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── NoSQL injection sanitisation ─────────────────────────
app.use(mongoSanitize());

// ── HTTP request logging ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ── Global rate limiter ───────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});
app.use('/api', globalLimiter);

// ── Auth endpoints get tighter rate limit ─────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 20,
  message: { success: false, message: 'Too many auth attempts — please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  success: true,
  message: 'Carbon Marketplace API is running',
  env:     process.env.NODE_ENV,
  ts:      new Date().toISOString(),
}));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/credits',  creditRoutes);
app.use('/api/seller',   sellerRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/contact',  contactRoutes);

// ── 404 catch-all ─────────────────────────────────────────
app.use((req, res) => sendError(res, `Route ${req.originalUrl} not found`, 404));

// ── Global error handler (must be last) ───────────────────
app.use(errorHandler);

module.exports = app;