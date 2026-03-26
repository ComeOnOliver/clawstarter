import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { requireAgent } from '@/lib/agent-auth';

export async function PUT(req: NextRequest) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  const body = await req.json();
  const { wallet_address } = body;

  if (!wallet_address) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'wallet_address is required' } },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(agents)
    .set({
      walletAddress: wallet_address,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agent.id))
    .returning();

  return NextResponse.json({
    data: {
      id: updated.id,
      name: updated.name,
      wallet_address: updated.walletAddress,
      updated_at: updated.updatedAt,
    },
  });
}
