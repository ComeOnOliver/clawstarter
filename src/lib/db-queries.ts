import { db, eq, sql, and, or, desc, asc, ilike } from '@/lib/db/client';
import { projects, agents, users, comments, rewards } from '@/lib/db/schema';
import type { ProjectCardData } from '@/components/project-card';

export async function getPlatformStats() {
  const [[funded], [raised], [agentCount], [userCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(projects)
      .where(or(eq(projects.status, 'active'), eq(projects.status, 'completed'))),
    db.select({ total: sql<string>`coalesce(sum(funded_amount), 0)` }).from(projects),
    db.select({ count: sql<number>`count(*)::int` }).from(agents),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
  ]);

  const totalRaised = parseFloat(raised?.total || '0');
  const formatted = totalRaised >= 1_000_000
    ? `$${(totalRaised / 1_000_000).toFixed(1)}M`
    : totalRaised >= 1_000
      ? `$${(totalRaised / 1_000).toFixed(0)}K`
      : `$${totalRaised.toFixed(0)}`;

  return {
    projectsFunded: funded?.count || 0,
    totalRaised: formatted,
    activeAgents: agentCount?.count || 0,
    humanBackers: userCount?.count || 0,
  };
}

export async function getCategoryCounts(): Promise<{ name: string; count: number }[]> {
  const rows = await db
    .select({
      category: projects.category,
      count: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(
      or(
        eq(projects.status, 'funding'),
        eq(projects.status, 'active'),
        eq(projects.status, 'completed'),
      ),
    )
    .groupBy(projects.category);

  return rows.map((r) => ({ name: r.category, count: r.count }));
}

export async function getFeaturedProjects(limit = 6): Promise<ProjectCardData[]> {
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      tagline: projects.tagline,
      category: projects.category,
      status: projects.status,
      fundingGoal: projects.fundingGoal,
      fundedAmount: projects.fundedAmount,
      fundingDeadline: projects.fundingDeadline,
      agentId: projects.agentId,
      imageUrl: projects.imageUrl,
      agentName: agents.name,
      agentImageUrl: agents.imageUrl,
    })
    .from(projects)
    .leftJoin(agents, eq(projects.agentId, agents.id))
    .where(eq(projects.status, 'funding'))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline || '',
    category: r.category,
    status: r.status,
    fundingGoal: parseFloat(r.fundingGoal),
    fundedAmount: parseFloat(r.fundedAmount),
    fundingDeadline: r.fundingDeadline.toISOString(),
    agentId: r.agentId,
    agentName: r.agentName || 'Unknown Agent',
    agentImageUrl: r.agentImageUrl || undefined,
    imageUrl: r.imageUrl || undefined,
  }));
}

export async function getProjects(): Promise<ProjectCardData[]> {
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      tagline: projects.tagline,
      category: projects.category,
      status: projects.status,
      fundingGoal: projects.fundingGoal,
      fundedAmount: projects.fundedAmount,
      fundingDeadline: projects.fundingDeadline,
      agentId: projects.agentId,
      imageUrl: projects.imageUrl,
      agentName: agents.name,
      agentImageUrl: agents.imageUrl,
    })
    .from(projects)
    .leftJoin(agents, eq(projects.agentId, agents.id))
    .where(
      or(
        eq(projects.status, 'funding'),
        eq(projects.status, 'active'),
        eq(projects.status, 'completed'),
      ),
    )
    .orderBy(desc(projects.createdAt));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline || '',
    category: r.category,
    status: r.status,
    fundingGoal: parseFloat(r.fundingGoal),
    fundedAmount: parseFloat(r.fundedAmount),
    fundingDeadline: r.fundingDeadline.toISOString(),
    agentId: r.agentId,
    agentName: r.agentName || 'Unknown Agent',
    agentImageUrl: r.agentImageUrl || undefined,
    imageUrl: r.imageUrl || undefined,
  }));
}

export async function getProjectBySlug(slugOrId: string) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let project: (typeof projects.$inferSelect) | undefined;

  // Try UUID lookup first if it looks like a UUID, otherwise slug
  if (UUID_RE.test(slugOrId)) {
    [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, slugOrId))
      .limit(1);
  }

  if (!project) {
    [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slugOrId))
      .limit(1);
  }

  if (!project) return null;

  const [agent] = await db
    .select({
      name: agents.name,
      bio: agents.bio,
      imageUrl: agents.imageUrl,
      githubUrl: agents.githubUrl,
      twitterHandle: agents.twitterHandle,
      userId: agents.userId,
    })
    .from(agents)
    .where(eq(agents.id, project.agentId))
    .limit(1);

  // Fetch human owner info if agent has a userId
  let owner: { name: string | null; email: string; image: string | null; websiteUrl: string | null; githubUrl: string | null; twitterUrl: string | null } | null = null;
  if (agent?.userId) {
    const [ownerRow] = await db
      .select({
        name: users.name,
        email: users.email,
        image: users.image,
        websiteUrl: users.websiteUrl,
        githubUrl: users.githubUrl,
        twitterUrl: users.twitterUrl,
      })
      .from(users)
      .where(eq(users.id, agent.userId))
      .limit(1);
    owner = ownerRow || null;
  }

  const projectComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorAgentId: comments.authorAgentId,
      authorUserId: comments.authorUserId,
      agentName: agents.name,
      agentImageUrl: agents.imageUrl,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .leftJoin(agents, eq(comments.authorAgentId, agents.id))
    .leftJoin(users, eq(comments.authorUserId, users.id))
    .where(eq(comments.projectId, project.id))
    .orderBy(asc(comments.createdAt));

  return {
    ...project,
    slug: project.slug,
    fundingGoal: parseFloat(project.fundingGoal),
    fundedAmount: parseFloat(project.fundedAmount),
    pledgedAmount: parseFloat(project.pledgedAmount),
    fundingDeadline: project.fundingDeadline.toISOString(),
    agentName: agent?.name || 'Unknown Agent',
    agentBio: agent?.bio || '',
    agentImageUrl: agent?.imageUrl || null,
    agentGithub: agent?.githubUrl || null,
    agentTwitter: agent?.twitterHandle ? `@${agent.twitterHandle}` : null,
    ownerName: owner?.name || null,
    ownerImage: owner?.image || null,
    ownerWebsite: owner?.websiteUrl || null,
    ownerGithub: owner?.githubUrl || null,
    ownerTwitter: owner?.twitterUrl || null,
    comments: projectComments.map((c) => ({
      id: c.id,
      author: c.agentName || c.userName || 'Unknown',
      authorType: (c.authorAgentId === project.agentId ? 'owner' : c.authorAgentId ? 'agent' : 'human') as 'owner' | 'agent' | 'human',
      authorImage: c.authorAgentId ? c.agentImageUrl : c.userImage,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function getProjectRewards(projectId: string) {
  const rows = await db
    .select()
    .from(rewards)
    .where(eq(rewards.projectId, projectId))
    .orderBy(asc(rewards.sortOrder), asc(rewards.amount));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    amount: parseFloat(r.amount),
    quantityLimit: r.quantityLimit,
    quantityClaimed: r.quantityClaimed,
    estimatedDelivery: r.estimatedDelivery,
    items: (r.items as string[]) || [],
    isEarlyBird: r.isEarlyBird,
  }));
}
