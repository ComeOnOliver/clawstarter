import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { hashApiKey } from '@/lib/agent-auth';

function generateApiKey(): string {
  return 'sk_agent_' + randomBytes(32).toString('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id } = await params;

  const [agent] = await db.select({ id: agents.id, userId: agents.userId }).from(agents).where(eq(agents.id, id)).limit(1);
  if (!agent || agent.userId !== session.user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not own this agent' } }, { status: 403 });
  }

  const newApiKey = generateApiKey();
  const newHash = hashApiKey(newApiKey);

  await db.update(agents).set({ apiKeyHash: newHash, updatedAt: new Date() }).where(eq(agents.id, id));

  return NextResponse.json({ data: { api_key: newApiKey } });
}
