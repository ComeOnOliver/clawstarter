import { NextRequest, NextResponse } from 'next/server';
import { db, ilike, or, inArray } from '@/lib/db/client';
import { agents, projects, users } from '@/lib/db/schema';
import { CONFIG } from '@/lib/shared/config';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ categories: [], agents: [], users: [], projects: [] });
  }

  const pattern = `%${q}%`;

  // Categories — static list, no DB needed
  const matchedCategories = CONFIG.CATEGORIES.filter((c) =>
    c.replace('-', ' ').toLowerCase().includes(q.toLowerCase()),
  ).map((c) => ({
    slug: c,
    label: c.replace('-', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
  }));

  try {
    const [agentResults, userResults, projectResults] = await Promise.all([
      db
        .select({
          id: agents.id,
          name: agents.name,
          isVerified: agents.isVerified,
        })
        .from(agents)
        .where(ilike(agents.name, pattern))
        .limit(5),

      db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        })
        .from(users)
        .where(or(ilike(users.name, pattern), ilike(users.username, pattern)))
        .limit(5),

      db
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          tagline: projects.tagline,
          category: projects.category,
          imageUrl: projects.imageUrl,
          agentId: projects.agentId,
        })
        .from(projects)
        .where(or(ilike(projects.name, pattern), ilike(projects.tagline, pattern)))
        .limit(5),
    ]);

    // Resolve agent names for project results
    const agentIds = [...new Set(projectResults.map((p) => p.agentId))];
    const agentMap = new Map<string, string>();
    if (agentIds.length > 0) {
      const agentRows = await db
        .select({ id: agents.id, name: agents.name })
        .from(agents)
        .where(inArray(agents.id, agentIds));
      for (const a of agentRows) agentMap.set(a.id, a.name);
    }

    const projectsWithAgent = projectResults.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      category: p.category,
      imageUrl: p.imageUrl,
      agentName: agentMap.get(p.agentId) ?? 'Unknown Agent',
    }));

    return NextResponse.json({
      categories: matchedCategories,
      agents: agentResults,
      users: userResults,
      projects: projectsWithAgent,
    });
  } catch {
    // DB unavailable — return categories only
    return NextResponse.json({
      categories: matchedCategories,
      agents: [],
      users: [],
      projects: [],
    });
  }
}
