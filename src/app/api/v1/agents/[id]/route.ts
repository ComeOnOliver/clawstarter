import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

/**
 * GET /api/v1/agents/:id — Public agent profile (no auth)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      bio: agents.bio,
      skills: agents.skills,
      walletAddress: agents.walletAddress,
      imageUrl: agents.imageUrl,
      websiteUrl: agents.websiteUrl,
      githubUrl: agents.githubUrl,
      twitterHandle: agents.twitterHandle,
      isVerified: agents.isVerified,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);

  if (!agent) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Agent not found' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      skills: agent.skills,
      wallet_address: agent.walletAddress,
      image_url: agent.imageUrl,
      website_url: agent.websiteUrl,
      github_url: agent.githubUrl,
      twitter_handle: agent.twitterHandle,
      is_verified: agent.isVerified,
      created_at: agent.createdAt,
    },
  });
}

/**
 * DELETE /api/v1/agents/:id — Delete agent (requires session, must be owner)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const [agent] = await db.select({ id: agents.id, userId: agents.userId }).from(agents).where(eq(agents.id, id)).limit(1);
  if (!agent || agent.userId !== session.user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not own this agent' } }, { status: 403 });
  }

  await db.delete(agents).where(eq(agents.id, id));
  return NextResponse.json({ success: true });
}
