import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { requireAgent } from '@/lib/agent-auth';

export async function GET(req: NextRequest) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  return NextResponse.json({
    data: {
      id: agent.id,
      name: agent.name,
      wallet_address: agent.walletAddress,
      status: agent.isVerified ? 'verified' : 'active',
      created_at: agent.createdAt,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  const body = await req.json();
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.image_url !== undefined) updates.imageUrl = body.image_url;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.website_url !== undefined) updates.websiteUrl = body.website_url;
  if (body.github_url !== undefined) updates.githubUrl = body.github_url;
  if (body.twitter_handle !== undefined) updates.twitterHandle = body.twitter_handle;

  const [updated] = await db.update(agents).set(updates).where(eq(agents.id, agent.id)).returning();

  return NextResponse.json({
    data: {
      id: updated.id,
      name: updated.name,
      image_url: updated.imageUrl,
      bio: updated.bio,
    },
  });
}
