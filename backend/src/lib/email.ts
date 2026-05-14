import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@airesumeapp.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Only initialise the client when we have a key; fall back to console logging
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!resend) {
    // Dev fallback: log to console so the app still runs without Resend configured
    console.log(
      `[EMAIL – no RESEND_API_KEY] to=${opts.to} | subject=${opts.subject}\n${opts.text || opts.html}`
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text
  });

  if (error) {
    console.error('Resend send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// ─── Public helpers ────────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your AI Resume password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;">Reset your password</h2>
        <p>We received a request to reset the password for your AI Resume account.</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <p style="margin:24px 0;">
          <a href="${link}"
             style="background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#aaa;font-size:11px;margin-top:16px;">
          Or copy this link: <a href="${link}" style="color:#555;">${link}</a>
        </p>
      </div>
    `,
    text: `Reset your AI Resume password\n\nClick here to reset: ${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`
  });
}

export async function sendEmailVerification(email: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your AI Resume email address',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;">Verify your email</h2>
        <p>Thanks for signing up for AI Resume! Please confirm your email address to get started.</p>
        <p style="margin:24px 0;">
          <a href="${link}"
             style="background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Verify Email
          </a>
        </p>
        <p style="color:#888;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="color:#aaa;font-size:11px;margin-top:16px;">
          Or copy this link: <a href="${link}" style="color:#555;">${link}</a>
        </p>
      </div>
    `,
    text: `Verify your email address\n\nClick here to verify: ${link}\n\nIf you didn't sign up, ignore this email.`
  });
}

export async function sendApplicationUpdate(
  email: string,
  jobTitle: string,
  status: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    applied: 'submitted',
    screening: 'moved to screening',
    interview: 'progressed to interview stage',
    offer: 'received an offer',
    rejected: 'closed',
    accepted: 'accepted',
    withdrawn: 'withdrawn'
  };

  const humanStatus = statusLabels[status] || status;
  const dashboardLink = `${FRONTEND_URL}/applications`;

  await sendEmail({
    to: email,
    subject: `Application update: ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;">Application update</h2>
        <p>Your application for <strong>${jobTitle}</strong> has been <strong>${humanStatus}</strong>.</p>
        <p style="margin:24px 0;">
          <a href="${dashboardLink}"
             style="background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            View Applications
          </a>
        </p>
        <p style="color:#888;font-size:12px;">Log in to your AI Resume dashboard to see full details and next steps.</p>
      </div>
    `,
    text: `Application update for ${jobTitle}: ${humanStatus}.\nView your applications: ${dashboardLink}`
  });
}
