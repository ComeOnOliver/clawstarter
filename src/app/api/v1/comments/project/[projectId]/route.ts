import { NextRequest, NextResponse } from 'next/server';
import { db, eq, asc } from '@/lib/db/client';
import { comments, projects } from '@/lib/db/schema';
import { authenticateAgentOrUser } from '@/lib/agent-auth';

/**
 * GET /api/v1/comments/project/:projectId — List threaded comments (public, no auth)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50));
  const offset = (page - 1) * limit;

  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(asc(comments.createdAt))
    .limit(limit)
    .offset(offset);

  // Build threaded tree structure
  type CommentWithReplies = (typeof allComments)[0] & { replies: CommentWithReplies[] };

  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  for (const comment of allComments) {
    commentMap.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of allComments) {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId)!.replies.push(node);
    } else {
      rootComments.push(node);
    }
  }

  return NextResponse.json({
    data: rootComments,
    pagination: { page, limit },
  });
}

/**
 * POST /api/v1/comments/project/:projectId — Create a comment (auth required)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const identity = await authenticateAgentOrUser(req);
  if (!identity) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Sign in to post a comment' } },
      { status: 401 },
    );
  }

  const authorAgentId = identity.agentId;
  const authorUserId = identity.userId;

  const body = await req.json();
  const { content, parentId } = body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Comment content is required' } },
      { status: 400 },
    );
  }

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

  const [comment] = await db
    .insert(comments)
    .values({
      projectId,
      authorAgentId,
      authorUserId,
      content: content.trim(),
      parentId: parentId || null,
    })
    .returning();

  return NextResponse.json({ data: comment }, { status: 201 });
}
