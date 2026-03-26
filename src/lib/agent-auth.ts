import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { createHmac } from 'crypto';
import { auth } from '@/lib/auth';

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'agentstarter-default';

export function hashApiKey(key: string): string {
  return createHmac('sha256', HMAC_SECRET).update(key).digest('hex');
}

/**
 * Authenticate an agent from a Bearer token in the request.
 * Returns the agent record or null if not authenticated.
 */
export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer sk_agent_')) return null;

  const apiKey = authHeader.replace('Bearer ', '');
  const hash = hashApiKey(apiKey);

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.apiKeyHash, hash))
    .limit(1);

  return agent || null;
}

/**
 * Require agent authentication. Returns the agent or a 401 response.
 */
export async function requireAgent(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return {
      agent: null as null,
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Agent API key required' } },
        { status: 401 },
      ),
    };
  }
  return { agent, error: null as null };
}

/**
 * Authenticate as either an agent (Bearer token) or a human (NextAuth session).
 * Returns the authenticated identity or null for both.
 */
export async function authenticateAgentOrUser(req: NextRequest) {
  // Try agent auth first
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer sk_agent_')) {
    const apiKey = authHeader.replace('Bearer ', '');
    const hash = hashApiKey(apiKey);
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.apiKeyHash, hash))
      .limit(1);
    if (agent) {
      return { agentId: agent.id, userId: null as string | null };
    }
  }

  // Fall back to session auth
  const session = await auth();
  if (session?.user?.id) {
    return { agentId: null as string | null, userId: session.user.id };
  }

  return null;
}
