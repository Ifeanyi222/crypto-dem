<<<<<<< HEAD
# Vaultra Backend (Auth API)

A real backend for the Vaultra site: sign up, log in, and forgot-password,
with hashed passwords, JWT sessions, and rate limiting.

## What it uses
- **Express** — the API server
- **lowdb** — a simple JSON-file database (`data/db.json`). Fine for launch/low
  volume; swap for Postgres/MySQL when you outgrow a single file (see "Scaling" below).
- **bcryptjs** — password hashing (12 salt rounds, industry standard)
- **jsonwebtoken** — session tokens (7-day expiry)
- **nodemailer** — sends the password-reset email. If you don't configure SMTP,
  it logs the reset link to the console instead, so you can develop without an
  email provider.
- **express-rate-limit** — caps auth attempts (30 per 15 min per IP) to slow down
  brute-force attacks.

## Setup
```bash
npm install
cp .env.example .env
# edit .env: set a real JWT_SECRET, and SMTP_* if you want real emails
npm start
```
Server runs on `http://localhost:4000` by default.

## Endpoints
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | `{name, email, password}` | Returns `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` | Returns `{token, user}` |
| POST | `/api/auth/forgot-password` | `{email}` | Always returns a generic success message (doesn't reveal if the email exists) |
| POST | `/api/auth/reset-password` | `{token, newPassword}` | Token comes from the emailed/logged reset link |
| GET | `/api/auth/me` | — (needs `Authorization: Bearer <token>`) | Returns the logged-in user |

## Connecting the frontend
In `crypto-exchange-main.html`, set:
```js
const API_BASE = 'http://localhost:4000'; // or your deployed backend URL
```
The signup/login/forgot-password forms already call these endpoints and store
the returned JWT in `localStorage` under `vaultra_token`.

## Sending real emails
Fill in `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc. in `.env`. Any standard SMTP
provider works — SendGrid, Mailgun, Amazon SES, Postmark, or even a Gmail
account with an app password. Until you do, reset links are just printed to
the server console so you can test the full flow locally.

## Before you put real users/money behind this
- **Deploy behind HTTPS** — never send passwords or tokens over plain HTTP.
- **Set a strong, random `JWT_SECRET`** and keep it out of version control.
- **Scaling the database:** lowdb writes the whole JSON file on every change,
  which is fine for hundreds of users but won't hold up under real concurrent
  load. When you're ready, swap `db.js` for a proper database — Postgres via
  an ORM like Prisma, or a managed service like Supabase, is the natural next
  step, and the rest of the API (`routes/auth.js`) barely has to change since
  the database calls are isolated to `db.js`.
- **Consider httpOnly cookies instead of localStorage** for the session token —
  more resistant to XSS. This backend currently issues a plain JWT for
  simplicity; moving to cookie-based sessions is a small change to `server.js`
  and the login/signup routes.
- **Email deliverability** — a dedicated transactional email provider (not
  personal Gmail) is strongly recommended once this is live, both for
  reliability and to avoid your domain getting flagged as spam.
=======
# crypto-dem
>>>>>>> 2171f7a5938d44acb0724b6e79611c6e9c972e58
