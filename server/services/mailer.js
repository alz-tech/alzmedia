/**
 * AlzMedia Mailer Service
 * Uses nodemailer with SMTP. Gracefully skips if not configured.
 */

let transporter = null;

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[Mailer] Not configured — skipping email to', to);
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || `"AlzMedia" <${process.env.SMTP_USER}>`,
    to, subject, html, text,
  });
}

async function sendVerificationEmail(email, code) {
  return sendMail({
    to: email,
    subject: 'Verify your AlzMedia account',
    html: `
      <div style="background:#07070D;padding:40px 24px;font-family:sans-serif;color:#F4F4FF;max-width:480px;margin:0 auto;border-radius:12px;">
        <div style="margin-bottom:24px;">
          <span style="color:#9D5FF5;font-weight:700;font-size:20px;">Alz</span><span style="font-weight:700;font-size:20px;">Media</span>
        </div>
        <h2 style="font-size:22px;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#6B6B8A;font-size:14px;margin-bottom:28px;">Enter this code in the AlzMedia app to activate your account.</p>
        <div style="background:#13131F;border:1px solid #1E1E30;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#9D5FF5;">${code}</div>
          <div style="font-size:12px;color:#6B6B8A;margin-top:8px;">Valid for 15 minutes</div>
        </div>
        <p style="color:#6B6B8A;font-size:12px;">If you did not create an AlzMedia account, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your AlzMedia verification code is: ${code}. Valid for 15 minutes.`,
  });
}

module.exports = { sendMail, sendVerificationEmail, isConfigured };
