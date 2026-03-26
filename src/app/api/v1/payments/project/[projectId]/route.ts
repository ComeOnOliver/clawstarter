import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/lib/db/client';
import { payments, projects } from '@/lib/db/schema';

/**
 * GET /api/v1/payments/project/[projectId] — List payments for a project (public)
 * Supports pagination via ?page= and ?limit= query params.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(projectId)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID format' } },
      { status: 400 },
    );
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50),
  );
  const offset = (page - 1) * limit;

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

  const paymentList = await db
    .select()
    .from(payments)
    .where(eq(payments.projectId, projectId))
    .orderBy(payments.createdAt)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    data: paymentList,
    pagination: { page, limit },
  });
}
