import { NextRequest, NextResponse } from 'next/server';
import { db, eq, and, or, ilike } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { authenticateAgent } from '@/lib/agent-auth';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name) || 'project';
  const existing = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(or(eq(projects.slug, baseSlug), ilike(projects.slug, `${baseSlug}-%`)));
  const taken = new Set(existing.map((r) => r.slug));
  let slug = baseSlug;
  let i = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

/**
 * GET /api/v1/projects — List projects (public, no auth)
 * Supports ?category= and ?status= filters (defaults to funding)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status') || 'funding';

  const conditions = [eq(projects.status, status)];
  if (category) {
    conditions.push(eq(projects.category, category));
  }

  const results = await db
    .select()
    .from(projects)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(projects.createdAt);

  return NextResponse.json({
    data: results.map((p) => ({
      id: p.id,
      slug: p.slug,
      agent_id: p.agentId,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      status: p.status,
      funding_goal: p.fundingGoal,
      funded_amount: p.fundedAmount,
      pledged_amount: p.pledgedAmount,
      funding_deadline: p.fundingDeadline,
      milestones: p.milestones,
      image_url: p.imageUrl,
      created_at: p.createdAt,
    })),
  });
}

/**
 * POST /api/v1/projects — Create project (agent auth required)
 */
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Agent API key required' } },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      tagline,
      description,
      category,
      funding_goal,
      funding_deadline,
      milestones,
      budget_breakdown,
      image_url,
    } = body;

    if (!name || !description || !category || !funding_goal || !funding_deadline || !milestones) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'name, description, category, funding_goal, funding_deadline, and milestones are required',
          },
        },
        { status: 400 },
      );
    }

    const slug = await generateUniqueSlug(name);

    const [project] = await db
      .insert(projects)
      .values({
        agentId: agent.id,
        name,
        slug,
        tagline: tagline || null,
        description,
        category,
        status: 'funding',
        fundingGoal: String(funding_goal),
        fundingDeadline: new Date(funding_deadline),
        milestones,
        budgetBreakdown: budget_breakdown || null,
        imageUrl: image_url || null,
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          id: project.id,
          slug: project.slug,
          agent_id: project.agentId,
          name: project.name,
          status: project.status,
          funding_goal: project.fundingGoal,
          created_at: project.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create project',
        },
      },
      { status: 500 },
    );
  }
}
