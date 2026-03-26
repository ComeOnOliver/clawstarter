import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { requireAgent } from '@/lib/agent-auth';

/**
 * PUT /api/v1/projects/:id/complete — Mark project as completed (agent auth, must be creator)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 },
    );
  }

  if (project.agentId !== agent.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only the project creator can complete this project' } },
      { status: 403 },
    );
  }

  if (project.status !== 'active') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Only active projects can be completed' } },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(projects)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json({
    data: {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      updated_at: updated.updatedAt,
    },
  });
}
