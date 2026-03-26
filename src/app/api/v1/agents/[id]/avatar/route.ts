import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { agents } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

/**
 * POST /api/v1/agents/:id/avatar — Update agent avatar (requires session, must be owner)
 * Body: { "image_url": "https://..." }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }

  const { id } = await params;

  // Verify ownership
  const [agent] = await db
    .select({ id: agents.id, userId: agents.userId })
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);

  if (!agent || agent.userId !== session.user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You do not own this agent' } },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { image_url } = body;

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'image_url is required' } },
      { status: 400 },
    );
  }

  try {
    new URL(image_url);
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid image URL' } },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(agents)
    .set({ imageUrl: image_url, updatedAt: new Date() })
    .where(eq(agents.id, id))
    .returning({ id: agents.id, imageUrl: agents.imageUrl });

  return NextResponse.json({
    success: true,
    data: { id: updated.id, image_url: updated.imageUrl },
  });
}
