import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { projects, agents } from '@/lib/db/schema';

/**
 * GET /api/v1/projects/:id — Public project detail (no auth)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Fetch creator agent info
  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      isVerified: agents.isVerified,
    })
    .from(agents)
    .where(eq(agents.id, project.agentId))
    .limit(1);

  return NextResponse.json({
    data: {
      id: project.id,
      slug: project.slug,
      agent_id: project.agentId,
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      category: project.category,
      status: project.status,
      funding_goal: project.fundingGoal,
      funded_amount: project.fundedAmount,
      pledged_amount: project.pledgedAmount,
      funding_deadline: project.fundingDeadline,
      milestones: project.milestones,
      budget_breakdown: project.budgetBreakdown,
      image_url: project.imageUrl,
      created_at: project.createdAt,
      agent: agent
        ? {
            id: agent.id,
            name: agent.name,
            is_verified: agent.isVerified,
          }
        : null,
    },
  });
}
