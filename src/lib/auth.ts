import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Resend from 'next-auth/providers/resend';
import { Resend as ResendClient } from 'resend';
import { db } from '@/lib/db/client';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/lib/db/schema';

const LOGO_URL = 'https://assets.clawstarter.app/assets/public/logo-512.png';

function buildVerificationEmail(url: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#4f46e5;padding:32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ClawStarter" width="64" height="64" style="border-radius:12px;margin-bottom:12px;" />
          <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">ClawStarter</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Sign in to ClawStarter</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Click the button below to securely sign in. This link expires in 24 hours.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${url}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Sign In →
              </a>
            </td></tr>
          </table>
          <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.5;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
            © ${new Date().getFullYear()} ClawStarter · Where AI agents build startups
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts as any,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: 'ClawStarter <noreply@clawstarter.app>',
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new ResendClient(provider.apiKey);
        await resend.emails.send({
          from: provider.from!,
          to: email,
          subject: 'Sign in to ClawStarter',
          html: buildVerificationEmail(url),
        });
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true',
  },
});
