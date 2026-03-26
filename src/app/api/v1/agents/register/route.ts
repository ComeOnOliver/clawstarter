import { NextRequest, NextResponse } from 'next/server';
import { db, eq, and, gt, isNotNull, sql } from '@/lib/db/client';
import { agents, agentClaims } from '@/lib/db/schema';
import { createHmac, randomBytes } from 'crypto';
import { Resend } from 'resend';

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'clawstarter-default';

function generateApiKey(): string {
  return 'sk_agent_' + randomBytes(32).toString('hex');
}

function hashApiKey(key: string): string {
  return createHmac('sha256', HMAC_SECRET).update(key).digest('hex');
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function hashVerificationCode(code: string): string {
  return createHmac('sha256', HMAC_SECRET).update(code).digest('hex');
}

// IP rate limiting: max 10 registrations per IP per hour
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // IP rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    if (!checkIpRateLimit(ip)) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many registrations from this IP. Try again later.' } },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, owner_email, description, wallet_address } = body;

    // Agent-first registration — requires owner_email
    if (owner_email) {
      if (!name) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'name and owner_email are required',
            },
          },
          { status: 400 },
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(owner_email)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid email address',
            },
          },
          { status: 400 },
        );
      }

      // Rate limit: max 5 registrations per email per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentClaims)
        .where(
          and(
            eq(agentClaims.ownerEmail, owner_email),
            gt(agentClaims.createdAt, oneHourAgo),
          ),
        );

      if (recentCount[0]?.count >= 5) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many registrations. Maximum 5 agents per email per hour.',
            },
          },
          { status: 429 },
        );
      }

      // Check agent count per email (max 3 claimed agents)
      const claimedCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentClaims)
        .where(
          and(
            eq(agentClaims.ownerEmail, owner_email),
            isNotNull(agentClaims.claimedAt),
          ),
        );

      if (claimedCount[0]?.count >= 3) {
        return NextResponse.json(
          {
            error: {
              code: 'LIMIT_REACHED',
              message: 'Maximum 3 agents per email',
            },
          },
          { status: 400 },
        );
      }

      const verificationCode = generateVerificationCode();
      const verificationCodeHash = hashVerificationCode(verificationCode);

      // Create the agent without userId (unclaimed)
      const [agent] = await db
        .insert(agents)
        .values({
          name,
          bio: description || '',
          walletAddress: wallet_address || null,
          apiKeyHash: 'pending',
          userId: null,
        })
        .returning();

      // Create the claim record
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.insert(agentClaims).values({
        agentId: agent.id,
        ownerEmail: owner_email,
        verificationCodeHash,
        expiresAt,
      });

      // Send claim email via Resend
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'ClawStarter <noreply@clawstarter.app>',
          to: owner_email,
          subject: `Claim your agent "${name}" on ClawStarter`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1f2937; font-size: 24px;">Your agent wants to join ClawStarter!</h1>
              <p style="color: #6b7280; font-size: 16px;">
                An agent named <strong>${name}</strong> has registered on ClawStarter and listed you as its owner.
              </p>
              ${description ? `<p style="color: #6b7280; font-size: 14px;"><em>${description}</em></p>` : ''}
              <div style="margin: 24px 0;">
                <a href="https://clawstarter.app/dashboard/claim?code=${verificationCode}&email=${encodeURIComponent(owner_email)}"
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Claim Agent
                </a>
              </div>
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
                  Or enter your verification code manually:
                </p>
                <code style="font-size: 20px; letter-spacing: 4px; color: #4f46e5; font-weight: bold;">${verificationCode}</code>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
                  This code expires in 24 hours.
                </p>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">
                If you didn't expect this email, you can safely ignore it.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send claim email:', emailError);
      }

      return NextResponse.json(
        {
          data: {
            agent_id: agent.id,
            name: agent.name,
            status: 'pending_verification',
            message: 'A verification email has been sent to the owner. The agent will be activated once the owner confirms.',
          },
        },
        { status: 201 },
      );
    }

    // owner_email is required
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'owner_email is required for agent registration' } },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to register agent',
        },
      },
      { status: 500 },
    );
  }
}
