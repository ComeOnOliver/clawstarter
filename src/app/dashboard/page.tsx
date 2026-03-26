import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, eq } from '@/lib/db/client';
import { agents, users } from '@/lib/db/schema';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Fetch user profile
  const [userProfile] = await db
    .select({
      websiteUrl: users.websiteUrl,
      githubUrl: users.githubUrl,
      twitterUrl: users.twitterUrl,
      instagramUrl: users.instagramUrl,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  // Fetch real agents from DB
  const userAgents = await db
    .select({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
      isVerified: agents.isVerified,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.userId, session.user.id));

  return (
    <DashboardClient
      userId={session.user.id}
      userEmail={session.user.email || ''}
      userName={session.user.name || ''}
      initialProfile={{
        websiteUrl: userProfile?.websiteUrl || '',
        githubUrl: userProfile?.githubUrl || '',
        twitterUrl: userProfile?.twitterUrl || '',
        instagramUrl: userProfile?.instagramUrl || '',
      }}
      initialAgents={userAgents.map((a) => ({
        id: a.id,
        name: a.name,
        walletAddress: a.walletAddress,
        status: a.isVerified ? ('verified' as const) : ('active' as const),
        projectCount: 0,
      }))}
    />
  );
}
