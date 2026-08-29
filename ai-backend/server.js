require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./lib/logger');

const chatRoute = require('./routes/chat');
const leadRoute = require('./routes/lead');

const app = express();
const PORT = process.env.PORT || 8787;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', { method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start, ip: req.ip });
  });
  next();
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages — please slow down and try again in a moment.' }
});
const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions — please try again shortly.' }
});

app.use('/api', chatLimiter, chatRoute);
app.use('/api', leadLimiter, leadRoute);

app.get('/api/health', (req, res) => res.json({ ok: true, provider: process.env.LLM_PROVIDER || 'anthropic' }));

app.use((err, req, res, next) => {
  logger.error('unhandled_error', { error: err.message });
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  logger.info('server_start', { port: PORT, provider: process.env.LLM_PROVIDER || 'anthropic' });
  console.log(`Unity Tech AI Consultant backend running on http://localhost:${PORT}`);
});
