import { NextRequest, NextResponse } from 'next/server';
import { db, eq, asc } from '@/lib/db/client';
import { rewards, projects } from '@/lib/db/schema';
import { authenticateAgent } from '@/lib/agent-auth';

/**
 * GET /api/v1/projects/[id]/rewards — List rewards for a project (public)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  // Verify project exists
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 },
    );
  }

  const rows = await db
    .select()
    .from(rewards)
    .where(eq(rewards.projectId, projectId))
    .orderBy(asc(rewards.sortOrder), asc(rewards.amount));

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      project_id: r.projectId,
      title: r.title,
      description: r.description,
      amount: r.amount,
      quantity_limit: r.quantityLimit,
      quantity_claimed: r.quantityClaimed,
      estimated_delivery: r.estimatedDelivery,
      items: r.items,
      is_early_bird: r.isEarlyBird,
      sort_order: r.sortOrder,
      sold_out: r.quantityLimit !== null && r.quantityClaimed >= r.quantityLimit,
      created_at: r.createdAt,
    })),
  });
}

/**
 * POST /api/v1/projects/[id]/rewards — Create rewards (agent auth required)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Agent API key required' } },
      { status: 401 },
    );
  }

  const { id: projectId } = await params;

  // Verify project exists and agent owns it
  const [project] = await db
    .select({ id: projects.id, agentId: projects.agentId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 },
    );
  }

  if (project.agentId !== agent.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You can only add rewards to your own projects' } },
      { status: 403 },
    );
  }

  let body: { rewards?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const rewardsInput = body.rewards;
  if (!Array.isArray(rewardsInput) || rewardsInput.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'rewards array is required and must not be empty' } },
      { status: 400 },
    );
  }

  // Validate each reward
  const toInsert: {
    projectId: string;
    title: string;
    description: string;
    amount: string;
    quantityLimit: number | null;
    estimatedDelivery: string | null;
    items: string[];
    isEarlyBird: boolean;
    sortOrder: number;
  }[] = [];

  for (let i = 0; i < rewardsInput.length; i++) {
    const r = rewardsInput[i] as Record<string, unknown>;
    if (!r.title || typeof r.title !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `rewards[${i}].title is required` } },
        { status: 400 },
      );
    }
    if (!r.description || typeof r.description !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `rewards[${i}].description is required` } },
        { status: 400 },
      );
    }
    const amount = Number(r.amount);
    if (!r.amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `rewards[${i}].amount must be a positive number` } },
        { status: 400 },
      );
    }

    toInsert.push({
      projectId,
      title: r.title,
      description: r.description,
      amount: String(amount),
      quantityLimit: typeof r.quantity_limit === 'number' ? r.quantity_limit : null,
      estimatedDelivery: typeof r.estimated_delivery === 'string' ? r.estimated_delivery : null,
      items: Array.isArray(r.items) ? r.items.filter((x): x is string => typeof x === 'string') : [],
      isEarlyBird: r.is_early_bird === true,
      sortOrder: typeof r.sort_order === 'number' ? r.sort_order : i,
    });
  }

  const created = await db.insert(rewards).values(toInsert).returning();

  return NextResponse.json(
    {
      data: created.map((r) => ({
        id: r.id,
        project_id: r.projectId,
        title: r.title,
        description: r.description,
        amount: r.amount,
        quantity_limit: r.quantityLimit,
        quantity_claimed: r.quantityClaimed,
        estimated_delivery: r.estimatedDelivery,
        items: r.items,
        is_early_bird: r.isEarlyBird,
        sort_order: r.sortOrder,
        created_at: r.createdAt,
      })),
    },
    { status: 201 },
  );
}
