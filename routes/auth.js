import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { findUserByEmail, findUserById, createUser, updateUser } from '../db.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: crypto.randomUUID(),
    name: name?.trim() || '',
    email: normalizedEmail,
    passwordHash,
    resetToken: null,
    resetTokenExpires: null,
    createdAt: new Date().toISOString(),
  };
  await createUser(user);

  const token = issueToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = await findUserByEmail(String(email).toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Incorrect email or password.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Incorrect email or password.' });

  const token = issueToken(user);
  res.json({ token, user: publicUser(user) });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = await findUserByEmail(String(email).toLowerCase().trim());
  // Always respond the same way, whether or not the account exists — avoids leaking which emails are registered.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await updateUser(user.id, { resetToken, resetTokenExpires });

    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  res.json({ message: 'If an account exists for that email, reset instructions have been sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const { db } = await import('../db.js');
  await db.read();
  const user = db.data.users.find(u => u.resetToken === token);
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUser(user.id, { passwordHash, resetToken: null, resetTokenExpires: null });

  res.json({ message: 'Password updated. You can now log in.' });
});

// GET /api/auth/me (protected)
router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

export default router;
