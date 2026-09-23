import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import onrampRoutes from './routes/onramp.js';
import tradeRoutes from './routes/trade.js';

const app = express();
app.use(cors());
app.use(express.json());

// Basic protection against brute-forcing login/signup/reset endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/onramp', onrampRoutes);
app.use('/api/trade', tradeRoutes);

const PORT = process.env.PORT || 4000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`backend running on http://localhost:${PORT}`));
});
