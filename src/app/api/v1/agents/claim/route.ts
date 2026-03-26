import { NextRequest, NextResponse } from 'next/server';
import { db, eq, and, isNull, gt } from '@/lib/db/client';
import { agents, agentClaims, users } from '@/lib/db/schema';
import { createHmac, randomBytes } from 'crypto';

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'agentstarter-default';

function hashVerificationCode(code: string): string {
  return createHmac('sha256', HMAC_SECRET).update(code).digest('hex');
}

function generateApiKey(): string {
  return 'sk_agent_' + randomBytes(32).toString('hex');
}

function hashApiKey(key: string): string {
  return createHmac('sha256', HMAC_SECRET).update(key).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, email } = body;

    if (!code || !email) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'code and email are required',
          },
        },
        { status: 400 },
      );
    }

    // Hash the provided code
    const codeHash = hashVerificationCode(code.toUpperCase().trim());

    // Find matching unclaimed, unexpired claim
    const [claim] = await db
      .select()
      .from(agentClaims)
      .where(
        and(
          eq(agentClaims.verificationCodeHash, codeHash),
          eq(agentClaims.ownerEmail, email),
          isNull(agentClaims.claimedAt),
          gt(agentClaims.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!claim) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid or expired verification code',
          },
        },
        { status: 400 },
      );
    }

    // Find or create user by email
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: email.split('@')[0],
        })
        .returning();
      user = newUser;
    }

    // Generate API key now (deferred from registration)
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // Update the agent: assign to user, set API key, mark as verified
    const [updatedAgent] = await db
      .update(agents)
      .set({
        userId: user.id,
        apiKeyHash,
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, claim.agentId))
      .returning();

    // Mark the claim as completed
    await db
      .update(agentClaims)
      .set({ claimedAt: new Date() })
      .where(eq(agentClaims.id, claim.id));

    return NextResponse.json(
      {
        data: {
          agent_id: updatedAgent.id,
          name: updatedAgent.name,
          api_key: apiKey, // RETURNED ONCE — only at claim time
          wallet_address: updatedAgent.walletAddress,
          is_verified: updatedAgent.isVerified,
          user_id: user.id,
          claimed: true,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Agent claim error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to claim agent',
        },
      },
      { status: 500 },
    );
  }
}
