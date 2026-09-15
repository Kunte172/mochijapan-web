const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

function frontendUrl() {
  return (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  // Day 5 uses a console mail adapter so the flow can be tested without a paid provider.
  // Replace this adapter with SMTP/transactional email before production release.
  console.log(`\n[MAIL:EMAIL_VERIFICATION]\nTo: ${email}\n${url}\n`);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${frontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  console.log(`\n[MAIL:PASSWORD_RESET]\nTo: ${email}\n${url}\n`);
}
