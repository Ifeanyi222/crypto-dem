import nodemailer from 'nodemailer';

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(toEmail, resetLink) {
  if (!transporter) {
    // Dev fallback: no SMTP configured, so just log the link instead of failing.
    console.log(`\n[DEV] Password reset link for ${toEmail}:\n${resetLink}\n`);
    return { delivered: false, reason: 'SMTP not configured — link logged to console instead' };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Demora" <no-reply@vaultra.example>',
    to: toEmail,
    subject: 'Reset your password',
    text: `We received a request to reset your password. Click this link to set a new one (valid for 1 hour): ${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${resetLink}">Click here to set a new password</a> (valid for 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`,
  });
  return { delivered: true };
}
